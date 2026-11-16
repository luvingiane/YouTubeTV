/**
 * Supporto controller: traduce la Gamepad API in tasti/azioni.
 * Caricato dal preload della finestra principale e da quello della finestra impostazioni.
 *
 * Chromium espone i pad in due modi:
 *  - mapping "standard" (Xbox, DualShock...): D-pad = pulsanti 12..15, Start = 9, Select = 8.
 *  - mapping "" (es. 8BitDo su Linux): D-pad = assi hat 6 e 7, Select = 6, Start = 7.
 * Entrambi vengono ricondotti agli stessi nomi di azione (vedi NAMES_*).
 */
(() => {

    const { ipcRenderer } = require('electron');

    /* ------------------------------------------------------------------ *
     *  BINDING: nome del pulsante -> azione. Modificare qui per cambiarli.
     * ------------------------------------------------------------------ */

    const KEYS = {
        up:    { key: 'ArrowUp',    code: 'ArrowUp',    keyCode: 38 },
        down:  { key: 'ArrowDown',  code: 'ArrowDown',  keyCode: 40 },
        left:  { key: 'ArrowLeft',  code: 'ArrowLeft',  keyCode: 37 },
        right: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
        enter: { key: 'Enter',      code: 'Enter',      keyCode: 13 },
        back:  { key: 'Escape',     code: 'Escape',     keyCode: 27 },
    };

    const sendKey = (def) => {
        const target = document.activeElement || document.body;
        for (const type of ['keydown', 'keyup']) {
            const ev = new KeyboardEvent(type, {
                key: def.key, code: def.code, keyCode: def.keyCode, which: def.keyCode,
                bubbles: true, cancelable: true,
            });
            // Alcune versioni di Chromium ignorano keyCode/which nel costruttore.
            Object.defineProperty(ev, 'keyCode', { get: () => def.keyCode });
            Object.defineProperty(ev, 'which', { get: () => def.keyCode });
            target.dispatchEvent(ev);
        }
    };

    const video = () => document.querySelector('video');
    const togglePlay = () => { const v = video(); if (v) { v.paused ? v.play() : v.pause(); } };
    const seek = (delta) => {
        const v = video();
        if (v && isFinite(v.duration)) v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
    };

    /** Azioni per nome di pulsante; `repeat` = si ripete tenendolo premuto. */
    const ACTIONS = {
        a:      { run: () => sendKey(KEYS.enter) },
        b:      { run: () => sendKey(KEYS.back) },
        x:      { run: togglePlay },
        start:  { run: togglePlay },
        select: { run: () => ipcRenderer.send('ytv:toggle-settings') },
        lb:     { run: () => seek(-10), repeat: true },
        rb:     { run: () => seek(10),  repeat: true },
        up:     { run: () => sendKey(KEYS.up),    repeat: true },
        down:   { run: () => sendKey(KEYS.down),  repeat: true },
        left:   { run: () => sendKey(KEYS.left),  repeat: true },
        right:  { run: () => sendKey(KEYS.right), repeat: true },
    };

    /* ------------------------------------------------------------------ *
     *  Lettura dei pad
     * ------------------------------------------------------------------ */

    // Indice pulsante -> nome, per i due tipi di mappatura.
    const NAMES_STANDARD = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 8: 'select', 9: 'start',
                             12: 'up', 13: 'down', 14: 'left', 15: 'right' };
    const NAMES_RAW      = { 0: 'a', 1: 'b', 2: 'x', 3: 'y', 4: 'lb', 5: 'rb', 6: 'select', 7: 'start' };

    const DEADZONE = 0.5;
    const REPEAT_DELAY = 400;
    const REPEAT_RATE = 120;

    /** Nome -> { since, last }: quando è stato premuto e quando è scattata l'ultima ripetizione. */
    const held = new Map();
    /** Al primo giro i tasti già premuti (es. la "A" con cui ES-DE ha lanciato l'app) vanno ignorati finché non vengono rilasciati. */
    let firstPoll = true;

    const poll = () => {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        const now = Date.now();
        const down = new Set();

        for (const pad of pads) {
            if (!pad || !pad.connected) continue;

            const standard = pad.mapping === 'standard';
            const names = standard ? NAMES_STANDARD : NAMES_RAW;
            pad.buttons.forEach((b, i) => { if (b.pressed && names[i]) down.add(names[i]); });

            // Stick sinistro (assi 0/1) come D-pad.
            const lx = pad.axes[0] || 0, ly = pad.axes[1] || 0;
            if (ly < -DEADZONE) down.add('up');
            if (ly >  DEADZONE) down.add('down');
            if (lx < -DEADZONE) down.add('left');
            if (lx >  DEADZONE) down.add('right');

            // Pad non standard: il D-pad è un hat sugli assi 6 (X) e 7 (Y).
            if (!standard) {
                const hx = pad.axes[6] || 0, hy = pad.axes[7] || 0;
                if (hy < -DEADZONE) down.add('up');
                if (hy >  DEADZONE) down.add('down');
                if (hx < -DEADZONE) down.add('left');
                if (hx >  DEADZONE) down.add('right');
            }
        }

        if (firstPoll) {
            firstPoll = false;
            // since = Infinity: considerati "tenuti" da prima, senza azione né ripetizione.
            for (const name of down) held.set(name, { since: Infinity, last: Infinity });
        }

        for (const name of down) {
            const action = ACTIONS[name];
            if (!action) continue;
            const state = held.get(name);
            if (!state) {
                held.set(name, { since: now, last: now });
                action.run();
            } else if (action.repeat && now - state.since > REPEAT_DELAY && now - state.last > REPEAT_RATE) {
                state.last = now;
                action.run();
            }
        }
        for (const name of [...held.keys()]) if (!down.has(name)) held.delete(name);
    };

    setInterval(poll, 30);

    /** true se qualunque pulsante è premuto o uno stick/hat è lontano dal centro. */
    const anyPressed = () => {
        const pads = navigator.getGamepads ? navigator.getGamepads() : [];
        for (const pad of pads) {
            if (!pad || !pad.connected) continue;
            if (pad.buttons.some((b) => b.pressed)) return true;
            if ([0, 1, 6, 7].some((i) => Math.abs(pad.axes[i] || 0) > DEADZONE)) return true;
        }
        return false;
    };

    /**
     * Chiude l'app solo quando il pad è a riposo. Chiudendo mentre "A" è ancora premuto, ES-DE (che riprende il
     * controller) lo vedrebbe come una nuova pressione e rilancerebbe subito l'app.
     */
    window.ytvQuit = () => {
        const start = Date.now();
        const timer = setInterval(() => {
            if (anyPressed() && Date.now() - start < 3000) return;
            clearInterval(timer);
            setTimeout(() => ipcRenderer.send('ytv:quit'), 250);
        }, 50);
    };

})();
