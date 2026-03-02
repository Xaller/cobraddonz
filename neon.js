(function() {
    const STORAGE_KEY = 'custom_search_window_pos';
    
    // 1. Stylizacja (dodana animacja i klasa podświetlenia)
    if (!document.getElementById('search-styles')) {
        const style = document.createElement('style');
        style.id = 'search-styles';
        style.innerHTML = `
            #search-window {
                position: absolute; width: 240px; background: rgba(0, 0, 0, 0.85);
                border: 2px solid #cebb9d; color: #fff; z-index: 9999;
                font-family: Arial; border-radius: 4px; box-shadow: 0 0 10px #000;
            }
            #search-header {
                padding: 6px; cursor: move; background: #3e2723;
                text-align: center; font-size: 11px; border-bottom: 1px solid #cebb9d;
            }
            #search-input {
                width: 90%; margin: 8px 5%; background: #1a1a1a;
                border: 1px solid #cebb9d; color: #fff; padding: 4px;
            }
            /* Animacja pulsowania */
            @keyframes pulse-highlight {
                0% { box-shadow: inset 0 0 4px #fbff00; outline: 2px solid #fbff00; }
                50% { box-shadow: inset 0 0 20px #ffae00; outline: 3px solid #ffae00; }
                100% { box-shadow: inset 0 0 4px #fbff00; outline: 2px solid #fbff00; }
            }
            .search-highlight-active {
                animation: pulse-highlight 0.8s infinite !important;
                z-index: 999 !important;
                position: relative;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Tworzenie okna
    let win = document.getElementById('search-window');
    if (win) win.remove(); // Re-init przy przeładowaniu skryptu

    win = document.createElement('div');
    win.id = 'search-window';
    const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { x: 200, y: 200 };
    win.style.left = savedPos.x + 'px';
    win.style.top = savedPos.y + 'px';

    win.innerHTML = `
        <div id="search-header">WYSZUKIWARKA EQ</div>
        <input type="text" id="search-input" placeholder="Wpisz nazwę...">
    `;
    document.body.appendChild(win);

    // 3. Logika szukania
    const input = document.getElementById('search-input');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Czyść stare podświetlenia
        document.querySelectorAll('.search-highlight-active').forEach(el => {
            el.classList.remove('search-highlight-active');
        });

        if (query.length < 3) return;

        // Pobranie przedmiotów z silnika
        const bag = window.Engine.heroEquipment.getHItems();
        console.log("Szukam:", query); // Debug w konsoli (F12)

        Object.values(bag).forEach(item => {
            // Sprawdzenie czy item ma metodę getName i czy pasuje
            const itemName = item.getName ? item.getName().toLowerCase() : "";
            
            if (itemName.includes(query)) {
                console.log("Znaleziono przedmiot:", itemName, "ID:", item.id);
                
                // Szukanie elementu w DOM po ID przedmiotu (najskuteczniejsze)
                // Większość silników gier daje [data-id] lub id="item-12345"
                const itemEl = document.querySelector(`[data-id="${item.id}"], .item-id-${item.id}, #item${item.id}`);
                
                if (itemEl) {
                    itemEl.classList.add('search-highlight-active');
                    // Próba podświetlenia też rodzica (slotu), jeśli element itemu jest w środku
                    if (itemEl.parentElement) itemEl.parentElement.classList.add('search-highlight-active');
                } else {
                    // Próba po lokacji (bag-X-slot)
                    // item.loc to zazwyczaj numer slotu
                    const slot = document.querySelector(`.bag-slot[data-slot="${item.loc}"], .slot${item.loc}`);
                    if (slot) slot.classList.add('search-highlight-active');
                }
            }
        });
    });

    // 4. Przeciąganie
    let dragging = false, relX, relY;
    const header = document.getElementById('search-header');
    
    header.onmousedown = (e) => {
        dragging = true;
        relX = e.clientX - win.offsetLeft;
        relY = e.clientY - win.offsetTop;
    };

    window.onmousemove = (e) => {
        if (!dragging) return;
        let x = e.clientX - relX;
        let y = e.clientY - relY;
        win.style.left = x + 'px';
        win.style.top = y + 'px';
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y }));
    };

    window.onmouseup = () => dragging = false;

    console.log("Skrypt wyszukiwarki załadowany!");
})();
