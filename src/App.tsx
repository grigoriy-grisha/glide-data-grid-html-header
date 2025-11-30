import './App.css'
import { BasicGridExample } from './examples/BasicGridExample.tsx'
import { LargeGridExample } from './examples/LargeGridExample'
import { StandaloneCanvasExample } from './examples/StandaloneCanvasExample'

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
          <StandaloneCanvasExample />
          {/*<CanvasLayoutTestExample />*/}

          <h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>
            Базовые примеры
          </h2>

          <BasicGridExample />
          {/*<NetworkTreeGridExample />*/}
          <LargeGridExample />

          {/*<RowOverlayExample />*/}
          {/*<h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>*/}
          {/*  Примеры типов ячеек*/}
          {/*</h2>*/}
          {/*<ButtonCellsExample />*/}
          {/*<SelectCellsExample />*/}
          {/*<CanvasCellsExample />*/}
          {/*<MixedCellsExample />*/}

          {/*<h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>*/}
          {/*  Примеры верстки canvas ячеек*/}
          {/*</h2>*/}
          {/*<VerticalLayoutExample />*/}
          {/*<CenteredContentExample />*/}
          {/*<IconTextLayoutExample />*/}
          {/*<SpacedLayoutExample />*/}
          {/*<CompactLayoutExample />*/}
          {/*<MultiRowLayoutExample />*/}
          {/*<AsymmetricLayoutExample />*/}

          {/*<h2 style={{ marginTop: '2rem', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 'bold' }}>*/}
          {/*  Примеры с разными данными*/}
          {/*</h2>*/}
          {/*<ProductsExample />*/}
          {/*<TasksExample />*/}
          {/*<TransactionsExample />*/}
          {/*<UsersExample />*/}
          {/*<ProductsCanvasExample />*/}
          {/*<TasksCanvasExample />*/}
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
