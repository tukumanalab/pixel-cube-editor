// main.js - Application entry point

import { EditorState } from './state/EditorState.js';
import { History } from './state/History.js';
import { PixelGrid } from './editor/PixelGrid.js';
import { ColorPicker } from './editor/ColorPicker.js';
import { ThreePreview } from './preview/ThreePreview.js';
import { ImageExporter } from './export/ImageExporter.js';
import { PDFExporter } from './export/PDFExporter.js';
import { DataExporter } from './export/DataExporter.js';

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
    this.dataExporter = new DataExporter(this.editorState);
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

    // Face copy functionality
    let copiedFace = null;
    const copyBtn = document.getElementById('copy-face-btn');
    const pasteBtn = document.getElementById('paste-face-btn');
    const targetSelect = document.getElementById('target-face-select');

    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        copiedFace = this.editorState.currentFace;
        alert(`${copiedFace}面をコピーしました`);
      });
    }

    if (pasteBtn && targetSelect) {
      pasteBtn.addEventListener('click', () => {
        if (!copiedFace) {
          alert('まず面をコピーしてください');
          return;
        }
        const targetFace = targetSelect.value;
        this.editorState.copyFace(copiedFace, targetFace);
        this.history.saveState();
        alert(`${copiedFace}面を${targetFace}面に貼り付けました`);
      });
    }

    // Export functionality
    const exportSelect = document.getElementById('export-select');
    if (exportSelect) {
      exportSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        if (!value) return;

        switch (value) {
          case 'png':
            this.imageExporter.exportAllFaces();
            alert('6面のPNG画像をエクスポートしています...');
            break;
          case 'pdf':
            // Optionally include 3D preview
            const include3D = confirm('3DプレビューをPDFに含めますか?');
            let previewDataURL = null;
            if (include3D && this.threePreview) {
              previewDataURL = this.threePreview.captureScreenshot();
            }
            this.pdfExporter.exportPDF(include3D, previewDataURL);
            break;
          case 'json':
            this.dataExporter.exportJSON();
            break;
          case 'texture-atlas':
            this.imageExporter.exportTextureAtlas();
            break;
        }

        // Reset select
        e.target.value = '';
      });
    }

    // Import functionality
    const importBtn = document.getElementById('import-json-btn');
    const importInput = document.getElementById('import-file-input');

    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => {
        importInput.click();
      });

      importInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          await this.dataExporter.importJSON(file);
          this.history.saveState();
          alert('JSONファイルをインポートしました');
        } catch (error) {
          alert(`インポートエラー: ${error.message}`);
          console.error('Import error:', error);
        }

        // Reset input
        e.target.value = '';
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
