// نظام التسجيل لمنصة SmartCoin
class RegisterSystem {
    constructor() {
        this.apiBaseUrl = 'https://api.smartcoin-app.com';
        this.botToken = '7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.createParticles();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // معالجة إرسال نموذج التسجيل
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // تسجيل عبر تليجرام
        const telegramBtn = document.getElementById('telegramRegister');
        if (telegramBtn) {
            telegramBtn.addEventListener('click', (e) => this.registerWithTelegram(e));
        }

        // تسجيل عبر محفظة TON
        const tonBtn = document.getElementById('tonRegister');
        if (tonBtn) {
            tonBtn.addEventListener('click', (e) => this.registerWithTON(e));
        }

        // التحقق من كلمة المرور في الوقت الفعلي
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.validatePassword());
        }
        
        if (confirmPasswordInput) {
            confirmPasswordInput.addEventListener('input', () => this.validatePasswordMatch());
        }
    }

    // إنشاء الجزيئات المتحركة
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        if (!particlesContainer) return;

        const particleCount = 50;
        particlesContainer.innerHTML = '';

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
            
            // ألوان مختلفة للجزيئات
            const colors = ['#FFD700', '#9C27B0', '#00BCD4', '#FF9800'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            
            particlesContainer.appendChild(particle);
        }
    }

    // التحقق من صحة كلمة المرور
    validatePassword() {
        const password = document.getElementById('password').value;
        const passwordInput = document.getElementById('password');
        
        let isValid = true;
        let message = '';

        if (password.length < 8) {
            isValid = false;
            message = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            isValid = false;
            message = 'كلمة المرور يجب أن تحتوي على أحرف كبيرة وصغيرة وأرقام';
        }

        this.updateFieldValidation(passwordInput, isValid, message);
        return isValid;
    }

    // التحقق من تطابق كلمات المرور
    validatePasswordMatch() {
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const confirmPasswordInput = document.getElementById('confirmPassword');
        
        const isValid = password === confirmPassword && confirmPassword.length > 0;
        const message = isValid ? '' : 'كلمات المرور غير متطابقة';

        this.updateFieldValidation(confirmPasswordInput, isValid, message);
        return isValid;
    }

    // تحديث حالة التحقق من الحقل
    updateFieldValidation(input, isValid, message) {
        // إزالة الرسائل السابقة
        const existingMessage = input.parentNode.querySelector('.validation-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // تحديث لون الحدود
        if (isValid) {
            input.style.borderColor = '#4CAF50';
        } else {
            input.style.borderColor = '#F44336';
            
            // إضافة رسالة خطأ
            if (message) {
                const messageElement = document.createElement('div');
                messageElement.className = 'validation-message';
                messageElement.style.color = '#F44336';
                messageElement.style.fontSize = '12px';
                messageElement.style.marginTop = '5px';
                messageElement.textContent = message;
                input.parentNode.appendChild(messageElement);
            }
        }
    }

    // إعداد التحقق من النموذج
    setupFormValidation() {
        const inputs = document.querySelectorAll('.form-input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', () => {
                const isValid = input.value.trim() !== '';
                this.updateFieldValidation(input, isValid, isValid ? '' : 'هذا الحقل مطلوب');
            });
        });

        // التحقق من البريد الإلكتروني
        const emailInput = document.getElementById('email');
        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                const email = emailInput.value;
                const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
                this.updateFieldValidation(emailInput, isValid, isValid ? '' : 'البريد الإلكتروني غير صحيح');
            });
        }

        // التحقق من رقم الهاتف
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('blur', () => {
                const phone = phoneInput.value;
                const isValid = /^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone);
                this.updateFieldValidation(phoneInput, isValid, isValid ? '' : 'رقم الهاتف غير صحيح');
            });
        }
    }

    // معالجة التسجيل العادي
    async handleRegister(e) {
        e.preventDefault();
        
        // التحقق من صحة جميع الحقول
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(e.target);
        const userData = Object.fromEntries(formData);
        
        // إظهار حالة التحميل
        const submitBtn = document.querySelector('.register-btn');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري إنشاء الحساب...';
        submitBtn.disabled = true;

        try {
            // محاكاة طلب API
            await this.simulateAPICall();
            
            // حفظ بيانات المستخدم محلياً (للتطوير)
            localStorage.setItem('smartcoin_user_data', JSON.stringify(userData));
            
            // إظهار رسالة نجاح
            this.showSuccessMessage('تم إنشاء الحساب بنجاح!');
            
            // التوجيه لصفحة تسجيل الدخول بعد ثانيتين
            setTimeout(() => {
                window.location.href = 'login-enhanced.html';
            }, 2000);
            
        } catch (error) {
            console.error('خطأ في التسجيل:', error);
            this.showErrorMessage('حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى.');
            
            // استعادة الزر
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // التحقق من صحة النموذج
    validateForm() {
        const requiredFields = ['fullName', 'email', 'phone', 'password', 'confirmPassword'];
        let isValid = true;

        requiredFields.forEach(fieldName => {
            const field = document.getElementById(fieldName);
            if (!field.value.trim()) {
                this.updateFieldValidation(field, false, 'هذا الحقل مطلوب');
                isValid = false;
            }
        });

        // التحقق من كلمة المرور
        if (!this.validatePassword()) {
            isValid = false;
        }

        // التحقق من تطابق كلمات المرور
        if (!this.validatePasswordMatch()) {
            isValid = false;
        }

        // التحقق من الموافقة على الشروط
        const agreeTerms = document.getElementById('agreeTerms');
        if (!agreeTerms.checked) {
            this.showErrorMessage('يجب الموافقة على الشروط والأحكام');
            isValid = false;
        }

        return isValid;
    }

    // تسجيل عبر تليجرام
    async registerWithTelegram(e) {
        e.preventDefault();
        
        try {
            // هنا يمكن إضافة منطق التسجيل عبر تليجرام
            this.showInfoMessage('سيتم توجيهك لتسجيل الدخول عبر تليجرام...');
            
            // محاكاة عملية التسجيل
            await this.simulateAPICall();
            
            // التوجيه لصفحة تليجرام أو فتح التطبيق
            window.open('https://t.me/smartcoin_bot', '_blank');
            
        } catch (error) {
            console.error('خطأ في التسجيل عبر تليجرام:', error);
            this.showErrorMessage('حدث خطأ أثناء التسجيل عبر تليجرام');
        }
    }

    // تسجيل عبر محفظة TON
    async registerWithTON(e) {
        e.preventDefault();
        
        try {
            // هنا يمكن إضافة منطق التسجيل عبر محفظة TON
            this.showInfoMessage('سيتم توجيهك لتسجيل الدخول عبر محفظة TON...');
            
            // محاكاة عملية التسجيل
            await this.simulateAPICall();
            
            // هنا يمكن إضافة منطق TON Connect
            console.log('تسجيل عبر محفظة TON');
            
        } catch (error) {
            console.error('خطأ في التسجيل عبر محفظة TON:', error);
            this.showErrorMessage('حدث خطأ أثناء التسجيل عبر محفظة TON');
        }
    }

    // محاكاة طلب API
    simulateAPICall() {
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
    }

    // إظهار رسالة نجاح
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // إظهار رسالة خطأ
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // إظهار رسالة معلومات
    showInfoMessage(message) {
        this.showMessage(message, 'info');
    }

    // إظهار رسالة عامة
    showMessage(message, type = 'info') {
        // إزالة الرسائل السابقة
        const existingMessage = document.querySelector('.message-popup');
        if (existingMessage) {
            existingMessage.remove();
        }

        // إنشاء عنصر الرسالة
        const messageElement = document.createElement('div');
        messageElement.className = `message-popup message-${type}`;
        messageElement.innerHTML = `
            <div class="message-content">
                <i class="fas ${this.getMessageIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // تطبيق الأنماط
        Object.assign(messageElement.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getMessageColor(type),
            color: 'white',
            padding: '15px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            zIndex: '10000',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '400px',
            fontSize: '14px'
        });

        // إضافة الرسالة للصفحة
        document.body.appendChild(messageElement);

        // إزالة الرسالة بعد 5 ثوان
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    // الحصول على أيقونة الرسالة
    getMessageIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle',
            warning: 'fa-exclamation-triangle'
        };
        return icons[type] || icons.info;
    }

    // الحصول على لون الرسالة
    getMessageColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#F44336',
            info: '#2196F3',
            warning: '#FFC107'
        };
        return colors[type] || colors.info;
    }
}

// تبديل إظهار/إخفاء كلمة المرور
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = document.getElementById(inputId + 'Icon');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// إضافة أنماط CSS للرسائل المنبثقة
const messageStyles = document.createElement('style');
messageStyles.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }

    .message-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .message-content i {
        font-size: 18px;
    }
`;
document.head.appendChild(messageStyles);

// تشغيل النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    new RegisterSystem();
});

