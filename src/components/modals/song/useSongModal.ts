import { useEffect, useMemo, useRef, useState } from 'react';
import { logger } from '../../../utilities/logger';
import { AppState } from '../../../redux/store';
import { CountryContestant } from '../../../data/CountryContestant';
import { getSongDetails } from '../../../utilities/ContestantRepository';
import { fetchVotesForYear } from '../../../utilities/VoteRepository';
import { Vote } from '../../../data/Vote';
import { countries } from '../../../data/Countries';
import { getYouTubeVideoId } from '../../../utilities/YoutubeUtil';
import { useAppSelector } from '../../../hooks/stateHooks';
import { useVideoPip } from '../../video/VideoPipContext';
import {
    SHOW_ENG_LYRICS_KEY,
    ACTIVE_TAB_KEY,
    ROUND_ORDER,
    RoundVotes,
    SortKey,
    TabKey,
    formatLyrics,
    isPresent,
    readStickyTab,
    resolveTab,
    toNumber,
} from './songModalUtils';

type UseSongModalArgs = {
    isOpen: boolean;
    countryContestant?: CountryContestant;
};

/**
 * Owns all of the SongModal's data loading and tab state: lyrics/details and
 * voting results fetches, sticky-aware tab resolution, the English-translation
 * preference, and the votes-table sort. Returns a flat view-model consumed by
 * the modal shell and its tab components.
 */
export function useSongModal(props: UseSongModalArgs) {
    const year = useAppSelector((state: AppState) => state.root.year);
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

    // when the user expands a floating (pip) video, the provider bumps this
    // nonce; swing the modal back to the video tab so the player re-docks
    const { expandNonce, popOut } = useVideoPip();
    const lastExpandNonce = useRef(expandNonce);

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
                .catch(logger.error)
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
            .catch(logger.error)
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

    // expanding the pip re-opens this modal; jump straight to the video tab so
    // the still-playing iframe docks back into place (declared after the tab
    // resolution effect so it wins when both fire in the same commit)
    useEffect(() => {
        if (expandNonce !== lastExpandNonce.current) {
            lastExpandNonce.current = expandNonce;
            if (videoId) {
                selectTab('video');
            }
        }
    }, [expandNonce, videoId]);

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

    return {
        contestant,
        videoId,
        // lyrics tab
        composers,
        lyricists,
        hasLyrics,
        lyrics,
        engLyrics,
        showEng,
        showEngLyrics,
        updateShowEngLyrics,
        // tabs
        activeTab,
        selectTab,
        hasVotes,
        popOut,
        // votes tab
        roundVotes,
        selectedRound,
        setSelectedRound,
        activeRoundVotes,
        hasJuryTeleSplit,
        sortKey,
        sortDir,
        handleSort,
        sortedVotes,
    };
}
