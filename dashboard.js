// Utility Functions
const showToast = (message, type = 'info') => {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
};

const showSpinner = () => {
    document.getElementById('loading-spinner').style.display = 'flex';
};

const hideSpinner = () => {
    document.getElementById('loading-spinner').style.display = 'none';
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const saveToStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

const getFromStorage = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

const getCurrentUser = () => {
    return getFromStorage('currentUser');
};

// Check Authentication
const checkAuth = () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

// Dashboard Functions
const loadDashboard = () => {
    const user = getCurrentUser();
    if (!user) return;

    // Set greeting
    const hour = new Date().getHours();
    let greeting = 'Good Morning';
    if (hour >= 12 && hour < 17) greeting = 'Good Afternoon';
    else if (hour >= 17) greeting = 'Good Evening';
    
    document.getElementById('greeting-message').textContent = `${greeting}, ${user.fullName.split(' ')[0]}!`;

    // Load trucks for filter
    loadTruckFilter();
    
    // Update stats
    updateDashboardStats();
    
    // Load chart
    loadChart();
    
    // Check for alerts
    checkDueAlerts();
};

const loadTruckFilter = () => {
    const trucks = getFromStorage('trucks') || [];
    const select = document.getElementById('truck-filter');
    const buttonsContainer = document.getElementById('truck-buttons');
    
    select.innerHTML = '<option value="all">All Trucks</option>';
    buttonsContainer.innerHTML = '';
    
    trucks.forEach(truck => {
        const option = document.createElement('option');
        option.value = truck.vehicleNo;
        option.textContent = truck.vehicleNo;
        select.appendChild(option);
        
        const button = document.createElement('button');
        button.className = 'truck-btn';
        button.textContent = truck.vehicleNo;
        button.addEventListener('click', () => {
            document.querySelectorAll('.truck-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            select.value = truck.vehicleNo;
            updateDashboardStats();
        });
        buttonsContainer.appendChild(button);
    });
};

const updateDashboardStats = () => {
    const selectedTruck = document.getElementById('truck-filter')?.value || 'all';
    const incomes = getFromStorage('incomes') || [];
    const expenses = getFromStorage('expenses') || [];
    
    let filteredIncomes = incomes;
    let filteredExpenses = expenses;
    
    if (selectedTruck !== 'all') {
        filteredIncomes = incomes.filter(i => i.vehicle === selectedTruck);
        filteredExpenses = expenses.filter(e => e.vehicle === selectedTruck);
    }
    
    const totalIncome = filteredIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    const totalExpense = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const netProfit = totalIncome - totalExpense;
    
    document.getElementById('total-income').textContent = formatCurrency(totalIncome);
    document.getElementById('total-expense').textContent = formatCurrency(totalExpense);
    document.getElementById('net-profit').textContent = formatCurrency(netProfit);
    
    loadChart();
};

let chartInstance = null;
const loadChart = () => {
    const selectedTruck = document.getElementById('truck-filter')?.value || 'all';
    const incomes = getFromStorage('incomes') || [];
    const expenses = getFromStorage('expenses') || [];
    
    const months = [];
    const incomeData = [];
    const expenseData = [];
    
    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthName = date.toLocaleDateString('en-IN', { month: 'short' });
        months.push(monthName);
        
        const month = date.getMonth();
        const year = date.getFullYear();
        
        let monthIncomes = incomes.filter(income => {
            const incomeDate = new Date(income.date);
            return incomeDate.getMonth() === month && 
                   incomeDate.getFullYear() === year &&
                   (selectedTruck === 'all' || income.vehicle === selectedTruck);
        });
        
        let monthExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === month && 
                   expenseDate.getFullYear() === year &&
                   (selectedTruck === 'all' || expense.vehicle === selectedTruck);
        });
        
        incomeData.push(monthIncomes.reduce((sum, i) => sum + parseFloat(i.amount), 0));
        expenseData.push(monthExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0));
    }
    
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;
    
    if (chartInstance) {
        chartInstance.destroy();
    }
    
    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: '#28a745',
                    borderWidth: 2
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 53, 69, 0.7)',
                    borderColor: '#dc3545',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ₹' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            }
        }
    });
};

const checkDueAlerts = () => {
    const trucks = getFromStorage('trucks') || [];
    const alertsList = document.getElementById('alerts-list');
    alertsList.innerHTML = '';
    
    const today = new Date();
    const sevenDaysLater = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
    
    trucks.forEach(truck => {
        const dates = [
            { label: 'Due Date', date: truck.dueDate },
            { label: 'Pollution', date: truck.pollutionDate },
            { label: 'Tax', date: truck.taxDate },
            { label: 'Insurance', date: truck.insuranceDate },
            { label: 'FC', date: truck.fcDate },
            { label: 'Permit', date: truck.permitDate }
        ];
        
        dates.forEach(item => {
            if (item.date) {
                const dueDate = new Date(item.date);
                if (dueDate >= today && dueDate <= sevenDaysLater) {
                    const daysLeft = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                    const alertDiv = document.createElement('div');
                    alertDiv.className = daysLeft <= 3 ? 'alert-item critical' : 'alert-item';
                    alertDiv.innerHTML = `
                        <strong>${truck.vehicleNo} - ${item.label}</strong>
                        <span>Due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${formatDate(item.date)})</span>
                    `;
                    alertsList.appendChild(alertDiv);
                }
            }
        });
    });
    
    if (alertsList.children.length === 0) {
        alertsList.innerHTML = '<p style="color: #f8f9fa;">No upcoming due dates</p>';
    }
};

// Logout Handler
const handleLogout = () => {
    showSpinner();
    setTimeout(() => {
        localStorage.removeItem('currentUser');
        hideSpinner();
        document.getElementById('logout-modal').classList.remove('active');
        showToast('Logged out successfully', 'success');
        window.location.href = 'login.html';
    }, 500);
};

// Initialize Dashboard
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    loadDashboard();

    // Dashboard Actions
    document.getElementById('add-truck-btn')?.addEventListener('click', () => {
        window.location.href = 'add-truck.html';
    });

    document.getElementById('add-income-btn')?.addEventListener('click', () => {
        window.location.href = 'add-income.html';
    });

    document.getElementById('add-expense-btn')?.addEventListener('click', () => {
        window.location.href = 'add-expense.html';
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        document.getElementById('logout-modal').classList.add('active');
    });

    document.getElementById('confirm-logout')?.addEventListener('click', handleLogout);
    document.getElementById('cancel-logout')?.addEventListener('click', () => {
        document.getElementById('logout-modal').classList.remove('active');
    });

    // Truck Filter
    document.getElementById('truck-filter')?.addEventListener('change', updateDashboardStats);
});
