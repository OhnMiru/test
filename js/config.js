// ========== НАСТРОЙКА ==========
var CENTRAL_API_URL = "https://szhech-belochek.pages.dev/api";

var CURRENT_USER = {
    id: null,
    name: null,
    role: null,
    sheetUrl: null,
    shareStats: false,
    hideStats: false
};

// ========== ПЕРЕМЕННЫЕ ДЛЯ ИМПЕРСОНАЦИИ (ВХОД ОТ ЛИЦА ОРГАНИЗАТОРА) ==========
var isImpersonating = false;           // Флаг: находится ли организатор в режиме подмены
var originalUserId = null;             // Оригинальный ID организатора (кого подменяют)
var originalUserName = null;           // Оригинальное имя организатора
var impersonatedUserId = null;         // ID пользователя, от лица которого действуют
var impersonatedUserName = null;       // Имя пользователя, от лица которого действуют
var impersonatedUserRole = null;       // Роль пользователя, от лица которого действуют

var pendingOperations = [];
var isOnline = navigator.onLine;

// ========== ОСНОВНЫЕ ПЕРЕМЕННЫЕ ==========
var originalCardsData = [];
var currentFilteredData = [];
var isLoading = false;
var autoRefreshInterval = null;
var historySyncInterval = null;
var currentEditId = null;
var selectedTypes = new Set();
var currentSortBy = "none";
var typeOptions = [];
var customOrder = [];
var dragStartIndex = null;
var selectedDiscountProducts = new Set();
var discountProductListVisible = false;
var itemDiscounts = {};
var discountPanelOpen = false;
var typeColors = new Map();
var colorPalette = ['#e67e22', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#e74c3c', '#1abc9c', '#f1c40f', '#e67e22', '#95a5a6'];

var cart = {};
var extraCosts = [];
var salesHistory = [];
var historyMethodFilter = "all";
var historyTypeFilter = "all";
var historyPaymentFilter = "all";
var bookingsList = [];
var selectedBookingNickname = null;
var selectedBookingItems = [];
var bookings = [];
var currentBookingProducts = new Map();
var currentViewingBookingId = null;
var cartBookingMap = {};
var currentPaymentType = 'cash';

// ========== ПЕРЕМЕННЫЕ ДЛЯ ФОТО ==========
var photoCache = new Map();
var currentPhotoItemId = null;
var currentPhotoItemName = null;
var commentsCache = new Map();

// ========== ПЕРЕМЕННЫЕ ДЛЯ ТИПОВ МЕРЧА И АТРИБУТОВ ==========

// Конфигурация типов мерча (загружается с сервера)
// Структура: [
//   {
//     type: "брелок",
//     attribute1: { name: "Размер", values: ["до 2 см", "до 3 см", ...] },
//     attribute2: { name: "Акрил", values: ["прозрачный", "цветной", ...] }
//   },
//   ...
// ]
var merchTypesConfig = [];

// Флаг, загружена ли конфигурация типов
var merchTypesLoaded = false;

// Кэш для быстрого получения конфигурации по типу
// Структура: Map{ "брелок": { attribute1: {...}, attribute2: {...} } }
var merchTypesCache = new Map();

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ТИПАМИ ==========

// Получить конфигурацию для конкретного типа
function getTypeConfig(typeName) {
    if (!typeName) return null;
    return merchTypesCache.get(typeName.toLowerCase()) || null;
}

// Проверить, есть ли у типа атрибуты
function hasAttributes(typeName) {
    const config = getTypeConfig(typeName);
    if (!config) return false;
    return (config.attribute1 && config.attribute1.values && config.attribute1.values.length > 0) ||
           (config.attribute2 && config.attribute2.values && config.attribute2.values.length > 0);
}

// Получить список названий типов для селектора
function getTypeNamesList() {
    return merchTypesConfig.map(t => t.type);
}

// Получить значения первого атрибута для типа
function getAttribute1Values(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute1?.values || [];
}

// Получить название первого атрибута для типа
function getAttribute1Name(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute1?.name || "";
}

// Получить значения второго атрибута для типа
function getAttribute2Values(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute2?.values || [];
}

// Получить название второго атрибута для типа
function getAttribute2Name(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute2?.name || "";
}

// Сформировать отображаемое имя товара с атрибутами
// Формат: "тип | атрибут1 | атрибут2" (пустые атрибуты пропускаются)
function getDisplayNameWithAttributes(type, attr1, attr2) {
    let parts = [type];
    if (attr1 && attr1.trim()) parts.push(attr1.trim());
    if (attr2 && attr2.trim()) parts.push(attr2.trim());
    return parts.join(" | ");
}

// Сформировать полное название для истории
// Формат: "Название товара (тип | атрибут1 | атрибут2)"
function getFullNameForHistory(itemName, type, attr1, attr2) {
    const displayPart = getDisplayNameWithAttributes(type, attr1, attr2);
    return `${itemName} (${displayPart})`;
}
