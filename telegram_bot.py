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
import aiohttp

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
    def __init__(self, token: str):
        """تهيئة بوت SmartCoin"""
        self.token = token
        self.app = None
        self.db_path = 'smartcoin_bot.db'
        
        # الروابط المحدثة حسب طلبك
        self.API_URL = "https://esm.vercel.app"    # رابط الخادم الخلفي (API)
        self.FRONTEND_URL = "https://esm-e3c3.vercel.app"  # رابط الواجهة الأمامية
        
        self.verification_codes = {}  # تخزين مؤقت لرموز التحقق
        
        # إعداد قاعدة البيانات
        self.init_database()
        
        logger.info("🚀 تم تهيئة بوت SmartCoin بنجاح")

    # ... (ابقاء جميع الدوال الأخرى كما هي بدون تغيير)

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
        
        # استدعاء API الخلفي لتسجيل المستخدم
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.API_URL}/api/users/register",
                    json={
                        "telegram_id": user_id,
                        **user_data
                    }
                ) as resp:
                    if resp.status != 200:
                        logger.error(f"فشل تسجيل المستخدم في الخادم الخلفي: {await resp.text()}")
        except Exception as e:
            logger.error(f"خطأ في اتصال API الخلفي: {e}")
        
        # رسالة الترحيب
        welcome_text = f"""
🌟 مرحباً بك في SmartCoin! 🌟

أهلاً {user.first_name}! 👋

🚀 منصة العملات الرقمية المستقبلية
💰 رأس مال: 350 مليون دولار
👥 أكثر من مليون مستخدم نشط
        """
        
        # أزرار التفاعل مع روابط الواجهة الأمامية
        keyboard = [
            [InlineKeyboardButton("🌐 فتح المنصة", url=f"{self.FRONTEND_URL}/login")],
            [InlineKeyboardButton("🔐 تسجيل الدخول", callback_data="login")],
            [InlineKeyboardButton("👤 الملف الشخصي", callback_data="profile")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(
            welcome_text,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

    async def verify_code(self, user_id: int, code: str) -> bool:
        """التحقق من صحة رمز التحقق عبر API الخلفي"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.API_URL}/api/auth/verify",
                    json={
                        "user_id": user_id,
                        "code": code
                    }
                ) as resp:
                    data = await resp.json()
                    return data.get("success", False)
        except Exception as e:
            logger.error(f"خطأ في التحقق من الرمز عبر API: {e}")
            return False

    async def get_user_info(self, user_id: int) -> Optional[dict]:
        """الحصول على معلومات المستخدم من API الخلفي"""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.API_URL}/api/users/{user_id}"
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
                    return None
        except Exception as e:
            logger.error(f"خطأ في جلب بيانات المستخدم: {e}")
            return None

    # ... (ابقاء باقي الدوال كما هي مع تعديل الروابط الداخلية)

    def run(self):
        """تشغيل البوت"""
        try:
            self.app = Application.builder().token(self.token).build()
            
            # إضافة معالجات الأوامر
            self.app.add_handler(CommandHandler("start", self.start_command))
            self.app.add_handler(CommandHandler("login", self.login_command))
            self.app.add_handler(CommandHandler("profile", self.profile_command))
            
            # إضافة معالج الأزرار
            self.app.add_handler(CallbackQueryHandler(self.button_callback))
            
            # إضافة معالج الرسائل العامة
            self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
            
            logger.info("🤖 بدء تشغيل بوت SmartCoin...")
            self.app.run_polling(allowed_updates=Update.ALL_TYPES)
            
        except Exception as e:
            logger.error(f"❌ خطأ في تشغيل البوت: {e}")

def main():
    """الدالة الرئيسية"""
    BOT_TOKEN = "7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ"
    
    if not BOT_TOKEN:
        logger.error("❌ يرجى تعيين توكن البوت")
        sys.exit(1)
    
    bot = SmartCoinBot(BOT_TOKEN)
    bot.run()

if __name__ == "__main__":
    main()