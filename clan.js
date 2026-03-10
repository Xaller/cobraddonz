(function() {
    'use strict';

    let wasIntercepted = false;
    let isMinimized = localStorage.getItem('clan_win_minimized') === 'true';

    // Pobieranie zapisanej pozycji
    let savedPos = JSON.parse(localStorage.getItem('clan_win_pos')) || { top: '100px', left: '100px' };

    // --- KONFIGURACJA BOSSÓW ---
    const TRACKED_LOCATIONS = [
        { label: "Sybilka", search: "Potępione Zamczysko - pracownia" },
        { label: "Tanroth", search: "Sala Tronowa" },
        { label: "Barba", search: "Sala Zrujnowanej Świątyni" }
    ];

    function interceptBeforeFunction(obj, key, callback, executor = obj[key]) {
        obj[key] = function(...args) {
            const callbackResult = callback(...args);
            if (!callbackResult) executor.apply(obj, args);
        }
    }

    // --- STYLE ---
    const style = document.createElement('style');
    style.innerHTML = `
#clan-active-window {
    position: absolute;
    top: 97px;
    left: 1644px;
    width: 250px;
    background: rgba(0,0,0,.7);
    box-shadow: 0 0 0 1px #010101, 0 0 0 2px #5600b4, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px #0c0d0d66;
    color: #eee;
    z-index: 9999;
    font-family: Tahoma, sans-serif;
    font-size: 11px;
    border-radius: 2px;
    display: flex;
    flex-direction: column;
}
#clan-active-header {
    background: rgb(0 0 0 / 47%);
    padding: 3px;
    font-weight: bold;
    text-align: center;
    border-bottom: 1px solid #5600b4;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #e1e1e1;
    font-family: 'Karla' !important;
    cursor: move;
}
        #clan-min-btn {
            cursor: pointer;
            color: beige;
            width: 20px;
            text-align: center;
            font-weight: bold;
            font-size: 15px !important;
        }
        .clan-member-row {
            display: flex; justify-content: space-between; align-items: center;
            padding: 3px 5px; border-bottom: 1px solid #5600b4;
        }
        .party-inv-btn {
            background-image: linear-gradient(to top, #12210d, #396b29);
            box-shadow: inset 0 0 1px 1px #cecece, inset 0 0 0 2px #0c0d0d;
            color: beige;
            width: 14px;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            border-radius: 2px;
            cursor: pointer;
            margin-right: 6px;
            font-size: 12px;
            line-height: 1;
        }
        .party-inv-btn:hover { color: aqua; transition: 0.15s; }
        .clan-nick {
            color: #ffc107;
            font-weight: bold;
            flex: 1.5;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Karla';
        }
        .clan-info-tag {
            text-align: center;
            position: relative;
            width: 35px;
            height: 12px;
            flex: none;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #00ff00;
            font-weight: bold;
            font-size: 10px;
            background: #000000b8;
            outline: 1px solid #0c0d0d;
            border-radius: 2px;
            box-shadow: 0 0 0 1px #010101, 0 0 0 2px #5600b4, 0 0 0 3px #0c0d0d, 2px 2px 3px 3px #0c0d0d66;
            margin: 0 5px;
        }
        .clan-map {
            color: beige;
            flex: 1.6;
            text-align: justify;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
            letter-spacing: 1px;
            font-family: 'Karla';
        }
#clan-active-footer {
    padding: 1px 0px;
    border-top: 1px solid #5600b4;
    background: rgb(0 0 0 / 49%);
    font-size: 10px;
    color: #40cf40;
    font-weight: bold;
    font-family: 'Karla';
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 9px;
}
        .hidden-content { display: none !important; }
    `;
    document.head.appendChild(style);

    const win = document.createElement('div');
    win.id = 'clan-active-window';
    win.innerHTML = `
        <div id="clan-active-header">
            <div style="width:20px"></div>
            <span>Klan Online</span>
            <div id="clan-min-btn">${isMinimized ? '+' : '-'}</div>
        </div>
        <div id="clan-member-list" class="${isMinimized ? 'hidden-content' : ''}">Ładowanie...</div>
        <div id="clan-active-footer"></div>
    `;
    document.body.appendChild(win);

    const minBtn = document.getElementById('clan-min-btn');
    const memberList = document.getElementById('clan-member-list');

    // Zmieniona logika minimalizacji - teraz ukrywa tylko listę
    minBtn.onclick = (e) => {
        e.stopPropagation();
        isMinimized = !isMinimized;
        memberList.classList.toggle('hidden-content');
        minBtn.innerText = isMinimized ? '+' : '-';
        localStorage.setItem('clan_win_minimized', isMinimized);
    };

    // Obsługa przeciągania i zapisu pozycji
    let isDragging = false;
    let offset = { x: 0, y: 0 };

    win.onmousedown = (e) => {
        if(e.target.closest('#clan-active-header')) {
            isDragging = true;
            offset.x = e.clientX - win.offsetLeft;
            offset.y = e.clientY - win.offsetTop;
        }
    };

    document.onmousemove = (e) => {
        if(isDragging) {
            win.style.left = (e.clientX - offset.x) + 'px';
            win.style.top = (e.clientY - offset.y) + 'px';
        }
    };

    document.onmouseup = () => {
        if(isDragging) {
            isDragging = false;
            // Zapis pozycji do localStorage
            localStorage.setItem('clan_win_pos', JSON.stringify({
                top: win.style.top,
                left: win.style.left
            }));
        }
    };

    window.inviteToParty = function(id) {
        if (typeof window._g === 'function') {
            window._g('party&a=inv&id=' + id);
        }
    };

    function parseClanData(rawData) {
        const dataArray = Object.values(rawData);
        const membersList = [];
        for (let i = 0; i < dataArray.length; i += 11) {
            if (dataArray[i + 1]) {
                membersList.push({
                    id: dataArray[i],
                    nick: dataArray[i + 1],
                    lvl: dataArray[i + 2],
                    prof: dataArray[i + 4],
                    mapa: dataArray[i + 5],
                    offline: dataArray[i + 9]
                });
            }
        }
        return membersList;
    }

    function updateClanUI(members) {
        const listCont = document.getElementById('clan-member-list');
        const footer = document.getElementById('clan-active-footer');
        if (!listCont) return;

        const activeOnes = members.filter(m => m.offline < 5);

        if (footer) {
            footer.innerHTML = TRACKED_LOCATIONS.map(loc => {
                const count = activeOnes.filter(m => m.mapa.includes(loc.search)).length;
                return `<span>${loc.label}: <span style="color:#fff">${count}</span></span>`;
            }).join('');
        }

        if (activeOnes.length === 0) {
            listCont.innerHTML = '<div style="text-align:center; padding: 10px;">Brak aktywnych osób</div>';
        } else {
            listCont.innerHTML = activeOnes.map(m => `
                <div class="clan-member-row">
                    <div class="party-inv-btn" onclick="inviteToParty(${m.id})" title="Zaproś do grupy">+</div>
                    <span class="clan-nick" title="${m.nick}">${m.nick}</span>
                    <span class="clan-info-tag">${m.lvl}${m.prof}</span>
                    <span class="clan-map" title="${m.mapa}">${m.mapa}</span>
                </div>
            `).join('');
        }
    }

    const init = setInterval(() => {
        if (window.Engine && window.Engine.communication && window.Engine.communication.parseJSON && window.Engine.communication.dispatcher) {
            clearInterval(init);

            (function (onMembers) {
                window.Engine.communication.dispatcher.on_members = function (e) {
                    if (!(window.Engine.clan === undefined || window.Engine.clan == false)) {
                        return onMembers ? onMembers.call(this, e) : null;
                    }
                };
            })(window.Engine.communication.dispatcher.on_members);

            interceptBeforeFunction(window.Engine.communication, "parseJSON", (data) => {
                if (data.members) {
                    updateClanUI(parseClanData(data.members));
                }

                if (data.friends) {
                    window.friends = data.friends;
                    if (!wasIntercepted) {
                        wasIntercepted = true;
                        const copy = JSON.parse(JSON.stringify(data));
                        delete copy.friends; delete copy.firends_max;
                        delete copy.enemies; delete copy.enemies_max;
                        window.Engine.communication.parseJSON(copy);
                        return true;
                    }
                }
                wasIntercepted = false;
            });

            const sendReq = () => { if (typeof window._g === 'function' && (!window.g || !window.g.battle)) window._g("clan&a=members"); };
            setTimeout(sendReq, 500);
            setInterval(sendReq, 7000);
        }
    }, 100);
})();
