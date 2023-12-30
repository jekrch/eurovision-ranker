import classNames from 'classnames';
import type { Dispatch, FC } from 'react';
import { FaTv } from 'react-icons/fa';

import Flag from "react-world-flags"
import { CountryContestant } from '../data/CountryContestant';
import { useDispatch, useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { voteCodeHasType } from '../utilities/VoteProcessor';

const style = {
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  marginRight: '.5rem',
  marginLeft: '.5rem',
  textColor: "white",
  backgroundColor: 'gray-dark',
  display: 'flex', // Enable Flexbox
  alignItems: 'stretch', // Align items vertically
};

export interface CardProps {
  rank?: number;
  countryContestant: CountryContestant;
  className: string;
  isDragging: boolean;
  isDeleteMode?: boolean;
  deleteCallBack?: (id: string) => void;
  isLargeView?: boolean;
}

export const Card: FC<CardProps> = (props) => {
  const dispatch: Dispatch<any> = useDispatch();
  const vote = useSelector((state: AppState) => state.vote);

  const contestant = props.countryContestant.contestant;
  const country = props.countryContestant.country;

  return (
    <div
      key={props.rank ? 'ranked-' : 'unranked-' + 'card-' + country.name}
      className={classNames(
        props.className, "!cursor-grabber whitespace-normal text-sm overflow-hidden shadow rounded border border-0.5 border-gray-400",
        props.isDragging ? "shadow-slate-400 shadow-sm border-solid" : "",
        !props.isDragging && props.rank === 1 ? "first-card-glow" : "",
        props.rank ? "border-solid border-gray" : "border-dashed"
      )}

      style={style}
    >
      {
        props.rank && (
          props.isLargeView ? (
            <>
              <div className="-my-2 flex-shrink-0 pb-[1px] mr-3 font-bold w-8 border-r-2 border-indigo-800 bg-indigo-800 bg-opacity-80 text-slate-300 font-bold tracking-tighter items-center justify-center flex text-xl -ml-[0.8em] rounded-sm -ml-4">
                {props.rank}
              </div>
              {country.key !== 'yu' ? (
                <Flag code={country.key} className="w-12 mr-3 opacity-80" />
              ) :
                <div className="w-12 mr-3 opacity-80 my-auto">
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg"
                    alt="Flag of Yugoslavia"
                    className="w-full h-auto" 
                  />
                </div>
              }
            </>
          ) : (
            <div className="flex-shrink-0 mr-2 tracking-tighter mr-0 items-center justify-center flex text-md -ml-[7px] rounded">
              {props.rank}.
            </div>
          )
        )
      }
      {/* <i className={`z-0 float-right text-3xl ml-2 flag-icon -mr-2 ${props.country?.icon}`} /> */}
      <div className={classNames("flex-grow text-slate-400", props.isLargeView ? "font-bold" : "font-normal my-auto")}>
        {country?.name}
        {props.isLargeView &&
          <>
            {/* <i className={`z-1 float-right ml-3 flag-icon -mr-2 ${props.country?.icon}`} /> */}
            {contestant?.youtube &&
              <a
                href={contestant?.youtube} target="_blank" rel="noopener noreferrer"
                className='float-right rounded text-slate-500 ml-1 hover:text-slate-100 mt-[1px]'
              >
                <FaTv className='text-xl -mr-2 -mt-1' />
              </a>
            }
            <div className="flex items-center justify-between font-normal">
              <div>
                {contestant ? (
                  <>
                    <span className="font-xs text-sm text-gray-500">
                      {contestant?.artist}
                    </span>
                    <span className="ml-2 font-xs text-xs text-gray-500">
                      {contestant.song?.length && !contestant.song?.includes("TBD") ? `"${contestant.song}"` : `${contestant.song}`}
                    </span>
                    <div className="mt-1 font-xs text-xs text-gray-400 whitespace-nowrap space-x-2">
                      {(contestant?.votes?.totalPoints !== undefined && voteCodeHasType(vote, 't')) &&
                        <span><span className="text-gray-500">total:</span> {`${contestant?.votes?.totalPoints}`} </span>
                      }
                      {(contestant?.votes?.telePoints !== undefined && voteCodeHasType(vote, 'tv')) &&
                        <span> <span className="text-gray-500">tele:</span> {`${contestant?.votes?.telePoints}`} </span>
                      }
                      {(contestant?.votes?.juryPoints !== undefined && voteCodeHasType(vote, 'j')) &&
                        <span> <span className="text-gray-500">jury:</span> {`${contestant?.votes?.juryPoints}`} </span>
                      }
                    </div>
                  </>
                ) :
                  <>
                    <span className="font-xs text-xs text-gray-500 strong">
                      Did not participate
                    </span>
                  </>
                }
              </div>
              <div className="float-right flex ml-2 -mr-3 -mt-1 flex text-xl text-slate-500 tracking-tighter h-5 rounded-r">
                <span className="pb-1 pr-[1.5px]">&#8942;&#8942;</span>
              </div>
            </div>
          </>
        }

      </div>
      {props.isDeleteMode &&
        <>
          <button

            className={classNames(
              "rounded-sm ml-2 -mt-[2px] -mb-[2px] -mr-[12px] float-right text-white font-normal py-1 px-2 text-xs",
              "bg-red-800 opacity-70 hover:bg-red-600 active:bg-red-700"
            )}
            onClick={() => { props?.deleteCallBack?.(country.id); }}
          >&#x2715;</button>
        </>
      }
    </div>
  );
};
