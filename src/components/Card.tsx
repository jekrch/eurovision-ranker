import classNames from 'classnames';
import type { FC } from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';
import { Contestant } from '../data/Contestant';
import { Country } from '../data/Country';

const style = {
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  marginRight: '.5rem',
  marginLeft: '.5rem',
  textColor: "white",
  backgroundColor: 'gray-dark',
  cursor: 'move',
  display: 'flex', // Enable Flexbox
  alignItems: 'center', // Align items vertically
};

export interface CardProps {
  rank?: number;
  country: Country;
  contestant: Contestant
  className: string;
  isDragging: boolean;
  isLargeView?: boolean;
}

export const Card: FC<CardProps> = (props) => {
  return (
    <div 
      key={props.rank ? 'ranked-' : 'unranked-' + 'card-' + props.country.name}
      className={classNames(
        props.className, "!cursor-pointer whitespace-normal text-sm overflow-hidden shadow rounded border border-0.5 border-gray-400",
        props.isDragging ? "shadow-slate-400 shadow-sm border-solid" : "",
        !props.isDragging && props.rank === 1 ? "first-card-glow" : "",
        props.rank ? "border-solid border-gray" : "border-dashed"
      )}
        
        style={style}
    >
      {props.rank && (
        <div className="flex-shrink-0 mr-2 font-bold">{props.rank}.</div>
      )}
      <div className="flex-grow">
        {props.country.name} 
        {props.isLargeView &&
          <>
            <i className={`z-1 float-right ml-3 flag-icon ${props.country.icon}`}/>
            {props.contestant.youtube && 
            <a 
              href={props.contestant.youtube} target="_blank" rel="noopener noreferrer"
              className='float-right rounded text-slate-500 ml-1 hover:text-slate-100 mt-[1px]'
            >
                <FaExternalLinkAlt className='text-xs'/>
            </a>
            }
            <div className="flex items-center">
              <span className="font-xs text-xs text-gray-500">
                {props.contestant.artist}
              </span>
              <span className="ml-2 font-xs text-xs text-gray-500">
                {`"${props.contestant.song}"`}
              </span>
            </div>
          </>
        }
      </div>
    </div>
  );
};
