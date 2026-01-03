const { ipcRenderer } = require('electron');

const tabsContainer = document.getElementById('tabs-container');
const webviewsContainer = document.getElementById('webviews-container');
const urlInput = document.getElementById('url-input');
const btnNewTab = document.getElementById('btn-new-tab');
const btnGo = document.getElementById('btn-go');
const btnBack = document.getElementById('btn-back');
const btnForward = document.getElementById('btn-forward');
const btnRefresh = document.getElementById('btn-refresh');
 
const btnMin = document.getElementById('btn-min');
const btnMax = document.getElementById('btn-max');
const btnClose = document.getElementById('btn-close');
 
const btnMenu = document.getElementById('btn-menu');
const appMenu = document.getElementById('app-menu');
const menuHistory = document.getElementById('menu-history');
const menuSettings = document.getElementById('menu-settings');
const menuDevTools = document.getElementById('menu-devtools');
const menuPrint = document.getElementById('menu-print');
const menuZoomIn = document.getElementById('menu-zoom-in');
const menuZoomOut = document.getElementById('menu-zoom-out');
const menuResetZoom = document.getElementById('menu-reset-zoom');
 
const ctxMenu = document.getElementById('custom-context-menu');
const ctxCopy = document.getElementById('ctx-copy');
const ctxPaste = document.getElementById('ctx-paste');
const ctxReload = document.getElementById('ctx-reload');
 
const i18n = {
    en: {
        newTab: 'New Tab',
        history: 'History',
        settings: 'Settings',
        devTools: 'Developer Tools',
        print: 'Print',
        zoomIn: 'Zoom In (+)',
        zoomOut: 'Zoom Out (-)',
        resetZoom: 'Reset',
        copy: 'Copy',
        paste: 'Paste',
        reload: 'Reload',
        searchPlaceholder: 'Search or enter address'
    },
    tr: {
        newTab: 'Yeni Sekme',
        history: 'Geçmiş',
        settings: 'Ayarlar',
        devTools: 'Geliştirici Araçları',
        print: 'Yazdır',
        zoomIn: 'Yakınlaştır (+)',
        zoomOut: 'Uzaklaştır (-)',
        resetZoom: 'Sıfırla',
        copy: 'Kopyala',
        paste: 'Yapıştır',
        reload: 'Yenile',
        searchPlaceholder: 'Ara veya adres girin'
    },
    ru: {
        newTab: 'Новая вкладка',
        history: 'История',
        settings: 'Настройки',
        devTools: 'Инструменты разработчика',
        print: 'Печать',
        zoomIn: 'Увеличить (+)',
        zoomOut: 'Уменьшить (-)',
        resetZoom: 'Сброс',
        copy: 'Копировать',
        paste: 'Вставить',
        reload: 'Перезагрузить',
        searchPlaceholder: 'Поиск или ввод адреса'
    }
};

let currentLang = localStorage.getItem('flashy-lang') || 'en';
let tabs = [];
let activeTabId = null;

function applyLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('flashy-lang', lang);
    const t = i18n[lang];
 
    menuHistory.textContent = t.history;
    menuSettings.textContent = t.settings;
    menuDevTools.textContent = t.devTools;
    menuPrint.textContent = t.print;
    menuZoomIn.textContent = t.zoomIn;
    menuZoomOut.textContent = t.zoomOut;
    menuResetZoom.textContent = t.resetZoom;
 
    ctxCopy.textContent = t.copy;
    ctxPaste.textContent = t.paste;
    ctxReload.textContent = t.reload;
 
    urlInput.placeholder = t.searchPlaceholder;
 
    tabs.forEach(tab => {
        const titleEl = tab.el.querySelector('.tab-title');
        if (Object.values(i18n).some(l => l.newTab === titleEl.textContent)) {
            titleEl.textContent = t.newTab;
        }
    });
}

