# بوت SmartCoin التليجرام

## نظرة عامة

بوت التليجرام الرسمي لمنصة SmartCoin يوفر واجهة تفاعلية للمستخدمين للوصول إلى جميع ميزات المنصة مباشرة من التليجرام.

## الميزات

### 🔐 المصادقة والتسجيل
- تسجيل دخول تلقائي عبر التليجرام
- إدارة جلسات المستخدمين
- تسجيل خروج آمن

### 📱 الواجهة التفاعلية
- أزرار تفاعلية للوصول السريع
- قوائم إعدادات شخصية
- عرض الإحصائيات والبيانات

### 🔔 نظام الإشعارات المتقدم
- إشعارات التعدين
- إشعارات الإحالات
- إشعارات إكمال المهام
- تحكم في تكرار الإشعارات (Throttling)
- ساعات الهدوء
- حدود يومية للإشعارات

### 🗄️ إدارة البيانات
- قاعدة بيانات SQLite محلية
- تخزين بيانات المستخدمين
- إدارة رموز الجلسات

## بنية الملفات

```
backend/bot/
├── telegramBot.py          # الملف الرئيسي للبوت
├── bot_config.py           # إعدادات البوت
├── notification_service.py # خدمة الإشعارات
├── requirements.txt        # متطلبات Python
├── README.md              # هذا الملف
└── bot_users.db           # قاعدة البيانات (يتم إنشاؤها تلقائياً)
```

## التثبيت والتشغيل

### 1. تثبيت المتطلبات

```bash
cd backend/bot
pip install -r requirements.txt
```

### 2. إعداد البوت

تأكد من أن إعدادات البوت في `bot_config.py` صحيحة:

```python
BOT_TOKEN = "7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA"
WEBAPP_URL = "https://your-domain.com"  # رابط التطبيق
API_BASE_URL = "http://localhost:3000/api"  # رابط API
```

### 3. تشغيل البوت

```bash
python telegramBot.py
```

أو للتشغيل في الخلفية:

```bash
nohup python telegramBot.py &
```

## الأوامر المتاحة

### أوامر المستخدمين
- `/start` - بدء استخدام البوت والتسجيل
- `/login` - تسجيل الدخول
- `/logout` - تسجيل الخروج
- `/stats` - عرض الإحصائيات الشخصية
- `/help` - عرض المساعدة

### الأزرار التفاعلية
- **🚀 فتح SmartCoin** - فتح التطبيق في المتصفح
- **📊 إحصائياتي** - عرض الإحصائيات
- **⚙️ الإعدادات** - قائمة الإعدادات

## API التكامل

### تسجيل الدخول
```
POST /api/auth/telegram-login
{
  "telegram_id": 123456789,
  "username": "user123",
  "first_name": "أحمد",
  "last_name": "محمد",
  "language_code": "ar"
}
```

### الحصول على الإحصائيات
```
GET /api/users/{telegram_id}/stats
```

## نظام الإشعارات

### إعدادات التحكم
- **Throttling**: منع الإرسال أكثر من مرة كل 5 دقائق لنفس النوع
- **حدود يومية**: حد أقصى 10 إشعارات يومياً لكل مستخدم
- **ساعات الهدوء**: من 10 مساءً إلى 8 صباحاً

### أنواع الإشعارات
1. **إشعارات التعدين**: عند إكمال عملية التعدين
2. **إشعارات الإحالات**: عند انضمام مستخدم جديد عبر الإحالة
3. **إشعارات المهام**: عند إكمال مهمة

### استخدام خدمة الإشعارات

```python
from notification_service import send_mining_notification

# إرسال إشعار التعدين
await send_mining_notification(telegram_id=123456789, amount=10.5)
```

## قاعدة البيانات

### جدول المستخدمين (users)
- `telegram_id` - معرف التليجرام (مفتاح أساسي)
- `username` - اسم المستخدم
- `first_name` - الاسم الأول
- `last_name` - الاسم الأخير
- `language_code` - رمز اللغة
- `is_registered` - حالة التسجيل
- `registration_date` - تاريخ التسجيل
- `last_activity` - آخر نشاط
- `notification_settings` - إعدادات الإشعارات (JSON)

### جدول الجلسات (user_sessions)
- `telegram_id` - معرف التليجرام
- `session_token` - رمز الجلسة
- `created_at` - تاريخ الإنشاء
- `expires_at` - تاريخ انتهاء الصلاحية

## الأمان

### حماية البيانات
- تشفير رموز الجلسات
- انتهاء صلاحية الجلسات بعد 30 يوم
- حدود معدل الطلبات (Rate Limiting)

### التحقق من الهوية
- التحقق من توكن التليجرام
- ربط الحسابات بمعرف التليجرام الفريد
- حماية من محاولات تسجيل الدخول المتكررة

## استكشاف الأخطاء

### مشاكل شائعة

1. **البوت لا يستجيب**
   - تحقق من صحة BOT_TOKEN
   - تأكد من أن البوت مفعل مع @BotFather

2. **فشل في الاتصال بـ API**
   - تحقق من API_BASE_URL
   - تأكد من تشغيل الخادم الخلفي

3. **مشاكل قاعدة البيانات**
   - تحقق من صلاحيات الكتابة في مجلد البوت
   - احذف ملف bot_users.db وأعد تشغيل البوت

### سجلات الأخطاء
يتم حفظ سجلات البوت في وحدة التحكم. لحفظها في ملف:

```bash
python telegramBot.py > bot.log 2>&1
```

## التطوير والتخصيص

### إضافة أوامر جديدة
```python
async def new_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await update.message.reply_text("أمر جديد!")

# إضافة المعالج
application.add_handler(CommandHandler("new", new_command))
```

### تخصيص الرسائل
عدّل الرسائل في `bot_config.py` في قسم `MESSAGES`.

### إضافة إشعارات جديدة
```python
async def send_custom_notification(self, telegram_id: int, custom_data: dict):
    message = f"إشعار مخصص: {custom_data['message']}"
    await self.send_notification(telegram_id, message, "custom")
```

## الدعم والمساهمة

للإبلاغ عن مشاكل أو اقتراح تحسينات، يرجى التواصل مع فريق التطوير.

## الترخيص

هذا المشروع مملوك لفريق SmartCoin ومحمي بحقوق الطبع والنشر.

