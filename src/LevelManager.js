import { LEVELS, getUnlockedLevels } from './levelsData.js';

/**
 * LevelManager — manages level state, progress, and task completion.
 */
export class LevelManager {
  constructor() {
    this._completedIds = this._loadProgress();
    this._currentLevel  = null;
    this._taskState     = null;
    this._startTime     = 0;
    this._listeners     = {};
  }

  /* ── Persistence ──────────────────────────────────────────── */
  _loadProgress() {
    try {
      const saved = localStorage.getItem('sany_progress');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch { return new Set(); }
  }

  _saveProgress() {
    try {
      localStorage.setItem('sany_progress', JSON.stringify([...this._completedIds]));
    } catch {}
  }

  /* ── Event system ─────────────────────────────────────────── */
  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach(cb => cb(data));
  }

  /* ── Getters ──────────────────────────────────────────────── */
  getAllLevelsWithState() {
    return getUnlockedLevels(this._completedIds);
  }

  getLevel(id) {
    return LEVELS.find(l => l.id === id) || null;
  }

  isUnlocked(id) {
    return id === 1 || this._completedIds.has(id - 1);
  }

  isCompleted(id) {
    return this._completedIds.has(id);
  }

  getCurrentLevel() { return this._currentLevel; }

  /* ── Level lifecycle ──────────────────────────────────────── */
  startLevel(levelId) {
    const level = this.getLevel(levelId);
    if (!level) return;
    this._currentLevel = level;
    this._startTime    = performance.now();
    this._taskState    = this._initTaskState(level.task);
  }

  _initTaskState(task) {
    if (!task) return null;
    switch (task.type) {
      case 'explore':
        return { type: 'explore', elapsed: 0, done: false };
      case 'travel':
      case 'navigate':
        return { type: task.type, done: false };
      case 'swing':
        return { type: 'swing', targetsHit: new Set(), done: false };
      case 'boomTarget':
        return { type: 'boomTarget', done: false };
      case 'reachTarget':
        return { type: 'reachTarget', hit: 0, done: false };
      case 'poseMatch':
        return { type: 'poseMatch', held: 0, done: false };
      case 'digCycles':
        return { type: 'digCycles', cycles: 0, inBucket: false, done: false };
      case 'trench':
        return { type: 'trench', progress: 0, done: false };
      case 'depthControl':
        return { type: 'depthControl', pitsComplete: 0, done: false };
      case 'loadTruck':
        return { type: 'loadTruck', loads: 0, done: false };
      case 'squareHole':
        return { type: 'squareHole', progress: 0, done: false };
      case 'grade':
        return { type: 'grade', coverage: 0, done: false };
      case 'inspect':
        return { type: 'inspect', found: new Set(), done: false };
      case 'obstacle':
        return { type: 'obstacle', gatesPassed: 0, done: false };
      case 'avoidObstacles':
        return { type: 'avoidObstacles', hits: 0, done: false };
      case 'slopeCut':
        return { type: 'slopeCut', done: false };
      case 'catchDump':
        return { type: 'catchDump', done: false };
      default:
        return { type: 'unknown', done: false };
    }
  }

