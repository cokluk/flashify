const { ipcRenderer } = require('electron');

const listContainer = document.getElementById('history-list');
const searchInput = document.getElementById('search-input');
const btnClear = document.getElementById('btn-clear');

let allHistory = [];

function loadHistory() {
    try {
       
        allHistory = ipcRenderer.sendSync('get-history');
        renderHistory(allHistory);
    } catch (error) {
        console.error(error);
        listContainer.innerHTML = '<div class="p-8 text-center text-red-500">Geçmiş yüklenirken hata oluştu.</div>';
    }
}

function renderHistory(items) {
    listContainer.innerHTML = '';
    
    if (items.length === 0) {
        listContainer.innerHTML = '<div class="p-8 text-center text-gray-500">Geçmiş boş.</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'p-4 hover:bg-gray-50 transition flex items-center group';
        div.innerHTML = `
            <div class="flex-shrink-0 mr-4 text-gray-400">
                <span class="material-icons text-sm">schedule</span>
                <span class="text-xs ml-1">${item.date.split(' ')[1] || item.date}</span>
            </div>
            <div class="flex-1 min-w-0 cursor-pointer" onclick="openUrl('${item.url}')">
                <div class="text-sm font-medium text-gray-900 truncate">${item.title || 'Başlıksız'}</div>
                <div class="text-xs text-gray-500 truncate">${item.url}</div>
            </div>
        `;
        listContainer.appendChild(div);
    });
}
 
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = allHistory.filter(item => 
        (item.title && item.title.toLowerCase().includes(query)) || 
        (item.url && item.url.toLowerCase().includes(query))
    );
    renderHistory(filtered);
});
 
btnClear.addEventListener('click', () => {
    if(confirm('Tüm geçmişi silmek istediğinize emin misiniz?')) {
        ipcRenderer.send('clear-history');
        allHistory = [];
        renderHistory([]);
    }
});
 
window.openUrl = (url) => {
    window.location.href = url;
};
 
loadHistory();
