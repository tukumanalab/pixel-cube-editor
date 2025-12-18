// main.js - Application entry point

import { EditorState } from './state/EditorState.js';
import { History } from './state/History.js';
import { PixelGrid } from './editor/PixelGrid.js';
import { ColorPicker } from './editor/ColorPicker.js';
import { ThreePreview } from './preview/ThreePreview.js';
import { ImageExporter } from './export/ImageExporter.js';
import { PDFExporter } from './export/PDFExporter.js';

class App {
  constructor() {
    // Initialize core state management
    this.editorState = new EditorState();
    this.history = new History(this.editorState);

    // Initialize components
    this.initComponents();

    // Setup event listeners
    this.initEventListeners();

    console.log('Pixel Cube Editor initialized successfully!');
  }

  initComponents() {
    // Initialize 3D preview
    const previewContainer = document.getElementById('three-preview');
    if (previewContainer) {
      this.threePreview = new ThreePreview(previewContainer, this.editorState);
    }

    // Initialize pixel grid
    const gridContainer = document.getElementById('pixel-grid-container');
    if (gridContainer) {
      this.pixelGrid = new PixelGrid(gridContainer, this.editorState, this.history);
    }

    // Initialize color picker
    const colorPickerEl = document.getElementById('color-picker');
    const paletteContainer = document.getElementById('palette-grid');
    if (colorPickerEl && paletteContainer) {
      this.colorPicker = new ColorPicker(colorPickerEl, paletteContainer, this.editorState);
    }

    // Initialize exporters
    this.imageExporter = new ImageExporter(this.editorState);
    this.pdfExporter = new PDFExporter(this.editorState);
  }

  initEventListeners() {
    // Face tabs
    const faceTabs = document.querySelectorAll('.face-tab');
    faceTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        // Update active state
        faceTabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Update editor state
        const face = e.target.dataset.face;
        this.editorState.setCurrentFace(face);

        // Update face label
        this.updateCurrentFaceLabel(face);
      });
    });

    // Undo/Redo buttons
    const undoBtn = document.getElementById('undo-btn');
    const redoBtn = document.getElementById('redo-btn');

    if (undoBtn) {
      undoBtn.addEventListener('click', () => {
        this.history.undo();
      });
    }

    if (redoBtn) {
      redoBtn.addEventListener('click', () => {
        this.history.redo();
      });
    }

    // Update undo/redo button states
    this.history.subscribe('historyChange', (data) => {
      if (undoBtn) {
        undoBtn.disabled = !data.canUndo;
      }
      if (redoBtn) {
        redoBtn.disabled = !data.canRedo;
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.history.undo();
      }
      // Redo: Ctrl+Y / Cmd+Shift+Z
      else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.history.redo();
      }
    });

    // Export modal functionality
    const exportBtn = document.getElementById('export-btn');
    const exportModal = document.getElementById('export-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelExportBtn = document.getElementById('cancel-export-btn');
    const executeExportBtn = document.getElementById('execute-export-btn');
    const faceSizeSlider = document.getElementById('face-size');
    const sizeValue = document.getElementById('size-value');

    // Show modal
    if (exportBtn && exportModal) {
      exportBtn.addEventListener('click', () => {
        exportModal.style.display = 'flex';
      });
    }

    // Hide modal
    const hideModal = () => {
      if (exportModal) {
        exportModal.style.display = 'none';
      }
    };

    if (closeModalBtn) {
      closeModalBtn.addEventListener('click', hideModal);
    }

    if (cancelExportBtn) {
      cancelExportBtn.addEventListener('click', hideModal);
    }

    // Update size value display
    if (faceSizeSlider && sizeValue) {
      faceSizeSlider.addEventListener('input', (e) => {
        sizeValue.textContent = e.target.value;
      });
    }

    // Execute export
    if (executeExportBtn) {
      executeExportBtn.addEventListener('click', () => {
        const exportType = document.querySelector('input[name="export-type"]:checked')?.value;
        const faceSize = parseInt(faceSizeSlider?.value || '40');

        if (!exportType) {
          alert('エクスポート種別を選択してください');
          return;
        }

        switch (exportType) {
          case 'png':
            this.imageExporter.exportAllFaces(faceSize);
            alert('6面のPNG画像をエクスポートしています...');
            break;
          case 'pdf':
            this.imageExporter.exportAllFacesAsPDF(faceSize);
            alert('6面のPDFをエクスポートしています...');
            break;
          case 'papercraft':
            this.imageExporter.exportPaperCraftNet(faceSize);
            break;
        }

        hideModal();
      });
    }
  }

  updateCurrentFaceLabel(face) {
    const label = document.getElementById('current-face-label');
    if (label) {
      const faceNames = {
        front: 'Front',
        back: 'Back',
        left: 'Left',
        right: 'Right',
        top: 'Top',
        bottom: 'Bottom'
      };
      label.textContent = faceNames[face] || face;
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new App();
});
