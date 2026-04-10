/**
 * SANY SY265C9C6K — Level Definitions
 * 20 progressive training levels covering all machine controls.
 * Tutorial content references the actual Sany SY265C9C6K Operator Manual.
 */

export const LEVELS = [

  // ─────────────────────────────────────────────────────────────
  // BEGINNER TIER — Machine familiarity & basic movement
  // ─────────────────────────────────────────────────────────────

  {
    id: 1,
    name: 'Meet the Machine',
    subtitle: 'Machine Overview & Safety',
    difficulty: 'beginner',
    description: 'Get acquainted with the Sany SY265C9C6K before you ever touch a joystick.',
    controls: ['camera'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 1 — Machine Overview · Pages 1-1 to 1-6',
      title: 'Welcome to the Sany SY265C9C6K',
      body: 'The Sany SY265C9C6K is a 26,500 kg hydraulic crawler excavator powered by a Cummins QSB6.7 engine producing 162 kW. Before operating any heavy machine, familiarise yourself with its major components — this knowledge is essential for safe and efficient operation.',
      keyPoints: [
        'Undercarriage: crawler tracks, sprockets, idlers, and carrier/track rollers',
        'Upper structure: rotates 360° on the swing bearing (5,500 kgf·m swing torque)',
        'Work equipment: boom (5.7 m), arm/stick (2.9 m), and 1.2 m³ bucket',
        'Cab: FOPS/ROPS certified operator station with air conditioning',
        'Counterweight: 4,850 kg rear ballast for stability during operation',
      ],
      controlsHighlight: [],
    },
    objective: { primary: 'Orbit the camera around the excavator and identify all major components', secondary: null },
    task: { type: 'explore', duration: 20 },
    setup: { terrainType: 'flat', props: ['partLabels'] },
    completion: {
      successMessage: 'Great — you know the machine! Study the labels before moving on.',
      tipForNext: 'Next level introduces the travel controls. Keep both hands free to operate the foot pedals.',
    },
  },

  {
    id: 2,
    name: 'Safety First',
    subtitle: 'Pre-Operation Checks & Emergency Stop',
    difficulty: 'beginner',
    description: 'Learn the walk-around inspection and locate the emergency stop.',
    controls: ['camera'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 3 — Before Starting the Engine · Pages 3-1 to 3-8',
      title: 'Pre-Operation Safety Checks',
      body: 'The Sany operator manual requires a systematic walk-around inspection before each shift. Check for fluid leaks, damaged hoses, loose track shoes, and clean the cab windows. Always fasten your seat belt and adjust the seat before operating.',
      keyPoints: [
        'Walk around the machine anti-clockwise; check for leaks, damage or loose components',
        'Hydraulic oil level: check sight gauge on the hydraulic oil tank (right side)',
        'Engine oil & coolant: check via the dipstick and overflow bottle',
        'Track tension: should have 10–30 mm sag mid-span (Section 10.3, Page 10-4)',
        'Emergency stop button: RED button on the right console — stops all hydraulics instantly',
      ],
      controlsHighlight: [],
    },
    objective: { primary: 'Click on the 5 inspection points highlighted on the machine', secondary: null },
    task: { type: 'inspect', points: 5 },
    setup: { terrainType: 'flat', props: ['inspectPoints'] },
    completion: {
      successMessage: 'Inspection complete. Machine is cleared for operation.',
      tipForNext: 'Time to move! The left travel lever controls the left track.',
    },
  },

  {
    id: 3,
    name: 'Left Track',
    subtitle: 'Left Travel Lever / Pedal',
    difficulty: 'beginner',
    description: 'Control only the left crawler track to understand differential steering.',
    controls: ['travelLeft'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Travel Controls · Section 4.2 · Page 4-3',
      title: 'Left Travel Control',
      body: 'The Sany SY265C9C6K has independent left and right travel levers/pedals. Pushing the left lever forward drives the left track forward; pulling it back reverses the left track. When only one track moves, the machine pivots around the stationary track.',
      keyPoints: [
        'Left lever forward (W-key) → left track forward',
        'Left lever back (S-key) → left track reverse',
        'Only the left track moves in this exercise — the right track is locked',
        'The machine will pivot in place — observe how the machine rotates',
        'Travel speed: Hi (5.3 km/h) or Lo (3.2 km/h) — selected via monitor (Section 4.3)',
      ],
      controlsHighlight: ['W', 'S'],
    },
    objective: { primary: 'Drive the left track to rotate the machine 180°', secondary: null },
    task: { type: 'travel', target: { swingBody: false, travelAngle: Math.PI } },
    setup: { terrainType: 'flat' },
    completion: {
      successMessage: 'Left track mastered!',
      tipForNext: 'Now try the right track independently.',
    },
  },

  {
    id: 4,
    name: 'Right Track',
    subtitle: 'Right Travel Lever / Pedal',
    difficulty: 'beginner',
    description: 'Control only the right crawler track.',
    controls: ['travelRight'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Travel Controls · Section 4.2 · Page 4-3',
      title: 'Right Travel Control',
      body: 'The right travel lever operates identically to the left, but controls the right track only. Combine both levers to travel straight; operate them independently for turns.',
      keyPoints: [
        'Right lever forward → right track forward',
        'Right lever back → right track reverse',
        'Machine pivots around the left (stationary) track',
        'Counter-rotate: one track forward + other track backward = spin on the spot',
      ],
      controlsHighlight: [],
    },
    objective: { primary: 'Drive the right track to rotate the machine 180° in the opposite direction', secondary: null },
    task: { type: 'travel', target: { swingBody: false, travelAngle: -Math.PI } },
    setup: { terrainType: 'flat' },
    completion: {
      successMessage: 'Right track mastered!',
      tipForNext: 'Combine both tracks for straight travel.',
    },
  },

  {
    id: 5,
    name: 'Drive to Target',
    subtitle: 'Combined Travel — Straight & Turn',
    difficulty: 'beginner',
    description: 'Navigate the excavator to a marked parking zone using both tracks.',
    controls: ['travelLeft', 'travelRight'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Travel Controls · Section 4.2 · Pages 4-3 to 4-5',
      title: 'Coordinated Travel',
      body: 'For straight travel, push both levers forward simultaneously. For a gradual turn, push one lever farther than the other. The excavator should always travel with the idlers at the REAR and drive sprockets at the FRONT of the direction of travel.',
      keyPoints: [
        'W = both tracks forward (straight travel)',
        'S = both tracks reverse',
        'A = differential left turn (right track faster)',
        'D = differential right turn (left track faster)',
        'Q = counter-rotate left (in-place spin)',
        'E = counter-rotate right (in-place spin)',
        'Always check blind spots before reversing — use mirrors and rear camera',
      ],
      controlsHighlight: ['W', 'S', 'A', 'D', 'Q', 'E'],
    },
    objective: { primary: 'Navigate to the yellow marker on the ground', secondary: 'Use the least number of moves possible' },
    task: { type: 'navigate', target: { x: 8, z: -8 }, tolerance: 1.5 },
    setup: { terrainType: 'flat', props: ['navMarker'] },
    completion: {
      successMessage: 'Target reached!',
      tipForNext: 'Upper structure swing is next — a key excavator technique.',
    },
  },

  {
    id: 6,
    name: 'Obstacle Course',
    subtitle: 'Precise Travel & Manoeuvring',
    difficulty: 'beginner',
    description: 'Navigate through a series of cones without knocking them over.',
    controls: ['travelLeft', 'travelRight'],
    tutorial: {
      show: false,
      manualRef: 'Chapter 4 — Travel Controls · Section 4.2',
      title: '', body: '', keyPoints: [], controlsHighlight: [],
    },
    objective: { primary: 'Navigate through all 6 cone gates without hitting any', secondary: null },
    task: { type: 'obstacle', gates: 6 },
    setup: { terrainType: 'flat', props: ['cones'] },
    completion: {
      successMessage: 'Excellent driving! Precision travel is essential on real job sites.',
      tipForNext: 'Now you\'ll learn to swing the upper structure — the most frequently used motion.',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // INTERMEDIATE TIER — Work equipment introduction
  // ─────────────────────────────────────────────────────────────

  {
    id: 7,
    name: 'Swing',
    subtitle: 'Upper Structure Rotation',
    difficulty: 'intermediate',
    description: 'Rotate the upper structure using the left joystick.',
    controls: ['swing'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Work Equipment Controls · Section 4.3 · Page 4-6',
      title: 'Swing Operation',
      body: 'Moving the left joystick left or right rotates the upper structure on the swing bearing. The SY265C9C6K delivers 5,500 kgf·m swing torque and 11.0 rpm maximum swing speed. Always check the swing radius before rotating — the counterweight extends behind the cab.',
      keyPoints: [
        'Left joystick LEFT (← arrow) = upper structure swings LEFT',
        'Left joystick RIGHT (→ arrow) = upper structure swings RIGHT',
        'Swing radius: the counterweight swings 2.97 m from centre of rotation',
        'Never swing into personnel or obstacles — check clearances',
        'Release joystick to coast to a stop (swing brake engages automatically)',
      ],
      controlsHighlight: ['←', '→'],
    },
    objective: { primary: 'Swing the machine to face the yellow marker flags (left then right)', secondary: null },
    task: { type: 'swing', targets: [Math.PI / 2, -Math.PI / 2] },
    setup: { terrainType: 'flat', props: ['swingTargets'] },
    completion: {
      successMessage: 'Smooth swing control!',
      tipForNext: 'Boom control comes next — up and down with the right joystick.',
    },
  },

  {
    id: 8,
    name: 'Boom Control',
    subtitle: 'Raise & Lower the Boom',
    difficulty: 'intermediate',
    description: 'Operate the boom cylinder to raise and lower the boom arm.',
    controls: ['boom'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Work Equipment Controls · Section 4.4 · Page 4-7',
      title: 'Boom Operation',
      body: 'The boom is controlled by the right joystick forward/backward axis. On the SY265C9C6K, two boom cylinders (bore 150 mm, stroke 1,350 mm) raise and lower the 5.7 m boom. Maximum lifting force at the bucket hook is 196 kN.',
      keyPoints: [
        'Right joystick BACK (I key) = boom raises',
        'Right joystick FORWARD (K key) = boom lowers',
        'Max boom height: approximately 9.38 m above ground',
        'Never lower the boom with the bucket loaded unless the machine is stable',
        'At minimum angle, boom can strike the front of the upper structure — heed travel alarm',
      ],
      controlsHighlight: ['I', 'K'],
    },
    objective: { primary: 'Raise the boom to pass over the wall, then lower it on the other side', secondary: null },
    task: { type: 'boomTarget', overWall: true },
    setup: { terrainType: 'flat', props: ['wall'] },
    completion: {
      successMessage: 'Boom control mastered!',
      tipForNext: 'Now learn the arm/stick — extends your digging reach.',
    },
  },

  {
    id: 9,
    name: 'Arm / Stick Control',
    subtitle: 'Extend & Retract the Arm',
    difficulty: 'intermediate',
    description: 'Operate the stick cylinder to extend and retract the arm.',
    controls: ['arm'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Work Equipment Controls · Section 4.4 · Page 4-8',
      title: 'Arm (Stick) Operation',
      body: 'The arm, also called the stick or dipper, is controlled by the left joystick forward/backward axis. The 2.9 m arm provides a maximum digging depth of 6,775 mm. Arm-in (crowd) pulls material towards the machine; arm-out (extend) pushes the bucket away.',
      keyPoints: [
        'Left joystick BACK (↑ arrow) = arm extends (crowds out, away from machine)',
        'Left joystick FORWARD (↓ arrow) = arm retracts (crowds in, toward machine)',
        'Max digging depth: 6,775 mm (Section 2.3, Page 2-6)',
        'Max horizontal reach: 10,360 mm at ground level',
        'Arm-in motion is where most digging force is generated — 143 kN arm cylinder force',
      ],
      controlsHighlight: ['↑', '↓'],
    },
    objective: { primary: 'Reach the glowing sphere by extending the arm, then retract fully', secondary: null },
    task: { type: 'reachTarget', targets: 2 },
    setup: { terrainType: 'flat', props: ['reachSpheres'] },
    completion: {
      successMessage: 'Arm control mastered!',
      tipForNext: 'One more joint — the bucket. Then you\'re ready to dig!',
    },
  },

  {
    id: 10,
    name: 'Bucket Control',
    subtitle: 'Curl & Dump the Bucket',
    difficulty: 'intermediate',
    description: 'Operate the bucket cylinder to curl and dump.',
    controls: ['bucket'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 4 — Work Equipment Controls · Section 4.4 · Page 4-9',
      title: 'Bucket Operation',
      body: 'The bucket is controlled by the right joystick left/right axis. Curling the bucket (roll-in) retains material; dumping (roll-out) releases it. The 1.2 m³ standard bucket on the SY265C9C6K has a breakout force of 178 kN — enough to dig through hard clay and soft rock.',
      keyPoints: [
        'Right joystick RIGHT (L key) = bucket curls / rolls in (closes)',
        'Right joystick LEFT (J key) = bucket dumps / rolls out (opens)',
        'Bucket curl is used to cut into soil and retain material',
        'Bucket dump is used when loading trucks or placing spoil',
        'The bucket should be curled before travelling to prevent spillage',
      ],
      controlsHighlight: ['J', 'L'],
    },
    objective: { primary: 'Curl the bucket to catch the falling spheres, then dump them into the bin', secondary: null },
    task: { type: 'catchDump', catches: 3 },
    setup: { terrainType: 'flat', props: ['bucket_challenge'] },
    completion: {
      successMessage: 'Bucket control mastered! All 4 axes of work equipment are now unlocked.',
      tipForNext: 'Time to combine everything and dig your first trench!',
    },
  },

  {
    id: 11,
    name: 'Dig Position',
    subtitle: 'Setting Up for Excavation',
    difficulty: 'intermediate',
    description: 'Practice positioning the work equipment correctly for digging.',
    controls: ['boom', 'arm', 'bucket'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 5 — Basic Operation · Section 5.1 · Pages 5-1 to 5-3',
      title: 'Preparing to Dig',
      body: 'Before breaking ground, always set the work equipment to the optimum digging position. This maximises efficiency and reduces stress on hydraulic components. The bucket teeth should penetrate at approximately 45° to the ground surface.',
      keyPoints: [
        'Lower the boom until the arm hangs roughly vertical',
        'Extend the arm to approximately 60% (not fully extended)',
        'Curl the bucket so teeth point downward at ~45°',
        'The centre of the bucket arc should be directly over the cut line',
        'Never dig with the arm fully extended — this greatly reduces breakout force',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L'],
    },
    objective: { primary: 'Set the equipment to the highlighted target position within 10°', secondary: null },
    task: { type: 'poseMatch', target: { boom: 0.4, arm: 0.5, bucket: 0.5 }, tolerance: 0.12 },
    setup: { terrainType: 'flat', props: ['poseSilhouette'] },
    completion: {
      successMessage: 'Perfect dig position! This posture is called the "power dig" setup.',
      tipForNext: 'Now make your first real cut.',
    },
  },

  {
    id: 12,
    name: 'First Cut',
    subtitle: 'Basic Digging Motion',
    difficulty: 'intermediate',
    description: 'Execute the fundamental dig-and-lift cycle.',
    controls: ['boom', 'arm', 'bucket', 'swing'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 5 — Basic Operation · Section 5.2 · Pages 5-4 to 5-7',
      title: 'The Basic Dig Cycle',
      body: 'Digging consists of four phases repeated in sequence: Position → Cut → Load → Swing & Dump. The SAE control pattern means you use both joysticks simultaneously — left joystick controls arm + swing, right joystick controls boom + bucket.',
      keyPoints: [
        'PHASE 1 – Position: lower boom, extend arm, curl bucket into soil',
        'PHASE 2 – Cut: crowd arm in while curling bucket — material loads into bucket',
        'PHASE 3 – Lift: raise boom to clear spoil pile, keep bucket curled',
        'PHASE 4 – Swing & Dump: swing to dump point, dump bucket, swing back',
        'Smooth simultaneous movements are more efficient than sequential inputs',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L', '←', '→'],
    },
    objective: { primary: 'Fill the bucket with earth and dump it in the spoil pile (yellow zone)', secondary: 'Complete 3 dig cycles' },
    task: { type: 'digCycles', cycles: 3, dumpZone: { x: 6, z: 0, r: 2.5 } },
    setup: { terrainType: 'flat', props: ['dumpZone'] },
    completion: {
      successMessage: '3 dig cycles complete! You\'re excavating like a pro.',
      tipForNext: 'Deeper and more precise digging coming up — trench work.',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // ADVANCED TIER — Real-world tasks
  // ─────────────────────────────────────────────────────────────

  {
    id: 13,
    name: 'Trench Work',
    subtitle: 'Excavating a Linear Trench',
    difficulty: 'advanced',
    description: 'Excavate a 12 m trench to 1.5 m depth.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 5 — Basic Operation · Section 5.3 · Pages 5-8 to 5-11',
      title: 'Trench Excavation',
      body: 'Trench work requires repositioning the machine as the trench advances. Always dig from one end and work backwards, keeping the spoil pile to one side. The machine should be positioned so the cab is over the trench centreline.',
      keyPoints: [
        'Dig a "slot" at the end of the proposed trench first (pioneer cut)',
        'Work backwards, pulling spoil out with the arm-in motion',
        'Reposition the machine every 2–3 m as you advance along the trench',
        'Keep sloped sides (bench) at ~70° for safety in soft ground',
        'Never approach within 600 mm of an unsupported trench edge',
      ],
      controlsHighlight: ['W', 'S', 'I', 'K', '↑', '↓', 'J', 'L', '←', '→'],
    },
    objective: { primary: 'Excavate the marked 12 m trench to 1.5 m depth', secondary: 'Stack spoil neatly in the yellow zone' },
    task: { type: 'trench', length: 12, depth: 1.5, width: 1.2 },
    setup: { terrainType: 'flat', props: ['trenchOutline', 'dumpZone'] },
    completion: {
      successMessage: 'Trench complete! This is one of the most common excavator tasks.',
      tipForNext: 'Depth control is crucial — next level you\'ll hit a precise target depth.',
    },
  },

  {
    id: 14,
    name: 'Depth Control',
    subtitle: 'Precision Digging to Grade',
    difficulty: 'advanced',
    description: 'Dig a series of test pits to an exact depth of 2.0 m.',
    controls: ['boom', 'arm', 'bucket', 'swing'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 5 — Basic Operation · Section 5.4 · Pages 5-12 to 5-14',
      title: 'Digging to Grade',
      body: 'Precision depth control requires watching the dig-depth readout on the machine monitor. The SY265C9C6K\'s Intelligent Machine Control (IMC) system can alert the operator when the bucket tip approaches a pre-set grade line. In manual mode, the operator judges depth from boom and arm angles.',
      keyPoints: [
        'Watch the DEPTH display in the on-screen HUD — aim for exactly –2.00 m',
        'The last 200 mm should be excavated slowly with shallow cuts',
        'Over-digging is as costly as under-digging — you may need to backfill',
        'Use the arm-out (extend) stroke to "scrape" the floor flat',
        'Grade stakes or laser level are used on real sites — this sim uses the HUD',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L'],
    },
    objective: { primary: 'Excavate 4 test pits to exactly 2.0 m depth (±0.1 m)', secondary: null },
    task: { type: 'depthControl', pits: 4, targetDepth: 2.0, tolerance: 0.1 },
    setup: { terrainType: 'flat', props: ['pitMarkers'] },
    completion: {
      successMessage: 'Grade achieved! Precision digging is a skill that separates good operators from great ones.',
      tipForNext: 'Load a truck — swing timing and dump accuracy matter.',
    },
  },

  {
    id: 15,
    name: 'Load the Truck',
    subtitle: 'Swing & Dump into a Haul Vehicle',
    difficulty: 'advanced',
    description: 'Excavate and load a dump truck parked beside the machine.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 5 — Basic Operation · Section 5.5 · Pages 5-15 to 5-18',
      title: 'Loading Operations',
      body: 'Loading a dump truck requires coordinating digging with precise swing angle and bucket dump timing. The SY265C9C6K has a 90°–120° optimum swing arc for loading — wider swings reduce cycle time efficiency.',
      keyPoints: [
        'Position the machine so the truck is within 90° of the dig area',
        'Raise the boom HIGH before swinging over the truck body',
        'Open the bucket only when directly over the truck — never while swinging',
        'Fill the truck evenly — dump front-to-back to avoid tipping the truck',
        'Never swing or load while the truck driver is out of the cab',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L', '←', '→'],
    },
    objective: { primary: 'Excavate 5 full buckets and load them into the truck', secondary: 'Avoid spilling material outside the truck' },
    task: { type: 'loadTruck', loads: 5, spillTolerance: 0.2 },
    setup: { terrainType: 'flat', props: ['truck', 'dumpZone'] },
    completion: {
      successMessage: 'Truck loaded! Production rate and cycle time are key on real projects.',
      tipForNext: 'Working near obstacles — the hardest real-world skill.',
    },
  },

  {
    id: 16,
    name: 'Precision Near Obstacles',
    subtitle: 'Digging Close to Utilities & Structures',
    difficulty: 'advanced',
    description: 'Excavate within 300 mm of marked pipes without hitting them.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 6 — Special Operations · Section 6.2 · Pages 6-4 to 6-7',
      title: 'Working Near Buried Services',
      body: 'On most job sites, there are existing buried utilities — gas pipes, water mains, cables — that must not be damaged. The operator must use slow, deliberate movements and may need to hand-dig the last 300 mm to expose services safely.',
      keyPoints: [
        'Slow down hydraulic speed using the monitor throttle before approaching obstacles',
        'Use short, shallow cuts when within 500 mm of a marked service',
        'Never pull material toward the machine if there is a pipe in the path',
        'Stop immediately if you hear or feel unexpected resistance',
        'Red markers = gas/high-voltage, Blue = water, Yellow = telecoms',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L'],
    },
    objective: { primary: 'Excavate the marked zone without striking any of the 4 utility pipes', secondary: null },
    task: { type: 'avoidObstacles', pipes: 4, excavateZone: true },
    setup: { terrainType: 'flat', props: ['pipes', 'excavateZone'] },
    completion: {
      successMessage: 'No pipes hit! This is one of the most safety-critical skills in excavator operation.',
      tipForNext: 'Slope work requires balancing the machine — next challenge.',
    },
  },

  {
    id: 17,
    name: 'Slope Work',
    subtitle: 'Cutting a Formation Slope',
    difficulty: 'advanced',
    description: 'Cut a uniform 1:1 formation slope on a hillside.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 6 — Special Operations · Section 6.3 · Pages 6-8 to 6-10',
      title: 'Slope Excavation',
      body: 'Forming accurate slopes requires the operator to move the boom and arm simultaneously to maintain a constant bucket tip height relative to the slope angle. This "slope trimming" technique uses the natural arc of the bucket tip path.',
      keyPoints: [
        'Park the machine parallel to the slope crest for the best reach',
        'As arm extends, lower the boom proportionally to follow the slope angle',
        'Use the bucket back (not teeth) for trimming/grading passes',
        'Work from top to bottom — never undercut a slope from below',
        'Slope indicator on the HUD shows current machine tilt angle',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L', 'W', 'S'],
    },
    objective: { primary: 'Cut the hill face to a 1:1 slope (45°) within ±5°', secondary: null },
    task: { type: 'slopeCut', angle: Math.PI / 4, tolerance: 0.087 },
    setup: { terrainType: 'sloped', props: ['slopeGuide'] },
    completion: {
      successMessage: 'Slope cut! This technique is used for embankments, drainage channels, and more.',
      tipForNext: 'The hardest challenge is coming — the Square Hole.',
    },
  },

  // ─────────────────────────────────────────────────────────────
  // EXPERT TIER — Square Hole Master Challenge
  // ─────────────────────────────────────────────────────────────

  {
    id: 18,
    name: 'Square Corners',
    subtitle: 'Understanding the Square Hole Challenge',
    difficulty: 'expert',
    description: 'Learn why excavators naturally create rounded holes and how to fight it.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 6 — Special Operations · Section 6.5 · Pages 6-15 to 6-18',
      title: 'Why Excavators Make Round Holes',
      body: 'Because the bucket tip moves in a circular arc (radius = boom + arm length), it is physically impossible to cut a perfectly square corner in a single pass. Skilled operators use a combination of repositioning, angled approaches, and controlled bucket dump strokes to square up corners. This is a benchmark skill for experienced operators.',
      keyPoints: [
        'The bucket arc naturally creates curves — you must manually fight this tendency',
        'Work each corner from two perpendicular positions',
        'Use the bucket face (flat back) in dump position to push soil into square corners',
        'Re-approach each corner from a different angle to remove rounded material',
        'Aim to keep the hole walls vertical — avoid tapered sides',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L', '←', '→', 'W', 'S', 'A', 'D'],
    },
    objective: { primary: 'Excavate a 2×2 m practice square to 1.0 m depth. Corners must be within 150 mm of square.', secondary: null },
    task: { type: 'squareHole', size: 2, depth: 1.0, cornerTolerance: 0.15 },
    setup: { terrainType: 'flat', props: ['squareOutline', 'depthIndicators', 'minimap'] },
    completion: {
      successMessage: 'Square corners achieved! That\'s expert-level precision.',
      tipForNext: 'Now the full challenge — a 4×4 m square at 2 m depth.',
    },
  },

  {
    id: 19,
    name: 'Foundation Prep',
    subtitle: 'All-Controls Combined Task',
    difficulty: 'expert',
    description: 'Prepare a building pad: level the high spots and fill the low spots to within ±50 mm of a target grade.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 6 — Special Operations · Section 6.4 · Pages 6-11 to 6-14',
      title: 'Site Preparation & Grading',
      body: 'Grading a building pad requires moving material from high to low areas while monitoring a target level. This is one of the most demanding excavator tasks, requiring excellent depth perception and control of all work equipment simultaneously.',
      keyPoints: [
        'Start with a rough grade pass, removing major high spots',
        'Then make fine trimming passes with the bucket face turned flat',
        'The HUD colour map shows RED = too high, BLUE = too low, GREEN = on grade',
        'Avoid overworking one area — keep the blade moving forward',
        'A professional operator completes a grading pass in one direction only',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L', '←', '→', 'W', 'S', 'A', 'D'],
    },
    objective: { primary: 'Grade the 10×10 m building pad to ±50 mm of target level', secondary: 'Achieve 90% coverage at grade' },
    task: { type: 'grade', size: 10, tolerance: 0.05, coverageTarget: 0.90 },
    setup: { terrainType: 'rough', props: ['gradeMap', 'minimap'] },
    completion: {
      successMessage: 'Pad prepared! A civil contractor would be proud of that finish.',
      tipForNext: 'Final challenge: The Square Hole Master. 4m × 4m × 2m deep. All skills required.',
    },
  },

  {
    id: 20,
    name: 'Square Hole Master',
    subtitle: 'The Ultimate Challenge — 4×4×2 m Precision Excavation',
    difficulty: 'expert',
    description: 'Excavate a perfect 4×4 m square hole to exactly 2 m depth. All corners must be square to within 100 mm. This is the hardest task in the simulator.',
    controls: ['boom', 'arm', 'bucket', 'swing', 'travel'],
    tutorial: {
      show: true,
      manualRef: 'Chapter 6 — Special Operations · Section 6.5 · Pages 6-15 to 6-20',
      title: 'The Square Hole Master Challenge',
      body: 'This is the gold-standard test for excavator operators. Unlike the rounded pits that are natural to an excavator\'s arc movement, a perfect square hole demands repositioning at every corner, precise depth control on all four sides, and a perfectly flat floor. Sany SY265C9C6K operators with IMC (Intelligent Machine Control) can set grade offsets — in this sim you will do it manually.',
      keyPoints: [
        'STEP 1: Strip the topsoil across the entire 4×4 m area first',
        'STEP 2: Excavate each side working from the outside edge inward',
        'STEP 3: Work each corner from TWO perpendicular approach angles',
        'STEP 4: Clean the floor with the back of the bucket (bucket-flat pass)',
        'STEP 5: Check depth on all 9 grid points using the HUD depth indicator',
        'STEP 6: Final walls must be vertical (90° to floor) — use the wall-angle indicator',
        'The minimap shows red cells where depth or corner accuracy is insufficient',
      ],
      controlsHighlight: ['I', 'K', '↑', '↓', 'J', 'L', '←', '→', 'W', 'S', 'A', 'D', 'Q', 'E'],
    },
    objective: { primary: 'Excavate a 4×4 m square hole to 2.0 m depth (±0.1 m)', secondary: 'All four corners must be within 100 mm of a true right angle. Floor must be level to ±50 mm.' },
    task: { type: 'squareHole', size: 4, depth: 2.0, cornerTolerance: 0.10, floorTolerance: 0.05 },
    setup: { terrainType: 'flat', props: ['squareOutline', 'depthGrid', 'minimap', 'cornerIndicators'] },
    completion: {
      successMessage: '🏆 Perfect square hole! You have achieved expert-level excavator operation. The Sany SY265C9C6K is a machine that rewards skill and precision.',
      tipForNext: null,
    },
  },

];

export const DIFFICULTY_ORDER = ['beginner', 'intermediate', 'advanced', 'expert'];

export function getLevelById(id) {
  return LEVELS.find(l => l.id === id) || null;
}

export function getUnlockedLevels(completedIds) {
  return LEVELS.map(l => ({
    ...l,
    unlocked: true,
    locked: false,
    completed: completedIds.has(l.id),
  }));
}
