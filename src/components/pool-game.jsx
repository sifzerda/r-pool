import { useState, useEffect, useRef, useCallback } from "react";

// ─── Miniplex-style ECS (lightweight inline implementation) ───────────────────
class World {
  constructor() {
    this.entities = [];
    this._nextId = 1;
  }
  createEntity(components = {}) {
    const entity = { id: this._nextId++, ...components };
    this.entities.push(entity);
    return entity;
  }
  destroyEntity(entity) {
    const idx = this.entities.indexOf(entity);
    if (idx !== -1) this.entities.splice(idx, 1);
  }
  query(...keys) {
    return this.entities.filter(e => keys.every(k => k in e));
  }
  clear() {
    this.entities = [];
    this._nextId = 1;
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TABLE_W = 680, TABLE_H = 340;
const CUSHION = 28;
const PLAY_X = CUSHION, PLAY_Y = CUSHION;
const PLAY_W = TABLE_W - CUSHION * 2;
const PLAY_H = TABLE_H - CUSHION * 2;
const BALL_R = 10;
const FRICTION = 0.988;
const MIN_SPEED = 0.18;
const POCKET_R = 14;
const MAX_POWER = 18;
const CUE_MAX_PULL = 80;

// Pocket positions
const POCKETS = [
  { x: PLAY_X + 2, y: PLAY_Y + 2 },
  { x: TABLE_W / 2, y: PLAY_Y - 2 },
  { x: PLAY_X + PLAY_W - 2, y: PLAY_Y + 2 },
  { x: PLAY_X + 2, y: PLAY_Y + PLAY_H - 2 },
  { x: TABLE_W / 2, y: PLAY_Y + PLAY_H + 2 },
  { x: PLAY_X + PLAY_W - 2, y: PLAY_Y + PLAY_H - 2 },
];

// Ball colors: 1-7 solids, 8 black, 9-15 stripes (base color)
const BALL_COLORS = [
  null,
  "#F5C518", // 1 yellow
  "#1B4FD8", // 2 blue
  "#D92B2B", // 3 red
  "#7B2FBE", // 4 purple
  "#E05C00", // 5 orange
  "#1A7A1A", // 6 green
  "#8B1A1A", // 7 maroon
  "#1a1a1a", // 8 black
  "#F5C518", // 9
  "#1B4FD8", // 10
  "#D92B2B", // 11
  "#7B2FBE", // 12
  "#E05C00", // 13
  "#1A7A1A", // 14
  "#8B1A1A", // 15
];

// ─── Rack layout (standard 8-ball triangle) ──────────────────────────────────
function buildRack() {
  const cx = TABLE_W * 0.63, cy = TABLE_H / 2;
  const dx = BALL_R * 2 * 0.87;
  const dy = BALL_R * 2;
  const rows = [
    [1],
    [2, 3],
    [4, 8, 5],
    [6, 7, 9, 10],
    [11, 12, 13, 14, 15],
  ];
  const balls = [];
  rows.forEach((row, r) => {
    row.forEach((num, c) => {
      balls.push({
        x: cx + r * dx,
        y: cy - (row.length - 1) * dy / 2 + c * dy,
        num,
      });
    });
  });
  return balls;
}

// ─── Physics helpers ──────────────────────────────────────────────────────────
function dist2(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function resolveCollision(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d === 0) return;
  const nx = dx / d, ny = dy / d;
  const overlap = BALL_R * 2 - d;
  if (overlap > 0) {
    a.x -= nx * overlap / 2;
    a.y -= ny * overlap / 2;
    b.x += nx * overlap / 2;
    b.y += ny * overlap / 2;
  }
  const dvx = b.vx - a.vx, dvy = b.vy - a.vy;
  const dot = dvx * nx + dvy * ny;
  if (dot >= 0) return;
  a.vx += dot * nx;
  a.vy += dot * ny;
  b.vx -= dot * nx;
  b.vy -= dot * ny;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PoolGame() {
  const canvasRef = useRef(null);
  const worldRef = useRef(new World());
  const stateRef = useRef({
    phase: "aiming", // aiming | rolling | pocketed_cue | game_over
    mouse: { x: 0, y: 0 },
    dragging: false,
    dragStart: null,
    cueBall: null,
    balls: [],
    pocketed: [],
    message: "",
    messageTimer: 0,
    solids: null, // null | "player" | "cpu"
    currentPlayer: 1,
    scores: [0, 0],
    turn: 0,
    foulNextTurn: false,
  });
  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [renderTick, setRenderTick] = useState(0);

  const forceRender = useCallback(() => setRenderTick(t => t + 1), []);

  // ─── Init ──────────────────────────────────────────────────────────────────
  function initGame() {
    const world = worldRef.current;
    world.clear();
    const s = stateRef.current;

    // Cue ball
    const cueBall = world.createEntity({
      x: TABLE_W * 0.27, y: TABLE_H / 2,
      vx: 0, vy: 0,
      radius: BALL_R,
      num: 0,
      color: "#f5f0e8",
      pocketed: false,
    });
    s.cueBall = cueBall;

    // Rack balls
    buildRack().forEach(({ x, y, num }) => {
      world.createEntity({
        x, y, vx: 0, vy: 0,
        radius: BALL_R,
        num,
        color: BALL_COLORS[num],
        pocketed: false,
      });
    });

    s.phase = "aiming";
    s.pocketed = [];
    s.solids = null;
    s.currentPlayer = 1;
    s.scores = [0, 0];
    s.turn = 0;
    s.message = "Take your shot!";
    s.messageTimer = 120;
    s.foulNextTurn = false;
    forceRender();
  }

  useEffect(() => {
    initGame();
  }, []);

  // ─── Game loop ─────────────────────────────────────────────────────────────
  useEffect(() => {
    function loop(ts) {
      rafRef.current = requestAnimationFrame(loop);
      const dt = Math.min((ts - lastTimeRef.current) / 16.67, 3);
      lastTimeRef.current = ts;
      update(dt);
      draw();
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  function update(dt) {
    const s = stateRef.current;
    const world = worldRef.current;
    if (s.phase !== "rolling") return;
    if (s.messageTimer > 0) s.messageTimer--;

    const balls = world.query("x", "y", "vx", "vy").filter(e => !e.pocketed);

    // Physics steps
    for (let step = 0; step < 3; step++) {
      balls.forEach(b => {
        b.x += b.vx * dt / 3;
        b.y += b.vy * dt / 3;

        // Cushion bounce
        if (b.x - BALL_R < PLAY_X) { b.x = PLAY_X + BALL_R; b.vx = Math.abs(b.vx) * 0.82; }
        if (b.x + BALL_R > PLAY_X + PLAY_W) { b.x = PLAY_X + PLAY_W - BALL_R; b.vx = -Math.abs(b.vx) * 0.82; }
        if (b.y - BALL_R < PLAY_Y) { b.y = PLAY_Y + BALL_R; b.vy = Math.abs(b.vy) * 0.82; }
        if (b.y + BALL_R > PLAY_Y + PLAY_H) { b.y = PLAY_Y + PLAY_H - BALL_R; b.vy = -Math.abs(b.vy) * 0.82; }
      });

      // Ball-ball collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          const d2 = dist2(balls[i], balls[j]);
          if (d2 < (BALL_R * 2) * (BALL_R * 2)) {
            resolveCollision(balls[i], balls[j]);
          }
        }
      }
    }

    // Friction
    balls.forEach(b => {
      b.vx *= FRICTION;
      b.vy *= FRICTION;
      const spd = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (spd < MIN_SPEED) { b.vx = 0; b.vy = 0; }
    });

    // Pocket detection
    const allBalls = world.query("x", "y", "num").filter(e => !e.pocketed);
    allBalls.forEach(b => {
      POCKETS.forEach(p => {
        const dx = b.x - p.x, dy = b.y - p.y;
        if (dx * dx + dy * dy < POCKET_R * POCKET_R) {
          b.pocketed = true;
          b.vx = 0; b.vy = 0;
          s.pocketed.push(b.num);
          handlePocketed(b);
        }
      });
    });

    // Check if all stopped
    const moving = balls.filter(b => !b.pocketed && (Math.abs(b.vx) > 0.01 || Math.abs(b.vy) > 0.01));
    if (moving.length === 0) {
      endTurn();
    }
  }

  function handlePocketed(ball) {
    const s = stateRef.current;
    if (ball.num === 0) {
      // Cue ball pocketed = foul
      s.message = "Scratch! Foul!";
      s.messageTimer = 120;
      s.foulNextTurn = true;
      return;
    }
    if (ball.num === 8) {
      // 8-ball pocketed
      const remaining = worldRef.current.query("num").filter(e => !e.pocketed && e.num !== 8 && e.num !== 0);
      const playerBalls = s.solids === "player" ? remaining.filter(e => e.num <= 7) : remaining.filter(e => e.num >= 9);
      if (playerBalls.length === 0) {
        s.message = "🎱 8-Ball Potted! Player wins!";
        s.phase = "game_over";
      } else {
        s.message = "Early 8-ball! Foul - Opponent wins!";
        s.phase = "game_over";
      }
      return;
    }

    // Assign solids/stripes
    if (!s.solids) {
      if (ball.num <= 7) {
        s.solids = "player";
        s.message = `Player 1: Solids (1-7)  Player 2: Stripes (9-15)`;
      } else {
        s.solids = "stripes";
        s.message = `Player 1: Stripes (9-15)  Player 2: Solids (1-7)`;
      }
      s.messageTimer = 180;
    }

    const isP1 = s.currentPlayer === 1;
    const p1Solid = s.solids === "player";
    const ballIsMine = isP1
      ? (p1Solid ? ball.num <= 7 : ball.num >= 9)
      : (p1Solid ? ball.num >= 9 : ball.num <= 7);

    if (ballIsMine) {
      s.scores[s.currentPlayer - 1]++;
    }
  }

  function endTurn() {
    const s = stateRef.current;
    if (s.phase === "game_over") return;

    if (s.foulNextTurn || s.cueBall?.pocketed) {
      // Place cue ball back
      if (s.cueBall) {
        s.cueBall.pocketed = false;
        s.cueBall.x = TABLE_W * 0.27;
        s.cueBall.y = TABLE_H / 2;
        s.cueBall.vx = 0;
        s.cueBall.vy = 0;
      }
      s.foulNextTurn = false;
    }

    // Check win
    const remaining = worldRef.current.query("num").filter(e => !e.pocketed && e.num !== 0);
    if (remaining.length === 0) {
      s.message = "All balls pocketed! Game over!";
      s.phase = "game_over";
      return;
    }

    s.currentPlayer = s.currentPlayer === 1 ? 2 : 1;
    s.phase = "aiming";
    s.turn++;
    if (!s.message || s.messageTimer <= 0) {
      s.message = `Player ${s.currentPlayer}'s turn`;
      s.messageTimer = 90;
    }
  }

  // ─── Shoot ─────────────────────────────────────────────────────────────────
  function shoot(dx, dy) {
    const s = stateRef.current;
    if (s.phase !== "aiming" || !s.cueBall || s.cueBall.pocketed) return;
    const power = Math.min(Math.sqrt(dx * dx + dy * dy) / CUE_MAX_PULL, 1);
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    s.cueBall.vx = (dx / len) * power * MAX_POWER;
    s.cueBall.vy = (dy / len) * power * MAX_POWER;
    s.phase = "rolling";
    s.message = "";
  }

  // ─── Canvas input ──────────────────────────────────────────────────────────
  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = TABLE_W / rect.width;
    const scaleY = TABLE_H / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function onMouseDown(e) {
    const s = stateRef.current;
    if (s.phase !== "aiming") return;
    const pos = getPos(e);
    s.dragging = true;
    s.dragStart = pos;
    s.mouse = pos;
  }

  function onMouseMove(e) {
    const s = stateRef.current;
    const pos = getPos(e);
    s.mouse = pos;
  }

  function onMouseUp(e) {
    const s = stateRef.current;
    if (!s.dragging || s.phase !== "aiming") return;
    s.dragging = false;
    const cue = s.cueBall;
    if (!cue) return;
    // Shoot in direction FROM mouse TO cue (pull-back mechanic)
    const dx = cue.x - s.mouse.x;
    const dy = cue.y - s.mouse.y;
    if (Math.sqrt(dx * dx + dy * dy) > 5) shoot(dx, dy);
  }

  // ─── Draw ──────────────────────────────────────────────────────────────────
  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const s = stateRef.current;
    const world = worldRef.current;

    ctx.clearRect(0, 0, TABLE_W, TABLE_H);

    // Table felt
    const feltGrad = ctx.createLinearGradient(0, 0, TABLE_W, TABLE_H);
    feltGrad.addColorStop(0, "#1a6b3a");
    feltGrad.addColorStop(1, "#145c30");
    ctx.fillStyle = feltGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, TABLE_W, TABLE_H, 14);
    ctx.fill();

    // Cushion border
    ctx.strokeStyle = "#5c3a1e";
    ctx.lineWidth = CUSHION;
    ctx.strokeRect(CUSHION / 2, CUSHION / 2, TABLE_W - CUSHION, TABLE_H - CUSHION);

    // Wood rail
    ctx.strokeStyle = "#7a4a20";
    ctx.lineWidth = 2;
    ctx.strokeRect(CUSHION / 2 - 1, CUSHION / 2 - 1, TABLE_W - CUSHION + 2, TABLE_H - CUSHION + 2);
    ctx.strokeRect(2, 2, TABLE_W - 4, TABLE_H - 4);

    // Play surface felt pattern (subtle diamonds)
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = "#000";
    for (let px = PLAY_X + 40; px < PLAY_X + PLAY_W; px += 80) {
      for (let py = PLAY_Y + 40; py < PLAY_Y + PLAY_H; py += 60) {
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Center line (dotted)
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 8]);
    ctx.beginPath();
    ctx.moveTo(TABLE_W / 2, PLAY_Y);
    ctx.lineTo(TABLE_W / 2, PLAY_Y + PLAY_H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Baulk line
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(TABLE_W * 0.27, PLAY_Y);
    ctx.lineTo(TABLE_W * 0.27, PLAY_Y + PLAY_H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Pockets
    POCKETS.forEach(p => {
      // Pocket shadow
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R + 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_R, 0, Math.PI * 2);
      const pg = ctx.createRadialGradient(p.x, p.y, 1, p.x, p.y, POCKET_R);
      pg.addColorStop(0, "#111");
      pg.addColorStop(1, "#000");
      ctx.fillStyle = pg;
      ctx.fill();
    });

    // Balls
    const allBalls = world.query("x", "y", "num", "color").filter(e => !e.pocketed);
    allBalls.forEach(b => {
      drawBall(ctx, b);
    });

    // Cue stick & aim line
    const cue = s.cueBall;
    if (cue && !cue.pocketed && s.phase === "aiming") {
      const mx = s.mouse.x, my = s.mouse.y;
      const dx = cue.x - mx, dy = cue.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pull = Math.min(dist, CUE_MAX_PULL);
      const power = pull / CUE_MAX_PULL;
      const nx = dist > 0 ? dx / dist : 1;
      const ny = dist > 0 ? dy / dist : 0;

      // Aim trajectory line
      ctx.save();
      ctx.strokeStyle = `rgba(255,255,255,${0.15 + power * 0.2})`;
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 10]);
      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(cue.x + nx * 120, cue.y + ny * 120);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // Cue stick
      const stickStart = 12 + pull * 0.6;
      const stickLen = 140;
      const x1 = cue.x - nx * stickStart;
      const y1 = cue.y - ny * stickStart;
      const x2 = cue.x - nx * (stickStart + stickLen);
      const y2 = cue.y - ny * (stickStart + stickLen);

      ctx.save();
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, "#f5e0c0");
      grad.addColorStop(0.15, "#d4a55a");
      grad.addColorStop(0.5, "#8b5e2a");
      grad.addColorStop(1, "#5c3a10");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Tip
      ctx.strokeStyle = "#c8a86a";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 - nx * 8, y1 - ny * 8);
      ctx.stroke();

      // Power indicator
      if (pull > 8) {
        ctx.strokeStyle = power > 0.7 ? "#ff4444" : power > 0.4 ? "#ffaa00" : "#44ff88";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        const barX = x2 - ny * 12, barY = y2 + nx * 12;
        ctx.beginPath();
        ctx.moveTo(barX, barY);
        ctx.lineTo(barX - nx * stickLen * power, barY - ny * stickLen * power);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Message overlay
    if (s.message && s.messageTimer > 0) {
      const alpha = Math.min(s.messageTimer / 30, 1);
      ctx.save();
      ctx.globalAlpha = alpha * 0.88;
      ctx.fillStyle = "rgba(10,20,10,0.85)";
      const tw = ctx.measureText(s.message).width + 40;
      ctx.roundRect(TABLE_W / 2 - tw / 2, TABLE_H / 2 - 18, tw, 36, 8);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#f0e8d0";
      ctx.font = "bold 14px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.message, TABLE_W / 2, TABLE_H / 2);
      ctx.restore();
    }

    // Game over overlay
    if (s.phase === "game_over") {
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, TABLE_W, TABLE_H);
      ctx.fillStyle = "#f5e8c0";
      ctx.font = "bold 26px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(s.message, TABLE_W / 2, TABLE_H / 2 - 20);
      ctx.font = "16px 'Georgia', serif";
      ctx.fillStyle = "#aae0aa";
      ctx.fillText("Click to play again", TABLE_W / 2, TABLE_H / 2 + 20);
      ctx.restore();
    }
  }