  /**
   * Update task state each frame.
   * @param {object} state   — { excavator, terrain, input }
   * @param {number} delta   — seconds since last frame
   * @returns {{ progress: number, done: boolean, stats: object }}
   */
  tick(state, delta) {
    if (!this._currentLevel || !this._taskState) {
      return { progress: 0, done: false };
    }

    const ts = this._taskState;
    const task = this._currentLevel.task;
    const { excavator, terrain } = state;

    switch (ts.type) {
      /* ── Explore ───────────────────────────────────────────── */
      case 'explore': {
        ts.elapsed += delta;
        const p = Math.min(1, ts.elapsed / (task.duration || 30));
        ts.done = ts.elapsed >= (task.duration || 30);
        return { progress: p, done: ts.done };
      }

      /* ── Navigate to target ───────────────────────────────── */
      case 'navigate': {
        if (!task.target) return { progress: 0, done: false };
        const pos = excavator.getPosition();
        const dx = pos.x - task.target.x;
        const dz = pos.z - task.target.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        const tol = task.tolerance || 2.0;
        const p = Math.max(0, 1 - dist / 15);
        if (dist < tol) ts.done = true;
        return { progress: p, done: ts.done };
      }

      /* ── Swing targets ────────────────────────────────────── */
      case 'swing': {
        if (!task.targets) return { progress: 0, done: false };
        const swingAngle = excavator.swingAngle;
        task.targets.forEach((target, i) => {
          if (!ts.targetsHit.has(i)) {
            if (Math.abs(swingAngle - target) < 0.18) {
              ts.targetsHit.add(i);
            }
          }
        });
        const p = ts.targetsHit.size / task.targets.length;
        ts.done = ts.targetsHit.size >= task.targets.length;
        return { progress: p, done: ts.done };
      }

      /* ── Boom target ──────────────────────────────────────── */
      case 'boomTarget': {
        const tipWorld = excavator.getBucketTipWorld();
        const targetZ  = 7.2; // over the wall
        if (tipWorld.y > 2.5 && tipWorld.z > targetZ) {
          ts.phase = 'over';
        }
        if (ts.phase === 'over' && tipWorld.z > 8 && tipWorld.y < 2.0) {
          ts.done = true;
        }
        return { progress: ts.done ? 1 : (ts.phase === 'over' ? 0.6 : tipWorld.y / 3.0), done: ts.done };
      }

      /* ── Pose match ──────────────────────────────────────────*/
      case 'poseMatch': {
        const { boom, arm, bucket } = task.target || {};
        const tol = task.tolerance || 0.15;
        const bA = Math.abs(excavator.boomAngle / Math.PI - boom) < tol;
        const aA = Math.abs(excavator.armAngle / Math.PI - arm) < tol;
        const bkA = Math.abs(excavator.bucketAngle / Math.PI - bucket) < tol;
        const match = bA && aA && bkA;
        if (match) { ts.held += delta; } else { ts.held = 0; }
        const p = match ? Math.min(1, ts.held / 2) : 0.3 * ((bA ? 1 : 0) + (aA ? 1 : 0) + (bkA ? 1 : 0)) / 3;
        ts.done = ts.held >= 2.0;
        return { progress: p, done: ts.done };
      }

      /* ── Dig cycles ───────────────────────────────────────── */
      case 'digCycles': {
        const tip = excavator.getBucketTipWorld();
        const bucketAngle = excavator.bucketAngle;

        if (!ts.inBucket && terrain && terrain.tryDig(tip.x, tip.y, tip.z)) {
          ts.inBucket = (bucketAngle > 0.6);
        }

        if (ts.inBucket) {
          const dumpZone = { x: 6, z: 0, r: 2.5 };
          const pos = excavator.getPosition();
          const distToDump = Math.sqrt((pos.x - dumpZone.x) ** 2 + (pos.z - dumpZone.z) ** 2);
          if (distToDump < dumpZone.r && bucketAngle < 0.1 && excavator.boomAngle > 0.4) {
            ts.cycles++;
            ts.inBucket = false;
          }
        }

        const required = task.cycles || 3;
        ts.done = ts.cycles >= required;
        return { progress: ts.cycles / required, done: ts.done };
      }

      /* ── Trench ───────────────────────────────────────────── */
      case 'trench': {
        if (!terrain) return { progress: 0, done: false };
        const tip = excavator.getBucketTipWorld();
        terrain.tryDig(tip.x, tip.y, tip.z);
        // Measure how much of the trench strip has been dug
        const progress = terrain.squareHoleProgress(0, task.length / 2, task.width || 1.2, task.depth || 1.5);
        ts.progress = progress;
        ts.done = progress > 0.75;
        return { progress, done: ts.done };
      }

      /* ── Depth control ────────────────────────────────────── */
      case 'depthControl': {
        if (!terrain) return { progress: 0, done: false };
        const tip = excavator.getBucketTipWorld();
        const targetDepth = task.targetDepth || 2.0;
        terrain.tryDig(tip.x, tip.y, tip.z);
        const tele = excavator.getTelemetry();
        if (Math.abs(tele.depth - targetDepth) < (task.tolerance || 0.1) && tip.y < -0.5) {
          ts.pitsComplete = Math.min((task.pits || 4), ts.pitsComplete + delta * 0.3);
        }
        const p = ts.pitsComplete / (task.pits || 4);
        ts.done = p >= 1;
        return { progress: p, done: ts.done };
      }

      /* ── Load truck ───────────────────────────────────────── */
      case 'loadTruck': {
        if (!terrain) return { progress: 0, done: false };
        const tip = excavator.getBucketTipWorld();
        const bucketAngle = excavator.bucketAngle;
        terrain.tryDig(tip.x, tip.y, tip.z);

        // Detect dump near truck (simplified: dump within 5 m of x=7)
        if (bucketAngle < 0.05 && Math.abs(tip.x - 7) < 3 && tip.y > 1.5) {
          if (!ts._lastDump || performance.now() - ts._lastDump > 2000) {
            ts.loads++;
            ts._lastDump = performance.now();
          }
        }
        const required = task.loads || 5;
        ts.done = ts.loads >= required;
        return { progress: ts.loads / required, done: ts.done };
      }

      /* ── Square hole ─────────────────────────────────────── */
      case 'squareHole': {
        if (!terrain) return { progress: 0, done: false };
        const tip = excavator.getBucketTipWorld();
        terrain.tryDig(tip.x, tip.y, tip.z);
        const progress = terrain.squareHoleProgress(
          0, 0,
          task.size || 4,
          task.depth || 2.0
        );
        ts.progress = progress;
        ts.done = progress >= 0.92;
        return { progress, done: ts.done };
      }

      /* ── Grade ────────────────────────────────────────────── */
      case 'grade': {
        if (!terrain) return { progress: 0, done: false };
        const tip = excavator.getBucketTipWorld();
        terrain.tryDig(tip.x, tip.y, tip.z);
        const coverage = terrain.gradeAccuracy(0, 0, task.size || 10, 0);
        ts.coverage = coverage;
        ts.done = coverage >= (task.coverageTarget || 0.9);
        return { progress: coverage, done: ts.done };
      }

      default:
        return { progress: 0, done: false };
    }
  }

  completeLevel(id) {
    this._completedIds.add(id);
    this._saveProgress();
    this._emit('levelComplete', id);
  }

  getElapsedTime() {
    return (performance.now() - this._startTime) / 1000;
  }

  resetProgress() {
    this._completedIds.clear();
    this._saveProgress();
  }
}
