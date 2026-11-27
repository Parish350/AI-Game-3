// js/particles.js - Juicy particle effects engine

class Particle {
  constructor(x, y, vx, vy, color, size, life, shape = 'circle', spin = 0) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.shape = shape; // circle, spark, confetti, star, ring
    this.angle = Math.random() * Math.PI * 2;
    this.spin = spin || (Math.random() - 0.5) * 8;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.angle += this.spin * dt;
    this.life -= dt;

    if (this.shape === 'confetti') {
      this.vy += 450 * dt; // gravity
      this.vx *= Math.pow(0.96, dt * 60);
    } else if (this.shape === 'spark' || this.shape === 'circle') {
      this.vx *= Math.pow(0.92, dt * 60);
      this.vy *= Math.pow(0.92, dt * 60);
    } else if (this.shape === 'ring') {
      this.size += 90 * dt;
    }
  }

  draw(ctx) {
    const alpha = Math.max(0, this.life / this.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    if (this.shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, this.size * alpha), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.shape === 'confetti') {
      ctx.fillRect(-this.size, -this.size / 2, this.size * 2, this.size);
    } else if (this.shape === 'spark') {
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-this.size, 0);
      ctx.lineTo(this.size, 0);
      ctx.stroke();
    } else if (this.shape === 'star') {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * Math.PI * 2) / 5;
        const a2 = a1 + Math.PI / 5;
        const r1 = this.size;
        const r2 = this.size * 0.45;
        if (i === 0) ctx.moveTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        else ctx.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
        ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
      }
      ctx.closePath();
      ctx.fill();
    } else if (this.shape === 'ring') {
      ctx.lineWidth = 3 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update(dt);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      this.particles[i].draw(ctx);
    }
  }

  clear() {
    this.particles = [];
  }

  // Hook snap spark burst
  emitHookSparks(x, y) {
    const colors = ['#00e5ff', '#ffffff', '#ff9900'];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 220;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(
        new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 6, 0.35, 'spark')
      );
    }
    this.particles.push(new Particle(x, y, 0, 0, '#00e5ff', 12, 0.3, 'ring'));
  }

  // Trampoline bounce burst
  emitBounceBurst(x, y, width = 80) {
    const colors = ['#ff3366', '#ffb700', '#ffffff', '#ff80bf'];
    for (let i = 0; i < 22; i++) {
      const px = x + (Math.random() - 0.5) * width;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.3;
      const speed = 200 + Math.random() * 300;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(
        new Particle(px, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 6 + Math.random() * 4, 0.55, 'star')
      );
    }
    this.particles.push(new Particle(x, y, 0, 0, '#ff3366', 20, 0.4, 'ring'));
  }

  // Speed boost ring effect
  emitBoostRings(x, y) {
    const colors = ['#00e5ff', '#39ff14', '#ffffff'];
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const speed = 160 + Math.random() * 100;
      const color = colors[i % colors.length];
      this.particles.push(
        new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 5, 0.45, 'circle')
      );
    }
    this.particles.push(new Particle(x, y, 0, 0, '#00e5ff', 24, 0.5, 'ring'));
  }

  // Player motion trail
  emitPlayerTrail(x, y, color = '#ffffff') {
    this.particles.push(
      new Particle(
        x + (Math.random() - 0.5) * 6,
        y + (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        color,
        8,
        0.3,
        'circle'
      )
    );
  }

  // Crash / death shatter
  emitDeathShatter(x, y, skinColor = '#ffffff') {
    const colors = [skinColor, '#ff3366', '#ffb700', '#ffffff'];
    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 150 + Math.random() * 450;
      const color = colors[Math.floor(Math.random() * colors.length)];
      this.particles.push(
        new Particle(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, color, 4 + Math.random() * 6, 0.8, 'spark', (Math.random() - 0.5) * 15)
      );
    }
    this.particles.push(new Particle(x, y, 0, 0, '#ff3366', 15, 0.4, 'ring'));
  }

  // Victory Confetti Explosion
  emitVictoryConfetti(x, y, count = 150) {
    const confettiColors = ['#ff3366', '#00e5ff', '#ffb700', '#39ff14', '#b026ff', '#ffffff', '#ff9900'];
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const speed = 250 + Math.random() * 600;
      const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
      const size = 5 + Math.random() * 6;
      const life = 1.6 + Math.random() * 1.5;
      this.particles.push(
        new Particle(
          x + (Math.random() - 0.5) * 100,
          y + (Math.random() - 0.5) * 60,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          color,
          size,
          life,
          'confetti'
        )
      );
    }
  }
}
