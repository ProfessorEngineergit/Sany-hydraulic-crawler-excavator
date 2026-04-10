import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Excavator } from './Excavator.js';

/**
 * World — Three.js scene orchestrator.
 * Handles renderer, camera (orbit), lighting, environment, and per-level setup.
 */
export class World {
  constructor(container) {
    this._container = container;
    this._W = container.clientWidth;
    this._H = container.clientHeight;

    this._buildRenderer();
    this._buildScene();
    this._buildLighting();
    this._buildCamera();

    this.excavator = null;
    this.terrain   = null;
    this._props    = [];

    this._mouse     = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._hoveredMesh = null;

    window.addEventListener('resize', this._onResize.bind(this));
  }

  /* ════════════════════════════════════════════════════════════
     RENDERER
  ════════════════════════════════════════════════════════════ */
  _buildRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(this._W, this._H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace   = THREE.SRGBColorSpace;
    this.renderer.toneMapping        = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this._container.appendChild(this.renderer.domElement);
  }

  /* ════════════════════════════════════════════════════════════
     SCENE
  ════════════════════════════════════════════════════════════ */
  _buildScene() {
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog(0xC8DDF0, 60, 250);
  }

  /* ════════════════════════════════════════════════════════════
     LIGHTING — Bruno Simon style: crisp directional + soft ambient
  ════════════════════════════════════════════════════════════ */
  _buildLighting() {
    /* Ambient — sky light */
    const ambient = new THREE.HemisphereLight(0x6BAED6, 0x8A7250, 0.65);
    this.scene.add(ambient);

    /* Sun — casts shadows */
    this.sunLight = new THREE.DirectionalLight(0xFFF5E4, 2.2);
    this.sunLight.position.set(18, 28, 14);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width  = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far  = 120;
    this.sunLight.shadow.camera.left   = -30;
    this.sunLight.shadow.camera.right  =  30;
    this.sunLight.shadow.camera.top    =  30;
    this.sunLight.shadow.camera.bottom = -30;
    this.sunLight.shadow.bias = -0.0005;
    this.sunLight.shadow.normalBias = 0.02;
    this.scene.add(this.sunLight);

    /* Fill light (opposite sun, soft) */
    const fill = new THREE.DirectionalLight(0xC5E8FF, 0.40);
    fill.position.set(-12, 10, -10);
    this.scene.add(fill);
  }

  /* ════════════════════════════════════════════════════════════
     CAMERA — smooth orbit with lerped follow
  ════════════════════════════════════════════════════════════ */
  _buildCamera() {
    this.camera = new THREE.PerspectiveCamera(58, this._W / this._H, 0.1, 500);

    this._camTarget   = new THREE.Vector3(0, 0.5, 0);
    this._camTargetLerp = new THREE.Vector3(0, 0.5, 0);
    this._camTheta    = 0.62;       // azimuth (radians)
    this._camPhi      = 0.88;       // elevation
    this._camRadius   = 18;
    this._camMode     = 'orbit';    // 'orbit' | 'operator'
    this._prevMouse   = null;
    this._mouseBtn    = -1;

    this.camera.position.setFromSphericalCoords(
      this._camRadius, this._camPhi, this._camTheta
    ).add(this._camTarget);
    this.camera.lookAt(this._camTarget);

    const el = this.renderer.domElement;
    el.addEventListener('mousedown',   this._onMouseDown.bind(this));
    el.addEventListener('mousemove',   this._onMouseMove.bind(this));
    el.addEventListener('mouseup',     () => { this._mouseBtn = -1; this._prevMouse = null; });
    el.addEventListener('wheel',       this._onWheel.bind(this), { passive: true });
    el.addEventListener('touchstart',  this._onTouchStart.bind(this), { passive: true });
    el.addEventListener('touchmove',   this._onTouchMove.bind(this),  { passive: false });
    el.addEventListener('touchend',    () => { this._prevMouse = null; });
    el.addEventListener('contextmenu', e => e.preventDefault());
  }

  _onMouseDown(e) { this._mouseBtn = e.button; this._prevMouse = { x: e.clientX, y: e.clientY }; }

