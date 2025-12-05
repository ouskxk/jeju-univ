// =============================
// 이미지 로더
// =============================
function loadTexture(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = path;
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지 로드 실패: " + path));
  });
}

// =============================
// 전역 상태 변수
// =============================
let enemies = [];
let lasers = [];
let enemyLasers = [];
let explosions = [];
let items = [];
let particles = [];
let keys = {};

// 게임 상태 관리
let score = 0;
let lives = 3;
let isGameOver = false;
let gameWon = false;
let stage = 1;
let combo = 0;
let maxCombo = 0;

// 플레이어 능력
let hasShield = false;
let shieldDuration = 0;
let chargeLevel = 0;
let maxCharge = 100;
let meteorCount = 2;
let isDamaged = false;
let damageTimer = 0;

// 공격 쿨타임
let lastShotTime = 0;
const SHOT_DELAY = 150;

// 보스 관련 변수
let boss = null;
let isBossStage = false;
let bossAttackTimer = 0;

// 배경 별 효과
let stars = [];

// 자원(이미지) 저장
let canvas, ctx;
let playerImg, playerLeftImg, playerRightImg, playerDamagedImg;
let enemyImg, ufoImg;
let laserImg, laserGreenImg, laserGreenShotImg, laserRedShotImg;
let lifeImg, shieldImg, meteorBigImg, meteorSmallImg;
let backgroundImg;

let player = {};

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  // =============================
  // 이미지 로드
  // =============================
  try {
    // 플레이어
    playerLeftImg = await loadTexture("./assets/playerLeft.png");
    playerRightImg = await loadTexture("./assets/playerRight.png");
    playerDamagedImg = await loadTexture("./assets/playerDamaged.png");
    playerImg = playerLeftImg;

    // 적
    enemyImg = await loadTexture("./assets/enemyUFO.png");
    ufoImg = await loadTexture("./assets/enemyUFO.png");
    
    // 레이저
    laserImg = await loadTexture("./assets/laserRed.png");
    laserGreenImg = await loadTexture("./assets/laserGreen.png");
    laserGreenShotImg = await loadTexture("./assets/laserGreenShot.png");
    laserRedShotImg = await loadTexture("./assets/laserRedShot.png");
    
    // 아이템
    lifeImg = await loadTexture("./assets/life.png");
    shieldImg = await loadTexture("./assets/shield.png");
    meteorBigImg = await loadTexture("./assets/meteorBig.png");
    meteorSmallImg = await loadTexture("./assets/meteorSmall.png");
    
    // 배경
    backgroundImg = await loadTexture("./assets/Background.png");
  } catch (err) {
    console.error(err);
    alert("이미지 로드 실패! assets 폴더를 확인해주세요.");
  }

  initStars();
  resetGame();

  // 키 입력 이벤트
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    
    if (isGameOver && e.key === "Enter") {
      resetGame();
    }
    
    // Q키로 메테오 필살기
    if ((e.key === "q" || e.key === "Q") && !isGameOver) {
      if (meteorCount > 0) {
        useMeteor();
      }
    }
  });
  
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    
    // 차지샷 발사
    if (e.key === " " && chargeLevel >= 50 && !isGameOver) {
      fireChargedShot();
    }
  });

  requestAnimationFrame(update);
};

// =============================
// 배경 별 초기화
// =============================
function initStars() {
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2,
      speed: Math.random() * 2 + 1
    });
  }
}

// =============================
// 게임 초기화
// =============================
function resetGame() {
  score = 0;
  lives = 3;
  isGameOver = false;
  gameWon = false;
  stage = 1;
  combo = 0;
  maxCombo = 0;
  lasers = [];
  enemyLasers = [];
  explosions = [];
  items = [];
  particles = [];
  lastShotTime = 0;
  
  boss = null;
  isBossStage = false;
  bossAttackTimer = 0;
  
  hasShield = false;
  shieldDuration = 0;
  chargeLevel = 0;
  meteorCount = 2;
  isDamaged = false;
  damageTimer = 0;

  player = {
    x: canvas.width / 2 - 32,
    y: canvas.height - 120,
    width: 64,
    height: 64,
  };

  createEnemies(canvas, enemyImg);
}

