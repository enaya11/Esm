// SmartCoin Authentication Integration
// تكامل نظام المصادقة بين الفرونت إند والباك إند

class AuthIntegration {
    constructor() {
        this.apiBaseUrl = 'http://localhost:3000/api/v1';
        this.botToken = '7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ';
        this.botUsername = 'SmartCoinBot'; // يجب تحديث هذا باسم البوت الفعلي
        this.authToken = localStorage.getItem('smartcoin_auth_token');
        this.currentUser = null;
        this.verificationCode = null;
        this.codeCheckInterval = null;
        
        this.init();
    }

    // تهيئة النظام
    init() {
        console.log('🚀 تهيئة نظام المصادقة المتكامل...');
        
        // التحقق من وجود توكن مصادقة
        if (this.authToken) {
            this.verifyToken();
        }
        
        // إعداد مستمعي الأحداث
        this.setupEventListeners();
        
        // التحقق من معاملات URL للمصادقة
        this.checkUrlParams();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // زر تسجيل الدخول عبر تليجرام
        const telegramLoginBtn = document.getElementById('telegram-login-btn');
        if (telegramLoginBtn) {
            telegramLoginBtn.addEventListener('click', () => this.initiateTelegramLogin());
        }

        // نموذج التحقق من الرمز
        const verifyCodeForm = document.getElementById('verify-code-form');
        if (verifyCodeForm) {
            verifyCodeForm.addEventListener('submit', (e) => this.handleCodeVerification(e));
        }

        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // مراقبة تغييرات التخزين المحلي
        window.addEventListener('storage', (e) => {
            if (e.key === 'smartcoin_auth_token') {
                if (e.newValue) {
                    this.authToken = e.newValue;
                    this.verifyToken();
                } else {
                    this.handleLogout();
                }
            }
        });
    }

    // التحقق من معاملات URL
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const telegramData = urlParams.get('telegram');

        if (code) {
            this.verificationCode = code;
            this.verifyCodeFromUrl(code);
        }