function createTab(url = 'https://cokluk.github.io/flashy_landing/') {
    const tabId = Date.now();
 
    const tabEl = document.createElement('div');
 
    tabEl.className = 'flex items-center h-10 px-3 bg-gray-700 hover:bg-gray-700 rounded-t-lg cursor-pointer transition select-none group border-r border-gray-900 app-no-drag';
    tabEl.style.minWidth = '150px';
    tabEl.style.maxWidth = '200px';
    tabEl.dataset.id = tabId;
    tabEl.innerHTML = `
        <img src="images/icon.png" class="w-4 h-4 mr-2 rounded-sm tab-icon">
        <span class="text-xs text-gray-300 truncate flex-1 tab-title">${i18n[currentLang].newTab}</span>
        <span class="material-icons text-xs text-gray-500 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition close-tab">close</span>
    `;

    const webview = document.createElement('webview');
    webview.src = url;
    webview.setAttribute('plugins', 'true');
 
    webview.setAttribute('partition', 'persist:flashy');
 
    webview.useragent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
 
    if (url.includes('history.html') || url.includes('settings.html')) {
        webview.setAttribute('nodeintegration', 'true');
        webview.setAttribute('webpreferences', 'contextIsolation=false');
    }

    webview.dataset.id = tabId;
 
    webview.addEventListener('ipc-message', (event) => {
        if (event.channel === 'change-language') {
            applyLanguage(event.args[0]);
        }
    });
 
    webview.addEventListener('page-favicon-updated', (e) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab && e.favicons && e.favicons.length > 0) {
            const icon = tab.el.querySelector('.tab-icon');
            if (icon) icon.src = e.favicons[0];
        }
    });
 
    webview.addEventListener('did-start-loading', () => {
        const tab = tabs.find(t => t.id === tabId);
        if(tab) {
            tab.el.querySelector('.tab-title').textContent = 'Loading...';
       
            tab.el.querySelector('.tab-icon').src = 'images/icon.png';
        }

 
        const currentUrl = webview.getURL();
        if (currentUrl === 'https://www.adobe.com/products/flashplayer/end-of-life-alternative.html') {
            webview.loadURL('https://cokluk.com');
        }
    });

 
    webview.addEventListener('context-menu', (e) => {
        e.preventDefault();
        const params = e.params;
 
        ctxCopy.style.display = params.selectionText ? 'block' : 'none';

        ctxPaste.style.display = params.isEditable ? 'block' : 'none';
 
        ctxCopy.textContent = i18n[currentLang].copy;
        ctxPaste.textContent = i18n[currentLang].paste;
        ctxReload.textContent = i18n[currentLang].reload;
 
        const containerRect = webviewsContainer.getBoundingClientRect();
        const x = params.x + containerRect.left;
        const y = params.y + containerRect.top;
 
        ctxMenu.style.left = `${x}px`;
        ctxMenu.style.top = `${y}px`;
        ctxMenu.classList.remove('hidden');
 
        ctxMenu.dataset.tabId = tabId;
    });
    
    webview.addEventListener('did-stop-loading', () => {
        const tab = tabs.find(t => t.id === tabId);
        if(tab) {
 
            tab.el.querySelector('.tab-title').textContent = webview.getTitle();
            if (activeTabId === tabId) {
                try {
                    if (typeof webview.getURL === 'function') {
                        urlInput.value = webview.getURL();
                    } else {
                        urlInput.value = webview.src;
                    }
                } catch (e) {
                    urlInput.value = webview.src;
                }
            }
 
            try {
                const currentUrl = webview.getURL();
                if (!currentUrl.startsWith('file://') && !currentUrl.includes('history.html') && !currentUrl.includes('settings.html')) {
                    ipcRenderer.send('save-history', {
                        title: webview.getTitle(),
                        url: currentUrl,
                        date: new Date().toLocaleString(currentLang === 'tr' ? 'tr-TR' : 'en-US')
                    });
                }
            } catch (e) { console.error(e); }
        }
    });

    webview.addEventListener('new-window', (e) => {
        createTab(e.url);
    });
 
    tabsContainer.appendChild(tabEl);
    webviewsContainer.appendChild(webview);
 
    tabs.push({ id: tabId, el: tabEl, webview: webview });
 
    tabEl.addEventListener('click', (e) => {
        if (e.target.classList.contains('close-tab')) {
            closeTab(tabId);
        } else {
            setActiveTab(tabId);
        }
    });

    setActiveTab(tabId);
}

