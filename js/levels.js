// js/levels.js - 10 Handcrafted levels + Endless Mode Procedural Generator

const CAMPAIGN_LEVELS = [
  // Level 1: Introduction to Hooking
  {
    id: 1,
    name: 'First Leap',
    startX: 120,
    startY: 380,
    finishX: 2000,
    pitY: 960,
    parTime3Stars: 4.8,
    parTime2Stars: 7.5,
    anchors: [
      { id: '1-1', x: 400, y: 200, radius: 14 },
      { id: '1-2', x: 860, y: 190, radius: 14 },
      { id: '1-3', x: 1320, y: 190, radius: 14 },
      { id: '1-4', x: 1720, y: 200, radius: 14 }
    ],
    bouncePads: [
      { x: 620, y: 560, width: 160, height: 24, bounceForce: 1100, forwardBoost: 160 },
      { x: 1080, y: 560, width: 160, height: 24, bounceForce: 1100, forwardBoost: 160 },
      { x: 1520, y: 560, width: 160, height: 24, bounceForce: 1100, forwardBoost: 160 }
    ],
    boostRings: [],
    hazards: []
  },

  // Level 2: Trampoline Fun
  {
    id: 2,
    name: 'Bounce City',
    startX: 120,
    startY: 380,
    finishX: 2400,
    pitY: 960,
    parTime3Stars: 5.2,
    parTime2Stars: 8.0,
    anchors: [
      { id: '2-1', x: 450, y: 210, radius: 14 },
      { id: '2-2', x: 1100, y: 180, radius: 14 },
      { id: '2-3', x: 1750, y: 190, radius: 14 },
      { id: '2-4', x: 2150, y: 200, radius: 14 }
    ],
    bouncePads: [
      { x: 720, y: 570, width: 160, height: 24, bounceForce: 1200, forwardBoost: 180 },
      { x: 1380, y: 570, width: 160, height: 24, bounceForce: 1200, forwardBoost: 180 }
    ],
    boostRings: [],
    hazards: []
  },

  // Level 3: Triple Altitude Swing
  {
    id: 3,
    name: 'High Altitude',
    startX: 120,
    startY: 380,
    finishX: 2750,
    pitY: 960,
    parTime3Stars: 5.8,
    parTime2Stars: 9.0,
    anchors: [
      { id: '3-1', x: 420, y: 190, radius: 14 },
      { id: '3-2', x: 920, y: 160, radius: 14 },
      { id: '3-3', x: 1460, y: 180, radius: 14 },
      { id: '3-4', x: 2020, y: 170, radius: 14 },
      { id: '3-5', x: 2450, y: 200, radius: 14 }
    ],
    bouncePads: [
      { x: 670, y: 570, width: 150, height: 24, bounceForce: 1100, forwardBoost: 150 },
      { x: 1200, y: 570, width: 150, height: 24, bounceForce: 1150, forwardBoost: 160 },
      { x: 1740, y: 570, width: 150, height: 24, bounceForce: 1150, forwardBoost: 160 }
    ],
    boostRings: [],
    hazards: []
  },

  // Level 4: Introduction to Hazards
  {
    id: 4,
    name: 'Hazard Valley',
    startX: 120,
    startY: 380,
    finishX: 2800,
    pitY: 960,
    parTime3Stars: 6.2,
    parTime2Stars: 9.5,
    anchors: [
      { id: '4-1', x: 450, y: 210, radius: 14 },
      { id: '4-2', x: 1020, y: 180, radius: 14 },
      { id: '4-3', x: 1620, y: 180, radius: 14 },
      { id: '4-4', x: 2250, y: 200, radius: 14 },
      { id: '4-5', x: 2600, y: 210, radius: 14 }
    ],
    bouncePads: [
      { x: 720, y: 570, width: 150, height: 24, bounceForce: 1150, forwardBoost: 160 },
      { x: 1920, y: 570, width: 150, height: 24, bounceForce: 1150, forwardBoost: 160 }
    ],
    boostRings: [],
    hazards: [
      // Floor spikes under gap
      { type: 'spikes', x: 1250, y: 640, width: 380, height: 35 },
      // Floating sawblade to swing cleanly over/under
      { type: 'sawblade', x: 1320, y: 280, radius: 36, spinSpeed: 5 }
    ]
  },

  // Level 5: Moving Pins Timing
  {
    id: 5,
    name: 'Moving Pins',
    startX: 120,
    startY: 380,
    finishX: 3000,
    pitY: 960,
    parTime3Stars: 6.8,
    parTime2Stars: 10.0,
    anchors: [
      { id: '5-1', x: 450, y: 220, radius: 14 },
      {
        id: '5-2',
        x: 960,
        y: 200,
        initialX: 960,
        initialY: 200,
        radius: 14,
        moving: { type: 'vertical', range: 80, speed: 2.2 }
      },
      {
        id: '5-3',
        x: 1550,
        y: 190,
        initialX: 1550,
        initialY: 190,
        radius: 14,
        moving: { type: 'vertical', range: 90, speed: 2.6 }
      },
      { id: '5-4', x: 2150, y: 200, radius: 14 },
      { id: '5-5', x: 2650, y: 210, radius: 14 }
    ],
    bouncePads: [
      { x: 680, y: 570, width: 150, height: 24, bounceForce: 1100, forwardBoost: 150 },
      { x: 1260, y: 570, width: 150, height: 24, bounceForce: 1150, forwardBoost: 160 },
      { x: 1850, y: 570, width: 150, height: 24, bounceForce: 1150, forwardBoost: 160 }
    ],
    boostRings: [],
    hazards: [
      { type: 'spikes', x: 1450, y: 650, width: 320, height: 35 }
    ]
  },

  // Level 6: Hyper Speed Boost
  {
    id: 6,
    name: 'Hyper Warp',
    startX: 120,
    startY: 380,
    finishX: 3300,
    pitY: 960,
    parTime3Stars: 5.5,
    parTime2Stars: 8.5,
    anchors: [
      { id: '6-1', x: 440, y: 210, radius: 14 },
      { id: '6-2', x: 1150, y: 170, radius: 14 },
      { id: '6-3', x: 1950, y: 180, radius: 14 },
      { id: '6-4', x: 2700, y: 200, radius: 14 }
    ],
    bouncePads: [
      { x: 740, y: 570, width: 150, height: 24, bounceForce: 1200, forwardBoost: 180 },
      { x: 1550, y: 570, width: 150, height: 24, bounceForce: 1200, forwardBoost: 180 },
      { x: 2320, y: 570, width: 150, height: 24, bounceForce: 1200, forwardBoost: 180 }
    ],
    boostRings: [
      { x: 1500, y: 260, radius: 36, boostVx: 680 },
      { x: 2300, y: 250, radius: 36, boostVx: 720 }
    ],
    hazards: [
      { type: 'sawblade', x: 1750, y: 360, radius: 38, spinSpeed: 5 }
    ]
  },

  // Level 7: The Floor is Lava!
  {
    id: 7,
    name: 'Lava Canyon',
    startX: 120,
    startY: 380,
    finishX: 3450,
    pitY: 960,
    parTime3Stars: 7.0,
    parTime2Stars: 10.5,
    anchors: [
      { id: '7-1', x: 450, y: 210, radius: 14 },
      { id: '7-2', x: 1020, y: 180, radius: 14 },
      { id: '7-3', x: 1650, y: 190, radius: 14 },
      { id: '7-4', x: 2300, y: 180, radius: 14 },
      { id: '7-5', x: 2950, y: 200, radius: 14 }
    ],
    bouncePads: [
      { x: 720, y: 570, width: 130, height: 24, bounceForce: 1150, forwardBoost: 160 },
      { x: 1340, y: 570, width: 130, height: 24, bounceForce: 1150, forwardBoost: 160 },
      { x: 1980, y: 570, width: 130, height: 24, bounceForce: 1150, forwardBoost: 160 },
      { x: 2620, y: 570, width: 140, height: 24, bounceForce: 1180, forwardBoost: 170 }
    ],
    boostRings: [],
    hazards: [
      { type: 'spikes', x: 400, y: 660, width: 2800, height: 40 },
      { type: 'sawblade', x: 1500, y: 310, radius: 38, spinSpeed: 5 }
    ]
  },

  // Level 8: Sawblade Circus
  {
    id: 8,
    name: 'Sawblade Circus',
    startX: 120,
    startY: 380,
    finishX: 3600,
    pitY: 960,
    parTime3Stars: 7.2,
    parTime2Stars: 11.0,
    anchors: [
      { id: '8-1', x: 460, y: 210, radius: 14 },
      {
        id: '8-2',
        x: 1040,
        y: 190,
        initialX: 1040,
        initialY: 190,
        radius: 14,
        moving: { type: 'vertical', range: 80, speed: 2.4 }
      },
      { id: '8-3', x: 1680, y: 180, radius: 14 },
      {
        id: '8-4',
        x: 2360,
        y: 200,
        initialX: 2360,
        initialY: 200,
        radius: 14,
        moving: { type: 'vertical', range: 80, speed: 2.8 }
      },
      { id: '8-5', x: 3050, y: 210, radius: 14 }
    ],
    bouncePads: [
      { x: 740, y: 570, width: 140, height: 24, bounceForce: 1180, forwardBoost: 160 },
      { x: 1360, y: 570, width: 140, height: 24, bounceForce: 1180, forwardBoost: 160 },
      { x: 2020, y: 570, width: 140, height: 24, bounceForce: 1200, forwardBoost: 170 },
      { x: 2700, y: 570, width: 140, height: 24, bounceForce: 1200, forwardBoost: 170 }
    ],
    boostRings: [
      { x: 1360, y: 260, radius: 36, boostVx: 600 }
    ],
    hazards: [
      { type: 'sawblade', x: 1220, y: 310, radius: 38, spinSpeed: 6 },
      { type: 'sawblade', x: 1880, y: 330, radius: 40, spinSpeed: -6 },
      { type: 'sawblade', x: 2680, y: 300, radius: 38, spinSpeed: 6 },
      { type: 'spikes', x: 1100, y: 650, width: 800, height: 35 }
    ]
  },

  // Level 9: Skyline Orbit
  {
    id: 9,
    name: 'Skyline Orbit',
    startX: 120,
    startY: 380,
    finishX: 4100,
    pitY: 960,
    parTime3Stars: 7.8,
    parTime2Stars: 11.5,
    anchors: [
      { id: '9-1', x: 480, y: 200, radius: 14 },
      { id: '9-2', x: 1120, y: 160, radius: 14 },
      { id: '9-3', x: 1820, y: 180, radius: 14 },
      {
        id: '9-4',
        x: 2550,
        y: 190,
        initialX: 2550,
        initialY: 190,
        radius: 14,
        moving: { type: 'vertical', range: 90, speed: 3.0 }
      },
      { id: '9-5', x: 3300, y: 200, radius: 14 },
      { id: '9-6', x: 3800, y: 210, radius: 14 }
    ],
    bouncePads: [
      { x: 780, y: 570, width: 150, height: 24, bounceForce: 1250, forwardBoost: 200 },
      { x: 1460, y: 570, width: 140, height: 24, bounceForce: 1250, forwardBoost: 220 },
      { x: 2180, y: 570, width: 140, height: 24, bounceForce: 1250, forwardBoost: 220 },
      { x: 2920, y: 570, width: 140, height: 24, bounceForce: 1300, forwardBoost: 240 }
    ],
    boostRings: [
      { x: 1680, y: 220, radius: 36, boostVx: 750 },
      { x: 3100, y: 230, radius: 36, boostVx: 800 }
    ],
    hazards: [
      { type: 'spikes', x: 600, y: 670, width: 2800, height: 40 },
      { type: 'sawblade', x: 2020, y: 290, radius: 42, spinSpeed: 6 }
    ]
  },

  // Level 10: The Master Gauntlet
  {
    id: 10,
    name: 'Master Gauntlet',
    startX: 120,
    startY: 380,
    finishX: 4600,
    pitY: 960,
    parTime3Stars: 9.2,
    parTime2Stars: 13.5,
    anchors: [
      { id: '10-1', x: 460, y: 210, radius: 14 },
      {
        id: '10-2',
        x: 1050,
        y: 190,
        initialX: 1050,
        initialY: 190,
        radius: 14,
        moving: { type: 'vertical', range: 80, speed: 2.6 }
      },
      { id: '10-3', x: 1700, y: 170, radius: 14 },
      {
        id: '10-4',
        x: 2380,
        y: 200,
        initialX: 2380,
        initialY: 200,
        radius: 14,
        moving: { type: 'vertical', range: 90, speed: 2.8 }
      },
      { id: '10-5', x: 3100, y: 180, radius: 14 },
      {
        id: '10-6',
        x: 3850,
        y: 190,
        initialX: 3850,
        initialY: 190,
        radius: 14,
        moving: { type: 'vertical', range: 90, speed: 3.0 }
      },
      { id: '10-7', x: 4300, y: 200, radius: 14 }
    ],
    bouncePads: [
      { x: 720, y: 570, width: 140, height: 24, bounceForce: 1200, forwardBoost: 160 },
      { x: 1380, y: 570, width: 140, height: 24, bounceForce: 1220, forwardBoost: 170 },
      { x: 2040, y: 570, width: 140, height: 24, bounceForce: 1250, forwardBoost: 180 },
      { x: 2740, y: 570, width: 140, height: 24, bounceForce: 1280, forwardBoost: 180 },
      { x: 3480, y: 570, width: 140, height: 24, bounceForce: 1300, forwardBoost: 200 }
    ],
    boostRings: [
      { x: 1540, y: 240, radius: 36, boostVx: 700 },
      { x: 2900, y: 230, radius: 36, boostVx: 750 }
    ],
    hazards: [
      { type: 'spikes', x: 500, y: 680, width: 3600, height: 40 },
      { type: 'sawblade', x: 1220, y: 310, radius: 38, spinSpeed: 6 },
      { type: 'sawblade', x: 1880, y: 330, radius: 40, spinSpeed: -6 },
      { type: 'sawblade', x: 2560, y: 300, radius: 40, spinSpeed: 6 },
      { type: 'sawblade', x: 3300, y: 320, radius: 42, spinSpeed: -6 }
    ]
  }
];

