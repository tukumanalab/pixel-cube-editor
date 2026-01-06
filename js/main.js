// main.js - Application entry point

import { EditorState } from './state/EditorState.js';
import { History } from './state/History.js';
import { PixelGrid } from './editor/PixelGrid.js';
import { ColorPicker } from './editor/ColorPicker.js';
import { ThreePreview } from './preview/ThreePreview.js';
import { ImageExporter } from './export/ImageExporter.js';
import { PDFExporter } from './export/PDFExporter.js';
import { BlockImporter } from './import/BlockImporter.js';

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

    // Initialize importer
    this.blockImporter = new BlockImporter();
    this.initBlockImporter();
  }

  async initBlockImporter() {
    try {
      // Load block list
      console.log('Loading block list...');
      const blocks = await this.blockImporter.loadBlockList();
      console.log(`Loaded ${blocks.length} blocks`);

      // Populate dropdown
      const blockSelector = document.getElementById('block-selector');
      if (blockSelector) {
        blockSelector.innerHTML = '<option value="">ブロックを選択...</option>';
        blocks.forEach(blockName => {
          const option = document.createElement('option');
          option.value = blockName;
          option.textContent = blockName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          blockSelector.appendChild(option);
        });
        console.log('Block selector populated');
      } else {
        console.error('Block selector element not found');
      }
    } catch (error) {
      console.error('Error initializing block importer:', error);
    }
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

    // Subscribe to face change events to update face tabs
    this.editorState.subscribe('faceChange', (data) => {
      // Update active state on face tabs
      faceTabs.forEach(tab => {
        if (tab.dataset.face === data.face) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });

      // Update face label
      this.updateCurrentFaceLabel(data.face);
    });

    // Brush size buttons
    const brushButtons = document.querySelectorAll('.btn-brush');
    brushButtons.forEach((btn, index) => {
      const size = index + 1; // 1, 2, or 3
      btn.addEventListener('click', () => {
        // Update active state
        brushButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update editor state
        this.editorState.setBrushSize(size);
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

    // Import modal functionality
    const importBtn = document.getElementById('import-btn');
    const importModal = document.getElementById('import-modal');
    const closeImportModalBtn = document.getElementById('close-import-modal-btn');
    const cancelImportBtn = document.getElementById('cancel-import-btn');
    const executeImportBtn = document.getElementById('execute-import-btn');
    const blockSelector = document.getElementById('block-selector');
    const blockPreview = document.getElementById('block-preview');
    const blockPreviewImages = document.getElementById('block-preview-images');

    // Show import modal
    if (importBtn && importModal) {
      importBtn.addEventListener('click', () => {
        importModal.style.display = 'flex';
      });
    }

    // Hide import modal
    const hideImportModal = () => {
      if (importModal) {
        importModal.style.display = 'none';
      }
      if (blockPreview) {
        blockPreview.style.display = 'none';
      }
      if (executeImportBtn) {
        executeImportBtn.disabled = true;
      }
    };

    if (closeImportModalBtn) {
      closeImportModalBtn.addEventListener('click', hideImportModal);
    }

    if (cancelImportBtn) {
      cancelImportBtn.addEventListener('click', hideImportModal);
    }

    // Block selector change
    if (blockSelector) {
      blockSelector.addEventListener('change', async (e) => {
        const blockName = e.target.value;
        console.log('Block selected:', blockName);

        if (!blockName) {
          if (blockPreview) blockPreview.style.display = 'none';
          if (executeImportBtn) executeImportBtn.disabled = true;
          return;
        }

        try {
          // Load block preview
          console.log('Loading preview for:', blockName);
          const previews = await this.blockImporter.getBlockPreviewUrls(blockName);
          console.log('Got previews:', previews);

          // Show preview images
          if (blockPreviewImages && Object.keys(previews).length > 0) {
            blockPreviewImages.innerHTML = '';
            for (const [textureRef, url] of Object.entries(previews)) {
              console.log('Creating preview image:', textureRef, url);
              const img = document.createElement('img');
              img.src = url;
              img.alt = textureRef;
              img.style.width = '64px';
              img.style.height = '64px';
              img.style.imageRendering = 'pixelated';
              img.style.margin = '4px';
              img.onerror = () => console.error('Failed to load image:', url);
              img.onload = () => console.log('Image loaded:', url);
              blockPreviewImages.appendChild(img);
            }
            if (blockPreview) blockPreview.style.display = 'block';
          } else {
            console.warn('No preview images to show');
          }

          if (executeImportBtn) executeImportBtn.disabled = false;
        } catch (error) {
          console.error('Error loading block preview:', error);
          if (executeImportBtn) executeImportBtn.disabled = true;
        }
      });
    } else {
      console.error('Block selector not found in event listeners');
    }

    // Execute import
    if (executeImportBtn) {
      executeImportBtn.addEventListener('click', async () => {
        const blockName = blockSelector?.value;

        if (!blockName) {
          alert('ブロックを選択してください');
          return;
        }

        try {
          executeImportBtn.disabled = true;
          executeImportBtn.textContent = '読み込み中...';

          // Import block
          const faces = await this.blockImporter.importBlock(blockName);

          // Load into editor
          const success = this.editorState.loadFaces(faces);

          if (success) {
            // Add to history
            this.history.saveState();

            alert(`${blockName} をインポートしました！`);
            hideImportModal();
          } else {
            alert('インポートに失敗しました');
          }
        } catch (error) {
          console.error('Error importing block:', error);
          alert('インポート中にエラーが発生しました: ' + error.message);
        } finally {
          executeImportBtn.disabled = false;
          executeImportBtn.textContent = 'インポート';
        }
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
