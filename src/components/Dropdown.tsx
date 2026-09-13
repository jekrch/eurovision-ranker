import { faCheck, faChevronDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import classNames from 'classnames';
import React, { useEffect, useState } from 'react';

type DropdownProps = {
  className?: string;
  menuClassName?: string;
  buttonClassName?: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  showSearch?: boolean;
  openUpwards?: boolean;
  mini?: boolean;
};

type SearchFieldProps = {
  filter: string;
  setFilter: (filter: string) => void;
};

/**
 * Filter input for the open menu. Clears itself when the menu closes so the
 * next open always starts from the full option list.
 *
 * It spans the scroll container edge to edge and supplies its own padding, so
 * it needs no negative margins to escape a padded parent. That matters for the
 * sticky pin: sticky offsets are resolved against the margin box, so a negative
 * top margin would hold the header that far below the top of the scrollport and
 * leave a gap for options to scroll through.
 */
const SearchField: React.FC<SearchFieldProps> = ({ filter, setFilter }) => {
  useEffect(() => () => setFilter(''), [setFilter]);

  return (
    <div
      className={classNames(
        'sticky top-0 z-10 px-1 pt-1 pb-1',
        'bg-[var(--er-surface-dark)] border-b border-[var(--er-border-subtle)]',
      )}
    >
      <div className="relative">
        <FontAwesomeIcon
          icon={faMagnifyingGlass}
          className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-[var(--er-text-muted)]"
        />
        <input
          type="text"
          aria-label="Search options"
          className={classNames(
            'w-full rounded-md py-1.5 pl-7 pr-2 text-sm font-normal',
            'bg-[color-mix(in_srgb,var(--er-surface-light)_12%,transparent)]',
            'text-[var(--er-text-secondary)] placeholder:text-[var(--er-text-muted)]',
            'outline-none ring-1 ring-inset ring-transparent',
            'focus:ring-[var(--er-focus-ring)] transition-[box-shadow] duration-150',
          )}
          placeholder="Search..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={(e) => {
            // let the menu keep handling navigation keys, but keep typing
            // (including its type-ahead) inside the input
            if (!['ArrowDown', 'ArrowUp', 'Enter', 'Escape', 'Tab'].includes(e.key)) {
              e.stopPropagation();
            }
          }}
        />
      </div>
    </div>
  );
};

/** enter is the showier half; the close gets out of the way quickly */
const ENTER_MS = 150;
const LEAVE_MS = 100;

type MenuPanelProps = {
  open: boolean;
  openUpwards?: boolean;
  children: React.ReactNode;
};

/**
 * The menu panel, with its own enter/leave animation.
 *
 * Headless UI's `transition` prop can't be used for this. While a menu is
 * closing, Headless UI hides and re-shows the panel whenever it notices the
 * trigger has moved -- and choosing an option re-renders the page underneath
 * the trigger. Each of those flips remounts every item, and the registration
 * effects the remounts fire pile up into "maximum update depth exceeded".
 *
 * Rendering the panel `static` takes that decision away from Headless UI: the
 * panel is shown for exactly as long as we render it, so a trigger that moves
 * mid-close can't disturb it.
 */
const MenuPanel: React.FC<MenuPanelProps> = ({ open, openUpwards, children }) => {
  const [closing, setClosing] = useState(false);
  const [shown, setShown] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);

  // react to opening and closing here rather than in an effect: an effect lands
  // a render too late, so the panel would unmount before it could animate out,
  // and remount already closed with nothing to animate from
  if (wasOpen !== open) {
    setWasOpen(open);
    setClosing(wasOpen && !open);

    if (!open) {
      setShown(false);
    }
  }

  // hold the closed panel for the length of the leave animation
  useEffect(() => {
    if (!closing) {
      return;
    }

    const timeout = setTimeout(() => setClosing(false), LEAVE_MS);

    return () => clearTimeout(timeout);
  }, [closing]);

  // the panel mounts closed; animate it open on the next frame
  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = requestAnimationFrame(() => setShown(true));

    return () => cancelAnimationFrame(frame);
  }, [open]);

  if (!open && !closing) {
    return null;
  }

  return (
    <MenuItems
      static
      // `modal` would lock document scrolling and pad away the scrollbar while
      // the menu is open. this app does its own scroll locking (see
      // `useScrollLock`), which is built to leave these menus alone.
      modal={false}
      anchor={{ to: openUpwards ? 'top start' : 'bottom start', gap: 6, padding: 8 }}
      style={{ transitionDuration: `${shown ? ENTER_MS : LEAVE_MS}ms` }}
      className={classNames(
        'dropdown-menu z-[1000] flex w-max flex-col',
        // `--button-width` is published by headless ui on the anchored panel
        'min-w-[min(var(--button-width),85vw)] max-w-[min(20rem,85vw)]',
        '[--anchor-max-height:19rem] rounded-xl focus:outline-none',
        // headless ui anchors the panel by writing `overflow: auto` straight
        // onto this element, which would make the rounded panel its own scroll
        // container -- and browsers paint scrollbars square, so the bar spills
        // past the corner curve. hold the scrolling in the child below and let
        // this rounded box clip it instead (hence the `!` over that inline
        // style).
        '!overflow-hidden',
        'border border-[var(--er-border-tertiary)] bg-[var(--er-surface-dark)]',
        'shadow-[0_14px_36px_-10px_rgba(0,0,0,0.65)] ring-1 ring-black/5',
        // the menu grows out of the corner it's anchored to, so the scale never
        // drags its edges sideways. `data-anchor` carries the placement headless
        // ui actually resolved, which is what flips when the menu has to open
        // against its preferred side.
        'origin-top-left data-[anchor~=top]:origin-bottom-left',
        'transition motion-reduce:transition-none',
        shown
          ? 'translate-y-0 scale-100 opacity-100 ease-out'
          : 'pointer-events-none -translate-y-1 scale-95 opacity-0 ease-in data-[anchor~=top]:translate-y-1',
      )}
    >
      <div className="custom-scrollbar min-h-0 overflow-y-auto">{children}</div>
    </MenuItems>
  );
};

