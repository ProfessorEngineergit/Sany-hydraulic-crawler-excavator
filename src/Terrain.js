import * as THREE from 'three';

/**
 * Terrain — Deformable grid-based ground plane.
 *
 * The terrain is a BufferGeometry grid of RESOLUTION×RESOLUTION quads.
 * Each vertex has an independently adjustable height (Y coordinate).
 * When the bucket tip penetrates below the current terrain height at a given
 * XZ position, terrain vertices in the bucket's radius are lowered (dug).
 */

const GRID_SIZE       = 24;    // metres — half-extents: terrain spans [-12, 12] on X and Z
const RESOLUTION      = 80;    // vertices per side  (80×80 = 6400 quads)
const TERRAIN_COLOR   = 0x6B5A3E;   // sandy clay
const TERRAIN_COLOR2  = 0x8A7250;
const GRID_COLOR      = 0xFFB800;

export class Terrain {
  /**
   * @param {THREE.Scene} scene
   * @param {object} [opts]
   * @param {string} [opts.type]  'flat' | 'sloped' | 'rough' | 'construction'
   */
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.type  = opts.type || 'flat';

    this.SIZE = GRID_SIZE;
    this.RES  = RESOLUTION;
    this.cellSize = (this.SIZE * 2) / this.RES;

    /* Height buffer — one value per vertex: (RES+1) × (RES+1) */
    this.heights = new Float32Array((this.RES + 1) * (this.RES + 1));

    /* Track which cells have been dug (for task tracking) */
    this.dugCells = new Uint8Array(this.RES * this.RES);

