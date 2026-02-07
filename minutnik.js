(function () {
    'use strict';

    const MULTIPLIER = 3;
    const timers = new Map();
    let wnd, collapsed = true, headerInfo;

    let ctxMenu = null;
    let targetRow = null;
    let currentNearestCharId = null;

    const playCustomSound = (url) => {
        if (!url || url.includes("https://margoplus.pl/mp3/u/6986065a294df.mp3")) return;
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(e => console.warn("Audio play blocked."));
    };

    const wait = setInterval(() => {
        if (window.Engine && Engine.hero && Engine.hero.getId && Engine.hero.getId() && document.querySelector(".top.positioner")) {
            clearInterval(wait);
            init();
        }
    }, 200);

    function init() {
        if (document.querySelector(".my-timer")) return;
        createUI();
        createContextMenu();
        loadTimers();
        hookEngine();
        startUpdater();

        document.addEventListener('click', () => {
            if (ctxMenu) ctxMenu.style.display = 'none';
        });
    }

    function relogToCharacter(charId) {
        if (!charId || charId === "undefined" || charId === "null" || charId === "") {
            if (window.message) message("Brak zapisanego ID dla tego potwora.");
            return;
        }
        Engine.changePlayer.changePlayerRequest(charId)
    }

    function createUI() {
        const style = document.createElement("style");
        style.textContent = `
            .my-timer{ position:absolute; top:60px; right:254px; min-width:250px; background:rgba(18,18,18,.85); backdrop-filter:blur(10px); border-radius:3px; color:#eee; font-family:Montserrat,system-ui; font-size:12px; font-weight:600; z-index:999; box-shadow:0 6px 18px rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.1); }
            .my-timer header{ padding:4px 8px; display:flex; justify-content:space-between; align-items:center; background: rgba(0,0,0,0.3); cursor:default; }
            .header-info{ font-size:11px; opacity:0; overflow:hidden; white-space:nowrap; text-overflow:ellipsis; max-width:180px; transition: opacity 0.3s; color:#eee; cursor: pointer; }
            .header-info.visible{ opacity:1; }
            .my-timer header button{ background:none; border:none; color:#aaa; cursor:pointer; font-size:12px; padding: 0 5px; }
            .my-timer .content{ padding:6px; max-height:300px; overflow-y:auto; transition: all 0.3s; scrollbar-width: thin; }
            .my-timer.collapsed .content{ max-height:0; padding:0; opacity:0; }
            .my-timer .row{ display:grid; grid-template-columns:auto 1fr auto; gap:6px; padding:6px; border-radius:4px; margin-bottom:2px; cursor:pointer; transition: background 0.4s ease; border: 1px solid transparent; }
            .my-timer .row:hover{ background:rgba(255,255,255,.08); }
            .elita{ color: #ffca28; }
            .time{ font-family: monospace; }
            .bar{ grid-column:1/4; height:3px; background:rgba(255,255,255,.1); border-radius: 10px; overflow:hidden; }
            .bar div{ height:100%; transition: width 0.5s; border-radius: 10px; }
            .ready-glow { background: rgba(76,175,80,0.15) !important; border: 1px solid rgba(76,175,80,0.3) !important; }
            .ctx-menu { position: fixed; background: rgba(25, 25, 25, 0.95); backdrop-filter: blur(5px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 4px; padding: 4px 0; min-width: 100px; z-index: 10000; display: none; flex-direction: column; }
            .ctx-item { padding: 6px 12px; font-family: Montserrat, sans-serif; font-size: 11px; font-weight: 600; color: #ddd; cursor: pointer; }
            .ctx-item:hover { background: rgba(255, 255, 255, 0.1); color: #fff; }
        `;
        document.head.appendChild(style);

        wnd = document.createElement("div");
        wnd.className = "my-timer collapsed";
        wnd.innerHTML = `<header><span class="header-info"></span><button id="toggle">▼</button></header><div class="content"></div>`;

        const container = document.querySelector(".top.positioner");
        if (container) container.appendChild(wnd);
        else document.body.appendChild(wnd);

        headerInfo = wnd.querySelector(".header-info");

        headerInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            if (collapsed && currentNearestCharId) {
                relogToCharacter(currentNearestCharId);
            }
        });

        wnd.querySelector("#toggle").onclick = (e) => {
            e.stopPropagation();
            collapsed = !collapsed;
            wnd.classList.toggle("collapsed", collapsed);
            wnd.querySelector("#toggle").textContent = collapsed ? "▼" : "▲";
        };
    }

    function createContextMenu() {
        ctxMenu = document.createElement("div");
        ctxMenu.className = "ctx-menu";
        const btnReset = document.createElement("div");
        btnReset.className = "ctx-item";
        btnReset.textContent = "Resetuj";
        btnReset.onclick = () => { if (targetRow) resetTimer(targetRow); };
        const btnDelete = document.createElement("div");
        btnDelete.className = "ctx-item";
        btnDelete.textContent = "Usuń";
        btnDelete.onclick = () => { if (targetRow) deleteTimer(targetRow); };
        ctxMenu.appendChild(btnReset);
        ctxMenu.appendChild(btnDelete);
        document.body.appendChild(ctxMenu);
    }

    function deleteTimer(row) {
        timers.delete(row);
        row.remove();
        saveTimers();
    }

    function resetTimer(row) {
        const duration = parseInt(row.dataset.expires) - parseInt(row.dataset.start);
        const newStart = Date.now();
        const newExpires = newStart + duration;
        row.dataset.start = newStart;
        row.dataset.expires = newExpires;
        delete row.dataset.warned30;
        delete row.dataset.warned0;
        delete row.dataset.readyAt;
        row.classList.remove("ready-glow");
        timers.set(row, newExpires);
        saveTimers();
    }

    function hookEngine() {
        if(window.API && API.addCallbackToEvent) {
            API.addCallbackToEvent("removeNpc", e => {
                const npc = e.d;
                if (!npc || npc.wt < 20 || npc.wt >= 30) return;
                addRow(npc, Engine.hero.getId());
                saveTimers();
            });
        }
    }

    function addRow(npc, charId) {
        const existing = [...timers.keys()].find(r => r.querySelector(".name").textContent === npc.nick);
        const respawn = Math.round(60 * (npc.lvl > 200 ? 18 : 0.7 + 0.18 * npc.lvl - 0.00045 * npc.lvl * npc.lvl) * (1 / MULTIPLIER));
        const start = Date.now();
        const expires = start + respawn * 1000;

        if (existing) {
            existing.dataset.start = start;
            existing.dataset.expires = expires;
            if (charId) existing.dataset.charId = charId;
            existing.classList.remove("ready-glow");
            delete existing.dataset.readyAt;
            delete existing.dataset.warned30;
            delete existing.dataset.warned0;
            timers.set(existing, expires);
            return;
        }

        const row = document.createElement("div");
        row.className = "row";
        row.dataset.start = start;
        row.dataset.expires = expires;
        row.dataset.charId = charId || "";
        row.innerHTML = `<span class="elita">[E2]</span><span class="name">${npc.nick}</span><span class="time"></span><div class="bar"><div></div></div>`;

        row.addEventListener('dblclick', (e) => {
            e.preventDefault();
            relogToCharacter(row.dataset.charId);
        });

        row.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            targetRow = row;
            ctxMenu.style.display = 'flex';
            ctxMenu.style.left = e.clientX + 'px';
            ctxMenu.style.top = e.clientY + 'px';
        });

        wnd.querySelector(".content").appendChild(row);
        timers.set(row, expires);
    }

    function saveTimers() {
        const data = [];
        timers.forEach((expires, row) => {
            data.push({
                nick: row.querySelector(".name").textContent,
                expires: expires,
                start: row.dataset.start,
                charId: row.dataset.charId
            });
        });
        localStorage.setItem("myTimersData", JSON.stringify(data));
    }

    function loadTimers() {
        const data = JSON.parse(localStorage.getItem("myTimersData") || "[]");
        data.forEach(item => {
            if (item.expires + 120000 > Date.now()) {
                const row = document.createElement("div");
                row.className = "row";
                row.dataset.expires = item.expires;
                row.dataset.start = item.start;
                row.dataset.charId = item.charId || "";
                row.innerHTML = `<span class="elita">[E2]</span><span class="name">${item.nick}</span><span class="time"></span><div class="bar"><div></div></div>`;
                row.addEventListener('dblclick', () => relogToCharacter(row.dataset.charId));
                row.addEventListener('contextmenu', (e) => {
                    e.preventDefault(); e.stopPropagation();
                    targetRow = row;
                    ctxMenu.style.display = 'flex';
                    ctxMenu.style.left = e.clientX + 'px';
                    ctxMenu.style.top = e.clientY + 'px';
                });
                wnd.querySelector(".content").appendChild(row);
                timers.set(row, item.expires);
            }
        });
    }

    function startUpdater() {
        setInterval(() => {
            const now = Date.now();
            let nearestText = null;
            let nearestId = null;

            const box = wnd.querySelector(".content");
            const sortedRows = [...timers.keys()].sort((a, b) => a.dataset.expires - b.dataset.expires);

            sortedRows.forEach((row) => {
                const expires = timers.get(row);
                const diff = Math.floor((expires - now) / 1000);
                const timeEl = row.querySelector(".time");
                const bar = row.querySelector(".bar div");
                const total = (row.dataset.expires - row.dataset.start) / 1000;
                const pct = Math.min(100, Math.max(0, ((total - diff) / total) * 100));

                bar.style.width = pct + "%";
                bar.style.background = pct < 50 ? "#ef5350" : (pct < 80 ? "#ffca28" : "#66bb6a");

                // Logika dla nagłówka - bierze pierwszy element z posortowanej listy (najbliższy respawn lub ten, co już stoi)
                if (!nearestText) {
                    const rawName = row.querySelector(".name").textContent;
                    const shortName = rawName.length > 10 ? rawName.substring(0, 10) + "..." : rawName;
                    const displayTime = diff <= 0 ? "0:00" : `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}`;
                    nearestText = `${shortName} • ${displayTime}`;
                    nearestId = row.dataset.charId;
                }

                if (diff === 30 && !row.dataset.warned30) {
                    playCustomSound("TU_WKLEJ_LINK_DO_MP3_30_SEKUND");
                    row.dataset.warned30 = "true";
                }

                if (diff <= 0) {
                    if (!row.dataset.warned0) {
                        playCustomSound("https://margoplus.pl/mp3/u/6986065a294df.mp3");
                        row.dataset.warned0 = "true";
                    }
                    row.classList.add("ready-glow");
                    timeEl.textContent = "0:00";
                    if (!row.dataset.readyAt) row.dataset.readyAt = now;
                    if (now - row.dataset.readyAt > 120000) {
                        timers.delete(row);
                        row.remove();
                    }
                } else {
                    timeEl.textContent = `${Math.floor(diff/60)}:${(diff%60).toString().padStart(2,'0')}`;
                }
            });

            if (collapsed && nearestText) {
                headerInfo.textContent = nearestText;
                headerInfo.classList.add("visible");
                currentNearestCharId = nearestId;
            } else {
                headerInfo.classList.remove("visible");
                currentNearestCharId = null;
            }

            if(sortedRows.length > 0) {
                sortedRows.forEach(e => box.appendChild(e));
            }
            saveTimers();
        }, 1000);
    }
})();