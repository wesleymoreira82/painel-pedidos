// State Management
let orders = [];

// DOM Elements
const ordersTableBody = document.getElementById('ordersTableBody');
const emptyState = document.getElementById('emptyState');
const addOrderBtn = document.getElementById('addOrderBtn');
const addFirstOrderBtn = document.getElementById('addFirstOrderBtn');
const searchInput = document.getElementById('searchInput');
const statCards = document.querySelectorAll('.stat-card');

// Modal Elements
const orderModal = document.getElementById('orderModal');
const deleteModal = document.getElementById('deleteModal');
const closeModals = document.querySelectorAll('.close-modal');
const orderForm = document.getElementById('orderForm');
const modalTitle = document.getElementById('modalTitle');
const editIndexInput = document.getElementById('editIndex');

// History Modal Elements
const historyModal = document.getElementById('historyModal');
const historyPedidoNum = document.getElementById('historyPedidoNum');
const historyStatusBadge = document.getElementById('historyStatusBadge');
const historyTimeline = document.getElementById('historyTimeline');

// Form Inputs
const dataInput = document.getElementById('dataInput');
const nfInput = document.getElementById('nfInput');
const blingInput = document.getElementById('blingInput');
const pedidoInput = document.getElementById('pedidoInput');
const pedidoError = document.getElementById('pedidoError');

const origemSelect = document.getElementById('origemSelect');
const origemLabel = document.getElementById('origemLabel');
const origemDropdown = document.getElementById('origemDropdown');
const origemCheckboxes = document.querySelectorAll('.origem-checkbox');
const origemInput = document.getElementById('origemInput'); // Hidden input to store values

const statusInput = document.getElementById('statusInput');
const obsInput = document.getElementById('obsInput');
const resolucaoInput = document.getElementById('resolucaoInput');

// Generator Elements
const problemaSelect = document.getElementById('problemaSelect');
const generateObsBtn = document.getElementById('generateObsBtn');

// Delete Elements
let orderToDelete = -1;
let currentFilter = null; // null means show all
const deletePedidoNum = document.getElementById('deletePedidoNum');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');

// Toast
const toast = document.getElementById('toast');
const toastMessage = document.querySelector('.toast-message');

// CSV Database Elements
const importCsvBtn = document.getElementById('importCsvBtn');
const csvFileInput = document.getElementById('csvFileInput');
const dbRowCount = document.getElementById('dbRowCount');

// DHL Result Card Elements
const dhlResultCard = document.getElementById('dhlResultCard');
const dhlOrderIdEl = document.getElementById('dhlOrderId');
const dhlTrackingEl = document.getElementById('dhlTracking');
const dhlNfEl = document.getElementById('dhlNf');
const dhlStatusEl = document.getElementById('dhlStatus');
const dhlEventDateEl = document.getElementById('dhlEventDate');
const dhlExpectedDateEl = document.getElementById('dhlExpectedDate');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
    setDefaultDate();
    setupEventListeners();
});

// Logic
function loadOrders() {
    const savedOrders = localStorage.getItem('registro_pedidos');
    if (savedOrders) {
        orders = JSON.parse(savedOrders);
    }
    renderTable();
}

function saveOrders() {
    localStorage.setItem('registro_pedidos', JSON.stringify(orders));
    updateStats();
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    dataInput.value = today;
}

