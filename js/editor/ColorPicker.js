// ColorPicker.js - Color selection and palette management

export class ColorPicker {
  constructor(colorPickerElement, paletteContainer, editorState) {
    this.colorPickerElement = colorPickerElement;
    this.paletteContainer = paletteContainer;
    this.faceColorsContainer = document.getElementById('face-colors-grid');
    this.editorState = editorState;

    // HTML basic 16 colors (non-deletable)
    this.palette = [
      '#FFFFFF', // White
      '#C0C0C0', // Silver
      '#808080', // Gray
      '#000000', // Black
      '#FF0000', // Red
      '#800000', // Maroon
      '#FFFF00', // Yellow
      '#808000', // Olive
      '#00FF00', // Lime
      '#008000', // Green
      '#00FFFF', // Aqua
      '#008080', // Teal
      '#0000FF', // Blue
      '#000080', // Navy
      '#FF00FF', // Fuchsia
      '#800080'  // Purple
    ];

    this.init();
  }

  init() {
    // Color picker input change
    this.colorPickerElement.addEventListener('input', (e) => {
      this.setColor(e.target.value);
    });

    // Add color button
    const addColorBtn = document.getElementById('add-color-btn');
    if (addColorBtn) {
      addColorBtn.addEventListener('click', () => {
        this.addColor(this.editorState.currentColor);
      });
    }

    // Subscribe to state changes to update face colors
    this.editorState.subscribe('stateRestored', () => {
      this.renderFaceColors();
    });

    this.editorState.subscribe('pixelChange', () => {
      this.renderFaceColors();
    });

    // Subscribe to pixel hover events
    this.editorState.subscribe('pixelHover', (data) => {
      this.highlightHoveredColor(data.color);
    });

    // Render palette
    this.renderPalette();
    this.renderFaceColors();
  }

  setColor(color) {
    this.editorState.setCurrentColor(color);
    this.colorPickerElement.value = color;
  }

  renderPalette() {
    this.paletteContainer.innerHTML = '';

    this.palette.forEach((color, index) => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'palette-color';
      colorDiv.style.backgroundColor = color;
      colorDiv.title = color;
      colorDiv.dataset.color = color;

      // Check if current color
      if (color === this.editorState.currentColor) {
        colorDiv.classList.add('selected');
      }

      // Click to select color
      colorDiv.addEventListener('click', () => {
        this.setColor(color);
        this.renderPalette(); // Re-render to update selected state
      });

      // Remove color button (except for HTML basic 16 colors)
      if (index >= 16) {
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-color';
        removeBtn.textContent = '削除';
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.removeColor(index);
        });
        colorDiv.appendChild(removeBtn);
      }

      this.paletteContainer.appendChild(colorDiv);
    });
  }

  addColor(color) {
    // Check if color already exists
    if (this.palette.includes(color.toUpperCase())) {
      return;
    }

    // Limit palette size
    if (this.palette.length >= 32) {
      alert('パレットが満杯です。色を削除してから追加してください。');
      return;
    }

    this.palette.push(color);
    this.renderPalette();
  }

  removeColor(index) {
    if (index < 16) return; // Protect HTML basic 16 colors

    this.palette.splice(index, 1);
    this.renderPalette();
  }

  getPalette() {
    return [...this.palette];
  }

  loadPalette(palette) {
    if (Array.isArray(palette)) {
      this.palette = palette;
      this.renderPalette();
    }
  }

  // Extract all unique colors from 6 faces
  extractFaceColors() {
    const faces = this.editorState.getAllFaces();
    const colorSet = new Set();

    // Iterate through all 6 faces
    Object.values(faces).forEach(face => {
      // Each face is a 16x16 array
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          colorSet.add(face[y][x]);
        }
      }
    });

    // Convert Set to sorted array
    return Array.from(colorSet).sort();
  }

  // Render face colors palette (second row)
  renderFaceColors() {
    if (!this.faceColorsContainer) return;

    const faceColors = this.extractFaceColors();
    this.faceColorsContainer.innerHTML = '';

    faceColors.forEach(color => {
      const colorDiv = document.createElement('div');
      colorDiv.className = 'palette-color face-color';
      colorDiv.style.backgroundColor = color;
      colorDiv.title = color;
      colorDiv.dataset.color = color;

      // Check if current color
      if (color === this.editorState.currentColor) {
        colorDiv.classList.add('selected');
      }

      // Click to select color
      colorDiv.addEventListener('click', () => {
        this.setColor(color);
        this.renderPalette(); // Re-render to update selected state
        this.renderFaceColors(); // Re-render to update selected state
      });

      this.faceColorsContainer.appendChild(colorDiv);
    });
  }

  // Highlight palette colors matching the hovered pixel color
  highlightHoveredColor(color) {
    // Get all palette colors (both rows)
    const allPaletteColors = [
      ...this.paletteContainer.querySelectorAll('.palette-color'),
      ...this.faceColorsContainer.querySelectorAll('.palette-color')
    ];

    // Remove all hover-highlight classes
    allPaletteColors.forEach(el => {
      el.classList.remove('hover-highlight');
    });

    // If color is null, we're done (mouse left the grid)
    if (!color) return;

    // Add hover-highlight to matching colors
    allPaletteColors.forEach(el => {
      const elColor = el.dataset.color || el.title;
      if (elColor && elColor.toUpperCase() === color.toUpperCase()) {
        el.classList.add('hover-highlight');
      }
    });
  }
}
