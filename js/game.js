import {
  BLOCK_HEIGHT,
  INITIAL_BLOCK_WIDTH,
  INITIAL_BLOCK_SPEED,
  SPEED_INCREMENT,
  TOP_MARGIN,
  GAME_OVER_FALL_DISTANCE,
  GAME_OVER_DELAY,
  CONTAINER_PADDING,
  SPAWN_TOP_POSITION,
} from "./constants.js";

const tower = document.getElementById("tower");
const scoreDisplay = document.getElementById("score-value");
const gameModal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");

let currentBlock = null;
let blocks = [];
let gameIsRunning = true;
let score = 0;
let blockSpeed = INITIAL_BLOCK_SPEED;
let animationFrameId;

export function startGame() {
  tower.innerHTML = "";
  blocks = [];
  gameModal.classList.add("hidden");

  const gameWidth = tower.clientWidth;
  const initialBlockWidth = Math.min(
    INITIAL_BLOCK_WIDTH,
    gameWidth - CONTAINER_PADDING,
  );

  const baseBlock = document.createElement("div");
  baseBlock.id = "base-block";
  baseBlock.classList.add("block");
  baseBlock.style.width = `${initialBlockWidth}px`;
  baseBlock.style.left = `${(gameWidth - initialBlockWidth) / 2}px`;
  baseBlock.style.bottom = "0px";

  tower.appendChild(baseBlock);
  blocks.push(baseBlock);

  spawnBlock();
  gameIsRunning = true;
  score = 0;
  blockSpeed = INITIAL_BLOCK_SPEED;
  updateScoreDisplay();

  animate();
}

function spawnBlock() {
  currentBlock = document.createElement("div");
  currentBlock.classList.add("block");

  const previousBlockWidth = parseInt(
    blocks[blocks.length - 1].style.width,
    10,
  );
  currentBlock.style.width = `${previousBlockWidth}px`;

  currentBlock.style.top = SPAWN_TOP_POSITION;
  currentBlock.style.bottom = "";
  currentBlock.style.left = "0px";
  currentBlock.dataset.direction = "right";

  tower.appendChild(currentBlock);
}

function updateScoreDisplay() {
  if (scoreDisplay) scoreDisplay.textContent = score;
}

function animate() {
  if (!gameIsRunning) return;

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

export function placeBlock() {
  if (!gameIsRunning) return;

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
    currentBlock.style.width = `${overlapWidth}px`;
    currentBlock.style.left = `${overlapStart}px`;

    currentBlock.style.top = "";
    const newBottom = blocks.length * BLOCK_HEIGHT;
    currentBlock.style.bottom = `${newBottom}px`;

    score++;
    blockSpeed += SPEED_INCREMENT;
    updateScoreDisplay();

    blocks.push(currentBlock);

    const maxHeight = tower.clientHeight - TOP_MARGIN;
    if (newBottom >= maxHeight) {
      gameIsRunning = false;
      cancelAnimationFrame(animationFrameId);
      if (currentBlock && currentBlock.parentNode) {
        currentBlock.remove();
      }
      showModal("Grattis!", `Du nådde toppen och fick ${score} poäng!`, "win");

      return;
    }

    spawnBlock();
  } else {
    gameOver();
  }
}

function gameOver() {
  gameIsRunning = false;
  cancelAnimationFrame(animationFrameId);

  currentBlock.style.transition = "transform 1s ease-in, opacity 1s ease-in";
  currentBlock.style.transform = `translateY(${GAME_OVER_FALL_DISTANCE}px)`;
  currentBlock.style.opacity = "0";

  setTimeout(() => {
    showModal("Game Over", `Du fick ${score} poäng.`, "game-over");
  }, GAME_OVER_DELAY);
}

function showModal(title, message, type) {
  if (modalTitle) modalTitle.textContent = title;
  if (modalMessage) modalMessage.textContent = message;

  if (type === "game-over") {
    gameModal.classList.add("game-over");
  } else {
    gameModal.classList.remove("game-over");
  }

  gameModal.classList.remove("hidden");
}
