import { lazy, Suspense } from 'react'
import './App.css'
import { Tabs, TabPanel, useTabs, type Tab } from './components/Tabs'

// Lazy load examples for better performance
const BasicGridExample = lazy(() => import('./examples/BasicGridExample').then(m => ({ default: m.BasicGridExample })))
const LargeGridExample = lazy(() => import('./examples/LargeGridExample').then(m => ({ default: m.LargeGridExample })))
const EditableGridExample = lazy(() => import('./examples/EditableGridExample').then(m => ({ default: m.EditableGridExample })))
const SelectableGridExample = lazy(() => import('./examples/SelectableGridExample').then(m => ({ default: m.SelectableGridExample })))
const ButtonCellsExample = lazy(() => import('./examples/ButtonCellsExample').then(m => ({ default: m.ButtonCellsExample })))
const SelectCellsExample = lazy(() => import('./examples/SelectCellsExample').then(m => ({ default: m.SelectCellsExample })))
const NetworkTreeGridExample = lazy(() => import('./examples/NetworkTreeGridExample').then(m => ({ default: m.NetworkTreeGridExample })))
const ProductsExample = lazy(() => import('./examples/ProductsExample').then(m => ({ default: m.ProductsExample })))
const TasksExample = lazy(() => import('./examples/TasksExample').then(m => ({ default: m.TasksExample })))
const TransactionsExample = lazy(() => import('./examples/TransactionsExample').then(m => ({ default: m.TransactionsExample })))
const UsersExample = lazy(() => import('./examples/UsersExample').then(m => ({ default: m.UsersExample })))
const CanvasButtonsExample = lazy(() => import('./examples/CanvasButtonsExample').then(m => ({ default: m.CanvasButtonsExample })))
const CanvasIconButtonsExample = lazy(() => import('./examples/CanvasIconButtonsExample').then(m => ({ default: m.CanvasIconButtonsExample })))
const CanvasBadgesExample = lazy(() => import('./examples/CanvasBadgesExample').then(m => ({ default: m.CanvasBadgesExample })))

const tabs: Tab[] = [
  { id: 'basic', label: 'Basic Grid', icon: '📊' },
  { id: 'large', label: 'Large Grid', icon: '🚀' },
  { id: 'editable', label: 'Editable', icon: '✏️' },
  { id: 'selectable', label: 'Selectable', icon: '☑️' },
  { id: 'buttons', label: 'Buttons', icon: '🔘' },
  { id: 'select', label: 'Select Cells', icon: '📋' },
  { id: 'tree', label: 'Tree Grid', icon: '🌳' },
  { id: 'products', label: 'Products', icon: '🛍️' },
  { id: 'tasks', label: 'Tasks', icon: '✅' },
  { id: 'transactions', label: 'Transactions', icon: '💳' },
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'canvas-buttons', label: 'Canvas Buttons', icon: '🎨' },
  { id: 'canvas-icon-buttons', label: 'Canvas Icon Buttons', icon: '🖼️' },
  { id: 'canvas-badges', label: 'Canvas Badges', icon: '🏷️' },
]

function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>Загрузка примера...</p>
    </div>
  )
}

function App() {
  const { activeTab, handleTabChange } = useTabs('basic')

  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1 className="logo">✨ Glide</h1>
          <p className="subtitle">Современное React приложение с Data Grid</p>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <Tabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

          <Suspense fallback={<LoadingSpinner />}>
            <TabPanel id="basic" activeTab={activeTab}>
              <BasicGridExample />
            </TabPanel>

            <TabPanel id="large" activeTab={activeTab}>
              <LargeGridExample />
            </TabPanel>

            <TabPanel id="editable" activeTab={activeTab}>
              <EditableGridExample />
            </TabPanel>

            <TabPanel id="selectable" activeTab={activeTab}>
              <SelectableGridExample />
            </TabPanel>

            <TabPanel id="buttons" activeTab={activeTab}>
              <ButtonCellsExample />
            </TabPanel>

            <TabPanel id="select" activeTab={activeTab}>
              <SelectCellsExample />
            </TabPanel>

            <TabPanel id="tree" activeTab={activeTab}>
              <NetworkTreeGridExample />
            </TabPanel>

            <TabPanel id="products" activeTab={activeTab}>
              <ProductsExample />
            </TabPanel>

            <TabPanel id="tasks" activeTab={activeTab}>
              <TasksExample />
            </TabPanel>

            <TabPanel id="transactions" activeTab={activeTab}>
              <TransactionsExample />
            </TabPanel>

            <TabPanel id="users" activeTab={activeTab}>
              <UsersExample />
            </TabPanel>

            <TabPanel id="canvas-buttons" activeTab={activeTab}>
              <CanvasButtonsExample />
            </TabPanel>

            <TabPanel id="canvas-icon-buttons" activeTab={activeTab}>
              <CanvasIconButtonsExample />
            </TabPanel>

            <TabPanel id="canvas-badges" activeTab={activeTab}>
              <CanvasBadgesExample />
            </TabPanel>
          </Suspense>
        </div>
      </main>

      <footer className="app-footer">
        <div className="container">
          <p>Создано с ❤️ используя React + Vite</p>
        </div>
      </footer>
    </div>
  )
}

export default App
