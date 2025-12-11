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
let explosions = [];
let keys = {};

// 게임 상태 관리
let score = 0;
let lives = 3;
let isGameOver = false;
let gameWon = false;
let stage = 1;  // ← 스테이지 추가!
let stageClearing = false;  // 스테이지 전환 중 플래그

// 공격 쿨타임
let lastShotTime = 0;
const SHOT_DELAY = 200;

// 자원(이미지) 저장
let canvas, ctx;
let playerImg, playerLeftImg, playerRightImg;
let enemyImg;
let laserImg;
let lifeImg;

let player = {};

window.onload = async () => {
  canvas = document.getElementById("myCanvas");
  ctx = canvas.getContext("2d");

  // =============================
  // 이미지 로드
  // =============================
  try {
    playerImg = await loadTexture("./assets/enemyUFO.png");
    playerLeftImg = await loadTexture("./assets/playerLeft.png");
    playerRightImg = await loadTexture("./assets/playerRight.png");
    enemyImg = await loadTexture("./assets/meteorSmall.png");
    laserImg = await loadTexture("./assets/laserGreen.png");
    lifeImg = await loadTexture("./assets/enemyUFO.png");
  } catch (err) {
    console.error(err);
    alert("이미지 로드 실패! assets 폴더를 확인해주세요.");
  }

  resetGame();

  // 키 입력 이벤트
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (isGameOver && e.key === "Enter") {
      resetGame();
    }
  });
  window.addEventListener("keyup", (e) => keys[e.key] = false);

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
  stage = 1;  // ← 스테이지 1부터 시작
  stageClearing = false;  // 플래그 초기화
  lasers = [];
  explosions = [];
  lastShotTime = 0;

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
    moveEnemies();
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

  if (keys["ArrowLeft"] || keys["a"]) player.x -= speed;
  if (keys["ArrowRight"] || keys["d"]) player.x += speed;

  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width) player.x = canvas.width - player.width;
  if (player.y < 0) player.y = 0;
  if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
}

// =============================
// 공격
// =============================
function handleShooting() {
  if (keys[" "]) {
    const currentTime = Date.now();
    if (currentTime - lastShotTime > SHOT_DELAY) {
      lasers.push({
        x: player.x + player.width / 2 - 4,
        y: player.y,
        width: 8,
        height: 32,
      });
      lastShotTime = currentTime;
    }
  }
}

// =============================
// 적 생성 및 이동
// =============================
function createEnemies(canvas, enemyImg) {
  enemies = [];
  
  // ← 스테이지에 따라 적의 수 증가!
  const rows = 3 + Math.floor(stage / 2);  // 스테이지 2마다 행 +1
  const cols = 5 + Math.floor(stage / 3);  // 스테이지 3마다 열 +1
  
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
  // 스테이지가 올라갈수록 적이 빨라짐!
  const speed = 0.5 + (stage * 0.1);
  enemies.forEach(enemy => enemy.y += speed);
}

// =============================
// 충돌 감지
// =============================
function moveLasers() {
  lasers.forEach((l) => (l.y -= 10));
  lasers = lasers.filter((l) => l.y > -50);
}

function checkCollisions() {
  // 1. 레이저 vs 적
  for (let li = lasers.length - 1; li >= 0; li--) {
    for (let ei = enemies.length - 1; ei >= 0; ei--) {
      if (checkRectCollision(lasers[li], enemies[ei])) {
        createExplosion(enemies[ei].x + enemies[ei].width/2, enemies[ei].y + enemies[ei].height/2);
        enemies.splice(ei, 1);
        lasers.splice(li, 1);
        score += 100;
        break;  // 레이저 하나당 적 하나만
      }
    }
  }

  // 2. 적 vs 플레이어
  for (let ei = enemies.length - 1; ei >= 0; ei--) {
    if (checkRectCollision(player, enemies[ei])) {
      createExplosion(player.x + player.width/2, player.y + player.height/2);
      enemies.splice(ei, 1);
      loseLife();
    }
  }

  // 3. 스테이지 클리어 조건!
  if (enemies.length === 0 && !isGameOver && !stageClearing) {
    stageClearing = true;  // 중복 실행 방지
    
    // 5 스테이지 클리어하면 게임 승리
    if (stage >= 5) {
      isGameOver = true;
      gameWon = true;
    } else {
      // 다음 스테이지로!
      stage++;
      setTimeout(() => {
        createEnemies(canvas, enemyImg);
        stageClearing = false;  // 플래그 해제
      }, 2000);  // 2초 후 다음 스테이지
    }
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
  // 배경
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 적
  enemies.forEach((enemy) => {
    ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // 플레이어
  if (lives > 0) {
    let currentImg = playerImg;
    if (keys["ArrowLeft"] || keys["a"]) currentImg = playerLeftImg;
    else if (keys["ArrowRight"] || keys["d"]) currentImg = playerRightImg;
    ctx.drawImage(currentImg, player.x, player.y, player.width, player.height);
  }

  // 레이저
  lasers.forEach((l) => {
    ctx.drawImage(laserImg, l.x, l.y, l.width, l.height);
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
  // 점수
  ctx.fillStyle = "white";
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`Points: ${score}`, 20, canvas.height - 60);
  
  // 스테이지 표시
  ctx.fillText(`Stage: ${stage}`, 20, canvas.height - 30);

  // 생명 아이콘
  if (lifeImg) {
    const iconSize = 30;
    for (let i = 0; i < lives; i++) {
      ctx.drawImage(
        lifeImg,
        canvas.width - 50 - (i * 40),
        canvas.height - 50,
        iconSize,
        iconSize
      );
    }
  }

  // ← 스테이지 전환 시 알림
  if (enemies.length === 0 && !isGameOver) {
    ctx.fillStyle = "yellow";
    ctx.font = "36px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Stage ${stage} Clear!`, canvas.width / 2, canvas.height / 2);
    ctx.font = "24px Arial";
    ctx.fillText("Next stage starting...", canvas.width / 2, canvas.height / 2 + 50);
  }

  // 종료 화면
  if (isGameOver) {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = "24px Arial";
    ctx.textAlign = "center";

    if (gameWon) {
      ctx.fillStyle = "green";
      ctx.fillText("All Stages Clear!", canvas.width / 2, canvas.height / 2 - 60);
      ctx.fillText("Victory!!!", canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
      ctx.font = "18px Arial";
      ctx.fillText("Press [Enter] to start a new game", canvas.width / 2, canvas.height / 2 + 40);
    } else {
      ctx.fillStyle = "red";
      ctx.fillText(`Game Over at Stage ${stage}`, canvas.width / 2, canvas.height / 2 - 30);
      ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2);
      ctx.font = "18px Arial";
      ctx.fillText("Press [Enter] to start a new game", canvas.width / 2, canvas.height / 2 + 40);
    }
  }
}
