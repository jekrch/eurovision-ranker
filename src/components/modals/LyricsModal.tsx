import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from '../../redux/store';
import Modal from './Modal';
import { CountryContestant } from '../../data/CountryContestant';
import { getSongDetails } from '../../utilities/ContestantRepository';
import { fetchVotesForYear } from '../../utilities/VoteRepository';
import { Vote } from '../../data/Vote';
import { countries } from '../../data/Countries';
import { getYouTubeVideoId } from '../../utilities/YoutubeUtil';
import { useAppSelector } from '../../hooks/stateHooks';

import { FaYoutube } from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAlignLeft, faPlay, faChartColumn } from '@fortawesome/free-solid-svg-icons';
import { LazyLoadedFlag } from '../LazyFlag';

const SHOW_ENG_LYRICS_KEY = 'er-show-eng-lyrics';
const ACTIVE_TAB_KEY = 'er-song-modal-tab';

type TabKey = 'lyrics' | 'video' | 'votes';

// last tab the user viewed, remembered across modal opens within a session
const readStickyTab = (): TabKey | null => {
    try {
        const stored = sessionStorage.getItem(ACTIVE_TAB_KEY);
        return stored === 'lyrics' || stored === 'video' || stored === 'votes' ? stored : null;
    } catch {
        return null;
    }
};

// pick which tab to show given what content this song actually has, preferring
// the user's last-viewed (sticky) tab when it's available for this song
const resolveTab = (
    available: { lyrics: boolean; video: boolean; votes: boolean },
    sticky: TabKey | null
): TabKey => {
    if (sticky && available[sticky]) {
        return sticky;
    }
    if (available.lyrics) return 'lyrics';
    if (available.video) return 'video';
    if (available.votes) return 'votes';
    return 'lyrics';
};

// columns the votes table can be sorted by
type SortKey = 'from' | 'jury' | 'tele' | 'total';

// preferred order of rounds when a song received votes in more than one round
const ROUND_ORDER = ['Final', 'Semi-Final', 'Semi-Final-1', 'Semi-Final-2'];

type SongModalProps = {
    isOpen: boolean;
    countryContestant?: CountryContestant;
    onClose: () => void;
};

// a value is "present" if it's a non-empty, non-null cell from the vote CSV
const isPresent = (value: unknown): boolean =>
    value !== undefined && value !== null && String(value).trim() !== '';

const toNumber = (value: unknown): number => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};

type RoundVotes = { round: string; votes: Vote[] };

/**
 * A modal for displaying song details with a tabbed view: lyrics, an in-app
 * video player, and the song's voting results (which countries gave what
 * points, split by jury / televote where available). It's opened from the
 * detailsCard.
 */
