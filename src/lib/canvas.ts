/**
 * The pixel density the mode canvases draw at: the screen's own, but never more than 2. They cover
 * the whole window, and a 3x phone would otherwise draw 9 times the pixels of a 1x screen for
 * particles and thread that look the same at 2x.
 */
export const pixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);
