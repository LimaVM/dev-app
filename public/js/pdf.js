// Função principal para gerar PDF
async function generatePDF() {
    try {
        // Verificar se há dados para gerar o relatório
        if (!analytics || !currentUser) {
            showAlert('Não há dados suficientes para gerar o relatório', 'error');
            return;
        }

        showAlert('Gerando relatório PDF...', 'info');

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        await loadRobotoFont(doc);

        const container = document.createElement('div');
        container.innerHTML = await buildPdfHtml();
        document.body.appendChild(container);

        const fileName = `relatorio-financeiro-${formatDateForFile(new Date())}.pdf`;

        await doc.html(container, {
            margin: 20,
            autoPaging: 'text',
            html2canvas: { scale: 0.6 },
            callback: function (doc) {
                doc.save(fileName);
            }
        });

        document.body.removeChild(container);
        showAlert('Relatório PDF gerado com sucesso!', 'success');

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showAlert('Erro ao gerar relatório PDF', 'error');
    }
}

function addHeader(doc, y, margin, contentWidth) {
    // Título principal
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(102, 126, 234); // Cor azul do tema
    doc.text('💰 Relatório Financeiro Pessoal', margin, y);
    y += 15;
    
    // Nome do usuário
    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    doc.text(`Usuário: ${currentUser.name}`, margin, y);
    y += 10;
    
    // Data de geração
    doc.setFontSize(12);
    doc.setTextColor(102, 102, 102);
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, margin, y);
    y += 20;
    
    // Linha separadora
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
    y += 15;
    
    return y;
}

function addPeriodInfo(doc, y, margin, contentWidth) {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('📅 Período Analisado', margin, y);
    y += 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(102, 102, 102);
    
    if (startDate && endDate) {
        doc.text(`De: ${formatDate(startDate)} até ${formatDate(endDate)}`, margin, y);
    } else {
        doc.text('Período: Todos os registros', margin, y);
    }
    y += 20;
    
    return y;
}

function addFinancialSummary(doc, y, margin, contentWidth) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('📊 Resumo Financeiro', margin, y);
    y += 15;
    
    // Caixa de resumo
    doc.setDrawColor(233, 236, 239);
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, y - 5, contentWidth, 40, 3, 3, 'FD');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 51, 51);
    
    // Total gasto
    doc.text(`💰 Total Gasto: R$ ${formatCurrency(analytics.totalAmount || 0)}`, margin + 10, y + 8);
    
    // Média diária
    doc.text(`📅 Média Diária: R$ ${formatCurrency(analytics.dailyAverage || 0)}`, margin + 10, y + 18);
    
    // Número de gastos
    doc.text(`📝 Total de Gastos: ${analytics.expenseCount || 0}`, margin + 10, y + 28);
    
    y += 50;
    
    return y;
}

async function addCharts(doc, y, margin, contentWidth, chartsData) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('📈 Gráficos de Análise', margin, y);
    y += 15;
    
    const chartWidth = (contentWidth - 10) / 2;
    const chartHeight = 80;
    
    try {
        // Gráfico de pizza
        if (chartsData.pieImage) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Distribuição por Categoria (%)', margin, y);
            doc.addImage(chartsData.pieImage, 'PNG', margin, y + 5, chartWidth, chartHeight);
        }
        
        // Gráfico de barras
        if (chartsData.barImage) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Valores por Categoria (R$)', margin + chartWidth + 10, y);
            doc.addImage(chartsData.barImage, 'PNG', margin + chartWidth + 10, y + 5, chartWidth, chartHeight);
        }
        
        y += chartHeight + 20;
    } catch (error) {
        console.error('Erro ao adicionar gráficos:', error);
        doc.setFontSize(10);
        doc.setTextColor(220, 53, 69);
        doc.text('Erro ao carregar gráficos', margin, y);
        y += 15;
    }
    
    return y;
}

