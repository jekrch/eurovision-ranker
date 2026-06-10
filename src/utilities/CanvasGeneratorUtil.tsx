/*
  Barrel for the ranking-image canvas generators. The implementation is split by
  concern under `utilities/canvas/`:

    - canvasTypes       — shared config/color/style types
    - canvasTheme       — CSS-variable + country color helpers
    - canvasAssets      — async flag image / font loading
    - canvasPrimitives  — pure drawing/measurement helpers
    - classicCanvas     — the "classic" two-column card style
    - modernCanvas      — the scoreboard-inspired "modern" style
    - downloadRankingImage — picks a style and triggers the PNG download

  This module preserves the original public surface so existing imports (and the
  dynamic `import()` in CanvasDevModal) resolve unchanged.
*/

export type { RankingCanvasConfig, RankingColors, RankingImageStyle } from './canvas/canvasTypes';
export { createRankingCanvas } from './canvas/classicCanvas';
export { createModernRankingCanvas } from './canvas/modernCanvas';
export { downloadRankingImage } from './canvas/downloadRankingImage';