// =============================
// 메인 루프
// =============================
function update() {
  if (!isGameOver) {
    moveStars();
    movePlayer(player, canvas);
    handleShooting();
    moveLasers();
    moveEnemyLasers();
    moveItems();
    updateParticles();
    
    // 데미지 타이머
    if (isDamaged) {
      damageTimer--;
      if (damageTimer <= 0) {
        isDamaged = false;
      }
    }
    
    // 실드 지속시간
    if (hasShield) {
      shieldDuration--;
      if (shieldDuration <= 0) {
        hasShield = false;
      }
    }
    
    // 콤보 유지 (3초)
    if (combo > 0 && Date.now() - lastHitTime > 3000) {
      if (combo > maxCombo) maxCombo = combo;
      combo = 0;
    }
    
    // 보스 유무에 따른 로직
    if (!boss) {
      moveEnemies();
      enemyShoot();
    }
    if (boss) {
      updateBoss();
      bossShoot();
    }

    checkCollisions();
  }

  drawScene(ctx, canvas);
  requestAnimationFrame(update);
}

// =============================
// 배경 별 움직임
// =============================
function moveStars() {
  stars.forEach(star => {
    star.y += star.speed;
    if (star.y > canvas.height) {
      star.y = 0;
      star.x = Math.random() * canvas.width;
    }
  });
}

// =============================
// 플레이어 이동
// =============================
function movePlayer(player, canvas) {
  const speed = 6;

  if (keys["ArrowLeft"] || keys["a"]) player.x -= speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += speed;

  if (boss) {
    if (keys["ArrowUp"] || keys["w"]) player.y -= speed;
    if (keys["ArrowDown"] || keys["s"]) player.y += speed;
  }

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// =============================
// 공격 (차지 기능)
// =============================
let lastHitTime = Date.now();

function handleShooting() {
  if (keys[" "]) {
    if (chargeLevel < maxCharge) {
      chargeLevel += 2.5;
      
      // 차지 파티클 효과
      if (Math.random() < 0.3) {
        createParticle(
          player.x + player.width / 2,
          player.y + player.height / 2,
          "yellow",
          2
        );
      }
    }
    
    if (chargeLevel < 50) {
      const currentTime = Date.now();
      if (currentTime - lastShotTime > SHOT_DELAY) {
        lasers.push({
          x: player.x + player.width / 2 - 4,
          y: player.y - 10,
          width: 8,
          height: 32,
          type: "normal",
          damage: 1
        });
        lastShotTime = currentTime;
      }
    }
  } else {
    if (chargeLevel > 0) chargeLevel -= 1;
  }
}

function fireChargedShot() {
  // 3-way 샷
  for (let i = -1; i <= 1; i++) {
    lasers.push({
      x: player.x + player.width / 2 - 8 + i * 20,
      y: player.y - 20,
      width: 16,
      height: 48,
      type: "charged",
      damage: 3,
      vx: i * 2
    });
  }
  chargeLevel = 0;
  
  // 충격파 효과
  for (let i = 0; i < 20; i++) {
    createParticle(
      player.x + player.width / 2,
      player.y,
      "gold",
      3
    );
  }
}

// =============================
// 메테오 필살기
// =============================
function useMeteor() {
  meteorCount--;
  
  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * 200;
      
      // 거대 폭발
      explosions.push({
        x: x,
        y: y,
        radius: 80,
        alpha: 1,
        damage: true,
        color: "orange"
      });
      
      // 파티클 효과
      for (let j = 0; j < 30; j++) {
        createParticle(x, y, "orange", 5);
      }
      
      // 적 처리
      enemies.forEach((enemy, ei) => {
        const dx = enemy.x + enemy.width/2 - x;
        const dy = enemy.y + enemy.height/2 - y;
        if (Math.sqrt(dx*dx + dy*dy) < 100) {
          createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
          enemies.splice(ei, 1);
          score += 150;
          combo++;
          lastHitTime = Date.now();
        }
      });
      
      // 보스 데미지
      if (boss) {
        const dx = boss.x + boss.width/2 - x;
        const dy = boss.y + boss.height/2 - y;
        if (Math.sqrt(dx*dx + dy*dy) < 120) {
          boss.hp -= 8;
          if (boss.hp <= 0) {
            bossDefeated();
          }
        }
      }
    }, i * 80);
  }
}

