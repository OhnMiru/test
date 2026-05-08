// ========== ВСПОМОГАТЕЛЬНЫЕ ==========
function showToast(message, isSuccess = true) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = isSuccess ? `✅ ${message}` : `❌ ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.classList.add('fade-out'); setTimeout(() => toast.remove(), 300); }, 2000);
}

function escapeHtml(str) { 
    if (!str) return ''; 
    return String(str).replace(/[&<>]/g, function(m) { 
        if (m === '&') return '&amp;'; 
        if (m === '<') return '&lt;'; 
        if (m === '>') return '&gt;'; 
        return m; 
    }); 
}

function getTypeColor(type) {
    if (!typeColors.has(type)) {
        const index = typeColors.size % colorPalette.length;
        typeColors.set(type, colorPalette[index]);
    }
    return typeColors.get(type);
}

function showHistory() { 
    const modal = document.getElementById('historyModal'); 
    if (modal) { 
        resetHistoryFilters(); 
        renderHistoryList(); 
        modal.style.display = 'block'; 
    } 
}

function closeHistory() { 
    const modal = document.getElementById('historyModal'); 
    if (modal) modal.style.display = 'none'; 
}

function initTheme() {
    const savedTheme = localStorage.getItem('merch_theme');
    const themeToggle = document.getElementById('themeToggle');
    if (savedTheme === 'dark') { 
        document.body.classList.add('dark'); 
        if (themeToggle) themeToggle.textContent = '☀️'; 
    } else { 
        document.body.classList.remove('dark'); 
        if (themeToggle) themeToggle.textContent = '🌙'; 
    }
}

function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    if (document.body.classList.contains('dark')) { 
        document.body.classList.remove('dark'); 
        localStorage.setItem('merch_theme', 'light'); 
        if (themeToggle) themeToggle.textContent = '🌙'; 
    } else { 
        document.body.classList.add('dark'); 
        localStorage.setItem('merch_theme', 'dark'); 
        if (themeToggle) themeToggle.textContent = '☀️'; 
    }
}

function showProgressBar() {
    const container = document.getElementById('progressContainer');
    const bar = document.getElementById('progressBar');
    if (container && bar) {
        container.style.display = 'block';
        container.classList.add('active');
        bar.style.width = '0%';
        setTimeout(() => { if (bar) bar.style.width = '90%'; }, 50);
    }
}

function hideProgressBar() {
    const container = document.getElementById('progressContainer');
    const bar = document.getElementById('progressBar');
    if (container && bar) {
        bar.style.width = '100%';
        setTimeout(() => { container.style.display = 'none'; container.classList.remove('active'); bar.style.width = '0%'; }, 300);
    }
}

function showUpdateTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const timeElement = document.getElementById('update-time');
    if (timeElement) timeElement.innerText = `Обновлено: ${timeStr} 🍌`;
}
