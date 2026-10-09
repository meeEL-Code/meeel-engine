// meeEL Runtime v0.8 — magic text + synthesized sound library
(function() {
  'use strict';
  // Visible load badge
  try {
    setTimeout(function() {
      if (document.body) {
        const b = document.createElement('div');
        b.id = '__meelDebugBadge';
        b.textContent = '✓ runtime loaded';
        b.style.cssText = 'position:fixed;bottom:4px;left:4px;background:#0a84ff;color:#fff;' +
          'font:10px monospace;padding:2px 6px;border-radius:3px;z-index:99999;opacity:.85;';
        document.body.appendChild(b);
      }
    }, 200);
  } catch (e) {}

  if (window.__meelRuntimeLoaded) return;

  try {
    if (window.__meelTimerIds) for (const id of window.__meelTimerIds) {
      try { clearInterval(id); } catch (e) {}
      try { clearTimeout(id); } catch (e) {}
    }
  } catch (e) {}
  window.__meelTimerIds = [];
  window.__meelRuntimeLoaded = true;
  window.__meelJoystickAttached = false;

  const trackId = id => { window.__meelTimerIds.push(id); return id; };

  const eventHandlers = new Map();
  window.on = (n, h) => { if (!eventHandlers.has(n)) eventHandlers.set(n, []); eventHandlers.get(n).push(h); };
  window.triggerEvent = n => { (eventHandlers.get(n) || []).forEach(h => { try { h(); } catch (e) {} }); };
  window.triggerAll = p => {
    for (const [name, hs] of eventHandlers) if (name.startsWith(p)) hs.forEach(h => { try { h(); } catch (e) {} });
  };
  window.every = (ms, h) => trackId(setInterval(() => { try { h(); } catch (e) {} }, ms));
  window.wait = ms => new Promise(r => setTimeout(r, ms));

  // ═══════════════════════════════════════════════════════
  // SOUND LIBRARY — synthesized (zero download, no copyright)
  // ═══════════════════════════════════════════════════════
  let audioCtx = null;
  function getCtx() {
    if (!audioCtx) {
      try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  }

  function tone(freq, start, dur, type, vol) {
    const ctx = getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(vol || 0.15, ctx.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.02);
  }

  function sweep(f1, f2, start, dur, vol) {
    const ctx = getCtx(); if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(f1, ctx.currentTime + start);
    osc.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + start + dur);
    gain.gain.setValueAtTime(vol || 0.12, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + start);
    osc.stop(ctx.currentTime + start + dur + 0.02);
  }

  function noise(start, dur, vol, lowpassFreq) {
    const ctx = getCtx(); if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(lowpassFreq || 2000, ctx.currentTime + start);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol || 0.15, ctx.currentTime + start);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime + start);
    src.stop(ctx.currentTime + start + dur);
  }

  const SYNTH = {
    coin:      () => { tone(988, 0, 0.08, 'square', 0.12); tone(1319, 0.08, 0.15, 'square', 0.12); },
    jump:      () => sweep(200, 800, 0, 0.18, 0.1),
    hit:       () => { noise(0, 0.1, 0.2, 800); tone(150, 0, 0.12, 'square', 0.1); },
    explosion: () => { noise(0, 0.5, 0.3, 400); noise(0.05, 0.3, 0.15, 200); },
    powerup:   () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.06, 0.15, 'triangle', 0.12)); },
    win:       () => { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, i * 0.1, 0.3, 'triangle', 0.14)); },
    lose:      () => { [400, 320, 250, 180].forEach((f, i) => tone(f, i * 0.15, 0.35, 'sawtooth', 0.12)); },
    beep:      () => tone(800, 0, 0.08, 'square', 0.12),
    click:     () => tone(1200, 0, 0.03, 'square', 0.08),
    laser:     () => sweep(1500, 200, 0, 0.15, 0.1),
    blip:      () => tone(500, 0, 0.05, 'sine', 0.1),
    select:    () => { tone(700, 0, 0.05, 'sine', 0.1); tone(1000, 0.05, 0.08, 'sine', 0.1); },
  };

  // ─── Character sprite registry ───
  const charRegistry = {};
  window.defineCharacter = function(type, def) {
    const clean = String(type).replace(/^#/, '');
    charRegistry[clean] = {
      idle: def.idle || null,
      walk: def.walk || null,
      hit:  def.hit  || null,
      size: def.size || null,
    };
  };

  // ─── Sound registry — maps #id to URL or fallback synth name ───
  const soundRegistry = {};
  window.defineSound = function(id, url, fallback) {
    soundRegistry[id] = { url: url || null, fallback: fallback || null };
  };

  window.playSound = function(name) {
    if (!name) return;
    const raw = String(name).replace(/^url[:\["'\s]+|[\]"'\s]+$/g, '');

    // #id reference → look up sound registry
    if (raw.startsWith('#')) {
      const def = soundRegistry[raw];
      if (def) {
        if (def.url) { try { new Audio(def.url).play().catch(() => {}); return; } catch (e) {} }
        const key = (def.fallback || raw.slice(1)).replace(/-sound$/, '').replace(/\.(wav|mp3|ogg)$/i, '').toLowerCase();
        if (SYNTH[key]) { try { SYNTH[key](); return; } catch (e) {} }
      }
      // Fallback: try built-in using #name stripped
      const key2 = raw.slice(1).replace(/-sound$/, '').replace(/\.(wav|mp3|ogg)$/i, '').toLowerCase();
      if (SYNTH[key2]) { try { SYNTH[key2](); return; } catch (e) {} }
      try { SYNTH.beep(); } catch (e) {}
      return;
    }

    // URL or file path → Audio element
    if (/^(https?:|\.?\/|data:)/.test(raw) || /\.(wav|mp3|ogg|m4a)$/i.test(raw)) {
      try { new Audio(raw).play().catch(() => {}); } catch (e) {}
      return;
    }

    // Built-in library name
    const key = raw.replace(/\.(wav|mp3|ogg)$/i, '').toLowerCase();
    if (SYNTH[key]) { try { SYNTH[key](); return; } catch (e) {} }
    try { SYNTH.beep(); } catch (e) {}
  };

  // ═══════════════════════════════════════════════════════
  // CONTAINER + ENTITIES
  // ═══════════════════════════════════════════════════════
  function getContainer() {
    let page = document.getElementById('meel-screen');
    if (!page) page = document.querySelector('[id^="meel-page-"]');
    if (!page) page = document.querySelector('.meel-page');
    if (!page) page = document.getElementById('page');
    if (page) {
      const cs = getComputedStyle(page);
      if (cs.position === 'static') page.style.position = 'relative';
      return page;
    }
    let c = document.getElementById('meel-game');
    if (!c) {
      c = document.createElement('div');
      c.id = 'meel-game';
      c.style.cssText = 'position:relative;width:100%;min-height:300px;';
      document.body.appendChild(c);
    }
    return c;
  }

  const entities = new Map();
  let spawnCount = 0;
  const COLORS = ['#0a84ff', '#ff9f0a', '#30d158', '#ff453a', '#bf5af2'];
  const EMOJIS = { coin: '🪙', player: '🧑', enemy: '👾', bullet: '🔸', lava: '🔥', door: '🚪', health_pack: '❤️' };

  window.spawn = function(type, ...args) {
    const clean = String(type).replace(/^#/, '');
    let image = null, size = clean === 'player' ? 48 : 34, bg = null, pos = null, atName = null;

    // Check character registry
    const charDef = charRegistry[clean];
    for (let i = 0; i < args.length; i++) {
      const a = String(args[i]); const aLow = a.toLowerCase();
      if (aLow === 'with' || aLow === 'image' || aLow === 'as') continue;
      if (aLow === 'size') { const n = parseFloat(args[++i]); if (!isNaN(n)) size = n; continue; }
      if (aLow === 'color') { bg = String(args[++i]).replace(/["']/g, ''); continue; }
      if (aLow === 'at') { atName = String(args[++i]).replace(/["']/g, ''); continue; }
      if (aLow === 'position' && i + 2 < args.length) {
        const x = parseFloat(args[++i]), y = parseFloat(args[++i]);
        if (!isNaN(x) && !isNaN(y)) pos = [x, y];
        continue;
      }
      const ca = a.replace(/["']/g, '');
      if (!image && ca) image = ca;
    }

    const id = 'meel-' + clean + '-' + (++spawnCount);
    const el = document.createElement('div');
    el.id = id; el.className = 'meel-entity meel-' + clean;
    el.dataset.meelType = clean;
    const idx = spawnCount - 1;
    let gridX = (idx % 4) * 80 + 40;
    let gridY = Math.floor(idx / 4) * 90 + 120;
    if (clean === 'player') { gridX = 150; gridY = 300; }
    if (pos) { gridX = pos[0]; gridY = pos[1]; }
    if (atName) {
      const c = getContainer().getBoundingClientRect();
      if (atName === 'center') { gridX = c.width / 2 - size / 2; gridY = c.height / 2 - size / 2; }
      if (atName === 'top')    { gridX = c.width / 2 - size / 2; gridY = 40; }
      if (atName === 'bottom') { gridX = c.width / 2 - size / 2; gridY = c.height - size - 40; }
    }
    const bgColor = bg || COLORS[idx % COLORS.length];
    el.style.cssText = 'position:absolute;left:' + gridX + 'px;top:' + gridY + 'px;' +
      'width:' + size + 'px;height:' + size + 'px;background:' + bgColor + ';' +
      'border-radius:8px;z-index:100;display:flex;align-items:center;justify-content:center;' +
      'font-size:' + Math.floor(size * 0.65) + 'px;box-shadow:0 2px 8px rgba(0,0,0,.4);' +
      'transition:left .05s linear,top .05s linear;background-size:cover;background-position:center;';
    if (image) {
      if (/^https?:|^\/|\.(png|jpg|jpeg|gif|webp|svg)$/i.test(image)) {
        el.style.background = 'transparent url(' + image + ') center/cover no-repeat';
      } else el.textContent = image;
    } else if (EMOJIS[clean]) el.textContent = EMOJIS[clean];
    getContainer().appendChild(el);
    // Apply character sprite if registered
    if (charDef) {
      const frame = charDef.idle || charDef.walk || '';
      if (frame && !image) {
        el.textContent = frame;
      }
      if (charDef.size) {
        el.style.width = charDef.size + 'px';
        el.style.height = charDef.size + 'px';
        el.style.fontSize = Math.floor(charDef.size * 0.65) + 'px';
      }
    }

    entities.set(id, {
      type: clean, el, args, destroyed: false,
      charDef: charDef || null,
      facing: 'idle',
      lastFrameTime: 0,
    });
    return id;
  };

  // ─── Hit reaction — flash + shake ───
  window.hitReact = function(target, damage) {
    const clean = String(target).replace(/^#/, '');
    for (const [id, e] of entities) {
      if (e.type !== clean || e.destroyed) continue;

      // Flash red
      const orig = e.el.style.boxShadow;
      e.el.style.transition = 'box-shadow .1s';
      e.el.style.boxShadow = '0 0 0 3px #ff453a, 0 0 20px rgba(255,69,58,.9)';
      setTimeout(() => { if (e.el) e.el.style.boxShadow = orig; }, 180);

      // Shake
      const left = parseFloat(e.el.style.left) || 0;
      const shake = () => {
        e.el.style.left = (left + (Math.random() * 10 - 5)) + 'px';
      };
      let count = 0;
      const iv = setInterval(() => {
        shake();
        if (++count > 5) { clearInterval(iv); e.el.style.left = left + 'px'; }
      }, 25);

      // Swap to hit frame
      if (e.charDef && e.charDef.hit) {
        const prev = e.el.textContent;
        e.el.textContent = e.charDef.hit;
        setTimeout(() => {
          if (e.el && e.charDef) {
            e.el.textContent = e.charDef.idle || e.charDef.walk || prev;
          }
        }, 400);
      }

      // Screen shake
      try {
        const c = getContainer();
        const origTransform = c.style.transform;
        let scount = 0;
        const shakeIv = setInterval(() => {
          c.style.transform = 'translate(' + (Math.random() * 6 - 3) + 'px,' +
                                            (Math.random() * 6 - 3) + 'px)';
          if (++scount > 4) { clearInterval(shakeIv); c.style.transform = origTransform; }
        }, 30);
      } catch (err) {}

      return;
    }
  };

  window.__meelSpawnCount = 0;
  window.spawnV2 = function(name, type, props) {
    const clean = String(name).replace(/^#/, '');
    const el = document.querySelector('[data-meel-name="' + clean + '"]');
    if (!el) { console.warn('[meeEL v2] no element for', clean); return null; }

    el.classList.add('meel-entity');
    const kind = el.dataset.meelKind || type;
    el.dataset.meelType = kind;
    const id = el.id || ('meel-v2-' + clean);
    if (!el.id) el.id = id;

    entities.set(id, {
      type: kind,
      el: el,
      args: [],
      destroyed: false,
      charDef: null,
      facing: 'idle',
      lastFrameTime: 0,
      v2Name: clean,
      movedByRuntime: false,
    });
    console.log('[meeEL v2] registered', clean, 'as', type);
    return id;
  };

  window.destroy = function(t) {
    if (!t) return;
    const c = String(t).replace(/^#/, '');
    for (const [id, e] of entities) if (e.type === c && !e.destroyed) {
      e.destroyed = true; e.el.remove(); entities.delete(id); return;
    }
  };

  // ═══════════════════════════════════════════════════════
  // MAGIC BLOCKS — auto-hydrated
  // ═══════════════════════════════════════════════════════
  const MAGIC_NAMES = ['score-pad','score-card','health-pad','health-bar','timer-pad','timer-display','high-score','game-over-screen','win-screen'];

  function hydrateMagic() {
    // Auto-detect by ID: any element whose ID ends with a magic name
    MAGIC_NAMES.forEach(name => {
      document.querySelectorAll('[id="' + name + '"],[id$="-' + name + '"]').forEach(el => {
        if (!el.dataset.meelMagic) el.dataset.meelMagic = name;
      });
    });

    document.querySelectorAll('[data-meel-magic]').forEach(el => {
      if (el.dataset.hydrated) return;
      el.dataset.hydrated = '1';
      const kind = el.dataset.meelMagic;

      // Full-screen overlays for game-over / win
      if (kind === 'game-over-screen' || kind === 'win-screen') {
        el.style.cssText =
          'position:absolute;inset:0;background:rgba(0,0,0,.85);' +
          'color:' + (kind === 'win-screen' ? '#30d158' : '#ff453a') + ';' +
          'display:none;align-items:center;justify-content:center;' +
          'font-size:48px;font-weight:bold;z-index:500;' +
          'font-family:system-ui;text-align:center;padding:20px;';
      }

      // Apply magic positioning if not already styled
      if (kind !== 'game-over-screen' && kind !== 'win-screen') {
        const s = el.style;
        if (!s.position || s.position === 'static') s.position = 'absolute';
        if (!s.zIndex) s.zIndex = '200';
        if (!s.background) s.background = 'rgba(0,0,0,.75)';
        if (!s.color) s.color = '#fff';
        if (!s.padding) s.padding = '8px 12px';
        if (!s.borderRadius) s.borderRadius = '8px';
        if (!s.fontFamily) s.fontFamily = 'ui-monospace, monospace';
        if (!s.fontSize) s.fontSize = '14px';
        if (kind === 'score-pad' || kind === 'score-card') { if (!s.right) s.right = '12px'; if (!s.top) s.top = '12px'; }
        if (kind === 'health-pad' || kind === 'health-bar') { if (!s.right) s.right = '12px'; if (!s.top) s.top = '56px'; }
        if (kind === 'timer-pad' || kind === 'timer-display') { if (!s.right) s.right = '12px'; if (!s.top) s.top = '100px'; }
        if (kind === 'high-score') { if (!s.right) s.right = '12px'; if (!s.top) s.top = '144px'; }
      }
      let lastVal = null;
      const interval = trackId(setInterval(() => {
        if (!document.body.contains(el)) { clearInterval(interval); return; }
        const s = window.state || {};
        let txt = '';
        if (kind === 'score-pad' || kind === 'score-card') {
          txt = '⭐ ' + (s.score || 0);
        } else if (kind === 'health-pad' || kind === 'health-bar') {
          txt = '❤️ ' + Math.max(0, s.health || 0);
        } else if (kind === 'timer-pad' || kind === 'timer-display') {
          txt = '⏱ ' + Math.max(0, s.time_left || 0) + 's';
        } else if (kind === 'high-score') {
          const hs = Math.max(parseInt(el.dataset.highScore || '0'), s.score || 0);
          el.dataset.highScore = String(hs);
          txt = '🏆 ' + hs;
        } else if (kind === 'game-over-screen') {
          if ((s.health !== undefined && s.health <= 0) || (s.time_left !== undefined && s.time_left <= 0)) {
            el.style.display = 'flex';
            el.textContent = el.dataset.msg || '💀 GAME OVER';
          } else el.style.display = 'none';
          return;
        } else if (kind === 'win-screen') {
          const target = parseInt(el.dataset.score || '100');
          if ((s.score || 0) >= target) {
            el.style.display = 'flex';
            el.textContent = el.dataset.msg || '🎉 YOU WIN!';
          } else el.style.display = 'none';
          return;
        }
        if (txt !== lastVal) {
          el.textContent = txt;
          el.style.transform = 'scale(1.15)';
          setTimeout(() => { if (el) el.style.transform = 'scale(1)'; }, 150);
          lastVal = txt;
        }
      }, 100));
    });
  }

  window.show = function(type, msg) {
    if (type === 'message') {
      const t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#222;color:#fff;padding:10px 18px;border-radius:8px;z-index:9999;font-family:system-ui;';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    } else if (type === 'screen') {
      const s = document.createElement('div');
      s.textContent = msg;
      s.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.85);color:#fff;display:flex;align-items:center;justify-content:center;font-size:32px;z-index:9998;font-family:system-ui;';
      document.body.appendChild(s);
    }
  };
  window.hide = t => { const el = document.getElementById(String(t).replace(/^#/, '')); if (el) el.style.display = 'none'; };
  window.open_thing = t => { const el = document.getElementById(String(t).replace(/^#/, '')); if (el) el.style.display = ''; };
  window.close_thing = t => { const el = document.getElementById(String(t).replace(/^#/, '')); if (el) el.style.display = 'none'; };
  window.reverseDirection = () => {};
  window.applyForce = () => {};
  window.loadLevel = (t, a) => console.log('[meeEL] loadLevel:', t, a);
  let paused = false;
  window.pauseGame = () => paused = true;
  window.resumeGame = () => paused = false;

  // Player movement
  const keys = {};
  function getPixelPos(entity) {
    const container = getContainer();
    const cRect = container.getBoundingClientRect();
    const eRect = entity.el.getBoundingClientRect();
    return {
      x: eRect.left - cRect.left,
      y: eRect.top - cRect.top,
      w: eRect.width,
      h: eRect.height,
    };
  }

  function setPixelPos(entity, x, y) {
    if (!entity.movedByRuntime) {
      // First time — clear CSS-induced positioning and switch to pixel mode
      entity.el.style.transform = 'none';
      entity.el.style.bottom = 'auto';
      entity.el.style.right = 'auto';
      entity.el.style.margin = '0';
      entity.movedByRuntime = true;
    }
    entity.el.style.left = x + 'px';
    entity.el.style.top = y + 'px';
    entity.el.style.position = 'absolute';
  }

  function updatePlayer() {
    if (paused) return;
    const player = Array.from(entities.values()).find(e => e.type === 'player' && !e.destroyed);
    if (!player) return;
    const speed = 3;
    let dx = 0, dy = 0;
    if (keys['arrowleft'] || keys['a']) dx -= speed;
    if (keys['arrowright'] || keys['d']) dx += speed;
    if (keys['arrowup'] || keys['w']) dy -= speed;
    if (keys['arrowdown'] || keys['s']) dy += speed;
    if (!dx && !dy) return;

    const container = getContainer();
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const pos = getPixelPos(player);
    const nx = Math.max(0, Math.min(cw - pos.w, pos.x + dx));
    const ny = Math.max(0, Math.min(ch - pos.h, pos.y + dy));
    setPixelPos(player, nx, ny);
  }
  trackId(setInterval(updatePlayer, 16));

  // ─── Enemy AI — chase player ───
  function updateEnemies() {
    if (paused) return;
    const player = Array.from(entities.values()).find(e => e.type === 'player' && !e.destroyed);
    if (!player) return;
    const container = getContainer();
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const now = Date.now();

    for (const e of entities.values()) {
      if (e.destroyed) continue;
      if (e.type !== 'enemy' && e.type !== 'chaser' && e.type !== 'monster') continue;
      if (e.stunnedUntil && now < e.stunnedUntil) continue;

      const pPos = getPixelPos(player);
      const ePos = getPixelPos(e);
      const dx = pPos.x - ePos.x;
      const dy = pPos.y - ePos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2) continue;
      const speed = 0.9;
      const vx = (dx / dist) * speed;
      const vy = (dy / dist) * speed;
      const nx = Math.max(0, Math.min(cw - ePos.w, ePos.x + vx));
      const ny = Math.max(0, Math.min(ch - ePos.h, ePos.y + vy));
      setPixelPos(e, nx, ny);
    }
  }
  trackId(setInterval(updateEnemies, 50));

  // ─── Character frame animation ───
  function animateCharacters() {
    const now = Date.now();
    for (const e of entities.values()) {
      if (e.destroyed || !e.charDef) continue;
      // Determine movement
      const dx = e._lastX === undefined ? 0 : (parseFloat(e.el.style.left) - e._lastX);
      const dy = e._lastY === undefined ? 0 : (parseFloat(e.el.style.top) - e._lastY);
      e._lastX = parseFloat(e.el.style.left);
      e._lastY = parseFloat(e.el.style.top);
      const moving = Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5;

      if (moving && e.charDef.walk && e.el.textContent !== e.charDef.hit) {
        e.el.textContent = e.charDef.walk;
        e.facing = 'walk';
      } else if (!moving && e.charDef.idle && e.el.textContent !== e.charDef.hit) {
        if (e.facing !== 'idle') { e.el.textContent = e.charDef.idle; e.facing = 'idle'; }
      }
    }
  }
  trackId(setInterval(animateCharacters, 120));

  document.addEventListener('keydown', e => {
    const k = e.key.toLowerCase(); keys[k] = true;
    if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  });
  document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  // ─── Virtual Joystick ───
  let joyActive = false;
  let joyStart = { x: 0, y: 0 };
  let joyEl = null, joyBase = null, joyStick = null;

  function ensureJoystick() {
    if (joyEl && joyEl.parentNode) return joyEl;
    joyEl = document.createElement('div');
    joyEl.id = 'meel-joystick';
    joyEl.style.cssText =
      'position:fixed;width:120px;height:120px;border-radius:50%;' +
      'background:rgba(10,132,255,.18);border:2px solid rgba(10,132,255,.5);' +
      'display:none;pointer-events:none;z-index:9999;' +
      'transition:opacity .15s;';
    joyBase = document.createElement('div');
    joyBase.style.cssText =
      'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);' +
      'width:40px;height:40px;border-radius:50%;background:rgba(10,132,255,.65);' +
      'box-shadow:0 2px 8px rgba(0,0,0,.4);';
    joyEl.appendChild(joyBase);
    document.body.appendChild(joyEl);
    return joyEl;
  }

  function joystickStart(x, y) {
    showJoyBadge('touch!', '#ff9f0a');
    ensureJoystick();
    joyActive = true;
    joyStart = { x, y };
    joyEl.style.left = (x - 60) + 'px';
    joyEl.style.top  = (y - 60) + 'px';
    joyEl.style.display = 'block';
    joyBase.style.transform = 'translate(-50%,-50%)';
  }

  const joyDirState = { up: false, down: false, left: false, right: false };
  function joystickMove(x, y) {
    if (!joyActive) return;
    const dx = x - joyStart.x;
    const dy = y - joyStart.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 45;
    const clamped = Math.min(dist, maxDist);
    const angle = Math.atan2(dy, dx);
    const ox = Math.cos(angle) * clamped;
    const oy = Math.sin(angle) * clamped;
    if (joyBase) joyBase.style.transform =
      'translate(calc(-50% + ' + ox + 'px), calc(-50% + ' + oy + 'px))';

    // Direction detection
    const dead = 8;
    const dl = 0.3;
    let dirUp = false, dirDown = false, dirLeft = false, dirRight = false;
    if (dist > dead) {
      const nx = dx / dist, ny = dy / dist;
      dirLeft  = nx < -dl;
      dirRight = nx >  dl;
      dirUp    = ny < -dl;
      dirDown  = ny >  dl;
    }
    keys['arrowleft'] = dirLeft;
    keys['arrowright'] = dirRight;
    keys['arrowup'] = dirUp;
    keys['arrowdown'] = dirDown;

    // Fire directional events on transitions
    const fireOnEnter = (dir, now) => {
      if (now && !joyDirState[dir]) {
        joyDirState[dir] = true;
        showJoyBadge('joystick:' + dir, '#ff453a');
        try { triggerEvent('joystick:' + dir); } catch (e) {}
      } else if (!now) {
        joyDirState[dir] = false;
      }
    };
    fireOnEnter('up', dirUp);
    fireOnEnter('down', dirDown);
    fireOnEnter('left', dirLeft);
    fireOnEnter('right', dirRight);
  }

  function joystickEnd() {
    joyActive = false;
    if (joyEl) joyEl.style.display = 'none';
    keys['arrowleft'] = keys['arrowright'] = keys['arrowup'] = keys['arrowdown'] = false;
  }

  // Attach to iframe's document — works everywhere inside the iframe
  function attachJoystick() {
    const doc = document; // this is the iframe's document
    let activeId = null;

    doc.addEventListener('touchstart', e => {
      window.__meelTouchCount = (window.__meelTouchCount || 0) + 1;
      try {
        let b = doc.getElementById('__meelTouchBadge');
        if (!b) {
          b = doc.createElement('div');
          b.id = '__meelTouchBadge';
          b.style.cssText = 'position:fixed;top:4px;right:4px;background:#30d158;color:#fff;font:10px monospace;padding:2px 6px;border-radius:3px;z-index:99999;';
          doc.body.appendChild(b);
        }
        b.textContent = 'touch: ' + window.__meelTouchCount;
      } catch (err) {}
      const t = e.target;
      if (t && (t.tagName === 'BUTTON' || t.tagName === 'INPUT' || t.tagName === 'A')) return;
      const touch = e.touches[0];
      if (!touch) return;
      activeId = touch.identifier;
      joystickStart(touch.clientX, touch.clientY);
      // No preventDefault — allows scrolling outside joystick if needed
    }, { passive: true });

    doc.addEventListener('touchmove', e => {
      if (activeId === null) return;
      for (const t of Array.from(e.touches)) {
        if (t.identifier === activeId) {
          joystickMove(t.clientX, t.clientY);
          break;
        }
      }
    }, { passive: true });

    doc.addEventListener('touchend', e => {
      if (activeId === null) return;
      let stillActive = false;
      for (const t of Array.from(e.touches)) {
        if (t.identifier === activeId) { stillActive = true; break; }
      }
      if (!stillActive) { joystickEnd(); activeId = null; }
    }, { passive: true });

    doc.addEventListener('touchcancel', () => { joystickEnd(); activeId = null; }, { passive: true });

    // Mouse for desktop
    let mouseDown = false;
    doc.addEventListener('mousedown', e => {
      if (e.target.closest && e.target.closest('button,a,input,textarea')) return;
      mouseDown = true;
      joystickStart(e.clientX, e.clientY);
    });
    doc.addEventListener('mousemove', e => {
      if (mouseDown) joystickMove(e.clientX, e.clientY);
    });
    doc.addEventListener('mouseup', () => {
      if (mouseDown) { joystickEnd(); mouseDown = false; }
    });

    console.log('[meeEL v2] joystick attached to iframe document');
    window.__meelJoystickAttached = true;
  }

  function showJoyBadge(txt, color) {
    try {
      let b = document.getElementById('__meelJoyBadge');
      if (!b) {
        b = document.createElement('div');
        b.id = '__meelJoyBadge';
        b.style.cssText = 'position:fixed;top:4px;left:4px;background:#bf5af2;color:#fff;' +
          'font:11px monospace;padding:3px 8px;border-radius:4px;z-index:99999;';
        document.body.appendChild(b);
      }
      b.textContent = txt;
      if (color) b.style.background = color;
    } catch (e) {}
  }

  window.enableJoystick = function(targetName) {
    if (!window.__meelJoystickAttached) {
      try { attachJoystick(); } catch (e) { console.warn('[meeEL] joy attach:', e); }
    }
    window.__meelJoystickTarget = targetName ? String(targetName).replace(/^#/, '') : '';
    window.__meelControlledType = 'player';
    showJoyBadge('joystick ON', '#30d158');
    console.log('[meeEL v2] joystick enabled', targetName || '(default)');
  };

  function attachMouse() {
    // already handled inside attachJoystick
  }

  // Collision
  const activePairs = new Set();
  const rectsOverlap = (a, b) => !(a.right < b.left || b.right < a.left || a.bottom < b.top || b.bottom < a.top);
  const pairKey = (a, b) => a.type < b.type ? a.type + '|' + b.type : b.type + '|' + a.type;
  function checkCollisions() {
    if (paused) return;
    const list = Array.from(entities.values()).filter(e => !e.destroyed);
    const cur = new Set();
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      if (rectsOverlap(a.el.getBoundingClientRect(), b.el.getBoundingClientRect())) {
        const k = pairKey(a, b); cur.add(k);
        if (!activePairs.has(k)) {
          activePairs.add(k);
          // Fire many name variants so user-written names match
          const aName = a.v2Name || a.type;
          const bName = b.v2Name || b.type;
          const aType = a.type;
          const bType = b.type;

          // Extract modifier suffix: 'player-hero' → 'hero'
          const aMod = aName.includes('-') ? aName.split('-').pop() : aName;
          const bMod = bName.includes('-') ? bName.split('-').pop() : bName;

          const names = {
            a: [aName, aType, aMod],
            b: [bName, bType, bMod],
          };
          for (const an of names.a) {
            for (const bn of names.b) {
              try { triggerEvent('touches:' + an + ':' + bn); } catch (e) {}
              try { triggerEvent('touches:' + bn + ':' + an); } catch (e) {}
            }
          }
          // v1 compat
          try { triggerEvent('collide:#' + a.type); } catch (e) {}
          try { triggerEvent('collide:#' + b.type); } catch (e) {}
        }
      }
    }
    for (const k of activePairs) if (!cur.has(k)) activePairs.delete(k);
  }
  trackId(setInterval(checkCollisions, 50));

  // ─── v2 helpers ───
  // ─── Live text — refreshed every 100ms ───
  const liveTexts = [];
  window.registerLiveText = function(fn, pos) {
    liveTexts.push({ fn, pos });
  };
  setInterval(function() {
    for (let i = 0; i < liveTexts.length; i++) {
      try {
        const v = liveTexts[i].fn();
        window.showText(v, liveTexts[i].pos);
      } catch (e) {}
    }
  }, 100);

  window.showText = function(text, position) {
    const container = getContainer();
    if (!container) return;
    const pos = (position || 'top').toLowerCase();
    // key based on position — so repeated calls update the same element
    const key = 'pos-' + pos;
    let el = container.querySelector('[data-meel-textkey="' + key + '"]');
    if (!el) {
      el = document.createElement('div');
      el.dataset.meelText = '1';
      el.dataset.meelTextkey = key;
      const styles = [
        'position:absolute',
        'color:#fff',
        'font:bold 16px system-ui',
        'padding:4px 8px',
        'background:rgba(0,0,0,.6)',
        'border-radius:6px',
        'z-index:300',
        'pointer-events:none',
        'white-space:nowrap',
      ];
      if (pos.includes('top left') || pos === 'topleft') {
        styles.push('top:12px', 'left:12px');
      } else if (pos.includes('top right') || pos === 'topright') {
        styles.push('top:12px', 'right:12px');
      } else if (pos.includes('bottom left') || pos === 'bottomleft') {
        styles.push('bottom:12px', 'left:12px');
      } else if (pos.includes('bottom right') || pos === 'bottomright') {
        styles.push('bottom:12px', 'right:12px');
      } else if (pos === 'center' || pos.includes('center')) {
        styles.push('top:50%', 'left:50%', 'transform:translate(-50%,-50%)', 'font-size:28px');
      } else if (pos === 'bottom') {
        styles.push('bottom:12px', 'left:50%', 'transform:translateX(-50%)');
      } else if (pos === 'left') {
        styles.push('left:12px', 'top:50%', 'transform:translateY(-50%)');
      } else if (pos === 'right') {
        styles.push('right:12px', 'top:50%', 'transform:translateY(-50%)');
      } else {
        styles.push('top:12px', 'left:50%', 'transform:translateX(-50%)');
      }
      el.style.cssText = styles.join(';');
      container.appendChild(el);
    }
    const newText = String(text);
    if (el.textContent !== newText) el.textContent = newText;
    return el;
  };

  // Refreshable text (deletes old, adds new)
  window.showTextRefresh = function(key, text, position) {
    let existing = document.querySelector('[data-meel-textkey="' + key + '"]');
    if (existing) existing.remove();
    const el = window.showText(text, position);
    el.dataset.meelTextkey = key;
    return el;
  };

  // ─── Universal add / subtract (works for numbers & lists) ───
  window.addTo = function(target, value) {
    const clean = String(target).replace(/^#/, '');
    const cur = state[clean];
    if (Array.isArray(cur)) {
      cur.push(value);
    } else if (typeof cur === 'object' && cur !== null) {
      // table — ignore
    } else {
      state[clean] = (cur || 0) + value;
    }
  };
  window.subtractFrom = function(target, value) {
    const clean = String(target).replace(/^#/, '');
    const cur = state[clean];
    if (Array.isArray(cur)) {
      const i = cur.indexOf(value);
      if (i >= 0) cur.splice(i, 1);
    } else {
      state[clean] = (cur || 0) - value;
    }
  };
  window.mulTo = function(target, value) {
    const clean = String(target).replace(/^#/, '');
    const cur = state[clean];
    if (typeof cur === 'number') state[clean] = cur * value;
    else state[clean] = (cur || 0) * value;
  };
  window.divFrom = function(target, value) {
    const clean = String(target).replace(/^#/, '');
    const cur = state[clean];
    if (value === 0) { console.warn('[meeEL] division by zero'); return; }
    state[clean] = (typeof cur === 'number' ? cur : 0) / value;
  };

  // ─── List helpers ───
  window.listAdd = function(listName, value) {
    const name = String(listName).replace(/^#/, '');
    if (!Array.isArray(state[name])) state[name] = [];
    state[name].push(value);
    return state[name];
  };
  window.listRemove = function(listName, value) {
    const name = String(listName).replace(/^#/, '');
    if (!Array.isArray(state[name])) return;
    const idx = state[name].indexOf(value);
    if (idx >= 0) state[name].splice(idx, 1);
    return state[name];
  };
  window.listLength = function(listName) {
    const name = String(listName).replace(/^#/, '');
    return Array.isArray(state[name]) ? state[name].length : 0;
  };
  window.listClear = function(listName) {
    const name = String(listName).replace(/^#/, '');
    state[name] = [];
    return state[name];
  };
  window.listGet = function(listName, index) {
    const name = String(listName).replace(/^#/, '');
    return Array.isArray(state[name]) ? state[name][index] : undefined;
  };

  window.flashEntity = function(name) {
    const el = document.querySelector('[data-meel-name="' + name + '"]');
    if (!el) return;
    const orig = el.style.boxShadow;
    el.style.transition = 'box-shadow .1s';
    el.style.boxShadow = '0 0 0 3px #ff453a, 0 0 20px rgba(255,69,58,.9)';
    setTimeout(function() { el.style.boxShadow = orig; }, 180);
  };

  window.moveEntity = function(name, direction, speed) {
    const clean = String(name).replace(/^#/, '');
    for (const e of entities.values()) {
      if (e.v2Name !== clean && e.type !== clean) continue;
      const container = getContainer();
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const pos = getPixelPos(e);
      let dx = 0, dy = 0;
      if (direction === 'left')  dx = -speed;
      if (direction === 'right') dx =  speed;
      if (direction === 'up')    dy = -speed;
      if (direction === 'down')  dy =  speed;
      const nx = Math.max(0, Math.min(cw - pos.w, pos.x + dx));
      const ny = Math.max(0, Math.min(ch - pos.h, pos.y + dy));
      setPixelPos(e, nx, ny);
    }
  };

  window.makeAction = function(name, what) {
    const clean = String(name).replace(/^#/, '');
    for (const e of entities.values()) {
      if (e.v2Name !== clean && e.type !== clean) continue;
      if (what === 'jump') {
        // small bounce
        const pos = getPixelPos(e);
        setPixelPos(e, pos.x, pos.y - 40);
        setTimeout(function() {
          const p2 = getPixelPos(e);
          setPixelPos(e, p2.x, p2.y + 40);
        }, 300);
      }
    }
  };

  window.spawnAuto = function(type, position) {
    console.log('[meeEL v2] spawnAuto', type, 'at', position);
    // For now — reuse existing entity of same type and clone it
    const src = document.querySelector('[data-meel-name="' + type + '"]');
    if (!src) { console.warn('[meeEL v2] no template for', type); return; }
    const clone = src.cloneNode(true);
    const newName = type + '-' + Math.random().toString(36).slice(2, 6);
    clone.dataset.meelName = newName;
    clone.id = 'meel-auto-' + newName;
    // Position based on 'at top' / 'at bottom'
    const container = getContainer();
    const cw = container.clientWidth;
    const ew = src.offsetWidth || 40;
    clone.style.left = (Math.random() * (cw - ew - 40) + 20) + 'px';
    if (position === 'top') clone.style.top = '100px';
    else if (position === 'bottom') clone.style.top = (container.clientHeight - 100) + 'px';
    clone.style.position = 'absolute';
    clone.style.transform = 'none';
    clone.style.bottom = 'auto';
    clone.style.right = 'auto';
    container.appendChild(clone);
    // Register
    const id = clone.id;
    entities.set(id, {
      type: type, el: clone, args: [], destroyed: false,
      charDef: null, facing: 'idle', lastFrameTime: 0,
      v2Name: newName, movedByRuntime: true,
    });
  };

  window.pushEntity = function(name, direction) {
    flashEntity(name);
    // Push existing entity in opposite direction
    for (const e of entities.values()) {
      if (e.v2Name === name || e.type === name) {
        const pos = getPixelPos(e);
        setPixelPos(e, pos.x, Math.max(0, pos.y - 60));
      }
    }
  };

  window.stopGame = function() {
    window.pauseGame();
    show('screen', 'Game Over');
  };

  // ─── Fire touches events on collision ───
  // (patched into checkCollisions below)

  function fireStart() {
    hydrateMagic();
    triggerAll('start');
  }
  if (document.readyState !== 'loading') setTimeout(fireStart, 100);
  else document.addEventListener('DOMContentLoaded', () => setTimeout(fireStart, 100));
})();
