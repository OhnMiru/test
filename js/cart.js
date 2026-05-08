// ========== КОРЗИНА ==========
// Переменные cart, itemDiscounts, selectedDiscountProducts, discountProductListVisible, discountPanelOpen, cartBookingMap, bookings уже объявлены в config.js

// Вспомогательная функция для получения отображаемого имени товара с атрибутами
function getCartItemDisplayName(card) {
    if (!card) return "";
    let displayName = `${card.type} ${card.name}`;
    const attr1 = card.attribute1 || "";
    const attr2 = card.attribute2 || "";
    if (attr1 || attr2) {
        const attrs = [];
        if (attr1) attrs.push(attr1);
        if (attr2) attrs.push(attr2);
        displayName += ` (${attrs.join(" | ")})`;
    }
    return displayName;
}

function updateCardBadges() {
    document.querySelectorAll('.card').forEach(card => {
        const idAttr = card.getAttribute('data-id');
        if (idAttr) {
            const id = parseInt(idAttr);
            let badge = card.querySelector('.cart-qty-badge');
            if (cart.hasOwnProperty(id) && cart[id] > 0) {
                if (!badge) { badge = document.createElement('div'); badge.className = 'cart-qty-badge'; card.style.position = 'relative'; card.appendChild(badge); }
                badge.textContent = cart[id];
                badge.style.background = 'var(--btn-bg)';
            } else { if (badge) badge.remove(); }
        }
    });
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
            const discountPerUnit = disc.valuePerItem || disc.value;
            finalPrice = Math.max(0, originalPrice - discountPerUnit);
            discountValue = discountPerUnit;
        }
    }
    
    finalPrice = Math.ceil(finalPrice);
    return { price: finalPrice, discountValue: discountValue, discountType: discountType };
}

function getActiveRulesFiltered() {
    const allActiveRules = checkRulesForCart();
    
    // Если оплата переводом, фильтруем правила с типом 'bonus'
    if (currentPaymentType === 'transfer') {
        return allActiveRules.filter(rule => {
            const matchingRule = rulesList.find(r => r.message === rule.message && r.icon === rule.icon);
            return !matchingRule || matchingRule.type !== 'bonus';
        });
    }
    
    return allActiveRules;
}

