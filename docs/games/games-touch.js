(function () {
  'use strict';

  var path = window.location.pathname || '';
  var isGamesHub = /\/games(?:\/index\.html)?\/?$/.test(path);
  if (isGamesHub) {
    return;
  }

  var isTouchCapable = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  var isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var isTabletOrMobile = window.matchMedia && window.matchMedia('(max-width: 1100px)').matches;

  if (!(isTouchCapable && (isCoarsePointer || isTabletOrMobile))) {
    return;
  }

  document.body.classList.add('touch-device');

  var pad = document.createElement('div');
  pad.className = 'touchpad-global';
  pad.innerHTML = [
    '<div class="touchpad-title">Touch контроли</div>',
    '<div class="touchpad-grid">',
    '  <button type="button" data-btn="up" aria-label="Нагоре">▲</button>',
    '  <button type="button" data-btn="space" aria-label="Действие">●</button>',
    '  <button type="button" data-btn="enter" aria-label="Потвърди">↵</button>',
    '  <button type="button" data-btn="left" aria-label="Наляво">◀</button>',
    '  <button type="button" data-btn="down" aria-label="Надолу">▼</button>',
    '  <button type="button" data-btn="right" aria-label="Надясно">▶</button>',
    '</div>'
  ].join('');
  document.body.appendChild(pad);

  var keyMap = {
    left: { code: 'ArrowLeft', key: 'ArrowLeft', hold: true },
    right: { code: 'ArrowRight', key: 'ArrowRight', hold: true },
    up: { code: 'ArrowUp', key: 'ArrowUp', hold: true },
    down: { code: 'ArrowDown', key: 'ArrowDown', hold: true },
    space: { code: 'Space', key: ' ', hold: false },
    enter: { code: 'Enter', key: 'Enter', hold: false }
  };

  var activeKeys = Object.create(null);

  function dispatchKeyboard(type, code, key) {
    var event;
    try {
      event = new KeyboardEvent(type, {
        bubbles: true,
        cancelable: true,
        code: code,
        key: key
      });
    } catch (error) {
      event = document.createEvent('Event');
      event.initEvent(type, true, true);
      event.code = code;
      event.key = key;
    }
    document.dispatchEvent(event);
  }

  function tapKey(code, key) {
    dispatchKeyboard('keydown', code, key);
    window.setTimeout(function () {
      dispatchKeyboard('keyup', code, key);
    }, 70);
  }

  function startHold(code, key) {
    if (activeKeys[code]) {
      return;
    }

    var state = {
      repeatDelay: null,
      repeatInterval: null,
      key: key
    };
    activeKeys[code] = state;

    dispatchKeyboard('keydown', code, key);

    state.repeatDelay = window.setTimeout(function () {
      state.repeatInterval = window.setInterval(function () {
        dispatchKeyboard('keydown', code, key);
      }, 120);
    }, 260);
  }

  function stopHold(code, key) {
    var state = activeKeys[code];
    if (!state) {
      return;
    }

    if (state.repeatDelay) {
      window.clearTimeout(state.repeatDelay);
    }
    if (state.repeatInterval) {
      window.clearInterval(state.repeatInterval);
    }

    delete activeKeys[code];
    dispatchKeyboard('keyup', code, key);
  }

  function bindControlButton(btnName) {
    var cfg = keyMap[btnName];
    var button = pad.querySelector('[data-btn="' + btnName + '"]');
    if (!cfg || !button) {
      return;
    }

    var onStart = function (e) {
      e.preventDefault();
      if (cfg.hold) {
        startHold(cfg.code, cfg.key);
      } else {
        tapKey(cfg.code, cfg.key);
      }
      button.classList.add('active');
    };

    var onEnd = function (e) {
      e.preventDefault();
      if (cfg.hold) {
        stopHold(cfg.code, cfg.key);
      }
      button.classList.remove('active');
    };

    button.addEventListener('touchstart', onStart, { passive: false });
    button.addEventListener('touchend', onEnd, { passive: false });
    button.addEventListener('touchcancel', onEnd, { passive: false });

    button.addEventListener('mousedown', onStart);
    button.addEventListener('mouseup', onEnd);
    button.addEventListener('mouseleave', onEnd);

    button.addEventListener('click', function (e) {
      e.preventDefault();
    });
  }

  Object.keys(keyMap).forEach(bindControlButton);

  var swipeStartX = 0;
  var swipeStartY = 0;
  var swipeStartAt = 0;

  document.addEventListener('touchstart', function (e) {
    if (!e.touches || e.touches.length !== 1) {
      return;
    }

    var target = e.target;
    if (!target) {
      return;
    }

    if (target.closest('.touchpad-global, button, input, textarea, select, a')) {
      return;
    }

    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
    swipeStartAt = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', function (e) {
    if (!swipeStartAt || !e.changedTouches || !e.changedTouches.length) {
      swipeStartAt = 0;
      return;
    }

    var touch = e.changedTouches[0];
    var dx = touch.clientX - swipeStartX;
    var dy = touch.clientY - swipeStartY;
    var elapsed = Date.now() - swipeStartAt;

    swipeStartAt = 0;

    if (elapsed > 650) {
      return;
    }

    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    if (Math.max(absX, absY) < 36) {
      return;
    }

    if (absX > absY) {
      tapKey(dx > 0 ? 'ArrowRight' : 'ArrowLeft', dx > 0 ? 'ArrowRight' : 'ArrowLeft');
    } else {
      tapKey(dy > 0 ? 'ArrowDown' : 'ArrowUp', dy > 0 ? 'ArrowDown' : 'ArrowUp');
    }
  }, { passive: true });

  pad.addEventListener('contextmenu', function (e) {
    e.preventDefault();
  });
})();
