import React, { useRef, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import classNames from 'classnames';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';

type DropdownProps = {
  className?: string;
  menuClassName?: string;
  buttonClassName?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  showSearch?: boolean;
};

const Dropdown: React.FC<DropdownProps> = ({ value, onChange, options, className, menuClassName, showSearch, buttonClassName }) => {
  const [filter, setFilter] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [menuPosition, setMenuPosition] = useState({
    top: 0, 
    left: 0, 
    maxHeight: 300 
  });
  const filteredOptions = options.filter(option =>
    filter?.length ? option.toLowerCase().includes(filter.toLowerCase()) : true
  );

  const portalMountNode = document.body;

  const handleMenuClose = () => {
    setFilter('');
  };

  const updateMenuPosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const bottomSpace = window.innerHeight - rect.bottom; // Space available below the button
      const maxHeight = Math.min(bottomSpace - 10, 300); // Example max height
  
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        maxHeight 
      });
    }
  };
  

  return (
    <Menu as="div" className={classNames("relative inline-block text-left z-40", className)}>
      <div>
        <Menu.Button 
          ref={buttonRef}
          onClick={(e) => {
            updateMenuPosition();
          }}
          className={classNames(
            "inline-flex w-full justify-center gap-x-1.5 rounded-md",
            "bg-slate-700 bg-opacity-10 px-3 py-[0.2em] h-6 text-sm font-bold",
            "text-gray-400 shadow-sm ring-1 ring-inset ring-gray-400 hover:bg-opacity-30",
            "h-[2em] items-center", 
            buttonClassName
          )}>
          {value}
          <FontAwesomeIcon className="-mr-1 h-[0.8em] w-5 text-gray-400" icon={faChevronDown} />
        </Menu.Button>
      </div>

      <Transition
        as="div"
        //show={isOpen} 
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        {createPortal(
          <div
          style={{
            position: 'absolute',
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            zIndex: 1000, // Ensure it's above everything else
          }}
          className="origin-top-right"
        >
        <Menu.Items 
          as="div" 
          style={{ maxHeight: `${menuPosition.maxHeight}px`, overflowY: 'auto' }}
          className="dropdown-menu absolute mt-2 w-[6em] rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none custom-scrollbar"
         >
          <div className="py-1 bg-slate-600 bg-opacity-96">
            {showSearch &&
              <input
                type="text"
                className="w-full text-slate-300 px-4 py-2 text-sm font-normal bg-slate-800"
                placeholder="Search..."
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value)
                }}
              />
            }
            <div className={classNames("overflow-y-auto", menuClassName)}>
              {filteredOptions.map((option, index) => (
                <Menu.Item key={index}>
                  {({ active }) => (
                    <button
                      onClick={(event) => {
                        onChange(option)
                        setFilter('');
                      }}
                      className={classNames(
                        active ? 'bg-slate-400 text-blue-100' : 'text-slate-300',
                        'block w-full px-4 py-2 text-left text-sm'
                      )}
                    >
                      {option}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>
          </div>
        </Menu.Items>
         </div>,
        portalMountNode
        )}
      </Transition>
    </Menu>
  );
};

export default Dropdown;