// ========== ПРАВИЛА ==========
let rulesList = [];
let currentRuleType = "type";
let selectedProducts = new Set();
let scrollPosition = 0;

async function syncFullRulesToServer() {
    if (!isOnline) {
        addPendingOperation("syncFullRules", rulesList);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(rulesList));
        const response = await fetch(buildApiUrl("syncFullRules", `&data=${data}`));
        const result = await response.json();
        if (!result.success) {
            addPendingOperation("syncFullRules", rulesList);
        }
    } catch(e) { 
        console.error(e); 
        addPendingOperation("syncFullRules", rulesList);
    }
}

async function loadRulesFromServer() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_rules_structured');
        if (saved) {
            try {
                rulesList = JSON.parse(saved);
                rulesList = rulesList.filter(rule => rule && rule.type);
            } catch(e) {
                rulesList = [];
            }
        } else {
            rulesList = [];
        }
        renderRulesList();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getRules"));
        const data = await response.json();
        if (data && data.rules) {
            rulesList = data.rules;
            rulesList = rulesList.filter(rule => rule && rule.type);
            localStorage.setItem('merch_rules_structured', JSON.stringify(rulesList));
            renderRulesList();
            return true;
        }
        return false;
    } catch(e) { 
        console.error(e);
        return false;
    }
}

async function loadRules() {
    const loaded = await loadRulesFromServer();
    if (!loaded) {
        const saved = localStorage.getItem('merch_rules_structured');
        if (saved) {
            try {
                rulesList = JSON.parse(saved);
                rulesList = rulesList.filter(rule => rule && rule.type);
            } catch(e) {
                rulesList = [];
            }
        } else {
            rulesList = [];
        }
        renderRulesList();
    }
}

function saveRules() {
    localStorage.setItem('merch_rules_structured', JSON.stringify(rulesList));
    syncFullRulesToServer();
}

function deleteRule(index) {
    if (rulesList[index]) {
        rulesList.splice(index, 1);
        saveRules();
        renderRulesList();
        updateCartUI();
        showToast("Правило удалено", true);
    }
}

function deleteAllRules() {
    if (rulesList.length === 0) {
        showToast("Нет правил для удаления", false);
        return;
    }
    if (confirm("Удалить все правила?")) {
        rulesList = [];
        saveRules();
        renderRulesList();
        updateCartUI();
        showToast("Все правила удалены ✅", true);
    }
}

function toggleRuleActive(index) {
    if (rulesList[index]) {
        rulesList[index].active = rulesList[index].active === false ? true : false;
        saveRules();
        renderRulesList();
        updateCartUI();
        showToast(`Правило ${rulesList[index].active ? 'активировано' : 'деактивировано'}`, true);
    }
}

function selectRuleType(type) {
    currentRuleType = type;
    selectedProducts.clear();
    document.querySelectorAll('.rule-type-btn').forEach(btn => {
        if (btn.dataset.type === type) btn.classList.add('active');
        else btn.classList.remove('active');
    });
    renderRuleForm();
}

