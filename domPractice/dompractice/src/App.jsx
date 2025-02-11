import { useState } from 'react'
import './App.css'

function App() {
  const [elements, setElements] = useState([])
  const [counter, setCounter] = useState(0)

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF'
    let color = '#'
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)]
      console.log("Nuevo color " + color)
    }
    return color
  }

  const handleAdd = () => {
    const newCounter = counter + 1
    setCounter(newCounter)
    const newElement = { uid: newCounter, color: getRandomColor() }
    setElements([...elements, newElement])
  }

  const handleClear = () => {
    setElements([])
    setCounter(0)
  }

  const handleDelete = (uid) => {
    const newElements = elements.filter(el => el.uid !== uid)
    setElements(newElements)
  }

  return (
    <>
      <div className='block max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700'>
        <h1>Modicicador del DOM</h1>
        <div className='flex items-center justify-center space-x-4'>
          <button className='px-4 py-2 mt-4 text-white bg-blue-500 rounded-lg hover:bg-blue-700' onClick={handleAdd}>
            Add element to DOM
          </button>
          <button className='px-4 py-2 mt-4 text-white bg-red-500 rounded-lg hover:bg-red-700' onClick={handleClear}>
            Clear DOM
          </button>
        </div>
        <ul className='mt-4'>
          {elements.map((el, index) => (
            <li key={el.uid} style={{ backgroundColor: el.color }} className='flex items-center justify-between p-2 border rounded mt-2 cursor-pointer' onClick={() => handleDelete(el.uid)}>
              <span>Elemento {index + 1} 👍 </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default App
