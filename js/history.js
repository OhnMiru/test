// ========== ИСТОРИЯ ==========

// Вспомогательная функция для получения полного названия товара с атрибутами
function getItemFullName(item, card) {
    // Если уже есть fullName в item, используем его
    if (item.fullName) return item.fullName;
    
    // Если передан card, используем его
    if (card) {
        const attr1 = card.attribute1 || "";
        const attr2 = card.attribute2 || "";
        return getFullNameForHistory(card.name, card.type, attr1, attr2);
    }
    
    // Пытаемся найти карточку в originalCardsData
    const foundCard = originalCardsData.find(c => c.id === item.id);
    if (foundCard) {
        const attr1 = foundCard.attribute1 || "";
        const attr2 = foundCard.attribute2 || "";
        return getFullNameForHistory(foundCard.name, foundCard.type, attr1, attr2);
    }
    
    // Если ничего не нашли, возвращаем просто название
    return item.name;
}

function saveHistoryToLocal() {
    localStorage.setItem('merch_sales_history', JSON.stringify(salesHistory));
}

function loadHistoryFromLocal() {
    const saved = localStorage.getItem('merch_sales_history');
    if (saved) {
        try {
            salesHistory = JSON.parse(saved);
        } catch(e) {
            salesHistory = [];
        }
    } else {
        salesHistory = [];
    }
}

async function syncFullHistoryToServer() {
    if (!isOnline) {
        addPendingOperation("syncFullHistory", salesHistory);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(salesHistory));
        const response = await fetch(buildApiUrl("syncFullHistory", `&data=${data}`));
        const result = await response.json();
        if (!result.success) {
            addPendingOperation("syncFullHistory", salesHistory);
        }
    } catch(e) {
        console.error(e);
        addPendingOperation("syncFullHistory", salesHistory);
    }
}

async function loadHistoryFromServer() {
    if (!isOnline) {
        loadHistoryFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getFullHistory"));
        const data = await response.json();
        if (data && data.history) {
            // Нормализуем записи истории
            salesHistory = data.history.map(entry => ({
                ...entry,
                isReturn: entry.isReturn === true,
                paymentType: entry.paymentType || 'cash',
                hidden: entry.hidden === true,
                actedBy: entry.actedBy || null
            }));
            saveHistoryToLocal();
            if (document.getElementById('historyModal')?.style.display === 'block') renderHistoryList();
            return true;
        }
        return false;
    } catch(e) {
        return false;
    }
}

async function loadHistory() {
    const loaded = await loadHistoryFromServer();
    if (!loaded) loadHistoryFromLocal();
    saveHistoryToLocal();
}

function saveHistory() {
    saveHistoryToLocal();
    syncFullHistoryToServer();
}

// Получение имени реального пользователя (организатора) для отметки в истории
function getActedByText() {
    if (typeof window.isImpersonating !== 'undefined' && window.isImpersonating && window.originalUserName) {
        return window.originalUserName;
    }
    return null;
}

// ОБНОВЛЕНА: добавляет полное название товара с атрибутами
function addToHistory(items, total, method, isReturn = false, paymentType = 'cash') {
    const actedBy = getActedByText();
    
    // Обогащаем items полными названиями
    const enrichedItems = items.map(item => {
        const card = originalCardsData.find(c => c.id === item.id);
        const fullName = getItemFullName(item, card);
        return { 
            id: item.id, 
            name: item.name, 
            qty: item.qty, 
            price: item.price,
            fullName: fullName
        };
    });
    
    const entry = {
        id: Date.now() + Math.random(),
        date: new Date().toISOString(),
        items: enrichedItems,
        total: total,
        method: method,
        isReturn: isReturn,
        hidden: false,
        paymentType: paymentType,
        actedBy: actedBy
    };
    salesHistory.unshift(entry);
    if (salesHistory.length > 200) salesHistory = salesHistory.slice(0, 200);
    saveHistory();
    if (document.getElementById('historyModal')?.style.display === 'block') renderHistoryList();
}

