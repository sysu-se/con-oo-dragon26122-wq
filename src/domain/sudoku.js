const SUDOKU_SIZE = 9;
const BOX_SIZE = 3;

function cloneGrid(grid) {
	return grid.map((row) => row.slice());
}

function assertGrid(grid) {
	if (!Array.isArray(grid) || grid.length !== SUDOKU_SIZE) {
		throw new Error('Sudoku grid must be a 9x9 array.');
	}
	for (const row of grid) {
		if (!Array.isArray(row) || row.length !== SUDOKU_SIZE) {
			throw new Error('Sudoku grid must be a 9x9 array.');
		}
		for (const cell of row) {
			if (typeof cell !== 'number' || cell < 0 || cell > 9) {
				throw new Error('Sudoku cells must be numbers between 0 and 9.');
			}
		}
	}
}

export function findInvalidCells(grid) {
	const invalid = new Set();
	const add = (row, col) => invalid.add(`${col},${row}`);

	for (let row = 0; row < SUDOKU_SIZE; row += 1) {
		for (let col = 0; col < SUDOKU_SIZE; col += 1) {
			const value = grid[row][col];
			if (value === 0) continue;

			for (let i = 0; i < SUDOKU_SIZE; i += 1) {
				if (i !== col && grid[row][i] === value) {
					add(row, col);
					add(row, i);
				}
				if (i !== row && grid[i][col] === value) {
					add(row, col);
					add(i, col);
				}
			}

			const startRow = Math.floor(row / BOX_SIZE) * BOX_SIZE;
			const startCol = Math.floor(col / BOX_SIZE) * BOX_SIZE;
			for (let r = startRow; r < startRow + BOX_SIZE; r += 1) {
				for (let c = startCol; c < startCol + BOX_SIZE; c += 1) {
					if ((r !== row || c !== col) && grid[r][c] === value) {
						add(row, col);
						add(r, c);
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
		guess({ row, col, value }) {
			if (row < 0 || row >= SUDOKU_SIZE || col < 0 || col >= SUDOKU_SIZE) return false;
			if (typeof value !== 'number' || value < 0 || value > 9) return false;
			grid[row][col] = value;
			return true;
		},
		getInvalidCells() {
			return findInvalidCells(grid);
		},
		isSolved() {
			for (let row = 0; row < SUDOKU_SIZE; row += 1) {
				for (let col = 0; col < SUDOKU_SIZE; col += 1) {
					if (grid[row][col] === 0) return false;
				}
			}
			return findInvalidCells(grid).length === 0;
		},
		clone() {
			return createSudoku(grid);
		},
		toJSON() {
			return { grid: cloneGrid(grid) };
		},
		toString() {
			return grid.map((row) => row.join(' ')).join('\n');
		},
	};
}

export function createSudokuFromJSON(json) {
	return createSudoku(json.grid);
}
