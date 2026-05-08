// ========== ИНСТРУКЦИЯ ==========

let instructionsSections = [];
let currentSearchTerm = '';

// Загрузка инструкции из HTML-файла
async function loadInstructionsContent() {
    try {
        const response = await fetch('instructions.html');
        const html = await response.text();
        
        // Создаём временный контейнер
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Сохраняем содержимое для дальнейшей работы
        window.instructionsHTML = temp.innerHTML;
        
        return true;
    } catch(e) {
        console.error("Ошибка загрузки инструкции:", e);
        return false;
    }
}

// Открыть модальное окно с инструкцией
async function openInstructionsModal() {
    const modal = document.getElementById('instructionsModal');
    if (!modal) return;
    
    const contentContainer = document.getElementById('instructions-content');
    if (!contentContainer) return;
    
    // Показываем загрузку
    contentContainer.innerHTML = '<div class="loading">Загрузка инструкции...</div>';
    modal.style.display = 'block';
    
    // Загружаем контент если ещё не загружен
    if (!window.instructionsHTML) {
        await loadInstructionsContent();
    }
    
    if (!window.instructionsHTML) {
        contentContainer.innerHTML = '<div class="loading">❌ Ошибка загрузки инструкции</div>';
        return;
    }
    
    // Фильтруем разделы по роли пользователя
    const isOrganizer = window.CURRENT_USER?.role === 'organizer';
    const temp = document.createElement('div');
    temp.innerHTML = window.instructionsHTML;
    
    // Удаляем разделы, которые не должны видеть художники
    if (!isOrganizer) {
        const organizerSections = temp.querySelectorAll('.instruction-section[data-role="organizer"]');
        organizerSections.forEach(section => section.remove());
    }
    
    // Убираем старые обработчики и обновляем контент
    contentContainer.innerHTML = temp.innerHTML;
    
    // Собираем информацию о разделах
    collectSectionsInfo();
    
    // Создаём оглавление
    generateTOC();
    
    // Инициализируем поиск
    initSearchInstructions();
    
    // Инициализируем навигацию по оглавлению
    initTOCNavigation();
}

// Сбор информации о разделах (заголовки, id, содержимое)
function collectSectionsInfo() {
    const sections = document.querySelectorAll('#instructions-content .instruction-section');
    instructionsSections = [];
    
    sections.forEach((section, index) => {
        const titleElement = section.querySelector('h2');
        const title = titleElement ? titleElement.innerText : 'Раздел';
        const content = section.querySelector('.section-content')?.innerText || '';
        
        // Генерируем уникальный ID для раздела
        const sectionId = `section_${index}_${Date.now()}`;
        section.id = sectionId;
        
        instructionsSections.push({
            id: sectionId,
            title: title,
            content: content,
            element: section,
            originalHTML: section.outerHTML
        });
    });
}

// Генерация оглавления
function generateTOC() {
    const tocContainer = document.getElementById('tocContainer');
    if (!tocContainer) return;
    
    if (instructionsSections.length === 0) {
        tocContainer.innerHTML = '<div style="color: var(--text-muted);">Нет разделов</div>';
        return;
    }
    
    let html = '';
    for (const section of instructionsSections) {
        // Извлекаем иконку из заголовка
        const iconMatch = section.title.match(/^([^\w\s])/);
        const icon = iconMatch ? iconMatch[1] : '📄';
        const cleanTitle = section.title.replace(/^[^\w\s]+\s*/, '');
        
        html += `<button class="toc-item" data-section-id="${section.id}" style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 30px; padding: 6px 14px; font-size: 13px; cursor: pointer; color: var(--text-primary); transition: all 0.2s;">
                    ${icon} ${escapeHtml(cleanTitle)}
                </button>`;
    }
    
    tocContainer.innerHTML = html;
    
    // Добавляем обработчики для кнопок оглавления
    document.querySelectorAll('.toc-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const sectionId = btn.dataset.sectionId;
            scrollToSection(sectionId);
        });
        
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'var(--btn-bg)';
            btn.style.color = 'white';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'var(--card-bg)';
            btn.style.color = 'var(--text-primary)';
        });
    });
}

