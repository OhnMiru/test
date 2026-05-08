// ========== API ФУНКЦИИ (ПОЛНАЯ ВЕРСИЯ) ==========
console.log("🔧 api.js начал загрузку");

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
function buildApiUrl(action, extraParams = "") {
    if (!window.CURRENT_USER?.id) return "#";
    
    // Добавляем параметр realUser если организатор действует от лица другого пользователя
    let realUserParam = "";
    if (typeof window.getRealUserParam === 'function') {
        realUserParam = window.getRealUserParam();
    }
    
    if (action === "getPhotoUrl" || action === "getComment") {
        return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}${realUserParam}&_=${Date.now()}`;
    }
    return `${window.CENTRAL_API_URL}?action=${action}&participant=${window.CURRENT_USER.id}${extraParams}${realUserParam}&t=${Date.now()}`;
}

// ========== ФУНКЦИИ ДЛЯ ЗАГРУЗКИ КОНФИГУРАЦИИ ТИПОВ МЕРЧА ==========

// Загрузить конфигурацию типов мерча с сервера
async function loadMerchTypesConfig() {
    if (!window.isOnline) {
        // Пробуем загрузить из localStorage
        const saved = localStorage.getItem('merch_types_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                window.merchTypesConfig = config.types || [];
                updateMerchTypesCache();
                window.merchTypesLoaded = true;
                console.log("✅ Конфигурация типов загружена из localStorage:", window.merchTypesConfig.length);
                return true;
            } catch(e) {
                console.error("Ошибка загрузки из localStorage:", e);
            }
        }
        return false;
    }
    
    try {
        const response = await fetch(buildApiUrl("getMerchTypes"));
        const result = await response.json();
        
        if (result && result.types) {
            window.merchTypesConfig = result.types;
            updateMerchTypesCache();
            window.merchTypesLoaded = true;
            
            // Сохраняем в localStorage
            localStorage.setItem('merch_types_config', JSON.stringify({ types: result.types, loaded: Date.now() }));
            
            console.log("✅ Конфигурация типов загружена с сервера:", window.merchTypesConfig.length);
            return true;
        } else {
            console.warn("⚠️ Нет данных о типах мерча");
            return false;
        }
    } catch(e) {
        console.error("Ошибка загрузки конфигурации типов:", e);
        
        // Пробуем загрузить из localStorage при ошибке
        const saved = localStorage.getItem('merch_types_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                window.merchTypesConfig = config.types || [];
                updateMerchTypesCache();
                window.merchTypesLoaded = true;
                console.log("✅ Конфигурация типов загружена из localStorage (fallback):", window.merchTypesConfig.length);
                return true;
            } catch(e2) {
                console.error("Ошибка загрузки из localStorage:", e2);
            }
        }
        return false;
    }
}

// Обновить кэш типов для быстрого доступа
function updateMerchTypesCache() {
    window.merchTypesCache.clear();
    for (const typeConfig of window.merchTypesConfig) {
        if (typeConfig && typeConfig.type) {
            window.merchTypesCache.set(typeConfig.type.toLowerCase(), typeConfig);
        }
    }
}

// Получить конфигурацию для конкретного типа
function getTypeConfigFromCache(typeName) {
    if (!typeName) return null;
    return window.merchTypesCache.get(typeName.toLowerCase()) || null;
}

// Проверить, есть ли у типа атрибуты
function hasAttributesForType(typeName) {
    const config = getTypeConfigFromCache(typeName);
    if (!config) return false;
    return (config.attribute1 && config.attribute1.values && config.attribute1.values.length > 0) ||
           (config.attribute2 && config.attribute2.values && config.attribute2.values.length > 0);
}

// Получить список всех типов мерча
function getAllMerchTypes() {
    return window.merchTypesConfig.map(t => t.type);
}

// ========== ОСНОВНЫЕ ФУНКЦИИ ==========
async function loadData(showLoading = true, showProgress = false) {
    console.log("✅ loadData ВЫЗВАНА!");
    if (window.isLoading) return;
    window.isLoading = true;
    
    const isAutoRefresh = showProgress && !showLoading;
    if (!isAutoRefresh) {
        const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
        if (autoRefreshBadge) { autoRefreshBadge.style.opacity = '0'; autoRefreshBadge.style.visibility = 'hidden'; }
        if (showProgress && typeof showProgressBar === 'function') showProgressBar();
        if (showLoading) { 
            const container = document.getElementById('cards-container'); 
            if (container) container.innerHTML = '<div class="loading">Загрузка бананчиков...</div>'; 
        }
    }
    
    try {
        const response = await fetch(buildApiUrl("get"));
        const data = await response.json();
        console.log("Данные получены:", data?.length || 0);
        
        // Проверяем наличие атрибутов в данных (для обратной совместимости)
        if (data && data.length > 0) {
            // Если у товаров нет полей attribute1/attribute2, добавляем их
            for (const item of data) {
                if (item.attribute1 === undefined) item.attribute1 = "";
                if (item.attribute2 === undefined) item.attribute2 = "";
            }
            window.originalCardsData = data;
            if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showUpdateTime === 'function') window.showUpdateTime();
            if (typeof window.updateCartUI === 'function') window.updateCartUI();
            if (typeof window.loadAllComments === 'function') {
                window.loadAllComments();
            }
        } else if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Нет данных. Проверьте таблицу и лист "Мерч".</div>';
        }
    } catch (error) {
        console.error("loadData error:", error);
        if (showLoading && !isAutoRefresh) {
            const container = document.getElementById('cards-container');
            if (container) container.innerHTML = '<div class="loading">Ошибка загрузки. Проверьте интернет и ссылку.</div>';
        }
    } finally {
        window.isLoading = false;
        if (!isAutoRefresh) {
            if (showProgress && typeof hideProgressBar === 'function') hideProgressBar();
            const autoRefreshBadge = document.querySelector('.auto-refresh-badge');
            if (autoRefreshBadge) { autoRefreshBadge.style.opacity = ''; autoRefreshBadge.style.visibility = ''; }
        }
    }
}

// ОБНОВЛЕНА: добавлены параметры attribute1 и attribute2
async function updateFullItem(id, type, name, stock, total, price, cost, attribute1 = "", attribute2 = "") {
    if (!window.isOnline) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("updateFullItem", { 
                id: id, type: type, name: name, stock: stock, total: total, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        return { success: true, offline: true };
    }
    try {
        const params = `&id=${id}&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&stock=${stock}&total=${total}&price=${price}&cost=${cost}&attribute1=${encodeURIComponent(attribute1)}&attribute2=${encodeURIComponent(attribute2)}`;
        const response = await fetch(buildApiUrl("updateFullItem", params));
        return await response.json();
    } catch(e) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("updateFullItem", { 
                id: id, type: type, name: name, stock: stock, total: total, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        return { success: true, offline: true };
    }
}

// ОБНОВЛЕНА: добавлены параметры attribute1 и attribute2
async function sendAddItemRequest(type, name, total, stock, price, cost, attribute1 = "", attribute2 = "") {
    if (!window.isOnline) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("addItem", { 
                type: type, name: name, total: total, stock: stock, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        const tempId = -Date.now();
        const newItem = { 
            id: tempId, type: type, name: name, total: total, 
            stock: stock, price: price, cost: cost || 0,
            attribute1: attribute1, attribute2: attribute2 
        };
        window.originalCardsData.push(newItem);
        if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
        if (typeof window.filterAndSort === 'function') window.filterAndSort();
        if (typeof window.showToast === 'function') window.showToast(`Товар "${name}" добавлен (будет синхронизирован)`, true);
        return { success: true, offline: true, id: tempId };
    }
    
    try {
        const params = `&type=${encodeURIComponent(type)}&name=${encodeURIComponent(name)}&total=${total}&stock=${stock}&price=${price}&cost=${cost}&attribute1=${encodeURIComponent(attribute1)}&attribute2=${encodeURIComponent(attribute2)}`;
        const response = await fetch(buildApiUrl("addItem", params));
        const result = await response.json();
        if (result.success) {
            const newItem = { 
                id: result.id, type: type, name: name, total: total, 
                stock: stock, price: price, cost: cost || 0,
                attribute1: attribute1, attribute2: attribute2 
            };
            window.originalCardsData.push(newItem);
            if (typeof window.updateTypeOptions === 'function') window.updateTypeOptions();
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showToast === 'function') window.showToast(`Товар "${name}" добавлен!`, true);
        }
        return result;
    } catch(e) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("addItem", { 
                type: type, name: name, total: total, stock: stock, 
                price: price, cost: cost, attribute1: attribute1, attribute2: attribute2 
            });
        }
        return { success: true, offline: true };
    }
}

// ========== ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ ==========

async function loadAllComments() {
    if (!window.isOnline) {
        loadCommentsFromLocal();
        return;
    }
    
    try {
        const response = await fetch(buildApiUrl("getAllComments"));
        const result = await response.json();
        if (result.success && result.comments) {
            window.commentsCache.clear();
            for (const item of result.comments) {
                window.commentsCache.set(item.itemId, {
                    comment: item.comment,
                    lastUpdated: item.lastUpdated
                });
            }
            saveCommentsToLocal();
            if (typeof window.updateCommentIndicators === 'function') {
                window.updateCommentIndicators();
            }
        }
    } catch(e) {
        console.error("Error loading comments:", e);
        loadCommentsFromLocal();
    }
}

async function saveComment(itemId, comment) {
    if (!window.isOnline) {
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("saveComment", { itemId: itemId, comment: comment });
        }
        window.commentsCache.set(itemId, { comment: comment, lastUpdated: new Date().toISOString() });
        saveCommentsToLocal();
        if (typeof window.updateCommentIndicators === 'function') {
            window.updateCommentIndicators();
        }
        if (typeof window.showToast === 'function') window.showToast("Комментарий сохранён локально", true);
        return true;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'saveComment');
        params.append('participant', window.CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('userId', window.CURRENT_USER.id);
        params.append('comment', comment);
        
        // Добавляем realUser если есть
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                const realUserValue = realUserParam.replace('&realUser=', '');
                params.append('realUser', realUserValue);
            }
        }
        
        const response = await fetch(window.CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            window.commentsCache.set(itemId, { comment: comment, lastUpdated: new Date().toISOString() });
            saveCommentsToLocal();
            if (typeof window.updateCommentIndicators === 'function') {
                window.updateCommentIndicators();
            }
            if (typeof window.showToast === 'function') window.showToast("Комментарий сохранён", true);
            return true;
        } else {
            if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Save comment error:", e);
        if (typeof window.addPendingOperation === 'function') {
            window.addPendingOperation("saveComment", { itemId: itemId, comment: comment });
        }
        if (typeof window.showToast === 'function') window.showToast("Комментарий сохранён локально", true);
        return true;
    }
}

async function getComment(itemId) {
    if (window.commentsCache?.has(itemId)) {
        return window.commentsCache.get(itemId);
    }
    
    if (!window.isOnline) {
        return null;
    }
    
    try {
        const response = await fetch(buildApiUrl("getComment", `&itemId=${itemId}&userId=${window.CURRENT_USER.id}`));
        const result = await response.json();
        
        if (result.success && result.comment !== null) {
            window.commentsCache.set(itemId, { comment: result.comment, lastUpdated: result.lastUpdated });
            saveCommentsToLocal();
            return window.commentsCache.get(itemId);
        }
        return null;
    } catch(e) {
        console.error("Error getting comment:", e);
        return null;
    }
}

function saveCommentsToLocal() {
    const commentsObj = {};
    for (const [key, value] of window.commentsCache.entries()) {
        commentsObj[key] = value;
    }
    localStorage.setItem('merch_comments', JSON.stringify(commentsObj));
}

function loadCommentsFromLocal() {
    const saved = localStorage.getItem('merch_comments');
    if (saved) {
        try {
            const commentsObj = JSON.parse(saved);
            window.commentsCache.clear();
            for (const [key, value] of Object.entries(commentsObj)) {
                window.commentsCache.set(parseInt(key), value);
            }
            if (typeof window.updateCommentIndicators === 'function') {
                window.updateCommentIndicators();
            }
        } catch(e) {
            console.error("Error loading comments from localStorage:", e);
        }
    }
}

// ========== ФУНКЦИИ ДЛЯ ПОСТАВКИ ==========

async function addSupply(itemId, quantity) {
    console.log("addSupply called:", itemId, quantity);
    
    if (!window.isOnline) {
        // Офлайн режим - обновляем локально
        const card = window.originalCardsData?.find(c => c.id === itemId);
        if (card) {
            card.total += quantity;
            card.stock += quantity;
            if (typeof window.filterAndSort === 'function') window.filterAndSort();
            if (typeof window.showToast === 'function') window.showToast(`Поставка добавлена локально (${quantity} шт)`, true);
        }
        return true;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'addSupply');
        params.append('participant', window.CURRENT_USER.id);
        params.append('userId', window.CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('quantity', quantity.toString());
        
        // Добавляем realUser если есть
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                const realUserValue = realUserParam.replace('&realUser=', '');
                params.append('realUser', realUserValue);
            }
        }
        
        const response = await fetch(window.CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            const card = window.originalCardsData?.find(c => c.id === itemId);
            if (card) {
                card.total = result.newTotal;
                card.stock = result.newStock;
                if (typeof window.filterAndSort === 'function') window.filterAndSort();
            }
            if (typeof window.showToast === 'function') window.showToast(`Поставка добавлена: +${quantity} шт`, true);
            return true;
        } else {
            if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Add supply error:", e);
        if (typeof window.showToast === 'function') window.showToast("Ошибка при добавлении поставки", false);
        return false;
    }
}

// ========== ФУНКЦИИ ДЛЯ ФОТО ==========

async function getPhotoUrl(itemId) {
    if (!window.isOnline) {
        return null;
    }
    
    if (!itemId) {
        console.error("getPhotoUrl called without itemId");
        return null;
    }
    
    try {
        const url = `${window.CENTRAL_API_URL}?action=getPhotoUrl&participant=${window.CURRENT_USER.id}&itemId=${itemId}&userId=${window.CURRENT_USER.id}&_=${Date.now()}`;
        
        // Добавляем realUser если есть
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                // Параметр уже включает &, поэтому просто добавляем
                window.tempPhotoUrl = url + realUserParam;
                // Используем временную переменную, так как дальше код может быть сложным
            }
        }
        
        const finalUrl = window.tempPhotoUrl || url;
        delete window.tempPhotoUrl;
        
        console.log("🔍 Fetching photo URL:", finalUrl);
        
        const response = await fetch(finalUrl);
        const result = await response.json();
        
        console.log("📸 Photo API response:", result);
        
        if (result.success && result.hasPhoto && result.url) {
            let fileId = null;
            if (result.url.includes('id=')) {
                fileId = result.url.split('id=')[1];
            } else if (result.url.includes('/d/')) {
                fileId = result.url.split('/d/')[1].split('/')[0];
            }
            
            if (fileId) {
                const proxyUrl = `${window.CENTRAL_API_URL}/image?id=${fileId}`;
                console.log("✅ Proxy URL:", proxyUrl);
                
                if (window.photoCache) window.photoCache.set(itemId, proxyUrl);
                return proxyUrl;
            }
            
            if (window.photoCache) window.photoCache.set(itemId, result.url);
            return result.url;
        }
        
        console.log("❌ No photo found for item", itemId);
        return null;
    } catch(e) {
        console.error("Error getting photo:", e);
        return null;
    }
}

async function uploadPhoto(itemId, file) {
    if (!window.isOnline) {
        if (typeof window.showToast === 'function') window.showToast("Загрузка фото доступна только онлайн", false);
        return false;
    }
    
    if (!file.type.startsWith('image/')) {
        if (typeof window.showToast === 'function') window.showToast("Пожалуйста, выберите изображение", false);
        return false;
    }
    
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = async function() {
            try {
                const base64Data = reader.result;
                
                const params = new URLSearchParams();
                params.append('action', 'uploadPhoto');
                params.append('participant', window.CURRENT_USER.id);
                params.append('itemId', itemId.toString());
                params.append('userId', window.CURRENT_USER.id);
                params.append('base64Data', base64Data);
                params.append('fileName', file.name);
                
                // Добавляем realUser если есть
                if (typeof window.getRealUserParam === 'function') {
                    const realUserParam = window.getRealUserParam();
                    if (realUserParam) {
                        const realUserValue = realUserParam.replace('&realUser=', '');
                        params.append('realUser', realUserValue);
                    }
                }
                
                console.log("📤 Загрузка фото:");
                console.log("  - itemId:", itemId);
                console.log("  - userId:", window.CURRENT_USER.id);
                console.log("  - fileName:", file.name);
                console.log("  - fileSize:", (file.size / 1024).toFixed(2), "KB");
                
                const response = await fetch(window.CENTRAL_API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: params.toString()
                });
                
                const result = await response.json();
                
                if (result.success) {
                    console.log("✅ Фото загружено на сервер!");
                    
                    if (typeof window.showToast === 'function') window.showToast("Обработка фото...", true);
                    await new Promise(r => setTimeout(r, 2000));
                    
                    let photoFound = false;
                    for (let attempt = 1; attempt <= 3; attempt++) {
                        console.log(`Попытка получить фото #${attempt}...`);
                        
                        if (window.photoCache) window.photoCache.delete(itemId);
                        
                        let checkUrl = `${window.CENTRAL_API_URL}?action=getPhotoUrl&participant=${window.CURRENT_USER.id}&itemId=${itemId}&userId=${window.CURRENT_USER.id}&_=${Date.now()}`;
                        if (typeof window.getRealUserParam === 'function') {
                            const realUserParam = window.getRealUserParam();
                            if (realUserParam) {
                                checkUrl += realUserParam;
                            }
                        }
                        const checkResponse = await fetch(checkUrl);
                        const checkResult = await checkResponse.json();
                        
                        console.log(`Попытка ${attempt}:`, checkResult);
                        
                        if (checkResult.success && checkResult.hasPhoto && checkResult.url) {
                            photoFound = true;
                            let fileId = null;
                            if (checkResult.url.includes('id=')) {
                                fileId = checkResult.url.split('id=')[1];
                            }
                            if (fileId) {
                                const proxyUrl = `https://szhech-belochek.pages.dev/api/image?id=${fileId}`;
                                if (window.photoCache) window.photoCache.set(itemId, proxyUrl);
                            }
                            break;
                        }
                        
                        if (attempt < 3) await new Promise(r => setTimeout(r, 1500));
                    }
                    
                    if (photoFound) {
                        if (typeof window.showToast === 'function') window.showToast("Фото загружено", true);
                        resolve(true);
                    } else {
                        if (typeof window.showToast === 'function') window.showToast("Фото загружено, но не отображается. Обновите страницу.", false);
                        resolve(true);
                    }
                } else {
                    console.error("❌ Ошибка:", result.error);
                    if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
                    resolve(false);
                }
            } catch(e) {
                console.error("Upload error:", e);
                if (typeof window.showToast === 'function') window.showToast("Ошибка: " + e.message, false);
                resolve(false);
            }
        };
        reader.onerror = function() {
            if (typeof window.showToast === 'function') window.showToast("Ошибка чтения файла", false);
            resolve(false);
        };
        reader.readAsDataURL(file);
    });
}