// =============================
// 파티클 시스템
// =============================
function createParticle(x, y, color, speed) {
  const angle = Math.random() * Math.PI * 2;
  particles.push({
    x: x,
    y: y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    radius: Math.random() * 3 + 1,
    alpha: 1,
    color: color
  });
}

function updateParticles() {
  particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.02;
  });
  particles = particles.filter(p => p.alpha > 0);
}

// =============================
// 아이템 시스템
// =============================
function spawnItem(x, y, type) {
  items.push({
    x: x,
    y: y,
    width: 32,
    height: 32,
    type: type,
    vy: 2,
    rotation: 0
  });
}

function moveItems() {
  items.forEach(item => {
    item.y += item.vy;
    item.rotation += 0.05;
  });
  items = items.filter(item => item.y < canvas.height);
}

// =============================
// 적 생성 및 이동
// =============================
function createEnemies(canvas, enemyImg) {
  enemies = [];
  const rows = Math.min(3 + stage, 6);
  const cols = Math.min(5 + Math.floor(stage / 2), 8);
  const margin = 15;
  const enemyWidth = 48;
  const enemyHeight = 48;
  const startX = (canvas.width - (cols * enemyWidth + (cols - 1) * margin)) / 2;
  const startY = 80;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * (enemyWidth + margin),
        y: startY + r * (enemyHeight + margin),
        width: enemyWidth,
        height: enemyHeight,
        shootTimer: Math.random() * 200
      });
    }
  }
}

function moveEnemies() {
  enemies.forEach(enemy => {
    enemy.y += 0.3 + stage * 0.08;
    
    // 화면 아래로 벗어나면 목숨 감소
    if (enemy.y > canvas.height) {
      loseLife();
      enemies.splice(enemies.indexOf(enemy), 1);
    }
  });
}

// 적 공격
function enemyShoot() {
  enemies.forEach(enemy => {
    enemy.shootTimer--;
    if (enemy.shootTimer <= 0) {
      enemyLasers.push({
        x: enemy.x + enemy.width / 2 - 4,
        y: enemy.y + enemy.height,
        width: 8,
        height: 24,
        vy: 5
      });
      enemy.shootTimer = 150 + Math.random() * 100;
    }
  });
}

function moveEnemyLasers() {
  enemyLasers.forEach(l => l.y += l.vy);
  enemyLasers = enemyLasers.filter(l => l.y < canvas.height);
}

// =============================
// 보스 로직
// =============================
function spawnBoss() {
  isBossStage = true;
  boss = {
    x: canvas.width / 2 - 80,
    y: 50,
    width: 160,
    height: 160,
    hp: 30 + stage * 15,
    maxHp: 30 + stage * 15,
    vx: 4,
    vy: 0,
    moveTimer: 0,
    phase: 1
  };
  bossAttackTimer = 0;
}

function updateBoss() {
  boss.moveTimer--;
  if (boss.moveTimer <= 0) {
    boss.vx = (Math.random() - 0.5) * 12;
    boss.vy = (Math.random() - 0.5) * 8;
    boss.moveTimer = 50;
  }

  boss.x += boss.vx;
  boss.y += boss.vy;

  if (boss.x < 0) { boss.x = 0; boss.vx *= -1; }
  if (boss.x + boss.width > canvas.width) { boss.x = canvas.width - boss.width; boss.vx *= -1; }
  if (boss.y < 0) { boss.y = 0; boss.vy *= -1; }
  if (boss.y + boss.height > canvas.height / 2) { boss.y = canvas.height / 2 - boss.height; boss.vy *= -1; }
  
  // 페이즈 변경
  if (boss.hp < boss.maxHp * 0.5 && boss.phase === 1) {
    boss.phase = 2;
  }
}

