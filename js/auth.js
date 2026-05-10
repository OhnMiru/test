// ========== НАСТРОЙКИ КОНФИДЕНЦИАЛЬНОСТИ ==========
async function savePrivacySettings() {
    if (!isOnline) {
        addPendingOperation("savePrivacy", {
            shareStats: CURRENT_USER.shareStats,
            hideStats: CURRENT_USER.hideStats,
            blockImpersonation: CURRENT_USER.blockImpersonation,
            stockThreshold: CURRENT_USER.stockThreshold
        });
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify({
            shareStats: CURRENT_USER.shareStats,
            hideStats: CURRENT_USER.hideStats,
            blockImpersonation: CURRENT_USER.blockImpersonation,
            stockThreshold: CURRENT_USER.stockThreshold
        }));
        await fetch(buildApiUrl("savePrivacy", `&data=${data}`));
    } catch(e) {
        console.error(e);
        addPendingOperation("savePrivacy", {
            shareStats: CURRENT_USER.shareStats,
            hideStats: CURRENT_USER.hideStats,
            blockImpersonation: CURRENT_USER.blockImpersonation,
            stockThreshold: CURRENT_USER.stockThreshold
        });
    }
}

async function loadPrivacySettings() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_privacy');
        if (saved) {
            const parsed = JSON.parse(saved);
            CURRENT_USER.shareStats = parsed.shareStats === true;
            CURRENT_USER.hideStats = parsed.hideStats === true;
            CURRENT_USER.blockImpersonation = parsed.blockImpersonation === true;
            CURRENT_USER.stockThreshold = parsed.stockThreshold || 0;
            updatePrivacyButtonsUI();
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getPrivacy"));
        const data = await response.json();
        if (data) {
            CURRENT_USER.shareStats = data.shareStats === true;
            CURRENT_USER.hideStats = data.hideStats === true;
            CURRENT_USER.blockImpersonation = data.blockImpersonation === true;
            CURRENT_USER.stockThreshold = data.stockThreshold || 0;
            updatePrivacyButtonsUI();
        }
    } catch(e) {
        const saved = localStorage.getItem('merch_privacy');
        if (saved) {
            const parsed = JSON.parse(saved);
            CURRENT_USER.shareStats = parsed.shareStats === true;
            CURRENT_USER.hideStats = parsed.hideStats === true;
            CURRENT_USER.blockImpersonation = parsed.blockImpersonation === true;
            CURRENT_USER.stockThreshold = parsed.stockThreshold || 0;
            updatePrivacyButtonsUI();
        }
    }
}

function updatePrivacyButtonsUI() {
    const shareBtn = document.getElementById('shareStatsBtn');
    const hideBtn = document.getElementById('hideStatsBtn');
    const blockBtn = document.getElementById('blockImpersonationBtn');
    const thresholdBtn = document.getElementById('stockThresholdBtn');
    
    if (shareBtn) {
        shareBtn.innerHTML = CURRENT_USER.shareStats ? '🕊️ Делиться статистикой анонимно ✅' : '🕊️ Делиться статистикой анонимно';
        shareBtn.style.opacity = CURRENT_USER.shareStats ? '1' : '0.7';
    }
    if (hideBtn) {
        hideBtn.innerHTML = CURRENT_USER.hideStats ? '🚫 Не учитывать мою статистику ✅' : '🚫 Не учитывать мою статистику';
        hideBtn.style.opacity = CURRENT_USER.hideStats ? '1' : '0.7';
    }
    if (blockBtn) {
        blockBtn.innerHTML = CURRENT_USER.blockImpersonation ? '🔒 Запретить вход организатору ✅' : '🔒 Запретить вход организатору';
        blockBtn.style.opacity = CURRENT_USER.blockImpersonation ? '1' : '0.7';
    }
    if (thresholdBtn) {
        const thresholdText = CURRENT_USER.stockThreshold > 0 ? ` (⚠️ ≤ ${CURRENT_USER.stockThreshold})` : ' (выкл)';
        thresholdBtn.innerHTML = `🎨 Порог остатка${thresholdText}`;
    }
}

function toggleShareStats() {
    CURRENT_USER.shareStats = !CURRENT_USER.shareStats;
    if (CURRENT_USER.shareStats && CURRENT_USER.hideStats) {
        CURRENT_USER.hideStats = false;
    }
    updatePrivacyButtonsUI();
    localStorage.setItem('merch_privacy', JSON.stringify({ 
        shareStats: CURRENT_USER.shareStats, 
        hideStats: CURRENT_USER.hideStats,
        blockImpersonation: CURRENT_USER.blockImpersonation,
        stockThreshold: CURRENT_USER.stockThreshold
    }));
    savePrivacySettings();
    showToast(CURRENT_USER.shareStats ? 'Анонимная статистика включена' : 'Анонимная статистика отключена', true);
}

