// ========== БРОНИРОВАНИЯ ==========
// Переменные объявлены в config.js: bookings, currentBookingProducts, currentViewingBookingId, cartBookingMap

let bookingsLoaded = false;

function saveBookingsToLocal() {
    localStorage.setItem('merch_bookings', JSON.stringify(bookings));
}

function loadBookingsFromLocal() {
    const saved = localStorage.getItem('merch_bookings');
    if (saved) {
        try {
            bookings = JSON.parse(saved);
        } catch(e) {
            bookings = [];
        }
    } else {
        bookings = [];
    }
    return bookings;
}

async function syncFullBookingsToServer() {
    if (!isOnline) {
        addPendingOperation("syncFullBookings", bookings);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(bookings));
        const response = await fetch(buildApiUrl("syncFullBookings", `&data=${data}`));
        const result = await response.json();
        if (!result.success) {
            addPendingOperation("syncFullBookings", bookings);
        }
    } catch(e) {
        console.error(e);
        addPendingOperation("syncFullBookings", bookings);
    }
}

async function loadBookingsFromServer() {
    if (!isOnline) {
        loadBookingsFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getFullBookings"));
        const data = await response.json();
        if (data && data.bookings) {
            bookings = data.bookings;
            saveBookingsToLocal();
            return true;
        }
        return false;
    } catch(e) {
        console.error(e);
        return false;
    }
}

async function loadBookings(forceReload = false) {
    if (!forceReload && bookingsLoaded && bookings.length > 0) {
        return bookings;
    }
    const loaded = await loadBookingsFromServer();
    if (!loaded) loadBookingsFromLocal();
    bookingsLoaded = true;
    return bookings;
}

function saveBookings() {
    saveBookingsToLocal();
    syncFullBookingsToServer();
}

// Получить отображаемое имя товара с атрибутами для селектора бронирования
function getBookingProductDisplayName(card) {
    let displayText = `${card.type} ${card.name}`;
    const attr1 = card.attribute1 || "";
    const attr2 = card.attribute2 || "";
    if (attr1 || attr2) {
        const attrs = [];
        if (attr1) attrs.push(attr1);
        if (attr2) attrs.push(attr2);
        displayText += ` (${attrs.join(" | ")})`;
    }
    displayText += ` — ${card.price} ₽, в наличии: ${card.stock} шт`;
    return displayText;
}

// Получить отображаемое имя товара с атрибутами для таблицы деталей бронирования
function getBookingItemDisplayName(item) {
    let displayText = item.name;
    // Пытаемся найти карточку, чтобы получить атрибуты
    const card = originalCardsData.find(c => c.id === item.id);
    if (card) {
        const attr1 = card.attribute1 || "";
        const attr2 = card.attribute2 || "";
        if (attr1 || attr2) {
            const attrs = [];
            if (attr1) attrs.push(attr1);
            if (attr2) attrs.push(attr2);
            displayText += ` (${attrs.join(" | ")})`;
        }
    }
    return displayText;
}

function addBooking(nickname, items) {
    const booking = {
        id: Date.now() + Math.random(),
        nickname: nickname.trim(),
        date: new Date().toISOString(),
        items: items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            qty: item.qty,
            price: item.price,
            cost: item.cost || 0,
            attribute1: item.attribute1 || "",
            attribute2: item.attribute2 || ""
        })),
        status: "active"
    };
    
    // Списываем товары со склада
    for (const item of items) {
        const card = originalCardsData.find(c => c.id === item.id);
        if (card) {
            const newStock = card.stock - item.qty;
            if (newStock < 0) {
                showToast(`Недостаточно товара "${card.name}" для бронирования`, false);
                return false;
            }
            card.stock = newStock;
            
            // Обновляем DOM
            const cardElement = document.querySelector(`.card[data-id="${item.id}"]`);
            if (cardElement) {
                const stockSpan = cardElement.querySelector('.stock');
                if (stockSpan) stockSpan.textContent = `Остаток: ${newStock} шт`;
                if (newStock === 0) cardElement.classList.add('out-of-stock');
                else cardElement.classList.remove('out-of-stock');
            }
            
            // Отправляем обновление на сервер
            if (isOnline) {
                fetch(buildApiUrl("update", `&id=${item.id}&delta=-${item.qty}`)).catch(e => {
                    addPendingOperation("update", { id: item.id, delta: -item.qty });
                });
            } else {
                addPendingOperation("update", { id: item.id, delta: -item.qty });
            }
        }
    }
    
    bookings.unshift(booking);
    if (bookings.length > 100) bookings = bookings.slice(0, 100);
    saveBookings();
    showToast(`Бронирование для "${nickname}" создано`, true);
    return true;
}

