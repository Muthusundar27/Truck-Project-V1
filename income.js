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

const checkAuth = () => {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
};

// Populate Vehicle Dropdowns
const populateVehicleDropdowns = () => {
    const trucks = getFromStorage('trucks') || [];
    const select = document.getElementById('income-vehicle');
    
    if (select) {
        select.innerHTML = '<option value="">Select Vehicle</option>';
        trucks.forEach(truck => {
            const option = document.createElement('option');
            option.value = truck.vehicleNo;
            option.textContent = `${truck.vehicleNo} - ${truck.model}`;
            select.appendChild(option);
        });
    }
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
        document.getElementById('income-file-preview').innerHTML = '';
        loadPaymentList();
    }, 1000);
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    populateVehicleDropdowns();
    loadPaymentList();

    // Back Button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Form Handler
    document.getElementById('add-income-form')?.addEventListener('submit', handleAddIncome);

    // File Upload
    setupFileUpload('income-documents', 'income-file-preview');

    // Payment Filters
    setupPaymentFilters();

    // Notify Button
    document.getElementById('notify-btn')?.addEventListener('click', handleNotify);

    // Input validation
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
        });
    });
});
