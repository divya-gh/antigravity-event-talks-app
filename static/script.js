// State Management
let releaseNotes = [];
let filteredNotes = [];
let activeFilters = {
    search: '',
    category: 'all',
    date: 'all'
};
let currentTweetBase = {
    text: '',
    link: '',
    type: ''
};

// UI Elements
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const lastUpdatedText = document.getElementById('last-updated-text');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const dateSelect = document.getElementById('date-select');
const notesContainer = document.getElementById('notes-container');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const emptyState = document.getElementById('empty-state');
const retryBtn = document.getElementById('retry-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');
const exportCsvBtn = document.getElementById('export-csv-btn');

// Stats Elements
const statTotal = document.querySelector('#stat-total .stat-value');
const statFeatures = document.querySelector('#stat-features .stat-value');
const statIssues = document.querySelector('#stat-issues .stat-value');
const statAnnouncements = document.querySelector('#stat-announcements .stat-value');

// Modal Elements
const tweetModal = document.getElementById('tweet-modal');
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const progressCircle = document.querySelector('.progress-ring__circle');
const publishTweetBtn = document.getElementById('publish-tweet-btn');
const closeTweetBtn = document.getElementById('close-modal-btn');
const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
const suggestedTags = document.getElementById('suggested-tags');

// Toast Elements
const toast = document.getElementById('toast');
const toastText = document.getElementById('toast-text');

// Progress Ring Configuration
const ringRadius = 10;
const ringCircumference = 2 * Math.PI * ringRadius;
if (progressCircle) {
    progressCircle.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    progressCircle.style.strokeDashoffset = ringCircumference;
}

// Initialize application on load
document.addEventListener('DOMContentLoaded', () => {
    initializeTheme();
    fetchNotes(false);
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Refresh buttons
    refreshBtn.addEventListener('click', () => fetchNotes(true));
    retryBtn.addEventListener('click', () => fetchNotes(true));
    
    // Search inputs
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase().trim();
        searchClearBtn.style.display = activeFilters.search ? 'block' : 'none';
        applyFilters();
    });
    
    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        activeFilters.search = '';
        searchClearBtn.style.display = 'none';
        applyFilters();
    });
    
    // Category tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeFilters.category = tab.dataset.filter;
            applyFilters();
        });
    });
    
    // Date filter
    dateSelect.addEventListener('change', (e) => {
        activeFilters.date = e.target.value;
        applyFilters();
    });
    
    // Reset filters
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Theme toggle & CSV Export
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Modal buttons
    closeTweetBtn.addEventListener('click', hideTweetModal);
    cancelTweetBtn.addEventListener('click', hideTweetModal);
    
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) hideTweetModal();
    });
    
    // Textarea input watcher
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    // Hashtag pills
    document.querySelectorAll('.hashtag-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            pill.classList.toggle('active');
            rebuildTweetTextWithTags();
        });
    });
    
    // Publish Tweet on X
    publishTweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterUrl, '_blank');
        hideTweetModal();
        showToast('Redirected to X/Twitter!');
    });
}

