import { startGame, placeBlock } from "./game.js";

const startBtn = document.getElementById("start-btn");

document.addEventListener("click", (e) => {
  if (e.target === startBtn) return;
  placeBlock();
});

if (startBtn) {
  startBtn.addEventListener("click", startGame);
}
