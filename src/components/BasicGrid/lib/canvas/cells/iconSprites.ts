/**
 * Icon Sprite Management
 *
 * This file re-exports everything from the iconSprites/ directory.
 * For a modular structure, see the iconSprites/ directory with:
 *
 * - types.ts           - Type definitions
 * - utils.ts           - Helper functions (getDpr, hashString, createSvgDataUrl)
 * - IconSpriteManager.ts - Main class for icon sprite management
 * - index.ts           - Exports and backward-compatible API
 *
 * @example Using the class directly:
 * ```ts
 * import { IconSpriteManager } from './iconSprites'
 * 
 * const manager = new IconSpriteManager()
 * manager.register({ edit: '<svg>...</svg>' })
 * const sprite = manager.getSprite('edit', 16, '#333')
 * ```
 *
 * @example Using the legacy functions:
 * ```ts
 * import { registerIconDefinitions, getIconSprite } from './iconSprites'
 * 
 * registerIconDefinitions({ edit: '<svg>...</svg>' })
 * const sprite = getIconSprite('edit', 16, '#333')
 * ```
 */

export * from './iconSprites/index'