        if (telegramData) {
            try {
                const data = JSON.parse(decodeURIComponent(telegramData));
                this.handleTelegramCallback(data);
            } catch (error) {
                console.error('خطأ في تحليل بيانات تليجرام:', error);
            }
        }
    }

    // بدء عملية تسجيل الدخول عبر تليجرام
    async initiateTelegramLogin() {
        try {
            this.showLoading('جاري الاتصال بتليجرام...');

            // إنشاء رابط البوت
            const botUrl = `https://t.me/${this.botUsername}?start=login`;
            
            // فتح البوت في نافذة جديدة
            const botWindow = window.open(botUrl, '_blank', 'width=400,height=600');
            
            // عرض تعليمات للمستخدم
            this.showInstructions();
            
            // بدء مراقبة رمز التحقق
            this.startCodePolling();

        } catch (error) {
            console.error('خطأ في بدء تسجيل الدخول:', error);
            this.showError('فشل في الاتصال بتليجرام. يرجى المحاولة مرة أخرى.');
        }
    }

    // عرض التعليمات للمستخدم
    showInstructions() {
        const instructionsHtml = `
            <div class="telegram-instructions glass-effect">
                <div class="instructions-header">
                    <i class="fab fa-telegram"></i>
                    <h3>تعليمات تسجيل الدخول</h3>
                </div>
                
                <div class="instructions-steps">
                    <div class="step">
                        <div class="step-number">1</div>
                        <div class="step-text">اضغط على زر "START" في البوت</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">2</div>
                        <div class="step-text">ستحصل على رمز تحقق مكون من 8 أحرف</div>
                    </div>
                    
                    <div class="step">
                        <div class="step-number">3</div>
                        <div class="step-text">أدخل الرمز في الحقل أدناه</div>
                    </div>
                </div>
                
                <div class="code-input-section">
                    <input type="text" id="verification-code-input" placeholder="أدخل رمز التحقق" maxlength="8" class="code-input">
                    <button id="verify-code-btn" class="btn-ultra btn-primary">تحقق</button>
                </div>
                
                <div class="auto-detection">
                    <i class="fas fa-magic"></i>
                    <span>سيتم اكتشاف الرمز تلقائياً عند إدخاله في البوت</span>
                </div>
            </div>
        `;

        this.showModal('تسجيل الدخول عبر تليجرام', instructionsHtml);
        
        // إعداد مستمع للرمز
        const codeInput = document.getElementById('verification-code-input');
        const verifyBtn = document.getElementById('verify-code-btn');
        
        if (codeInput && verifyBtn) {
            codeInput.addEventListener('input', (e) => {
                const code = e.target.value.toUpperCase();
                e.target.value = code;
                
                if (code.length === 8) {
                    verifyBtn.disabled = false;
                    // التحقق التلقائي
                    setTimeout(() => this.verifyCode(code), 500);
                } else {
                    verifyBtn.disabled = true;
                }
            });
            
            verifyBtn.addEventListener('click', () => {
                const code = codeInput.value.trim();
                if (code.length === 8) {
                    this.verifyCode(code);
                }
            });
        }
    }

    // بدء مراقبة رمز التحقق
    startCodePolling() {
        // إيقاف المراقبة السابقة إن وجدت
        if (this.codeCheckInterval) {
            clearInterval(this.codeCheckInterval);
        }

        // بدء مراقبة جديدة كل 3 ثوانٍ
        this.codeCheckInterval = setInterval(async () => {
            try {
                // فحص الحافظة للبحث عن رمز تحقق
                if (navigator.clipboard && navigator.clipboard.readText) {
                    const clipboardText = await navigator.clipboard.readText();
                    if (this.isValidVerificationCode(clipboardText)) {
                        this.verifyCode(clipboardText);
                        return;
                    }
                }
            } catch (error) {
                // تجاهل أخطاء الحافظة
            }
        }, 3000);

        // إيقاف المراقبة بعد 10 دقائق
        setTimeout(() => {
            if (this.codeCheckInterval) {
                clearInterval(this.codeCheckInterval);
                this.codeCheckInterval = null;
            }
        }, 10 * 60 * 1000);
    }

    // التحقق من صحة رمز التحقق
    isValidVerificationCode(text) {
        return text && typeof text === 'string' && 
               text.length === 8 && 
               /^[A-Z0-9]+$/.test(text);
    }

    // التحقق من رمز التحقق
    async verifyCode(code) {
        try {
            this.showLoading('جاري التحقق من الرمز...');

            const response = await fetch(`${this.apiBaseUrl}/auth/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ code }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // حفظ التوكن
                this.authToken = data.accessToken;
                localStorage.setItem('smartcoin_auth_token', this.authToken);
                
                // حفظ بيانات المستخدم
                this.currentUser = data.user;
                localStorage.setItem('smartcoin_user', JSON.stringify(this.currentUser));

                // إيقاف مراقبة الرمز
                if (this.codeCheckInterval) {
                    clearInterval(this.codeCheckInterval);
                    this.codeCheckInterval = null;
                }

                // إظهار رسالة نجاح
                this.showSuccess('تم تسجيل الدخول بنجاح!');

                // إعادة توجيه للصفحة الرئيسية
                setTimeout(() => {
                    window.location.href = 'earn-ultra.html';
                }, 2000);

            } else {
                throw new Error(data.message || 'فشل في التحقق من الرمز');
            }

        } catch (error) {
            console.error('خطأ في التحقق من الرمز:', error);
            this.showError(error.message || 'فشل في التحقق من الرمز');
        }
    }

    // التحقق من رمز من URL
    async verifyCodeFromUrl(code) {
        await this.verifyCode(code);
        
        // إزالة الرمز من URL
        const url = new URL(window.location);
        url.searchParams.delete('code');
        window.history.replaceState({}, document.title, url);
    }

    // معالجة callback من تليجرام
    async handleTelegramCallback(telegramData) {
        try {
            this.showLoading('جاري معالجة بيانات تليجرام...');

            const response = await fetch(`${this.apiBaseUrl}/auth/telegram`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(telegramData),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // حفظ التوكن
                this.authToken = data.accessToken;
                localStorage.setItem('smartcoin_auth_token', this.authToken);
                
                // حفظ بيانات المستخدم
                this.currentUser = data.user;
                localStorage.setItem('smartcoin_user', JSON.stringify(this.currentUser));

                this.showSuccess('تم تسجيل الدخول بنجاح!');

                // إعادة توجيه للصفحة الرئيسية
                setTimeout(() => {
                    window.location.href = 'earn-ultra.html';
                }, 2000);

            } else {
                throw new Error(data.message || 'فشل في مصادقة تليجرام');
            }

        } catch (error) {
            console.error('خطأ في معالجة بيانات تليجرام:', error);
            this.showError(error.message || 'فشل في معالجة بيانات تليجرام');
        }
    }

    // التحقق من صحة التوكن
    async verifyToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                localStorage.setItem('smartcoin_user', JSON.stringify(this.currentUser));
                
                // إذا كنا في صفحة تسجيل الدخول، إعادة توجيه للصفحة الرئيسية
                if (window.location.pathname.includes('login')) {
                    window.location.href = 'earn-ultra.html';
                }
                
                return true;
            } else {
                // التوكن غير صالح
                this.handleInvalidToken();
                return false;
            }

        } catch (error) {
            console.error('خطأ في التحقق من التوكن:', error);
            this.handleInvalidToken();
            return false;
        }
    }

    // معالجة التوكن غير الصالح
    handleInvalidToken() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('smartcoin_auth_token');
        localStorage.removeItem('smartcoin_user');
        
        // إعادة توجيه لصفحة تسجيل الدخول إذا لم نكن فيها
        if (!window.location.pathname.includes('login')) {
            window.location.href = 'login-ultra.html';
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            if (this.authToken) {
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json',
                    },
                });
            }
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
        } finally {
            this.handleLogout();
        }
    }

    // معالجة تسجيل الخروج
    handleLogout() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('smartcoin_auth_token');
        localStorage.removeItem('smartcoin_user');
        
        // إيقاف مراقبة الرمز
        if (this.codeCheckInterval) {
            clearInterval(this.codeCheckInterval);
            this.codeCheckInterval = null;
        }
        
        // إعادة توجيه لصفحة تسجيل الدخول
        window.location.href = 'login-ultra.html';
    }

    // الحصول على بيانات المستخدم الحالي
    getCurrentUser() {
        if (!this.currentUser) {
            const userData = localStorage.getItem('smartcoin_user');
            if (userData) {
                try {
                    this.currentUser = JSON.parse(userData);
                } catch (error) {
                    console.error('خطأ في تحليل بيانات المستخدم:', error);
                }
            }
        }
        return this.currentUser;
    }

    // التحقق من تسجيل الدخول
    isLoggedIn() {
        return !!(this.authToken && this.getCurrentUser());
    }

    // الحصول على إحصائيات المنصة
    async getPlatformStats() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/stats`);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('خطأ في الحصول على الإحصائيات:', error);
        }
        return null;
    }

    // عرض رسالة تحميل
    showLoading(message) {
        this.hideModal();
        
        const loadingHtml = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <div class="loading-text">${message}</div>
            </div>
        `;
        
        this.showModal('', loadingHtml, false);
    }

    // عرض رسالة نجاح
    showSuccess(message) {
        this.hideModal();
        this.showNotification(message, 'success');
    }

    // عرض رسالة خطأ
    showError(message) {
        this.hideModal();
        this.showNotification(message, 'error');
    }

    // عرض نافذة منبثقة
    showModal(title, content, showClose = true) {
        let modal = document.getElementById('auth-modal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'auth-modal';
            modal.className = 'auth-modal';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="modal-overlay" onclick="authIntegration.hideModal()"></div>
            <div class="modal-content glass-effect">
                ${title ? `
                    <div class="modal-header">
                        <h3>${title}</h3>
                        ${showClose ? '<button class="modal-close" onclick="authIntegration.hideModal()"><i class="fas fa-times"></i></button>' : ''}
                    </div>
                ` : ''}
                <div class="modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    // إخفاء النافذة المنبثقة
    hideModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // عرض إشعار
    showNotification(message, type = 'info') {
        // استخدام نظام الإشعارات الموجود
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            // إنشاء إشعار بسيط
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 2rem;
                border-radius: 10px;
                color: white;
                font-weight: 600;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            
            if (type === 'success') {
                notification.style.background = '#10B981';
            } else if (type === 'error') {
                notification.style.background = '#EF4444';
            } else {
                notification.style.background = '#3B82F6';
            }
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
}

// إنشاء مثيل عام للنظام
const authIntegration = new AuthIntegration();

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthIntegration;
}

console.log('✅ تم تحميل نظام تكامل المصادقة بنجاح');