async function deletePhoto(itemId) {
    if (!window.isOnline) {
        if (typeof window.showToast === 'function') window.showToast("Удаление фото доступно только онлайн", false);
        return false;
    }
    
    try {
        const params = new URLSearchParams();
        params.append('action', 'deletePhoto');
        params.append('participant', window.CURRENT_USER.id);
        params.append('itemId', itemId.toString());
        params.append('userId', window.CURRENT_USER.id);
        
        // Добавляем realUser если есть
        if (typeof window.getRealUserParam === 'function') {
            const realUserParam = window.getRealUserParam();
            if (realUserParam) {
                const realUserValue = realUserParam.replace('&realUser=', '');
                params.append('realUser', realUserValue);
            }
        }
        
        const response = await fetch(window.CENTRAL_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: params.toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            if (window.photoCache) window.photoCache.delete(itemId);
            if (typeof window.showToast === 'function') window.showToast("Фото удалено", true);
            return true;
        } else {
            if (typeof window.showToast === 'function') window.showToast("Ошибка: " + (result.error || "неизвестная"), false);
            return false;
        }
    } catch(e) {
        console.error("Delete error:", e);
        if (typeof window.showToast === 'function') window.showToast("Ошибка удаления", false);
        return false;
    }
}

// ========== ЭКСПОРТ ФУНКЦИЙ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ==========
window.buildApiUrl = buildApiUrl;
window.loadData = loadData;
window.updateFullItem = updateFullItem;
window.sendAddItemRequest = sendAddItemRequest;
window.loadAllComments = loadAllComments;
window.saveComment = saveComment;
window.getComment = getComment;
window.saveCommentsToLocal = saveCommentsToLocal;
window.loadCommentsFromLocal = loadCommentsFromLocal;
window.addSupply = addSupply;
window.getPhotoUrl = getPhotoUrl;
window.uploadPhoto = uploadPhoto;
window.deletePhoto = deletePhoto;

// Новые функции для работы с типами мерча
window.loadMerchTypesConfig = loadMerchTypesConfig;
window.getTypeConfigFromCache = getTypeConfigFromCache;
window.hasAttributesForType = hasAttributesForType;
window.getAllMerchTypes = getAllMerchTypes;

console.log("✅ api.js загружен, getComment определена:", typeof window.getComment);
console.log("✅ api.js загружен, loadData определена:", typeof window.loadData);
console.log("✅ api.js загружен, loadMerchTypesConfig определена:", typeof window.loadMerchTypesConfig);
