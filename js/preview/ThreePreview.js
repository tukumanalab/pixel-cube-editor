// ThreePreview.js - three.js 3D cube preview

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ThreePreview {
  constructor(container, editorState) {
    this.container = container;
    this.editorState = editorState;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.cube = null;
    this.materials = [];
    this.controls = null;
    this.animationId = null;

    this.init();
  }

  init() {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // Camera setup (perspective view)
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(0, 0, 0);

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Create cube with 6 materials (one per face)
    this.createCube();

    // Add orbit controls for user interaction
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 2;
    this.controls.maxDistance = 10;

    // Handle window resize
    window.addEventListener('resize', () => this.onWindowResize());

    // Subscribe to state changes
    this.editorState.subscribe('pixelChange', (data) => {
      this.updateFaceTexture(data.face);
    });

    this.editorState.subscribe('stateRestored', () => {
      this.updateAllTextures();
    });

    // Initial texture update
    this.updateAllTextures();

    // Start render loop
    this.animate();
  }

  createCube() {
    const geometry = new THREE.BoxGeometry(2, 2, 2);

    // Create 6 materials (one for each face)
    // Three.js BoxGeometry face order: right, left, top, bottom, front, back
    const faceOrder = ['right', 'left', 'top', 'bottom', 'front', 'back'];

    this.materials = faceOrder.map(() => {
      const canvas = this.createFaceCanvas();
      const texture = new THREE.CanvasTexture(canvas);
      texture.magFilter = THREE.NearestFilter; // Pixelated look
      texture.minFilter = THREE.NearestFilter;

      return new THREE.MeshLambertMaterial({ map: texture });
    });

    this.cube = new THREE.Mesh(geometry, this.materials);
    this.scene.add(this.cube);

    // Add slight rotation for better initial view
    this.cube.rotation.y = Math.PI / 6;
    this.cube.rotation.x = Math.PI / 12;
  }

  createFaceCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');

    // Fill with white initially
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 16, 16);

    return canvas;
  }

  updateFaceTexture(faceName) {
    // Map face names to material indices
    const faceMap = {
      right: 0,
      left: 1,
      top: 2,
      bottom: 3,
      front: 4,
      back: 5
    };

    const materialIndex = faceMap[faceName];
    if (materialIndex === undefined) return;

    const material = this.materials[materialIndex];
    const canvas = material.map.image;
    const ctx = canvas.getContext('2d');

    // Get pixel data for this face
    const faceData = this.editorState.faces[faceName];

    // Draw pixel data to canvas (16×16 grid)
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = faceData[y][x];
        ctx.fillRect(x, y, 1, 1);
      }
    }

    material.map.needsUpdate = true;
  }

  updateAllTextures() {
    const faces = ['right', 'left', 'top', 'bottom', 'front', 'back'];
    faces.forEach(face => this.updateFaceTexture(face));
  }

  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  // Capture screenshot of the 3D preview
  captureScreenshot() {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  // Clean up
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }

    window.removeEventListener('resize', () => this.onWindowResize());

    if (this.renderer) {
      this.renderer.dispose();
    }

    this.materials.forEach(mat => {
      if (mat.map) {
        mat.map.dispose();
      }
      mat.dispose();
    });

    if (this.cube) {
      this.scene.remove(this.cube);
    }

    if (this.controls) {
      this.controls.dispose();
    }
  }
}
