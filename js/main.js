// ==========================================
// 1. CONSTANTS
// ==========================================
const BLOCK_HEIGHT = 30;
const SQUARE_BLOCK_SIZE = 100;
const INITIAL_BLOCK_WIDTH = 200;
const INITIAL_BLOCK_SPEED = 7;
const SPEED_INCREMENT = 3;
const TOP_MARGIN = 130;
const GAME_OVER_FALL_DISTANCE = 200;
const GAME_OVER_DELAY = 1200;
const CONTAINER_PADDING = 20;
const SPAWN_TOP_POSITION = "10px";
const LOGOS = [
  "/assets/angbyiflogo.jpeg",
  "assets/be-active-day-logo.png",
  "assets/bjorklinge-traningscenter-logo.png",
  "assets/formgotlandlogo.png",
  "assets/friskislogo.png",
  "assets/hagabadet-logo.jpeg",
  "assets/jjlogo.jpeg",
  "assets/kristinedalslogo.jpg",
  "assets/malkarslogo.jpg",
  "assets/satslogo.png",
  "assets/sgylogo.jpg",
  "assets/stclogo.png",
  "assets/team-isak-logo.png",
  "assets/umlogo.jpeg",
];

// ==========================================
// 2. TIMER STATE & FUNCTIONS
// ==========================================
let timerInterval = null;
let timeLeft = 60;
const timerDisplay = document.getElementById("timer-value");

