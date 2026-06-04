import classNames from 'classnames';
import type { FC } from 'react';
import { CountryContestant } from '../../data/CountryContestant';
import { getYouTubeVideoId } from '../../utilities/YoutubeUtil';
import { useVideoPip } from '../video/VideoPipContext';

export interface CardProps {
  rank?: number;
  countryContestant: CountryContestant;
  className: string;
  isDragging: boolean;
  isDeleteMode?: boolean;
  deleteCallBack?: (id: string) => void;
  addCallBack?: () => void;
}

export const Card: FC<CardProps> = (props) => {
  const country = props.countryContestant.country;

  // flag the card when its video is the one loaded in the floating pip
  const { pipVideoId } = useVideoPip();
  const youtube = props.countryContestant.contestant?.youtube;
  const cardVideoId = youtube ? getYouTubeVideoId(youtube) : null;
  const isNowPlaying = !!pipVideoId && cardVideoId === pipVideoId;

  // the #1 card gets a pulsing glow: an inner radial fill (first-card-glow) plus
  // an outer halo rendered behind the card (first-card-halo) so it can spill
  // outside the card's overflow-hidden box
  const showGlow = !props.isDragging && props.rank === 1;

  return (
    <div className={classNames("relative mx-[.5rem]", { "isolate": showGlow })}>
      {showGlow && <span className="first-card-halo" aria-hidden="true" />}
      <div
        key={props.rank ? 'ranked-' : 'unranked-' + 'card-' + country.name}
        className={classNames(
          props.className, "min-h-[2.5em] py-[0.4em] flex flex-row items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden shadow rounded border border-0.5 border-[var(--er-border-default)]",
          props.isDragging ? "shadow-slate-400 shadow-sm border-solid" : "",
          showGlow ? "first-card-glow" : "",
          props.rank ? "border-solid border-gray" : "border-dashed",
          !props.isDeleteMode && !props.addCallBack ? "pr-[1em]" : ""
        )}
      >
      { props.rank ? (
          <div className="relative flex-shrink-0 ml-2 mr-2 tracking-tighter items-center justify-center flex text-md rounded text-[var(--er-text-tertiary)]">
            {props.rank}.
            {isNowPlaying &&
              <span
                className="eq-bars absolute -bottom-[2px] left-1/2 -translate-x-1/2"
                title="Now playing"
                aria-label="Now playing"
              >
                <span /><span /><span />
              </span>
            }
          </div>
        ) : (<div className="w-3"></div>)
      }

      {/* <i className={`z-0 float-right text-3xl ml-2 flag-icon -mr-2 ${props.country?.icon}`} /> */}
      <div className={classNames("flex-grow text-[var(--er-text-tertiary)] font-normal my-auto")}>
        <div className={`overflow-hidden overflow-ellipsis ${(props.rank && props.isDeleteMode) && 'max-w-[3.9em]'}`}>
          <span className="overflow-hidden overflow-ellipsis" title={country?.name}>
            {props.addCallBack && country?.name?.length > 11 ? country.name.slice(0, 11) + '…' : country?.name}
          </span>
        </div>

      </div>

      {props.isDeleteMode &&
        <button
          className={classNames(
            "rounded-sm ml-2 -mt-[2px] -mb-[2px] mr-[3px] text-white font-normal py-1 px-2 text-xs",
            "bg-red-800 opacity-70 hover:bg-red-600 active:bg-red-700"
          )}
          onClick={() => { props?.deleteCallBack?.(props.countryContestant.id); }}
        >&#x2715;</button>
      }

      {props.addCallBack &&
        <button
          className={classNames(
            "rounded-sm ml-1 mr-[4px] flex items-center justify-center leading-none font-normal py-0 px-2 text-2xl",
            "text-[var(--er-text-tertiary)] opacity-30 hover:opacity-80 active:opacity-100 transition-opacity duration-150"
          )}
          onClick={(e) => {
            e.stopPropagation();
            props.addCallBack?.();
          }}
        ><span className="-mt-[6px]">+</span></button>
      }
      </div>
    </div>
  );
};