const Dropdown: React.FC<DropdownProps> = ({
  value,
  onChange,
  options,
  className,
  menuClassName,
  showSearch,
  buttonClassName,
  openUpwards,
  mini,
}) => {
  const [filter, setFilter] = useState('');

  const filteredOptions = options.filter((option) =>
    filter?.length ? option.toLowerCase().includes(filter.toLowerCase()) : true,
  );

  return (
    <Menu as="div" className={classNames('relative inline-block text-left z-40', className)}>
      {({ open }) => (
        <>
          <MenuButton
            className={classNames(
              'group inline-flex h-[2em] w-full items-center justify-between gap-x-1.5',
              'rounded-lg px-3 py-[0.2em] text-sm font-bold',
              'border border-[var(--er-border-tertiary)] text-[var(--er-text-subtle)]',
              'shadow-sm ease-out duration-150',
              // only the properties that actually change are transitioned. with
              // `transition-all` the focus ring is a box-shadow too, so it fades
              // in and out on every open/close instead of simply being there.
              'transition-[color,background-color,border-color]',
              'hover:border-[var(--er-border-secondary)] hover:text-[var(--er-text-secondary)]',
              // headless ui reports keyboard focus as `data-focus`; the native
              // `:focus-visible` also matches when the menu hands focus back to
              // the trigger on close, which flashes the ring after a mouse click
              'focus:outline-none data-[focus]:ring-2 data-[focus]:ring-[var(--er-focus-ring)]',
              'motion-reduce:transition-none',
              open
                ? 'bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_60%,transparent)] border-[var(--er-border-secondary)] text-[var(--er-text-secondary)]'
                : 'bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_25%,transparent)] hover:bg-[color-mix(in_srgb,var(--er-button-neutral-hover)_45%,transparent)]',
              buttonClassName,
            )}
          >
            <span className="truncate min-h-[1.2em] inline-block" title={value || undefined}>
              {value || ' '}
            </span>
            {!mini && (
              <FontAwesomeIcon
                className={classNames(
                  'h-[0.8em] w-4 flex-shrink-0 transition-transform duration-200 ease-out',
                  'motion-reduce:transition-none',
                  open && 'rotate-180',
                )}
                icon={faChevronDown}
              />
            )}
          </MenuButton>

          <MenuPanel open={open} openUpwards={openUpwards}>
            {showSearch && <SearchField filter={filter} setFilter={setFilter} />}

            <div className={classNames('p-1', menuClassName)}>
              {filteredOptions.map((option) => (
                <MenuItem key={option}>
                  {({ focus }) => (
                    <button
                      onClick={() => {
                        onChange(option);
                        setFilter('');
                      }}
                      className={classNames(
                        'flex w-full items-center gap-2 rounded-md px-3 py-1.5 text-left text-sm',
                        'transition-colors duration-100 motion-reduce:transition-none',
                        focus
                          ? 'bg-[color-mix(in_srgb,var(--er-surface-light)_30%,transparent)] text-[var(--er-interactive-text-light)]'
                          : 'text-[var(--er-text-secondary)]',
                      )}
                    >
                      {!mini && (
                        <FontAwesomeIcon
                          icon={faCheck}
                          className={classNames(
                            'h-3 w-3 flex-shrink-0 text-[var(--er-accent-blue)] transition-opacity duration-150',
                            'motion-reduce:transition-none',
                            option === value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                      )}
                      <span className="truncate">{option}</span>
                    </button>
                  )}
                </MenuItem>
              ))}

              {!filteredOptions.length && (
                <div className="px-3 py-2 text-sm italic text-[var(--er-text-muted)]">
                  No matches
                </div>
              )}
            </div>
          </MenuPanel>
        </>
      )}
    </Menu>
  );
};

export default Dropdown;
