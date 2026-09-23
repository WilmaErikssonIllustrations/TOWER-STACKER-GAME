import { startGame, placeBlock, pauseGame } from "./game.js";
import { showInstructionsModal } from "./ui.js";

const startBtn = document.getElementById("start-btn");
const instructionsBtn = document.getElementById("instructions");

document.addEventListener("click", (e) => {
  if (e.target === startBtn || e.target === instructionsBtn) return;
  placeBlock();
});

if (startBtn) {
  startBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    startGame();
  });
}

if (instructionsBtn) {
  instructionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    pauseGame();
    showInstructionsModal();
  });
}
