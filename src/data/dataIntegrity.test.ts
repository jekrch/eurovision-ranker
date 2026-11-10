import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import Papa from 'papaparse';

import { asiaOnlyCountries, countries, escCountries } from './Countries';
import { convertRankingsStrToArray } from '../utilities/UrlUtil';

const root = join(__dirname, '..', '..');

function readCsv(file: string): Record<string, string>[] {
  const text = readFileSync(join(root, 'public', file), 'utf-8');
  const result = Papa.parse(text, { header: true, skipEmptyLines: true }) as {
    data: Record<string, string>[];
  };
  return result.data;
}

const duplicates = (values: string[]) =>
  values.filter((value, index) => values.indexOf(value) !== index);

describe('countries', () => {
  it('gives every country a unique id', () => {
    expect(duplicates(countries.map((c) => c.id))).toEqual([]);
  });

  it('gives every country a unique key', () => {
    expect(duplicates(countries.map((c) => c.key))).toEqual([]);
  });

  it('gives every country a unique name', () => {
    expect(duplicates(countries.map((c) => c.name))).toEqual([]);
  });

  it('ships a flag for every country', () => {
    const flags = readdirSync(join(root, 'src', 'assets', 'flags')).map((f) =>
      f.replace(/\.svg$/, ''),
    );
    expect(countries.map((c) => c.key).filter((key) => !flags.includes(key))).toEqual([]);
  });

  it('decodes a ranking of every country back to the same countries', () => {
    const ids = countries.map((c) => c.id);
    expect(convertRankingsStrToArray(ids.join(''))).toEqual(ids);
  });

  it('keeps the countries of the traditional contest separate from the Asia-only ones', () => {
    const escKeys = escCountries.map((c) => c.key);
    expect(asiaOnlyCountries.filter((c) => escKeys.includes(c.key))).toEqual([]);
  });
});

describe('contestant files', () => {
  const main = readCsv('main.csv');
  const mainCurrent = readCsv('mainCurrent.csv');
  const asia = readCsv('asia.csv');

  it('gives every song a uid no other file uses', () => {
    const uids = [...main, ...mainCurrent, ...asia].map((row) => row.id!);
    expect(duplicates(uids)).toEqual([]);
  });

  it('keeps Asia entries out of the traditional contest files', () => {
    const asiaUids = new Set(asia.map((row) => row.id));
    expect([...main, ...mainCurrent].filter((row) => asiaUids.has(row.id))).toEqual([]);
  });

  it('matches every Asia entry to a known country', () => {
    const keys = countries.map((c) => c.key);
    expect(asia.map((row) => row.to_country_id).filter((key) => !keys.includes(key!))).toEqual(
      [],
    );
  });

  it('uses the same columns for Asia as for the traditional contest', () => {
    const header = (file: string) =>
      readFileSync(join(root, 'public', file), 'utf-8').split('\n')[0]!.trim();
    expect(header('asia.csv')).toBe(header('main.csv'));
  });
});

describe('lyrics files', () => {
  const asia = readCsv('asia.csv');
  const asiaLyrics = readCsv('lyricsAsia.csv');

  it('uses the same columns for Asia as for the traditional contest', () => {
    const header = (file: string) =>
      readFileSync(join(root, 'public', file), 'utf-8').split('\n')[0]!.trim();
    expect(header('lyricsAsia.csv')).toBe(header('lyrics.csv'));
  });

  it('only holds Asia lyrics for Asia entries', () => {
    const asiaUids = asia.map((row) => row.id);
    expect(asiaLyrics.filter((row) => !asiaUids.includes(row.id))).toEqual([]);
  });

  it('holds at most one lyrics row per Asia entry', () => {
    expect(duplicates(asiaLyrics.map((row) => row.id!))).toEqual([]);
  });
});
