/**
 * InputManager — Keyboard & Gamepad input for the Sany SY265C9C6K simulator.
 *
 * SAE Control Pattern (standard for Sany excavators):
 *   LEFT JOYSTICK  | ↑↓ = Arm out/in   |  ←→ = Swing left/right
 *   RIGHT JOYSTICK | I/K = Boom up/dn  |  J/L = Bucket curl/dump
 *   TRAVEL         | W/S = fwd/rev      |  A/D = turn L/R  | Q/E = counter-rot
 */
export class InputManager {
  constructor() {
    this._keys = new Set();
    this._prev = new Set();
    this._justPressed = new Set();

    this._gamepad = null;

    this._onKey = this._onKey.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);

    window.addEventListener('keydown', this._onKey);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('gamepadconnected', e => { this._gamepad = e.gamepad; });
    window.addEventListener('gamepaddisconnected', () => { this._gamepad = null; });
  }

  _onKey(e) {
    if (e.repeat) return;
    this._keys.add(e.code);
    this._justPressed.add(e.code);
  }

  _onKeyUp(e) {
    this._keys.delete(e.code);
  }

  /** Call once per frame to latch "justPressed" state */
  tick() {
    this._justPressed.clear();
    // Refresh gamepad
    if (this._gamepad) {
      const pads = navigator.getGamepads ? navigator.getGamepads() : [];
      this._gamepad = pads[this._gamepad.index] || null;
    }
  }

  isDown(code) { return this._keys.has(code); }
  wasJustPressed(code) { return this._justPressed.has(code); }

  /**
   * Returns the complete logical input state for the excavator.
   * Values are booleans (digital keys) or floats 0-1 (gamepad axes mapped to same).
   */
  getState() {
    const gp = this._gamepad;
    const gpBtn = (i) => gp ? (gp.buttons[i]?.pressed ?? false) : false;
    const gpAxis = (i, pos) => {
      if (!gp) return 0;
      const v = gp.axes[i] ?? 0;
      return pos ? Math.max(0, v) : Math.max(0, -v);
    };

    return {
      // ── Travel (foot levers / pedals) ──────────────────────────
      travelForward:   this.isDown('KeyW') || this.isDown('ArrowUp')    || gpBtn(12),
      travelBack:      this.isDown('KeyS') || this.isDown('ArrowDown')  || gpBtn(13),
      turnLeft:        this.isDown('KeyA')  || gpBtn(14),
      turnRight:       this.isDown('KeyD')  || gpBtn(15),
      counterRotLeft:  this.isDown('KeyQ'),
      counterRotRight: this.isDown('KeyE'),

      // ── Left joystick — SAE: ARM + SWING ──────────────────────
      // Arrow Up = arm OUT (extend), Arrow Down = arm IN (retract)
      armOut: (this.isDown('ArrowUp')   || gpAxis(1, false) > 0.15) ? true : false,
      armIn:  (this.isDown('ArrowDown') || gpAxis(1, true)  > 0.15) ? true : false,
      // Arrow Left = swing left, Arrow Right = swing right
      swingLeft:  (this.isDown('ArrowLeft')  || gpAxis(0, false) > 0.15) ? true : false,
      swingRight: (this.isDown('ArrowRight') || gpAxis(0, true)  > 0.15) ? true : false,

      // ── Right joystick — SAE: BOOM + BUCKET ───────────────────
      boomUp:      this.isDown('KeyI') || gpAxis(3, false) > 0.15,
      boomDown:    this.isDown('KeyK') || gpAxis(3, true)  > 0.15,
      bucketCurl:  this.isDown('KeyL') || gpAxis(2, true)  > 0.15,
      bucketDump:  this.isDown('KeyJ') || gpAxis(2, false) > 0.15,

      // ── Misc ───────────────────────────────────────────────────
      horn:          this.isDown('KeyH'),
      cameraToggle:  this.wasJustPressed('KeyC'),
      pause:         this.wasJustPressed('Escape'),

      // ── Analogue magnitudes (0-1) for display ─────────────────
      leftJoyX: this.isDown('ArrowLeft') ? -1 : this.isDown('ArrowRight') ? 1
                 : (gp ? Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : 0 : 0),
      leftJoyY: this.isDown('ArrowUp') ? -1 : this.isDown('ArrowDown') ? 1
                 : (gp ? Math.abs(gp.axes[1]) > 0.15 ? gp.axes[1] : 0 : 0),
      rightJoyX: this.isDown('KeyJ') ? -1 : this.isDown('KeyL') ? 1
                 : (gp ? Math.abs(gp.axes[2]) > 0.15 ? gp.axes[2] : 0 : 0),
      rightJoyY: this.isDown('KeyI') ? -1 : this.isDown('KeyK') ? 1
                 : (gp ? Math.abs(gp.axes[3]) > 0.15 ? gp.axes[3] : 0 : 0),
    };
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('keyup', this._onKeyUp);
  }
}