    this._initHeights();
    this._buildMesh();
    this._buildGridOverlay();
    this._buildSkybox(scene);
  }

  /* ─────────────────────────────────────────────────────────── */
  _initHeights() {
    switch (this.type) {
      case 'sloped':
        this._applySlope(0.25); // 25 cm per metre tilt
        break;
      case 'rough':
        this._applyNoise(0.40, 0.18);
        break;
      case 'construction':
        this._applyNoise(0.20, 0.10);
        this._addMound(0, 0, 3.5, 1.2);
        break;
      case 'flat':
      default:
        // all zeros
        break;
    }
  }

  _applySlope(tiltPerMetre) {
    for (let zi = 0; zi <= this.RES; zi++) {
      const z = -this.SIZE + zi * this.cellSize;
      for (let xi = 0; xi <= this.RES; xi++) {
        this.heights[zi * (this.RES + 1) + xi] = z * tiltPerMetre;
      }
    }
  }

  _applyNoise(amplitude, frequency) {
    for (let zi = 0; zi <= this.RES; zi++) {
      for (let xi = 0; xi <= this.RES; xi++) {
        const x = -this.SIZE + xi * this.cellSize;
        const z = -this.SIZE + zi * this.cellSize;
        this.heights[zi * (this.RES + 1) + xi] =
          amplitude * (Math.sin(x * frequency * 1.3) * Math.cos(z * frequency) +
                       Math.sin(x * frequency * 0.7 + 1.1) * 0.5);
      }
    }
  }

  _addMound(cx, cz, radius, peak) {
    for (let zi = 0; zi <= this.RES; zi++) {
      for (let xi = 0; xi <= this.RES; xi++) {
        const x = -this.SIZE + xi * this.cellSize;
        const z = -this.SIZE + zi * this.cellSize;
        const d = Math.sqrt((x - cx) ** 2 + (z - cz) ** 2);
        if (d < radius) {
          const h = peak * (1 - (d / radius) ** 2);
          this.heights[zi * (this.RES + 1) + xi] += h;
        }
      }
    }
  }

  /* ─────────────────────────────────────────────────────────── */
  _buildMesh() {
    const verts  = (this.RES + 1) ** 2;
    const quads  = this.RES ** 2;

    /* Flat buffers */
    const positions = new Float32Array(verts * 3);
    const normals   = new Float32Array(verts * 3);
    const uvs       = new Float32Array(verts * 2);
    const indices   = new Uint32Array(quads * 6);

    /* Fill positions & UVs */
    let vi = 0;
    for (let zi = 0; zi <= this.RES; zi++) {
      for (let xi = 0; xi <= this.RES; xi++) {
        const x = -this.SIZE + xi * this.cellSize;
        const z = -this.SIZE + zi * this.cellSize;
        const y = this.heights[zi * (this.RES + 1) + xi];
        positions[vi * 3 + 0] = x;
        positions[vi * 3 + 1] = y;
        positions[vi * 3 + 2] = z;
        uvs[vi * 2 + 0] = xi / this.RES;
        uvs[vi * 2 + 1] = zi / this.RES;
        vi++;
      }
    }

    /* Indices */
    let ii = 0;
    for (let zi = 0; zi < this.RES; zi++) {
      for (let xi = 0; xi < this.RES; xi++) {
        const a = zi * (this.RES + 1) + xi;
        const b = a + 1;
        const c = a + (this.RES + 1);
        const d = c + 1;
        indices[ii++] = a; indices[ii++] = c; indices[ii++] = b;
        indices[ii++] = b; indices[ii++] = c; indices[ii++] = d;
      }
    }

    this._computeNormals(positions, indices, normals);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal',   new THREE.BufferAttribute(normals,   3));
    geo.setAttribute('uv',       new THREE.BufferAttribute(uvs,       2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));

    this._geo = geo;
    this._positions = positions;
    this._normals   = normals;

    const mat = new THREE.MeshStandardMaterial({
      color:     TERRAIN_COLOR,
      roughness: 0.92,
      metalness: 0.0,
      side: THREE.FrontSide,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow    = false;
    this.mesh.name          = 'terrain';
    this.scene.add(this.mesh);
  }

  _computeNormals(pos, idx, out) {
    const n = pos.length / 3;
    /* Zero normals */
    out.fill(0);
    /* Accumulate face normals */
    const vA = new THREE.Vector3();
    const vB = new THREE.Vector3();
    const vC = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const cross = new THREE.Vector3();

    for (let i = 0; i < idx.length; i += 3) {
      const a = idx[i], b = idx[i + 1], c = idx[i + 2];
      vA.set(pos[a*3], pos[a*3+1], pos[a*3+2]);
      vB.set(pos[b*3], pos[b*3+1], pos[b*3+2]);
      vC.set(pos[c*3], pos[c*3+1], pos[c*3+2]);
      ab.subVectors(vB, vA);
      ac.subVectors(vC, vA);
      cross.crossVectors(ab, ac);
      for (const vi of [a, b, c]) {
        out[vi*3]   += cross.x;
        out[vi*3+1] += cross.y;
        out[vi*3+2] += cross.z;
      }
    }
    /* Normalise */
    for (let i = 0; i < n; i++) {
      const x = out[i*3], y = out[i*3+1], z = out[i*3+2];
      const len = Math.sqrt(x*x + y*y + z*z) || 1;
      out[i*3]   /= len;
      out[i*3+1] /= len;
      out[i*3+2] /= len;
    }
  }

  _buildGridOverlay() {
    /* Faint yellow grid lines on terrain surface */
    const lineMat = new THREE.LineBasicMaterial({ color: GRID_COLOR, transparent: true, opacity: 0.08 });
    const points = [];
    const step = 2.0; // grid line every 2 metres
    for (let v = -this.SIZE; v <= this.SIZE; v += step) {
      points.push(new THREE.Vector3(-this.SIZE, 0.02, v));
      points.push(new THREE.Vector3( this.SIZE, 0.02, v));
      points.push(new THREE.Vector3(v, 0.02, -this.SIZE));
      points.push(new THREE.Vector3(v, 0.02,  this.SIZE));
    }
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    this.gridLines = new THREE.LineSegments(lineGeo, lineMat);
    this.gridLines.renderOrder = 1;
    this.scene.add(this.gridLines);
  }

  _buildSkybox(scene) {
    /* Simple gradient sky via a large sphere with vertex-colour shader */
    const skyGeo = new THREE.SphereGeometry(450, 16, 8);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor:    { value: new THREE.Color(0x6BAED6) },
        bottomColor: { value: new THREE.Color(0xC8DDF0) },
        offset:      { value: 50 },
        exponent:    { value: 0.5 },
      },
      vertexShader: `
        varying vec3 vWorldPos;
        void main() {
          vWorldPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPos;
        void main() {
          float h = normalize(vWorldPos + vec3(0.0, offset, 0.0)).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      depthWrite: false,
    });
    this._sky = new THREE.Mesh(skyGeo, skyMat);
    scene.add(this._sky);

    /* Distant haze ground plane */
    const groundPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshStandardMaterial({ color: 0x4A3C28, roughness: 1.0 })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.05;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
  }

  /* ─────────────────────────────────────────────────────────── */

  /** Get terrain height at world XZ (bilinear interpolation) */
  getHeightAt(wx, wz) {
    const xi = (wx + this.SIZE) / this.cellSize;
    const zi = (wz + this.SIZE) / this.cellSize;
    const x0 = Math.floor(xi), x1 = Math.min(x0 + 1, this.RES);
    const z0 = Math.floor(zi), z1 = Math.min(z0 + 1, this.RES);
    if (x0 < 0 || z0 < 0 || x0 > this.RES || z0 > this.RES) return 0;
    const tx = xi - x0, tz = zi - z0;
    const h00 = this.heights[z0 * (this.RES + 1) + x0];
    const h10 = this.heights[z0 * (this.RES + 1) + x1];
    const h01 = this.heights[z1 * (this.RES + 1) + x0];
    const h11 = this.heights[z1 * (this.RES + 1) + x1];
    return h00 * (1 - tx) * (1 - tz) +
           h10 * tx * (1 - tz) +
           h01 * (1 - tx) * tz +
           h11 * tx * tz;
  }

  /**
   * Attempt to dig at world position (wx, wy, wz).
   * If wy < current terrain height at that point, lower nearby vertices.
   * Returns true if any digging occurred.
   */
  tryDig(wx, wy, wz, forceDepth) {
    const terH = this.getHeightAt(wx, wz);
    const targetDepth = forceDepth !== undefined ? forceDepth : wy;

    if (wy > terH + 0.05) return false; // bucket above ground

    const radius = 0.55; // bucket influence radius in metres
    const drCells = Math.ceil(radius / this.cellSize) + 1;
    const cxi = Math.round((wx + this.SIZE) / this.cellSize);
    const czi = Math.round((wz + this.SIZE) / this.cellSize);

    let didDig = false;

    for (let dz = -drCells; dz <= drCells; dz++) {
      for (let dx = -drCells; dx <= drCells; dx++) {
        const nx = cxi + dx;
        const nz = czi + dz;
        if (nx < 0 || nx > this.RES || nz < 0 || nz > this.RES) continue;

        const dist = Math.sqrt(dx * dx + dz * dz) * this.cellSize;
        if (dist > radius) continue;

        const idx = nz * (this.RES + 1) + nx;
        const currentH = this.heights[idx];
        /* Smooth falloff at edges */
        const falloff = 1 - (dist / radius) ** 1.8;
        const newH = Math.min(currentH, targetDepth - falloff * 0.08);

        if (newH < currentH - 0.001) {
          this.heights[idx] = newH;
          didDig = true;

          /* Mark cell as dug */
          if (nx < this.RES && nz < this.RES) {
            this.dugCells[nz * this.RES + nx] = 1;
          }
        }
      }
    }

    if (didDig) this._updateGeometry();
    return didDig;
  }

  _updateGeometry() {
    const pos = this._positions;
    for (let zi = 0; zi <= this.RES; zi++) {
      for (let xi = 0; xi <= this.RES; xi++) {
        const vi = zi * (this.RES + 1) + xi;
        pos[vi * 3 + 1] = this.heights[vi];
      }
    }
    this._geo.attributes.position.needsUpdate = true;

    /* Recompute normals */
    const idx = this._geo.index.array;
    this._computeNormals(pos, idx, this._normals);
    this._geo.attributes.normal.needsUpdate = true;
  }

  /**
   * Calculate task completion for a square hole.
   * Returns 0–1 fraction of cells within [cx±half, cz±half] dug to ≤ targetDepth.
   */
  squareHoleProgress(cx, cz, sizeM, targetDepth, cornerTol) {
    const half = sizeM / 2;
    let total = 0, done = 0;

    for (let zi = 0; zi <= this.RES; zi++) {
      const z = -this.SIZE + zi * this.cellSize;
      if (z < cz - half || z > cz + half) continue;
      for (let xi = 0; xi <= this.RES; xi++) {
        const x = -this.SIZE + xi * this.cellSize;
        if (x < cx - half || x > cx + half) continue;
        total++;
        const h = this.heights[zi * (this.RES + 1) + xi];
        if (h <= -targetDepth + 0.12) done++;
      }
    }
    return total > 0 ? done / total : 0;
  }

  /** Average height deviation in a rectangular zone (for grade task) */
  gradeAccuracy(cx, cz, sizeM, targetH) {
    const half = sizeM / 2;
    let total = 0, inTol = 0;
    for (let zi = 0; zi <= this.RES; zi++) {
      const z = -this.SIZE + zi * this.cellSize;
      if (z < cz - half || z > cz + half) continue;
      for (let xi = 0; xi <= this.RES; xi++) {
        const x = -this.SIZE + xi * this.cellSize;
        if (x < cx - half || x > cx + half) continue;
        total++;
        if (Math.abs(this.heights[zi * (this.RES + 1) + xi] - targetH) <= 0.05) inTol++;
      }
    }
    return total > 0 ? inTol / total : 0;
  }

  /** Draw completion map onto a canvas (for minimap HUD) */
  drawMinimap(canvas, cx, cz, sizeM, targetDepth) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const half = sizeM / 2;
    const pxPerM = W / (sizeM + 2);

    for (let zi = 0; zi <= this.RES; zi++) {
      const z = -this.SIZE + zi * this.cellSize;
      if (z < cz - half - 0.5 || z > cz + half + 0.5) continue;
      for (let xi = 0; xi <= this.RES; xi++) {
        const x = -this.SIZE + xi * this.cellSize;
        if (x < cx - half - 0.5 || x > cx + half + 0.5) continue;

        const h = this.heights[zi * (this.RES + 1) + xi];
        const px = (x - (cx - half - 0.5)) * pxPerM;
        const py = (z - (cz - half - 0.5)) * pxPerM;

        const inZone = x >= cx - half && x <= cx + half && z >= cz - half && z <= cz + half;
        if (inZone) {
          const progress = Math.min(1, Math.max(0, (-h) / targetDepth));
          const r = Math.round(255 * (1 - progress));
          const g = Math.round(200 * progress);
          ctx.fillStyle = `rgb(${r},${g},40)`;
        } else {
          ctx.fillStyle = 'rgba(40,40,40,0.5)';
        }
        ctx.fillRect(px, py, pxPerM + 1, pxPerM + 1);
      }
    }

    /* Draw target border */
    ctx.strokeStyle = '#FFB800';
    ctx.lineWidth = 2;
    const bx = 0.5 * pxPerM, by = 0.5 * pxPerM;
    const bs = sizeM * pxPerM;
    ctx.strokeRect(bx, by, bs, bs);
  }

  dispose() {
    this._geo.dispose();
    this.scene.remove(this.mesh);
    this.scene.remove(this.gridLines);
    if (this._sky) this.scene.remove(this._sky);
  }
}
