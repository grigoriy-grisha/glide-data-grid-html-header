/**
 * Canvas Cell Renderer
 *
 * This file re-exports everything from the renderer/ directory.
 * For a modular structure, see the renderer/ directory with:
 *
 * - types.ts            - Type definitions (RendererDrawArgs, RendererClickArgs, etc.)
 * - constants.ts        - Constants (POINTER_CANDIDATE_KEYS, cursors)
 * - pointerUtils.ts     - Pointer position utilities
 * - clickHandlers.ts    - Click handling functions
 * - hoverHandlers.ts    - Hover handling functions
 * - canvasCellRenderer.ts - Main renderer configuration
 */

export * from './renderer/index'
