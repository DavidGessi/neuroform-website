// pomodoro.js
(() => {
  const display = document.getElementById('pomodoro-display');
  const startPauseBtn = document.getElementById('start-pause');
  const resetBtn = document.getElementById('reset');
  const workInput = document.getElementById('work-min');
  const breakInput = document.getElementById('break-min');

  let timer = null;
  let secondsLeft = 25 * 60;
  let isRunning = false;
  let mode = 'work'; // 'work' or 'break'

  function updateDisplay() {
    const m = Math.floor(secondsLeft / 60).toString().padStart(2,'0');
    const s = (secondsLeft % 60).toString().padStart(2,'0');
    display.textContent = `${m}:${s}`;
  }

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    startPauseBtn.textContent = 'Pause';
    timer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(timer);
        isRunning = false;
        startPauseBtn.textContent = 'Start';
        // swap mode
        if (mode === 'work') {
          mode = 'break';
          secondsLeft = Number(breakInput.value || 5) * 60;
        } else {
          mode = 'work';
          secondsLeft = Number(workInput.value || 25) * 60;
        }
      }
      updateDisplay();
    }, 1000);
  }

  function pauseTimer() {
    if (!isRunning) return;
    clearInterval(timer);
    isRunning = false;
    startPauseBtn.textContent = 'Start';
  }

  function resetTimer() {
    pauseTimer();
    mode = 'work';
    secondsLeft = Number(workInput.value || 25) * 60;
    updateDisplay();
  }

  startPauseBtn.addEventListener('click', () => {
    if (!isRunning) startTimer();
    else pauseTimer();
  });

  resetBtn.addEventListener('click', resetTimer);

  workInput.addEventListener('change', () => {
    if (mode === 'work' && !isRunning) {
      secondsLeft = Number(workInput.value) * 60;
      updateDisplay();
    }
  });

  breakInput.addEventListener('change', () => {
    if (mode === 'break' && !isRunning) {
      secondsLeft = Number(breakInput.value) * 60;
      updateDisplay();
    }
  });

  // init
  secondsLeft = Number(workInput.value || 25) * 60;
  updateDisplay();
})();