async function cancelBooking(bookingId, restoreStock = true) {
    const booking = bookings.find(b => b.id == bookingId);
    if (!booking) return false;
    
    if (restoreStock) {
        // Восстанавливаем остатки на складе
        for (const item of booking.items) {
            const card = originalCardsData.find(c => c.id === item.id);
            if (card) {
                card.stock += item.qty;
                const cardElement = document.querySelector(`.card[data-id="${item.id}"]`);
                if (cardElement) {
                    const stockSpan = cardElement.querySelector('.stock');
                    if (stockSpan) stockSpan.textContent = `Остаток: ${card.stock} шт`;
                    if (card.stock === 0) cardElement.classList.add('out-of-stock');
                    else cardElement.classList.remove('out-of-stock');
                }
                
                if (isOnline) {
                    fetch(buildApiUrl("update", `&id=${item.id}&delta=+${item.qty}`)).catch(e => {
                        addPendingOperation("update", { id: item.id, delta: +item.qty });
                    });
                } else {
                    addPendingOperation("update", { id: item.id, delta: +item.qty });
                }
            }
        }
    }
    
    if (!isOnline) {
        addPendingOperation("cancelBooking", { id: bookingId, restoreStock: restoreStock });
        booking.status = "cancelled";
        saveBookings();
        renderBookingsList();
        if (restoreStock) {
            showToast("Бронирование отменено, товары возвращены на склад", true);
        }
        return true;
    }
    
    try {
        const response = await fetch(buildApiUrl("cancelBooking", `&id=${bookingId}&restoreStock=${restoreStock}`));
        const result = await response.json();
        if (result.success) {
            booking.status = "cancelled";
            saveBookings();
            renderBookingsList();
            if (restoreStock) {
                showToast("Бронирование отменено, товары возвращены на склад", true);
            }
            return true;
        } else {
            showToast("Ошибка отмены: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error(e);
        addPendingOperation("cancelBooking", { id: bookingId, restoreStock: restoreStock });
        booking.status = "cancelled";
        saveBookings();
        renderBookingsList();
        if (restoreStock) {
            showToast("Бронирование будет отменено при восстановлении соединения", true);
        }
        return true;
    }
}

function moveBookingToCart(bookingId) {
    const booking = bookings.find(b => b.id == bookingId);
    if (!booking) return;
    
    // Добавляем товары в корзину с пометкой о бронировании
    for (const item of booking.items) {
        const currentQty = cart[item.id] || 0;
        cart[item.id] = currentQty + item.qty;
        
        // Сохраняем информацию о том, что этот товар из бронирования
        if (!cartBookingMap[item.id]) {
            cartBookingMap[item.id] = [];
        }
        if (!cartBookingMap[item.id].includes(bookingId)) {
            cartBookingMap[item.id].push(bookingId);
        }
    }
    
    // Отмечаем бронь как перенесённую в корзину, но не удаляем
    booking.status = "in_cart";
    saveBookings();
    updateCartUI();
    closeBookingsModal();
    openCartModal();
    showToast("Товары из бронирования добавлены в корзину", true);
}

function removeBookingFromCartAfterCheckout(bookingId) {
    const booking = bookings.find(b => b.id == bookingId);
    if (booking && (booking.status === "in_cart" || booking.status === "active")) {
        booking.status = "completed";
        saveBookings();
        renderBookingsList();
    }
}

function renderBookingsList() {
    const container = document.getElementById('bookings-content');
    if (!container) return;
    
    const activeBookings = bookings.filter(b => b.status === "active" || b.status === "in_cart");
    
    let html = '';
    
    // Форма добавления нового бронирования (сверху)
    html += `<div class="add-booking-form" style="margin-bottom: 20px; padding: 16px; background: var(--badge-bg); border-radius: 16px;">
        <div style="font-weight: bold; margin-bottom: 12px; color: var(--badge-text);">➕ Новое бронирование</div>
        <div class="edit-row" style="margin-bottom: 12px;">
            <span class="edit-label" style="color: var(--text-primary);">Ник покупателя</span>
            <input type="text" id="bookingNickname" class="edit-input" placeholder="Введите ник" style="flex: 2;">
        </div>
        <div class="edit-row" style="margin-bottom: 12px; flex-wrap: wrap;">
            <span class="edit-label" style="min-width: 80px; color: var(--text-primary);">Товары</span>
            <div style="flex: 2;">
                <div class="discount-custom-select">
                    <div class="discount-custom-select-trigger" id="bookingProductSelectTrigger" onclick="toggleBookingProductSelect()" style="background: var(--card-bg); color: var(--text-primary);">📦 Выберите товары</div>
                    <div class="discount-custom-select-dropdown" id="bookingProductSelectDropdown" style="max-height: 250px; overflow-y: auto; width: 100%; min-width: 280px;"></div>
                </div>
            </div>
        </div>
        <div id="selectedBookingProductsList" style="margin-bottom: 12px; padding: 8px; background: var(--card-bg); border-radius: 12px;"></div>
        <button class="edit-save-btn" onclick="createBooking()" style="width: auto; padding: 8px 24px; background: var(--btn-bg); color: white; border: none; border-radius: 30px; cursor: pointer;">📦 Забронировать</button>
    </div>`;
    
    // Список клиентов с активными бронями
    if (activeBookings.length > 0) {
        html += `<div class="bookings-nicknames" style="display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                    <div style="width: 100%; font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">👤 Клиенты, забронировавшие товары:</div>`;
        for (const booking of activeBookings) {
            let statusText = "";
            let statusStyle = "";
            if (booking.status === "in_cart") {
                statusText = " (в корзине)";
                statusStyle = "opacity: 0.7;";
            }
            html += `<button class="booking-nickname-btn" onclick="viewBookingDetails(${booking.id})" style="display: inline-block; white-space: nowrap; background: ${currentViewingBookingId === booking.id ? 'var(--btn-bg)' : 'var(--badge-bg)'}; border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 20px; font-size: 13px; cursor: pointer; color: ${currentViewingBookingId === booking.id ? 'white' : 'var(--text-primary)'}; width: auto; min-width: fit-content; ${statusStyle}">
                            ${escapeHtml(booking.nickname)}${statusText}
                        </button>`;
        }
        html += `</div>`;
    }
    
    // Детали выбранного бронирования
    if (currentViewingBookingId) {
        const booking = bookings.find(b => b.id == currentViewingBookingId);
        if (booking && (booking.status === "active" || booking.status === "in_cart")) {
            const date = new Date(booking.date);
            const dateStr = date.toLocaleString('ru-RU');
            let total = 0;
            for (const item of booking.items) {
                total += item.price * item.qty;
            }
            
            const isInCart = booking.status === "in_cart";
            
            html += `<div class="booking-details" style="margin-top: 20px;">
                <div class="detail-title" style="color: var(--badge-text);">📋 Бронирование: ${escapeHtml(booking.nickname)} (${dateStr})${isInCart ? ' — в корзине' : ''}</div>
                <div class="table-wrapper">
                    <table class="detail-table-small" style="width: 100%;">
                        <thead>
                            <tr><th>Товар</th><th>Тип</th><th>Характеристики</th><th class="text-right">Кол-во</th><th class="text-right">Цена</th><th class="text-right">Сумма</th>
                        </thead>
                        <tbody>`;
            for (const item of booking.items) {
                const sum = item.price * item.qty;
                // Формируем атрибуты для отображения
                let attributesText = "";
                const attr1 = item.attribute1 || "";
                const attr2 = item.attribute2 || "";
                if (attr1 || attr2) {
                    const attrs = [];
                    if (attr1) attrs.push(attr1);
                    if (attr2) attrs.push(attr2);
                    attributesText = attrs.join(" | ");
                } else {
                    attributesText = "—";
                }
                html += `<tr>
                            <td>${escapeHtml(item.name)}</td>
                            <td><span class="type-badge" style="background:${getTypeColor(item.type)}20; color:${getTypeColor(item.type)};">${escapeHtml(item.type)}</span></td>
                            <td style="font-size: 11px; color: var(--text-muted);">${escapeHtml(attributesText)}</td>
                            <td class="text-right">${item.qty} шт</td>
                            <td class="text-right">${item.price} ₽</td>
                            <td class="text-right">${sum} ₽</td>
                        </tr>`;
            }
            html += `<tr style="border-top: 2px solid var(--border-color); font-weight: bold;">
                        <td colspan="5" class="text-right">Итого:</td>
                        <td class="text-right">${total} ₽</td>
                      </tr>`;
            html += `</tbody>
                    </table>
                </div>
                <div class="edit-buttons" style="margin-top: 16px; display: flex; justify-content: flex-end; gap: 12px;">
                    <button class="edit-cancel-btn" onclick="cancelBooking(${booking.id}, true)" style="background: var(--minus-bg); color: var(--minus-color); border: 1px solid var(--border-color); border-radius: 30px; padding: 8px 16px; cursor: pointer;">❌ Отменить бронь</button>
                    ${!isInCart ? `<button class="edit-save-btn" onclick="moveBookingToCart(${booking.id})" style="background: var(--btn-bg); color: white; border: none; border-radius: 30px; padding: 8px 16px; cursor: pointer;">🛒 В корзину</button>` : ''}
                </div>
            </div>`;
        }
    }
    
    if (activeBookings.length === 0 && !currentViewingBookingId) {
        html += `<div class="empty-cart" style="margin-top: 20px; color: var(--text-muted);">📭 Нет активных бронирований. Создайте новое!</div>`;
    }
    
    container.innerHTML = html;
    
    renderBookingProductSelect();
    renderSelectedBookingProducts();
}

function renderBookingProductSelect() {
    const container = document.getElementById('bookingProductSelectDropdown');
    if (!container) return;
    
    let html = '';
    originalCardsData.forEach(card => {
        if (card.stock > 0) {
            const displayName = getBookingProductDisplayName(card);
            const product = currentBookingProducts.get(card.id);
            const qtyInCart = product?.qty || 0;
            html += `<div class="product-select-item" onclick="toggleBookingProduct(${card.id}, '${escapeHtml(card.name)}', '${escapeHtml(card.type)}', ${card.price}, ${card.cost || 0}, '${escapeHtml(card.attribute1 || "")}', '${escapeHtml(card.attribute2 || "")}')" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; cursor: pointer; border-bottom: 1px solid var(--border-color);">
                        <div style="flex: 1;">
                            <div style="color: var(--text-primary);">${escapeHtml(displayName)}</div>
                        </div>
                        ${qtyInCart > 0 ? `<div style="display: flex; align-items: center; gap: 8px;">
                            <button class="cart-qty-btn" onclick="event.stopPropagation(); changeBookingProductQty(${card.id}, -1)" style="width: 28px; height: 28px; background: var(--badge-bg); color: var(--text-primary);">−</button>
                            <span style="min-width: 30px; text-align: center; color: var(--text-primary);">${qtyInCart}</span>
                            <button class="cart-qty-btn" onclick="event.stopPropagation(); changeBookingProductQty(${card.id}, 1)" style="width: 28px; height: 28px; background: var(--badge-bg); color: var(--text-primary);">+</button>
                        </div>` : '<span style="color: var(--text-muted);">➕ Выбрать</span>'}
                    </div>`;
        }
    });
    container.innerHTML = html || '<div class="product-select-item" style="color: var(--text-muted); padding: 12px; text-align: center;">Нет доступных товаров</div>';
}

function toggleBookingProductSelect() {
    const dropdown = document.getElementById('bookingProductSelectDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
        // Для мобильной версии добавляем центрирование
        if (window.innerWidth <= 500) {
            dropdown.style.position = 'fixed';
            dropdown.style.top = '50%';
            dropdown.style.left = '50%';
            dropdown.style.transform = 'translate(-50%, -50%)';
            dropdown.style.width = '90%';
            dropdown.style.maxWidth = '320px';
            dropdown.style.maxHeight = '70vh';
            dropdown.style.zIndex = '2000';
        } else {
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.left = '0';
            dropdown.style.transform = 'none';
            dropdown.style.width = '100%';
        }
    }
}

function toggleBookingProduct(id, name, type, price, cost, attribute1, attribute2) {
    if (currentBookingProducts.has(id)) {
        currentBookingProducts.delete(id);
    } else {
        const card = originalCardsData.find(c => c.id === id);
        if (card && card.stock > 0) {
            currentBookingProducts.set(id, { 
                qty: 1, 
                name: name, 
                type: type, 
                price: price, 
                cost: cost,
                attribute1: attribute1,
                attribute2: attribute2
            });
        } else {
            showToast("Товар временно недоступен", false);
            return;
        }
    }
    renderBookingProductSelect();
    renderSelectedBookingProducts();
}

function changeBookingProductQty(id, delta) {
    const product = currentBookingProducts.get(id);
    if (!product) return;
    const card = originalCardsData.find(c => c.id === id);
    const newQty = product.qty + delta;
    if (newQty < 1) {
        currentBookingProducts.delete(id);
    } else if (card && newQty <= card.stock) {
        product.qty = newQty;
        currentBookingProducts.set(id, product);
    } else {
        showToast(`Нельзя забронировать больше, чем есть (${card.stock} шт)`, false);
        return;
    }
    renderBookingProductSelect();
    renderSelectedBookingProducts();
}

function renderSelectedBookingProducts() {
    const container = document.getElementById('selectedBookingProductsList');
    if (!container) return;
    
    if (currentBookingProducts.size === 0) {
        container.innerHTML = '<div style="color: var(--text-muted); font-size: 13px; padding: 8px;">📦 Товары не выбраны</div>';
        return;
    }
    
    let html = '<div style="font-size: 13px; font-weight: bold; margin-bottom: 8px; color: var(--badge-text);">Выбранные товары:</div>';
    for (const [id, product] of currentBookingProducts) {
        // Формируем отображаемое имя с атрибутами
        let displayName = `${product.type} ${product.name}`;
        if (product.attribute1 || product.attribute2) {
            const attrs = [];
            if (product.attribute1) attrs.push(product.attribute1);
            if (product.attribute2) attrs.push(product.attribute2);
            displayName += ` (${attrs.join(" | ")})`;
        }
        html += `<div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                    <span style="color: var(--text-primary);">${escapeHtml(displayName)}</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <button class="cart-qty-btn" onclick="changeBookingProductQty(${id}, -1)" style="width: 28px; height: 28px; background: var(--badge-bg); color: var(--text-primary);">−</button>
                        <span style="min-width: 30px; text-align: center; color: var(--text-primary);">${product.qty}</span>
                        <button class="cart-qty-btn" onclick="changeBookingProductQty(${id}, 1)" style="width: 28px; height: 28px; background: var(--badge-bg); color: var(--text-primary);">+</button>
                        <button class="cart-item-remove" onclick="toggleBookingProduct(${id})" style="width: 28px; height: 28px; background: none; color: var(--minus-color);">🗑</button>
                    </div>
                </div>`;
    }
    container.innerHTML = html;
}

function createBooking() {
    const nicknameInput = document.getElementById('bookingNickname');
    const nickname = nicknameInput?.value.trim();
    
    if (!nickname) {
        showToast("Введите ник покупателя", false);
        return;
    }
    
    if (currentBookingProducts.size === 0) {
        showToast("Выберите хотя бы один товар", false);
        return;
    }
    
    const items = [];
    for (const [id, product] of currentBookingProducts) {
        const card = originalCardsData.find(c => c.id == id);
        if (card && product.qty <= card.stock) {
            items.push({
                id: id,
                name: product.name,
                type: product.type,
                qty: product.qty,
                price: product.price,
                cost: product.cost,
                attribute1: product.attribute1 || "",
                attribute2: product.attribute2 || ""
            });
        } else {
            showToast(`Недостаточно товара "${product.name}"`, false);
            return;
        }
    }
    
    if (addBooking(nickname, items)) {
        nicknameInput.value = '';
        currentBookingProducts.clear();
        renderSelectedBookingProducts();
        renderBookingProductSelect();
        
        const newBooking = bookings.find(b => b.nickname === nickname && (b.status === "active" || b.status === "in_cart"));
        if (newBooking) {
            currentViewingBookingId = newBooking.id;
        }
        renderBookingsList();
    }
}

function viewBookingDetails(bookingId) {
    currentViewingBookingId = bookingId;
    renderBookingsList();
}

function openBookingsModal() {
    const modal = document.getElementById('bookingsModal');
    if (modal) {
        modal.style.display = 'block';
        loadBookingsFromLocal();
        renderBookingsList();
        loadBookingsFromServer().then(() => {
            renderBookingsList();
        });
    }
}

function closeBookingsModal() {
    const modal = document.getElementById('bookingsModal');
    if (modal) modal.style.display = 'none';
    currentBookingProducts.clear();
    currentViewingBookingId = null;
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    loadBookingsFromLocal();
    
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('bookingProductSelectDropdown');
        const trigger = document.getElementById('bookingProductSelectTrigger');
        if (dropdown && trigger && !trigger.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
});

// Делаем функции глобальными
window.loadBookings = loadBookings;
window.renderBookingsList = renderBookingsList;
window.openBookingsModal = openBookingsModal;
window.closeBookingsModal = closeBookingsModal;
window.createBooking = createBooking;
window.cancelBooking = cancelBooking;
window.moveBookingToCart = moveBookingToCart;
window.removeBookingFromCartAfterCheckout = removeBookingFromCartAfterCheckout;
window.viewBookingDetails = viewBookingDetails;
window.toggleBookingProductSelect = toggleBookingProductSelect;
window.toggleBookingProduct = toggleBookingProduct;
window.changeBookingProductQty = changeBookingProductQty;
window.getBookingProductDisplayName = getBookingProductDisplayName;
window.getBookingItemDisplayName = getBookingItemDisplayName;
