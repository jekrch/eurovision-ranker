// @vitest-environment jsdom
import { render } from '@testing-library/react';
import React from 'react';

import SongLyricsTab from './SongLyricsTab';

function renderLyrics(lyrics: string) {
  return render(
    <SongLyricsTab
      composers=""
      lyricists=""
      hasLyrics
      lyrics={lyrics}
      engLyrics={undefined}
      showEng={false}
      showEngLyrics={false}
      updateShowEngLyrics={() => {}}
    />,
  );
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
});
