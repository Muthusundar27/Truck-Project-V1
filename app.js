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

const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
};

const validateForm = (formId) => {
    const form = document.getElementById(formId);
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
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

// Storage Functions
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

const isAuthenticated = () => {
    return getCurrentUser() !== null;
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

const initializeApp = () => {
    if (isAuthenticated()) {
        showPage('dashboard-page');
        loadDashboard();
    } else {
        showPage('login-page');
    }

    setupEventListeners();
};

// Event Listeners Setup
const setupEventListeners = () => {
    // Navigation
    document.getElementById('go-to-signup')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('signup-page');
    });

    document.getElementById('go-to-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('login-page');
    });

    // Forms
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('otp-form')?.addEventListener('submit', handleOTPVerification);
    document.getElementById('add-truck-form')?.addEventListener('submit', handleAddTruck);
    document.getElementById('add-income-form')?.addEventListener('submit', handleAddIncome);
    document.getElementById('add-expense-form')?.addEventListener('submit', handleAddExpense);

    // Dashboard Actions
    document.getElementById('add-truck-btn')?.addEventListener('click', () => {
        showPage('add-truck-page');
        populateVehicleDropdowns();
    });

    document.getElementById('add-income-btn')?.addEventListener('click', () => {
        showPage('add-income-page');
        populateVehicleDropdowns();
        loadPaymentList();
    });

    document.getElementById('add-expense-btn')?.addEventListener('click', () => {
        showPage('add-expense-page');
        populateVehicleDropdowns();
    });

    // Back Buttons
    document.getElementById('back-to-dashboard-1')?.addEventListener('click', () => {
        showPage('dashboard-page');
        loadDashboard();
    });

    document.getElementById('back-to-dashboard-2')?.addEventListener('click', () => {
        showPage('dashboard-page');
        loadDashboard();
    });

    document.getElementById('back-to-dashboard-3')?.addEventListener('click', () => {
        showPage('dashboard-page');
        loadDashboard();
    });

    // Logout
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        document.getElementById('logout-modal').classList.add('active');
    });

    document.getElementById('confirm-logout')?.addEventListener('click', handleLogout);
    document.getElementById('cancel-logout')?.addEventListener('click', () => {
        document.getElementById('logout-modal').classList.remove('active');
    });

    // OTP Inputs
    setupOTPInputs();

    // File Uploads
    setupFileUpload('truck-documents', 'truck-file-preview');
    setupFileUpload('income-documents', 'income-file-preview');
    setupFileUpload('expense-documents', 'expense-file-preview');

    // Payment Filters
    setupPaymentFilters();

    // Truck Filter
    document.getElementById('truck-filter')?.addEventListener('change', updateDashboardStats);

    // Notify Button
    document.getElementById('notify-btn')?.addEventListener('click', handleNotify);

    // Input validation - remove error on input
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
        });
    });
};

// Login Handler
const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!validateForm('login-form')) {
        showToast('Please fill in all fields', 'error');
        return;
    }

    const phone = document.getElementById('login-phone').value;
    const password = document.getElementById('login-password').value;

    showSpinner();

    // Simulate API call
    setTimeout(() => {
        const users = getFromStorage('users') || [];
        const user = users.find(u => u.phone === phone && u.password === password);

        hideSpinner();

        if (user) {
            saveToStorage('currentUser', user);
            showToast('Login successful!', 'success');
            showPage('dashboard-page');
            loadDashboard();
            document.getElementById('login-form').reset();
        } else {
            showToast('Invalid phone or password', 'error');
        }
    }, 1000);
};

// Signup Handler
const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm('signup-form')) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const phone = document.getElementById('signup-phone').value;
    const users = getFromStorage('users') || [];

    if (users.find(u => u.phone === phone)) {
        showToast('Phone number already registered', 'error');
        return;
    }

    const userData = {
        fullName: document.getElementById('signup-fullname').value,
        phone: phone,
        email: document.getElementById('signup-email').value,
        password: document.getElementById('signup-password').value,
        address: document.getElementById('signup-address').value,
        city: document.getElementById('signup-city').value,
        state: document.getElementById('signup-state').value,
        zip: document.getElementById('signup-zip').value,
        company: document.getElementById('signup-company').value,
        createdAt: new Date().toISOString()
    };

    showSpinner();

    // Simulate API call
    setTimeout(() => {
        hideSpinner();
        saveToStorage('pendingUser', userData);
        showPage('otp-page');
        startOTPTimer();
        showToast('OTP sent to your phone', 'success');
    }, 1000);
};

