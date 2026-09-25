import { startGame, placeBlock } from "./game.js";
import { showInstructions } from "./ui.js";

const startBtn = document.getElementById("start-btn");

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
