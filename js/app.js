// ========== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==========

// Загрузка конфигурации типов мерча
async function loadMerchTypes() {
    console.log("🔄 Загрузка конфигурации типов мерча...");
    if (typeof loadMerchTypesConfig === 'function') {
        const success = await loadMerchTypesConfig();
        if (success) {
            console.log("✅ Конфигурация типов загружена:", window.merchTypesConfig?.length || 0, "типов");
        } else {
            console.warn("⚠️ Не удалось загрузить конфигурацию типов");
        }
    } else {
        console.error("❌ loadMerchTypesConfig не определена");
    }
}

function initApp() {
    console.log("Инициализация приложения...");
    
    // Загружаем конфигурацию типов мерча
    loadMerchTypes();
    
    // Загружаем данные с задержкой, чтобы все скрипты успели загрузиться
    setTimeout(() => {
        if (typeof loadData === 'function') {
            loadData(true, true);
        } else {
            console.error("loadData still not loaded, checking again in 1 second...");
            setTimeout(() => {
                if (typeof loadData === 'function') {
                    loadData(true, true);
                } else {
                    console.error("loadData failed to load - check if api.js is blocked");
                    const container = document.getElementById('cards-container');
                    if (container) {
                        container.innerHTML = '<div class="loading">❌ Ошибка загрузки данных. Попробуйте обновить страницу.</div>';
                    }
                }
            }, 1000);
        }
    }, 200);
    
    // Загружаем остальные данные
    if (typeof initCustomSelects === 'function') initCustomSelects();
    if (typeof loadRules === 'function') loadRules();
    if (typeof loadHistory === 'function') loadHistory();
    if (typeof loadExtraCosts === 'function') loadExtraCosts();
    if (typeof loadExtraIncomes === 'function') loadExtraIncomes();
    
    if (CURRENT_USER.role === 'organizer') {
        if (typeof loadGlobalExtraCosts === 'function') loadGlobalExtraCosts();
        if (typeof loadGlobalExtraIncomes === 'function') loadGlobalExtraIncomes();
    }
    
    if (typeof initDateTimeSelects === 'function') initDateTimeSelects();
    if (typeof bindDateTimeEvents === 'function') bindDateTimeEvents();
    if (typeof initCustomOrder === 'function') initCustomOrder();
    
    // Запускаем автообновление
    if (typeof startAutoRefresh === 'function') startAutoRefresh();
    if (typeof startHistoryAutoSync === 'function') startHistoryAutoSync();
    
    // Загружаем бронирования
    if (typeof loadBookings === 'function') {
        loadBookings().catch(e => console.warn("Bookings load error:", e));
    }
    
    // Инициализация фильтров статистики (по времени)
    if (typeof initStatsDateTimeSelects === 'function') {
        initStatsDateTimeSelects();
        console.log("✅ initStatsDateTimeSelects вызван");
    }
    if (typeof initGlobalStatsDateTimeSelects === 'function') {
        initGlobalStatsDateTimeSelects();
        console.log("✅ initGlobalStatsDateTimeSelects вызван");
    }
    
    // Настраиваем кнопки
    const settingsToggle = document.getElementById('settingsToggle');
    const settingsDropdown = document.getElementById('settingsDropdown');
    const shareStatsBtn = document.getElementById('shareStatsBtn');
    const hideStatsBtn = document.getElementById('hideStatsBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const bookingsBtn = document.getElementById('bookingsButton');
    const addItemBtn = document.getElementById('addItemButton');
    const supplyBtn = document.getElementById('supplyButton');
    const rulesBtn = document.getElementById('rulesButton');
    const statsBtn = document.getElementById('statsButton');
    const globalStatsBtn = document.getElementById('globalStatsBtn');
    const supportBtn = document.getElementById('supportBtn');
  
    if (bookingsBtn) {
        bookingsBtn.addEventListener('click', () => {
            if (typeof openBookingsModal === 'function') openBookingsModal();
        });
    }
    
    if (addItemBtn) {
        addItemBtn.addEventListener('click', () => {
            if (typeof openAddItemModal === 'function') openAddItemModal();
        });
    }
    
    if (supplyBtn) {
        supplyBtn.addEventListener('click', () => {
            if (typeof openSupplyModal === 'function') openSupplyModal();
        });
    }
    
    if (rulesBtn) {
        rulesBtn.addEventListener('click', () => {
            if (typeof openRulesModal === 'function') openRulesModal();
        });
    }
    
    if (statsBtn) {
        statsBtn.addEventListener('click', () => {
            if (typeof openStatsModal === 'function') openStatsModal();
        });
    }
    
    if (supportBtn) {
        supportBtn.addEventListener('click', () => {
            if (typeof openSupportModal === 'function') openSupportModal();
        });
    }
    
    if (globalStatsBtn && CURRENT_USER.role === 'organizer') {
        globalStatsBtn.style.display = 'inline-flex';
        globalStatsBtn.addEventListener('click', () => {
            if (typeof showGlobalStats === 'function') showGlobalStats();
        });
    }

    if (settingsToggle) {
        // Убираем все старые обработчики
        const newToggle = settingsToggle.cloneNode(true);
        settingsToggle.parentNode.replaceChild(newToggle, settingsToggle);
        
        newToggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("⚙️ Кнопка настроек нажата");
            if (settingsDropdown) {
                settingsDropdown.classList.toggle('hidden');
                console.log("  - Новый класс:", settingsDropdown.className);
            }
        });
        
        // Закрытие при клике вне
        document.addEventListener('click', (e) => {
            if (!newToggle.contains(e.target) && !settingsDropdown?.contains(e.target)) {
                if (settingsDropdown) settingsDropdown.classList.add('hidden');
            }
        });
    }
    
    if (shareStatsBtn) {
        shareStatsBtn.addEventListener('click', () => {
            if (typeof toggleShareStats === 'function') toggleShareStats();
            if (settingsDropdown) settingsDropdown.classList.add('hidden');
        });
    }
    
    if (hideStatsBtn) {
        hideStatsBtn.addEventListener('click', () => {
            if (typeof toggleHideStats === 'function') toggleHideStats();
            if (settingsDropdown) settingsDropdown.classList.add('hidden');
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (typeof logout === 'function') logout();
            if (settingsDropdown) settingsDropdown.classList.add('hidden');
        });
    }

    // Загружаем комментарии
    if (typeof loadAllComments === 'function') {
        loadAllComments();
    }
    
    // Инициализируем селектор типов в модалке добавления (если она уже открыта)
    if (typeof initAddItemTypeSelector === 'function') {
        // Не вызываем автоматически, только если модалка открыта
        // Функция будет вызвана при открытии модалки
    }
    
    console.log("Инициализация приложения завершена");
}

