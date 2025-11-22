import React from 'react'
import { GridCellKind, type CustomCell, type CustomRenderer } from '@glideapps/glide-data-grid'

import type { BasicGridSelectOption } from '../types'

export const SELECT_CELL_KIND = 'select-cell'

export interface SelectCellData {
  kind: typeof SELECT_CELL_KIND
  value: string
  displayValue: string
  options: BasicGridSelectOption[]
  placeholder?: string
}

export type SelectCell = CustomCell<SelectCellData>

function resolveDisplayValue(value: string, options: BasicGridSelectOption[], placeholder?: string) {
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

    const paddingX = theme.cellHorizontalPadding ?? 8
    const textX = rect.x + paddingX
    const textY = rect.y + rect.height / 2

    ctx.font = theme.baseFontFull
    ctx.textBaseline = 'middle'
    ctx.fillStyle = highlighted ? theme.textMedium : theme.textDark
    const text = displayValue || placeholder || ''
    ctx.fillText(text, textX, textY)

    // caret
    const caretWidth = 8
    const caretHeight = 5
    const caretX = rect.x + rect.width - paddingX - caretWidth
    const caretY = rect.y + rect.height / 2 - caretHeight / 2
    ctx.fillStyle = theme.textLight
    ctx.beginPath()
    ctx.moveTo(caretX, caretY)
    ctx.lineTo(caretX + caretWidth, caretY)
    ctx.lineTo(caretX + caretWidth / 2, caretY + caretHeight)
    ctx.closePath()
    ctx.fill()

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
        <div
          style={{
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            minHeight: '100%',
          }}
        >
          <select
            autoFocus
            value={value.data.value}
            onChange={handleChange}
            style={{
              width: '100%',
              fontSize: 14,
              padding: '6px 8px',
            }}
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


