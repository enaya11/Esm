# دليل تشغيل مشروع SmartCoin

## الخطوة 1: إعداد الواجهة الخلفية

### تثبيت Node.js والاعتماديات
```bash
# تثبيت Node.js (إذا لم يكن مثبتاً)
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# التحقق من التثبيت
node -v
npm -v

# الانتقال إلى مجلد الخلفية
cd backend

# تثبيت الاعتماديات
npm install
```

### إعداد قاعدة البيانات MongoDB
```bash
# تثبيت MongoDB (إذا لم يكن مثبتاً)
sudo apt-get install -y mongodb

# بدء تشغيل MongoDB
sudo systemctl start mongodb
sudo systemctl enable mongodb

# التحقق من حالة MongoDB
sudo systemctl status mongodb
```

### تعديل ملف الإعدادات
قم بإنشاء ملف `.env` في مجلد الخلفية بالمحتوى التالي:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/smartcoin
JWT_SECRET=your_jwt_secret_key
TELEGRAM_BOT_TOKEN=7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA
ENCRYPTION_KEY=your_encryption_key_for_wallet
```

### تشغيل الخلفية
```bash
# تشغيل الخلفية في وضع التطوير
npm run start:dev

# أو في وضع الإنتاج
npm run build
npm run start:prod
```

## الخطوة 2: إعداد بوت التليجرام

### تثبيت Python والاعتماديات
```bash
# تثبيت Python (إذا لم يكن مثبتاً)
sudo apt-get install -y python3 python3-pip

# التحقق من التثبيت
python3 --version
pip3 --version

# الانتقال إلى مجلد البوت
cd backend/bot

# تثبيت الاعتماديات
pip3 install -r requirements.txt
```

### تعديل ملف الإعدادات
قم بإنشاء ملف `config.env` في مجلد البوت بالمحتوى التالي:

```
BOT_TOKEN=7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA
BOT_USERNAME=smartcoin_official_bot
API_URL=https://api.smartcoin-app.com
DB_PATH=./bot_database.sqlite
```

### تشغيل البوت
```bash
# تشغيل البوت في الوضع العادي
python3 start_bot.py

# أو في الوضع المحسن
python3 start_bot.py --mode enhanced
```

## الخطوة 3: إعداد الواجهة الأمامية

### تشغيل خادم محلي
```bash
# الانتقال إلى مجلد الواجهة الأمامية
cd frontend

# تشغيل خادم محلي باستخدام Python
python3 -m http.server 8000

# أو باستخدام Node.js
npx http-server -p 8000
```

### الوصول إلى التطبيق
افتح المتصفح وانتقل إلى العنوان التالي:
```
http://localhost:8000
```

## الخطوة 4: نشر المشروع على الإنترنت

### نشر الواجهة الخلفية
يمكنك استخدام خدمات مثل Heroku أو DigitalOcean أو AWS لنشر الواجهة الخلفية:

```bash
# مثال للنشر على Heroku
heroku create smartcoin-backend
git push heroku main
```

### نشر الواجهة الأمامية
يمكنك استخدام خدمات مثل Netlify أو Vercel أو GitHub Pages لنشر الواجهة الأمامية:

```bash
# مثال للنشر على Netlify
npm install -g netlify-cli
netlify deploy --prod
```

### نشر بوت التليجرام
يمكنك تشغيل البوت على خادم VPS أو استخدام خدمات مثل Heroku:

```bash
# مثال للنشر على Heroku
heroku create smartcoin-bot
git push heroku main
heroku ps:scale worker=1
```

## الخطوة 5: التحقق من التثبيت

### التحقق من الواجهة الخلفية
```bash
# التحقق من حالة الخادم
curl http://localhost:3000/api/health
```

### التحقق من بوت التليجرام
افتح تطبيق Telegram وابحث عن البوت باسم `@smartcoin_official_bot` وتأكد من أنه يستجيب للأوامر.

### التحقق من الواجهة الأمامية
افتح المتصفح وتأكد من أن جميع الصفحات تعمل بشكل صحيح، وأن تسجيل الدخول يعمل بنسبة 100%.

## استكشاف الأخطاء وإصلاحها

### مشاكل الواجهة الخلفية
- تأكد من تشغيل MongoDB
- تحقق من ملف `.env` وصحة الإعدادات
- راجع سجلات الخطأ في وحدة التحكم

### مشاكل بوت التليجرام
- تأكد من صحة توكن البوت
- تحقق من اتصال البوت بالإنترنت
- راجع سجلات البوت للأخطاء

### مشاكل الواجهة الأمامية
- تأكد من تحديث عناوين API في ملفات JavaScript
- استخدم وحدة تحكم المتصفح للتحقق من أخطاء الشبكة
- تأكد من تمكين JavaScript في المتصفح

## الدعم والمساعدة
إذا واجهت أي مشاكل، يرجى التواصل مع فريق الدعم على البريد الإلكتروني: support@smartcoin-app.com
