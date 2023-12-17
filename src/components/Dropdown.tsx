import React from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import classNames from 'classnames';

type DropdownProps = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
};

const Dropdown: React.FC<DropdownProps> = ({ value, onChange, options }) => {
  return (
    <Menu as="div" className="relative inline-block text-left w-[5em]">
      <div>
        <Menu.Button className="inline-flex w-full justify-center gap-x-1.5 rounded-md bg-slate-200 px-3 py-2 text-sm font-bold text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-slate-100">
          {value}
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={React.Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute left-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1 bg-slate-100">
            {options.map((option, index) => (
              <Menu.Item key={index}>
                {({ active }) => (
                  <button
                    onClick={() => onChange(option)}
                    className={classNames(
                      active ? 'bg-slate-200 text-gray-900' : 'text-slate-700',
                      'block w-full px-4 py-2 text-left text-sm'
                    )}
                  >
                    {option}
                  </button>
                )}
              </Menu.Item>
            ))}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default Dropdown;