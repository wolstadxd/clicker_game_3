let state = 'start';
let player, coins = [], enemy;
let score = 0, best = 0;
let timeLeft = 30;
const COIN_COUNT = 5;
let coinSound;

function preload() {
  soundFormats('mp3');
  coinSound = loadSound('coin.mp3'); 
}

function setup() {
  createCanvas(720, 420);
  textSize(18);
  best = int(localStorage.getItem('best') || 0);
  initGame();
}

function initGame() {
  player = { x: width / 2, y: height / 2, r: 16, speed: 300 };
  enemy = { x: 0, y: 0, r: 20, speed: 120 }; 

  coins = [];
  for (let i = 0; i < COIN_COUNT; i++) coins.push(spawnCoin());
  
  score = 0;
  timeLeft = 30;
  state = 'start';
}

function draw() {
  background(245);

  if (state === 'start') {
    drawScene();
    drawHUD();
    drawStartOverlay();
    return;
  }

  const dt = deltaTime / 1000;

  if (state === 'play') {
    updatePlayer(dt);
    updateEnemy(dt);
    collectCoinsIfAny();
    updateTimer(dt);
  }

  drawScene();
  drawHUD();

  if (state === 'gameover') drawGameOverOverlay();
}

function drawScene() {
  noStroke();
  for (const c of coins) {
    fill(255, 204, 0);
    circle(c.x, c.y, c.r * 2);
  }
  
  fill(80, 140, 255);
  circle(player.x, player.y, player.r * 2);

  if (state === 'play' || state === 'gameover') {
    fill(255, 50, 50);
    circle(enemy.x, enemy.y, enemy.r * 2);
  }
}

function drawHUD() {
  fill(20);
  textAlign(LEFT, TOP);
  text(`Очки: ${score}`, 10, 10);
  text(`Рекорд: ${best}`, 10, 34);
  
  if (enemy) {
      textSize(20); 
      text(`Швидкість ворога: ${enemy.speed}`, 10, 82);
      textSize(18);
  }

  text(`Час: ${max(0, Math.ceil(timeLeft))} с`, 10, 58);

  textAlign(RIGHT, TOP);
  text(`FPS: ${frameRate().toFixed(0)}`, width - 10, 10);
}

function drawStartOverlay() {
  fill(0, 120);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(24);
  text('Збирач монет + Ворог', width / 2, height / 2 - 40);
  textSize(16);
  text('Тікай від червоного кола!\nНатисни [Space] щоб почати', width / 2, height / 2 + 10);
}

function drawGameOverOverlay() {
  fill(0, 140);
  rect(0, 0, width, height);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(26);
  text('Гру закінчено!', width / 2, height / 2 - 30);
  textSize(18);
  text(`Результат: ${score}\nРекорд: ${best}\n\n[Space] — ще раз   |   [S] — меню`, width / 2, height / 2 + 30);
}

function updatePlayer(dt) {
  let dx = 0, dy = 0;
  if (keyIsDown(LEFT_ARROW)) dx -= 1;
  if (keyIsDown(RIGHT_ARROW)) dx += 1;
  if (keyIsDown(UP_ARROW)) dy -= 1;
  if (keyIsDown(DOWN_ARROW)) dy += 1;

  if (touches.length > 0) {
    const tx = touches[0].x, ty = touches[0].y;
    const vx = tx - player.x, vy = ty - player.y;
    const len = max(1, Math.hypot(vx, vy));
    dx = vx / len; dy = vy / len;
  }

  if (dx !== 0 || dy !== 0) {
    const len = Math.hypot(dx, dy);
    dx /= len; dy /= len;
  }

  player.x += dx * player.speed * dt;
  player.y += dy * player.speed * dt;

  player.x = constrain(player.x, player.r, width - player.r);
  player.y = constrain(player.y, player.r, height - player.r);
}

function updateEnemy(dt) {
  let dx = player.x - enemy.x;
  let dy = player.y - enemy.y;
  let distToPlayer = Math.hypot(dx, dy);

  if (distToPlayer > 0) {
    enemy.x += (dx / distToPlayer) * enemy.speed * dt;
    enemy.y += (dy / distToPlayer) * enemy.speed * dt;
  }

  if (dist(player.x, player.y, enemy.x, enemy.y) < player.r + enemy.r) {
    gameOver();
  }
}

function collectCoinsIfAny() {
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i];
    if (dist(player.x, player.y, c.x, c.y) < player.r + c.r) {
      score++;
      
      if (coinSound && coinSound.isLoaded()) {
        coinSound.play();
      }

      enemy.speed = 120 + Math.floor(score / 5) * 10;

      coins[i] = spawnCoinSafe(); 
    }
  }
}

function updateTimer(dt) {
  timeLeft -= dt;
  if (timeLeft <= 0) {
    timeLeft = 0;
    gameOver();
  }
}

function gameOver() {
  state = 'gameover';
  if (score > best) {
    best = score;
    localStorage.setItem('best', best);
  }
}

function spawnCoin() {
  return {
    x: random(20, width - 20),
    y: random(70, height - 20),
    r: 12
  };
}

function spawnCoinSafe() {
  let c;
  let attempts = 0;
  do {
    c = spawnCoin();
    attempts++;
    if (attempts > 50) break;
  } while (dist(player.x, player.y, c.x, c.y) < player.r + c.r + 20);
  return c;
}

function keyPressed() {
  if (key === ' ' && state === 'start') state = 'play';
  else if (key === ' ' && state === 'gameover') {
    initGame();
    state = 'play';
  } else if ((key === 's' || key === 'S') && state === 'gameover') {
    initGame(); 
  }
}
