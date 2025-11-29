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

interface AxisSnapshot {
  horizontal: boolean
  mainProp: keyof Size
  crossProp: keyof Size
  mainGap: number
  crossGap: number
}

// --- Core node ----------------------------------------------
abstract class FlexNode {
  id?: string
  metadata?: unknown
  /** Computed layout values */
  public readonly size: Size = { width: 0, height: 0 }
  public readonly position: Position = { x: 0, y: 0 }
  /** Incoming flex style (grow / shrink / basis / alignSelf) */
  public style: FlexStyle

  constructor(style: Partial<FlexStyle> = {}) {
    this.style = { ...defaultStyle, ...style }
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
  public padding: { top: number; right: number; bottom: number; left: number } = { top: 0, right: 0, bottom: 0, left: 0 }

  constructor(width: number, height: number, opts: FlexBoxOptions = {}) {
    super({})
    // The container’s own box size (root sets this explicitly; nested boxes
    // receive their size from the parent during layout).
    this.size.width = width
    this.size.height = height
    this.id = opts.id
    Object.assign(this, opts)

    this.padding = resolvePaddingBox(opts.padding)
  }

  // --------------- Building the tree -----------------------
  /**
   * addChild(style?) → FlexElement        (leaf)
   * addChild(childBox, style?) → FlexBox  (nest another container)
   */
  addChild(style: Partial<FlexStyle>): FlexElement
  addChild(box: FlexBox, style?: Partial<FlexStyle>): FlexBox
  addChild(arg1: any, arg2?: any): any {
    if (arg1 instanceof FlexBox) {
      const box = arg1 as FlexBox
      if (arg2) box.style = { ...defaultStyle, ...arg2 }
      this.children.push(box)
      return box
    }
    const elem = new FlexElement(arg1 as Partial<FlexStyle>)
    this.children.push(elem)
    return elem
  }

  // --------------- Layout algorithm ------------------------
  build(): void {
    const axis = resolveAxisSnapshot(this)
    const { main: containerMain, cross: containerCross } = getInnerContainerSize(
      this,
      axis,
    )

    const lines = buildFlexLines(this.children, this.wrap, containerMain, axis.mainGap)
    const { lineHeights: baseLineHeights, totalCross } = measureLineCrossSizes(
      lines,
      axis,
    )
    const { lineHeights, crossStart, crossBetween } = resolveCrossAxisLayout(
      this,
      axis,
      baseLineHeights,
      totalCross,
      containerCross,
    )

    const offsetX = this.padding.left
    const offsetY = this.padding.top
    let currentCrossPos = crossStart

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line.length === 0) {
        continue
      }

      const distribution = distributeMainAxisSizes(line, axis, containerMain, axis.mainGap)
      const { leading, between } = resolveJustifySpacing(
        this.justifyContent,
        distribution,
        containerMain,
        axis.mainGap,
        line.length,
      )
      const finalLineHeight = finalizeLineHeight(
        line,
        lineHeights[i],
        axis,
        this.wrap,
      )
      const ordered = this.direction.endsWith("reverse") ? [...line].reverse() : line
      let mainCursor = leading

      for (const child of ordered) {
        if (axis.horizontal) {
          const x =
            this.direction === "row"
              ? mainCursor
              : containerMain - mainCursor - child.size.width
          child.position.x = offsetX + x
        } else {
          const y =
            this.direction === "column"
              ? mainCursor
              : containerMain - mainCursor - child.size.height
          child.position.y = offsetY + y
        }

        const crossOffset = applyChildCrossAlignment(
          child,
          axis,
          finalLineHeight,
          this.alignItems,
        )

        if (axis.horizontal) {
          child.position.y = offsetY + currentCrossPos + crossOffset
        } else {
          child.position.x = offsetX + currentCrossPos + crossOffset
        }

        mainCursor += child.size[axis.mainProp] + between
      }

      currentCrossPos += finalLineHeight + crossBetween
    }

    for (const child of this.children) {
      if (child instanceof FlexBox) {
        child.build()
      }
    }
  }
}