// Fetch notes from Flask API
async function fetchNotes(forceRefresh = false) {
    showLoading(true);
    try {
        const url = `/api/notes?refresh=${forceRefresh}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const result = await response.json();
        releaseNotes = result.data;
        
        // Update last updated status
        const updateDate = new Date(result.last_updated * 1000);
        lastUpdatedText.textContent = `Synced: ${updateDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
        
        populateDateDropdown();
        calculateStats();
        applyFilters();
        
        if (forceRefresh) {
            showToast('Feed refreshed successfully!');
        }
    } catch (error) {
        console.error("Fetch failed:", error);
        errorMessage.textContent = `Could not load release notes: ${error.message}`;
        showError(true);
    } finally {
        showLoading(false);
    }
}

// UI State Switchers
function showLoading(isLoading) {
    if (isLoading) {
        loadingState.style.display = 'flex';
        notesContainer.style.display = 'none';
        errorState.style.display = 'none';
        emptyState.style.display = 'none';
        refreshIcon.classList.add('spinning');
        refreshBtn.disabled = true;
    } else {
        loadingState.style.display = 'none';
        refreshIcon.classList.remove('spinning');
        refreshBtn.disabled = false;
    }
}

function showError(isError) {
    if (isError) {
        errorState.style.display = 'flex';
        notesContainer.style.display = 'none';
        loadingState.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        errorState.style.display = 'none';
    }
}

// Populate Date Filter Dropdown dynamically based on data
function populateDateDropdown() {
    // Keep 'All' option
    dateSelect.innerHTML = '<option value="all">All Dates</option>';
    
    // Extract unique Month Year values
    const monthYears = [...new Set(releaseNotes.map(n => n.month_year).filter(Boolean))];
    
    monthYears.forEach(my => {
        const option = document.createElement('option');
        option.value = my;
        option.textContent = my;
        dateSelect.appendChild(option);
    });
    
    // Restore select value if it still exists
    if (monthYears.includes(activeFilters.date)) {
        dateSelect.value = activeFilters.date;
    } else {
        activeFilters.date = 'all';
    }
}

// Calculate feed statistics
function calculateStats() {
    let total = 0;
    let features = 0;
    let issues = 0;
    let announcements = 0;
    
    releaseNotes.forEach(entry => {
        entry.updates.forEach(up => {
            total++;
            const type = up.type.toLowerCase();
            if (type.includes('feature')) features++;
            else if (type.includes('issue') || type.includes('fix')) issues++;
            else if (type.includes('announcement')) announcements++;
        });
    });
    
    statTotal.textContent = total;
    statFeatures.textContent = features;
    statIssues.textContent = issues;
    statAnnouncements.textContent = announcements;
}

// Reset filters
function resetFilters() {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    dateSelect.value = 'all';
    
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    
    activeFilters = {
        search: '',
        category: 'all',
        date: 'all'
    };
    applyFilters();
}

// Filter the notes and render
function applyFilters() {
    filteredNotes = [];
    
    releaseNotes.forEach(entry => {
        // Date Month/Year check
        if (activeFilters.date !== 'all' && entry.month_year !== activeFilters.date) {
            return;
        }
        
        // Filter sub-updates
        const matchedUpdates = entry.updates.filter(up => {
            // Category check
            if (activeFilters.category !== 'all') {
                const type = up.type.toLowerCase();
                if (activeFilters.category === 'feature' && !type.includes('feature')) return false;
                if (activeFilters.category === 'announcement' && !type.includes('announcement')) return false;
                if (activeFilters.category === 'issue' && !type.includes('issue') && !type.includes('fix')) return false;
                if (activeFilters.category === 'deprecation' && !type.includes('deprecat')) return false;
            }
            
            // Search text check
            if (activeFilters.search) {
                const contentText = up.text_only.toLowerCase();
                const typeText = up.type.toLowerCase();
                const dateText = entry.date.toLowerCase();
                const query = activeFilters.search;
                
                return contentText.includes(query) || typeText.includes(query) || dateText.includes(query);
            }
            
            return true;
        });
        
        if (matchedUpdates.length > 0) {
            filteredNotes.push({
                ...entry,
                updates: matchedUpdates
            });
        }
    });
    
    renderNotes();
}

// Render filtered release notes to DOM
function renderNotes() {
    notesContainer.innerHTML = '';
    
    if (filteredNotes.length === 0) {
        notesContainer.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }
    
    emptyState.style.display = 'none';
    notesContainer.style.display = 'flex';
    
    filteredNotes.forEach(entry => {
        const card = document.createElement('article');
        card.className = 'release-card';
        
        // Card Header
        let headerHtml = `
            <div class="card-header">
                <div class="card-date-info">
                    <i class="fa-regular fa-calendar"></i>
                    <h2>${entry.date}</h2>
                </div>
                <div class="card-header-actions" style="display: flex; gap: 0.75rem; align-items: center;">
                    <button class="action-btn" onclick="copyCardContent('${escapeJSString(entry.date)}')">
                        <i class="fa-regular fa-copy"></i> Copy Card
                    </button>
                    ${entry.link ? `<a href="${entry.link}" target="_blank" class="original-link-btn">docs <i class="fa-solid fa-arrow-up-right-from-square"></i></a>` : ''}
                </div>
            </div>
        `;
        
        // Card Updates List
        let updatesHtml = '<div class="card-updates-list">';
        entry.updates.forEach(up => {
            const typeClass = getBadgeClass(up.type);
            const anchorLink = entry.link ? `${entry.link}` : '';
            
            updatesHtml += `
                <div class="update-item" id="item-${up.id}">
                    <div class="update-meta">
                        <span class="badge ${typeClass}">
                            <i class="${getBadgeIcon(up.type)}"></i> ${up.type}
                        </span>
                    </div>
                    <div class="update-description">
                        ${up.content}
                    </div>
                    <div class="update-actions">
                        <button class="action-btn btn-tweet-action" onclick="openTweetComposer('${up.id}', '${entry.date}', '${escapeJSString(up.type)}', '${escapeJSString(up.text_only)}', '${anchorLink}')">
                            <i class="fa-brands fa-x-twitter"></i> Tweet Update
                        </button>
                        <button class="action-btn" onclick="copyUpdateText('${up.id}')">
                            <i class="fa-regular fa-copy"></i> Copy Text
                        </button>
                        ${anchorLink ? `
                        <button class="action-btn" onclick="copyUpdateLink('${anchorLink}')">
                            <i class="fa-solid fa-link"></i> Copy Link
                        </button>` : ''}
                    </div>
                </div>
            `;
        });
        updatesHtml += '</div>';
        
        card.innerHTML = headerHtml + updatesHtml;
        notesContainer.appendChild(card);
    });
}

// Utility styling mappings
function getBadgeClass(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'badge-feature';
    if (t.includes('issue') || t.includes('fix')) return 'badge-issue';
    if (t.includes('announcement')) return 'badge-announcement';
    if (t.includes('deprecat')) return 'badge-deprecation';
    return 'badge-general';
}

function getBadgeIcon(type) {
    const t = type.toLowerCase();
    if (t.includes('feature')) return 'fa-solid fa-wand-magic-sparkles';
    if (t.includes('issue') || t.includes('fix')) return 'fa-solid fa-triangle-exclamation';
    if (t.includes('announcement')) return 'fa-solid fa-bullhorn';
    if (t.includes('deprecat')) return 'fa-solid fa-ban';
    return 'fa-solid fa-info-circle';
}

// Copy Action Handlers
function copyUpdateText(itemId) {
    const element = document.querySelector(`#item-${itemId} .update-description`);
    if (element) {
        // Use textContent to get clean text without HTML tags
        const text = element.textContent.trim().replace(/\s+/g, ' ');
        navigator.clipboard.writeText(text)
            .then(() => showToast('Update description copied!'))
            .catch(err => console.error('Copy failed', err));
    }
}

function copyUpdateLink(link) {
    navigator.clipboard.writeText(link)
        .then(() => showToast('Link to release notes copied!'))
        .catch(err => console.error('Copy failed', err));
}

// Toast System
function showToast(message) {
    toastText.textContent = message;
    toast.style.display = 'flex';
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 2500);
}

