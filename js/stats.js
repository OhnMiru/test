// ========== СТАТИСТИКА ==========

// Переменные для фильтра по времени
let statsFilterFromDate = null;
let statsFilterToDate = null;
let statsFilterActive = false;

// Переменные для фильтра по характеристикам (основной фильтр)
let statsSelectedType = "";
let statsSelectedValues = [];
let statsAttributeFilterActive = false;

// Переменные для селекторной детализации по характеристикам
let detailSelectedType = "";
let detailSelectedAttributes = [];

function openStatsModal() {
    const modal = document.getElementById('statsModal');
    if (modal) {
        initCustomStatsDateTimeSelects();
        renderStats();
        modal.style.display = 'block';
    }
}

function closeStatsModal() { 
    const modal = document.getElementById('statsModal'); 
    if (modal) modal.style.display = 'none'; 
}

// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ДЛЯ ДАТЫ/ВРЕМЕНИ ==========

function initCustomStatsDateTimeSelects() {
    initStatsCustomDateGroup('statsDateFrom', 'statsDateFromContainer');
    initStatsCustomDateGroup('statsDateTo', 'statsDateToContainer');
}

function initStatsCustomDateGroup(prefix, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.flexWrap = 'wrap';
    
    let dayValue = document.getElementById(`${prefix}Day`)?.value || new Date().getDate();
    let monthValue = document.getElementById(`${prefix}Month`)?.value || (new Date().getMonth() + 1);
    let yearValue = document.getElementById(`${prefix}Year`)?.value || new Date().getFullYear();
    let hourValue = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`)?.value || (prefix === 'statsDateFrom' ? 0 : 23);
    let minuteValue = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`)?.value || (prefix === 'statsDateFrom' ? 0 : 59);
    
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createStatsCustomSelect(`${prefix}_day_select`, daysOptions, dayValue, (value) => {
        const hiddenSelect = document.getElementById(`${prefix}Day`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    const monthNames = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const monthOptions = [];
    for (let i = 0; i < 12; i++) {
        monthOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createStatsCustomSelect(`${prefix}_month_select`, monthOptions, monthValue, (value) => {
        const hiddenSelect = document.getElementById(`${prefix}Month`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    const currentYear = new Date().getFullYear();
    const yearOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearOptions.push({ value: i, label: i.toString() });
    }
    createStatsCustomSelect(`${prefix}_year_select`, yearOptions, yearValue, (value) => {
        const hiddenSelect = document.getElementById(`${prefix}Year`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    const hourOptions = [];
    for (let i = 0; i <= 23; i++) {
        hourOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createStatsCustomSelect(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}_hour_select`, hourOptions, hourValue, (value) => {
        const hiddenSelect = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
    
    const colonSpan = document.createElement('span');
    colonSpan.textContent = ':';
    colonSpan.style.color = 'var(--text-muted)';
    colonSpan.style.fontSize = '12px';
    container.appendChild(colonSpan);
    
    const minuteOptions = [];
    for (let i = 0; i <= 59; i++) {
        minuteOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createStatsCustomSelect(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}_minute_select`, minuteOptions, minuteValue, (value) => {
        const hiddenSelect = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`);
        if (hiddenSelect) hiddenSelect.value = value;
    });
}

function createStatsCustomSelect(selectId, options, selectedValue, onSelect) {
    let container = document.getElementById(selectId);
    if (!container) {
        container = document.createElement('div');
        container.id = selectId;
        container.style.display = 'inline-block';
        container.style.margin = '0 2px';
        const parentId = selectId.split('_')[0];
        const parent = document.getElementById(parentId + 'Container');
        if (parent) {
            parent.appendChild(container);
        } else {
            return;
        }
    }
    
    container.innerHTML = '';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : options[0]?.label || '--';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--badge-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 4px 20px 4px 10px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-primary); display: inline-block; font-family: monospace; min-width: 45px; text-align: center;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 8px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; z-index: 1100; display: none; max-height: 150px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 55px;';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = 'padding: 6px 10px; cursor: pointer; transition: background 0.1s; font-size: 12px; color: var(--text-primary); white-space: nowrap; text-align: center;';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            trigger.textContent = opt.label;
            dropdown.style.display = 'none';
            if (onSelect) onSelect(opt.value);
        });
        
        optionDiv.addEventListener('mouseenter', () => {
            optionDiv.style.background = 'var(--badge-bg)';
        });
        optionDiv.addEventListener('mouseleave', () => {
            if (opt.value != selectedValue) {
                optionDiv.style.background = '';
            }
        });
        
        dropdown.appendChild(optionDiv);
    });
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        document.querySelectorAll('.stats-custom-dropdown, [class*="stats_select"] > div > div').forEach(d => {
            if (d !== dropdown && d.parentElement !== customSelect) {
                d.style.display = 'none';
            }
        });
        dropdown.style.display = isOpen ? 'none' : 'block';
    });
    
    customSelect.appendChild(trigger);
    customSelect.appendChild(dropdown);
    container.appendChild(customSelect);
    
    const closeHandler = (e) => {
        if (!customSelect.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    };
    document.removeEventListener('click', closeHandler);
    document.addEventListener('click', closeHandler);
}

// ========== ФИЛЬТРЫ ПО ХАРАКТЕРИСТИКАМ (основной фильтр) ==========

function initStatsTypeSelector() {
    const container = document.getElementById('statsAttributeFilters');
    if (!container) return;
    if (container.querySelector('.stats-attribute-filters-initialized')) return;
    
    const types = getAllMerchTypes();
    let html = `
        <div class="stats-attribute-filters" style="background: var(--badge-bg); border-radius: 16px; padding: 12px; margin-bottom: 16px; width: 100%; box-sizing: border-box;">
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--badge-text);">🔍 Фильтр по характеристикам</div>
            <div class="filter-row" style="margin-bottom: 8px;">
                <select id="statsTypeSelect" class="edit-input" style="flex: 1;">
                    <option value="">Все типы</option>
    `;
    for (const type of types) {
        html += `<option value="${escapeHtml(type)}">${escapeHtml(type)}</option>`;
    }
    html += `
                </select>
            </div>
            <div id="statsValueCheckboxesContainer" style="display: none; margin-bottom: 8px;"></div>
            <div id="statsAttributeFilterButtons" style="display: none; gap: 8px; margin-top: 8px;">
                <button class="edit-save-btn" id="applyStatsAttrFilterBtn" style="padding: 6px 16px;">Применить</button>
                <button class="edit-cancel-btn" id="resetStatsAttrFilterBtn" style="padding: 6px 16px;">Сбросить</button>
            </div>
        </div>
    `;
    
    const filterBlock = document.getElementById('statsFilterBlock');
    if (filterBlock && !document.getElementById('statsAttributeFilters')) {
        filterBlock.insertAdjacentHTML('afterend', html);
        
        const typeSelect = document.getElementById('statsTypeSelect');
        if (typeSelect) {
            typeSelect.addEventListener('change', onStatsTypeChange);
        }
        const applyBtn = document.getElementById('applyStatsAttrFilterBtn');
        if (applyBtn) {
            applyBtn.addEventListener('click', applyStatsAttributeFilter);
        }
        const resetBtn = document.getElementById('resetStatsAttrFilterBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', resetStatsAttributeFilter);
        }
    }
}

function onStatsTypeChange() {
    const typeSelect = document.getElementById('statsTypeSelect');
    const selectedType = typeSelect?.value || "";
    statsSelectedType = selectedType;
    
    const valueContainer = document.getElementById('statsValueCheckboxesContainer');
    const buttonsContainer = document.getElementById('statsAttributeFilterButtons');
    
    if (!selectedType) {
        if (valueContainer) valueContainer.style.display = 'none';
        if (buttonsContainer) buttonsContainer.style.display = 'none';
        statsSelectedValues = [];
        renderStats();
        return;
    }
    
    const allValues = new Set();
    for (const card of originalCardsData) {
        if (card.type === selectedType) {
            if (card.attribute1 && card.attribute1.trim()) allValues.add(card.attribute1.trim());
            if (card.attribute2 && card.attribute2.trim()) allValues.add(card.attribute2.trim());
        }
    }
    
    const values = Array.from(allValues).sort();
    
    if (values.length === 0) {
        if (valueContainer) valueContainer.style.display = 'none';
        if (buttonsContainer) buttonsContainer.style.display = 'none';
        statsSelectedValues = [];
        renderStats();
        return;
    }
    
    if (buttonsContainer) buttonsContainer.style.display = 'flex';
    
    let valuesHtml = `<div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">Выберите характеристики:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
        <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px;">
            <input type="checkbox" class="stats-value-checkbox" data-value="__all__" checked> Все
        </label>`;
    
    for (const value of values) {
        valuesHtml += `<label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 12px;">
            <input type="checkbox" class="stats-value-checkbox" data-value="${escapeHtml(value)}"> ${escapeHtml(value)}
        </label>`;
    }
    valuesHtml += `</div>`;
    
    if (valueContainer) {
        valueContainer.innerHTML = valuesHtml;
        valueContainer.style.display = 'block';
        
        document.querySelectorAll('.stats-value-checkbox').forEach(cb => {
            cb.removeEventListener('change', onStatsValueChangeWrapper);
            cb.addEventListener('change', onStatsValueChangeWrapper);
        });
    }
}

function onStatsValueChangeWrapper(e) {
    const value = e.target.dataset.value;
    const isChecked = e.target.checked;
    
    if (value === '__all__') {
        if (isChecked) {
            statsSelectedValues = [];
            document.querySelectorAll('.stats-value-checkbox').forEach(cb => {
                if (cb.dataset.value !== '__all__') cb.checked = false;
            });
        }
    } else {
        if (isChecked) {
            if (!statsSelectedValues.includes(value)) statsSelectedValues.push(value);
            const allCheckbox = document.querySelector('.stats-value-checkbox[data-value="__all__"]');
            if (allCheckbox) allCheckbox.checked = false;
        } else {
            statsSelectedValues = statsSelectedValues.filter(v => v !== value);
            if (statsSelectedValues.length === 0) {
                const allCheckbox = document.querySelector('.stats-value-checkbox[data-value="__all__"]');
                if (allCheckbox) allCheckbox.checked = true;
            }
        }
    }
    renderStats();
}

function applyStatsAttributeFilter() {
    statsAttributeFilterActive = !!(statsSelectedType && statsSelectedValues.length > 0);
    renderStats();
}

function resetStatsAttributeFilter() {
    const typeSelect = document.getElementById('statsTypeSelect');
    if (typeSelect) typeSelect.value = "";
    statsSelectedType = "";
    statsSelectedValues = [];
    statsAttributeFilterActive = false;
    
    const valueContainer = document.getElementById('statsValueCheckboxesContainer');
    const buttonsContainer = document.getElementById('statsAttributeFilterButtons');
    if (valueContainer) valueContainer.style.display = 'none';
    if (buttonsContainer) buttonsContainer.style.display = 'none';
    
    renderStats();
}

function filterSalesByAttributes(sales) {
    if (!statsAttributeFilterActive || !statsSelectedType || statsSelectedValues.length === 0) return sales;
    
    const filtered = [];
    for (const sale of sales) {
        let hasMatchingItem = false;
        for (const item of sale.items) {
            const card = originalCardsData.find(c => c.id === item.id);
            if (!card) continue;
            if (card.type !== statsSelectedType) continue;
            const attr1 = card.attribute1 || "";
            const attr2 = card.attribute2 || "";
            if (statsSelectedValues.includes(attr1) || statsSelectedValues.includes(attr2)) {
                hasMatchingItem = true;
                break;
            }
        }
        if (hasMatchingItem) filtered.push(sale);
    }
    return filtered;
}

// ========== ФУНКЦИИ ФИЛЬТРА ПО ВРЕМЕНИ ==========

function toggleStatsFilter() {
    const block = document.getElementById('statsFilterBlock');
    if (block) {
        const isVisible = block.style.display !== 'none';
        block.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            setTimeout(() => {
                initCustomStatsDateTimeSelects();
            }, 10);
        }
    }
}

function resetStatsFilter() {
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - 30);
    
    setStatsDateTimeValues('statsDateFrom', fromDate);
    setStatsDateTimeValues('statsDateTo', now);
    
    statsFilterFromDate = null;
    statsFilterToDate = null;
    statsFilterActive = false;
    
    initCustomStatsDateTimeSelects();
    renderStats();
}

function setStatsDateTimeValues(prefix, date) {
    if (!date) return;
    const day = document.getElementById(`${prefix}Day`);
    const month = document.getElementById(`${prefix}Month`);
    const year = document.getElementById(`${prefix}Year`);
    const hour = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Hour`);
    const minute = document.getElementById(`statsTime${prefix === 'statsDateFrom' ? 'From' : 'To'}Minute`);
    
    if (day) day.value = date.getDate();
    if (month) month.value = date.getMonth() + 1;
    if (year) year.value = date.getFullYear();
    if (hour) hour.value = date.getHours();
    if (minute) minute.value = date.getMinutes();
}

function applyStatsFilter() {
    const fromDay = document.getElementById('statsDateFromDay')?.value;
    const fromMonth = document.getElementById('statsDateFromMonth')?.value;
    const fromYear = document.getElementById('statsDateFromYear')?.value;
    const fromHour = document.getElementById('statsTimeFromHour')?.value;
    const fromMinute = document.getElementById('statsTimeFromMinute')?.value;
    
    const toDay = document.getElementById('statsDateToDay')?.value;
    const toMonth = document.getElementById('statsDateToMonth')?.value;
    const toYear = document.getElementById('statsDateToYear')?.value;
    const toHour = document.getElementById('statsTimeToHour')?.value;
    const toMinute = document.getElementById('statsTimeToMinute')?.value;
    
    if (fromDay && fromMonth && fromYear && fromHour && fromMinute) {
        statsFilterFromDate = new Date(parseInt(fromYear), parseInt(fromMonth) - 1, parseInt(fromDay), parseInt(fromHour), parseInt(fromMinute));
    }
    if (toDay && toMonth && toYear && toHour && toMinute) {
        statsFilterToDate = new Date(parseInt(toYear), parseInt(toMonth) - 1, parseInt(toDay), parseInt(toHour), parseInt(toMinute));
    }
    statsFilterActive = true;
    renderStats();
}

function getFilteredSalesHistory() {
    let filteredSales = salesHistory.filter(entry => !entry.isReturn && !entry.hidden);
    
    if (statsFilterActive && statsFilterFromDate) {
        filteredSales = filteredSales.filter(entry => new Date(entry.date) >= statsFilterFromDate);
    }
    if (statsFilterActive && statsFilterToDate) {
        filteredSales = filteredSales.filter(entry => new Date(entry.date) <= statsFilterToDate);
    }
    
    filteredSales = filterSalesByAttributes(filteredSales);
    return filteredSales;
}

function getAttributeColor(attribute) {
    if (!window.attributeColorCache) window.attributeColorCache = new Map();
    const colorPalette = ['#e67e22', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#95a5a6'];
    if (!window.attributeColorCache.has(attribute)) {
        const index = window.attributeColorCache.size % colorPalette.length;
        window.attributeColorCache.set(attribute, colorPalette[index]);
    }
    return window.attributeColorCache.get(attribute);
}

// ========== СЕЛЕКТОРНАЯ ДЕТАЛИЗАЦИЯ ПО ХАРАКТЕРИСТИКАМ ==========

function initDetailAttributeSelectors() {
    const container = document.getElementById('detailAttributeSelectors');
    if (!container) return;
    
    // Получаем уникальные типы из originalCardsData
    const userTypes = new Set();
    for (const card of originalCardsData) {
        if (card.type && card.type.trim()) {
            userTypes.add(card.type);
        }
    }
    
    // Фильтруем только типы, у которых есть характеристики
    const typesWithAttributes = [];
    for (const type of userTypes) {
        const typeConfig = getTypeConfigFromCache(type);
        if (typeConfig && ((typeConfig.attribute1 && typeConfig.attribute1.values && typeConfig.attribute1.values.length > 0) ||
                          (typeConfig.attribute2 && typeConfig.attribute2.values && typeConfig.attribute2.values.length > 0))) {
            typesWithAttributes.push(type);
        }
    }
    
    // Сортируем по алфавиту
    typesWithAttributes.sort((a, b) => a.localeCompare(b, 'ru'));
    
    // Если нет типов с характеристиками - скрываем весь блок
    if (typesWithAttributes.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    let html = `
        <div class="detail-attribute-filters" style="background: var(--badge-bg); border-radius: 16px; padding: 12px; margin-bottom: 16px; width: 100%; clear: both; box-sizing: border-box;">
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--badge-text);">🔍 Детализация по характеристикам</div>
            <div class="filter-row" style="margin-bottom: 8px; display: flex; gap: 10px; flex-wrap: wrap;">
                <div id="detailTypeSelectContainer" style="flex: 1; min-width: 150px;"></div>
            </div>
            <div id="detailAttributesContainer" style="margin-top: 12px; display: none;"></div>
            <div id="detailValueCheckboxesContainer" style="margin-top: 12px; display: none;"></div>
            <div class="filter-row" style="margin-top: 12px; display: flex; gap: 10px; justify-content: flex-end;">
                <button id="applyDetailFilterBtn" class="edit-save-btn" style="padding: 6px 16px; display: none;" onclick="applyDetailAttributeFilter()">Показать</button>
                <button id="resetDetailFilterBtn" class="edit-cancel-btn" style="padding: 6px 16px; display: none;" onclick="resetDetailAttributeFilter()">Сбросить</button>
            </div>
        </div>
        <div id="detailAttributeStatsContainer" style="width: 100%; clear: both;"></div>
    `;
    
    container.innerHTML = html;
    
    const typeOptions = typesWithAttributes.map(t => ({ value: t, label: t }));
    createDetailCustomSelect('detailTypeSelectContainer', typeOptions, '', (value, label) => {
        detailSelectedType = value;
        detailSelectedAttributes = [];
        onDetailTypeChangeCustom(value);
    });
}

function createDetailCustomSelect(containerId, options, selectedValue, onSelect) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    container.style.display = 'inline-block';
    container.style.width = '100%';
    
    let displayText = (options.length > 0) ? '📦 Выберите тип' : '📦 Нет типов с характеристиками';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.width = '100%';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 32px 8px 16px; font-size: 13px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); display: block;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; z-index: 1000; display: none; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow);';
    
    if (options.length === 0) {
        const emptyDiv = document.createElement('div');
        emptyDiv.style.cssText = 'padding: 12px; text-align: center; color: var(--text-muted);';
        emptyDiv.textContent = 'Нет типов с характеристиками';
        dropdown.appendChild(emptyDiv);
    } else {
        options.forEach(opt => {
            const optionDiv = document.createElement('div');
            optionDiv.style.cssText = 'padding: 10px 16px; cursor: pointer; transition: background 0.1s; font-size: 13px; color: var(--text-primary); border-bottom: 1px solid var(--border-color);';
            optionDiv.textContent = opt.label;
            optionDiv.dataset.value = opt.value;
            
            optionDiv.addEventListener('click', () => {
                trigger.textContent = opt.label;
                dropdown.style.display = 'none';
                if (onSelect) onSelect(opt.value, opt.label);
            });
            
            optionDiv.addEventListener('mouseenter', () => {
                optionDiv.style.background = 'var(--badge-bg)';
            });
            optionDiv.addEventListener('mouseleave', () => {
                optionDiv.style.background = '';
            });
            
            dropdown.appendChild(optionDiv);
        });
    }
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.style.display === 'block';
        document.querySelectorAll('[class*="dropdown"]').forEach(d => {
            if (d !== dropdown) d.style.display = 'none';
        });
        dropdown.style.display = isOpen ? 'none' : 'block';
    });
    
    customSelect.appendChild(trigger);
    customSelect.appendChild(dropdown);
    container.appendChild(customSelect);
    
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

function onDetailTypeChangeCustom(selectedType) {
    detailSelectedType = selectedType;
    detailSelectedAttributes = [];
    
    const attrContainer = document.getElementById('detailAttributesContainer');
    const valueContainer = document.getElementById('detailValueCheckboxesContainer');
    const applyBtn = document.getElementById('applyDetailFilterBtn');
    const resetBtn = document.getElementById('resetDetailFilterBtn');
    const statsContainer = document.getElementById('detailAttributeStatsContainer');
    
    if (!selectedType) {
        if (attrContainer) attrContainer.style.display = 'none';
        if (valueContainer) valueContainer.style.display = 'none';
        if (applyBtn) applyBtn.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        if (statsContainer) statsContainer.innerHTML = '';
        return;
    }
    
    if (applyBtn) applyBtn.style.display = 'inline-block';
    if (resetBtn) resetBtn.style.display = 'inline-block';
    
    const typeConfig = getTypeConfigFromCache(selectedType);
    if (!typeConfig) {
        if (attrContainer) {
            attrContainer.style.display = 'block';
            attrContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 12px;">У выбранного типа нет характеристик</div>';
        }
        return;
    }
    
    const attributes = [];
    if (typeConfig.attribute1 && typeConfig.attribute1.values && typeConfig.attribute1.values.length > 0) {
        attributes.push({ name: typeConfig.attribute1.name, key: 'attr1', values: typeConfig.attribute1.values });
    }
    if (typeConfig.attribute2 && typeConfig.attribute2.values && typeConfig.attribute2.values.length > 0) {
        attributes.push({ name: typeConfig.attribute2.name, key: 'attr2', values: typeConfig.attribute2.values });
    }
    
    if (attributes.length === 0) {
        if (attrContainer) {
            attrContainer.style.display = 'block';
            attrContainer.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 12px;">У выбранного типа нет характеристик</div>';
        }
        return;
    }
    
    if (attrContainer) {
        attrContainer.style.display = 'block';
        
        let attrsHtml = `<div style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: var(--badge-text);">📋 Выберите характеристики для детализации:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 16px;">`;
        
        for (const attr of attributes) {
            attrsHtml += `<label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-size: 13px;">
                <input type="checkbox" class="detail-attr-checkbox" data-attr-name="${escapeHtml(attr.name)}" data-attr-key="${attr.key}" data-attr-values='${JSON.stringify(attr.values)}' style="accent-color: #f39c12; width: 16px; height: 16px;"> 
                ${escapeHtml(attr.name)}
            </label>`;
        }
        attrsHtml += `</div>`;
        attrContainer.innerHTML = attrsHtml;
        
        document.querySelectorAll('.detail-attr-checkbox').forEach(cb => {
            cb.removeEventListener('change', onDetailAttributeCheckboxChange);
            cb.addEventListener('change', onDetailAttributeCheckboxChange);
        });
    }
    
    if (valueContainer) {
        valueContainer.style.display = 'none';
        valueContainer.innerHTML = '';
    }
    if (statsContainer) statsContainer.innerHTML = '';
}

function onDetailAttributeCheckboxChange(e) {
    const checkbox = e.target;
    const attrName = checkbox.dataset.attrName;
    const attrKey = checkbox.dataset.attrKey;
    const attrValues = JSON.parse(checkbox.dataset.attrValues);
    
    if (checkbox.checked) {
        if (!detailSelectedAttributes.find(a => a.name === attrName)) {
            detailSelectedAttributes.push({
                name: attrName,
                key: attrKey,
                values: attrValues
            });
        }
    } else {
        detailSelectedAttributes = detailSelectedAttributes.filter(a => a.name !== attrName);
    }
    
    updateDetailValueCheckboxes();
}

function updateDetailValueCheckboxes() {
    const valueContainer = document.getElementById('detailValueCheckboxesContainer');
    if (!valueContainer) return;
    
    if (detailSelectedAttributes.length === 0) {
        valueContainer.style.display = 'none';
        valueContainer.innerHTML = '';
        return;
    }
    
    let valuesHtml = `<div style="font-size: 13px; font-weight: bold; margin-bottom: 10px; color: var(--badge-text);">🎯 Выберите значения для отображения:</div>`;
    
    for (const attr of detailSelectedAttributes) {
        valuesHtml += `<div style="margin-top: 12px; padding: 10px; background: var(--badge-bg); border-radius: 12px;">
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--btn-bg);">${escapeHtml(attr.name)}</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">`;
        
        valuesHtml += `<label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;">
            <input type="checkbox" class="detail-all-values-checkbox" data-attr-name="${escapeHtml(attr.name)}" checked style="accent-color: #f39c12; width: 14px; height: 14px;"> Все
        </label>`;
        
        for (const value of attr.values) {
            valuesHtml += `<label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 12px;">
                <input type="checkbox" class="detail-value-checkbox" data-attr-name="${escapeHtml(attr.name)}" data-value="${escapeHtml(value)}" checked style="accent-color: #f39c12; width: 14px; height: 14px;"> ${escapeHtml(value)}
            </label>`;
        }
        valuesHtml += `</div></div>`;
    }
    
    valueContainer.innerHTML = valuesHtml;
    valueContainer.style.display = 'block';
    
    document.querySelectorAll('.detail-all-values-checkbox').forEach(cb => {
        cb.onchange = (e) => {
            const attrName = e.target.dataset.attrName;
            const isChecked = e.target.checked;
            document.querySelectorAll(`.detail-value-checkbox[data-attr-name="${attrName}"]`).forEach(vcb => {
                vcb.checked = isChecked;
            });
        };
    });
}

function applyDetailAttributeFilter() {
    if (detailSelectedAttributes.length === 0) {
        showToast("Выберите хотя бы одну характеристику", false);
        return;
    }
    renderDetailAttributeStats();
}

function resetDetailAttributeFilter() {
    detailSelectedType = "";
    detailSelectedAttributes = [];
    
    const typeContainer = document.getElementById('detailTypeSelectContainer');
    if (typeContainer) {
        const trigger = typeContainer.querySelector('div[style*="cursor: pointer"]');
        if (trigger && trigger.childNodes[0]) {
            trigger.childNodes[0].textContent = '📦 Выберите тип';
        }
    }
    
    const attrContainer = document.getElementById('detailAttributesContainer');
    const valueContainer = document.getElementById('detailValueCheckboxesContainer');
    const applyBtn = document.getElementById('applyDetailFilterBtn');
    const resetBtn = document.getElementById('resetDetailFilterBtn');
    const statsContainer = document.getElementById('detailAttributeStatsContainer');
    
    if (attrContainer) {
        attrContainer.style.display = 'none';
        attrContainer.innerHTML = '';
    }
    if (valueContainer) {
        valueContainer.style.display = 'none';
        valueContainer.innerHTML = '';
    }
    if (applyBtn) applyBtn.style.display = 'none';
    if (resetBtn) resetBtn.style.display = 'none';
    if (statsContainer) statsContainer.innerHTML = '';
}

function renderDetailAttributeStats() {
    const container = document.getElementById('detailAttributeStatsContainer');
    if (!container) return;
    
    if (!detailSelectedType || detailSelectedAttributes.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Выберите тип и характеристики для детализации</div>';
        return;
    }
    
    const sales = getFilteredSalesHistory();
    const attributeStats = {};
    
    for (const sale of sales) {
        for (const item of sale.items) {
            const card = originalCardsData.find(c => c.id === item.id);
            if (!card) continue;
            if (card.type !== detailSelectedType) continue;
            
            for (const attr of detailSelectedAttributes) {
                let attributeValue = "";
                if (attr.key === 'attr1') {
                    attributeValue = card.attribute1 || "";
                } else if (attr.key === 'attr2') {
                    attributeValue = card.attribute2 || "";
                }
                
                if (!attributeValue) continue;
                
                const valueCheckbox = document.querySelector(`.detail-value-checkbox[data-attr-name="${attr.name}"][data-value="${attributeValue}"]`);
                if (valueCheckbox && !valueCheckbox.checked) continue;
                
                const key = `${attr.name}: ${attributeValue}`;
                if (!attributeStats[key]) {
                    attributeStats[key] = { 
                        attrName: attr.name, 
                        value: attributeValue, 
                        revenue: 0, 
                        qty: 0 
                    };
                }
                attributeStats[key].revenue += item.qty * item.price;
                attributeStats[key].qty += item.qty;
            }
        }
    }
    
    const sortedStats = Object.values(attributeStats).sort((a, b) => b.qty - a.qty);
    
    if (sortedStats.length === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">Нет данных для выбранных характеристик</div>';
        return;
    }
    
    const formatCurrency = (value) => value.toLocaleString('ru-RU') + ' ₽';
    
    let html = `
        <div class="detail-section" style="width: 100%; clear: both; box-sizing: border-box;">
            <div class="detail-title">📊 Детализация по характеристикам (тип: ${escapeHtml(detailSelectedType)})</div>
            <div class="table-wrapper">
                <table class="detail-table">
                    <thead>
                        <tr>
                            <th>Характеристика</th>
                            <th>Значение</th>
                            <th class="text-right">Продано, шт</th>
                            <th class="text-right">Выручка</th>
                            <th class="text-right">Средняя цена</th>
                        </table>
                    </thead>
                    <tbody>`;
    
    for (const stat of sortedStats) {
        const avgPrice = stat.qty > 0 ? stat.revenue / stat.qty : 0;
        const attrColor = getAttributeColor(stat.attrName);
        const valueColor = getAttributeColor(stat.value);
        html += `<tr>
            <td><span class="type-badge" style="background:${getTypeColor(stat.attrName)}20; color:${getTypeColor(stat.attrName)};">${escapeHtml(stat.attrName)}</span></td>
            <td><span class="type-badge" style="background:${valueColor}20; color:${valueColor};">${escapeHtml(stat.value)}</span></td>
            <td class="text-right">${stat.qty} шт</td>
            <td class="text-right">${formatCurrency(stat.revenue)}</td>
            <td class="text-right">${Math.ceil(avgPrice).toLocaleString()} ₽</td>
        </tr>`;
    }
    
    html += `</tbody>
            </table>
        </div>
    </div>`;
    
    container.innerHTML = html;
}

// ========== ОСНОВНАЯ ФУНКЦИЯ СТАТИСТИКИ ==========

function renderStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    
    const sales = getFilteredSalesHistory();
    
    let totalRevenue = 0, totalItemsSold = 0, orderCount = sales.length;
    let cashRevenue = 0, transferRevenue = 0, cashOrders = 0, transferOrders = 0;
    
    for (const sale of sales) { 
        let saleItems = 0;
        let saleTotal = 0;
        for (const item of sale.items) { 
            const itemTotal = item.qty * item.price;
            totalRevenue += itemTotal;
            saleItems += item.qty;
            saleTotal += itemTotal;
        } 
        totalItemsSold += saleItems;
        
        if (sale.paymentType === 'transfer') {
            transferRevenue += saleTotal;
            transferOrders++;
        } else {
            cashRevenue += saleTotal;
            cashOrders++;
        }
    }
    const averageCheck = orderCount > 0 ? Math.ceil(totalRevenue / orderCount) : 0;
    
    let totalCostAllGoods = 0;
    let totalStock = 0;
    
    const productFullCostMap = new Map();
    for (const card of originalCardsData) {
        const fullCost = (card.cost || 0) * (card.total || 0);
        totalCostAllGoods += fullCost;
        totalStock += (card.stock || 0);
        productFullCostMap.set(card.id, { 
            cost: card.cost || 0, 
            fullCost: fullCost,
            total: card.total || 0,
            stock: card.stock || 0,
            name: card.name,
            type: card.type,
            attribute1: card.attribute1 || "",
            attribute2: card.attribute2 || "",
            soldQty: 0,
            revenue: 0
        });
    }
    
    for (const sale of sales) {
        for (const item of sale.items) {
            const productData = productFullCostMap.get(item.id);
            if (productData) {
                productData.soldQty += item.qty;
                productData.revenue += item.qty * item.price;
            }
        }
    }
    
    const totalExtraCosts = extraCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0);
    const totalExtraIncomes = extraIncomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    const totalExpenses = totalCostAllGoods + totalExtraCosts - totalExtraIncomes;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue * 100) : 0;
    
    const productStats = [];
    for (const [id, data] of productFullCostMap) {
        const profit = data.revenue - data.fullCost;
        const margin = data.revenue > 0 ? (profit / data.revenue * 100) : 0;
        productStats.push({
            id: id,
            name: data.name,
            type: data.type,
            attribute1: data.attribute1,
            attribute2: data.attribute2,
            soldQty: data.soldQty,
            stock: data.stock,
            revenue: data.revenue,
            fullCost: data.fullCost,
            profit: profit,
            margin: margin
        });
    }
    productStats.sort((a, b) => b.margin - a.margin);
    
    const typeStats = {};
    for (const card of originalCardsData) {
        const type = card.type || "Другое";
        const fullCost = (card.cost || 0) * (card.total || 0);
        if (!typeStats[type]) {
            typeStats[type] = { fullCost: 0, revenue: 0, soldQty: 0, attributeStats: {} };
        }
        typeStats[type].fullCost += fullCost;
    }
    
    for (const sale of sales) {
        for (const item of sale.items) {
            const card = originalCardsData.find(c => c.id === item.id);
            const type = card?.type || "Другое";
            if (typeStats[type]) {
                typeStats[type].revenue += item.qty * item.price;
                typeStats[type].soldQty += item.qty;
                
                if (card.attribute1 && card.attribute1.trim()) {
                    if (!typeStats[type].attributeStats[card.attribute1]) {
                        typeStats[type].attributeStats[card.attribute1] = { revenue: 0, qty: 0 };
                    }
                    typeStats[type].attributeStats[card.attribute1].revenue += item.qty * item.price;
                    typeStats[type].attributeStats[card.attribute1].qty += item.qty;
                }
                if (card.attribute2 && card.attribute2.trim()) {
                    if (!typeStats[type].attributeStats[card.attribute2]) {
                        typeStats[type].attributeStats[card.attribute2] = { revenue: 0, qty: 0 };
                    }
                    typeStats[type].attributeStats[card.attribute2].revenue += item.qty * item.price;
                    typeStats[type].attributeStats[card.attribute2].qty += item.qty;
                }
            }
        }
    }
    
    const typeDetails = Object.entries(typeStats).map(([type, data]) => {
        const profit = data.revenue - data.fullCost;
        const margin = data.revenue > 0 ? (profit / data.revenue * 100) : 0;
        return {
            type: type,
            soldQty: data.soldQty,
            revenue: data.revenue,
            fullCost: data.fullCost,
            profit: profit,
            margin: margin,
            attributeStats: data.attributeStats
        };
    }).sort((a, b) => b.margin - a.margin);
    
    const sortedTypeDetails = [...typeDetails].sort((a, b) => b.soldQty - a.soldQty);
    const topByQty = [...productStats].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    const topTypesByQty = [...typeDetails].sort((a, b) => b.soldQty - a.soldQty).slice(0, 5);
    
    const formatCurrency = (value) => value.toLocaleString('ru-RU') + ' ₽';
    const formatNumber = (value) => value.toLocaleString('ru-RU');
    const formatPercent = (value) => value.toFixed(1) + '%';
    
    let filterInfo = '';
    if (statsFilterActive && (statsFilterFromDate || statsFilterToDate)) {
        const fromStr = statsFilterFromDate ? statsFilterFromDate.toLocaleDateString('ru-RU') : 'все время';
        const toStr = statsFilterToDate ? statsFilterToDate.toLocaleDateString('ru-RU') : 'настоящее';
        filterInfo = `<div style="text-align: center; font-size: 11px; color: var(--text-muted); margin-bottom: 12px;">📅 Период: ${fromStr} — ${toStr}</div>`;
    }
    
    let attributeFilterInfo = '';
    if (statsAttributeFilterActive && statsSelectedType && statsSelectedValues.length > 0) {
        let valuesText = statsSelectedValues.join(', ');
        attributeFilterInfo = `<div style="text-align: center; font-size: 11px; color: var(--btn-bg); margin-bottom: 12px;">🔍 Фильтр: ${statsSelectedType} → характеристики (${valuesText})</div>`;
    }
    
    let html = filterInfo + attributeFilterInfo;
    
    // Статистические карточки
    html += `<div class="stats-grid">
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalRevenue)}</div><div class="stats-card-label">💰 Выручка</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalCostAllGoods)}</div><div class="stats-card-label">📦 Себестоимость всего товара</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraCosts)}</div><div class="stats-card-label">➕ Дополнительные расходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExtraIncomes)}</div><div class="stats-card-label">💵 Дополнительные доходы</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(totalExpenses)}</div><div class="stats-card-label">📉 Общие затраты</div></div>
        <div class="stats-card desktop-only"><div class="stats-card-value ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(netProfit)}</div><div class="stats-card-label">📈 Чистая прибыль</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(totalItemsSold)}</div><div class="stats-card-label">📊 Продано товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(totalStock)}</div><div class="stats-card-label">📦 Осталось товаров</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatNumber(orderCount)}</div><div class="stats-card-label">🛒 Количество заказов</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(averageCheck)}</div><div class="stats-card-label">💳 Средний чек</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(cashRevenue)}</div><div class="stats-card-label">💰 Наличные</div></div>
        <div class="stats-card"><div class="stats-card-value">${formatCurrency(transferRevenue)}</div><div class="stats-card-label">💳 Перевод</div></div>
        <div class="stats-card"><div class="stats-card-value">${cashOrders}</div><div class="stats-card-label">📊 Заказов (нал)</div></div>
        <div class="stats-card"><div class="stats-card-value">${transferOrders}</div><div class="stats-card-label">📊 Заказов (пер)</div></div>
    </div>`;
    
    html += `<div class="profit-mobile-row">
        <div class="profit-mobile-card">
            <div class="profit-mobile-value ${netProfit >= 0 ? 'profit-positive' : 'profit-negative'}">${formatCurrency(netProfit)}</div>
            <div class="profit-mobile-label">📈 Чистая прибыль</div>
        </div>
        <div class="profit-mobile-card">
            <div class="profit-mobile-value">${formatPercent(profitMargin)}</div>
            <div class="profit-mobile-label">📊 Рентабельность</div>
        </div>
    </div>`;
    
    html += `<div class="profit-card-single">
        <div class="profit-card-value ${profitMargin >= 0 ? 'profit-positive' : 'profit-negative'}">${formatPercent(profitMargin)}</div>
        <div class="profit-card-label">📊 Рентабельность</div>
    </div>`;
    
    // Детализация по товарам
    html += `<div class="detail-section">
        <div class="detail-title">📦 Детализация по товарам</div>
        <div class="table-wrapper">
            <table class="detail-table">
                <thead>
                    <tr>
                        <th>Товар</th>
                        <th>Тип</th>
                        <th>Характеристики</th>
                        <th class="text-right">Продано</th>
                        <th class="text-right">Остаток</th>
                        <th class="text-right">Выручка</th>
                        <th class="text-right">Себест.</th>
                        <th class="text-right">Прибыль</th>
                        <th class="text-right">Рентаб.</th>
                    </tr>
                </thead>
                <tbody>`;
    for (const p of productStats) {
        const profitClass = p.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = p.margin >= 0 ? 'profit-positive' : 'profit-negative';
        
        let attributesHtml = "";
        if (p.attribute1 && p.attribute2) {
            const color1 = getAttributeColor(p.attribute1);
            const color2 = getAttributeColor(p.attribute2);
            attributesHtml = `<span class="type-badge" style="background:${color1}20; color:${color1};">${escapeHtml(p.attribute1)}</span> <span class="type-badge" style="background:${color2}20; color:${color2};">${escapeHtml(p.attribute2)}</span>`;
        } else if (p.attribute1) {
            const color1 = getAttributeColor(p.attribute1);
            attributesHtml = `<span class="type-badge" style="background:${color1}20; color:${color1};">${escapeHtml(p.attribute1)}</span>`;
        } else if (p.attribute2) {
            const color2 = getAttributeColor(p.attribute2);
            attributesHtml = `<span class="type-badge" style="background:${color2}20; color:${color2};">${escapeHtml(p.attribute2)}</span>`;
        } else {
            attributesHtml = "—";
        }
        
        html += `<tr>
            <td>${escapeHtml(p.name)}</td>
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
            <td>${attributesHtml}</td>
            <td class="text-right">${p.soldQty} шт</td>
            <td class="text-right">${p.stock} шт</td>
            <td class="text-right">${formatCurrency(p.revenue)}</td>
            <td class="text-right">${formatCurrency(p.fullCost)}</td>
            <td class="text-right ${profitClass}">${formatCurrency(p.profit)}</td>
            <td class="text-right ${marginClass}">${formatPercent(p.margin)}</td>
        </tr>`;
    }
    html += `</tbody>
            </table>
        </div>
    </div>`;
    
    // Детализация по типам мерча
    html += `<div class="detail-section">
        <div class="detail-title">🏷️ Детализация по типам мерча</div>
        <div class="table-wrapper">
            <table class="detail-table">
                <thead>
                    <tr>
                        <th>Тип</th>
                        <th class="text-right">Продано</th>
                        <th class="text-right">Выручка</th>
                        <th class="text-right">Себест.</th>
                        <th class="text-right">Прибыль</th>
                        <th class="text-right">Рентаб.</th>
                    </tr>
                </thead>
                <tbody>`;
    for (const t of sortedTypeDetails) {
        const profitClass = t.profit >= 0 ? 'profit-positive' : 'profit-negative';
        const marginClass = t.margin >= 0 ? 'profit-positive' : 'profit-negative';
        html += `<tr>
            <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
            <td class="text-right">${t.soldQty} шт</td>
            <td class="text-right">${formatCurrency(t.revenue)}</td>
            <td class="text-right">${formatCurrency(t.fullCost)}</td>
            <td class="text-right ${profitClass}">${formatCurrency(t.profit)}</td>
            <td class="text-right ${marginClass}">${formatPercent(t.margin)}</td>
        </tr>`;
    }
    html += `</tbody>
            <table>
        </div>
    </div>`;
    
    // САМЫЕ ПРОДАВАЕМЫЕ ТОВАРЫ И ТИПЫ
    html += `<div class="two-columns" style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: space-between;">
        <div class="detail-section" style="flex: 1; min-width: 250px;">
            <div class="detail-title">🏆 Самые продаваемые товары</div>
            <div class="table-wrapper">
                <table class="detail-table-small">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Товар</th>
                            <th>Тип</th>
                            <th class="text-right">Продано, шт</th>
                        </tr>
                    </thead>
                    <tbody>`;
    for (let i = 0; i < topByQty.length; i++) { 
        const p = topByQty[i]; 
        html += `<td>
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
            <td>${escapeHtml(p.name)}</td>
            <td><span class="type-badge" style="background:${getTypeColor(p.type)}20; color:${getTypeColor(p.type)};">${escapeHtml(p.type)}</span></td>
            <td class="text-right">${p.soldQty} шт</td>
        </tr>`;
    }
    html += `</tbody>
                </table>
            </div>
        </div>
        <div class="detail-section" style="flex: 1; min-width: 250px;">
            <div class="detail-title">🏆 Самые продаваемые типы</div>
            <div class="table-wrapper">
                <table class="detail-table-small">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Тип</th>
                            <th class="text-right">Продано, шт</th>
                        </tr>
                    </thead>
                    <tbody>`;
    for (let i = 0; i < topTypesByQty.length; i++) { 
        const t = topTypesByQty[i]; 
        html += `<tr>
            <td class="text-right"><span class="popular-badge">${i + 1}</span></td>
            <td><span class="type-badge" style="background:${getTypeColor(t.type)}20; color:${getTypeColor(t.type)};">${escapeHtml(t.type)}</span></td>
            <td class="text-right">${t.soldQty} шт</td>
        </tr>`;
    }
    html += `</tbody>
                </table>
            </div>
        </div>
    </div>`;
    html += `<div style="clear: both; width: 100%;"></div>`;
    
    // Проверяем, есть ли у пользователя товары с характеристиками 
    let hasAttributes = false;
    for (const card of originalCardsData) {
        const typeConfig = getTypeConfigFromCache(card.type);
        if (typeConfig && ((typeConfig.attribute1 && typeConfig.attribute1.values && typeConfig.attribute1.values.length > 0) ||
                          (typeConfig.attribute2 && typeConfig.attribute2.values && typeConfig.attribute2.values.length > 0))) {
            hasAttributes = true;
            break;
        }
    }
    
    // СЕЛЕКТОРНАЯ ДЕТАЛИЗАЦИЯ ПО ХАРАКТЕРИСТИКАМ (показываем только если есть товары с характеристиками)
    if (hasAttributes) {
        html += `<div id="detailAttributeSelectors" style="width: 100%; clear: both;"></div>`;
        html += `<div id="detailAttributeStatsContainer" style="width: 100%; clear: both;"></div>`;
    }
    
    // Расходы и доходы
    html += `<div class="extra-costs-section" style="width: 100%; clear: both; box-sizing: border-box;">
        <div class="detail-title">➕ Дополнительные расходы</div>
        <div id="extra-costs-list">`;
    if (extraCosts.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных расходов</div>';
    for (let i = 0; i < extraCosts.length; i++) { 
        const cost = extraCosts[i]; 
        html += `<div class="extra-cost-item">
            <span class="extra-cost-name">${escapeHtml(cost.name)}</span>
            <span class="extra-cost-amount">${cost.amount} ₽</span>
            <button class="extra-cost-delete" onclick="deleteExtraCost(${i})">🗑</button>
        </div>`; 
    }
    html += `</div>
        <div class="add-cost-form">
            <input type="text" id="newCostName" class="add-cost-input" placeholder="Название (стол, доставка...)" autocomplete="off">
            <input type="number" id="newCostAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100">
            <button class="add-cost-btn" onclick="addExtraCostFromModal()">➕ Добавить</button>
        </div>
    </div>
    <div class="extra-income-section" style="width: 100%; clear: both; box-sizing: border-box; margin-top: 24px;">
        <div class="detail-title">💵 Дополнительные доходы</div>
        <div id="extra-incomes-list">`;
    if (extraIncomes.length === 0) html += '<div style="color: var(--text-muted); text-align: center; padding: 12px;">Нет дополнительных доходов</div>';
    for (let i = 0; i < extraIncomes.length; i++) { 
        const income = extraIncomes[i]; 
        html += `<div class="extra-cost-item">
            <span class="extra-cost-name">${escapeHtml(income.name)}</span>
            <span class="extra-cost-amount">${income.amount} ₽</span>
            <button class="extra-cost-delete" onclick="deleteExtraIncome(${i})">🗑</button>
        </div>`; 
    }
    html += `</div>
        <div class="add-cost-form">
            <input type="text" id="newIncomeName" class="add-cost-input" placeholder="Название (спонсоры, донаты...)" autocomplete="off">
            <input type="number" id="newIncomeAmount" class="add-cost-input-number" placeholder="Сумма" value="0" step="100">
            <button class="add-cost-btn" onclick="addExtraIncomeFromModal()">➕ Добавить</button>
        </div>
    </div>`;
    
    container.innerHTML = html;
    
    // Инициализируем селекторы только если есть товары с характеристиками
    if (hasAttributes) {
        initDetailAttributeSelectors();
    }
}

function addExtraCostFromModal() {
    const nameInput = document.getElementById('newCostName');
    const amountInput = document.getElementById('newCostAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) { 
        if (typeof showToast === 'function') showToast("Введите название и сумму расхода", false); 
        return; 
    }
    addExtraCost(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    renderStats();
}

function addExtraIncomeFromModal() {
    const nameInput = document.getElementById('newIncomeName');
    const amountInput = document.getElementById('newIncomeAmount');
    const name = nameInput?.value.trim();
    const amount = parseFloat(amountInput?.value);
    if (!name || isNaN(amount) || amount <= 0) { 
        if (typeof showToast === 'function') showToast("Введите название и сумму дохода", false); 
        return; 
    }
    addExtraIncome(name, amount);
    if (nameInput) nameInput.value = '';
    if (amountInput) amountInput.value = '0';
    renderStats();
}

document.addEventListener('DOMContentLoaded', function() {
    initStatsTypeSelector();
});

window.initCustomStatsDateTimeSelects = initCustomStatsDateTimeSelects;
window.onStatsTypeChange = onStatsTypeChange;
window.applyStatsAttributeFilter = applyStatsAttributeFilter;
window.resetStatsAttributeFilter = resetStatsAttributeFilter;
window.onDetailTypeChangeCustom = onDetailTypeChangeCustom;
window.applyDetailAttributeFilter = applyDetailAttributeFilter;
window.resetDetailAttributeFilter = resetDetailAttributeFilter;
