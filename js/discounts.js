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
    for (const productId of selectedDiscountProducts) {
        if (!itemDiscounts[productId]) itemDiscounts[productId] = {};
        itemDiscounts[productId] = { type: type, value: value };
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

function getBestDiscountForItem(id, originalPrice, qty, subtotal) {
    let finalPrice = originalPrice;
    let discountValue = 0;
    let discountType = null;
    if (itemDiscounts[id]) {
        const disc = itemDiscounts[id];
        discountType = disc.type;
        if (disc.type === 'percent') {
            finalPrice = originalPrice * (1 - disc.value / 100);
            discountValue = disc.value;
        } else if (disc.type === 'fixed') {
            finalPrice = Math.max(0, originalPrice - disc.value);
            discountValue = disc.value;
        }
    }
    return { price: finalPrice, discountValue: discountValue, discountType: discountType };
}
