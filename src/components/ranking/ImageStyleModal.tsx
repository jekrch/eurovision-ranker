import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faSpinner } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import { toast } from 'react-hot-toast';
import { AppState } from '../../redux/store';
import { useAppSelector } from '../../hooks/stateHooks';
import {
  createModernRankingCanvas,
  createRankingCanvas,
  downloadRankingImage,
  RankingImageStyle,
} from '../../utilities/CanvasGeneratorUtil';

interface ImageStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Lets the user choose between the new "Modern" image style (default) and the
 * original "Classic" style before downloading a picture of their ranking.
 * Renders a live preview of the selected style.
 */
const ImageStyleModal: React.FC<ImageStyleModalProps> = ({ isOpen, onClose }) => {
  const [style, setStyle] = useState<RankingImageStyle>('modern');
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const rankingName = useAppSelector((state: AppState) => state.name);

  // render a live preview of the currently selected style
  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      if (!isOpen || !containerRef || rankedItems.length === 0) return;
      setIsRendering(true);
      try {
        const canvas = style === 'modern'
          ? await createModernRankingCanvas(rankedItems, rankingName)
          : await createRankingCanvas(rankedItems, rankingName);

        if (cancelled) return;
        canvas.style.width = '100%';
        canvas.style.height = 'auto';
        canvas.style.borderRadius = '12px';
        containerRef.innerHTML = '';
        containerRef.appendChild(canvas);
      } catch (err) {
        console.error('Error rendering preview:', err);
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    render();
    return () => { cancelled = true; };
  }, [isOpen, containerRef, style, rankedItems, rankingName]);

  // close on escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const handleDownload = useCallback(async () => {
    if (rankedItems.length === 0) {
      toast.error('Please rank some countries first');
      return;
    }
    setIsDownloading(true);
    try {
      await downloadRankingImage(rankedItems, rankingName, {}, {}, style);
      onClose();
    } catch (error) {
      console.error('Error during download:', error);
      toast.error('Failed to create image');
    } finally {
      setIsDownloading(false);
    }
  }, [rankedItems, rankingName, style, onClose]);

  if (!isOpen) return null;

  const styleOption = (value: RankingImageStyle, label: string) => (
    <button
      type="button"
      onClick={() => setStyle(value)}
      className={classNames(
        'flex-1 text-center rounded-xl border px-4 py-3 font-semibold transition-all duration-150',
        style === value
          ? 'border-[var(--er-interactive-primary)] bg-[var(--er-surface-tertiary)] text-white ring-2 ring-[var(--er-interactive-primary)]/40'
          : 'border-[var(--er-border-subtle)] bg-[var(--er-surface-dark)] text-[var(--er-text-secondary)] hover:border-[var(--er-border-tertiary)]'
      )}
    >
      {label}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--er-surface-dark)] border border-[var(--er-border-subtle)] rounded-lg w-full max-w-lg max-h-screen overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--er-border-subtle)] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Download image</h2>
          <button
            onClick={onClose}
            className="text-[var(--er-text-tertiary)] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          <p className="text-sm text-[var(--er-text-secondary)] mb-3">Choose a style</p>
          <div className="flex gap-3 mb-4">
            {styleOption('modern', 'Modern')}
            {styleOption('classic', 'Classic')}
          </div>

          {/* Preview */}
          <div className="border border-[var(--er-border-subtle)] rounded-lg p-3 bg-black/20 relative h-[55vh] overflow-auto">
            {rankedItems.length === 0 ? (
              <div className="text-[var(--er-text-tertiary)] text-center py-8">
                Please rank some countries to see a preview
              </div>
            ) : (
              <>
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10 rounded-lg">
                    <FontAwesomeIcon icon={faSpinner} spin className="text-white text-2xl" />
                  </div>
                )}
                <div ref={setContainerRef} className="w-full" />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--er-border-subtle)] flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm text-[var(--er-text-secondary)] hover:text-white hover:bg-[var(--er-surface-tertiary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading || rankedItems.length === 0}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[var(--er-interactive-primary)] hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={isDownloading ? faSpinner : faDownload} spin={isDownloading} />
            Download
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ImageStyleModal;