  function drawBall(ctx, b) {
    const { x, y, num, color } = b;

    // Shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + 2, y + 3, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fill();
    ctx.restore();

    // Ball body
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    const g = ctx.createRadialGradient(x - 3, y - 3, 1, x, y, BALL_R);

    if (num === 0) {
      g.addColorStop(0, "#fffdf5");
      g.addColorStop(0.6, "#f0ead8");
      g.addColorStop(1, "#c8bfa8");
    } else if (num >= 9) {
      // Stripe: white base
      g.addColorStop(0, "#f8f5ee");
      g.addColorStop(1, "#d8d3c8");
      ctx.fillStyle = g;
      ctx.fill();

      // Stripe band
      ctx.save();
      ctx.clip();
      ctx.fillStyle = color;
      ctx.fillRect(x - BALL_R, y - BALL_R * 0.45, BALL_R * 2, BALL_R * 0.9);
      ctx.restore();

      // Re-init gradient for sheen
      ctx.beginPath();
      ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
      const sheen = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, BALL_R);
      sheen.addColorStop(0, "rgba(255,255,255,0.35)");
      sheen.addColorStop(0.4, "rgba(255,255,255,0.0)");
      ctx.fillStyle = sheen;
      ctx.fill();

      // Number circle
      ctx.beginPath();
      ctx.arc(x, y, BALL_R * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();
    } else {
      g.addColorStop(0, lighten(color, 50));
      g.addColorStop(0.6, color);
      g.addColorStop(1, darken(color, 40));
    }

    if (num === 0 || num < 9) {
      ctx.fillStyle = g;
      ctx.fill();
    }

    // Sheen for solid balls
    if (num < 9 && num !== 0) {
      ctx.beginPath();
      ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
      const sheen = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, BALL_R);
      sheen.addColorStop(0, "rgba(255,255,255,0.38)");
      sheen.addColorStop(0.35, "rgba(255,255,255,0.0)");
      ctx.fillStyle = sheen;
      ctx.fill();

      // Number dot
      ctx.beginPath();
      ctx.arc(x, y, BALL_R * 0.42, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fill();
    }

    // Border
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.25)";
    ctx.lineWidth = 0.5;
    ctx.stroke();

