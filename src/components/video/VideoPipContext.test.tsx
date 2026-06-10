// @vitest-environment jsdom
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { VideoPipProvider, VideoDock, useVideoPip } from './VideoPipContext';
import { CountryContestant } from '../../data/CountryContestant';

// the provider reads rankedItems from the store; we don't need it here
vi.mock('../../hooks/stateHooks', () => ({
  useAppSelector: () => [],
}));

const VIDEO_ID = 'ABC12345678';

const fakeCC = {
  id: 'fake',
  uid: 'fake-uid',
  country: { id: 'se', key: 'se', name: 'Sweden' },
  contestant: {
    id: 'fake',
    countryKey: 'se',
    artist: 'Artist',
    song: 'Song',
    youtube: `https://youtu.be/${VIDEO_ID}`,
  },
} as unknown as CountryContestant;

const Probe = () => {
  const { pipVideoId, activeVideoId } = useVideoPip();
  return <div data-testid="probe">{`${pipVideoId ?? 'none'}|${activeVideoId ?? 'none'}`}</div>;
};

// the player tab is mounted only while `docked` is true
const Harness = ({ docked }: { docked: boolean }) => (
  <VideoPipProvider onExpand={() => {}} onMinimize={() => {}}>
    <Probe />
    {docked && (
      <VideoDock
        info={{
          videoId: VIDEO_ID,
          title: 'Artist - Song',
          youtubeUrl: fakeCC.contestant!.youtube,
          contestant: fakeCC,
        }}
      />
    )}
  </VideoPipProvider>
);

const firePlayerState = (state: number) => {
  act(() => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ event: 'onStateChange', info: state }),
        origin: 'https://www.youtube-nocookie.com',
      }),
    );
  });
};

describe('VideoPipContext pip tracking', () => {
  it('exposes pipVideoId for the floating video so the ranked list can flag the card', () => {
    const { rerender } = render(<Harness docked />);

    // docked in the modal: the video is loaded (activeVideoId) but not pip
    expect(screen.getByTestId('probe').textContent).toBe(`none|${VIDEO_ID}`);

    // user pressed play, then closes the modal / leaves the tab -> the dock
    // unmounts while playing, so the player floats out to a pip
    firePlayerState(1);
    act(() => rerender(<Harness docked={false} />));

    expect(screen.getByTestId('probe').textContent).toBe(`${VIDEO_ID}|${VIDEO_ID}`);
  });

  it('does not flag any card when the dock closes while paused (player tears down)', () => {
    const { rerender } = render(<Harness docked />);
    expect(screen.getByTestId('probe').textContent).toBe(`none|${VIDEO_ID}`);

    // never played (state stays unstarted) -> closing tears the player down
    act(() => rerender(<Harness docked={false} />));
    expect(screen.getByTestId('probe').textContent).toBe('none|none');
  });
});
