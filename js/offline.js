// ========== ОФЛАЙН-СИНХРОНИЗАЦИЯ ==========
function savePendingOperations() {
    localStorage.setItem('merch_pending_ops', JSON.stringify(pendingOperations));
}

function loadPendingOperations() {
    const saved = localStorage.getItem('merch_pending_ops');
    if (saved) {
        try {
            pendingOperations = JSON.parse(saved);
        } catch(e) { pendingOperations = []; }
    } else {
        pendingOperations = [];
    }
}

// Вспомогательная функция для построения параметров строки запроса из объекта
function buildParamsFromObject(obj) {
    if (!obj) return "";
    // Если obj уже строка, возвращаем как есть
    if (typeof obj === 'string') return obj;
    
    const parts = [];
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object') {
            parts.push(`&${key}=${encodeURIComponent(JSON.stringify(value))}`);
        } else {
            parts.push(`&${key}=${encodeURIComponent(String(value))}`);
        }
    }
    return parts.join("");
}

async function processPendingOperations(silent = false) {
    if (!isOnline) return;
    if (pendingOperations.length === 0) return;
    
    if (!silent) {
        showToast(`Синхронизация (${pendingOperations.length} операций)...`, true);
    }
    
    const failed = [];
    for (const op of pendingOperations) {
        try {
            let url;
            let fetchOptions = null;
            let isFormData = false;
            let formData = null;
            
            // Добавляем realUser параметр если организатор действует от лица другого пользователя
            let realUserParam = "";
            if (typeof window.getRealUserParam === 'function') {
                realUserParam = window.getRealUserParam();
            }
            
            // Определяем параметры: если params строка, используем как есть, иначе преобразуем
            let paramsString = "";
            if (typeof op.params === 'string') {
                paramsString = op.params;
            } else {
                paramsString = buildParamsFromObject(op.params);
            }
            
            switch (op.action) {
                case "addItem":
                    url = buildApiUrl("addItem", paramsString);
                    break;
                case "updateFullItem":
                    url = buildApiUrl("updateFullItem", paramsString);
                    break;
                case "update":
                    url = buildApiUrl("update", paramsString);
                    break;
                case "syncFullHistory":
                    const historyData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullHistory", `&data=${historyData}${realUserParam}`);
                    break;
                case "syncFullBookings":
                    const bookingsData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullBookings", `&data=${bookingsData}${realUserParam}`);
                    break;
                case "syncCustomOrder":
                    const orderData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncCustomOrder", `&data=${orderData}${realUserParam}`);
                    break;
                case "syncExtraCosts":
                    const costsData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncExtraCosts", `&data=${costsData}${realUserParam}`);
                    break;
                case "syncExtraIncomes":
                    const incomesData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncExtraIncomes", `&data=${incomesData}${realUserParam}`);
                    break;
                case "syncFullRules":
                    const rulesData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullRules", `&data=${rulesData}${realUserParam}`);
                    break;
                case "hideHistoryEntry":
                    url = buildApiUrl("hideHistoryEntry", `${paramsString}${realUserParam}`);
                    break;
                case "cancelHistoryEntry":
                    url = buildApiUrl("cancelHistoryEntry", `${paramsString}${realUserParam}`);
                    break;
                case "savePrivacy":
                    const privacyData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("savePrivacy", `&data=${privacyData}${realUserParam}`);
                    break;
                case "cancelBooking":
                    url = buildApiUrl("cancelBooking", `${paramsString}${realUserParam}`);
                    break;
                case "uploadPhoto":
                    isFormData = true;
                    formData = new FormData();
                    formData.append('action', 'uploadPhoto');
                    formData.append('participant', CURRENT_USER.id);
                    formData.append('itemId', op.params.itemId);
                    formData.append('userId', CURRENT_USER.id);
                    formData.append('base64Data', op.params.base64Data);
                    formData.append('fileName', op.params.fileName);
                    if (realUserParam) {
                        const realUserValue = realUserParam.replace('&realUser=', '');
                        formData.append('realUser', realUserValue);
                    }
                    break;
                case "saveComment":
                    const commentParams = new URLSearchParams();
                    commentParams.append('action', 'saveComment');
                    commentParams.append('participant', CURRENT_USER.id);
                    commentParams.append('itemId', op.params.itemId.toString());
                    commentParams.append('userId', CURRENT_USER.id);
                    commentParams.append('comment', op.params.comment);
                    if (realUserParam) {
                        const realUserValue = realUserParam.replace('&realUser=', '');
                        commentParams.append('realUser', realUserValue);
                    }
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: commentParams.toString()
                    };
                    url = CENTRAL_API_URL;
                    break;
                case "addSupply":
                    const supplyParams = new URLSearchParams();
                    supplyParams.append('action', 'addSupply');
                    supplyParams.append('participant', CURRENT_USER.id);
                    supplyParams.append('userId', CURRENT_USER.id);
                    supplyParams.append('itemId', op.params.itemId.toString());
                    supplyParams.append('quantity', op.params.quantity.toString());
                    if (realUserParam) {
                        const realUserValue = realUserParam.replace('&realUser=', '');
                        supplyParams.append('realUser', realUserValue);
                    }
                    fetchOptions = {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: supplyParams.toString()
                    };
                    url = CENTRAL_API_URL;
                    break;
                case "syncFullComments":
                    const commentsData = encodeURIComponent(JSON.stringify(op.params));
                    url = buildApiUrl("syncFullComments", `&data=${commentsData}${realUserParam}`);
                    break;
                default:
                    url = buildApiUrl(op.action, paramsString);
            }
            
            let response;
            if (isFormData && formData) {
                response = await fetch(CENTRAL_API_URL, {
                    method: 'POST',
                    body: formData
                });
            } else if (fetchOptions) {
                response = await fetch(url, fetchOptions);
            } else if (url) {
                response = await fetch(url);
            } else {
                failed.push(op);
                continue;
            }
            
            const result = await response.json();
            if (!result.success) {
                failed.push(op);
                if (!silent) console.warn(`Operation failed: ${op.action}`, result);
            }
        } catch(e) {
            console.error(`Error processing operation ${op.action}:`, e);
            failed.push(op);
        }
    }
    
    if (failed.length === 0) {
        pendingOperations = [];
        if (!silent) {
            showToast("Все операции синхронизированы", true);
        }
    } else {
        pendingOperations = failed;
        if (!silent) {
            showToast(`Не синхронизировано: ${failed.length} операций`, false);
        }
    }
    savePendingOperations();
}

function addPendingOperation(action, params) {
    // Сохраняем timestamp для возможности очистки старых операций
    pendingOperations.push({ action: action, params: params, timestamp: Date.now() });
    savePendingOperations();
    if (isOnline) {
        processPendingOperations(true);
    }
}

window.addEventListener('online', () => {
    isOnline = true;
    showToast("Соединение восстановлено, синхронизация...", true);
    processPendingOperations(false);
    loadData(false, false);
    loadAllComments(); // Загружаем комментарии после восстановления соединения
});

window.addEventListener('offline', () => {
    isOnline = false;
    showToast("Нет соединения с интернетом. Изменения сохранятся локально.", false);
});