// Twitter Composer Actions
function openTweetComposer(itemId, date, type, textOnly, link) {
    currentTweetBase = {
        date: date,
        type: type,
        text: textOnly,
        link: link
    };
    
    // Set recommended active hashtag tags
    document.querySelectorAll('.hashtag-pill').forEach(pill => {
        const tag = pill.dataset.tag;
        if (tag === '#BigQuery' || tag === '#GoogleCloud') {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });
    
    rebuildTweetTextWithTags();
    showTweetModal();
}

function rebuildTweetTextWithTags() {
    const typeIndicator = currentTweetBase.type.toUpperCase();
    
    // Trim descriptive text to avoid overflow
    let desc = currentTweetBase.text;
    
    // Collect active tags
    const activeTagsList = [];
    document.querySelectorAll('.hashtag-pill.active').forEach(pill => {
        activeTagsList.push(pill.dataset.tag);
    });
    const tagsString = activeTagsList.join(' ');
    
    // Base templates structure:
    // "🚀 BigQuery [Type] ([Date]): [Desc] \n\n[Tags] \n[Link]"
    const prefix = `🚀 BigQuery ${typeIndicator} (${currentTweetBase.date}): `;
    const suffix = `\n\n${tagsString}\n${currentTweetBase.link}`;
    
    // 280 - prefix - suffix - extra buffer
    const maxDescLength = 280 - prefix.length - suffix.length - 4;
    
    if (desc.length > maxDescLength && maxDescLength > 10) {
        desc = desc.substring(0, maxDescLength) + '...';
    }
    
    tweetTextarea.value = `${prefix}${desc}${suffix}`;
    updateCharCounter();
}

function updateCharCounter() {
    const text = tweetTextarea.value;
    const len = text.length;
    charCounter.textContent = len;
    
    const counterArea = document.querySelector('.tweet-counter-area');
    counterArea.classList.remove('warning', 'danger');
    
    if (len >= 260 && len <= 280) {
        counterArea.classList.add('warning');
    } else if (len > 280) {
        counterArea.classList.add('danger');
    }
    
    // Update progress ring svg
    const progress = Math.min(len / 280, 1);
    const offset = ringCircumference - (progress * ringCircumference);
    
    if (progressCircle) {
        progressCircle.style.strokeDashoffset = offset;
        if (len > 280) {
            progressCircle.style.stroke = '#ff4d6d'; // Danger Red
        } else if (len >= 260) {
            progressCircle.style.stroke = '#ffb703'; // Warning Amber
        } else {
            progressCircle.style.stroke = '#1d9bf0'; // Twitter Sky Blue
        }
    }
    
    // Disable publish button if empty or if character limit exceeded
    publishTweetBtn.disabled = len === 0;
}

function showTweetModal() {
    tweetModal.style.display = 'flex';
    // Small timeout to allow browser layout rendering before setting class
    setTimeout(() => {
        tweetModal.classList.add('open');
    }, 10);
}

function hideTweetModal() {
    tweetModal.classList.remove('open');
    setTimeout(() => {
        tweetModal.style.display = 'none';
    }, 300);
}

// Helper: Escape string safely for Javascript inline attributes
function escapeJSString(str) {
    if (!str) return '';
    return str
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '&quot;')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Copy Card Content (All updates inside a single card)
function copyCardContent(date) {
    const entry = releaseNotes.find(e => e.date === date);
    if (!entry) return;
    
    let text = `📅 BigQuery Release Notes - ${entry.date}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    entry.updates.forEach((up, idx) => {
        text += `[${up.type.toUpperCase()}]\n`;
        text += `${up.text_only}\n`;
        if (idx < entry.updates.length - 1) {
            text += `\n----------------------------------------\n\n`;
        }
    });
    
    if (entry.link) {
        text += `\n\n🔗 Full Release Notes: ${entry.link}`;
    }
    
    navigator.clipboard.writeText(text)
        .then(() => showToast('Full card content copied!'))
        .catch(err => console.error('Copy failed', err));
}

// Export Filtered Release Notes to CSV
function exportToCSV() {
    if (filteredNotes.length === 0) {
        showToast('No notes to export!');
        return;
    }
    
    const rows = [
        ["Date", "Type", "Description", "Link"]
    ];
    
    filteredNotes.forEach(entry => {
        const date = entry.date;
        const link = entry.link || '';
        
        entry.updates.forEach(up => {
            const type = up.type;
            const desc = up.text_only;
            rows.push([date, type, desc, link]);
        });
    });
    
    const csvString = rows.map(row => 
        row.map(value => `"${value.replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `bigquery_release_notes_${timestamp}.csv`);
    document.body.appendChild(link);
    
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully!');
}

// Initialize Theme Mode
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isLight = savedTheme === 'light';
    if (isLight) {
        document.body.classList.add('light-theme');
    }
    updateThemeUI(isLight);
}

// Toggle Theme Mode
function toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    updateThemeUI(isLight);
}

// Update Theme Switcher Button UI
function updateThemeUI(isLight) {
    if (!themeIcon || !themeText) return;
    if (isLight) {
        themeIcon.className = 'fa-solid fa-moon';
        themeText.textContent = 'Dark Mode';
    } else {
        themeIcon.className = 'fa-solid fa-sun';
        themeText.textContent = 'Light Mode';
    }
}
