// ========== СКИДКИ ==========
function toggleDiscountPanel() {
    discountPanelOpen = !discountPanelOpen;
    const content = document.getElementById('discount-content');
    const chevron = document.getElementById('discount-chevron');
    if (content) content.style.display = discountPanelOpen ? 'block' : 'none';
    if (chevron) chevron.textContent = discountPanelOpen ? '▲' : '▼';
}

function closeDiscountPanel() {
    discountPanelOpen = false;
    const content = document.getElementById('discount-content');
    const chevron = document.getElementById('discount-chevron');
    if (content) content.style.display = 'none';
    if (chevron) chevron.textContent = '▼';
}

function toggleItemDiscountSelect() {
    const dropdown = document.getElementById('itemDiscountSelectDropdown');
    if (dropdown) dropdown.classList.toggle('show');
}

function selectItemDiscountType(type, label) {
    const trigger = document.getElementById('itemDiscountSelectTrigger');
    const hiddenSelect = document.getElementById('itemDiscountTypeSelect');
    if (trigger) trigger.textContent = label;
    if (hiddenSelect) hiddenSelect.setAttribute('data-value', type);
    const dropdown = document.getElementById('itemDiscountSelectDropdown');
    if (dropdown) dropdown.classList.remove('show');
}

function renderProductDiscountList() {
    const container = document.getElementById('productDiscountList');
    if (!container) return;
    const cartProductIds = new Set();
    for (const [idStr, qty] of Object.entries(cart)) {
        if (qty > 0) {
            const id = parseInt(idStr);
            cartProductIds.add(id);
        }
    }
    let html = '<div class="product-select-list">';
    originalCardsData.forEach(card => {
        if (cartProductIds.has(card.id)) {
            const isSelected = selectedDiscountProducts.has(card.id);
            const displayName = `${card.type} ${card.name}`;
            html += `<div class="product-select-item ${isSelected ? 'selected' : ''}" onclick="toggleProductSelectionForDiscount(${card.id})">
                        <span class="multi-select-item-label">${escapeHtml(displayName)}</span>${isSelected ? '<span class="product-select-check">✓</span>' : ''}
                    </div>`;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

function toggleProductSelectionForDiscount(productId) {
    if (selectedDiscountProducts.has(productId)) selectedDiscountProducts.delete(productId);
    else selectedDiscountProducts.add(productId);
    renderProductDiscountList();
}

function toggleDiscountProductsList() {
    discountProductListVisible = !discountProductListVisible;
    const container = document.getElementById('productDiscountList');
    if (container) container.style.display = discountProductListVisible ? 'block' : 'none';
    if (discountProductListVisible) renderProductDiscountList();
}

function selectAllProductsForDiscount() {
    selectedDiscountProducts.clear();
    for (const [idStr, qty] of Object.entries(cart)) {
        if (qty > 0) {
            const id = parseInt(idStr);
            selectedDiscountProducts.add(id);
        }
    }
    renderProductDiscountList();
    showToast(`Выбрано ${selectedDiscountProducts.size} товаров`, true);
}

function selectNoneProductsForDiscount() {
    selectedDiscountProducts.clear();
    renderProductDiscountList();
    showToast(`Выбор товаров сброшен`, true);
}

function changeItemDiscountValue(delta) {
    const input = document.getElementById('itemDiscountValue');
    if (input) {
        let val = parseFloat(input.value) || 0;
        const typeSelect = document.getElementById('itemDiscountTypeSelect');
        const type = typeSelect ? typeSelect.getAttribute('data-value') || 'percent' : 'percent';
        let step = (type === 'percent') ? 1 : 100;
        val = Math.max(0, val + delta * step);
        input.value = val;
    }
}

function updateItemDiscountFromInput() {
    const input = document.getElementById('itemDiscountValue');
    if (input) {
        let val = parseFloat(input.value) || 0;
        if (val < 0) val = 0;
        input.value = val;
    }
}

// ===== КАСКАДНОЕ РАСПРЕДЕЛЕНИЕ ФИКСИРОВАННОЙ СКИДКИ С УЧЁТОМ КОЛИЧЕСТВА =====
function distributeFixedDiscount(productsWithQty, totalDiscount) {
    // productsWithQty: [{ id, price, qty }] - qty - количество в корзине
    const discountMap = new Map(); // хранит суммарную скидку на ПОЗИЦИЮ (price * qty)
    
    // Инициализируем
    productsWithQty.forEach(p => discountMap.set(p.id, 0));

    let activeIds = new Set(productsWithQty.map(p => p.id));
    const capacityMap = new Map(); // реальная capacity = price * qty
    const qtyMap = new Map(); // для хранения количества
    productsWithQty.forEach(p => {
        const capacity = p.price * p.qty;
        capacityMap.set(p.id, capacity);
        qtyMap.set(p.id, p.qty);
    });
    
    let pool = totalDiscount;

    while (activeIds.size > 0 && pool > 0) {
        const share = pool / activeIds.size;
        let excess = 0;
        const zeroedNow = [];

        for (const id of activeIds) {
            const capacity = capacityMap.get(id);
            const currentDiscount = discountMap.get(id);
            const remainingCapacity = capacity - currentDiscount; // сколько ещё можно "влить"

            if (remainingCapacity <= share) {
                // Обнуляем товар: забираем всю оставшуюся capacity
                discountMap.set(id, currentDiscount + remainingCapacity);
                excess += share - remainingCapacity;
                zeroedNow.push(id);
            } else {
                discountMap.set(id, currentDiscount + share);
            }
        }

        zeroedNow.forEach(id => activeIds.delete(id));
        pool = excess;

        if (zeroedNow.length === 0) break;
    }

    // Преобразуем суммарную скидку на позицию в скидку на ЕДИНИЦУ товара
    const resultMap = new Map();
    for (const [id, totalDiscountForPosition] of discountMap) {
        const qty = qtyMap.get(id) || 1;
        // Скидка на единицу = общая скидка на позицию / количество
        // Округляем вверх, чтобы не потерять копейки
        const discountPerUnit = Math.ceil(totalDiscountForPosition / qty);
        resultMap.set(id, discountPerUnit);
    }

    return resultMap;
}

function applyItemDiscount() {
    const typeSelect = document.getElementById('itemDiscountTypeSelect');
    const type = typeSelect ? typeSelect.getAttribute('data-value') || 'percent' : 'percent';
    const value = parseFloat(document.getElementById('itemDiscountValue').value) || 0;
    
    if (selectedDiscountProducts.size === 0) {
        showToast("Выберите товары для скидки", false);
        return;
    }
    if (value <= 0) {
        showToast("Введите корректную сумму скидки", false);
        return;
    }

    if (type === 'fixed') {
        const products = Array.from(selectedDiscountProducts).map(id => {
            const card = originalCardsData.find(c => c.id === id);
            const qty = cart[id] || 0;
            return { 
                id: id, 
                price: card ? card.price : 0,
                qty: qty
            };
        });
        
        const validProducts = products.filter(p => p.qty > 0);
        
        if (validProducts.length === 0) {
            showToast("Выбранные товары отсутствуют в корзине", false);
            return;
        }
        
        const discountMap = distributeFixedDiscount(validProducts, value);
        
        for (const productId of selectedDiscountProducts) {
            const discountPerUnit = discountMap.get(productId) || 0;
            if (discountPerUnit > 0) {
                itemDiscounts[productId] = { type: 'fixed', value: discountPerUnit };
            } else {
                delete itemDiscounts[productId];
            }
        }
    } else {
        for (const productId of selectedDiscountProducts) {
            itemDiscounts[productId] = { type: type, value: value };
        }
    }

    selectedDiscountProducts.clear();
    discountProductListVisible = false;
    const container = document.getElementById('productDiscountList');
    if (container) container.style.display = 'none';
    updateCartUI();
    showToast("Скидка применена к выбранным товарам", true);
}

function resetItemDiscounts() {
    itemDiscounts = {};
    updateCartUI();
    showToast("Скидки на товары сброшены", true);
}
