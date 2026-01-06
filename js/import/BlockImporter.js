// BlockImporter.js - Import Minecraft block textures

export class BlockImporter {
  constructor() {
    this.blockList = [];
    this.currentBlockData = null;
    // Detect base path for GitHub Pages support
    this.basePath = this.getBasePath();
  }

  // Get base path (works for both localhost and GitHub Pages)
  getBasePath() {
    const path = window.location.pathname;
    // If running on GitHub Pages (e.g., /pixel-cube-editor/), extract base path
    if (path.includes('/pixel-cube-editor/')) {
      return '/pixel-cube-editor';
    }
    // Default to root for localhost
    return '';
  }

  // Load list of available blocks
  async loadBlockList() {
    try {
      const response = await fetch(`${this.basePath}/resource/json/_list.json`);
      if (!response.ok) {
        // Fallback: scan directory for JSON files
        return this.scanBlockDirectory();
      }
      const data = await response.json();
      // Parse file list and remove .json extension
      const files = data.files || [];
      this.blockList = files
        .filter(file => file.endsWith('.json') && !file.startsWith('_'))
        .map(file => file.replace('.json', ''))
        .filter(name => !name.includes('template_')) // Exclude templates
        .sort();
      return this.blockList;
    } catch (error) {
      console.warn('Could not load _list.json, scanning directory...', error);
      return this.scanBlockDirectory();
    }
  }

  // Fallback: scan directory for blocks
  async scanBlockDirectory() {
    try {
      // Try to get a list of common blocks
      const commonBlocks = [
        'stone', 'dirt', 'grass_block', 'oak_planks', 'cobblestone',
        'oak_log', 'furnace', 'crafting_table', 'tnt', 'diamond_block',
        'gold_block', 'iron_block', 'coal_block', 'emerald_block',
        'redstone_block', 'lapis_block', 'glass', 'obsidian',
        'bedrock', 'sand', 'gravel', 'clay', 'bricks', 'sandstone',
        'netherrack', 'soul_sand', 'glowstone', 'end_stone'
      ];

      // Filter blocks that actually exist
      const existingBlocks = [];
      for (const block of commonBlocks) {
        try {
          const response = await fetch(`${this.basePath}/resource/json/${block}.json`, { method: 'HEAD' });
          if (response.ok) {
            existingBlocks.push(block);
          }
        } catch (e) {
          // Block doesn't exist, skip
        }
      }

      this.blockList = existingBlocks;
      return existingBlocks;
    } catch (error) {
      console.error('Error scanning block directory:', error);
      return [];
    }
  }

  // Load block data from JSON
  async loadBlock(blockName) {
    try {
      console.log('Loading block:', blockName);
      const response = await fetch(`${this.basePath}/resource/json/${blockName}.json`);
      if (!response.ok) {
        throw new Error(`Block ${blockName} not found`);
      }

      const blockData = await response.json();
      console.log('Block data loaded:', blockData);
      this.currentBlockData = await this.parseBlockData(blockData);
      console.log('Parsed block data:', this.currentBlockData);
      return this.currentBlockData;
    } catch (error) {
      console.error('Error loading block:', error);
      throw error;
    }
  }

  // Parse block JSON and resolve texture references
  async parseBlockData(blockData) {
    const textures = blockData.textures || {};
    const parent = blockData.parent || '';

    // Map textures to faces based on parent type
    let faceMapping = {};

    if (parent.includes('cube_all')) {
      // All faces use the same texture
      const texture = textures.all || textures.texture;
      faceMapping = {
        top: texture,
        bottom: texture,
        front: texture,
        back: texture,
        left: texture,
        right: texture
      };
    } else if (parent.includes('orientable')) {
      // Front, side, top pattern
      faceMapping = {
        top: textures.top || textures.texture,
        bottom: textures.top || textures.side || textures.texture,
        front: textures.front || textures.texture,
        back: textures.side || textures.texture,
        left: textures.side || textures.texture,
        right: textures.side || textures.texture
      };
    } else if (parent.includes('cube_column')) {
      // End (top/bottom) and side pattern
      faceMapping = {
        top: textures.end || textures.texture,
        bottom: textures.end || textures.texture,
        front: textures.side || textures.texture,
        back: textures.side || textures.texture,
        left: textures.side || textures.texture,
        right: textures.side || textures.texture
      };
    } else if (parent.includes('cube')) {
      // Generic cube - try to map available textures
      faceMapping = {
        top: textures.top || textures.up || textures.all || textures.texture,
        bottom: textures.bottom || textures.down || textures.all || textures.texture,
        front: textures.front || textures.north || textures.side || textures.all || textures.texture,
        back: textures.back || textures.south || textures.side || textures.all || textures.texture,
        left: textures.left || textures.west || textures.side || textures.all || textures.texture,
        right: textures.right || textures.east || textures.side || textures.all || textures.texture
      };
    } else {
      // Unknown parent, try to use whatever textures are available
      faceMapping = {
        top: textures.top || textures.up || textures.all || textures.side || textures.texture,
        bottom: textures.bottom || textures.down || textures.all || textures.side || textures.texture,
        front: textures.front || textures.north || textures.all || textures.side || textures.texture,
        back: textures.back || textures.south || textures.all || textures.side || textures.texture,
        left: textures.left || textures.west || textures.all || textures.side || textures.texture,
        right: textures.right || textures.east || textures.all || textures.side || textures.texture
      };
    }

    return {
      parent,
      textures,
      faceMapping
    };
  }

