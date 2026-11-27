// js/physics.js - Stickman Hook physics engine, rope pendulum constraints, collisions

class PhysicsEngine {
  constructor() {
    this.gravity = 1180; // px/s^2
    this.maxHookDistance = 580; // generous grappling reach
    this.airResistance = 0.9992;
  }

  // Find the most optimal forward anchor to grab
  findBestAnchor(player, anchors) {
    let best = null;
    let bestScore = -Infinity;

    for (const a of anchors) {
      const dx = a.x - player.x;
      const dy = a.y - player.y;
      const dist = Math.hypot(dx, dy);

      // Must be within max range and generally ahead or directly above
      if (dist <= this.maxHookDistance && dx > -80) {
        // Preference for anchors ahead and at a high swingable angle
        const forwardBonus = dx * 1.6;
        const heightBonus = -dy * 0.7; // higher anchors make better swings
        const distancePenalty = dist * 0.9;
        const score = forwardBonus + heightBonus - distancePenalty;

        if (score > bestScore) {
          bestScore = score;
          best = a;
        }
      }
    }
    return best;
  }

  // Attach rope to target anchor
  attachHook(player, anchor, audio, particles) {
    if (!anchor) return false;

    player.isHooked = true;
    player.hookTarget = anchor;
    const dist = Math.hypot(player.x - anchor.x, player.y - anchor.y);
    player.ropeLength = Math.max(70, dist);
    player.targetRopeLength = player.ropeLength;

    // Slight initial spring pull for satisfying snap
    const nx = (player.x - anchor.x) / dist;
    const ny = (player.y - anchor.y) / dist;
    player.vx -= nx * 80;
    player.vy -= ny * 80;

    if (audio) audio.playHook();
    if (particles) particles.emitHookSparks(anchor.x, anchor.y);

    return true;
  }

  // Release rope and launch stickman
  releaseHook(player, audio) {
    if (!player.isHooked) return;

    player.isHooked = false;
    const anchor = player.hookTarget;
    player.hookTarget = null;

    // Fling bonus: if releasing on an upward swing arc, award momentum boost!
    if (player.vy < -50 && player.vx > 100) {
      player.vx *= 1.14;
      player.vy *= 1.10;
    }

    // Set somersault spin based on release speed
    const speed = Math.hypot(player.vx, player.vy);
    player.angularVel = Math.sign(player.vx) * Math.min(20, Math.max(5, speed * 0.016));

    if (audio) audio.playRelease();
  }

  update(player, level, dt, audio, particles, onCrash, onWin, onBoost, onBounce) {
    // 1. Update dynamic anchors / moving obstacles in the level
    this.updateDynamicObjects(level, dt);

    // 2. Squash and stretch recovery
    player.squashX += (1 - player.squashX) * Math.min(1, dt * 14);
    player.squashY += (1 - player.squashY) * Math.min(1, dt * 14);

    // 3. Physics Simulation
    if (player.isHooked && player.hookTarget) {
      this.updateSwinging(player, dt);
    } else {
      this.updateFreeFlight(player, dt);
    }

    // 4. Somersault Rotation
    player.rotation += player.angularVel * dt;
    player.angularVel *= Math.pow(0.96, dt * 60);

    // 5. Collisions with Trampolines / Bounce Pads
    this.checkBouncePads(player, level.bouncePads, audio, particles, onBounce);

    // 6. Collisions with Boost Rings
    this.checkBoostRings(player, level.boostRings, audio, particles, onBoost);

    // 7. Collisions with Hazards (Spikes, Sawblades)
    if (this.checkHazards(player, level.hazards)) {
      if (onCrash) onCrash();
      return;
    }

    // 8. Bottomless Pit / Off-screen Check
    const pitThreshold = (level.pitY || 950);
    if (player.y > pitThreshold) {
      if (onCrash) onCrash();
      return;
    }

    // 9. Finish Line Victory Check
    if (player.x >= level.finishX) {
      if (onWin) onWin();
    }
  }

  // Swinging while connected to rope
  updateSwinging(player, dt) {
    const anchor = player.hookTarget;
    let dx = player.x - anchor.x;
    let dy = player.y - anchor.y;
    let dist = Math.hypot(dx, dy) || 1;

    // Unit normal from anchor to player
    let nx = dx / dist;
    let ny = dy / dist;

    // Unit tangent (perpendicular)
    let tx = -ny;
    let ty = nx;

    // Apply gravity
    player.vy += this.gravity * dt;

    // Integrate temporary position
    player.x += player.vx * dt;
    player.y += player.vy * dt;

    // Recalculate distance after movement
    dx = player.x - anchor.x;
    dy = player.y - anchor.y;
    dist = Math.hypot(dx, dy) || 1;
    nx = dx / dist;
    ny = dy / dist;
    tx = -ny;
    ty = nx;

    // Elastic distance constraint (rope maintains length with springy feel)
    if (dist > player.ropeLength) {
      const stretch = dist - player.ropeLength;
      // Pull back to rope length
      player.x -= nx * stretch;
      player.y -= ny * stretch;

      // Project velocity onto tangent (remove outward radial velocity)
      const radialVel = player.vx * nx + player.vy * ny;
      if (radialVel > 0) {
        player.vx -= nx * radialVel;
        player.vy -= ny * radialVel;
      }

      // Slight centrifugal acceleration boost along the tangent
      const tangVel = player.vx * tx + player.vy * ty;
      player.vx = tx * tangVel * 0.9995;
      player.vy = ty * tangVel * 0.9995;
    }

    // Dynamic rotation matches rope angle
    player.rotation = Math.atan2(dy, dx) - Math.PI / 2;
  }

