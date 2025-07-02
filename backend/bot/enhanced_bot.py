#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
بوت SmartCoin المحسن مع نظام الإشعارات المتقدم
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

# استيراد الوحدات المحلية
from bot_config import BotConfig
from notification_service import NotificationService
from notification_scheduler import NotificationScheduler, NotificationPriority
from api_integration import APIIntegration

# إعداد التسجيل
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class EnhancedSmartCoinBot:
    """بوت SmartCoin المحسن"""
    
    def __init__(self):
        self.db_path = BotConfig.DATABASE_PATH
        self.notification_service = NotificationService()
        self.notification_scheduler = NotificationScheduler()
        self.api_integration = None
        self.init_database()
        
    def init_database(self):
        """إنشاء قاعدة بيانات المستخدمين المحسنة"""
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
                notification_settings TEXT DEFAULT '{"mining": true, "referrals": true, "tasks": true, "reminders": true}',
                mining_streak INTEGER DEFAULT 0,
                last_mining_date DATE,
                total_earnings REAL DEFAULT 0,
                referral_count INTEGER DEFAULT 0,
                completed_tasks INTEGER DEFAULT 0,
                user_level INTEGER DEFAULT 1,
                preferences TEXT DEFAULT '{}'
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
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                telegram_id INTEGER,
                interaction_type TEXT,
                interaction_data TEXT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (telegram_id) REFERENCES users (telegram_id)
            )
        ''')
        
        conn.commit()
        conn.close()
        
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج أمر /start المحسن"""
        user = update.effective_user
        telegram_id = user.id
        
        # تسجيل التفاعل
        await self.log_interaction(telegram_id, 'start_command', {'user_data': user.to_dict()})
        
        # حفظ أو تحديث بيانات المستخدم
        user_data = {
            'telegram_id': telegram_id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'language_code': user.language_code
        }
        
        is_new_user = await self.save_user(user_data)
        
        # رسالة الترحيب
        if is_new_user:
            welcome_message = BotConfig.get_message('welcome', first_name=user.first_name)
            # جدولة رسالة ترحيب متأخرة
            self.notification_scheduler.schedule_notification(
                telegram_id,
                'daily_reminder',
                datetime.now() + timedelta(hours=24),
                priority=NotificationPriority.LOW
            )
        else:
            welcome_message = f"مرحباً بعودتك {user.first_name}! 👋\n\n🚀 استمر في رحلتك مع SmartCoin"
            
        # إنشاء لوحة المفاتيح
        keyboard = [
            [InlineKeyboardButton("🚀 فتح SmartCoin", web_app=WebApp(url=BotConfig.WEBAPP_URL))],
            [
                InlineKeyboardButton("📊 إحصائياتي", callback_data="stats"),
                InlineKeyboardButton("⚙️ الإعدادات", callback_data="settings")
            ],
            [
                InlineKeyboardButton("🔨 تعدين سريع", callback_data="quick_mining"),
                InlineKeyboardButton("🎯 المهام", callback_data="tasks")
            ]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(welcome_message, reply_markup=reply_markup)
        
        # تسجيل المستخدم مع API إذا كان جديد
        if is_new_user:
            async with APIIntegration() as api:
                registration_result = await api.register_user(user_data)
                
                if registration_result.get('success'):
                    await update.message.reply_text("✅ تم تسجيل دخولك بنجاح! يمكنك الآن استخدام جميع ميزات SmartCoin.")
                    
                    # جدولة إشعار ترحيب متأخر
                    self.notification_scheduler.schedule_notification(
                        telegram_id,
                        'daily_reminder',
                        datetime.now() + timedelta(hours=2),
                        {'first_name': user.first_name},
                        NotificationPriority.LOW
                    )
                else:
                    await update.message.reply_text("⚠️ حدث خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى لاحقاً.")
                    
    async def button_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الأزرار التفاعلية المحسن"""
        query = update.callback_query
        await query.answer()
        
        telegram_id = query.from_user.id
        callback_data = query.data
        
        # تسجيل التفاعل
        await self.log_interaction(telegram_id, 'button_click', {'callback_data': callback_data})
        
        if callback_data == "stats":
            await self.show_user_stats(update, context)
        elif callback_data == "settings":
            await self.show_settings_menu(update, context)
        elif callback_data == "quick_mining":
            await self.quick_mining(update, context)
        elif callback_data == "tasks":
            await self.show_tasks_menu(update, context)
        elif callback_data.startswith("setting_"):
            await self.handle_setting_change(update, context, callback_data)
        elif callback_data.startswith("task_"):
            await self.handle_task_action(update, context, callback_data)
            
    async def show_user_stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """عرض إحصائيات المستخدم المحسنة"""
        telegram_id = update.effective_user.id
        
        try:
            # الحصول على الإحصائيات من API
            async with APIIntegration() as api:
                stats = await api.get_user_stats(telegram_id)
                
            # الحصول على بيانات إضافية من قاعدة البيانات المحلية
            local_stats = await self.get_local_user_stats(telegram_id)
            
            # دمج الإحصائيات
            combined_stats = {**stats, **local_stats}
            
            stats_message = BotConfig.get_message('stats_template', **combined_stats)
            
            # إضافة معلومات إضافية
            stats_message += f"\n🔥 **سلسلة التعدين:** {local_stats.get('mining_streak', 0)} يوم"
            stats_message += f"\n📅 **آخر نشاط:** {local_stats.get('last_activity', 'غير محدد')}"
            
            keyboard = [
                [InlineKeyboardButton("🔄 تحديث", callback_data="stats")],
                [InlineKeyboardButton("🔙 العودة", callback_data="back_to_main")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            await update.callback_query.edit_message_text(stats_message, reply_markup=reply_markup)
            
        except Exception as e:
            logger.error(f"خطأ في عرض الإحصائيات: {e}")
            await update.callback_query.edit_message_text("❌ حدث خطأ في جلب الإحصائيات.")
            
    async def show_settings_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """قائمة الإعدادات المحسنة"""
        telegram_id = update.effective_user.id
        
        # الحصول على إعدادات المستخدم الحالية
        user_settings = await self.get_user_settings(telegram_id)
        
        settings_message = "⚙️ **إعدادات SmartCoin:**\n\n"
        settings_message += "🔔 **إعدادات الإشعارات:**\n"
        
        for setting, enabled in user_settings.get('notifications', {}).items():
            status = "✅" if enabled else "❌"
            settings_message += f"{status} {self.get_setting_name(setting)}\n"
            
        keyboard = [
            [InlineKeyboardButton("🔔 إعدادات الإشعارات", callback_data="setting_notifications")],
            [InlineKeyboardButton("🌐 تغيير اللغة", callback_data="setting_language")],
            [InlineKeyboardButton("⏰ ساعات الهدوء", callback_data="setting_quiet_hours")],
            [InlineKeyboardButton("🔙 العودة", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.callback_query.edit_message_text(settings_message, reply_markup=reply_markup)
        
    async def quick_mining(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """تعدين سريع"""
        telegram_id = update.effective_user.id
        
        try:
            # التحقق من إمكانية التعدين
            can_mine = await self.check_mining_eligibility(telegram_id)
            
            if not can_mine['eligible']:
                await update.callback_query.edit_message_text(
                    f"⏰ {can_mine['message']}\n\n🔄 يمكنك التعدين مرة أخرى بعد {can_mine['time_remaining']}"
                )
                return
                
            # تنفيذ التعدين عبر API
            async with APIIntegration() as api:
                mining_result = await api.process_mining(telegram_id)
                
            if mining_result.get('success'):
                amount = mining_result.get('amount', 0)
                
                # تحديث الإحصائيات المحلية
                await self.update_mining_stats(telegram_id, amount)
                
                # إرسال إشعار فوري
                success_message = f"🔨 **تم التعدين بنجاح!**\n\n💰 حصلت على {amount} عملة SM\n\n🚀 استمر في التعدين يومياً للحصول على المزيد!"
                
                keyboard = [
                    [InlineKeyboardButton("📊 عرض الإحصائيات", callback_data="stats")],
                    [InlineKeyboardButton("🔙 العودة", callback_data="back_to_main")]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.callback_query.edit_message_text(success_message, reply_markup=reply_markup)
                
                # جدولة تذكير للتعدين التالي
                self.notification_scheduler.schedule_notification(
                    telegram_id,
                    'daily_reminder',
                    datetime.now() + timedelta(hours=24),
                    priority=NotificationPriority.LOW
                )
                
            else:
                await update.callback_query.edit_message_text(
                    f"❌ فشل في التعدين: {mining_result.get('error', 'خطأ غير معروف')}"
                )
                
        except Exception as e:
            logger.error(f"خطأ في التعدين السريع: {e}")
            await update.callback_query.edit_message_text("❌ حدث خطأ في التعدين. يرجى المحاولة مرة أخرى.")
            
    async def show_tasks_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """عرض قائمة المهام"""
        tasks_message = "🎯 **مهام SmartCoin:**\n\n"
        tasks_message += "📋 **المهام المتاحة:**\n"
        tasks_message += "• 📱 انضم إلى قناة التليجرام (+20 SM)\n"
        tasks_message += "• 🐦 تابعنا على تويتر (+15 SM)\n"
        tasks_message += "• 📺 اشترك في اليوتيوب (+25 SM)\n"
        tasks_message += "• 👥 ادع 3 أصدقاء (+50 SM)\n\n"
        tasks_message += "💡 **نصيحة:** أكمل المهام للحصول على مكافآت إضافية!"
        
        keyboard = [
            [InlineKeyboardButton("📱 انضم للقناة", callback_data="task_telegram")],
            [InlineKeyboardButton("🐦 تابع تويتر", callback_data="task_twitter")],
            [InlineKeyboardButton("📺 اشترك يوتيوب", callback_data="task_youtube")],
            [InlineKeyboardButton("👥 دعوة الأصدقاء", callback_data="task_referral")],
            [InlineKeyboardButton("🔙 العودة", callback_data="back_to_main")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.callback_query.edit_message_text(tasks_message, reply_markup=reply_markup)
        
    async def handle_task_action(self, update: Update, context: ContextTypes.DEFAULT_TYPE, callback_data: str):
        """معالجة إجراءات المهام"""
        telegram_id = update.effective_user.id
        task_type = callback_data.replace("task_", "")
        
        task_info = {
            'telegram': {'name': 'انضمام للقناة', 'reward': 20, 'url': 'https://t.me/smartcoin_official'},
            'twitter': {'name': 'متابعة تويتر', 'reward': 15, 'url': 'https://twitter.com/smartcoin_official'},
            'youtube': {'name': 'اشتراك يوتيوب', 'reward': 25, 'url': 'https://youtube.com/@smartcoin'},
            'referral': {'name': 'دعوة الأصدقاء', 'reward': 50, 'url': None}
        }
        
        if task_type in task_info:
            task = task_info[task_type]
            
            if task_type == 'referral':
                # عرض رابط الإحالة
                async with APIIntegration() as api:
                    referral_link = await api.get_referral_link(telegram_id)
                    
                if referral_link:
                    message = f"👥 **دعوة الأصدقاء**\n\n🔗 **رابط الإحالة الخاص بك:**\n{referral_link}\n\n💰 احصل على {task['reward']} SM لكل صديق ينضم!"
                else:
                    message = "❌ لا يمكن الحصول على رابط الإحالة حالياً."
                    
                keyboard = [
                    [InlineKeyboardButton("🔙 العودة للمهام", callback_data="tasks")]
                ]
            else:
                # مهام خارجية
                message = f"🎯 **{task['name']}**\n\n💰 المكافأة: {task['reward']} SM\n\n📋 **الخطوات:**\n1. اضغط على الرابط أدناه\n2. أكمل المطلوب\n3. ارجع واضغط 'تأكيد الإكمال'"
                
                keyboard = [
                    [InlineKeyboardButton("🔗 فتح الرابط", url=task['url'])],
                    [InlineKeyboardButton("✅ تأكيد الإكمال", callback_data=f"confirm_task_{task_type}")],
                    [InlineKeyboardButton("🔙 العودة للمهام", callback_data="tasks")]
                ]
                
            reply_markup = InlineKeyboardMarkup(keyboard)
            await update.callback_query.edit_message_text(message, reply_markup=reply_markup)
            
    async def save_user(self, user_data: Dict) -> bool:
        """حفظ أو تحديث بيانات المستخدم"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # التحقق من وجود المستخدم
        cursor.execute('SELECT telegram_id FROM users WHERE telegram_id = ?', (user_data['telegram_id'],))
        existing_user = cursor.fetchone()
        
        is_new_user = existing_user is None
        
        if is_new_user:
            cursor.execute('''
                INSERT INTO users 
                (telegram_id, username, first_name, last_name, language_code, registration_date, last_activity)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                user_data['telegram_id'],
                user_data.get('username'),
                user_data.get('first_name'),
                user_data.get('last_name'),
                user_data.get('language_code'),
                datetime.now(),
                datetime.now()
            ))
        else:
            cursor.execute('''
                UPDATE users SET 
                username = ?, first_name = ?, last_name = ?, language_code = ?, last_activity = ?
                WHERE telegram_id = ?
            ''', (
                user_data.get('username'),
                user_data.get('first_name'),
                user_data.get('last_name'),
                user_data.get('language_code'),
                datetime.now(),
                user_data['telegram_id']
            ))
            
        conn.commit()
        conn.close()
        
        return is_new_user
        
    async def log_interaction(self, telegram_id: int, interaction_type: str, interaction_data: Dict):
        """تسجيل تفاعل المستخدم"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO user_interactions 
                (telegram_id, interaction_type, interaction_data)
                VALUES (?, ?, ?)
            ''', (telegram_id, interaction_type, json.dumps(interaction_data)))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"خطأ في تسجيل التفاعل: {e}")
            
    async def get_local_user_stats(self, telegram_id: int) -> Dict:
        """الحصول على الإحصائيات المحلية للمستخدم"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT mining_streak, last_mining_date, total_earnings, 
                       referral_count, completed_tasks, user_level, last_activity
                FROM users WHERE telegram_id = ?
            ''', (telegram_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return {
                    'mining_streak': row[0] or 0,
                    'last_mining_date': row[1],
                    'total_earnings': row[2] or 0,
                    'referral_count': row[3] or 0,
                    'completed_tasks': row[4] or 0,
                    'user_level': row[5] or 1,
                    'last_activity': row[6]
                }
            else:
                return {}
                
        except Exception as e:
            logger.error(f"خطأ في الحصول على الإحصائيات المحلية: {e}")
            return {}
            
    async def get_user_settings(self, telegram_id: int) -> Dict:
        """الحصول على إعدادات المستخدم"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT notification_settings, preferences 
                FROM users WHERE telegram_id = ?
            ''', (telegram_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                notifications = json.loads(row[0]) if row[0] else {}
                preferences = json.loads(row[1]) if row[1] else {}
                
                return {
                    'notifications': notifications,
                    'preferences': preferences
                }
            else:
                return {
                    'notifications': {'mining': True, 'referrals': True, 'tasks': True, 'reminders': True},
                    'preferences': {}
                }
                
        except Exception as e:
            logger.error(f"خطأ في الحصول على إعدادات المستخدم: {e}")
            return {}
            
    def get_setting_name(self, setting: str) -> str:
        """الحصول على اسم الإعداد بالعربية"""
        names = {
            'mining': 'إشعارات التعدين',
            'referrals': 'إشعارات الإحالات',
            'tasks': 'إشعارات المهام',
            'reminders': 'التذكيرات اليومية'
        }
        return names.get(setting, setting)
        
    async def check_mining_eligibility(self, telegram_id: int) -> Dict:
        """التحقق من أهلية التعدين"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT last_mining_date FROM users WHERE telegram_id = ?
            ''', (telegram_id,))
            
            row = cursor.fetchone()
            conn.close()
            
            if not row or not row[0]:
                return {'eligible': True, 'message': 'يمكنك التعدين الآن'}
                
            last_mining = datetime.strptime(row[0], '%Y-%m-%d').date()
            today = datetime.now().date()
            
            if last_mining < today:
                return {'eligible': True, 'message': 'يمكنك التعدين الآن'}
            else:
                next_mining = datetime.combine(today + timedelta(days=1), datetime.min.time())
                time_remaining = next_mining - datetime.now()
                hours = int(time_remaining.total_seconds() // 3600)
                minutes = int((time_remaining.total_seconds() % 3600) // 60)
                
                return {
                    'eligible': False,
                    'message': 'لقد قمت بالتعدين اليوم بالفعل',
                    'time_remaining': f"{hours} ساعة و {minutes} دقيقة"
                }
                
        except Exception as e:
            logger.error(f"خطأ في التحقق من أهلية التعدين: {e}")
            return {'eligible': False, 'message': 'حدث خطأ في التحقق'}
            
    async def update_mining_stats(self, telegram_id: int, amount: float):
        """تحديث إحصائيات التعدين"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            today = datetime.now().date()
            
            # الحصول على البيانات الحالية
            cursor.execute('''
                SELECT mining_streak, last_mining_date, total_earnings 
                FROM users WHERE telegram_id = ?
            ''', (telegram_id,))
            
            row = cursor.fetchone()
            
            if row:
                current_streak = row[0] or 0
                last_mining_date = row[1]
                total_earnings = row[2] or 0
                
                # حساب السلسلة الجديدة
                if last_mining_date:
                    last_date = datetime.strptime(last_mining_date, '%Y-%m-%d').date()
                    if last_date == today - timedelta(days=1):
                        new_streak = current_streak + 1
                    elif last_date == today:
                        new_streak = current_streak  # نفس اليوم
                    else:
                        new_streak = 1  # انقطعت السلسلة
                else:
                    new_streak = 1
                    
                # تحديث البيانات
                cursor.execute('''
                    UPDATE users SET 
                    mining_streak = ?, last_mining_date = ?, total_earnings = ?
                    WHERE telegram_id = ?
                ''', (new_streak, today.strftime('%Y-%m-%d'), total_earnings + amount, telegram_id))
                
                conn.commit()
                
            conn.close()
            
        except Exception as e:
            logger.error(f"خطأ في تحديث إحصائيات التعدين: {e}")
            
    def run(self):
        """تشغيل البوت المحسن"""
        # بدء جدولة الإشعارات
        self.notification_scheduler.start_scheduler()
        
        application = Application.builder().token(BotConfig.BOT_TOKEN).build()
        
        # إضافة معالجات الأوامر
        application.add_handler(CommandHandler("start", self.start_command))
        application.add_handler(CallbackQueryHandler(self.button_callback))
        
        # معالج الرسائل العامة
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        logger.info("🤖 بدء تشغيل بوت SmartCoin المحسن...")
        
        try:
            application.run_polling()
        except KeyboardInterrupt:
            logger.info("إيقاف البوت...")
        finally:
            # إيقاف جدولة الإشعارات
            self.notification_scheduler.stop_scheduler()
            
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """معالج الرسائل العامة"""
        message_text = update.message.text.lower()
        telegram_id = update.effective_user.id
        
        # تسجيل التفاعل
        await self.log_interaction(telegram_id, 'message', {'text': message_text})
        
        if any(word in message_text for word in ["مساعدة", "help", "ساعدني"]):
            help_message = BotConfig.get_message('help')
            await update.message.reply_text(help_message)
        elif any(word in message_text for word in ["إحصائيات", "stats", "رصيد"]):
            await self.show_user_stats_message(update, context)
        elif any(word in message_text for word in ["تعدين", "mining", "mine"]):
            await self.quick_mining_message(update, context)
        else:
            await update.message.reply_text("👋 مرحباً! استخدم الأمر /start للبدء أو اكتب 'مساعدة' للحصول على المساعدة.")
            
    async def show_user_stats_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """عرض الإحصائيات كرسالة"""
        telegram_id = update.effective_user.id
        
        try:
            async with APIIntegration() as api:
                stats = await api.get_user_stats(telegram_id)
                
            local_stats = await self.get_local_user_stats(telegram_id)
            combined_stats = {**stats, **local_stats}
            
            stats_message = BotConfig.get_message('stats_template', **combined_stats)
            await update.message.reply_text(stats_message)
            
        except Exception as e:
            logger.error(f"خطأ في عرض الإحصائيات: {e}")
            await update.message.reply_text("❌ حدث خطأ في جلب الإحصائيات.")
            
    async def quick_mining_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """تعدين سريع كرسالة"""
        telegram_id = update.effective_user.id
        
        can_mine = await self.check_mining_eligibility(telegram_id)
        
        if not can_mine['eligible']:
            await update.message.reply_text(f"⏰ {can_mine['message']}")
            return
            
        try:
            async with APIIntegration() as api:
                mining_result = await api.process_mining(telegram_id)
                
            if mining_result.get('success'):
                amount = mining_result.get('amount', 0)
                await self.update_mining_stats(telegram_id, amount)
                
                success_message = f"🔨 تم التعدين بنجاح! حصلت على {amount} عملة SM"
                await update.message.reply_text(success_message)
            else:
                await update.message.reply_text("❌ فشل في التعدين. يرجى المحاولة مرة أخرى.")
                
        except Exception as e:
            logger.error(f"خطأ في التعدين: {e}")
            await update.message.reply_text("❌ حدث خطأ في التعدين.")

if __name__ == "__main__":
    bot = EnhancedSmartCoinBot()
    bot.run()

