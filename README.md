# 🚀 SmartCoin - منصة التداول اللامركزية الأقوى في العالم

## 💰 بدعم رأس مال 350 مليون دولار

SmartCoin هي أقوى منصة تداول لامركزية للعملات الرقمية عالمياً، مدعومة برأس مال ضخم يبلغ 350 مليون دولار. نحن نبني مستقبل التداول اللامركزي حيث ستصبح عملة SmartCoin وسيلة الدفع الأساسية في النظام البيئي الجديد.

## 🌟 الميزات الرئيسية

### 🎯 **الفرونت اند المحسن**
- ✨ تصميم خرافي مع حركات وأتوميشن متقدمة
- 🔐 تسجيل دخول فعال عبر Telegram
- 📱 تصميم متجاوب لجميع الأجهزة
- 🎨 تأثيرات بصرية مذهلة (Glow, Floating, Typewriter)
- 💫 حركات CSS متقدمة وتفاعلية

### 🛡️ **الباك اند القوي (NestJS)**
- 🔒 نظام مصادقة متقدم مع Telegram + JWT
- 🗄️ قاعدة بيانات PostgreSQL مع TypeORM
- 🛡️ حماية متقدمة (Helmet, Rate Limiting, CORS)
- 📚 توثيق API تلقائي مع Swagger
- 🔗 تكامل مع شبكات TON و Solana
- 👥 نظام إحالات متطور مع مكافآت

### 💳 **نظام الدفع المتقدم**
- 🪙 دعم عملات TON و Solana
- ✅ التحقق الفوري من المعاملات
- 🔐 عناوين محافظ فعلية وآمنة
- 📊 تتبع المدفوعات في الوقت الفعلي

## 🏗️ هيكل المشروع

```
smartcoin_final/
├── frontend/           # الواجهة الأمامية المحسنة
│   ├── index.html     # الصفحة الرئيسية
│   ├── login-enhanced.html  # صفحة تسجيل الدخول المحسنة
│   ├── css/
│   │   └── enhanced-style.css  # التصميم المحسن
│   └── js/
│       ├── enhanced-animations.js     # الحركات المتقدمة
│       ├── enhanced-telegram-bot.js   # تكامل Telegram محسن
│       └── enhanced-store-payment.js  # نظام الدفع المحسن
├── backend/           # الباك اند (NestJS)
│   ├── src/
│   │   ├── entities/  # كيانات قاعدة البيانات
│   │   ├── modules/   # وحدات التطبيق
│   │   └── config/    # إعدادات التطبيق
│   ├── .env          # متغيرات البيئة
│   └── package.json  # تبعيات المشروع
└── README.md         # هذا الملف
```

## 🚀 التشغيل السريع

### 1. تشغيل الباك اند

```bash
cd backend
npm install
npm run start:dev
```

الباك اند سيعمل على: `http://localhost:3000`
توثيق API: `http://localhost:3000/api/docs`

### 2. تشغيل الفرونت اند

```bash
cd frontend
# افتح index.html في المتصفح أو استخدم خادم محلي
python3 -m http.server 8000
```

الفرونت اند سيعمل على: `http://localhost:8000`

## 🔧 الإعدادات

### متغيرات البيئة (.env)

```env
# قاعدة البيانات
DATABASE_URL=postgresql://postgres.aqunpkwwvslnmuqvotyl:enayabasmaji12@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# Telegram Bot
TELEGRAM_BOT_TOKEN=7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ

# APIs
TON_API_KEY=32e3df1bb58960b9f1da65807c36836f71b71f93363450e2624fecd31bc57c3e
SOLANA_RPC_URL=https://indulgent-thrumming-sky.solana-mainnet.quiknode.pro/011e3efccc9ddf2f45fe73987cf6e21ba163d077/

# عناوين المحافظ الفعلية
TON_WALLET_ADDRESS=UQAmI5QQbc7HbxSbUHUkh5_7vltnn_bWb3qmS3pz7S1YPgbV
SOLANA_WALLET_ADDRESS=6SeS6QVwkEuBvW8ibCMcenY9c522q9W4PV95xbRhFEZv
```

