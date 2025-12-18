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
    this.faceOverlays = [];
    this.controls = null;
    this.animationId = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Click detection state
    this.mouseDownPosition = null;

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

    // Track mousedown position for drag detection
    this.renderer.domElement.addEventListener('mousedown', (event) => {
      this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    });

    // Handle cube face clicks for flash effect
    this.renderer.domElement.addEventListener('click', (event) => this.onCanvasClick(event));

    // Handle hover to show clickable cursor
    this.renderer.domElement.addEventListener('mousemove', (event) => this.onCanvasMouseMove(event));

    // Subscribe to state changes
    this.editorState.subscribe('pixelChange', (data) => {
      this.updateFaceTexture(data.face);
    });

    this.editorState.subscribe('stateRestored', () => {
      this.updateAllTextures();
    });

    this.editorState.subscribe('faceChange', (data) => {
      this.rotateToFace(data.face);
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

    // Create overlay planes for each face
    this.createFaceOverlays();
  }

  createFaceOverlays() {
    // Create semi-transparent overlay planes for each face
    // Face positions and rotations match the cube faces
    const faceConfigs = [
      { position: [1.01, 0, 0], rotation: [0, Math.PI / 2, 0] },   // right
      { position: [-1.01, 0, 0], rotation: [0, -Math.PI / 2, 0] }, // left
      { position: [0, 1.01, 0], rotation: [-Math.PI / 2, 0, 0] },  // top
      { position: [0, -1.01, 0], rotation: [Math.PI / 2, 0, 0] },  // bottom
      { position: [0, 0, 1.01], rotation: [0, 0, 0] },             // front
      { position: [0, 0, -1.01], rotation: [0, Math.PI, 0] }       // back
    ];

    faceConfigs.forEach(config => {
      // Create a plane geometry for this face overlay
      const planeGeometry = new THREE.PlaneGeometry(2, 2);
      const overlayMaterial = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0,
        depthTest: false
      });
      const overlayMesh = new THREE.Mesh(planeGeometry, overlayMaterial);

      // Position and rotate the overlay to match the cube face
      // Slightly offset from cube surface to prevent z-fighting
      overlayMesh.position.set(...config.position);
      overlayMesh.rotation.set(...config.rotation);

      // Add to scene and store reference
      this.cube.add(overlayMesh);
      this.faceOverlays.push(overlayMesh);
    });
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

  // Rotate camera to show the selected face
  rotateToFace(faceName) {
    // Keep camera at exactly the same distance as initial view (sqrt(48) ≈ 6.93)
    // All positions maintain distance of 7 units from origin
    const positions = {
      front: { x: 1.5, y: 2.5, z: 6.2 },
      back: { x: 1.5, y: 2.5, z: -6.2 },
      left: { x: -6.2, y: 2.5, z: 1.5 },
      right: { x: 6.2, y: 2.5, z: 1.5 },
      top: { x: 1.5, y: 6.2, z: 2.5 },
      bottom: { x: 1.5, y: -6.2, z: 2.5 }
    };

    const targetPosition = positions[faceName];
    if (!targetPosition) return;

    // Smoothly animate camera to new position
    const startPosition = {
      x: this.camera.position.x,
      y: this.camera.position.y,
      z: this.camera.position.z
    };

    const duration = 500; // milliseconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-in-out function
      const easeProgress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      this.camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * easeProgress;
      this.camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * easeProgress;
      this.camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * easeProgress;

      this.camera.lookAt(0, 0, 0);
      this.controls.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  // Handle click on canvas to flash the clicked face
  onCanvasClick(event) {
    // Check if this is a drag operation (not a click)
    if (!this.mouseDownPosition) return;

    const distance = Math.sqrt(
      Math.pow(event.clientX - this.mouseDownPosition.x, 2) +
      Math.pow(event.clientY - this.mouseDownPosition.y, 2)
    );

    // Ignore clicks if mouse moved more than 5 pixels (drag operation)
    if (distance > 5) {
      return;
    }

    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Cast ray from camera through mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for intersections with the cube (not its children)
    const intersects = this.raycaster.intersectObject(this.cube, false);

    if (intersects.length > 0) {
      // Get the face index from the intersection
      const faceIndex = Math.floor(intersects[0].faceIndex / 2);

      // Map material index to face name
      // Three.js BoxGeometry face order: right, left, top, bottom, front, back
      const faceMap = ['right', 'left', 'top', 'bottom', 'front', 'back'];
      const faceName = faceMap[faceIndex];

      if (faceName) {
        // Flash the clicked face
        this.flashFace(faceIndex);

        // Update the current face in editor state (this will update the face selector buttons)
        this.editorState.setCurrentFace(faceName);
      }
    }
  }

  // Flash effect for clicked face (semi-transparent overlay)
  flashFace(materialIndex) {
    const overlay = this.faceOverlays[materialIndex];
    if (!overlay) return;

    const material = overlay.material;

    // Set to semi-transparent orange glow (50% opacity)
    material.opacity = 0.5;

    // Animate fade out
    const duration = 500; // milliseconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out function for smooth fade
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      // Fade opacity from 0.5 to 0
      material.opacity = 0.5 * (1 - easeProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Ensure it's fully transparent at the end
        material.opacity = 0;
      }
    };

    animate();
  }

  // Handle mouse move to show pointer cursor over cube
  onCanvasMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Cast ray from camera through mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for intersections with the cube
    const intersects = this.raycaster.intersectObject(this.cube, false);

    // Change cursor style based on whether we're hovering over the cube
    this.renderer.domElement.style.cursor = intersects.length > 0 ? 'pointer' : 'default';
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

    // Clean up overlay meshes
    this.faceOverlays.forEach(overlay => {
      if (overlay.geometry) {
        overlay.geometry.dispose();
      }
      if (overlay.material) {
        overlay.material.dispose();
      }
    });

    if (this.cube) {
      this.scene.remove(this.cube);
    }

    if (this.controls) {
      this.controls.dispose();
    }
  }
}
