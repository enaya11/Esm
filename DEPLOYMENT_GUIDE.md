# 🚀 دليل النشر - SmartCoin

## 📋 نظرة عامة

هذا الدليل يوضح كيفية نشر مشروع SmartCoin على الإنترنت بشكل دائم ومجاني.

## 🌐 خيارات النشر المقترحة

### 1. الباك اند (NestJS)
- **Railway** ⭐ (مقترح)
- **Render**
- **Heroku**
- **DigitalOcean App Platform**

### 2. الفرونت اند (Static)
- **Vercel** ⭐ (مقترح)
- **Netlify**
- **GitHub Pages**
- **Surge.sh**

### 3. قاعدة البيانات
- **Supabase** ✅ (مُعدة بالفعل)
- **PlanetScale**
- **Neon**

## 🚀 خطوات النشر التفصيلية

### المرحلة 1: إعداد GitHub Repository

```bash
# 1. إنشاء repository جديد على GitHub
# 2. رفع الكود
cd /path/to/smartcoin_final
git init
git add .
git commit -m "🚀 SmartCoin - أقوى منصة تداول لامركزية"
git branch -M main
git remote add origin https://github.com/yourusername/smartcoin.git
git push -u origin main
```

### المرحلة 2: نشر الباك اند على Railway

#### الخطوات:
1. **إنشاء حساب على Railway**
   - اذهب إلى [railway.app](https://railway.app)
   - سجل دخول باستخدام GitHub

2. **إنشاء مشروع جديد**
   ```bash
   # في مجلد backend
   echo "web: npm run start:prod" > Procfile
   ```

3. **إعداد متغيرات البيئة**
   ```env
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=postgresql://postgres.aqunpkwwvslnmuqvotyl:enayabasmaji12@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   TELEGRAM_BOT_TOKEN=7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ
   TON_API_KEY=32e3df1bb58960b9f1da65807c36836f71b71f93363450e2624fecd31bc57c3e
   SOLANA_RPC_URL=https://indulgent-thrumming-sky.solana-mainnet.quiknode.pro/011e3efccc9ddf2f45fe73987cf6e21ba163d077/
   TON_WALLET_ADDRESS=UQAmI5QQbc7HbxSbUHUkh5_7vltnn_bWb3qmS3pz7S1YPgbV
   SOLANA_WALLET_ADDRESS=6SeS6QVwkEuBvW8ibCMcenY9c522q9W4PV95xbRhFEZv
   JWT_SECRET=smartcoin_ultra_secure_jwt_secret_2024_production_ready
   ```

4. **النشر**
   - ربط GitHub repository
   - اختيار مجلد `backend`
   - النشر التلقائي

### المرحلة 3: نشر الفرونت اند على Vercel

#### الخطوات:
1. **إنشاء حساب على Vercel**
   - اذهب إلى [vercel.com](https://vercel.com)
   - سجل دخول باستخدام GitHub

2. **إعداد ملف vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "frontend/**",
         "use": "@vercel/static"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "/frontend/$1"
       }
     ]
   }
   ```

3. **تحديث API URLs**
   ```javascript
   // في ملفات JavaScript
   const API_BASE_URL = 'https://your-backend-url.railway.app/api/v1';
   ```

4. **النشر**
   - ربط GitHub repository
   - اختيار مجلد `frontend`
   - النشر التلقائي

## 🔧 إعدادات ما بعد النشر

### 1. إعداد Domain مخصص (اختياري)

#### للباك اند:
```bash
# في Railway
# Settings > Domains > Add Custom Domain
# api.smartcoin.app
```

#### للفرونت اند:
```bash
# في Vercel
# Settings > Domains > Add Domain
# smartcoin.app
```

### 2. إعداد SSL Certificate
- **Railway**: تلقائي
- **Vercel**: تلقائي

### 3. إعداد CDN (اختياري)
```javascript
// استخدام Cloudflare للتسريع
// إعداد DNS records
```

## 🛡️ إعدادات الأمان

### 1. متغيرات البيئة الآمنة
```env
# تأكد من عدم تسريب هذه المعلومات
JWT_SECRET=your-super-secret-key
DATABASE_URL=your-database-url
TELEGRAM_BOT_TOKEN=your-bot-token
```

### 2. CORS Settings
```typescript
// في main.ts
app.use(cors({
  origin: ['https://smartcoin.app', 'https://www.smartcoin.app'],
  credentials: true,
}));
```

### 3. Rate Limiting
```typescript
// إعدادات محدودة للإنتاج
ThrottlerModule.forRoot({
  ttl: 60,
  limit: 100,
})
```

## 📊 مراقبة الأداء

### 1. Logging
```typescript
// إعداد Winston للـ logging
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
```

### 2. Health Checks
```typescript
// إضافة endpoint للصحة
@Get('health')
healthCheck() {
  return { status: 'ok', timestamp: new Date().toISOString() };
}
```

### 3. Database Monitoring
```bash
# مراقبة Supabase Dashboard
# تحقق من الاستعلامات البطيئة
```

## 🔄 CI/CD Pipeline

### GitHub Actions (اختياري)
```yaml
# .github/workflows/deploy.yml
name: Deploy SmartCoin
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: railway deploy
```

## 🧪 اختبار النشر

### 1. اختبار الباك اند
```bash
curl https://your-backend-url.railway.app/api/v1/health
```

### 2. اختبار الفرونت اند
```bash
curl https://smartcoin.app
```

### 3. اختبار التكامل
- تسجيل دخول عبر Telegram
- إنشاء طلب دفع
- التحقق من المعاملات

## 📈 تحسين الأداء

### 1. Database Optimization
```sql
-- إنشاء فهارس للاستعلامات السريعة
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_orders_status ON orders(status);
```

### 2. Caching
```typescript
// إضافة Redis للتخزين المؤقت
import { CacheModule } from '@nestjs/cache-manager';
```

### 3. Image Optimization
```html
<!-- استخدام WebP للصور -->
<picture>
  <source srcset="image.webp" type="image/webp">
  <img src="image.jpg" alt="SmartCoin">
</picture>
```

## 🚨 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   ```bash
   # تحقق من DATABASE_URL
   # تأكد من السماح بالاتصالات الخارجية
   ```

2. **خطأ CORS**
   ```typescript
   // تحديث إعدادات CORS
   app.use(cors({ origin: 'https://your-frontend-url' }));
   ```

3. **خطأ في JWT**
   ```bash
   # تحقق من JWT_SECRET
   # تأكد من تطابق المفاتيح
   ```

## 📞 الدعم

إذا واجهت أي مشاكل في النشر:
1. تحقق من logs في Railway/Vercel
2. راجع متغيرات البيئة
3. تأكد من صحة الروابط

## ✅ قائمة التحقق النهائية

- [ ] رفع الكود إلى GitHub
- [ ] نشر الباك اند على Railway
- [ ] نشر الفرونت اند على Vercel
- [ ] إعداد متغيرات البيئة
- [ ] تحديث API URLs
- [ ] اختبار التسجيل عبر Telegram
- [ ] اختبار نظام الدفع
- [ ] اختبار نظام الإحالات
- [ ] إعداد Domain مخصص (اختياري)
- [ ] تفعيل مراقبة الأداء

---

**🎉 تهانينا! مشروع SmartCoin أصبح متاحاً على الإنترنت!**

