// PixelGrid.js - 16x16 pixel grid canvas component

import { getMousePos } from '../utils/helpers.js';

export class PixelGrid {
  constructor(container, editorState, history) {
    this.container = container;
    this.editorState = editorState;
    this.history = history;
    this.canvas = null;
    this.ctx = null;
    this.cellSize = 15; // 15px per cell = 240px total
    this.gridSize = 16;
    this.isDrawing = false;
    this.lastDrawnCell = null; // Prevent drawing same cell multiple times
    this.hoveredCell = null; // Track hovered cell for highlighting

    this.init();
  }

  init() {
    // Create canvas element
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.cellSize * this.gridSize;
    this.canvas.height = this.cellSize * this.gridSize;
    this.ctx = this.canvas.getContext('2d');

    this.container.appendChild(this.canvas);

    // Event listeners for drawing
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('mouseleave', () => {
      this.handleMouseUp();
      this.handleMouseLeave();
    });

    // Touch support for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleMouseUp();
    });

    // Subscribe to state changes
    this.editorState.subscribe('pixelChange', (data) => {
      if (data.face === this.editorState.currentFace) {
        this.render();
      }
    });

    this.editorState.subscribe('faceChange', () => {
      this.render();
    });

    this.editorState.subscribe('stateRestored', () => {
      this.render();
    });

    // Initial render
    this.render();
  }

  handleMouseDown(e) {
    this.isDrawing = true;
    this.lastDrawnCell = null;
    this.drawPixel(e);
    // Save state for undo/redo
    this.history.saveState();
  }

  handleMouseMove(e) {
    if (this.isDrawing) {
      this.drawPixel(e);
    } else {
      // Emit hover event when not drawing
      this.handlePixelHover(e);
    }
  }

  handleMouseUp() {
    this.isDrawing = false;
    this.lastDrawnCell = null;
  }

  handlePixelHover(e) {
    const pos = getMousePos(this.canvas, e);
    const x = Math.floor(pos.x / this.cellSize);
    const y = Math.floor(pos.y / this.cellSize);

    // Check bounds
    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
      this.hoveredCell = null;
      this.render();
      return;
    }

    const face = this.editorState.currentFace;
    const color = this.editorState.getPixel(face, x, y);

    // Update hovered cell and re-render
    this.hoveredCell = { x, y };
    this.render();

    // Notify listeners about hover color
    this.editorState.notify('pixelHover', { color });
  }

  handleMouseLeave() {
    // Clear hover state
    this.hoveredCell = null;
    this.render();
    this.editorState.notify('pixelHover', { color: null });
  }

  drawPixel(e) {
    const pos = getMousePos(this.canvas, e);
    const centerX = Math.floor(pos.x / this.cellSize);
    const centerY = Math.floor(pos.y / this.cellSize);

    // Check bounds
    if (centerX < 0 || centerX >= this.gridSize || centerY < 0 || centerY >= this.gridSize) return;

    // Prevent drawing same cell multiple times in one drag
    const cellKey = `${centerX},${centerY}`;
    if (this.lastDrawnCell === cellKey) return;
    this.lastDrawnCell = cellKey;

    const face = this.editorState.currentFace;
    const color = this.editorState.currentColor;
    const brushSize = this.editorState.brushSize;

    // Draw with brush size
    const offset = Math.floor(brushSize / 2);
    for (let dy = 0; dy < brushSize; dy++) {
      for (let dx = 0; dx < brushSize; dx++) {
        const x = centerX - offset + dx;
        const y = centerY - offset + dy;
        // Only draw if within bounds
        if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
          this.editorState.setPixel(face, x, y, color);
        }
      }
    }
  }

  render() {
    const face = this.editorState.currentFace;

    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw pixels
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const color = this.editorState.getPixel(face, x, y);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
          x * this.cellSize,
          y * this.cellSize,
          this.cellSize,
          this.cellSize
        );
      }
    }

    // Draw grid lines
    this.ctx.strokeStyle = '#CCCCCC';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= this.gridSize; i++) {
      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.cellSize + 0.5, 0);
      this.ctx.lineTo(i * this.cellSize + 0.5, this.canvas.height);
      this.ctx.stroke();

      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.cellSize + 0.5);
      this.ctx.lineTo(this.canvas.width, i * this.cellSize + 0.5);
      this.ctx.stroke();
    }

    // Draw hover highlight
    if (this.hoveredCell) {
      this.ctx.strokeStyle = '#00BFFF';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(
        this.hoveredCell.x * this.cellSize + 1,
        this.hoveredCell.y * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2
      );
    }
  }

  // Clean up
  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
  }
}
