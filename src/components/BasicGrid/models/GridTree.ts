import type { BasicGridTreeOptions } from '../types'

const DEFAULT_CHILDREN_KEY = 'items'

export interface GridTreeNode<RowType> {
  row: RowType
  rowId: string
  parentId?: string
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

export interface GridTreeSnapshot<RowType> {
  visibleRows: RowType[]
  nodes: GridTreeNode<RowType>[]
  hasTreeData: boolean
}

export class GridTree<RowType extends Record<string, unknown>> {
  constructor(private readonly options: BasicGridTreeOptions<RowType>) {}

  buildInitialExpandedState(rows: RowType[]): Set<string> {
    const maxDepth = Math.max(0, this.options.defaultExpandedDepth ?? 1)
    const expanded = new Set<string>()

    if (maxDepth === 0) {
      return expanded
    }

    this.visit(rows, (node, depth, path) => {
      const children = this.getChildren(node)
      if (children.length === 0) {
        return
      }

      if (depth < maxDepth) {
        expanded.add(this.getRowId(node, path))
      }
    })

    return expanded
  }

  compute(rows: RowType[], expandedRowIds: Set<string>): GridTreeSnapshot<RowType> {
    if (!rows || rows.length === 0) {
      return {
        visibleRows: rows,
        nodes: [],
        hasTreeData: false,
      }
    }

    const nodes: GridTreeNode<RowType>[] = []
    let hasTreeData = false

    this.visit(rows, (row, depth, path, parentId, parentVisible) => {
      const children = this.getChildren(row)
      const hasChildren = children.length > 0
      const rowId = this.getRowId(row, path)
      const isExpanded = hasChildren && expandedRowIds.has(rowId)

      if (hasChildren) {
        hasTreeData = true
      }

      if (parentVisible) {
        nodes.push({
          row,
          rowId,
          parentId,
          depth,
          hasChildren,
          isExpanded,
        })
      }

      return isExpanded
    })

    if (!hasTreeData) {
      return {
        visibleRows: rows,
        nodes: [],
        hasTreeData: false,
      }
    }

    return {
      visibleRows: nodes.map((node) => node.row),
      nodes,
      hasTreeData: true,
    }
  }

  private visit(
    rows: RowType[],
    handler: (
      row: RowType,
      depth: number,
      path: number[],
      parentId: string | undefined,
      parentVisible: boolean
    ) => boolean | void,
    depth = 0,
    parentId: string | undefined = undefined,
    parentVisible = true,
    path: number[] = []
  ) {
    rows.forEach((row, index) => {
      const nextPath = [...path, index]
      const isExpanded = handler(row, depth, nextPath, parentId, parentVisible) !== false
      const children = this.getChildren(row)

      if (children.length > 0) {
        const rowId = this.getRowId(row, nextPath)
        this.visit(children, handler, depth + 1, rowId, parentVisible && Boolean(isExpanded), nextPath)
      }
    })
  }

  private getChildren(row: RowType): RowType[] {
    if (typeof this.options.getChildren === 'function') {
      const customChildren = this.options.getChildren(row)
      return Array.isArray(customChildren) ? customChildren : []
    }

    const accessor = this.options.childrenKey ?? DEFAULT_CHILDREN_KEY
    if (!accessor) {
      return []
    }

    const value = accessor.split('.').reduce<unknown>((acc, key) => {
      if (!acc || typeof acc !== 'object') {
        return undefined
      }
      return (acc as Record<string, unknown>)[key]
    }, row)

    return Array.isArray(value) ? (value as RowType[]) : []
  }

  private getRowId(row: RowType, path: readonly number[]): string {
    if (typeof this.options.getRowId === 'function') {
      return this.options.getRowId(row, path)
    }

    const candidate = (row as Record<string, unknown> | undefined)?.id
    if (typeof candidate === 'string' || typeof candidate === 'number') {
      return String(candidate)
    }

    return path.join('-')
  }
}

export function areSetsEqual(first: Set<string>, second: Set<string>) {
  if (first.size !== second.size) {
    return false
  }
  for (const value of first) {
    if (!second.has(value)) {
      return false
    }
  }
  return true
}


