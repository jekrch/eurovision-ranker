
import { render } from 'react-dom'
import Ranking from './components/Ranking'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import { TouchBackend } from 'react-dnd-touch-backend';

function App() {
  return (
    <div className="bg-gray-800 min-h-screen">
      <DndProvider backend={TouchBackend} options={{ enableMouseEvents: true }}>
        <Ranking />
      </DndProvider>
    </div>
  )
}

const rootElement = document.getElementById('root')
render(<App />, rootElement)

export default App;
