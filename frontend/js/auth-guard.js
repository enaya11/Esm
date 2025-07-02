// نظام حماية الصفحات - Auth Guard
class AuthGuard {
    constructor() {
        this.protectedPages = [
            'earn.html',
            'earn-enhanced.html', 
            'earn-ultra.html',
            'tasks.html',
            'referrals.html',
            'wallet.html',
            'wallet-enhanced.html',
            'store.html',
            'wheel.html'
        ];
        
        this.publicPages = [
            'index.html',
            'login.html',
            'login-enhanced.html',
            'login-ultra.html',
            'register-telegram.html',
            'verify.html'
        ];
        
        this.currentPage = this.getCurrentPageName();
        this.init();
    }

    init() {
        // التحقق من حالة المصادقة عند تحميل الصفحة
        this.checkPageAccess();
        
        // إضافة مستمع للتحقق الدوري
        this.startPeriodicCheck();
        
        // إضافة مستمع لتغيير الصفحة
        this.setupNavigationGuard();
    }

    // الحصول على اسم الصفحة الحالية
    getCurrentPageName() {
        const path = window.location.pathname;
        const pageName = path.split('/').pop() || 'index.html';
        return pageName;
    }

    // التحقق من إمكانية الوصول للصفحة
    checkPageAccess() {
        const isProtectedPage = this.protectedPages.includes(this.currentPage);
        
        if (isProtectedPage) {
            const isAuthenticated = this.isUserAuthenticated();
            
            if (!isAuthenticated) {
                this.redirectToAuth();
                return false;
            } else {
                // التحقق من صحة الرمز المميز
                this.validateToken();
            }
        }
        
        return true;
    }

    // التحقق من حالة المصادقة
    isUserAuthenticated() {
        const token = localStorage.getItem('smartcoin_token');
        const userData = localStorage.getItem('smartcoin_user');
        const loginTime = localStorage.getItem('smartcoin_login_time');
        
        if (!token || !userData || !loginTime) {
            return false;
        }
        
        // التحقق من انتهاء صلاحية الجلسة (24 ساعة)
        const currentTime = Date.now();
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 ساعة
        
        if (currentTime - parseInt(loginTime) > sessionDuration) {
            this.clearAuthData();
            return false;
        }
        
        return true;
    }

    // التحقق من صحة الرمز المميز
    async validateToken() {
        const token = localStorage.getItem('smartcoin_token');
        
        if (!token) {
            this.redirectToAuth();
            return false;
        }
        
        try {
            // محاكاة التحقق من الرمز المميز مع الخادم
            const isValid = await this.verifyTokenWithServer(token);
            
            if (!isValid) {
                this.clearAuthData();
                this.redirectToAuth();
                return false;
            }
            
            return true;
        } catch (error) {
            console.error('خطأ في التحقق من الرمز المميز:', error);
            // في حالة الخطأ، نسمح بالوصول لتجنب قطع الخدمة
            return true;
        }
    }

    // محاكاة التحقق من الرمز المميز مع الخادم
    async verifyTokenWithServer(token) {
        return new Promise((resolve) => {
            // محاكاة طلب API
            setTimeout(() => {
                // في التطبيق الحقيقي، هذا سيكون طلب HTTP للخادم
                const isValid = token && token.length > 10;
                resolve(isValid);
            }, 500);
        });
    }

    // توجيه المستخدم لصفحة المصادقة
    redirectToAuth() {
        // حفظ الصفحة المطلوبة للعودة إليها بعد تسجيل الدخول
        localStorage.setItem('smartcoin_redirect_after_login', this.currentPage);
        
        // إظهار رسالة تنبيه
        this.showAuthRequiredMessage();
        
        // التوجيه لصفحة التسجيل بعد ثانيتين
        setTimeout(() => {
            window.location.href = 'register-telegram.html';
        }, 2000);
    }