function bossShoot() {
  bossAttackTimer--;
  if (bossAttackTimer <= 0) {
    if (boss.phase === 1) {
      // 페이즈 1: 3-way 샷
      for (let i = -1; i <= 1; i++) {
        enemyLasers.push({
          x: boss.x + boss.width / 2 - 6,
          y: boss.y + boss.height,
          width: 12,
          height: 32,
          vy: 6,
          vx: i * 3
        });
      }
      bossAttackTimer = 60;
    } else {
      // 페이즈 2: 원형 탄막
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        enemyLasers.push({
          x: boss.x + boss.width / 2 - 6,
          y: boss.y + boss.height / 2,
          width: 12,
          height: 12,
          vy: Math.sin(angle) * 5,
          vx: Math.cos(angle) * 5
        });
      }
      bossAttackTimer = 40;
    }
  }
}

function bossDefeated() {
  score += 3000 + stage * 1000;
  combo += 10;
  if (combo > maxCombo) maxCombo = combo;
  
  // 보스 폭발 연출
  for (let i = 0; i < 50; i++) {
    setTimeout(() => {
      createExplosion(
        boss.x + Math.random() * boss.width,
        boss.y + Math.random() * boss.height
      );
    }, i * 30);
  }
  
  boss = null;
  isBossStage = false;
  stage++;
  
  // 보상 아이템
  spawnItem(canvas.width / 2 - 50, canvas.height / 3, "shield");
  spawnItem(canvas.width / 2 + 50, canvas.height / 3, "meteor");
  
  setTimeout(() => {
    if (stage <= 5) {
      createEnemies(canvas, enemyImg);
      meteorCount++;
    } else {
      isGameOver = true;
      gameWon = true;
    }
  }, 2000);
}

// =============================
// 충돌 감지
// =============================
function moveLasers() {
  lasers.forEach(l => {
    l.y -= 12;
    if (l.vx) l.x += l.vx;
  });
  lasers = lasers.filter(l => l.y > -50 && l.x > -50 && l.x < canvas.width + 50);
}

function checkCollisions() {
  // 1. 플레이어 레이저 vs 적
  lasers.forEach((laser, li) => {
    enemies.forEach((enemy, ei) => {
      if (checkRectCollision(laser, enemy)) {
        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        enemies.splice(ei, 1);
        if (laser.damage >= 3) return;
        lasers.splice(li, 1);
        
        score += 100 * (combo + 1);
        combo++;
        lastHitTime = Date.now();
        
        // 아이템 드롭 (15%)
        if (Math.random() < 0.15) {
          const rand = Math.random();
          let itemType = rand < 0.5 ? "shield" : "meteor";
          if (rand > 0.9 && lives < 3) itemType = "life";
          spawnItem(enemy.x, enemy.y, itemType);
        }
      }
    });
    
    // 보스 충돌
    if (boss && checkRectCollision(laser, boss)) {
      createExplosion(boss.x + boss.width/2, boss.y + boss.height/2);
      if (laser.damage < 3) lasers.splice(li, 1);
      
      boss.hp -= laser.damage;
      combo++;
      lastHitTime = Date.now();
      
      if (boss.hp <= 0) {
        bossDefeated();
      }
    }
  });

  // 2. 아이템 획득
  items.forEach((item, ii) => {
    if (checkRectCollision(player, item)) {
      items.splice(ii, 1);
      
      if (item.type === "shield") {
        hasShield = true;
        shieldDuration = 400;
      } else if (item.type === "meteor") {
        meteorCount++;
      } else if (item.type === "life") {
        lives = Math.min(lives + 1, 3);
      }
      
      // 획득 효과
      for (let i = 0; i < 15; i++) {
        createParticle(item.x + 16, item.y + 16, "cyan", 4);
      }
    }
  });

  // 3. 적 레이저 vs 플레이어
  enemyLasers.forEach((laser, li) => {
    if (checkRectCollision(player, laser)) {
      enemyLasers.splice(li, 1);
      if (!hasShield) {
        loseLife();
      } else {
        hasShield = false;
        shieldDuration = 0;
      }
    }
  });

  // 4. 적 vs 플레이어
  enemies.forEach((enemy, ei) => {
    if (checkRectCollision(player, enemy)) {
      createExplosion(player.x + player.width/2, player.y + player.height/2);
      enemies.splice(ei, 1);
      if (!hasShield) {
        loseLife();
      } else {
        hasShield = false;
        shieldDuration = 0;
      }
    }
  });

  // 5. 보스 vs 플레이어
  if (boss && checkRectCollision(player, boss)) {
    if (!hasShield) {
      loseLife();
    } else {
      hasShield = false;
      shieldDuration = 0;
    }
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 120;
  }

  // 6. 보스 등장
  if (enemies.length === 0 && !isBossStage && !gameWon && !isGameOver) {
    spawnBoss();
  }

  // 폭발 애니메이션
  explosions.forEach(ex => {
    ex.radius += 3;
    ex.alpha -= 0.04;
  });
  explosions = explosions.filter(ex => ex.alpha > 0);
}

