import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect, useRef } from 'react';

interface PhantomArrowProps {
  show: boolean;
}

const PhantomArrow: React.FC<PhantomArrowProps> = ({ show }) => {
  const [isVisible, setIsVisible] = useState(false);
  const arrowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (show) {
      const showTimer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(showTimer);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div
      ref={arrowRef}
      className="fixed z-50 animate-phantomArrow top-1/2 right-1/2 -translate-y-1/2"
    >
      <FontAwesomeIcon
        icon={faArrowRight}
        size="4x"
        className="text-[var(--er-text-tertiary)] font-extrabold"
      />
    </div>
  );
};

export default PhantomArrow;
