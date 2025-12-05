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

interface ContainerMetrics {
  main: number
  cross: number
  mainGap: number
  crossGap: number
}

abstract class FlexNode {
  id?: string
  metadata?: unknown
  public readonly size: Size = { width: 0, height: 0 }
  public readonly position: Position = { x: 0, y: 0 }
  public style: FlexStyle

  constructor(style: Partial<FlexStyle> = defaultStyle) {
    this.style = {
      flexGrow: style.flexGrow ?? 0,
      flexShrink: style.flexShrink ?? 1,
      flexBasis: style.flexBasis ?? 0,
      alignSelf: style.alignSelf ?? "auto",
      width: style.width,
      height: style.height,
      id: style.id,
      metadata: style.metadata,
    }
    this.id = style.id
    this.metadata = style.metadata
  }

  abstract build(): void
}

export class FlexElement extends FlexNode {
  build(): void {}
}

export class FlexBox extends FlexNode {
  public readonly children: FlexNode[] = []
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

    if (opts.direction !== undefined) this.direction = opts.direction
    if (opts.wrap !== undefined) this.wrap = opts.wrap
    if (opts.columnGap !== undefined) this.columnGap = opts.columnGap
    if (opts.rowGap !== undefined) this.rowGap = opts.rowGap
    if (opts.justifyContent !== undefined) this.justifyContent = opts.justifyContent
    if (opts.alignItems !== undefined) this.alignItems = opts.alignItems
    if (opts.alignContent !== undefined) this.alignContent = opts.alignContent