// Плавный скролл к разделу
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;
    
    const container = document.getElementById('instructions-content');
    if (!container) return;
    
    const offsetTop = section.offsetTop - 20;
    container.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
    });
}

// Инициализация навигации по ссылкам "Вернуться к оглавлению"
function initTOCNavigation() {
    const links = document.querySelectorAll('#instructions-content .toc-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const container = document.getElementById('instructions-content');
            if (container) {
                container.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Инициализация поиска по инструкции
function initSearchInstructions() {
    const searchInput = document.getElementById('instructionsSearchInput');
    if (!searchInput) return;
    
    // Убираем старый обработчик
    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
    
    newSearchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.trim().toLowerCase();
        filterSectionsBySearch(currentSearchTerm);
    });
}

// Фильтрация разделов по поисковому запросу
function filterSectionsBySearch(searchTerm) {
    const sections = document.querySelectorAll('#instructions-content .instruction-section');
    const resultsCount = document.getElementById('searchResultsCount');
    
    if (!searchTerm) {
        // Показываем все разделы
        sections.forEach(section => {
            section.style.display = 'block';
            removeHighlights(section);
        });
        if (resultsCount) resultsCount.textContent = '';
        return;
    }
    
    let visibleCount = 0;
    
    sections.forEach(section => {
        const content = section.innerText.toLowerCase();
        const title = section.querySelector('h2')?.innerText.toLowerCase() || '';
        
        // Проверяем наличие поискового запроса в заголовке или содержимом
        if (title.includes(searchTerm) || content.includes(searchTerm)) {
            section.style.display = 'block';
            highlightSearchTerm(section, searchTerm);
            visibleCount++;
        } else {
            section.style.display = 'none';
        }
    });
    
    if (resultsCount) {
        const resultText = visibleCount === 0 
            ? '😕 Ничего не найдено' 
            : `🔍 Найдено разделов: ${visibleCount}`;
        resultsCount.textContent = resultText;
        
        if (visibleCount === 0) {
            resultsCount.style.color = 'var(--minus-color)';
        } else {
            resultsCount.style.color = 'var(--text-muted)';
        }
    }
}

// Подсветка найденных слов
function highlightSearchTerm(section, searchTerm) {
    // Удаляем старые подсветки
    removeHighlights(section);
    
    // Сохраняем оригинальный HTML если нужно
    if (!section.dataset.originalHtml) {
        section.dataset.originalHtml = section.innerHTML;
    }
    
    let html = section.dataset.originalHtml;
    const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
    
    // Подсвечиваем только в текстовых узлах (оборачиваем в <mark>)
    html = html.replace(regex, '<mark class="search-highlight" style="background: #f39c12; color: #333; border-radius: 4px; padding: 0 2px;">$1</mark>');
    
    section.innerHTML = html;
    
    // Восстанавливаем структуру (сохраняем data-original-html для сброса)
    section.dataset.highlightedHtml = html;
}

// Удаление подсветки
function removeHighlights(section) {
    if (section.dataset.originalHtml) {
        section.innerHTML = section.dataset.originalHtml;
    } else {
        const marks = section.querySelectorAll('mark');
        marks.forEach(mark => {
            const parent = mark.parentNode;
            parent.replaceChild(document.createTextNode(mark.textContent), mark);
            parent.normalize();
        });
    }
}

// Экранирование для регулярного выражения
function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Закрыть модальное окно инструкции
function closeInstructionsModal() {
    const modal = document.getElementById('instructionsModal');
    if (modal) modal.style.display = 'none';
    
    // Сбрасываем поиск при закрытии
    currentSearchTerm = '';
    const searchInput = document.getElementById('instructionsSearchInput');
    if (searchInput) searchInput.value = '';
    
    // Восстанавливаем все разделы
    const sections = document.querySelectorAll('#instructions-content .instruction-section');
    sections.forEach(section => {
        section.style.display = 'block';
        if (section.dataset.originalHtml) {
            section.innerHTML = section.dataset.originalHtml;
        }
    });
    
    const resultsCount = document.getElementById('searchResultsCount');
    if (resultsCount) resultsCount.textContent = '';
}

// Делаем функции глобальными
window.openInstructionsModal = openInstructionsModal;
window.closeInstructionsModal = closeInstructionsModal;
window.scrollToSection = scrollToSection;
