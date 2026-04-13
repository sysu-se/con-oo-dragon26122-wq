import { createSudokuFromJSON } from './sudoku.js';

function cloneSnapshot(snapshot) {
	return { grid: snapshot.grid.map((row) => row.slice()) };
}

function createGameWithState({ sudoku, undoStack = [], redoStack = [] }) {
	let current = sudoku;
	const undo = undoStack.map(cloneSnapshot);
	const redo = redoStack.map(cloneSnapshot);

	function restore(snapshot) {
		current = createSudokuFromJSON(snapshot);
	}

	return {
		getSudoku() {
			return current;
		},
		guess(move) {
			undo.push(cloneSnapshot(current.toJSON()));
			redo.length = 0;
			current.guess(move);
		},
		undo() {
			if (!undo.length) return false;
			redo.push(cloneSnapshot(current.toJSON()));
			restore(undo.pop());
			return true;
		},
		redo() {
			if (!redo.length) return false;
			undo.push(cloneSnapshot(current.toJSON()));
			restore(redo.pop());
			return true;
		},
		canUndo() {
			return undo.length > 0;
		},
		canRedo() {
			return redo.length > 0;
		},
		toJSON() {
			return {
				sudoku: cloneSnapshot(current.toJSON()),
				undoStack: undo.map(cloneSnapshot),
				redoStack: redo.map(cloneSnapshot),
			};
		},
	};
}

export function createGame({ sudoku }) {
	return createGameWithState({ sudoku });
}

export function createGameFromJSON(json) {
	return createGameWithState({
		sudoku: createSudokuFromJSON(json.sudoku),
		undoStack: json.undoStack ?? [],
		redoStack: json.redoStack ?? [],
	});
}
