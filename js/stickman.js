// js/stickman.js - Procedural articulated Stickman renderer & Skins system

const SKINS = {
  classic: {
    id: 'classic',
    name: 'Classic Guy',
    color: '#ffffff',
    headColor: '#ffffff',
    bodyColor: '#ffffff',
    accentColor: '#00e5ff',
    eyeColor: '#121420',
    type: 'classic',
    hasCape: false,
    hasRibbon: false
  },
  ninja: {
    id: 'ninja',
    name: 'Red Ninja',
    color: '#ff3366',
    headColor: '#ff2255',
    bodyColor: '#d61845',
    accentColor: '#ffffff',
    eyeColor: '#ffffff',
    type: 'ninja',
    hasCape: false,
    hasRibbon: true
  },
  cyber: {
    id: 'cyber',
    name: 'Cyber Neon',
    color: '#00e5ff',
    headColor: '#00e5ff',
    bodyColor: '#00c4db',
    accentColor: '#ff007f',
    eyeColor: '#ffffff',
    type: 'cyber',
    hasCape: false,
    hasRibbon: false
  },
  superhero: {
    id: 'superhero',
    name: 'Super Stick',
    color: '#2979ff',
    headColor: '#ffffff',
    bodyColor: '#1565c0',
    accentColor: '#ffd700',
    eyeColor: '#121420',
    type: 'superhero',
    hasCape: true,
    hasRibbon: false
  },
  golden: {
    id: 'golden',
    name: 'Golden Legend',
    color: '#ffb700',
    headColor: '#ffd700',
    bodyColor: '#ff9900',
    accentColor: '#ffffff',
    eyeColor: '#6d4c00',
    type: 'golden',
    hasCape: true,
    hasRibbon: false
  },
  slime: {
    id: 'slime',
    name: 'Bouncy Slime',
    color: '#39ff14',
    headColor: '#39ff14',
    bodyColor: '#2fd10e',
    accentColor: '#ffffff',
    eyeColor: '#0b3803',
    type: 'slime',
    hasCape: false,
    hasRibbon: false
  }
};

class StickmanRenderer {
  constructor() {
    this.currentSkin = localStorage.getItem('stickman_skin') || 'classic';
    if (!SKINS[this.currentSkin]) this.currentSkin = 'classic';

    // Trailing cape / ribbon points (cloth simulation)
    this.clothPoints = [];
    for (let i = 0; i < 6; i++) {
      this.clothPoints.push({ x: 0, y: 0 });
    }
  }

  resetCloth(x, y) {
    for (let i = 0; i < this.clothPoints.length; i++) {
      this.clothPoints[i].x = x - i * 3;
      this.clothPoints[i].y = y + i * 5;
    }
  }

  setSkin(skinId) {
    if (SKINS[skinId]) {
      this.currentSkin = skinId;
      localStorage.setItem('stickman_skin', skinId);
    }
  }

  getSkin() {
    return SKINS[this.currentSkin];
  }

  updateCloth(originX, originY, vx, vy, dt, isWaiting = false) {
    if (this.clothPoints.length === 0) return;
    this.clothPoints[0].x = originX;
    this.clothPoints[0].y = originY;

    for (let i = 1; i < this.clothPoints.length; i++) {
      const prev = this.clothPoints[i - 1];
      const cur = this.clothPoints[i];

      if (isWaiting) {
        // Gentle idle drape & breeze
        cur.x += (-6 + Math.sin(performance.now() * 0.003 + i * 0.8) * 2.5) * dt * 60;
        cur.y += 120 * dt * 60;
      } else {
        // Wind drag opposite to velocity
        cur.x += (-vx * 0.05 + (Math.random() - 0.5) * 5) * dt * 60;
        cur.y += (150 - vy * 0.05) * dt * 60; // gravity & drag
      }

      // Constraint link distance
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      const dist = Math.hypot(dx, dy) || 1;
      const targetDist = 9;

      const diff = (dist - targetDist) / dist;
      cur.x -= dx * diff * 0.75;
      cur.y -= dy * diff * 0.75;
    }
  }