// Обработчик кликов для закрытия выпадающих списков правил
document.addEventListener('click', function(event) {
    if (!event.target.closest('.rule-custom-select')) {
        if (typeof closeAllRuleSelects === 'function') closeAllRuleSelects();
    }
});

// Обработчик для закрытия модальных окон при клике на фон
window.onclick = function(event) {
    const historyModal = document.getElementById('historyModal');
    const cartModal = document.getElementById('cartModal');
    const rulesModal = document.getElementById('rulesModal');
    const statsModal = document.getElementById('statsModal');
    const globalStatsModal = document.getElementById('globalStatsModal');
    const editProductModal = document.getElementById('editProductModal');
    const addItemModal = document.getElementById('addItemModal');
    const photoViewModal = document.getElementById('photoViewModal');
    const bookingsModal = document.getElementById('bookingsModal');
    const supplyModal = document.getElementById('supplyModal');
    const commentModal = document.getElementById('commentModal');
    const supportModal = document.getElementById('supportModal');
    const easterEggModal = document.getElementById('easterEggModal');
    
    if (event.target === historyModal && typeof closeHistory === 'function') closeHistory();
    if (event.target === cartModal && typeof closeCartModal === 'function') closeCartModal();
    if (event.target === rulesModal && typeof closeRulesModal === 'function') closeRulesModal();
    if (event.target === statsModal && typeof closeStatsModal === 'function') closeStatsModal();
    if (event.target === globalStatsModal && typeof closeGlobalStatsModal === 'function') closeGlobalStatsModal();
    if (event.target === editProductModal && typeof closeEditProductModal === 'function') closeEditProductModal();
    if (event.target === addItemModal && typeof closeAddItemModal === 'function') closeAddItemModal();
    if (event.target === photoViewModal && typeof closePhotoModal === 'function') closePhotoModal();
    if (event.target === bookingsModal && typeof closeBookingsModal === 'function') closeBookingsModal();
    if (event.target === supplyModal && typeof closeSupplyModal === 'function') closeSupplyModal();
    if (event.target === commentModal && typeof closeCommentModal === 'function') closeCommentModal();
    if (event.target === supportModal && typeof closeSupportModal === 'function') closeSupportModal();
    if (event.target === easterEggModal && typeof closeEasterEggModal === 'function') closeEasterEggModal();
};

// Инициализация после полной загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM полностью загружен");
    
    // Инициализируем тему
    if (typeof initTheme === 'function') {
        initTheme();
    } else {
        console.warn("initTheme not loaded");
    }
    
    // Кнопка переключения темы
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (typeof toggleTheme === 'function') toggleTheme();
        });
    }

    // Кнопка входа
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (typeof login === 'function') login();
        });
    }

    // Вход по Enter
    const loginInput = document.getElementById('loginInput');
    const passwordInput = document.getElementById('passwordInput');
    if (loginInput) {
        loginInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter' && typeof login === 'function') login(); 
        });
    }
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => { 
            if (e.key === 'Enter' && typeof login === 'function') login(); 
        });
    }

    // Поиск
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            if (typeof filterAndSort === 'function') filterAndSort();
        });
    }

    // Сброс фильтров
    const resetBtn = document.getElementById('resetFilters');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (typeof resetAllFilters === 'function') resetAllFilters();
        });
    }

    // Проверяем авторизацию
    if (typeof checkExistingAuth === 'function') {
        if (!checkExistingAuth()) {
            console.log("Ожидание ручного входа");
        } else {
            // Небольшая задержка для полной загрузки всех скриптов
            setTimeout(() => {
                initApp();
            }, 100);
        }
    } else {
        console.error("checkExistingAuth not loaded - waiting for scripts");
        // Повторная попытка через 500 мс
        setTimeout(() => {
            if (typeof checkExistingAuth === 'function') {
                if (!checkExistingAuth()) {
                    console.log("Ожидание ручного входа");
                } else {
                    initApp();
                }
            } else {
                console.error("Still no checkExistingAuth, giving up");
            }
        }, 500);
    }
});

// Экспортируем функцию в глобальную область
window.loadMerchTypes = loadMerchTypes;
