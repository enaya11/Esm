// نظام المصادقة لمنصة SmartCoin
class AuthSystem {
    constructor() {
        this.apiBaseUrl = 'https://api.smartcoin-app.com';
        this.botToken = '7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA';
        this.currentUser = null;
        this.init();
    }

    init() {
        // التحقق من حالة تسجيل الدخول عند تحميل الصفحة
        this.checkAuthStatus();
        
        // إضافة مستمعي الأحداث
        this.setupEventListeners();
    }

    setupEventListeners() {
        // زر تسجيل الدخول عبر التليجرام
        const telegramLoginBtn = document.getElementById('telegram-login-btn');
        if (telegramLoginBtn) {
            telegramLoginBtn.addEventListener('click', () => this.loginWithTelegram());
        }

        // زر تسجيل الخروج
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }

    // التحقق من حالة المصادقة
    checkAuthStatus() {
        const token = localStorage.getItem('smartcoin_token');
        const userData = localStorage.getItem('smartcoin_user');

        if (token && userData) {
            try {
                this.currentUser = JSON.parse(userData);
                this.verifyToken(token);
            } catch (error) {
                console.error('خطأ في تحليل بيانات المستخدم:', error);
                this.clearAuthData();
            }
        } else {
            // إذا لم يكن مسجل دخول، توجيه لصفحة تسجيل الدخول
            this.redirectToLogin();
        }
    }

    // التحقق من صحة التوكن
    async verifyToken(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/verify`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.valid) {
                    this.currentUser = result.user;
                    this.updateUserData(result.user);
                    this.allowAccess();
                } else {
                    this.clearAuthData();
                    this.redirectToLogin();
                }
            } else {
                this.clearAuthData();
                this.redirectToLogin();
            }
        } catch (error) {
            console.error('خطأ في التحقق من التوكن:', error);
            this.clearAuthData();
            this.redirectToLogin();
        }
    }

    // تسجيل الدخول عبر التليجرام
    async loginWithTelegram() {
        try {
            // إظهار رسالة التحميل
            this.showLoadingMessage('جاري الاتصال بالتليجرام...');

            // التحقق من وجود التليجرام
            if (window.Telegram && window.Telegram.WebApp) {
                const tg = window.Telegram.WebApp;
                const user = tg.initDataUnsafe.user;

                if (user) {
                    await this.authenticateUser({
                        telegram_id: user.id,
                        username: user.username,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        language_code: user.language_code
                    });
                } else {
                    throw new Error('لا يمكن الحصول على بيانات المستخدم من التليجرام');
                }
            } else {
                // فتح البوت في التليجرام
                this.openTelegramBot();
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول عبر التليجرام:', error);
            this.showErrorMessage('فشل في تسجيل الدخول عبر التليجرام. يرجى المحاولة مرة أخرى.');
        }
    }

    // فتح البوت في التليجرام
    openTelegramBot() {
        const botUrl = `https://t.me/smartcoin_official_bot?start=login`;
        
        // محاولة فتح التليجرام
        window.open(botUrl, '_blank');
        
        // إظهار رسالة للمستخدم
        this.showInfoMessage(`
            <div class="telegram-instructions">
                <h3>📱 خطوات تسجيل الدخول:</h3>
                <ol>
                    <li>اضغط على الرابط أعلاه لفتح البوت</li>
                    <li>اضغط على زر "ابدأ" في البوت</li>
                    <li>ارجع إلى هذه الصفحة وانتظر قليلاً</li>
                </ol>
                <button onclick="authSystem.checkLoginStatus()" class="btn btn-primary">
                    🔄 تحقق من حالة تسجيل الدخول
                </button>
            </div>
        `);

        // بدء فحص دوري لحالة تسجيل الدخول
        this.startLoginPolling();
    }

    // بدء فحص دوري لحالة تسجيل الدخول
    startLoginPolling() {
        this.loginPollingInterval = setInterval(() => {
            this.checkLoginStatus();
        }, 3000); // فحص كل 3 ثواني
    }

    // إيقاف فحص حالة تسجيل الدخول
    stopLoginPolling() {
        if (this.loginPollingInterval) {
            clearInterval(this.loginPollingInterval);
            this.loginPollingInterval = null;
        }
    }

    // فحص حالة تسجيل الدخول
    async checkLoginStatus() {
        try {
            // محاولة الحصول على بيانات المستخدم من localStorage
            const pendingLogin = localStorage.getItem('smartcoin_pending_login');
            
            if (pendingLogin) {
                const loginData = JSON.parse(pendingLogin);
                await this.authenticateUser(loginData);
                localStorage.removeItem('smartcoin_pending_login');
            }
        } catch (error) {
            console.error('خطأ في فحص حالة تسجيل الدخول:', error);
        }
    }

