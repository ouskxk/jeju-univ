// 이미지 로더
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
let explosions = [];
let items = [];
let keys = {};

// 게임 상태 관리
let score = 0;
let lives = 3;
let isGameOver = false;
let gameWon = false;
let stage = 1;

// 플레이어 능력
let hasShield = false;
let shieldDuration = 0;
let chargeLevel = 0;
let maxCharge = 100;
let meteorCount = 1;

// 공격 쿨타임
let lastShotTime = 0;
const SHOT_DELAY = 200;

// 보스 관련 변수
let boss = null;
let isBossStage = false;

// 자원(이미지) 저장
let canvas, ctx;
let playerImg, playerLeftImg, playerRightImg, playerDamagedImg;
let enemyImg, ufoImg;
let laserImg, laserGreenImg;
let lifeImg, shieldImg, meteorImg;

let player = {};

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  // =============================
  // 이미지 로드
  // =============================
  try {
    playerImg = await loadTexture("./assets/playerLeft.png");
    playerLeftImg = await loadTexture("./assets/playerLeft.png");
    playerRightImg = await loadTexture("./assets/playerRight.png");
    playerDamagedImg = await loadTexture("./assets/playerDamaged.png");

    enemyImg = await loadTexture("./assets/enemyUFO.png");
    ufoImg = await loadTexture("./assets/enemyUFO.png");
    
    laserImg = await loadTexture("./assets/laserRed.png");
    laserGreenImg = await loadTexture("./assets/laserGreen.png");
    lifeImg = await loadTexture("./assets/life.png");
    shieldImg = await loadTexture("./assets/shield.png");
    meteorImg = await loadTexture("./assets/meteorBig.png");
  } catch (err) {
    console.error(err);
    alert("이미지 로드 실패! assets 폴더를 확인해주세요.");
  }

  resetGame();

  // 키 입력 이벤트
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    
    // 게임 오버 시 Enter로 재시작
    if (isGameOver && e.key === "Enter") {
      resetGame();
    }
    
    // Q키로 메테오 필살기
    if (e.key === "q" || e.key === "Q") {
      if (meteorCount > 0 && !isGameOver) {
        useMeteor();
      }
    }
  });
  window.addEventListener("keyup", (e) => {
    keys[e.key] = false;
    
    // 차지샷 발사 (스페이스 키를 뗄 때)
    if (e.key === " " && chargeLevel >= 50) {
      fireChargedShot();
    }
  });

  requestAnimationFrame(update);
};

// =============================
// 게임 초기화
// =============================
function resetGame() {
  score = 0;
  lives = 3;
  isGameOver = false;
  gameWon = false;
  stage = 1;
  lasers = [];
  explosions = [];
  items = [];
  lastShotTime = 0;
  
  boss = null;
  isBossStage = false;
  
  hasShield = false;
  shieldDuration = 0;
  chargeLevel = 0;
  meteorCount = 1;

  player = {
    x: canvas.width / 2 - 32,
    y: canvas.height - 100,
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
    movePlayer(player, canvas);
    handleShooting();
    moveLasers();
    moveItems();
    
    // 실드 지속시간 감소
    if (hasShield) {
      shieldDuration--;
      if (shieldDuration <= 0) {
        hasShield = false;
      }
    }
    
    // 보스 유무에 따른 로직 분기
    if (!boss) moveEnemies();
    if (boss) updateBoss();

    checkCollisions();
  }

  drawScene(ctx, canvas);
  requestAnimationFrame(update);
}

// =============================
// 플레이어 이동
// =============================
function movePlayer(player, canvas) {
  const speed = 5;

  // 좌우 이동 (기본)
  if (keys["ArrowLeft"] || keys["a"]) player.x -= speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += speed;

  // 상하 이동 (보스전에서만 잠금 해제!)
  if (boss) {
    if (keys["ArrowUp"] || keys["w"]) player.y -= speed;
    if (keys["ArrowDown"] || keys["s"]) player.y += speed;
  }

  // 화면 밖으로 나가지 않게 제한
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// =============================
// 공격 (차지 기능 추가)
// =============================
function handleShooting() {
  if (keys[" "]) {
    // 차지 중
    if (chargeLevel < maxCharge) {
      chargeLevel += 2;
    }
    
    // 일반 공격 (차지 레벨이 낮을 때)
    if (chargeLevel < 50) {
      const currentTime = Date.now();
      if (currentTime - lastShotTime > SHOT_DELAY) {
        lasers.push({
          x: player.x + player.width / 2 - 4,
          y: player.y,
          width: 8,
          height: 32,
          type: "normal"
        });
        lastShotTime = currentTime;
      }
    }
  } else {
    // 스페이스를 누르지 않으면 차지 감소
    if (chargeLevel > 0) {
      chargeLevel -= 1;
    }
  }
}

// 차지샷 발사
function fireChargedShot() {
  lasers.push({
    x: player.x + player.width / 2 - 8,
    y: player.y,
    width: 16,
    height: 48,
    type: "charged",
    damage: 3
  });
  chargeLevel = 0;
}

// 메테오 필살기
function useMeteor() {
  meteorCount--;
  
  // 화면 전체에 메테오 생성
  for (let i = 0; i < 8; i++) {
    setTimeout(() => {
      const x = Math.random() * canvas.width;
      explosions.push({
        x: x,
        y: 0,
        radius: 60,
        alpha: 1,
        damage: true
      });
      
      // 메테오 범위 내 적 제거
      enemies.forEach((enemy, ei) => {
        const dx = enemy.x + enemy.width/2 - x;
        const dy = enemy.y + enemy.height/2 - 0;
        if (Math.sqrt(dx*dx + dy*dy) < 80) {
          enemies.splice(ei, 1);
          score += 100;
        }
      });
      
      // 보스 데미지
      if (boss) {
        const dx = boss.x + boss.width/2 - x;
        const dy = boss.y + boss.height/2 - 0;
        if (Math.sqrt(dx*dx + dy*dy) < 100) {
          boss.hp -= 5;
          if (boss.hp <= 0) {
            score += 2000;
            boss = null;
            isGameOver = true;
            gameWon = true;
          }
        }
      }
    }, i * 100);
  }
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
    type: type, // "shield" or "meteor"
    vy: 2
  });
}

