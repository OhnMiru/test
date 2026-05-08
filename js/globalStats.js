// ========== ГЛОБАЛЬНАЯ СТАТИСТИКА ==========

// Переменные для фильтра глобальной статистики
let globalStatsFilterFromDate = null;
let globalStatsFilterToDate = null;
let globalStatsFilterActive = false;

// Инициализация селектов даты и времени для глобальной статистики
function initGlobalStatsDateTimeSelects() {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) years.push(i);
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    // Дни
    ['globalStatsDateFromDay', 'globalStatsDateToDay'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 1; i <= 31; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
        }
    });
    
    // Месяцы
    ['globalStatsDateFromMonth', 'globalStatsDateToMonth'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i < 12; i++) {
                const option = document.createElement('option');
                option.value = i + 1;
                option.textContent = monthNames[i];
                select.appendChild(option);
            }
        }
    });
    
    // Годы
    ['globalStatsDateFromYear', 'globalStatsDateToYear'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (const year of years) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                select.appendChild(option);
            }
            if (select.id.includes('To')) {
                select.value = currentYear;
            } else {
                select.value = currentYear - 1;
            }
        }
    });
    
    // Часы
    ['globalStatsTimeFromHour', 'globalStatsTimeToHour'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i <= 23; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
            if (select.id.includes('From')) {
                select.value = 0;
            } else {
                select.value = 23;
            }
        }
    });
    
    // Минуты
    ['globalStatsTimeFromMinute', 'globalStatsTimeToMinute'].forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '';
            for (let i = 0; i <= 59; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i.toString().padStart(2, '0');
                select.appendChild(option);
            }
            if (select.id.includes('From')) {
                select.value = 0;
            } else {
                select.value = 59;
            }
        }
    });
}

// Получение даты из селектов глобальной статистики
function getGlobalStatsDateTimeFromSelects(prefix) {
    const day = document.getElementById(`${prefix}Day`)?.value;
    const month = document.getElementById(`${prefix}Month`)?.value;
    const year = document.getElementById(`${prefix}Year`)?.value;
    const hour = document.getElementById(`globalStatsTime${prefix === 'globalStatsDateFrom' ? 'From' : 'To'}Hour`)?.value;
    const minute = document.getElementById(`globalStatsTime${prefix === 'globalStatsDateFrom' ? 'From' : 'To'}Minute`)?.value;
    
    if (day && month && year && hour && minute) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    return null;
}

// Установка значений селектов
function setGlobalStatsDateTimeValues(prefix, date) {
    if (!date) return;
    const day = document.getElementById(`${prefix}Day`);
    const month = document.getElementById(`${prefix}Month`);
    const year = document.getElementById(`${prefix}Year`);
    const hour = document.getElementById(`globalStatsTime${prefix === 'globalStatsDateFrom' ? 'From' : 'To'}Hour`);
    const minute = document.getElementById(`globalStatsTime${prefix === 'globalStatsDateFrom' ? 'From' : 'To'}Minute`);
    
    if (day) day.value = date.getDate();
    if (month) month.value = date.getMonth() + 1;
    if (year) year.value = date.getFullYear();
    if (hour) hour.value = date.getHours();
    if (minute) minute.value = date.getMinutes();
}

// Переключение видимости фильтра
function toggleGlobalStatsFilter() {
    const block = document.getElementById('globalStatsFilterBlock');
    if (block) {
        const isVisible = block.style.display !== 'none';
        block.style.display = isVisible ? 'none' : 'block';
    }
}

// Сброс фильтра
function resetGlobalStatsFilter() {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 30);
    
    setGlobalStatsDateTimeValues('globalStatsDateFrom', fromDate);
    setGlobalStatsDateTimeValues('globalStatsDateTo', now);
    
    globalStatsFilterFromDate = null;
    globalStatsFilterToDate = null;
    globalStatsFilterActive = false;
    
    showGlobalStats();
}

// Применение фильтра
function applyGlobalStatsFilter() {
    globalStatsFilterFromDate = getGlobalStatsDateTimeFromSelects('globalStatsDateFrom');
    globalStatsFilterToDate = getGlobalStatsDateTimeFromSelects('globalStatsDateTo');
    globalStatsFilterActive = true;
    showGlobalStats();
}

