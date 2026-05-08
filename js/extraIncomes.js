// ========== ДОПОЛНИТЕЛЬНЫЕ ДОХОДЫ ==========
let extraIncomes = [];

async function syncExtraIncomesToServer() {
    if (!isOnline) {
        addPendingOperation("syncExtraIncomes", extraIncomes);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(extraIncomes));
        const response = await fetch(buildApiUrl("syncExtraIncomes", `&data=${data}`));
        const result = await response.json();
        if (!result.success) {
            addPendingOperation("syncExtraIncomes", extraIncomes);
        }
    } catch(e) { 
        console.error(e); 
        addPendingOperation("syncExtraIncomes", extraIncomes);
    }
}

async function loadExtraIncomesFromServer() {
    if (!isOnline) {
        loadExtraIncomesFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getExtraIncomes"));
        const data = await response.json();
        if (data && data.incomes) {
            extraIncomes = data.incomes;
            saveExtraIncomesToLocal();
            return true;
        }
        return false;
    } catch(e) { 
        console.error(e);
        return false; 
    }
}

function saveExtraIncomesToLocal() {
    localStorage.setItem('merch_extra_incomes', JSON.stringify(extraIncomes));
}

function loadExtraIncomesFromLocal() {
    const saved = localStorage.getItem('merch_extra_incomes');
    if (saved) {
        try {
            extraIncomes = JSON.parse(saved);
        } catch(e) {
            extraIncomes = [];
        }
    } else {
        extraIncomes = [];
    }
}

async function loadExtraIncomes() {
    const loaded = await loadExtraIncomesFromServer();
    if (!loaded) loadExtraIncomesFromLocal();
}

function saveExtraIncomes() {
    saveExtraIncomesToLocal();
    syncExtraIncomesToServer();
}

function addExtraIncome(name, amount) {
    if (!name || !amount || amount <= 0) {
        showToast("Введите название и сумму дохода", false);
        return;
    }
    extraIncomes.push({ id: Date.now(), name: name, amount: amount });
    saveExtraIncomes();
    if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
    showToast(`Доход "${name}" добавлен`, true);
}

function deleteExtraIncome(index) {
    if (index >= 0 && index < extraIncomes.length) {
        const income = extraIncomes[index];
        extraIncomes.splice(index, 1);
        saveExtraIncomes();
        if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
        showToast(`Доход "${income.name}" удалён`, true);
    }
}

// ========== ГЛОБАЛЬНЫЕ ДОХОДЫ ДЛЯ ОРГАНИЗАТОРА ==========
let globalExtraIncomes = [];

async function loadGlobalExtraIncomes() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_global_incomes');
        if (saved) {
            try {
                globalExtraIncomes = JSON.parse(saved);
            } catch(e) {
                globalExtraIncomes = [];
            }
        } else {
            globalExtraIncomes = [];
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getAllExtraIncomes"));
        const data = await response.json();
        if (data && data.incomes) {
            globalExtraIncomes = data.incomes;
            localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        }
    } catch(e) {
        console.error(e);
        const saved = localStorage.getItem('merch_global_incomes');
        if (saved) {
            try {
                globalExtraIncomes = JSON.parse(saved);
            } catch(e) {
                globalExtraIncomes = [];
            }
        } else {
            globalExtraIncomes = [];
        }
    }
}

async function addGlobalExtraIncome(name, amount) {
    if (!isOnline) {
        const newId = Date.now();
        globalExtraIncomes.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("addExtraIncomeGlobal", { name: name, amount: amount });
        showToast("Доход добавлен (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            const container = document.getElementById('participantStatsContainer');
            if (container && typeof renderGlobalStatsWithCosts === 'function') {
                renderGlobalStatsWithCosts();
            }
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("addExtraIncomeGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraIncomes();
            showToast("Доход добавлен", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                const container = document.getElementById('participantStatsContainer');
                if (container && typeof renderGlobalStatsWithCosts === 'function') {
                    renderGlobalStatsWithCosts();
                }
            }
        } else {
            showToast("Ошибка добавления дохода", false);
        }
    } catch(e) {
        console.error(e);
        const newId = Date.now();
        globalExtraIncomes.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("addExtraIncomeGlobal", { name: name, amount: amount });
        showToast("Доход добавлен (будет синхронизирован позже)", true);
    }
}

async function deleteGlobalExtraIncome(index) {
    const incomeId = globalExtraIncomes[index]?.id;
    if (!incomeId) return;
    
    if (!isOnline) {
        globalExtraIncomes.splice(index, 1);
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("deleteExtraIncomeGlobal", { id: incomeId });
        showToast("Доход удалён (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            const container = document.getElementById('participantStatsContainer');
            if (container && typeof renderGlobalStatsWithCosts === 'function') {
                renderGlobalStatsWithCosts();
            }
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("deleteExtraIncomeGlobal", `&id=${incomeId}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraIncomes();
            showToast("Доход удалён", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                const container = document.getElementById('participantStatsContainer');
                if (container && typeof renderGlobalStatsWithCosts === 'function') {
                    renderGlobalStatsWithCosts();
                }
            }
        } else {
            showToast("Ошибка удаления дохода", false);
        }
    } catch(e) {
        console.error(e);
        globalExtraIncomes.splice(index, 1);
        localStorage.setItem('merch_global_incomes', JSON.stringify(globalExtraIncomes));
        addPendingOperation("deleteExtraIncomeGlobal", { id: incomeId });
        showToast("Доход удалён (будет синхронизирован позже)", true);
    }
}
