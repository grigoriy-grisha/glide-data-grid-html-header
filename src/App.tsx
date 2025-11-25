import './App.css'
import { ButtonCellsExample } from './examples/ButtonCellsExample'
import { SelectCellsExample } from './examples/SelectCellsExample'
import { CanvasCellsExample } from './examples/CanvasCellsExample'
import { MixedCellsExample } from './examples/MixedCellsExample'
import { VerticalLayoutExample } from './examples/VerticalLayoutExample'
import { CenteredContentExample } from './examples/CenteredContentExample'
import { IconTextLayoutExample } from './examples/IconTextLayoutExample'
import { SpacedLayoutExample } from './examples/SpacedLayoutExample'
import { CompactLayoutExample } from './examples/CompactLayoutExample'
import { MultiRowLayoutExample } from './examples/MultiRowLayoutExample'
import { AsymmetricLayoutExample } from './examples/AsymmetricLayoutExample'
import { ProductsExample } from './examples/ProductsExample'
import { TasksExample } from './examples/TasksExample'
import { TransactionsExample } from './examples/TransactionsExample'
import { UsersExample } from './examples/UsersExample'
import { ProductsCanvasExample } from './examples/ProductsCanvasExample'
import { TasksCanvasExample } from './examples/TasksCanvasExample'
import { LargeGridExample } from './examples/LargeGridExample'
import { NetworkTreeGridExample } from "./examples/NetworkTreeGridExample.tsx";
import { RowOverlayExample } from "./examples/RowOverlayExample.tsx";
import { BasicGridExample } from './examples/BasicGridExample.tsx'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="container">
          <h1 className="logo">✨ Glide</h1>
          <p className="subtitle">Современное React приложение</p>
        </div>
      </header>

      <main className="main-content">
        <div className="container">
          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Базовые примеры
          </h2>

          <BasicGridExample />
          <NetworkTreeGridExample />
          <LargeGridExample />

          <RowOverlayExample />
          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Примеры типов ячеек
          </h2>
          <ButtonCellsExample />
          <SelectCellsExample />
          <CanvasCellsExample />
          <MixedCellsExample />

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Примеры верстки canvas ячеек
          </h2>
          <VerticalLayoutExample />
          <CenteredContentExample />
          <IconTextLayoutExample />
          <SpacedLayoutExample />
          <CompactLayoutExample />
          <MultiRowLayoutExample />
          <AsymmetricLayoutExample />

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Примеры с разными данными
          </h2>
          <ProductsExample />
          <TasksExample />
          <TransactionsExample />
          <UsersExample />
          <ProductsCanvasExample />
          <TasksCanvasExample />
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