function loseLife() {
  lives--;
  isDamaged = true;
  damageTimer = 30;
  combo = 0;
  
  if (lives <= 0) {
    lives = 0;
    isGameOver = true;
    gameWon = false;
  }
}

function checkRectCollision(r1, r2) {
  return (
    r1.x < r2.x + r2.width &&
    r1.x + r1.width > r2.x &&
    r1.y < r2.y + r2.height &&
    r1.y + r1.height > r2.y
  );
}

function createExplosion(x, y) {
  explosions.push({
    x: x,
    y: y,
    radius: 5,
    alpha: 1,
    color: "orange"
  });
  
  for (let i = 0; i < 10; i++) {
    createParticle(x, y, "yellow", 4);
  }
}

// =============================
// 화면 그리기
// =============================
function drawScene(ctx, canvas) {
  // 배경
  if (backgroundImg) {
    ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // 별
  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // 적
  enemies.forEach(enemy => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // 보스
  if (boss) {
    ctx.save();
    ctx.translate(boss.x + boss.width/2, boss.y + boss.height/2);
    ctx.rotate(Math.sin(Date.now() / 200) * 0.1);
    ctx.drawImage(ufoImg, -boss.width/2, -boss.height/2, boss.width, boss.height);
    ctx.restore();
    
    // 체력바
    const barWidth = boss.width;
    const barHeight = 12;
    ctx.fillStyle = "rgba(50,50,50,0.8)";
    ctx.fillRect(boss.x, boss.y - 25, barWidth, barHeight);
    
    const hpPercent = boss.hp / boss.maxHp;
    const barColor = hpPercent > 0.5 ? "#4ade80" : hpPercent > 0.25 ? "#facc15" : "#ef4444";
    ctx.fillStyle = barColor;
    ctx.fillRect(boss.x, boss.y - 25, barWidth * hpPercent, barHeight);
    
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(boss.x, boss.y - 25, barWidth, barHeight);
  }

  // 아이템
  items.forEach(item => {
    ctx.save();
    ctx.translate(item.x + item.width/2, item.y + item.height/2);
    ctx.rotate(item.rotation);
    
    if (item.type === "shield") {
      ctx.drawImage(shieldImg, -item.width/2, -item.height/2, item.width, item.height);
    } else if (item.type === "meteor") {
      ctx.drawImage(meteorSmallImg, -item.width/2, -item.height/2, item.width, item.height);
    } else if (item.type === "life") {
      ctx.drawImage(lifeImg, -item.width/2, -item.height/2, item.width, item.height);
    }
    ctx.restore();
  });

  // 플레이어
  if (lives > 0) {
    let currentImg = isDamaged ? playerDamagedImg : playerImg;
    if (!isDamaged) {
      if (keys["ArrowLeft"] || keys["a"]) currentImg = playerLeftImg;
      else if (keys["ArrowRight"] || keys["d"]) currentImg = playerRightImg;
    }
    
    // 깜빡임 효과
    if (!isDamaged || Math.floor(damageTimer / 5) % 2 === 0) {
      ctx.drawImage(currentImg, player.x, player.y, player.width, player.height);
    }
    
    // 실드 효과
    if (hasShield) {
      ctx.save();
      ctx.globalAlpha = 0.6;
      const shieldPulse = Math.sin(Date.now() / 100) * 5;
      ctx.drawImage(
        shieldImg,
        player.x - 10,
        player.y - 10,
        player.width + 20 + shieldPulse,
        player.height + 20 + shieldPulse
      );
      ctx.restore();
    }
  }

  // 플레이어 레이저
  lasers.forEach(l => {
    if (l.type === "charged") {
      ctx.drawImage(laserGreenShotImg, l.x, l.y, l.width, l.height);
    } else {
      ctx.drawImage(laserRedShotImg, l.x, l.y, l.width, l.height);
    }
  });
  
  // 적 레이저
  enemyLasers.forEach(l => {
    ctx.drawImage(laserGreenImg, l.x, l.y, l.width, l.height);
  });

  // 파티클
  particles.forEach(p => {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1.0; // 투명도 초기화

  // 폭발 효과
  explosions.forEach(ex => {
    ctx.save();
    ctx.globalAlpha = ex.alpha;
    ctx.fillStyle = ex.color;
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // =============================
  // UI 그리기 (점수, 생명, 게이지)
  // =============================
  
  // 점수 및 스테이지
  ctx.fillStyle = "white";
  ctx.font = "bold 20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`SCORE: ${score}`, 20, 35);
  ctx.fillText(`STAGE: ${stage}`, 20, 65);

  // 콤보 표시
  if (combo > 1) {
    ctx.fillStyle = "#facc15"; // 노란색
    ctx.font = `bold ${24 + Math.min(combo, 20)}px Arial`;
    ctx.fillText(`${combo} COMBO!`, 20, 100);
  }

  // 생명 표시 (하트 이미지 또는 아이콘)
  for (let i = 0; i < lives; i++) {
    // lifeImg가 로드되었다면 이미지로, 아니면 텍스트로 대체 가능
    if (lifeImg) {
      ctx.drawImage(lifeImg, 20 + i * 40, canvas.height - 50, 32, 32);
    } else {
      ctx.fillText("♥", 20 + i * 30, canvas.height - 30);
    }
  }

  // 메테오 스킬 카운트 (Q키)
  if (meteorSmallImg) {
    ctx.drawImage(meteorSmallImg, canvas.width - 60, canvas.height - 60, 48, 48);
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText(meteorCount, canvas.width - 36, canvas.height - 20);
    ctx.fillText("Q", canvas.width - 36, canvas.height - 65);
  }

  // 차지 게이지 (Spacebar)
  const barWidth = 200;
  const barHeight = 12;
  const barX = canvas.width / 2 - barWidth / 2;
  const barY = canvas.height - 30;

  // 게이지 배경
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.fillRect(barX, barY, barWidth, barHeight);

  // 게이지 채우기
  if (chargeLevel > 0) {
    ctx.fillStyle = chargeLevel >= maxCharge ? "#00ffff" : "orange"; // 완충 시 하늘색
    ctx.fillRect(barX, barY, barWidth * (chargeLevel / maxCharge), barHeight);
    
    // 완충 시 반짝임 효과
    if (chargeLevel >= maxCharge) {
      ctx.strokeStyle = `rgba(255, 255, 255, ${Math.abs(Math.sin(Date.now() / 100))})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
    }
  }

  // =============================
  // 게임 오버 / 클리어 화면
  // =============================
  if (isGameOver) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    
    if (gameWon) {
      ctx.fillStyle = "#4ade80"; // 밝은 녹색
      ctx.font = "bold 50px Arial";
      ctx.fillText("MISSION COMPLETE!", canvas.width / 2, canvas.height / 2 - 20);
    } else {
      ctx.fillStyle = "#ef4444"; // 붉은색
      ctx.font = "bold 50px Arial";
      ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
    }

    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 40);
    
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "20px Arial";
    ctx.fillText("Press [ENTER] to Retry", canvas.width / 2, canvas.height / 2 + 90);
  }
}