// ОБНОВЛЕНА: отображает атрибуты товаров в корзине
function updateCartUI() {
    const totalPositiveCount = Object.values(cart).reduce((a, b) => a + (b > 0 ? b : 0), 0);
    const cartCountSpan = document.getElementById('cartCount');
    if (cartCountSpan) cartCountSpan.textContent = totalPositiveCount;
    const cartItemsDiv = document.getElementById('cart-items-list');
    const cartTotalDiv = document.getElementById('cart-total');
    const cartActionsDiv = document.getElementById('cart-actions');
    const discountPanelDiv = document.getElementById('discount-panel');
    
    if (!cartItemsDiv) return;
    const hasAny = Object.keys(cart).length > 0;
    
    if (!hasAny) {
        if (discountPanelDiv) discountPanelDiv.style.display = 'none';
        cartItemsDiv.innerHTML = '<div class="empty-cart">🍌 Корзина пуста</div>';
        if (cartTotalDiv) cartTotalDiv.style.display = 'none';
        if (cartActionsDiv) cartActionsDiv.style.display = 'none';
        updateCardBadges();
        return;
    }
    
    // Скрываем старый блок скидок, мы его перенесём в cart-items-list
    if (discountPanelDiv) discountPanelDiv.style.display = 'none';
    
    // === 1. Активные правила ===
    const activeRules = getActiveRulesFiltered();
    let html = '';
    
    if (activeRules.length > 0) {
        html += `<div style="background: var(--badge-bg); border-radius: 16px; padding: 12px; margin-bottom: 16px; border-left: 4px solid var(--btn-bg);">
                    <div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: var(--badge-text);">✨ Активные правила ✨</div>`;
        for (const rule of activeRules) {
            html += `<div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); padding: 4px 0;">
                        <span style="font-size: 16px;">${escapeHtml(rule.icon)}</span>
                        <span><span class="rule-text-bold">${escapeHtml(rule.message)}</span> <span class="rule-text-normal">${escapeHtml(rule.condition)}</span></span>
                    </div>`;
        }
        html += `</div>`;
    }
    
    // === 2. Скидки (обновлённая вёрстка) ===
    const discountPanelOpenLocal = discountPanelOpen;
    html += `<div class="discount-section" style="margin-bottom: 16px;">
                <div class="discount-header" onclick="toggleDiscountPanel()">
                    <span class="discount-title">🎯 Скидки</span>
                    <span class="discount-chevron" id="discount-chevron">${discountPanelOpenLocal ? '▲' : '▼'}</span>
                </div>
                <div id="discount-content" class="discount-content" style="display: ${discountPanelOpenLocal ? 'block' : 'none'};">
                    <div class="discount-group">
                        <!-- Первая строка: тип скидки, сумма, кнопки Товары/Все/Ничего -->
                        <div class="discount-row discount-row-main" style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 8px;">
                            <div class="discount-custom-select">
                                <div class="discount-custom-select-trigger" id="itemDiscountSelectTrigger" onclick="event.stopPropagation(); toggleItemDiscountSelect()">%</div>
                                <div class="discount-custom-select-dropdown" id="itemDiscountSelectDropdown">
                                    <div class="discount-select-option" onclick="selectItemDiscountType('percent', '%')">%</div>
                                    <div class="discount-select-option" onclick="selectItemDiscountType('fixed', '₽')">₽</div>
                                </div>
                                <input type="hidden" id="itemDiscountTypeSelect" data-value="percent">
                            </div>
                            <div class="discount-amount-control" style="display: flex; align-items: center; gap: 4px;">
                                <input type="number" id="itemDiscountValue" class="discount-amount-input" placeholder="Сумма" value="0" onchange="updateItemDiscountFromInput()">
                                <button class="discount-step-btn" onclick="changeItemDiscountValue(-1)">−</button>
                                <button class="discount-step-btn" onclick="changeItemDiscountValue(1)">+</button>
                            </div>
                            <div class="discount-products-buttons" style="display: flex; gap: 6px; margin-left: auto;">
                                <button class="discount-products-btn discount-products-small" onclick="toggleDiscountProductsList()">Товары</button>
                                <button class="discount-all-btn discount-all-small" onclick="selectAllProductsForDiscount()">Все</button>
                                <button class="discount-none-btn discount-none-small" onclick="selectNoneProductsForDiscount()">Ничего</button>
                            </div>
                        </div>
                        <div id="productDiscountList" style="display: none; margin-top: 8px;"></div>
                    </div>
                    <div class="discount-buttons-row" style="display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;">
                        <button class="discount-action-btn cancel-btn" onclick="closeDiscountPanel()" style="flex: 1; min-width: 70px; font-weight: bold;">Отмена</button>
                        <button class="discount-action-btn reset-btn" onclick="resetItemDiscounts()" style="flex: 2; min-width: 100px; font-weight: bold;">Сбросить скидки</button>
                        <button class="discount-action-btn apply-btn" onclick="applyItemDiscount()" style="flex: 1; min-width: 70px; font-weight: bold;">Применить</button>
                    </div>
                </div>
            </div>`;
    
    // === 3. Способ оплаты ===
    html += `<div class="payment-section" style="background: var(--badge-bg); border-radius: 16px; margin-bottom: 16px; border-left: 4px solid var(--btn-bg);">
                <div class="payment-header" style="padding: 10px 12px; font-weight: bold; font-size: 13px; color: var(--badge-text);">💰 Способ оплаты</div>
                <div class="payment-content" style="padding: 12px; padding-top: 0;">
                    <label style="display: flex; align-items: center; gap: 12px; cursor: pointer; color: var(--text-primary); font-weight: bold; font-size: 13px;">
                        <input type="checkbox" id="paymentTypeCheckbox" ${currentPaymentType === 'transfer' ? 'checked' : ''} 
                               style="width: 20px; height: 20px; cursor: pointer; accent-color: #f39c12;">
                        <span>Оплата переводом <span style="font-weight: normal;">(по умолчанию — наличные)</span></span>
                    </label>
                </div>
            </div>`;
    
    // === 4. Товары в корзине (с отображением атрибутов) ===
    let subtotal = 0;
    for (const [idStr, qty] of Object.entries(cart)) { 
        const id = parseInt(idStr); 
        const card = originalCardsData.find(c => c.id === id); 
        if (card) subtotal += qty * card.price; 
    }
    
    let total = 0;
    for (const [idStr, qty] of Object.entries(cart)) {
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        if (!card) continue;
        const best = getBestDiscountForItem(id, card.price, qty, subtotal);
        const originalItemTotal = card.price * qty;
        const discountedItemTotal = best.price * qty;
        const finalDiscountedItemTotal = Math.ceil(discountedItemTotal);
        total += finalDiscountedItemTotal;
        const isZero = qty === 0;
        const hasDiscount = best.discountValue > 0;
        let discountText = '';
        if (hasDiscount) {
            const totalDiscountForItem = (card.price - best.price) * qty;
            if (best.discountType === 'percent') {
                discountText = `<div style="font-size: 11px; color: var(--profit-positive);">Скидка: ${best.discountValue}%</div>`;
            } else if (best.discountType === 'fixed') {
                const roundedDiscount = Math.ceil(totalDiscountForItem);
                discountText = `<div style="font-size: 11px; color: var(--profit-positive);">Скидка: ${roundedDiscount} ₽</div>`;
            }
        }
        // Используем обновлённую функцию для отображения имени с атрибутами
        const displayName = getCartItemDisplayName(card);
        html += `<div class="cart-item ${isZero ? 'disabled' : ''}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">${escapeHtml(displayName)}</div>
                        <div class="cart-item-price">${card.price} ₽ × ${qty} = ${hasDiscount ? `<span class="strikethrough">${Math.ceil(originalItemTotal)} ₽</span> ${Math.ceil(finalDiscountedItemTotal)} ₽` : `${Math.ceil(originalItemTotal)} ₽`}</div>
                        ${discountText}
                    </div>
                    <div class="cart-item-quantity">
                        <button class="cart-qty-btn" onclick="changeCartQty(${id}, -1)" ${isZero ? 'disabled' : ''}>−</button>
                        <span class="cart-item-qty">${qty}</span>
                        <button class="cart-qty-btn" onclick="changeCartQty(${id}, 1)">+</button>
                        <button class="cart-item-remove" onclick="removeFromCart(${id})">🗑</button>
                    </div>
                </div>`;
    }
    
    cartItemsDiv.innerHTML = html;
    
    // Обновляем итоговую сумму
    if (cartTotalDiv) {
        cartTotalDiv.style.display = 'block';
        const hasAnyDiscount = Object.values(itemDiscounts).length > 0;
        const roundedTotal = Math.ceil(total);
        const roundedSubtotal = Math.ceil(subtotal);
        const totalDiscountRub = Math.ceil(subtotal - total);
        if (hasAnyDiscount) { 
            cartTotalDiv.innerHTML = `<span class="strikethrough">${roundedSubtotal} ₽</span> ${roundedTotal} ₽ (скидка ${totalDiscountRub} ₽)`; 
        } else { 
            cartTotalDiv.innerHTML = `🍌 Итого: ${roundedTotal} ₽`; 
        }
    }
    
    if (cartActionsDiv && totalPositiveCount > 0) cartActionsDiv.style.display = 'flex';
    else if (cartActionsDiv) cartActionsDiv.style.display = 'none';
    
    // Обработчик чекбокса оплаты
    const paymentCheckbox = document.getElementById('paymentTypeCheckbox');
    if (paymentCheckbox) {
        const newCheckbox = paymentCheckbox.cloneNode(true);
        paymentCheckbox.parentNode.replaceChild(newCheckbox, paymentCheckbox);
        
        newCheckbox.addEventListener('change', function(e) {
            currentPaymentType = e.target.checked ? 'transfer' : 'cash';
            updateCartUI();
        });
    }
    
    updateCardBadges();
}

