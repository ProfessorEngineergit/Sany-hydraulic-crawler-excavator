/**
 * InputManager — Keyboard, Gamepad & Touch input for the Sany SY265C9C6K simulator.
 *
 * Supports two input modes:
 *   'keyboard' — Arrow keys / IJKL + WASDQE + gamepad (default)
 *   'touch'    — On-screen touch joystick pads + travel D-pad
 *
 * Supports control patterns:
 * SAE (standard for Sany excavators):
 *   LEFT JOYSTICK  | ↑↓ = Arm out/in   |  ←→ = Swing left/right
 *   RIGHT JOYSTICK | I/K = Boom up/dn  |  J/L = Bucket curl/dump
 * BHL (Backhoe/ISO alternative):
 *   LEFT JOYSTICK  | ↑↓ = Boom up/dn   |  ←→ = Swing left/right
 *   RIGHT JOYSTICK | I/K = Arm out/in  |  J/L = Bucket curl/dump
 *   TRAVEL         | W/S = fwd/rev      |  A/D = turn L/R  | Q/E = counter-rot
 */
export class InputManager {
  constructor() {
    this._keys = new Set();
    this._prev = new Set();
    this._justPressed = new Set();

    this._gamepad = null;
    this._controlPattern = localStorage.getItem('sany_control_pattern') || 'SAE';
    this._inputMode      = localStorage.getItem('sany_input_mode')      || 'keyboard';

    /* Touch axis state — normalised –1..1 */
    this._touchLeft   = { x: 0, y: 0 };
    this._touchRight  = { x: 0, y: 0 };
    this._touchTravel = { forward: false, back: false, left: false, right: false };

    this._onKey    = this._onKey.bind(this);
    this._onKeyUp  = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup',   this._onKeyUp);
    window.addEventListener('gamepadconnected',    e  => { this._gamepad = e.gamepad; });
    window.addEventListener('gamepaddisconnected', () => { this._gamepad = null; });

    /* Bind touch controls to DOM elements (DOM is ready at this point) */
    this._initTouch();
  }

  _onKey(e) {
    if (e.repeat) return;
    this._keys.add(e.code);
    this._justPressed.add(e.code);
  }

  _onKeyUp(e) {
    this._keys.delete(e.code);
  }

  /* ── Touch initialisation ──────────────────────────────────── */
  _initTouch() {
    this._bindTouchJoystick('touch-joy-left',  'touch-joy-knob-left',  this._touchLeft);
    this._bindTouchJoystick('touch-joy-right', 'touch-joy-knob-right', this._touchRight);
    this._bindDpad();
  }

  _bindTouchJoystick(padId, knobId, axisRef) {
    const pad  = document.getElementById(padId);
    const knob = document.getElementById(knobId);
    if (!pad) return;

    const RADIUS = InputManager.TOUCH_JOY_RADIUS;
    let activeTouchId = null;
    let centerX = 0, centerY = 0;

    const onStart = (e) => {
      e.preventDefault();
      if (activeTouchId !== null) return;
      const touch = e.changedTouches[0];
      activeTouchId = touch.identifier;
      const rect = pad.getBoundingClientRect();
      centerX = rect.left + rect.width  / 2;
      centerY = rect.top  + rect.height / 2;
      this._applyTouchAxis(axisRef, touch, centerX, centerY, RADIUS, knob);
    };

    const onMove = (e) => {
      e.preventDefault();
      const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
      if (!touch) return;
      this._applyTouchAxis(axisRef, touch, centerX, centerY, RADIUS, knob);
    };

    const onEnd = (e) => {
      const touch = Array.from(e.changedTouches).find(t => t.identifier === activeTouchId);
      if (!touch) return;
      activeTouchId = null;
      axisRef.x = 0;
      axisRef.y = 0;
      if (knob) knob.style.transform = 'translate(-50%, -50%)';
    };

    pad.addEventListener('touchstart',  onStart, { passive: false });
    pad.addEventListener('touchmove',   onMove,  { passive: false });
    pad.addEventListener('touchend',    onEnd,   { passive: false });
    pad.addEventListener('touchcancel', onEnd,   { passive: false });
  }

  _applyTouchAxis(axisRef, touch, cx, cy, radius, knob) {
    const dx   = touch.clientX - cx;
    const dy   = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamped = Math.min(dist, radius);
    const angle   = Math.atan2(dy, dx);
    axisRef.x = (clamped / radius) * Math.cos(angle);
    axisRef.y = (clamped / radius) * Math.sin(angle);
    if (knob) {
      const kx = Math.cos(angle) * clamped;
      const ky = Math.sin(angle) * clamped;
      knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
    }
  }

