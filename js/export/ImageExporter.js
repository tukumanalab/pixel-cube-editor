// ImageExporter.js - Export faces as PNG images

import { downloadDataURL } from '../utils/helpers.js';

// jsPDF is loaded globally via script tag in index.html
const { jsPDF } = window.jspdf || window;

export class ImageExporter {
  constructor(editorState) {
    this.editorState = editorState;
  }

  // Export a single face as PNG
  exportFace(faceName, faceSizeMM = 40) {
    const MM_TO_PX = 3.78;
    const FACE_SIZE_PX = Math.round(faceSizeMM * MM_TO_PX);

    const faceData = this.editorState.faces[faceName];
    const canvas = this.scaleFaceToCanvas(faceData, FACE_SIZE_PX);
    const dataURL = canvas.toDataURL('image/png');
    downloadDataURL(dataURL, `${faceName}.png`);
  }

  // Export all 6 faces as separate PNG files
  exportAllFaces(faceSizeMM = 40) {
    const faces = ['top', 'bottom', 'front', 'back', 'left', 'right'];

    faces.forEach((face, index) => {
      // Stagger downloads to avoid browser blocking
      setTimeout(() => {
        this.exportFace(face, faceSizeMM);
      }, index * 200);
    });
  }

  // Export all 6 faces as separate PDF files (no margins)
  exportAllFacesAsPDF(faceSizeMM = 40) {
    const faces = ['top', 'bottom', 'front', 'back', 'left', 'right'];

    faces.forEach((face, index) => {
      // Stagger downloads to avoid browser blocking
      setTimeout(() => {
        this.exportFaceAsPDF(face, faceSizeMM);
      }, index * 200);
    });
  }