    this.padding = resolvePaddingBox(opts.padding)
  }

  addChild(style: Partial<FlexStyle>): FlexElement
  addChild(box: FlexBox, style?: Partial<FlexStyle>): FlexBox
  addChild(arg1: Partial<FlexStyle> | FlexBox, arg2?: Partial<FlexStyle>): FlexElement | FlexBox {
    if (arg1 instanceof FlexBox) {
      const box = arg1
      if (arg2) {
        const boxStyle = box.style
        boxStyle.flexGrow = arg2.flexGrow ?? 0
        boxStyle.flexShrink = arg2.flexShrink ?? 1
        boxStyle.flexBasis = arg2.flexBasis ?? 0
        boxStyle.alignSelf = arg2.alignSelf ?? "auto"
        boxStyle.width = arg2.width
        boxStyle.height = arg2.height
      }
      this.children.push(box)
      return box
    }
    const elem = new FlexElement(arg1)
    this.children.push(elem)
    return elem
  }

  private getContainerMetrics(): ContainerMetrics {
    const horizontal = this.direction === "row" || this.direction === "row-reverse"
    const { left, right, top, bottom } = this.padding
    const { width, height } = this.size

    if (horizontal) {
      return {
        main: width - left - right,
        cross: height - top - bottom,
        mainGap: this.columnGap,
        crossGap: this.rowGap,
      }
    }
    return {
      main: height - top - bottom,
      cross: width - left - right,
      mainGap: this.rowGap,
      crossGap: this.columnGap,
    }
  }

  private buildFlexLines(children: FlexNode[], metrics: ContainerMetrics): FlexNode[][] {
    if (this.wrap === "nowrap") {
      return [children]
    }

    const lines: FlexNode[][] = []
    let currentLine: FlexNode[] = []
    let currentMainSize = 0

    for (const child of children) {
      const childBasis = child.style.flexBasis
      const gap = currentLine.length > 0 ? metrics.mainGap : 0
      const exceeds = currentLine.length > 0 && currentMainSize + gap + childBasis > metrics.main

      if (exceeds) {
        lines.push(currentLine)
        currentLine = []
        currentMainSize = 0
      }

      currentLine.push(child)
      currentMainSize += (currentLine.length > 1 ? metrics.mainGap : 0) + childBasis
    }

    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    if (this.wrap === "wrap-reverse") {
      lines.reverse()
    }

    return lines
  }

  private measureLineCrossSizes(
    lines: FlexNode[][],
    horizontal: boolean,
  ): number[] {
    const lineHeights: number[] = []

    for (const line of lines) {
      let maxCross = 0

      for (const child of line) {
        const explicit = horizontal ? child.style.height : child.style.width
        const cross =
          explicit !== undefined
            ? explicit
            : horizontal
              ? child.size.height
              : child.size.width
        if (cross > maxCross) maxCross = cross
      }

      lineHeights.push(maxCross)
    }

    return lineHeights
  }

  private resolveCrossAxisLayout(
    lineHeights: number[],
    metrics: ContainerMetrics,
  ): { crossStart: number; crossBetween: number } {
    const lineCount = lineHeights.length
    const totalCross = lineHeights.reduce((sum, h) => sum + h, 0)
    const crossGapTotal = metrics.crossGap * (lineCount > 1 ? lineCount - 1 : 0)
    let availableCross = metrics.cross - totalCross - crossGapTotal

    let crossStart = 0
    let crossBetween = metrics.crossGap

    if (this.wrap === "nowrap" && lineCount === 1) {
      lineHeights[0] = metrics.cross
    } else if (this.wrap !== "nowrap") {
      const { crossStart: start, crossBetween: between } = this.calculateAlignContent(
        availableCross,
        lineCount,
        metrics.crossGap,
      )
      crossStart = start
      crossBetween = between

      if (this.alignContent === "stretch" && availableCross > 0) {
        const extra = availableCross / lineCount
        for (let i = 0; i < lineCount; i++) {
          lineHeights[i] += extra
        }
      }
    }

    return { crossStart, crossBetween }
  }

  private calculateAlignContent(
    availableCross: number,
    lineCount: number,
    crossGap: number,
  ): { crossStart: number; crossBetween: number } {
    let crossStart = 0
    let crossBetween = crossGap

    switch (this.alignContent) {
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
    }

    return { crossStart, crossBetween }
  }

  private distributeMainAxisSizes(
    line: FlexNode[],
    metrics: ContainerMetrics,
    horizontal: boolean,
  ): { lineMainUsed: number; totalGrow: number } {
    let totalBasis = 0
    let totalGrow = 0
    let totalWeightedShrink = 0

    for (const child of line) {
      const basis = child.style.flexBasis
      totalBasis += basis
      totalGrow += child.style.flexGrow
      totalWeightedShrink += child.style.flexShrink * basis
    }

    const lineGapSum = line.length > 1 ? metrics.mainGap * (line.length - 1) : 0
    const lineFreeSpace = metrics.main - totalBasis - lineGapSum
    let lineMainUsed = 0

    for (const child of line) {
      const style = child.style
      let main = style.flexBasis

      if (lineFreeSpace > 0 && totalGrow > 0) {
        main += (lineFreeSpace * style.flexGrow) / totalGrow
      } else if (lineFreeSpace < 0 && totalWeightedShrink > 0) {
        main += (lineFreeSpace * style.flexShrink * main) / totalWeightedShrink
      }

      if (main < 0) main = 0

      if (horizontal) {
        child.size.width = main
      } else {
        child.size.height = main
      }

      lineMainUsed += main
    }

    return { lineMainUsed, totalGrow }
  }

  private calculateJustifySpacing(
    lineLen: number,
    lineMainUsed: number,
    metrics: ContainerMetrics,
    totalGrow: number,
  ): { leading: number; between: number } {
    let leading = 0
    let between = metrics.mainGap

    if (totalGrow === 0) {
      const lineGapSum = lineLen > 1 ? metrics.mainGap * (lineLen - 1) : 0
      let justifySpace = metrics.main - lineMainUsed - lineGapSum
      if (justifySpace < 0) justifySpace = 0

      switch (this.justifyContent) {
        case "flex-end":
          leading = justifySpace
          break
        case "center":
          leading = justifySpace / 2
          break
        case "space-between":
          between = lineLen > 1 ? metrics.mainGap + justifySpace / (lineLen - 1) : 0
          break
        case "space-around":
          between = metrics.mainGap + justifySpace / lineLen
          leading = between / 2
          break
        case "space-evenly":
          between = metrics.mainGap + justifySpace / (lineLen + 1)
          leading = between
          break
      }
    }

    return { leading, between }
  }

  private getFinalLineHeight(
    line: FlexNode[],
    initialHeight: number,
    horizontal: boolean,
  ): number {
    if (this.wrap !== "nowrap") {
      return initialHeight
    }

    let finalLineHeight = initialHeight

    for (const child of line) {
      const explicit = horizontal ? child.style.height : child.style.width
      const cross =
        explicit !== undefined
          ? explicit
          : horizontal
            ? child.size.height
            : child.size.width
      if (cross > finalLineHeight) finalLineHeight = cross
    }

    return finalLineHeight
  }

  private getCrossSize(
    child: FlexNode,
    finalLineHeight: number,
    horizontal: boolean,
  ): number {
    const explicitCross = horizontal ? child.style.height : child.style.width
    const alignSelf =
      child.style.alignSelf !== "auto"
        ? (child.style.alignSelf as Align)
        : this.alignItems

    if (explicitCross !== undefined) {
      if (horizontal) {
        child.size.height = explicitCross
      } else {
        child.size.width = explicitCross
      }
      return explicitCross
    }

    if (alignSelf === "stretch") {
      if (horizontal) {
        child.size.height = finalLineHeight
      } else {
        child.size.width = finalLineHeight
      }
      return finalLineHeight
    }

    return horizontal ? child.size.height : child.size.width
  }

  private positionChildren(
    line: FlexNode[],
    metrics: ContainerMetrics,
    horizontal: boolean,
    finalLineHeight: number,
    leading: number,
    between: number,
    offsetX: number,
    offsetY: number,
    currentCrossPos: number,
  ): void {
    const isReverse =
      this.direction === "row-reverse" || this.direction === "column-reverse"
    const startIdx = isReverse ? line.length - 1 : 0
    const endIdx = isReverse ? -1 : line.length
    const step = isReverse ? -1 : 1
    let mainCursor = leading

    for (let ci = startIdx; ci !== endIdx; ci += step) {
      const child = line[ci]
      const childStyle = child.style
      const childSize = child.size
      const childPos = child.position

      if (horizontal) {
        const x =
          this.direction === "row"
            ? mainCursor
            : metrics.main - mainCursor - childSize.width
        childPos.x = offsetX + x
      } else {
        const y =
          this.direction === "column"
            ? mainCursor
            : metrics.main - mainCursor - childSize.height
        childPos.y = offsetY + y
      }

      const alignSelf =
        childStyle.alignSelf !== "auto"
          ? (childStyle.alignSelf as Align)
          : this.alignItems

      const crossSize = this.getCrossSize(child, finalLineHeight, horizontal)

      let crossOffset = 0
      if (alignSelf === "flex-end") {
        crossOffset = finalLineHeight - crossSize
      } else if (alignSelf === "center") {
        crossOffset = (finalLineHeight - crossSize) * 0.5
      }

      if (horizontal) {
        childPos.y = offsetY + currentCrossPos + crossOffset
        mainCursor += childSize.width + between
      } else {
        childPos.x = offsetX + currentCrossPos + crossOffset
        mainCursor += childSize.height + between
      }
    }
  }

  build(): void {
    const children = this.children
    if (children.length === 0) {
      return
    }

    const horizontal = this.direction === "row" || this.direction === "row-reverse"
    const metrics = this.getContainerMetrics()
    const lines = this.buildFlexLines(children, metrics)

    if (lines.length === 0) {
      return
    }

    const lineHeights = this.measureLineCrossSizes(lines, horizontal)
    const { crossStart, crossBetween } = this.resolveCrossAxisLayout(
      lineHeights,
      metrics,
    )

    const offsetX = this.padding.left
    const offsetY = this.padding.top
    let currentCrossPos = crossStart

    for (let li = 0; li < lines.length; li++) {
      const line = lines[li]
      if (line.length === 0) continue

      const { lineMainUsed, totalGrow } = this.distributeMainAxisSizes(
        line,
        metrics,
        horizontal,
      )

      const { leading, between } = this.calculateJustifySpacing(
        line.length,
        lineMainUsed,
        metrics,
        totalGrow,
      )

      const finalLineHeight = this.getFinalLineHeight(
        line,
        lineHeights[li],
        horizontal,
      )

      this.positionChildren(
        line,
        metrics,
        horizontal,
        finalLineHeight,
        leading,
        between,
        offsetX,
        offsetY,
        currentCrossPos,
      )

      currentCrossPos += finalLineHeight + crossBetween
    }

    for (const child of children) {
      if (child instanceof FlexBox) {
        child.build()
      }
    }
  }
}

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
    for (const child of box.children) {
      const id = child.id ?? `_$$${counterRef.counter++}`
      map[id] = { position: child.position, size: child.size }
      if (child instanceof FlexBox) {
        this._collectLayout(child, map, counterRef)
      }
    }
  }
}
