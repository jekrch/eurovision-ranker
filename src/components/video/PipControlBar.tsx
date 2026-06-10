import React from 'react';
import {
    FaChevronLeft,
    FaChevronRight,
    FaExpand,
    FaInfinity,
    FaTimes,
} from 'react-icons/fa';

interface PipControlBarProps {
    autoContinue: boolean;
    onBarPointerDown: (e: React.PointerEvent) => void;
    navigate: (dir: 1 | -1) => void;
    toggleAutoContinue: () => void;
    expand: () => void;
    closePip: () => void;
}

/**
 * The floating pip's control bar — prev/next, auto-continue toggle, expand, and
 * close. It sits just below the pip video (outside the clipped video box so it
 * can extend past the bottom edge) and doubles as the drag handle.
 */
const PipControlBar: React.FC<PipControlBarProps> = ({
    autoContinue,
    onBarPointerDown,
    navigate,
    toggleAutoContinue,
    expand,
    closePip,
}) => {
    return (
        <div
            onPointerDown={onBarPointerDown}
            title="Drag to move"
            style={{ touchAction: 'none' }}
            className="absolute inset-x-0 top-full mt-1 flex cursor-grab select-none items-center gap-0.5 rounded-md bg-black/85 px-1 py-1 text-white/90 shadow-lg active:cursor-grabbing"
        >
            <button
                type="button"
                aria-label="Previous video"
                title="Previous"
                onClick={() => navigate(-1)}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white"
            >
                <FaChevronLeft className="text-xs" />
            </button>
            <button
                type="button"
                aria-label="Next video"
                title="Next"
                onClick={() => navigate(1)}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white ml-2"
            >
                <FaChevronRight className="text-xs" />
            </button>
            <button
                type="button"
                aria-label="Autoplay next video"
                aria-pressed={autoContinue}
                title={
                    autoContinue
                        ? 'Auto-continue on'
                        : 'Auto-continue to next video'
                }
                onClick={toggleAutoContinue}
                className={`flex h-7 items-center gap-1 rounded px-1.5 ml-3 text-[0.65rem] font-semibold uppercase tracking-wide ${
                    autoContinue
                        ? 'bg-white/90 text-black'
                        : 'text-white/80 hover:bg-white/15 hover:text-white'
                }`}
            >
                <FaInfinity className="text-xs" />
                Auto
            </button>

            <div className="flex-1" />

            <button
                type="button"
                aria-label="Return to tab"
                title="Return to tab"
                onClick={expand}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white mr-3"
            >
                <FaExpand className="text-xs" />
            </button>
            <button
                type="button"
                aria-label="Close video"
                title="Close"
                onClick={closePip}
                className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15 hover:text-white"
            >
                <FaTimes className="text-sm" />
            </button>
        </div>
    );
};

export default PipControlBar;