  draw(ctx, player, particles = null) {
    const skin = this.getSkin();
    const { x, y, vx, vy, isHooked, hookTarget, rotation, squashX = 1, squashY = 1, isWaiting, idleTime = 0 } = player;

    const speed = Math.hypot(vx, vy);

    // Update cloth physics
    this.updateCloth(x, y - 4, vx, vy, 1 / 60, isWaiting);

    // Speed trails if fast
    if (particles && speed > 700 && Math.random() < 0.45) {
      particles.emitPlayerTrail(x, y, skin.accentColor);
    }
    if (skin.type === 'golden' && particles && Math.random() < 0.25) {
      particles.emitPlayerTrail(x, y, '#ffd700');
    }

    ctx.save();
    ctx.translate(x, y);

    // Squash & Stretch
    ctx.scale(squashX, squashY);

    if (isWaiting) {
      // Perched ready on start line
      this.drawStandingPose(ctx, skin, idleTime);
    } else {
      // Free flight somersault / tucking into a cannonball roll (Madbox Stickman Hook iconic mechanic!)
      const isRolling = !isHooked && (speed > 550 || Math.abs(player.angularVel) > 4.5);

      if (isRolling) {
        ctx.rotate(rotation);
        this.drawBallRoll(ctx, skin, speed);
      } else if (isHooked && hookTarget) {
        // Swinger pose: aligned along the tangent or facing velocity
        const hookAngle = Math.atan2(y - hookTarget.y, x - hookTarget.x);
        const swingAngle = hookAngle + Math.PI / 2;
        ctx.rotate(swingAngle);
        this.drawHookedPose(ctx, skin, hookTarget, x, y);
      } else {
        // Free glide pose
        const velAngle = Math.atan2(vy, vx);
        ctx.rotate(velAngle * 0.4);
        this.drawFreeGlidePose(ctx, skin, speed);
      }
    }

    ctx.restore();

    // Draw cloth (cape or ribbon) in world coordinates behind/around player
    if (skin.hasCape) {
      this.drawCape(ctx, skin);
    } else if (skin.hasRibbon) {
      this.drawRibbon(ctx, skin);
    }
  }

  // Draw stickman standing ready on the start line
  drawStandingPose(ctx, skin, time = 0) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (skin.type === 'cyber') {
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 10;
    }

    const breathe = Math.sin(time * 3.5) * 1.2;