// Procedural generator for Endless Mode
class EndlessGenerator {
  constructor() {
    this.reset();
  }

  reset() {
    this.currentX = 400;
    this.chunkId = 0;
    this.level = {
      isEndless: true,
      name: 'Infinite Swing',
      startX: 120,
      startY: 380,
      finishX: Infinity,
      pitY: 960,
      anchors: [],
      bouncePads: [],
      boostRings: [],
      hazards: []
    };
    // Seed initial safe anchors
    this.level.anchors.push({ id: 'e-start-1', x: 450, y: 220, radius: 14 });
    this.level.anchors.push({ id: 'e-start-2', x: 920, y: 190, radius: 14 });
    this.level.bouncePads.push({
      x: 680,
      y: 570,
      width: 150,
      height: 24,
      bounceForce: 1150,
      forwardBoost: 160
    });
    this.currentX = 920;
    this.extend(2800);
  }

  extend(targetX) {
    while (this.currentX < targetX) {
      this.chunkId++;
      const difficulty = Math.min(1.0, this.currentX / 15000); // escalates over 15km
      const gap = 440 + Math.random() * 180;
      this.currentX += gap;

      const anchorY = 170 + Math.random() * 80;
      const isMoving = difficulty > 0.25 && Math.random() < 0.45;

      const anchor = {
        id: `e-anchor-${this.chunkId}`,
        x: this.currentX,
        y: anchorY,
        radius: 14
      };

      if (isMoving) {
        anchor.initialX = this.currentX;
        anchor.initialY = anchorY;
        anchor.moving = {
          type: 'vertical',
          range: 50 + Math.random() * 45,
          speed: 2.0 + Math.random() * 1.5
        };
      }
      this.level.anchors.push(anchor);

      // Bounce pad below
      if (Math.random() < 0.75) {
        const padX = this.currentX - gap * 0.45 + (Math.random() - 0.5) * 50;
        this.level.bouncePads.push({
          x: padX,
          y: 570 + Math.random() * 20,
          width: 130 + Math.random() * 30,
          height: 24,
          bounceForce: 1100 + Math.random() * 180,
          forwardBoost: 160 + Math.random() * 70
        });
      }

      // Boost ring
      if (Math.random() < 0.3) {
        this.level.boostRings.push({
          x: this.currentX + gap * 0.35,
          y: anchorY + 70 + Math.random() * 60,
          radius: 36,
          boostVx: 600 + Math.random() * 150
        });
      }

      // Hazards at higher difficulties
      if (difficulty > 0.15 && Math.random() < 0.45) {
        if (Math.random() < 0.5) {
          // Sawblade
          this.level.hazards.push({
            type: 'sawblade',
            x: this.currentX - gap * 0.5,
            y: anchorY + 110 + Math.random() * 70,
            radius: 36 + Math.random() * 8,
            spinSpeed: (Math.random() > 0.5 ? 1 : -1) * (5 + Math.random() * 2)
          });
        } else {
          // Bottom spikes
          this.level.hazards.push({
            type: 'spikes',
            x: this.currentX - gap * 0.8,
            y: 660,
            width: gap * 0.65,
            height: 35
          });
        }
      }
    }
  }

  // Clean up objects that are far behind player to keep memory lean
  cull(playerX) {
    const minX = playerX - 1400;
    this.level.anchors = this.level.anchors.filter(a => a.x > minX);
    this.level.bouncePads = this.level.bouncePads.filter(p => p.x + p.width > minX);
    this.level.boostRings = this.level.boostRings.filter(r => r.x + r.radius > minX);
    this.level.hazards = this.level.hazards.filter(h => (h.x + (h.width || h.radius * 2)) > minX);
  }
}