function openRuleSelect(selectId) {
    const dropdown = document.getElementById(selectId + '-dropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function selectRuleOption(selectId, value, displayText) {
    const trigger = document.getElementById(selectId + '-trigger');
    const hiddenInput = document.getElementById(selectId);
    if (trigger) trigger.textContent = displayText;
    if (hiddenInput) hiddenInput.value = value;
    const dropdown = document.getElementById(selectId + '-dropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function closeAllRuleSelects() {
    document.querySelectorAll('.rule-custom-select-dropdown').forEach(dropdown => dropdown.classList.remove('show'));
}

function toggleProductSelection(productId) {
    if (selectedProducts.has(productId)) selectedProducts.delete(productId);
    else selectedProducts.add(productId);
    updateSelectedProductsDisplay();
    renderProductMultiSelect(true);
}

function updateSelectedProductsDisplay() {
    const container = document.getElementById('selectedProductsDisplay');
    if (!container) return;
    const count = selectedProducts.size;
    if (count === 0) container.innerHTML = '<div class="selected-count">📦 Выбрано товаров: 0</div>';
    else {
        const productNames = Array.from(selectedProducts).map(id => {
            const card = originalCardsData.find(c => c.id === id);
            if (!card) return id;
            return getProductDisplayName(card);
        }).join(', ');
        container.innerHTML = `<div class="selected-count">📦 Выбрано товаров: ${count}<br>${productNames}</div>`;
    }
}

// НОВАЯ ФУНКЦИЯ: получает отображаемое имя товара с атрибутами
function getProductDisplayName(card) {
    const type = card.type || "";
    const name = card.name || "";
    const attr1 = card.attribute1 || "";
    const attr2 = card.attribute2 || "";
    
    let baseName = `${type} ${name}`;
    
    if (attr1 || attr2) {
        const parts = [];
        if (attr1) parts.push(attr1);
        if (attr2) parts.push(attr2);
        baseName += ` (${parts.join(" | ")})`;
    }
    
    return baseName;
}

function renderProductMultiSelect(preserveScroll = false) {
    const container = document.getElementById('productMultiSelectContainer');
    if (!container) return;
    if (preserveScroll) {
        const scrollContainer = container.querySelector('.multi-select-container');
        if (scrollContainer) scrollPosition = scrollContainer.scrollTop;
    }
    let html = '<div class="multi-select-container">';
    originalCardsData.forEach(card => {
        const isSelected = selectedProducts.has(card.id);
        const displayName = getProductDisplayName(card);
        html += `<div class="multi-select-item ${isSelected ? 'selected' : ''}" onclick="toggleProductSelection(${card.id})">
                    <span class="multi-select-item-label">${escapeHtml(displayName)}</span>
                    ${isSelected ? '<span class="selected-mark">✓</span>' : ''}
                </div>`;
    });
    html += '</div><div id="selectedProductsDisplay"></div>';
    container.innerHTML = html;
    if (preserveScroll) {
        const scrollContainer = container.querySelector('.multi-select-container');
        if (scrollContainer) scrollContainer.scrollTop = scrollPosition;
    }
    updateSelectedProductsDisplay();
}

function changePriceValue(delta) {
    const input = document.getElementById('rulePriceMin');
    if (input) {
        let val = parseInt(input.value) || 0;
        val = Math.max(1, val + delta);
        input.value = val;
    }
}

function renderRuleForm() {
    const container = document.getElementById('ruleTypeContent');
    if (!container) return;
    const types = [...new Set(originalCardsData.map(c => c.type).filter(t => t && t.trim()))];
    if (currentRuleType === 'type') {
        const typesHtml = types.map(t => `<div class="rule-select-option" onclick="selectRuleOption('ruleTypeSelect', '${escapeHtml(t)}', '${escapeHtml(t)}')">${escapeHtml(t)}</div>`).join('');
        container.innerHTML = `
            <div class="rule-custom-select">
                <div class="rule-custom-select-trigger" id="ruleTypeSelect-trigger" onclick="openRuleSelect('ruleTypeSelect')">Выберите тип мерча</div>
                <input type="hidden" id="ruleTypeSelect" value="">
                <div class="rule-custom-select-dropdown" id="ruleTypeSelect-dropdown">${typesHtml || '<div class="rule-select-option">Нет доступных типов</div>'}</div>
            </div>
            <input type="number" id="ruleTypeQty" class="rule-styled-input" placeholder="Количество от (шт)" min="1" step="1">
            <input type="text" id="ruleTypeMessage" class="rule-styled-input" placeholder="Что выводить? (например: Стикер в подарок)">
        `;
    } else if (currentRuleType === 'product') {
        container.innerHTML = `
            <div id="productMultiSelectContainer"></div>
            <input type="number" id="ruleProductQty" class="rule-styled-input" placeholder="Количество от (шт)" min="1" step="1">
            <input type="text" id="ruleProductMessage" class="rule-styled-input" placeholder="Что выводить? (например: Наклейка на лист интерактива)">
        `;
        renderProductMultiSelect(false);
    } else if (currentRuleType === 'price') {
        container.innerHTML = `
            <div class="price-control">
                <input type="number" id="rulePriceMin" class="rule-styled-input" placeholder="Минимальная сумма (₽)" min="1" value="1000">
                <button type="button" class="price-step-btn" onclick="changePriceValue(-100)">−</button>
                <button type="button" class="price-step-btn" onclick="changePriceValue(100)">+</button>
            </div>
            <input type="text" id="rulePriceMessage" class="rule-styled-input" placeholder="Что выводить? (например: Печать в бланк)">
        `;
        const priceInput = document.getElementById('rulePriceMin');
        if (priceInput && !priceInput.value) priceInput.value = 1000;
    } else if (currentRuleType === 'bonus') {
        container.innerHTML = `<input type="text" id="bonusMessage" class="rule-styled-input" placeholder="Текст бонуса" value="Бонус за наличку: +1 стикер">`;
    }
}

function addStructuredRule() {
    let newRule = null;
    if (currentRuleType === 'type') {
        const typeName = document.getElementById('ruleTypeSelect')?.value;
        const minQty = parseInt(document.getElementById('ruleTypeQty')?.value);
        const message = document.getElementById('ruleTypeMessage')?.value.trim();
        if (!typeName || !minQty || minQty < 1 || !message) {
            showToast("Заполните все поля", false);
            return;
        }
        newRule = { type: "type", condition: { typeName, minQty }, message, icon: "📦", active: true };
    } else if (currentRuleType === 'product') {
        const productIds = Array.from(selectedProducts);
        const minQty = parseInt(document.getElementById('ruleProductQty')?.value);
        const message = document.getElementById('ruleProductMessage')?.value.trim();
        if (productIds.length === 0 || !minQty || minQty < 1 || !message) {
            showToast("Выберите хотя бы один товар и заполните все поля", false);
            return;
        }
        newRule = { type: "product", condition: { productIds, minQty }, message, icon: "🏷️", active: true };
    } else if (currentRuleType === 'price') {
        const minSum = parseInt(document.getElementById('rulePriceMin')?.value);
        const message = document.getElementById('rulePriceMessage')?.value.trim();
        if (!minSum || minSum < 1 || !message) {
            showToast("Заполните все поля", false);
            return;
        }
        newRule = { type: "price", condition: { minSum }, message, icon: "💰", active: true };
    } else if (currentRuleType === 'bonus') {
        const message = document.getElementById('bonusMessage')?.value.trim() || "Бонус за наличку: +1 стикер";
        newRule = { type: "bonus", message: message, icon: "💵", active: true };
    }
    if (newRule) {
        rulesList.push(newRule);
        saveRules();
        renderRulesList();
        showToast("Правило добавлено ✅", true);
        updateCartUI();
    }
}

function renderRulesList() {
    const container = document.getElementById('rules-list');
    if (!container) return;
    
    const validRules = rulesList.filter(rule => rule && rule.type);
    
    if (validRules.length === 0) {
        container.innerHTML = '<div class="empty-cart">📭 Нет добавленных правил. Создайте новое!</div>';
        return;
    }
    
    let html = '';
    for (let index = 0; index < validRules.length; index++) {
        const rule = validRules[index];
        let conditionText = '';
        let statusText = rule.active !== false ? '✅' : '❌';
        
        try {
            if (rule.type === 'type') {
                if (rule.condition && rule.condition.typeName) {
                    conditionText = `Тип: ${rule.condition.typeName}, от ${rule.condition.minQty} шт`;
                } else {
                    conditionText = `⚠️ Ошибка в правиле (тип)`;
                }
            } else if (rule.type === 'product') {
                if (rule.condition && rule.condition.productIds && Array.isArray(rule.condition.productIds)) {
                    const productNames = rule.condition.productIds.map(id => {
                        const card = originalCardsData.find(c => c.id === id);
                        return card ? getProductDisplayName(card) : id;
                    }).join(', ');
                    conditionText = `Товары: ${productNames.length > 40 ? productNames.substring(0, 40) + '...' : productNames}, от ${rule.condition.minQty} шт`;
                } else {
                    conditionText = `⚠️ Ошибка в правиле (товары)`;
                }
            } else if (rule.type === 'price') {
                if (rule.condition && rule.condition.minSum) {
                    conditionText = `Сумма: от ${rule.condition.minSum} ₽`;
                } else {
                    conditionText = `⚠️ Ошибка в правиле (сумма)`;
                }
            } else if (rule.type === 'bonus') {
                conditionText = ``;
            } else {
                conditionText = `⚠️ Неизвестный тип правила`;
            }
        } catch(e) {
            conditionText = `⚠️ Ошибка в правиле`;
        }
        
        html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; border-bottom: 1px solid var(--border-color);">
                    <div style="flex: 1;">
                        <div style="font-size: 14px; font-weight: bold; color: var(--badge-text);">${rule.icon || '📋'} ${escapeHtml(rule.message || 'Без сообщения')}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">${conditionText}</div>
                    </div>
                    <button onclick="toggleRuleActive(${rulesList.indexOf(rule)})" style="background: none; border: none; font-size: 16px; cursor: pointer; width: 36px; height: 36px;">${statusText}</button>
                    <button onclick="deleteRule(${rulesList.indexOf(rule)})" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--minus-color); width: 36px; height: 36px; box-shadow: none;">🗑</button>
                </div>`;
    }
    container.innerHTML = html;
}

function openRulesModal() {
    selectedProducts.clear();
    renderRuleForm();
    renderRulesList();
    const modal = document.getElementById('rulesModal');
    if (modal) modal.style.display = 'block';
}

function closeRulesModal() {
    const modal = document.getElementById('rulesModal');
    if (modal) modal.style.display = 'none';
    closeAllRuleSelects();
}

function checkRulesForCart() {
    const cartItems = Object.entries(cart);
    if (cartItems.length === 0 || !originalCardsData.length) return [];
    
    const cartInfo = {};
    let totalPrice = 0;
    
    for (const [idStr, qty] of cartItems) {
        if (qty === 0) continue;
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        if (card) {
            if (!cartInfo[id]) cartInfo[id] = { qty: 0, price: card.price, type: card.type, name: card.name, attr1: card.attribute1, attr2: card.attribute2 };
            cartInfo[id].qty += qty;
            totalPrice += qty * card.price;
        }
    }
    
    const typeQty = {};
    for (const [id, info] of Object.entries(cartInfo)) {
        if (info.type) typeQty[info.type] = (typeQty[info.type] || 0) + info.qty;
    }
    
    const activeRules = [];
    for (const rule of rulesList) {
        if (!rule || !rule.type) continue;
        if (rule.active === false) continue;
        
        let isActive = false;
        let detailText = "";
        
        try {
            if (rule.type === 'type') {
                if (rule.condition && rule.condition.typeName) {
                    const qty = typeQty[rule.condition.typeName] || 0;
                    if (qty >= rule.condition.minQty) {
                        isActive = true;
                        detailText = `(в корзине ${qty} шт товаров типа "${rule.condition.typeName}", нужно от ${rule.condition.minQty})`;
                    }
                }
            }
            else if (rule.type === 'product') {
                if (rule.condition && rule.condition.productIds && Array.isArray(rule.condition.productIds)) {
                    let totalQty = 0;
                    for (const productId of rule.condition.productIds) {
                        totalQty += cartInfo[productId]?.qty || 0;
                    }
                    if (totalQty >= rule.condition.minQty) {
                        isActive = true;
                        detailText = `(в корзине ${totalQty} шт товаров из списка, нужно от ${rule.condition.minQty})`;
                    }
                }
            }
            else if (rule.type === 'price') {
                if (rule.condition && rule.condition.minSum) {
                    if (totalPrice >= rule.condition.minSum) {
                        isActive = true;
                        detailText = `(сумма ${totalPrice} ₽, нужно от ${rule.condition.minSum} ₽)`;
                    }
                }
            }
            else if (rule.type === 'bonus') {
                isActive = true;
                detailText = "";
            }
        } catch(e) {
            console.warn("Ошибка при проверке правила:", e);
        }
        
        if (isActive) {
            activeRules.push({ icon: rule.icon || "✨", message: rule.message, condition: detailText });
        }
    }
    return activeRules;
}
