# 💰 Sistema de Controle Financeiro Pessoal

Um sistema completo de controle financeiro pessoal desenvolvido com HTML/CSS puro no frontend e Node.js no backend, com armazenamento em arquivos JSON.

## 🚀 Funcionalidades

### ✅ Autenticação
- Cadastro de usuários com nome, email e senha
- Login seguro com validação
- Senhas criptografadas com bcrypt

### 🏷️ Gerenciamento de Categorias
- Criação de categorias personalizadas
- Seleção de cores para cada categoria
- Exclusão de categorias (quando não há gastos associados)

### 🏦 Gerenciamento de Contas
- Cadastro de contas bancárias com saldo e limite de crédito
- Exclusão de contas

### 💸 Controle de Gastos
- Cadastro de gastos com valor, categoria, data e descrição
- Escolha da forma de pagamento (débito, crédito ou PIX) e conta associada
- Edição e exclusão de gastos
- Filtros por período e categoria
- Validações de dados

### 📊 Dashboard e Análises
- Resumo financeiro com total gasto e média diária
- Gráfico de pizza mostrando distribuição por categoria (%)
- Gráfico de barras com valores por categoria
- Lista de gastos com filtros
- Estatísticas em tempo real

### 📄 Geração de PDF
- Relatórios completos em PDF
- Inclui gráficos, tabelas e estatísticas
- Layout profissional e organizado
- Três modelos de template selecionáveis
- Download automático

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura das páginas
- **CSS3** - Estilização e responsividade
- **JavaScript** - Interatividade e comunicação com API
- **Chart.js** - Gráficos interativos
- **jsPDF** - Geração de relatórios PDF

### Backend
- **Node.js** - Servidor backend
- **Express.js** - Framework web
- **bcryptjs** - Criptografia de senhas
- **uuid** - Geração de IDs únicos
- **cors** - Controle de acesso CORS

### Armazenamento
- **Arquivos JSON** - Dados dos usuários separados por arquivo
- **Sistema de arquivos** - Sem necessidade de banco de dados

## 📁 Estrutura do Projeto

```
controle-financeiro/
├── server.js              # Servidor principal Node.js
├── package.json           # Dependências e configurações
├── data/                  # Dados dos usuários (JSON)
│   ├── users.json         # Lista de usuários
│   └── user_*.json        # Dados individuais por usuário
└── public/                # Frontend
    ├── index.html         # Página de login/cadastro
    ├── dashboard.html     # Dashboard principal
    ├── css/
    │   └── style.css      # Estilos principais
    └── js/
        ├── auth.js        # Autenticação
        ├── dashboard.js   # Funcionalidades do dashboard
        ├── charts.js      # Gráficos
        └── pdf.js         # Geração de PDF
```

## 🚀 Como Executar

### 1. Pré-requisitos
- Node.js (versão 14 ou superior)
- npm (gerenciador de pacotes)

### 2. Instalação
```bash
# Navegar para o diretório do projeto
cd controle-financeiro

# Instalar dependências
npm install
```

### 3. Executar o Servidor
```bash
# Iniciar o servidor
npm start

# Ou diretamente com Node
node server.js
```

### 4. Acessar a Aplicação
- Abra o navegador e acesse: `http://localhost:3000`
- A aplicação estará rodando na porta 3000

## 📱 Como Usar

### 1. Primeiro Acesso
1. Acesse `http://localhost:3000`
2. Clique na aba "Cadastrar"
3. Preencha seus dados (nome, email, senha)
4. Clique em "Cadastrar"
5. Faça login com suas credenciais

### 2. Criando Categorias
1. No dashboard, clique em "➕ Nova Categoria"
2. Digite o nome da categoria (ex: Alimentação, Transporte)
3. Escolha uma cor
4. Clique em "Criar Categoria"

### 3. Registrando Gastos
1. Clique em "💰 Novo Gasto"
2. Preencha o valor, selecione a categoria e data
3. Adicione uma descrição (opcional)
4. Clique em "Adicionar Gasto"

### 4. Visualizando Relatórios
- Use os filtros de data para selecionar o período
- Visualize os gráficos de pizza e barras
- Escolha um modelo no seletor de template
- Clique em "📄 Gerar PDF" para baixar o relatório

## 🔧 Configurações

### Porta do Servidor
Por padrão, o servidor roda na porta 3000. Para alterar:
```bash
PORT=8080 node server.js
```

### Dados dos Usuários
- Os dados são salvos automaticamente na pasta `data/`
- Cada usuário tem um arquivo JSON individual
- Não é necessário configurar banco de dados

## 🎨 Características do Design

- **Responsivo** - Funciona em desktop, tablet e mobile
- **Moderno** - Interface limpa com gradientes e animações
- **Intuitivo** - Navegação simples e clara
- **Acessível** - Cores contrastantes e boa legibilidade

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Validação de dados no frontend e backend
- Separação de dados por usuário
- Não exposição de informações sensíveis

## 📊 Funcionalidades dos Relatórios

### Estatísticas Incluídas
- Total gasto no período
- Média de gastos diária
- Número total de transações
- Distribuição por categoria

### Gráficos
- Gráfico de pizza com percentuais
- Gráfico de barras com valores
- Cores personalizadas por categoria

### Formato PDF
- Layout profissional
- Cabeçalho com informações do usuário
- Tabelas organizadas
- Gráficos em alta qualidade

## 🐛 Solução de Problemas

### Servidor não inicia
- Verifique se o Node.js está instalado
- Execute `npm install` para instalar dependências
- Verifique se a porta 3000 está disponível

### Erro ao criar usuário
- Verifique se o email já não está cadastrado
- Certifique-se de que a senha tem pelo menos 6 caracteres

### Gráficos não aparecem
- Verifique a conexão com a internet (Chart.js é carregado via CDN)
- Certifique-se de que há dados cadastrados

## 📝 Licença

Este projeto é de uso livre para fins educacionais e pessoais.

## 👨‍💻 Desenvolvimento

Desenvolvido com foco em:
- Simplicidade de uso
- Performance
- Segurança
- Responsividade
- Manutenibilidade

---

**Aproveite seu controle financeiro! 💰📊**

