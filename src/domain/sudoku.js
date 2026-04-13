const SUDOKU_SIZE = 9;

function cloneGrid(grid) {
  return grid.map((row) => row.slice());
}

function assertGrid(grid) {
  if (!Array.isArray(grid) || grid.length !== SUDOKU_SIZE) {
    throw new Error('Sudoku grid must be a 9x9 numeric matrix.');
  }

  for (const row of grid) {
    if (!Array.isArray(row) || row.length !== SUDOKU_SIZE) {
      throw new Error('Sudoku grid must be a 9x9 numeric matrix.');
    }
    for (const cell of row) {
      if (!Number.isInteger(cell) || cell < 0 || cell > 9) {
        throw new Error('Sudoku cell must be an integer from 0 to 9.');
      }
    }
  }
}

function assertMove(move) {
  if (!move || typeof move !== 'object') {
    throw new Error('Move must be an object.');
  }

  const { row, col, value } = move;
  if (!Number.isInteger(row) || row < 0 || row >= SUDOKU_SIZE) {
    throw new Error('Move row must be an integer between 0 and 8.');
  }
  if (!Number.isInteger(col) || col < 0 || col >= SUDOKU_SIZE) {
    throw new Error('Move col must be an integer between 0 and 8.');
  }
  if (!Number.isInteger(value) || value < 0 || value > 9) {
    throw new Error('Move value must be an integer between 0 and 9.');
  }
}

function computeInvalidCells(grid) {
  const invalid = new Set();
  const mark = (row, col) => invalid.add(`${row},${col}`);

  for (let row = 0; row < SUDOKU_SIZE; row += 1) {
    const seen = new Map();
    for (let col = 0; col < SUDOKU_SIZE; col += 1) {
      const value = grid[row][col];
      if (value === 0) continue;
      if (seen.has(value)) {
        mark(row, col);
        mark(row, seen.get(value));
      } else {
        seen.set(value, col);
      }
    }
  }

  for (let col = 0; col < SUDOKU_SIZE; col += 1) {
    const seen = new Map();
    for (let row = 0; row < SUDOKU_SIZE; row += 1) {
      const value = grid[row][col];
      if (value === 0) continue;
      if (seen.has(value)) {
        mark(row, col);
        mark(seen.get(value), col);
      } else {
        seen.set(value, row);
      }
    }
  }

  for (let boxRow = 0; boxRow < 3; boxRow += 1) {
    for (let boxCol = 0; boxCol < 3; boxCol += 1) {
      const seen = new Map();
      for (let dRow = 0; dRow < 3; dRow += 1) {
        for (let dCol = 0; dCol < 3; dCol += 1) {
          const row = boxRow * 3 + dRow;
          const col = boxCol * 3 + dCol;
          const value = grid[row][col];
          if (value === 0) continue;
          if (seen.has(value)) {
            const [prevRow, prevCol] = seen.get(value);
            mark(row, col);
            mark(prevRow, prevCol);
          } else {
            seen.set(value, [row, col]);
          }
        }
      }
    }
  }

  return Array.from(invalid);
}

export function createSudoku(initialGrid) {
  assertGrid(initialGrid);
  let grid = cloneGrid(initialGrid);

  return {
    getGrid() {
      return cloneGrid(grid);
    },

    guess(move) {
      assertMove(move);
      const { row, col, value } = move;
      grid[row][col] = value;
      return this;
    },

    getInvalidCells() {
      return computeInvalidCells(grid);
    },

    isValid() {
      return this.getInvalidCells().length === 0;
    },

    clone() {
      return createSudoku(grid);
    },

    toJSON() {
      return { grid: this.getGrid() };
    },

    toString() {
      return grid
        .map((row) => row.map((value) => (value === 0 ? '.' : String(value))).join(' '))
        .join('\n');
    },
  };
}

export function createSudokuFromJSON(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid Sudoku JSON data.');
  }
  return createSudoku(json.grid);
}
