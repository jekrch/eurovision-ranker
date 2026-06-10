import React from 'react';
import { LazyLoadedFlag } from '../../LazyFlag';

const LabeledValue: React.FC<
    { label: string; value: string | null | undefined }
> = ({ label, value }) => {
    if (!value) {
        return null;
    }

    const processedValue = value.replaceAll(';', ', ');

    return (
        <div className="flex">
            <span className="text-sm mr-[0.8em] w-[6.2em] text-right font-semibold">{label}:</span>
            <span className="text-sm flex-1">{processedValue}</span>
        </div>
    );
};

type SongLyricsTabProps = {
    composers: string;
    lyricists: string;
    hasLyrics: boolean;
    lyrics: string | undefined;
    engLyrics: string | undefined;
    showEng: boolean;
    showEngLyrics: boolean;
    updateShowEngLyrics: (value: boolean) => void;
};

const SongLyricsTab: React.FC<SongLyricsTabProps> = ({
    composers,
    lyricists,
    hasLyrics,
    lyrics,
    engLyrics,
    showEng,
    showEngLyrics,
    updateShowEngLyrics,
}) => (
    <div className="flex-1 min-h-0 overflow-auto pr-4 -mr-4 mt-[1em] [scrollbar-gutter:stable]">
        <LabeledValue
            label="Composer(s)"
            value={composers?.replaceAll(';', ', ')}
        />
        <LabeledValue
            label="Lyricist(s)"
            value={lyricists?.replaceAll(';', ', ')}
        />

        {hasLyrics ? (
            <>
                <div className="flex items-center justify-between mt-[1em]">
                    <span className="text-sm font-semibold text-[var(--er-text-muted)] uppercase tracking-wide">
                        Lyrics
                    </span>
                    {engLyrics &&
                        <label className="inline-flex items-center cursor-pointer" title="translate to English">
                            <input type="checkbox"
                                value=""
                                checked={showEngLyrics}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => { updateShowEngLyrics(e.target.checked); }}
                                className="sr-only peer"
                            />
                            <div className="relative w-7 h-4 bg-[var(--er-surface-tertiary-70)] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[var(--er-interactive-secondary)] dark:peer-focus:ring-[var(--er-interactive-dark)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-[var(--er-border-default)] after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[var(--er-border-lighter)] after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[var(--er-interactive-secondary)]"></div>
                            <span className="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300"><LazyLoadedFlag code={'gb'} className="w-6 opacity-60 text-md flag-icon" /> </span>
                        </label>
                    }
                </div>
                <hr className="mt-[0.6em] border-[var(--er-border-secondary)]" />
                <div className="mt-[1em] relative overflow-hidden">
                    <div className="lyrics-wrapper">
                        <div
                            className={`lyrics-container ${
                                showEng && lyrics?.length ? 'slide-out-left' : 'slide-in-right'
                            }`}
                        >
                            {lyrics?.split('\\n').map((line, index) => (
                                <div key={index}>{line?.length ? line : ' '}</div>
                            ))}
                        </div>
                        <div
                            className={`lyrics-container ${
                                showEng ? 'slide-in-right' : 'slide-out-left'
                            }`}
                        >
                            {engLyrics?.split('\\n').map((line, index) => (
                                <div key={index}>{line?.length ? line : ' '}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        ) : (
            <div className="mt-[1.5em] text-center text-sm text-[var(--er-text-muted)] italic">
                Lyrics not available
            </div>
        )}
    </div>
);

export default SongLyricsTab;
