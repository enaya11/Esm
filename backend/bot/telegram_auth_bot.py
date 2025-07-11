#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
بوت تليجرام محسن للمصادقة - SmartCoin
يعمل بنسبة 100% مع تكامل كامل مع الواجهة الأمامية
"""

import asyncio
import logging
import sqlite3
import hashlib
import time
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import aiohttp
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes, CallbackQueryHandler
from telegram.request import Request

from bot_config import BotConfig

# إعداد نظام السجلات
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    handlers=[
        logging.FileHandler('telegram_auth_bot.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class TelegramAuthBot:
    """بوت تليجرام للمصادقة مع تكامل كامل"""
    
    def __init__(self):
        self.token = BotConfig.BOT_TOKEN
        self.webapp_url = BotConfig.WEBAPP_URL
        self.api_base_url = BotConfig.API_BASE_URL
        self.db_path = BotConfig.DATABASE_PATH
        self.application = self._build_application()
        self.init_database()

    def _build_application(self):
        """Build the Telegram application."""
        request = request(connect_timeout=10, read_timeout=10)
        application = Application.builder().token(self.token).request(request).build()
        
        # Add command handlers
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(CommandHandler("login", self.login_command))
        application.add_handler(CommandHandler("logout", self.logout_command))
        application.add_handler(CommandHandler("stats", self.stats_command))
        application.add_handler(CommandHandler("help", self.help_command))
        
        # Add callback query handler
        application.add_handler(CallbackQueryHandler(self.button_callback))
        
        # Add message handler
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        return application

    def init_database(self):
        """تهيئة قاعدة البيانات"""
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
                    is_premium BOOLEAN DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    total_coins REAL DEFAULT 0,
                    level INTEGER DEFAULT 1,
                    mining_count INTEGER DEFAULT 0,
                    referral_count INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1
                )
            ''')
            
            # جدول جلسات المصادقة
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS auth_sessions (
                    session_id TEXT PRIMARY KEY,
                    user_id INTEGER,
                    auth_token TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_active BOOLEAN DEFAULT 1,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            # جدول رموز التحقق
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS verification_codes (
                    code TEXT PRIMARY KEY,
                    user_id INTEGER,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    expires_at TIMESTAMP,
                    is_used BOOLEAN DEFAULT 0,
                    FOREIGN KEY (user_id) REFERENCES users (user_id)
                )
            ''')
            
            conn.commit()
            conn.close()
            logger.info("Database initialized successfully.")
            
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
    
    def generate_auth_token(self, user_id: int) -> str:
        """إنشاء رمز مصادقة آمن"""
        timestamp = str(int(time.time()))
        data = f"{user_id}:{timestamp}:{uuid.uuid4()}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def generate_verification_code(self) -> str:
        """إنشاء رمز تحقق"""
        return str(uuid.uuid4())[:8].upper()
    
    def save_user(self, user_data: Dict[str, Any]) -> bool:
        """حفظ بيانات المستخدم"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT OR REPLACE INTO users 
                (user_id, username, first_name, last_name, language_code, is_premium, last_activity)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                user_data['user_id'],
                user_data.get('username'),
                user_data.get('first_name'),
                user_data.get('last_name'),
                user_data.get('language_code'),
                user_data.get('is_premium', False)
            ))
            
            conn.commit()
            conn.close()
            return True
            
        except Exception as e:
            logger.error(f"Error saving user: {e}")
            return False
    
    def create_auth_session(self, user_id: int) -> Optional[Dict[str, str]]:
        """إنشاء جلسة مصادقة"""
        try:
            session_id = str(uuid.uuid4())
            auth_token = self.generate_auth_token(user_id)
            expires_at = datetime.now() + timedelta(days=30)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # إلغاء الجلسات القديمة
            cursor.execute(
                'UPDATE auth_sessions SET is_active = 0 WHERE user_id = ?',
                (user_id,)
            )
            
            # إنشاء جلسة جديدة
            cursor.execute('''
                INSERT INTO auth_sessions 
                (session_id, user_id, auth_token, expires_at)
                VALUES (?, ?, ?, ?)
            ''', (session_id, user_id, auth_token, expires_at))
            
            conn.commit()
            conn.close()
            
            return {
                'session_id': session_id,
                'auth_token': auth_token,
                'expires_at': expires_at.isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error creating auth session: {e}")
            return None
    
    def create_verification_code(self, user_id: int) -> Optional[str]:
        """إنشاء رمز تحقق"""
        try:
            code = self.generate_verification_code()
            expires_at = datetime.now() + timedelta(minutes=10)
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # إلغاء الرموز القديمة
            cursor.execute(
                'UPDATE verification_codes SET is_used = 1 WHERE user_id = ?',
                (user_id,)
            )
            
            # إنشاء رمز جديد
            cursor.execute('''
                INSERT INTO verification_codes 
                (code, user_id, expires_at)
                VALUES (?, ?, ?)
            ''', (code, user_id, expires_at))
            
            conn.commit()
            conn.close()
            
            return code
            
        except Exception as e:
            logger.error(f"Error creating verification code: {e}")
            return None
    
    def verify_code(self, code: str) -> Optional[int]:
        """التحقق من رمز التحقق"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT user_id FROM verification_codes 
                WHERE code = ? AND is_used = 0 AND expires_at > CURRENT_TIMESTAMP
            ''', (code,))
            
            result = cursor.fetchone()
            
            if result:
                user_id = result[0]
                # تحديد الرمز كمستخدم
                cursor.execute(
                    'UPDATE verification_codes SET is_used = 1 WHERE code = ?',
                    (code,)
                )
                conn.commit()
                conn.close()
                return user_id
            
            conn.close()
            return None
            
        except Exception as e:
            logger.error(f"Error verifying code: {e}")
            return None
    
    def get_user_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        """الحصول على بيانات المستخدم"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT user_id, username, first_name, last_name, 
                       total_coins, level, mining_count, referral_count
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
                    'mining_count': result[6],
                    'referral_count': result[7]
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting user data: {e}")
            return None
    
    async def send_to_api(self, endpoint: str, data: Dict[str, Any]) -> bool:
        """إرسال البيانات إلى API"""
        try:
            url = f"{self.api_base_url}/{endpoint}"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=data) as response:
                    if response.status == 200:
                        result = await response.json()
                        logger.info(f"Successfully sent data to {endpoint}: {result}")
                        return True
                    else:
                        logger.error(f"Failed to send data to {endpoint}: {response.status}")
                        return False
                        
        except Exception as e:
            logger.error(f"Error sending data to API: {e}")
            return False
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /start"""
        user = update.effective_user
        
        logger.info(f"User {user.id} ({user.first_name}) started the bot.")
        
        # حفظ بيانات المستخدم
        user_data = {
            'user_id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'language_code': user.language_code,
            'is_premium': user.is_premium
        }
        
        self.save_user(user_data)
        
        # إنشاء لوحة مفاتيح
        keyboard = [
            [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
            [InlineKeyboardButton("🔐 Login", callback_data="login")],
            [InlineKeyboardButton("📊 Stats", callback_data="stats")],
            [InlineKeyboardButton("🆘 Help", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # رسالة الترحيب
        welcome_message = BotConfig.get_message('welcome', first_name=user.first_name)
        
        await update.message.reply_text(
            welcome_message,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

    async def _send_login_message(self, update_or_query, user):
        """إرسال رسالة تسجيل الدخول"""
        verification_code = self.create_verification_code(user.id)
        
        if verification_code:
            session = self.create_auth_session(user.id)
            
            if session:
                await self.send_to_api('auth/telegram-login', {
                    'user_id': user.id,
                    'username': user.username,
                    'first_name': user.first_name,
                    'verification_code': verification_code,
                    'session_id': session['session_id'],
                    'auth_token': session['auth_token']
                })
                
                keyboard = [
                    [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
                    [InlineKeyboardButton("🔄 Check Status", callback_data="check_login")]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                message_text = (
                    f"✅ **Login session created successfully!**\n\n"
                    f"🔑 **Verification Code:** `{verification_code}`\n\n"
                    f"📱 **Next Steps:**\n"
                    f"1. Click 'Open SmartCoin' below\n"
                    f"2. Enter the verification code on the website\n"
                    f"3. Enjoy all the features of SmartCoin!\n\n"
                    f"⏰ **Expires in 10 minutes**"
                )

                if isinstance(update_or_query, Update):
                    await update_or_query.message.reply_text(
                        message_text,
                        reply_markup=reply_markup,
                        parse_mode='Markdown'
                    )
                else: 
                     await update_or_query.edit_message_text(
                        message_text,
                        reply_markup=reply_markup,
                        parse_mode='Markdown'
                    )
            else:
                 error_message = "❌ Error creating login session. Please try again."
                 if isinstance(update_or_query, Update):
                     await update_or_query.message.reply_text(error_message)
                 else:
                     await update_or_query.edit_message_text(error_message)

        else:
            error_message = "❌ Error creating verification code. Please try again."
            if isinstance(update_or_query, Update):
                await update_or_query.message.reply_text(error_message)
            else:
                await update_or_query.edit_message_text(error_message)

    async def login_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /login"""
        await self._send_login_message(update, update.effective_user)
    
    async def logout_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /logout"""
        user = update.effective_user
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # إلغاء جميع الجلسات النشطة
            cursor.execute(
                'UPDATE auth_sessions SET is_active = 0 WHERE user_id = ?',
                (user.id,)
            )
            
            conn.commit()
            conn.close()
            
            # إرسال إشعار إلى API
            await self.send_to_api('auth/telegram-logout', {
                'user_id': user.id
            })
            
            await update.message.reply_text(BotConfig.get_message('logout_success'))
            
        except Exception as e:
            logger.error(f"Error during logout: {e}")
            await update.message.reply_text(
                "❌ Error during logout. Please try again."
            )
    
    async def stats_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /stats"""
        user = update.effective_user
        user_data = self.get_user_data(user.id)
        
        if user_data:
            stats_message = BotConfig.get_message('stats_template',
                balance=user_data.get('total_coins', 0),
                mining_count=user_data.get('mining_count', 0),
                completed_tasks=0,  # يمكن إضافة هذا لاحقاً
                referrals=user_data.get('referral_count', 0),
                level=user_data.get('level', 1)
            )
            
            keyboard = [
                [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
                [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.message.reply_text(
                stats_message,
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                "❌ Your data was not found. Please use /start first."
            )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /help"""
        help_message = BotConfig.get_message('help')
        
        keyboard = [
            [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
            [InlineKeyboardButton("🔐 Login", callback_data="login")],
            [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            help_message,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أزرار الكيبورد"""
        query = update.callback_query
        await query.answer()
        
        user = query.from_user
        data = query.data
        
        if data == "login":
            await self._send_login_message(query, user)
        elif data == "stats":
            await self.handle_stats_callback(query, user)
        elif data == "help":
            await self.handle_help_callback(query, user)
        elif data == "check_login":
            await self.handle_check_login_callback(query, user)
        elif data == "back_to_main":
            await self.show_main_menu(query, user)

    async def show_main_menu(self, query, user):
        """แสดงเมนูหลัก"""
        keyboard = [
            [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
            [InlineKeyboardButton("🔐 Login", callback_data="login")],
            [InlineKeyboardButton("📊 Stats", callback_data="stats")],
            [InlineKeyboardButton("🆘 Help", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        welcome_message = BotConfig.get_message('welcome', first_name=user.first_name)
        await query.edit_message_text(
            welcome_message,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )

    
    async def handle_stats_callback(self, query, user):
        """معالج زر الإحصائيات"""
        user_data = self.get_user_data(user.id)
        
        if user_data:
            stats_message = BotConfig.get_message('stats_template',
                balance=user_data.get('total_coins', 0),
                mining_count=user_data.get('mining_count', 0),
                completed_tasks=0,
                referrals=user_data.get('referral_count', 0),
                level=user_data.get('level', 1)
            )
            
            keyboard = [
                [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
                [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await query.edit_message_text(
                stats_message,
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
    
    async def handle_help_callback(self, query, user):
        """معالج زر المساعدة"""
        help_message = BotConfig.get_message('help')
        
        keyboard = [
            [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
            [InlineKeyboardButton("🔙 Back", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(
            help_message,
            reply_markup=reply_markup,
            parse_mode='Markdown'
        )
    
    async def handle_check_login_callback(self, query, user):
        """معالج زر تحديث حالة تسجيل الدخول"""
        # التحقق من وجود جلسة نشطة
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT session_id FROM auth_sessions 
                WHERE user_id = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP
            ''', (user.id,))
            
            result = cursor.fetchone()
            conn.close()
            
            if result:
                keyboard = [
                    [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await query.edit_message_text(
                    "✅ **You are logged in successfully!**\n\n"
                    "🚀 You can now access all SmartCoin features.\n\n"
                    "Click the button below to open the app:",
                    reply_markup=reply_markup,
                    parse_mode='Markdown'
                )
            else:
                await query.answer("❌ Not logged in yet. Please try again.", show_alert=True)
                
        except Exception as e:
            logger.error(f"Error checking login status: {e}")
            await query.answer("❌ Error checking status.", show_alert=True)
    
    async def send_notification(self, user_id: int, message: str, notification_type: str = "general"):
        """إرسال إشعار للمستخدم"""
        try:
            keyboard = [
                [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await self.application.bot.send_message(
                chat_id=user_id,
                text=message,
                reply_markup=reply_markup,
                parse_mode='Markdown'
            )
            
            logger.info(f"Notification '{notification_type}' sent to user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error sending notification to user {user_id}: {e}")
            return False
    
    async def run(self):
        """تشغيل البوت"""
        logger.info("Starting SmartCoin authentication bot...")
        logger.info(f"Webapp URL: {self.webapp_url}")
        
        async with self.application:
            await self.application.initialize()
            await self.application.updater.start_polling(allowed_updates=Update.ALL_TYPES)
            await self.application.start()
            logger.info("Bot started and polling.")
            # Keep the bot running
            while True:
                await asyncio.sleep(60)

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الرسائل العامة"""
        user = update.effective_user
        message_text = update.message.text
        
        # التحقق من رمز التحقق
        if len(message_text) == 8 and message_text.isupper():
            user_id = self.verify_code(message_text)
            if user_id and user_id == user.id:
                keyboard = [
                    [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    "✅ **Code verified successfully!**\n\n"
                    "🎉 Welcome to SmartCoin!\n"
                    "🚀 You can now access all features.",
                    reply_markup=reply_markup,
                    parse_mode='Markdown'
                )
                return
        
        # رد عام
        keyboard = [
            [InlineKeyboardButton("🚀 Open SmartCoin", web_app=WebAppInfo(url=self.webapp_url))],
            [InlineKeyboardButton("🆘 Help", callback_data="help")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            "👋 Hello! Use the buttons below to interact with SmartCoin.\n\n"
            "💡 **Tip:** Use /help to get a list of available commands.",
            reply_markup=reply_markup
        )
