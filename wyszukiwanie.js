(function() {
    const STORAGE_KEY = 'custom_search_window_pos';
    
    // 1. Stylizacja
    if (!document.getElementById('search-styles')) {
        const style = document.createElement('style');
        style.id = 'search-styles';
        style.innerHTML = `
            #search-window {
                position: absolute; width: 240px; background: rgba(0, 0, 0, 0.9);
                border: 2px solid #cebb9d; color: #fff; z-index: 9999;
                font-family: Arial; border-radius: 4px; box-shadow: 0 0 15px #000;
            }
            #search-header {
                padding: 6px; cursor: move; background: #3e2723;
                text-align: center; font-size: 11px; border-bottom: 1px solid #cebb9d;
                text-transform: uppercase; letter-spacing: 1px;
            }
            #search-input {
                width: 90%; margin: 8px 5%; background: #1a1a1a;
                border: 1px solid #cebb9d; color: #fff; padding: 6px;
                outline: none;
            }
            
            /* Klasa przyciemniająca wszystko inne */
            .search-dimmed {
                opacity: 0.2 !important;
                filter: grayscale(80%);
                transition: opacity 0.3s ease;
                pointer-events: none; /* Opcjonalnie: blokuje klikanie w przyciemnione */
            }

            /* Klasa podświetlenia dla znalezionych przedmiotów */
            .search-highlight-active {
                opacity: 1 !important;
                filter: grayscale(0%) !important;
                outline: 2px solid #ffae00 !important;
                box-shadow: 0 0 15px #ffae00 !important;
                z-index: 1000 !important;
                position: relative;
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Tworzenie okna
    let win = document.getElementById('search-window');
    if (win) win.remove();

    win = document.createElement('div');
    win.id = 'search-window';
    const savedPos = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { x: 200, y: 200 };
    win.style.left = savedPos.x + 'px';
    win.style.top = savedPos.y + 'px';

    win.innerHTML = `
        <div id="search-header">Wyszukiwarka EQ</div>
        <input type="text" id="search-input" placeholder="Szukaj przedmiotu...">
    `;
    document.body.appendChild(win);

    // 3. Logika szukania
    const input = document.getElementById('search-input');
    
    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        
        // Selektory slotów/przedmiotów (dostosowane do najczęstszych silników gier 2D)
        const allItems = document.querySelectorAll('.item, .bag-slot, [data-id]');

        // Reset stanu
        allItems.forEach(el => {
            el.classList.remove('search-dimmed', 'search-highlight-active');
        });

        if (query.length < 3) return;

        // Przyciemnij wszystko na start
        allItems.forEach(el => el.classList.add('search-dimmed'));

        // Pobranie danych z silnika gry
        if (!window.Engine || !window.Engine.heroEquipment) return;
        const bag = window.Engine.heroEquipment.getHItems();

        Object.values(bag).forEach(item => {
            const itemName = item.getName ? item.getName().toLowerCase() : "";
            
            if (itemName.includes(query)) {
                // Znajdź element w DOM
                const itemEl = document.querySelector(`[data-id="${item.id}"], .item-id-${item.id}, #item${item.id}`);
                
                if (itemEl) {
                    itemEl.classList.remove('search-dimmed');
                    itemEl.classList.add('search-highlight-active');
                    
                    // Jeśli przedmiot jest wewnątrz slotu, slot też musi być jasny
                    if (itemEl.parentElement) {
                        itemEl.parentElement.classList.remove('search-dimmed');
                        itemEl.parentElement.classList.add('search-highlight-active');
                    }
                }
            }
        });
    });

    // 4. Przeciąganie okna
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

    console.log("Skrypt 'Focus Search' gotowy.");
})();
