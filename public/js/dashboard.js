// Variáveis globais
let categories = [];
let accounts = [];
let expenses = [];
let analytics = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    currentUser = checkAuth();
    if (!currentUser) return;
    
    // Configurar interface
    document.getElementById('userName').textContent = currentUser.name;
    
    // Configurar data atual
    setCurrentMonth();
    
    // Configurar eventos
    setupEventListeners();
    
    // Carregar dados iniciais
    loadInitialData();
});

function setupEventListeners() {
    // Formulário de categoria
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);

    // Selecionar cor de categoria
    const colorBtn = document.getElementById('confirmCategoryColor');
    if (colorBtn) {
        colorBtn.addEventListener('click', function() {
            const picker = document.getElementById('categoryColorPicker');
            const hidden = document.getElementById('categoryColor');
            const preview = document.getElementById('categoryColorPreview');
            const color = picker.value;
            hidden.value = color;
            preview.style.backgroundColor = color;
        });
    }
    
    // Formulário de conta
    document.getElementById('accountForm').addEventListener('submit', handleAccountSubmit);

    // Formulário de gasto
    document.getElementById('expenseForm').addEventListener('submit', handleExpenseSubmit);
    
    // Fechar modais ao clicar fora
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Tecla ESC para fechar modais
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.active').forEach(modal => {
                closeModal(modal.id);
            });
        }
    });
}

async function loadInitialData() {
    try {
        await Promise.all([
            loadCategories(),
            loadAccounts(),
            loadExpenses(),
            updateAnalytics()
        ]);
    } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error);
        showAlert('Erro ao carregar dados. Recarregue a página.', 'error');
    }
}

// Gerenciamento de Categorias
async function loadCategories() {
    try {
        const response = await fetch(`/api/categories/${currentUser.id}`);
        const data = await response.json();
        
        if (response.ok) {
            categories = data;
            updateCategoriesDisplay();
            updateCategorySelects();
            updateCategoryFilter();
        } else {
            throw new Error(data.error || 'Erro ao carregar categorias');
        }
    } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        showAlert('Erro ao carregar categorias', 'error');
    }
}

