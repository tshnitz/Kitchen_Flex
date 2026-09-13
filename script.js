(function () {
  'use strict';

  var DEFAULT_STATE = { direction: 'row', wrap: 'nowrap', justify: 'flex-start', align: 'flex-start' };
  var STORAGE_KEY = 'kitchenFlexProgress';
  var TRAY_WIDTH = 640;
  var TRAY_HEIGHT = 420;
  var CONFETTI_COLORS = ['#ff6b4a', '#3fb26f', '#ffd166', '#5aa9e6', '#c98a4b'];

  var LEVELS = [
    {
      instruction: "Push all the ingredients over to the right side of the tray.",
      items: [
        { e: '🍅', s: 'm' }, { e: '🧀', s: 'l' }, { e: '🍞', s: 'm' },
        { e: '🥕', s: 's' }, { e: '🥑', s: 'm' }
      ],
      target: { direction: 'row', wrap: 'nowrap', justify: 'flex-end', align: 'flex-start' }
    },
    {
      instruction: "Spread the ingredients out with equal space around every one of them.",
      items: [
        { e: '🍗', s: 'l' }, { e: '🥚', s: 's' }, { e: '🍄', s: 'm' },
        { e: '🫑', s: 'm' }, { e: '🥒', s: 's' }, { e: '🍋', s: 'm' }
      ],
      target: { direction: 'row', wrap: 'nowrap', justify: 'space-evenly', align: 'flex-start' }
    },
    {
      instruction: "Line all the ingredients up along the bottom edge of the tray.",
      items: [
        { e: '🍅', s: 's' }, { e: '🧀', s: 'l' }, { e: '🍞', s: 'm' },
        { e: '🥕', s: 'l' }, { e: '🥑', s: 's' }
      ],
      target: { direction: 'row', wrap: 'nowrap', justify: 'flex-start', align: 'flex-end' }
    },
    {
      instruction: "Stack the ingredients in a single column, from top to bottom.",
      items: [
        { e: '🍗', s: 'm' }, { e: '🥚', s: 's' }, { e: '🍄', s: 'm' }, { e: '🫑', s: 'l' }
      ],
      target: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'flex-start' }
    },
    {
      instruction: "Stack the ingredients in a column, pushed all the way down to the bottom of the tray.",
      items: [
        { e: '🍅', s: 'm' }, { e: '🧀', s: 's' }, { e: '🍞', s: 'l' }, { e: '🥕', s: 'm' }
      ],
      target: { direction: 'column', wrap: 'nowrap', justify: 'flex-end', align: 'flex-start' }
    },
    {
      instruction: "Stack the ingredients in a column, centered across the width of the tray.",
      items: [
        { e: '🥑', s: 'l' }, { e: '🍗', s: 'm' }, { e: '🥚', s: 's' },
        { e: '🍄', s: 'm' }, { e: '🫑', s: 'l' }
      ],
      target: { direction: 'column', wrap: 'nowrap', justify: 'flex-start', align: 'center' }
    },
    {
      instruction: "There are too many ingredients for one row — wrap them onto multiple centered rows.",
      items: [
        { e: '🍅', s: 'm' }, { e: '🧀', s: 'm' }, { e: '🍞', s: 'm' }, { e: '🥕', s: 'm' },
        { e: '🥑', s: 'm' }, { e: '🍗', s: 'm' }, { e: '🥚', s: 'm' }, { e: '🍄', s: 'm' },
        { e: '🫑', s: 'm' }, { e: '🥒', s: 'm' }, { e: '🍋', s: 'm' }, { e: '🧅', s: 'm' }
      ],
      target: { direction: 'row', wrap: 'wrap', justify: 'center', align: 'flex-start' }
    },
    {
      instruction: "Line the ingredients up in reverse order, centered both horizontally and vertically on the tray.",
      items: [
        { e: '🍅', s: 's' }, { e: '🧀', s: 'l' }, { e: '🍞', s: 'm' },
        { e: '🥕', s: 'l' }, { e: '🥑', s: 's' }, { e: '🍋', s: 'm' }
      ],
      target: { direction: 'row-reverse', wrap: 'nowrap', justify: 'center', align: 'center' }
    }
  ];

  var state = {
    currentLevel: 0,
    unlockedUpTo: 0,
    completed: LEVELS.map(function () { return false; }),
    attempts: LEVELS.map(function () { return 0; }),
    score: 0
  };
  var current = Object.assign({}, DEFAULT_STATE);

  var el = {
    levelIndicator: document.getElementById('level-indicator'),
    scoreIndicator: document.getElementById('score-indicator'),
    levelStrip: document.getElementById('level-strip'),
    instruction: document.getElementById('instruction'),
    tray: document.getElementById('tray'),
    trayViewport: document.getElementById('tray-viewport'),
    trayWrap: document.getElementById('tray-wrap'),
    confettiLayer: document.getElementById('confetti-layer'),
    feedback: document.getElementById('feedback'),
    attempts: document.getElementById('attempts'),
    ctrlDirection: document.getElementById('ctrl-direction'),
    ctrlWrap: document.getElementById('ctrl-wrap'),
    ctrlJustify: document.getElementById('ctrl-justify'),
    ctrlAlign: document.getElementById('ctrl-align'),
    btnCheck: document.getElementById('btn-check'),
    btnReset: document.getElementById('btn-reset'),
    btnNext: document.getElementById('btn-next')
  };

  function loadProgress() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var saved = JSON.parse(raw);
      if (!saved || typeof saved.currentLevel !== 'number') return;
      if (saved.currentLevel < 0 || saved.currentLevel >= LEVELS.length) return;
      state.currentLevel = saved.currentLevel;
      state.unlockedUpTo = saved.unlockedUpTo || 0;
      state.completed = Array.isArray(saved.completed) && saved.completed.length === LEVELS.length
        ? saved.completed : state.completed;
      state.attempts = Array.isArray(saved.attempts) && saved.attempts.length === LEVELS.length
        ? saved.attempts : state.attempts;
      state.score = typeof saved.score === 'number' ? saved.score : 0;
    } catch (err) {
      /* ignore corrupted/unavailable storage */
    }
  }

  function saveProgress() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        currentLevel: state.currentLevel,
        unlockedUpTo: state.unlockedUpTo,
        completed: state.completed,
        attempts: state.attempts,
        score: state.score
      }));
    } catch (err) {
      /* storage unavailable (private mode, quota, etc.) — game still works */
    }
  }

  function applyStateToTray() {
    el.tray.style.flexDirection = current.direction;
    el.tray.style.flexWrap = current.wrap;
    el.tray.style.justifyContent = current.justify;
    el.tray.style.alignItems = current.align;
  }

  function syncControlsFromState() {
    el.ctrlDirection.value = current.direction;
    el.ctrlWrap.value = current.wrap;
    el.ctrlJustify.value = current.justify;
    el.ctrlAlign.value = current.align;
  }

  function readControlsIntoState() {
    current.direction = el.ctrlDirection.value;
    current.wrap = el.ctrlWrap.value;
    current.justify = el.ctrlJustify.value;
    current.align = el.ctrlAlign.value;
    applyStateToTray();
  }

  function renderTrayItems(items) {
    el.tray.innerHTML = '';
    items.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'food-item size-' + item.s;
      div.textContent = item.e;
      el.tray.appendChild(div);
    });
  }

  function renderLevelStrip() {
    el.levelStrip.innerHTML = '';
    LEVELS.forEach(function (_, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'level-tab';
      btn.textContent = String(i + 1);
      var unlocked = i <= state.unlockedUpTo;
      if (unlocked) btn.classList.add('unlocked');
      if (state.completed[i]) btn.classList.add('completed');
      if (i === state.currentLevel) btn.classList.add('current');
      btn.disabled = !unlocked;
      btn.setAttribute('aria-label', 'Level ' + (i + 1) + (state.completed[i] ? ' (completed)' : ''));
      btn.addEventListener('click', function () {
        if (!unlocked) return;
        goToLevel(i);
      });
      el.levelStrip.appendChild(btn);
    });
  }

  function updateHeader() {
    el.levelIndicator.textContent = (state.currentLevel + 1) + ' of ' + LEVELS.length;
    el.scoreIndicator.textContent = String(state.score);
  }

  function updateAttemptsLabel() {
    var n = state.attempts[state.currentLevel];
    el.attempts.textContent = n === 0
      ? 'No attempts yet on this level.'
      : 'Attempts on this level: ' + n;
  }

  function setFeedback(text, kind) {
    el.feedback.textContent = text;
    el.feedback.classList.remove('success', 'fail');
    if (kind) el.feedback.classList.add(kind);
  }

  function fitTray() {
    var available = el.trayViewport.clientWidth;
    var scale = Math.min(1, available / TRAY_WIDTH);
    el.trayWrap.style.transform = 'scale(' + scale + ')';
    el.trayViewport.style.height = Math.round(TRAY_HEIGHT * scale) + 'px';
  }

  function goToLevel(index) {
    state.currentLevel = index;
    var level = LEVELS[index];
    current = Object.assign({}, DEFAULT_STATE);
    syncControlsFromState();
    applyStateToTray();
    renderTrayItems(level.items);
    el.instruction.textContent = level.instruction;
    setFeedback(' ', null);
    el.btnNext.hidden = true;
    updateHeader();
    updateAttemptsLabel();
    renderLevelStrip();
    saveProgress();
  }

  function statesMatch(a, b) {
    return a.direction === b.direction && a.wrap === b.wrap &&
      a.justify === b.justify && a.align === b.align;
  }

  function spawnConfetti() {
    for (var i = 0; i < 26; i++) {
      var piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.round(Math.random() * TRAY_WIDTH) + 'px';
      piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      piece.style.animationDelay = (Math.random() * 0.25) + 's';
      el.confettiLayer.appendChild(piece);
    }
    setTimeout(function () {
      el.confettiLayer.innerHTML = '';
    }, 1500);
  }

  function shakeTray() {
    el.tray.classList.remove('shake');
    void el.tray.offsetWidth;
    el.tray.classList.add('shake');
  }

  function checkSolution() {
    var level = LEVELS[state.currentLevel];
    var correct = statesMatch(current, level.target);

    if (correct) {
      var wasAlreadyCompleted = state.completed[state.currentLevel];
      state.completed[state.currentLevel] = true;
      if (state.currentLevel + 1 > state.unlockedUpTo) {
        state.unlockedUpTo = Math.min(state.currentLevel + 1, LEVELS.length - 1);
      }
      if (!wasAlreadyCompleted) {
        var attemptsUsed = state.attempts[state.currentLevel];
        var points = Math.max(50 - attemptsUsed * 10, 10);
        state.score += points;
      }
      setFeedback('🎉 Perfect plating! Order complete.', 'success');
      spawnConfetti();
      renderLevelStrip();
      updateHeader();
      saveProgress();

      if (state.currentLevel === LEVELS.length - 1) {
        el.btnNext.hidden = true;
        setFeedback('🎉 Perfect plating! You finished the whole menu!', 'success');
      } else {
        el.btnNext.hidden = false;
      }
    } else {
      state.attempts[state.currentLevel] += 1;
      updateAttemptsLabel();
      setFeedback('❌ Not quite what the chef ordered — try again.', 'fail');
      shakeTray();
      saveProgress();
    }
  }

  function resetLevel() {
    current = Object.assign({}, DEFAULT_STATE);
    syncControlsFromState();
    applyStateToTray();
    setFeedback(' ', null);
    el.btnNext.hidden = true;
  }

  function init() {
    loadProgress();

    el.ctrlDirection.addEventListener('change', readControlsIntoState);
    el.ctrlWrap.addEventListener('change', readControlsIntoState);
    el.ctrlJustify.addEventListener('change', readControlsIntoState);
    el.ctrlAlign.addEventListener('change', readControlsIntoState);

    el.btnCheck.addEventListener('click', checkSolution);
    el.btnReset.addEventListener('click', resetLevel);
    el.btnNext.addEventListener('click', function () {
      if (state.currentLevel < LEVELS.length - 1) {
        goToLevel(state.currentLevel + 1);
      }
    });

    window.addEventListener('resize', fitTray);

    goToLevel(state.currentLevel);
    fitTray();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