async function loadGlobalExtraCosts() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_global_costs');
        if (saved) globalExtraCosts = JSON.parse(saved);
        else globalExtraCosts = [];
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getAllExtraCosts"));
        const data = await response.json();
        if (data && data.costs) {
            globalExtraCosts = data.costs;
            localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        }
    } catch(e) {
        const saved = localStorage.getItem('merch_global_costs');
        if (saved) globalExtraCosts = JSON.parse(saved);
        else globalExtraCosts = [];
    }
}

async function loadGlobalExtraIncomes() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_global_incomes');
        if (saved) globalExtraIncomes = JSON.parse(saved);
        else globalExtraIncomes = [];
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getAllExtraIncomes"));
        const data = await response.json();
        if (data && data.incomes) {
            globalExtraIncomes = data.incomes;
            localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        }
    } catch(e) {
        const saved = localStorage.getItem('merch_global_incomes');
        if (saved) globalExtraIncomes = JSON.parse(saved);
        else globalExtraIncomes = [];
    }
}

async function addGlobalExtraCost(name, amount) {
    if (!isOnline) {
        const newId = Date.now();
        globalExtraCosts.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`);
        showToast("Расход добавлен (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            renderGlobalStatsWithCosts();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraCosts();
            showToast("Расход добавлен", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                renderGlobalStatsWithCosts();
            }
        }
    } catch(e) {
        globalExtraCosts.push({ id: Date.now(), name: name, amount: amount });
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`);
        showToast("Расход добавлен (будет синхронизирован позже)", true);
    }
}

async function deleteGlobalExtraCost(index) {
    const costId = globalExtraCosts[index].id;
    if (!isOnline) {
        globalExtraCosts.splice(index, 1);
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("deleteExtraCostGlobal", `&id=${costId}`);
        showToast("Расход удалён (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            renderGlobalStatsWithCosts();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("deleteExtraCostGlobal", `&id=${costId}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraCosts();
            showToast("Расход удалён", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                renderGlobalStatsWithCosts();
            }
        }
    } catch(e) {
        globalExtraCosts.splice(index, 1);
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("deleteExtraCostGlobal", `&id=${costId}`);
        showToast("Расход удалён (будет синхронизирован позже)", true);
    }
}

