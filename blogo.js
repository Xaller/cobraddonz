(function() {
    'use strict';

    const CLAN_TOOLTIPS = {
        1: "Pancerz", 2: "SA", 3: "Lowkryt x2 / SA",
        4: "Życie x2", 5: "Niszcz. pancerza / Odp.",
        6: "Unik / SA", 7: "CK / Cechy / LT / Unik"
    };

    const STORAGE = {
        NAME: 'margo_bless_name',
        CLAN: 'margo_bless_clan_opt',
        STATE: 'margo_bless_active',
        POS: 'margo_bless_pos',
        MIN: 'margo_bless_minimized'
    };

    // --- DOPASOWANIE DO COBRADDONZ ---
    const THEME = {
        bg: '#000000ad',
        accent: '#5600b4', // Twój fioletowy kolor przewodzący
        shadow: '0 0 0 1px #010101, 0 0 0 2px #5600b4, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px #0c0d0d66, 0 0 5px 0px black',
        text: '#eee'
    };

    let targetBlessName = localStorage.getItem(STORAGE.NAME) || "";
    let targetClanOpt = localStorage.getItem(STORAGE.CLAN) || "";
    let isActive = localStorage.getItem(STORAGE.STATE) === 'true';
    let isMinimized = localStorage.getItem(STORAGE.MIN) === 'true';
    let pos = JSON.parse(localStorage.getItem(STORAGE.POS)) || { x: 100, y: 100 };

    const style = document.createElement('style');
    style.innerHTML = `
        #ab_container {
            position: absolute; z-index: 9999;
            background: ${THEME.bg};
            box-shadow: ${THEME.shadow};
            border-radius: 8px;
            font-family: 'Segoe UI', Roboto, sans-serif;
            width: 170px; color: ${THEME.text};
            backdrop-filter: blur(2px);
        }
        #ab_header {
            padding: 8px; font-size: 10px; font-weight: bold;
            cursor: move; text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            display: flex; justify-content: space-between;
            letter-spacing: 1px; color: #4a90e2;
        }
        .ab_btn_active {
            background: rgba(46, 125, 50, 0.4) !important;
            color: #2ecc71 !important;
            box-shadow: inset 0 0 10px rgba(46, 125, 50, 0.5);
            animation: ab_pulse 2s infinite;
        }
        @keyframes ab_pulse {
            0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; }
        }
        .ab_item_slot {
            width: 32px; height: 32px; cursor: pointer;
            background: rgba(0,0,0,0.4);
            box-shadow: inset 0 0 5px #000;
            border-radius: 4px; display: flex; align-items: center; justify-content: center;
            transition: 0.2s; border: 1px solid transparent;
        }
        .ab_item_slot.selected { border-color: ${THEME.accent}; box-shadow: 0 0 8px ${THEME.accent}; }
        
        .ab_clan_btn {
            cursor: pointer; background: rgba(0,0,0,0.5);
            font-size: 11px; padding: 5px 0; text-align: center;
            border-radius: 3px; border: 1px solid #222; transition: 0.2s;
        }
        .ab_clan_btn.selected { border-color: ${THEME.accent}; color: ${THEME.accent}; font-weight: bold; }
        
        #ab_input {
            width: 100%; background: rgba(0,0,0,0.5); border: 1px solid #333;
            color: #fff; padding: 5px; font-size: 11px; margin-bottom: 8px;
            box-sizing: border-box; border-radius: 4px;
        }
    `;
    document.head.appendChild(style);

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

    // Hook pod komunikację
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
        if (isActive) {
            btn.classList.add('ab_btn_active');
            btn.innerText = 'WŁĄCZONE (AUTO)';
        } else {
            btn.classList.remove('ab_btn_active');
            btn.innerText = 'WYŁĄCZONE';
        }
    }

    function createGUI() {
        if (document.getElementById('ab_container')) {
            window.renderBlessingIcons();
            window.renderClanButtons();
            return;
        }

        const container = document.createElement('div');
        container.id = 'ab_container';
        container.style.left = pos.x + 'px';
        container.style.top = pos.y + 'px';

        container.innerHTML = `
            <div id="ab_header">
                <span>AUTO BLESS</span>
                <span id="ab_minimize" style="cursor:pointer; padding: 0 5px;">${isMinimized ? '▢' : '—'}</span>
            </div>
            <div id="ab_content" style="padding: 10px; display: ${isMinimized ? 'none' : 'block'};">
                <input type="text" id="ab_input" value="${targetBlessName}" placeholder="Nazwa błoga...">
                
                <div id="ab_icons_wrapper" style="display: grid; grid-template-columns: repeat(4, 32px); gap: 6px; margin-bottom: 10px; justify-content: center;"></div>

                <div style="font-size: 9px; text-align: center; margin-bottom: 6px; color: #888; text-transform: uppercase;">Klanowe</div>
                <div id="ab_clan_wrapper" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; margin-bottom: 12px;"></div>

                <button id="ab_toggle" style="width: 100%; background: rgba(255,255,255,0.05); border: 1px solid #444; color: #888; padding: 8px; font-weight: bold; font-size: 10px; cursor: pointer; border-radius: 4px; transition: 0.3s;"></button>
            </div>
        `;

        document.body.appendChild(container);

        window.renderClanButtons = () => {
            const wrapper = document.getElementById('ab_clan_wrapper');
            if (!wrapper || isMinimized) return;
            wrapper.innerHTML = '';
            for (let i = 1; i <= 7; i++) {
                const isSel = targetClanOpt === String(i);
                const btn = document.createElement('div');
                btn.className = `ab_clan_btn ${isSel ? 'selected' : ''}`;
                btn.title = CLAN_TOOLTIPS[i];
                btn.innerText = i;
                btn.onclick = () => {
                    targetBlessName = "";
                    document.getElementById('ab_input').value = "";
                    localStorage.setItem(STORAGE.NAME, "");
                    targetClanOpt = (targetClanOpt === String(i)) ? "" : String(i);
                    localStorage.setItem(STORAGE.CLAN, targetClanOpt);
                    window.renderBlessingIcons();
                    window.renderClanButtons();
                };
                wrapper.appendChild(btn);
            }
        };

        window.renderBlessingIcons = () => {
            const wrapper = document.getElementById('ab_icons_wrapper');
            if (!wrapper || isMinimized || !window.Engine?.heroEquipment) return;
            const bag = window.Engine.heroEquipment.getHItems();
            const blessings = Object.values(bag).filter(i => i.cl === 25);
            const uniqueNames = [...new Set(blessings.map(b => b.name))];

            wrapper.innerHTML = '';
            uniqueNames.forEach(name => {
                const item = blessings.find(b => b.name === name);
                const isSel = targetBlessName === name;
                const slot = document.createElement('div');
                slot.className = `ab_item_slot ${isSel ? 'selected' : ''}`;
                
                if (!item.$canvasIcon && window.Engine.items?.renderItem) window.Engine.items.renderItem(item);
                if (item.$canvasIcon && item.$canvasIcon[0]) {
                    const icon = document.createElement('canvas');
                    icon.width = 32; icon.height = 32;
                    icon.getContext('2d').drawImage(item.$canvasIcon[0], 0, 0);
                    icon.style.scale = "0.8";
                    slot.appendChild(icon);
                }

                slot.onclick = () => {
                    targetClanOpt = "";
                    localStorage.setItem(STORAGE.CLAN, "");
                    targetBlessName = (targetBlessName === name) ? "" : name;
                    document.getElementById('ab_input').value = targetBlessName;
                    localStorage.setItem(STORAGE.NAME, targetBlessName);
                    window.renderBlessingIcons();
                    window.renderClanButtons();
                };
                wrapper.appendChild(slot);
            });
        };

        // Handlery
        const header = document.getElementById('ab_header');
        header.querySelector('#ab_minimize').onclick = () => {
            isMinimized = !isMinimized;
            document.getElementById('ab_content').style.display = isMinimized ? 'none' : 'block';
            header.querySelector('#ab_minimize').innerText = isMinimized ? '▢' : '—';
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
