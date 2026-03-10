(function() {
    'use strict';

    let isEnabled = localStorage.getItem('ah_enabled') === 'true';
    let threshold = parseInt(localStorage.getItem('ah_threshold')) || 90;
    let pos = JSON.parse(localStorage.getItem('ah_pos')) || { x: 500, y: 5 };
    let lock = false;

    const findPotion = () => {
        if (!window.Engine || !window.Engine.items) return null;
        const items = window.Engine.items.fetchLocationItems('g');
        const heroLvl = window.Engine.hero.d.lvl;

        for (let i = items.length - 1; i >= 0; i--) {
            const it = items[i];
            const s = it._cachedStats || (it.d && it.d.st) || {};
            if ((s.leczy || s.fullheal || s.perheal) && (!s.lvl || s.lvl <= heroLvl)) {
                return it.id;
            }
        }
        return null;
    };

    const run = () => {
        if (!isEnabled || lock) return;

        const hpSpan = document.querySelector('.hpp .value');
        if (!hpSpan) return;

        const currentPerc = parseInt(hpSpan.innerText);
        if (isNaN(currentPerc) || currentPerc >= 100) return;

        if (window.g && window.g.battle) return;

        if (currentPerc <= threshold) {
            const potId = findPotion();
            if (potId) {
                lock = true;

                if (window.useItemById) window.useItemById(potId);
                else if (window.Engine.items && window.Engine.items.use) window.Engine.items.use(potId);
                else window._g(`moveitem&st=1&id=${potId}`);

                setTimeout(() => { lock = false; }, 200);
            }
        }
    };

    setInterval(run, 50);

    const ui = document.createElement('div');
    ui.id = 'ah-ui-panel';
    ui.style = `position:fixed; top:${pos.y}px; left:${pos.x}px; display: flex;align-items: center;gap: 7px;background: rgb(0 0 0 / 70%);backdrop-filter: blur(1px);padding: 2px 4px;border-radius: 3px;z-index: 10001;font-family: math;user-select: none;cursor: grab;box-shadow: 0 0 0 1px #010101, 0 0 0 2px #5600b4, 0 0 5px 0px black;`;
    ui.innerHTML = `
        <img src="https://micc.garmory-cdn.cloud/obrazki/itemy/pot/pot81.gif" draggable="false" style="width:22px; pointer-events:none;">
        <label class="ah-sw"><input type="checkbox" id="ah-toggle-btn" ${isEnabled ? 'checked' : ''}><span class="ah-sl"></span></label>
        <div style="display:flex; align-items:center; color:white;">
            <input type="number" id="ah-hp-input" value="${threshold}" style="width:30px; background:transparent; color:white; border:none; font-size:11px; text-align:center; outline:none;">
            <span style="font-size:10px; color:#aaa;">%</span>
        </div>
    `;

    const style = document.createElement('style');
    style.innerHTML = `.ah-sw{position:relative;width:32px;height:18px;display:inline-block}.ah-sw input{opacity:0;width:0;height:0}.ah-sl{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:#333;transition:.3s;border-radius:18px;border:1px solid #555}.ah-sl:before{position:absolute;content:"";height:12px;width:12px;left:3px;bottom:2px;background:white;transition:.3s;border-radius:50%}input:checked + .ah-sl{background:#5600b4;border-color:#a14cff}input:checked + .ah-sl:before{transform:translateX(14px)}#ah-ui-panel:active{cursor:grabbing}#ah-hp-input::-webkit-inner-spin-button{-webkit-appearance:none;}`;
    document.head.appendChild(style);
    document.body.appendChild(ui);

    let active = false, initialX, initialY, xOffset = pos.x, yOffset = pos.y;
    const dragStart = (e) => {
        if (e.target.closest('#ah-hp-input') || e.target.closest('.ah-sw')) return;
        initialX = e.clientX - xOffset; initialY = e.clientY - yOffset;
        if (ui.contains(e.target)) active = true;
    };
    const dragEnd = () => { if (!active) return; active = false; localStorage.setItem('ah_pos', JSON.stringify({ x: xOffset, y: yOffset })); };
    const drag = (e) => { if (!active) return; e.preventDefault(); xOffset = e.clientX - initialX; yOffset = e.clientY - initialY; ui.style.left = xOffset + "px"; ui.style.top = yOffset + "px"; };

    document.addEventListener("mousedown", dragStart);
    document.addEventListener("mouseup", dragEnd);
    document.addEventListener("mousemove", drag);

    document.getElementById('ah-toggle-btn').onchange = (e) => { isEnabled = e.target.checked; localStorage.setItem('ah_enabled', isEnabled); };
    document.getElementById('ah-hp-input').oninput = (e) => { threshold = parseInt(e.target.value) || 0; localStorage.setItem('ah_threshold', threshold); };
})();
