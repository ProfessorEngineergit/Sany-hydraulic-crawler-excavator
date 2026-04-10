import * as THREE from 'three';

/**
 * Sany SY265C9C6K — Complete procedural 3D model & controller.
 *
 * Real machine dimensions (approximate, scaled 1 unit = 1 metre):
 *   Overall length (boom lowered): 11.15 m
 *   Overall width:                  3.19 m
 *   Overall height (in transport):  3.27 m
 *   Boom length:                    5.70 m
 *   Arm (stick) length:             2.90 m
 *   Bucket (1.2 m³ standard):       ~1.20 m wide
 *   Operating weight:               26,500 kg
 *
 * SAE control pattern:
 *   LEFT JOY: up/down = arm out/in  |  left/right = swing
 *   RIGHT JOY: up/down = boom up/dn |  left/right = bucket curl/dump
 */

const YELLOW  = 0xFFB800;
const YELLOW2 = 0xE6A400;
const DARK    = 0x1A1A1A;
const METAL   = 0x666666;
const CHROME  = 0xBBBBBB;
const RUBBER  = 0x111111;
const GLASS   = 0x88BBDD;
const RED     = 0xE31E24;
const WHITE   = 0xF5F5F5;

/** Constraint helpers */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp  = (a, b, t) => a + (b - a) * t;

export class Excavator {
  constructor(scene) {
    this.scene = scene;

    /* ── Joint angles (radians) ──────────────────────────────── */
    this.swingAngle  =  0;                    // upper body Y-rotation
    this.boomAngle   =  Math.PI * 0.30;       // boom elevation (0=horiz, π/2=vertical)
    this.armAngle    =  Math.PI * 0.55;       // arm angle relative to boom (0=inline, π=fully folded)
    this.bucketAngle =  Math.PI * 0.15;       // bucket curl (0=dump, π=full curl)

    /* ── Travel state ─────────────────────────────────────────── */
    this.position   = new THREE.Vector3(0, 0, 0);
    this.heading    = 0;                      // machine heading (radians around Y)
    this.leftTrackRot  = 0;
    this.rightTrackRot = 0;
    this.hornActive = false;

    /* ── Limits ────────────────────────────────────────────────── */
    this.BOOM_MIN   =  0.05;
    this.BOOM_MAX   =  Math.PI * 0.75;
    this.ARM_MIN    = -0.10;
    this.ARM_MAX    =  Math.PI * 0.90;
    this.BUCKET_MIN = -0.30;
    this.BUCKET_MAX =  Math.PI * 0.85;

    /* ── Materials ─────────────────────────────────────────────── */
    this._mat = {
      yellow:  this._std({ color: YELLOW,  roughness: 0.35, metalness: 0.10 }),
      yellow2: this._std({ color: YELLOW2, roughness: 0.40, metalness: 0.10 }),
      dark:    this._std({ color: DARK,    roughness: 0.70, metalness: 0.40 }),
      metal:   this._std({ color: METAL,   roughness: 0.50, metalness: 0.80 }),
      chrome:  this._std({ color: CHROME,  roughness: 0.10, metalness: 0.95 }),
      rubber:  this._std({ color: RUBBER,  roughness: 0.95, metalness: 0.00 }),
      glass:   new THREE.MeshStandardMaterial({ color: GLASS, transparent: true, opacity: 0.38, roughness: 0.05, metalness: 0.2, side: THREE.DoubleSide }),
      red:     this._std({ color: RED,     roughness: 0.45, metalness: 0.10 }),
      white:   this._std({ color: WHITE,   roughness: 0.60, metalness: 0.05 }),
    };

    /* ── Build hierarchy ───────────────────────────────────────── */
    this.root = new THREE.Group();
    this.root.name = 'excavator';
    scene.add(this.root);

    this._buildUndercarriage();
    this._buildSwingBody();
    this._buildBoom();
    this._buildArm();
    this._buildBucket();
    this._buildCylinders();

    /* ── Raycasting part names ─────────────────────────────────── */
    this._partNames = new Map();

    this._applyPose();
  }

  /* ════════════════════════════════════════════════════════════
     MATERIAL HELPER
  ════════════════════════════════════════════════════════════ */
  _std(params) {
    const m = new THREE.MeshStandardMaterial(params);
    m.castShadow = true;
    return m;
  }