function updateCategoriesDisplay() {
    const container = document.getElementById('categoriesList');
    
    if (categories.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhuma categoria criada. Crie sua primeira categoria!</p>';
        return;
    }
    
    container.innerHTML = categories.map(category => `
        <div class="expense-item">
            <div class="expense-info">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <div style="width: 20px; height: 20px; background: ${category.color}; border-radius: 50%;"></div>
                    <strong>${category.name}</strong>
                </div>
                <div class="expense-date">Criada em ${formatDate(category.createdAt)}</div>
            </div>
            <div class="expense-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteCategory('${category.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
    
    // Atualizar contador
    document.getElementById('categoryCount').textContent = categories.length;
}

function updateCategorySelects() {
    const selects = ['expenseCategory'];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Selecione uma categoria</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = `\u25CF ${category.name}`; // bullet + name
            option.style.color = category.color;
            if (category.id === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

function updateCategoryFilter() {
    const select = document.getElementById('categoryFilter');
    const currentValue = select.value;
    
    select.innerHTML = '<option value="">Todas as categorias</option>';
    
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        if (category.id === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

async function handleCategorySubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name').trim(),
        color: formData.get('color')
    };
    
    if (!categoryData.name) {
        showAlert('Nome da categoria é obrigatório', 'error');
        return;
    }
    
    try {
        const response = await fetch(`/api/categories/${currentUser.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(categoryData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Categoria criada com sucesso!', 'success');
            closeModal('categoryModal');
            event.target.reset();
            await loadCategories();
        } else {
            showAlert(result.error || 'Erro ao criar categoria', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        showAlert('Erro de conexão', 'error');
    }
}

async function deleteCategory(categoryId) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/categories/${currentUser.id}/${categoryId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Categoria excluída com sucesso!', 'success');
            await loadCategories();
            await loadExpenses();
            await updateAnalytics();
        } else {
            showAlert(result.error || 'Erro ao excluir categoria', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir categoria:', error);
        showAlert('Erro de conexão', 'error');
    }
}

// Gerenciamento de Contas
async function loadAccounts() {
    try {
        const response = await fetch(`/api/accounts/${currentUser.id}`);
        const data = await response.json();

        if (response.ok) {
            accounts = data;
            updateAccountsDisplay();
            updateAccountSelect();
        } else {
            throw new Error(data.error || 'Erro ao carregar contas');
        }
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        showAlert('Erro ao carregar contas', 'error');
    }
}

function updateAccountsDisplay() {
    const container = document.getElementById('accountsList');

    if (accounts.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhuma conta cadastrada.</p>';
        updateTotalBalance();
        return;
    }

    container.innerHTML = accounts.map(acc => `
        <div class="expense-item">
            <div class="expense-info">
                <strong>${acc.name}</strong>
                <div class="expense-date">Saldo: R$ ${formatCurrency(acc.balance)} | Crédito: R$ ${formatCurrency(acc.creditBalance)}</div>
            </div>
            <div class="expense-actions">
                <button class="btn btn-danger btn-sm" onclick="deleteAccount('${acc.id}')">🗑️ Excluir</button>
            </div>
        </div>
    `).join('');
    updateTotalBalance();
}

function updateAccountSelect() {
    const select = document.getElementById('expenseAccount');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Selecione</option>';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        if (acc.id === current) option.selected = true;
        select.appendChild(option);
    });
}

async function handleAccountSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const accountData = {
        name: formData.get('name').trim(),
        balance: parseFloat(formData.get('balance') || 0),
        creditBalance: parseFloat(formData.get('creditBalance') || 0)
    };

    if (!accountData.name) {
        showAlert('Nome da conta é obrigatório', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/accounts/${currentUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(accountData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('Conta criada com sucesso!', 'success');
            closeModal('accountModal');
            event.target.reset();
            await loadAccounts();
        } else {
            showAlert(result.error || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        showAlert('Erro de conexão', 'error');
    }
}

async function deleteAccount(accountId) {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;
    try {
        const response = await fetch(`/api/accounts/${currentUser.id}/${accountId}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            showAlert('Conta excluída com sucesso!', 'success');
            await loadAccounts();
            await loadExpenses();
        } else {
            showAlert(result.error || 'Erro ao excluir conta', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        showAlert('Erro de conexão', 'error');
    }
}

// Gerenciamento de Gastos

// Gerenciamento de Gastos
async function loadExpenses() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const categoryId = document.getElementById('categoryFilter').value;
        
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (categoryId) params.append('categoryId', categoryId);
        
        const response = await fetch(`/api/expenses/${currentUser.id}?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            expenses = data;
            updateExpensesDisplay();
            updateRecentExpenses();
        } else {
            throw new Error(data.error || 'Erro ao carregar gastos');
        }
    } catch (error) {
        console.error('Erro ao carregar gastos:', error);
        showAlert('Erro ao carregar gastos', 'error');
    }
}

function updateExpensesDisplay() {
    const container = document.getElementById('expensesList');
    
    if (expenses.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhum gasto encontrado no período selecionado.</p>';
        return;
    }
    
    // Ordenar por data (mais recente primeiro)
    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-amount">R$ ${formatCurrency(expense.amount)}</div>
                <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                    <span class="expense-category" style="background: ${expense.categoryColor};">
                        ${expense.categoryName}
                    </span>
                    <span class="expense-date">${formatDate(expense.date)}</span>
                    ${expense.paymentMethod ? `<span style="font-size:0.8rem;">${expense.paymentMethod}</span>` : ''}
                </div>
                ${expense.description ? `<div style="color: #666; font-size: 0.9rem;">${expense.description}</div>` : ''}
            </div>
            <div class="expense-actions">
                <button class="btn btn-primary btn-sm" onclick="editExpense('${expense.id}')">
                    ✏️ Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteExpense('${expense.id}')">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

function updateRecentExpenses() {
    const container = document.getElementById('recentExpenses');
    const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    if (recentExpenses.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhum gasto recente.</p>';
        return;
    }
    
    container.innerHTML = recentExpenses.map(expense => `
        <div class="expense-item">
            <div class="expense-info">
                <div class="expense-amount">R$ ${formatCurrency(expense.amount)}</div>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="expense-category" style="background: ${expense.categoryColor};">
                        ${expense.categoryName}
                    </span>
                    <span class="expense-date">${formatDate(expense.date)}</span>
                    ${expense.paymentMethod ? `<span style="font-size:0.8rem;">${expense.paymentMethod}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

async function handleExpenseSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const expenseId = formData.get('id');
    const expenseData = {
        amount: parseFloat(formData.get('amount')),
        categoryId: formData.get('categoryId'),
        accountId: formData.get('accountId') || null,
        paymentMethod: formData.get('paymentMethod'),
        date: formData.get('date'),
        description: formData.get('description').trim()
    };
    
    if (!expenseData.amount || expenseData.amount <= 0) {
        showAlert('Valor deve ser maior que zero', 'error');
        return;
    }
    
    if (!expenseData.categoryId) {
        showAlert('Selecione uma categoria', 'error');
        return;
    }
    
    if (!expenseData.date) {
        showAlert('Data é obrigatória', 'error');
        return;
    }
    
    try {
        const url = expenseId ? 
            `/api/expenses/${currentUser.id}/${expenseId}` : 
            `/api/expenses/${currentUser.id}`;
        
        const method = expenseId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(expenseData)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            const action = expenseId ? 'atualizado' : 'criado';
            showAlert(`Gasto ${action} com sucesso!`, 'success');
            closeModal('expenseModal');
            event.target.reset();
            await loadExpenses();
            await updateAnalytics();
        } else {
            showAlert(result.error || 'Erro ao salvar gasto', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar gasto:', error);
        showAlert('Erro de conexão', 'error');
    }
}

function editExpense(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;
    
    // Preencher formulário
    document.getElementById('expenseId').value = expense.id;
    document.getElementById('expenseAmount').value = expense.amount;
    document.getElementById('expenseCategory').value = expense.categoryId;
    document.getElementById('expenseAccount').value = expense.accountId || '';
    document.getElementById('paymentMethod').value = expense.paymentMethod || 'debito';
    document.getElementById('expenseDate').value = expense.date;
    document.getElementById('expenseDescription').value = expense.description || '';
    
    // Atualizar título e botão
    document.getElementById('expenseModalTitle').textContent = '✏️ Editar Gasto';
    document.getElementById('expenseSubmitBtn').textContent = 'Atualizar Gasto';
    
    openModal('expenseModal');
}

async function deleteExpense(expenseId) {
    if (!confirm('Tem certeza que deseja excluir este gasto?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/expenses/${currentUser.id}/${expenseId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showAlert('Gasto excluído com sucesso!', 'success');
            await loadExpenses();
            await updateAnalytics();
        } else {
            showAlert(result.error || 'Erro ao excluir gasto', 'error');
        }
    } catch (error) {
        console.error('Erro ao excluir gasto:', error);
        showAlert('Erro de conexão', 'error');
    }
}

// Analytics
async function updateAnalytics() {
    try {
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        
        const response = await fetch(`/api/analytics/${currentUser.id}?${params}`);
        const data = await response.json();
        
        if (response.ok) {
            analytics = data;
            updateStatsDisplay();
            if (typeof updateCharts === 'function') {
                updateCharts();
            }
        } else {
            throw new Error(data.error || 'Erro ao carregar análises');
        }
    } catch (error) {
        console.error('Erro ao carregar análises:', error);
        showAlert('Erro ao carregar análises', 'error');
    }
}

function updateStatsDisplay() {
    document.getElementById('totalAmount').textContent = `R$ ${formatCurrency(analytics.totalAmount || 0)}`;
    document.getElementById('dailyAverage').textContent = `R$ ${formatCurrency(analytics.dailyAverage || 0)}`;
    document.getElementById('expenseCount').textContent = analytics.expenseCount || 0;
}

function updateTotalBalance() {
    const total = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0);
    const display = document.getElementById('totalBalanceDisplay');
    if (display) {
        display.textContent = `R$ ${formatCurrency(total)}`;
    }
}

// Utilitários de Modal
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
    
    // Resetar formulário se for novo gasto
    if (modalId === 'expenseModal') {
        const form = document.getElementById('expenseForm');
        const expenseId = document.getElementById('expenseId').value;
        
        if (!expenseId) {
            form.reset();
            document.getElementById('expenseDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('expenseModalTitle').textContent = '💰 Novo Gasto';
            document.getElementById('expenseSubmitBtn').textContent = 'Adicionar Gasto';
        }
        
        // Atualizar selects
        updateCategorySelects();
        updateAccountSelect();
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
    
    // Limpar formulários
    const forms = modal.querySelectorAll('form');
    forms.forEach(form => form.reset());
    
    // Limpar campos hidden
    const hiddenInputs = modal.querySelectorAll('input[type="hidden"]');
    hiddenInputs.forEach(input => input.value = '');
}

// Utilitários de Data
function setCurrentMonth() {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    document.getElementById('startDate').value = firstDay.toISOString().split('T')[0];
    document.getElementById('endDate').value = lastDay.toISOString().split('T')[0];
    
    // Recarregar dados
    if (currentUser) {
        loadExpenses();
        updateAnalytics();
    }
}

// Utilitários de Formatação
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// Utilitários de Alerta
function showAlert(message, type = 'info') {
    // Criar elemento de alerta se não existir
    let alertDiv = document.querySelector('.alert');
    if (!alertDiv) {
        alertDiv = document.createElement('div');
        alertDiv.className = 'alert';
        document.querySelector('.container').prepend(alertDiv);
    }
    
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        alertDiv.style.display = 'none';
    }, 5000);
}