// ОБНОВЛЕНА: добавляет полное название товара с атрибутами
function addSingleSaleToHistory(item, qty, isReturn = false) {
    const card = originalCardsData.find(c => c.id === item.id);
    const fullName = getItemFullName(item, card);
    
    addToHistory(
        [{ id: item.id, name: item.name, qty: qty, price: item.price, fullName: fullName }], 
        qty * item.price, 
        'single', 
        isReturn, 
        'cash'
    );
}

async function hideHistoryEntry(id) {
    if (!isOnline) {
        const entry = salesHistory.find(e => e.id == id);
        if (entry) entry.hidden = true;
        saveHistory();
        addPendingOperation("hideHistoryEntry", { id: id });
        renderHistoryList();
        showToast("Запись скрыта (будет синхронизировано позже)", true);
        return;
    }
    try {
        await fetch(buildApiUrl("hideHistoryEntry", `&id=${id}`));
        const entry = salesHistory.find(e => e.id == id);
        if (entry) entry.hidden = true;
        saveHistory();
        renderHistoryList();
        showToast("Запись скрыта", true);
    } catch(e) {
        const entry = salesHistory.find(e => e.id == id);
        if (entry) entry.hidden = true;
        saveHistory();
        addPendingOperation("hideHistoryEntry", { id: id });
        showToast("Запись скрыта (будет синхронизировано позже)", true);
    }
}

async function cancelHistoryEntry(id) {
    const entry = salesHistory.find(e => e.id == id);
    if (!entry) return;
    if (entry.isReturn) {
        showToast("Отмена возврата не поддерживается", false);
        return;
    }

    if (!isOnline) {
        addPendingOperation("cancelHistoryEntry", { id: id });
        showToast("Отмена продажи будет выполнена при восстановлении соединения", true);
        return;
    }

    try {
        let realUserParam = "";
        if (typeof window.getRealUserParam === 'function') {
            realUserParam = window.getRealUserParam();
        }
        
        const response = await fetch(buildApiUrl("cancelHistoryEntry", `&id=${id}${realUserParam}`));
        const result = await response.json();
        if (result.success) {
            entry.hidden = true;
            saveHistory();
            await loadData(true, false);
            renderHistoryList();
            showToast("Продажа отменена, остатки восстановлены", true);
        } else {
            showToast("Ошибка отмены: " + (result.error || "неизвестная"), false);
        }
    } catch(e) {
        addPendingOperation("cancelHistoryEntry", { id: id });
        showToast("Отмена продажи будет выполнена при восстановлении соединения", true);
    }
}

