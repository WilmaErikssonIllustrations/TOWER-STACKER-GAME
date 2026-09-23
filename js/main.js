import { startGame, placeBlock } from "./game.js";

const restartBtn = document.getElementById("restart-btn");

document.addEventListener("click", (e) => {
  if (e.target === restartBtn) return;
  placeBlock();
});

if (restartBtn) {
  restartBtn.addEventListener("click", startGame);
}

window.addEventListener("load", startGame);
