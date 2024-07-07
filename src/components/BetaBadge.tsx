import classNames from 'classnames';
import React from 'react';

interface BetaBadgeProps {
    className?: string;
}

const BetaBadge: React.FC<BetaBadgeProps> = (props: BetaBadgeProps) => {
  return (
    <span className={classNames("px-2 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full", props.className)}>
      Beta
    </span>
  );
};

export default BetaBadge;