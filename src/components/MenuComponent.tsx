import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH, faGlobe, faTv } from '@fortawesome/free-solid-svg-icons';
import { CSSTransition } from 'react-transition-group';

interface MenuComponentProps {
  name: string;
}

const MenuComponent: React.FC<MenuComponentProps> = ({ name }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      <button
        className="w-6 h-6 bg-slate-500 rounded-full flex justify-center items-center cursor-pointer"
        onClick={toggleMenu}
      >
        <FontAwesomeIcon icon={faEllipsisH} />
      </button>
      <CSSTransition
        in={isMenuOpen}
        timeout={200}
        classNames="menu"
        unmountOnExit
      >
        <ul
          role="menu"
          className="absolute z-10 min-w-[180px] flex flex-col gap-2 overflow-auto rounded-md border border-slate-400 bg-slate-600 p-1 shadow-lg shadow-blue-gray-500/10 focus:outline-none"
        >
          <li role="menuitem" className="bg-slate-500 flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 pt-[9px] pb-2 text-start transition-all hover:bg-blue-gray-50 hover:bg-opacity-80 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900">
            <FontAwesomeIcon icon={faGlobe} />
            <p className="text-sm font-medium">{'view heat map'}</p>
          </li>
          <li role="menuitem" className="bg-slate-500 flex w-full cursor-pointer select-none items-center gap-2 rounded-md px-3 pt-[9px] pb-2 text-start transition-all hover:bg-blue-gray-50 hover:bg-opacity-80 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900">
            <FontAwesomeIcon icon={faTv} />
            <p className="text-sm font-medium">{'YouTube playlist'}</p>
          </li>
        </ul>
      </CSSTransition>
    </div>
  );
};

export default MenuComponent;