function startTimer(onTimeOut) {
  stopTimer();
  timeLeft = 30;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      if (onTimeOut) onTimeOut();
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function getTimeSpentFormatted() {
  const timeSpent = 30 - timeLeft;
  return `${timeSpent}s`;
}

function updateTimerDisplay() {
  if (timerDisplay) {
    timerDisplay.innerHTML = `${timeLeft}s`;
  }
}

// ==========================================
// 3. UI STATE & FUNCTIONS
// ==========================================
const gameModal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const startBtn = document.getElementById("start-btn");

function showModal(title, message, type = "default") {
  if (modalTitle) modalTitle.innerHTML = title;

  if (modalMessage) modalMessage.innerHTML = message;

  if (startBtn) {
    if (type === "game-over" || type === "win") {
      startBtn.innerHTML = "Spela igen";
    } else {
      startBtn.innerHTMLt = "Starta spelet";
    }
  }

  if (type === "game-over") {
    gameModal.classList.add("game-over");
  } else {
    gameModal.classList.remove("game-over");
  }

  gameModal.classList.remove("hidden");
}

function hideModal() {
  if (gameModal) gameModal.classList.add("hidden");
}

function showInstructions() {
  showModal(
    "Tower Stacker",
    "Vänsterklicka för att släppa blocket. Bygg ett så högt torn som möjligt innan tiden tar slut!",
    "instructions",
  );
}
function createStatsHtml(score, timeSpent) {
  return `

<div class="modal-stats">

      <div class="stat-item">

        <span class="stat-label">Poäng</span>

        <span class="stat-value">${score}p</span>

      </div>

      <div class="stat-item">

        <span class="stat-label">Tid</span>

        <span class="stat-value">${timeSpent}</span>

      </div>

    </div>

  `;
}

// ==========================================
// 4. GAME LOGIC & EVENT LISTENERS
// ==========================================
const tower = document.getElementById("tower");
const scoreDisplay = document.getElementById("score-value");

let currentBlock = null;
let blocks = [];
let gameIsRunning = true;
let isDropping = false;
let score = 0;
let blockSpeed = INITIAL_BLOCK_SPEED;
let animationFrameId;
let remainingLogos = [];

function getRandomLogo() {
  if (remainingLogos.length === 0) {
    remainingLogos = [...LOGOS].sort(() => Math.random() - 0.5);
  }
  return remainingLogos.pop();
}

function getTowerHeight() {
  return blocks.reduce((totalHeight, block) => {
    const height = parseInt(block.style.height, 10) || BLOCK_HEIGHT;
    return totalHeight + height;
  }, 0);
}

function startGame() {
  tower.innerHTML = "";
  blocks = [];
  hideModal();

  remainingLogos = [...LOGOS].sort(() => Math.random() - 0.5);

  const gameWidth = tower.clientWidth;
  const initialBlockWidth = Math.min(
    INITIAL_BLOCK_WIDTH,
    gameWidth - CONTAINER_PADDING,
  );

  const baseBlock = document.createElement("div");
  baseBlock.id = "base-block";
  baseBlock.classList.add("block");
  baseBlock.style.width = `${initialBlockWidth}px`;
  baseBlock.style.height = `${BLOCK_HEIGHT}px`;
  baseBlock.style.left = `${(gameWidth - initialBlockWidth) / 2}px`;
  baseBlock.style.bottom = "0px";

  tower.appendChild(baseBlock);
  blocks.push(baseBlock);

  gameIsRunning = true;
  isDropping = false;
  score = 0;
  blockSpeed = INITIAL_BLOCK_SPEED;
  updateScoreDisplay();

  spawnBlock();
  startTimer(() => gameOver("time-out"));
  animate();
}

function spawnBlock() {
  currentBlock = document.createElement("div");
  currentBlock.classList.add("block");

  currentBlock.style.width = `${SQUARE_BLOCK_SIZE}px`;
  currentBlock.style.height = `${SQUARE_BLOCK_SIZE}px`;
  currentBlock.style.backgroundImage = `url('${getRandomLogo()}')`;

  currentBlock.style.top = SPAWN_TOP_POSITION;
  currentBlock.style.bottom = "";
  currentBlock.style.left = "0px";
  currentBlock.dataset.direction = "right";

  tower.appendChild(currentBlock);
}

function updateScoreDisplay() {
  if (scoreDisplay) scoreDisplay.innerHTML = score;
}

function animate() {
  if (!gameIsRunning || isDropping) return;

  const gameWidth = tower.clientWidth;
  let currentLeft = parseInt(currentBlock.style.left || 0, 10);
  const currentWidth = parseInt(currentBlock.style.width, 10);

  if (currentBlock.dataset.direction === "right") {
    currentLeft += blockSpeed;
    if (currentLeft + currentWidth >= gameWidth) {
      currentBlock.dataset.direction = "left";
    }
  } else {
    currentLeft -= blockSpeed;
    if (currentLeft <= 0) {
      currentBlock.dataset.direction = "right";
    }
  }
  currentBlock.style.left = `${currentLeft}px`;

  animationFrameId = requestAnimationFrame(animate);
}

function placeBlock() {
  if (!gameIsRunning || isDropping) return;

  const previousBlock = blocks[blocks.length - 1];
  const previousLeft = parseInt(previousBlock.style.left, 10);
  const previousWidth = parseInt(previousBlock.style.width, 10);

  const currentLeft = parseInt(currentBlock.style.left, 10);
  const currentWidth = parseInt(currentBlock.style.width, 10);

  const overlapStart = Math.max(previousLeft, currentLeft);
  const overlapEnd = Math.min(
    previousLeft + previousWidth,
    currentLeft + currentWidth,
  );
  const overlapWidth = overlapEnd - overlapStart;

  if (overlapWidth > 0) {
    isDropping = true;
    cancelAnimationFrame(animationFrameId);

    const targetBottom = getTowerHeight();
    const blockToAnimate = currentBlock;
    const fallDuration = 350;
    blockToAnimate.style.transition = `top ${fallDuration / 1000}s cubic-bezier(0.4, 0, 0.2, 1)`;
    const targetTop = tower.clientHeight - targetBottom - SQUARE_BLOCK_SIZE;
    blockToAnimate.style.top = `${targetTop}px`;

    score++;
    blockSpeed += SPEED_INCREMENT;
    updateScoreDisplay();
    blocks.push(currentBlock);

    setTimeout(() => {
      blockToAnimate.style.transition = "";
      blockToAnimate.style.top = "";
      blockToAnimate.style.bottom = `${targetBottom}px`;

      const maxHeight = tower.clientHeight - TOP_MARGIN;
      const currentBlockTop = targetBottom + SQUARE_BLOCK_SIZE;

      if (currentBlockTop >= maxHeight) {
        gameIsRunning = false;
        stopTimer();
        if (currentBlock && currentBlock.parentNode) {
          currentBlock.remove();
        }
        const timeSpent = getTimeSpentFormatted();
        showModal(
          "<span>🥇</span>Du nådde toppen!<span>🥇</span>",

          createStatsHtml(score, timeSpent),

          "win",
        );
        return;
      }

      isDropping = false;
      spawnBlock();
      animate();
    }, fallDuration);
  } else {
    gameOver();
  }
}

function gameOver(reason) {
  gameIsRunning = false;
  cancelAnimationFrame(animationFrameId);
  stopTimer();
  const timeSpent = getTimeSpentFormatted();
  if (reason === "time-out") {
    showModal(
      "Tiden är slut!",

      createStatsHtml(score, timeSpent),

      "game-over",
    );
  } else {
    currentBlock.style.transition = "transform 1s ease-in, opacity 1s ease-in";
    currentBlock.style.transform = `translateY(${GAME_OVER_FALL_DISTANCE}px)`;
    currentBlock.style.opacity = "0";

    setTimeout(() => {
      showModal(
        "<span>💥</span>Game Over<span>💥</span>",
        createStatsHtml(score, timeSpent),
        "game-over",
      );
    }, GAME_OVER_DELAY);
  }
}

document.addEventListener("click", (e) => {
  if (e.target === startBtn) return;

  placeBlock();
});

if (startBtn) {
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();

    startGame();
  });
}

showInstructions();