function toggleHideStats() {
    CURRENT_USER.hideStats = !CURRENT_USER.hideStats;
    if (CURRENT_USER.hideStats && CURRENT_USER.shareStats) {
        CURRENT_USER.shareStats = false;
    }
    updatePrivacyButtonsUI();
    localStorage.setItem('merch_privacy', JSON.stringify({ 
        shareStats: CURRENT_USER.shareStats, 
        hideStats: CURRENT_USER.hideStats,
        blockImpersonation: CURRENT_USER.blockImpersonation,
        stockThreshold: CURRENT_USER.stockThreshold
    }));
    savePrivacySettings();
    showToast(CURRENT_USER.hideStats ? 'Ваша статистика скрыта от организатора' : 'Ваша статистика видна организатору', true);
}

function toggleBlockImpersonation() {
    CURRENT_USER.blockImpersonation = !CURRENT_USER.blockImpersonation;
    updatePrivacyButtonsUI();
    localStorage.setItem('merch_privacy', JSON.stringify({ 
        shareStats: CURRENT_USER.shareStats, 
        hideStats: CURRENT_USER.hideStats,
        blockImpersonation: CURRENT_USER.blockImpersonation,
        stockThreshold: CURRENT_USER.stockThreshold
    }));
    savePrivacySettings();
    showToast(CURRENT_USER.blockImpersonation ? '🔒 Организатор больше не сможет войти в ваш аккаунт' : '🔓 Организатор снова может входить в ваш аккаунт', true);
}

// НОВАЯ ФУНКЦИЯ: Открыть модальное окно для установки порога остатка
function openStockThresholdModal() {
    const modal = document.createElement('div');
    modal.className = 'modal threshold-modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close-btn" onclick="this.closest('.modal').remove()">×</button>
            <div class="modal-header">
                <span>🎨 Порог остатка</span>
            </div>
            <div style="padding: 20px;">
                <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    Когда остаток товара станет меньше или равен этому числу,<br>
                    текст "Остаток: X шт" будет окрашен в <span style="color: #e74c3c;">красный цвет</span>.
                </p>
                <input type="number" id="stockThresholdInput" class="threshold-input" 
                       value="${CURRENT_USER.stockThreshold || 0}" min="0" step="1">
                <div class="threshold-buttons">
                    <button class="threshold-btn threshold-reset" onclick="resetStockThreshold()">Сбросить</button>
                    <button class="threshold-btn threshold-cancel" onclick="this.closest('.modal').remove()">Отмена</button>
                    <button class="threshold-btn threshold-save" onclick="saveStockThreshold()">Сохранить</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Фокус на поле ввода
    const input = document.getElementById('stockThresholdInput');
    if (input) input.focus();
}

function saveStockThreshold() {
    const input = document.getElementById('stockThresholdInput');
    const value = parseInt(input.value) || 0;
    CURRENT_USER.stockThreshold = Math.max(0, value);
    updatePrivacyButtonsUI();
    localStorage.setItem('merch_privacy', JSON.stringify({ 
        shareStats: CURRENT_USER.shareStats, 
        hideStats: CURRENT_USER.hideStats,
        blockImpersonation: CURRENT_USER.blockImpersonation,
        stockThreshold: CURRENT_USER.stockThreshold
    }));
    savePrivacySettings();
    
    // Закрыть модальное окно
    const modal = document.querySelector('.threshold-modal');
    if (modal) modal.remove();
    
    // Перерисовать карточки с новой подсветкой
    if (typeof filterAndSort === 'function') {
        filterAndSort();
    }
    
    showToast(CURRENT_USER.stockThreshold > 0 ? `Порог остатка установлен: ≤ ${CURRENT_USER.stockThreshold}` : 'Подсветка порога остатка отключена', true);
}

function resetStockThreshold() {
    const input = document.getElementById('stockThresholdInput');
    if (input) input.value = '0';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('passwordInput');
    const toggleBtn = document.querySelector('.toggle-password');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙀';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '🙈';
    }
}

