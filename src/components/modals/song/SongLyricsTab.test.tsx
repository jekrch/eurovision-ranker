// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

import SongLyricsTab from './SongLyricsTab';

vi.mock('../../LazyFlag', () => ({
  LazyLoadedFlag: ({ code }: { code: string }) => <span data-testid={`flag-${code}`} />,
}));

type Props = React.ComponentProps<typeof SongLyricsTab>;

function renderTab(overrides: Partial<Props> = {}) {
  const props: Props = {
    composers: '',
    lyricists: '',
    hasLyrics: true,
    lyrics: undefined,
    engLyrics: undefined,
    showEng: false,
    showEngLyrics: false,
    updateShowEngLyrics: () => {},
    ...overrides,
  };
  return render(<SongLyricsTab {...props} />);
}

function renderLyrics(lyrics: string) {
  return renderTab({ lyrics });
}

function containers(container: HTMLElement) {
  const [original, english] = [...container.querySelectorAll('.lyrics-container')];
  return { original: original!, english: english! };
}

describe('SongLyricsTab', () => {
  it('shows each lyric line on its own row', () => {
    const { container } = renderLyrics('first line\\nsecond line');
    const rows = [...container.querySelectorAll('.lyrics-container')[0]!.children];

    expect(rows.map((row) => row.textContent)).toEqual(['first line', 'second line']);
  });

  it('keeps a visible gap between verses', () => {
    const { container } = renderLyrics('end of verse\\n\\nstart of chorus');
    const rows = [...container.querySelectorAll('.lyrics-container')[0]!.children];

    // A whitespace-only row collapses to nothing, so the gap needs a
    // non-breaking space to hold a line's height.
    expect(rows.map((row) => row.textContent)).toEqual([
      'end of verse',
      ' ',
      'start of chorus',
    ]);
  });

  it('lists multiple composers and lyricists separated by commas', () => {
    renderTab({ composers: 'Anna;Bo', lyricists: 'Cy;Di;Ed' });

    expect(screen.getByText('Composer(s):')).toBeTruthy();
    expect(screen.getByText('Anna, Bo')).toBeTruthy();
    expect(screen.getByText('Lyricist(s):')).toBeTruthy();
    expect(screen.getByText('Cy, Di, Ed')).toBeTruthy();
  });

  it('omits credits that are unknown', () => {
    renderTab({ composers: '', lyricists: undefined as unknown as string });

    expect(screen.queryByText('Composer(s):')).toBeNull();
    expect(screen.queryByText('Lyricist(s):')).toBeNull();
  });

  it('says so when a song has no lyrics', () => {
    renderTab({ hasLyrics: false });

    expect(screen.getByText('Lyrics not available')).toBeTruthy();
    expect(screen.queryByText('Lyrics')).toBeNull();
  });

  it('offers no translation toggle without English lyrics', () => {
    renderTab({ lyrics: 'hej' });

    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  it('offers a translation toggle when English lyrics exist', () => {
    const updateShowEngLyrics = vi.fn();
    renderTab({ lyrics: 'hej', engLyrics: 'hello', updateShowEngLyrics });

    const toggle = screen.getByRole('checkbox') as HTMLInputElement;
    expect(toggle.checked).toBe(false);
    expect(screen.getByTestId('flag-gb')).toBeTruthy();

    fireEvent.click(toggle);

    expect(updateShowEngLyrics).toHaveBeenCalledWith(true);
  });

  it('shows the original lyrics while the translation is hidden', () => {
    const { container } = renderTab({ lyrics: 'hej', engLyrics: 'hello' });
    const { original, english } = containers(container);

    expect(original.className).toContain('slide-in-right');
    expect(english.className).toContain('slide-out-left');
    expect(english.textContent).toBe('hello');
  });

  it('slides the translation in when it is shown', () => {
    const { container } = renderTab({
      lyrics: 'hej',
      engLyrics: 'hello',
      showEng: true,
      showEngLyrics: true,
    });
    const { original, english } = containers(container);

    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    expect(original.className).toContain('slide-out-left');
    expect(english.className).toContain('slide-in-right');
  });

  it('leaves the original panel in place when there are no original lyrics', () => {
    const { container } = renderTab({ lyrics: '', engLyrics: 'hello', showEng: true });
    const { original } = containers(container);

    expect(original.className).toContain('slide-in-right');
  });
});