function addCategoryTable(doc, y, margin, contentWidth) {
    if (!analytics.categoryData || analytics.categoryData.length === 0) {
        return y;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('🏷️ Gastos por Categoria', margin, y);
    y += 15;
    
    // Cabeçalho da tabela
    const rowHeight = 8;
    const colWidths = [contentWidth * 0.4, contentWidth * 0.3, contentWidth * 0.3];
    
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    
    doc.text('Categoria', margin + 2, y + 5);
    doc.text('Valor (R$)', margin + colWidths[0] + 2, y + 5);
    doc.text('Quantidade', margin + colWidths[0] + colWidths[1] + 2, y + 5);
    
    y += rowHeight;
    
    // Dados da tabela
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    analytics.categoryData.forEach((category, index) => {
        const fillColor = index % 2 === 0 ? [255, 255, 255] : [248, 249, 250];
        doc.setFillColor(...fillColor);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        
        doc.setTextColor(51, 51, 51);
        doc.text(category.name, margin + 2, y + 5);
        doc.text(`R$ ${formatCurrency(category.total)}`, margin + colWidths[0] + 2, y + 5);
        doc.text(category.count.toString(), margin + colWidths[0] + colWidths[1] + 2, y + 5);
        
        y += rowHeight;
    });
    
    // Borda da tabela
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - (analytics.categoryData.length + 1) * rowHeight, contentWidth, (analytics.categoryData.length + 1) * rowHeight);
    
    y += 15;

    return y;
}

