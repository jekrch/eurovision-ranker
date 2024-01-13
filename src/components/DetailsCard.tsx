import classNames from 'classnames';
import { useState, type FC } from 'react';
import { FaBook, FaFile, FaFileAlt, FaFileWord, FaTv } from 'react-icons/fa';
import Flag from "react-world-flags"
import { CountryContestant } from '../data/CountryContestant';
import { useSelector } from 'react-redux';
import { AppState } from '../redux/types';
import { voteCodeHasType } from '../utilities/VoteProcessor';
import SongModal from './LyricsModal';

export interface DetailsCardProps {
  rank?: number;
  countryContestant: CountryContestant;
  className: string;
  isDragging: boolean;
  openSongModal: () => void;
}

export const DetailsCard: FC<DetailsCardProps> = (props) => {
  const vote = useSelector((state: AppState) => state.vote);

  const contestant = props.countryContestant.contestant;
  const country = props.countryContestant.country;

  return (
    <div
      key={props.rank ? 'ranked-' : 'unranked-' + 'card-' + country.name}
      className={classNames(
        props.className, "relative mx-[.5rem] min-h-[2.5em] py-[0.4em] flex flex-row items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden shadow rounded border border-0.5 border-gray-400",
        props.isDragging ? "shadow-slate-400 shadow-sm border-solid" : "",
        !props.isDragging && props.rank === 1 ? "first-card-glow" : "",
        props.rank ? "border-solid border-gray" : "border-dashed",
      )}
    >
      <div className="-my-2 flex-shrink-0 pb-[1px] mr-3 font-bold w-8 border-r-2 border-blue-900 bg-blue-900 bg-opacity-80 text-slate-300 tracking-tighter items-center justify-center flex text-xl rounded-sm">
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

      {/* <i className={`z-0 float-right text-3xl ml-2 flag-icon -mr-2 ${props.country?.icon}`} /> */}
      <div className={classNames("flex-grow text-slate-400 font-bold")}>
        <div className={`overflow-hidden overflow-ellipsis`}>
          <span className="float-right flex flex-row items-center">
            {contestant?.youtube &&
              <div 
                onClick={() => {props.openSongModal()}}
                className='cursor-pointer rounded text-slate-500 hover:text-slate-100 mr-[0.7em]'>
                <FaFileAlt className='text-base' />
              </div>
            }
            {contestant?.youtube &&
              <a href={contestant?.youtube} target="_blank" rel="noopener noreferrer" className='rounded text-slate-500 hover:text-slate-100'>
                <FaTv className='text-xl mr-[0.3em]' />
              </a>
            }
          </span>
          <span className="overflow-hidden overflow-ellipsis">{country?.name}</span>
        </div>

        {/* <i className={`z-1 float-right ml-3 flag-icon -mr-2 ${props.country?.icon}`} /> */}

        <div className="pr-[1.5em] flex flex-grow items-center justify-between font-normal">
          <div className="">
            {contestant ? (
              <>
                <span className="font-xs text-sm text-gray-500">
                  {contestant?.artist}
                </span>
                <span className="ml-2 font-xs text-xs text-gray-500">
                  {contestant.song?.length && !contestant.song?.includes("TBD") ? `"${contestant.song}"` : `${contestant.song}`}
                </span>

                <div className="mt-1 font-xs text-xs text-gray-400 mb-1 flex flex-wrap">
                  {(contestant?.votes?.totalPoints !== undefined && voteCodeHasType(vote, 't')) &&
                    <div className="flex items-center mr-2">
                      <span className="text-gray-500">total:&nbsp;</span>
                      <span>{`${contestant?.votes?.totalPoints}`}</span>
                    </div>
                  }
                  {(contestant?.votes?.telePoints !== undefined && voteCodeHasType(vote, 'tv')) &&
                    <div className="flex items-center mr-2">
                      <span className="text-gray-500">tele:&nbsp;</span>
                      <span>{`${contestant?.votes?.telePoints}`}</span>
                    </div>
                  }
                  {(contestant?.votes?.juryPoints !== undefined && voteCodeHasType(vote, 'j')) &&
                    <div className="flex items-center mr-2">
                      <span className="text-gray-500">jury:&nbsp;</span>
                      <span>{`${contestant?.votes?.juryPoints}`}</span>
                    </div>
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
        </div>


      </div>


      <div id="right-edge" className="mb-[0.2em] absolute bottom-0 right-0 flex-shrink-0 flex flex-row justify-between text-xl text-slate-500">
        <div id="gripper" className="text-right pl-[0.3em] mr-[0.3em]">
          &#8942;&#8942;
        </div>
      </div>   
   
    </div>
  );
};
