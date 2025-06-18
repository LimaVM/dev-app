// Variáveis dos gráficos
let pieChart = null;
let barChart = null;

// Inicializar gráficos quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    initializeCharts();
});

function initializeCharts() {
    // Configurações padrão do Chart.js
    Chart.defaults.font.family = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
    Chart.defaults.font.size = 12;
    Chart.defaults.color = '#666';
    
    // Inicializar gráfico de pizza
    const pieCtx = document.getElementById('pieChart');
    if (pieCtx) {
        pieChart = new Chart(pieCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: R$ ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Inicializar gráfico de barras
    const barCtx = document.getElementById('barChart');
    if (barCtx) {
        barChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Valor Gasto (R$)',
                    data: [],
                    backgroundColor: [],
                    borderColor: [],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: R$ ${formatCurrency(context.parsed.y)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + formatCurrency(value);
                            },
                            maxTicksLimit: 8
                        },
                        grid: {
                            color: '#e9ecef'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                }
            }
        });
    }
}

function updateCharts() {
    if (!analytics || !analytics.categoryData) {
        updateEmptyCharts();
        return;
    }
    
    const categoryData = analytics.categoryData;
    
    if (categoryData.length === 0) {
        updateEmptyCharts();
        return;
    }
    
    // Preparar dados
    const labels = categoryData.map(cat => cat.name);
    const values = categoryData.map(cat => cat.total);
    const colors = categoryData.map(cat => cat.color);
    const borderColors = colors.map(color => darkenColor(color, 0.2));
    
    // Atualizar gráfico de pizza
    if (pieChart && pieChart.data) {
        pieChart.data.labels = labels;
        pieChart.data.datasets[0].data = values;
        pieChart.data.datasets[0].backgroundColor = colors;
        pieChart.data.datasets[0].borderColor = borderColors;
        pieChart.update('none');
    }
    
    // Atualizar gráfico de barras
    if (barChart && barChart.data) {
        barChart.data.labels = labels;
        barChart.data.datasets[0].data = values;
        barChart.data.datasets[0].backgroundColor = colors.map(color => color + '80'); // Adicionar transparência
        barChart.data.datasets[0].borderColor = borderColors;
        barChart.update('none');
    }
}

function updateEmptyCharts() {
    // Dados vazios para quando não há gastos
    const emptyData = {
        labels: ['Nenhum gasto'],
        data: [1],
        backgroundColor: ['#e9ecef'],
        borderColor: ['#dee2e6']
    };
    
    // Atualizar gráfico de pizza
    if (pieChart && pieChart.data) {
        pieChart.data.labels = emptyData.labels;
        pieChart.data.datasets[0].data = emptyData.data;
        pieChart.data.datasets[0].backgroundColor = emptyData.backgroundColor;
        pieChart.data.datasets[0].borderColor = emptyData.borderColor;
        pieChart.update('none');
    }
    
    // Atualizar gráfico de barras
    if (barChart && barChart.data) {
        barChart.data.labels = emptyData.labels;
        barChart.data.datasets[0].data = emptyData.data;
        barChart.data.datasets[0].backgroundColor = emptyData.backgroundColor;
        barChart.data.datasets[0].borderColor = emptyData.borderColor;
        barChart.update('none');
    }
}

// Função para escurecer uma cor (para bordas)
function darkenColor(color, factor) {
    // Converter hex para RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Escurecer
    const newR = Math.floor(r * (1 - factor));
    const newG = Math.floor(g * (1 - factor));
    const newB = Math.floor(b * (1 - factor));
    
    // Converter de volta para hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Função para gerar cores aleatórias para categorias sem cor definida
function generateRandomColor() {
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
        '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF',
        '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56'
    ];
    
    return colors[Math.floor(Math.random() * colors.length)];
}

// Função para redimensionar gráficos (útil para responsividade)
function resizeCharts() {
    if (pieChart) {
        pieChart.resize();
    }
    if (barChart) {
        barChart.resize();
    }
}

// Escutar mudanças de tamanho da janela
window.addEventListener('resize', function() {
    setTimeout(resizeCharts, 100);
});

// Função para exportar gráficos como imagem (será usada no PDF)
function getChartImage(chartType) {
    let chart;
    
    switch (chartType) {
        case 'pie':
            chart = pieChart;
            break;
        case 'bar':
            chart = barChart;
            break;
        default:
            return null;
    }
    
    if (!chart) return null;
    
    return chart.toBase64Image('image/png', 1.0);
}

// Função para obter dados dos gráficos para o PDF
function getChartsData() {
    if (!analytics || !analytics.categoryData || analytics.categoryData.length === 0) {
        return null;
    }
    
    return {
        pieImage: getChartImage('pie'),
        barImage: getChartImage('bar'),
        categoryData: analytics.categoryData,
        totalAmount: analytics.totalAmount,
        dailyAverage: analytics.dailyAverage,
        expenseCount: analytics.expenseCount
    };
}

// Configurações de animação personalizadas
const animationConfig = {
    duration: 800,
    easing: 'easeInOutQuart'
};

// Aplicar animações aos gráficos
if (typeof Chart !== 'undefined') {
    Chart.defaults.animation = animationConfig;
}

