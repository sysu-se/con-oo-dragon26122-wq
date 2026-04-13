import { createSudoku, createSudokuFromJSON } from './sudoku.js';

function cloneSnapshot(snapshot) {
  return JSON.parse(JSON.stringify(snapshot));
}

function createEmptyGrid() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function createGameWithState({ sudoku, undoStack = [], redoStack = [] } = {}) {
  let currentSudoku = sudoku ?? createSudoku(createEmptyGrid());
  const undo = undoStack.map(cloneSnapshot);
  const redo = redoStack.map(cloneSnapshot);

  function snapshotCurrent() {
    return currentSudoku.toJSON();
  }

  return {
    getSudoku() {
      return currentSudoku;
    },

    guess(move) {
      undo.push(snapshotCurrent());
      redo.length = 0;
      currentSudoku.guess(move);
      return this;
    },

    undo() {
      if (!undo.length) return this;
      redo.push(snapshotCurrent());
      currentSudoku = createSudokuFromJSON(undo.pop());
      return this;
    },

    redo() {
      if (!redo.length) return this;
      undo.push(snapshotCurrent());
      currentSudoku = createSudokuFromJSON(redo.pop());
      return this;
    },

    canUndo() {
      return undo.length > 0;
    },

    canRedo() {
      return redo.length > 0;
    },

    toJSON() {
      return {
        current: snapshotCurrent(),
        undoStack: undo.map(cloneSnapshot),
        redoStack: redo.map(cloneSnapshot),
      };
    },
  };
}

export function createGame({ sudoku } = {}) {
  return createGameWithState({ sudoku });
}

export function createGameFromJSON(json) {
  if (!json || typeof json !== 'object') {
    throw new Error('Invalid Game JSON data.');
  }

  return createGameWithState({
    sudoku: createSudokuFromJSON(json.current),
    undoStack: Array.isArray(json.undoStack) ? json.undoStack : [],
    redoStack: Array.isArray(json.redoStack) ? json.redoStack : [],
  });
}