function addToCart(id) {
    const card = originalCardsData.find(c => c.id === id);
    if (!card) return;
    if (card.stock <= 0) { 
        const displayName = getCartItemDisplayName(card);
        showToast(`${displayName} закончился!`, false); 
        return; 
    }
    const currentQty = cart[id] || 0;
    if (currentQty + 1 > card.stock) { 
        showToast(`Нельзя добавить больше, чем есть (${card.stock} шт)`, false); 
        return; 
    }
    cart[id] = currentQty + 1;
    updateCartUI();
    const displayName = getCartItemDisplayName(card);
    showToast(`${displayName} +1`, true);
}

function changeCartQty(id, delta) {
    const card = originalCardsData.find(c => c.id === id);
    if (!card) return;
    const currentQty = cart[id] || 0;
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    if (newQty > card.stock) { 
        showToast(`Нельзя добавить больше, чем есть (${card.stock} шт)`, false); 
        return; 
    }
    if (newQty === 0) {
        delete cart[id];
        if (cartBookingMap && cartBookingMap[id] && cartBookingMap[id].length > 0) {
            for (const bookingId of cartBookingMap[id]) {
                const booking = bookings.find(b => b.id == bookingId);
                if (booking && booking.status === "in_cart") {
                    booking.status = "active";
                    saveBookings();
                    if (typeof renderBookingsList === 'function') {
                        renderBookingsList();
                    }
                }
            }
            delete cartBookingMap[id];
        }
    } else {
        cart[id] = newQty;
    }
    updateCartUI();
}

