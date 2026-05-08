// ========== РЕДАКТИРОВАНИЕ ==========

// Загрузить список типов в селектор (для обратной совместимости)
async function loadTypesToSelector(selectorId, selectedType = "") {
    const selector = document.getElementById(selectorId);
    if (!selector) return;
    
    if (!window.merchTypesLoaded) {
        await loadMerchTypesConfig();
    }
    
    const types = getAllMerchTypes();
    selector.innerHTML = '<option value="">Выберите тип</option>';
    
    for (const type of types) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        if (selectedType === type) {
            option.selected = true;
        }
        selector.appendChild(option);
    }
}

// Динамическое обновление полей атрибутов при выборе типа (добавление)
function onAddTypeChange() {
    // Пытаемся получить тип из hidden select
    let hiddenSelect = document.getElementById('addItemType');
    let selectedType = hiddenSelect ? hiddenSelect.value : '';
    
    // Если hidden select пуст, пробуем получить из кастомного селектора
    if (!selectedType || selectedType === '') {
        const container = document.getElementById('addItemTypeContainer');
        if (container) {
            const trigger = container.querySelector('div[style*="cursor: pointer"]');
            if (trigger && trigger.childNodes && trigger.childNodes[0]) {
                const triggerText = trigger.childNodes[0].textContent.trim();
                if (triggerText && triggerText !== 'Выберите тип') {
                    selectedType = triggerText;
                    // Обновляем hidden select
                    if (hiddenSelect) {
                        hiddenSelect.value = selectedType;
                    }
                }
            }
        }
    }
    
    console.log('onAddTypeChange: selectedType =', selectedType);
    
    if (selectedType && selectedType !== 'Выберите тип' && selectedType !== '') {
        const container = document.getElementById('addAttributesContainer');
        if (container) {
            container.innerHTML = '';
        }
        const attr1Select = document.getElementById('add_attr1');
        const attr2Select = document.getElementById('add_attr2');
        if (attr1Select) attr1Select.value = '';
        if (attr2Select) attr2Select.value = '';
        
        renderAttributesFields('add', selectedType);
    }
}

// Динамическое обновление полей атрибутов при выборе типа (редактирование)
function onEditTypeChange() {
    let hiddenSelect = document.getElementById('editType');
    let selectedType = hiddenSelect ? hiddenSelect.value : '';
    
    // Если hidden select пуст, пробуем получить из кастомного селектора
    if (!selectedType || selectedType === '') {
        const container = document.getElementById('editTypeContainer');
        if (container) {
            const trigger = container.querySelector('div[style*="cursor: pointer"]');
            if (trigger && trigger.childNodes && trigger.childNodes[0]) {
                const triggerText = trigger.childNodes[0].textContent.trim();
                if (triggerText && triggerText !== 'Выберите тип') {
                    selectedType = triggerText;
                    if (hiddenSelect) {
                        hiddenSelect.value = selectedType;
                    }
                }
            }
        }
    }
    
    if (selectedType && selectedType !== 'Выберите тип' && selectedType !== '') {
        const container = document.getElementById('editAttributesContainer');
        if (container) {
            container.innerHTML = '';
        }
        const attr1Select = document.getElementById('edit_attr1');
        const attr2Select = document.getElementById('edit_attr2');
        if (attr1Select) attr1Select.value = '';
        if (attr2Select) attr2Select.value = '';
        
        renderAttributesFields('edit', selectedType);
    }
}

