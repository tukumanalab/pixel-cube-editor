// ImageExporter.js - Export faces as PNG images

import { downloadDataURL } from '../utils/helpers.js';

export class ImageExporter {
  constructor(editorState) {
    this.editorState = editorState;
  }

  // Export a single face as PNG
  exportFace(faceName) {
    const canvas = this.createFaceCanvas(faceName);
    const dataURL = canvas.toDataURL('image/png');
    downloadDataURL(dataURL, `${faceName}.png`);
  }

  // Export all 6 faces as separate PNG files
  exportAllFaces() {
    const faces = ['top', 'bottom', 'front', 'back', 'left', 'right'];

    faces.forEach((face, index) => {
      // Stagger downloads to avoid browser blocking
      setTimeout(() => {
        this.exportFace(face);
      }, index * 200);
    });
  }

  // Export texture atlas (all faces in one image) - Minecraft format
  exportTextureAtlas() {
    const canvas = document.createElement('canvas');
    canvas.width = 16 * 4; // 4 columns
    canvas.height = 16 * 3; // 3 rows
    const ctx = canvas.getContext('2d');

    // Layout (Minecraft cross format):
    //          [top]
    // [left] [front] [right] [back]
    //        [bottom]

    const positions = {
      top: { x: 1, y: 0 },
      bottom: { x: 1, y: 2 },
      front: { x: 1, y: 1 },
      back: { x: 3, y: 1 },
      left: { x: 0, y: 1 },
      right: { x: 2, y: 1 }
    };

    // Draw each face in its position
    Object.entries(positions).forEach(([face, pos]) => {
      const faceData = this.editorState.faces[face];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          ctx.fillStyle = faceData[y][x];
          ctx.fillRect(pos.x * 16 + x, pos.y * 16 + y, 1, 1);
        }
      }
    });

    const dataURL = canvas.toDataURL('image/png');
    downloadDataURL(dataURL, 'texture-atlas.png');
  }

  // Helper: Create a canvas from face data
  createFaceCanvas(faceName) {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    const faceData = this.editorState.faces[faceName];
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = faceData[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    return canvas;
  }
}
