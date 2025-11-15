import classNames from 'classnames';
import type { FC } from 'react';
import { CountryContestant } from '../../data/CountryContestant';

export interface CardProps {
  rank?: number;
  countryContestant: CountryContestant;
  className: string;
  isDragging: boolean;
  isDeleteMode?: boolean;
  deleteCallBack?: (id: string) => void;
}

export const Card: FC<CardProps> = (props) => {
  const country = props.countryContestant.country;

  return (
    <div
      key={props.rank ? 'ranked-' : 'unranked-' + 'card-' + country.name}
      className={classNames(
        props.className, "mx-[.5rem] min-h-[2.5em] py-[0.4em] flex flex-row items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden shadow rounded border border-0.5 border-[var(--er-border-default)]",
        props.isDragging ? "shadow-slate-400 shadow-sm border-solid" : "",
        !props.isDragging && props.rank === 1 ? "first-card-glow" : "",
        props.rank ? "border-solid border-gray" : "border-dashed",
        !props.isDeleteMode ? "pr-[1em]" : ""
      )}
    >
      { props.rank ? (
          <div className="flex-shrink-0 ml-2 mr-2 tracking-tighter items-center justify-center flex text-md rounded">
            {props.rank}.
          </div>
        ) : (<div className="w-3"></div>)
      }

      {/* <i className={`z-0 float-right text-3xl ml-2 flag-icon -mr-2 ${props.country?.icon}`} /> */}
      <div className={classNames("flex-grow text-[var(--er-text-tertiary)] font-normal my-auto")}>
        <div className={`overflow-hidden overflow-ellipsis ${(props.rank && props.isDeleteMode) && 'max-w-[3.9em]'}`}>
          <span className="overflow-hidden overflow-ellipsis">{country?.name}</span>
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
    </div>
  );
};