  _onMouseMove(e) {
    /* Tooltip hover */
    const rect = this.renderer.domElement.getBoundingClientRect();
    this._mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
    this._mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;

    if (!this._prevMouse || this._mouseBtn < 0) return;

    const dx = e.clientX - this._prevMouse.x;
    const dy = e.clientY - this._prevMouse.y;
    this._prevMouse = { x: e.clientX, y: e.clientY };

    if (this._mouseBtn === 0) {
      /* Orbit */
      this._camTheta -= dx * 0.008;
      this._camPhi    = Math.max(0.15, Math.min(1.45, this._camPhi + dy * 0.008));
    } else if (this._mouseBtn === 2) {
      /* Pan (right-click) */
      const panSpeed = this._camRadius * 0.0008;
      const right = new THREE.Vector3();
      const up    = new THREE.Vector3();
      this.camera.getWorldDirection(up);
      right.crossVectors(up, this.camera.up).normalize();
      this._camTarget.addScaledVector(right, -dx * panSpeed);
      this._camTarget.y += dy * panSpeed;
    }
  }

  _onWheel(e) {
    this._camRadius = Math.max(4, Math.min(80, this._camRadius + e.deltaY * 0.02));
  }

  _onTouchStart(e) {
    if (e.touches.length === 1) {
      this._prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this._mouseBtn  = 0;
    }
  }

