import {
  BLOCK_HEIGHT,
  SQUARE_BLOCK_SIZE,
  INITIAL_BLOCK_WIDTH,
  INITIAL_BLOCK_SPEED,
  SPEED_INCREMENT,
  TOP_MARGIN,
  GAME_OVER_FALL_DISTANCE,
  GAME_OVER_DELAY,
  CONTAINER_PADDING,
  SPAWN_TOP_POSITION,
  LOGOS,
} from "./constants.js";

import { startTimer, stopTimer, getTimeSpentFormatted } from "./timer.js";
import { showModal, hideModal } from "./ui.js";

const tower = document.getElementById("tower");
const scoreDisplay = document.getElementById("score-value");

let currentBlock = null;
let blocks = [];
let gameIsRunning = true;
let isDropping = false;
let score = 0;
let blockSpeed = INITIAL_BLOCK_SPEED;
let animationFrameId;

function getRandomLogo() {
  return LOGOS[Math.floor(Math.random() * LOGOS.length)];
}

function getTowerHeight() {
  return blocks.reduce((totalHeight, block) => {
    const height = parseInt(block.style.height, 10) || BLOCK_HEIGHT;
    return totalHeight + height;
  }, 0);
}

export function startGame() {
  tower.innerHTML = "";
  blocks = [];
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
  if (scoreDisplay) scoreDisplay.textContent = score;
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

export function placeBlock() {
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
          "Grattis!",
          `Du nådde toppen och fick ${score} poäng på ${timeSpent}!`,
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

  if (reason === "time-out") {
    showModal(
      "Tiden är slut!",
      `Tiden tog slut! Du hann få ${score} poäng.`,
      "game-over",
    );
  } else {
    currentBlock.style.transition = "transform 1s ease-in, opacity 1s ease-in";
    currentBlock.style.transform = `translateY(${GAME_OVER_FALL_DISTANCE}px)`;
    currentBlock.style.opacity = "0";

    setTimeout(() => {
      showModal(
        "Game Over",
        `Du fick ${score} poäng på ${getTimeSpentFormatted()}.`,
        "game-over",
      );
    }, GAME_OVER_DELAY);
  }
}
