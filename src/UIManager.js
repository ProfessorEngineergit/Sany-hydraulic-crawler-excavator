/**
 * UIManager — Manages all HTML/CSS UI overlays for the Sany SY265C9C6K simulator.
 * Communicates with LevelManager via events.
 */
export class UIManager {
  constructor(levelManager) {
    this._lm         = levelManager;
    this._listeners  = {};
    this._tutSkip    = false;
    this._currentLevel = null;
    this._hudActive    = false;

    /* Cached DOM refs */
    this._els = {
      loadingScreen:    document.getElementById('loading-screen'),
      loadingBar:       document.getElementById('loading-bar'),
      loadingText:      document.getElementById('loading-text'),

      levelSelect:      document.getElementById('level-select'),
      lsGrid:           document.getElementById('ls-grid'),
      lsFilters:        document.querySelectorAll('.ls-filter'),
      lsControlsBtn:    document.getElementById('ls-controls-btn'),

      controlsRef:      document.getElementById('controls-ref'),
      closeCtrlRef:     document.getElementById('close-controls-ref'),
      closeCtrlRef2:    document.getElementById('close-controls-ref-2'),

      tutPopup:         document.getElementById('tutorial-popup'),
      tutManualRef:     document.getElementById('tut-manual-ref'),
      tutTitle:         document.getElementById('tut-title'),
      tutBody:          document.getElementById('tut-body'),
      tutKeypoints:     document.getElementById('tut-keypoints'),
      tutCtrlHighlight: document.getElementById('tut-controls-highlight'),
      tutSkipFuture:    document.getElementById('tut-skip-future'),
      tutSkipBtn:       document.getElementById('tut-skip-btn'),
      tutOkBtn:         document.getElementById('tut-ok-btn'),
      tutClose:         document.getElementById('tut-close'),

      hud:              document.getElementById('hud'),
      hudMenuBtn:       document.getElementById('hud-menu-btn'),
      hudLevelNum:      document.getElementById('hud-level-num'),
      hudLevelName:     document.getElementById('hud-level-name'),
      hudObjText:       document.getElementById('hud-obj-text'),

      teleDepth:        document.getElementById('tele-depth'),
      teleBoom:         document.getElementById('tele-boom'),
      teleSwing:        document.getElementById('tele-swing'),
      teleReach:        document.getElementById('tele-reach'),

      vjoyLeftDot:      document.getElementById('vjoy-left-dot'),
      vjoyRightDot:     document.getElementById('vjoy-right-dot'),
      vjoyLeftH:        document.getElementById('vjoy-left-h'),
      vjoyLeftV:        document.getElementById('vjoy-left-v'),
      vjoyRightH:       document.getElementById('vjoy-right-h'),
      vjoyRightV:       document.getElementById('vjoy-right-v'),

      hudProgressLabel: document.getElementById('hud-progress-label'),
      hudProgressBar:   document.getElementById('hud-progress-bar'),
      hudProgressVal:   document.getElementById('hud-progress-val'),

      dpMode:           document.getElementById('dp-mode'),
      dpRpm:            document.getElementById('dp-rpm'),
      dpHydtemp:        document.getElementById('dp-hydtemp'),
      dpFuelFill:       document.getElementById('dp-fuel-fill'),
      dpLoad:           document.getElementById('dp-load'),
      dpWarn:           document.getElementById('dp-warn'),

      hudMinimap:       document.getElementById('hud-minimap'),
      minimapCanvas:    document.getElementById('minimap-canvas'),
      minimapPct:       document.getElementById('minimap-pct'),

      hudHint:          document.getElementById('hud-hint'),
      hudHintText:      document.getElementById('hud-hint-text'),

      pauseMenu:        document.getElementById('pause-menu'),
      pauseLevelName:   document.getElementById('pause-level-name'),
      pauseResume:      document.getElementById('pause-resume'),
      pauseRestart:     document.getElementById('pause-restart'),
      pauseControls:    document.getElementById('pause-controls'),
      pauseMenuBtn:     document.getElementById('pause-menu-btn'),

      levelComplete:    document.getElementById('level-complete'),
      completeTitle:    document.getElementById('complete-title'),
      completeDesc:     document.getElementById('complete-desc'),
      completeStats:    document.getElementById('complete-stats'),
      completeTip:      document.getElementById('complete-tip'),
      completeMenu:     document.getElementById('complete-menu'),
      completeNext:     document.getElementById('complete-next'),

      partTooltip:      document.getElementById('part-tooltip'),
      tooltipName:      document.getElementById('tooltip-name'),
      tooltipDesc:      document.getElementById('tooltip-desc'),
    };

    this._bindEvents();
  }

