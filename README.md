# Sany SY265C9C6K — Hydraulic Crawler Excavator Simulator

A **hyperrealistic 3D training simulator** for the **Sany SY265C9C6K** hydraulic crawler excavator, built with [Three.js](https://threejs.org/) in the style of Bruno Simon. All controls match the real machine's SAE pattern. 20 progressive levels from machine overview to a precision square-hole challenge.

---

## Features

| Feature | Details |
|---------|---------|
| **Machine** | Sany SY265C9C6K — 26,500 kg, Cummins QSB6.7 162 kW |
| **3D Model** | Full procedural model: tracks, sprockets, idlers, cab, boom, arm, bucket + 4 hydraulic cylinders |
| **Controls** | Real SAE control pattern — keyboard maps to left/right joysticks + foot pedals |
| **Terrain** | Deformable grid terrain — dig actually lowers vertices in real-time |
| **Levels** | 20 training levels, beginner → expert, with manual references |
| **Tutorial** | Sany Operator Manual pop-ups for each level (Chapter/Page references) |
| **Displays** | Sany ICF monitor panel (RPM, hydraulic temp, fuel, load), virtual joystick display |
| **Minimap** | Live digging progress map for square-hole and grading tasks |
| **Camera** | Smooth orbit camera + operator cab view (C key to toggle) |

---

## Controls (SAE Pattern)

| Input | Action |
|-------|--------|
| `↑ / ↓` | Arm extend / retract (Left joystick Y) |
| `← / →` | Swing left / right (Left joystick X) |
| `I / K` | Boom up / down (Right joystick Y) |
| `J / L` | Bucket curl / dump (Right joystick X) |
| `W / S` | Both tracks forward / reverse |
| `A / D` | Differential turn left / right |
| `Q / E` | Counter-rotate left / right |
| `C` | Toggle orbit / operator camera |
| `H` | Horn |
| `ESC` | Pause menu |
| Mouse drag | Orbit camera |
| Scroll | Zoom |

Gamepad is also supported (standard mapping).

---

## Levels

1. Meet the Machine — 3D tour, identify all parts
2. Safety First — walk-around inspection
3. Left Track — single track control
4. Right Track
5. Drive to Target — combined travel
6. Obstacle Course — precision manoeuvring
7. Swing — upper structure rotation
8. Boom Control
9. Arm / Stick Control
10. Bucket Control
11. Dig Position — set correct posture
12. First Cut — full dig cycle
13. Trench Work — 12 m trench to 1.5 m depth
14. Depth Control — precision grade to ±0.1 m
15. Load the Truck — swing-and-dump cycles
16. Precision Near Obstacles — working around utilities
17. Slope Work — cut a 45° formation face
18. Square Corners — 2×2 m practice square
19. Foundation Prep — grade a 10×10 m pad
20. **Square Hole Master** — 4×4×2 m precision square hole (expert challenge)

---

## Quick Start

```bash
npm install
npm run dev      # Development server at http://localhost:3000
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

---

## Architecture

```
src/
  main.js          — App entry point & game loop
  World.js         — Three.js scene, lighting, camera, props
  Excavator.js     — SY265C9C6K 3D model + SAE controller
  Terrain.js       — Deformable terrain + digging physics
  InputManager.js  — Keyboard & gamepad input
  LevelManager.js  — Level progression + task tracking
  levelsData.js    — All 20 level definitions
  UIManager.js     — Level selector, HUD, tutorials, ICF panel
  style.css        — Bruno Simon–inspired dark minimalist UI
```
A hyperrealistic 3D-sim to learn how to drive the Sany SY265C9C6K
