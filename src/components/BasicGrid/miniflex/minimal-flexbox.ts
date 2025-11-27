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
    
    if (opts.padding !== undefined) {
        if (typeof opts.padding === 'number') {
            this.padding = { top: opts.padding, right: opts.padding, bottom: opts.padding, left: opts.padding }
        } else {
            this.padding = opts.padding
        }
    }
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
    // 1. Identify axes & gaps
    const horizontal = this.direction.startsWith("row")
    const mainProp: keyof Size = horizontal ? "width" : "height"
    const crossProp: keyof Size = horizontal ? "height" : "width"
    const mainGap = horizontal ? this.columnGap : this.rowGap
    const crossGap = horizontal ? this.rowGap : this.columnGap
    
    // Adjust container size for padding
    const paddingMain = horizontal ? (this.padding.left + this.padding.right) : (this.padding.top + this.padding.bottom)
    const paddingCross = horizontal ? (this.padding.top + this.padding.bottom) : (this.padding.left + this.padding.right)

    const containerMain = Math.max(0, this.size[mainProp] - paddingMain)
    const containerCross = Math.max(0, this.size[crossProp] - paddingCross)

    // 2. Group children into lines
    const lines: FlexNode[][] = []
    let currentLine: FlexNode[] = []
    let currentMainSize = 0

    for (const child of this.children) {
      const childBasis = child.style.flexBasis

      if (this.wrap === 'nowrap') {
        currentLine.push(child)
        currentMainSize += childBasis
      } else {
        const gap = currentLine.length > 0 ? mainGap : 0
        if (currentLine.length > 0 && (currentMainSize + gap + childBasis) > containerMain) {
          lines.push(currentLine)
          currentLine = []
          currentMainSize = 0
        }
        currentLine.push(child)
        currentMainSize += (currentLine.length > 1 ? mainGap : 0) + childBasis
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }

    if (this.wrap === 'wrap-reverse') {
        lines.reverse()
    }

    // 3. Calculate Line Heights
    const lineHeights: number[] = []
    let totalUsedCross = 0

    for (const line of lines) {
        if (this.wrap === 'nowrap') {
            // Single line fills container (unless limited by something else? Flexbox defaults to filling cross)
            // We'll defer to align-content logic: if one line, it acts as one line block.
            // But commonly, nowrap lines stretch to fit container height if not auto.
            // Let's compute content height first.
            let maxH = 0
            for (const child of line) {
                // Calculate implicit size if not set
                // This is basic and doesn't account for wrapped text height yet because widths are not final.
                const explicit = horizontal ? child.style.height : child.style.width
                const measured = horizontal ? child.size.height : child.size.width
                const h = explicit ?? measured ?? 0 
                maxH = Math.max(maxH, h)
            }
            // If wrapping text depends on final width, maxH here might be wrong (too small).
            // In a 1-pass engine, we can't know for sure.
            // However, if we have a heuristic or if we can trust that shrinking won't happen significantly? No.
            
            // If we are in 'nowrap', text won't wrap unless width is constrained externally.
            // If it wraps, it grows in height.
            
            // If containerCross is auto (undefined in this engine structure usually implies fit content for nested),
            // we use maxH.
            // If containerCross is fixed, we might use it?
            
            // For now, use maxH.
            lineHeights.push(maxH)
            totalUsedCross += maxH 
        } else {
            let maxCrossSize = 0
            for (const child of line) {
                let childCross = horizontal ? child.style.height : child.style.width
                if (childCross === undefined) {
                    childCross = horizontal ? child.size.height : child.size.width
                }
                if (childCross !== undefined) {
                    maxCrossSize = Math.max(maxCrossSize, childCross)
                }
            }
            lineHeights.push(maxCrossSize)
            totalUsedCross += maxCrossSize
        }
    }

    // 4. Determine Cross Axis Distribution (align-content)
    // Total space for lines
    const crossGapTotal = crossGap * Math.max(0, lines.length - 1)
    const availableCross = containerCross - totalUsedCross - crossGapTotal
    
    // If nowrap, standard flex says line height stretches to fill container if we don't have specific sizing.
    // If wrap, we use align-content.
    // For simplicity, if nowrap, we often force the line to be containerCross (simulating stretch).
    if (this.wrap === 'nowrap' && lineHeights.length === 1) {
        lineHeights[0] = containerCross; // Force stretch for single line nowrap
        totalUsedCross = containerCross; // No free space effectively
        // But wait, what if align-items is not stretch? The line is still the container height usually.
    }

    let crossStart = 0
    let crossBetween = crossGap

    // Only apply align-content if we have extra space (positive or negative?)
    // Standard flexbox applies it.
    // Note: AlignContent type matches Justify roughly
    
    if (this.wrap !== 'nowrap') { // Align content only applies to multi-line (or single line with wrap enabled? Flex spec says yes)
        switch (this.alignContent) {
            case 'flex-end': crossStart = availableCross; break;
            case 'center': crossStart = availableCross / 2; break;
            case 'space-between': 
                crossBetween = lines.length > 1 ? crossGap + availableCross / (lines.length - 1) : 0; 
                break;
            case 'space-around':
                crossBetween = crossGap + availableCross / lines.length;
                crossStart = crossBetween / 2;
                break;
            case 'space-evenly':
                crossBetween = crossGap + availableCross / (lines.length + 1);
                crossStart = crossBetween;
                break;
            case 'stretch':
                // Distribute space into lines
                if (availableCross > 0 && lines.length > 0) {
                    const add = availableCross / lines.length
                    for (let i = 0; i < lineHeights.length; i++) {
                        lineHeights[i] += add
                    }
                }
                break;
        }
    }

    // 5. Position Lines & Items
    let currentCrossPos = crossStart

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const lineHeight = lineHeights[i]

        // 5a. Resolve Main Axis Items (Grow/Shrink) for this line
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
        // Gap inside line
        const lineGapSum = mainGap * Math.max(0, line.length - 1)
        const lineFreeSpace = containerMain - totalBasis - lineGapSum

        for (const child of line) {
            let main = child.style.flexBasis
            if (lineFreeSpace > 0 && totalGrow > 0) {
                main += (lineFreeSpace * child.style.flexGrow) / totalGrow
            } else if (lineFreeSpace < 0 && totalWeightedShrink > 0) {
                // Shrink proportional to flexShrink * flexBasis
                const weightedShrink = child.style.flexShrink * child.style.flexBasis
                main += (lineFreeSpace * weightedShrink) / totalWeightedShrink
                if (main < 0) main = 0
            } else if (lineFreeSpace < 0 && totalWeightedShrink === 0 && totalShrink > 0) {
                // Fallback: if all basis are 0 but shrink > 0, shrink equally or proportionally to shrink factor
                main += (lineFreeSpace * child.style.flexShrink) / totalShrink
                if (main < 0) main = 0
            }

            child.size[mainProp] = main
            lineMainUsed += main
        }

        // Re-calculate line height if needed (e.g. if items wrapped differently due to width change)
        // This is a simplified approach: we assume max cross size might have changed if width changed.
        // We can iterate again to update lineHeight[i] if we had a mechanism to re-measure content.
        // Since we don't have a callback to the node to re-measure based on new size here easily without tight coupling,
        // we assume the initial measure was "good enough" or that the node handles layout in paint.
        // BUT, for correct alignment (align-items: flex-start), we need the correct line height.
        // If a text wrapped, its height increased.
        // The FlexNode abstraction here stores size. If size[crossProp] was derived from natural size, 
        // and natural size depends on main size (wrapping), we need to update it.
        // But FlexNode.size is just numbers. 
        
        // Hack/Fix: If we could know the new height given the new width...
        // For now, let's just ensure we respect the cross size if it was set explicitly?
        // Or update maxH based on current size?
        // The problem is 'child.size.height' hasn't been updated based on 'child.size.width' yet.
        // The nodes are passive data structs here.
        
        // However, in the CanvasContainer.performLayout, we do:
        // 1. measureRecursive (sets rect width/height based on initial state/text)
        // 2. build (this function)
        // 3. applyLayout
        
        // If text wraps, 'measure' needs to know the width.
        // But 'measure' happened before flex layout determined the width!
        // This is the circular dependency of layout.
        // Standard flexbox solves this by multi-pass or intrinsic sizing.
        
        // Workaround for this engine: 
        // We can't solve the full measure-layout loop inside this single-pass 'build'.
        // The user sees that height is not accounted for because 'measure' used 'style.width' (which might be undefined or different)
        // or 'measure' used infinite width (no wrapping).
        // When we shrink here, the width becomes smaller, text wraps (visually in paint), but the box height remains small.
        
        // To fix: The 'paint' method calculates wrapped height correctly. 
        // We should probably support a 2-pass layout in CanvasContainer if we want dynamic height.
        // Or, for this specific issue, ensure that IF we provided a width constraint in style, measure used it.
        // If flexbox shrinks it further, we are out of luck in 1 pass.
        
        // But wait, the user said "dimensions of height text which wraps seems to be ignored".
        // This likely means the container height (row height) is too small for the wrapped text.
        // This confirms we need the row height to match the wrapped text height.


        // 5b. Justify Content (Main Axis)
        // const occupied = lineMainUsed + lineGapSum // same as above
        let leading = 0
        let between = mainGap
        const n = line.length
        
        let justifySpace = 0
        if (totalGrow === 0) {
            // If we shrank items (lineFreeSpace < 0), justifySpace should be 0 because we filled the container
            // But if we have space left, we calculate it.
            // lineFreeSpace is calculated BEFORE shrinking logic.
            // After shrinking/growing, lineMainUsed holds the final size of items.
            // So we should use containerMain - lineMainUsed - lineGapSum
            
            justifySpace = containerMain - lineMainUsed - lineGapSum
            // Ensure we don't have negative space here if calculation was slightly off or exactly 0
            if (justifySpace < 0) justifySpace = 0 
        }

        switch (this.justifyContent) {
            case "flex-end": leading = justifySpace; break;
            case "center": leading = justifySpace / 2; break;
            case "space-between": between = n > 1 ? mainGap + justifySpace / (n - 1) : 0; break;
            case "space-around": between = mainGap + justifySpace / n; leading = between / 2; break;
            case "space-evenly": between = mainGap + justifySpace / (n + 1); leading = between; break;
        }

        // 5c. Position Items
        const ordered = this.direction.endsWith("reverse") ? [...line].reverse() : line
        let mainCursor = leading

        // Add padding offset
        let offsetX = this.padding.left
        let offsetY = this.padding.top

        // Re-evaluate line height after items have settled their main size (and potentially wrapping height)
        // This is a patch for the 1-pass limitation.
        let finalLineHeight = lineHeight;
        if (this.wrap === 'nowrap') { // Only straightforward for single line per container logic here
             let maxH = 0;
             for (const child of line) {
                 const explicitCross = horizontal ? child.style.height : child.style.width
                 const measuredCross = horizontal ? child.size.height : child.size.width
                 // Use the size that might have been updated by a re-measure or is intrinsic
                 const h = explicitCross ?? measuredCross ?? 0
                 maxH = Math.max(maxH, h)
             }
             // If items grew in height (e.g. text wrapping), expand line height
             // But only if we are not constrained by containerCross? 
             // If container aligns stretch, items stretch to line height. 
             // If line height grows, stretched items grow.
             if (maxH > finalLineHeight) {
                 finalLineHeight = maxH;
             }
        }

        for (const child of ordered) {
            // Main Position
            if (horizontal) {
                child.position.x = offsetX + ((this.direction === "row") ? mainCursor : containerMain - mainCursor - child.size.width)
            } else {
                child.position.y = offsetY + ((this.direction === "column") ? mainCursor : containerMain - mainCursor - child.size.height)
            }

            // Cross Position (Align Items)
            const alignSelf = child.style.alignSelf !== "auto" ? (child.style.alignSelf as Align) : this.alignItems
            
            const explicitCross = horizontal ? child.style.height : child.style.width
            if (explicitCross !== undefined) child.size[crossProp] = explicitCross
            else if (alignSelf === 'stretch') child.size[crossProp] = finalLineHeight // Use updated line height
            // else child.size[crossProp] is natural

            let crossOffset = 0
            switch (alignSelf) {
                case "flex-end": crossOffset = finalLineHeight - child.size[crossProp]; break;
                case "center": crossOffset = (finalLineHeight - child.size[crossProp]) / 2; break;
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

    // 6. Recurse into nested flex containers
    for (const child of this.children) {
      if (child instanceof FlexBox) {
        child.build()
      }
    }
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
