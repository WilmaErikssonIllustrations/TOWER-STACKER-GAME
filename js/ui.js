const gameModal = document.getElementById("game-modal");
const modalTitle = document.getElementById("modal-title");
const modalMessage = document.getElementById("modal-message");
const startBtn = document.getElementById("start-btn");

export function showModal(title, message, type = "default") {
  if (modalTitle) modalTitle.textContent = title;
  if (modalMessage) modalMessage.innerHTML = message;

  if (startBtn) {
    if (type === "game-over" || type === "win") {
      startBtn.textContent = "Spela igen";
    } else {
      startBtn.textContent = "Starta spelet";
    }
  }

  if (type === "game-over") {
    gameModal.classList.add("game-over");
  } else {
    gameModal.classList.remove("game-over");
  }

  gameModal.classList.remove("hidden");
}

export function hideModal() {
  if (gameModal) gameModal.classList.add("hidden");
}

export function showInstructions() {
  showModal(
    "Tower Stacker",
    "Vänsterklicka för att släppa blocket. Bygg ett så högt torn som möjligt innan tiden tar slut!",
    "instructions",
  );
}
