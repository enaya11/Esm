#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
تكامل API مع بوت SmartCoin
"""

import asyncio
import aiohttp
import logging
from typing import Dict, Any, Optional
from bot_config import BotConfig

logger = logging.getLogger(__name__)

class APIIntegration:
    """فئة تكامل API مع الخلفية"""
    
    def __init__(self):
        self.base_url = BotConfig.API_BASE_URL
        self.session = None
        
    async def __aenter__(self):
        """إنشاء جلسة HTTP"""
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """إغلاق جلسة HTTP"""
        if self.session:
            await self.session.close()
            
    async def register_user(self, telegram_data: Dict[str, Any]) -> Dict[str, Any]:
        """تسجيل المستخدم مع API الخلفي"""
        try:
            url = f"{self.base_url}/auth/telegram-login"
            
            payload = {
                'telegram_id': telegram_data['telegram_id'],
                'username': telegram_data.get('username'),
                'first_name': telegram_data.get('first_name'),
                'last_name': telegram_data.get('last_name'),
                'language_code': telegram_data.get('language_code', 'ar')
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"تم تسجيل المستخدم بنجاح: {telegram_data['telegram_id']}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"فشل في تسجيل المستخدم: {response.status} - {error_text}")
                    return {'success': False, 'error': f'HTTP {response.status}'}
                    
        except Exception as e:
            logger.error(f"خطأ في تسجيل المستخدم: {e}")
            return {'success': False, 'error': str(e)}
            
    async def get_user_stats(self, telegram_id: int) -> Dict[str, Any]:
        """الحصول على إحصائيات المستخدم"""
        try:
            url = f"{self.base_url}/auth/stats/{telegram_id}"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"تم الحصول على إحصائيات المستخدم: {telegram_id}")
                    return result
                else:
                    logger.error(f"فشل في الحصول على الإحصائيات: {response.status}")
                    return {
                        'balance': 0,
                        'mining_count': 0,
                        'completed_tasks': 0,
                        'referrals': 0,
                        'level': 1
                    }
                    
        except Exception as e:
            logger.error(f"خطأ في الحصول على الإحصائيات: {e}")
            return {
                'balance': 0,
                'mining_count': 0,
                'completed_tasks': 0,
                'referrals': 0,
                'level': 1
            }
            
    async def send_mining_notification(self, telegram_id: int, amount: float) -> bool:
        """إرسال إشعار التعدين عبر API"""
        try:
            url = f"{self.base_url}/auth/mining-notification"
            
            payload = {
                'telegramId': telegram_id,
                'amount': amount
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    logger.info(f"تم إرسال إشعار التعدين للمستخدم: {telegram_id}")
                    return True
                else:
                    logger.error(f"فشل في إرسال إشعار التعدين: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"خطأ في إرسال إشعار التعدين: {e}")
            return False
            
    async def send_task_notification(self, telegram_id: int, task_name: str, reward: float) -> bool:
        """إرسال إشعار إكمال المهمة عبر API"""
        try:
            url = f"{self.base_url}/auth/task-notification"
            
            payload = {
                'telegramId': telegram_id,
                'taskName': task_name,
                'reward': reward
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    logger.info(f"تم إرسال إشعار المهمة للمستخدم: {telegram_id}")
                    return True
                else:
                    logger.error(f"فشل في إرسال إشعار المهمة: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"خطأ في إرسال إشعار المهمة: {e}")
            return False
            
    async def test_connection(self) -> bool:
        """اختبار الاتصال مع API"""
        try:
            url = f"{self.base_url}/health"  # endpoint للتحقق من صحة الخدمة
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    logger.info("الاتصال مع API يعمل بشكل صحيح")
                    return True
                else:
                    logger.warning(f"مشكلة في الاتصال مع API: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"فشل في الاتصال مع API: {e}")
            return False
            
    async def update_user_activity(self, telegram_id: int, activity_type: str, metadata: Dict = None) -> bool:
        """تحديث نشاط المستخدم"""
        try:
            url = f"{self.base_url}/users/{telegram_id}/activity"
            
            payload = {
                'activity_type': activity_type,
                'metadata': metadata or {},
                'timestamp': asyncio.get_event_loop().time()
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    logger.info(f"تم تحديث نشاط المستخدم: {telegram_id} - {activity_type}")
                    return True
                else:
                    logger.error(f"فشل في تحديث النشاط: {response.status}")
                    return False
                    
        except Exception as e:
            logger.error(f"خطأ في تحديث النشاط: {e}")
            return False
            
    async def process_mining(self, telegram_id: int) -> Dict[str, Any]:
        """معالجة عملية التعدين"""
        try:
            url = f"{self.base_url}/mining/start"
            
            payload = {
                'telegram_id': telegram_id
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"تم تنفيذ التعدين للمستخدم: {telegram_id}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"فشل في التعدين: {response.status} - {error_text}")
                    return {'success': False, 'error': f'HTTP {response.status}'}
                    
        except Exception as e:
            logger.error(f"خطأ في التعدين: {e}")
            return {'success': False, 'error': str(e)}
            
    async def complete_task(self, telegram_id: int, task_id: str) -> Dict[str, Any]:
        """إكمال مهمة"""
        try:
            url = f"{self.base_url}/tasks/complete"
            
            payload = {
                'telegram_id': telegram_id,
                'task_id': task_id
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"تم إكمال المهمة للمستخدم: {telegram_id} - {task_id}")
                    return result
                else:
                    error_text = await response.text()
                    logger.error(f"فشل في إكمال المهمة: {response.status} - {error_text}")
                    return {'success': False, 'error': f'HTTP {response.status}'}
                    
        except Exception as e:
            logger.error(f"خطأ في إكمال المهمة: {e}")
            return {'success': False, 'error': str(e)}
            
    async def get_referral_link(self, telegram_id: int) -> Optional[str]:
        """الحصول على رابط الإحالة"""
        try:
            url = f"{self.base_url}/users/{telegram_id}/referral-link"
            
            async with self.session.get(url) as response:
                if response.status == 200:
                    result = await response.json()
                    logger.info(f"تم الحصول على رابط الإحالة للمستخدم: {telegram_id}")
                    return result.get('referral_link')
                else:
                    logger.error(f"فشل في الحصول على رابط الإحالة: {response.status}")
                    return None
                    
        except Exception as e:
            logger.error(f"خطأ في الحصول على رابط الإحالة: {e}")
            return None

# دوال مساعدة للاستخدام السريع
async def register_user_api(telegram_data: Dict[str, Any]) -> Dict[str, Any]:
    """دالة مساعدة لتسجيل المستخدم"""
    async with APIIntegration() as api:
        return await api.register_user(telegram_data)

async def get_user_stats_api(telegram_id: int) -> Dict[str, Any]:
    """دالة مساعدة للحصول على إحصائيات المستخدم"""
    async with APIIntegration() as api:
        return await api.get_user_stats(telegram_id)

async def send_mining_notification_api(telegram_id: int, amount: float) -> bool:
    """دالة مساعدة لإرسال إشعار التعدين"""
    async with APIIntegration() as api:
        return await api.send_mining_notification(telegram_id, amount)

async def send_task_notification_api(telegram_id: int, task_name: str, reward: float) -> bool:
    """دالة مساعدة لإرسال إشعار المهمة"""
    async with APIIntegration() as api:
        return await api.send_task_notification(telegram_id, task_name, reward)