// OTP Setup
const setupOTPInputs = () => {
    const otpBoxes = document.querySelectorAll('.otp-box');
    
    otpBoxes.forEach((box, index) => {
        box.addEventListener('input', (e) => {
            if (e.target.value.length === 1) {
                if (index < otpBoxes.length - 1) {
                    otpBoxes[index + 1].focus();
                }
            }
        });

        box.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });

        box.addEventListener('paste', (e) => {
            e.preventDefault();
            const pastedData = e.clipboardData.getData('text').slice(0, 5);
            pastedData.split('').forEach((char, i) => {
                if (otpBoxes[i]) {
                    otpBoxes[i].value = char;
                }
            });
            if (otpBoxes[pastedData.length - 1]) {
                otpBoxes[pastedData.length - 1].focus();
            }
        });
    });

    document.getElementById('resend-otp')?.addEventListener('click', () => {
        startOTPTimer();
        showToast('OTP resent successfully', 'success');
    });
};

let otpTimer;
const startOTPTimer = () => {
    let timeLeft = 30;
    const timerDisplay = document.getElementById('timer-display');
    const resendBtn = document.getElementById('resend-otp');
    
    resendBtn.disabled = true;
    
    otpTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            resendBtn.disabled = false;
            timerDisplay.textContent = '00:00';
        }
    }, 1000);
};

// OTP Verification Handler
const handleOTPVerification = (e) => {
    e.preventDefault();
    
    const otpBoxes = document.querySelectorAll('.otp-box');
    const otp = Array.from(otpBoxes).map(box => box.value).join('');
    
    if (otp.length !== 5) {
        showToast('Please enter complete OTP', 'error');
        return;
    }

    showSpinner();

    // Simulate OTP verification (in real app, verify with backend)
    setTimeout(() => {
        hideSpinner();
        clearInterval(otpTimer);
        
        const pendingUser = getFromStorage('pendingUser');
        const users = getFromStorage('users') || [];
        users.push(pendingUser);
        saveToStorage('users', users);
        saveToStorage('currentUser', pendingUser);
        localStorage.removeItem('pendingUser');
        
        showToast('Account created successfully!', 'success');
        showPage('dashboard-page');
        loadDashboard();
    }, 1000);
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
    
    // Get last 6 months data
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
        alertsList.innerHTML = '<p style="color: #6c757d;">No upcoming due dates</p>';
    }
};

// Add Truck Handler
const handleAddTruck = (e) => {
    e.preventDefault();
    
    if (!validateForm('add-truck-form')) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const isDue = document.querySelector('input[name="is-due"]:checked').value;
    
    const truckData = {
        id: Date.now(),
        vehicleNo: document.getElementById('vehicle-no').value.toUpperCase(),
        model: document.getElementById('truck-model').value,
        tyreCount: document.getElementById('tyre-count').value,
        dieselQty: document.getElementById('diesel-qty').value,
        owner: document.getElementById('truck-owner').value,
        isDue: isDue,
        dueDate: document.getElementById('due-date').value,
        pollutionDate: document.getElementById('pollution-date').value,
        taxDate: document.getElementById('tax-date').value,
        insuranceDate: document.getElementById('insurance-date').value,
        fcDate: document.getElementById('fc-date').value,
        permitDate: document.getElementById('permit-date').value,
        emiAmount: document.getElementById('emi-amount').value,
        loanProvider: document.getElementById('loan-provider').value,
        createdAt: new Date().toISOString()
    };

    showSpinner();

    setTimeout(() => {
        const trucks = getFromStorage('trucks') || [];
        trucks.push(truckData);
        saveToStorage('trucks', trucks);
        
        hideSpinner();
        showToast('Truck added successfully!', 'success');
        document.getElementById('add-truck-form').reset();
        showPage('dashboard-page');
        loadDashboard();
    }, 1000);
};

// Add Income Handler
const handleAddIncome = (e) => {
    e.preventDefault();
    
    if (!validateForm('add-income-form')) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const paymentStatus = document.querySelector('input[name="payment-status"]:checked').value;
    
    const incomeData = {
        id: Date.now(),
        vehicle: document.getElementById('income-vehicle').value,
        amount: document.getElementById('income-amount').value,
        notes: document.getElementById('income-notes').value,
        paymentStatus: paymentStatus,
        payerCompany: document.getElementById('payer-company').value,
        payerMobile: document.getElementById('payer-mobile').value,
        date: new Date().toISOString()
    };

    showSpinner();

    setTimeout(() => {
        const incomes = getFromStorage('incomes') || [];
        incomes.push(incomeData);
        saveToStorage('incomes', incomes);
        
        hideSpinner();
        showToast('Income added successfully!', 'success');
        document.getElementById('add-income-form').reset();
        loadPaymentList();
        updateDashboardStats();
    }, 1000);
};