async function addGlobalExtraIncome(name, amount) {
    if (!isOnline) {
        const newId = Date.now();
        globalExtraIncomes.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("addExtraIncomeGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`);
        showToast("Доход добавлен (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            renderGlobalStatsWithCosts();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("addExtraIncomeGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraIncomes();
            showToast("Доход добавлен", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                renderGlobalStatsWithCosts();
            }
        }
    } catch(e) {
        globalExtraIncomes.push({ id: Date.now(), name: name, amount: amount });
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("addExtraIncomeGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`);
        showToast("Доход добавлен (будет синхронизирован позже)", true);
    }
}

async function deleteGlobalExtraIncome(index) {
    const incomeId = globalExtraIncomes[index].id;
    if (!isOnline) {
        globalExtraIncomes.splice(index, 1);
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("deleteExtraIncomeGlobal", `&id=${incomeId}`);
        showToast("Доход удалён (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            renderGlobalStatsWithCosts();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("deleteExtraIncomeGlobal", `&id=${incomeId}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraIncomes();
            showToast("Доход удалён", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                renderGlobalStatsWithCosts();
            }
        }
    } catch(e) {
        globalExtraIncomes.splice(index, 1);
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("deleteExtraIncomeGlobal", `&id=${incomeId}`);
        showToast("Доход удалён (будет синхронизирован позже)", true);
    }
}

async function showGlobalStats() {
    const modal = document.getElementById('globalStatsModal');
    if (!modal) return;
    modal.style.display = 'block';
    const container = document.getElementById('globalStats-content');
    container.innerHTML = '<div class="loading">Загрузка статистики всех участников...</div>';
    try {
        await loadGlobalExtraCosts();
        await loadGlobalExtraIncomes();
        const response = await fetch(`${CENTRAL_API_URL}?action=getAllStatsFull&participant=${CURRENT_USER.id}&t=${Date.now()}`);
        const data = await response.json();
        window._globalStatsData = data;
        renderGlobalStatsWithData(data);
    } catch(e) {
        container.innerHTML = '<div class="loading">Ошибка загрузки статистики</div>';
        showToast("Ошибка загрузки статистики", false);
    }
}

function renderGlobalStatsWithData(data) {
    const container = document.getElementById('globalStats-content');
    if (!container) return;

    let visibleParticipants = (data.participants || []).filter(p => p.hideStats !== true && p.shareStats !== true);
    const artists = visibleParticipants.filter(p => p.role === 'artist').sort((a, b) => a.name.localeCompare(b.name));
    const organizers = visibleParticipants.filter(p => p.role === 'organizer').sort((a, b) => a.name.localeCompare(b.name));
    const sortedParticipants = [...artists, ...organizers];

    let html = `<div class="participant-custom-select" id="participantSelectContainer">
            <div class="participant-custom-select-trigger" id="participantSelectTrigger">📊 Все участники</div>
            <div class="participant-custom-select-dropdown" id="participantSelectDropdown">
                <div class="participant-option selected" data-id="all">📊 Все участники</div>`;
    for (const p of sortedParticipants) {
        html += `<div class="participant-option" data-id="${escapeHtml(p.id)}" data-hide-stats="${p.hideStats}" data-share-stats="${p.shareStats}" data-name="${escapeHtml(p.name)}" data-role="${p.role}">${escapeHtml(p.name)} (${p.role === 'organizer' ? 'Организатор' : 'Художник'})</div>`;
    }
    html += `</div></div><div id="participantStatsContainer"></div>`;
    container.innerHTML = html;

    renderGlobalStatsContent(data);

    const trigger = document.getElementById('participantSelectTrigger');
    const dropdown = document.getElementById('participantSelectDropdown');
    if (trigger && dropdown) {
        trigger.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
        document.querySelectorAll('.participant-option').forEach(opt => {
            opt.addEventListener('click', async (e) => {
                const id = opt.dataset.id;
                const hideStats = opt.dataset.hideStats === 'true';
                const shareStats = opt.dataset.shareStats === 'true';
                const participantName = opt.dataset.name;
                const participantRole = opt.dataset.role;
                
                document.querySelectorAll('.participant-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                const selectedName = opt.textContent.replace('📊 ', '');
                trigger.textContent = selectedName.length > 30 ? selectedName.substring(0, 27) + '...' : selectedName;
                dropdown.classList.remove('show');
                
                if (id === 'all') {
                    renderGlobalStatsContent(data);
                } else {
                    if (hideStats || shareStats) {
                        const container = document.getElementById('participantStatsContainer');
                        container.innerHTML = `<div class="stats-privacy-message">${shareStats ? '🕊️ Аноним' : '🔒 Участник не делится статистикой'}</div>`;
                        return;
                    }
                    try {
                        const userStats = await fetch(`${CENTRAL_API_URL}?action=getUserFullStats&participant=${CURRENT_USER.id}&targetUser=${encodeURIComponent(id)}&t=${Date.now()}`).then(r => r.json());
                        if (userStats.error) {
                            const container = document.getElementById('participantStatsContainer');
                            container.innerHTML = `<div class="loading">Ошибка: ${userStats.error}</div>`;
                        } else {
                            renderUserFullStats(userStats, participantName);
                        }
                    } catch(e) {
                        const container = document.getElementById('participantStatsContainer');
                        container.innerHTML = `<div class="loading">Ошибка загрузки статистики пользователя</div>`;
                    }
                }
            });
        });
        document.addEventListener('click', (e) => { if (!trigger.contains(e.target) && !dropdown.contains(e.target)) dropdown.classList.remove('show'); });
    }
}

function renderGlobalStatsContent(data) {
    const container = document.getElementById('participantStatsContainer');
    if (!container) return;
    
    // Добавляем информацию о фильтре
    let filterInfo = '';
    if (globalStatsFilterActive && (globalStatsFilterFromDate || globalStatsFilterToDate)) {
        const fromStr = globalStatsFilterFromDate ? globalStatsFilterFromDate.toLocaleDateString('ru-RU') : 'все время';
        const toStr = globalStatsFilterToDate ? globalStatsFilterToDate.toLocaleDateString('ru-RU') : 'настоящее';
        filterInfo = `<div style="text-align: center; font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">📅 Период: ${fromStr} — ${toStr}</div>`;
    }
    
    let visibleStats = (data.stats || []).filter(s => s.hideStats !== true);
    
    const artistsStats = visibleStats.filter(s => s.role === 'artist' && !s.isAnonymous).sort((a, b) => a.name.localeCompare(b.name));
    const anonymousStats = visibleStats.filter(s => s.isAnonymous).sort((a, b) => b.profitMargin - a.profitMargin);
    const organizersStats = visibleStats.filter(s => s.role === 'organizer' && !s.isAnonymous).sort((a, b) => a.name.localeCompare(b.name));
    const sortedStats = [...artistsStats, ...anonymousStats, ...organizersStats];
    
    const totalRevenue = data.totalRevenue || 0;
    const totalCost = data.totalCost || 0;
    const totalNetProfit = data.totalNetProfit || 0;
    const totalItemsSold = data.totalItemsSold || 0;
    const totalGoods = data.totalGoods || 0;
    const avgCheck = data.avgCheck ? Math.ceil(data.avgCheck) : 0;
    const profitMargin = totalRevenue > 0 ? (totalNetProfit / totalRevenue * 100) : 0;
    
    let html = filterInfo;
    
    html += `<div class="stats-grid">
        <div class="stats-card"><div class="stats-card-value">${totalRevenue.toLocaleString()} ₽</div><div class="stats-card-label">💰 Общая выручка</div></div>
        <div class="stats-card"><div class="stats-card-value">${totalCost.toLocaleString()} ₽</div><div class="stats-card-label">📦 Общая себестоимость</div></div>
        <div class="stats-card"><div class="stats-card-value">${(data.totalExtraCosts || 0).toLocaleString()} ₽</div><div class="stats-card-label">➕ Дополнительные расходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${(data.totalExtraIncomes || 0).toLocaleString()} ₽</div><div class="stats-card-label">💵 Дополнительные доходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${(totalCost + (data.totalExtraCosts || 0) - (data.totalExtraIncomes || 0)).toLocaleString()} ₽</div><div class="stats-card-label">📉 Общие затраты</div></div>
        <div class="stats-card desktop-only"><div class="stats-card-value ${totalNetProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${totalNetProfit.toLocaleString()} ₽</div><div class="stats-card-label">📈 Чистая прибыль</div></div>
        <div class="stats-card"><div class="stats-card-value">${totalItemsSold.toLocaleString()} шт</div><div class="stats-card-label">📊 Продано товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${totalGoods.toLocaleString()} шт</div><div class="stats-card-label">📦 Осталось товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${(data.totalOrders || 0).toLocaleString()}</div><div class="stats-card-label">🛒 Количество заказов</div></div>
        <div class="stats-card"><div class="stats-card-value">${avgCheck.toLocaleString()} ₽</div><div class="stats-card-label">💳 Средний чек</div></div>
    </div>`;
    
    html += `<div class="profit-mobile-row">
        <div class="profit-mobile-card">
            <div class="profit-mobile-value">${totalNetProfit.toLocaleString()} ₽</div>
            <div class="profit-mobile-label">📈 Чистая прибыль</div>
        </div>
        <div class="profit-mobile-card">
            <div class="profit-mobile-value">${profitMargin.toFixed(1)}%</div>
            <div class="profit-mobile-label">📊 Рентабельность</div>
        </div>
    </div>`;
    
    html += `<div class="profit-card-single">
        <div class="profit-card-value">${profitMargin.toFixed(1)}%</div>
        <div class="profit-card-label">📊 Рентабельность</div>
    </div>`;
    
    // Таблица статистики по участникам
    html += `<div class="detail-section">
        <div class="detail-title">📊 Статистика по участникам</div>
        <div class="table-wrapper">
            <table class="detail-table">
                <thead>
                    <tr><th>Участник</th><th>Роль</th><th class="text-right">Выручка</th><th class="text-right">Чистая прибыль</th>
                    <th class="text-right">Продано товаров</th><th class="text-right">Всего товаров</th><th class="text-right">Средний чек</th><th class="text-right">Рентабельность</th>
                </tr>
                </thead>
                <tbody>`;
    for (const s of sortedStats) {
        const profitClass = (s.netProfit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = (s.profitMargin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
        const avgCheckValue = s.averageCheck ? Math.ceil(s.averageCheck) : 0;
        html += `<tr>
                    <td>${escapeHtml(s.name)}</td>
                    <td>${s.role === 'organizer' ? 'Организатор' : 'Художник'}</td>
                    <td class="text-right">${(s.totalRevenue || 0).toLocaleString()} ₽</td>
                    <td class="text-right ${profitClass}">${(s.netProfit || 0).toLocaleString()} ₽</td>
                    <td class="text-right">${(s.totalItemsSold || 0).toLocaleString()} шт</td>
                    <td class="text-right">${(s.totalGoods || 0).toLocaleString()} шт</td>
                    <td class="text-right">${avgCheckValue.toLocaleString()} ₽</td>
                    <td class="text-right ${marginClass}">${(s.profitMargin || 0).toFixed(1)}%</td>
                </tr>`;
    }
    html += `</tbody>
            </table>
        </div>
    </div>`;
    
    // Детализация по типам мерча
    if (data.typeDetails && data.typeDetails.length > 0) {
        const sortedTypeDetails = [...data.typeDetails].sort((a, b) => b.qty - a.qty);
        html += `<div class="detail-section">
            <div class="detail-title">🏷️ Детализация по типам мерча</div>
            <div class="table-wrapper">
                <table class="detail-table">
                    <thead>
                        <tr><th>Тип</th><th class="text-right">Продано, шт</th><th class="text-right">Выручка</th><th class="text-right">Средняя цена</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th>
                    </tr>
                    </thead>
                    <tbody>`;
        for (const t of sortedTypeDetails) {
            const tProfitClass = (t.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const tMarginClass = (t.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const avgPrice = t.qty > 0 ? t.revenue / t.qty : 0;
            html += `<tr>
                        <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
                        <td class="text-right">${t.qty} шт</td>
                        <td class="text-right">${t.revenue.toLocaleString()} ₽</td>
                        <td class="text-right">${Math.ceil(avgPrice).toLocaleString()} ₽</td>
                        <td class="text-right ${tProfitClass}">${t.profit.toLocaleString()} ₽</td>
                        <td class="text-right ${tMarginClass}">${t.margin.toFixed(1)}%</td>
                    </tr>`;
        }
        html += `</tbody>
                <tr>
            </div>
        </div>`;
    }
    
    // Самые продаваемые товары
    if (data.topProducts && data.topProducts.length > 0) {
        const sortedTopProducts = [...data.topProducts].sort((a, b) => b.qty - a.qty);
        html += `<div class="detail-section">
            <div class="detail-title">🏆 Самые продаваемые товары</div>
            <div class="table-wrapper">
                <table class="detail-table">
                    <thead>
                        <tr><th>#</th><th>Товар</th><th>Тип</th><th>Участник</th><th class="text-right">Цена</th><th class="text-right">Выручка</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th><th class="text-right">Продано, шт</th>
                    <tr>
                    </thead>
                    <tbody>`;
        for (let i = 0; i < sortedTopProducts.length; i++) {
            const p = sortedTopProducts[i];
            const pProfitClass = (p.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const pMarginClass = (p.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const participantDisplay = p.participantName || (p.isAnonymous ? "Аноним 🕊️" : p.participantName);
            html += `<tr>
                        <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
                        <td>${escapeHtml(p.name)}</td>
                        <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
                        <td>${escapeHtml(participantDisplay)}</td>
                        <td class="text-right">${Math.ceil(p.price || 0).toLocaleString()} ₽</td>
                        <td class="text-right">${p.revenue.toLocaleString()} ₽</td>
                        <td class="text-right ${pProfitClass}">${p.profit.toLocaleString()} ₽</td>
                        <td class="text-right ${pMarginClass}">${p.margin.toFixed(1)}%</td>
                        <td class="text-right">${p.qty} шт</td>
                    </tr>`;
        }
        html += `</tbody>
                </table>
            </div>
        </div>`;
    }
    
    // Общие расходы организатора
    if (CURRENT_USER.role === 'organizer') {
        html += `<div class="extra-costs-section">
            <div class="detail-title">➕ Общие расходы организатора</div>
            <div id="global-extra-costs-list">`;
        if (globalExtraCosts.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных расходов</div>';
        for (let i = 0; i < globalExtraCosts.length; i++) {
            const cost = globalExtraCosts[i];
            html += `<div class="extra-cost-item">
                        <span class="extra-cost-name">${escapeHtml(cost.name)}</span>
                        <span class="extra-cost-amount">${cost.amount} ₽</span>
                        <button class="extra-cost-delete" onclick="deleteGlobalExtraCost(${i})">🗑</button>
                    </div>`;
        }
        html += `</div>
            <div class="add-cost-form">
                <input type="text" id="newGlobalCostName" class="add-cost-input" placeholder="Название (аренда, доставка...)" autocomplete="off">
                <input type="number" id="newGlobalCostAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100">
                <button class="add-cost-btn" onclick="addGlobalExtraCostFromModal()">➕ Добавить</button>
            </div>
        </div>`;
        
        html += `<div class="extra-income-section" style="margin-top: 24px;">
            <div class="detail-title">💵 Общие доходы организатора</div>
            <div id="global-extra-incomes-list">`;
        if (globalExtraIncomes.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных доходов</div>';
        for (let i = 0; i < globalExtraIncomes.length; i++) {
            const income = globalExtraIncomes[i];
            html += `<div class="extra-cost-item">
                        <span class="extra-cost-name">${escapeHtml(income.name)}</span>
                        <span class="extra-cost-amount">${income.amount} ₽</span>
                        <button class="extra-cost-delete" onclick="deleteGlobalExtraIncome(${i})">🗑</button>
                    </div>`;
        }
        html += `</div>
            <div class="add-cost-form">
                <input type="text" id="newGlobalIncomeName" class="add-cost-input" placeholder="Название (спонсоры, донаты...)" autocomplete="off">
                <input type="number" id="newGlobalIncomeAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100">
                <button class="add-cost-btn" onclick="addGlobalExtraIncomeFromModal()">➕ Добавить</button>
            </div>
        </div>`;
    }
    
    container.innerHTML = html;
}

function renderUserFullStats(stats, participantName) {
    const container = document.getElementById('participantStatsContainer');
    if (!container) return;
    
    if (!stats || stats.error) {
        container.innerHTML = `<div class="loading">Нет данных для отображения</div>`;
        return;
    }
    
    const totalRevenue = stats.totalRevenue || 0;
    const totalCost = stats.totalCost || 0;
    const totalNetProfit = stats.netProfit || 0;
    const totalItemsSold = stats.totalItemsSold || 0;
    const totalGoods = stats.totalGoods || 0;
    const orderCount = stats.orderCount || 0;
    const averageCheck = stats.averageCheck ? Math.ceil(stats.averageCheck) : 0;
    const profitMargin = stats.profitMargin || 0;
    const productDetails = stats.productDetails || [];
    const typeDetails = stats.typeDetails || [];
    const topProducts = stats.topProducts || [];
    const topTypes = stats.topTypes || [];
    const extraCostsUser = stats.extraCosts || [];
    const extraIncomesUser = stats.extraIncomes || [];
    const totalExtraCosts = extraCostsUser.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalExtraIncomes = extraIncomesUser.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    const formatCurrency = (value) => value.toLocaleString('ru-RU') + ' ₽';
    const formatNumber = (value) => value.toLocaleString('ru-RU');
    const formatPercent = (value) => value.toFixed(1) + '%';
    
    let html = `<div class="stats-header-info" style="text-align: center; margin-bottom: 16px; color: var(--badge-text); font-weight: bold;">📊 Статистика участника: ${escapeHtml(participantName)}</div>`;
    
    html += `<div class="stats-grid">
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalRevenue)}</div><div class="stats-card-label">💰 Выручка</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalCost)}</div><div class="stats-card-label">📦 Себестоимость всего товара</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraCosts)}</div><div class="stats-card-label">➕ Дополнительные расходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraIncomes)}</div><div class="stats-card-label">💵 Дополнительные доходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalCost + totalExtraCosts - totalExtraIncomes)}</div><div class="stats-card-label">📉 Общие затраты</div></div>
        <div class="stats-card desktop-only"><div class="stats-card-value ${totalNetProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(totalNetProfit)}</div><div class="stats-card-label">📈 Чистая прибыль</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(totalItemsSold)}</div><div class="stats-card-label">📊 Продано товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(totalGoods)}</div><div class="stats-card-label">📦 Осталось товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(orderCount)}</div><div class="stats-card-label">🛒 Количество заказов</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(averageCheck)}</div><div class="stats-card-label">💳 Средний чек</div></div>
    </div>`;
    
    html += `<div class="profit-mobile-row">
        <div class="profit-mobile-card">
            <div class="profit-mobile-value">${formatCurrency(totalNetProfit)}</div>
            <div class="profit-mobile-label">📈 Чистая прибыль</div>
        </div>
        <div class="profit-mobile-card">
            <div class="profit-mobile-value">${formatPercent(profitMargin)}</div>
            <div class="profit-mobile-label">📊 Рентабельность</div>
        </div>
    </div>`;
    
    html += `<div class="profit-card-single">
        <div class="profit-card-value">${formatPercent(profitMargin)}</div>
        <div class="profit-card-label">📊 Рентабельность</div>
    </div>`;
    
    // Детализация по товарам
    html += `<div class="detail-section">
        <div class="detail-title">📦 Детализация по товарам</div>
        <div class="table-wrapper">
            <table class="detail-table">
                <thead>
                    <tr><th>Товар</th><th>Тип</th><th class="text-right">Продано</th><th class="text-right">Остаток</th><th class="text-right">Выручка</th><th class="text-right">Себест.</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th>
                </tr>
                </thead>
                <tbody>`;
    for (const p of productDetails) {
        const profitClass = p.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = p.margin >= 0 ? 'profit-positive' : 'profit-negative';
        html += `<tr>
            <td>${escapeHtml(p.name)}</td>
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
            <td class="text-right">${p.qty} шт</td>
            <td class="text-right">${p.stock || 0} шт</td>
            <td class="text-right">${formatCurrency(p.revenue)}</td>
            <td class="text-right">${formatCurrency(p.fullCost || 0)}</td>
            <td class="text-right ${profitClass}">${formatCurrency(p.profit)}</td>
            <td class="text-right ${marginClass}">${formatPercent(p.margin)}</td>
        </tr>`;
    }
    html += `</tbody>
        </table>
        </div>
    </div>`;
    
    // Детализация по типам мерча
    if (typeDetails && typeDetails.length > 0) {
        const sortedTypeDetails = [...typeDetails].sort((a, b) => b.qty - a.qty);
        html += `<div class="detail-section">
            <div class="detail-title">🏷️ Детализация по типам мерча</div>
            <div class="table-wrapper">
                <table class="detail-table">
                    <thead>
                        <tr><th>Тип</th><th class="text-right">Продано, шт</th><th class="text-right">Выручка</th><th class="text-right">Средняя цена</th><th class="text-right">Прибыль</th><th class="text-right">Рентаб.</th>
                    </tr>
                    </thead>
                    <tbody>`;
        for (const t of sortedTypeDetails) {
            const tProfitClass = (t.profit || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const tMarginClass = (t.margin || 0) >= 0 ? 'profit-positive' : 'profit-negative';
            const avgPrice = t.qty > 0 ? t.revenue / t.qty : 0;
            html += `<tr>
                        <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
                        <td class="text-right">${t.qty} шт</td>
                        <td class="text-right">${t.revenue.toLocaleString()} ₽</td>
                        <td class="text-right">${Math.ceil(avgPrice).toLocaleString()} ₽</td>
                        <td class="text-right ${tProfitClass}">${t.profit.toLocaleString()} ₽</td>
                        <td class="text-right ${tMarginClass}">${t.margin.toFixed(1)}%</td>
                    </tr>`;
        }
        html += `</tbody>
            </table>
        </div>
    </div>`;
    }
    
    // Самые продаваемые товары и типы в две колонки
    html += `<div class="two-columns">
        <div class="detail-section">
            <div class="detail-title">🏆 Самые продаваемые товары</div>
            <div class="table-wrapper">
                <table class="detail-table-small">
                    <thead>
                        <tr><th>#</th><th>Товар</th><th>Тип</th><th class="text-right">Продано, шт</th>
                    </tr>
                    </thead>
                    <tbody>`;
    for (let i = 0; i < topProducts.length; i++) { 
        const p = topProducts[i]; 
        html += `<tr>
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
            <td>${escapeHtml(p.name)}</td>
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
            <td class="text-right">${p.qty} шт</td>
        </tr>`;
    }
    html += `</tbody>
                <tr>
            </div>
        </div>
        <div class="detail-section">
            <div class="detail-title">🏆 Самые продаваемые типы</div>
            <div class="table-wrapper">
                <table class="detail-table-small">
                    <thead>
                        <tr><th>#</th><th>Тип</th><th class="text-right">Продано, шт</th>
                    </tr>
                    </thead>
                    <tbody>`;
    for (let i = 0; i < topTypes.length; i++) { 
        const t = topTypes[i]; 
        html += `<tr>
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
            <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
            <td class="text-right">${t.qty} шт</td>
        </tr>`;
    }
    html += `</tbody>
                </table>
            </div>
        </div>
    </div>`;
    
    // Дополнительные расходы участника
    html += `<div class="extra-costs-section">
        <div class="detail-title">➕ Дополнительные расходы (участника)</div>
        <div id="user-extra-costs-list">`;
    if (extraCostsUser.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных расходов</div>';
    for (const cost of extraCostsUser) {
        html += `<div class="extra-cost-item">
            <span class="extra-cost-name">${escapeHtml(cost.name)}</span>
            <span class="extra-cost-amount">${cost.amount} ₽</span>
        </div>`;
    }
    html += `</div>
    </div>`;
    
    // Дополнительные доходы участника
    html += `<div class="extra-income-section" style="margin-top: 24px;">
        <div class="detail-title">💵 Дополнительные доходы (участника)</div>
        <div id="user-extra-incomes-list">`;
    if (extraIncomesUser.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных доходов</div>';
    for (const income of extraIncomesUser) {
        html += `<div class="extra-cost-item">
            <span class="extra-cost-name">${escapeHtml(income.name)}</span>
            <span class="extra-cost-amount">${income.amount} ₽</span>
        </div>`;
    }
    html += `</div>
    </div>`;
    
    container.innerHTML = html;
}

async function renderGlobalStatsWithCosts() {
    const container = document.getElementById('participantStatsContainer');
    if (!container) return;
    await loadGlobalExtraCosts();
    await loadGlobalExtraIncomes();
    if (window._globalStatsData) {
        renderGlobalStatsContent(window._globalStatsData);
    }
}

async function addGlobalExtraCostFromModal() {
    const nameInput = document.getElementById('newGlobalCostName');
    const amountInput = document.getElementById('newGlobalCostAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) {
        showToast("Введите название и сумму расхода", false);
        return;
    }
    await addGlobalExtraCost(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    if (document.getElementById('globalStatsModal')?.style.display === 'block') {
        const response = await fetch(`${CENTRAL_API_URL}?action=getAllStatsFull&participant=${CURRENT_USER.id}&t=${Date.now()}`);
        const data = await response.json();
        window._globalStatsData = data;
        renderGlobalStatsContent(data);
    }
}

async function addGlobalExtraIncomeFromModal() {
    const nameInput = document.getElementById('newGlobalIncomeName');
    const amountInput = document.getElementById('newGlobalIncomeAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) {
        showToast("Введите название и сумму дохода", false);
        return;
    }
    await addGlobalExtraIncome(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    if (document.getElementById('globalStatsModal')?.style.display === 'block') {
        const response = await fetch(`${CENTRAL_API_URL}?action=getAllStatsFull&participant=${CURRENT_USER.id}&t=${Date.now()}`);
        const data = await response.json();
        window._globalStatsData = data;
        renderGlobalStatsContent(data);
    }
}

function closeGlobalStatsModal() {
    const modal = document.getElementById('globalStatsModal');
    if (modal) modal.style.display = 'none';
}
