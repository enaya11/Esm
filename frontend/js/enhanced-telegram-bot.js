class TelegramBotHandler {
  constructor() {
    // توكن البوت الفعلي
    this.botToken = '7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ';
    this.botUsername = 'SMARTCOINAPPbot';
    this.apiUrl = `https://api.telegram.org/bot${this.botToken}`;

    // معلومات المستخدم
    this.currentUser = null;
    this.isInitialized = false;

    // إعدادات الإشعارات
    this.notificationsEnabled = true;
    this.lastNotificationTime = 0;
    this.notificationCooldown = 60000; // دقيقة واحدة
  }

  // تهيئة البوت
  async initialize() {
    console.log('تهيئة بوت تليجرام...');

    try {
      // التحقق من صحة التوكن
      const botInfo = await this.getBotInfo();

      if (botInfo.ok) {
        console.log(`تم تهيئة البوت بنجاح: @${botInfo.result.username}`);
        this.isInitialized = true;

        // تحميل معلومات المستخدم من localStorage
        this.loadUserData();

        // إعداد Telegram Web App إذا كان متاحاً
        this.initializeTelegramWebApp();

        return true;
      } else {
        throw new Error('فشل في التحقق من صحة توكن البوت');
      }
    } catch (error) {
      console.error('خطأ في تهيئة بوت تليجرام:', error);
      return false;
    }
  }

  // الحصول على معلومات البوت
  async getBotInfo() {
    try {
      const response = await fetch(`${this.apiUrl}/getMe`);
      return await response.json();
    } catch (error) {
      console.error('خطأ في الحصول على معلومات البوت:', error);
      throw error;
    }
  }

  // تحميل بيانات المستخدم
  loadUserData() {
    const userData = localStorage.getItem('smartcoin_user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
        console.log('تم تحميل بيانات المستخدم:', this.currentUser);
      } catch (error) {
        console.error('خطأ في تحميل بيانات المستخدم:', error);
      }
    }
  }

  // تهيئة Telegram Web App
  initializeTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;

      // تهيئة Web App
      tg.ready();

      // الحصول على بيانات المستخدم من Telegram
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const telegramUser = tg.initDataUnsafe.user;
        this.handleTelegramUser(telegramUser);
      }

      // إعداد الأزرار الرئيسية
      this.setupMainButton(tg);

      // إعداد الأزرار الثانوية
      this.setupBackButton(tg);

      console.log('تم تهيئة Telegram Web App بنجاح');
    } else {
      console.log('Telegram Web App غير متاح');
    }
  }

  // معالجة بيانات المستخدم من تليجرام
  handleTelegramUser(telegramUser) {
    const userData = {
      id: `telegram_${telegramUser.id}`,
      telegramId: telegramUser.id,
      firstName: telegramUser.first_name,
      lastName: telegramUser.last_name || '',
      username: telegramUser.username || '',
      languageCode: telegramUser.language_code || 'ar',
      loginMethod: 'telegram',
      loginTime: Date.now(),
      isPremium: telegramUser.is_premium || false
    };

    // تخزين بيانات المستخدم
    this.currentUser = userData;
    localStorage.setItem('smartcoin_user', JSON.stringify(userData));
    localStorage.setItem('smartcoin_logged_in', 'true');

    console.log('تم تسجيل دخول المستخدم عبر تليجرام:', userData);

    // إرسال رسالة ترحيب
    this.sendWelcomeMessage();
  }

  // إعداد الزر الرئيسي
  setupMainButton(tg) {
    tg.MainButton.setText('بدء التعدين');
    tg.MainButton.color = '#FFD700';
    tg.MainButton.textColor = '#000000';

    tg.MainButton.onClick(() => {
      // الانتقال إلى صفحة التعدين
      window.location.href = 'earn.html';
    });

    tg.MainButton.show();
  }

  // إعداد زر الرجوع
  setupBackButton(tg) {
    tg.BackButton.onClick(() => {
      // العودة إلى الصفحة السابقة
      window.history.back();
    });
  }

  // إرسال رسالة ترحيب
  async sendWelcomeMessage() {
    if (!this.currentUser || !this.currentUser.telegramId) {
      return;
    }

    const welcomeMessage = `
🎉 مرحباً بك في SmartCoin!
أهلاً ${this.currentUser.firstName}! 🪙 لقد انضممت بنجاح إلى منصة SmartCoin للتعدين الذكي
💰 ابدأ التعدين الآن واحصل على عملات مجانية يومياً
🎁 ادعُ أصدقاءك واحصل على مكافآت إضافية
استمتع بتجربة التعدين! 🚀
    `;

    try {
      await this.sendMessage(this.currentUser.telegramId, welcomeMessage);
    } catch (error) {
      console.error('خطأ في إرسال رسالة الترحيب:', error);
    }
  }

  // إرسال رسالة إلى المستخدم
  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      };

      const response = await fetch(`${this.apiUrl}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.ok) {
        console.log('تم إرسال الرسالة بنجاح');
        return result.result;
      } else {
        throw new Error(result.description || 'فشل في إرسال الرسالة');
      }
    } catch (error) {
      console.error('خطأ في إرسال الرسالة:', error);
      throw error;
    }
  }

  // إرسال إشعار تعدين
  async sendMiningNotification(coinsEarned) {
    if (!this.canSendNotification()) {
      return;
    }

    const message = `
🎉 تهانينا!
💰 لقد حصلت على ${coinsEarned} عملة SmartCoin جديدة!
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
🚀 استمر في التعدين لكسب المزيد!
    `;

    try {
      if (this.currentUser && this.currentUser.telegramId) {
        await this.sendMessage(this.currentUser.telegramId, message);
        this.lastNotificationTime = Date.now();
      }
    } catch (error) {
      console.error('خطأ في إرسال إشعار التعدين:', error);
    }
  }

  // إرسال إشعار شراء باقة
  async sendPackagePurchaseNotification(packageName, price, currency) {
    if (!this.canSendNotification()) {
      return;
    }

    const message = `
✅ تم تفعيل الباقة بنجاح!
📦 الباقة: ${packageName}
💵 السعر: ${price} دولار (${currency})
⏰ تاريخ التفعيل: ${new Date().toLocaleString('ar-SA')}
🎯 ستحصل الآن على معدل تعدين محسّن!
    `;

    try {
      if (this.currentUser && this.currentUser.telegramId) {
        await this.sendMessage(this.currentUser.telegramId, message);
        this.lastNotificationTime = Date.now();
      }
    } catch (error) {
      console.error('خطأ في إرسال إشعار شراء الباقة:', error);
    }
  }

  // إرسال إشعار إحالة جديدة
  async sendReferralNotification(referredUserName) {
    if (!this.canSendNotification()) {
      return;
    }

    const message = `
🎊 إحالة جديدة!
👤 انضم ${referredUserName} إلى SmartCoin من خلال رابط الإحالة الخاص بك!
🎁 لقد حصلت على مكافأة إحالة
💰 استمر في دعوة الأصدقاء لكسب المزيد!
شكراً لك على نشر SmartCoin! 🙏
    `;

    try {
      if (this.currentUser && this.currentUser.telegramId) {
        await this.sendMessage(this.currentUser.telegramId, message);
        this.lastNotificationTime = Date.now();
      }
    } catch (error) {
      console.error('خطأ في إرسال إشعار الإحالة:', error);
    }
  }

  // إرسال إشعار مهمة مكتملة
  async sendTaskCompletionNotification(taskName, reward) {
    if (!this.canSendNotification()) {
      return;
    }

    const message = `
✅ مهمة مكتملة!
📋 المهمة: ${taskName}
🎁 المكافأة: ${reward} عملة SmartCoin
⏰ الوقت: ${new Date().toLocaleString('ar-SA')}
🎯 تحقق من المهام الأخرى لكسب المزيد!
    `;

    try {
      if (this.currentUser && this.currentUser.telegramId) {
        await this.sendMessage(this.currentUser.telegramId, message);
        this.lastNotificationTime = Date.now();
      }
    } catch (error) {
      console.error('خطأ في إرسال إشعار إكمال المهمة:', error);
    }
  }

  // التحقق من إمكانية إرسال الإشعارات
  canSendNotification() {
    if (!this.notificationsEnabled) {
      return false;
    }

    const now = Date.now();
    return (now - this.lastNotificationTime) >= this.notificationCooldown;
  }

  // تفعيل/إلغاء تفعيل الإشعارات
  toggleNotifications(enabled) {
    this.notificationsEnabled = enabled;
    localStorage.setItem('telegram_notifications_enabled', enabled.toString());

    console.log(`تم ${enabled ? 'تفعيل' : 'إلغاء تفعيل'} إشعارات تليجرام`);
  }

  // إنشاء رابط إحالة
  generateReferralLink() {
    if (!this.currentUser) {
      return null;
    }

    const referralCode = this.currentUser.id || this.currentUser.telegramId;
    return `https://t.me/${this.botUsername}?start=${referralCode}`;
  }

  // مشاركة رابط الإحالة
  async shareReferralLink() {
    const referralLink = this.generateReferralLink();

    if (!referralLink) {
      console.error('لا يمكن إنشاء رابط الإحالة');
      return;
    }

    const shareText = `
🚀 انضم إلى SmartCoin واحصل على عملات رقمية مجانية!
💰 تعدين سهل ومجاني
🎁 مكافآت يومية
🌟 نظام إحالات مربح
ابدأ الآن: ${referralLink}
    `;

    // استخدام Telegram Web App للمشاركة إذا كان متاحاً
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;

      if (tg.openTelegramLink) {
        const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
        tg.openTelegramLink(shareUrl);
      } else {
        // نسخ الرابط إلى الحافظة
        this.copyToClipboard(shareText);
      }
    } else {
      // نسخ الرابط إلى الحافظة
      this.copyToClipboard(shareText);
    }
  }

  // نسخ النص إلى الحافظة
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);

      // عرض إشعار نجاح
      if (window.SmartCoinPayment && window.SmartCoinPayment.showNotification) {
        window.SmartCoinPayment.showNotification('تم نسخ رابط الإحالة إلى الحافظة!', 'success');
      } else {
        alert('تم نسخ رابط الإحالة إلى الحافظة!');
      }
    } catch (error) {
      console.error('خطأ في نسخ النص:', error);

      // طريقة بديلة للنسخ
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);

      alert('تم نسخ رابط الإحالة!');
    }
  }

  // الحصول على معلومات المستخدم الحالي
  getCurrentUser() {
    return this.currentUser;
  }

  // تسجيل خروج المستخدم
  logout() {
    this.currentUser = null;
    localStorage.removeItem('smartcoin_user');
    localStorage.removeItem('smartcoin_logged_in');

    console.log('تم تسجيل خروج المستخدم');

    // إعادة توجيه إلى صفحة تسجيل الدخول
    window.location.href = 'login-enhanced.html';
  }

  // التحقق من حالة تسجيل الدخول
  isLoggedIn() {
    return this.currentUser !== null && localStorage.getItem('smartcoin_logged_in') === 'true';
  }

  // إرسال تقرير يومي
  async sendDailyReport(stats) {
    if (!this.canSendNotification()) {
      return;
    }

    const message = `
📊 تقريرك اليومي - SmartCoin
💰 العملات المكتسبة اليوم: ${stats.coinsEarned || 0}
📈 إجمالي العملات: ${stats.totalCoins || 0}
👥 عدد الإحالات: ${stats.referrals || 0}
✅ المهام المكتملة: ${stats.completedTasks || 0}
🎯 استمر في التعدين لكسب المزيد غداً!
    `;

    try {
      if (this.currentUser && this.currentUser.telegramId) {
        await this.sendMessage(this.currentUser.telegramId, message);
        this.lastNotificationTime = Date.now();
      }
    } catch (error) {
      console.error('خطأ في إرسال التقرير اليومي:', error);
    }
  }
}

// إنشاء مثيل واحد من معالج البوت
const telegramBotHandler = new TelegramBotHandler();

// تهيئة البوت عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  telegramBotHandler.initialize()
    .then(success => {
      if (success) {
        console.log('تم تهيئة بوت تليجرام بنجاح');
      } else {
        console.log('فشل في تهيئة بوت تليجرام');
      }
    })
    .catch(error => {
      console.error('خطأ في تهيئة بوت تليجرام:', error);
    });
});

// تصدير المعالج للاستخدام العام
window.TelegramBotHandler = telegramBotHandler;