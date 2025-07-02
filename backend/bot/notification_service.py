#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
خدمة الإشعارات لبوت SmartCoin
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from telegram import Bot
from bot_config import BotConfig

logger = logging.getLogger(__name__)

class NotificationService:
    """خدمة إدارة الإشعارات"""
    
    def __init__(self):
        self.bot = Bot(token=BotConfig.BOT_TOKEN)
        self.notification_queue = []
        self.throttle_cache = {}
        self.daily_limits = {}
        
    async def send_notification(self, telegram_id: int, message: str, notification_type: str = "general") -> bool:
        """إرسال إشعار مع التحكم في التكرار والحدود"""
        
        # التحقق من الحدود اليومية
        if not self._check_daily_limit(telegram_id):
            logger.warning(f"تم تجاوز الحد اليومي للإشعارات للمستخدم {telegram_id}")
            return False
            
        # التحقق من ساعات الهدوء
        if self._is_quiet_hours():
            logger.info(f"تأجيل الإشعار للمستخدم {telegram_id} - ساعات الهدوء")
            self._queue_notification(telegram_id, message, notification_type)
            return True
            
        # التحقق من التكرار (throttling)
        if not self._check_throttle(telegram_id, notification_type):
            logger.info(f"تم تأجيل الإشعار للمستخدم {telegram_id} - throttling")
            return False
            
        try:
            await self.bot.send_message(chat_id=telegram_id, text=message, parse_mode='Markdown')
            
            # تحديث إحصائيات الإرسال
            self._update_throttle(telegram_id, notification_type)
            self._update_daily_count(telegram_id)
            
            logger.info(f"تم إرسال إشعار للمستخدم {telegram_id} - النوع: {notification_type}")
            return True
            
        except Exception as e:
            logger.error(f"خطأ في إرسال الإشعار للمستخدم {telegram_id}: {e}")
            return False
            
    def _check_daily_limit(self, telegram_id: int) -> bool:
        """التحقق من الحد اليومي للإشعارات"""
        today = datetime.now().date()
        key = f"{telegram_id}_{today}"
        
        current_count = self.daily_limits.get(key, 0)
        max_count = BotConfig.NOTIFICATION_SETTINGS['max_notifications_per_day']
        
        return current_count < max_count
        
    def _update_daily_count(self, telegram_id: int):
        """تحديث عداد الإشعارات اليومي"""
        today = datetime.now().date()
        key = f"{telegram_id}_{today}"
        
        self.daily_limits[key] = self.daily_limits.get(key, 0) + 1
        
    def _is_quiet_hours(self) -> bool:
        """التحقق من ساعات الهدوء"""
        current_hour = datetime.now().hour
        quiet_start = BotConfig.NOTIFICATION_SETTINGS['quiet_hours']['start']
        quiet_end = BotConfig.NOTIFICATION_SETTINGS['quiet_hours']['end']
        
        if quiet_start > quiet_end:  # إذا كانت ساعات الهدوء تمتد لليوم التالي
            return current_hour >= quiet_start or current_hour < quiet_end
        else:
            return quiet_start <= current_hour < quiet_end
            
    def _check_throttle(self, telegram_id: int, notification_type: str) -> bool:
        """التحقق من تكرار الإشعارات"""
        throttle_key = f"{telegram_id}_{notification_type}"
        
        if throttle_key not in self.throttle_cache:
            return True
            
        last_sent = self.throttle_cache[throttle_key]
        throttle_minutes = BotConfig.NOTIFICATION_SETTINGS['throttle_minutes']
        
        return datetime.now() - last_sent >= timedelta(minutes=throttle_minutes)
        
    def _update_throttle(self, telegram_id: int, notification_type: str):
        """تحديث وقت آخر إرسال"""
        throttle_key = f"{telegram_id}_{notification_type}"
        self.throttle_cache[throttle_key] = datetime.now()
        
    def _queue_notification(self, telegram_id: int, message: str, notification_type: str):
        """إضافة إشعار إلى قائمة الانتظار"""
        self.notification_queue.append({
            'telegram_id': telegram_id,
            'message': message,
            'notification_type': notification_type,
            'queued_at': datetime.now()
        })
        
    async def process_queued_notifications(self):
        """معالجة الإشعارات المؤجلة"""
        if not self.notification_queue:
            return
            
        # معالجة الإشعارات المؤجلة إذا انتهت ساعات الهدوء
        if not self._is_quiet_hours():
            notifications_to_process = self.notification_queue.copy()
            self.notification_queue.clear()
            
            for notification in notifications_to_process:
                await self.send_notification(
                    notification['telegram_id'],
                    notification['message'],
                    notification['notification_type']
                )
                
                # تأخير قصير بين الإشعارات
                await asyncio.sleep(1)
                
    async def send_mining_notification(self, telegram_id: int, amount: float):
        """إرسال إشعار التعدين"""
        message = BotConfig.get_message('mining_notification', amount=amount)
        return await self.send_notification(telegram_id, message, "mining")
        
    async def send_referral_notification(self, telegram_id: int, referral_name: str, bonus: float):
        """إرسال إشعار الإحالة"""
        message = BotConfig.get_message('referral_notification', referral_name=referral_name, bonus=bonus)
        return await self.send_notification(telegram_id, message, "referrals")
        
    async def send_task_completion_notification(self, telegram_id: int, task_name: str, reward: float):
        """إرسال إشعار إكمال المهمة"""
        message = BotConfig.get_message('task_notification', task_name=task_name, reward=reward)
        return await self.send_notification(telegram_id, message, "tasks")
        
    async def send_bulk_notification(self, user_ids: List[int], message: str, notification_type: str = "general"):
        """إرسال إشعار جماعي"""
        results = []
        
        for user_id in user_ids:
            result = await self.send_notification(user_id, message, notification_type)
            results.append({'user_id': user_id, 'success': result})
            
            # تأخير قصير بين الإرسالات لتجنب حدود التليجرام
            await asyncio.sleep(0.1)
            
        return results
        
    def cleanup_old_data(self):
        """تنظيف البيانات القديمة"""
        # تنظيف بيانات الحدود اليومية القديمة
        today = datetime.now().date()
        keys_to_remove = []
        
        for key in self.daily_limits.keys():
            if today.strftime('%Y-%m-%d') not in key:
                keys_to_remove.append(key)
                
        for key in keys_to_remove:
            del self.daily_limits[key]
            
        # تنظيف بيانات التكرار القديمة (أكثر من يوم)
        cutoff_time = datetime.now() - timedelta(days=1)
        throttle_keys_to_remove = []
        
        for key, timestamp in self.throttle_cache.items():
            if timestamp < cutoff_time:
                throttle_keys_to_remove.append(key)
                
        for key in throttle_keys_to_remove:
            del self.throttle_cache[key]
            
        logger.info("تم تنظيف البيانات القديمة")

# إنشاء مثيل عام للخدمة
notification_service = NotificationService()

# دوال مساعدة للاستخدام من خارج الملف
async def send_mining_notification(telegram_id: int, amount: float):
    """دالة مساعدة لإرسال إشعار التعدين"""
    return await notification_service.send_mining_notification(telegram_id, amount)

async def send_referral_notification(telegram_id: int, referral_name: str, bonus: float):
    """دالة مساعدة لإرسال إشعار الإحالة"""
    return await notification_service.send_referral_notification(telegram_id, referral_name, bonus)

async def send_task_completion_notification(telegram_id: int, task_name: str, reward: float):
    """دالة مساعدة لإرسال إشعار إكمال المهمة"""
    return await notification_service.send_task_completion_notification(telegram_id, task_name, reward)

