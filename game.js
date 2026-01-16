/**
 * Infinite Jump & Run Platformer
 * Features:
 * - Procedural Level Generator
 * - Double Jump
 * - Dash / Hechtsprung mit kleiner Hitbox
 * - Enge-Lücken-Logik
 */

"use strict";

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const CONFIG = {
  gravity: 0.6,
  jumpForce: 12,
  doubleJumpForce: 10,
  moveSpeed: 4,
  crawlSpeed: 2,
  dashSpeed: 10,
  dashTime: 12,
  groundY: 420,
  segmentWidth: 300
};

const keys = {};
document.addEventListener("keydown", e => keys[e.key.toLowerCase()] = true);
document.addEventListener("keyup", e => keys[e.key.toLowerCase()] = false);

const player = {
  x: 100,
  y: 300,
  w: 40,
  h: 40,
  normalH: 40,
  smallH: 20,
  vx: 0,
  vy: 0,
  onGround: false,
  jumpsLeft: 2,
  isSmall: false,
  dashTimer: 0,
  lives: 3,
  score: 0
};

let cameraX = 0;

let platforms = [
  { x: 0, y: CONFIG.groundY, w: 600, h: 60 }
];

let enemies = [];

/* ---------- Utilities ---------- */
function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

/* ---------- Level Generator ---------- */
function generateSegment(startX) {
  let x = startX;

  for (let i = 0; i < 3; i++) {
    const width = 100 + Math.random() * 120;
    const height = 20;
    const y = 260 + Math.random() * 120;

    platforms.push({ x, y, w: width, h: height });

    if (Math.random() < 0.6) {
      enemies.push({
        x: x + width / 2,
        y: y - 30,
        w: 30,
        h: 30,
        speed: 1.5 + Math.random()
      });
    }

    x += width + 80 + Math.random() * 120;
  }
}

function cleanupWorld() {
  platforms = platforms.filter(p => p.x + p.w > cameraX - 200);
  enemies = enemies.filter(e => e.x + e.w > cameraX - 200);
}

/* ---------- Player ---------- */
function updatePlayer() {
  let speed = player.isSmall ? CONFIG.crawlSpeed : CONFIG.moveSpeed;
  player.vx = 0;

  if (keys["a"]) player.vx = -speed;
  if (keys["d"]) player.vx = speed;

  if ((keys["w"] || keys[" "]) && player.jumpsLeft > 0) {
    player.vy = player.jumpsLeft === 2
      ? -CONFIG.jumpForce
      : -CONFIG.doubleJumpForce;

    player.jumpsLeft--;
    keys["w"] = keys[" "] = false;
  }

  if (keys["shift"] && player.dashTimer === 0) {
    player.dashTimer = CONFIG.dashTime;
    player.isSmall = true;
  }

  if (player.dashTimer > 0) {
    player.vx = CONFIG.dashSpeed;
    player.dashTimer--;
  }

  player.vy += CONFIG.gravity;
  player.x += player.vx;
  player.y += player.vy;

  player.onGround = false;

  for (const p of platforms) {
    if (
      player.x < p.x + p.w &&
      player.x + player.w > p.x &&
      player.y + player.h <= p.y + 10 &&
      player.y + player.h + player.vy >= p.y
    ) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.onGround = true;
      player.jumpsLeft = 2;
    }
  }

  if (player.onGround && !isPlayerInLowSpace()) {
    player.isSmall = false;
  }

  if (player.y > canvas.height) {
    player.lives--;
    resetPlayer();
  }

  cameraX = player.x - 150;
}

function isPlayerInLowSpace() {
  return platforms.some(p =>
    rectsIntersect(
      { x: player.x, y: player.y - 5, w: player.w, h: 5 },
      p
    )
  );
}

function resetPlayer() {
  player.x = cameraX + 100;
  player.y = 300;
  player.vx = 0;
  player.vy = 0;
  player.jumpsLeft = 2;
}

/* ---------- Enemies ---------- */
function updateEnemies() {
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    e.x -= e.speed;

    if (rectsIntersect(player, e)) {
      if (player.vy > 0) {
        enemies.splice(i, 1);
        player.vy = -6;
        player.score += 100;
      } else {
        player.lives--;
        enemies.splice(i, 1);
        resetPlayer();
      }
    }
  }
}

/* ---------- Draw ---------- */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(-cameraX, 0);

  ctx.fillStyle = "#78350f";
  platforms.forEach(p => ctx.fillRect(p.x, p.y, p.w, p.h));

  ctx.fillStyle = "#dc2626";
  enemies.forEach(e => ctx.fillRect(e.x, e.y, e.w, e.h));

  ctx.fillStyle = "#1d4ed8";
  ctx.fillRect(
    player.x,
    player.y,
    player.w,
    player.isSmall ? player.smallH : player.normalH
  );

  ctx.restore();

  ctx.fillStyle = "#020617";
  ctx.fillText(`Leben: ${player.lives}`, 20, 30);
  ctx.fillText(`Score: ${player.score}`, 20, 50);
}

/* ---------- Game Loop ---------- */
function gameLoop() {
  updatePlayer();
  updateEnemies();

  if (platforms[platforms.length - 1].x < cameraX + canvas.width) {
    generateSegment(platforms[platforms.length - 1].x + 200);
  }

  cleanupWorld();
  draw();

  requestAnimationFrame(gameLoop);
}

gameLoop();
