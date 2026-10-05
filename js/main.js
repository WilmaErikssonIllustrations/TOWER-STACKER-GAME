// ==========================================
// 1. CONSTANTS & CONFIGURATION
// ==========================================
const CONFIG = {
  TOTAL_BLOCKS_TO_WIN: 8,
  INITIAL_SQUARE_BLOCK_SIZE: 80,
  MIN_SQUARE_BLOCK_SIZE: 50,
  SIZE_DECREMENT: 10,
  INITIAL_BLOCK_WIDTH: 100,
  INITIAL_BLOCK_SPEED: 6,
  MAX_BLOCK_SPEED: 9,
  SPEED_INCREMENT: 2,
  TOP_MARGIN: 95,
  GAME_OVER_FALL_DISTANCE: 200,
  CONTAINER_PADDING: 20,
  SPAWN_TOP_POSITION: "10px",
  TRUMP_BLOCK_CHANCE: 0.25,
  INITIAL_LIVES: 3,
  GAME_TIME_LIMIT: 30,
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const DOM = {
  tower: document.getElementById("tower"),
  scoreDisplay: document.getElementById("score-value"),
  timerDisplay: document.getElementById("timer-value"),
  livesDisplay: document.getElementById("lives-value"),
  gameModal: document.getElementById("game-modal"),
  modalTitle: document.getElementById("modal-title"),
  modalMessage: document.getElementById("modal-message"),
  startBtn: document.getElementById("start-btn"),
};

// ==========================================
// 3. GAME STATE
// ==========================================
let state = {
  timerInterval: null,
  timeLeft: CONFIG.GAME_TIME_LIMIT,
  lives: CONFIG.INITIAL_LIVES,
  score: 0,
  blockSpeed: CONFIG.INITIAL_BLOCK_SPEED,
  currentBlockSize: CONFIG.INITIAL_SQUARE_BLOCK_SIZE,
  dynamicBlockHeight: 60,
  exactWinLineTop: 0, // Spara mållinjens position i state
  currentBlock: null,
  blocks: [],
  gameIsRunning: false,
  isDropping: false,
  animationFrameId: null,
  trumpBlocksSpawnedThisRound: 0,
  totalBlocksSpawnedThisRound: 0,
  targetTrumpCount: 1,
};

// ==========================================
// 4. TIMER SYSTEM
// ==========================================
const Timer = {
  start(onTimeOut) {
    Timer.stop();
    state.timeLeft = CONFIG.GAME_TIME_LIMIT;
    Timer.updateDisplay();

    state.timerInterval = setInterval(() => {
      state.timeLeft--;
      Timer.updateDisplay();
      if (state.timeLeft <= 0) {
        Timer.stop();
        if (onTimeOut) onTimeOut();
      }
    }, 1000);
  },

  stop() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  },

  getFormattedTimeSpent() {
    return `${CONFIG.GAME_TIME_LIMIT - state.timeLeft}s`;
  },

  updateDisplay() {
    if (DOM.timerDisplay) {
      DOM.timerDisplay.textContent = `${state.timeLeft}s`;
    }
  },
};

// ==========================================
// 5. UI & MODAL MANAGEMENT
// ==========================================
const UI = {
  updateLives() {
    if (DOM.livesDisplay) {
      DOM.livesDisplay.textContent = "❤️".repeat(state.lives);
    }
  },

  updateScore() {
    if (DOM.scoreDisplay) {
      DOM.scoreDisplay.textContent = state.score;
    }
  },
  showBonusText(text, x, y, isPenalty = false) {
    const bonusEl = document.createElement("div");
    bonusEl.className = `bonus-popup ${isPenalty ? "penalty" : "bonus"}`;
    bonusEl.textContent = text;

    bonusEl.style.left = `${x}px`;
    bonusEl.style.top = `${y}px`;

    DOM.tower.appendChild(bonusEl);

    requestAnimationFrame(() => {
      bonusEl.style.transform = "translateY(-30px)";
      bonusEl.style.opacity = "0";
    });

    setTimeout(() => bonusEl.remove(), 2000);
  },

  showModal(title, message, type = "default") {
    if (DOM.modalTitle) DOM.modalTitle.innerHTML = title;
    if (DOM.modalMessage) DOM.modalMessage.innerHTML = message;

    if (DOM.startBtn) {
      DOM.startBtn.textContent =
        type === "game-over" || type === "win" ? "Spela igen" : "Starta spelet";
    }

    DOM.gameModal.classList.toggle("game-over", type === "game-over");
    DOM.gameModal.classList.remove("hidden");
  },

  hideModal() {
    if (DOM.gameModal) DOM.gameModal.classList.add("hidden");
  },

  showInstructions() {
    UI.showModal(
      "Snack Tower",
      "<p>Tryck för att släppa snacks, bygg ett så högt snacks-torn som möjligt innan tiden tar slut!</p>",
      "instructions",
    );
  },

  createStatsHtml(score, timeSpent) {
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
  },
};

