// ColorPicker.js - Color selection and palette management

export class ColorPicker {
  constructor(colorPickerElement, paletteContainer, editorState) {
    this.colorPickerElement = colorPickerElement;
    this.paletteContainer = paletteContainer;
    this.editorState = editorState;

    // Default Minecraft-inspired color palette
    this.palette = [
      '#FFFFFF', // White
      '#000000', // Black
      '#808080', // Gray
      '#C0C0C0', // Light Gray
      '#8B4513', // Brown
      '#D2691E', // Chocolate
      '#228B22', // Forest Green
      '#32CD32', // Lime Green
      '#006400', // Dark Green
      '#4169E1', // Royal Blue
      '#1E90FF', // Dodger Blue
      '#00008B', // Dark Blue
      '#FF0000', // Red
      '#DC143C', // Crimson
      '#FFD700', // Gold
      '#FFA500', // Orange
      '#FFFF00', // Yellow
      '#800080', // Purple
      '#FF00FF', // Magenta
      '#FFC0CB', // Pink
      '#A52A2A', // Brown
      '#F5DEB3', // Wheat
      '#D2B48C', // Tan
      '#708090'  // Slate Gray
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

    // Render palette
    this.renderPalette();
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

      // Check if current color
      if (color === this.editorState.currentColor) {
        colorDiv.classList.add('selected');
      }

      // Click to select color
      colorDiv.addEventListener('click', () => {
        this.setColor(color);
        this.renderPalette(); // Re-render to update selected state
      });

      // Remove color button (except for first few default colors)
      if (index >= 8) {
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-color';
        removeBtn.textContent = '×';
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
    if (index < 8) return; // Protect default colors

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
}