function removeFromCart(id) {
    delete cart[id];
    
    if (cartBookingMap && cartBookingMap[id] && cartBookingMap[id].length > 0) {
        for (const bookingId of cartBookingMap[id]) {
            const booking = bookings.find(b => b.id == bookingId);
            if (booking && booking.status === "in_cart") {
                booking.status = "active";
                saveBookings();
                if (typeof renderBookingsList === 'function') {
                    renderBookingsList();
                }
            }
        }
        delete cartBookingMap[id];
    }
    
    updateCartUI();
    const card = originalCardsData.find(c => c.id === id);
    if (card) {
        const displayName = getCartItemDisplayName(card);
        showToast(`${displayName} удалён из корзины`, true);
    }
}

function clearCart() {
    if (cartBookingMap) {
        for (const [idStr, bookingIds] of Object.entries(cartBookingMap)) {
            for (const bookingId of bookingIds) {
                const booking = bookings.find(b => b.id == bookingId);
                if (booking && booking.status === "in_cart") {
                    booking.status = "active";
                    saveBookings();
                }
            }
        }
        for (const id in cartBookingMap) {
            delete cartBookingMap[id];
        }
    }
    
    cart = {};
    itemDiscounts = {};
    selectedDiscountProducts.clear();
    updateCartUI();
    if (typeof renderBookingsList === 'function') {
        renderBookingsList();
    }
    showToast(`Корзина очищена`, true);
}

