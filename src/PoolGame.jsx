import { useState, useEffect, useRef, useCallback } from "react";

import { World } from "./ecs/world";

import {
  TABLE_W,
  TABLE_H,
  CUSHION,
  PLAY_X,
  PLAY_Y,
  PLAY_W,
  PLAY_H,
  BALL_R,
  FRICTION,
  MIN_SPEED,
  POCKET_R,
  MAX_POWER,
  CUE_MAX_PULL,
} from "./ecs/constants/table";

import { POCKETS } from "./ecs/constants/pockets";
import { BALL_COLORS } from "./ecs/constants/colors";
import { buildRack } from "./ecs/utils/rack";

import {
  dist2,
  resolveCollision,
} from "./ecs/utils/collision";

export default function PoolGame() {
  const canvasRef = useRef(null);

  const worldRef = useRef(new World());

  const stateRef = useRef({
    phase: "aiming",
    mouse: { x: 0, y: 0 },
    dragging: false,
    dragStart: null,
    cueBall: null,
    balls: [],
    pocketed: [],
    message: "",
    messageTimer: 0,
    solids: null,
    currentPlayer: 1,
    scores: [0, 0],
    turn: 0,
    foulNextTurn: false,
  });

  const rafRef = useRef(null);
  const lastTimeRef = useRef(0);

  const [renderTick, setRenderTick] = useState(0);

  const forceRender = useCallback(
    () => setRenderTick(t => t + 1),
    []
  );

  // KEEP YOUR initGame FUNCTION HERE
function initGame() {
  const world = worldRef.current;
  const s = stateRef.current;

  world.clear();

  // Cue ball
  const cueBall = world.createEntity({
    x: TABLE_W * 0.27,
    y: TABLE_H / 2,
    vx: 0,
    vy: 0,
    radius: BALL_R,
    num: 0,
    color: "#f5f0e8",
    pocketed: false,
  });

  s.cueBall = cueBall;

  // Rack balls
  buildRack().forEach(({ x, y, num }) => {
    world.createEntity({
      x,
      y,
      vx: 0,
      vy: 0,
      radius: BALL_R,
      num,
      color: BALL_COLORS[num],
      pocketed: false,
    });
  });

  s.phase = "aiming";
  s.pocketed = [];
  s.message = "Take your shot";
  s.messageTimer = 120;
  s.foulNextTurn = false;
}
  // KEEP YOUR update FUNCTION HERE
function update(dt) {
  const s = stateRef.current;
  const world = worldRef.current;

  if (s.messageTimer > 0) s.messageTimer--;

  const balls = world
    .query("x", "y", "vx", "vy")
    .filter(b => !b.pocketed);

  // only simulate when rolling
  if (s.phase === "rolling") {
    for (let step = 0; step < 3; step++) {
      balls.forEach(b => {
        b.x += b.vx * dt / 3;
        b.y += b.vy * dt / 3;

        // cushions
        if (b.x - BALL_R < PLAY_X) {
          b.x = PLAY_X + BALL_R;
          b.vx *= -0.8;
        }
        if (b.x + BALL_R > PLAY_X + PLAY_W) {
          b.x = PLAY_X + PLAY_W - BALL_R;
          b.vx *= -0.8;
        }
        if (b.y - BALL_R < PLAY_Y) {
          b.y = PLAY_Y + BALL_R;
          b.vy *= -0.8;
        }
        if (b.y + BALL_R > PLAY_Y + PLAY_H) {
          b.y = PLAY_Y + PLAY_H - BALL_R;
          b.vy *= -0.8;
        }
      });

      // collisions
      for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
          if (dist2(balls[i], balls[j]) < (BALL_R * 2) ** 2) {
            resolveCollision(balls[i], balls[j]);
          }
        }
      }
    }

    // friction
    balls.forEach(b => {
      b.vx *= FRICTION;
      b.vy *= FRICTION;

      if (Math.abs(b.vx) < MIN_SPEED) b.vx = 0;
      if (Math.abs(b.vy) < MIN_SPEED) b.vy = 0;
    });

    // stop condition → back to aiming
    const moving = balls.some(
      b => Math.abs(b.vx) > 0 || Math.abs(b.vy) > 0
    );

    if (!moving) {
      s.phase = "aiming";
    }
  }
}
  // KEEP YOUR draw FUNCTION HERE
function draw() {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const s = stateRef.current;
  const world = worldRef.current;

  ctx.clearRect(0, 0, TABLE_W, TABLE_H);

  // table
  ctx.fillStyle = "#1a6b3a";
  ctx.fillRect(0, 0, TABLE_W, TABLE_H);

  // balls
  const balls = world.query("x", "y", "num", "color");

  balls.forEach(b => {
    if (b.pocketed) return;

    ctx.beginPath();
    ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = b.color;
    ctx.fill();
  });

  // cue line
  const cue = s.cueBall;
  if (cue && s.phase === "aiming") {
    ctx.beginPath();
    ctx.moveTo(cue.x, cue.y);
    ctx.lineTo(s.mouse.x, s.mouse.y);
    ctx.strokeStyle = "white";
    ctx.stroke();
  }

  // message
  if (s.message && s.messageTimer > 0) {
    ctx.fillStyle = "white";
    ctx.fillText(s.message, 20, 30);
  }
}
  // KEEP YOUR mouse handlers HERE
function getPos(e) {
  const rect = canvasRef.current.getBoundingClientRect();

  const x =
    ((e.touches ? e.touches[0].clientX : e.clientX) -
      rect.left) *
    (TABLE_W / rect.width);

  const y =
    ((e.touches ? e.touches[0].clientY : e.clientY) -
      rect.top) *
    (TABLE_H / rect.height);

  return { x, y };
}

function onMouseDown(e) {
  const s = stateRef.current;
  if (s.phase !== "aiming") return;

  s.dragging = true;
  s.dragStart = getPos(e);
}

function onMouseMove(e) {
  stateRef.current.mouse = getPos(e);
}

function onMouseUp(e) {
  const s = stateRef.current;
  if (!s.dragging) return;

  s.dragging = false;

  const cue = s.cueBall;
  if (!cue) return;

  const pos = getPos(e);

  const dx = cue.x - pos.x;
  const dy = cue.y - pos.y;

  const power = Math.min(
    Math.sqrt(dx * dx + dy * dy) / CUE_MAX_PULL,
    1
  );

  const len = Math.sqrt(dx * dx + dy * dy) || 1;

  cue.vx = (dx / len) * power * MAX_POWER;
  cue.vy = (dy / len) * power * MAX_POWER;

  s.phase = "rolling";
}





  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    function loop(ts) {
      rafRef.current =
        requestAnimationFrame(loop);

      const dt = Math.min(
        (ts - lastTimeRef.current) / 16.67,
        3
      );

      lastTimeRef.current = ts;

      update(dt);
      draw();
    }

    rafRef.current =
      requestAnimationFrame(loop);

    return () =>
      cancelAnimationFrame(
        rafRef.current
      );
  }, []);

  return (
    <div className="pool-game">
<canvas
  ref={canvasRef}
  width={TABLE_W}
  height={TABLE_H}
  onMouseDown={onMouseDown}
  onMouseMove={onMouseMove}
  onMouseUp={onMouseUp}
  onTouchStart={onMouseDown}
  onTouchMove={onMouseMove}
  onTouchEnd={onMouseUp}
/>
    </div>
  );
}