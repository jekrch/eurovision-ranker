import React, { useState, useCallback, useEffect } from 'react';
import { AppState } from '../../redux/store';
import { useAppSelector } from '../../hooks/stateHooks';
import { RankingCanvasConfig } from '../../utilities/CanvasGeneratorUtil';

/**
 * Canvas Development Modal Component
 * 
 * A modal dialog containing canvas preview tools.
 * Uses the existing rankedItems data from state.
 */
const CanvasDevModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const showPlace = useAppSelector((state: AppState) => state.showPlace);
  const vote = useAppSelector((state: AppState) => state.vote);
  
  // Get existing data from Redux store
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const rankingName = useAppSelector((state: AppState) => state.name);
  
  let customConfig: Partial<RankingCanvasConfig>  = {};

  // Import canvas utilities dynamically to avoid loading them when not in use
  const [canvasUtils, setCanvasUtils] = useState<any>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Dynamically import the canvas utilities
      import('../../utilities/CanvasGeneratorUtil').then(module => {
        setCanvasUtils(module);
      });
    }
  }, [isOpen]);
  
  // Force refresh the preview
  const handleRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);
  
  // Render the canvas preview
  useEffect(() => {
    const renderPreview = async () => {
      if (!containerRef || !canvasUtils || rankedItems.length === 0) return;
      
      try {
        // Clear previous content
        containerRef.innerHTML = '';
        setError(null);
        
        // Generate new canvas
        const canvas = await canvasUtils.createRankingCanvas(
          rankedItems, 
          rankingName,
          customConfig
        );
        
        // Display the canvas
        containerRef.appendChild(canvas);
      } catch (err) {
        console.error('Error rendering preview:', err);
        setError(err instanceof Error ? err.message : 'Unknown error rendering preview');
      }
    };
    
    if (isOpen && canvasUtils) {
      renderPreview();
    }
  }, [canvasUtils, containerRef, rankedItems, rankingName, refreshKey, isOpen]);
  
   // Handle escape key to close modal
   useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-[var(--er-surface-dark)] border border-[var(--er-border-subtle)] rounded-lg w-full max-w-6xl max-h-screen overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 border-b border-[var(--er-border-subtle)] flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Canvas Development Tools</h2>
          <button 
            onClick={onClose}
            className="text-[var(--er-text-tertiary)] hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4">
          {/* Controls */}
          <div className="mb-4 border border-[var(--er-border-tertiary)] rounded bg-[var(--er-surface-dark)] bg-opacity-30 p-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[var(--er-text-secondary)] font-medium">Canvas Preview Controls</h3>
              <button 
                onClick={handleRefresh}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Refresh Canvas
              </button>
            </div>
          </div>
          
          {/* Canvas Preview */}
          <div className="border border-[var(--er-border-subtle)] rounded-lg p-4 mb-4">
            <h3 className="text-lg text-white font-semibold mb-4">Canvas Preview</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-300">
                <p className="font-bold">Rendering Error:</p>
                <pre className="text-sm overflow-auto">{error}</pre>
              </div>
            )}
            
            {rankedItems.length === 0 ? (
              <div className="text-[var(--er-text-tertiary)] text-center py-8">
                Please rank some countries to see the preview
              </div>
            ) : (
              <div 
                ref={setContainerRef} 
                className="w-full"
                style={{ 
                  minHeight: '200px',
                  maxHeight: '70vh',
                  overflow: 'auto'
                }}
              />
            )}
          </div>
          
        </div>
      
      </div>
    </div>
  );
};

export default CanvasDevModal;