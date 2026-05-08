// ========== МОДУЛЬ ДЛЯ РАБОТЫ С ФОТО ==========

// Функция для сжатия изображения перед загрузкой
async function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    console.log(`Сжато: ${(file.size / 1024).toFixed(0)}KB → ${(blob.size / 1024).toFixed(0)}KB`);
                    resolve(blob);
                }, 'image/jpeg', quality);
            };
        };
    });
}

async function loadPhotoPreview(itemId) {
    console.log("loadPhotoPreview called with itemId:", itemId);
    
    const container = document.getElementById('photoPreviewContainer');
    if (!container) return;
    
    if (!itemId) {
        console.log("No itemId provided");
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
        return;
    }
    
    try {
        if (photoCache) photoCache.delete(itemId);
        
        const url = await getPhotoUrl(itemId);
        console.log("Preview URL:", url);
        
        if (url) {
            const urlWithCache = `${url}&_=${Date.now()}`;
            container.innerHTML = `<img src="${urlWithCache}" alt="Фото товара" style="max-width: 100%; max-height: 150px; border-radius: 8px; object-fit: contain; border: 1px solid var(--border-color);"
                onerror="this.onerror=null; console.error('Image failed to load:', this.src); this.parentElement.innerHTML='<div style=\"display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);\">❌ Ошибка загрузки фото</div>';">`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'inline-flex';
        } else {
            container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">📷 Нет фото</div>`;
            const deleteBtn = document.getElementById('deletePhotoBtn');
            if (deleteBtn) deleteBtn.style.display = 'none';
        }
    } catch(e) {
        console.error("Error loading photo preview:", e);
        container.innerHTML = `<div style="display: flex; align-items: center; justify-content: center; height: 150px; background: var(--badge-bg); border-radius: 8px; color: var(--text-muted);">❌ Ошибка: ${e.message}</div>`;
    }
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    console.log("Выбран файл:", {
        name: file.name,
        type: file.type,
        size: (file.size / 1024).toFixed(2) + " KB"
    });
    
    if (!file.type.startsWith('image/')) {
        showToast("Пожалуйста, выберите изображение", false);
        return;
    }
    
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    showToast("Сжатие фото...", true);
    
    let fileToUpload = file;
    
    if (file.size > 500 * 1024) {
        try {
            const compressedBlob = await compressImage(file, 1024, 1024, 0.8);
            fileToUpload = new File([compressedBlob], 'photo.jpg', { type: 'image/jpeg' });
            showToast(`Размер после сжатия: ${(fileToUpload.size / 1024).toFixed(0)}KB`, true);
        } catch(e) {
            console.warn("Сжатие не удалось:", e);
        }
    }
    
    showToast("Загрузка фото...", true);
    const success = await uploadPhoto(currentEditId, fileToUpload);
    
    if (success) {
        setTimeout(async () => {
            if (photoCache) photoCache.delete(currentEditId);
            await loadPhotoPreview(currentEditId);
        }, 500);
        
        const fileInput = document.getElementById('photoFileInput');
        if (fileInput) fileInput.value = '';
    }
}

async function handleDeletePhoto() {
    if (!currentEditId) {
        showToast("Товар не выбран", false);
        return;
    }
    
    if (confirm("Удалить фото товара?")) {
        showToast("Удаление фото...", true);
        const success = await deletePhoto(currentEditId);
        if (success) {
            if (photoCache) photoCache.delete(currentEditId);
            await loadPhotoPreview(currentEditId);
        }
    }
}

function openPhotoModal(itemId, itemName) {
    currentPhotoItemId = itemId;
    currentPhotoItemName = itemName;
    
    const modal = document.getElementById('photoViewModal');
    const title = document.getElementById('photoModalTitle');
    const content = document.getElementById('photoModalContent');
    
    if (title) title.textContent = `📷 ${escapeHtml(itemName)}`;
    
    if (content) {
        content.innerHTML = '<div class="loading">Загрузка фото...</div>';
    }
    
    if (modal) modal.style.display = 'block';
    
    loadPhotoToModal(itemId);
}

async function loadPhotoToModal(itemId) {
    const content = document.getElementById('photoModalContent');
    if (!content) return;
    
    try {
        if (photoCache) photoCache.delete(itemId);
        
        const url = await getPhotoUrl(itemId);
        
        if (url) {
            const urlWithCache = `${url}&_=${Date.now()}`;
            content.innerHTML = `<img src="${urlWithCache}" alt="Фото товара" style="max-width: 100%; max-height: 60vh; border-radius: 12px; object-fit: contain;">`;
        } else {
            content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">📷 Фото не добавлено</div>`;
        }
    } catch(e) {
        console.error("Error loading photo to modal:", e);
        content.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">❌ Ошибка загрузки фото</div>`;
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoViewModal');
    if (modal) modal.style.display = 'none';
    currentPhotoItemId = null;
    currentPhotoItemName = null;
}

function initPhotoUploadInEditModal() {
    const fileInput = document.getElementById('photoFileInput');
    const deleteBtn = document.getElementById('deletePhotoBtn');
    const uploadBtn = document.getElementById('uploadPhotoBtn');
    
    console.log("Инициализация загрузки фото");
    
    if (uploadBtn) {
        const newUploadBtn = uploadBtn.cloneNode(true);
        uploadBtn.parentNode.replaceChild(newUploadBtn, uploadBtn);
        
        newUploadBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Кнопка загрузки нажата");
            if (fileInput) fileInput.click();
        });
    }
    
    if (fileInput) {
        const newFileInput = fileInput.cloneNode(true);
        fileInput.parentNode.replaceChild(newFileInput, fileInput);
        
        newFileInput.addEventListener('change', function(e) {
            console.log("Файл выбран");
            const file = e.target.files[0];
            if (file) handlePhotoUpload(e);
        });
    }
    
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        
        newDeleteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("Кнопка удаления нажата");
            handleDeletePhoto();
        });
    }
}
