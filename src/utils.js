const blocks2 = [Array(2).fill([1, 1, 2, 2]), Array(2).fill([3, 3, 4, 4])].flat(
  2
)

const blocks3 = [
  Array(3).fill([1, 1, 1, 2, 2, 2, 3, 3, 3]),
  Array(3).fill([4, 4, 4, 5, 5, 5, 6, 6, 6]),
  Array(3).fill([7, 7, 7, 8, 8, 8, 9, 9, 9])
].flat(2)

export const generateGrid = (blockSize = 3) => {
  const elements = blockSize === 3 ? 81 : 16
  return Array(elements).fill(0)
}

const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const fillGrid = (grid, blockSize = 3) => {
  const gridSize = blockSize === 3 ? 9 : 4

  const stack = []
  let currentIndex = 0
  let currentValue = grid[currentIndex]

  let numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
  let numberIndex = 0

  while (hasZeros(grid)) {
    if (currentValue === 0) {
      if (
        isLegal(grid, currentIndex, numbers[numberIndex], blockSize) &&
        numberIndex < gridSize
      ) {
        grid[currentIndex] = numbers[numberIndex]
        stack.push(currentIndex)
        numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
        numberIndex = -1
        currentIndex = currentIndex + 1
        currentValue = grid[currentIndex]
      } else if (numberIndex > gridSize - 1) {
        grid[currentIndex] = 0
        currentIndex = stack.pop()
        numberIndex = numbers.indexOf(grid[currentIndex])
        grid[currentIndex] = 0
      }
    } else {
      currentIndex = currentIndex + 1
      currentValue = grid[currentIndex]
      numbers = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])
      numberIndex = -1
    }
    numberIndex = numberIndex + 1
  }
  return grid
}

export const includeBlockInfo = (grid, blockSize = 3) => {
  const blocks = blockSize === 3 ? blocks3 : blocks2

  return grid.map((cell, index) => ({
    value: cell,
    block: blocks[index],
    position: index,
    readonly: !!cell,
    pencil: new Set()
  }))
}

export const groupByBlock = grid => {
  return grid.reduce((acc, cell) => {
    // The blocks starts at 1
    const block = cell.block - 1

    if (acc[block]) {
      acc[block].push(cell)
    } else {
      acc[block] = [cell]
    }
    return acc
  }, [])
}

const numberOfCells = {
  easy: 62,
  medium: 53,
  hard: 44,
  veryHard: 35,
  insane: 26
}

export const applyGameDifficult = (difficult, grid) => {
  const indexes = new Set()
  while (indexes.size !== 81 - numberOfCells[difficult]) {
    const randomIndex = Math.floor(Math.random() * 81)
    indexes.add(randomIndex)
  }
  for (const index of indexes) {
    grid[index] = null
  }
  return grid
}

export const isLegal = (grid, position, number, blockSize = 3) => {
  const usedNumbers = new Set()

  const gridSize = blockSize === 3 ? 9 : 4
  const blocks = blockSize === 3 ? blocks3 : blocks2

  // Row
  const row = Math.floor(position / gridSize)
  grid.forEach((cell, index) => {
    if (Math.floor(index / gridSize) === row) {
      usedNumbers.add(cell)
    }
  })

  // Column
  const column = position % gridSize
  grid.forEach((cell, index) => {
    if (Math.floor(index % gridSize) === column) {
      usedNumbers.add(cell)
    }
  })

  // Block
  const block = blocks[position]
  grid.forEach((cell, index) => {
    if (blocks[index] === block) {
      usedNumbers.add(cell)
    }
  })

  return !usedNumbers.has(number)
}

export const hasZeros = grid => {
  return grid.filter(item => item === 0).length !== 0
}

export const getAvailableNumber = (restrictions, blockSize = 3) => {
  const gridSize = blockSize === 3 ? 9 : 4
  let value = null

  while (!value) {
    const number = Math.floor(Math.random() * gridSize) + 1
    if (!restrictions.has(number)) {
      value = number
    }
  }
  return value
}

export const getErrors = grid => {
  return grid.filter(cell => cell.error).length
}

export const getMissingValues = (grid, errors) => {
  return grid.filter(cell => cell.value === null).length + errors
}

export const validateKeyInteraction = (key, position) => {
  const value = parseInt(key, 10)

  if (key === 'ArrowDown' && position < 72) {
    return [true, 'down']
  } else if (key === 'ArrowUp' && position > 8) {
    return [true, 'up']
  } else if (key === 'ArrowLeft' && position % 9 > 0) {
    return [true, 'left']
  } else if (key === 'ArrowRight' && position % 9 < 8) {
    return [true, 'right']
  } else if (Number.isInteger(value)) {
    return [true, 'digit']
  }

  return [false, null]
}

export const getNewActivePosition = (position, action) => {
  if (action === 'down') {
    return position + 9
  } else if (action === 'up') {
    return position - 9
  } else if (action === 'left') {
    return position - 1
  } else if (action === 'right') {
    return position + 1
  }
}
