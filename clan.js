(function () {
    'use strict';

    // --- KONFIGURACJA CSS ---
    const styles = `
        #clan-pro-panel {
            position: fixed;
            width: 300px; /* Nieco zwiększony dla przycisku + */
            max-height: 400px;
            background: #000000ad;
            color: #eee;
            backdrop-filter: blur(1px);
            font-size: 11px;
            padding: 0;
            z-index: 9999;
            border-radius: 2px;
            font-family: 'Karla', sans-serif !important;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            box-shadow: 0 0 0 1px #010101, 0 0 0 2px #5600b4, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px #0c0d0d66, 0 0 5px 0px black;
        }
        #clan-pro-header {
            background: #000000ad;
            padding: 4px 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            user-select: none;
            cursor: move;
            box-shadow: inset 0 -1px 0 #333;
        }
        #clan-pro-header b { color: #a654ff; }
        #clan-pro-refresh {
            cursor: pointer;
            color: #9f62e1;
            font-size: 14px;
            transition: transform 0.2s;
        }
        #clan-pro-refresh:hover { transform: rotate(90deg); color: #fff; }
        #clan-pro-content { padding: 5px; overflow-y: auto; flex-grow: 1; font-size: 11px; }
        .clan-member-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
        .clan-member-left { display: flex; gap: 4px; align-items: center; overflow: hidden; white-space: nowrap; }
        .clan-nick { color: beige; font-weight: 500; cursor: pointer; text-overflow: ellipsis; overflow: hidden; }
        
        /* Styl przycisku PARTY */
        .clan-party-inv {
            color: #0f0;
            cursor: pointer;
            font-weight: bold;
            margin-right: 4px;
            padding: 0 2px;
        }
        .clan-party-inv:hover { color: #fff; }

        .clan-lvl-box { font-size: 10px; flex-shrink: 0; display: flex; gap: 1px; }
        .clan-lvl { color: #0f0; }
        .clan-prof { font-weight: bold; text-transform: capitalize; }
        .prof-w, .prof-m, .prof-p, .prof-t, .prof-h, .prof-b { color: beige; }

        .clan-map {
            color: #aaa;
            font-size: 10px;
            text-align: right;
            margin-left: 8px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 110px;
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const panel = document.createElement("div");
    panel.id = "clan-pro-panel";
    const savedPos = JSON.parse(localStorage.getItem('clan_panel_pos') || '{"top":"150px","left":"10px"}');
    panel.style.top = savedPos.top;
    panel.style.left = savedPos.left;

    panel.innerHTML = `
        <div id="clan-pro-header">
            <b>Cwele Online (<span id="clan-count">0</span>)</b>
            <span id="clan-pro-refresh" title="Odśwież">↻</span>
        </div>
        <div id="clan-pro-content">Wczytywanie cweli...</div>
    `;
    document.body.appendChild(panel);

    // --- DRAG & DROP ---
    let isDragging = false;
    let offsetX, offsetY;
    const header = document.getElementById('clan-pro-header');
    header.onmousedown = (e) => {
        isDragging = true;
        offsetX = e.clientX - panel.offsetLeft;
        offsetY = e.clientY - panel.offsetTop;
    };
    document.onmousemove = (e) => {
        if (!isDragging) return;
        panel.style.left = (e.clientX - offsetX) + "px";
        panel.style.top = (e.clientY - offsetY) + "px";
    };
    document.onmouseup = () => {
        if (isDragging) {
            isDragging = false;
            localStorage.setItem('clan_panel_pos', JSON.stringify({ top: panel.style.top, left: panel.style.left }));
        }
    };

    // --- PARSOWANIE ---
    function parseMembers(members) {
        if (!members) return;
        let html = "";
        let count = 0;
        const myNick = window.Engine?.hero?.d?.nick || window.g?.hero?.d?.nick;
        
        // Pobieranie ID członków aktualnej grupy
        const partyMembers = window.g?.party ? Object.values(window.g.party).map(m => m.id) : [];

        for (let i = 0; i < members.length; i += 11) {
            const id = members[i];
            const nick = members[i + 1];
            const lvl = members[i + 2];
            const prof = members[i + 4] ? members[i + 4].toLowerCase() : '';
            const map = members[i + 5];
            const status = parseInt(members[i + 9]);

            if (status === 0 && nick && nick !== myNick) {
                count++;
                // Sprawdzanie czy gracz jest w party
                const isInParty = partyMembers.includes(id);
                const partyBtn = isInParty ? '' : `<span class="clan-party-inv" onclick="window._g('party&a=inv&id=${id}')" title="Zaproś do grupy">[+]</span>`;

                html += `
                    <div class="clan-member-row">
                        <div class="clan-member-left">
                            ${partyBtn}
                            <span class="clan-nick" onclick="window.g.chat.setMsg('@${nick} ')">${nick} • </span>
                            <div class="clan-lvl-box">
                                <span class="clan-lvl">${lvl}</span><span class="clan-prof prof-${prof}">${prof}</span>
                            </div>
                        </div>
                        <span class="clan-map" title="${map}">${map}</span>
                    </div>`;
            }
        }
        document.getElementById('clan-pro-content').innerHTML = html || '<span style="color:#888">Brak cweli online</span>';
        document.getElementById('clan-count').innerText = count;
    }

    // --- KOMUNIKACJA ---
    let isSilentUpdate = false;
    const originalG = window._g;
    window._g = function(task, callback) {
        if (isSilentUpdate && (task.includes("a=myclan") || task.includes("a=members"))) {
            return originalG.call(this, task, function(data) {
                if (data && data.members) parseMembers(data.members);
            });
        }
        return originalG.apply(this, arguments);
    };

    const observer = new MutationObserver((mutations) => {
        if (isSilentUpdate) {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && (node.classList.contains('border-window') || node.classList.contains('ni-win-clan'))) {
                        if (node.innerText.includes('Klan') || node.innerText.includes('Członkowie')) node.remove();
                    }
                });
            });
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    function refreshClan() {
        if (!window.Engine?.hero?.d?.clan && !window.g?.hero?.d?.clan) return;
        isSilentUpdate = true;
        window._g("clan&a=myclan");
        setTimeout(() => {
            window._g("clan&a=members");
            setTimeout(() => { isSilentUpdate = false; }, 2000);
        }, 500);
    }

    document.getElementById('clan-pro-refresh').onclick = refreshClan;
    setInterval(refreshClan, 45000);
    setTimeout(refreshClan, 4000);

})();
