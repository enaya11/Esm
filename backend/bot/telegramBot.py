#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SmartCoin Telegram Bot
بوت التليجرام الرسمي لمنصة SmartCoin
"""

import os
import sys
import json
import logging
import asyncio
import aiohttp
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import sqlite3
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebApp
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler

# إعداد التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# إعدادات البوت
BOT_TOKEN = "7782763042:AAHNKGl9Y65n4Q8JgVQbQvtlLvg_toT2MwA"
WEBAPP_URL = "https://smartcoin-app.com"  # سيتم تحديثه لاحقاً
API_BASE_URL = "http://localhost:3000/api"  # عنوان API المحلي

class SmartCoinBot:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), 'bot_users.db')
        self.init_database()
        self.notification_throttle = {}  # لتجنب إغراق المستخدمين بالإشعارات
        
    def init_database(self):
        """إنشاء قاعدة بيانات المستخدمين"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                telegram_id INTEGER PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                last_name TEXT,
                language_code TEXT,
                is_registered BOOLEAN DEFAULT FALSE,
                registration_date TIMESTAMP,
                last_activity TIMESTAMP,
                notification_settings TEXT DEFAULT '{"mining": true, "referrals": true, "tasks": true}'
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_sessions (
                telegram_id INTEGER PRIMARY KEY,
                session_token TEXT,
                created_at TIMESTAMP,
                expires_at TIMESTAMP,
                FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
    def get_user(self, telegram_id: int) -> Optional[Dict]:
        """الحصول على بيانات المستخدم من قاعدة البيانات"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM users WHERE telegram_id = ?', (telegram_id,))
        row = cursor.fetchone()
        
        conn.close()
        
        if row:
            columns = [description[0] for description in cursor.description]
            return dict(zip(columns, row))
        return None
        
    def save_user(self, user_data: Dict):
        """حفظ أو تحديث بيانات المستخدم"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO users 
            (telegram_id, username, first_name, last_name, language_code, last_activity)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            user_data['telegram_id'],
            user_data.get('username'),
            user_data.get('first_name'),
            user_data.get('last_name'),
            user_data.get('language_code'),
            datetime.now()
        ))
        
        conn.commit()
        conn.close()
        
    async def register_user_with_api(self, telegram_id: int, user_data: Dict) -> bool:
        """تسجيل المستخدم مع API الخلفي"""
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    'telegram_id': telegram_id,
                    'username': user_data.get('username'),
                    'first_name': user_data.get('first_name'),
                    'last_name': user_data.get('last_name'),
                    'language_code': user_data.get('language_code', 'ar')
                }
                
                async with session.post(f"{API_BASE_URL}/auth/telegram-login", json=payload) as response:
                    if response.status == 200:
                        result = await response.json()
                        
                        # حفظ رمز الجلسة
                        if 'token' in result:
                            self.save_session_token(telegram_id, result['token'])
                            
                        # تحديث حالة التسجيل في قاعدة البيانات المحلية
                        conn = sqlite3.connect(self.db_path)
                        cursor = conn.cursor()
                        cursor.execute('''
                            UPDATE users SET is_registered = TRUE, registration_date = ?
                            WHERE telegram_id = ?
                        ''', (datetime.now(), telegram_id))
                        conn.commit()
                        conn.close()
                        
                        return True
                    else:
                        logger.error(f"فشل في تسجيل المستخدم مع API: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"خطأ في تسجيل المستخدم مع API: {e}")
            return False
            
    def save_session_token(self, telegram_id: int, token: str):
        """حفظ رمز الجلسة"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        expires_at = datetime.now() + timedelta(days=30)  # انتهاء الصلاحية بعد 30 يوم
        
        cursor.execute('''
            INSERT OR REPLACE INTO user_sessions 
            (telegram_id, session_token, created_at, expires_at)
            VALUES (?, ?, ?, ?)
        ''', (telegram_id, token, datetime.now(), expires_at))
        
        conn.commit()
        conn.close()
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /start"""
        user = update.effective_user
        telegram_id = user.id
        
        # حفظ بيانات المستخدم
        user_data = {
            'telegram_id': telegram_id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'language_code': user.language_code
        }
        self.save_user(user_data)
        
        # رسالة الترحيب
        welcome_message = f"""
🌟 مرحباً بك في SmartCoin! 🌟

أهلاً {user.first_name}! 👋

🚀 **SmartCoin** هي منصة العملات الرقمية المستقبلية بدعم رأس مال 350 مليون دولار!

💎 **ما يمكنك فعله:**
• 🔨 التعدين اليومي للحصول على عملات مجانية
• 🎯 إكمال المهام والحصول على مكافآت
• 🎰 تدوير عجلة الحظ
• 👥 دعوة الأصدقاء والحصول على مكافآت الإحالة
• 🛒 شراء حزم التعدين المتقدمة

🔗 **ابدأ رحلتك الآن:**
        """
        
        # إنشاء لوحة المفاتيح
        keyboard = [
            [InlineKeyboardButton("🚀 فتح SmartCoin", web_app=WebApp(url=WEBAPP_URL))],
            [InlineKeyboardButton("📊 إحصائياتي", callback_data="stats")],
            [InlineKeyboardButton("⚙️ الإعدادات", callback_data="settings")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(welcome_message, reply_markup=reply_markup)
        
        # تسجيل المستخدم مع API
        registration_success = await self.register_user_with_api(telegram_id, user_data)
        
        if registration_success:
            await update.message.reply_text("✅ تم تسجيل دخولك بنجاح! يمكنك الآن استخدام جميع ميزات SmartCoin.")
        else:
            await update.message.reply_text("⚠️ حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى لاحقاً.")
            
    async def login_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر تسجيل الدخول"""
        user = update.effective_user
        telegram_id = user.id
        
        # التحقق من حالة التسجيل
        user_data = self.get_user(telegram_id)
        
        if user_data and user_data.get('is_registered'):
            keyboard = [[InlineKeyboardButton("🚀 فتح SmartCoin", web_app=WebApp(url=WEBAPP_URL))]]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                "✅ أنت مسجل دخول بالفعل!\n\n🚀 اضغط على الزر أدناه لفتح SmartCoin:",
                reply_markup=reply_markup
            )
        else:
            # إعادة تسجيل المستخدم
            user_info = {
                'telegram_id': telegram_id,
                'username': user.username,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'language_code': user.language_code
            }
            
            registration_success = await self.register_user_with_api(telegram_id, user_info)
            
            if registration_success:
                keyboard = [[InlineKeyboardButton("🚀 فتح SmartCoin", web_app=WebApp(url=WEBAPP_URL))]]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    "✅ تم تسجيل دخولك بنجاح!\n\n🚀 اضغط على الزر أدناه لفتح SmartCoin:",
                    reply_markup=reply_markup
                )
            else:
                await update.message.reply_text("❌ فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.")
                
    async def logout_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر تسجيل الخروج"""
        telegram_id = update.effective_user.id
        
        # حذف رمز الجلسة
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        cursor.execute('DELETE FROM user_sessions WHERE telegram_id = ?', (telegram_id,))
        cursor.execute('UPDATE users SET is_registered = FALSE WHERE telegram_id = ?', (telegram_id,))
        conn.commit()
        conn.close()
        
        await update.message.reply_text("✅ تم تسجيل خروجك بنجاح!")
        
    async def stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """عرض إحصائيات المستخدم"""
        telegram_id = update.effective_user.id
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{API_BASE_URL}/users/{telegram_id}/stats") as response:
                    if response.status == 200:
                        stats = await response.json()
                        
                        stats_message = f"""
📊 **إحصائياتك في SmartCoin:**

💰 **الرصيد:** {stats.get('balance', 0)} SM
🔨 **مرات التعدين:** {stats.get('mining_count', 0)}
🎯 **المهام المكتملة:** {stats.get('completed_tasks', 0)}
👥 **الإحالات:** {stats.get('referrals', 0)}
🏆 **المستوى:** {stats.get('level', 1)}
                        """
                        
                        await update.message.reply_text(stats_message)
                    else:
                        await update.message.reply_text("❌ لا يمكن الحصول على الإحصائيات حالياً.")
                        
        except Exception as e:
            logger.error(f"خطأ في جلب الإحصائيات: {e}")
            await update.message.reply_text("❌ حدث خطأ في جلب الإحصائيات.")
            
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الأزرار التفاعلية"""
        query = update.callback_query
        await query.answer()
        
        if query.data == "stats":
            await self.stats_command(update, context)
        elif query.data == "settings":
            await self.settings_menu(update, context)
            
    async def settings_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """قائمة الإعدادات"""
        keyboard = [
            [InlineKeyboardButton("🔔 إعدادات الإشعارات", callback_data="notification_settings")],
            [InlineKeyboardButton("🌐 تغيير اللغة", callback_data="language_settings")],
            [InlineKeyboardButton("🔙 العودة", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.callback_query.edit_message_text(
            "⚙️ **إعدادات SmartCoin:**\n\nاختر الإعداد الذي تريد تعديله:",
            reply_markup=reply_markup
        )
        
    async def send_notification(self, telegram_id: int, message: str, notification_type: str = "general"):
        """إرسال إشعار للمستخدم مع التحكم في التكرار"""
        
        # التحقق من إعدادات الإشعارات للمستخدم
        user = self.get_user(telegram_id)
        if not user:
            return False
            
        try:
            notification_settings = json.loads(user.get('notification_settings', '{}'))
            if not notification_settings.get(notification_type, True):
                return False  # الإشعارات مغلقة لهذا النوع
        except:
            pass
            
        # التحكم في تكرار الإشعارات (throttling)
        now = datetime.now()
        throttle_key = f"{telegram_id}_{notification_type}"
        
        if throttle_key in self.notification_throttle:
            last_sent = self.notification_throttle[throttle_key]
            if now - last_sent < timedelta(minutes=5):  # منع الإرسال أكثر من مرة كل 5 دقائق
                return False
                
        try:
            # إرسال الإشعار
            application = Application.builder().token(BOT_TOKEN).build()
            await application.bot.send_message(chat_id=telegram_id, text=message)
            
            # تحديث وقت آخر إرسال
            self.notification_throttle[throttle_key] = now
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في إرسال الإشعار للمستخدم {telegram_id}: {e}")
            return False
            
    async def send_mining_notification(self, telegram_id: int, amount: float):
        """إرسال إشعار التعدين"""
        message = f"🔨 **تم التعدين بنجاح!**\n\n💰 حصلت على {amount} عملة SM\n\n🚀 استمر في التعدين يومياً للحصول على المزيد!"
        await self.send_notification(telegram_id, message, "mining")
        
    async def send_referral_notification(self, telegram_id: int, referral_name: str, bonus: float):
        """إرسال إشعار الإحالة"""
        message = f"👥 **إحالة جديدة!**\n\n🎉 انضم {referral_name} عبر رابط الإحالة الخاص بك\n💰 حصلت على {bonus} عملة SM كمكافأة\n\n🔗 شارك رابطك مع المزيد من الأصدقاء!"
        await self.send_notification(telegram_id, message, "referrals")
        
    async def send_task_completion_notification(self, telegram_id: int, task_name: str, reward: float):
        """إرسال إشعار إكمال المهمة"""
        message = f"🎯 **مهمة مكتملة!**\n\n✅ أكملت مهمة: {task_name}\n💰 حصلت على {reward} عملة SM\n\n🏆 تابع إكمال المهام للحصول على المزيد من المكافآت!"
        await self.send_notification(telegram_id, message, "tasks")
        
    def run(self):
        """تشغيل البوت"""
        application = Application.builder().token(BOT_TOKEN).build()
        
        # إضافة معالجات الأوامر
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(CommandHandler("login", self.login_command))
        application.add_handler(CommandHandler("logout", self.logout_command))
        application.add_handler(CommandHandler("stats", self.stats_command))
        application.add_handler(CallbackQueryHandler(self.button_callback))
        
        # معالج الرسائل العامة
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        logger.info("🤖 بدء تشغيل بوت SmartCoin...")
        application.run_polling()
        
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الرسائل العامة"""
        message_text = update.message.text.lower()
        
        if "مساعدة" in message_text or "help" in message_text:
            help_message = """
🆘 **مساعدة SmartCoin:**

📋 **الأوامر المتاحة:**
• `/start` - بدء استخدام البوت
• `/login` - تسجيل الدخول
• `/logout` - تسجيل الخروج
• `/stats` - عرض الإحصائيات

🚀 **للوصول إلى التطبيق:**
استخدم الزر "فتح SmartCoin" أو الأمر `/start`

💬 **للدعم:**
تواصل معنا عبر قناة الدعم الفني
            """
            await update.message.reply_text(help_message)
        else:
            await update.message.reply_text("👋 مرحباً! استخدم الأمر /start للبدء أو /help للمساعدة.")

# دالة لإرسال الإشعارات من خارج البوت
async def send_external_notification(telegram_id: int, message: str, notification_type: str = "general"):
    """دالة لإرسال الإشعارات من API خارجي"""
    bot = SmartCoinBot()
    return await bot.send_notification(telegram_id, message, notification_type)

if __name__ == "__main__":
    bot = SmartCoinBot()
    bot.run()