const SongModal: React.FC<SongModalProps> = (props: SongModalProps) => {
    const year = useAppSelector((state: AppState) => state.year);
    const [lyrics, setLyrics] = useState<string | undefined>('');
    const [engLyrics, setEngLyrics] = useState<string | undefined>('');
    const [composers, setComposers] = useState('');
    const [lyricists, setLyricists] = useState('');
    const [showEngLyrics, setShowEngLyrics] = useState<boolean>(() => {
        try {
            return localStorage.getItem(SHOW_ENG_LYRICS_KEY) === 'true';
        } catch {
            return false;
        }
    });
    const [hasLyrics, setHasLyrics] = useState<boolean>(false);

    const [activeTab, setActiveTab] = useState<TabKey>('lyrics');
    // tracks whether the user manually picked a tab, so async loads don't yank
    // them away from their selection
    const userPickedTab = useRef(false);
    // whether the song details / votes fetches have settled, so we only resolve
    // the final tab once we know what content this song actually has
    const [detailsLoaded, setDetailsLoaded] = useState(false);
    const [votesLoaded, setVotesLoaded] = useState(false);

    const [roundVotes, setRoundVotes] = useState<RoundVotes[]>([]);
    const [selectedRound, setSelectedRound] = useState<string>('');

    // votes table sorting; defaults to total points, highest first
    const [sortKey, setSortKey] = useState<SortKey>('total');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const contestant = props.countryContestant?.contestant;
    const videoId = contestant?.youtube ? getYouTubeVideoId(contestant.youtube) : null;
    const hasVotes = roundVotes.length > 0;

    const selectTab = (tab: TabKey) => {
        userPickedTab.current = true;
        setActiveTab(tab);
        try {
            sessionStorage.setItem(ACTIVE_TAB_KEY, tab);
        } catch {
            // ignore storage errors (e.g. private mode)
        }
    };

    // persist the user's English translation preference across modal opens/sessions
    const updateShowEngLyrics = (value: boolean) => {
        setShowEngLyrics(value);
        try {
            localStorage.setItem(SHOW_ENG_LYRICS_KEY, String(value));
        } catch {
            // ignore storage errors (e.g. private mode)
        }
    };

    // reset transient state and load lyrics/details whenever the contestant changes
    useEffect(() => {
        userPickedTab.current = false;
        setDetailsLoaded(false);
        setVotesLoaded(false);
        setRoundVotes([]);
        setSelectedRound('');
        setSortKey('total');
        setSortDir('desc');

        // show a safe tab while details/votes load; the resolution effect below
        // settles on the sticky-aware tab once we know what content this song has
        const sticky = readStickyTab();
        setActiveTab(sticky === 'video' && videoId ? 'video' : 'lyrics');

        if (year && contestant?.song) {

            setLyricists('');
            setComposers('');
            setLyrics(undefined);
            setEngLyrics(undefined);
            setHasLyrics(false);

            getSongDetails(contestant.id, contestant?.year)
                .then(fetchedSongDetails => {
                    assignLyrics(
                        fetchedSongDetails?.lyrics,
                        fetchedSongDetails?.engLyrics,
                        contestant.song
                    );
                    setComposers(fetchedSongDetails?.composers ?? '');
                    setLyricists(fetchedSongDetails?.lyricists ?? '');
                })
                .catch(console.error)
                .finally(() => setDetailsLoaded(true));
        } else {
            setHasLyrics(false);
            setDetailsLoaded(true);
        }
    }, [props.countryContestant]);

    // load voting results for the song
    useEffect(() => {
        if (!props.isOpen) {
            return;
        }

        const toCountryKey = contestant?.countryKey?.toLowerCase();

        if (!toCountryKey || !(contestant?.year || year)) {
            // nothing to load, but mark as settled so the tab can be resolved
            setVotesLoaded(true);
            return;
        }

        let cancelled = false;

        fetchVotesForYear(contestant?.year || year, undefined, undefined, toCountryKey)
            .then(votes => {
                if (cancelled) {
                    return;
                }

                // group by round, keeping only countries that actually awarded points
                const byRound = new Map<string, Vote[]>();
                votes.forEach(vote => {
                    if (toNumber(vote.totalPoints) <= 0) {
                        return;
                    }
                    const list = byRound.get(vote.round) ?? [];
                    list.push(vote);
                    byRound.set(vote.round, list);
                });

                const grouped: RoundVotes[] = Array.from(byRound.entries())
                    .map(([round, roundVoteList]) => ({
                        round,
                        votes: roundVoteList.sort(
                            (a, b) => toNumber(b.totalPoints) - toNumber(a.totalPoints)
                        ),
                    }))
                    .sort((a, b) => {
                        const ai = ROUND_ORDER.indexOf(a.round);
                        const bi = ROUND_ORDER.indexOf(b.round);
                        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                    });

                setRoundVotes(grouped);
                setSelectedRound(grouped[0]?.round ?? '');
            })
            .catch(console.error)
            .finally(() => {
                if (!cancelled) {
                    setVotesLoaded(true);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [props.countryContestant, props.isOpen]);

    // once details and votes have settled, show the user's last-viewed (sticky)
    // tab when this song has that content, otherwise fall back to a default —
    // unless the user already picked a tab for this song
    useEffect(() => {
        if (userPickedTab.current || !detailsLoaded || !votesLoaded) {
            return;
        }
        setActiveTab(resolveTab(
            { lyrics: hasLyrics, video: !!videoId, votes: roundVotes.length > 0 },
            readStickyTab()
        ));
    }, [detailsLoaded, votesLoaded, hasLyrics, videoId, roundVotes.length]);

    function assignLyrics(
        lyrics: string | undefined,
        engLyrics: string | undefined,
        song: string | undefined
    ) {
        if (!lyrics?.length) {
            setLyrics('N/A');
            setHasLyrics(false);
            return;
        }

        setHasLyrics(true);
        const finalLyrics = formatLyrics(lyrics, song);
        setLyrics(finalLyrics);

        const finalEngLyrics = formatLyrics(engLyrics, song);
        setEngLyrics(finalEngLyrics);
    }

    function formatLyrics(
        lyrics: string | undefined,
        song: string | undefined
    ) {
        if (!lyrics) {
            return lyrics;
        }

        let lines = lyrics.split('\\n');

        // if the first line is the song title and the second line is empty,
        // remove those lines
        if (lines.length >= 2 && lines[0] === song && !lines[1].trim()) {
            lines = lines.slice(2);
        }

        const finalLyrics = lines.join('\\n');

        return finalLyrics;
    }

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

    const TabButton: React.FC<{ tab: TabKey; icon: typeof faAlignLeft; label: string }> =
        ({ tab, icon, label }) => (
            <li className="mr-0 sm:mr-2">
                <button
                    onClick={() => selectTab(tab)}
                    aria-label={label}
                    title={label}
                    className={`inline-flex items-center gap-2 justify-center px-[14px] sm:px-4 py-3 border-b-2 border-transparent ${
                        activeTab === tab
                            ? 'text-[var(--er-interactive-primary)] !border-[var(--er-interactive-primary)]'
                            : 'hover:text-[var(--er-text-muted)]'
                    }`}
                >
                    <FontAwesomeIcon className="text-md" icon={icon} fixedWidth />
                    <span className="text-sm">{label}</span>
                </button>
            </li>
        );

    const SortableHeader: React.FC<
        { sortKeyName: SortKey; label: string; align: 'left' | 'right'; width?: string }
    > = ({ sortKeyName, label, align, width }) => {
        const active = sortKey === sortKeyName;
        return (
            <th className={`font-semibold pb-2 ${align === 'right' ? 'text-right' : 'text-left'} ${width ?? ''}`}>
                <button
                    type="button"
                    onClick={() => handleSort(sortKeyName)}
                    className={`inline-flex items-center gap-1 leading-none uppercase tracking-wide select-none hover:text-[var(--er-text-secondary)] ${
                        align === 'right' ? 'flex-row-reverse' : ''
                    } ${active ? 'text-[var(--er-text-secondary)]' : ''}`}
                    aria-label={`Sort by ${label}`}
                >
                    <span>{label}</span>
                    {/* glyph is always rendered so the header never shifts; only its visibility changes */}
                    <span
                        className={`text-[0.6em] leading-none transition-opacity duration-150 ${
                            active ? 'opacity-100' : 'opacity-0'
                        }`}
                    >
                        {sortDir === 'asc' ? '▲' : '▼'}
                    </span>
                </button>
            </th>
        );
    };

    // only actually show the translation when this song has one, even if the
    // sticky preference is on (a song may have no English lyrics)
    const showEng = showEngLyrics && !!engLyrics;

    const activeRoundVotes = roundVotes.find(r => r.round === selectedRound)?.votes ?? [];
    // jury/televote split only exists for recent years; show those columns only
    // when the data is actually present
    const hasJuryTeleSplit = activeRoundVotes.some(
        v => isPresent(v.juryPoints) && isPresent(v.telePoints)
    );

    // clicking a header sorts by that column; clicking the active column flips
    // direction. numeric columns start high→low, the country column A→Z.
    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir(dir => (dir === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir(key === 'from' ? 'asc' : 'desc');
        }
    };

    const sortedVotes = useMemo(() => {
        // fall back to total if a jury/tele sort is active for a round without that split
        const key = (sortKey === 'jury' || sortKey === 'tele') && !hasJuryTeleSplit
            ? 'total'
            : sortKey;

        const getName = (v: Vote) =>
            countries.find(c => c.key === v.fromCountryKey)?.name ?? v.fromCountryKey;

        return [...activeRoundVotes].sort((a, b) => {
            let cmp = 0;
            if (key === 'from') {
                cmp = getName(a).localeCompare(getName(b));
            } else if (key === 'jury') {
                cmp = toNumber(a.juryPoints) - toNumber(b.juryPoints);
            } else if (key === 'tele') {
                cmp = toNumber(a.telePoints) - toNumber(b.telePoints);
            } else {
                cmp = toNumber(a.totalPoints) - toNumber(b.totalPoints);
            }
            // break point ties by total, then by country name, for a stable order
            if (cmp === 0 && key !== 'total') {
                cmp = toNumber(a.totalPoints) - toNumber(b.totalPoints);
            }
            if (cmp === 0 && key !== 'from') {
                cmp = getName(a).localeCompare(getName(b));
            }
            return sortDir === 'asc' ? cmp : -cmp;
        });
    }, [activeRoundVotes, sortKey, sortDir, hasJuryTeleSplit]);

    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            className="z-50 select-text h-[36em] gradient-background-modal">

            <div className="-mt-[0.5em] mr-[1.2em] mb-3">
                <div className="font-semibold text-base text-[var(--er-text-secondary)] pr-6">
                    {props.countryContestant?.country.name} &ndash; {contestant?.artist}
                </div>
                <div className="text-sm text-[var(--er-text-tertiary)] italic mt-[0.15em]">
                    "{contestant?.song}"
                </div>
            </div>

            <div className="border-b border-[var(--er-border-secondary)]">
                <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-[var(--er-text-muted)] dark:text-[var(--er-text-subtle)]">
                    <TabButton tab="lyrics" icon={faAlignLeft} label="Lyrics" />
                    {videoId && <TabButton tab="video" icon={faPlay} label="Video" />}
                    {hasVotes && <TabButton tab="votes" icon={faChartColumn} label="Votes" />}
                </ul>
            </div>

            {/* fixed-height body so the modal doesn't resize when switching tabs */}
            <div className="flex-1 min-h-0 flex flex-col">

            {/* ---- Lyrics tab ---- */}
            {activeTab === 'lyrics' && (
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
                                            onChange={(e: any) => { updateShowEngLyrics(e.target.checked); }}
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
                                            <div key={index}>{line?.length ? line : ' '}</div>
                                        ))}
                                    </div>
                                    <div
                                        className={`lyrics-container ${
                                            showEng ? 'slide-in-right' : 'slide-out-left'
                                        }`}
                                    >
                                        {engLyrics?.split('\\n').map((line, index) => (
                                            <div key={index}>{line?.length ? line : ' '}</div>
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
            )}

            {/* ---- Video tab (iframe only mounts while active so it stops on switch) ---- */}
            {activeTab === 'video' && videoId && (
                <div className="flex-1 min-h-0 overflow-auto mt-[1em]">
                    <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black ring-1 ring-[var(--er-border-secondary)]">
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                            title={`${contestant?.artist} - ${contestant?.song}`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        />
                    </div>
                    <a
                        href={contestant?.youtube}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 rounded-md bg-[var(--er-surface-tertiary-70)] hover:bg-[var(--er-interactive-secondary)] border-[0.1em] border-[var(--er-border-tertiary)] px-3 py-[0.35em] text-sm font-medium text-[var(--er-text-secondary)] transition-colors"
                    >
                        <FaYoutube className="text-lg text-[#FF0000]" />
                        Watch on YouTube
                    </a>
                </div>
            )}

            {/* ---- Votes tab ---- */}
            {activeTab === 'votes' && (
                <div className="flex-1 min-h-0 overflow-auto pr-4 -mr-4 mt-[1em] [scrollbar-gutter:stable]">
                    {roundVotes.length > 1 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {roundVotes.map(({ round }) => (
                                <button
                                    key={round}
                                    onClick={() => setSelectedRound(round)}
                                    className={`rounded-md px-3 py-[0.3em] text-xs font-medium border-[0.1em] transition-colors ${
                                        selectedRound === round
                                            ? 'bg-[var(--er-interactive-secondary)] border-[var(--er-border-tertiary)] text-[var(--er-text-secondary)]'
                                            : 'bg-[var(--er-surface-tertiary-70)] border-[var(--er-border-tertiary)] text-[var(--er-text-muted)] hover:text-[var(--er-text-secondary)]'
                                    }`}
                                >
                                    {round.replaceAll('-', ' ')}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeRoundVotes.length ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-[var(--er-text-muted)] uppercase tracking-wide text-xs">
                                    <SortableHeader sortKeyName="from" label="From" align="left" />
                                    {hasJuryTeleSplit && (
                                        <>
                                            <SortableHeader sortKeyName="jury" label="Jury" align="right" width="w-[3.5em]" />
                                            <SortableHeader sortKeyName="tele" label="Tele" align="right" width="w-[3.5em]" />
                                        </>
                                    )}
                                    <SortableHeader sortKeyName="total" label="Total" align="right" width="w-[3.5em]" />
                                </tr>
                            </thead>
                            <tbody>
                                {sortedVotes.map((vote) => {
                                    const fromCountry = countries.find(c => c.key === vote.fromCountryKey);
                                    return (
                                        <tr
                                            key={vote.fromCountryKey}
                                            className="border-t border-[var(--er-border-secondary)]"
                                        >
                                            <td className="py-[0.45em]">
                                                <span className="inline-flex items-center gap-2">
                                                    <LazyLoadedFlag
                                                        code={vote.fromCountryKey}
                                                        className="w-5 flag-icon shrink-0"
                                                    />
                                                    <span className="text-[var(--er-text-secondary)]">
                                                        {fromCountry?.name ?? vote.fromCountryKey.toUpperCase()}
                                                    </span>
                                                </span>
                                            </td>
                                            {hasJuryTeleSplit && (
                                                <>
                                                    <td className="text-right text-[var(--er-text-muted)]">
                                                        {isPresent(vote.juryPoints) ? toNumber(vote.juryPoints) : '–'}
                                                    </td>
                                                    <td className="text-right text-[var(--er-text-muted)]">
                                                        {isPresent(vote.telePoints) ? toNumber(vote.telePoints) : '–'}
                                                    </td>
                                                </>
                                            )}
                                            <td className="text-right font-semibold text-[var(--er-text-secondary)]">
                                                {toNumber(vote.totalPoints)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="mt-[1.5em] text-center text-sm text-[var(--er-text-muted)] italic">
                            Voting results not available
                        </div>
                    )}
                </div>
            )}

            </div>
        </Modal>
    );
};

export default SongModal;
