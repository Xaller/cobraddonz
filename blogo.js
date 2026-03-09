(function() {
    'use strict';

    const CLAN_TOOLTIPS = {
        1: "\n Cechy \n pancerz",
        2: "\n Cechy \n sa",
        3: "\n Lowkryt x2 \n sa",
        4: "\n Cechy \n życie x2",
        5: "\n Cechy \n niszcz. panca/odp",
        6: "\n Cechy \n unik \n ob. sa",
        7: "\n ck \n cechy \n lt \n unik"
    };

    const STORAGE = {
        NAME: 'margo_bless_name',
        CLAN: 'margo_bless_clan_opt',
        STATE: 'margo_bless_active',
        POS: 'margo_bless_pos',
        MIN: 'margo_bless_minimized'
    };

    // --- KOLORYSTYKA Z TWOJEJ WYSZUKIWARKI ---
    const THEME = {
        bg: 'rgba(0, 0, 0, 0.85)',
        border: '#cebb9d',
        header: '#3e2723',
        inputBg: '#1a1a1a',
        text: '#fff',
        active: '#ffae00' // Złoty puls z wyszukiwarki
    };

    let targetBlessName = localStorage.getItem(STORAGE.NAME) || "";
    let targetClanOpt = localStorage.getItem(STORAGE.CLAN) || "";
    let isActive = localStorage.getItem(STORAGE.STATE) !== 'false';
    let isMinimized = localStorage.getItem(STORAGE.MIN) === 'true';
    let pos = JSON.parse(localStorage.getItem(STORAGE.POS)) || { x: 100, y: 100 };

    const clamp = (val, min, max) => Math.max(min, Math.min(val, max));

    function instantUse() {
        if (!isActive) return;
        let used = false;
        if (targetClanOpt) {
            window._g(`clan&a=skills_use&name=blessing&opt=${targetClanOpt}&ans=1`);
            used = true;
        } else if (targetBlessName && window.Engine?.heroEquipment) {
            const bag = window.Engine.heroEquipment.getHItems();
            const item = Object.values(bag).find(i => i.name && i.name.toLowerCase().includes(targetBlessName.toLowerCase()));
            if (item) {
                window._g(`moveitem&st=1&id=${item.id}`);
                used = true;
            }
        }
        if (used) {
            isActive = false;
            localStorage.setItem(STORAGE.STATE, isActive);
            updateBtn();
        }
    }

    const originalOnMessage = window.Engine.communication.onMessageWebSocket;
    window.Engine.communication.onMessageWebSocket = function(event) {
        if (isActive) {
            try {
                const data = JSON.parse(event.data);
                if ((data.f && data.f.close === 1) || (data.battle && data.battle.finished)) instantUse();
            } catch (e) {}
        }
        return originalOnMessage.apply(this, arguments);
    };

    function updateBtn() {
        const btn = document.getElementById('ab_toggle');
        if (!btn) return;
        btn.style.background = isActive ? '#2e7d32' : '#c62828';
        btn.innerText = isActive ? 'AUTO-BLESS: ON' : 'AUTO-BLESS: OFF';
    }

    function createGUI() {
        if (document.getElementById('ab_container')) {
            window.renderBlessingIcons();
            window.renderClanButtons();
            return;
        }

        const container = document.createElement('div');
        container.id = 'ab_container';
        container.style = `position: absolute; left: ${pos.x}px; top: ${pos.y}px; z-index: 9999; background: ${THEME.bg}; border: 2px solid ${THEME.border}; border-radius: 4px; font-family: Arial, sans-serif; box-shadow: 0 0 10px #000; width: 160px; user-select: none; color: ${THEME.text}; box-sizing: border-box;`;

        const header = document.createElement('div');
        header.id = 'ab_header';
        header.style = `background: ${THEME.header}; color: ${THEME.border}; padding: 6px; font-size: 11px; font-weight: bold; cursor: move; text-align: center; border-bottom: 1px solid ${THEME.border}; display: flex; justify-content: space-between;`;
        header.innerHTML = `<span style="margin-left:5px">AUTO BLESS</span> <span id="ab_minimize" style="cursor:pointer; margin-right:5px">${isMinimized ? '展开' : '━'}</span>`;

        const content = document.createElement('div');
        content.id = 'ab_content';
        content.style = `padding: 8px; display: ${isMinimized ? 'none' : 'block'};`;
        content.innerHTML = `
            <input type="text" id="ab_input" value="${targetBlessName}" placeholder="Szukaj błoga..."
                style="width: 100%; background: ${THEME.inputBg}; border: 1px solid ${THEME.border}; color: #fff; padding: 4px; font-size: 10px; margin-bottom: 8px; box-sizing: border-box;">
            
            <div id="ab_icons_wrapper" style="display: grid; grid-template-columns: repeat(3, 34px); gap: 5px; background: rgba(0,0,0,0.3); padding: 5px; border: 1px solid #444; max-height: 90px; overflow-y: auto; justify-content: center; margin-bottom: 8px;"></div>

            <div style="font-size: 9px; text-align: center; margin-bottom: 5px; color: ${THEME.border}; opacity: 0.8; text-transform: uppercase;">Błogosławieństwa Klanowe</div>
            <div id="ab_clan_wrapper" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; margin-bottom: 8px;"></div>

            <button id="ab_toggle" style="width: 100%; border: 1px solid ${THEME.border}; padding: 6px; font-weight: bold; font-size: 10px; cursor: pointer; border-radius: 2px; transition: 0.2s;"></button>
        `;

        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);

        // Renderowanie przycisków klanowych
        window.renderClanButtons = () => {
            const wrapper = document.getElementById('ab_clan_wrapper');
            if (!wrapper || isMinimized) return;
            wrapper.innerHTML = '';
            for (let i = 1; i <= 7; i++) {
                const btn = document.createElement('div');
                const isSel = targetClanOpt === String(i);
                btn.title = CLAN_TOOLTIPS[i] || "";
                btn.innerText = i;
                btn.style = `cursor: pointer; border: 1px solid ${isSel ? THEME.active : '#444'}; background: ${isSel ? '#4a3621' : '#1a1a1a'}; text-align: center; font-size: 11px; padding: 4px 0; color: ${isSel ? THEME.active : '#fff'}; font-weight: bold; border-radius: 2px;`;
                btn.onclick = () => {
                    targetBlessName = "";
                    document.getElementById('ab_input').value = "";
                    localStorage.setItem(STORAGE.NAME, "");
                    targetClanOpt = String(i);
                    localStorage.setItem(STORAGE.CLAN, targetClanOpt);
                    window.renderBlessingIcons();
                    window.renderClanButtons();
                };
                wrapper.appendChild(btn);
            }
        };

        // Renderowanie ikon z torby
        window.renderBlessingIcons = () => {
            const wrapper = document.getElementById('ab_icons_wrapper');
            if (!wrapper || isMinimized || !window.Engine?.heroEquipment) return;
            const bag = window.Engine.heroEquipment.getHItems();
            const blessings = Object.values(bag).filter(i => i.cl === 25);
            const uniqueNames = [...new Set(blessings.map(b => b.name))];

            wrapper.innerHTML = '';
            uniqueNames.forEach(name => {
                const item = blessings.find(b => b.name === name);
                const isSel = targetBlessName === name && targetClanOpt === "";
                const btn = document.createElement('div');
                btn.style = `width: 32px; height: 32px; cursor: pointer; border: 1px solid ${isSel ? THEME.active : '#444'}; background: #1a1a1a; display: flex; align-items: center; justify-content: center; border-radius: 2px; position: relative;`;
                
                if (isSel) btn.style.boxShadow = `inset 0 0 5px ${THEME.active}`;

                if (!item.$canvasIcon && window.Engine.items?.renderItem) window.Engine.items.renderItem(item);
                if (item.$canvasIcon && item.$canvasIcon[0]) {
                    const iconClone = document.createElement('canvas');
                    iconClone.width = 32; iconClone.height = 32;
                    iconClone.getContext('2d').drawImage(item.$canvasIcon[0], 0, 0);
                    iconClone.style.width = "30px"; iconClone.style.height = "30px";
                    btn.appendChild(iconClone);
                }

                btn.onclick = () => {
                    targetClanOpt = "";
                    localStorage.setItem(STORAGE.CLAN, "");
                    targetBlessName = name;
                    document.getElementById('ab_input').value = name;
                    localStorage.setItem(STORAGE.NAME, name);
                    window.renderBlessingIcons();
                    window.renderClanButtons();
                };
                wrapper.appendChild(btn);
            });
        };

        header.querySelector('#ab_minimize').onclick = () => {
            isMinimized = !isMinimized;
            content.style.display = isMinimized ? 'none' : 'block';
            header.querySelector('#ab_minimize').innerText = isMinimized ? '展开' : '━';
            localStorage.setItem(STORAGE.MIN, isMinimized);
        };

        document.getElementById('ab_toggle').onclick = () => {
            isActive = !isActive;
            localStorage.setItem(STORAGE.STATE, isActive);
            updateBtn();
        };

        // Przeciąganie
        let isDragging = false, offset = { x: 0, y: 0 };
        header.onmousedown = (e) => {
            isDragging = true;
            offset = { x: e.clientX - container.offsetLeft, y: e.clientY - container.offsetTop };
        };

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            pos.x = e.clientX - offset.x;
            pos.y = e.clientY - offset.y;
            container.style.left = pos.x + 'px';
            container.style.top = pos.y + 'px';
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) localStorage.setItem(STORAGE.POS, JSON.stringify(pos));
            isDragging = false;
        });

        updateBtn();
        window.renderBlessingIcons();
        window.renderClanButtons();
    }

    setInterval(createGUI, 2000);
})();
