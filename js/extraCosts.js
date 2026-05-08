// ========== ДОПОЛНИТЕЛЬНЫЕ РАСХОДЫ ==========
async function syncExtraCostsToServer() {
    if (!isOnline) {
        addPendingOperation("syncExtraCosts", extraCosts);
        return;
    }
    try {
        const data = encodeURIComponent(JSON.stringify(extraCosts));
        const response = await fetch(buildApiUrl("syncExtraCosts", `&data=${data}`));
        const result = await response.json();
        if (!result.success) {
            addPendingOperation("syncExtraCosts", extraCosts);
        }
    } catch(e) { 
        console.error(e); 
        addPendingOperation("syncExtraCosts", extraCosts);
    }
}

async function loadExtraCostsFromServer() {
    if (!isOnline) {
        loadExtraCostsFromLocal();
        return false;
    }
    try {
        const response = await fetch(buildApiUrl("getExtraCosts"));
        const data = await response.json();
        if (data && data.costs) {
            extraCosts = data.costs;
            saveExtraCostsToLocal();
            return true;
        }
        return false;
    } catch(e) { 
        console.error(e);
        return false; 
    }
}

function saveExtraCostsToLocal() {
    localStorage.setItem('merch_extra_costs', JSON.stringify(extraCosts));
}

function loadExtraCostsFromLocal() {
    const saved = localStorage.getItem('merch_extra_costs');
    if (saved) {
        try {
            extraCosts = JSON.parse(saved);
        } catch(e) {
            extraCosts = [];
        }
    } else {
        extraCosts = [];
    }
}

async function loadExtraCosts() {
    const loaded = await loadExtraCostsFromServer();
    if (!loaded) loadExtraCostsFromLocal();
}

function saveExtraCosts() {
    saveExtraCostsToLocal();
    syncExtraCostsToServer();
}

function addExtraCost(name, amount) {
    if (!name || !amount || amount <= 0) {
        showToast("Введите название и сумму расхода", false);
        return;
    }
    extraCosts.push({ id: Date.now(), name: name, amount: amount });
    saveExtraCosts();
    if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
    showToast(`Расход "${name}" добавлен`, true);
}

function deleteExtraCost(index) {
    if (index >= 0 && index < extraCosts.length) {
        const cost = extraCosts[index];
        extraCosts.splice(index, 1);
        saveExtraCosts();
        if (document.getElementById('statsModal')?.style.display === 'block') renderStats();
        showToast(`Расход "${cost.name}" удалён`, true);
    }
}

// ========== ГЛОБАЛЬНЫЕ РАСХОДЫ ДЛЯ ОРГАНИЗАТОРА ==========
let globalExtraCosts = [];

async function loadGlobalExtraCosts() {
    if (!isOnline) {
        const saved = localStorage.getItem('merch_global_costs');
        if (saved) {
            try {
                globalExtraCosts = JSON.parse(saved);
            } catch(e) {
                globalExtraCosts = [];
            }
        } else {
            globalExtraCosts = [];
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("getAllExtraCosts"));
        const data = await response.json();
        if (data && data.costs) {
            globalExtraCosts = data.costs;
            localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        }
    } catch(e) {
        console.error(e);
        const saved = localStorage.getItem('merch_global_costs');
        if (saved) {
            try {
                globalExtraCosts = JSON.parse(saved);
            } catch(e) {
                globalExtraCosts = [];
            }
        } else {
            globalExtraCosts = [];
        }
    }
}

async function addGlobalExtraCost(name, amount) {
    if (!isOnline) {
        const newId = Date.now();
        globalExtraCosts.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("addExtraCostGlobal", { name: name, amount: amount });
        showToast("Расход добавлен (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            const container = document.getElementById('participantStatsContainer');
            if (container && typeof renderGlobalStatsWithCosts === 'function') {
                renderGlobalStatsWithCosts();
            }
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("addExtraCostGlobal", `&name=${encodeURIComponent(name)}&amount=${amount}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraCosts();
            showToast("Расход добавлен", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                const container = document.getElementById('participantStatsContainer');
                if (container && typeof renderGlobalStatsWithCosts === 'function') {
                    renderGlobalStatsWithCosts();
                }
            }
        } else {
            showToast("Ошибка добавления расхода", false);
        }
    } catch(e) {
        console.error(e);
        const newId = Date.now();
        globalExtraCosts.push({ id: newId, name: name, amount: amount });
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("addExtraCostGlobal", { name: name, amount: amount });
        showToast("Расход добавлен (будет синхронизирован позже)", true);
    }
}

async function deleteGlobalExtraCost(index) {
    const costId = globalExtraCosts[index]?.id;
    if (!costId) return;
    
    if (!isOnline) {
        globalExtraCosts.splice(index, 1);
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("deleteExtraCostGlobal", { id: costId });
        showToast("Расход удалён (будет синхронизирован позже)", true);
        if (document.getElementById('globalStatsModal')?.style.display === 'block') {
            const container = document.getElementById('participantStatsContainer');
            if (container && typeof renderGlobalStatsWithCosts === 'function') {
                renderGlobalStatsWithCosts();
            }
        }
        return;
    }
    try {
        const response = await fetch(buildApiUrl("deleteExtraCostGlobal", `&id=${costId}`));
        const result = await response.json();
        if (result.success) {
            await loadGlobalExtraCosts();
            showToast("Расход удалён", true);
            if (document.getElementById('globalStatsModal')?.style.display === 'block') {
                const container = document.getElementById('participantStatsContainer');
                if (container && typeof renderGlobalStatsWithCosts === 'function') {
                    renderGlobalStatsWithCosts();
                }
            }
        } else {
            showToast("Ошибка удаления расхода", false);
        }
    } catch(e) {
        console.error(e);
        globalExtraCosts.splice(index, 1);
        localStorage.setItem('merch_global_costs', JSON.stringify(globalExtraCosts));
        addPendingOperation("deleteExtraCostGlobal", { id: costId });
        showToast("Расход удалён (будет синхронизирован позже)", true);
    }
}
