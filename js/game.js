// js/game.js - Main Game Loop, Camera, Input, State Management & UI

// Canvas roundRect polyfill for maximum cross-browser compatibility
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    if (!radii) radii = 0;
    if (typeof radii === 'number') radii = [radii, radii, radii, radii];
    const [tl, tr, br, bl] = radii.length === 1 ? [radii[0], radii[0], radii[0], radii[0]] : radii;
    this.beginPath();
    this.moveTo(x + tl, y);
    this.lineTo(x + w - tr, y);
    this.quadraticCurveTo(x + w, y, x + w, y + tr);
    this.lineTo(x + w, y + h - br);
    this.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    this.lineTo(x + bl, y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - bl);
    this.lineTo(x, y + tl);
    this.quadraticCurveTo(x, y, x + tl, y);
    this.closePath();
    return this;
  };
}

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    this.particles = new ParticleSystem();
    this.stickman = new StickmanRenderer();
    this.physics = new PhysicsEngine();
    this.endlessGen = new EndlessGenerator();

    // Game state
    this.state = 'PLAYING'; // PLAYING, VICTORY, GAMEOVER
    this.currentLevelIndex = parseInt(localStorage.getItem('stickman_level') || '0', 10);
    this.isEndless = false;

    // Player object
    this.player = {
      x: 120,
      y: 400,
      vx: 380,
      vy: 0,
      radius: 16,
      isHooked: false,
      hookTarget: null,
      ropeLength: 0,
      targetRopeLength: 0,
      rotation: 0,
      angularVel: 0,
      squashX: 1,
      squashY: 1
    };

    // Camera
    this.camera = {
      x: 120,
      y: 400,
      targetX: 120,
      targetY: 400,
      zoom: 1.0,
      targetZoom: 1.0,
      shake: 0
    };

    // Stats & Tracking
    this.levelTime = 0;
    this.swingsCount = 0;
    this.bouncesCount = 0;
    this.endlessDistance = 0;
    this.endlessBest = parseInt(localStorage.getItem('stickman_endless_best') || '0', 10);

    // Input state
    this.isPointerDown = false;
    this.targetedAnchor = null;

    // Time tracking
    this.lastTime = performance.now();
    this.timeScale = 1.0;

    // DOM UI elements
    this.initDOMElements();

    // Window setup
    this.handleResize();
    window.addEventListener('resize', () => this.handleResize());

    // Setup input listeners
    this.setupInputs();

    // Setup Modals
    this.setupModals();

    // Start with saved level
    this.loadLevel(this.currentLevelIndex);

    // Start loop
    requestAnimationFrame((t) => this.loop(t));
  }

  initDOMElements() {
    this.ui = {
      levelTitle: document.getElementById('level-title-display'),
      progressFill: document.getElementById('progress-fill'),
      progressStickman: document.getElementById('progress-stickman-icon'),
      endlessHud: document.getElementById('endless-hud'),
      endlessDist: document.getElementById('endless-distance'),
      endlessBest: document.getElementById('endless-best-distance'),
      tutorialOverlay: document.getElementById('tutorial-overlay'),
      comboPopup: document.getElementById('combo-popup'),
      modalLevels: document.getElementById('modal-levels'),
      modalSkins: document.getElementById('modal-skins'),
      levelsGrid: document.getElementById('levels-grid'),
      skinsGrid: document.getElementById('skins-grid'),
      overlayVictory: document.getElementById('overlay-victory'),
      overlayGameOver: document.getElementById('overlay-gameover'),
      overlayPause: document.getElementById('overlay-pause'),
      pauseLevelInfo: document.getElementById('pause-level-info'),
      victoryLevelName: document.getElementById('victory-level-name'),
      victoryStars: document.getElementById('victory-stars'),
      victoryTime: document.getElementById('victory-time'),
      victorySwings: document.getElementById('victory-swings'),
      victoryBounces: document.getElementById('victory-bounces'),
      soundIcon: document.getElementById('sound-icon')
    };

    if (this.endlessBest > 0) {
      this.ui.endlessBest.textContent = `${this.endlessBest}m`;
    }

    if (audio.isMuted()) {
      this.ui.soundIcon.textContent = '🔇';
    }
  }

  handleResize() {
    this.dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
  }

  setupInputs() {
    const onStart = (e) => {
      if (e.target.closest('button') || e.target.closest('.modal-card') || e.target.closest('.overlay-screen:not(.hidden)')) {
        return;
      }
      e.preventDefault();

      // Audio init
      audio.init();
      if (!audio.isMuted() && !audio.bgmPlaying) {
        audio.startBGM();
      }

      this.isPointerDown = true;

      // Hide tutorial once player interacts
      if (this.ui.tutorialOverlay) {
        this.ui.tutorialOverlay.style.display = 'none';
      }

      if (this.state === 'WAITING') {
        this.startFromLedge();
      } else if (this.state === 'PLAYING') {
        // If not already hooked, find best anchor and attach
        if (!this.player.isHooked) {
          const target = this.physics.findBestAnchor(this.player, this.currentLevel.anchors);
          if (target) {
            this.physics.attachHook(this.player, target, audio, this.particles);
            this.swingsCount++;
            this.triggerScreenShake(2.5);
          }
        }
      }
    };

    const onEnd = (e) => {
      this.isPointerDown = false;
      if (this.state === 'PLAYING' && this.player.isHooked) {
        this.physics.releaseHook(this.player, audio);
      }
    };

    // Pointer events on canvas
    this.canvas.addEventListener('pointerdown', onStart);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat) {
        onStart(e);
      } else if (e.code === 'KeyR') {
        this.restartLevel();
      } else if (e.code === 'KeyP' || e.code === 'Escape') {
        this.togglePause();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        onEnd(e);
      }
    });

    // HUD buttons
    document.getElementById('btn-sound').addEventListener('click', () => {
      const isMuted = audio.toggleMute();
      this.ui.soundIcon.textContent = isMuted ? '🔇' : '🔊';
    });

    document.getElementById('btn-pause').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      this.restartLevel();
    });

    document.getElementById('btn-levels').addEventListener('click', () => {
      this.openLevelsModal();
    });

    document.getElementById('btn-skins').addEventListener('click', () => {
      this.openSkinsModal();
    });

    // Pause Screen buttons
    document.getElementById('btn-pause-resume').addEventListener('click', () => {
      this.resumeGame();
    });

    document.getElementById('btn-pause-restart').addEventListener('click', () => {
      this.resumeGame();
      this.restartLevel();
    });

    document.getElementById('btn-pause-levels').addEventListener('click', () => {
      this.resumeGame();
      this.openLevelsModal();
    });

    // Victory & Game Over buttons
    document.getElementById('btn-victory-replay').addEventListener('click', () => {
      this.restartLevel();
    });

    document.getElementById('btn-victory-next').addEventListener('click', () => {
      this.nextLevel();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      this.restartLevel();
    });
  }

  setupModals() {
    // Close modal buttons
    document.getElementById('btn-close-levels').addEventListener('click', () => {
      this.ui.modalLevels.classList.add('hidden');
    });

    document.getElementById('btn-close-skins').addEventListener('click', () => {
      this.ui.modalSkins.classList.add('hidden');
    });

    // Modal backdrop click
    this.ui.modalLevels.addEventListener('click', (e) => {
      if (e.target === this.ui.modalLevels) this.ui.modalLevels.classList.add('hidden');
    });
    this.ui.modalSkins.addEventListener('click', (e) => {
      if (e.target === this.ui.modalSkins) this.ui.modalSkins.classList.add('hidden');
    });

    // Campaign vs Endless tabs
    const tabCampaign = document.getElementById('tab-campaign');
    const tabEndless = document.getElementById('tab-endless');
    const endlessCard = document.getElementById('endless-select-card');

    tabCampaign.addEventListener('click', () => {
      tabCampaign.classList.add('active');
      tabEndless.classList.remove('active');
      this.ui.levelsGrid.classList.remove('hidden');
      endlessCard.classList.add('hidden');
    });

    tabEndless.addEventListener('click', () => {
      tabEndless.classList.add('active');
      tabCampaign.classList.remove('active');
      this.ui.levelsGrid.classList.add('hidden');
      endlessCard.classList.remove('hidden');
    });

    document.getElementById('btn-start-endless').addEventListener('click', () => {
      this.ui.modalLevels.classList.add('hidden');
      this.startEndlessMode();
    });
  }

  loadLevel(index) {
    this.isEndless = false;
    this.currentLevelIndex = Math.max(0, Math.min(index, CAMPAIGN_LEVELS.length - 1));
    localStorage.setItem('stickman_level', this.currentLevelIndex);

    // Deep clone level template so dynamic objects reset cleanly
    const template = CAMPAIGN_LEVELS[this.currentLevelIndex];
    this.currentLevel = JSON.parse(JSON.stringify(template));

    // Reset player standing on start line
    const startX = this.currentLevel.startX || 120;
    const platformTopY = (this.currentLevel.startY || 380) + 34;

    this.player.x = startX;
    this.player.y = platformTopY - 34;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isHooked = false;
    this.player.hookTarget = null;
    this.player.rotation = 0;
    this.player.angularVel = 0;
    this.player.squashX = 1;
    this.player.squashY = 1;
    this.player.isWaiting = true;
    this.player.idleTime = 0;

    this.stickman.resetCloth(this.player.x, this.player.y);

    // Reset camera focusing on stickman and looking ahead
    this.camera.x = this.player.x + 80;
    this.camera.y = this.player.y - 20;
    this.camera.targetX = this.player.x + 80;
    this.camera.targetY = this.player.y - 20;
    this.camera.zoom = 1.0;
    this.camera.targetZoom = 1.0;
    this.camera.shake = 0;

    // Reset state & stats
    this.state = 'WAITING';
    this.levelTime = 0;
    this.swingsCount = 0;
    this.bouncesCount = 0;
    this.timeScale = 1.0;

    // Update UI
    this.ui.levelTitle.textContent = `Level ${this.currentLevel.id}: ${this.currentLevel.name}`;
    this.ui.endlessHud.classList.add('hidden');
    document.getElementById('progress-container').classList.remove('hidden');
    this.ui.overlayVictory.classList.add('hidden');
    this.ui.overlayGameOver.classList.add('hidden');
    if (this.ui.overlayPause) this.ui.overlayPause.classList.add('hidden');

    this.particles.clear();

    // Show tutorial hint only on Level 1
    if (this.currentLevel.id === 1) {
      this.ui.tutorialOverlay.style.display = 'block';
    } else {
      this.ui.tutorialOverlay.style.display = 'none';
    }
  }

  startEndlessMode() {
    this.isEndless = true;
    this.endlessGen.reset();
    this.currentLevel = this.endlessGen.level;

    const startX = 120;
    const platformTopY = 380 + 34;

    this.player.x = startX;
    this.player.y = platformTopY - 34;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.isHooked = false;
    this.player.hookTarget = null;
    this.player.rotation = 0;
    this.player.angularVel = 0;
    this.player.squashX = 1;
    this.player.squashY = 1;
    this.player.isWaiting = true;
    this.player.idleTime = 0;

    this.stickman.resetCloth(this.player.x, this.player.y);

    this.camera.x = this.player.x + 80;
    this.camera.y = this.player.y - 20;
    this.camera.targetX = this.player.x + 80;
    this.camera.targetY = this.player.y - 20;
    this.camera.zoom = 1.0;
    this.camera.targetZoom = 1.0;

    this.state = 'WAITING';
    this.levelTime = 0;
    this.swingsCount = 0;
    this.bouncesCount = 0;
    this.timeScale = 1.0;

    this.ui.levelTitle.textContent = 'Infinite Swing';
    this.ui.endlessHud.classList.remove('hidden');
    document.getElementById('progress-container').classList.add('hidden');
    this.ui.overlayVictory.classList.add('hidden');
    this.ui.overlayGameOver.classList.add('hidden');
    if (this.ui.overlayPause) this.ui.overlayPause.classList.add('hidden');
    this.ui.tutorialOverlay.style.display = 'none';

    this.particles.clear();
  }

  startFromLedge() {
    this.state = 'PLAYING';
    this.player.isWaiting = false;
    this.levelTime = 0;

    // Connect to the target anchor
    const target = this.physics.findBestAnchor(this.player, this.currentLevel.anchors);
    if (target) {
      // Leap forward into the swing with energetic arc
      this.player.vx = 430;
      this.player.vy = 50;
      this.physics.attachHook(this.player, target, audio, this.particles);
      this.swingsCount++;
      this.triggerScreenShake(2.5);
    } else {
      this.player.vx = 420;
      this.player.vy = -120;
    }
  }

  restartLevel() {
    if (this.isEndless) {
      this.startEndlessMode();
    } else {
      this.loadLevel(this.currentLevelIndex);
    }
  }

  nextLevel() {
    if (this.currentLevelIndex + 1 < CAMPAIGN_LEVELS.length) {
      this.loadLevel(this.currentLevelIndex + 1);
    } else {
      // Completed all campaign levels!
      this.startEndlessMode();
    }
  }

  togglePause() {
    if (this.state === 'PLAYING' || this.state === 'WAITING') {
      this.pauseGame();
    } else if (this.state === 'PAUSED') {
      this.resumeGame();
    }
  }

  pauseGame() {
    if (this.state !== 'PLAYING' && this.state !== 'WAITING') return;
    this.previousState = this.state;
    this.state = 'PAUSED';
    this.isPointerDown = false; // release active hook hold

    if (this.isEndless) {
      this.ui.pauseLevelInfo.textContent = 'Infinite Swing (Endless)';
    } else {
      this.ui.pauseLevelInfo.textContent = `Level ${this.currentLevel.id}: ${this.currentLevel.name}`;
    }

    if (this.ui.overlayPause) {
      this.ui.overlayPause.classList.remove('hidden');
    }
  }

  resumeGame() {
    if (this.state !== 'PAUSED') return;
    this.state = this.previousState || 'PLAYING';
    this.lastTime = performance.now(); // prevent delta-time surge after pausing
    if (this.ui.overlayPause) {
      this.ui.overlayPause.classList.add('hidden');
    }
  }

  onCrash() {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAMEOVER';
    this.timeScale = 0.25; // slow-mo crash

    const skin = this.stickman.getSkin();
    this.particles.emitDeathShatter(this.player.x, this.player.y, skin.color);
    this.triggerScreenShake(8);
    audio.playCrash();

    // Show game over overlay after brief delay
    setTimeout(() => {
      this.ui.overlayGameOver.classList.remove('hidden');
      this.timeScale = 1.0;
    }, 450);
  }

  onWin() {
    if (this.state !== 'PLAYING') return;
    this.state = 'VICTORY';
    this.timeScale = 0.35; // slow-mo finish crossing

    // Camera zooms in on stickman
    this.camera.targetZoom = 1.25;

    // Save level progression
    const unlocked = parseInt(localStorage.getItem('stickman_unlocked') || '1', 10);
    if (this.currentLevel.id >= unlocked && this.currentLevel.id < CAMPAIGN_LEVELS.length) {
      localStorage.setItem('stickman_unlocked', this.currentLevel.id + 1);
    }

    // Stars calculation
    let stars = 1;
    if (this.levelTime <= this.currentLevel.parTime3Stars) {
      stars = 3;
    } else if (this.levelTime <= this.currentLevel.parTime2Stars) {
      stars = 2;
    }

    // Save stars
    const prevStars = parseInt(localStorage.getItem(`stickman_stars_${this.currentLevel.id}`) || '0', 10);
    if (stars > prevStars) {
      localStorage.setItem(`stickman_stars_${this.currentLevel.id}`, stars);
    }

    audio.playWin();
    this.particles.emitVictoryConfetti(this.player.x, this.player.y, 160);

    // Show victory modal after brief slow-mo
    setTimeout(() => {
      this.ui.victoryLevelName.textContent = `Level ${this.currentLevel.id} Complete!`;
      this.ui.victoryStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
      this.ui.victoryTime.textContent = `${this.levelTime.toFixed(2)}s`;
      this.ui.victorySwings.textContent = this.swingsCount;
      this.ui.victoryBounces.textContent = this.bouncesCount;
      this.ui.overlayVictory.classList.remove('hidden');
      this.timeScale = 1.0;
    }, 900);
  }

  showCombo(text) {
    this.ui.comboPopup.textContent = text;
    this.ui.comboPopup.classList.add('show');
    clearTimeout(this.comboTimeout);
    this.comboTimeout = setTimeout(() => {
      this.ui.comboPopup.classList.remove('show');
    }, 900);
  }

  triggerScreenShake(intensity) {
    this.camera.shake = Math.max(this.camera.shake, intensity);
  }

  openLevelsModal() {
    this.ui.modalLevels.classList.remove('hidden');
    this.ui.levelsGrid.innerHTML = '';

    const unlocked = parseInt(localStorage.getItem('stickman_unlocked') || '1', 10);

    CAMPAIGN_LEVELS.forEach((lvl, idx) => {
      const isLocked = lvl.id > unlocked;
      const stars = parseInt(localStorage.getItem(`stickman_stars_${lvl.id}`) || '0', 10);

      const card = document.createElement('div');
      card.className = `level-card ${isLocked ? 'locked' : ''} ${idx === this.currentLevelIndex && !this.isEndless ? 'active' : ''}`;
      card.innerHTML = `
        <div class="level-card-num">${lvl.id}</div>
        <div class="level-card-stars">${isLocked ? '🔒' : '⭐'.repeat(stars) + '☆'.repeat(3 - stars)}</div>
      `;

      if (!isLocked) {
        card.addEventListener('click', () => {
          this.ui.modalLevels.classList.add('hidden');
          this.loadLevel(idx);
        });
      }

      this.ui.levelsGrid.appendChild(card);
    });
  }

  openSkinsModal() {
    this.ui.modalSkins.classList.remove('hidden');
    this.ui.skinsGrid.innerHTML = '';

    Object.keys(SKINS).forEach((skinKey) => {
      const skin = SKINS[skinKey];
      const isSelected = this.stickman.currentSkin === skinKey;

      const card = document.createElement('div');
      card.className = `skin-card ${isSelected ? 'selected' : ''}`;

      const previewCanvas = document.createElement('canvas');
      previewCanvas.width = 140;
      previewCanvas.height = 140;

      const nameEl = document.createElement('div');
      nameEl.className = 'skin-name';
      nameEl.textContent = skin.name;

      card.appendChild(previewCanvas);
      card.appendChild(nameEl);

      this.stickman.renderPreview(previewCanvas, skinKey);

      card.addEventListener('click', () => {
        this.stickman.setSkin(skinKey);
        this.openSkinsModal(); // refresh selection border
      });

      this.ui.skinsGrid.appendChild(card);
    });
  }

  // Main Loop
  loop(now) {
    requestAnimationFrame((t) => this.loop(t));

    const dt = Math.min((now - this.lastTime) / 1000, 0.05) * this.timeScale;
    this.lastTime = now;

    if (this.state !== 'PAUSED') {
      this.update(dt);
    }
    this.render();
  }

  update(dt) {
    if (this.state === 'WAITING') {
      this.player.idleTime = (this.player.idleTime || 0) + dt;
      // Target first anchor so pulsing ring displays
      this.targetedAnchor = this.physics.findBestAnchor(this.player, this.currentLevel.anchors);
      this.updateCamera(dt);
      return;
    }

    if (this.state === 'PLAYING') {
      this.levelTime += dt;

      // Handle continuous hooking while pointer is held down
      if (this.isPointerDown && !this.player.isHooked) {
        const best = this.physics.findBestAnchor(this.player, this.currentLevel.anchors);
        if (best) {
          this.physics.attachHook(this.player, best, audio, this.particles);
          this.swingsCount++;
          this.triggerScreenShake(2.5);
        }
      }

      // Physics update
      this.physics.update(
        this.player,
        this.currentLevel,
        dt,
        audio,
        this.particles,
        () => this.onCrash(),
        () => this.onWin(),
        () => this.showCombo('⚡ HYPER SPEED!'),
        () => {
          this.bouncesCount++;
          this.triggerScreenShake(3.5);
          this.showCombo('💥 BOING!');
        }
      );

      // Endless procedural expansion
      if (this.isEndless) {
        this.endlessGen.extend(this.player.x + 2200);
        this.endlessGen.cull(this.player.x);

        const distMeters = Math.max(0, Math.floor((this.player.x - 120) / 30));
        this.endlessDistance = distMeters;
        this.ui.endlessDist.textContent = `${distMeters}m`;

        if (distMeters > this.endlessBest) {
          this.endlessBest = distMeters;
          localStorage.setItem('stickman_endless_best', distMeters);
          this.ui.endlessBest.textContent = `${distMeters}m`;
        }
      }

      // Target anchor finder for visual highlight
      this.targetedAnchor = this.player.isHooked
        ? this.player.hookTarget
        : this.physics.findBestAnchor(this.player, this.currentLevel.anchors);

      // Update progress bar
      if (!this.isEndless && this.currentLevel.finishX) {
        const totalDist = this.currentLevel.finishX - this.currentLevel.startX;
        const curDist = Math.max(0, Math.min(totalDist, this.player.x - this.currentLevel.startX));
        const progressPct = (curDist / totalDist) * 100;

        this.ui.progressFill.style.width = `${progressPct}%`;
        this.ui.progressStickman.style.left = `${progressPct}%`;
      }
    }

    // Particles update
    this.particles.update(dt);

    // Dynamic Camera update
    this.updateCamera(dt);
  }

  updateCamera(dt) {
    const speed = Math.hypot(this.player.vx, this.player.vy);

    // Look-ahead camera lead
    const leadX = Math.min(320, this.player.vx * 0.28);
    const leadY = Math.max(-100, Math.min(100, this.player.vy * 0.15));

    this.camera.targetX = this.player.x + leadX;
    this.camera.targetY = this.player.y + leadY;

    // Dynamic zoom based on speed
    if (this.state === 'PLAYING') {
      const zoomFactor = Math.max(0.74, 1.0 - (speed - 500) * 0.00028);
      this.camera.targetZoom = zoomFactor;
    }

    // Smooth Lerp
    this.camera.x += (this.camera.targetX - this.camera.x) * Math.min(1, dt * 6);
    this.camera.y += (this.camera.targetY - this.camera.y) * Math.min(1, dt * 6);
    this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * Math.min(1, dt * 4);

    // Shake decay
    if (this.camera.shake > 0) {
      this.camera.shake *= Math.pow(0.86, dt * 60);
      if (this.camera.shake < 0.2) this.camera.shake = 0;
    }
  }

  // Render Scene
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Save camera transform
    ctx.save();

    // Center camera on screen
    ctx.translate(w / 2, h / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);

    // Apply screen shake
    if (this.camera.shake > 0) {
      const shakeX = (Math.random() - 0.5) * this.camera.shake * 3.5;
      const shakeY = (Math.random() - 0.5) * this.camera.shake * 3.5;
      ctx.translate(shakeX, shakeY);
    }

    ctx.translate(-this.camera.x, -this.camera.y);

    // 1. Draw subtle background parallax grid & depth lines
    this.drawParallaxGrid(ctx);

    // 2. Draw Start Platform & Finish Line
    this.drawPlatformsAndFinish(ctx);

    // 3. Draw Bounce Pads
    this.drawBouncePads(ctx);

    // 4. Draw Boost Rings
    this.drawBoostRings(ctx);

    // 5. Draw Hazards (Spikes & Sawblades)
    this.drawHazards(ctx);

    // 6. Draw Anchors / Pegs
    this.drawAnchors(ctx);

    // 7. Draw Grappling Rope
    this.drawRope(ctx);

    // 8. Draw Stickman Player
    if (this.state !== 'GAMEOVER') {
      this.stickman.draw(ctx, this.player, this.particles);
    }

    // 9. Draw Particle System
    this.particles.draw(ctx);

    ctx.restore();

    // 10. Draw Screen-space Speed Wind Lines when moving fast
    this.drawSpeedWindLines(ctx, w, h);
  }

  // Background grid
  drawParallaxGrid(ctx) {
    const camX = this.camera.x;
    const camY = this.camera.y;

    const gridSize = 120;
    const startGridX = Math.floor((camX - 1000) / gridSize) * gridSize;
    const endGridX = Math.ceil((camX + 1000) / gridSize) * gridSize;
    const startGridY = Math.floor((camY - 800) / gridSize) * gridSize;
    const endGridY = Math.ceil((camY + 800) / gridSize) * gridSize;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let gx = startGridX; gx <= endGridX; gx += gridSize) {
      ctx.moveTo(gx, startGridY);
      ctx.lineTo(gx, endGridY);
    }
    for (let gy = startGridY; gy <= endGridY; gy += gridSize) {
      ctx.moveTo(startGridX, gy);
      ctx.lineTo(endGridX, gy);
    }
    ctx.stroke();

    // Bottom dark fog gradient
    const pitY = this.currentLevel.pitY || 900;
    const pitGrad = ctx.createLinearGradient(0, pitY - 200, 0, pitY + 300);
    pitGrad.addColorStop(0, 'rgba(10, 12, 25, 0)');
    pitGrad.addColorStop(1, 'rgba(255, 30, 70, 0.4)');
    ctx.fillStyle = pitGrad;
    ctx.fillRect(camX - 1500, pitY - 200, 3000, 600);
  }

  // Start & Finish line
  drawPlatformsAndFinish(ctx) {
    // Start Platform
    const startX = this.currentLevel.startX || 120;
    const startY = (this.currentLevel.startY || 380) + 34;

    ctx.fillStyle = '#232b47';
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(startX - 90, startY, 150, 400, [10, 10, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // Checkered Start Line on top edge of platform
    const lineX = startX + 24;
    const lineY = startY;
    const lineWidth = 12;
    const lineHeight = 8;
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#121420';
      ctx.fillRect(lineX - lineWidth, lineY - 3, lineWidth / 2, lineHeight);
      ctx.fillStyle = (i % 2 === 1) ? '#ffffff' : '#121420';
      ctx.fillRect(lineX - lineWidth / 2, lineY - 3, lineWidth / 2, lineHeight);
    }

    // Glowing START text
    ctx.fillStyle = '#00e5ff';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 8;
    ctx.fillText('START LINE', startX - 65, startY + 28);
    ctx.shadowBlur = 0;

    // Finish Line Archway (Campaign mode only)
    if (!this.isEndless && this.currentLevel.finishX) {
      const fx = this.currentLevel.finishX;
      const fy = 100;
      const fHeight = 650;

      // Finish posts
      ctx.fillStyle = '#ffb700';
      ctx.fillRect(fx - 10, fy, 20, fHeight);

      // Checkered finish banner
      const bannerW = 40;
      const bannerH = 180;
      const cols = 4;
      const rows = 12;
      const cellW = bannerW / cols;
      const cellH = bannerH / rows;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#121420';
          ctx.fillRect(fx + c * cellW, fy + 80 + r * cellH, cellW, cellH);
        }
      }

      // Finish Banner Text
      ctx.fillStyle = '#ffb700';
      ctx.font = 'bold 24px Fredoka One, cursive';
      ctx.shadowColor = '#ffb700';
      ctx.shadowBlur = 15;
      ctx.fillText('FINISH', fx - 35, fy + 50);
      ctx.shadowBlur = 0;
    }
  }

  // Draw Trampoline Bounce Pads
  drawBouncePads(ctx) {
    if (!this.currentLevel.bouncePads) return;

    for (const pad of this.currentLevel.bouncePads) {
      const animSquish = pad.activeAnim ? Math.sin(pad.activeAnim * Math.PI * 4) * 6 : 0;
      const py = pad.y + animSquish;

      // Base stand
      ctx.fillStyle = '#1c223a';
      ctx.fillRect(pad.x + 8, py + 12, pad.width - 16, 20);

      // Springs
      ctx.strokeStyle = '#8e9bb0';
      ctx.lineWidth = 3;
      const springCount = Math.floor(pad.width / 24);
      for (let i = 0; i < springCount; i++) {
        const sx = pad.x + 14 + i * 22;
        ctx.beginPath();
        ctx.moveTo(sx, py + 8);
        ctx.lineTo(sx - 3, py + 16);
        ctx.lineTo(sx + 3, py + 22);
        ctx.stroke();
      }

      // Trampoline top pad
      const grad = ctx.createLinearGradient(pad.x, py, pad.x + pad.width, py);
      grad.addColorStop(0, '#ff3366');
      grad.addColorStop(0.5, '#ff9900');
      grad.addColorStop(1, '#ff3366');

      ctx.fillStyle = grad;
      ctx.shadowColor = '#ff3366';
      ctx.shadowBlur = pad.activeAnim > 0 ? 20 : 8;

      ctx.beginPath();
      ctx.roundRect(pad.x, py, pad.width, pad.height, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Striped texture on pad
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      for (let tx = pad.x + 10; tx < pad.x + pad.width - 8; tx += 14) {
        ctx.beginPath();
        ctx.moveTo(tx, py + 2);
        ctx.lineTo(tx + 6, py + pad.height - 2);
        ctx.stroke();
      }
    }
  }

  // Draw Boost Rings
  drawBoostRings(ctx) {
    if (!this.currentLevel.boostRings) return;

    const time = performance.now() * 0.003;
    for (const ring of this.currentLevel.boostRings) {
      if (ring.collected) continue;

      const pulse = Math.sin(time * 3) * 3;
      const r = ring.radius + pulse;

      ctx.save();
      ctx.translate(ring.x, ring.y);

      // Glow
      ctx.strokeStyle = '#00e5ff';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#00e5ff';
      ctx.shadowBlur = 18;

      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();

      // Chevrons inside ring pointing right
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, -10);
      ctx.lineTo(6, 0);
      ctx.lineTo(-6, 10);

      ctx.moveTo(4, -10);
      ctx.lineTo(16, 0);
      ctx.lineTo(4, 10);
      ctx.stroke();

      ctx.restore();
    }
  }

  // Draw Hazards: Spikes & Sawblades
  drawHazards(ctx) {
    if (!this.currentLevel.hazards) return;

    for (const h of this.currentLevel.hazards) {
      if (h.type === 'spikes') {
        // Danger spike strip
        const spikeW = 20;
        const count = Math.floor(h.width / spikeW);

        ctx.fillStyle = '#ff2255';
        ctx.beginPath();
        for (let i = 0; i < count; i++) {
          const sx = h.x + i * spikeW;
          ctx.moveTo(sx, h.y + h.height);
          ctx.lineTo(sx + spikeW / 2, h.y);
          ctx.lineTo(sx + spikeW, h.y + h.height);
        }
        ctx.closePath();
        ctx.fill();

        // Warning base
        ctx.fillStyle = '#3a0d18';
        ctx.fillRect(h.x, h.y + h.height - 4, h.width, 10);
      } else if (h.type === 'sawblade') {
        // Rotating lethal sawblade
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.angle || 0);

        const r = h.radius;
        const teeth = 12;

        ctx.fillStyle = '#363d59';
        ctx.strokeStyle = '#ff3366';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
          const a1 = (i / teeth) * Math.PI * 2;
          const a2 = a1 + (Math.PI / teeth);
          const rOuter = r + 6;
          const rInner = r - 4;

          if (i === 0) ctx.moveTo(Math.cos(a1) * rInner, Math.sin(a1) * rInner);
          ctx.lineTo(Math.cos(a1) * rOuter, Math.sin(a1) * rOuter);
          ctx.lineTo(Math.cos(a2) * rInner, Math.sin(a2) * rInner);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner hub
        ctx.fillStyle = '#ff2255';
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    }
  }

  // Draw Grapple Anchors
  drawAnchors(ctx) {
    if (!this.currentLevel.anchors) return;

    const time = performance.now() * 0.005;

    for (const a of this.currentLevel.anchors) {
      const isTargeted = a === this.targetedAnchor;
      const isConnected = this.player.isHooked && this.player.hookTarget === a;

      // Connecting tether beam if dynamic moving anchor
      if (a.moving) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(a.initialX, a.initialY - a.moving.range);
        ctx.lineTo(a.initialX, a.initialY + a.moving.range);
        ctx.stroke();
      }

      // Outer Pulsing Target Highlight Ring
      if (isTargeted) {
        const ringRadius = a.radius + 10 + Math.sin(time * 6) * 4;
        ctx.strokeStyle = isConnected ? '#ff3366' : '#00e5ff';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = isConnected ? '#ff3366' : '#00e5ff';
        ctx.shadowBlur = 14;

        ctx.beginPath();
        ctx.arc(a.x, a.y, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // Main Anchor Pin
      ctx.fillStyle = isConnected ? '#ff3366' : '#ffffff';
      ctx.shadowColor = isConnected ? '#ff3366' : '#00e5ff';
      ctx.shadowBlur = 10;

      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Anchor Core
      ctx.fillStyle = '#121420';
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw Grappling Rope
  drawRope(ctx) {
    if (!this.player.isHooked || !this.player.hookTarget) return;

    const a = this.player.hookTarget;
    const p = this.player;

    ctx.save();

    // High tension glowing laser rope
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3.5;
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // Inner bright beam core
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // Anchor hook ring
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius + 4, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // Screen wind lines when moving at hyper speed
  drawSpeedWindLines(ctx, w, h) {
    const speed = Math.hypot(this.player.vx, this.player.vy);
    if (speed < 750) return;

    const intensity = Math.min(1.0, (speed - 750) / 600);
    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.18 * intensity})`;
    ctx.lineWidth = 2;

    const angle = Math.atan2(this.player.vy, this.player.vx);
    const lineCount = Math.floor(10 * intensity);

    for (let i = 0; i < lineCount; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      const len = 40 + Math.random() * 80;

      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - Math.cos(angle) * len, ry - Math.sin(angle) * len);
      ctx.stroke();
    }

    ctx.restore();
  }
}

// Instantiate game once window is loaded
window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
