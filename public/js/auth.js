// Variáveis globais
let currentUser = null;

// Verificar se já está logado
document.addEventListener('DOMContentLoaded', function() {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
        currentUser = JSON.parse(userData);
        window.location.href = '/dashboard';
    }
    
    initializeAuth();
});

function initializeAuth() {
    // Configurar tabs
    const tabButtons = document.querySelectorAll('.tab-btn');
    const authForms = document.querySelectorAll('.auth-form');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.getAttribute('data-tab');
            
            // Remover classe active de todos os botões e forms
            tabButtons.forEach(btn => btn.classList.remove('active'));
            authForms.forEach(form => form.classList.remove('active'));
            
            // Adicionar classe active ao botão clicado e form correspondente
            button.classList.add('active');
            document.getElementById(`${targetTab}-form`).classList.add('active');
            
            // Limpar alertas
            hideAlert();
        });
    });
    
    // Configurar formulários
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    
    // Configurar data atual no campo de data
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) {
            input.value = today;
        }
    });
}

async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const loginData = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        showLoading('Entrando...');
        
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            // Salvar dados do usuário
            currentUser = result.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showAlert('Login realizado com sucesso!', 'success');
            
            // Redirecionar para o dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showAlert(result.error || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        console.error('Erro no login:', error);
        showAlert('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading();
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    
    // Validar senhas
    if (password !== confirmPassword) {
        showAlert('As senhas não coincidem', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('A senha deve ter pelo menos 6 caracteres', 'error');
        return;
    }
    
    const registerData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: password
    };
    
    try {
        showLoading('Criando conta...');
        
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            showAlert('Conta criada com sucesso! Faça login para continuar.', 'success');
            
            // Limpar formulário
            event.target.reset();
            
            // Mudar para aba de login
            setTimeout(() => {
                document.querySelector('[data-tab="login"]').click();
                
                // Preencher email no formulário de login
                document.getElementById('loginEmail').value = registerData.email;
            }, 2000);
        } else {
            showAlert(result.error || 'Erro ao criar conta', 'error');
        }
    } catch (error) {
        console.error('Erro no cadastro:', error);
        showAlert('Erro de conexão. Tente novamente.', 'error');
    } finally {
        hideLoading();
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.getElementById('alert');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.display = 'block';
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        hideAlert();
    }, 5000);
}

function hideAlert() {
    const alertDiv = document.getElementById('alert');
    alertDiv.style.display = 'none';
}

function showLoading(message) {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.disabled = true;
        button.innerHTML = `<span class="loading"></span> ${message}`;
    });
}

function hideLoading() {
    const submitButtons = document.querySelectorAll('button[type="submit"]');
    submitButtons.forEach(button => {
        button.disabled = false;
        
        // Restaurar texto original baseado no contexto
        if (button.closest('#loginForm')) {
            button.textContent = 'Entrar';
        } else if (button.closest('#registerForm')) {
            button.textContent = 'Cadastrar';
        }
    });
}

// Validação em tempo real
document.addEventListener('DOMContentLoaded', function() {
    // Validação de email
    const emailInputs = document.querySelectorAll('input[type="email"]');
    emailInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const email = this.value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email && !emailRegex.test(email)) {
                this.style.borderColor = '#dc3545';
                showAlert('Por favor, insira um email válido', 'error');
            } else {
                this.style.borderColor = '#e9ecef';
            }
        });
    });
    
    // Validação de confirmação de senha
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = document.getElementById('registerPassword').value;
            const confirmPassword = this.value;
            
            if (confirmPassword && password !== confirmPassword) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#e9ecef';
            }
        });
    }
});

// Função para logout (será usada no dashboard)
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = '/';
}

// Função para verificar autenticação (será usada no dashboard)
function checkAuth() {
    const userData = localStorage.getItem('currentUser');
    if (!userData) {
        window.location.href = '/';
        return null;
    }
    return JSON.parse(userData);
}

