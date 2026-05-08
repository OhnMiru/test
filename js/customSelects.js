// ========== КАСТОМНЫЕ СЕЛЕКТОРЫ ==========

function createCustomSelect(containerId, options, selectedValue, onSelect) {
    let container = document.getElementById(containerId);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.style.display = 'inline-block';
        const parent = document.getElementById(containerId.replace(/_[^_]+$/, ''));
        if (parent) {
            parent.appendChild(container);
        } else {
            return null;
        }
    }
    
    container.innerHTML = '';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : options[0]?.label || 'Выберите';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.margin = '0 2px';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--badge-bg); border: 1px solid var(--border-color); border-radius: 20px; padding: 6px 22px 6px 14px; font-size: 12px; cursor: pointer; white-space: nowrap; color: var(--text-primary); display: inline-block; font-family: monospace; min-width: 50px; text-align: center;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 9px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; z-index: 1000; display: none; max-height: 200px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow); min-width: 110px;';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = 'padding: 8px 12px; cursor: pointer; transition: background 0.1s; font-size: 12px; color: var(--text-primary); white-space: nowrap;';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', () => {
            trigger.childNodes[0].textContent = opt.label;
            dropdown.style.display = 'none';
            if (onSelect) onSelect(opt.value, opt.label);
            if (typeof renderHistoryList === 'function') {
                setTimeout(() => renderHistoryList(), 10);
            }
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
        document.querySelectorAll('.custom-select-flat-dropdown, div[style*="position: absolute"]').forEach(d => {
            if (d !== dropdown && d.parentElement !== customSelect) d.style.display = 'none';
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
    
    return { trigger, dropdown, customSelect };
}

// Для блока "от" (dateFrom...)
function createCustomDateGroupFrom(containerId, dayValue, monthValue, yearValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        const hiddenSelect = document.getElementById('dateFromDay');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        const hiddenSelect = document.getElementById('dateFromMonth');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    createCustomSelect(containerId + '_year', yearsOptions, yearValue, (value) => {
        const hiddenSelect = document.getElementById('dateFromYear');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Для блока "до" (dateTo...)
function createCustomDateGroupTo(containerId, dayValue, monthValue, yearValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const daysOptions = [];
    for (let i = 1; i <= 31; i++) {
        daysOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_day', daysOptions, dayValue, (value) => {
        const hiddenSelect = document.getElementById('dateToDay');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
    const monthsOptions = [];
    for (let i = 0; i < 12; i++) {
        monthsOptions.push({ value: i + 1, label: monthNames[i] });
    }
    createCustomSelect(containerId + '_month', monthsOptions, monthValue, (value) => {
        const hiddenSelect = document.getElementById('dateToMonth');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const currentYear = new Date().getFullYear();
    const yearsOptions = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
        yearsOptions.push({ value: i, label: i.toString() });
    }
    createCustomSelect(containerId + '_year', yearsOptions, yearValue, (value) => {
        const hiddenSelect = document.getElementById('dateToYear');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Для времени "от" (timeFrom...)
function createCustomTimeGroupFrom(containerId, hourValue, minuteValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        const hiddenSelect = document.getElementById('timeFromHour');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        const hiddenSelect = document.getElementById('timeFromMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Для времени "до" (timeTo...)
function createCustomTimeGroupTo(containerId, hourValue, minuteValue) {
    let container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';
    container.style.display = 'inline-flex';
    container.style.alignItems = 'center';
    container.style.gap = '6px';
    container.style.backgroundColor = 'transparent';
    container.style.padding = '0';
    container.style.border = 'none';
    
    const hoursOptions = [];
    for (let i = 0; i <= 23; i++) {
        hoursOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_hour', hoursOptions, hourValue, (value) => {
        const hiddenSelect = document.getElementById('timeToHour');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
    
    const minutesOptions = [];
    for (let i = 0; i <= 59; i++) {
        minutesOptions.push({ value: i, label: i.toString().padStart(2, '0') });
    }
    createCustomSelect(containerId + '_minute', minutesOptions, minuteValue, (value) => {
        const hiddenSelect = document.getElementById('timeToMinute');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof renderHistoryList === 'function') renderHistoryList();
    });
}

// Инициализация
function initCustomDateTimeSelects() {
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    createCustomDateGroupFrom('dateFromDateGroup', currentDay, currentMonth, currentYear);
    createCustomTimeGroupFrom('dateFromTimeGroup', 0, 0);
    createCustomDateGroupTo('dateToDateGroup', currentDay, currentMonth, currentYear);
    createCustomTimeGroupTo('dateToTimeGroup', 23, 59);
}

// Для статистики и глобальной статистики (заглушки)
function initCustomStatsDateTimeSelects() {
    // Можно добавить позже по аналогии
}

function initCustomGlobalStatsDateTimeSelects() {
    // Можно добавить позже по аналогии
}

// ========== ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ КАСТОМНЫХ СЕЛЕКТОРОВ ==========

// Обновить значение в кастомном селекторе по ID контейнера
function updateCustomSelectValue(containerId, value) {
    const container = document.getElementById(containerId);
    if (!container) return false;
    
    const trigger = container.querySelector('div[style*="cursor: pointer"]');
    if (!trigger) return false;
    
    const dropdown = container.querySelector('div[style*="position: absolute"][style*="display: none"]');
    if (!dropdown) return false;
    
    const options = dropdown.querySelectorAll('div[style*="cursor: pointer"]');
    for (const opt of options) {
        if (opt.dataset.value == value) {
            trigger.childNodes[0].textContent = opt.textContent;
            return true;
        }
    }
    
    return false;
}

// Обновить всю группу даты "с"
function updateCustomDateFromValues(dayValue, monthValue, yearValue) {
    updateCustomSelectValue('dateFromDateGroup_day', dayValue);
    updateCustomSelectValue('dateFromDateGroup_month', monthValue);
    updateCustomSelectValue('dateFromDateGroup_year', yearValue);
}

// Обновить всю группу даты "по"
function updateCustomDateToValues(dayValue, monthValue, yearValue) {
    updateCustomSelectValue('dateToDateGroup_day', dayValue);
    updateCustomSelectValue('dateToDateGroup_month', monthValue);
    updateCustomSelectValue('dateToDateGroup_year', yearValue);
}

// ========== СЕЛЕКТОРЫ ДЛЯ ТИПОВ ТОВАРОВ ==========

// Создать кастомный селектор из массива опций (для типов товаров)
function createCustomSelectForOptions(containerId, options, selectedValue, onSelect) {
    let container = document.getElementById(containerId);
    if (!container) return null;
    
    container.innerHTML = '';
    container.style.display = 'inline-block';
    container.style.width = '100%';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : options[0]?.label || 'Выберите тип';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.width = '100%';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 10px 32px 10px 16px; font-size: 14px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); display: block;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; z-index: 1000; display: none; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow);';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = 'padding: 10px 16px; cursor: pointer; transition: background 0.1s; font-size: 13px; color: var(--text-primary);';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', () => {
            trigger.childNodes[0].textContent = opt.label;
            dropdown.style.display = 'none';
            if (onSelect) onSelect(opt.value, opt.label);
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
    
    return { trigger, dropdown, customSelect };
}

// Инициализация селектора типа в редактировании
async function initEditTypeSelector(selectedType) {
    const container = document.getElementById('editTypeContainer');
    if (!container) return;
    
    if (!window.merchTypesLoaded) {
        await loadMerchTypesConfig();
    }
    
    const types = getAllMerchTypes();
    const options = types.map(type => ({ value: type, label: type }));
    
    const handleSelect = (value, label) => {
        const hiddenSelect = document.getElementById('editType');
        if (hiddenSelect) hiddenSelect.value = value;
        if (typeof onEditTypeChange === 'function') {
            onEditTypeChange();
        }
    };
    
    createCustomSelectForOptions('editTypeContainer', options, selectedType, handleSelect);
}

// Инициализация селектора типа в добавлении
async function initAddTypeSelector() {
    const container = document.getElementById('addItemTypeContainer');
    if (!container) return;
    
    if (!window.merchTypesLoaded) {
        await loadMerchTypesConfig();
    }
    
    const types = getAllMerchTypes();
    const options = types.map(type => ({ value: type, label: type }));
    
    const handleSelect = (value, label) => {
        const hiddenSelect = document.getElementById('addItemType');
        if (hiddenSelect) hiddenSelect.value = value;
        
        const newTypeInput = document.getElementById('addItemNewType');
        if (newTypeInput) newTypeInput.style.display = 'none';
        
        if (typeof onAddTypeChange === 'function') {
            onAddTypeChange();
        }
        
        setTimeout(() => {
            if (typeof onTypeSelectChange === 'function') {
                onTypeSelectChange();
            }
        }, 10);
    };
    
    createCustomSelectForOptions('addItemTypeContainer', options, '', handleSelect);
}

// Обновить значение селектора типа в редактировании
function updateEditTypeSelector(value) {
    const container = document.getElementById('editTypeContainer');
    if (!container) return;
    
    const trigger = container.querySelector('div[style*="cursor: pointer"]');
    if (trigger && trigger.childNodes[0]) {
        trigger.childNodes[0].textContent = value;
    }
    
    const hiddenSelect = document.getElementById('editType');
    if (hiddenSelect) hiddenSelect.value = value;
}

// ========== СЕЛЕКТОРЫ ДЛЯ АТРИБУТОВ ==========

// Создать кастомный селектор для атрибутов
function createCustomAttributeSelect(containerId, options, selectedValue, onSelect) {
    let container = document.getElementById(containerId);
    if (!container) return null;
    
    container.innerHTML = '';
    container.style.display = 'inline-block';
    container.style.width = '100%';
    
    const selectedOption = options.find(opt => opt.value == selectedValue);
    let displayText = selectedOption ? selectedOption.label : 'Не выбран';
    
    const customSelect = document.createElement('div');
    customSelect.style.position = 'relative';
    customSelect.style.display = 'inline-block';
    customSelect.style.width = '100%';
    
    const trigger = document.createElement('div');
    trigger.style.cssText = 'background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 28px 8px 16px; font-size: 13px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: var(--text-primary); display: block;';
    trigger.textContent = displayText;
    
    const arrow = document.createElement('span');
    arrow.style.cssText = 'position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 10px; color: var(--text-secondary);';
    arrow.textContent = '▼';
    trigger.appendChild(arrow);
    
    const dropdown = document.createElement('div');
    dropdown.style.cssText = 'position: absolute; top: 100%; left: 0; right: 0; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 16px; z-index: 1000; display: none; max-height: 250px; overflow-y: auto; margin-top: 4px; box-shadow: 0 4px 12px var(--shadow);';
    
    options.forEach(opt => {
        const optionDiv = document.createElement('div');
        optionDiv.style.cssText = 'padding: 10px 16px; cursor: pointer; transition: background 0.1s; font-size: 13px; color: var(--text-primary);';
        optionDiv.textContent = opt.label;
        optionDiv.dataset.value = opt.value;
        
        if (opt.value == selectedValue) {
            optionDiv.style.background = 'var(--badge-bg)';
            optionDiv.style.fontWeight = 'bold';
        }
        
        optionDiv.addEventListener('click', () => {
            trigger.childNodes[0].textContent = opt.label;
            dropdown.style.display = 'none';
            if (onSelect) onSelect(opt.value, opt.label);
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
    
    return { trigger, dropdown, customSelect };
}

// Инициализация кастомных селекторов для атрибутов (редактирование)
function initEditAttributeSelects(attr1Value, attr2Value, attr1Options, attr2Options) {
    if (attr1Options && attr1Options.length > 0) {
        const container1 = document.getElementById('edit_attr1_container');
        if (container1) {
            container1.innerHTML = '';
            const options = attr1Options.map(val => ({ value: val, label: val }));
            createCustomAttributeSelect('edit_attr1_container', options, attr1Value, (value) => {
                const hiddenSelect = document.getElementById('edit_attr1');
                if (hiddenSelect) hiddenSelect.value = value;
            });
        }
    } else {
        const container1 = document.getElementById('edit_attr1_container');
        if (container1) container1.innerHTML = '';
    }
    
    if (attr2Options && attr2Options.length > 0) {
        const container2 = document.getElementById('edit_attr2_container');
        if (container2) {
            container2.innerHTML = '';
            const options = attr2Options.map(val => ({ value: val, label: val }));
            createCustomAttributeSelect('edit_attr2_container', options, attr2Value, (value) => {
                const hiddenSelect = document.getElementById('edit_attr2');
                if (hiddenSelect) hiddenSelect.value = value;
            });
        }
    } else {
        const container2 = document.getElementById('edit_attr2_container');
        if (container2) container2.innerHTML = '';
    }
}

// Инициализация кастомных селекторов для атрибутов (добавление)
function initAddAttributeSelects(attr1Options, attr2Options) {
    if (attr1Options && attr1Options.length > 0) {
        const container1 = document.getElementById('add_attr1_container');
        if (container1) {
            container1.innerHTML = '';
            const options = attr1Options.map(val => ({ value: val, label: val }));
            createCustomAttributeSelect('add_attr1_container', options, '', (value) => {
                const hiddenSelect = document.getElementById('add_attr1');
                if (hiddenSelect) hiddenSelect.value = value;
            });
        }
    } else {
        const container1 = document.getElementById('add_attr1_container');
        if (container1) container1.innerHTML = '';
    }
    
    if (attr2Options && attr2Options.length > 0) {
        const container2 = document.getElementById('add_attr2_container');
        if (container2) {
            container2.innerHTML = '';
            const options = attr2Options.map(val => ({ value: val, label: val }));
            createCustomAttributeSelect('add_attr2_container', options, '', (value) => {
                const hiddenSelect = document.getElementById('add_attr2');
                if (hiddenSelect) hiddenSelect.value = value;
            });
        }
    } else {
        const container2 = document.getElementById('add_attr2_container');
        if (container2) container2.innerHTML = '';
    }
}

// Экспортируем функции в глобальную область
window.updateCustomSelectValue = updateCustomSelectValue;
window.updateCustomDateFromValues = updateCustomDateFromValues;
window.updateCustomDateToValues = updateCustomDateToValues;