function formatDateBr(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

function setupEventListeners() {
    // Buttons
    addOrderBtn.addEventListener('click', () => openModal());
    addFirstOrderBtn.addEventListener('click', () => openModal());
    
    // Modals
    closeModals.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    
    cancelDeleteBtn.addEventListener('click', () => {
        deleteModal.classList.remove('active');
        orderToDelete = -1;
    });

    confirmDeleteBtn.addEventListener('click', () => {
        if (orderToDelete > -1) {
            orders.splice(orderToDelete, 1);
            saveOrders();
            renderTable();
            deleteModal.classList.remove('active');
            showToast('Pedido excluído com sucesso.');
        }
    });

    // Form Submit
    orderForm.addEventListener('submit', handleFormSubmit);

    // Search
    searchInput.addEventListener('input', (e) => renderTable(e.target.value));

    // Generate OBS logic
    generateObsBtn.addEventListener('click', generateObsText);

    // Stat Cards Filtering
    statCards.forEach(card => {
        card.addEventListener('click', () => {
            const status = card.getAttribute('data-filter');
            
            // Toggle filter
            if (currentFilter === status) {
                currentFilter = null;
                card.classList.remove('active');
            } else {
                currentFilter = status;
                statCards.forEach(c => c.classList.remove('active'));
                card.classList.add('active');
            }
            
            // Reset search when filtering by card to avoid confusion
            searchInput.value = '';
            renderTable();
        });
    });

    // Instant Validation for Numero do Pedido
    pedidoInput.addEventListener('input', validatePedidoRealTime);
    
    // Numbers only formatting for NF and Bling
    nfInput.addEventListener('input', function() { this.value = this.value.replace(/\D/g, ''); });
    blingInput.addEventListener('input', function() { this.value = this.value.replace(/\D/g, ''); });

    // Custom Origem Select Listeners
    origemCheckboxes.forEach(cb => {
        cb.addEventListener('change', updateOrigemLabel);
    });

    // Close click outside dropdown
    document.addEventListener('click', (e) => {
        if (!origemSelect.contains(e.target)) {
            origemDropdown.classList.remove('active');
            origemSelect.querySelector('.select-box').classList.remove('active');
        }
    });

    // File Input trigger
    importCsvBtn.addEventListener('click', () => csvFileInput.click());
    csvFileInput.addEventListener('change', handleCsvUpload);

    // DHL Database Querying (on focus out of inputs)
    pedidoInput.addEventListener('blur', queryDhlDatabase);
    blingInput.addEventListener('blur', queryDhlDatabase);
}

function validatePedidoRealTime() {
    const pedidoNum = pedidoInput.value.trim();
    if (!pedidoNum) {
        pedidoError.style.display = 'none';
        pedidoInput.parentElement.classList.remove('error');
        return true;
    }

    const index = parseInt(editIndexInput.value);
    const isDuplicate = orders.some((o, i) => o.pedido === pedidoNum && i !== index);
    
    if (isDuplicate) {
        pedidoError.textContent = 'Atenção: Este número de pedido já está registrado no sistema!';
        pedidoError.style.display = 'block';
        pedidoInput.parentElement.classList.add('error');
        return false;
    } else {
        pedidoError.style.display = 'none';
        pedidoInput.parentElement.classList.remove('error');
        return true;
    }
}

function toggleOrigemDropdown() {
    origemDropdown.classList.toggle('active');
    origemSelect.querySelector('.select-box').classList.toggle('active');
}

function updateOrigemLabel() {
    const selected = Array.from(origemCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    origemInput.value = selected.join(', ');
    
    if (selected.length === 0) {
        origemLabel.textContent = 'Selecione as origens...';
    } else if (selected.length === 2) {
        origemLabel.textContent = 'DHL, Fortaleza';
    } else {
        origemLabel.textContent = selected[0];
    }
}

function openModal(index = -1) {
    // Reset Form
    orderForm.reset();
    setDefaultDate();
    document.getElementById('pedidoError').style.display = 'none';
    pedidoInput.parentElement.classList.remove('error');
    
    // Reset DB Card
    dhlResultCard.style.display = 'none';

    editIndexInput.value = index;

    if (index > -1) {
        modalTitle.textContent = 'Editar Registro';
        const order = orders[index];
        dataInput.value = order.data || '';
        nfInput.value = order.nf || '';
        blingInput.value = order.bling || '';
        pedidoInput.value = order.pedido || '';
        
        // Handle Multi-select Origem custom UI
        const orderOrigens = order.origem ? order.origem.split(', ') : [];
        origemCheckboxes.forEach(cb => {
            cb.checked = orderOrigens.includes(cb.value);
        });
        updateOrigemLabel();

        statusInput.value = order.status || '0';
        obsInput.value = order.obs || '';
        resolucaoInput.value = order.resolucao || '';
    } else {
        modalTitle.textContent = 'Novo Registro';
        origemCheckboxes.forEach(cb => cb.checked = false);
        updateOrigemLabel();
    }

    orderModal.classList.add('active');
}

function closeModal() {
    orderModal.classList.remove('active');
    historyModal.classList.remove('active');
}

function openHistoryModal(index) {
    const order = orders[index];
    if (!order) return;

    historyPedidoNum.textContent = order.pedido;
    
    // Status Badge
    historyStatusBadge.className = `status-badge status-badge-${order.status}`;
    historyStatusBadge.textContent = `${order.status} - ${getStatusLabel(order.status)}`;

    // Render Timeline
    historyTimeline.innerHTML = '';
    
    if (order.history && order.history.length > 0) {
        // Sort history descending (newest first)
        const sortedHistory = [...order.history].reverse();
        
        sortedHistory.forEach(event => {
            const isCreated = event.action === 'Pedido Registrado';
            const itemClass = isCreated ? 'created' : 'updated';
            
            const dateObj = new Date(event.date);
            const formattedDate = `${dateObj.toLocaleDateString('pt-BR')} às ${dateObj.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}`;

            let changesHtml = '';
            if (event.changes && event.changes.length > 0) {
                // Modified to only show the NEW value rather than old -> new
                changesHtml = `<div class="timeline-change">
                    ${event.changes.map(c => `<div><strong>${c.field}:</strong> ${c.new}</div>`).join('')}
                </div>`;
            }

            const itemHtml = `
                <div class="timeline-item ${itemClass}">
                    <div class="timeline-marker"></div>
                    <div class="timeline-content">
                        <div class="timeline-header">
                            <span class="timeline-title">${event.action}</span>
                            <span class="timeline-date">${formattedDate}</span>
                        </div>
                        ${event.details ? `<div class="timeline-body">${event.details}</div>` : ''}
                        ${changesHtml}
                    </div>
                </div>
            `;
            historyTimeline.insertAdjacentHTML('beforeend', itemHtml);
        });
    } else {
        historyTimeline.innerHTML = '<div class="text-muted text-center" style="padding: 20px;">Nenhum histórico disponível para este pedido.</div>';
    }

    historyModal.classList.add('active');
}

function generateObsText() {
    // Check if the old element name or new was grabbed. In HTML we made it problemaSelect.
    const tipo = problemaSelect.value;
    if (!tipo) return;

    let text = "";

    // Old logic removed because sub-options are no longer needed
    switch (tipo) {
        case 'extravio_reembolso':
            text = "Pedido extraviado, cliente quer o reembolso!";
            break;
        case 'extravio_reenvio':
            text = "Pedido extraviado, cliente quer o reenvio!";
            break;
        case 'devolucao_correta':
            text = "Confirmamos o endereco e está igual ao da loja!";
            break;
        case 'devolucao_errada':
            text = "Cliente errou o endereco, solicita o link de pagamento para reenvio";
            break;
        case 'cancelado_dhl':
            text = "Verificando o motivo do cancelamento. CSS: XXXX";
            break;
    }

    // Append to textarea if empty, otherwise add newlines
    if (obsInput.value.trim() === '') {
        obsInput.value = text;
    } else {
        obsInput.value += `\n\n${text}`;
    }
}

function handleFormSubmit(e) {
    e.preventDefault();

    const pedidoNum = pedidoInput.value.trim();
    const index = parseInt(editIndexInput.value);

    // Re-validate Unique 'Número Pedido'
    if (!validatePedidoRealTime()) {
        return;
    }

    const orderData = {
        data: dataInput.value,
        nf: nfInput.value.trim(),
        bling: blingInput.value.trim(),
        pedido: pedidoNum,
        origem: origemInput.value, // Taken from the hidden input managed by the checkboxes
        status: statusInput.value,
        obs: obsInput.value.trim(),
        resolucao: resolucaoInput.value.trim(),
        history: []
    };

    if (index > -1) {
        const oldOrder = orders[index];
        orderData.history = oldOrder.history || [];
        
        // Determine changes (only explicitly what changed)
        let changes = [];
        if (oldOrder.status !== orderData.status) {
            changes.push({ field: 'Status', new: getStatusLabel(orderData.status) });
        }
        if (oldOrder.origem !== orderData.origem) {
            changes.push({ field: 'Origem', new: orderData.origem || '(vazio)' });
        }
        if (oldOrder.resolucao !== orderData.resolucao) {
            changes.push({ field: 'Resolução', new: orderData.resolucao || '(vazio)' });
        }
        if (oldOrder.obs !== orderData.obs) {
            changes.push({ field: 'OBS', new: orderData.obs || '(vazio)' });
        }

        if (changes.length > 0) {
            orderData.history.push({
                date: new Date().toISOString(),
                action: 'Atualização de Registro',
                details: null, // No details needed if we just print the changes
                changes: changes
            });
        }
        
        orders[index] = orderData;
        showToast('Registro atualizado com sucesso!');
    } else {
        orderData.history.push({
            date: new Date().toISOString(),
            action: 'Pedido Registrado',
            details: `Registrado no status: ${getStatusLabel(orderData.status)}\nOrigem: ${orderData.origem || 'Não informada'}`,
            changes: []
        });

        orders.unshift(orderData); // Add to beginning
        showToast('Pedido registrado com sucesso!');
    }

    saveOrders();
    renderTable();
    closeModal();
}

function promptDelete(index) {
    orderToDelete = index;
    deletePedidoNum.textContent = orders[index].pedido;
    deleteModal.classList.add('active');
}

function getStatusLabel(status) {
    const labels = {
        '0': 'Novo',
        '1': 'Em resolução',
        '2': 'Em análise',
        '3': 'Atenção',
        '4': 'Aguardando retorno',
        '5': 'OK',
        '6': 'Finalizado'
    };
    return labels[status] || status;
}

function renderTable(searchTerm = '') {
    ordersTableBody.innerHTML = '';
    
    let filteredOrders = orders;
    
    // Check Card Filter first
    if (currentFilter !== null) {
        filteredOrders = filteredOrders.filter(o => o.status === currentFilter);
    }

    // Then Check Search Term
    filteredOrders = filteredOrders.filter(o => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            (o.pedido && o.pedido.toLowerCase().includes(term)) ||
            (o.nf && o.nf.toLowerCase().includes(term)) ||
            (o.bling && o.bling.toLowerCase().includes(term)) ||
            (o.obs && o.obs.toLowerCase().includes(term)) ||
            (o.origem && o.origem.toLowerCase().includes(term)) ||
            (o.resolucao && o.resolucao.toLowerCase().includes(term))
        );
    });

    if (filteredOrders.length === 0 && orders.length === 0) {
        emptyState.classList.add('active');
        document.querySelector('table').style.display = 'none';
    } else {
        emptyState.classList.remove('active');
        document.querySelector('table').style.display = 'table';

        if (filteredOrders.length === 0 && searchTerm) {
            ordersTableBody.innerHTML = `<tr><td colspan="9" class="text-center text-muted">Nenhum pedido encontrado para "${searchTerm}".</td></tr>`;
        }

        filteredOrders.forEach((order, index) => {
            // we use the actual index in the raw array for editing/deleting
            const originalIndex = orders.indexOf(order);
            
            const tr = document.createElement('tr');
            tr.className = `row-status-${order.status}`;
            tr.onclick = function(e) {
                // Ignore clicks on the actions cell or its buttons
                if (e.target.closest('.actions-cell') || e.target.closest('button')) return;
                openHistoryModal(originalIndex);
            };
            
            // Limit text length for OBS/Resolução in table view
            const shortObs = order.obs.length > 50 ? order.obs.substring(0, 50) + '...' : order.obs;
            const shortRes = order.resolucao.length > 50 ? order.resolucao.substring(0, 50) + '...' : order.resolucao;

            tr.innerHTML = `
                <td>${formatDateBr(order.data)}</td>
                <td>${order.nf || '-'}</td>
                <td>${order.bling || '-'}</td>
                <td><strong>${order.pedido}</strong></td>
                <td>${order.origem || '-'}</td>
                <td title="${order.obs}">${shortObs || '-'}</td>
                <td><span class="status-badge status-badge-${order.status}">${order.status} - ${getStatusLabel(order.status)}</span></td>
                <td title="${order.resolucao}">${shortRes || '-'}</td>
                <td>
                    <div class="actions-cell">
                        <button class="btn-icon edit-btn" onclick="openModal(${originalIndex})" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-icon delete-btn" onclick="promptDelete(${originalIndex})" title="Excluir"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            ordersTableBody.appendChild(tr);
        });
    }
    
    updateStats();
}

function updateStats() {
    const counts = { '0': 0, '1': 0, '3': 0, '4': 0, '6': 0 };
    
    orders.forEach(o => {
        if (counts[o.status] !== undefined) {
            counts[o.status]++;
        }
    });

    const count0El = document.getElementById('count-0');
    if(count0El) count0El.textContent = counts['0'];
    document.getElementById('count-1').textContent = counts['1'];
    document.getElementById('count-3').textContent = counts['3'];
    document.getElementById('count-4').textContent = counts['4'];
    
    const count5El = document.getElementById('count-5');
    if(count5El) count5El.textContent = counts['5'];
    
    document.getElementById('count-6').textContent = counts['6'];
}

/* =========================================
   DHL CSV DATABASE LOGIC (LocalStorage + PapaParse)
   ========================================= */

let dhlDatabase = [];
let db;
const DB_NAME = 'DHL_Database';
const DB_VERSION = 5; // increment to force recreate
const STORE_NAME = 'csv_cache';

function initDatabase() {
    // Attempt to clear old localStorage if it exists so we don't hog space
    localStorage.removeItem('dhl_database');

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
        console.error("Database error: " + event.target.error);
    };

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        // Wipe old stores if they exist to start fresh
        if (db.objectStoreNames.contains('orders')) {
            db.deleteObjectStore('orders');
        }
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        // Load the massive array from IDB into memory
        const transaction = db.transaction([STORE_NAME], "readonly");
        const objectStore = transaction.objectStore(STORE_NAME);
        const getRequest = objectStore.get('dhl_data');
        
        getRequest.onsuccess = () => {
            if (getRequest.result) {
                dhlDatabase = getRequest.result;
                updateDbRowCount();
            }
        };
    };
}

function handleCsvUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    importCsvBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Lendo arquivo...';
    importCsvBtn.disabled = true;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            importCsvBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Salvando dados...';
            // Slight timeout to let UI update
            setTimeout(() => {
                saveDataToStorage(results.data);
            }, 50);
        },
        error: function(error) {
            showToast("Erro ao ler o CSV: " + error.message);
            resetImportBtn();
        }
    });

    // Reset file input so same file can trigger change event again if needed
    event.target.value = '';
}

function saveDataToStorage(dataArray) {
    // Quick sanitization
    const cleanData = dataArray.map(row => {
        const cleanRow = {};
        for (let key in row) {
            cleanRow[key.trim()] = row[key];
        }
        return cleanRow;
    });

    // 1. Keep in memory for instant queries
    dhlDatabase = cleanData;
    updateDbRowCount();
    showToast(`${cleanData.length} registros lidos. Salvando no disco...`);
    resetImportBtn();

    // 2. Save entire array as a single object in IndexedDB. 
    // This bypasses the 5MB size limit of localStorage and is lightning fast compared to saving row by row.
    if (db) {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const objectStore = transaction.objectStore(STORE_NAME);
        
        const putRequest = objectStore.put(cleanData, 'dhl_data');
        
        putRequest.onsuccess = () => {
             // Silently succeed, user already saw it on UI
             console.log("Massive Array saved into IndexedDB successfully.");
        };
        putRequest.onerror = (e) => {
             showToast("Erro ao salvar no HD virtual do navegador.");
             console.error(e);
        };
    }
}

function resetImportBtn() {
    importCsvBtn.innerHTML = '<i class="fa-solid fa-file-import"></i> Atualizar Base CSV';
    importCsvBtn.disabled = false;
}

function updateDbRowCount() {
    dbRowCount.textContent = dhlDatabase.length.toLocaleString('pt-BR');
}

function queryDhlDatabase() {
    let searchValue = pedidoInput.value.trim();
    if (!searchValue) searchValue = blingInput.value.trim();
    
    if (!searchValue || dhlDatabase.length === 0) {
        dhlResultCard.style.display = 'none';
        return;
    }

    // In-memory instant search
    const result = dhlDatabase.find(row => 
        row["ORDER ID"] === searchValue || 
        row["NOTA FISCAL"] === searchValue || 
        row["TRACKING NUMBER"] === searchValue
    );

    if (result) {
        dhlOrderIdEl.textContent = result["ORDER ID"] || '-';
        dhlTrackingEl.textContent = result["TRACKING NUMBER"] || '-';
        dhlNfEl.textContent = result["NOTA FISCAL"] || '-';
        dhlStatusEl.textContent = result["STATUS"] || '-';
        dhlEventDateEl.textContent = result["DATA EVENTO"] || '-';
        dhlExpectedDateEl.textContent = result["PREVISAO DE ENTREGA"] || '-';
        
        dhlResultCard.style.display = 'block';

        if (!pedidoInput.value && result["ORDER ID"]) {
            pedidoInput.value = result["ORDER ID"];
        }
        
        // Auto-fill NF explicitly requested by User
        if (!nfInput.value && result["NOTA FISCAL"]) {
            // Remove letters if necessary since NF input restricts to numbers
            nfInput.value = result["NOTA FISCAL"].replace(/\D/g, ''); 
        }
    } else {
        dhlResultCard.style.display = 'none';
    }
}

function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}
