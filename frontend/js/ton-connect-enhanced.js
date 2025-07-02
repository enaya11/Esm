// TON Connect SDK محسن لمشروع SmartCoin
// يدعم تسجيل الدخول عبر محفظة TON بشكل كامل

class TONWalletHandler {
  constructor() {
    this.isConnected = false;
    this.walletAddress = null;
    this.publicKey = null;
    this.connectionTimeout = 5 * 60 * 1000; // 5 دقائق بالمللي ثانية
    this.tonConnector = null;
    this.apiBaseUrl = "https://api.smartcoin-app.com";
    this.manifestUrl = "https://smartcoin-app.com/tonconnect-manifest.json";
    this.connectCallbacks = [];
    this.disconnectCallbacks = [];
    this.connectionErrorCallbacks = [];
  }

  // تهيئة معالج محفظة TON
  async initialize() {
    console.log("تهيئة معالج محفظة TON...");

    try {
      // التحقق من وجود مكتبة TonConnect
      if (typeof TonConnectSDK === 'undefined') {
        await this.loadTonConnectSDK();
      }

      // إنشاء اتصال TON Connect
      this.tonConnector = new TonConnectSDK.TonConnect({
        manifestUrl: this.manifestUrl
      });

      // استعادة الاتصال السابق إن وجد
      await this.tonConnector.restoreConnection();

      // الاستماع لتغييرات الحالة
      this.tonConnector.onStatusChange(wallet => {
        if (wallet) {
          this.isConnected = true;
          this.walletAddress = wallet.account.address;
          this.publicKey = wallet.account.publicKey;
          console.log(`تم الاتصال بمحفظة TON: ${this.walletAddress}`);
          
          // تحديث واجهة المستخدم وإرسال بيانات المستخدم إلى الخادم
          this.handleSuccessfulConnection(wallet);
          
          // استدعاء دوال رد النداء للاتصال
          this.connectCallbacks.forEach(callback => callback(wallet));
        } else {
          this.isConnected = false;
          this.walletAddress = null;
          this.publicKey = null;
          console.log("تم قطع الاتصال بمحفظة TON");
          
          // استدعاء دوال رد النداء لقطع الاتصال
          this.disconnectCallbacks.forEach(callback => callback());
        }
      });

      // إعداد مستمعي الأحداث
      this.setupEventListeners();

      console.log("تم تهيئة معالج محفظة TON بنجاح");
      return true;
    } catch (error) {
      console.error("خطأ في تهيئة معالج محفظة TON:", error);
      return false;
    }
  }

