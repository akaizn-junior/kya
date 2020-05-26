// HELPERS

function isObj(o) {
  return o && typeof o === 'object' && o.constructor === Object;
}

function isArr(a) {
  return a && typeof a === 'object' && a.constructor === Array;
}

function lowerAndStrip(str) {
  return str.toLowerCase().replace(/\s/g, '');
}

function stripAndSplit(str) {
  return str.replace(/\s/g, '').split('+');
}

function isValidBinding(binding) {
  return (
    isObj(binding)
    && 'label' in binding
    && typeof binding.label === 'string'
    && 'keyBinding' in binding
    && typeof binding.keyBinding === 'string'
    && 'command' in binding
    && typeof binding.command === 'function'
  );
}

function normalize(key) {
  const lower = key.toLowerCase();
  const toNormalize = {
    space: 'Space',
    alt: 'Alt',
    backspace: 'Backspace',
    ctrl: 'Control',
    control: 'Control',
    tab: 'Tab',
    capslock: 'CapsLock',
    esc: 'Escape',
    escape: 'Escape',
    enter: 'Enter',
    delete: 'Delete',
    insert: 'Insert',
    home: 'Home',
    end: 'End',
    pagedown: 'PageDown',
    pageup: 'PageUp',
    arrowdown: 'ArrowDown',
    arrowup: 'ArrowUp',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
    downarrow: 'ArrowDown',
    uparrow: 'ArrowUp',
    leftarrow: 'ArrowLeft',
    rightarrow: 'ArrowRight',
    numlock: 'NumLock',
    scrolllock: 'ScrollLock',
    pause: 'Pause',
    shift: 'Shift',
    meta: 'Meta',
    contextmenu: 'ContextMenu'
  };

  // return a normalized version of the key
  return (
    Object.keys(toNormalize).includes(lower) && toNormalize[lower]
      ? toNormalize[lower]
      : key
  );
}

// RUNNER

function run(binds, opts = {}) {
  const { observe } = opts;
  // get valid option values
  let vObserve = isArr(observe) ? observe : [];

  let pressedCount = 1;
  let lastPressed = '';
  let pressed = [];

  const textInputs = [
    'text',
    'password',
    'email',
    'address',
    'textarea'
  ];

  const normalizedKeysToObserve = vObserve.map(o => {
    return stripAndSplit(o).map(k => normalize(k)).join('+');
  });

  return (e) => {
    let ignore = (
      e.target.hasAttribute('contenteditable')
      || textInputs.includes(e.target.getAttribute('type'))
      || textInputs.includes(e.target.nodeName.toLowerCase())
    );

    let pressedKey = e.key.trim() ? e.key : e.code;
    pressed.push(pressedKey);

    const altComposed = () => e.altKey ? 'Alt+' : '';
    const shiftComposed = () => e.shiftKey ? 'Shift+' : '';
    const ctrlComposed = () => e.ctrlKey ? 'Control+' : '';
    const metaComposed = () => e.metaKey ? 'Meta+' : '';

    const composedKey = pressed.length === 1
    ? altComposed()
      + shiftComposed()
      + ctrlComposed()
      + metaComposed()
      + pressedKey
    : pressed.join('+');

    let normalizedBinds = {};

    for (let i = 0; i < binds.length; i++) {
      const bind = binds[i];
      const normalizedKeyBinding = stripAndSplit(bind.keyBinding)
        .map(k => normalize(k))
        .join('+');

      normalizedBinds[normalizedKeyBinding] = {
        keyBinding: normalizedKeyBinding,
        command: bind.command,
        label: bind.label
      };
    }

    const matched = normalizedBinds[composedKey];

    const pass = !ignore
      || isValidBinding(matched)
      && normalizedKeysToObserve.includes(matched.keyBinding);

    if (matched && isValidBinding(matched) && pass) {
      // no defaults
      e.preventDefault();
      e.stopImmediatePropagation();

      // capture consecutive presses for a keybinding
      if (lowerAndStrip(matched.keyBinding) === lowerAndStrip(lastPressed)) {
        pressedCount++;
      } else {
        pressedCount = 1;
      }

      // run the command
      matched.command({
        ...matched,
        pressedCount
      });

      // register last pressed
      lastPressed = matched.keyBinding;
    }

    setTimeout(() => {
      // reset pressed count
      pressed = [];
    }, 250);
  }
}

// INTERFACE

function listen(binds, opts = {}) {
  if (!isArr(binds) || !isObj(opts)) {
    return;
  }

  window.addEventListener('keydown', run(binds, opts), false);
}

// EXPORT

window.kya = {
  listen
};