// ========== ВХОД ==========
async function login() {
    const loginInput = document.getElementById('loginInput');
    const passwordInput = document.getElementById('passwordInput');
    const errorMsg = document.getElementById('errorMsg');
    const login = loginInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    
    if (!login || !password) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Введите логин и пароль';
        return;
    }
    
    errorMsg.style.display = 'none';
    
    try {
        const response = await fetch(`${CENTRAL_API_URL}?action=checkPassword&user=${encodeURIComponent(login)}&pwd=${encodeURIComponent(password)}`);
        const result = await response.json();
        
        if (result.success) {
            CURRENT_USER.id = login;
            CURRENT_USER.name = result.name || login;
            CURRENT_USER.role = result.role || 'artist';
            CURRENT_USER.sheetUrl = result.sheetUrl || '#';
            CURRENT_USER.blockImpersonation = result.blockImpersonation === true;
            CURRENT_USER.stockThreshold = result.stockThreshold || 0;
            
            sessionStorage.setItem('currentUser', JSON.stringify({ 
                id: CURRENT_USER.id, 
                name: CURRENT_USER.name, 
                role: CURRENT_USER.role, 
                sheetUrl: CURRENT_USER.sheetUrl,
                blockImpersonation: CURRENT_USER.blockImpersonation,
                stockThreshold: CURRENT_USER.stockThreshold
            }));
            
            await loadPrivacySettings();
            loadPendingOperations();
            
            // Очистка старых операций
            if (pendingOperations && pendingOperations.length > 0) {
                const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
                const oldOps = pendingOperations.filter(op => op.timestamp && op.timestamp < threeDaysAgo);
                if (oldOps.length > 0) {
                    console.log(`🧹 Очищено ${oldOps.length} старых операций (старше 3 дней)`);
                    pendingOperations = pendingOperations.filter(op => !oldOps.includes(op));
                    savePendingOperations();
                }
            }
            
            const savedHistory = localStorage.getItem('merch_sales_history');
            if (savedHistory) {
                try {
                    const history = JSON.parse(savedHistory);
                    const threeDaysAgo = new Date();
                    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                    const filteredHistory = history.filter(entry => {
                        const entryDate = new Date(entry.date);
                        return entryDate >= threeDaysAgo;
                    });
                    if (filteredHistory.length !== history.length) {
                        console.log(`🧹 Очищено ${history.length - filteredHistory.length} старых записей истории`);
                        localStorage.setItem('merch_sales_history', JSON.stringify(filteredHistory));
                        if (typeof salesHistory !== 'undefined') {
                            salesHistory = filteredHistory;
                        }
                    }
                } catch(e) {}
            }
            
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            const roleIcon = CURRENT_USER.role === 'organizer' ? '📊' : '🍌';
            document.getElementById('shopTitle').innerHTML = `${roleIcon} ${CURRENT_USER.name} — учёт мерча`;
            
            const sheetLink = document.getElementById('sheetLink');
            if (sheetLink && CURRENT_USER.sheetUrl && CURRENT_USER.sheetUrl !== '#') {
                sheetLink.href = CURRENT_USER.sheetUrl;
            }
            
            // Показываем/скрываем кнопки организатора
            const globalStatsBtn = document.getElementById('globalStatsBtn');
            const impersonateBtn = document.getElementById('impersonateBtn');
            if (CURRENT_USER.role === 'organizer') {
                if (globalStatsBtn) globalStatsBtn.style.display = 'inline-flex';
                if (impersonateBtn) impersonateBtn.style.display = 'inline-flex';
                showImpersonateUI();
            } else {
                if (globalStatsBtn) globalStatsBtn.style.display = 'none';
                if (impersonateBtn) impersonateBtn.style.display = 'none';
            }
            
            initApp();
            processPendingOperations();
        } else {
            errorMsg.style.display = 'block';
            errorMsg.textContent = result.error || 'Неверный логин или пароль';
            passwordInput.value = '';
        }
    } catch (error) {
        errorMsg.style.display = 'block';
        errorMsg.textContent = 'Ошибка соединения. Попробуйте позже.';
        console.error(error);
    }
}

