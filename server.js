const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Diretórios
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Garantir que o diretório de dados existe
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Garantir que o arquivo de usuários existe
if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

// Funções auxiliares
function readUsers() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUserDataPath(userId) {
    return path.join(DATA_DIR, `user_${userId}.json`);
}

function readUserData(userId) {
    const userDataPath = getUserDataPath(userId);
    if (!fs.existsSync(userDataPath)) {
        const defaultData = {
            categories: [],
            expenses: [],
            accounts: [],
            settings: {}
        };
        fs.writeFileSync(userDataPath, JSON.stringify(defaultData, null, 2));
        return defaultData;
    }

    try {
        const data = JSON.parse(fs.readFileSync(userDataPath, 'utf8'));
        return {
            categories: data.categories || [],
            expenses: data.expenses || [],
            accounts: data.accounts || [],
            settings: data.settings || {}
        };
    } catch (error) {
        return { categories: [], expenses: [], accounts: [], settings: {} };
    }
}

function writeUserData(userId, data) {
    const userDataPath = getUserDataPath(userId);
    fs.writeFileSync(userDataPath, JSON.stringify(data, null, 2));
}

// Rotas de autenticação
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
        }
        
        const users = readUsers();
        
        // Verificar se o email já existe
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Criar novo usuário
        const newUser = {
            id: uuidv4(),
            name,
            email,
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        writeUsers(users);
        
        // Criar arquivo de dados do usuário
        readUserData(newUser.id);
        
        res.json({ 
            success: true, 
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }
        
        const users = readUsers();
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }
        
        res.json({ 
            success: true, 
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
});

// Rotas de categorias
app.get('/api/categories/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userData = readUserData(userId);
        res.json(userData.categories);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar categorias' });
    }
});

app.post('/api/categories/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { name, color } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: 'Nome da categoria é obrigatório' });
        }
        
        const userData = readUserData(userId);
        
        // Verificar se a categoria já existe
        if (userData.categories.find(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            return res.status(400).json({ error: 'Categoria já existe' });
        }
        
        const newCategory = {
            id: uuidv4(),
            name,
            color: color || '#007bff',
            createdAt: new Date().toISOString()
        };
        
        userData.categories.push(newCategory);
        writeUserData(userId, userData);
        
        res.json(newCategory);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar categoria' });
    }
});

app.delete('/api/categories/:userId/:categoryId', (req, res) => {
    try {
        const { userId, categoryId } = req.params;
        const userData = readUserData(userId);
        
        // Verificar se a categoria está sendo usada em algum gasto
        const isUsed = userData.expenses.some(expense => expense.categoryId === categoryId);
        
        if (isUsed) {
            return res.status(400).json({ error: 'Não é possível excluir categoria que possui gastos associados' });
        }
        
        userData.categories = userData.categories.filter(cat => cat.id !== categoryId);
        writeUserData(userId, userData);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir categoria' });
    }
});

// Rotas de contas bancárias
app.get('/api/accounts/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const userData = readUserData(userId);
        res.json(userData.accounts || []);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar contas' });
    }
});

app.post('/api/accounts/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { name, balance = 0, creditBalance = 0 } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Nome da conta é obrigatório' });
        }

        const userData = readUserData(userId);

        const newAccount = {
            id: uuidv4(),
            name,
            balance: parseFloat(balance),
            creditBalance: parseFloat(creditBalance),
            createdAt: new Date().toISOString()
        };

        userData.accounts.push(newAccount);
        writeUserData(userId, userData);

        res.json(newAccount);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

app.delete('/api/accounts/:userId/:accountId', (req, res) => {
    try {
        const { userId, accountId } = req.params;
        const userData = readUserData(userId);

        userData.accounts = userData.accounts.filter(acc => acc.id !== accountId);
        writeUserData(userId, userData);

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir conta' });
    }
});

// Rotas de gastos
app.get('/api/expenses/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate, categoryId } = req.query;
        
        const userData = readUserData(userId);
        let expenses = userData.expenses;
        
        // Filtrar por data
        if (startDate && endDate) {
            expenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
            });
        }
        
        // Filtrar por categoria
        if (categoryId) {
            expenses = expenses.filter(expense => expense.categoryId === categoryId);
        }
        
        // Adicionar informações da categoria e conta
        expenses = expenses.map(expense => {
            const category = userData.categories.find(cat => cat.id === expense.categoryId);
            const account = userData.accounts.find(acc => acc.id === expense.accountId);
            return {
                ...expense,
                categoryName: category ? category.name : 'Categoria não encontrada',
                categoryColor: category ? category.color : '#ccc',
                accountName: account ? account.name : null
            };
        });
        
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar gastos' });
    }
});