// Add Expense Handler
const handleAddExpense = (e) => {
    e.preventDefault();
    
    if (!validateForm('add-expense-form')) {
        showToast('Please fill in all required fields', 'error');
        return;
    }

    const fileInput = document.getElementById('expense-documents');
    if (!fileInput.files.length) {
        showToast('Please upload at least one document', 'error');
        fileInput.classList.add('error');
        return;
    }

    const expenseData = {
        id: Date.now(),
        vehicle: document.getElementById('expense-vehicle').value,
        amount: document.getElementById('expense-amount').value,
        category: document.getElementById('expense-category').value,
        description: document.getElementById('expense-description').value,
        details: document.getElementById('expense-details').value,
        date: new Date().toISOString()
    };

    showSpinner();

    setTimeout(() => {
        const expenses = getFromStorage('expenses') || [];
        expenses.push(expenseData);
        saveToStorage('expenses', expenses);
        
        hideSpinner();
        showToast('Expense added successfully!', 'success');
        document.getElementById('add-expense-form').reset();
        document.getElementById('expense-file-preview').innerHTML = '';
        showPage('dashboard-page');
        loadDashboard();
    }, 1000);
};

// Populate Vehicle Dropdowns
const populateVehicleDropdowns = () => {
    const trucks = getFromStorage('trucks') || [];
    const dropdowns = ['income-vehicle', 'expense-vehicle'];
    
    dropdowns.forEach(dropdownId => {
        const select = document.getElementById(dropdownId);
        if (select) {
            select.innerHTML = '<option value="">Select Vehicle</option>';
            trucks.forEach(truck => {
                const option = document.createElement('option');
                option.value = truck.vehicleNo;
                option.textContent = `${truck.vehicleNo} - ${truck.model}`;
                select.appendChild(option);
            });
        }
    });
};

// File Upload Setup
const setupFileUpload = (inputId, previewId) => {
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);
    
    if (!input || !preview) return;
    
    input.addEventListener('change', (e) => {
        preview.innerHTML = '';
        const files = Array.from(e.target.files);
        
        files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const timestamp = new Date().toLocaleString('en-IN');
            
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    fileItem.innerHTML = `
                        <img src="${e.target.result}" alt="${file.name}">
                        <div class="file-name">${file.name}</div>
                        <div class="file-time">${timestamp}</div>
                        <button type="button" class="remove-file" data-index="${index}">×</button>
                    `;
                    preview.appendChild(fileItem);
                };
                reader.readAsDataURL(file);
            } else {
                fileItem.innerHTML = `
                    <div style="padding: 20px; background: #f0f0f0; border-radius: 8px;">📄</div>
                    <div class="file-name">${file.name}</div>
                    <div class="file-time">${timestamp}</div>
                    <button type="button" class="remove-file" data-index="${index}">×</button>
                `;
                preview.appendChild(fileItem);
            }
        });
        
        // Remove file handler
        preview.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-file')) {
                const index = parseInt(e.target.dataset.index);
                const dt = new DataTransfer();
                const files = Array.from(input.files);
                files.forEach((file, i) => {
                    if (i !== index) dt.items.add(file);
                });
                input.files = dt.files;
                e.target.closest('.file-item').remove();
            }
        });
    });
};

// Payment List
const loadPaymentList = (filter = 'all') => {
    const incomes = getFromStorage('incomes') || [];
    const list = document.getElementById('payment-list');
    
    if (!list) return;
    
    let filteredIncomes = incomes;
    
    if (filter === 'paid') {
        filteredIncomes = incomes.filter(i => i.paymentStatus === 'paid');
    } else if (filter === 'unpaid') {
        filteredIncomes = incomes.filter(i => i.paymentStatus === 'unpaid');
    } else if (filter === 'last-3-months') {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        filteredIncomes = incomes.filter(i => new Date(i.date) >= threeMonthsAgo);
    }
    
    list.innerHTML = '';
    
    if (filteredIncomes.length === 0) {
        list.innerHTML = '<p style="color: #6c757d; text-align: center; padding: 20px;">No payments found</p>';
        return;
    }
    
    filteredIncomes.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach(income => {
        const paymentItem = document.createElement('div');
        paymentItem.className = `payment-item ${income.paymentStatus}`;
        paymentItem.innerHTML = `
            <div class="payment-info">
                <h4>${income.vehicle}</h4>
                <p>${income.payerCompany || 'N/A'} | ${formatDate(income.date)}</p>
                <p style="font-size: 12px;">${income.notes || ''}</p>
            </div>
            <div class="payment-amount">${formatCurrency(income.amount)}</div>
        `;
        list.appendChild(paymentItem);
    });
};

const setupPaymentFilters = () => {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadPaymentList(btn.dataset.filter);
        });
    });
};

// Notify Handler
const handleNotify = () => {
    const payerMobile = document.getElementById('payer-mobile').value;
    const amount = document.getElementById('income-amount').value;
    
    if (!payerMobile || !amount) {
        showToast('Please enter payer mobile and amount', 'error');
        return;
    }
    
    showSpinner();
    setTimeout(() => {
        hideSpinner();
        showToast('Notification sent successfully!', 'success');
    }, 1000);
};

// Logout Handler
const handleLogout = () => {
    showSpinner();
    setTimeout(() => {
        localStorage.removeItem('currentUser');
        hideSpinner();
        document.getElementById('logout-modal').classList.remove('active');
        showToast('Logged out successfully', 'success');
        showPage('login-page');
    }, 500);
};