  _mesh(geo, mat, name) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    if (name) { m.name = name; this._registerPart(m, name); }
    return m;
  }

  _registerPart(mesh, label) {
    if (this._partNames) this._partNames.set(mesh.uuid, label);
  }

  /* ════════════════════════════════════════════════════════════
     UNDERCARRIAGE
  ════════════════════════════════════════════════════════════ */
  _buildUndercarriage() {
    this.undercarriage = new THREE.Group();
    this.undercarriage.name = 'undercarriage';
    this.root.add(this.undercarriage);

    /* Main H-frame */
    const frame = this._mesh(new THREE.BoxGeometry(2.8, 0.42, 4.6), this._mat.yellow, 'Undercarriage Frame');
    frame.position.y = 0.36;
    this.undercarriage.add(frame);

    /* Centre cross member */
    const cross = this._mesh(new THREE.BoxGeometry(0.80, 0.30, 4.4), this._mat.dark, 'Centre Cross-member');
    cross.position.y = 0.28;
    this.undercarriage.add(cross);

    /* Swing bearing ring */
    const ring = this._mesh(
      new THREE.TorusGeometry(0.55, 0.06, 8, 32),
      this._mat.metal,
      'Swing Bearing'
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.62;
    this.undercarriage.add(ring);

    /* Left & right tracks */
    this._buildTrack('left',  -1.42);
    this._buildTrack('right',  1.42);
  }

  _buildTrack(side, xOffset) {
    const g = new THREE.Group();
    g.name = side + 'Track';
    g.position.x = xOffset;
    this.undercarriage.add(g);

    const label = side === 'left' ? 'Left Crawler Track' : 'Right Crawler Track';

    /* Track frame */
    const frame = this._mesh(new THREE.BoxGeometry(0.52, 0.28, 4.90), this._mat.yellow, label);
    frame.position.y = 0.34;
    g.add(frame);

    /* Rubber/steel track shoe belt */
    const shoe = this._mesh(new THREE.BoxGeometry(0.58, 0.16, 5.00), this._mat.rubber, label + ' Shoes');
    shoe.position.y = 0.04;
    g.add(shoe);

    /* Track grousers (every 0.18 m) */
    for (let i = 0; i < 26; i++) {
      const grouser = this._mesh(new THREE.BoxGeometry(0.62, 0.06, 0.06), this._mat.dark);
      grouser.position.set(0, 0.13, -2.32 + i * 0.185);
      g.add(grouser);
    }

    /* Drive sprocket (rear on this machine — sprocket at back) */
    const sprocket = this._mesh(
      new THREE.CylinderGeometry(0.265, 0.265, 0.56, 10), this._mat.dark,
      side === 'left' ? 'Left Drive Sprocket' : 'Right Drive Sprocket'
    );
    sprocket.rotation.z = Math.PI / 2;
    sprocket.position.set(0, 0.32, -2.15);
    g.add(sprocket);

    /* Sprocket teeth */
    for (let t = 0; t < 10; t++) {
      const angle = (t / 10) * Math.PI * 2;
      const tooth = this._mesh(new THREE.BoxGeometry(0.54, 0.08, 0.08), this._mat.metal);
      tooth.position.set(0, 0.32 + Math.sin(angle) * 0.28, -2.15 + Math.cos(angle) * 0.28);
      tooth.rotation.x = angle;
      g.add(tooth);
    }

    /* Front idler */
    const idler = this._mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.54, 10), this._mat.metal,
      side === 'left' ? 'Left Idler' : 'Right Idler'
    );
    idler.rotation.z = Math.PI / 2;
    idler.position.set(0, 0.28, 2.20);
    g.add(idler);

    /* Bottom track rollers (5×) */
    for (let i = 0; i < 5; i++) {
      const roller = this._mesh(
        new THREE.CylinderGeometry(0.13, 0.13, 0.54, 8), this._mat.dark
      );
      roller.rotation.z = Math.PI / 2;
      roller.position.set(0, 0.10, -1.80 + i * 0.90);
      g.add(roller);
    }

    /* Carrier rollers (2× top) */
    for (let i = 0; i < 2; i++) {
      const cr = this._mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.52, 8), this._mat.dark
      );
      cr.rotation.z = Math.PI / 2;
      cr.position.set(0, 0.50, -0.80 + i * 1.60);
      g.add(cr);
    }

    /* Store reference for track animation */
    if (side === 'left') this._leftTrackGroup = g;
    else this._rightTrackGroup = g;
  }

  /* ════════════════════════════════════════════════════════════
     UPPER STRUCTURE (swings on bearing)
  ════════════════════════════════════════════════════════════ */
  _buildSwingBody() {
    this.swingGroup = new THREE.Group();
    this.swingGroup.name = 'upperStructure';
    this.swingGroup.position.y = 0.62;
    this.undercarriage.add(this.swingGroup);

    /* Main body box */
    const body = this._mesh(
      new THREE.BoxGeometry(2.42, 0.70, 3.30), this._mat.yellow, 'Upper Structure Body'
    );
    body.position.set(0, 0.42, -0.05);
    this.swingGroup.add(body);

    /* Rear counterweight */
    const cw = this._mesh(
      new THREE.BoxGeometry(2.34, 0.82, 1.10), this._mat.dark, 'Counterweight (4,850 kg)'
    );
    cw.position.set(0, 0.44, -1.65);
    this.swingGroup.add(cw);

    /* Counterweight bottom flare */
    const cwf = this._mesh(new THREE.BoxGeometry(2.38, 0.10, 1.20), this._mat.dark);
    cwf.position.set(0, 0.04, -1.65);
    this.swingGroup.add(cwf);

    /* Engine cover (right side) */
    const eng = this._mesh(
      new THREE.BoxGeometry(1.14, 0.66, 1.90), this._mat.yellow2, 'Engine Cover (Cummins QSB6.7)'
    );
    eng.position.set(0.64, 0.90, -0.42);
    this.swingGroup.add(eng);

    /* Hydraulic oil tank (left rear) */
    const tank = this._mesh(
      new THREE.BoxGeometry(0.38, 0.72, 1.10), this._mat.yellow, 'Hydraulic Oil Tank'
    );
    tank.position.set(-1.10, 0.90, -0.70);
    this.swingGroup.add(tank);

    /* Fuel tank */
    const fuel = this._mesh(
      new THREE.BoxGeometry(0.38, 0.60, 0.80), this._mat.dark, 'Fuel Tank'
    );
    fuel.position.set(-1.10, 0.64, 0.22);
    this.swingGroup.add(fuel);

    /* Exhaust stack */
    const stack = this._mesh(
      new THREE.CylinderGeometry(0.055, 0.07, 0.90, 8), this._mat.dark, 'Exhaust Stack'
    );
    stack.position.set(0.90, 1.60, -1.0);
    this.swingGroup.add(stack);
    /* Stack cap */
    const cap = this._mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.06, 8), this._mat.dark
    );
    cap.position.set(0.90, 2.06, -1.0);
    this.swingGroup.add(cap);

    /* Boom saddle (front mount) */
    const saddle = this._mesh(
      new THREE.BoxGeometry(0.56, 0.92, 0.42), this._mat.yellow, 'Boom Mount'
    );
    saddle.position.set(0, 0.70, 1.42);
    this.swingGroup.add(saddle);

    /* Boom foot pin boss left & right */
    for (const x of [-0.22, 0.22]) {
      const boss = this._mesh(
        new THREE.CylinderGeometry(0.10, 0.10, 0.14, 10), this._mat.metal
      );
      boss.rotation.z = Math.PI / 2;
      boss.position.set(x, 1.08, 1.42);
      this.swingGroup.add(boss);
    }

    /* Sany logo plate */
    const logo = this._mesh(
      new THREE.BoxGeometry(0.80, 0.18, 0.02), this._mat.red, 'Sany Logo'
    );
    logo.position.set(0, 0.48, -2.21);
    this.swingGroup.add(logo);

    /* Build the cab */
    this._buildCab();
  }

  _buildCab() {
    this.cabGroup = new THREE.Group();
    this.cabGroup.name = 'cab';
    this.cabGroup.position.set(-0.68, 0.78, 0.24);
    this.swingGroup.add(this.cabGroup);

    /* Cab shell (FOPS/ROPS certified) */
    const shell = this._mesh(
      new THREE.BoxGeometry(1.08, 1.46, 1.72), this._mat.yellow, 'Operator Cab (FOPS/ROPS)'
    );
    shell.position.y = 0.73;
    this.cabGroup.add(shell);

    /* Front lower glass */
    const frontLo = this._mesh(
      new THREE.BoxGeometry(0.88, 0.52, 0.04), this._mat.glass, 'Front Windscreen (lower)'
    );
    frontLo.position.set(0, 0.48, 0.86);
    this.cabGroup.add(frontLo);

    /* Front upper glass */
    const frontHi = this._mesh(
      new THREE.BoxGeometry(0.88, 0.60, 0.04), this._mat.glass, 'Front Windscreen (upper)'
    );
    frontHi.position.set(0, 1.04, 0.86);
    this.cabGroup.add(frontHi);

    /* Left side glass */
    const leftWin = this._mesh(
      new THREE.BoxGeometry(0.04, 0.64, 1.10), this._mat.glass, 'Left Side Window'
    );
    leftWin.position.set(-0.54, 1.00, 0.10);
    this.cabGroup.add(leftWin);

    /* Right side glass (small, operator side toward boom) */
    const rightWin = this._mesh(
      new THREE.BoxGeometry(0.04, 0.48, 0.72), this._mat.glass, 'Right Side Window'
    );
    rightWin.position.set(0.54, 1.05, 0.10);
    this.cabGroup.add(rightWin);

    /* Rear window */
    const rear = this._mesh(
      new THREE.BoxGeometry(0.82, 0.50, 0.04), this._mat.glass, 'Rear Window'
    );
    rear.position.set(0, 1.05, -0.86);
    this.cabGroup.add(rear);

    /* Roof */
    const roof = this._mesh(
      new THREE.BoxGeometry(1.12, 0.10, 1.76), this._mat.dark, 'Cab Roof'
    );
    roof.position.y = 1.50;
    this.cabGroup.add(roof);

    /* Roof AC unit */
    const ac = this._mesh(
      new THREE.BoxGeometry(0.52, 0.14, 0.40), this._mat.dark, 'Air Conditioning Unit'
    );
    ac.position.set(-0.10, 1.62, 0.40);
    this.cabGroup.add(ac);

    /* Steps / grab handles */
    const step = this._mesh(
      new THREE.BoxGeometry(0.54, 0.06, 0.28), this._mat.dark
    );
    step.position.set(0, 0.06, 0.70);
    this.cabGroup.add(step);

    /* Sany window decal strip */
    const strip = this._mesh(
      new THREE.BoxGeometry(0.86, 0.04, 0.02), this._mat.red
    );
    strip.position.set(0, 1.48, 0.87);
    this.cabGroup.add(strip);
  }

  /* ════════════════════════════════════════════════════════════
     BOOM
  ════════════════════════════════════════════════════════════ */
  _buildBoom() {
    /* Pivot group: origin is the boom foot-pin position */
    this.boomPivot = new THREE.Group();
    this.boomPivot.name = 'boomPivot';
    this.boomPivot.position.set(0, 1.08, 1.42);
    this.swingGroup.add(this.boomPivot);

    /* The actual boom extends from origin toward +Z in LOCAL space */
    /* We'll tilt the whole pivot to set the initial elevation */

    /* Boom body — tapered box */
    const boomShape = new THREE.BoxGeometry(0.46, 0.46, 5.70);
    const boom = this._mesh(boomShape, this._mat.yellow, 'Boom (5.70 m)');
    boom.position.z = 2.85; /* half-length forward */
    this.boomPivot.add(boom);

    /* Boom side ribs */
    for (let z = 0.5; z < 5.5; z += 1.0) {
      const rib = this._mesh(new THREE.BoxGeometry(0.50, 0.04, 0.06), this._mat.dark);
      rib.position.set(0, 0.25, z);
      this.boomPivot.add(rib);
    }

    /* Boom nose (arm attachment boss) */
    const nose = this._mesh(
      new THREE.BoxGeometry(0.54, 0.54, 0.30), this._mat.yellow2
    );
    nose.position.z = 5.70;
    this.boomPivot.add(nose);

    /* Arm pivot pin (boss) */
    for (const x of [-0.20, 0.20]) {
      const pin = this._mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.12, 10), this._mat.metal
      );
      pin.rotation.z = Math.PI / 2;
      pin.position.set(x, 0, 5.70);
      this.boomPivot.add(pin);
    }

    /* Sany boom sticker */
    const sticker = this._mesh(
      new THREE.BoxGeometry(1.20, 0.16, 0.02), this._mat.red
    );
    sticker.position.set(0, 0.25, 2.80);
    this.boomPivot.add(sticker);

    /* Cylinder foot bosses on boom body */
    for (const x of [-0.18, 0.18]) {
      const cb = this._mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.12, 8), this._mat.metal
      );
      cb.rotation.z = Math.PI / 2;
      cb.position.set(x, 0.26, 1.60);
      this.boomPivot.add(cb);
    }

    /* ── Arm pivot at boom tip ── */
    this.armPivotOffset = new THREE.Group();
    this.armPivotOffset.position.set(0, 0, 5.70);
    this.boomPivot.add(this.armPivotOffset);
  }

  /* ════════════════════════════════════════════════════════════
     ARM / STICK
  ════════════════════════════════════════════════════════════ */
  _buildArm() {
    this.armPivot = new THREE.Group();
    this.armPivot.name = 'armPivot';
    this.armPivotOffset.add(this.armPivot);

    /* Arm body — 2.90 m */
    const arm = this._mesh(
      new THREE.BoxGeometry(0.36, 0.36, 2.90), this._mat.yellow, 'Arm / Stick (2.90 m)'
    );
    arm.position.z = 1.45;
    this.armPivot.add(arm);

    /* Arm side ribs */
    for (let z = 0.3; z < 2.8; z += 0.7) {
      const rib = this._mesh(new THREE.BoxGeometry(0.40, 0.04, 0.05), this._mat.dark);
      rib.position.set(0, 0.20, z);
      this.armPivot.add(rib);
    }

    /* Arm tip boss */
    const tip = this._mesh(
      new THREE.BoxGeometry(0.40, 0.40, 0.22), this._mat.yellow2
    );
    tip.position.z = 2.90;
    this.armPivot.add(tip);

    /* Bucket pivot pin boss */
    for (const x of [-0.16, 0.16]) {
      const pin = this._mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.10, 8), this._mat.metal
      );
      pin.rotation.z = Math.PI / 2;
      pin.position.set(x, 0, 2.90);
      this.armPivot.add(pin);
    }

    /* Stick cylinder attachment boss */
    const sab = this._mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), this._mat.metal
    );
    sab.rotation.z = Math.PI / 2;
    sab.position.set(0, 0.20, 0.60);
    this.armPivot.add(sab);

    /* Bucket pivot offset group */
    this.bucketPivotOffset = new THREE.Group();
    this.bucketPivotOffset.position.set(0, 0, 2.90);
    this.armPivot.add(this.bucketPivotOffset);
  }

  /* ════════════════════════════════════════════════════════════
     BUCKET (1.2 m³ standard)
  ════════════════════════════════════════════════════════════ */
  _buildBucket() {
    this.bucketPivot = new THREE.Group();
    this.bucketPivot.name = 'bucketPivot';
    this.bucketPivotOffset.add(this.bucketPivot);

    const Y = this._mat.yellow;
    const M = this._mat.metal;

    /* Back plate */
    const back = this._mesh(new THREE.BoxGeometry(1.22, 0.04, 0.90), Y, 'Bucket (1.2 m³)');
    back.position.z = 0.44;
    this.bucketPivot.add(back);

    /* Left & right cheek plates */
    for (const x of [-0.60, 0.60]) {
      const cheek = this._mesh(new THREE.BoxGeometry(0.06, 0.72, 1.02), Y, 'Bucket Side Plate');
      cheek.position.set(x, -0.34, 0.46);
      this.bucketPivot.add(cheek);
    }

    /* Top plate (above pivot) */
    const topPlate = this._mesh(new THREE.BoxGeometry(1.22, 0.06, 0.34), Y);
    topPlate.position.set(0, 0.04, 0.14);
    this.bucketPivot.add(topPlate);

    /* Curved bottom (3 sections at slight angles) */
    const b1 = this._mesh(new THREE.BoxGeometry(1.22, 0.05, 0.60), Y);
    b1.position.set(0, -0.68, 0.34);
    b1.rotation.x = 0.30;
    this.bucketPivot.add(b1);

    const b2 = this._mesh(new THREE.BoxGeometry(1.22, 0.05, 0.46), Y);
    b2.position.set(0, -0.74, 0.62);
    b2.rotation.x = -0.18;
    this.bucketPivot.add(b2);

    /* Cutting edge (hardened) */
    const edge = this._mesh(new THREE.BoxGeometry(1.22, 0.08, 0.06), M, 'Cutting Edge (Hardened)');
    edge.position.set(0, -0.76, 0.82);
    this.bucketPivot.add(edge);

    /* Bucket teeth (4 with adapters) */
    for (let i = 0; i < 4; i++) {
      const x = -0.44 + i * 0.295;

      /* Adapter */
      const adapter = this._mesh(new THREE.BoxGeometry(0.09, 0.10, 0.12), M);
      adapter.position.set(x, -0.77, 0.87);
      this.bucketPivot.add(adapter);

      /* Tooth — tapered cone */
      const tooth = this._mesh(new THREE.ConeGeometry(0.042, 0.26, 5), M, 'Bucket Tooth');
      tooth.rotation.x = -Math.PI / 2;
      tooth.position.set(x, -0.78, 1.00);
      this.bucketPivot.add(tooth);
    }

    /* Side teeth */
    for (const xSide of [-0.60, 0.60]) {
      const st = this._mesh(new THREE.ConeGeometry(0.036, 0.20, 5), M, 'Side Tooth');
      st.rotation.x = -Math.PI / 2;
      st.position.set(xSide, -0.76, 0.88);
      this.bucketPivot.add(st);
    }

    /* Internal wear plates */
    const wp = this._mesh(new THREE.BoxGeometry(1.10, 0.03, 0.70), this._mat.dark);
    wp.position.set(0, -0.60, 0.40);
    this.bucketPivot.add(wp);

    /* Linkage bracket (bucket cylinder attachment) */
    const link = this._mesh(new THREE.BoxGeometry(0.26, 0.20, 0.12), M, 'Bucket Linkage');
    link.position.set(0, 0.14, 0.28);
    this.bucketPivot.add(link);

    /* Store the tip position for digging detection */
    this._bucketTipLocal = new THREE.Vector3(0, -0.82, 1.05);
  }

  /* ════════════════════════════════════════════════════════════
     HYDRAULIC CYLINDERS (visual)
  ════════════════════════════════════════════════════════════ */
  _buildCylinders() {
    /* Each cylinder is {group, barrel, rod}
       All added to scene root so we can position in world space */

    /* Boom cylinders (×2) */
    this._boomCylinders = [
      this._makeCylinder(0.095, 0.060, 1.50, 1.10),
      this._makeCylinder(0.095, 0.060, 1.50, 1.10),
    ];

    /* Arm (stick) cylinder (×1) */
    this._armCylinder = this._makeCylinder(0.085, 0.055, 1.40, 1.10);

    /* Bucket cylinder (×1) */
    this._bucketCylinder = this._makeCylinder(0.075, 0.048, 1.20, 0.90);

    /* Bucket linkage rods (×2) */
    this._linkageRods = [
      this._makeCylinder(0.035, 0.028, 0.60, 0.50),
      this._makeCylinder(0.035, 0.028, 0.60, 0.50),
    ];
  }

  _makeCylinder(barrelR, rodR, barrelLen, rodLen) {
    const g = new THREE.Group();
    this.scene.add(g); // parented to scene so we can use world-space coords

    const barrel = this._mesh(
      new THREE.CylinderGeometry(barrelR, barrelR, barrelLen, 8),
      this._mat.metal
    );
    barrel.position.y = barrelLen * 0.5;
    g.add(barrel);

    const rod = this._mesh(
      new THREE.CylinderGeometry(rodR, rodR, rodLen, 8),
      this._mat.chrome
    );
    rod.position.y = barrelLen + rodLen * 0.5;
    g.add(rod);

    return { group: g, barrel, rod, barrelLen, rodLen };
  }

  /* ════════════════════════════════════════════════════════════
     UPDATE — called every frame
  ════════════════════════════════════════════════════════════ */
  update(delta, input) {
    const S = 1.6;   // angular speed (rad/s) for work equipment
    const TS = 3.8;  // travel speed (m/s)
    const RS = 1.80; // rotation speed (rad/s)
    const SS = 0.95; // swing speed (rad/s)

    /* ── Travel ────────────────────────────────────────────── */
    if (input.travelForward || input.travelBack || input.turnLeft || input.turnRight ||
        input.counterRotLeft || input.counterRotRight) {

      const fwd = (input.travelForward ? 1 : 0) - (input.travelBack ? 1 : 0);
      const turn = (input.turnRight ? 1 : 0) - (input.turnLeft ? 1 : 0);
      const cr = (input.counterRotRight ? 1 : 0) - (input.counterRotLeft ? 1 : 0);

      this.heading -= (turn * RS + cr * RS * 0.8) * delta;

      const dx = Math.sin(this.heading) * fwd * TS * delta;
      const dz = Math.cos(this.heading) * fwd * TS * delta;
      this.position.x += dx;
      this.position.z += dz;

      /* Track animation */
      const leftSpeed  = fwd - turn * 0.8;
      const rightSpeed = fwd + turn * 0.8;
      this.leftTrackRot  += leftSpeed  * delta * 3.0;
      this.rightTrackRot += rightSpeed * delta * 3.0;
    }

    /* ── Swing ─────────────────────────────────────────────── */
    if (input.swingLeft)  this.swingAngle += SS * delta;
    if (input.swingRight) this.swingAngle -= SS * delta;

    /* ── Boom ──────────────────────────────────────────────── */
    if (input.boomUp)   this.boomAngle = clamp(this.boomAngle + S * delta, this.BOOM_MIN, this.BOOM_MAX);
    if (input.boomDown) this.boomAngle = clamp(this.boomAngle - S * delta, this.BOOM_MIN, this.BOOM_MAX);

    /* ── Arm ───────────────────────────────────────────────── */
    if (input.armIn)  this.armAngle = clamp(this.armAngle + S * delta, this.ARM_MIN, this.ARM_MAX);
    if (input.armOut) this.armAngle = clamp(this.armAngle - S * delta, this.ARM_MIN, this.ARM_MAX);

    /* ── Bucket ─────────────────────────────────────────────── */
    if (input.bucketCurl) this.bucketAngle = clamp(this.bucketAngle + S * delta, this.BUCKET_MIN, this.BUCKET_MAX);
    if (input.bucketDump) this.bucketAngle = clamp(this.bucketAngle - S * delta, this.BUCKET_MIN, this.BUCKET_MAX);

    /* ── Apply pose ─────────────────────────────────────────── */
    this._applyPose();
  }

  _applyPose() {
    /* Root position & heading */
    this.root.position.copy(this.position);
    this.root.rotation.y = this.heading;

    /* Swing */
    this.swingGroup.rotation.y = this.swingAngle;

    /* Boom — rotates around X at pivot.  0=horizontal, positive=raised */
    this.boomPivot.rotation.x = -this.boomAngle + Math.PI * 0.10; // offset for visual resting

    /* Arm — 0=inline with boom, positive=folded toward cab */
    this.armPivot.rotation.x = -this.armAngle + Math.PI * 0.28;

    /* Bucket */
    this.bucketPivot.rotation.x = -this.bucketAngle + Math.PI * 0.20;

    /* Update cylinder visuals */
    this.scene.updateMatrixWorld(true);
    this._updateCylinders();
  }

  _updateCylinders() {
    /* Helper: position a cylinder group between two world-space points */
    const positionCyl = (cyl, pA, pB) => {
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      const dir = pB.clone().sub(pA).normalize();
      const len = pA.distanceTo(pB);

      cyl.group.position.copy(mid);
      cyl.group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

      /* Scale the rod to fill from barrel end to pB */
      const totalVisible = Math.max(0.01, len);
      const barrelPart = Math.min(totalVisible, cyl.barrelLen);
      const rodPart    = Math.max(0.01, totalVisible - barrelPart * 0.5);

      cyl.barrel.scale.y = barrelPart  / cyl.barrelLen;
      cyl.rod.scale.y    = rodPart / cyl.rodLen;
      cyl.barrel.position.y = barrelPart * 0.5;
      cyl.rod.position.y    = barrelPart + rodPart * 0.5;
    };

    /* Boom cylinders */
    /* Foot: on upper structure front at each side */
    /* Head: on boom at ~30% along boom */
    const swMW = this.swingGroup.matrixWorld;

    for (let i = 0; i < 2; i++) {
      const xSide = i === 0 ? -0.18 : 0.18;
      const foot = new THREE.Vector3(xSide, 1.30, 0.70).applyMatrix4(swMW);
      const head = new THREE.Vector3(xSide, 0.26, 1.65).applyMatrix4(this.boomPivot.matrixWorld);
      positionCyl(this._boomCylinders[i], foot, head);
    }

    /* Arm cylinder */
    /* Foot: near top of boom at ~70% length */
    const boomMW = this.boomPivot.matrixWorld;
    const armFoot = new THREE.Vector3(0, 0.25, 3.80).applyMatrix4(boomMW);
    const armHead = new THREE.Vector3(0, 0.20, 0.55).applyMatrix4(this.armPivot.matrixWorld);
    positionCyl(this._armCylinder, armFoot, armHead);

    /* Bucket cylinder */
    const armMW = this.armPivot.matrixWorld;
    const bktFoot = new THREE.Vector3(0, 0.20, 1.10).applyMatrix4(armMW);
    const bktHead = new THREE.Vector3(0, 0.14, 0.26).applyMatrix4(this.bucketPivot.matrixWorld);
    positionCyl(this._bucketCylinder, bktFoot, bktHead);

    /* Bucket linkage rods (H-link) */
    const bktMW = this.bucketPivot.matrixWorld;
    for (let i = 0; i < 2; i++) {
      const xSide = i === 0 ? -0.12 : 0.12;
      const rA = new THREE.Vector3(xSide, 0, 2.88).applyMatrix4(armMW);
      const rB = new THREE.Vector3(xSide, 0.14, 0.26).applyMatrix4(bktMW);
      positionCyl(this._linkageRods[i], rA, rB);
    }
  }

  /* ════════════════════════════════════════════════════════════
     PUBLIC GETTERS
  ════════════════════════════════════════════════════════════ */

  /** Returns bucket tip position in world space */
  getBucketTipWorld() {
    this.scene.updateMatrixWorld(true);
    return this._bucketTipLocal.clone().applyMatrix4(this.bucketPivot.matrixWorld);
  }

  /** Returns array of all meshes for raycasting */
  getMeshes() {
    const meshes = [];
    this.root.traverse(obj => { if (obj.isMesh) meshes.push(obj); });
    return meshes;
  }

  getPosition() { return this.position.clone(); }

  /** Telemetry for HUD */
  getTelemetry() {
    this.scene.updateMatrixWorld(true);
    const tipWorld = this.getBucketTipWorld();
    const boomDeg  = Math.round(THREE.MathUtils.radToDeg(this.boomAngle));
    const swingDeg = Math.round(THREE.MathUtils.radToDeg(this.swingAngle) % 360);
    const reach    = Math.sqrt(tipWorld.x ** 2 + tipWorld.z ** 2);

    return {
      depth:  parseFloat((-tipWorld.y).toFixed(2)),
      boom:   boomDeg,
      swing:  swingDeg,
      reach:  parseFloat(reach.toFixed(2)),
    };
  }

  /** Dispose all geometry */
  dispose() {
    this.root.traverse(obj => {
      if (obj.isMesh) {
        obj.geometry.dispose();
      }
    });
    this.scene.remove(this.root);

    const cyls = [...this._boomCylinders, this._armCylinder, this._bucketCylinder, ...this._linkageRods];
    cyls.forEach(c => {
      c.group.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
      this.scene.remove(c.group);
    });
  }
}
