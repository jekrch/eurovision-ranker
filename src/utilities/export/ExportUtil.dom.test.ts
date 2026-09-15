// @vitest-environment jsdom
import { EXPORT_TYPE, getExportType } from './ExportType';
import {
  convertDataToText,
  convertToCSV,
  copyDataToClipboard,
  copyToClipboard,
  copyUrlToClipboard,
  downloadFile,
  getExportDataString,
} from './ExportUtil';
import { Contestant } from '../../data/Contestant';
import { CountryContestant } from '../../data/CountryContestant';

const toastSuccess = vi.hoisted(() => vi.fn());
vi.mock('react-hot-toast', () => ({
  default: { success: toastSuccess, error: vi.fn() },
}));

const loggerError = vi.hoisted(() => vi.fn());
vi.mock('../logger', () => ({
  logger: { error: loggerError, warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

function countryContestant(
  name: string,
  votes?: { totalPoints?: number; telePoints?: number; juryPoints?: number },
): CountryContestant {
  return {
    id: name,
    country: { id: name, name, key: name.slice(0, 2), icon: '' },
    contestant: {
      countryKey: name.slice(0, 2),
      artist: `${name} artist`,
      song: `${name} song`,
      youtube: '',
      votes,
    } as Contestant,
  } as CountryContestant;
}

const writeText = vi.fn();

beforeEach(() => {
  toastSuccess.mockReset();
  loggerError.mockReset();
  writeText.mockReset().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
});

describe('convertToCSV', () => {
  it('lists each contestant in ranked order', () => {
    const csv = convertToCSV([countryContestant('alpha'), countryContestant('beta')]);
    const [header, ...rows] = csv.trim().split('\n');

    expect(header).toContain('rank');
    expect(rows[0]).toContain('1,alpha');
    expect(rows[1]).toContain('2,beta');
  });

  it('reports the jury and televote columns when those points exist', () => {
    const csv = convertToCSV([
      countryContestant('alpha', { juryPoints: 10, telePoints: 5, totalPoints: 15 }),
    ]);

    expect(csv).toContain('juryVotes');
    expect(csv).toContain('teleVotes');
    expect(csv.trim().split('\n')[1]).toContain('10,5,15');
  });

  it('leaves out the split vote columns when no entry has those points', () => {
    const csv = convertToCSV([countryContestant('alpha', { totalPoints: 15 })]);

    expect(csv).not.toContain('juryVotes');
    expect(csv).not.toContain('teleVotes');
    expect(csv).toContain('totalVotes');
  });

  it('reports no points for a contestant that was not scored', () => {
    const csv = convertToCSV([countryContestant('alpha')]);

    expect(csv.trim().split('\n')[1]).toMatch(/,0$/);
  });
});

describe('convertDataToText', () => {
  it('numbers each contestant with its artist and song', () => {
    const text = convertDataToText([countryContestant('alpha'), countryContestant('beta')]);

    expect(text).toBe('1. alpha: alpha artist "alpha song"\n2. beta: beta artist "beta song"');
  });

  it('produces nothing for an empty ranking', () => {
    expect(convertDataToText([])).toBe('');
  });
});

describe('getExportDataString', () => {
  it('produces comma separated rows for a spreadsheet export', async () => {
    const result = await getExportDataString(EXPORT_TYPE.EXCEL, [countryContestant('alpha')]);

    expect(result).toContain('rank,countryName');
  });

  it('produces json for a json export', async () => {
    const result = await getExportDataString(EXPORT_TYPE.JSON, [countryContestant('alpha')]);

    expect(JSON.parse(result)[0]).toMatchObject({ rank: '1', countryName: 'alpha' });
  });

  it('produces a numbered list for a text export', async () => {
    const result = await getExportDataString(EXPORT_TYPE.TEXT, [countryContestant('alpha')]);

    expect(result).toBe('1. alpha: alpha artist "alpha song"');
  });

  it('falls back to a numbered list for an unrecognised export', async () => {
    const result = await getExportDataString('something else', [countryContestant('alpha')]);

    expect(result).toBe('1. alpha: alpha artist "alpha song"');
  });
});

describe('copyDataToClipboard', () => {
  it('puts the given text on the clipboard', async () => {
    await copyDataToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('reports a clipboard the browser refused rather than failing the copy', async () => {
    writeText.mockRejectedValue(new Error('denied'));

    await expect(copyDataToClipboard('hello')).resolves.toBeUndefined();
    expect(loggerError).toHaveBeenCalled();
  });
});

describe('copyToClipboard', () => {
  it('copies the ranking in the chosen format and confirms it', async () => {
    await copyToClipboard([countryContestant('alpha')], EXPORT_TYPE.TEXT);

    expect(writeText).toHaveBeenCalledWith('1. alpha: alpha artist "alpha song"');
    expect(toastSuccess).toHaveBeenCalledWith('Copied to clipboard');
  });
});

describe('copyUrlToClipboard', () => {
  it('copies the address of the ranking on screen', async () => {
    await copyUrlToClipboard();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
    expect(toastSuccess).toHaveBeenCalledWith('Copied to clipboard');
  });
});

describe('downloadFile', () => {
  it('hands the browser a named file and releases it afterwards', () => {
    const createObjectURL = vi.fn().mockReturnValue('blob:ranking');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    downloadFile('a,b,c', 'csv');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:ranking');
    expect(document.querySelector('a')).toBeNull();

    click.mockRestore();
    vi.unstubAllGlobals();
  });
});

describe('getExportType', () => {
  it.each([
    [EXPORT_TYPE.CSV, 'csv'],
    [EXPORT_TYPE.JSON, 'json'],
    [EXPORT_TYPE.TEXT, 'txt'],
    [EXPORT_TYPE.EXCEL, 'xls'],
  ])('gives %s the %s file extension', (name, extension) => {
    expect(getExportType(name)).toEqual({ name, fileExtension: extension });
  });

  it('has no export type for an unrecognised name', () => {
    expect(getExportType('Pdf')).toBeUndefined();
  });
});
