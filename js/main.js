// ==========================================
// 1. CONSTANTS & CONFIGURATION
// ==========================================
const CONFIG = {
  BLOCK_HEIGHT: 60,
  INITIAL_SQUARE_BLOCK_SIZE: 80,
  MIN_SQUARE_BLOCK_SIZE: 50,
  SIZE_DECREMENT: 10,
  INITIAL_BLOCK_WIDTH: 100,
  INITIAL_BLOCK_SPEED: 6,
  MAX_BLOCK_SPEED: 7,
  SPEED_INCREMENT: 1,
  TOP_MARGIN: 130,
  GAME_OVER_FALL_DISTANCE: 200,
  CONTAINER_PADDING: 20,
  SPAWN_TOP_POSITION: "10px",
  TRUMP_BLOCK_CHANCE: 0.3,
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
  currentBlock: null,
  blocks: [],
  gameIsRunning: false,
  isDropping: false,
  animationFrameId: null,
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
      const height = parseInt(block.style.height, 10) || CONFIG.BLOCK_HEIGHT;
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

    const gameWidth = DOM.tower.clientWidth;
    const initialBlockWidth = Math.min(
      CONFIG.INITIAL_BLOCK_WIDTH,
      gameWidth - CONFIG.CONTAINER_PADDING,
    );

    // Skapa basblock
    const baseBlock = document.createElement("div");
    baseBlock.id = "base-block";
    baseBlock.classList.add("block");
    Object.assign(baseBlock.style, {
      width: `${initialBlockWidth}px`,
      height: `${CONFIG.BLOCK_HEIGHT}px`,
      left: `${(gameWidth - initialBlockWidth) / 2}px`,
      bottom: "0px",
      backgroundImage: "url('assets/pet-bowl.png')",
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
    });

    DOM.tower.appendChild(baseBlock);
    state.blocks.push(baseBlock);

    // Återställ tillstånd
    state.gameIsRunning = true;
    state.isDropping = false;
    state.score = 0;
    state.lives = CONFIG.INITIAL_LIVES;
    state.blockSpeed = CONFIG.INITIAL_BLOCK_SPEED;
    state.currentBlockSize = CONFIG.INITIAL_SQUARE_BLOCK_SIZE;

    UI.updateScore();
    UI.updateLives();

    Game.spawnBlock();
    Timer.start(() => Game.gameOver("time-out"));
    Game.animate();
  },

  spawnBlock() {
    state.currentBlock = document.createElement("div");
    state.currentBlock.classList.add("block");

    const isTrumpBlock = Math.random() < CONFIG.TRUMP_BLOCK_CHANCE;
    Object.assign(state.currentBlock.style, {
      width: `${state.currentBlockSize}px`,
      height: `${state.currentBlockSize}px`,
      top: CONFIG.SPAWN_TOP_POSITION,
      left: "0px",
    });

    if (isTrumpBlock) {
      state.currentBlock.dataset.type = "trump";
      Object.assign(state.currentBlock.style, {
        backgroundImage: "url('assets/chocolate.png')",
        backgroundColor: "rgba(255, 0, 0, 0.15)",
        border: "1.5px solid rgba(255, 0, 0, 0.4)",
        borderRadius: "6px",
      });
    } else {
      state.currentBlock.dataset.type = "normal";
      state.currentBlock.style.backgroundImage = "url('assets/cat-food.png')";
    }

    state.currentBlock.dataset.direction = "right";
    DOM.tower.appendChild(state.currentBlock);
  },

  animate() {
    if (!state.gameIsRunning || state.isDropping || !state.currentBlock) return;

    const gameWidth = DOM.tower.clientWidth;
    let currentLeft = parseInt(state.currentBlock.style.left || 0, 10);
    const currentWidth = parseInt(state.currentBlock.style.width, 10);

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
    const prevLeft = parseInt(previousBlock.style.left, 10);
    const prevWidth = parseInt(previousBlock.style.width, 10);

    const currLeft = parseInt(state.currentBlock.style.left, 10);
    const currWidth = parseInt(state.currentBlock.style.width, 10);

    const overlapStart = Math.max(prevLeft, currLeft);
    const overlapEnd = Math.min(prevLeft + prevWidth, currLeft + currWidth);
    const overlapWidth = overlapEnd - overlapStart;

    state.isDropping = true;
    cancelAnimationFrame(state.animationFrameId);

    const blockToAnimate = state.currentBlock;

    if (overlapWidth > 0) {
      const targetBottom = Game.getTowerHeight();
      const fallDuration = 350;
      blockToAnimate.style.transition = `top ${fallDuration / 1000}s cubic-bezier(0.4, 0, 0.2, 1)`;
      const targetTop =
        DOM.tower.clientHeight - targetBottom - state.currentBlockSize;
      blockToAnimate.style.top = `${targetTop}px`;

      setTimeout(() => {
        if (!state.gameIsRunning) return;
        blockToAnimate.style.transition = "";

        if (blockToAnimate.dataset.type === "trump") {
          state.lives--;
          UI.updateLives();
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

        blockToAnimate.style.top = "";
        blockToAnimate.style.bottom = `${targetBottom}px`;

        state.score++;
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

        const maxHeight = DOM.tower.clientHeight - CONFIG.TOP_MARGIN;
        const currentBlockTop = targetBottom + state.currentBlockSize;

        if (currentBlockTop >= maxHeight) {
          state.gameIsRunning = false;
          Timer.stop();
          blockToAnimate?.remove();

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

      setTimeout(() => {
        blockToAnimate?.remove();

        if (blockToAnimate.dataset.type === "trump") {
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
      message = `<p class="modal-text">Djur tål inte choklad!</p>${statsHtml}`;
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
