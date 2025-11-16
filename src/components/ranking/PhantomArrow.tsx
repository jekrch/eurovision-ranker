import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';

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
      className="fixed z-50 animate-phantomArrow"
      style={{
        top: '50%',
        right: '50%',
        transform: 'translateY(-50%)',
      }}
    >
      <FontAwesomeIcon icon={faArrowRight} size="4x" className="text-[var(--er-text-tertiary)] font-extrabold" /> 
    </div>
  );
};

export default PhantomArrow;