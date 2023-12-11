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
  name: string
  className: string
}

export const Card: FC<CardProps> = (props) => {

  //const ref = useRef<HTMLDivElement>(null);
  return (
    <div 
      key={props.id}
      //ref={ref} 
      className={classNames(props.className, "!cursor-pointer")}
      style={{ ...style }} 
    >
      {props.name}
    </div>
  )
}