function giftCart() {
    const items = Object.entries(cart).filter(([_, qty]) => qty > 0);
    if (items.length === 0) { showToast("Нет товаров для подарка", false); return; }
    for (const [idStr, qty] of items) {
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        if (qty > card.stock) { 
            const displayName = getCartItemDisplayName(card);
            showToast(`Не хватает "${displayName}" (нужно ${qty}, есть ${card.stock})`, false); 
            return; 
        }
    }
    
    // Обогащаем элементы истории полными названиями
    const historyItems = items.map(([idStr, qty]) => { 
        const id = parseInt(idStr); 
        const card = originalCardsData.find(c => c.id === id);
        const fullName = getFullNameForHistory(card.name, card.type, card.attribute1 || "", card.attribute2 || "");
        return { id: card.id, name: card.name, qty: qty, price: 0, fullName: fullName }; 
    });
    addToHistory(historyItems, 0, 'gift', false, 'cash');
    const cartCopy = { ...cart };
    closeCartModal();
    cart = {};
    itemDiscounts = {};
    selectedDiscountProducts.clear();
    if (cartBookingMap) {
        for (const id in cartBookingMap) {
            delete cartBookingMap[id];
        }
    }
    updateCartUI();
    for (const [idStr, qty] of Object.entries(cartCopy)) {
        if (qty === 0) continue;
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        const newStock = card.stock - qty;
        card.stock = newStock;
        const cards = document.querySelectorAll('.card');
        let targetCard = null;
        for (let i = 0; i < cards.length; i++) {
            const idAttr = cards[i].getAttribute('data-id');
            if (idAttr && parseInt(idAttr) === id) { targetCard = cards[i]; break; }
        }
        if (targetCard) {
            const stockSpan = targetCard.querySelector('.stock');
            if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
            if (newStock === 0) targetCard.classList.add('out-of-stock');
            else targetCard.classList.remove('out-of-stock');
        }
    }
    (async () => {
        for (const [idStr, qty] of Object.entries(cartCopy)) {
            if (qty === 0) continue;
            const id = parseInt(idStr);
            for (let i = 0; i < qty; i++) {
                if (!isOnline) {
                    addPendingOperation("update", `&id=${id}&delta=-1`);
                } else {
                    try { await fetch(buildApiUrl("update", `&id=${id}&delta=-1`)); } catch(e) { addPendingOperation("update", `&id=${id}&delta=-1`); }
                }
            }
        }
        showUpdateTime();
    })();
    showToast(`Подарок оформлен!`, true);
}

function openCartModal() {
    const modal = document.getElementById('cartModal');
    if (modal) { modal.style.display = 'block'; discountPanelOpen = false; }
    updateCartUI();
}

function closeCartModal() { 
    const modal = document.getElementById('cartModal'); 
    if (modal) modal.style.display = 'none'; 
}

async function updateStock(id, delta, silent = false) {
    const card = originalCardsData.find(c => c.id === id);
    if (!card) return;
    const newStock = card.stock + delta;
    if (newStock < 0) { if (!silent) showToast("Остаток не может быть меньше 0", false); return; }
    card.stock = newStock;
    filterAndSort();
    
    // Получаем полное название для истории
    const fullName = getFullNameForHistory(card.name, card.type, card.attribute1 || "", card.attribute2 || "");
    
    if (!isOnline) {
        addPendingOperation("update", `&id=${id}&delta=${delta}`);
        updateCardBadges();
        if (!silent) {
            if (delta === -1) { 
                addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price, fullName: fullName }, 1, false); 
                showToast(`Продажа: ${fullName} -1 шт (будет синхронизировано)`, true); 
            }
            else if (delta === 1) { 
                addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price, fullName: fullName }, 1, true); 
                showToast(`Возврат: ${fullName} +1 шт (будет синхронизировано)`, true); 
            }
        }
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("update", `&id=${id}&delta=${delta}`));
        const result = await response.json();
        if (!result.success && !silent) { await loadData(true, true); showToast("Ошибка: " + (result.error || "неизвестная"), false); }
    } catch (error) {
        console.error(error);
        addPendingOperation("update", `&id=${id}&delta=${delta}`);
        if (!silent) showToast(`Операция сохранена для синхронизации`, true);
    }
    updateCardBadges();
    if (!silent) {
        if (delta === -1) { 
            addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price, fullName: fullName }, 1, false); 
            showToast(`Продажа: ${fullName} -1 шт`, true); 
        }
        else if (delta === 1) { 
            addSingleSaleToHistory({ id: card.id, name: card.name, price: card.price, fullName: fullName }, 1, true); 
            showToast(`Возврат: ${fullName} +1 шт`, true); 
        }
    }
}