    // Number
    if (num > 0) {
      ctx.fillStyle = num === 8 ? "rgba(255,255,255,0.9)" : "#222";
      ctx.font = `bold ${BALL_R * 0.75}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(num, x, y + 0.5);
    }

    ctx.restore();
  }

  function lighten(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.min(255, r + amt)},${Math.min(255, g + amt)},${Math.min(255, b + amt)})`;
  }
  function darken(hex, amt) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
  }

  // ─── Canvas click for game over ────────────────────────────────────────────
  function handleCanvasClick() {
    if (stateRef.current.phase === "game_over") {
      initGame();
    }
  }

  // ─── Scoreboard data ───────────────────────────────────────────────────────
  const s = stateRef.current;
  const pocketed = s.pocketed || [];
  const p1Solids = s.solids === "player";
  const p1Balls = pocketed.filter(n => p1Solids ? n <= 7 : n >= 9);
  const p2Balls = pocketed.filter(n => p1Solids ? n >= 9 : n <= 7);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      gap: "12px", padding: "16px 8px",
      fontFamily: "'Georgia', serif",
      background: "var(--color-background-tertiary)",
      minHeight: "100vh"
    }}>
      <h2 className="sr-only">2D 8-Ball Pool Game</h2>

      {/* Header */}
      <div style={{ display: "flex", gap: "24px", alignItems: "center", width: "100%", maxWidth: TABLE_W }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            padding: "6px 16px", borderRadius: "var(--border-radius-md)",
            background: s.currentPlayer === 1 ? "rgba(250,200,80,0.18)" : "transparent",
            border: s.currentPlayer === 1 ? "1px solid rgba(250,200,80,0.5)" : "1px solid transparent",
            transition: "all 0.3s"
          }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>PLAYER 1</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {s.solids === null ? "—" : p1Solids ? "Solids (1-7)" : "Stripes (9-15)"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p1Balls.length} potted</div>
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, color: "var(--color-text-primary)" }}>🎱</div>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>8-BALL POOL</div>
        </div>

        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{
            padding: "6px 16px", borderRadius: "var(--border-radius-md)",
            background: s.currentPlayer === 2 ? "rgba(250,200,80,0.18)" : "transparent",
            border: s.currentPlayer === 2 ? "1px solid rgba(250,200,80,0.5)" : "1px solid transparent",
            transition: "all 0.3s"
          }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 2 }}>PLAYER 2</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--color-text-primary)" }}>
              {s.solids === null ? "—" : !p1Solids ? "Solids (1-7)" : "Stripes (9-15)"}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{p2Balls.length} potted</div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        width: "100%", maxWidth: TABLE_W,
        borderRadius: 12, overflow: "hidden",
        border: "3px solid #5c3a1e",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.05)",
        cursor: s.phase === "aiming" ? "crosshair" : s.phase === "game_over" ? "pointer" : "default"
      }}>
        <canvas
          ref={canvasRef}
          width={TABLE_W}
          height={TABLE_H}
          style={{ display: "block", width: "100%", height: "auto", touchAction: "none" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onMouseDown}
          onTouchMove={onMouseMove}
          onTouchEnd={onMouseUp}
          onClick={handleCanvasClick}
        />
      </div>

      {/* Instructions */}
      <div style={{
        fontSize: 12, color: "var(--color-text-secondary)",
        textAlign: "center", maxWidth: TABLE_W
      }}>
        Click and drag away from the cue ball to aim • Release to shoot • Drag further for more power
      </div>

      {/* New Game button */}
      <button
        onClick={initGame}
        style={{
          padding: "8px 24px", fontSize: 13,
          cursor: "pointer", fontFamily: "inherit"
        }}
      >
        New Game
      </button>
    </div>
  );
}
