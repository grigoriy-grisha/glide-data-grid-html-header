export interface Size {
  width: number
  height: number
}

export interface Position {
  x: number
  y: number
}

export type Direction = "row" | "row-reverse" | "column" | "column-reverse"
export type Align = "flex-start" | "flex-end" | "center" | "stretch"
export type Justify =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly"

export type AlignContent =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly"
  | "stretch"

export interface FlexStyle {
  id?: string
  flexGrow: number
  flexShrink: number
  flexBasis: number
  alignSelf?: Align | "auto"
  width?: number
  height?: number
  metadata?: unknown
}

export interface FlexBoxOptions {
  id?: string
  direction?: Direction
  wrap?: "nowrap" | "wrap" | "wrap-reverse"
  columnGap?: number
  rowGap?: number
  justifyContent?: Justify
  alignItems?: Align
  alignContent?: AlignContent
  padding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  } | number
}