    // إظهار رسالة تطلب المصادقة
    showAuthRequiredMessage() {
        // إنشاء عنصر الرسالة
        const messageOverlay = document.createElement('div');
        messageOverlay.id = 'auth-required-overlay';
        messageOverlay.innerHTML = `
            <div class="auth-required-modal">
                <div class="auth-modal-content">
                    <div class="auth-modal-icon">
                        <i class="fas fa-lock"></i>
                    </div>
                    <h2 class="auth-modal-title">مطلوب تسجيل الدخول</h2>
                    <p class="auth-modal-message">
                        يجب تسجيل الدخول أو إنشاء حساب جديد للوصول إلى هذه الصفحة
                    </p>
                    <div class="auth-modal-buttons">
                        <button class="auth-btn auth-btn-primary" onclick="window.location.href='register-telegram.html'">
                            <i class="fab fa-telegram-plane"></i> تسجيل عبر تليجرام
                        </button>
                        <button class="auth-btn auth-btn-secondary" onclick="window.location.href='login-enhanced.html'">
                            <i class="fas fa-sign-in-alt"></i> تسجيل الدخول
                        </button>
                    </div>
                    <div class="auth-modal-timer">
                        سيتم التوجيه تلقائياً خلال <span id="auth-countdown">3</span> ثوان
                    </div>
                </div>
            </div>
        `;

        // إضافة الأنماط
        const styles = document.createElement('style');
        styles.textContent = `
            #auth-required-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                animation: fadeIn 0.3s ease-out;
            }

            .auth-required-modal {
                background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
                border: 2px solid #FFD700;
                border-radius: 20px;
                padding: 40px;
                max-width: 500px;
                width: 90%;
                text-align: center;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                animation: slideInUp 0.5s ease-out;
            }

            .auth-modal-icon {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, #FFD700, #FFA500);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 20px;
                font-size: 40px;
                color: #000;
                animation: pulse 2s infinite;
            }

            .auth-modal-title {
                color: #FFD700;
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 15px;
                text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
            }

            .auth-modal-message {
                color: #cccccc;
                font-size: 16px;
                line-height: 1.6;
                margin-bottom: 30px;
            }

            .auth-modal-buttons {
                display: flex;
                gap: 15px;
                justify-content: center;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }

            .auth-btn {
                padding: 15px 25px;
                border: none;
                border-radius: 10px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                gap: 8px;
                min-width: 150px;
                justify-content: center;
            }

            .auth-btn-primary {
                background: linear-gradient(135deg, #FFD700, #FFA500);
                color: #000;
            }

            .auth-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 25px rgba(255, 215, 0, 0.4);
            }

            .auth-btn-secondary {
                background: linear-gradient(135deg, #333, #555);
                color: #fff;
                border: 1px solid #FFD700;
            }

            .auth-btn-secondary:hover {
                background: linear-gradient(135deg, #555, #777);
                transform: translateY(-2px);
            }

            .auth-modal-timer {
                color: #999;
                font-size: 14px;
            }

            #auth-countdown {
                color: #FFD700;
                font-weight: bold;
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideInUp {
                from {
                    opacity: 0;
                    transform: translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.1); }
            }

            @media (max-width: 768px) {
                .auth-required-modal {
                    padding: 30px 20px;
                }

                .auth-modal-buttons {
                    flex-direction: column;
                    align-items: center;
                }

                .auth-btn {
                    width: 100%;
                    max-width: 250px;
                }
            }
        `;

        document.head.appendChild(styles);
        document.body.appendChild(messageOverlay);

        // بدء العد التنازلي
        this.startCountdown();
    }

    // بدء العد التنازلي
    startCountdown() {
        let countdown = 3;
        const countdownElement = document.getElementById('auth-countdown');
        
        const timer = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(timer);
            }
        }, 1000);
    }

    // مسح بيانات المصادقة
    clearAuthData() {
        localStorage.removeItem('smartcoin_token');
        localStorage.removeItem('smartcoin_user');
        localStorage.removeItem('smartcoin_login_time');
        localStorage.removeItem('smartcoin_user_data');
    }

    // بدء التحقق الدوري
    startPeriodicCheck() {
        // التحقق كل 5 دقائق
        setInterval(() => {
            if (this.protectedPages.includes(this.currentPage)) {
                if (!this.isUserAuthenticated()) {
                    this.redirectToAuth();
                }
            }
        }, 5 * 60 * 1000);
    }

    // إعداد حماية التنقل
    setupNavigationGuard() {
        // مراقبة تغيير الصفحة
        window.addEventListener('beforeunload', () => {
            // حفظ آخر وقت نشاط
            localStorage.setItem('smartcoin_last_activity', Date.now().toString());
        });

        // مراقبة النقرات على الروابط
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
                const targetPage = link.href.split('/').pop();
                
                if (this.protectedPages.includes(targetPage)) {
                    if (!this.isUserAuthenticated()) {
                        e.preventDefault();
                        this.redirectToAuth();
                    }
                }
            }
        });
    }

    // تسجيل الدخول بنجاح
    static onLoginSuccess(token, userData) {
        localStorage.setItem('smartcoin_token', token);
        localStorage.setItem('smartcoin_user', JSON.stringify(userData));
        localStorage.setItem('smartcoin_login_time', Date.now().toString());
        
        // التوجيه للصفحة المطلوبة أو الصفحة الرئيسية
        const redirectPage = localStorage.getItem('smartcoin_redirect_after_login') || 'earn-ultra.html';
        localStorage.removeItem('smartcoin_redirect_after_login');
        
        window.location.href = redirectPage;
    }

    // تسجيل الخروج
    static logout() {
        const authGuard = new AuthGuard();
        authGuard.clearAuthData();
        
        // إظهار رسالة تأكيد
        authGuard.showLogoutMessage();
        
        // التوجيه للصفحة الرئيسية
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    // إظهار رسالة تسجيل الخروج
    showLogoutMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideInRight 0.3s ease-out;
            font-weight: bold;
        `;
        message.innerHTML = '<i class="fas fa-check-circle"></i> تم تسجيل الخروج بنجاح';
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 3000);
    }

    // التحقق من حالة الجلسة عند العودة للتطبيق
    checkSessionOnFocus() {
        window.addEventListener('focus', () => {
            if (this.protectedPages.includes(this.currentPage)) {
                if (!this.isUserAuthenticated()) {
                    this.redirectToAuth();
                }
            }
        });
    }
}

// تشغيل نظام الحماية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    new AuthGuard();
});

// إضافة أنماط CSS للرسائل المنبثقة
const authStyles = document.createElement('style');
authStyles.textContent = `
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
`;
document.head.appendChild(authStyles);

// تصدير الكلاس للاستخدام في ملفات أخرى
window.AuthGuard = AuthGuard;