// ==========================================
// 6. GAME ENGINE & LOGIC
// ==========================================
const Game = {
  getTowerHeight() {
    return state.blocks.reduce((totalHeight, block) => {
      const height = parseFloat(block.style.height) || state.dynamicBlockHeight;
      return totalHeight + height;
    }, 0);
  },

  start() {
    cancelAnimationFrame(state.animationFrameId);
    Timer.stop();

    DOM.tower.innerHTML = "";
    state.blocks = [];
    state.currentBlock = null;
    UI.hideModal();

    const availableHeight = DOM.tower.clientHeight - CONFIG.TOP_MARGIN;
    state.dynamicBlockHeight = availableHeight / CONFIG.TOTAL_BLOCKS_TO_WIN;

    const exactTargetHeight =
      state.dynamicBlockHeight * CONFIG.TOTAL_BLOCKS_TO_WIN;
    state.exactWinLineTop = DOM.tower.clientHeight - exactTargetHeight;

    const winLine = document.createElement("div");
    winLine.id = "win-line";
    winLine.style.top = `${state.exactWinLineTop}px`;
    DOM.tower.appendChild(winLine);

    const gameWidth = DOM.tower.clientWidth;
    const initialBlockWidth = Math.min(
      CONFIG.INITIAL_BLOCK_WIDTH,
      gameWidth - CONFIG.CONTAINER_PADDING,
    );

    const baseBlock = document.createElement("div");
    baseBlock.id = "base-block";
    baseBlock.classList.add("block");

    const baseBlockTop = DOM.tower.clientHeight - state.dynamicBlockHeight;

    Object.assign(baseBlock.style, {
      width: `${initialBlockWidth}px`,
      height: `${state.dynamicBlockHeight}px`,
      left: `${(gameWidth - initialBlockWidth) / 2}px`,
      top: `${baseBlockTop}px`,
    });

    DOM.tower.appendChild(baseBlock);
    state.blocks.push(baseBlock);

    state.gameIsRunning = true;
    state.isDropping = false;
    state.score = 0;
    state.lives = CONFIG.INITIAL_LIVES;
    state.blockSpeed = CONFIG.INITIAL_BLOCK_SPEED;
    state.currentBlockSize = CONFIG.INITIAL_SQUARE_BLOCK_SIZE;

    state.trumpBlocksSpawnedThisRound = 0;
    state.totalBlocksSpawnedThisRound = 0;
    state.targetTrumpCount = Math.floor(Math.random() * 3) + 1;

    UI.updateScore();
    UI.updateLives();

    Game.spawnBlock();
    Timer.start(() => Game.gameOver("time-out"));
    Game.animate();
  },

  spawnBlock() {
    state.currentBlock = document.createElement("div");
    state.currentBlock.classList.add("block");

    state.totalBlocksSpawnedThisRound++;

    let isTrumpBlock = false;

    if (state.totalBlocksSpawnedThisRound > 1) {
      const currentHeight = Game.getTowerHeight();
      const remainingHeightToWin =
        DOM.tower.clientHeight - CONFIG.TOP_MARGIN - currentHeight;
      const estimatedBlocksRemaining = Math.max(
        1,
        Math.ceil(remainingHeightToWin / state.dynamicBlockHeight),
      );

      const canSpawnTrump =
        state.trumpBlocksSpawnedThisRound < 3 && estimatedBlocksRemaining > 1;

      if (canSpawnTrump) {
        const neededSoFar =
          state.targetTrumpCount - state.trumpBlocksSpawnedThisRound;

        if (estimatedBlocksRemaining <= neededSoFar + 1) {
          isTrumpBlock = true;
        } else {
          const chance = neededSoFar / estimatedBlocksRemaining;
          isTrumpBlock =
            Math.random() < chance ||
            (state.trumpBlocksSpawnedThisRound === 0 &&
              estimatedBlocksRemaining <= 4);
        }
      }
    }

    // Sätt datatyp så CSS styr utseendet
    state.currentBlock.dataset.type = isTrumpBlock ? "trump" : "normal";
    if (isTrumpBlock) state.trumpBlocksSpawnedThisRound++;

    // Endast storlek och position sätts via JS
    Object.assign(state.currentBlock.style, {
      width: `${state.currentBlockSize}px`,
      height: `${state.dynamicBlockHeight}px`,
      top: CONFIG.SPAWN_TOP_POSITION,
      left: "0px",
    });

    state.currentBlock.dataset.direction = "right";
    DOM.tower.appendChild(state.currentBlock);
  },

  animate() {
    if (!state.gameIsRunning || state.isDropping || !state.currentBlock) return;

    const gameWidth = DOM.tower.clientWidth;
    let currentLeft = parseFloat(state.currentBlock.style.left || 0);
    const currentWidth = parseFloat(state.currentBlock.style.width);

    if (state.currentBlock.dataset.direction === "right") {
      currentLeft += state.blockSpeed;
      if (currentLeft + currentWidth >= gameWidth) {
        state.currentBlock.dataset.direction = "left";
      }
    } else {
      currentLeft -= state.blockSpeed;
      if (currentLeft <= 0) {
        state.currentBlock.dataset.direction = "right";
      }
    }
    state.currentBlock.style.left = `${currentLeft}px`;

    state.animationFrameId = requestAnimationFrame(Game.animate);
  },

  placeBlock() {
    if (!state.gameIsRunning || state.isDropping || !state.currentBlock) return;

    const previousBlock = state.blocks[state.blocks.length - 1];
    const prevLeft = parseFloat(previousBlock.style.left);
    const prevWidth = parseFloat(previousBlock.style.width);

    const currLeft = parseFloat(state.currentBlock.style.left);
    const currWidth = parseFloat(state.currentBlock.style.width);

    const overlapStart = Math.max(prevLeft, currLeft);
    const overlapEnd = Math.min(prevLeft + prevWidth, currLeft + currWidth);
    const overlapWidth = overlapEnd - overlapStart;

    state.isDropping = true;
    cancelAnimationFrame(state.animationFrameId);

    const blockToAnimate = state.currentBlock;

    if (overlapWidth > 5) {
      const targetBottom = Game.getTowerHeight();
      const fallDuration = 350;

      blockToAnimate.style.transition = `top ${fallDuration / 1000}s cubic-bezier(0.4, 0, 0.2, 1)`;

      void blockToAnimate.offsetHeight;

      const targetTop =
        DOM.tower.clientHeight - targetBottom - state.dynamicBlockHeight;

      blockToAnimate.style.top = `${targetTop}px`;

      setTimeout(() => {
        if (!state.gameIsRunning) return;
        blockToAnimate.style.transition = "";

        if (blockToAnimate.dataset.type === "trump") {
          state.lives--;
          UI.updateLives();

          UI.showBonusText("-❤️", currLeft, targetTop - 20, true);

          blockToAnimate.remove();

          if (state.lives <= 0) {
            Game.gameOver("trump");
            return;
          }

          state.isDropping = false;
          Game.spawnBlock();
          Game.animate();
          return;
        }

        // Lås positionen med enbart `top`
        blockToAnimate.style.top = `${targetTop}px`;

        const prevCenterX = prevLeft + prevWidth / 2;
        const currCenterX = currLeft + currWidth / 2;
        const alignmentDifference = Math.abs(currCenterX - prevCenterX);

        const isPerfect = alignmentDifference <= 5;

        let pointsEarned = 10;
        if (isPerfect) {
          pointsEarned = 100;
          UI.showBonusText("+100", currLeft, targetTop - 20);
        } else {
          UI.showBonusText("+10", currLeft, targetTop - 20); // Visar +10 vid vanlig träff
        }

        state.score += pointsEarned;
        state.blockSpeed = Math.min(
          state.blockSpeed + CONFIG.SPEED_INCREMENT,
          CONFIG.MAX_BLOCK_SPEED,
        );
        state.currentBlockSize = Math.max(
          CONFIG.MIN_SQUARE_BLOCK_SIZE,
          state.currentBlockSize - CONFIG.SIZE_DECREMENT,
        );

        UI.updateScore();
        state.blocks.push(blockToAnimate);

        // Mållinje-beräkning (fungerar perfekt nu när allt använder top)
        const WIN_LINE_THICKNESS = 5;
        const winLineBottomFromTop = state.exactWinLineTop + WIN_LINE_THICKNESS;
        const blockTopFromTop = targetTop;

        const normalBlocksPlaced = state.blocks.length - 1;

        const reachedWinLine = blockTopFromTop <= winLineBottomFromTop + 2;
        const reachedTargetBlockCount =
          normalBlocksPlaced >= CONFIG.TOTAL_BLOCKS_TO_WIN;

        if (reachedWinLine || reachedTargetBlockCount) {
          state.gameIsRunning = false;
          Timer.stop();

          const timeSpent = Timer.getFormattedTimeSpent();
          UI.showModal(
            "<span>🥇</span>Du nådde toppen!<span>🥇</span>",
            UI.createStatsHtml(state.score, timeSpent),
            "win",
          );
          return;
        }

        state.isDropping = false;
        Game.spawnBlock();
        Game.animate();
      }, fallDuration);
    } else {
      blockToAnimate.style.transition =
        "transform 0.5s ease-in, opacity 0.5s ease-in";
      blockToAnimate.style.transform = `translateY(${CONFIG.GAME_OVER_FALL_DISTANCE}px)`;
      blockToAnimate.style.opacity = "0";

      const targetBottom = Game.getTowerHeight();
      const targetTop =
        DOM.tower.clientHeight - targetBottom - state.dynamicBlockHeight;

      if (blockToAnimate.dataset.type !== "trump") {
        UI.showBonusText("-❤️", currLeft, targetTop, true);
      }

      setTimeout(() => {
        blockToAnimate?.remove();

        if (blockToAnimate.dataset.type === "trump") {
          state.score += 10;
          UI.updateScore();
          UI.showBonusText("+10", currLeft, targetTop, false);

          if (state.gameIsRunning) {
            state.isDropping = false;
            Game.spawnBlock();
            Game.animate();
          }
          return;
        }

        state.lives--;
        UI.updateLives();

        if (state.lives <= 0) {
          Game.gameOver("miss");
        } else if (state.gameIsRunning) {
          state.isDropping = false;
          Game.spawnBlock();
          Game.animate();
        }
      }, 500);
    }
  },

  gameOver(reason) {
    state.gameIsRunning = false;
    state.isDropping = false;
    cancelAnimationFrame(state.animationFrameId);
    Timer.stop();

    const timeSpent = Timer.getFormattedTimeSpent();
    const statsHtml = UI.createStatsHtml(state.score, timeSpent);

    let title = "<span>💥</span>Game Over<span>💥</span>";
    let message = statsHtml;
    let type = "game-over";

    if (reason === "time-out") {
      title = "Tiden är slut!";
    } else if (reason === "trump") {
      title = "<span>🍫</span>Game Over!<span>🍫</span>";
      message = `<p>Djur tål inte choklad!</p>${statsHtml}`;
    }

    UI.showModal(title, message, type);
  },
};

// ==========================================
// 7. EVENT LISTENERS & INIT
// ==========================================
document.addEventListener("click", (e) => {
  if (
    DOM.startBtn &&
    (e.target === DOM.startBtn || DOM.startBtn.contains(e.target))
  )
    return;
  Game.placeBlock();
});

if (DOM.startBtn) {
  DOM.startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    Game.start();
  });
}

UI.showInstructions();
