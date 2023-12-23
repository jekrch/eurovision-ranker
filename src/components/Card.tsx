import classNames from 'classnames';
import type { FC } from 'react';
import { FaTv } from 'react-icons/fa';
import { Contestant } from '../data/Contestant';
import { Country } from '../data/Country';
import Flag from "react-world-flags"

const style = {
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  marginRight: '.5rem',
  marginLeft: '.5rem',
  textColor: "white",
  backgroundColor: 'gray-dark',
  display: 'flex', // Enable Flexbox
  alignItems: 'center', // Align items vertically
};

export interface CardProps {
  rank?: number;
  country: Country;
  contestant?: Contestant
  className: string;
  isDragging: boolean;
  isDeleteMode?: boolean;
  deleteCallBack?: (id: string) => void;
  isLargeView?: boolean;
}

export const Card: FC<CardProps> = (props) => {
  return (
    <div
      key={props.rank ? 'ranked-' : 'unranked-' + 'card-' + props.country.name}
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
              <div className="pr-[3px] pb-[1px] flex-shrink-0 mr-3 font-bold w-8 border-2 border-indigo-800 bg-indigo-800 bg-opacity-80 text-white font-bold tracking-tighter h-10 items-center justify-center flex text-xl -ml-[9px] rounded-sm">
                {props.rank}
              </div>
              <Flag code={props.country.key} className="w-12 mr-5 opacity-80" />
            </>
          ) : (
            <div className="flex-shrink-0 mr-2 tracking-tighter mr-0 items-center justify-center flex text-md -ml-[7px] rounded">
              {props.rank}.
            </div>
          )
        )
      }
      {/* <i className={`z-0 float-right text-3xl ml-2 flag-icon -mr-2 ${props.country?.icon}`} /> */}
      <div className={classNames("flex-grow text-slate-400 font-bold")}>
        {props.country?.name}
        {props.isLargeView &&
          <>
            {/* <i className={`z-1 float-right ml-3 flag-icon -mr-2 ${props.country?.icon}`} /> */}
            {props.contestant?.youtube &&
              <a
                href={props.contestant?.youtube} target="_blank" rel="noopener noreferrer"
                className='float-right rounded text-slate-500 ml-1 hover:text-slate-100 mt-[1px]'
              >
                <FaTv className='text-xl inline-block -mr-2 -mt-2 ' />
              </a>
            }
            <div className="flex items-center justify-between">
              <div>
                {props.contestant ? (
                  <>
                    <span className="font-xs text-xs text-gray-500">
                      {props.contestant?.artist}
                    </span>
                    <span className="ml-2 font-xs text-xs text-gray-500">
                      {`"${props.contestant?.song}"`}
                    </span>
                  </>
                ) :
                  <span className="font-xs text-xs text-gray-500 strong">
                    Did not participate this year
                  </span>
                }
              </div>
              <div className="float-right flex ml-2 -mr-6 -mt-1 flex text-xl text-slate-500 tracking-tighter h-5 rounded-r">
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
              "rounded-sm h-10 ml-2 -mt-[2px] -mb-[2px] -mr-[12px] float-right text-white font-normal py-1 px-2 text-xs",
              "bg-red-800 opacity-70 hover:bg-red-600 active:bg-red-700"
            )}
            onClick={() => { props?.deleteCallBack?.(props.country.id); }}
          >&#x2715;</button>
        </>
      }
    </div>
  );
};