function setHistoryMethodFilter(filter) {
    historyMethodFilter = filter;
    document.querySelectorAll('[data-method]').forEach(btn => {
        if (btn.dataset.method === filter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    renderHistoryList();
}

function setHistoryTypeFilter(filter) {
    historyTypeFilter = filter;
    document.querySelectorAll('[data-type]').forEach(btn => {
        if (btn.dataset.type === filter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    renderHistoryList();
}

function setHistoryPaymentFilter(filter) {
    historyPaymentFilter = filter;
    document.querySelectorAll('[data-payment]').forEach(btn => {
        if (btn.dataset.payment === filter) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    renderHistoryList();
}

function startHistoryAutoSync() {
    if (historySyncInterval) clearInterval(historySyncInterval);
    historySyncInterval = setInterval(async () => { await loadHistoryFromServer(); }, 60000);
}

function clearAllHistory() {
    if (salesHistory.length === 0) {
        showToast("История уже пуста", false);
        return;
    }
    if (confirm("Удалить всю историю операций? Это действие нельзя отменить.")) {
        salesHistory = [];
        saveHistory();
        renderHistoryList();
        showToast("Вся история очищена", true);
    }
}

function resetHistoryFilters() {
    historyMethodFilter = "all";
    historyTypeFilter = "all";
    historyPaymentFilter = "all";
    document.querySelectorAll('[data-method], [data-type], [data-payment]').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-method="all"]')?.classList.add('active');
    document.querySelector('[data-type="all"]')?.classList.add('active');
    document.querySelector('[data-payment="all"]')?.classList.add('active');

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();

    const fromDay = document.getElementById('dateFromDay');
    const fromMonth = document.getElementById('dateFromMonth');
    const fromYear = document.getElementById('dateFromYear');
    const fromHour = document.getElementById('timeFromHour');
    const fromMinute = document.getElementById('timeFromMinute');
    if (fromDay) fromDay.value = currentDay;
    if (fromMonth) fromMonth.value = currentMonth;
    if (fromYear) fromYear.value = currentYear;
    if (fromHour) fromHour.value = 0;
    if (fromMinute) fromMinute.value = 0;

    const toDay = document.getElementById('dateToDay');
    const toMonth = document.getElementById('dateToMonth');
    const toYear = document.getElementById('dateToYear');
    const toHour = document.getElementById('timeToHour');
    const toMinute = document.getElementById('timeToMinute');
    if (toDay) toDay.value = currentDay;
    if (toMonth) toMonth.value = currentMonth;
    if (toYear) toYear.value = currentYear;
    if (toHour) toHour.value = 23;
    if (toMinute) toMinute.value = 59;

    const minPrice = document.getElementById('historyMinPrice');
    const maxPrice = document.getElementById('historyMaxPrice');
    if (minPrice) minPrice.value = '0';
    if (maxPrice) maxPrice.value = '';

    // Обновляем кастомные селекторы после сброса значений
    if (typeof initCustomDateTimeSelects === 'function') {
        initCustomDateTimeSelects();
    }
    
    renderHistoryList();
}

// ОБНОВЛЕНА: отображает полное название товара с атрибутами
function renderHistoryList() {
    const container = document.getElementById('history-list');
    if (!container) return;

    const fromDate = getDateTimeFromSelects('dateFrom');
    const toDate = getDateTimeFromSelects('dateTo');
    const minPrice = parseInt(document.getElementById('historyMinPrice')?.value) || 0;
    const maxPrice = parseInt(document.getElementById('historyMaxPrice')?.value) || Infinity;

    let filtered = salesHistory.filter(e => !e.hidden);
    if (historyMethodFilter === 'basket') filtered = filtered.filter(e => e.method === 'basket');
    else if (historyMethodFilter === 'single') filtered = filtered.filter(e => e.method === 'single');
    if (historyTypeFilter === 'sale') filtered = filtered.filter(e => !e.isReturn);
    else if (historyTypeFilter === 'return') filtered = filtered.filter(e => e.isReturn === true);
    if (historyPaymentFilter === 'cash') filtered = filtered.filter(e => e.paymentType === 'cash');
    else if (historyPaymentFilter === 'transfer') filtered = filtered.filter(e => e.paymentType === 'transfer');
    if (fromDate) filtered = filtered.filter(e => new Date(e.date) >= fromDate);
    if (toDate) filtered = filtered.filter(e => new Date(e.date) <= toDate);
    filtered = filtered.filter(e => e.total >= minPrice && e.total <= maxPrice);

    if (filtered.length === 0) {
        container.innerHTML = '<div class="empty-cart">🍌 История пуста</div>';
        return;
    }

    const isMobile = window.innerWidth <= 500;
    
    let html = '';
    for (const entry of filtered) {
        const date = new Date(entry.date);
        const dateStr = date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
        const isBasket = entry.method === 'basket';
        const isReturn = entry.isReturn;
        const paymentIcon = entry.paymentType === 'transfer' ? '💳' : '💰';
        const paymentText = entry.paymentType === 'transfer' ? 'Перевод' : 'Наличные';
        
        const methodLabel = isBasket ? (isMobile ? '🛒' : 'Корзина') : (isMobile ? '🔢' : 'Поштучно');
        const actionLabel = isReturn ? (isMobile ? '↩️' : 'Возврат') : (isMobile ? '✨' : 'Продажа');
        
        let itemsHtml = '';
        for (const item of entry.items) {
            // Используем fullName если есть, иначе формируем сами
            let displayName = item.fullName;
            if (!displayName) {
                const card = originalCardsData.find(c => c.id === item.id);
                if (card) {
                    const attr1 = card.attribute1 || "";
                    const attr2 = card.attribute2 || "";
                    displayName = getFullNameForHistory(card.name, card.type, attr1, attr2);
                } else {
                    displayName = item.name;
                }
            }
            
            if (isMobile) {
                itemsHtml += `<div>${escapeHtml(displayName)}:<br>${item.qty} шт × ${item.price} ₽ = ${item.qty * item.price} ₽</div>`;
            } else {
                itemsHtml += `<div>• ${escapeHtml(displayName)}: ${item.qty} шт × ${item.price} ₽ = ${item.qty * item.price} ₽</div>`;
            }
        }
        
        const methodClass = isBasket ? 'history-badge-method-basket' : 'history-badge-method-single';
        const actionClass = isReturn ? 'history-badge-type-return' : 'history-badge-type-sale';
        
        let actedByHtml = '';
        if (entry.actedBy) {
            actedByHtml = `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px; font-style: italic;">👤 Действие выполнено организатором ${escapeHtml(entry.actedBy)}</div>`;
        }
        
        html += `<div class="history-item">
                    <div class="history-content">
                        <div class="history-date">
                            ${dateStr}
                            <span class="history-badge ${methodClass}">${methodLabel}</span>
                            <span class="history-badge ${actionClass}">${actionLabel}</span>
                            <span class="history-badge" style="background: ${entry.paymentType === 'transfer' ? '#9b59b6' : '#2ecc71'}20; color: ${entry.paymentType === 'transfer' ? '#9b59b6' : '#2ecc71'};">${paymentIcon} ${isMobile ? '' : paymentText}</span>
                        </div>
                        <div class="history-details">${itemsHtml}</div>
                        <div class="${isReturn ? 'history-return' : 'history-sale'}">${isReturn ? '↩️' : '💰'} Итого: ${entry.total} ₽</div>
                        ${actedByHtml}
                    </div>
                    <div class="history-buttons">
                        ${!isReturn ? `<button class="history-cancel-btn" onclick="cancelHistoryEntry('${entry.id}')" title="Отменить продажу">↩️</button>` : ''}
                        <button class="history-delete-btn" onclick="hideHistoryEntry('${entry.id}')" title="Скрыть запись">🗑</button>
                    </div>
                </div>`;
    }
    container.innerHTML = html;
}

// ОБНОВЛЕНА: открытие истории с инициализацией кастомных селекторов
function showHistory() { 
    const modal = document.getElementById('historyModal'); 
    if (modal) { 
        resetHistoryFilters(); 
        renderHistoryList(); 
        modal.style.display = 'block';
        // Инициализируем кастомные селекторы после открытия модалки
        setTimeout(() => {
            if (typeof initCustomDateTimeSelects === 'function') {
                initCustomDateTimeSelects();
            }
        }, 50);
    } 
}

function closeHistory() { 
    const modal = document.getElementById('historyModal'); 
    if (modal) modal.style.display = 'none'; 
}

// Экспортируем функции в глобальную область
window.getItemFullName = getItemFullName;
window.showHistory = showHistory;
window.closeHistory = closeHistory;
window.setHistoryMethodFilter = setHistoryMethodFilter;
window.setHistoryTypeFilter = setHistoryTypeFilter;
window.setHistoryPaymentFilter = setHistoryPaymentFilter;
window.clearAllHistory = clearAllHistory;
window.resetHistoryFilters = resetHistoryFilters;
window.hideHistoryEntry = hideHistoryEntry;
window.cancelHistoryEntry = cancelHistoryEntry;
