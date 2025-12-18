// ColorPicker.js - Color selection and palette management

export class ColorPicker {
  constructor(colorPickerElement, paletteContainer, editorState) {
    this.colorPickerElement = colorPickerElement;
    this.paletteContainer = paletteContainer;
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
}
