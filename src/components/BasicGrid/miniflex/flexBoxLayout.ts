import { RootFlexBox, FlexBox } from "./minimal-flexbox"
import type { FlexStyle, Size, Position, FlexBoxOptions } from "./types"

export interface FlexBoxItem extends FlexStyle {
  children?: FlexBoxItem[]
}

const DEFAULT_CONTAINER_PROPS: Required<
  Pick<FlexBoxOptions, "direction" | "columnGap" | "rowGap" | "justifyContent" | "alignItems">
> = {
  direction: "row",
  columnGap: 0,
  rowGap: 0,
  justifyContent: "flex-start",
  alignItems: "stretch",
}

function extractFlexBoxOptions(item: FlexBoxItem): FlexBoxOptions {
  const source = item as FlexBoxItem & Partial<FlexBoxOptions>
  return {
    id: item.id,
    direction: source.direction ?? DEFAULT_CONTAINER_PROPS.direction,
    columnGap: source.columnGap ?? DEFAULT_CONTAINER_PROPS.columnGap,
    rowGap: source.rowGap ?? DEFAULT_CONTAINER_PROPS.rowGap,
    justifyContent: source.justifyContent ?? DEFAULT_CONTAINER_PROPS.justifyContent,
    alignItems: source.alignItems ?? DEFAULT_CONTAINER_PROPS.alignItems,
  }
}

// Recursively converts a FlexBoxItem tree into actual FlexBox instances.
function populateFlexTree(container: FlexBox, items?: FlexBoxItem[]): void {
  if (!items?.length) {
    return
  }

  for (const item of items) {
    if (item.children && item.children.length > 0) {
      const nested = new FlexBox(
        item.width ?? 0,
        item.height ?? 0,
        extractFlexBoxOptions(item),
      )

      container.addChild(nested, item)
      populateFlexTree(nested, item.children)
    } else {
      container.addChild(item)
    }
  }
}

export const flexBoxLayout = (
  parent: FlexBoxItem, // This 'parent' FlexBoxItem describes the root flex container
): Record<string, { position: Position; size: Size }> => {
  // Use parent.width/height for RootFlexBox dimensions, defaulting to 0 if undefined.
  const rootWidth = parent.width ?? 0
  const rootHeight = parent.height ?? 0

  // Extract FlexBoxOptions for the root container from the 'parent' item.
  const rootOpts = extractFlexBoxOptions(parent)

  const root = new RootFlexBox(rootWidth, rootHeight, rootOpts)

  // Recursively populate the 'root' FlexBox based on 'parent.children'.
  populateFlexTree(root, parent.children)

  // Compute the layout and return the map.
  return root.getLayout()
}