app.post('/api/expenses/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { amount, categoryId, date, description, accountId, paymentMethod } = req.body;
        
        if (!amount || !categoryId || !date) {
            return res.status(400).json({ error: 'Valor, categoria e data são obrigatórios' });
        }
        
        const userData = readUserData(userId);
        
        // Verificar se a categoria existe
        const category = userData.categories.find(cat => cat.id === categoryId);
        if (!category) {
            return res.status(400).json({ error: 'Categoria não encontrada' });
        }
        
        const newExpense = {
            id: uuidv4(),
            amount: parseFloat(amount),
            categoryId,
            accountId: accountId || null,
            paymentMethod: paymentMethod || 'debito',
            date,
            description: description || '',
            createdAt: new Date().toISOString()
        };
        
        userData.expenses.push(newExpense);
        writeUserData(userId, userData);
        
        res.json({
            ...newExpense,
            categoryName: category.name,
            categoryColor: category.color
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao criar gasto' });
    }
});

app.put('/api/expenses/:userId/:expenseId', (req, res) => {
    try {
        const { userId, expenseId } = req.params;
        const { amount, categoryId, date, description, accountId, paymentMethod } = req.body;
        
        const userData = readUserData(userId);
        const expenseIndex = userData.expenses.findIndex(exp => exp.id === expenseId);
        
        if (expenseIndex === -1) {
            return res.status(404).json({ error: 'Gasto não encontrado' });
        }
        
        // Verificar se a categoria existe
        if (categoryId) {
            const category = userData.categories.find(cat => cat.id === categoryId);
            if (!category) {
                return res.status(400).json({ error: 'Categoria não encontrada' });
            }
        }
        
        // Atualizar gasto
        const updatedExpense = {
            ...userData.expenses[expenseIndex],
            amount: amount !== undefined ? parseFloat(amount) : userData.expenses[expenseIndex].amount,
            categoryId: categoryId || userData.expenses[expenseIndex].categoryId,
            accountId: accountId !== undefined ? accountId : userData.expenses[expenseIndex].accountId,
            paymentMethod: paymentMethod || userData.expenses[expenseIndex].paymentMethod,
            date: date || userData.expenses[expenseIndex].date,
            description: description !== undefined ? description : userData.expenses[expenseIndex].description,
            updatedAt: new Date().toISOString()
        };
        
        userData.expenses[expenseIndex] = updatedExpense;
        writeUserData(userId, userData);
        
        const category = userData.categories.find(cat => cat.id === updatedExpense.categoryId);
        
        res.json({
            ...updatedExpense,
            categoryName: category.name,
            categoryColor: category.color
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar gasto' });
    }
});

app.delete('/api/expenses/:userId/:expenseId', (req, res) => {
    try {
        const { userId, expenseId } = req.params;
        const userData = readUserData(userId);
        
        userData.expenses = userData.expenses.filter(exp => exp.id !== expenseId);
        writeUserData(userId, userData);
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir gasto' });
    }
});

// Rota para análises/dashboard
app.get('/api/analytics/:userId', (req, res) => {
    try {
        const { userId } = req.params;
        const { startDate, endDate } = req.query;
        
        const userData = readUserData(userId);
        let expenses = userData.expenses;
        
        // Filtrar por período
        if (startDate && endDate) {
            expenses = expenses.filter(expense => {
                const expenseDate = new Date(expense.date);
                return expenseDate >= new Date(startDate) && expenseDate <= new Date(endDate);
            });
        }
        
        // Calcular totais
        const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Calcular média diária
        const days = startDate && endDate ? 
            Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1 : 
            30;
        const dailyAverage = totalAmount / days;
        
        // Agrupar por categoria
        const categoryTotals = {};
        expenses.forEach(expense => {
            const category = userData.categories.find(cat => cat.id === expense.categoryId);
            const categoryName = category ? category.name : 'Sem categoria';
            const categoryColor = category ? category.color : '#ccc';
            
            if (!categoryTotals[expense.categoryId]) {
                categoryTotals[expense.categoryId] = {
                    name: categoryName,
                    color: categoryColor,
                    total: 0,
                    count: 0
                };
            }
            
            categoryTotals[expense.categoryId].total += expense.amount;
            categoryTotals[expense.categoryId].count += 1;
        });
        
        const categoryData = Object.values(categoryTotals);
        
        res.json({
            totalAmount,
            dailyAverage,
            expenseCount: expenses.length,
            categoryData,
            period: { startDate, endDate }
        });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao gerar análises' });
    }
});

// Servir arquivos estáticos
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});

module.exports = app;

