// ========== НАСТРОЙКИ ==========
var CENTRAL_API_URL = "https://szhech-belochek.pages.dev/api";
var CURRENT_USER = { 
    id: null, 
    name: null, 
    role: null, 
    sheetUrl: null, 
    shareStats: false, 
    hideStats: false,
    blockImpersonation: false,  // НОВОЕ: запрет на вход организатора
    stockThreshold: 0           // НОВОЕ: порог остатка (0 = отключено)
};

// ========== ПЕРЕМЕННЫЕ ДЛЯ ИМПЕРСОНАЦИИ (ВХОД ОТ ЛИЦА ОРГАНИЗАТОРА) ==========
var isImpersonating = false;
var originalUserId = null;
var originalUserName = null;
var impersonatedUserId = null;
var impersonatedUserName = null;
var impersonatedUserRole = null;

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
var merchTypesConfig = [];
var merchTypesLoaded = false;
var merchTypesCache = new Map();

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РАБОТЫ С ТИПАМИ ==========
function getTypeConfig(typeName) {
    if (!typeName) return null;
    return merchTypesCache.get(typeName.toLowerCase()) || null;
}

function hasAttributes(typeName) {
    const config = getTypeConfig(typeName);
    if (!config) return false;
    return (config.attribute1 && config.attribute1.values && config.attribute1.values.length > 0) || 
           (config.attribute2 && config.attribute2.values && config.attribute2.values.length > 0);
}

function getTypeNamesList() {
    return merchTypesConfig.map(t => t.type);
}

function getAttribute1Values(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute1?.values || [];
}

function getAttribute1Name(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute1?.name || "";
}

function getAttribute2Values(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute2?.values || [];
}

function getAttribute2Name(typeName) {
    const config = getTypeConfig(typeName);
    return config?.attribute2?.name || "";
}

function getDisplayNameWithAttributes(type, attr1, attr2) {
    let parts = [type];
    if (attr1 && attr1.trim()) parts.push(attr1.trim());
    if (attr2 && attr2.trim()) parts.push(attr2.trim());
    return parts.join(" | ");
}

function getFullNameForHistory(itemName, type, attr1, attr2) {
    const displayPart = getDisplayNameWithAttributes(type, attr1, attr2);
    return `${itemName} (${displayPart})`;
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
