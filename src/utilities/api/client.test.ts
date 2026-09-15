// @vitest-environment jsdom
export {};

const toastError = vi.hoisted(() => vi.fn());
vi.mock('react-hot-toast', () => ({
  default: { error: toastError },
}));

/**
 * The client caches nothing itself, but it does hold the registered
 * unauthorized handler at module scope, so each test gets a fresh module.
 */
async function loadClient() {
  vi.resetModules();
  return import('./client');
}

function respondWith(status: number, body: string, init: { statusText?: string } = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: init.statusText ?? '',
    text: async () => body,
  } as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset().mockResolvedValue(respondWith(200, ''));
  vi.stubGlobal('fetch', fetchMock);
  toastError.mockReset();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('token storage', () => {
  it('round trips a stored token', async () => {
    const { setToken, getToken } = await loadClient();

    setToken('abc123');

    expect(getToken()).toBe('abc123');
  });

  it('clears the stored token when set to nothing', async () => {
    const { setToken, getToken } = await loadClient();
    setToken('abc123');

    setToken(null);

    expect(getToken()).toBeNull();
  });

  it('reports no token when storage is unavailable', async () => {
    const { getToken } = await loadClient();
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(getToken()).toBeNull();

    getItem.mockRestore();
  });

  it('survives storage rejecting a write', async () => {
    const { setToken } = await loadClient();
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });

    expect(() => setToken('abc123')).not.toThrow();

    setItem.mockRestore();
  });
});

describe('request', () => {
  it('sends the stored token on authenticated calls', async () => {
    const { request, setToken } = await loadClient();
    setToken('abc123');

    await request({ path: '/rankings' });

    expect(fetchMock.mock.calls[0]![1].headers).toMatchObject({
      Authorization: 'Bearer abc123',
    });
  });

  it('omits the token when a call opts out of authentication', async () => {
    const { request, setToken } = await loadClient();
    setToken('abc123');

    await request({ path: '/login', auth: false });

    expect(fetchMock.mock.calls[0]![1].headers).not.toHaveProperty('Authorization');
  });

  it('sends no authorization header when no token is stored', async () => {
    const { request } = await loadClient();

    await request({ path: '/rankings' });

    expect(fetchMock.mock.calls[0]![1].headers).not.toHaveProperty('Authorization');
  });

  it('serializes a body as json and declares the content type', async () => {
    const { request } = await loadClient();

    await request({ method: 'POST', path: '/rankings', body: { name: 'mine' } });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"name":"mine"}');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
  });

  it('sends no body or content type when there is nothing to send', async () => {
    const { request } = await loadClient();

    await request({ path: '/rankings' });

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.body).toBeUndefined();
    expect(init.headers).not.toHaveProperty('Content-Type');
  });

  it('joins a path that omits its leading slash', async () => {
    const { request, getApiBaseUrl } = await loadClient();

    await request({ path: 'rankings' });

    expect(fetchMock.mock.calls[0]![0]).toBe(`${getApiBaseUrl()}/rankings`);
  });

  it('parses a json response body', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(200, '{"id":7}'));

    await expect(request<{ id: number }>({ path: '/rankings' })).resolves.toEqual({ id: 7 });
  });

  it('returns the raw text when a successful response is not json', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(200, 'plain text'));

    await expect(request({ path: '/rankings' })).resolves.toBe('plain text');
  });

  it('resolves with nothing for an empty response', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(204, ''));

    await expect(request({ path: '/rankings' })).resolves.toBeUndefined();
  });

  it('reports a failed connection as a network error', async () => {
    const { request } = await loadClient();
    fetchMock.mockRejectedValue(new Error('connection refused'));

    await expect(request({ path: '/rankings' })).rejects.toMatchObject({
      kind: 'network',
      status: 0,
      message: 'connection refused',
    });
  });

  it('reports a non error rejection as a network error', async () => {
    const { request } = await loadClient();
    fetchMock.mockRejectedValue('boom');

    await expect(request({ path: '/rankings' })).rejects.toMatchObject({
      kind: 'network',
      message: 'Network error',
    });
  });

  it.each([
    [401, '', 'unauthorized'],
    [403, '', 'forbidden'],
    [404, '', 'not_found'],
    [410, '', 'gone'],
    [429, '', 'rate_limited'],
    [400, 'Maximum number of rankings reached', 'max_rankings'],
    [400, 'bad input', 'bad_request'],
    [422, '', 'bad_request'],
    [500, '', 'server'],
    [503, '', 'server'],
  ])('describes a %i response as %s', async (status, body, kind) => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(status, body));

    await expect(request({ path: '/rankings' })).rejects.toMatchObject({ status, kind });
  });

  it('raises an api error carrying the response body', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(400, 'bad input'));

    const error = await request({ path: '/rankings' }).catch((e) => e);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({
      name: 'ApiError',
      status: 400,
      kind: 'bad_request',
      body: 'bad input',
      message: 'bad input',
    });
  });

  it('falls back to the status text when the error response has no body', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(500, '', { statusText: 'Internal Server Error' }));

    await expect(request({ path: '/rankings' })).rejects.toMatchObject({
      message: 'Internal Server Error',
    });
  });

  it('discards the stored token when the server rejects it', async () => {
    const { request, setToken, getToken } = await loadClient();
    setToken('abc123');
    fetchMock.mockResolvedValue(respondWith(401, ''));

    await expect(request({ path: '/rankings' })).rejects.toThrow();

    expect(getToken()).toBeNull();
  });

  it('notifies the registered handler when the server rejects the token', async () => {
    const { request, registerUnauthorizedHandler } = await loadClient();
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);
    fetchMock.mockResolvedValue(respondWith(401, ''));

    await expect(request({ path: '/rankings' })).rejects.toThrow();

    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('stops notifying a handler once it is unregistered', async () => {
    const { request, registerUnauthorizedHandler } = await loadClient();
    const handler = vi.fn();
    registerUnauthorizedHandler(handler);
    registerUnauthorizedHandler(null);
    fetchMock.mockResolvedValue(respondWith(401, ''));

    await expect(request({ path: '/rankings' })).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('explains the wait to someone throttled while signing in', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(429, ''));

    await expect(request({ path: '/login', isAuthEndpoint: true })).rejects.toThrow();

    expect(toastError).toHaveBeenCalledWith(
      'Too many login/register attempts — try again in a minute.',
    );
  });

  it('stays quiet when a throttled call is not a sign in attempt', async () => {
    const { request } = await loadClient();
    fetchMock.mockResolvedValue(respondWith(429, ''));

    await expect(request({ path: '/rankings' })).rejects.toThrow();

    expect(toastError).not.toHaveBeenCalled();
  });
});

describe('getApiBaseUrl', () => {
  it('serves requests from an origin without a trailing slash', async () => {
    const { getApiBaseUrl } = await loadClient();

    expect(getApiBaseUrl()).not.toMatch(/\/$/);
  });
});
