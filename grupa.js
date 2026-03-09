(function() {
    'use strict';

    // Style zostają bez zmian (są poprawne)
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes stasis-incoming-glow {
            0% { background: rgba(86, 86, 86, 0.5); box-shadow: inset 0 0 4px 1px rgba(255, 0, 0, 0.4); }
            50% { background: rgba(150, 0, 0, 0.3); box-shadow: inset 0 0 10px 2px rgba(255, 0, 0, 0.7); }
            100% { background: rgba(86, 86, 86, 0.5); box-shadow: inset 0 0 4px 1px rgba(255, 0, 0, 0.4); }
        }
        .stasis-alert-incoming { animation: stasis-incoming-glow 1.2s infinite !important; border: 1px solid crimson !important; }
        .stasis-alert-active { background: rgba(0, 100, 200, 0.25) !important; border: 1px solid #0f6ffe !important; }
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

        // Pobieramy graczy i filtrujemy, żeby nie brać nagłówków profesji jako graczy
        const players = Array.from(listContainer.querySelectorAll('.one-other'));
        if (players.length === 0) return;

        const groups = {
            'Wojownicy': [], 'Paladyni': [], 'Tancerze Ostrzy': [],
            'Łowcy': [], 'Tropiciele': [], 'Magowie': [], 'Inni': []
        };

        players.forEach(player => {
            // Staza - logika zostaje, bo jest OK
            const incoming = player.querySelector('.stasis-incoming');
            player.classList.toggle('stasis-alert-incoming', !!(incoming && incoming.classList.contains('active')));

            const stasis = player.querySelector('.stasis');
            player.classList.toggle('stasis-alert-active', !!(stasis && stasis.classList.contains('active')));

            // --- POPRAWKA PROFESJI ---
            const lvlEl = player.querySelector('.lvl');
            let profName = 'Inni';

            if (lvlEl) {
                const text = lvlEl.innerText.toLowerCase().trim();
                // Wyciągamy ostatnią literę, która jest literą (nie cyfrą)
                const match = text.match(/[a-z]$/); 
                const short = match ? match[0] : '';
                profName = PROF_MAP[short] || 'Inni';
            }
            
            groups[profName].push(player);
        });

        // Czyścimy listę i budujemy od nowa
        listContainer.innerHTML = '';

        Object.keys(groups).forEach(name => {
            const members = groups[name];
            if (members.length > 0) {
                const header = document.createElement('div');
                header.className = 'prof-header'; // Dodana klasa dla porządku
                header.style.cssText = 'color: #efd332; font-size: 10px; font-weight: bold; margin: 6px 0 2px 0; padding: 2px; background: rgba(255,255,255,0.05); text-align:center; text-transform: uppercase;';
                header.innerText = `— ${name} (${members.length}) —`;
                listContainer.appendChild(header);

                members.forEach(m => listContainer.appendChild(m));
            }
        });
    }

    // Observer i interwał zostają - są potrzebne do reakcji na zmiany w grze
    const observer = new MutationObserver((mutations) => {
        // Blokujemy zapętlenie: rozłączamy, robimy zmiany, łączymy ponownie
        observer.disconnect();
        sortWhoIsHere();
        startObserving();
    });

    function startObserving() {
        const target = document.querySelector('.whoishere-window .player-list');
        if (target) {
            observer.observe(target, { childList: true, subtree: false });
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
