(function() {
    'use strict';

    // Dodajemy style CSS dla płynnych efektów
    const style = document.createElement('style');
    style.innerHTML = `
        /* Płynny puls dla nadchodzącej stazy */
        @keyframes stasis-incoming-glow {
            0% { background: rgba(86, 86, 86, 0.5); box-shadow: inset 0 0 4px 1px rgba(255, 0, 0, 0.4); }
            50% { background: rgba(150, 0, 0, 0.3); box-shadow: inset 0 0 10px 2px rgba(255, 0, 0, 0.7); }
            100% { background: rgba(86, 86, 86, 0.5); box-shadow: inset 0 0 4px 1px rgba(255, 0, 0, 0.4); }
        }

        /* Styl dla stazy nadchodzącej (Alert) */
        .stasis-alert-incoming {
            animation: stasis-incoming-glow 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
            border: 1px solid crimson !important;
        }

        /* Styl dla stazy aktywnej (Informacja - błękit) */
        .stasis-alert-active {
            background: rgba(0, 100, 200, 0.25) !important;
            box-shadow: inset 0 0 8px rgba(0, 200, 255, 0.5) !important;
            border: 1px solid #0f6ffe !important;
        }

        .tw-list-item { transition: all 0.3s ease; }
    `;
    document.head.appendChild(style);

    const PROF_MAP = {
        'h': 'Łowcy',
        'w': 'Wojownicy',
        'b': 'Tancerze Ostrzy',
        't': 'Tropiciele',
        'm': 'Magowie',
        'p': 'Paladyni'
    };

    function sortWhoIsHere() {
        const listContainer = document.querySelector('.whoishere-window .player-list');
        if (!listContainer) return;

        const players = Array.from(listContainer.querySelectorAll('.one-other'));
        if (players.length === 0) return;

        const groups = {
            'Wojownicy': [], 'Paladyni': [], 'Tancerze Ostrzy': [],
            'Łowcy': [], 'Tropiciele': [], 'Magowie': [], 'Inni': []
        };

        players.forEach(player => {
            // 1. Sprawdzanie Stazy Nadchodzącej (Incoming)
            const incoming = player.querySelector('.stasis-incoming');
            if (incoming && incoming.classList.contains('active')) {
                player.classList.add('stasis-alert-incoming');
            } else {
                player.classList.remove('stasis-alert-incoming');
            }

            // 2. Sprawdzanie Stazy Aktywnej (Stasis)
            const stasis = player.querySelector('.stasis');
            if (stasis && stasis.classList.contains('active')) {
                player.classList.add('stasis-alert-active');
            } else {
                player.classList.remove('stasis-alert-active');
            }

            // 3. Logika profesji
            const lvlEl = player.querySelector('.lvl');
            const short = lvlEl ? lvlEl.innerText.toLowerCase().slice(-1) : '';
            const profName = PROF_MAP[short] || 'Inni';
            groups[profName].push(player);
        });

        listContainer.innerHTML = '';

        for (const [name, members] of Object.entries(groups)) {
            if (members.length > 0) {
                const header = document.createElement('div');
                header.style.cssText = 'color: #efd332; font-size: 10px; font-weight: bold; margin: 6px 0 2px 0; padding: 1px; background: rgba(255,255,255,0.05); text-transform: uppercase; text-align:center; letter-spacing: 1px;';
                header.innerText = `— ${name} (${members.length}) —`;
                listContainer.appendChild(header);

                members.forEach(m => listContainer.appendChild(m));
            }
        }
    }

    const observer = new MutationObserver(() => {
        observer.disconnect();
        sortWhoIsHere();
        startObserving();
    });

    function startObserving() {
        const target = document.querySelector('.whoishere-window .player-list');
        if (target) {
            observer.observe(target, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
        }
    }

    const checkExist = setInterval(() => {
        const target = document.querySelector('.whoishere-window .player-list');
        if (target) {
            sortWhoIsHere();
            startObserving();
            clearInterval(checkExist);
        }
    }, 1000);
})();