function moveItems() {
  items.forEach(item => {
    item.y += item.vy;
  });
  
  // 화면 밖으로 나간 아이템 제거
  items = items.filter(item => item.y < canvas.height);
}

// =============================
// 적 생성 및 이동
// =============================
function createEnemies(canvas, enemyImg) {
  enemies = [];
  const rows = 3 + stage;
  const cols = 5 + Math.floor(stage / 2);
  const margin = 10;
  const enemyWidth = 48;
  const enemyHeight = 48;
  const startX = (canvas.width - (cols * enemyWidth + (cols - 1) * margin)) / 2;
  const startY = 50;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      enemies.push({
        x: startX + c * (enemyWidth + margin),
        y: startY + r * (enemyHeight + margin),
        width: enemyWidth,
        height: enemyHeight,
      });
    }
  }
}

function moveEnemies() {
  enemies.forEach(enemy => enemy.y += 0.5 + stage * 0.1);
}

// =============================
// 보스 (UFO) 로직
// =============================
function spawnBoss() {
  isBossStage = true;
  boss = {
    x: canvas.width / 2 - 64,
    y: 50,
    width: 128,
    height: 128,
    hp: 20 + (stage - 1) * 10,
    maxHp: 20 + (stage - 1) * 10,
    vx: 3,
    vy: 0,
    moveTimer: 0
  };
}

function updateBoss() {
  boss.moveTimer--;
  if (boss.moveTimer <= 0) {
    boss.vx = (Math.random() - 0.5) * 10;
    boss.vy = (Math.random() - 0.5) * 6;
    boss.moveTimer = 60;
  }

  boss.x += boss.vx;
  boss.y += boss.vy;

  if (boss.x < 0) { boss.x = 0; boss.vx *= -1; }
  if (boss.x + boss.width > canvas.width) { boss.x = canvas.width - boss.width; boss.vx *= -1; }
  if (boss.y < 0) { boss.y = 0; boss.vy *= -1; }
  if (boss.y + boss.height > canvas.height / 2) { boss.y = canvas.height / 2 - boss.height; boss.vy *= -1; }
}

// =============================
// 충돌 감지
// =============================
function moveLasers() {
  lasers.forEach((l) => (l.y -= 10));
  lasers = lasers.filter((l) => l.y > -50);
}

function checkCollisions() {
  // 1. 레이저 충돌 처리
  lasers.forEach((laser, li) => {
    enemies.forEach((enemy, ei) => {
      if (checkRectCollision(laser, enemy)) {
        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        enemies.splice(ei, 1);
        lasers.splice(li, 1);
        score += 100;
        
        // 10% 확률로 아이템 드롭
        if (Math.random() < 0.1) {
          const itemType = Math.random() < 0.5 ? "shield" : "meteor";
          spawnItem(enemy.x, enemy.y, itemType);
        }
      }
    });
    
    if (boss && checkRectCollision(laser, boss)) {
      createExplosion(boss.x + boss.width/2, boss.y + boss.height/2 + 20);
      lasers.splice(li, 1);
      boss.hp -= (laser.type === "charged" ? 3 : 1);
      
      if (boss.hp <= 0) {
        score += 2000;
        boss = null;
        isBossStage = false;
        stage++;
        
        // 다음 스테이지로
        setTimeout(() => {
          createEnemies(canvas, enemyImg);
          meteorCount++;
        }, 1000);
      }
    }
  });

  // 2. 아이템 획득
  items.forEach((item, ii) => {
    if (checkRectCollision(player, item)) {
      items.splice(ii, 1);
      if (item.type === "shield") {
        hasShield = true;
        shieldDuration = 300; // 5초
      } else if (item.type === "meteor") {
        meteorCount++;
      }
    }
  });

  // 3. 적 -> 플레이어 충돌
  enemies.forEach((enemy, ei) => {
    if (checkRectCollision(player, enemy)) {
      createExplosion(player.x + player.width/2, player.y + player.height/2);
      enemies.splice(ei, 1);
      if (!hasShield) {
        loseLife();
      } else {
        hasShield = false;
      }
    }
  });

  // 4. 보스 -> 플레이어 충돌
  if (boss && checkRectCollision(player, boss)) {
    createExplosion(player.x + player.width/2, player.y + player.height/2);
    if (!hasShield) {
      loseLife();
    } else {
      hasShield = false;
    }
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height * 1.5;
  }

  // 5. 보스 등장 조건
  if (enemies.length === 0 && !isBossStage && !gameWon) {
    spawnBoss();
  }

  // 폭발 애니메이션
  explosions.forEach((ex) => {
    ex.radius += 2;
    ex.alpha -= 0.05;
  });
  explosions = explosions.filter((ex) => ex.alpha > 0);
}