export function resolvePaddingBox(padding?: FlexBoxOptions["padding"]): PaddingBox {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding }
  }

  if (padding) {
    return {
      top: padding.top ?? 0,
      right: padding.right ?? 0,
      bottom: padding.bottom ?? 0,
      left: padding.left ?? 0,
    }
  }

  return { ...ZERO_PADDING }
}

function resolveAxisSnapshot(box: FlexBox): AxisSnapshot {
  const horizontal = box.direction.startsWith("row")
  return {
    horizontal,
    mainProp: horizontal ? "width" : "height",
    crossProp: horizontal ? "height" : "width",
    mainGap: horizontal ? box.columnGap : box.rowGap,
    crossGap: horizontal ? box.rowGap : box.columnGap,
  }
}

function getInnerContainerSize(box: FlexBox, axis: AxisSnapshot): {
  main: number
  cross: number
} {
  const paddingMain = axis.horizontal
    ? box.padding.left + box.padding.right
    : box.padding.top + box.padding.bottom
  const paddingCross = axis.horizontal
    ? box.padding.top + box.padding.bottom
    : box.padding.left + box.padding.right

  return {
    main: Math.max(0, box.size[axis.mainProp] - paddingMain),
    cross: Math.max(0, box.size[axis.crossProp] - paddingCross),
  }
}

