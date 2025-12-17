// History.js - Undo/Redo history manager

export class History {
  constructor(editorState, maxStates = 50) {
    this.editorState = editorState;
    this.maxStates = maxStates;
    this.undoStack = [];
    this.redoStack = [];

    // Observer for history changes
    this.listeners = new Map();

    // Save initial state
    this.saveState();
  }

  // Save current state to history
  saveState() {
    const snapshot = this.editorState.getSnapshot();
    this.undoStack.push(snapshot);

    // Clear redo stack when new action is performed
    this.redoStack = [];

    // Limit stack size
    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift();
    }

    this.notifyHistoryChange();
  }

  // Undo last action
  undo() {
    if (this.undoStack.length <= 1) return false;

    const current = this.undoStack.pop();
    this.redoStack.push(current);

    const previous = this.undoStack[this.undoStack.length - 1];
    this.editorState.restore(previous);

    this.notifyHistoryChange();
    return true;
  }

  // Redo last undone action
  redo() {
    if (this.redoStack.length === 0) return false;

    const next = this.redoStack.pop();
    this.undoStack.push(next);
    this.editorState.restore(next);

    this.notifyHistoryChange();
    return true;
  }

  // Check if undo is available
  canUndo() {
    return this.undoStack.length > 1;
  }

  // Check if redo is available
  canRedo() {
    return this.redoStack.length > 0;
  }

  // Clear history
  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.saveState();
    this.notifyHistoryChange();
  }

  // Subscribe to history changes
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  // Notify listeners of history changes
  notifyHistoryChange() {
    const data = {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length
    };

    if (this.listeners.has('historyChange')) {
      this.listeners.get('historyChange').forEach(callback => callback(data));
    }
  }
}
