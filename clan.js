(function () {
    'use strict';

    const MAP_CONFIG = {
        "Sala Mroźnych Strzał": "Furion",
        "Potępione Zamczysko - pracownia": "Sybilka",
        "Sala Tronowa": "Tanroth",
        "Sala Zrujnowanej Świątyni": "Barbatos"
    };

    const styles = `
        #clan-pro-panel {
            position: fixed; width: 300px; background: #000000ad; color: #eee;
            backdrop-filter: blur(1px); font-size: 11px; z-index: 9999;
            border-radius: 2px; font-family: 'Karla', sans-serif !important;
            display: flex; flex-direction: column;
            box-shadow: 0 0 0 1px #010101, 0 0 0 2px #5600b4, 0 0 5px 0px black;
        }
        #clan-pro-header {
            background: #000000ad; padding: 4px 10px; display: flex;
            justify-content: space-between; align-items: center;
            cursor: move;
        }
        #clan-pro-header b { color: #a654ff; cursor: pointer; user-select: none; }
        #clan-pro-content {
            padding: 5px; overflow-y: auto; max-height: 350px;
            border-bottom: 1px solid #5600b4;
        }
        #clan-pro-footer {
            padding: 4px 10px; font-size: 10px; display: flex;
            flex-wrap: wrap; gap: 5px; background: #00000080; min-height: 15px;
        }
        .footer-tag { color: #994bff; cursor: help; font-weight: bold; }
        .clan-member-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; }
        .clan-nick { color: beige; cursor: pointer; letter-spacing: 1px; }
        .clan-party-inv { color: #5600b4; cursor: pointer; font-weight: bold; margin-right: 4px; }
        .clan-party-inv:hover { color: #fff; transition: 0.15s; }
        .clan-lvl { color: #0f0; margin-right: 2px; }
        .clan-map {
            color: beige; font-size: 10px; text-align: right;
            overflow: hidden; text-overflow: ellipsis;
            white-space: nowrap; max-width: 110px; letter-spacing: 1px;
        }
        .minimized #clan-pro-content, .minimized #clan-pro-footer { display: none; }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    const panel = document.createElement("div");
    panel.id = "clan-pro-panel";
    const savedPos = JSON.parse(localStorage.getItem('clan_panel_pos') || '{"top":"150px","left":"10px"}');
    const isMinimized = localStorage.getItem('clan_panel_minimized') === 'true';
    panel.style.top = savedPos.top;
    panel.style.left = savedPos.left;
    if (isMinimized) panel.classList.add('minimized');

    panel.innerHTML = `
        <div id="clan-pro-header">
            <b id="clan-pro-toggle">Panel Klanowy (<span id="clan-count">0</span>)</b>
        </div>
        <div id="clan-pro-content">Otwórz okno klanu (K)...</div>
        <div id="clan-pro-footer"></div>
    `;
    document.body.appendChild(panel);

    document.getElementById('clan-pro-toggle').onclick = () => {
        panel.classList.toggle('minimized');
        localStorage.setItem('clan_panel_minimized', panel.classList.contains('minimized'));
    };

    let isDragging = false, offsetX, offsetY;
    document.getElementById('clan-pro-header').onmousedown = (e) => {
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

    function parseMembers(members) {
        if (!members || !Array.isArray(members)) return;
        let html = "";
        let count = 0;
        const myNick = window.Engine?.hero?.d?.nick || (window.g && window.g.hero && window.g.hero.d && window.g.hero.d.nick);
        const partyMembers = window.g && window.g.party ? Object.values(window.g.party).map(m => m.id) : [];
        const mapStats = {};

        for (let i = 0; i < members.length; i += 11) {
            const id = members[i], nick = members[i + 1], lvl = members[i + 2],
                  prof = members[i + 4] ? members[i + 4].toLowerCase() : '', map = members[i + 5],
                  status = parseInt(members[i + 9]);

            if (status === 0 && nick && nick !== myNick) {
                count++;
                if (MAP_CONFIG[map]) {
                    const alias = MAP_CONFIG[map];
                    if (!mapStats[alias]) mapStats[alias] = [];
                    mapStats[alias].push(nick);
                }
                const isInParty = partyMembers.includes(id);
                const partyBtn = isInParty ? '' : `<span class="clan-party-inv" onclick="window._g('party&a=inv&id=${id}')" title="Zaproś">[+]</span>`;
                html += `
                    <div class="clan-member-row">
                        <div class="clan-member-left">
                            ${partyBtn}<span class="clan-nick" onclick="if(window.g && window.g.chat) window.g.chat.setMsg('@${nick} ')">${nick}</span>
                            <span style="margin-left:4px; opacity:0.6">[<span class="clan-lvl">${lvl}</span>${prof}]</span>
                        </div>
                        <span class="clan-map" title="${map}">${map}</span>
                    </div>`;
            }
        }

        let footerHtml = "";
        for (const [alias, nicks] of Object.entries(mapStats)) {
            footerHtml += `<span class="footer-tag" title="${nicks.join(', ')}">[${alias} ${nicks.length}]</span>`;
        }

        document.getElementById('clan-pro-content').innerHTML = html || '<span style="color:#888">Brak osób online</span>';
        document.getElementById('clan-pro-footer').innerHTML = footerHtml;
        document.getElementById('clan-count').innerText = count;
    }

    const originalParseJSON = JSON.parse;
    JSON.parse = function() {
        const data = originalParseJSON.apply(this, arguments);

        if (data && data.members) {
            parseMembers(data.members);
        }

        if (data && data.clan && data.clan.members) {
            parseMembers(data.clan.members);
        }

        return data;
    };

    if (window.Engine && window.Engine.communication && window.Engine.communication.dispatcher) {
        const oldOnMembers = window.Engine.communication.dispatcher.on_members;
        window.Engine.communication.dispatcher.on_members = function(e) {
            if (e && e.members) parseMembers(e.members);
            return oldOnMembers.apply(this, arguments);
        };
    }

})();
