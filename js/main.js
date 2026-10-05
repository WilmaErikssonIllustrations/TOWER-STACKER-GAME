// ==========================================
// 1. CONSTANTS & CONFIGURATION
// ==========================================

/**
 * Global configuration settings and game rules.
 * Centralized values for easy balancing of game mechanics.
 */
const CONFIG = {
  TOTAL_BLOCKS_TO_WIN: 8, // Total number of successful block placements required to win
  INITIAL_SQUARE_BLOCK_SIZE: 80, // Starting width for new spawned blocks (px)
  MIN_SQUARE_BLOCK_SIZE: 50, // Minimum allowable block width (px)
  SIZE_DECREMENT: 10, // Amount by which width decreases per placed block (px)
  INITIAL_BLOCK_WIDTH: 100, // Starting width for the base block / bowl (px)
  INITIAL_BLOCK_SPEED: 6, // Initial horizontal movement speed
  MAX_BLOCK_SPEED: 9, // Maximum horizontal movement speed
  SPEED_INCREMENT: 2, // Speed increase per placed block
  TOP_MARGIN: 95, // Top margin offset in the tower for the win line (px)
  GAME_OVER_FALL_DISTANCE: 200, // Distance a missed block falls during game over animation (px)
  CONTAINER_PADDING: 20, // Side padding / safety margin (px)
  SPAWN_TOP_POSITION: "10px", // Vertical spawn position for new blocks
  TRUMP_BLOCK_CHANCE: 0.25, // Base probability of spawning a chocolate trap block (0-1)
  INITIAL_LIVES: 3, // Starting number of lives
  GAME_TIME_LIMIT: 30, // Game time limit in seconds
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================

/**
 * Collection of DOM element references.
 */
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

/**
 * Reactive game state updated continuously during gameplay.
 */
let state = {
  timerInterval: null, // Reference to the setInterval timer
  timeLeft: CONFIG.GAME_TIME_LIMIT, // Remaining seconds on the timer
  lives: CONFIG.INITIAL_LIVES, // Current remaining lives
  score: 0, // Current player score
  blockSpeed: CONFIG.INITIAL_BLOCK_SPEED, // Current horizontal movement speed
  currentBlockSize: CONFIG.INITIAL_SQUARE_BLOCK_SIZE, // Current block width
  dynamicBlockHeight: 60, // Dynamic height per block based on total available height
  exactWinLineTop: 0, // Y-position of the win line relative to the tower
  currentBlock: null, // Reference to the active moving block
  blocks: [], // Array holding all stacked/placed blocks in the tower
  gameIsRunning: false, // Flag indicating whether the game is active
  isDropping: false, // Flag preventing double drops during fall animation
  animationFrameId: null, // Reference to requestAnimationFrame
  trumpBlocksSpawnedThisRound: 0, // Number of chocolate trap blocks spawned in the current round
  totalBlocksSpawnedThisRound: 0, // Total number of blocks spawned in the current round
  targetTrumpCount: 1, // Randomized target count of trap blocks to spawn
};

// ==========================================
// 4. TIMER SYSTEM
// ==========================================

/**
 * Module for managing the game countdown timer.
 */
const Timer = {
  /**
   * Starts the countdown timer.
   * @param {Function} onTimeOut - Callback function executed when time runs out.
   */
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

  /**
   * Stops the timer and clears the interval.
   */
  stop() {
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  },

  /**
   * Returns formatted elapsed time as a string (e.g., "15s").
   * @returns {string}
   */
  getFormattedTimeSpent() {
    return `${CONFIG.GAME_TIME_LIMIT - state.timeLeft}s`;
  },

  /**
   * Updates the timer display in the DOM.
   */
  updateDisplay() {
    if (DOM.timerDisplay) {
      DOM.timerDisplay.textContent = `${state.timeLeft}s`;
    }
  },
};

// ==========================================
// 5. UI & MODAL MANAGEMENT
// ==========================================

/**
 * Module for updating the UI, floating popups, and modals.
 */
const UI = {
  /**
   * Renders remaining lives as heart icons in the UI.
   */
  updateLives() {
    if (DOM.livesDisplay) {
      DOM.livesDisplay.textContent = "❤️".repeat(state.lives);
    }
  },

  /**
   * Updates the score value in the UI.
   */
  updateScore() {
    if (DOM.scoreDisplay) {
      DOM.scoreDisplay.textContent = state.score;
    }
  },

  /**
   * Displays a floating text animation for points/penalties that fades out upward.
   * @param {string} text - Text content to display (e.g., "+100" or "-❤️")
   * @param {number} x - X coordinate in pixels
   * @param {number} y - Y coordinate in pixels
   * @param {boolean} [isPenalty=false] - If true, styles the text with penalty colors (red)
   */
  showBonusText(text, x, y, isPenalty = false) {
    const bonusEl = document.createElement("div");
    bonusEl.className = `bonus-popup ${isPenalty ? "penalty" : "bonus"}`;
    bonusEl.textContent = text;

    bonusEl.style.left = `${x}px`;
    bonusEl.style.top = `${y}px`;

    DOM.tower.appendChild(bonusEl);

    // Trigger floating animation on the next frame
    requestAnimationFrame(() => {
      bonusEl.style.transform = "translateY(-30px)";
      bonusEl.style.opacity = "0";
    });

    // Remove element from DOM after transition completes
    setTimeout(() => bonusEl.remove(), 2000);
  },

  /**
   * Displays the game modal overlay (end screens or instructions).
   * @param {string} title - HTML/text title
   * @param {string} message - HTML/text content
   * @param {string} [type="default"] - Modal type ("game-over", "win", "instructions")
   */
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

  /**
   * Hides the game modal overlay.
   */
  hideModal() {
    if (DOM.gameModal) DOM.gameModal.classList.add("hidden");
  },

  /**
   * Shows initial game instructions.
   */
  showInstructions() {
    UI.showModal(
      "Snack Tower",
      "<p>Tryck för att släppa snacks, bygg ett så högt snacks-torn som möjligt innan tiden tar slut!</p>",
      "instructions",
    );
  },

  /**
   * Generates HTML markup for game statistics inside the modal.
   * @param {number} score - Total points achieved
   * @param {string} timeSpent - Elapsed time in seconds
   * @returns {string} HTML string
   */
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

/**
 * Core game engine module controlling game mechanics and flow.
 */
const Game = {
  /**
   * Calculates current total height of stacked blocks in pixels.
   * @returns {number} Combined height of all stacked blocks
   */
  getTowerHeight() {
    return state.blocks.reduce((totalHeight, block) => {
      const height = parseFloat(block.style.height) || state.dynamicBlockHeight;
      return totalHeight + height;
    }, 0);
  },

  /**
   * Resets all game variables and initializes a new gameplay round.
   */
  start() {
    cancelAnimationFrame(state.animationFrameId);
    Timer.stop();

    // Clear game board
    DOM.tower.innerHTML = "";
    state.blocks = [];
    state.currentBlock = null;
    UI.hideModal();

    // Adjust block height dynamically based on available tower height
    const availableHeight = DOM.tower.clientHeight - CONFIG.TOP_MARGIN;
    state.dynamicBlockHeight = availableHeight / CONFIG.TOTAL_BLOCKS_TO_WIN;

    // Render the target win line
    const exactTargetHeight =
      state.dynamicBlockHeight * CONFIG.TOTAL_BLOCKS_TO_WIN;
    state.exactWinLineTop = DOM.tower.clientHeight - exactTargetHeight;

    const winLine = document.createElement("div");
    winLine.id = "win-line";
    winLine.style.top = `${state.exactWinLineTop}px`;
    DOM.tower.appendChild(winLine);

    // Create and place base block (pet bowl) at the bottom
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

    // Reset game state properties
    state.gameIsRunning = true;
    state.isDropping = false;
    state.score = 0;
    state.lives = CONFIG.INITIAL_LIVES;
    state.blockSpeed = CONFIG.INITIAL_BLOCK_SPEED;
    state.currentBlockSize = CONFIG.INITIAL_SQUARE_BLOCK_SIZE;

    state.trumpBlocksSpawnedThisRound = 0;
    state.totalBlocksSpawnedThisRound = 0;
    state.targetTrumpCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 trap blocks per round

    UI.updateScore();
    UI.updateLives();

    Game.spawnBlock();
    Timer.start(() => Game.gameOver("time-out"));
    Game.animate();
  },

  /**
   * Spawns a new active block at the top and determines if it should be a trap (chocolate block).
   */
  spawnBlock() {
    state.currentBlock = document.createElement("div");
    state.currentBlock.classList.add("block");

    state.totalBlocksSpawnedThisRound++;

    let isTrumpBlock = false;

    // Logic to determine whether to spawn a trap block
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

    // Set dataset attribute for CSS styling (normal vs chocolate trap)
    state.currentBlock.dataset.type = isTrumpBlock ? "trump" : "normal";
    if (isTrumpBlock) state.trumpBlocksSpawnedThisRound++;

    // Apply dimensions and initial positions via JS
    Object.assign(state.currentBlock.style, {
      width: `${state.currentBlockSize}px`,
      height: `${state.dynamicBlockHeight}px`,
      top: CONFIG.SPAWN_TOP_POSITION,
      left: "0px",
    });

    state.currentBlock.dataset.direction = "right";
    DOM.tower.appendChild(state.currentBlock);
  },

  /**
   * Main animation loop moving the active block back and forth along the X-axis.
   */
  animate() {
    if (!state.gameIsRunning || state.isDropping || !state.currentBlock) return;

    const gameWidth = DOM.tower.clientWidth;
    let currentLeft = parseFloat(state.currentBlock.style.left || 0);
    const currentWidth = parseFloat(state.currentBlock.style.width);

    // Bounce off boundary walls
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

  /**
   * Handles dropping the block when triggered by click or keyboard input.
   * Calculates overlaps, hits, misses, and score updates.
   */
  placeBlock() {
    if (!state.gameIsRunning || state.isDropping || !state.currentBlock) return;

    const previousBlock = state.blocks[state.blocks.length - 1];
    const prevLeft = parseFloat(previousBlock.style.left);
    const prevWidth = parseFloat(previousBlock.style.width);

    const currLeft = parseFloat(state.currentBlock.style.left);
    const currWidth = parseFloat(state.currentBlock.style.width);

    // Calculate overlap between active block and top tower block
    const overlapStart = Math.max(prevLeft, currLeft);
    const overlapEnd = Math.min(prevLeft + prevWidth, currLeft + currWidth);
    const overlapWidth = overlapEnd - overlapStart;

    state.isDropping = true;
    cancelAnimationFrame(state.animationFrameId);

    const blockToAnimate = state.currentBlock;

    // CASE 1: Block lands successfully on top of tower (overlap > 5px)
    if (overlapWidth > 5) {
      const targetBottom = Game.getTowerHeight();
      const fallDuration = 350;

      // Animate fall down to tower top
      blockToAnimate.style.transition = `top ${fallDuration / 1000}s cubic-bezier(0.4, 0, 0.2, 1)`;
      void blockToAnimate.offsetHeight; // Force reflow to trigger transition

      const targetTop =
        DOM.tower.clientHeight - targetBottom - state.dynamicBlockHeight;

      blockToAnimate.style.top = `${targetTop}px`;

      setTimeout(() => {
        if (!state.gameIsRunning) return;
        blockToAnimate.style.transition = "";

        // If block was a chocolate trap: deduct a life and remove block
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

        // Lock block position
        blockToAnimate.style.top = `${targetTop}px`;

        // Evaluate placement accuracy
        const prevCenterX = prevLeft + prevWidth / 2;
        const currCenterX = currLeft + currWidth / 2;
        const alignmentDifference = Math.abs(currCenterX - prevCenterX);
        const isPerfect = alignmentDifference <= 5;

        let pointsEarned = 10;
        if (isPerfect) {
          pointsEarned = 100;
          UI.showBonusText("+100", currLeft, targetTop - 20);
        } else {
          UI.showBonusText("+10", currLeft, targetTop - 20);
        }

        // Increase difficulty for next block
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

        // Win condition evaluation
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
    }
    // CASE 2: Block misses tower completely
    else {
      // Animate fall down and fade out
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

        // Missing a trap block is good! Player earns points
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

        // Missing a regular block deducts a life
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

  /**
   * Ends game and displays summary modal with cause and scores.
   * @param {string} reason - Cause of game end ("time-out", "trump", "miss")
   */
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

// Global click event to drop active block (excluding start button clicks)
document.addEventListener("click", (e) => {
  if (
    DOM.startBtn &&
    (e.target === DOM.startBtn || DOM.startBtn.contains(e.target))
  )
    return;
  Game.placeBlock();
});

// Start button click listener
if (DOM.startBtn) {
  DOM.startBtn.addEventListener("click", (e) => {
    e.stopPropagation(); // Prevents click from bubbling to document click listener
    Game.start();
  });
}

// Keyboard input handling (Space / ArrowDown / Enter)
document.addEventListener("keydown", (e) => {
  // Start game via keyboard if inactive
  if (!state.gameIsRunning) {
    if (e.code === "Enter" || e.code === "Space") {
      e.preventDefault();
      Game.start();
    }
    return;
  }

  // Drop block during active gameplay
  if (e.code === "Space" || e.code === "ArrowDown") {
    e.preventDefault(); // Prevents page scrolling on keypress
    Game.placeBlock();
  }
});

// Initialize game state by presenting instruction modal
UI.showInstructions();
