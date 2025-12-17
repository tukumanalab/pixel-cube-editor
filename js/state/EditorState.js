// EditorState.js - Central state management with Observer pattern

export class EditorState {
  constructor() {
    // Initialize 6 faces with 16x16 white pixels
    this.faces = {
      top: this.createEmptyFace(),
      bottom: this.createEmptyFace(),
      front: this.createEmptyFace(),
      back: this.createEmptyFace(),
      left: this.createEmptyFace(),
      right: this.createEmptyFace()
    };

    this.currentFace = 'front';
    this.currentColor = '#000000';
    this.tool = 'draw'; // Future: 'draw', 'fill', 'eyedropper'

    // Observer pattern - event listeners
    this.listeners = new Map();
  }

  // Create a 16x16 array filled with white color
  createEmptyFace() {
    return Array(16).fill(null).map(() => Array(16).fill('#FFFFFF'));
  }

  // Get pixel color at position
  getPixel(face, x, y) {
    if (!this.faces[face]) return null;
    if (y < 0 || y >= 16 || x < 0 || x >= 16) return null;
    return this.faces[face][y][x];
  }

  // Set pixel and notify observers
  setPixel(face, x, y, color) {
    if (!this.faces[face]) return;
    if (y < 0 || y >= 16 || x < 0 || x >= 16) return;

    this.faces[face][y][x] = color;
    this.notify('pixelChange', { face, x, y, color });
  }

  // Set current color
  setCurrentColor(color) {
    this.currentColor = color;
    this.notify('colorChange', { color });
  }

  // Set current face
  setCurrentFace(face) {
    if (!this.faces[face]) return;
    this.currentFace = face;
    this.notify('faceChange', { face });
  }

  // Copy one face to another
  copyFace(sourceFace, targetFace) {
    if (!this.faces[sourceFace] || !this.faces[targetFace]) return;

    // Deep clone the face data
    this.faces[targetFace] = this.faces[sourceFace].map(row => [...row]);
    this.notify('faceCopied', { sourceFace, targetFace });
    this.notify('stateRestored', { faces: this.faces });
  }

  // Clear a face (fill with white)
  clearFace(face) {
    if (!this.faces[face]) return;
    this.faces[face] = this.createEmptyFace();
    this.notify('faceCleared', { face });
    this.notify('stateRestored', { faces: this.faces });
  }

  // Get snapshot for history (deep copy)
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.faces));
  }

  // Restore from snapshot
  restore(snapshot) {
    this.faces = JSON.parse(JSON.stringify(snapshot));
    this.notify('stateRestored', { faces: this.faces });
  }

  // Load faces from external data (for import)
  loadFaces(facesData) {
    if (!facesData || typeof facesData !== 'object') return false;

    // Validate that all required faces exist
    const requiredFaces = ['top', 'bottom', 'front', 'back', 'left', 'right'];
    for (const face of requiredFaces) {
      if (!facesData[face]) return false;
    }

    this.faces = JSON.parse(JSON.stringify(facesData));
    this.notify('stateRestored', { faces: this.faces });
    return true;
  }

  // Observer pattern: Subscribe to events
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
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

  // Observer pattern: Notify all listeners of an event
  notify(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Get all faces data
  getAllFaces() {
    return this.faces;
  }
}
