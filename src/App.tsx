
import { render } from 'react-dom'
import Ranking from './components/Ranking'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

function App() {
  return (
    <div className="bg-gray-800 min-h-screen">
      <DndProvider backend={HTML5Backend}>
        <Ranking />
      </DndProvider>
    </div>
  )
}

const rootElement = document.getElementById('root')
render(<App />, rootElement)

export default App;
