import classNames from 'classnames';
import type { FC } from 'react';

const style = {
  border: '1px dashed gray',
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
  id: string;
  rank?: number;
  name: string;
  className: string;
  isDragging: boolean;
}

export const Card: FC<CardProps> = (props) => {
  return (
    <div 
      key={props.id}
      className={classNames(
        props.className, "!cursor-pointer whitespace-normal text-sm overflow-hidden shadow rounded",
        props.isDragging ? "shadow-amber-100 shadow-white" : "")}
        style={style}
    >
      {props.rank && (
        <div className="flex-shrink-0 mr-2 font-bold">{props.rank}.</div>
      )}
      <div className="flex-grow">
        {props.name}
      </div>
    </div>
  );
};