    // Torso
    ctx.strokeStyle = skin.bodyColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, -5 + breathe);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Head
    ctx.fillStyle = skin.headColor;
    ctx.beginPath();
    ctx.arc(0, -16 + breathe, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eye looking forward/up toward the first hook
    ctx.fillStyle = skin.eyeColor;
    ctx.beginPath();
    ctx.arc(4, -17 + breathe, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Arms in athletic ready stance reaching slightly forward
    ctx.strokeStyle = skin.bodyColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    // Front arm
    ctx.moveTo(0, -4 + breathe);
    ctx.lineTo(8, 4);
    ctx.lineTo(14, 10);
    // Back arm
    ctx.moveTo(0, -4 + breathe);
    ctx.lineTo(-6, 4);
    ctx.lineTo(-10, 12);
    ctx.stroke();

    // Hands
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(14, 10, 3.5, 0, Math.PI * 2);
    ctx.arc(-10, 12, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Legs standing firmly on the platform surface
    ctx.strokeStyle = skin.bodyColor;
    ctx.beginPath();
    // Front leg
    ctx.moveTo(0, 14);
    ctx.lineTo(6, 24);
    ctx.lineTo(7, 34);
    // Back leg
    ctx.moveTo(0, 14);
    ctx.lineTo(-5, 24);
    ctx.lineTo(-6, 34);
    ctx.stroke();

    // Shoes / Feet planted at platform top level (y = 34)
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(9, 34, 4, 0, Math.PI * 2);
    ctx.arc(-4, 34, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw stickman curled up into a somersaulting flying ball
  drawBallRoll(ctx, skin, speed) {
    const r = 16;

    // Glowing aura for cyber or golden
    if (skin.type === 'cyber') {
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 15;
    } else if (skin.type === 'golden') {
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12;
    }

    // Curled body
    ctx.fillStyle = skin.bodyColor;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Outer rim / tuck indicator
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.4, Math.PI * 1.8);
    ctx.stroke();

    // Inner curled knees/arms
    ctx.fillStyle = skin.headColor;
    ctx.beginPath();
    ctx.arc(5, -4, 7, 0, Math.PI * 2);
    ctx.fill();

    // Animated eye
    ctx.fillStyle = skin.eyeColor;
    ctx.beginPath();
    ctx.arc(7, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw stickman holding rope with arms raised & legs trailing
  drawHookedPose(ctx, skin, hookTarget, px, py) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (skin.type === 'cyber') {
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 12;
    }

    // Torso
    ctx.strokeStyle = skin.bodyColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Head
    ctx.fillStyle = skin.headColor;
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eye looking forward
    ctx.fillStyle = skin.eyeColor;
    ctx.beginPath();
    ctx.arc(4, -17, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Arms gripping upward toward rope
    ctx.strokeStyle = skin.bodyColor;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    // Arm 1
    ctx.moveTo(0, -4);
    ctx.lineTo(10, -18);
    ctx.lineTo(14, -28);
    // Arm 2
    ctx.moveTo(0, -4);
    ctx.lineTo(-6, -16);
    ctx.lineTo(10, -28);
    ctx.stroke();

    // Hands
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(14, -28, 3.5, 0, Math.PI * 2);
    ctx.arc(10, -28, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Dynamic legs trailing with momentum
    ctx.strokeStyle = skin.bodyColor;
    ctx.beginPath();
    // Front leg
    ctx.moveTo(0, 14);
    ctx.lineTo(12, 22);
    ctx.lineTo(18, 32);
    // Back leg
    ctx.moveTo(0, 14);
    ctx.lineTo(-10, 24);
    ctx.lineTo(-12, 34);
    ctx.stroke();

    // Shoes / Feet
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(18, 32, 4, 0, Math.PI * 2);
    ctx.arc(-12, 34, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw stickman flying freely through the air
  drawFreeGlidePose(ctx, skin, speed) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (skin.type === 'cyber') {
      ctx.shadowColor = skin.accentColor;
      ctx.shadowBlur = 10;
    }

    // Torso
    ctx.strokeStyle = skin.bodyColor;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 14);
    ctx.stroke();

    // Head
    ctx.fillStyle = skin.headColor;
    ctx.beginPath();
    ctx.arc(0, -16, 9, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = skin.eyeColor;
    ctx.beginPath();
    ctx.arc(3.5, -17, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Flailing / diving arms
    ctx.strokeStyle = skin.bodyColor;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(14, 2);
    ctx.lineTo(24, -2);

    ctx.moveTo(0, -4);
    ctx.lineTo(-12, 4);
    ctx.lineTo(-18, 12);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(0, 14);
    ctx.lineTo(10, 24);
    ctx.lineTo(16, 32);

    ctx.moveTo(0, 14);
    ctx.lineTo(-6, 26);
    ctx.lineTo(-14, 34);
    ctx.stroke();

    // Feet
    ctx.fillStyle = skin.accentColor;
    ctx.beginPath();
    ctx.arc(16, 32, 3.5, 0, Math.PI * 2);
    ctx.arc(-14, 34, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Cape with cloth simulation
  drawCape(ctx, skin) {
    if (this.clothPoints.length < 3) return;
    ctx.save();
    ctx.fillStyle = skin.type === 'golden' ? '#ff9900' : '#e60039';
    ctx.beginPath();
    ctx.moveTo(this.clothPoints[0].x - 4, this.clothPoints[0].y);

    for (let i = 1; i < this.clothPoints.length; i++) {
      const p = this.clothPoints[i];
      const width = 4 + i * 2.2;
      ctx.lineTo(p.x - width, p.y);
    }
    for (let i = this.clothPoints.length - 1; i >= 1; i--) {
      const p = this.clothPoints[i];
      const width = 4 + i * 2.2;
      ctx.lineTo(p.x + width, p.y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Draw Ninja Headband Ribbon
  drawRibbon(ctx, skin) {
    if (this.clothPoints.length < 3) return;
    ctx.save();
    ctx.strokeStyle = '#ff2255';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(this.clothPoints[0].x, this.clothPoints[0].y - 8);
    for (let i = 1; i < this.clothPoints.length; i++) {
      const p = this.clothPoints[i];
      ctx.lineTo(p.x, p.y - 8);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Render skin icon inside skin selection cards
  renderPreview(canvas, skinKey) {
    const skin = SKINS[skinKey];
    if (!skin) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const dummyPlayer = {
      x: w / 2,
      y: h / 2,
      vx: 300,
      vy: -100,
      isHooked: false,
      rotation: 0,
      squashX: 1,
      squashY: 1
    };

    const prevSkin = this.currentSkin;
    this.currentSkin = skinKey;
    this.draw(ctx, dummyPlayer, null);
    this.currentSkin = prevSkin;
  }
}