  // Free flight through air
  updateFreeFlight(player, dt) {
    // Gravity
    player.vy += this.gravity * dt;

    // Air drag
    player.vx *= Math.pow(this.airResistance, dt * 60);
    player.vy *= Math.pow(this.airResistance, dt * 60);

    // Position integration
    player.x += player.vx * dt;
    player.y += player.vy * dt;
  }

  // Bounce pad / Trampoline interaction
  checkBouncePads(player, bouncePads, audio, particles, onBounce) {
    if (!bouncePads) return;

    for (const pad of bouncePads) {
      // Pad bounding box
      const minX = pad.x;
      const maxX = pad.x + pad.width;
      const minY = pad.y - 12;
      const maxY = pad.y + pad.height + 12;

      // Collision check with player circle
      if (
        player.x + player.radius > minX &&
        player.x - player.radius < maxX &&
        player.y + player.radius >= pad.y - 10 &&
        player.y - player.radius <= maxY
      ) {
        // Must be falling downward or moving toward pad
        if (player.vy > -100) {
          const bouncePower = pad.bounceForce || 1050;

          // Detach hook if hooked
          player.isHooked = false;
          player.hookTarget = null;

          // Bounce velocity: big upward rebound + forward boost
          player.vy = -Math.max(Math.abs(player.vy) * 1.35, bouncePower);
          player.vx = Math.max(player.vx, 320) + (pad.forwardBoost || 140);

          // Position snap above pad
          player.y = pad.y - player.radius - 4;

          // Squash and stretch visual
          player.squashX = 1.45;
          player.squashY = 0.55;

          // Somersault spin on bounce
          player.angularVel = 14;

          // Pad bounce visual reaction
          pad.activeAnim = 0.25;

          if (audio) audio.playBounce();
          if (particles) particles.emitBounceBurst(player.x, pad.y, pad.width);
          if (onBounce) onBounce();
        }
      }
    }
  }

  // Speed Boost Rings
  checkBoostRings(player, boostRings, audio, particles, onBoost) {
    if (!boostRings) return;

    for (const ring of boostRings) {
      if (ring.collected) continue;

      const dx = player.x - ring.x;
      const dy = player.y - ring.y;
      const dist = Math.hypot(dx, dy);

      if (dist < ring.radius + player.radius) {
        ring.collected = true;
        ring.activeAnim = 0.4;

        // Apply big velocity boost
        player.vx = Math.max(player.vx, 550) + (ring.boostVx || 550);
        player.vy = Math.min(player.vy, -200);

        if (audio) audio.playBoost();
        if (particles) particles.emitBoostRings(ring.x, ring.y);
        if (onBoost) onBoost();
      }
    }
  }

  // Hazards check: Spikes and Sawblades
  checkHazards(player, hazards) {
    if (!hazards) return false;

    for (const h of hazards) {
      if (h.type === 'sawblade') {
        const dist = Math.hypot(player.x - h.x, player.y - h.y);
        if (dist < h.radius + player.radius - 4) {
          return true;
        }
      } else if (h.type === 'spikes') {
        // Spikes bar
        if (
          player.x + player.radius > h.x &&
          player.x - player.radius < h.x + h.width &&
          player.y + player.radius > h.y &&
          player.y - player.radius < h.y + h.height
        ) {
          return true;
        }
      }
    }
    return false;
  }

  // Update oscillating anchors and hazards
  updateDynamicObjects(level, dt) {
    // Dynamic anchors
    if (level.anchors) {
      for (const a of level.anchors) {
        if (a.moving) {
          a.time = (a.time || 0) + dt * (a.moving.speed || 2);
          if (a.moving.type === 'vertical') {
            a.y = a.initialY + Math.sin(a.time) * a.moving.range;
          } else if (a.moving.type === 'horizontal') {
            a.x = a.initialX + Math.sin(a.time) * a.moving.range;
          }
        }
      }
    }

    // Dynamic hazards (rotating sawblades)
    if (level.hazards) {
      for (const h of level.hazards) {
        if (h.type === 'sawblade') {
          h.angle = (h.angle || 0) + (h.spinSpeed || 6) * dt;
        }
      }
    }

    // Pad bounce animations
    if (level.bouncePads) {
      for (const p of level.bouncePads) {
        if (p.activeAnim > 0) p.activeAnim -= dt;
      }
    }
  }
}
