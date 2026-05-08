// ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========
function updateTypeFilterTrigger() {
    const trigger = document.getElementById('typeFilterTrigger');
    if (!trigger) return;
    if (selectedTypes.size === 0) trigger.textContent = 'Все типы мерча';
    else if (selectedTypes.size === 1) trigger.textContent = Array.from(selectedTypes)[0];
    else trigger.textContent = `Выбрано: ${selectedTypes.size}`;
}

function buildTypeMultiSelect() {
    const dropdown = document.getElementById('typeFilterDropdown');
    if (!dropdown) return;
    let tempSelectedTypes = new Set(selectedTypes);
    let html = '<div class="type-select-list"><div class="filter-option-header">Выберите типы мерча</div>';
    typeOptions.forEach(type => {
        const isSelected = tempSelectedTypes.has(type);
        html += `<div class="type-select-item ${isSelected ? 'selected' : ''}" data-type="${escapeHtml(type)}">
                    <span>${escapeHtml(type)}</span>
                    ${isSelected ? '<span class="type-select-check">✓</span>' : ''}
                </div>`;
    });
    
    const isMobile = window.innerWidth <= 500;
    const applyText = isMobile ? '✅' : 'Применить';
    const resetText = isMobile ? '✖️' : 'Сбросить';
    
    html += '</div><div class="filter-buttons"><button class="filter-reset-btn" id="typeResetBtn">' + resetText + '</button><button class="filter-apply-btn" id="typeApplyBtn">' + applyText + '</button></div>';
    dropdown.innerHTML = html;
    
    document.querySelectorAll('.type-select-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = item.dataset.type;
            if (tempSelectedTypes.has(type)) tempSelectedTypes.delete(type);
            else tempSelectedTypes.add(type);
            const items = document.querySelectorAll('.type-select-item');
            items.forEach(it => {
                if (it.dataset.type === type) {
                    if (tempSelectedTypes.has(type)) {
                        it.classList.add('selected');
                        if (!it.querySelector('.type-select-check')) it.innerHTML += '<span class="type-select-check">✓</span>';
                    } else {
                        it.classList.remove('selected');
                        const checkSpan = it.querySelector('.type-select-check');
                        if (checkSpan) checkSpan.remove();
                    }
                }
            });
        });
    });
    
    const resetBtn = document.getElementById('typeResetBtn');
    const applyBtn = document.getElementById('typeApplyBtn');
    
    if (resetBtn) {
        resetBtn.onclick = (e) => {
            e.stopPropagation();
            tempSelectedTypes.clear();
            const items = document.querySelectorAll('.type-select-item');
            items.forEach(item => {
                item.classList.remove('selected');
                const checkSpan = item.querySelector('.type-select-check');
                if (checkSpan) checkSpan.remove();
            });
        };
    }
    
    if (applyBtn) {
        applyBtn.onclick = (e) => {
            e.stopPropagation();
            selectedTypes = new Set(tempSelectedTypes);
            updateTypeFilterTrigger();
            document.getElementById('typeFilterDropdown').classList.remove('show');
            filterAndSort();
        };
    }
}

function sortByRevenue(data) {
    const revenueMap = new Map();
    const sales = salesHistory.filter(entry => !entry.isReturn && !entry.hidden);
    for (const sale of sales) {
        for (const item of sale.items) {
            const currentRevenue = revenueMap.get(item.name) || 0;
            revenueMap.set(item.name, currentRevenue + (item.qty * item.price));
        }
    }
    return [...data].sort((a, b) => {
        const revenueA = revenueMap.get(a.name) || 0;
        const revenueB = revenueMap.get(b.name) || 0;
        const isOutOfStockA = (a.stock || 0) === 0;
        const isOutOfStockB = (b.stock || 0) === 0;
        if (isOutOfStockA && !isOutOfStockB) return 1;
        if (!isOutOfStockA && isOutOfStockB) return -1;
        return revenueB - revenueA;
    });
}

