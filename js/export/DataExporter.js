// DataExporter.js - Export/Import JSON data

import { downloadFile } from '../utils/helpers.js';

export class DataExporter {
  constructor(editorState) {
    this.editorState = editorState;
  }

  // Export all face data as JSON
  exportJSON() {
    const data = {
      version: '1.0',
      gridSize: 16,
      faces: this.editorState.getAllFaces(),
      exportDate: new Date().toISOString()
    };

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadFile(blob, 'pixel-cube-design.json');
  }

  // Import face data from JSON file
  importJSON(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);

          // Validate data structure
          if (!data.version || !data.faces) {
            throw new Error('Invalid file format: Missing version or faces data');
          }

          if (data.gridSize && data.gridSize !== 16) {
            throw new Error(`Incompatible grid size: Expected 16, got ${data.gridSize}`);
          }

          // Validate all required faces exist
          const requiredFaces = ['top', 'bottom', 'front', 'back', 'left', 'right'];
          for (const face of requiredFaces) {
            if (!data.faces[face]) {
              throw new Error(`Missing face data: ${face}`);
            }

            // Validate face dimensions
            if (data.faces[face].length !== 16) {
              throw new Error(`Invalid face dimensions for ${face}`);
            }

            for (const row of data.faces[face]) {
              if (row.length !== 16) {
                throw new Error(`Invalid row length in face ${face}`);
              }
            }
          }

          // Load the data into editor state
          const success = this.editorState.loadFaces(data.faces);

          if (success) {
            resolve(data);
          } else {
            reject(new Error('Failed to load face data into editor'));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }
}
