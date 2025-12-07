import { useCallback, useMemo, useState } from 'react'
import { BasicGrid, createColumn, type BasicGridColumn, type BasicGridRowSelectionChange } from '../components'
import { networkData, type NetworkNode } from './data'

const isTreeNodeSelectable = (node: NetworkNode) => node.type !== 'edge'

// Helper to find nodes by id in nested structure
function findNodeById(nodes: NetworkNode[], id: string): NetworkNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.items) {
      const found = findNodeById(node.items, id)
      if (found) return found
    }
  }
  return undefined
}

const columns: BasicGridColumn<NetworkNode>[] = [
  createColumn<NetworkNode>('name', 'string', 'Узел', { width: 260 }),
  createColumn<NetworkNode>('type', 'string', 'Тип', { width: 180 }),
  createColumn<NetworkNode>('status', 'string', 'Статус', { width: 150 }),
  createColumn<NetworkNode>('load', 'percent', 'Нагрузка %', {
    width: 140,
    formatter: (value) => (typeof value === 'number' ? `${value}%` : ''),
  }),
  createColumn<NetworkNode>('latency', 'number', 'Задержка, мс', {
    width: 160,
    grow: 1,
    formatter: (value) => (typeof value === 'number' ? `${value} мс` : ''),
  }),
]

// Pre-selected node IDs
const INITIAL_SELECTED_IDS = ['31469', '31471'] // Кластер API, Кластер хранения

export function NetworkTreeGridExample() {

  const initialSelectedNodes = useMemo(() => {
    return INITIAL_SELECTED_IDS
      .map(id => findNodeById(networkData, id))
      .filter((node): node is NetworkNode => node !== undefined)
  }, [])

  const [selectedNetworkNodes, setSelectedNetworkNodes] = useState<NetworkNode[]>(initialSelectedNodes)

  const handleNetworkSelectionChange = useCallback((selection: BasicGridRowSelectionChange<NetworkNode>) => {
    setSelectedNetworkNodes(selection.rows)
  }, [])

  return (
    <div className="data-grid-section">
      <h2 className="section-title">Network Tree Grid</h2>
      <p className="section-description">Древовидное представление инфраструктуры с вложенными узлами</p>
      <div className="selected-rows-panel">
        <div className="selected-rows-count">
          {selectedNetworkNodes.length > 0
            ? `Выбрано узлов: ${selectedNetworkNodes.length}`
            : 'Выберите узел или ветку'}
        </div>
      </div>
      <BasicGrid<NetworkNode>
        columns={columns}
        rows={networkData}
        height={360}
        headerRowHeight={48}
        enableRowSelection
        showRowMarkers={false}
        selectedRows={selectedNetworkNodes}
        onRowSelectionChange={handleNetworkSelectionChange}
        getRowSelectable={isTreeNodeSelectable}
        treeOptions={{
          treeColumnId: 'name',
          childrenKey: 'items',
          defaultExpandedDepth: 2,
        }}
      />
    </div>
  )
}

