import { createElement, type ReactElement } from 'react'
import { renderToString } from 'react-dom/server'
import { IconSortAlphabetAsc, IconSortAlphabetDesc, IconSettingsFilter, IconDrag } from '@salutejs/plasma-icons'

// ─────────────────────────────────────────────────────────────────────────────
// SVG Extraction
// ─────────────────────────────────────────────────────────────────────────────

const SVG_REGEX = /<svg[\s\S]*?<\/svg>/

function extractSvgFromElement(element: ReactElement): string {
  const rendered = renderToString(element)
  const match = rendered.match(SVG_REGEX)
  return match ? match[0] : ''
}

// ─────────────────────────────────────────────────────────────────────────────
// Icon SVGs
// ─────────────────────────────────────────────────────────────────────────────

export const GRIP_ICON_SVG = extractSvgFromElement(createElement(IconDrag))
export const SORT_ASC_ICON = extractSvgFromElement(createElement(IconSortAlphabetAsc))
export const SORT_DESC_ICON = extractSvgFromElement(createElement(IconSortAlphabetDesc))
export const SORT_DEFAULT_ICON = extractSvgFromElement(createElement(IconSettingsFilter))