// Отрисовка полей атрибутов
function renderAttributesFields(mode, selectedType) {
    const containerId = mode === 'add' ? 'addAttributesContainer' : 'editAttributesContainer';
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!selectedType) {
        console.log("renderAttributesFields: no selectedType");
        return;
    }
    
    console.log("renderAttributesFields called with mode:", mode, "selectedType:", selectedType);
    
    const typeConfig = getTypeConfigFromCache(selectedType);
    if (!typeConfig) {
        console.log("No config found for type:", selectedType);
        return;
    }
    
    const attr1Name = typeConfig.attribute1?.name || '';
    const attr1Values = typeConfig.attribute1?.values || [];
    const attr2Name = typeConfig.attribute2?.name || '';
    const attr2Values = typeConfig.attribute2?.values || [];
    
    let currentAttr1 = '';
    let currentAttr2 = '';
    
    if (mode === 'edit' && currentEditId) {
        const card = originalCardsData.find(c => c.id === currentEditId);
        if (card && card.type === selectedType) {
            currentAttr1 = card.attribute1 || '';
            currentAttr2 = card.attribute2 || '';
        }
    }
    
    let html = '';
    
    // Атрибут 1
    if (attr1Name && attr1Values.length > 0) {
        html += `
            <div class="edit-row">
                <span class="edit-label">${escapeHtml(attr1Name)}</span>
                <div id="${mode}_attr1_container" style="flex: 1;"></div>
                <select id="${mode}_attr1" style="display: none;">
                    <option value="">Не выбран</option>
                    ${attr1Values.map(v => `<option value="${escapeHtml(v)}" ${currentAttr1 === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
                </select>
            </div>
        `;
    }
    
    // Атрибут 2
    if (attr2Name && attr2Values.length > 0) {
        html += `
            <div class="edit-row">
                <span class="edit-label">${escapeHtml(attr2Name)}</span>
                <div id="${mode}_attr2_container" style="flex: 1;"></div>
                <select id="${mode}_attr2" style="display: none;">
                    <option value="">Не выбран</option>
                    ${attr2Values.map(v => `<option value="${escapeHtml(v)}" ${currentAttr2 === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
                </select>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Инициализируем кастомные селекторы
    if (mode === 'edit') {
        if (typeof initEditAttributeSelects === 'function') {
            initEditAttributeSelects(currentAttr1, currentAttr2, attr1Values, attr2Values);
        }
    } else {
        if (typeof initAddAttributeSelects === 'function') {
            initAddAttributeSelects(attr1Values, attr2Values);
        }
    }
}

// Получить значения атрибутов из формы (добавление)
function getAddAttributes() {
    const attr1 = document.getElementById('add_attr1')?.value || '';
    const attr2 = document.getElementById('add_attr2')?.value || '';
    return { attribute1: attr1, attribute2: attr2 };
}

// Получить значения атрибутов из формы (редактирование)
function getEditAttributes() {
    const attr1 = document.getElementById('edit_attr1')?.value || '';
    const attr2 = document.getElementById('edit_attr2')?.value || '';
    return { attribute1: attr1, attribute2: attr2 };
}

// Отрисовка атрибутов на карточке товара
function renderAttributesOnCard(card, container) {
    if (!card) return;
    
    const attr1 = card.attribute1 || '';
    const attr2 = card.attribute2 || '';
    
    if (!attr1 && !attr2) return;
    
    let attributesHtml = '<div class="card-attributes" style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">';
    const parts = [];
    if (attr1) parts.push(escapeHtml(attr1));
    if (attr2) parts.push(escapeHtml(attr2));
    attributesHtml += parts.join(' | ');
    attributesHtml += '</div>';
    
    const infoDiv = container.querySelector('.info');
    if (infoDiv) {
        const oldAttributes = infoDiv.querySelector('.card-attributes');
        if (oldAttributes) oldAttributes.remove();
        infoDiv.insertAdjacentHTML('beforeend', attributesHtml);
    }
}

// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА РЕДАКТИРОВАНИЯ
async function openEditProductModal(id) {
    currentEditId = id;
    const card = originalCardsData.find(c => c.id === id);
    
    if (card) {
        document.getElementById('editTitle').textContent = `✏️ Редактирование товара №${card.id}`;
        
        if (typeof initEditTypeSelector === 'function') {
            await initEditTypeSelector(card.type || "");
        } else {
            await loadTypesToSelector('editType', card.type || "");
        }
        
        document.getElementById('editName').value = card.name || "";
        document.getElementById('editStock').value = card.stock;
        document.getElementById('editTotal').value = card.total;
        document.getElementById('editPrice').value = card.price;
        document.getElementById('editCost').value = card.cost || 0;
        
        renderAttributesFields('edit', card.type || "");
        
        loadPhotoPreview(id);
        
        document.getElementById('editProductModal').style.display = 'block';
        initPhotoUploadInEditModal();
    } else {
        showToast("Товар не найден", false);
    }
}

function closeEditProductModal() {
    document.getElementById('editProductModal').style.display = 'none';
    currentEditId = null;
}

// СОХРАНЕНИЕ ИЗМЕНЕНИЙ
async function saveProductChanges() {
    if (currentEditId === null) return;
    
    let newType = document.getElementById('editType')?.value.trim();
    if (!newType) {
        const typeContainer = document.getElementById('editTypeContainer');
        const trigger = typeContainer?.querySelector('div[style*="cursor: pointer"]');
        if (trigger && trigger.childNodes[0]) {
            newType = trigger.childNodes[0].textContent.trim();
        }
    }
    
    const newName = document.getElementById('editName').value.trim();
    const newStock = parseInt(document.getElementById('editStock').value);
    const newTotal = parseInt(document.getElementById('editTotal').value);
    const newPrice = parseFloat(document.getElementById('editPrice').value);
    const newCost = parseFloat(document.getElementById('editCost').value);
    const { attribute1, attribute2 } = getEditAttributes();
    
    if (!newName) {
        showToast("Название товара обязательно", false);
        return;
    }
    if (!newType) {
        showToast("Выберите тип товара", false);
        return;
    }
    if (isNaN(newStock) || isNaN(newTotal) || newStock < 0 || newTotal < 0 || newStock > newTotal) {
        showToast("Некорректные значения остатка или общего количества", false);
        return;
    }
    if (isNaN(newPrice) || newPrice < 0) {
        showToast("Некорректная цена", false);
        return;
    }
    if (isNaN(newCost) || newCost < 0) {
        showToast("Некорректная себестоимость", false);
        return;
    }
    
    const card = originalCardsData.find(c => c.id === currentEditId);
    if (card) {
        card.type = newType;
        card.name = newName;
        card.stock = newStock;
        card.total = newTotal;
        card.price = newPrice;
        card.cost = newCost;
        card.attribute1 = attribute1;
        card.attribute2 = attribute2;
        filterAndSort();
    }
    
    const cardElement = document.querySelector(`.card[data-id="${currentEditId}"]`);
    if (cardElement) {
        const nameElement = cardElement.querySelector('.name');
        const typeBadge = cardElement.querySelector('.type-badge');
        const stockSpan = cardElement.querySelector('.stock');
        const totalSpan = cardElement.querySelector('.total');
        const priceSpan = cardElement.querySelector('.price');
        
        if (nameElement) nameElement.textContent = newName;
        if (typeBadge) {
            let typeDisplayText = newType;
            if (attribute1) typeDisplayText += ` | ${attribute1}`;
            if (attribute2) typeDisplayText += ` | ${attribute2}`;
            typeBadge.textContent = typeDisplayText;
            const typeColor = newType ? getTypeColor(newType) : '#c25d1a';
            typeBadge.style.background = `${typeColor}20`;
            typeBadge.style.color = typeColor;
        }
        if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
        if (totalSpan) totalSpan.textContent = `📦 Всего: ${newTotal} шт`;
        if (priceSpan) priceSpan.textContent = `💰 Цена: ${newPrice} ₽`;
        
        const oldAttributes = cardElement.querySelector('.card-attributes');
        if (oldAttributes) oldAttributes.remove();
        
        if (newStock === 0) cardElement.classList.add('out-of-stock');
        else cardElement.classList.remove('out-of-stock');
    }
    
    if (!isOnline) {
        addPendingOperation("updateFullItem", { 
            id: currentEditId, 
            type: newType, 
            name: newName, 
            stock: newStock, 
            total: newTotal, 
            price: newPrice, 
            cost: newCost,
            attribute1: attribute1,
            attribute2: attribute2
        });
        showToast(`Товар "${newName}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
        return;
    }
    
    try {
        const params = `&id=${currentEditId}&type=${encodeURIComponent(newType)}&name=${encodeURIComponent(newName)}&stock=${newStock}&total=${newTotal}&price=${newPrice}&cost=${newCost}&attribute1=${encodeURIComponent(attribute1)}&attribute2=${encodeURIComponent(attribute2)}`;
        const response = await fetch(buildApiUrl("updateFullItem", params));
        const result = await response.json();
        if (!result.success) {
            showToast("Ошибка: " + (result.error || "неизвестная"), false);
        } else {
            showToast(`Товар "${newName}" обновлён`, true);
            closeEditProductModal();
        }
    } catch (e) {
        console.error(e);
        addPendingOperation("updateFullItem", { 
            id: currentEditId, 
            type: newType, 
            name: newName, 
            stock: newStock, 
            total: newTotal, 
            price: newPrice, 
            cost: newCost,
            attribute1: attribute1,
            attribute2: attribute2
        });
        showToast(`Товар "${newName}" обновлён (будет синхронизировано при восстановлении соединения)`, true);
        closeEditProductModal();
    }
}

// ДОБАВЛЕНИЕ НОВОГО ТОВАРА
async function addNewItem() {
    let type = '';
    const hiddenSelect = document.getElementById('addItemType');
    const newTypeInput = document.getElementById('addItemNewType');
    const isNewTypeVisible = newTypeInput && newTypeInput.style.display !== 'none';
    
    if (isNewTypeVisible) {
        type = newTypeInput.value.trim();
        if (type === "") {
            showToast("Введите тип товара", false);
            return;
        }
    } else if (hiddenSelect && hiddenSelect.value) {
        type = hiddenSelect.value;
        if (type === "") {
            showToast("Выберите тип товара", false);
            return;
        }
    } else {
        // Пробуем получить из кастомного селектора
        const container = document.getElementById('addItemTypeContainer');
        if (container) {
            const trigger = container.querySelector('div[style*="cursor: pointer"]');
            if (trigger && trigger.childNodes[0]) {
                type = trigger.childNodes[0].textContent.trim();
                if (!type || type === "Выберите тип") {
                    showToast("Выберите тип товара", false);
                    return;
                }
            } else {
                showToast("Выберите тип товара", false);
                return;
            }
        } else {
            showToast("Выберите тип товара", false);
            return;
        }
    }
    
    const name = document.getElementById('addItemName').value.trim();
    if (name === "") {
        showToast("Введите название товара", false);
        return;
    }
    
    const total = parseInt(document.getElementById('addItemTotal').value) || 0;
    const stock = parseInt(document.getElementById('addItemStock').value) || 0;
    
    if (total < 0) {
        showToast("Количество не может быть отрицательным", false);
        return;
    }
    if (stock < 0 || stock > total) {
        showToast("Остаток не может быть отрицательным или больше общего количества", false);
        return;
    }
    
    const price = parseFloat(document.getElementById('addItemPrice').value) || 0;
    if (price < 0) {
        showToast("Цена не может быть отрицательной", false);
        return;
    }
    
    const cost = parseFloat(document.getElementById('addItemCost').value) || 0;
    if (cost < 0) {
        showToast("Себестоимость не может быть отрицательной", false);
        return;
    }
    
    const { attribute1, attribute2 } = getAddAttributes();
    
    await sendAddItemRequest(type, name, total, stock, price, cost, attribute1, attribute2);
    
    closeAddItemModal();
}

// ИНИЦИАЛИЗАЦИЯ СЕЛЕКТОРА ТИПОВ В МОДАЛКЕ ДОБАВЛЕНИЯ
async function initAddItemTypeSelector() {
    const typeSelect = document.getElementById('addItemType');
    if (!typeSelect) return;
    
    if (!window.merchTypesLoaded) {
        await loadMerchTypesConfig();
    }
    
    const types = getAllMerchTypes();
    typeSelect.innerHTML = '<option value="">Выберите тип</option>';
    
    for (const type of types) {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        typeSelect.appendChild(option);
    }
    
    const container = document.getElementById('addAttributesContainer');
    if (container) container.innerHTML = '';
}

const originalOpenAddItemModal = window.openAddItemModal;
window.openAddItemModal = async function() {
    await initAddItemTypeSelector();
    if (originalOpenAddItemModal) originalOpenAddItemModal();
};

// Экспортируем функции
window.openEditProductModal = openEditProductModal;
window.closeEditProductModal = closeEditProductModal;
window.saveProductChanges = saveProductChanges;
window.onAddTypeChange = onAddTypeChange;
window.onEditTypeChange = onEditTypeChange;
window.renderAttributesOnCard = renderAttributesOnCard;
window.loadTypesToSelector = loadTypesToSelector;
window.addNewItem = addNewItem;
window.renderAttributesFields = renderAttributesFields;