  _onTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1 && this._prevMouse) {
      const dx = e.touches[0].clientX - this._prevMouse.x;
      const dy = e.touches[0].clientY - this._prevMouse.y;
      this._prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      this._camTheta -= dx * 0.008;
      this._camPhi    = Math.max(0.15, Math.min(1.45, this._camPhi + dy * 0.008));
    }
  }

  /* ════════════════════════════════════════════════════════════
     LEVEL SETUP
  ════════════════════════════════════════════════════════════ */
  setupLevel(level) {
    /* Clear previous level */
    this._clearLevel();

    /* Terrain */
    this.terrain = new Terrain(this.scene, { type: level.setup?.terrainType || 'flat' });

    /* Excavator */
    const startPos = level.setup?.excavatorPosition || [0, 0, 0];
    const startRot = level.setup?.excavatorRotation || 0;
    this.excavator = new Excavator(this.scene);
    this.excavator.position.set(...startPos);
    this.excavator.heading = startRot;
    this.excavator._applyPose();

    /* Props */
    if (level.setup?.props) {
      this._spawnProps(level.setup.props, level);
    }

    /* Reset camera to sensible position */
    this._camTarget.set(...startPos);
    this._camTarget.y = 1.5;
    this._camRadius = 18;
    this._camPhi    = 0.88;
    this._camTheta  = 0.62;
  }

  _clearLevel() {
    if (this.excavator) {
      this.excavator.dispose();
      this.excavator = null;
    }
    if (this.terrain) {
      this.terrain.dispose();
      this.terrain = null;
    }
    this._props.forEach(p => {
      if (p.geometry) p.geometry.dispose();
      this.scene.remove(p);
    });
    this._props = [];
  }

  _spawnProps(propList, level) {
    propList.forEach(propId => {
      switch (propId) {
        case 'navMarker':      this._addNavMarker(8, -8); break;
        case 'swingTargets':   this._addSwingTargets(); break;
        case 'wall':           this._addWall(); break;
        case 'reachSpheres':   this._addReachSpheres(); break;
        case 'dumpZone':       this._addDumpZone(6, 0, 2.5); break;
        case 'squareOutline':  this._addSquareOutline(0, 0, level.task?.size || 4); break;
        case 'depthGrid':      this._addDepthGrid(0, 0, level.task?.size || 4); break;
        case 'cones':          this._addCones(); break;
        case 'truck':          this._addTruck(7, 0); break;
        case 'pipes':          this._addPipes(); break;
        case 'minimap':        /* handled in HUD */ break;
        default: break;
      }
    });
  }

  _addNavMarker(x, z) {
    const geo = new THREE.CylinderGeometry(0.8, 0.8, 0.06, 16);
    const mat = new THREE.MeshStandardMaterial({ color: 0xFFB800, roughness: 0.5, emissive: 0xFFB800, emissiveIntensity: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0.03, z);
    mesh.receiveShadow = true;
    mesh.name = 'navMarker';
    this.scene.add(mesh);
    this._props.push(mesh);

    /* Pulsing ring */
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.1, 0.06, 6, 24),
      new THREE.MeshBasicMaterial({ color: 0xFFB800, transparent: true, opacity: 0.6 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.05, z);
    ring.name = 'navRing';
    this.scene.add(ring);
    this._props.push(ring);
  }

  _addSwingTargets() {
    const colours = [0x00CC66, 0xFF4444];
    const angles  = [Math.PI / 2, -Math.PI / 2];
    angles.forEach((ang, i) => {
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 3.0, 8),
        new THREE.MeshStandardMaterial({ color: colours[i] })
      );
      pole.position.set(Math.sin(ang) * 9, 1.5, Math.cos(ang) * 9);
      pole.castShadow = true;
      this.scene.add(pole);
      this._props.push(pole);
      /* Flag */
      const flag = new THREE.Mesh(
        new THREE.BoxGeometry(1.0, 0.5, 0.04),
        new THREE.MeshStandardMaterial({ color: colours[i] })
      );
      flag.position.set(Math.sin(ang) * 9 + 0.5, 3.1, Math.cos(ang) * 9);
      this.scene.add(flag);
      this._props.push(flag);
    });
  }

  _addWall() {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(6, 3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 })
    );
    wall.position.set(0, 1.5, 7);
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.scene.add(wall);
    this._props.push(wall);
  }

  _addReachSpheres() {
    const colours = [0x00FF88, 0x0088FF];
    [[6, 2, 0], [7.5, 1.5, 3]].forEach((pos, i) => {
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.35, 12, 8),
        new THREE.MeshStandardMaterial({ color: colours[i], emissive: colours[i], emissiveIntensity: 0.5 })
      );
      sphere.position.set(...pos);
      this.scene.add(sphere);
      this._props.push(sphere);
    });
  }

  _addDumpZone(x, z, radius) {
    const geo = new THREE.CircleGeometry(radius, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xFFB800, transparent: true, opacity: 0.18, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(geo, mat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(x, 0.01, z);
    circle.name = 'dumpZone';
    this.scene.add(circle);
    this._props.push(circle);

    /* Border */
    const border = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.06, 6, 32),
      new THREE.MeshBasicMaterial({ color: 0xFFB800 })
    );
    border.rotation.x = Math.PI / 2;
    border.position.set(x, 0.04, z);
    this.scene.add(border);
    this._props.push(border);
  }

  _addSquareOutline(cx, cz, size) {
    const half = size / 2;
    const corners = [
      [-half, -half], [half, -half],
      [half, half], [-half, half], [-half, -half]
    ];
    const pts = corners.map(([x, z]) => new THREE.Vector3(cx + x, 0.06, cz + z));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: 0xFFB800, linewidth: 2 });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this._props.push(line);

    /* Corner posts */
    const postCorners = [[-half, -half], [half, -half], [half, half], [-half, half]];
    postCorners.forEach(([x, z]) => {
      const post = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 1.5, 6),
        new THREE.MeshStandardMaterial({ color: 0xFFB800 })
      );
      post.position.set(cx + x, 0.75, cz + z);
      post.castShadow = true;
      this.scene.add(post);
      this._props.push(post);
    });
  }

  _addDepthGrid(cx, cz, size) {
    const half = size / 2;
    const step = size / 3;
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = cx - half + step * (col + 0.5);
        const z = cz - half + step * (row + 0.5);
        const stake = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 2.5, 6),
          new THREE.MeshStandardMaterial({ color: 0xFFAA00 })
        );
        stake.position.set(x, 1.25, z);
        this.scene.add(stake);
        this._props.push(stake);
      }
    }
  }

  _addCones() {
    const gatePositions = [
      [3, 0],  [-3, 0],
      [3, 5],  [-3, 5],
      [3, 10], [-3, 10],
    ];
    gatePositions.forEach(([x, z]) => {
      const cone = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.80, 8),
        new THREE.MeshStandardMaterial({ color: 0xFF6600 })
      );
      cone.position.set(x, 0.4, z);
      cone.castShadow = true;
      this.scene.add(cone);
      this._props.push(cone);
    });
  }

  _addTruck(x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    g.rotation.y = -Math.PI / 2;

    /* Cab */
    const cab = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 2.4, 2.0),
      new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 })
    );
    cab.position.set(0, 1.2, -3.0);
    cab.castShadow = true;
    g.add(cab);

    /* Bed */
    const bed = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.3, 5.0),
      new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.7 })
    );
    bed.position.set(0, 0.6, 0.8);
    bed.castShadow = true;
    g.add(bed);

    /* Bed sides */
    [[1.15, 1.0, 0.8], [-1.15, 1.0, 0.8]].forEach(([bx, by, bz]) => {
      const side = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 0.85, 5.0),
        new THREE.MeshStandardMaterial({ color: 0x666666 })
      );
      side.position.set(bx, by, bz);
      g.add(side);
    });

    /* Wheels (6) */
    const whl = new THREE.CylinderGeometry(0.55, 0.55, 0.42, 12);
    const wmat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const wheelPos = [
      [-1.2, 0.55, 2.2], [1.2, 0.55, 2.2],
      [-1.2, 0.55, 0.4], [1.2, 0.55, 0.4],
      [-1.2, 0.55, -3.2], [1.2, 0.55, -3.2],
    ];
    wheelPos.forEach(wp => {
      const w = new THREE.Mesh(whl, wmat);
      w.rotation.z = Math.PI / 2;
      w.position.set(...wp);
      g.add(w);
    });

    g.name = 'truck';
    this.scene.add(g);
    this._props.push(g);

    /* Dump zone for truck bed */
    this._addDumpZone(x, z, 1.6);
  }

  _addPipes() {
    const pipePositions = [
      [0, 3], [2, 5], [-2, 7], [1, 9]
    ];
    pipePositions.forEach(([x, z]) => {
      /* Buried pipe marker (top visible) */
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.60, 8),
        new THREE.MeshStandardMaterial({ color: 0xFF0000 })
      );
      marker.position.set(x, 0.30, z);
      marker.castShadow = true;
      this.scene.add(marker);
      this._props.push(marker);

      /* Warning sign */
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.42, 0.04),
        new THREE.MeshStandardMaterial({ color: 0xFF0000 })
      );
      sign.position.set(x, 1.20, z);
      this.scene.add(sign);
      this._props.push(sign);
    });
  }

  /* ════════════════════════════════════════════════════════════
     CAMERA MODES
  ════════════════════════════════════════════════════════════ */
  toggleCameraMode() {
    this._camMode = this._camMode === 'orbit' ? 'operator' : 'orbit';
  }

  /* ════════════════════════════════════════════════════════════
     UPDATE — called per frame
  ════════════════════════════════════════════════════════════ */
  update(delta) {
    /* Animate props */
    const time = performance.now() * 0.001;
    this._props.forEach(p => {
      if (p.name === 'navRing') {
        p.scale.setScalar(1 + 0.12 * Math.sin(time * 3));
        p.material.opacity = 0.5 + 0.3 * Math.sin(time * 3);
      }
    });

    /* Camera follow excavator */
    if (this.excavator) {
      const exPos = this.excavator.getPosition();
      this._camTargetLerp.lerp(
        new THREE.Vector3(exPos.x, exPos.y + 1.5, exPos.z),
        Math.min(1, delta * 4)
      );

      if (this._camMode === 'orbit') {
        this.camera.position.setFromSphericalCoords(
          this._camRadius, this._camPhi, this._camTheta
        ).add(this._camTargetLerp);
        this.camera.lookAt(this._camTargetLerp);
      } else {
        /* Operator view — place camera inside cab */
        const cabWorldPos = new THREE.Vector3();
        this.excavator.cabGroup.getWorldPosition(cabWorldPos);
        cabWorldPos.y += 1.1;
        this.camera.position.copy(cabWorldPos);
        const fwd = new THREE.Vector3(
          Math.sin(this.excavator.heading + this.excavator.swingAngle),
          -0.05,
          Math.cos(this.excavator.heading + this.excavator.swingAngle)
        );
        this.camera.lookAt(cabWorldPos.clone().add(fwd.multiplyScalar(8)));
      }
    }
  }

  /* Raycast for part-tooltip */
  raycastMachines(normalizedMouse) {
    if (!this.excavator) return null;
    this._raycaster.setFromCamera(normalizedMouse, this.camera);
    const meshes = this.excavator.getMeshes();
    const hits = this._raycaster.intersectObjects(meshes, false);
    return hits.length > 0 ? hits[0].object : null;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this._W = this._container.clientWidth;
    this._H = this._container.clientHeight;
    this.camera.aspect = this._W / this._H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this._W, this._H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  getMouseNDC() { return this._mouse; }
}
