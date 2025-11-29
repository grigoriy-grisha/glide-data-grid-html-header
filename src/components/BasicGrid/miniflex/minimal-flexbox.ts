// minimal-flexbox.ts – single‑file flexbox engine with direction, gap, nesting & alignment
// -------------------------------------------------------------
// Public API summary
//   • new RootFlexBox(width, height, options?)
//       options = { direction, columnGap, rowGap, justifyContent, alignItems, wrap, alignContent }
//   • root.addChild(style?)                 // add leaf element
//   • root.addChild(childBox, style?)       // nest another flex container
//   • root.build()                          // compute the layout
//   • Every element (leaf or container) exposes `.position` & `.size`
// -------------------------------------------------------------

import type {
  FlexStyle,
  Size,
  Position,
  Direction,
  Justify,
  Align,
  AlignContent,
  FlexBoxOptions,
} from "./types"

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Reusable Objects
// ─────────────────────────────────────────────────────────────────────────────

const defaultStyle: FlexStyle = {
  flexGrow: 0,
  flexShrink: 1,
  flexBasis: 0,
  alignSelf: "auto",
  width: undefined,
  height: undefined,
}

export interface PaddingBox {
  top: number
  right: number
  bottom: number
  left: number
}

const ZERO_PADDING: PaddingBox = { top: 0, right: 0, bottom: 0, left: 0 }

// ─────────────────────────────────────────────────────────────────────────────
// Core Classes
// ─────────────────────────────────────────────────────────────────────────────

abstract class FlexNode {
  id?: string
  metadata?: unknown
  /** Computed layout values */
  public readonly size: Size = { width: 0, height: 0 }
  public readonly position: Position = { x: 0, y: 0 }
  /** Incoming flex style (grow / shrink / basis / alignSelf) */
  public style: FlexStyle

  constructor(style: Partial<FlexStyle> = {}) {
    // Inline object creation instead of spread
    this.style = {
      flexGrow: style.flexGrow ?? defaultStyle.flexGrow,
      flexShrink: style.flexShrink ?? defaultStyle.flexShrink,
      flexBasis: style.flexBasis ?? defaultStyle.flexBasis,
      alignSelf: style.alignSelf ?? defaultStyle.alignSelf,
      width: style.width,
      height: style.height,
      id: style.id,
      metadata: style.metadata,
    }
    this.id = style.id
    this.metadata = style.metadata
  }

  /** Recursively lay out the subtree. */
  abstract build(): void
}

// --- Leaf element -------------------------------------------
export class FlexElement extends FlexNode {
  build(): void {
    /* nothing to recurse into */
  }
}

export class FlexBox extends FlexNode {
  public readonly children: FlexNode[] = []

  // Container‑level layout options (with sensible defaults)
  public direction: Direction = "row"
  public wrap: "nowrap" | "wrap" | "wrap-reverse" = "nowrap"
  public columnGap = 0
  public rowGap = 0
  public justifyContent: Justify = "flex-start"
  public alignItems: Align = "stretch"
  public alignContent: AlignContent = "stretch"
  public padding: PaddingBox = { top: 0, right: 0, bottom: 0, left: 0 }

  constructor(width: number, height: number, opts: FlexBoxOptions = {}) {
    super({})
    this.size.width = width
    this.size.height = height
    this.id = opts.id

    // Inline property assignment instead of Object.assign
    if (opts.direction !== undefined) this.direction = opts.direction
    if (opts.wrap !== undefined) this.wrap = opts.wrap
    if (opts.columnGap !== undefined) this.columnGap = opts.columnGap
    if (opts.rowGap !== undefined) this.rowGap = opts.rowGap
    if (opts.justifyContent !== undefined) this.justifyContent = opts.justifyContent
    if (opts.alignItems !== undefined) this.alignItems = opts.alignItems
    if (opts.alignContent !== undefined) this.alignContent = opts.alignContent

    this.padding = resolvePaddingBox(opts.padding)
  }

  /**
   * addChild(style?) → FlexElement        (leaf)
   * addChild(childBox, style?) → FlexBox  (nest another container)
   */
  addChild(style: Partial<FlexStyle>): FlexElement
  addChild(box: FlexBox, style?: Partial<FlexStyle>): FlexBox
  addChild(arg1: any, arg2?: any): any {
    if (arg1 instanceof FlexBox) {
      const box = arg1 as FlexBox
      if (arg2) {
        // Inline style merge
        box.style.flexGrow = arg2.flexGrow ?? defaultStyle.flexGrow
        box.style.flexShrink = arg2.flexShrink ?? defaultStyle.flexShrink
        box.style.flexBasis = arg2.flexBasis ?? defaultStyle.flexBasis
        box.style.alignSelf = arg2.alignSelf ?? defaultStyle.alignSelf
        box.style.width = arg2.width
        box.style.height = arg2.height
      }
      this.children.push(box)
      return box
    }
    const elem = new FlexElement(arg1 as Partial<FlexStyle>)
    this.children.push(elem)
    return elem
  }