async function checkout() {
    const items = Object.entries(cart).filter(([_, qty]) => qty > 0);
    if (items.length === 0) { showToast("Нет товаров для продажи", false); return; }
    let subtotal = 0;
    for (const [idStr, qty] of items) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); subtotal += qty * card.price; }
    let total = 0;
    for (const [idStr, qty] of items) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); const best = getBestDiscountForItem(id, card.price, qty, subtotal); total += best.price * qty; }
    for (const [idStr, qty] of items) { const id = parseInt(idStr); const card = originalCardsData.find(c => c.id === id); if (qty > card.stock) { 
        const displayName = getCartItemDisplayName(card);
        showToast(`Не хватает "${displayName}" (нужно ${qty}, есть ${card.stock})`, false); 
        return; 
    } }
    
    let activeRules = getActiveRulesFiltered();
    if (activeRules.length > 0) { 
        let rulesMessage = "Не забудьте:\n"; 
        for (const rule of activeRules) rulesMessage += `• ${rule.message}\n`; 
        showToast(rulesMessage, true); 
    }
    
    // Обогащаем элементы истории полными названиями с атрибутами
    const historyItems = items.map(([idStr, qty]) => { 
        const id = parseInt(idStr); 
        const card = originalCardsData.find(c => c.id === id);
        const fullName = getFullNameForHistory(card.name, card.type, card.attribute1 || "", card.attribute2 || "");
        return { id: card.id, name: card.name, qty: qty, price: card.price, fullName: fullName }; 
    });
    const roundedTotal = Math.floor(total);
    addToHistory(historyItems, roundedTotal, 'basket', false, currentPaymentType);
    const cartCopy = { ...cart };
    closeCartModal();
    cart = {};
    itemDiscounts = {};
    selectedDiscountProducts.clear();
    
    if (cartBookingMap) {
        for (const [idStr, bookingIds] of Object.entries(cartBookingMap)) {
            for (const bookingId of bookingIds) {
                if (typeof removeBookingFromCartAfterCheckout === 'function') {
                    removeBookingFromCartAfterCheckout(bookingId);
                }
            }
        }
        for (const id in cartBookingMap) {
            delete cartBookingMap[id];
        }
    }
    
    // Сбрасываем тип оплаты на наличные после продажи
    currentPaymentType = 'cash';
    
    updateCartUI();
    for (const [idStr, qty] of Object.entries(cartCopy)) {
        if (qty === 0) continue;
        const id = parseInt(idStr);
        const card = originalCardsData.find(c => c.id === id);
        const newStock = card.stock - qty;
        card.stock = newStock;
        const cards = document.querySelectorAll('.card');
        let targetCard = null;
        for (let i = 0; i < cards.length; i++) {
            const idAttr = cards[i].getAttribute('data-id');
            if (idAttr && parseInt(idAttr) === id) { targetCard = cards[i]; break; }
        }
        if (targetCard) {
            const stockSpan = targetCard.querySelector('.stock');
            if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
            if (newStock === 0) targetCard.classList.add('out-of-stock');
            else targetCard.classList.remove('out-of-stock');
        }
    }
    (async () => {
        for (const [idStr, qty] of Object.entries(cartCopy)) {
            if (qty === 0) continue;
            const id = parseInt(idStr);
            for (let i = 0; i < qty; i++) {
                if (!isOnline) {
                    addPendingOperation("update", `&id=${id}&delta=-1`);
                } else {
                    try { await fetch(buildApiUrl("update", `&id=${id}&delta=-1`)); } catch(e) { addPendingOperation("update", `&id=${id}&delta=-1`); }
                }
            }
        }
        showUpdateTime();
    })();
    showToast(`Продажа на ${roundedTotal} ₽ завершена!`, true);
}

// Экспортируем функцию в глобальную область
window.getCartItemDisplayName = getCartItemDisplayName;
