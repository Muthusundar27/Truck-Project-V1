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
    const select = document.getElementById('expense-vehicle');
    
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
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);
    }, 1000);
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    if (!checkAuth()) return;

    populateVehicleDropdowns();

    // Back Button
    document.getElementById('back-to-dashboard')?.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    // Form Handler
    document.getElementById('add-expense-form')?.addEventListener('submit', handleAddExpense);

    // File Upload
    setupFileUpload('expense-documents', 'expense-file-preview');

    // Input validation
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
        });
    });
});
