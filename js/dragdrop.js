// ========== ПОЛЬЗОВАТЕЛЬСКИЙ ПОРЯДОК ==========
function saveCustomOrder() {
    const order = [];
    document.querySelectorAll('#cards-container .card').forEach(card => {
        const idAttr = card.getAttribute('data-id');
        if (idAttr) {
            const id = parseInt(idAttr);
            order.push(id);
        }
    });
    if (order.length === originalCardsData.length) {
        customOrder = order;
        localStorage.setItem('merch_custom_order', JSON.stringify(customOrder));
        syncCustomOrderToServer();
    }
}

async function syncCustomOrderToServer() {
    if (!isOnline) {
        addPendingOperation("syncCustomOrder", `&data=${encodeURIComponent(JSON.stringify(customOrder))}`);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(customOrder));
        await fetch(buildApiUrl("syncCustomOrder", `&data=${data}`));
    } catch(e) {
        console.error(e);
        addPendingOperation("syncCustomOrder", `&data=${encodeURIComponent(JSON.stringify(customOrder))}`);
    }
}

async function loadCustomOrderFromServer() {
    if (!isOnline) {
        loadCustomOrder();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getCustomOrder"));
        const data = await response.json();
        if (data && data.order && Array.isArray(data.order)) {
            customOrder = data.order;
            localStorage.setItem('merch_custom_order', JSON.stringify(customOrder));
            return true;
        }
        return false;
    } catch(e) {
        return false;
    }
}

function loadCustomOrder() {
    const saved = localStorage.getItem('merch_custom_order');
    if (saved) {
        try {
            customOrder = JSON.parse(saved);
        } catch(e) {
            customOrder = [];
        }
    } else {
        customOrder = [];
    }
}

async function initCustomOrder() {
    const loaded = await loadCustomOrderFromServer();
    if (!loaded) loadCustomOrder();
    return customOrder;
}

function applyCustomOrder(data) {
    if (!customOrder.length || customOrder.length !== data.length) return data;
    const ordered = [];
    for (const id of customOrder) {
        const found = data.find(card => card.id === id);
        if (found) ordered.push(found);
    }
    for (const item of data) {
        if (!ordered.find(c => c.id === item.id)) ordered.push(item);
    }
    return ordered;
}

// ========== DRAG & DROP ==========
function dragStartHandler(e, index) {
    if (currentSortBy !== 'custom') return;
    dragStartIndex = index;
    const card = e.target.closest('.card');
    if (card) {
        card.classList.add('dragging');
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', index);
        }
    }
}

function dragEndHandler(e) {
    const card = e.target.closest('.card');
    if (card) card.classList.remove('dragging');
    dragStartIndex = null;
}

function dragOverHandler(e) {
    if (currentSortBy !== 'custom') return;
    e.preventDefault();
    const card = e.target.closest('.card');
    if (card && dragStartIndex !== null) card.classList.add('drag-over');
}

function dragLeaveHandler(e) {
    const card = e.target.closest('.card');
    if (card) card.classList.remove('drag-over');
}

function dropHandler(e, dropIndex) {
    if (currentSortBy !== 'custom') return;
    e.preventDefault();
    const card = e.target.closest('.card');
    if (card) card.classList.remove('drag-over');
    if (dragStartIndex !== null && dragStartIndex !== dropIndex) {
        const cards = [...currentFilteredData];
        const [movedCard] = cards.splice(dragStartIndex, 1);
        cards.splice(dropIndex, 0, movedCard);
        currentFilteredData = cards;
        renderCards();
        const newOrder = [];
        currentFilteredData.forEach(card => {
            newOrder.push(card.id);
        });
        customOrder = newOrder;
        localStorage.setItem('merch_custom_order', JSON.stringify(customOrder));
        syncCustomOrderToServer();
    }
    dragStartIndex = null;
}