function filterAndSort() {
    let filtered = [...originalCardsData];
    const searchText = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (searchText) filtered = filtered.filter(card => card.name.toLowerCase().includes(searchText));
    if (selectedTypes.size > 0) filtered = filtered.filter(card => selectedTypes.has(card.type));
    if (currentSortBy !== 'none') {
        switch (currentSortBy) {
            case 'name': filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
            case 'stock': filtered.sort((a, b) => (a.stock || 0) - (b.stock || 0)); break;
            case 'stockDesc': filtered.sort((a, b) => (b.stock || 0) - (a.stock || 0)); break;
            case 'priceAsc': filtered.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
            case 'priceDesc': filtered.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
            case 'type': filtered.sort((a, b) => (a.type || '').localeCompare(b.type || '')); break;
            case 'relevance': filtered = sortByRevenue(filtered); break;
            case 'custom': filtered = applyCustomOrder(filtered); break;
        }
    }
    currentFilteredData = filtered;
    renderCards();
}

function initSortSelect() {
    const sortTrigger = document.getElementById('sortByTrigger');
    const sortDropdown = document.getElementById('sortByDropdown');
    const sortOptions = [
        { value: "none", label: "Без сортировки" },
        { value: "relevance", label: "По выручке" },
        { value: "name", label: "По названию" },
        { value: "stock", label: "По остатку: сначала мало" },
        { value: "stockDesc", label: "По остатку: сначала много" },
        { value: "priceAsc", label: "По цене: сначала дешёвое" },
        { value: "priceDesc", label: "По цене: сначала дорогое" },
        { value: "type", label: "По типу" },
        { value: "custom", label: "Пользовательская" }
    ];
    function buildSortDropdown() {
        sortDropdown.innerHTML = '';
        const header = document.createElement('div');
        header.className = 'filter-option-header';
        header.textContent = 'Выберите сортировку';
        sortDropdown.appendChild(header);
        sortOptions.forEach(opt => {
            const div = document.createElement('div');
            div.className = 'sort-option';
            if (currentSortBy === opt.value) div.classList.add('active');
            div.textContent = opt.label;
            div.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('.sort-option').forEach(optDiv => optDiv.classList.remove('active'));
                div.classList.add('active');
                currentSortBy = opt.value;
                sortTrigger.textContent = opt.label;
                if (currentSortBy === 'custom') initCustomOrder().then(() => filterAndSort());
                else filterAndSort();
                sortDropdown.classList.remove('show');
            };
            sortDropdown.appendChild(div);
        });
    }
    sortTrigger.onclick = (e) => { e.stopPropagation(); sortDropdown.classList.toggle('show'); };
    document.addEventListener('click', () => sortDropdown.classList.remove('show'));
    buildSortDropdown();
}

function initCustomSelects() {
    initSortSelect();
    const typeTrigger = document.getElementById('typeFilterTrigger');
    const typeDropdown = document.getElementById('typeFilterDropdown');
    typeTrigger.onclick = (e) => { e.stopPropagation(); typeDropdown.classList.toggle('show'); buildTypeMultiSelect(); };
    document.addEventListener('click', (e) => {
        if (!typeTrigger.contains(e.target) && !typeDropdown.contains(e.target)) typeDropdown.classList.remove('show');
    });
}

function updateTypeOptions() {
    const types = new Set();
    originalCardsData.forEach(card => { if (card.type && card.type.trim()) types.add(card.type); });
    typeOptions = Array.from(types).sort();
    selectedTypes.forEach(type => { if (!typeOptions.includes(type)) selectedTypes.delete(type); });
    updateTypeFilterTrigger();
}

function resetAllFilters() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    selectedTypes.clear();
    updateTypeFilterTrigger();
    currentSortBy = 'none';
    const sortTrigger = document.getElementById('sortByTrigger');
    if (sortTrigger) sortTrigger.textContent = 'Без сортировки';
    document.querySelectorAll('.sort-option').forEach(opt => opt.classList.remove('active'));
    filterAndSort();
}
