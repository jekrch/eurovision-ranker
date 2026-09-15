export {};

/** The logger decides what to suppress when it is first loaded. */
async function loadLogger(isDev: boolean) {
  vi.resetModules();
  vi.stubEnv('DEV', isDev);
  return (await import('./logger')).logger;
}

const spies = {
  log: vi.spyOn(console, 'log'),
  debug: vi.spyOn(console, 'debug'),
  info: vi.spyOn(console, 'info'),
  warn: vi.spyOn(console, 'warn'),
  error: vi.spyOn(console, 'error'),
};

beforeEach(() => {
  Object.values(spies).forEach((spy) => spy.mockReset().mockImplementation(() => {}));
});

afterEach(() => {
  vi.unstubAllEnvs();
});

afterAll(() => {
  Object.values(spies).forEach((spy) => spy.mockRestore());
});

describe('while developing', () => {
  it.each(['log', 'debug', 'info'] as const)('passes %s output through', async (level) => {
    const logger = await loadLogger(true);

    logger[level]('a message', 42);

    expect(spies[level]).toHaveBeenCalledWith('a message', 42);
  });
});

describe('in a shipped build', () => {
  it.each(['log', 'debug', 'info'] as const)('keeps %s output quiet', async (level) => {
    const logger = await loadLogger(false);

    logger[level]('a message');

    expect(spies[level]).not.toHaveBeenCalled();
  });

  it.each(['warn', 'error'] as const)('still surfaces %s output', async (level) => {
    const logger = await loadLogger(false);

    logger[level]('a problem');

    expect(spies[level]).toHaveBeenCalledWith('a problem');
  });
});