  // --------------- Layout algorithm ------------------------
  build(): void {
    const children = this.children
    const childCount = children.length

    if (childCount === 0) {
      return
    }

    // Inline axis resolution
    const dir = this.direction
    const horizontal = dir === "row" || dir === "row-reverse"
    const mainProp: keyof Size = horizontal ? "width" : "height"
    const crossProp: keyof Size = horizontal ? "height" : "width"
    const mainGap = horizontal ? this.columnGap : this.rowGap
    const crossGap = horizontal ? this.rowGap : this.columnGap

    // Get inner container size
    const padding = this.padding
    const paddingMain = horizontal
      ? padding.left + padding.right
      : padding.top + padding.bottom
    const paddingCross = horizontal
      ? padding.top + padding.bottom
      : padding.left + padding.right

    const containerMain = this.size[mainProp] - paddingMain
    const containerCross = this.size[crossProp] - paddingCross

    // Build flex lines
    const wrap = this.wrap
    let lines: FlexNode[][]

    if (wrap === "nowrap") {
      lines = [children]
    } else {
      lines = []
      let currentLine: FlexNode[] = []
      let currentMainSize = 0

      for (let i = 0; i < childCount; i++) {
        const child = children[i]
        const childBasis = child.style.flexBasis
        const gap = currentLine.length > 0 ? mainGap : 0
        const exceeds = currentLine.length > 0 && currentMainSize + gap + childBasis > containerMain

        if (exceeds) {
          lines.push(currentLine)
          currentLine = []
          currentMainSize = 0
        }

        currentLine.push(child)
        currentMainSize += (currentLine.length > 1 ? mainGap : 0) + childBasis
      }

      if (currentLine.length > 0) {
        lines.push(currentLine)
      }

      if (wrap === "wrap-reverse") {
        lines.reverse()
      }
    }

    const lineCount = lines.length
    if (lineCount === 0) {
      return
    }

    // Measure line cross sizes
    const lineHeights: number[] = new Array(lineCount)
    let totalCross = 0

    for (let li = 0; li < lineCount; li++) {
      const line = lines[li]
      const lineLen = line.length
      let maxCross = 0

      for (let ci = 0; ci < lineLen; ci++) {
        const child = line[ci]
        const explicit = horizontal ? child.style.height : child.style.width
        const cross = explicit !== undefined ? explicit : child.size[crossProp]
        if (cross > maxCross) maxCross = cross
      }

      lineHeights[li] = maxCross
      totalCross += maxCross
    }

    // Resolve cross axis layout
    const crossGapTotal = crossGap * (lineCount > 1 ? lineCount - 1 : 0)
    let availableCross = containerCross - totalCross - crossGapTotal

    let crossStart = 0
    let crossBetween = crossGap

    if (wrap === "nowrap" && lineCount === 1) {
      lineHeights[0] = containerCross
    } else if (wrap !== "nowrap") {
      const alignContent = this.alignContent
      switch (alignContent) {
        case "flex-end":
          crossStart = availableCross
          break
        case "center":
          crossStart = availableCross / 2
          break
        case "space-between":
          crossBetween = lineCount > 1 ? crossGap + availableCross / (lineCount - 1) : 0
          break
        case "space-around":
          crossBetween = crossGap + availableCross / lineCount
          crossStart = crossBetween / 2
          break
        case "space-evenly":
          crossBetween = crossGap + availableCross / (lineCount + 1)
          crossStart = crossBetween
          break
        case "stretch":
          if (availableCross > 0) {
            const extra = availableCross / lineCount
            for (let i = 0; i < lineCount; i++) {
              lineHeights[i] += extra
            }
          }
          break
      }
    }

    const offsetX = padding.left
    const offsetY = padding.top
    let currentCrossPos = crossStart
    const isReverse = dir === "row-reverse" || dir === "column-reverse"
    const alignItems = this.alignItems
    const justifyContent = this.justifyContent

    for (let li = 0; li < lineCount; li++) {
      const line = lines[li]
      const lineLen = line.length
      if (lineLen === 0) continue

      // Distribute main axis sizes
      let totalBasis = 0
      let totalGrow = 0
      let totalWeightedShrink = 0

      for (let ci = 0; ci < lineLen; ci++) {
        const style = line[ci].style
        totalBasis += style.flexBasis
        totalGrow += style.flexGrow
        totalWeightedShrink += style.flexShrink * style.flexBasis
      }

      const lineGapSum = mainGap * (lineLen > 1 ? lineLen - 1 : 0)
      const lineFreeSpace = containerMain - totalBasis - lineGapSum
      let lineMainUsed = 0

      for (let ci = 0; ci < lineLen; ci++) {
        const child = line[ci]
        const style = child.style
        let main = style.flexBasis

        if (lineFreeSpace > 0 && totalGrow > 0) {
          main += (lineFreeSpace * style.flexGrow) / totalGrow
        } else if (lineFreeSpace < 0 && totalWeightedShrink > 0) {
          main += (lineFreeSpace * style.flexShrink * style.flexBasis) / totalWeightedShrink
        }

        if (main < 0) main = 0
        child.size[mainProp] = main
        lineMainUsed += main
      }

      // Calculate justify spacing
      let leading = 0
      let between = mainGap

      if (totalGrow === 0) {
        let justifySpace = containerMain - lineMainUsed - lineGapSum
        if (justifySpace < 0) justifySpace = 0

        switch (justifyContent) {
          case "flex-end":
            leading = justifySpace
            break
          case "center":
            leading = justifySpace / 2
            break
          case "space-between":
            between = lineLen > 1 ? mainGap + justifySpace / (lineLen - 1) : 0
            break
          case "space-around":
            between = mainGap + justifySpace / lineLen
            leading = between / 2
            break
          case "space-evenly":
            between = mainGap + justifySpace / (lineLen + 1)
            leading = between
            break
        }
      }

      // Finalize line height for nowrap
      let finalLineHeight = lineHeights[li]
      if (wrap === "nowrap") {
        for (let ci = 0; ci < lineLen; ci++) {
          const child = line[ci]
          const explicit = horizontal ? child.style.height : child.style.width
          const cross = explicit !== undefined ? explicit : child.size[crossProp]
          if (cross > finalLineHeight) finalLineHeight = cross
        }
      }

      // Position children
      let mainCursor = leading
      const startIdx = isReverse ? lineLen - 1 : 0
      const endIdx = isReverse ? -1 : lineLen
      const step = isReverse ? -1 : 1

      for (let ci = startIdx; ci !== endIdx; ci += step) {
        const child = line[ci]

        // Main axis position
        if (horizontal) {
          const x = dir === "row"
            ? mainCursor
            : containerMain - mainCursor - child.size.width
          child.position.x = offsetX + x
        } else {
          const y = dir === "column"
            ? mainCursor
            : containerMain - mainCursor - child.size.height
          child.position.y = offsetY + y
        }

        // Cross axis alignment
        const alignSelf = child.style.alignSelf !== "auto"
          ? (child.style.alignSelf as Align)
          : alignItems

        const explicitCross = horizontal ? child.style.height : child.style.width
        if (explicitCross !== undefined) {
          child.size[crossProp] = explicitCross
        } else if (alignSelf === "stretch") {
          child.size[crossProp] = finalLineHeight
        }

        let crossOffset = 0
        switch (alignSelf) {
          case "flex-end":
            crossOffset = finalLineHeight - child.size[crossProp]
            break
          case "center":
            crossOffset = (finalLineHeight - child.size[crossProp]) / 2
            break
        }

        if (horizontal) {
          child.position.y = offsetY + currentCrossPos + crossOffset
        } else {
          child.position.x = offsetX + currentCrossPos + crossOffset
        }

        mainCursor += child.size[mainProp] + between
      }

      currentCrossPos += finalLineHeight + crossBetween
    }

    // Recursively build nested containers
    for (let i = 0; i < childCount; i++) {
      const child = children[i]
      if (child instanceof FlexBox) {
        child.build()
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

export function resolvePaddingBox(padding?: FlexBoxOptions["padding"]): PaddingBox {
  if (padding === undefined) {
    return ZERO_PADDING
  }
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }
  return {
    top: padding.top ?? 0,
    right: padding.right ?? 0,
    bottom: padding.bottom ?? 0,
    left: padding.left ?? 0,
  }
}

// Export types for external use
export type {
  FlexStyle,
  Size,
  Position,
  Direction,
  Justify,
  Align,
  AlignContent,
  FlexBoxOptions,
} from "./types"

// Root container (same as FlexBox but semantically distinct)
export class RootFlexBox extends FlexBox {
  constructor(width: number, height: number, opts: FlexBoxOptions = {}) {
    super(width, height, opts)
  }

  getLayout(): Record<string, { position: Position; size: Size }> {
    this.build()
    const layoutMap: Record<string, { position: Position; size: Size }> = {}
    this._collectLayout(this, layoutMap, { counter: 0 })
    return layoutMap
  }

  private _collectLayout(
    box: FlexBox,
    map: Record<string, { position: Position; size: Size }>,
    counterRef: { counter: number },
  ): void {
    const children = box.children
    const len = children.length
    for (let i = 0; i < len; i++) {
      const child = children[i]
      const id = child.id ?? `_$$${counterRef.counter++}`
      map[id] = { position: child.position, size: child.size }
      if (child instanceof FlexBox) {
        this._collectLayout(child, map, counterRef)
      }
    }
  }
}