  // Export a single face as PDF (no margins)
  exportFaceAsPDF(faceName, faceSizeMM = 40) {
    const MM_TO_PX = 3.78;
    const FACE_SIZE_PX = Math.round(faceSizeMM * MM_TO_PX);

    // Create canvas with face data
    const faceData = this.editorState.faces[faceName];
    const canvas = this.scaleFaceToCanvas(faceData, FACE_SIZE_PX);
    const imgData = canvas.toDataURL('image/png');

    // Create PDF with exact face size, no margins
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [faceSizeMM, faceSizeMM]
    });

    // Add image to PDF with no margins
    doc.addImage(imgData, 'PNG', 0, 0, faceSizeMM, faceSizeMM);

    // Save PDF
    doc.save(`${faceName}.pdf`);
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

  // Export paper craft net (printable cube template with glue tabs)
  exportPaperCraftNet(faceSizeMM = 40) {
    const MM_TO_PX = 3.78;
    const TAB_SIZE_MM = faceSizeMM * 0.25; // Tab is 25% of face size
    const TAB_TAPER_MM = faceSizeMM * 0.125; // Taper is 12.5% of face size
    const FACE_SIZE_PX = Math.round(faceSizeMM * MM_TO_PX);
    const TAB_SIZE_PX = Math.round(TAB_SIZE_MM * MM_TO_PX);
    const TAB_TAPER_PX = Math.round(TAB_TAPER_MM * MM_TO_PX);

    // Create canvas
    const canvas = this.createPaperCraftCanvas(FACE_SIZE_PX, TAB_SIZE_PX);
    const ctx = canvas.getContext('2d');

    // Draw faces with tabs
    this.drawFacesWithTabs(ctx, FACE_SIZE_PX, TAB_SIZE_PX, TAB_TAPER_PX);

    // Draw cut lines
    this.drawCutLines(ctx, FACE_SIZE_PX, TAB_SIZE_PX, TAB_TAPER_PX);

    // Export as PDF
    const imgData = canvas.toDataURL('image/png');
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Calculate dimensions to fit on A4 with margins
    const canvasWidthMM = (canvas.width / MM_TO_PX);
    const canvasHeightMM = (canvas.height / MM_TO_PX);
    const marginMM = 10;

    // Add image to PDF
    doc.addImage(imgData, 'PNG', marginMM, marginMM, canvasWidthMM, canvasHeightMM);

    // Save PDF
    doc.save('papercraft.pdf');
  }

  // Create canvas for paper craft net
  createPaperCraftCanvas(faceSize, tabSize) {
    const canvas = document.createElement('canvas');
    // Layout: 4 faces wide + 1 tab (BACK's east tab)
    canvas.width = faceSize * 4 + tabSize;
    // Height: TOP's north tab + 3 faces + BOTTOM's south tab
    canvas.height = faceSize * 3 + tabSize * 2;

    const ctx = canvas.getContext('2d');
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    return canvas;
  }

  // Get tab configuration for each face
  getTabConfiguration(faceName) {
    const config = {
      top: ['north', 'east', 'west'],
      left: [],
      front: [],
      right: [],
      back: ['east'],
      bottom: ['east', 'west', 'south']
    };
    return config[faceName] || [];
  }

  // Calculate face position in pixels
  calculateFacePosition(gridX, gridY, faceSize, tabSize) {
    // Account for tabs in grid layout
    let x = gridX * faceSize;
    let y = gridY * faceSize;

    // No horizontal tab spacing needed (no left tabs)

    // Vertical tab spacing
    // gridY 0 (TOP): add tabSize for TOP's north tab
    if (gridY === 0) y += tabSize;
    // gridY 1 (middle row): add tabSize for TOP's north tab
    if (gridY === 1) y += tabSize;
    // gridY 2 (BOTTOM): add tabSize for TOP's north tab only
    if (gridY === 2) y += tabSize;

    return { x, y };
  }

  // Scale face data from 16x16 to target size
  scaleFaceToCanvas(faceData, targetSize) {
    const canvas = document.createElement('canvas');
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext('2d');

    // Disable smoothing for pixel art
    ctx.imageSmoothingEnabled = false;

    // Draw each pixel scaled up with no gaps
    const scale = targetSize / 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = faceData[y][x];
        // Round coordinates to integers and slightly overlap to prevent gaps
        const px = Math.floor(x * scale);
        const py = Math.floor(y * scale);
        const psize = Math.ceil(scale);
        ctx.fillRect(px, py, psize, psize);
      }
    }

    return canvas;
  }

  // Draw all faces with tabs
  drawFacesWithTabs(ctx, faceSize, tabSize, taperSize) {
    const positions = {
      top: { gridX: 1, gridY: 0 },
      left: { gridX: 0, gridY: 1 },
      front: { gridX: 1, gridY: 1 },
      right: { gridX: 2, gridY: 1 },
      back: { gridX: 3, gridY: 1 },
      bottom: { gridX: 1, gridY: 2 }
    };

    // Draw each face
    Object.entries(positions).forEach(([faceName, pos]) => {
      const { x, y } = this.calculateFacePosition(pos.gridX, pos.gridY, faceSize, tabSize);

      // Scale and draw face
      const faceData = this.editorState.faces[faceName];
      const faceCanvas = this.scaleFaceToCanvas(faceData, faceSize);
      ctx.drawImage(faceCanvas, x, y);

      // Draw tabs for this face
      const tabDirs = this.getTabConfiguration(faceName);
      tabDirs.forEach(dir => {
        this.drawTab(ctx, x, y, dir, faceSize, tabSize, taperSize);
      });
    });
  }

  // Draw a single trapezoidal tab
  drawTab(ctx, x, y, direction, faceSize, tabSize, taperSize) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();

    switch (direction) {
      case 'north':
        ctx.moveTo(x, y);
        ctx.lineTo(x + taperSize, y - tabSize);
        ctx.lineTo(x + faceSize - taperSize, y - tabSize);
        ctx.lineTo(x + faceSize, y);
        break;

      case 'south':
        ctx.moveTo(x, y + faceSize);
        ctx.lineTo(x + taperSize, y + faceSize + tabSize);
        ctx.lineTo(x + faceSize - taperSize, y + faceSize + tabSize);
        ctx.lineTo(x + faceSize, y + faceSize);
        break;

      case 'east':
        ctx.moveTo(x + faceSize, y);
        ctx.lineTo(x + faceSize + tabSize, y + taperSize);
        ctx.lineTo(x + faceSize + tabSize, y + faceSize - taperSize);
        ctx.lineTo(x + faceSize, y + faceSize);
        break;

      case 'west':
        ctx.moveTo(x, y);
        ctx.lineTo(x - tabSize, y + taperSize);
        ctx.lineTo(x - tabSize, y + faceSize - taperSize);
        ctx.lineTo(x, y + faceSize);
        break;
    }

    ctx.closePath();
    ctx.fill();
  }

  // Draw cut lines around the entire perimeter
  drawCutLines(ctx, faceSize, tabSize, taperSize) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1.5;

    const positions = {
      top: { gridX: 1, gridY: 0 },
      left: { gridX: 0, gridY: 1 },
      front: { gridX: 1, gridY: 1 },
      right: { gridX: 2, gridY: 1 },
      back: { gridX: 3, gridY: 1 },
      bottom: { gridX: 1, gridY: 2 }
    };

    // Draw outline for each face and its tabs
    Object.entries(positions).forEach(([faceName, pos]) => {
      const { x, y } = this.calculateFacePosition(pos.gridX, pos.gridY, faceSize, tabSize);
      const tabDirs = this.getTabConfiguration(faceName);

      // Draw tab outlines (face outline removed for cleaner output)
      tabDirs.forEach(dir => {
        ctx.beginPath();
        switch (dir) {
          case 'north':
            ctx.moveTo(x, y);
            ctx.lineTo(x + taperSize, y - tabSize);
            ctx.lineTo(x + faceSize - taperSize, y - tabSize);
            ctx.lineTo(x + faceSize, y);
            break;

          case 'south':
            ctx.moveTo(x, y + faceSize);
            ctx.lineTo(x + taperSize, y + faceSize + tabSize);
            ctx.lineTo(x + faceSize - taperSize, y + faceSize + tabSize);
            ctx.lineTo(x + faceSize, y + faceSize);
            break;

          case 'east':
            ctx.moveTo(x + faceSize, y);
            ctx.lineTo(x + faceSize + tabSize, y + taperSize);
            ctx.lineTo(x + faceSize + tabSize, y + faceSize - taperSize);
            ctx.lineTo(x + faceSize, y + faceSize);
            break;

          case 'west':
            ctx.moveTo(x, y);
            ctx.lineTo(x - tabSize, y + taperSize);
            ctx.lineTo(x - tabSize, y + faceSize - taperSize);
            ctx.lineTo(x, y + faceSize);
            break;
        }
        ctx.stroke();
      });
    });
  }
}