  _bindDpad() {
    const map = [
      ['dpad-up',    'forward'],
      ['dpad-down',  'back'],
      ['dpad-left',  'left'],
      ['dpad-right', 'right'],
    ];
    map.forEach(([id, dir]) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      const set = (v) => { this._touchTravel[dir] = v; };
      btn.addEventListener('touchstart',  e => { e.preventDefault(); set(true);  }, { passive: false });
      btn.addEventListener('touchend',    e => { e.preventDefault(); set(false); }, { passive: false });
      btn.addEventListener('touchcancel', e => { e.preventDefault(); set(false); }, { passive: false });
      /* Also support mouse for desktop testing */
      btn.addEventListener('mousedown', () => set(true));
      btn.addEventListener('mouseup',   () => set(false));
      btn.addEventListener('mouseleave',() => set(false));
    });
  }

  /** Call once per frame to latch "justPressed" state */
  tick() {
    this._justPressed.clear();
    if (this._gamepad) {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      this._gamepad = pads[this._gamepad.index] || null;
    }
  }

  isDown(code)         { return this._keys.has(code); }
  wasJustPressed(code) { return this._justPressed.has(code); }
  getControlPattern()  { return this._controlPattern; }
  getInputMode()       { return this._inputMode; }

  setControlPattern(pattern) {
    if (!['SAE', 'BHL'].includes(pattern)) return;
    this._controlPattern = pattern;
    localStorage.setItem('sany_control_pattern', pattern);
  }

  setInputMode(mode) {
    if (!['keyboard', 'touch'].includes(mode)) return;
    this._inputMode = mode;
    localStorage.setItem('sany_input_mode', mode);
    /* Reset touch axes when leaving touch mode */
    if (mode === 'keyboard') {
      this._touchLeft.x  = 0; this._touchLeft.y  = 0;
      this._touchRight.x = 0; this._touchRight.y = 0;
      this._touchTravel  = { forward: false, back: false, left: false, right: false };
    }
  }

  /**
   * Returns the complete logical input state for the excavator.
   * In 'touch' mode the touch axes replace keyboard / gamepad joystick axes.
   */
  getState() {
    const isTouchMode = this._inputMode === 'touch';
    const gp          = this._gamepad;
    const gpBtn = (i) => gp ? (gp.buttons[i]?.pressed ?? false) : false;
    const gpAxis = (i, pos) => {
      if (!gp) return 0;
      const v = gp.axes[i] ?? 0;
      return pos ? Math.max(0, v) : Math.max(0, -v);
    };

    const DEAD = 0.15;

    /* ── Joystick axes ───────────────────────────────────────── */
    let leftX, leftY, rightX, rightY;

    if (isTouchMode) {
      leftX  = this._touchLeft.x;
      leftY  = this._touchLeft.y;
      rightX = this._touchRight.x;
      rightY = this._touchRight.y;
    } else {
      leftX  = this.isDown('ArrowLeft')  ? -1 : this.isDown('ArrowRight') ? 1
               : (gp ? (Math.abs(gp.axes[0]) > DEAD ? gp.axes[0] : 0) : 0);
      leftY  = this.isDown('ArrowUp')    ? -1 : this.isDown('ArrowDown')  ? 1
               : (gp ? (Math.abs(gp.axes[1]) > DEAD ? gp.axes[1] : 0) : 0);
      rightX = this.isDown('KeyJ')       ? -1 : this.isDown('KeyL')       ? 1
               : (gp ? (Math.abs(gp.axes[2]) > DEAD ? gp.axes[2] : 0) : 0);
      rightY = this.isDown('KeyI')       ? -1 : this.isDown('KeyK')       ? 1
               : (gp ? (Math.abs(gp.axes[3]) > DEAD ? gp.axes[3] : 0) : 0);
    }

    const leftYNeg  = leftY  < -DEAD;
    const leftYPos  = leftY  >  DEAD;
    const leftXNeg  = leftX  < -DEAD;
    const leftXPos  = leftX  >  DEAD;
    const rightYNeg = rightY < -DEAD;
    const rightYPos = rightY >  DEAD;
    const rightXNeg = rightX < -DEAD;
    const rightXPos = rightX >  DEAD;

    const isSAE  = this._controlPattern === 'SAE';
    const armOut  = isSAE ? leftYNeg  : rightYNeg;
    const armIn   = isSAE ? leftYPos  : rightYPos;
    const boomUp  = isSAE ? rightYNeg : leftYNeg;
    const boomDown = isSAE ? rightYPos : leftYPos;

    /* ── Travel ──────────────────────────────────────────────── */
    const travelForward  = isTouchMode ? this._touchTravel.forward
                           : this.isDown('KeyW') || gpBtn(12);
    const travelBack     = isTouchMode ? this._touchTravel.back
                           : this.isDown('KeyS') || gpBtn(13);
    const turnLeft       = isTouchMode ? this._touchTravel.left
                           : this.isDown('KeyA') || gpBtn(14);
    const turnRight      = isTouchMode ? this._touchTravel.right
                           : this.isDown('KeyD') || gpBtn(15);

    return {
      /* Travel */
      travelForward,
      travelBack,
      turnLeft,
      turnRight,
      counterRotLeft:  !isTouchMode && this.isDown('KeyQ'),
      counterRotRight: !isTouchMode && this.isDown('KeyE'),

      /* Work equipment */
      armOut,
      armIn,
      swingLeft:  leftXNeg,
      swingRight: leftXPos,
      boomUp,
      boomDown,
      bucketCurl: rightXPos,
      bucketDump: rightXNeg,

      /* Misc — keyboard shortcuts always active */
      horn:                 this.isDown('KeyH'),
      cameraToggle:         this.wasJustPressed('KeyC'),
      pause:                this.wasJustPressed('Escape'),
      controlPatternToggle: this.wasJustPressed('KeyP'),
      controlPattern:       this._controlPattern,
      inputMode:            this._inputMode,

      /* Analogue magnitudes 0-1 (used by virtual joystick display) */
      leftJoyX:  leftX,
      leftJoyY:  leftY,
      rightJoyX: rightX,
      rightJoyY: rightY,
    };
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup',   this._onKeyUp);
  }
}

/* Max knob travel in px — used by _bindTouchJoystick and _applyTouchAxis */
InputManager.TOUCH_JOY_RADIUS = 50;

