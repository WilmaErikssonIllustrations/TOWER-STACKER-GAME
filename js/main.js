// ==========================================
// 1. CONSTANTS
// ==========================================
const BLOCK_HEIGHT = 60;
const INITIAL_SQUARE_BLOCK_SIZE = 80;
const MIN_SQUARE_BLOCK_SIZE = 50;
const SIZE_DECREMENT = 10;
const INITIAL_BLOCK_WIDTH = 100;
const INITIAL_BLOCK_SPEED = 6;
const SPEED_INCREMENT = 2;
const TOP_MARGIN = 130;
const GAME_OVER_FALL_DISTANCE = 200;
const GAME_OVER_DELAY = 1200;
const CONTAINER_PADDING = 20;
const SPAWN_TOP_POSITION = "10px";
const TRUMP_BLOCK_CHANCE = 0.3;
const INITIAL_LIVES = 3;

// ==========================================
// 2. TIMER STATE & FUNCTIONS
// ==========================================
let timerInterval = null;
let timeLeft = 30;
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
const livesDisplay = document.getElementById("lives-value");

let lives = INITIAL_LIVES;

function updateLivesDisplay() {
  if (livesDisplay) {
    livesDisplay.innerHTML = "❤️".repeat(lives);
  }
}

function showModal(title, message, type = "default") {
  if (modalTitle) modalTitle.innerHTML = title;
  if (modalMessage) modalMessage.innerHTML = message;

  if (startBtn) {
    if (type === "game-over" || type === "win") {
      startBtn.innerHTML = "Spela igen";
    } else {
      startBtn.innerHTML = "Starta spelet";
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
    "Snack Tower",
    "<p>Tryck för att släppa snacks, bygg ett så högt snacks-torn som möjligt innan tiden tar slut!</p>",
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
let gameIsRunning = false;
let isDropping = false;
let score = 0;
let blockSpeed = INITIAL_BLOCK_SPEED;
let currentBlockSize = INITIAL_SQUARE_BLOCK_SIZE;
let animationFrameId = null;

function getTowerHeight() {
  return blocks.reduce((totalHeight, block) => {
    const height = parseInt(block.style.height, 10) || BLOCK_HEIGHT;
    return totalHeight + height;
  }, 0);
}

function startGame() {
  cancelAnimationFrame(animationFrameId);
  stopTimer();

  tower.innerHTML = "";
  blocks = [];
  currentBlock = null;
  hideModal();

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
  baseBlock.style.backgroundImage = `url('assets/pet-bowl.png')`;
  baseBlock.style.backgroundSize = "contain";
  baseBlock.style.backgroundPosition = "center";
  baseBlock.style.backgroundRepeat = "no-repeat";

  tower.appendChild(baseBlock);
  blocks.push(baseBlock);

  gameIsRunning = true;
  isDropping = false;
  score = 0;
  lives = INITIAL_LIVES;
  blockSpeed = INITIAL_BLOCK_SPEED;
  currentBlockSize = INITIAL_SQUARE_BLOCK_SIZE;
  updateScoreDisplay();
  updateLivesDisplay();

  spawnBlock();
  startTimer(() => gameOver("time-out"));
  animate();
}

function spawnBlock() {
  currentBlock = document.createElement("div");
  currentBlock.classList.add("block");

  currentBlock.style.width = `${currentBlockSize}px`;
  currentBlock.style.height = `${currentBlockSize}px`;

  const isTrumpBlock = Math.random() < TRUMP_BLOCK_CHANCE;
  if (isTrumpBlock) {
    currentBlock.dataset.type = "trump";
    currentBlock.style.backgroundImage = `url('assets/chocolate.png')`;
    currentBlock.style.backgroundColor = "rgba(255, 0, 0, 0.15)";
    currentBlock.style.border = "1.5px solid rgba(255, 0, 0, 0.4)";
    currentBlock.style.borderRadius = "6px";
  } else {
    currentBlock.dataset.type = "normal";
    currentBlock.style.backgroundImage = `url('assets/cat-food.png')`;
    currentBlock.style.backgroundColor = "";
    currentBlock.style.border = "";
  }

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
  if (!gameIsRunning || isDropping || !currentBlock) return;

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
  if (!gameIsRunning || isDropping || !currentBlock) return;

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
    const targetTop = tower.clientHeight - targetBottom - currentBlockSize;
    blockToAnimate.style.top = `${targetTop}px`;

    setTimeout(() => {
      if (!gameIsRunning) return;

      blockToAnimate.style.transition = "";

      if (blockToAnimate.dataset.type === "trump") {
        lives--;
        updateLivesDisplay();

        blockToAnimate.remove();

        if (lives <= 0) {
          gameOver("trump");
          return;
        }

        isDropping = false;
        spawnBlock();
        animate();
        return;
      }

      blockToAnimate.style.top = "";
      blockToAnimate.style.bottom = `${targetBottom}px`;

      score++;
      blockSpeed += SPEED_INCREMENT;

      currentBlockSize = Math.max(
        MIN_SQUARE_BLOCK_SIZE,
        currentBlockSize - SIZE_DECREMENT,
      );

      updateScoreDisplay();
      blocks.push(blockToAnimate);

      const maxHeight = tower.clientHeight - TOP_MARGIN;
      const currentBlockTop = targetBottom + currentBlockSize;

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
    isDropping = true;
    cancelAnimationFrame(animationFrameId);

    const blockToAnimate = currentBlock;
    blockToAnimate.style.transition =
      "transform 0.5s ease-in, opacity 0.5s ease-in";
    blockToAnimate.style.transform = `translateY(${GAME_OVER_FALL_DISTANCE}px)`;
    blockToAnimate.style.opacity = "0";

    setTimeout(() => {
      if (blockToAnimate && blockToAnimate.parentNode) {
        blockToAnimate.remove();
      }

      if (blockToAnimate.dataset.type === "trump") {
        if (gameIsRunning) {
          isDropping = false;
          spawnBlock();
          animate();
        }
        return;
      }

      lives--;
      updateLivesDisplay();

      if (lives <= 0) {
        gameOver("miss");
      } else if (gameIsRunning) {
        isDropping = false;
        spawnBlock();
        animate();
      }
    }, 500);
  }
}

function gameOver(reason) {
  gameIsRunning = false;
  isDropping = false;
  cancelAnimationFrame(animationFrameId);
  stopTimer();
  const timeSpent = getTimeSpentFormatted();

  if (reason === "time-out") {
    showModal("Tiden är slut!", createStatsHtml(score, timeSpent), "game-over");
  } else if (reason === "trump") {
    showModal(
      "<span>🍫</span>Game Over!<span>🍫</span>",
      `<p class="modal-text">Djur tål inte choklad!</p>${createStatsHtml(score, timeSpent)}`,
      "game-over",
    );
  } else {
    showModal(
      "<span>💥</span>Game Over<span>💥</span>",
      createStatsHtml(score, timeSpent),
      "game-over",
    );
  }
}

document.addEventListener("click", (e) => {
  if (e.target === startBtn || (startBtn && startBtn.contains(e.target)))
    return;
  placeBlock();
});

if (startBtn) {
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
  });
}

showInstructions();