  // Convert texture reference to file path
  getTexturePath(textureRef) {
    if (!textureRef) return null;

    // Remove "minecraft:block/" or "block/" prefix if present
    let textureName = textureRef.replace('minecraft:block/', '');
    textureName = textureName.replace('block/', '');
    return `${this.basePath}/resource/textures/${textureName}.png`;
  }

  // Load PNG image and convert to color array
  async loadTextureAsColorArray(texturePath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          // Create canvas to read pixel data
          const canvas = document.createElement('canvas');
          canvas.width = 16;
          canvas.height = 16;
          const ctx = canvas.getContext('2d');

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, 16, 16);

          // Read pixel data
          const imageData = ctx.getImageData(0, 0, 16, 16);
          const pixels = imageData.data;

          // Convert to 16x16 color array
          const colorArray = [];
          for (let y = 0; y < 16; y++) {
            const row = [];
            for (let x = 0; x < 16; x++) {
              const index = (y * 16 + x) * 4;
              const r = pixels[index];
              const g = pixels[index + 1];
              const b = pixels[index + 2];
              const a = pixels[index + 3];

              // Convert to hex color (handle transparency by using white background)
              if (a < 128) {
                // Transparent pixel - use white
                row.push('#FFFFFF');
              } else {
                const hex = '#' +
                  r.toString(16).padStart(2, '0') +
                  g.toString(16).padStart(2, '0') +
                  b.toString(16).padStart(2, '0');
                row.push(hex.toUpperCase());
              }
            }
            colorArray.push(row);
          }

          resolve(colorArray);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error(`Failed to load texture: ${texturePath}`));
      };

      img.src = texturePath;
    });
  }

  // Import block and convert to editor format
  async importBlock(blockName) {
    try {
      // Load block data
      await this.loadBlock(blockName);

      if (!this.currentBlockData) {
        throw new Error('No block data loaded');
      }

      // Load all face textures
      const faces = {};
      const faceMapping = this.currentBlockData.faceMapping;

      for (const [face, textureRef] of Object.entries(faceMapping)) {
        if (!textureRef) {
          // No texture for this face, use white
          faces[face] = Array(16).fill(null).map(() => Array(16).fill('#FFFFFF'));
          continue;
        }

        const texturePath = this.getTexturePath(textureRef);
        try {
          faces[face] = await this.loadTextureAsColorArray(texturePath);
        } catch (error) {
          console.warn(`Failed to load texture for ${face}:`, error);
          // Use white as fallback
          faces[face] = Array(16).fill(null).map(() => Array(16).fill('#FFFFFF'));
        }
      }

      return faces;
    } catch (error) {
      console.error('Error importing block:', error);
      throw error;
    }
  }

  // Get preview URLs for a block
  async getBlockPreviewUrls(blockName) {
    try {
      await this.loadBlock(blockName);

      if (!this.currentBlockData) {
        console.warn('No block data found for:', blockName);
        return {};
      }

      const previews = {};
      const faceMapping = this.currentBlockData.faceMapping;
      console.log('Face mapping:', faceMapping);

      // Get unique textures
      const uniqueTextures = new Set(Object.values(faceMapping).filter(t => t));
      console.log('Unique textures:', uniqueTextures);

      for (const textureRef of uniqueTextures) {
        const texturePath = this.getTexturePath(textureRef);
        console.log(`Texture ${textureRef} -> ${texturePath}`);
        previews[textureRef] = texturePath;
      }

      console.log('Preview URLs:', previews);
      return previews;
    } catch (error) {
      console.error('Error getting block previews:', error);
      return {};
    }
  }
}
