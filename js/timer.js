let timerInterval = null;
let timeLeft = 60;

const timerDisplay = document.getElementById("timer-value");

export function startTimer(onTimeOut) {
  stopTimer();
  timeLeft = 30;
  updateDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      if (onTimeOut) onTimeOut();
    }
  }, 1000);
}

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function getTimeSpentFormatted() {
  const timeSpent = 30 - timeLeft;
  return `${timeSpent}s`;
}

function updateDisplay() {
  if (timerDisplay) {
    timerDisplay.textContent = `${timeLeft}s`;
  }
}
