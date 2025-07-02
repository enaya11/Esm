class TelegramAuth {
    constructor() {
        this.botToken = '7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ';
        this.botUsername = 'smartcoin_official_bot';
        this.apiBaseUrl = 'https://api.smartcoin-app.com';
        this.isLoggedIn = false;
        this.currentUser = null;
        this.authToken = null;
        this.sessionId = null;
        this.checkInterval = null;

        this.init();
    }

    init() {
        // التحقق من الجلسة المحفوظة
        this.checkSavedSession();

        // إعداد مستمعي الأحداث
        this.setupEventListeners();

        // بدء فحص دوري لحالة المصادقة
        this.startPeriodicCheck();

        console.log('🚀 تم تهيئة نظام مصادقة تليجرام');
    }

    setupEventListeners() {
        // زر تسجيل الدخول عبر تليجرام (مع تعديل الـ id ليطابق الـ HTML)
        const telegramLoginBtn = document.getElementById('telegramLoginBtn');
        if (telegramLoginBtn) {
            telegramLoginBtn.addEventListener('click', () => {
                this.startTelegramLogin();
            });
        }

        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // نموذج رمز التحقق
        const verificationForm = document.getElementById('verification-form');
        if (verificationForm) {
            verificationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.verifyCode();
            });
        }

        // حقل رمز التحقق
        const verificationInput = document.getElementById('verification-code');
        if (verificationInput) {
            verificationInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
                if (e.target.value.length === 8) {
                    this.verifyCode();
                }
            });
        }
    }

    checkSavedSession() {
        const savedToken = localStorage.getItem('smartcoin_auth_token');
        const savedSessionId = localStorage.getItem('smartcoin_session_id');
        const savedUser = localStorage.getItem('smartcoin_user');
        const loginTime = localStorage.getItem('smartcoin_login_time');

        if (savedToken && savedSessionId && savedUser && loginTime) {
            // التحقق من انتهاء صلاحية الجلسة (30 يوم)
            const loginDate = new Date(parseInt(loginTime));
            const now = new Date();
            const daysDiff = (now - loginDate) / (1000 * 60 * 60 * 24);

            if (daysDiff < 30) {
                this.authToken = savedToken;
                this.sessionId = savedSessionId;
                this.currentUser = JSON.parse(savedUser);
                this.isLoggedIn = true;

                console.log('✅ تم استرداد الجلسة المحفوظة');
                this.handleSuccessfulLogin();
                return true;
            } else {
                // انتهت صلاحية الجلسة
                this.clearSession();
                console.log('⏰ انتهت صلاحية الجلسة');
            }
        }

        return false;
    }

    startTelegramLogin() {
        console.log('🔐 بدء عملية تسجيل الدخول عبر تليجرام...');

        // إظهار التعليمات
        this.showLoginInstructions();

        // فتح البوت في تليجرام
        this.openTelegramBot();

        // بدء فحص حالة المصادقة
        this.startAuthCheck();
    }

    showLoginInstructions() {
        const instructionsHtml = `
            <div class="login-instructions" id="login-instructions">
                <div class="instructions-content">
                    <h3>📱 خطوات تسجيل الدخول</h3>
                    <ol>
                        <li>اضغط على "فتح البوت" أدناه</li>
                        <li>أرسل الأمر <code>/start</code> أو <code>/login</code></li>
                        <li>انسخ رمز التحقق من البوت</li>
                        <li>أدخل الرمز في الحقل أدناه</li>
                    </ol>

                    <div class="action-buttons">
                        <a href="https://t.me/${this.botUsername}" target="_blank" class="btn btn-primary">
                            📱 فتح البوت
                        </a>
                        <button onclick="telegramAuth.checkAuthStatus()" class="btn btn-secondary">
                            🔄 تحديث الحالة
                        </button>
                    </div>

                    <div class="verification-section">
                        <h4>🔑 أدخل رمز التحقق</h4>
                        <form id="verification-form">
                            <input 
                                type="text" 
                                id="verification-code" 
                                placeholder="أدخل رمز التحقق (8 أحرف)" 
                                maxlength="8" 
                                class="verification-input" 
                                autocomplete="off"
                            >
                            <button type="submit" class="btn btn-success">✅ تحقق</button>
                        </form>
                    </div>

                    <div class="status-message" id="auth-status">
                        ⏳ في انتظار تسجيل الدخول...
                    </div>
                </div>
            </div>
        `;

        // إدراج التعليمات في الصفحة
        const container = document.querySelector('.login-container') || document.body;
        const existingInstructions = document.getElementById('login-instructions');

        if (existingInstructions) {
            existingInstructions.innerHTML = instructionsHtml;
        } else {
            container.insertAdjacentHTML('beforeend', instructionsHtml);
        }

        // إعادة إعداد مستمعي الأحداث
        this.setupEventListeners();
    }

    openTelegramBot() {
        const botUrl = `https://t.me/${this.botUsername}`;
        const telegramAppUrl = `tg://resolve?domain=${this.botUsername}`;

        const appLink = document.createElement('a');
        appLink.href = telegramAppUrl;
        appLink.style.display = 'none';
        document.body.appendChild(appLink);
        appLink.click();
        document.body.removeChild(appLink);

        setTimeout(() => {
            window.open(botUrl, '_blank');
        }, 1000);

        console.log('📱 تم فتح بوت تليجرام');
    }

    startAuthCheck() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
        }

        this.checkInterval = setInterval(() => {
            this.checkAuthStatus();
        }, 3000);

        console.log('🔄 بدء فحص دوري لحالة المصادقة');
    }

    async checkAuthStatus() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/check-telegram-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ timestamp: Date.now() })
            });

            if (response.ok) {
                const result = await response.json();

                if (result.success && result.user) {
                    this.handleAuthSuccess(result);
                } else {
                    this.updateAuthStatus('⏳ في انتظار تسجيل الدخول...', 'waiting');
                }
            }
        } catch (error) {
            console.error('خطأ في فحص حالة المصادقة:', error);
            this.updateAuthStatus('❌ خطأ في الاتصال', 'error');
        }
    }

    async verifyCode() {
        const codeInput = document.getElementById('verification-code');
        const code = codeInput?.value?.trim();

        if (!code || code.length !== 8) {
            this.showError('يرجى إدخال رمز التحقق المكون من 8 أحرف');
            return;
        }

        this.updateAuthStatus('🔄 جاري التحقق من الرمز...', 'checking');

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify-telegram-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verification_code: code })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                this.handleAuthSuccess(result);
            } else {
                this.showError(result.message || 'رمز التحقق غير صحيح أو منتهي الصلاحية');
                this.updateAuthStatus('❌ رمز التحقق غير صحيح', 'error');
            }
        } catch (error) {
            console.error('خطأ في التحقق من الرمز:', error);
            this.showError('حدث خطأ في التحقق من الرمز');
            this.updateAuthStatus('❌ خطأ في التحقق', 'error');
        }
    }

    handleAuthSuccess(result) {
        console.log('✅ تم تسجيل الدخول بنجاح:', result);

        this.authToken = result.auth_token;
        this.sessionId = result.session_id;
        this.currentUser = result.user;
        this.isLoggedIn = true;

        localStorage.setItem('smartcoin_auth_token', this.authToken);
        localStorage.setItem('smartcoin_session_id', this.sessionId);
        localStorage.setItem('smartcoin_user', JSON.stringify(this.currentUser));
        localStorage.setItem('smartcoin_login_time', Date.now().toString());

        this.updateAuthStatus('✅ تم تسجيل الدخول بنجاح!', 'success');

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        setTimeout(() => {
            this.handleSuccessfulLogin();
        }, 1500);
    }

    handleSuccessfulLogin() {
        console.log('🎉 معالجة تسجيل الدخول الناجح');

        const instructions = document.getElementById('login-instructions');
        if (instructions) instructions.style.display = 'none';

        const loginScreen = document.getElementById('loading-screen');
        if (loginScreen) loginScreen.style.display = 'none';

        const mainContent = document.getElementById('main-content');
        if (mainContent) mainContent.style.display = 'block';

        this.updateUserInterface();
        this.dispatchLoginEvent();

        if (window.location.pathname.includes('login')) {
            window.location.href = 'earn-enhanced.html';
        }
    }

    updateUserInterface() {
        if (!this.currentUser) return;

        const userNameElements = document.querySelectorAll('.user-name, #user-name');
        userNameElements.forEach(el => {
            el.textContent = this.currentUser.first_name || 'مستخدم';
        });

        const balanceElements = document.querySelectorAll('.user-balance, #user-balance, .balance');
        balanceElements.forEach(el => {
            el.textContent = this.currentUser.total_coins || 0;
        });

        const levelElements = document.querySelectorAll('.user-level, #user-level');
        levelElements.forEach(el => {
            el.textContent = this.currentUser.level || 1;
        });

        const logoutButtons = document.querySelectorAll('.logout-btn');
        logoutButtons.forEach(btn => btn.style.display = 'block');

        const loginButtons = document.querySelectorAll('.login-btn');
        loginButtons.forEach(btn => btn.style.display = 'none');

        console.log('🔄 تم تحديث واجهة المستخدم');
    }

    updateAuthStatus(message, type = 'info') {
        const statusElement = document.getElementById('auth-status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = `status-message ${type}`;
        }
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => {
            if (errorDiv.parentNode) errorDiv.parentNode.removeChild(errorDiv);
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 10000;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(successDiv);
        setTimeout(() => {
            if (successDiv.parentNode) successDiv.parentNode.removeChild(successDiv);
        }, 3000);
    }

    async logout() {
        console.log('🚪 بدء عملية تسجيل الخروج...');

        try {
            if (this.authToken) {
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.authToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('خطأ في تسجيل الخروج من الخادم:', error);
        }

        this.clearSession();
        window.location.href = 'login-enhanced.html';
    }

    clearSession() {
        this.authToken = null;
        this.sessionId = null;
        this.currentUser = null;
        this.isLoggedIn = false;

        localStorage.removeItem('smartcoin_auth_token');
        localStorage.removeItem('smartcoin_session_id');
        localStorage.removeItem('smartcoin_user');
        localStorage.removeItem('smartcoin_login_time');

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        console.log('🧹 تم مسح جلسة المصادقة');
    }

    startPeriodicCheck() {
        setInterval(() => {
            if (this.isLoggedIn && this.authToken) {
                this.validateSession();
            }
        }, 5 * 60 * 1000); // كل 5 دقائق
    }

    async validateSession() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/validate-session`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ session_id: this.sessionId })
            });

            if (!response.ok) {
                console.log('❌ انتهت صلاحية الجلسة');
                this.clearSession();
                window.location.href = 'login-enhanced.html';
            }
        } catch (error) {
            console.error('خطأ في التحقق من صحة الجلسة:', error);
        }
    }

    dispatchLoginEvent() {
        const loginEvent = new CustomEvent('smartcoin:login', {
            detail: {
                user: this.currentUser,
                authToken: this.authToken,
                sessionId: this.sessionId
            }
        });

        document.dispatchEvent(loginEvent);
    }

    getAuthToken() {
        return this.authToken;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getSessionId() {
        return this.sessionId;
    }

    isUserLoggedIn() {
        return this.isLoggedIn;
    }
}

// إنشاء مثيل عام
const telegramAuth = new TelegramAuth();

// تعيين للمجال العام (window) في المتصفح
if (typeof window !== 'undefined') {
    window.telegramAuth = telegramAuth;
}

// دالة لفحص حماية الصفحات
function checkPageProtection() {
    const protectedPages = ['earn-enhanced.html', 'tasks-enhanced.html', 'referrals-enhanced.html', 'wheel-enhanced.html', 'profile-enhanced.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage) && !telegramAuth.isUserLoggedIn()) {
        console.log('🔒 صفحة محمية - إعادة توجيه لتسجيل الدخول');
        window.location.href = 'login-enhanced.html';
        return false;
    }

    return true;
}

// فحص الحماية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    checkPageProtection();
});

// تصدير في بيئة Node.js (لو تستخدم)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TelegramAuth;
}