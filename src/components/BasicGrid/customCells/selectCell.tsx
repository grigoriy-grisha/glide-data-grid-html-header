import React from 'react'
import { GridCellKind, type CustomCell, type CustomRenderer } from '@glideapps/glide-data-grid'

import type { BasicGridSelectOption } from '../types'

export const SELECT_CELL_KIND = 'select-cell'

const DEFAULT_PADDING_X = 8
const CARET_WIDTH = 8
const CARET_HEIGHT = 5

export interface SelectCellData {
  kind: typeof SELECT_CELL_KIND
  value: string
  displayValue: string
  options: BasicGridSelectOption[]
  placeholder?: string
}

export type SelectCell = CustomCell<SelectCellData>

function resolveDisplayValue(value: string, options: BasicGridSelectOption[], placeholder?: string): string {
  if (!value) {
    return placeholder ?? ''
  }
  const match = options.find((option) => option.value === value)
  return match?.label ?? value
}

export function createSelectCell(value: string, options: BasicGridSelectOption[], placeholder?: string): SelectCell {
  const normalizedOptions = options.map((option) => ({
    label: option.label ?? option.value,
    value: option.value ?? option.label,
  }))
  const safeValue = value ?? ''
  const displayValue = resolveDisplayValue(safeValue, normalizedOptions, placeholder)
  return {
    kind: GridCellKind.Custom,
    allowOverlay: true,
    activationBehaviorOverride: 'single-click',
    readonly: false,
    copyData: displayValue,
    data: {
      kind: SELECT_CELL_KIND,
      value: safeValue,
      displayValue,
      options: normalizedOptions,
      placeholder,
    },
  }
}

export function isSelectCell(cell: CustomCell | undefined): cell is SelectCell {
  return Boolean(cell && cell.kind === GridCellKind.Custom && (cell.data as SelectCellData)?.kind === SELECT_CELL_KIND)
}

export const selectCellRenderer: CustomRenderer<SelectCell> = {
  kind: GridCellKind.Custom,
  isMatch: (cell): cell is SelectCell => (cell.data as SelectCellData)?.kind === SELECT_CELL_KIND,
  needsHover: false,
  draw: (args, cell) => {
    const { ctx, rect, theme, highlighted } = args
    const { displayValue, placeholder } = cell.data

    ctx.save()
    ctx.beginPath()
    ctx.rect(rect.x, rect.y, rect.width, rect.height)
    ctx.clip()

    const paddingX = theme.cellHorizontalPadding ?? DEFAULT_PADDING_X
    const textX = rect.x + paddingX
    const textY = rect.y + rect.height / 2

    drawSelectText(ctx, displayValue || placeholder || '', textX, textY, theme, highlighted)
    drawCaret(ctx, rect, paddingX, theme)

    ctx.restore()
  },
  provideEditor: (cell) => ({
    disablePadding: true,
    editor: ({ value, onChange, onFinishedEditing }) => {
      const { options, placeholder } = cell.data
      const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextValue = event.target.value
        const nextLabel = resolveDisplayValue(nextValue, options, placeholder)
        const nextCell: SelectCell = {
          ...value,
          copyData: nextLabel,
          data: {
            ...value.data,
            value: nextValue,
            displayValue: nextLabel,
          },
        }
        onChange(nextCell)
        onFinishedEditing?.(nextCell)
      }

      return (
        <div className="select-cell-editor">
          <select
            autoFocus
            value={value.data.value}
            onChange={handleChange}
            className="select-cell-editor__select"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )
    },
  }),
}

function drawSelectText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  theme: any,
  highlighted: boolean
): void {
  ctx.font = theme.baseFontFull
  ctx.textBaseline = 'middle'
  ctx.fillStyle = highlighted ? theme.textMedium : theme.textDark
  ctx.fillText(text, x, y)
}

function drawCaret(
  ctx: CanvasRenderingContext2D,
  rect: { x: number; y: number; width: number; height: number },
  paddingX: number,
  theme: any
): void {
  const caretX = rect.x + rect.width - paddingX - CARET_WIDTH
  const caretY = rect.y + rect.height / 2 - CARET_HEIGHT / 2

  ctx.fillStyle = theme.textLight
  ctx.beginPath()
  ctx.moveTo(caretX, caretY)
  ctx.lineTo(caretX + CARET_WIDTH, caretY)
  ctx.lineTo(caretX + CARET_WIDTH / 2, caretY + CARET_HEIGHT)
  ctx.closePath()
  ctx.fill()
}
