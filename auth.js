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

    setTimeout(() => {
        const users = getFromStorage('users') || [];
        const user = users.find(u => u.phone === phone && u.password === password);

        hideSpinner();

        if (user) {
            saveToStorage('currentUser', user);
            showToast('Login successful!', 'success');
            window.location.href = 'dashboard.html';
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

    setTimeout(() => {
        hideSpinner();
        saveToStorage('pendingUser', userData);
        window.location.href = 'otp.html';
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

    if (otpBoxes.length > 0) {
        otpBoxes[0].focus();
    }

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
    
    if (otpTimer) clearInterval(otpTimer);
    
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
        window.location.href = 'dashboard.html';
    }, 1000);
};

// Input validation - remove error on input
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication for non-auth pages
    const isAuthPage = window.location.pathname.includes('login') || 
                       window.location.pathname.includes('signup') || 
                       window.location.pathname.includes('otp');
    
    if (!isAuthPage) {
        const currentUser = getFromStorage('currentUser');
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
    }

    // Setup form handlers
    document.getElementById('login-form')?.addEventListener('submit', handleLogin);
    document.getElementById('signup-form')?.addEventListener('submit', handleSignup);
    document.getElementById('otp-form')?.addEventListener('submit', handleOTPVerification);

    // Setup OTP if on OTP page
    if (document.querySelector('.otp-box')) {
        setupOTPInputs();
        startOTPTimer();
    }

    // Input validation
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
        });
    });
});
