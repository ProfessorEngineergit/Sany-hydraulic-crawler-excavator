/**
 * Sany SY265C9C6K Hydraulic Crawler Excavator — Training Simulator
 * Built with Three.js in the style of Bruno Simon.
 *
 * Main entry point — boots all systems, runs the game loop.
 */

import './style.css';
import { World }        from './World.js';
import { Excavator }    from './Excavator.js';
import { InputManager } from './InputManager.js';
import { LevelManager } from './LevelManager.js';
import { UIManager }    from './UIManager.js';

class App {
  constructor() {
    this._paused   = false;
    this._active   = false;
    this._clock    = { prev: performance.now() };
    this._level    = null;
    this._taskDone = false;

    /* ── Boot sequence ──────────────────────────────────────── */
    const container = document.getElementById('canvas-container');

    this.world   = new World(container);
    this.input   = new InputManager();
    this.levels  = new LevelManager();
    this.ui      = new UIManager(this.levels);

    /* ── Wire events ──────────────────────────────────────────── */
    this.ui.on('levelSelect', id => {
      if (id !== undefined) {
        /* A specific level was chosen from the grid */
        this._startLevel(id);
      } else {
        /* Return to level select (from pause / complete screens) */
        this._active = false;
        this.ui.showLevelSelect();
      }
    });

    this.levels.on('levelComplete', id => {
      /* Handled inline in loop */
    });

    /* ── Simulated loading ──────────────────────────────────── */
    this._simulateLoading(() => {
      this.ui.hideLoadingScreen();
      this.ui.showLevelSelect();
      this._startLoop();
    });
  }

  /* ── Loading simulation ────────────────────────────────────── */
  _simulateLoading(onDone) {
    const steps = [
      [0.15, 'Loading Three.js scene…'],
      [0.35, 'Building Sany SY265C9C6K model…'],
      [0.55, 'Initialising terrain system…'],
      [0.72, 'Loading 20 training levels…'],
      [0.88, 'Preparing control system…'],
      [1.00, 'Ready!'],
    ];
    let i = 0;
    const advance = () => {
      if (i >= steps.length) { setTimeout(onDone, 300); return; }
      const [p, txt] = steps[i++];
      this.ui.setLoadingProgress(p, txt);
      setTimeout(advance, 220 + Math.random() * 180);
    };
    advance();
  }

  /* ── Level start ────────────────────────────────────────────── */
  _startLevel(levelId) {
    const level = this.levels.getLevel(levelId);
    if (!level || !this.levels.isUnlocked(levelId)) {
      this.ui.showLevelSelect();
      return;
    }

    this._level    = level;
    this._taskDone = false;
    this._paused   = false;
    this._active   = true;

    /* Set up Three.js scene */
    this.world.setupLevel(level);
    this.levels.startLevel(levelId);

    /* Show HUD */
    this.ui.showHUD(level);

    /* Tutorial — then unpause when dismissed */
    this._paused = true;
    this.ui.showTutorial(level, () => {
      this._paused = false;

      /* Show initial hint based on controls needed */
      const ctrl = level.controls || [];
      if (ctrl.includes('travel')) {
        this.ui.showHint('Use W/S to drive, A/D to turn', 5000);
      } else if (ctrl.includes('swing')) {
        this.ui.showHint('Use ←/→ Arrow keys to swing', 5000);
      } else if (ctrl.includes('boom')) {
        this.ui.showHint('Use I/K to raise/lower boom', 5000);
      } else if (ctrl.includes('arm')) {
        this.ui.showHint('Use ↑/↓ Arrow keys to extend/retract arm', 5000);
      } else if (ctrl.includes('bucket')) {
        this.ui.showHint('Use J/L to curl/dump bucket', 5000);
      }
    });
  }

  /* ── Game loop ──────────────────────────────────────────────── */
  _startLoop() {
    const loop = () => {
      requestAnimationFrame(loop);
      this._tick();
    };
    loop();
  }

  _tick() {
    const now   = performance.now();
    const delta = Math.min((now - this._clock.prev) / 1000, 0.05); // cap at 50 ms
    this._clock.prev = now;

    /* Input tick (clears justPressed) */
    this.input.tick();
    const inputState = this.input.getState();

    /* Camera toggle */
    if (inputState.cameraToggle) {
      this.world.toggleCameraMode();
    }

    /* Pause on ESC */
    if (inputState.pause && this._active) {
      if (this._paused) {
        /* Resume */
        this.ui.hidePause();
        this._paused = false;
      } else {
        this.ui.showPause();
        this._paused = true;
      }
    }

    if (!this._paused && this._active) {
      const { excavator, terrain } = this.world;

      /* Update excavator */
      if (excavator) {
        excavator.update(delta, inputState);
      }

      /* Task tick */
      if (excavator && !this._taskDone) {
        const taskInfo = this.levels.tick({ excavator, terrain, input: inputState }, delta);

        /* Update HUD */
        const tele = excavator.getTelemetry();
        this.ui.updateHUD(tele, inputState, taskInfo, terrain);

        /* Level complete */
        if (taskInfo.done && !this._taskDone) {
          this._taskDone = true;
          this._paused   = true;

          this.levels.completeLevel(this._level.id);

          const stats = {
            time:     this.levels.getElapsedTime(),
            progress: taskInfo.progress,
          };

          setTimeout(() => {
            this.ui.showLevelComplete(this._level, stats);
          }, 800);
        }
      }

      /* Part tooltip via raycast */
      const hit = this.world.raycastMachines(this.world.getMouseNDC());
      if (hit && hit.name) {
        const rect = this.world.renderer.domElement.getBoundingClientRect();
        const mx   = ((this.world.getMouseNDC().x + 1) / 2) * rect.width  + rect.left;
        const my   = ((-this.world.getMouseNDC().y + 1) / 2) * rect.height + rect.top;
        this.ui.showPartTooltip(hit.name, mx, my);
      } else {
        this.ui.hidePartTooltip();
      }
    }

    /* Always update world (camera) */
    this.world.update(delta);
    this.world.render();
  }
}

/* ── Start ─────────────────────────────────────────────────── */
window.addEventListener('DOMContentLoaded', () => {
  new App();
});