function checkExistingAuth() {
    const savedUser = sessionStorage.getItem('currentUser');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            CURRENT_USER.id = user.id;
            CURRENT_USER.name = user.name;
            CURRENT_USER.role = user.role;
            CURRENT_USER.sheetUrl = user.sheetUrl;
            CURRENT_USER.blockImpersonation = user.blockImpersonation === true;
            CURRENT_USER.stockThreshold = user.stockThreshold || 0;
            
            document.getElementById('loginOverlay').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            
            const roleIcon = CURRENT_USER.role === 'organizer' ? '📊' : '🍌';
            document.getElementById('shopTitle').innerHTML = `${roleIcon} ${CURRENT_USER.name} — учёт мерча`;
            
            const sheetLink = document.getElementById('sheetLink');
            if (sheetLink && CURRENT_USER.sheetUrl && CURRENT_USER.sheetUrl !== '#') {
                sheetLink.href = CURRENT_USER.sheetUrl;
            }
            
            const globalStatsBtn = document.getElementById('globalStatsBtn');
            const impersonateBtn = document.getElementById('impersonateBtn');
            if (CURRENT_USER.role === 'organizer') {
                if (globalStatsBtn) globalStatsBtn.style.display = 'inline-flex';
                if (impersonateBtn) impersonateBtn.style.display = 'inline-flex';
                showImpersonateUI();
            } else {
                if (globalStatsBtn) globalStatsBtn.style.display = 'none';
                if (impersonateBtn) impersonateBtn.style.display = 'none';
            }
            
            loadPrivacySettings().then(() => {
                loadPendingOperations();
                initApp();
                processPendingOperations();
            });
            return true;
        } catch(e) {}
    }
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('mainContent').style.display = 'none';
    return false;
}

function logout() {
    if (isImpersonating) {
        stopImpersonating();
    }
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_time');
    CURRENT_USER.id = null;
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginOverlay').style.display = 'flex';
    document.getElementById('loginInput').value = '';
    document.getElementById('passwordInput').value = '';
    document.getElementById('errorMsg').style.display = 'none';
    const dropdown = document.getElementById('settingsDropdown');
    if (dropdown) dropdown.classList.add('hidden');
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    if (historySyncInterval) clearInterval(historySyncInterval);
}

// ========== ФУНКЦИИ ДЛЯ ИМПЕРСОНАЦИИ (ВХОД ОТ ЛИЦА ОРГАНИЗАТОРА) ==========

function hideOrganizerButtons() {
    const globalStatsBtn = document.getElementById('globalStatsBtn');
    const impersonateBtn = document.getElementById('impersonateBtn');
    if (globalStatsBtn) globalStatsBtn.style.display = 'none';
    if (impersonateBtn) impersonateBtn.style.display = 'none';
}

function showOrganizerButtons() {
    const globalStatsBtn = document.getElementById('globalStatsBtn');
    const impersonateBtn = document.getElementById('impersonateBtn');
    if (globalStatsBtn && window.CURRENT_USER && CURRENT_USER.role === 'organizer') {
        globalStatsBtn.style.display = 'inline-flex';
    }
    if (impersonateBtn && window.CURRENT_USER && CURRENT_USER.role === 'organizer') {
        impersonateBtn.style.display = 'inline-flex';
    }
}

function showImpersonateUI() {
    if (CURRENT_USER.role !== 'organizer') return;
    
    let impersonateBtn = document.getElementById('impersonateBtn');
    if (!impersonateBtn) return;
    
    if (isImpersonating) {
        impersonateBtn.style.display = 'none';
    } else {
        impersonateBtn.style.display = 'inline-flex';
    }
    
    let dropdown = document.getElementById('impersonateDropdown');
    if (dropdown) return;
    
    dropdown = document.createElement('div');
    dropdown.id = 'impersonateDropdown';
    dropdown.className = 'impersonate-dropdown hidden';
    dropdown.style.position = 'absolute';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.background = 'var(--card-bg)';
    dropdown.style.border = '1px solid var(--border-color)';
    dropdown.style.borderRadius = '16px';
    dropdown.style.padding = '8px';
    dropdown.style.minWidth = '220px';
    dropdown.style.zIndex = '1000';
    dropdown.style.marginTop = '8px';
    dropdown.style.boxShadow = '0 4px 12px var(--shadow)';
    dropdown.style.maxHeight = '300px';
    dropdown.style.overflowY = 'auto';
    
    const title = document.createElement('div');
    title.style.padding = '8px 12px';
    title.style.fontSize = '12px';
    title.style.color = 'var(--text-muted)';
    title.style.borderBottom = '1px solid var(--border-color)';
    title.textContent = 'Выберите пользователя';
    dropdown.appendChild(title);
    
    const userList = document.createElement('div');
    userList.id = 'impersonateUserList';
    dropdown.appendChild(userList);
    
    impersonateBtn.appendChild(dropdown);
    
    impersonateBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.classList.contains('show');
        document.querySelectorAll('.impersonate-dropdown.show').forEach(d => d.classList.remove('show'));
        if (!isVisible) {
            dropdown.classList.add('show');
            loadImpersonateUserList();
        } else {
            dropdown.classList.remove('show');
        }
    });
    
    document.addEventListener('click', (e) => {
        if (!impersonateBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('show');
        }
    });
}

async function loadImpersonateUserList() {
    const userListContainer = document.getElementById('impersonateUserList');
