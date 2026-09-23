import { startGame, placeBlock } from "./game.js";

document.addEventListener("click", placeBlock);

window.addEventListener("load", startGame);