function loseLife() {
  lives--;
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
  explosions.push({ x: x, y: y, radius: 1, alpha: 1 });
}

// =============================
// 화면 그리기
// =============================
function drawScene(ctx, canvas) {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 적
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // 보스
  if (boss) {
    ctx.drawImage(ufoImg, boss.x, boss.y, boss.width, boss.height);
    ctx.fillStyle = "gray";
    ctx.fillRect(boss.x, boss.y - 15, boss.width, 10);
    ctx.fillStyle = "red";
    ctx.fillRect(boss.x, boss.y - 15, boss.width * (boss.hp / boss.maxHp), 10);
  }

  // 아이템
  items.forEach((item) => {
    if (item.type === "shield") {
      ctx.drawImage(shieldImg, item.x, item.y, item.width, item.height);
    } else if (item.type === "meteor") {
      ctx.drawImage(meteorImg, item.x, item.y, item.width, item.height);
    }
  });

  // 플레이어
  if (lives > 0) {
    let currentImg = playerImg;
    if (keys["ArrowLeft"] || keys["a"]) currentImg = playerLeftImg;
    else if (keys["ArrowRight"] || keys["d"]) currentImg = playerRightImg;
    ctx.drawImage(currentImg, player.x, player.y, player.width, player.height);
    
    // 실드 효과
    if (hasShield) {
      ctx.strokeStyle = "cyan";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(player.x + player.width/2, player.y + player.height/2, 40, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 레이저
  lasers.forEach((l) => {
    if (l.type === "charged") {
      ctx.fillStyle = "yellow";
      ctx.fillRect(l.x, l.y, l.width, l.height);
    } else {
      ctx.drawImage(laserImg, l.x, l.y, l.width, l.height);
    }
  });

  // 폭발
  explosions.forEach((ex) => {
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, ex.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,200,50,${ex.alpha})`;
    ctx.fill();
  });

  drawUI(ctx, canvas);
}

// =============================
// UI 그리기
// =============================
function drawUI(ctx, canvas) {
  // 점수 & 스테이지
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Points: ${score}`, 20, canvas.height - 60);
  ctx.fillText(`Stage: ${stage}`, 20, canvas.height - 30);

  // 보스전 알림
  if (boss) {
    ctx.fillStyle = "yellow";
    ctx.textAlign = "center";
    ctx.font = "30px Arial";
    ctx.fillText("BOSS BATTLE!!", canvas.width/2, 30);
  }

  // 생명 아이콘
  if (lifeImg) {
    const iconSize = 30;
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(lifeImg, canvas.width - 50 - (i * 40), canvas.height - 50, iconSize, iconSize);
    }
  }

  // 차지 게이지
  ctx.fillStyle = "gray";
  ctx.fillRect(20, 20, 200, 20);
  ctx.fillStyle = chargeLevel >= 50 ? "gold" : "yellow";
  ctx.fillRect(20, 20, 200 * (chargeLevel / maxCharge), 20);
  ctx.strokeStyle = "white";
  ctx.strokeRect(20, 20, 200, 20);
  ctx.fillStyle = "white";
  ctx.font = "14px Arial";
  ctx.textAlign = "left";
  ctx.fillText("CHARGE", 25, 35);

  // 메테오 개수
  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText(`Meteor (Q): ${meteorCount}`, 20, 60);

  // 종료 화면
  if (isGameOver) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "24px Arial";
    ctx.textAlign = "center";

    if (gameWon) {
      ctx.fillStyle = "green";
      ctx.fillText(`Victory!!! Stage ${stage} Clear!`, canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
      ctx.font = "18px Arial";
      ctx.fillText("Press [Enter] to start a new game", canvas.width / 2, canvas.height / 2 + 40);
    } else {
      ctx.fillStyle = "red";
      ctx.fillText("You died !!!", canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
      ctx.font = "18px Arial";
      ctx.fillText("Press [Enter] to start a new game", canvas.width / 2, canvas.height / 2 + 40);
    }
  }
}