## 💎 الميزات المتقدمة

### 🎨 التصميم والحركات
- **تأثير الكتابة (Typewriter)**: للعناوين الرئيسية
- **تأثير التوهج (Glow)**: للعناصر المهمة
- **الحركة العائمة (Floating)**: للشعارات والأيقونات
- **تأثير اللمعان (Shine)**: للأزرار التفاعلية
- **الظهور التدريجي (Fade-in)**: للمحتوى عند التمرير

### 🔐 الأمان
- **JWT Authentication**: مصادقة آمنة ومشفرة
- **Rate Limiting**: حماية من الهجمات
- **CORS Protection**: حماية من الطلبات الضارة
- **Helmet Security**: حماية إضافية للرؤوس
- **Input Validation**: التحقق من صحة البيانات

### 📊 التحليلات
- **تتبع الأنشطة**: سجل شامل لجميع أنشطة المستخدمين
- **إحصائيات الإحالات**: تتبع دقيق للإحالات والمكافآت
- **تحليل المدفوعات**: مراقبة المعاملات في الوقت الفعلي

## 🌐 النشر

### خيارات النشر المقترحة:

1. **Vercel** (للفرونت اند)
2. **Railway** أو **Render** (للباك اند)
3. **Supabase** (قاعدة البيانات - مُعدة بالفعل)

### خطوات النشر:

1. **نشر الباك اند:**
   ```bash
   # رفع الكود إلى GitHub
   git init
   git add .
   git commit -m "SmartCoin Backend"
   
   # ربط بـ Railway أو Render
   # إضافة متغيرات البيئة
   ```

2. **نشر الفرونت اند:**
   ```bash
   # رفع مجلد frontend إلى Vercel
   # أو استخدام GitHub Pages
   ```

## 📱 التكامل مع Telegram

### إعداد البوت:
1. إنشاء بوت جديد عبر @BotFather
2. الحصول على التوكن
3. إعداد Webhook (اختياري)
4. تفعيل Web App

### الميزات المدعومة:
- ✅ تسجيل الدخول التلقائي
- ✅ الإشعارات الفورية
- ✅ مشاركة روابط الإحالة
- ✅ التقارير اليومية

## 💰 نظام المكافآت

### باقات التعدين:
1. **باقة أساسية**: 20 عملة/يوم - 1$ (TON/SOL)
2. **باقة متوسطة**: 35 عملة/يوم - 2$ (TON/SOL)
3. **باقة متقدمة**: 50 عملة/يوم - 5$ (TON/SOL)

### نظام الإحالات:
- **المستوى الأول**: 10% من أرباح المُحال إليه
- **المستوى الثاني**: 5% من أرباح المُحال إليه
- **المستوى الثالث**: 2% من أرباح المُحال إليه

## 🛠️ التطوير

### متطلبات النظام:
- Node.js 18+
- PostgreSQL 13+
- Redis (اختياري للتخزين المؤقت)

### أوامر مفيدة:
```bash
# تطوير الباك اند
npm run start:dev

# بناء للإنتاج
npm run build

# تشغيل الاختبارات
npm run test

# إنشاء migration جديد
npm run migration:generate

# تشغيل migrations
npm run migration:run
```

## 📞 الدعم

للحصول على الدعم أو الاستفسارات:
- 📧 البريد الإلكتروني: support@smartcoin.app
- 💬 Telegram: @SmartCoinSupport
- 🌐 الموقع: https://smartcoin.app

## 📄 الترخيص

هذا المشروع محمي بحقوق الطبع والنشر © 2024 SmartCoin. جميع الحقوق محفوظة.

---

**🚀 انضم إلى ثورة التداول اللامركزي مع SmartCoin!**

*بدعم رأس مال 350 مليون دولار، نحن نبني مستقبل التمويل الرقمي.*