function addPizzaMenu(doc, y, margin, contentWidth) {
    if (!analytics.categoryData || analytics.categoryData.length === 0) {
        return y;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('🍕 Menu Pizza', margin, y);
    y += 10;

    doc.setFontSize(11);
    analytics.categoryData.forEach(category => {
        const rgb = hexToRgb(category.color || '#000000');
        doc.setTextColor(...rgb);
        doc.text('●', margin, y);
        doc.setTextColor(51, 51, 51);
        doc.text(`${category.name} - R$ ${formatCurrency(category.total)}`, margin + 5, y);
        y += 6;
    });

    y += 10;
    return y;
}

function addExpensesList(doc, y, margin, contentWidth) {
    if (!expenses || expenses.length === 0) {
        return y;
    }
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('💸 Últimos Gastos', margin, y);
    y += 15;
    
    // Mostrar apenas os 10 gastos mais recentes
    const recentExpenses = [...expenses]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 10);
    
    const rowHeight = 6;
    const colWidths = [contentWidth * 0.2, contentWidth * 0.3, contentWidth * 0.2, contentWidth * 0.15, contentWidth * 0.15];
    
    // Cabeçalho
    doc.setFillColor(248, 249, 250);
    doc.rect(margin, y, contentWidth, rowHeight, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    
    doc.text('Data', margin + 2, y + 4);
    doc.text('Descrição', margin + colWidths[0] + 2, y + 4);
    doc.text('Categoria', margin + colWidths[0] + colWidths[1] + 2, y + 4);
    doc.text('Forma', margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 4);
    doc.text('Valor (R$)', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 4);
    
    y += rowHeight;
    
    // Dados
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    recentExpenses.forEach((expense, index) => {
        const fillColor = index % 2 === 0 ? [255, 255, 255] : [248, 249, 250];
        doc.setFillColor(...fillColor);
        doc.rect(margin, y, contentWidth, rowHeight, 'F');
        
        doc.setTextColor(51, 51, 51);
        doc.text(formatDate(expense.date), margin + 2, y + 4);
        
        // Truncar descrição se muito longa
        const description = expense.description || 'Sem descrição';
        const truncatedDesc = description.length > 25 ? description.substring(0, 22) + '...' : description;
        doc.text(truncatedDesc, margin + colWidths[0] + 2, y + 4);
        
        doc.text(expense.categoryName || 'Sem categoria', margin + colWidths[0] + colWidths[1] + 2, y + 4);
        doc.text(expense.paymentMethod || '', margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, y + 4);
        doc.text(`R$ ${formatCurrency(expense.amount)}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 4);
        
        y += rowHeight;
    });
    
    // Borda da tabela
    doc.setDrawColor(233, 236, 239);
    doc.setLineWidth(0.5);
    doc.rect(margin, y - (recentExpenses.length + 1) * rowHeight, contentWidth, (recentExpenses.length + 1) * rowHeight);
    
    y += 15;
    
    return y;
}

function addFooter(doc) {
    const pageCount = doc.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const contentWidth = pageWidth - margin * 2;
        const footerY = pageHeight - 15;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(102, 102, 102);

        // Linha separadora
        doc.setDrawColor(233, 236, 239);
        doc.setLineWidth(0.5);
        doc.line(margin, footerY - 5, margin + contentWidth, footerY - 5);

        // Texto do rodapé
        doc.text('Relatório gerado pelo Sistema de Controle Financeiro Pessoal', margin, footerY);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 40, footerY);
    }
}

// Funções utilitárias para PDF
function formatDateForFile(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function formatCurrencyForPDF(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function hexToRgb(hex) {
    const sanitized = hex.replace('#', '');
    const bigint = parseInt(sanitized, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return [r, g, b];
}

async function loadRobotoFont(doc) {
    const res = await fetch('fonts/Roboto-Regular.base64.txt');
    const base64 = (await res.text()).trim();
    doc.addFileToVFS('Roboto-Regular.ttf', base64);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');
}

async function buildPdfHtml() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;

    const templateSelect = document.getElementById('pdfTemplate');
    const templateName = templateSelect ? templateSelect.value : 'template1';
    const response = await fetch(`pdf-templates/${templateName}.html`);
    let template = await response.text();

    const recentExpenses = expenses
        ? [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
        : [];
    let periodText = 'Todos os registros';
    if (startDate && endDate) {
        periodText = `De ${formatDate(startDate)} até ${formatDate(endDate)}`;
    }

    template = template.replace(/{{userName}}/g, currentUser.name);
    template = template.replace(/{{generationDate}}/g, formatDate(new Date().toISOString()));
    template = template.replace(/{{period}}/g, periodText);
    template = template.replace(/{{totalAmount}}/g, formatCurrency(analytics.totalAmount || 0));
    template = template.replace(/{{dailyAverage}}/g, formatCurrency(analytics.dailyAverage || 0));
    template = template.replace(/{{expenseCount}}/g, analytics.expenseCount || 0);

    if (analytics.categoryData && analytics.categoryData.length > 0) {
        let rows = '';
        analytics.categoryData.forEach(cat => {
            rows += `<tr><td>${cat.name}</td><td>${formatCurrency(cat.total)}</td><td>${cat.count}</td></tr>`;
        });
        const table = `<h2>Gastos por Categoria</h2><table><thead><tr><th>Categoria</th><th>Valor (R$)</th><th>Quantidade</th></tr></thead><tbody>${rows}</tbody></table>`;
        template = template.replace('{{categoryTable}}', table);
    } else {
        template = template.replace('{{categoryTable}}', '');
    }

    if (recentExpenses.length > 0) {
        let rows = '';
        recentExpenses.forEach(exp => {
            const desc = (exp.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            rows += `<tr><td>${formatDate(exp.date)}</td><td>${desc}</td><td>${exp.categoryName || 'Sem categoria'}</td><td>${exp.paymentMethod || ''}</td><td>R$ ${formatCurrency(exp.amount)}</td></tr>`;
        });
        const table = `<h2>Últimos Gastos</h2><table><thead><tr><th>Data</th><th>Descrição</th><th>Categoria</th><th>Forma</th><th>Valor</th></tr></thead><tbody>${rows}</tbody></table>`;
        template = template.replace('{{expensesTable}}', table);
    } else {
        template = template.replace('{{expensesTable}}', '');
    }

    return template;
}

function formatCurrencyForCSV(value) {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function generateCSV() {
    if (!expenses || expenses.length === 0) {
        showAlert('Não há gastos para exportar', 'error');
        return;
    }

    const lines = [];

    // Resumo por categoria
    if (analytics.categoryData && analytics.categoryData.length > 0) {
        lines.push('Categoria,Total,Quantidade');
        analytics.categoryData.forEach(cat => {
            lines.push(`"${cat.name}","${formatCurrencyForCSV(cat.total)}","${cat.count}"`);
        });
        lines.push('');
    }

    // Lista de gastos
    lines.push('Data,Categoria,Descrição,Forma,Valor');
    const sorted = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    sorted.forEach(exp => {
        const date = formatDate(exp.date);
        const category = exp.categoryName || 'Sem categoria';
        const desc = (exp.description || '').replace(/"/g, '""');
        const value = formatCurrencyForCSV(exp.amount);
        const method = exp.paymentMethod || '';
        lines.push(`"${date}","${category}","${desc}","${method}","${value}"`);
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = `gastos-${formatDateForFile(new Date())}.csv`;

    if (navigator.msSaveBlob) {
        navigator.msSaveBlob(blob, fileName);
    } else {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    showAlert('Arquivo CSV exportado com sucesso!', 'success');
}

// Função para verificar se jsPDF está carregado
function checkJsPDFLoaded() {
    return typeof window.jspdf !== 'undefined';
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se jsPDF foi carregado
    if (!checkJsPDFLoaded()) {
        console.warn('jsPDF não foi carregado corretamente');
    }
});