function buildFlexLines(
  children: FlexNode[],
  wrap: FlexBox["wrap"],
  containerMain: number,
  mainGap: number,
): FlexNode[][] {
  if (children.length === 0) {
    return []
  }

  if (wrap === "nowrap") {
    return [children.slice()]
  }

  const lines: FlexNode[][] = []
  let currentLine: FlexNode[] = []
  let currentMainSize = 0

  for (const child of children) {
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

  return lines
}

function measureLineCrossSizes(
  lines: FlexNode[][],
  axis: AxisSnapshot,
): { lineHeights: number[]; totalCross: number } {
  const lineHeights: number[] = []
  let totalCross = 0

  for (const line of lines) {
    let maxCross = 0
    for (const child of line) {
      maxCross = Math.max(maxCross, getCrossSize(child, axis))
    }
    lineHeights.push(maxCross)
    totalCross += maxCross
  }

  return { lineHeights, totalCross }
}

function resolveCrossAxisLayout(
  box: FlexBox,
  axis: AxisSnapshot,
  lineHeights: number[],
  totalCross: number,
  containerCross: number,
): { lineHeights: number[]; crossStart: number; crossBetween: number } {
  if (lineHeights.length === 0) {
    return { lineHeights, crossStart: 0, crossBetween: axis.crossGap }
  }

  const crossGapTotal = axis.crossGap * Math.max(0, lineHeights.length - 1)
  const availableCross = containerCross - totalCross - crossGapTotal

  if (box.wrap === "nowrap" && lineHeights.length === 1) {
    lineHeights[0] = containerCross
    return { lineHeights, crossStart: 0, crossBetween: axis.crossGap }
  }

  let crossStart = 0
  let crossBetween = axis.crossGap

  if (box.wrap !== "nowrap") {
    switch (box.alignContent) {
      case "flex-end":
        crossStart = availableCross
        break
      case "center":
        crossStart = availableCross / 2
        break
      case "space-between":
        crossBetween = lineHeights.length > 1 ? axis.crossGap + availableCross / (lineHeights.length - 1) : 0
        break
      case "space-around":
        crossBetween = axis.crossGap + availableCross / lineHeights.length
        crossStart = crossBetween / 2
        break
      case "space-evenly":
        crossBetween = axis.crossGap + availableCross / (lineHeights.length + 1)
        crossStart = crossBetween
        break
      case "stretch":
        if (availableCross > 0) {
          const extra = availableCross / lineHeights.length
          for (let i = 0; i < lineHeights.length; i++) {
            lineHeights[i] += extra
          }
        }
        break
    }
  }

  return { lineHeights, crossStart, crossBetween }
}

interface LineDistribution {
  lineMainUsed: number
  lineGapSum: number
  totalGrow: number
}

function distributeMainAxisSizes(
  line: FlexNode[],
  axis: AxisSnapshot,
  containerMain: number,
  mainGap: number,
): LineDistribution {
  let lineMainUsed = 0
  let totalGrow = 0
  let totalShrink = 0
  let totalWeightedShrink = 0
  let totalBasis = 0

  for (const child of line) {
    totalBasis += child.style.flexBasis
    totalGrow += child.style.flexGrow
    totalShrink += child.style.flexShrink
    totalWeightedShrink += child.style.flexShrink * child.style.flexBasis
  }

  const lineGapSum = mainGap * Math.max(0, line.length - 1)
  const lineFreeSpace = containerMain - totalBasis - lineGapSum

  for (const child of line) {
    let main = child.style.flexBasis
    if (lineFreeSpace > 0 && totalGrow > 0) {
      main += (lineFreeSpace * child.style.flexGrow) / totalGrow
    } else if (lineFreeSpace < 0 && totalWeightedShrink > 0) {
      const weightedShrink = child.style.flexShrink * child.style.flexBasis
      main += (lineFreeSpace * weightedShrink) / totalWeightedShrink
    } else if (lineFreeSpace < 0 && totalWeightedShrink === 0 && totalShrink > 0) {
      main += (lineFreeSpace * child.style.flexShrink) / totalShrink
    }

    if (main < 0) {
      main = 0
    }

    child.size[axis.mainProp] = main
    lineMainUsed += main
  }

  return { lineMainUsed, lineGapSum, totalGrow }
}

function resolveJustifySpacing(
  justify: Justify,
  distribution: LineDistribution,
  containerMain: number,
  mainGap: number,
  itemCount: number,
): { leading: number; between: number } {
  let leading = 0
  let between = mainGap

  if (distribution.totalGrow === 0) {
    let justifySpace = containerMain - distribution.lineMainUsed - distribution.lineGapSum
    if (justifySpace < 0) {
      justifySpace = 0
    }

    switch (justify) {
      case "flex-end":
        leading = justifySpace
        break
      case "center":
        leading = justifySpace / 2
        break
      case "space-between":
        between = itemCount > 1 ? mainGap + justifySpace / (itemCount - 1) : 0
        break
      case "space-around":
        between = mainGap + justifySpace / itemCount
        leading = between / 2
        break
      case "space-evenly":
        between = mainGap + justifySpace / (itemCount + 1)
        leading = between
        break
    }
  }

  return { leading, between }
}

function finalizeLineHeight(
  line: FlexNode[],
  baseHeight: number,
  axis: AxisSnapshot,
  wrap: FlexBox["wrap"],
): number {
  if (wrap !== "nowrap") {
    return baseHeight
  }

  let maxCross = 0
  for (const child of line) {
    maxCross = Math.max(maxCross, getCrossSize(child, axis))
  }

  return Math.max(baseHeight, maxCross)
}

function applyChildCrossAlignment(
  child: FlexNode,
  axis: AxisSnapshot,
  lineHeight: number,
  alignItems: Align,
): number {
  const alignSelf =
    child.style.alignSelf !== "auto" ? (child.style.alignSelf as Align) : alignItems
  const explicitCross = axis.horizontal ? child.style.height : child.style.width

  if (explicitCross !== undefined) {
    child.size[axis.crossProp] = explicitCross
  } else if (alignSelf === "stretch") {
    child.size[axis.crossProp] = lineHeight
  }

  switch (alignSelf) {
    case "flex-end":
      return lineHeight - child.size[axis.crossProp]
    case "center":
      return (lineHeight - child.size[axis.crossProp]) / 2
    default:
      return 0
  }
}

function getCrossSize(child: FlexNode, axis: AxisSnapshot): number {
  const explicit = axis.horizontal ? child.style.height : child.style.width
  if (explicit !== undefined) {
    return explicit
  }

  const measured = axis.horizontal ? child.size.height : child.size.width
  return measured ?? 0
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
    this._collectLayout(this, layoutMap)
    return layoutMap
  }

  private _collectLayout(
    box: FlexBox,
    map: Record<string, { position: Position; size: Size }>,
    counterRef = { counter: 0 },
  ): void {
    for (const child of box.children) {
      const id = child.id ?? `_$$${counterRef.counter++}`
      map[id] = { position: child.position, size: child.size }
      if (child instanceof FlexBox) {
        this._collectLayout(child, map, counterRef)
      }
    }
  }
}