function closeTab(id) {
    const tabIndex = tabs.findIndex(t => t.id === id);
    if (tabIndex === -1) return;
    
    const tab = tabs[tabIndex];
    tab.el.remove();
    tab.webview.remove();
    tabs.splice(tabIndex, 1);
    
    if (tabs.length === 0) {
        createTab();
    } else if (activeTabId === id) {
   
        const newIndex = Math.max(0, tabIndex - 1);
        setActiveTab(tabs[newIndex].id);
    }
}

function setActiveTab(id) {
    activeTabId = id;
    
    tabs.forEach(t => {
        if (t.id === id) {
            t.el.classList.remove('bg-gray-800', 'text-gray-300');
            t.el.classList.add('bg-gray-200', 'text-gray-900');
            t.webview.classList.add('active');
    
            try {
                if (typeof t.webview.getURL === 'function') {
                    urlInput.value = t.webview.getURL();
                } else {
                    urlInput.value = t.webview.src;
                }
            } catch (e) {
         
                urlInput.value = t.webview.src;
            }
        } else {
            t.el.classList.add('bg-gray-800', 'text-gray-300');
            t.el.classList.remove('bg-gray-200', 'text-gray-900');
            t.webview.classList.remove('active');
        }
    });
}

function navigate() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    
    let url = urlInput.value;
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }
 
    if (typeof tab.webview.loadURL === 'function') {
        tab.webview.loadURL(url);
    } else {
        tab.webview.src = url;
    }
}
 
btnNewTab.addEventListener('click', () => createTab());
btnGo.addEventListener('click', navigate);
urlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') navigate();
});

btnBack.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && typeof tab.webview.canGoBack === 'function' && tab.webview.canGoBack()) {
        tab.webview.goBack();
    }
});

btnForward.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && typeof tab.webview.canGoForward === 'function' && tab.webview.canGoForward()) {
        tab.webview.goForward();
    }
});

btnRefresh.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
        if (typeof tab.webview.reload === 'function') {
            tab.webview.reload();
        } else {
            tab.webview.src = tab.webview.src; // Fallback reload
        }
    }
});
 
btnMenu.addEventListener('click', (e) => {
    e.stopPropagation();
    appMenu.classList.toggle('hidden');
});

document.addEventListener('click', (e) => {
    if (!btnMenu.contains(e.target) && !appMenu.contains(e.target)) {
        appMenu.classList.add('hidden');
    }
});

menuHistory.addEventListener('click', () => {
    createTab(`file://${__dirname}/history.html?lang=${currentLang}`);
    appMenu.classList.add('hidden');
});

menuSettings.addEventListener('click', () => {
    createTab(`file://${__dirname}/settings.html?lang=${currentLang}`);
    appMenu.classList.add('hidden');
});

menuDevTools.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) tab.webview.openDevTools();
    appMenu.classList.add('hidden');
});

menuPrint.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) tab.webview.print();
    appMenu.classList.add('hidden');
});

menuZoomIn.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
        const currentZoom = tab.webview.getZoomLevel();
        tab.webview.setZoomLevel(currentZoom + 0.5);
    }
});

menuZoomOut.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) {
        const currentZoom = tab.webview.getZoomLevel();
        tab.webview.setZoomLevel(currentZoom - 0.5);
    }
});

menuResetZoom.addEventListener('click', () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab) tab.webview.setZoomLevel(0);
    appMenu.classList.add('hidden');
});
 
ctxCopy.addEventListener('click', () => {
    const tabId = parseInt(ctxMenu.dataset.tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) tab.webview.copy();
    ctxMenu.classList.add('hidden');
});

ctxPaste.addEventListener('click', () => {
    const tabId = parseInt(ctxMenu.dataset.tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) tab.webview.paste();
    ctxMenu.classList.add('hidden');
});

ctxReload.addEventListener('click', () => {
    const tabId = parseInt(ctxMenu.dataset.tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) tab.webview.reload();
    ctxMenu.classList.add('hidden');
});
 
document.addEventListener('click', (e) => {
    if (!ctxMenu.contains(e.target)) {
        ctxMenu.classList.add('hidden');
    }
});
 
btnMin.addEventListener('click', () => ipcRenderer.send('minimize-window'));
btnMax.addEventListener('click', () => ipcRenderer.send('maximize-window'));
btnClose.addEventListener('click', () => ipcRenderer.send('close-window'));
 
applyLanguage(currentLang);
createTab();
