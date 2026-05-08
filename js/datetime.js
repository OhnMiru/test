// ========== ДАТА И ВРЕМЯ ==========

function initDateTimeSelects() {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();
    const lastYear = currentYear - 1;
    
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) years.push(i);
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    
    // Заполняем скрытые select (для хранения значений)
    ['dateFromDay', 'dateToDay', 'statsDateFromDay', 'statsDateToDay', 'globalStatsDateFromDay', 'globalStatsDateToDay'].forEach(id => {
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
    
    ['dateFromMonth', 'dateToMonth', 'statsDateFromMonth', 'statsDateToMonth', 'globalStatsDateFromMonth', 'globalStatsDateToMonth'].forEach(id => {
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
    
    ['dateFromYear', 'dateToYear', 'statsDateFromYear', 'statsDateToYear', 'globalStatsDateFromYear', 'globalStatsDateToYear'].forEach(id => {
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
                select.value = lastYear;  // Для dateFrom ставим прошлый год
            }
        }
    });
    
    ['timeFromHour', 'timeToHour', 'statsTimeFromHour', 'statsTimeToHour', 'globalStatsTimeFromHour', 'globalStatsTimeToHour'].forEach(id => {
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
    
    ['timeFromMinute', 'timeToMinute', 'statsTimeFromMinute', 'statsTimeToMinute', 'globalStatsTimeFromMinute', 'globalStatsTimeToMinute'].forEach(id => {
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
    
    // Устанавливаем день и месяц для dateFrom (текущие день и месяц)
    const dateFromDay = document.getElementById('dateFromDay');
    const dateFromMonth = document.getElementById('dateFromMonth');
    if (dateFromDay) dateFromDay.value = currentDay;
    if (dateFromMonth) dateFromMonth.value = currentMonth;
    
    // Устанавливаем день и месяц для dateTo (текущие день и месяц)
    const dateToDay = document.getElementById('dateToDay');
    const dateToMonth = document.getElementById('dateToMonth');
    if (dateToDay) dateToDay.value = currentDay;
    if (dateToMonth) dateToMonth.value = currentMonth;
    
    // Инициализируем кастомные селекторы
    if (typeof initCustomDateTimeSelects === 'function') {
        initCustomDateTimeSelects();
        
        // ОБНОВЛЯЕМ КАСТОМНЫЕ СЕЛЕКТОРЫ С НУЖНЫМИ ЗНАЧЕНИЯМИ
        setTimeout(() => {
            if (typeof updateCustomDateFromValues === 'function') {
                updateCustomDateFromValues(currentDay, currentMonth, lastYear);
                updateCustomDateToValues(currentDay, currentMonth, currentYear);
            }
        }, 50);
    }
    if (typeof initCustomStatsDateTimeSelects === 'function') {
        initCustomStatsDateTimeSelects();
    }
    if (typeof initCustomGlobalStatsDateTimeSelects === 'function') {
        initCustomGlobalStatsDateTimeSelects();
    }
}

function getDateTimeFromSelects(prefix) {
    const day = document.getElementById(`${prefix}Day`)?.value;
    const month = document.getElementById(`${prefix}Month`)?.value;
    const year = document.getElementById(`${prefix}Year`)?.value;
    const hour = document.getElementById(`time${prefix === 'dateFrom' ? 'From' : 'To'}Hour`)?.value;
    const minute = document.getElementById(`time${prefix === 'dateFrom' ? 'From' : 'To'}Minute`)?.value;
    if (day && month && year && hour && minute) {
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
    }
    return null;
}

function bindDateTimeEvents() {
    const selectIds = ['dateFromDay', 'dateFromMonth', 'dateFromYear', 'timeFromHour', 'timeFromMinute', 'dateToDay', 'dateToMonth', 'dateToYear', 'timeToHour', 'timeToMinute'];
    for (const id of selectIds) { 
        const el = document.getElementById(id); 
        if (el) el.addEventListener('change', () => renderHistoryList()); 
    }
    const minPrice = document.getElementById('historyMinPrice');
    const maxPrice = document.getElementById('historyMaxPrice');
    if (minPrice) minPrice.addEventListener('input', () => renderHistoryList());
    if (maxPrice) maxPrice.addEventListener('input', () => renderHistoryList());
}

function startAutoRefresh() { 
    if (autoRefreshInterval) clearInterval(autoRefreshInterval); 
    autoRefreshInterval = setInterval(() => { loadData(false, true); }, 120000); 
}
