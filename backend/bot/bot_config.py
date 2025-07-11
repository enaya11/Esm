#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
إعدادات بوت SmartCoin
"""

import os
from typing import Dict, Any

class BotConfig:
    """فئة إعدادات البوت"""
    
    # إعدادات البوت الأساسية
    BOT_TOKEN = "7874091797:AAF4fic7zZchK9XORS4SWlpMADt3LW42Um8"
    BOT_USERNAME = "@SMAR1TCOINbot"
    
    # إعدادات التطبيق
    WEBAPP_URL = "https://esm-e3c3.vercel.app/"  # سيتم تحديثه عند النشر
    API_BASE_URL = "http://localhost:3000/api"
    
    # إعدادات قاعدة البيانات
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'bot_users.db')
    
    # إعدادات الإشعارات
    NOTIFICATION_SETTINGS = {
        'throttle_minutes': 5,  # منع الإرسال أكثر من مرة كل 5 دقائق
        'max_notifications_per_day': 10,  # حد أقصى 10 إشعارات يومياً
        'quiet_hours': {
            'start': 22,  # بداية ساعات الهدوء (10 مساءً)
            'end': 8      # نهاية ساعات الهدوء (8 صباحاً)
        }
    }
    
    # رسائل البوت
    MESSAGES = {
        'welcome': """
🌟 مرحباً بك في SmartCoin! 🌟

أهلاً {first_name}! 👋

🚀 **SmartCoin** هي منصة العملات الرقمية المستقبلية بدعم رأس مال 350 مليون دولار!

💎 **ما يمكنك فعله:**
• 🔨 التعدين اليومي للحصول على عملات مجانية
• 🎯 إكمال المهام والحصول على مكافآت
• 🎰 تدوير عجلة الحظ
• 👥 دعوة الأصدقاء والحصول على مكافآت الإحالة
• 🛒 شراء حزم التعدين المتقدمة

🔗 **ابدأ رحلتك الآن:**
        """,
        
        'login_success': "✅ تم تسجيل دخولك بنجاح! يمكنك الآن استخدام جميع ميزات SmartCoin.",
        'login_failed': "❌ فشل في تسجيل الدخول. يرجى المحاولة مرة أخرى.",
        'logout_success': "✅ تم تسجيل خروجك بنجاح!",
        'already_logged_in': "✅ أنت مسجل دخول بالفعل!\n\n🚀 اضغط على الزر أدناه لفتح SmartCoin:",
        
        'help': """
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
        """,
        
        'stats_template': """
📊 **إحصائياتك في SmartCoin:**

💰 **الرصيد:** {balance} SM
🔨 **مرات التعدين:** {mining_count}
🎯 **المهام المكتملة:** {completed_tasks}
👥 **الإحالات:** {referrals}
🏆 **المستوى:** {level}
        """,
        
        'mining_notification': "🔨 **تم التعدين بنجاح!**\n\n💰 حصلت على {amount} عملة SM\n\n🚀 استمر في التعدين يومياً للحصول على المزيد!",
        'referral_notification': "👥 **إحالة جديدة!**\n\n🎉 انضم {referral_name} عبر رابط الإحالة الخاص بك\n💰 حصلت على {bonus} عملة SM كمكافأة\n\n🔗 شارك رابطك مع المزيد من الأصدقاء!",
        'task_notification': "🎯 **مهمة مكتملة!**\n\n✅ أكملت مهمة: {task_name}\n💰 حصلت على {reward} عملة SM\n\n🏆 تابع إكمال المهام للحصول على المزيد من المكافآت!"
    }
    
    # إعدادات الأمان
    SECURITY = {
        'session_timeout_days': 30,
        'max_login_attempts': 5,
        'rate_limit_per_minute': 20
    }
    
    @classmethod
    def get_message(cls, key: str, **kwargs) -> str:
        """الحصول على رسالة مع تنسيق المتغيرات"""
        message = cls.MESSAGES.get(key, "")
        if kwargs:
            return message.format(**kwargs)
        return message
    
    @classmethod
    def update_webapp_url(cls, new_url: str):
        """تحديث رابط التطبيق"""
        cls.WEBAPP_URL = new_url
    
    @classmethod
    def update_api_url(cls, new_url: str):
        """تحديث رابط API"""
        cls.API_BASE_URL = new_url