  // تحميل مكتبة TON Connect SDK
  async loadTonConnectSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@tonconnect/sdk@latest/dist/tonconnect-sdk.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('فشل في تحميل مكتبة TON Connect SDK'));
      document.head.appendChild(script);
    });
  }

  // إعداد مستمعي الأحداث
  setupEventListeners() {
    console.log("إعداد مستمعي أحداث محفظة TON...");

    // الاستماع لنقر زر تسجيل الدخول عبر TON
    const tonLoginBtn = document.getElementById("ton-login-btn");
    if (tonLoginBtn) {
      tonLoginBtn.addEventListener("click", this.connectWallet.bind(this));
    }
  }

  // الاتصال بمحفظة TON
  async connectWallet() {
    console.log("جاري الاتصال بمحفظة TON...");

    try {
      if (!this.tonConnector) {
        await this.initialize();
      }

      // الحصول على قائمة المحافظ المدعومة
      const walletsList = await this.tonConnector.getWallets();
      console.log("المحافظ المدعومة:", walletsList);

      // إظهار معلومات للمستخدم
      this.showInfo("يرجى تأكيد الاتصال في محفظة TON الخاصة بك...");

      // إنشاء رابط الاتصال
      const universalLink = this.tonConnector.connect({
        universalLink: walletsList[0]?.universalLink,
        bridgeUrl: walletsList[0]?.bridgeUrl
      });

      // فتح رابط الاتصال
      if (universalLink) {
        window.open(universalLink, '_blank');
      }

      return true;
    } catch (error) {
      console.error("خطأ في الاتصال بمحفظة TON:", error);
      this.showError("حدث خطأ أثناء الاتصال بمحفظة TON. يرجى المحاولة مرة أخرى");
      
      // استدعاء دوال رد النداء للخطأ
      this.connectionErrorCallbacks.forEach(callback => callback(error));
      
      return false;
    }
  }

  // طلب توقيع للمصادقة
  async requestSignature(message) {
    console.log("طلب توقيع للمصادقة...");

    try {
      if (!this.isConnected || !this.walletAddress) {
        throw new Error("المحفظة غير متصلة");
      }

      this.showInfo("يرجى توقيع الرسالة في محفظتك للمصادقة...");

      // إنشاء طلب توقيع
      const payload = {
        timestamp: Date.now().toString(),
        domain: window.location.hostname,
        sessionId: this.generateSessionId()
      };

      // طلب توقيع من المحفظة
      const result = await this.tonConnector.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 300, // 5 دقائق
        messages: [
          {
            address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c", // عنوان وهمي للتوقيع فقط
            amount: "0",
            payload: btoa(JSON.stringify(payload)) // تشفير البيانات بـ base64
          }
        ]
      });

      // بعد الحصول على التوقيع، يجب إرساله إلى الخادم للتحقق
      const verificationResult = await this.verifySignature(result, payload);

      return verificationResult;
    } catch (error) {
      console.error("خطأ في طلب التوقيع:", error);
      this.showError("حدث خطأ أثناء طلب التوقيع. يرجى المحاولة مرة أخرى");
      return false;
    }
  }

  // التحقق من التوقيع على الخادم
  async verifySignature(signatureResult, payload) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/verify-ton-signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: this.walletAddress,
          publicKey: this.publicKey,
          signature: signatureResult.signature,
          payload: payload
        })
      });

      const result = await response.json();

      if (result.success) {
        this.handleSuccessfulLogin(result);
        return true;
      } else {
        this.showError('فشل التحقق من التوقيع. يرجى المحاولة مرة أخرى');
        return false;
      }
    } catch (error) {
      console.error("خطأ في التحقق من التوقيع:", error);
      this.showError("حدث خطأ أثناء التحقق من التوقيع");
      return false;
    }
  }

  // معالجة الاتصال الناجح
  async handleSuccessfulConnection(wallet) {
    console.log("معالجة الاتصال الناجح بالمحفظة:", wallet);

    try {
      // إرسال بيانات المحفظة إلى الخادم
      const response = await fetch(`${this.apiBaseUrl}/auth/ton-connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          walletAddress: wallet.account.address,
          publicKey: wallet.account.publicKey,
          timestamp: Date.now()
        })
      });

      const result = await response.json();

      if (result.success) {
        // تحديث واجهة المستخدم
        this.updateUserInterface(result.user);
      }
    } catch (error) {
      console.error("خطأ في معالجة الاتصال الناجح:", error);
    }
  }

  // معالجة تسجيل الدخول الناجح
  handleSuccessfulLogin(result) {
    console.log(`تم تسجيل الدخول بنجاح باستخدام المحفظة: ${this.walletAddress}`);

    // تخزين جلسة المستخدم
    localStorage.setItem("smartcoin_wallet", this.walletAddress);
    localStorage.setItem("smartcoin_login_time", Date.now().toString());
    localStorage.setItem("smartcoin_auth_token", result.token);
    localStorage.setItem("smartcoin_user", JSON.stringify(result.user));

    // تحديث واجهة المستخدم
    this.updateUserInterface(result.user);

    // إعادة توجيه إلى لوحة التحكم
    window.location.href = "index.html";
  }

  // تحديث واجهة المستخدم
  updateUserInterface(user) {
    // تحديث عناصر اسم المستخدم
    const userNameElements = document.querySelectorAll('.user-name, #user-name');
    userNameElements.forEach(element => {
      element.textContent = user?.name || this.walletAddress?.slice(0, 8) + '...' || 'مستخدم';
    });

    // تحديث عناصر عنوان المحفظة
    const walletAddressElements = document.querySelectorAll('.wallet-address, #wallet-address');
    walletAddressElements.forEach(element => {
      element.textContent = this.walletAddress || '';
    });

    // تحديث عناصر الرصيد
    const balanceElements = document.querySelectorAll('.user-balance, #user-balance, .balance');
    balanceElements.forEach(element => {
      element.textContent = user?.balance || 0;
    });

    // إظهار أزرار تسجيل الخروج
    const logoutButtons = document.querySelectorAll('.logout-btn');
    logoutButtons.forEach(button => {
      button.style.display = 'block';
    });

    // إخفاء أزرار تسجيل الدخول
    const loginButtons = document.querySelectorAll('.login-btn');
    loginButtons.forEach(button => {
      button.style.display = 'none';
    });
  }

  // قطع الاتصال بمحفظة TON
  async disconnectWallet() {
    console.log("قطع الاتصال بمحفظة TON...");

    try {
      if (this.tonConnector) {
        await this.tonConnector.disconnect();
      }

      this.isConnected = false;
      this.walletAddress = null;
      this.publicKey = null;

      // مسح بيانات الجلسة
      localStorage.removeItem("smartcoin_wallet");
      localStorage.removeItem("smartcoin_login_time");
      localStorage.removeItem("smartcoin_auth_token");
      localStorage.removeItem("smartcoin_user");

      console.log("تم قطع الاتصال بمحفظة TON");

      return true;
    } catch (error) {
      console.error("خطأ في قطع الاتصال بمحفظة TON:", error);
      return false;
    }
  }

  // التحقق من اتصال المحفظة
  isWalletConnected() {
    return this.isConnected && this.walletAddress !== null;
  }

  // الحصول على عنوان المحفظة
  getWalletAddress() {
    return this.walletAddress;
  }

  // الحصول على المفتاح العام
  getPublicKey() {
    return this.publicKey;
  }

  // إظهار رسالة خطأ
  showError(message) {
    alert(message);
  }

  // إظهار رسالة معلومات
  showInfo(message) {
    alert(message);
  }

  // إضافة مستمع للاتصال
  addConnectListener(callback) {
    this.connectCallbacks.push(callback);
  }

  // إضافة مستمع لقطع الاتصال
  addDisconnectListener(callback) {
    this.disconnectCallbacks.push(callback);
  }

  // إضافة مستمع لخطأ الاتصال
  addConnectionErrorListener(callback) {
    this.connectionErrorCallbacks.push(callback);
  }

  // إنشاء معرف جلسة
  generateSessionId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// إنشاء مثيل عام
const tonWalletHandler = new TONWalletHandler();
document.addEventListener("DOMContentLoaded", () => {
  tonWalletHandler.initialize();
});

// تصدير للاستخدام في ملفات أخرى
if (typeof window !== 'undefined') {
  window.tonWalletHandler = tonWalletHandler;
}

// دالة للتحقق من حماية الصفحة
function checkTONPageProtection() {
  const protectedPages = ['earn-enhanced.html', 'tasks-enhanced.html', 'referrals-enhanced.html', 'wheel-enhanced.html', 'profile-enhanced.html'];
  const currentPage = window.location.pathname.split('/').pop();
  
  if (protectedPages.includes(currentPage) && !tonWalletHandler.isWalletConnected()) {
    console.log('🔒 صفحة محمية - إعادة توجيه لتسجيل الدخول');
    window.location.href = 'login-enhanced.html';
    return false;
  }
  
  return true;
}

// فحص الحماية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  checkTONPageProtection();
});

// تصدير للاستخدام في Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TONWalletHandler;
}

