#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SmartCoin Telegram Bot - بوت تليجرام متقدم لنظام SmartCoin
يدعم تسجيل الدخول الآمن وإدارة المستخدمين
"""

import os
import sys
import asyncio
import logging
import secrets
import string
import json
from datetime import datetime, timedelta
from typing import Dict, Optional, List
import sqlite3
import hashlib
import hmac

# مكتبات تليجرام
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, 
    CommandHandler, 
    MessageHandler, 
    CallbackQueryHandler,
    ContextTypes,
    filters
)

# إعداد نظام السجلات
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler('smartcoin_bot.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class SmartCoinBot:
    def __init__(self, token: str):  # تغيير اسم الدالة إلى __init__
        """تهيئة بوت SmartCoin"""
        self.token = token
        self.app = None
        self.db_path = 'smartcoin_bot.db'
        self.website_url = 'https://smartcoin-app.com'  # يجب تحديث هذا الرابط
        self.verification_codes = {}  # تخزين مؤقت لرموز التحقق
        
        # إعداد قاعدة البيانات
        self.init_database()
        
        logger.info("🚀 تم تهيئة بوت SmartCoin بنجاح")

    def init_database(self):
        """إنشاء قاعدة البيانات وإعداد الجداول"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # جدول المستخدمين
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id INTEGER PRIMARY KEY,
                    username TEXT,
                    first_name TEXT,
                    last_name TEXT,
                    language_code TEXT,
                    is_premium BOOLEAN DEFAULT FALSE,
                    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    total_coins INTEGER DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    referral_code TEXT UNIQUE,
                    referred_by INTEGER,
                    is_active BOOLEAN DEFAULT TRUE
                )
            ''')
            
            # جدول رموز التحقق
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS verification_codes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    code TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_used BOOLEAN DEFAULT FALSE,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            # جدول جلسات تسجيل الدخول
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS login_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    session_token TEXT UNIQUE,
                    verification_code TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT TRUE,
                    ip_address TEXT,
                    user_agent TEXT,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            # جدول الأنشطة
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS user_activities (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    activity_type TEXT,
                    description TEXT,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("✅ تم إعداد قاعدة البيانات بنجاح")
            
        except Exception as e:
            logger.error(f"❌ خطأ في إعداد قاعدة البيانات: {e}")

    def generate_verification_code(self) -> str:
        """توليد رمز تحقق عشوائي"""
        return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))

    def generate_referral_code(self, user_id: int) -> str:
        """توليد رمز إحالة فريد"""
        base = f"SC{user_id}"
        hash_obj = hashlib.md5(base.encode())
        return hash_obj.hexdigest()[:8].upper()

    async def register_user(self, user_id: int, user_data: dict) -> bool:
        """تسجيل مستخدم جديد"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # التحقق من وجود المستخدم
            cursor.execute("SELECT user_id FROM users WHERE user_id = ?", (user_id,))
            if cursor.fetchone():
                conn.close()
                return True  # المستخدم موجود بالفعل
            
            # إنشاء رمز إحالة
            referral_code = self.generate_referral_code(user_id)
            
            # إدراج المستخدم الجديد
            cursor.execute('''
                INSERT INTO users (
                    user_id, username, first_name, last_name, 
                    language_code, referral_code
                ) VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                user_id,
                user_data.get('username'),
                user_data.get('first_name'),
                user_data.get('last_name'),
                user_data.get('language_code', 'ar'),
                referral_code
            ))
            
            # تسجيل النشاط
            cursor.execute('''
                INSERT INTO user_activities (user_id, activity_type, description)
                VALUES (?, ?, ?)
            ''', (user_id, 'registration', 'تسجيل مستخدم جديد'))
            
            conn.commit()
            conn.close()
            
            logger.info(f"✅ تم تسجيل المستخدم {user_id} بنجاح")
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في تسجيل المستخدم {user_id}: {e}")
            return False

    async def create_verification_code(self, user_id: int) -> Optional[str]:
        """إنشاء رمز تحقق جديد للمستخدم"""
        try:
            code = self.generate_verification_code()
            expires_at = datetime.now() + timedelta(minutes=10)  # صالح لمدة 10 دقائق
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # إلغاء الرموز السابقة
            cursor.execute('''
                UPDATE verification_codes 
                SET is_used = TRUE 
                WHERE user_id = ? AND is_used = FALSE
            ''', (user_id,))
            
            # إنشاء رمز جديد
            cursor.execute('''
                INSERT INTO verification_codes (user_id, code, expires_at)
                VALUES (?, ?, ?)
            ''', (user_id, code, expires_at))
            
            conn.commit()
            conn.close()
            
            # حفظ في الذاكرة المؤقتة
            self.verification_codes[user_id] = {
                'code': code,
                'expires_at': expires_at,
                'created_at': datetime.now()
            }
            
            logger.info(f"✅ تم إنشاء رمز تحقق للمستخدم {user_id}")
            return code
            
        except Exception as e:
            logger.error(f"❌ خطأ في إنشاء رمز التحقق للمستخدم {user_id}: {e}")
            return None

    async def verify_code(self, user_id: int, code: str) -> bool:
        """التحقق من صحة رمز التحقق"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # البحث عن الرمز
            cursor.execute('''
                SELECT id, expires_at FROM verification_codes
                WHERE user_id = ? AND code = ? AND is_used = FALSE
                ORDER BY created_at DESC LIMIT 1
            ''', (user_id, code))
            
            result = cursor.fetchone()
            if not result:
                conn.close()
                return False
            
            code_id, expires_at = result
            expires_at = datetime.fromisoformat(expires_at)
            
            # التحقق من انتهاء الصلاحية
            if datetime.now() > expires_at:
                conn.close()
                return False
            
            # تحديد الرمز كمستخدم
            cursor.execute('''
                UPDATE verification_codes 
                SET is_used = TRUE 
                WHERE id = ?
            ''', (code_id,))
            
            # تحديث آخر نشاط للمستخدم
            cursor.execute('''
                UPDATE users 
                SET last_activity = CURRENT_TIMESTAMP 
                WHERE user_id = ?
            ''', (user_id,))
            
            # تسجيل النشاط
            cursor.execute('''
                INSERT INTO user_activities (user_id, activity_type, description)
                VALUES (?, ?, ?)
            ''', (user_id, 'login', 'تسجيل دخول ناجح عبر تليجرام'))
            
            conn.commit()
            conn.close()
            
            # إزالة من الذاكرة المؤقتة
            if user_id in self.verification_codes:
                del self.verification_codes[user_id]
            
            logger.info(f"✅ تم التحقق من رمز المستخدم {user_id} بنجاح")
            return True
            
        except Exception as e:
            logger.error(f"❌ خطأ في التحقق من رمز المستخدم {user_id}: {e}")
            return False

    async def get_user_info(self, user_id: int) -> Optional[dict]:
        """الحصول على معلومات المستخدم"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT user_id, username, first_name, last_name, 
                       total_coins, level, referral_code, registration_date
                FROM users WHERE user_id = ?
            ''', (user_id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                return {
                    'user_id': result[0],
                    'username': result[1],
                    'first_name': result[2],
                    'last_name': result[3],
                    'total_coins': result[4],
                    'level': result[5],
                    'referral_code': result[6],
                    'registration_date': result[7]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"❌ خطأ في الحصول على معلومات المستخدم {user_id}: {e}")
            return None

    # معالجات الأوامر
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /start"""
        user = update.effective_user
        user_id = user.id
        
        # تسجيل المستخدم إذا لم يكن مسجلاً
        user_data = {
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'language_code': user.language_code
        }
        
        await self.register_user(user_id, user_data)
        
        # رسالة الترحيب
        welcome_text = f"""
🌟 مرحباً بك في SmartCoin! 🌟

أهلاً {user.first_name}! 👋

🚀 منصة العملات الرقمية المستقبلية
💰 رأس مال: 350 مليون دولار
👥 أكثر من مليون مستخدم نشط

ما يمكنك فعله:
🔸 تعدين العملات الرقمية
🔸 استثمار مربح ومضمون
🔸 مهام يومية بمكافآت قيمة
🔸 نظام إحالات مجزي
🔸 عجلة الحظ اليومية

للبدء:
• اضغط على "🌐 فتح المنصة" للوصول إلى الموقع
• أو استخدم /login لتسجيل الدخول

الأوامر المتاحة:
/login - تسجيل الدخول إلى المنصة
/profile - عرض ملفك الشخصي
/help - المساعدة والدعم
/referral - رمز الإحالة الخاص بك

🔐 أمان متقدم | ⚡ سرعة فائقة | 📈 أرباح مضمونة
        """
        
        # أزرار التفاعل
        keyboard = [
            [InlineKeyboardButton("🌐 فتح المنصة", url=f"{self.website_url}/login-ultra.html")],
            [InlineKeyboardButton("🔐 تسجيل الدخول", callback_data="login")],
            [InlineKeyboardButton("👤 الملف الشخصي", callback_data="profile")],
            [InlineKeyboardButton("🎁 رمز الإحالة", callback_data="referral")],
            [InlineKeyboardButton("❓ المساعدة", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # إرسال الرسالة بشكل صحيح
        await update.message.reply_text(
            welcome_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
        
        logger.info(f"👋 مستخدم جديد: {user_id} ({user.first_name})")

    async def login_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /login"""
        user = update.effective_user
        user_id = user.id
        
        # إنشاء رمز تحقق
        verification_code = await self.create_verification_code(user_id)
        
        if not verification_code:
            await update.message.reply_text(
                "❌ حدث خطأ في إنشاء رمز التحقق. يرجى المحاولة مرة أخرى.",
                parse_mode='Markdown'
            )
            return
        
        login_text = f"""
🔐 تسجيل الدخول إلى SmartCoin

مرحباً {user.first_name}! 

رمز التحقق الخاص بك:
{verification_code}

خطوات تسجيل الدخول:
1️⃣ انسخ الرمز أعلاه
2️⃣ اذهب إلى موقع SmartCoin
3️⃣ الصق الرمز في حقل التحقق
4️⃣ اضغط على "تحقق"

⏰ صالح لمدة 10 دقائق فقط
🔒 لا تشارك هذا الرمز مع أي شخص

روابط سريعة:
        """
        
        keyboard = [
            [InlineKeyboardButton("🌐 فتح الموقع", url=f"{self.website_url}/login-ultra.html")],
            [InlineKeyboardButton("📋 نسخ الرمز", callback_data=f"copy_code_{verification_code}")],
            [InlineKeyboardButton("🔄 رمز جديد", callback_data="new_code")],
            [InlineKeyboardButton("❓ مساعدة", callback_data="login_help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            login_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
        
        logger.info(f"🔐 تم إنشاء رمز تسجيل دخول للمستخدم {user_id}")

    async def profile_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /profile"""
        user = update.effective_user
        user_id = user.id
        
        user_info = await self.get_user_info(user_id)
        
        if not user_info:
            await update.message.reply_text(
                "❌ لم يتم العثور على ملفك الشخصي. استخدم /start للتسجيل.",
                parse_mode='Markdown'
            )
            return
        
        profile_text = f"""
👤 ملفك الشخصي في SmartCoin

المعلومات الأساسية:
🆔 المعرف: {user_info['user_id']}
👤 الاسم: {user_info['first_name']}
📱 اسم المستخدم: @{user_info['username'] or 'غير محدد'}

إحصائيات الحساب:
💰 إجمالي العملات: {user_info['total_coins']:,} SM
⭐ المستوى: {user_info['level']}
📅 تاريخ التسجيل: {user_info['registration_date'][:10]}

رمز الإحالة:
{user_info['referral_code']}

روابط سريعة:
        """
        
        keyboard = [
            [InlineKeyboardButton("🌐 فتح المنصة", url=f"{self.website_url}/earn-ultra.html")],
            [InlineKeyboardButton("🎁 مشاركة رمز الإحالة", callback_data="share_referral")],
            [InlineKeyboardButton("📊 الإحصائيات التفصيلية", callback_data="detailed_stats")],
            [InlineKeyboardButton("🔄 تحديث البيانات", callback_data="refresh_profile")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            profile_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /help"""
        help_text = """
❓ مساعدة SmartCoin Bot

الأوامر المتاحة:
/start - بدء استخدام البوت
/login - تسجيل الدخول إلى المنصة
/profile - عرض الملف الشخصي
/referral - رمز الإحالة الخاص بك
/help - عرض هذه المساعدة

كيفية الاستخدام:
1️⃣ التسجيل: استخدم /start للتسجيل في النظام
2️⃣ تسجيل الدخول: استخدم /login للحصول على رمز التحقق
3️⃣ الوصول للمنصة: اضغط على "فتح المنصة" للوصول إلى الموقع
4️⃣ إدخال الرمز: الصق رمز التحقق في الموقع

المشاكل الشائعة:
❓ انتهت صلاحية الرمز؟ استخدم /login للحصول على رمز جديد
❓ لا يعمل الرمز؟ تأكد من نسخه بالكامل دون مسافات
❓ مشاكل في الموقع؟ تأكد من اتصالك بالإنترنت

الدعم الفني:
📧 البريد الإلكتروني: support@smartcoin-app.com
💬 الدردشة المباشرة: متاحة في الموقع 24/7
📱 تليجرام: @SmartCoinSupport

روابط مهمة:
🌐 الموقع الرسمي: smartcoin-app.com
📱 تطبيق الهاتف: قريباً
📢 القناة الرسمية: @SmartCoinOfficial
        """
        
        keyboard = [
            [InlineKeyboardButton("🌐 فتح الموقع", url=self.website_url)],
            [InlineKeyboardButton("💬 الدعم الفني", url="https://t.me/SmartCoinSupport")],
            [InlineKeyboardButton("📢 القناة الرسمية", url="https://t.me/SmartCoinOfficial")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            help_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

    async def referral_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /referral"""
        user = update.effective_user
        user_id = user.id
        
        user_info = await self.get_user_info(user_id)
        
        if not user_info:
            await update.message.reply_text(
                "❌ لم يتم العثور على حسابك. استخدم /start للتسجيل.",
                parse_mode='Markdown'
            )
            return
        
        referral_code = user_info['referral_code']
        referral_link = f"https://t.me/{context.bot.username}?start={referral_code}"
        
        referral_text = f"""
🎁 نظام الإحالات في SmartCoin

رمز الإحالة الخاص بك:
{referral_code}

رابط الإحالة:
{referral_link}

كيفية الاستخدام:
1️⃣ شارك الرابط مع أصدقائك
2️⃣ عندما يسجلون ستحصل على مكافأة
3️⃣ كلما زاد عدد الإحالات، زادت أرباحك

مكافآت الإحالة:
💰 10 SM لكل صديق يسجل
🎯 5% من أرباح كل صديق تدعوه
⭐ مكافآت إضافية عند الوصول لأهداف معينة

نصائح للنجاح:
✅ شارك في المجموعات المهتمة بالعملات الرقمية
✅ اشرح فوائد المنصة لأصدقائك
✅ استخدم وسائل التواصل الاجتماعي
        """
        
        keyboard = [
            [InlineKeyboardButton("📤 مشاركة الرابط", switch_inline_query=f"انضم إلى SmartCoin واربح العملات الرقمية! {referral_link}")],
            [InlineKeyboardButton("📋 نسخ الرمز", callback_data=f"copy_referral_{referral_code}")],
            [InlineKeyboardButton("📊 إحصائيات الإحالات", callback_data="referral_stats")],
            [InlineKeyboardButton("🌐 فتح المنصة", url=f"{self.website_url}/referrals.html")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            referral_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

    # معالجات الأزرار
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الأزرار التفاعلية"""
        query = update.callback_query
        await query.answer()
        
        data = query.data
        user_id = query.from_user.id
        
        if data == "login":
            await self.handle_login_button(query, context)
        elif data == "profile":
            await self.handle_profile_button(query, context)
        elif data == "referral":
            await self.handle_referral_button(query, context)
        elif data == "help":
            await self.handle_help_button(query, context)
        elif data == "new_code":
            await self.handle_new_code_button(query, context)
        elif data.startswith("copy_code_"):
            await self.handle_copy_code_button(query, context)
        elif data.startswith("copy_referral_"):
            await self.handle_copy_referral_button(query, context)
        else:
            await query.edit_message_text("❓ أمر غير معروف.")

    async def handle_login_button(self, query, context):
        """معالج زر تسجيل الدخول"""
        user_id = query.from_user.id
        verification_code = await self.create_verification_code(user_id)
        
        if verification_code:
            text = f"""
🔐 رمز التحقق الجديد:
{verification_code}

⏰ صالح لمدة 10 دقائق
🔒 لا تشاركه مع أحد
            """
            
            keyboard = [
                [InlineKeyboardButton("🌐 فتح الموقع", url=f"{self.website_url}/login-ultra.html")],
                [InlineKeyboardButton("🔄 رمز جديد", callback_data="new_code")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(text, parse_mode='Markdown', reply_markup=reply_markup)
        else:
            await query.edit_message_text("❌ حدث خطأ في إنشاء رمز التحقق.")

    async def handle_new_code_button(self, query, context):
        """معالج زر الحصول على رمز جديد"""
        await self.handle_login_button(query, context)

    async def handle_copy_code_button(self, query, context):
        """معالج زر نسخ الرمز"""
        code = query.data.split("_")[-1]
        await query.answer(f"تم نسخ الرمز: {code}", show_alert=True)

    async def handle_copy_referral_button(self, query, context):
        """معالج زر نسخ رمز الإحالة"""
        code = query.data.split("_")[-1]
        await query.answer(f"تم نسخ رمز الإحالة: {code}", show_alert=True)

    async def handle_profile_button(self, query, context):
        """معالج زر الملف الشخصي"""
        # إعادة توجيه لأمر الملف الشخصي
        fake_update = Update(update_id=update.update_id + 1, message=query.message)
        fake_update.effective_user = query.from_user
        await self.profile_command(fake_update, context)

    async def handle_referral_button(self, query, context):
        """معالج زر الإحالة"""
        # إعادة توجيه لأمر الإحالة
        fake_update = Update(update_id=update.update_id + 1, message=query.message)
        fake_update.effective_user = query.from_user
        await self.referral_command(fake_update, context)

    async def handle_help_button(self, query, context):
        """معالج زر المساعدة"""
        # إعادة توجيه لأمر المساعدة
        fake_update = Update(update_id=update.update_id + 1, message=query.message)
        fake_update.effective_user = query.from_user
        await self.help_command(fake_update, context)

    # معالج الرسائل العامة
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الرسائل العامة"""
        user = update.effective_user
        message_text = update.message.text
        
        # التحقق من رموز التحقق
        if len(message_text) == 8 and message_text.isalnum():
            is_valid = await self.verify_code(user.id, message_text.upper())
            
            if is_valid:
                success_text = f"""
✅ تم تسجيل الدخول بنجاح!

مرحباً {user.first_name}! 🎉

تم التحقق من رمز التحقق بنجاح. يمكنك الآن الوصول إلى جميع ميزات منصة SmartCoin.

ما يمكنك فعله الآن:
🔸 بدء التعدين وكسب العملات
🔸 إكمال المهام اليومية
🔸 دعوة الأصدقاء والحصول على مكافآت
🔸 لعب عجلة الحظ
🔸 استثمار عملاتك

استمتع بتجربة SmartCoin! 🚀
                """
                
                keyboard = [
                    [InlineKeyboardButton("🌐 فتح المنصة", url=f"{self.website_url}/earn-ultra.html")],
                    [InlineKeyboardButton("👤 الملف الشخصي", callback_data="profile")]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    success_text,
                    parse_mode='Markdown',
                    reply_markup=reply_markup
                )
            else:
                await update.message.reply_text(
                    "❌ رمز التحقق غير صحيح أو منتهي الصلاحية.\n\nاستخدم /login للحصول على رمز جديد.",
                    parse_mode='Markdown'
                )
        else:
            # رسالة افتراضية
            await update.message.reply_text(
                "👋 مرحباً! استخدم /start للبدء أو /help للمساعدة.",
                parse_mode='Markdown'
            )

    def run(self):
        """تشغيل البوت"""
        try:
            # إنشاء التطبيق
            self.app = Application.builder().token(self.token).build()
            
            # إضافة معالجات الأوامر
            self.app.add_handler(CommandHandler("start", self.start_command))
            self.app.add_handler(CommandHandler("login", self.login_command))
            self.app.add_handler(CommandHandler("profile", self.profile_command))
            self.app.add_handler(CommandHandler("help", self.help_command))
            self.app.add_handler(CommandHandler("referral", self.referral_command))
            
            # إضافة معالج الأزرار
            self.app.add_handler(CallbackQueryHandler(self.button_callback))
            
            # إضافة معالج الرسائل العامة
            self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
            
            logger.info("🤖 بدء تشغيل بوت SmartCoin...")
            
            # تشغيل البوت
            self.app.run_polling(allowed_updates=Update.ALL_TYPES)
            
        except Exception as e:
            logger.error(f"❌ خطأ في تشغيل البوت: {e}")

def main():
    """الدالة الرئيسية"""
    # توكن البوت
    BOT_TOKEN = "7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ"
    
    if not BOT_TOKEN:
        logger.error("❌ يرجى تعيين توكن البوت في متغير BOT_TOKEN")
        sys.exit(1)
    
    # إنشاء وتشغيل البوت
    bot = SmartCoinBot(BOT_TOKEN)
    bot.run()

if __name__ == "__main__":
    main()