  /* ── Event System ─────────────────────────────────────────── */
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }

  /* ── Binding ──────────────────────────────────────────────── */
  _bindEvents() {
    const e = this._els;

    /* Loading done handled externally */

    /* Level select */
    e.lsControlsBtn?.addEventListener('click', () => this.showControlsRef());

    e.lsFilters?.forEach(btn => btn.addEventListener('click', ev => {
      e.lsFilters.forEach(b => b.classList.remove('active'));
      ev.currentTarget.classList.add('active');
      this._renderLevelCards(ev.currentTarget.dataset.filter);
    }));

    /* Controls ref */
    e.closeCtrlRef?.addEventListener('click',  () => this.hideControlsRef());
    e.closeCtrlRef2?.addEventListener('click', () => this.hideControlsRef());

    /* Tutorial */
    e.tutClose?.addEventListener('click',   () => this._emitTutorialDone());
    e.tutSkipBtn?.addEventListener('click', () => this._emitTutorialDone());
    e.tutOkBtn?.addEventListener('click',   () => this._emitTutorialDone());
    e.tutSkipFuture?.addEventListener('change', ev => {
      this._tutSkip = ev.target.checked;
    });

    /* HUD menu */
    e.hudMenuBtn?.addEventListener('click', () => this.showPause());

    /* Pause menu */
    e.pauseResume?.addEventListener('click', () => {
      this.hidePause();
      this._emit('resume');
    });
    e.pauseRestart?.addEventListener('click', () => {
      this.hidePause();
      this._emit('restart');
    });
    e.pauseControls?.addEventListener('click', () => this.showControlsRef());
    e.pauseMenuBtn?.addEventListener('click', () => {
      this.hidePause();
      this.hideHUD();
      this._emit('levelSelect');
      this.showLevelSelect();
    });

    /* Level complete */
    e.completeMenu?.addEventListener('click', () => {
      this.hideLevelComplete();
      this.hideHUD();
      this.showLevelSelect();
    });
    e.completeNext?.addEventListener('click', () => {
      this.hideLevelComplete();
      this._emit('nextLevel');
    });
  }

  _emitTutorialDone() {
    this._els.tutPopup.classList.add('hidden');
    this._emit('tutorialDone');
  }

  /* ── Loading Screen ────────────────────────────────────────── */
  setLoadingProgress(fraction, text) {
    this._els.loadingBar.style.width = (fraction * 100) + '%';
    if (text) this._els.loadingText.textContent = text;
  }

  hideLoadingScreen() {
    this._els.loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      this._els.loadingScreen.style.display = 'none';
    }, 650);
  }

  /* ── Level Select ─────────────────────────────────────────── */
  showLevelSelect() {
    this._renderLevelCards('all');
    this._els.levelSelect.classList.remove('hidden');
  }

  hideLevelSelect() {
    this._els.levelSelect.classList.add('hidden');
  }

  _renderLevelCards(filter) {
    const levels = this._lm.getAllLevelsWithState();
    const grid   = this._els.lsGrid;
    grid.innerHTML = '';

    const toShow = filter === 'all' ? levels : levels.filter(l => l.difficulty === filter);

    toShow.forEach(level => {
      const card = document.createElement('div');
      card.className = `level-card ${level.locked ? 'locked' : ''} ${level.completed ? 'completed' : ''}`;
      card.dataset.levelId = level.id;

      const icon  = level.completed ? '<span class="card-check">✓</span>' :
                    level.locked    ? '<span class="card-lock">🔒</span>' : '';

      card.innerHTML = `
        <div class="card-num">LEVEL ${String(level.id).padStart(2, '0')}</div>
        <div class="card-title">${level.name}</div>
        <div class="card-subtitle">${level.subtitle}</div>
        <div style="font-size:12px;color:#666;line-height:1.5;">${level.description}</div>
        <div class="card-meta">
          <span class="card-difficulty diff-${level.difficulty}">${level.difficulty}</span>
          <span class="card-controls">${(level.controls || []).join(' · ')}</span>
          ${icon}
        </div>
      `;

      if (!level.locked) {
        card.addEventListener('click', () => {
          this.hideLevelSelect();
          this._emit('levelSelect', level.id);
        });
      }

      grid.appendChild(card);
    });
  }

  /* ── Controls Reference ────────────────────────────────────── */
  showControlsRef() {
    this._els.controlsRef.classList.remove('hidden');
  }

  hideControlsRef() {
    this._els.controlsRef.classList.add('hidden');
  }

  /* ── Tutorial ─────────────────────────────────────────────── */
  showTutorial(level, onDone) {
    const tut = level.tutorial;
    if (!tut || !tut.show || this._tutSkip) {
      onDone && onDone();
      return;
    }

    const e = this._els;
    e.tutManualRef.textContent = tut.manualRef || '';
    e.tutTitle.textContent     = tut.title    || '';
    e.tutBody.textContent      = tut.body     || '';

    /* Key points */
    e.tutKeypoints.innerHTML = '';
    if (tut.keyPoints) {
      tut.keyPoints.forEach(kp => {
        const div = document.createElement('div');
        div.className = 'tut-keypoint';
        div.textContent = kp;
        e.tutKeypoints.appendChild(div);
      });
    }

    /* Controls highlight */
    e.tutCtrlHighlight.innerHTML = '';
    if (tut.controlsHighlight && tut.controlsHighlight.length > 0) {
      tut.controlsHighlight.forEach(key => {
        const chip = document.createElement('span');
        chip.className = 'tut-ctrl-chip';
        chip.textContent = key;
        e.tutCtrlHighlight.appendChild(chip);
      });
    }

    e.tutPopup.classList.remove('hidden');

    this.once('tutorialDone', () => {
      onDone && onDone();
    });
  }

  once(event, cb) {
    const wrapper = (data) => {
      cb(data);
      const arr = this._listeners[event];
      const idx = arr ? arr.indexOf(wrapper) : -1;
      if (idx > -1) arr.splice(idx, 1);
    };
    this.on(event, wrapper);
  }

  /* ── HUD ──────────────────────────────────────────────────── */
  showHUD(level) {
    this._currentLevel = level;
    const e = this._els;
    e.hud.classList.remove('hidden');
    e.hudLevelNum.textContent  = `LEVEL ${String(level.id).padStart(2, '0')}`;
    e.hudLevelName.textContent = level.name;
    e.hudObjText.textContent   = level.objective?.primary || '';
    this._hudActive = true;

    /* Minimap for square hole levels */
    const showMap = level.task?.type === 'squareHole' || level.task?.type === 'grade';
    if (showMap) {
      e.hudMinimap.classList.remove('hidden');
    } else {
      e.hudMinimap.classList.add('hidden');
    }
  }

  hideHUD() {
    this._els.hud.classList.add('hidden');
    this._hudActive = false;
  }

  /**
   * Update all HUD elements.
   * @param {object} tele     - from excavator.getTelemetry()
   * @param {object} input    - from inputManager.getState()
   * @param {object} taskInfo - { progress, done }
   * @param {Terrain} terrain
   */
  updateHUD(tele, input, taskInfo, terrain) {
    if (!this._hudActive) return;
    const e = this._els;

    /* Telemetry */
    e.teleDepth.textContent = `${tele.depth.toFixed(2)} m`;
    e.teleBoom.textContent  = `${tele.boom}°`;
    e.teleSwing.textContent = `${tele.swing}°`;
    e.teleReach.textContent = `${tele.reach.toFixed(1)} m`;

    /* Virtual joysticks */
    this._updateVJoy(e.vjoyLeftDot,  input.leftJoyX,  input.leftJoyY,  e.vjoyLeftH,  e.vjoyLeftV);
    this._updateVJoy(e.vjoyRightDot, input.rightJoyX, input.rightJoyY, e.vjoyRightH, e.vjoyRightV);

    /* Task progress */
    if (taskInfo) {
      const pct = Math.round(taskInfo.progress * 100);
      e.hudProgressBar.style.width = pct + '%';
      e.hudProgressVal.textContent  = pct + '%';
    }

    /* ICF Display Panel */
    const activity = (input.boomUp || input.boomDown || input.armIn || input.armOut ||
                      input.bucketCurl || input.bucketDump || input.swingLeft || input.swingRight);
    const baseRPM  = 1200;
    const workRPM  = 2000;
    const rpm      = Math.round(activity ? workRPM : baseRPM);
    e.dpRpm.textContent = rpm;

    const hydTemp = 45 + Math.round(activity ? Math.random() * 3 : 0);
    e.dpHydtemp.textContent = `${hydTemp}°C`;

    e.dpLoad.textContent = tele.depth > 0.5 ? `${Math.round(40 + tele.depth * 20)} kN` : '—';

    /* Fuel slowly decreases */
    if (!this._fuelLevel) this._fuelLevel = 80;
    this._fuelLevel = Math.max(5, this._fuelLevel - 0.001);
    e.dpFuelFill.style.width = this._fuelLevel + '%';
    e.dpWarn.style.display = this._fuelLevel < 15 ? 'flex' : 'none';

    /* Minimap */
    if (this._currentLevel?.task?.type === 'squareHole' && terrain) {
      const size = this._currentLevel.task.size || 4;
      const depth = this._currentLevel.task.depth || 2;
      terrain.drawMinimap(e.minimapCanvas, 0, 0, size, depth);
      e.minimapPct.textContent = Math.round((taskInfo?.progress || 0) * 100) + '%';
    }
  }

  _updateVJoy(dot, joyX, joyY, labelH, labelV) {
    const radius = 20; // px from center (ring is 60px, dot 16px → max offset = 22)
    const px = joyX * radius;
    const py = joyY * radius;
    // CSS: top/left are from ring top-left. Center of ring = 30px, 30px
    dot.style.left = `${30 + px - 8}px`;
    dot.style.top  = `${30 + py - 8}px`;

    /* Colour the labels active */
    if (labelH) labelH.style.color = Math.abs(joyX) > 0.15 ? '#FFB800' : '#555';
    if (labelV) labelV.style.color = Math.abs(joyY) > 0.15 ? '#FFB800' : '#555';
  }

  /* ── Hints ────────────────────────────────────────────────── */
  showHint(text, duration = 5000) {
    const e = this._els;
    e.hudHintText.textContent = text;
    e.hudHint.classList.remove('hidden');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      e.hudHint.classList.add('hidden');
    }, duration);
  }

  /* ── Pause Menu ───────────────────────────────────────────── */
  showPause() {
    this._els.pauseLevelName.textContent = this._currentLevel?.name || '';
    this._els.pauseMenu.classList.remove('hidden');
    this._emit('pause');
  }

  hidePause() {
    this._els.pauseMenu.classList.add('hidden');
  }

  /* ── Level Complete ──────────────────────────────────────────*/
  showLevelComplete(level, stats) {
    const e   = this._els;
    const isLast = level.id === 20;

    e.completeTitle.textContent = isLast
      ? '🏆 Master Excavator!'
      : `Level ${level.id} Complete!`;

    e.completeDesc.textContent  = level.completion?.successMessage || 'Well done!';

    /* Stats */
    e.completeStats.innerHTML = `
      <div class="stat-item">
        <div class="stat-label">TIME</div>
        <div class="stat-value">${this._formatTime(stats?.time || 0)}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label">COMPLETION</div>
        <div class="stat-value">${Math.round((stats?.progress || 1) * 100)}%</div>
      </div>
    `;

    e.completeTip.textContent = level.completion?.tipForNext
      ? `💡 Tip for next level: ${level.completion.tipForNext}` : '';

    e.completeNext.style.display = isLast ? 'none' : '';

    e.levelComplete.classList.remove('hidden');
  }

  hideLevelComplete() {
    this._els.levelComplete.classList.add('hidden');
  }

  _formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }

  /* ── Part Tooltip ─────────────────────────────────────────── */
  showPartTooltip(name, x, y) {
    const e = this._els;
    e.tooltipName.textContent = name;
    e.partTooltip.style.left  = `${x}px`;
    e.partTooltip.style.top   = `${y}px`;
    e.partTooltip.classList.remove('hidden');
  }

  hidePartTooltip() {
    this._els.partTooltip.classList.add('hidden');
  }
}