    // مصادقة المستخدم مع الخادم
    async authenticateUser(userData) {
        try {
            this.showLoadingMessage('جاري تسجيل الدخول...');

            const response = await fetch(`${this.apiBaseUrl}/auth/telegram-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (response.ok && result.success) {
                // حفظ بيانات المصادقة
                localStorage.setItem('smartcoin_token', result.token);
                localStorage.setItem('smartcoin_user', JSON.stringify(result.user));
                
                this.currentUser = result.user;
                this.stopLoginPolling();
                
                this.showSuccessMessage('تم تسجيل الدخول بنجاح! 🎉');
                
                // توجيه للصفحة الرئيسية بعد ثانيتين
                setTimeout(() => {
                    this.redirectToMain();
                }, 2000);

            } else {
                throw new Error(result.message || 'فشل في تسجيل الدخول');
            }
        } catch (error) {
            console.error('خطأ في مصادقة المستخدم:', error);
            this.showErrorMessage('فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.');
        }
    }

    // تسجيل الخروج
    async logout() {
        try {
            const token = localStorage.getItem('smartcoin_token');
            
            if (token) {
                // إرسال طلب تسجيل الخروج للخادم
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
        } finally {
            // مسح البيانات المحلية
            this.clearAuthData();
            this.redirectToLogin();
        }
    }

    // مسح بيانات المصادقة
    clearAuthData() {
        localStorage.removeItem('smartcoin_token');
        localStorage.removeItem('smartcoin_user');
        localStorage.removeItem('smartcoin_pending_login');
        this.currentUser = null;
        this.stopLoginPolling();
    }

    // تحديث بيانات المستخدم
    updateUserData(userData) {
        localStorage.setItem('smartcoin_user', JSON.stringify(userData));
        this.currentUser = userData;
        
        // تحديث عناصر الواجهة
        this.updateUIElements();
    }

    // تحديث عناصر الواجهة
    updateUIElements() {
        if (!this.currentUser) return;

        // تحديث اسم المستخدم
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = this.currentUser.firstName || this.currentUser.username || 'مستخدم';
        });

        // تحديث الرصيد
        const balanceElements = document.querySelectorAll('.user-balance, #sm-balance');
        balanceElements.forEach(element => {
            element.textContent = this.currentUser.totalCoins || 0;
        });

        // تحديث المستوى
        const levelElements = document.querySelectorAll('.user-level');
        levelElements.forEach(element => {
            element.textContent = this.currentUser.level || 1;
        });
    }

    // السماح بالوصول للصفحة
    allowAccess() {
        // إخفاء شاشة التحميل إن وجدت
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }

        // إظهار المحتوى الرئيسي
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.style.display = 'block';
        }

        // تحديث عناصر الواجهة
        this.updateUIElements();
    }

    // التوجيه لصفحة تسجيل الدخول
    redirectToLogin() {
        const currentPage = window.location.pathname;
        const loginPages = ['/login.html', '/login-enhanced.html', '/index.html'];
        
        // إذا لم يكن في صفحة تسجيل الدخول، توجيه إليها
        if (!loginPages.some(page => currentPage.includes(page))) {
            window.location.href = 'login-enhanced.html';
        }
    }

    // التوجيه للصفحة الرئيسية
    redirectToMain() {
        window.location.href = 'earn.html'; // الصفحة الرئيسية بعد تسجيل الدخول
    }

    // التحقق من تسجيل الدخول
    isLoggedIn() {
        return this.currentUser !== null && localStorage.getItem('smartcoin_token') !== null;
    }

    // الحصول على المستخدم الحالي
    getCurrentUser() {
        return this.currentUser;
    }

    // الحصول على التوكن
    getToken() {
        return localStorage.getItem('smartcoin_token');
    }

    // إظهار رسالة تحميل
    showLoadingMessage(message) {
        this.showMessage(message, 'loading');
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
        // إنشاء عنصر الرسالة
        const messageElement = document.createElement('div');
        messageElement.className = `auth-message auth-message-${type}`;
        messageElement.innerHTML = `
            <div class="auth-message-content">
                <div class="auth-message-icon">
                    ${this.getMessageIcon(type)}
                </div>
                <div class="auth-message-text">
                    ${message}
                </div>
                ${type !== 'loading' ? '<button class="auth-message-close" onclick="this.parentElement.parentElement.remove()">×</button>' : ''}
            </div>
        `;

        // إضافة الرسالة للصفحة
        document.body.appendChild(messageElement);

        // إزالة الرسالة تلقائياً بعد 5 ثواني (إلا رسائل التحميل)
        if (type !== 'loading') {
            setTimeout(() => {
                if (messageElement.parentElement) {
                    messageElement.remove();
                }
            }, 5000);
        }

        return messageElement;
    }

    // الحصول على أيقونة الرسالة
    getMessageIcon(type) {
        const icons = {
            loading: '<i class="fas fa-spinner fa-spin"></i>',
            success: '<i class="fas fa-check-circle"></i>',
            error: '<i class="fas fa-exclamation-circle"></i>',
            info: '<i class="fas fa-info-circle"></i>'
        };
        return icons[type] || icons.info;
    }
}

// إنشاء مثيل نظام المصادقة
const authSystem = new AuthSystem();

// دالة للتحقق من المصادقة في الصفحات المحمية
function requireAuth() {
    if (!authSystem.isLoggedIn()) {
        authSystem.redirectToLogin();
        return false;
    }
    return true;
}

// دالة لحماية الصفحة
function protectPage() {
    // إخفاء المحتوى أولاً
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
        mainContent.style.display = 'none';
    }

    // إظهار شاشة تحميل
    const loadingScreen = document.createElement('div');
    loadingScreen.id = 'loading-screen';
    loadingScreen.innerHTML = `
        <div class="loading-content">
            <div class="loading-spinner">
                <i class="fas fa-spinner fa-spin"></i>
            </div>
            <div class="loading-text">جاري التحقق من تسجيل الدخول...</div>
        </div>
    `;
    document.body.appendChild(loadingScreen);

    // التحقق من المصادقة
    if (!requireAuth()) {
        return false;
    }

    return true;
}

// تشغيل حماية الصفحة عند تحميل DOM
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    const publicPages = ['/login.html', '/login-enhanced.html', '/index.html'];
    
    // إذا لم تكن صفحة عامة، تطبيق الحماية
    if (!publicPages.some(page => currentPage.includes(page))) {
        protectPage();
    }
});

