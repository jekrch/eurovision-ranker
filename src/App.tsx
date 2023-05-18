

import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useState } from 'react';
import { Card } from './components/Card';
import { countries2023 } from './data/Countries';

function App() {

  const [items, setItems] = useState(countries2023);

  function handleOnDragEnd(result: any) {
    console.log(result)
    if (!result.destination) return;
    const itemsArray = Array.from(items);
    const [reorderedItem] = itemsArray.splice(result.source.index, 1);
    itemsArray.splice(result.destination.index, 0, reorderedItem);
    setItems(itemsArray);
  }

  return (
    <div className="bg-[#040241] min-h-screen">

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <Droppable droppableId="items">
          {(provided) => (
            <ul 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="m-auto pt-10"
            >
              {items.map(({ id, content }, index) => (
                <Draggable key={id.toString()} draggableId={id.toString()} index={index}>
                {(provided: any) => (
                  <li 
                    ref={provided.innerRef} 
                    {...provided.draggableProps} 
                    {...provided.dragHandleProps}
                  >
                    <Card 
                      id={id} 
                      className="w-60 m-auto text-slate-400 bg-black"
                      name={content}
                    />
                  </li>
                )}
              </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>

    </div>


  )
}

// const rootElement = document.getElementById('root')
// render(<App />, rootElement)

export default App;
