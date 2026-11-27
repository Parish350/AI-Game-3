# 🤸 Stickman Hook - Physics Swing & Launch Game

A high-polish, addictive 2D physics-based swinging game inspired by the hit mobile title *Stickman Hook*. Swing through perilous courses, bounce off trampolines, dodge lethal sawblades and spikes, and launch yourself past the finish line!

---

## 🚀 How to Play

### Option 1: Direct File Open
Simply double-click `index.html` or drag it into any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).

### Option 2: Local Node Server
Run the included zero-dependency server:
```bash
node server.js
```
Then open your browser to **`http://localhost:3000`**.

---

## 🕹️ Controls

| Action | Mouse / Touch | Keyboard |
| :--- | :--- | :--- |
| **Hook & Swing** | **Press & Hold** Left Click / Touch | **Hold Spacebar** |
| **Release & Fly** | **Release** Left Click / Touch | **Release Spacebar** |
| **Pause / Resume** | Click **Pause (⏸)** button | Press **`P`** or **`Esc`** |
| **Quick Restart** | Click **Restart (↻)** button | Press **`R`** |
| **Sound Toggle** | Click **Sound (🔊/🔇)** button | — |
| **Select Level** | Click **Levels (☰)** button | — |
| **Change Skin** | Click **Skins (👤)** button | — |

---

## 🌟 Key Features

### 1. 🪢 Satisfying Pendulum & Spring Rope Physics
- **Perched on Start Line**: The stickman patiently stands on the checkered start platform in an athletic ready stance until you click/tap to hook and swing! The level timer only starts when you launch.
- **Intelligent Hooking**: Automatically detects the best forward anchor in range and highlights it with a pulsing neon targeting ring.
- **Dynamic Momentum Conservation**: Build speed on the downswing; release at the apex of an upward swing to receive an aerodynamic launch boost!
- **Cannonball Somersaults**: When flying freely at high speeds, the stickman curls into a spinning somersault ball with angular spin physics.

### 2. 🦘 Interactive World Objects
- **Trampoline Bounce Pads**: Squish and launch the stickman high into the air with star particle bursts and bouncy spring audio.
- **Speed Boost Rings**: Fly through rings to trigger hyper-speed forward propulsion and streak lines.
- **Deadly Hazards**: Rotating metallic sawblades and lethal spike pits that test your timing and precision.
- **Oscillating Anchors**: Moving pins that shift vertically or horizontally, requiring careful swing timing.

### 3. 🏁 10 Progressive Campaign Levels + Endless Mode
- **Level 1: First Leap** — Introduction to grappling hooks and momentum.
- **Level 2: Bounce City** — Introducing trampoline chains.
- **Level 3: High Altitude** — High swings across wide aerial gaps.
- **Level 4: Hazard Valley** — First encounter with floor spikes and spinning sawblades.
- **Level 5: Moving Pins** — Dynamic oscillating grapple hooks.
- **Level 6: Hyper Warp** — Speed rings chaining into giant swings.
- **Level 7: Lava Canyon** — Bottomless pit of spikes with narrow bounce pads.
- **Level 8: Sawblade Circus** — Multiple spinning sawblades with tight hook timings.
- **Level 9: Skyline Orbit** — High-velocity launch pads and orbital swings.
- **Level 10: Master Gauntlet** — The ultimate test combining all mechanics!
- **Infinite Swing (Endless Mode)**: Procedurally generated infinite obstacles, trampolines, and pins with distance tracking and high score saving!

### 4. 🎭 6 Distinct Stickman Skins
1. **Classic Guy**: The iconic stick figure with animated eyes and sneakers.
2. **Red Ninja**: Crimson suit with cloth headband ribbons trailing with physics.
3. **Cyber Neon**: Glowing cyan and purple wireframe with luminous outer auras.
4. **Super Stick**: Superhero outfit with a billowing red cape simulated with cloth physics.
5. **Golden Legend**: Gleaming trophy champion with gold glitter particles.
6. **Bouncy Slime**: Translucent green jelly stickman with bounce animations.

### 5. 🔊 Procedural Web Audio API Engine
- Zero external audio files to download.
- Realistic grapple latch clink, aerodynamic release whoosh, bouncy FM spring boings, crash shatter, celebratory victory fanfare, and a groovy synth background music loop with mute toggle.

### 6. 📱 Responsive & High Performance
- Fluid 60+ FPS canvas rendering.
- Retina / High-DPI display scaling.
- Smooth camera tracking with velocity-based lookahead and dynamic speed zoom.
- Progress bar displaying stickman position relative to the finish line.
- Persistent local storage for unlocked levels, high scores, best distance, and chosen skin.
