import classNames from 'classnames'
import type { FC } from 'react'

const style = {
  border: '1px dashed gray',
  padding: '0.5rem 1rem',
  marginBottom: '.5rem',
  textColor: "white",
  backgroundColor: 'gray-dark',
  cursor: 'move',
}

export interface CardProps {
  id: string
  rank?: number | undefined
  name: string
  className: string
}

export const Card: FC<CardProps> = (props) => {

  return (
    <div 
      key={props.id}
      className={classNames(props.className, "!cursor-pointer")}
      style={{ ...style }} 
    >
      {props.rank ? (<span className="text-bold mr-5">{props.rank}.</span> ) : null} {props.name}
    </div>
  )
}

