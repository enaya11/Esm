# 🚀 دليل النشر والتشغيل - منصة SmartCoin

## 📋 جدول المحتويات

1. [متطلبات النظام](#متطلبات-النظام)
2. [إعداد البيئة](#إعداد-البيئة)
3. [تشغيل البوت](#تشغيل-البوت)
4. [تشغيل الواجهة الأمامية](#تشغيل-الواجهة-الأمامية)
5. [اختبار النظام](#اختبار-النظام)
6. [النشر في الإنتاج](#النشر-في-الإنتاج)
7. [استكشاف الأخطاء](#استكشاف-الأخطاء)

## 💻 متطلبات النظام

### الحد الأدنى للمتطلبات

- **نظام التشغيل:** Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Python:** 3.8 أو أحدث
- **Node.js:** 16.0 أو أحدث (اختياري للخلفية)
- **الذاكرة:** 2 GB RAM
- **التخزين:** 1 GB مساحة فارغة
- **الإنترنت:** اتصال مستقر

### المتطلبات الموصى بها

- **Python:** 3.10+
- **الذاكرة:** 4 GB RAM
- **المعالج:** معالج متعدد النوى
- **التخزين:** SSD للأداء الأفضل

## 🔧 إعداد البيئة

### 1. تحضير المجلد

```bash
# إنشاء مجلد المشروع
mkdir smartcoin_project
cd smartcoin_project

# استخراج الملفات (إذا كانت مضغوطة)
unzip smartcoin_final_complete.zip
cd smartcoin_final_complete/smartcoin_final
```

### 2. إعداد Python والمكتبات

```bash
# إنشاء بيئة افتراضية (موصى به)
python -m venv smartcoin_env

# تفعيل البيئة الافتراضية
# على Windows:
smartcoin_env\Scripts\activate
# على macOS/Linux:
source smartcoin_env/bin/activate

# تثبيت مكتبات البوت
cd backend/bot
pip install -r requirements.txt
```

### 3. إعداد إعدادات البوت

قم بتحرير ملف `backend/bot/bot_config.py`:

```python
class BotConfig:
    # ضع توكن البوت الخاص بك هنا
    BOT_TOKEN = "7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA"
    
    # رابط التطبيق (سيتم تحديثه لاحقاً)
    WEBAPP_URL = "http://localhost:8000"
    
    # رابط API (إذا كان متوفراً)
    API_BASE_URL = "http://localhost:3000/api"
    
    # مسار قاعدة البيانات
    DATABASE_PATH = "bot_users.db"
```

## 🤖 تشغيل البوت

### الطريقة الأولى: التشغيل المباشر

```bash
# الانتقال لمجلد البوت
cd backend/bot

# تشغيل البوت الأساسي
python telegramBot.py

# أو تشغيل البوت المحسن
python enhanced_bot.py
```

### الطريقة الثانية: استخدام ملف التشغيل

```bash
# تشغيل البوت المحسن (موصى به)
python start_bot.py --mode enhanced

# تشغيل مع وضع التصحيح
python start_bot.py --mode enhanced --debug

# تشغيل البوت الأساسي
python start_bot.py --mode basic
```

### التحقق من تشغيل البوت

1. ابحث عن البوت في التليجرام: `@smartcoin_official_bot`
2. أرسل الأمر `/start`
3. يجب أن يرد البوت برسالة ترحيب

## 🌐 تشغيل الواجهة الأمامية

### الطريقة الأولى: خادم Python البسيط

```bash
# الانتقال لمجلد الواجهة الأمامية
cd frontend

# تشغيل خادم محلي على المنفذ 8000
python -m http.server 8000

# أو على منفذ مخصص
python -m http.server 3000
```

### الطريقة الثانية: استخدام Node.js

```bash
# تثبيت serve عالمياً
npm install -g serve

# تشغيل الخادم
cd frontend
serve . -p 8000
```

### الطريقة الثالثة: استخدام خادم ويب

إذا كان لديك Apache أو Nginx:

```bash
# نسخ الملفات لمجلد الخادم
cp -r frontend/* /var/www/html/smartcoin/

# أو إنشاء رابط رمزي
ln -s /path/to/frontend /var/www/html/smartcoin
```

### الوصول للمنصة

1. افتح المتصفح
2. انتقل إلى: `http://localhost:8000`
3. ستظهر صفحة تسجيل الدخول تلقائياً

## ✅ اختبار النظام

### 1. اختبار البوت

```bash
# اختبار الاتصال
python -c "
import sys
sys.path.append('backend/bot')
from bot_config import BotConfig
print('توكن البوت:', BotConfig.BOT_TOKEN[:10] + '...')
print('رابط التطبيق:', BotConfig.WEBAPP_URL)
"

# اختبار قاعدة البيانات
python -c "
import sqlite3
conn = sqlite3.connect('backend/bot/bot_users.db')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM users')
print('عدد المستخدمين:', cursor.fetchone()[0])
conn.close()
"
```

### 2. اختبار الواجهة الأمامية

1. **اختبار تحميل الصفحات:**
   - `http://localhost:8000/login-enhanced.html`
   - `http://localhost:8000/earn-enhanced.html`

2. **اختبار التأثيرات ثلاثية الأبعاد:**
   - تحقق من ظهور زر التعدين المحسن
   - اختبر التفاعل مع العناصر
   - تأكد من عمل الرسوم المتحركة

3. **اختبار الحماية:**
   - حاول الوصول لصفحة محمية بدون تسجيل دخول
   - تحقق من التوجيه التلقائي

### 3. اختبار التكامل

```bash
# اختبار تسجيل الدخول
# 1. افتح صفحة تسجيل الدخول
# 2. اضغط على "تسجيل الدخول عبر التليجرام"
# 3. تحقق من ظهور التعليمات
# 4. افتح البوت في التليجرام
# 5. أرسل /start
# 6. ارجع للموقع وتحقق من تسجيل الدخول
```

## 🌍 النشر في الإنتاج

### 1. إعداد الخادم

```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Python و pip
sudo apt install python3 python3-pip python3-venv -y

# تثبيت Nginx (اختياري)
sudo apt install nginx -y

# تثبيت PM2 لإدارة العمليات
npm install -g pm2
```

### 2. رفع الملفات

```bash
# نسخ المشروع للخادم
scp -r smartcoin_final user@server:/home/user/

# أو استخدام Git
git clone https://github.com/your-repo/smartcoin.git
```

### 3. إعداد البوت للإنتاج

```bash
# إنشاء ملف خدمة systemd
sudo nano /etc/systemd/system/smartcoin-bot.service
```

محتوى الملف:

```ini
[Unit]
Description=SmartCoin Telegram Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/smartcoin_final/backend/bot
Environment=PATH=/home/ubuntu/smartcoin_env/bin
ExecStart=/home/ubuntu/smartcoin_env/bin/python start_bot.py --mode enhanced
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# تفعيل وتشغيل الخدمة
sudo systemctl enable smartcoin-bot
sudo systemctl start smartcoin-bot
sudo systemctl status smartcoin-bot
```

### 4. إعداد Nginx للواجهة الأمامية

```bash
# إنشاء ملف إعداد الموقع
sudo nano /etc/nginx/sites-available/smartcoin
```

محتوى الملف:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /home/ubuntu/smartcoin_final/frontend;
    index login-enhanced.html;
    
    location / {
        try_files $uri $uri/ /login-enhanced.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # تحسين الأداء
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/smartcoin /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. إعداد SSL (موصى به)

```bash
# تثبيت Certbot
sudo apt install certbot python3-certbot-nginx -y

# الحصول على شهادة SSL
sudo certbot --nginx -d your-domain.com

# تجديد تلقائي
sudo crontab -e
# إضافة السطر التالي:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🔍 استكشاف الأخطاء

### مشاكل البوت

#### البوت لا يستجيب

```bash
# فحص حالة الخدمة
sudo systemctl status smartcoin-bot

# عرض السجلات
sudo journalctl -u smartcoin-bot -f

# إعادة تشغيل البوت
sudo systemctl restart smartcoin-bot
```

#### خطأ في التوكن

```bash
# التحقق من التوكن
python -c "
import requests
token = 'YOUR_BOT_TOKEN'
response = requests.get(f'https://api.telegram.org/bot{token}/getMe')
print(response.json())
"
```

### مشاكل الواجهة الأمامية

#### الصفحات لا تحمل

```bash
# فحص حالة Nginx
sudo systemctl status nginx

# فحص ملفات السجل
sudo tail -f /var/log/nginx/error.log

# اختبار إعدادات Nginx
sudo nginx -t
```

#### التأثيرات لا تعمل

1. تحقق من وحدة تحكم المتصفح (F12)
2. تأكد من تحميل ملفات CSS و JavaScript
3. تحقق من دعم المتصفح للتأثيرات الحديثة

### مشاكل قاعدة البيانات

```bash
# فحص قاعدة البيانات
sqlite3 backend/bot/bot_users.db ".tables"

# عرض المستخدمين
sqlite3 backend/bot/bot_users.db "SELECT * FROM users LIMIT 5"

# إصلاح قاعدة البيانات (إذا لزم الأمر)
sqlite3 backend/bot/bot_users.db ".recover"
```

## 📊 مراقبة الأداء

### مراقبة البوت

```bash
# عرض استخدام الموارد
top -p $(pgrep -f "start_bot.py")

# عرض إحصائيات الذاكرة
ps aux | grep start_bot.py

# مراقبة السجلات في الوقت الفعلي
tail -f backend/bot/bot.log
```

### مراقبة الخادم

```bash
# عرض حالة النظام
htop

# مراقبة استخدام القرص
df -h

# مراقبة الشبكة
netstat -tulpn | grep :80
```

## 🔄 الصيانة الدورية

### نسخ احتياطية

```bash
#!/bin/bash
# ملف backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"

# إنشاء مجلد النسخ الاحتياطية
mkdir -p $BACKUP_DIR

# نسخ قاعدة البيانات
cp backend/bot/bot_users.db $BACKUP_DIR/bot_users_$DATE.db
cp backend/bot/notifications.db $BACKUP_DIR/notifications_$DATE.db

# ضغط الملفات
tar -czf $BACKUP_DIR/smartcoin_backup_$DATE.tar.gz \
    frontend/ backend/ README.md

# حذف النسخ القديمة (أكثر من 30 يوم)
find $BACKUP_DIR -name "*.db" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "تم إنشاء نسخة احتياطية: $DATE"
```

```bash
# جعل الملف قابل للتنفيذ
chmod +x backup.sh

# إضافة مهمة cron للنسخ الاحتياطي اليومي
crontab -e
# إضافة السطر التالي:
# 0 2 * * * /home/ubuntu/smartcoin_final/backup.sh
```

### تحديث النظام

```bash
#!/bin/bash
# ملف update.sh

echo "بدء تحديث النظام..."

# إيقاف البوت
sudo systemctl stop smartcoin-bot

# تحديث الكود (إذا كان في Git)
git pull origin main

# تحديث المكتبات
source smartcoin_env/bin/activate
pip install -r backend/bot/requirements.txt --upgrade

# إعادة تشغيل البوت
sudo systemctl start smartcoin-bot

# التحقق من الحالة
sudo systemctl status smartcoin-bot

echo "تم تحديث النظام بنجاح!"
```

## 📞 الدعم والمساعدة

### قائمة فحص سريعة

- [ ] البوت يرد على `/start`
- [ ] صفحة تسجيل الدخول تحمل بشكل صحيح
- [ ] زر التعدين يظهر مع التأثيرات
- [ ] الحماية تعمل (منع الوصول بدون تسجيل دخول)
- [ ] الإشعارات تصل عبر البوت
- [ ] قاعدة البيانات تحفظ البيانات

### معلومات مفيدة للدعم

عند طلب المساعدة، قم بتوفير:

1. **نظام التشغيل وإصداره**
2. **إصدار Python المستخدم**
3. **رسائل الخطأ الكاملة**
4. **خطوات إعادة إنتاج المشكلة**
5. **محتوى ملفات السجل ذات الصلة**

### أوامر تشخيص سريعة

```bash
# معلومات النظام
python --version
pip list | grep telegram
systemctl status smartcoin-bot
nginx -v
sqlite3 --version

# فحص الاتصالات
curl -I http://localhost:8000
curl -s https://api.telegram.org/bot$BOT_TOKEN/getMe

# فحص الملفات
ls -la backend/bot/
ls -la frontend/
```

---

## 🎉 تهانينا!

إذا وصلت إلى هنا وكل شيء يعمل بشكل صحيح، فقد نجحت في تشغيل منصة SmartCoin المحسنة! 

استمتع بالتأثيرات المذهلة والميزات المتقدمة! 🚀✨

