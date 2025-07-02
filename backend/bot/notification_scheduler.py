#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
جدولة الإشعارات المتقدمة لبوت SmartCoin
"""

import asyncio
import json
import logging
import sqlite3
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import schedule
import time
from threading import Thread

from notification_service import NotificationService
from bot_config import BotConfig

logger = logging.getLogger(__name__)

class NotificationPriority(Enum):
    """أولوية الإشعارات"""
    LOW = 1
    NORMAL = 2
    HIGH = 3
    URGENT = 4

class NotificationStatus(Enum):
    """حالة الإشعار"""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

@dataclass
class ScheduledNotification:
    """بنية الإشعار المجدول"""
    id: str
    telegram_id: int
    message: str
    notification_type: str
    priority: NotificationPriority
    scheduled_time: datetime
    status: NotificationStatus
    retry_count: int = 0
    max_retries: int = 3
    metadata: Dict[str, Any] = None
    created_at: datetime = None
    sent_at: datetime = None

    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
        if self.metadata is None:
            self.metadata = {}

class NotificationScheduler:
    """جدولة الإشعارات المتقدمة"""
    
    def __init__(self):
        self.db_path = BotConfig.DATABASE_PATH.replace('bot_users.db', 'notifications.db')
        self.notification_service = NotificationService()
        self.running = False
        self.scheduler_thread = None
        self.init_database()
        
    def init_database(self):
        """إنشاء قاعدة بيانات الإشعارات"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS scheduled_notifications (
                id TEXT PRIMARY KEY,
                telegram_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                notification_type TEXT NOT NULL,
                priority INTEGER NOT NULL,
                scheduled_time TIMESTAMP NOT NULL,
                status TEXT NOT NULL,
                retry_count INTEGER DEFAULT 0,
                max_retries INTEGER DEFAULT 3,
                metadata TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                sent_at TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notification_templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                template TEXT NOT NULL,
                notification_type TEXT NOT NULL,
                priority INTEGER DEFAULT 2,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notification_stats (
                date DATE PRIMARY KEY,
                total_sent INTEGER DEFAULT 0,
                total_failed INTEGER DEFAULT 0,
                by_type TEXT,
                by_priority TEXT
            )
        ''')
        
        # إدراج قوالب الإشعارات الافتراضية
        self._insert_default_templates(cursor)
        
        conn.commit()
        conn.close()
        
    def _insert_default_templates(self, cursor):
        """إدراج قوالب الإشعارات الافتراضية"""
        templates = [
            {
                'id': 'mining_success',
                'name': 'نجح التعدين',
                'template': '🔨 **تم التعدين بنجاح!**\n\n💰 حصلت على {amount} عملة SM\n\n🚀 استمر في التعدين يومياً للحصول على المزيد!',
                'notification_type': 'mining',
                'priority': NotificationPriority.NORMAL.value
            },
            {
                'id': 'referral_bonus',
                'name': 'مكافأة الإحالة',
                'template': '👥 **إحالة جديدة!**\n\n🎉 انضم {referral_name} عبر رابط الإحالة الخاص بك\n💰 حصلت على {bonus} عملة SM كمكافأة\n\n🔗 شارك رابطك مع المزيد من الأصدقاء!',
                'notification_type': 'referrals',
                'priority': NotificationPriority.HIGH.value
            },
            {
                'id': 'task_completed',
                'name': 'مهمة مكتملة',
                'template': '🎯 **مهمة مكتملة!**\n\n✅ أكملت مهمة: {task_name}\n💰 حصلت على {reward} عملة SM\n\n🏆 تابع إكمال المهام للحصول على المزيد من المكافآت!',
                'notification_type': 'tasks',
                'priority': NotificationPriority.NORMAL.value
            },
            {
                'id': 'daily_reminder',
                'name': 'تذكير يومي',
                'template': '⏰ **تذكير يومي**\n\n🔨 لا تنس القيام بالتعدين اليومي!\n🎯 تحقق من المهام الجديدة\n🎰 جرب حظك مع عجلة الحظ\n\n💎 كل يوم فرصة جديدة لكسب المزيد!',
                'notification_type': 'reminders',
                'priority': NotificationPriority.LOW.value
            },
            {
                'id': 'level_up',
                'name': 'ترقية المستوى',
                'template': '🏆 **مبروك! ترقية مستوى!**\n\n🎉 وصلت إلى المستوى {new_level}\n💰 حصلت على {bonus} عملة SM كمكافأة\n⚡ معدل التعدين الجديد: {new_rate} SM/ساعة\n\n🚀 استمر في التقدم!',
                'notification_type': 'achievements',
                'priority': NotificationPriority.HIGH.value
            }
        ]
        
        for template in templates:
            cursor.execute('''
                INSERT OR IGNORE INTO notification_templates 
                (id, name, template, notification_type, priority)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                template['id'],
                template['name'],
                template['template'],
                template['notification_type'],
                template['priority']
            ))
            
    def schedule_notification(
        self,
        telegram_id: int,
        template_id: str,
        scheduled_time: datetime,
        template_data: Dict[str, Any] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> str:
        """جدولة إشعار جديد"""
        try:
            # الحصول على قالب الإشعار
            template = self._get_template(template_id)
            if not template:
                raise ValueError(f"قالب الإشعار غير موجود: {template_id}")
                
            # تنسيق الرسالة
            message = template['template']
            if template_data:
                message = message.format(**template_data)
                
            # إنشاء معرف فريد للإشعار
            notification_id = f"{telegram_id}_{template_id}_{int(scheduled_time.timestamp())}"
            
            # إنشاء الإشعار المجدول
            notification = ScheduledNotification(
                id=notification_id,
                telegram_id=telegram_id,
                message=message,
                notification_type=template['notification_type'],
                priority=priority,
                scheduled_time=scheduled_time,
                status=NotificationStatus.PENDING,
                metadata=template_data or {}
            )
            
            # حفظ في قاعدة البيانات
            self._save_notification(notification)
            
            logger.info(f"تم جدولة إشعار جديد: {notification_id} للمستخدم {telegram_id}")
            return notification_id
            
        except Exception as e:
            logger.error(f"خطأ في جدولة الإشعار: {e}")
            raise
            
    def schedule_bulk_notifications(
        self,
        user_ids: List[int],
        template_id: str,
        scheduled_time: datetime,
        template_data: Dict[str, Any] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> List[str]:
        """جدولة إشعارات جماعية"""
        notification_ids = []
        
        for user_id in user_ids:
            try:
                notification_id = self.schedule_notification(
                    user_id, template_id, scheduled_time, template_data, priority
                )
                notification_ids.append(notification_id)
            except Exception as e:
                logger.error(f"فشل في جدولة إشعار للمستخدم {user_id}: {e}")
                
        return notification_ids
        
    def schedule_recurring_notification(
        self,
        telegram_id: int,
        template_id: str,
        start_time: datetime,
        interval_hours: int,
        end_time: Optional[datetime] = None,
        max_occurrences: Optional[int] = None
    ) -> List[str]:
        """جدولة إشعارات متكررة"""
        notification_ids = []
        current_time = start_time
        occurrence_count = 0
        
        while True:
            # التحقق من شروط الإيقاف
            if end_time and current_time > end_time:
                break
            if max_occurrences and occurrence_count >= max_occurrences:
                break
                
            try:
                notification_id = self.schedule_notification(
                    telegram_id, template_id, current_time
                )
                notification_ids.append(notification_id)
                occurrence_count += 1
                
                # الانتقال للموعد التالي
                current_time += timedelta(hours=interval_hours)
                
            except Exception as e:
                logger.error(f"فشل في جدولة إشعار متكرر: {e}")
                break
                
        return notification_ids
        
    def _get_template(self, template_id: str) -> Optional[Dict]:
        """الحصول على قالب الإشعار"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute(
            'SELECT * FROM notification_templates WHERE id = ?',
            (template_id,)
        )
        row = cursor.fetchone()
        
        conn.close()
        
        if row:
            columns = [description[0] for description in cursor.description]
            return dict(zip(columns, row))
        return None
        
    def _save_notification(self, notification: ScheduledNotification):
        """حفظ الإشعار في قاعدة البيانات"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO scheduled_notifications
            (id, telegram_id, message, notification_type, priority, scheduled_time, 
             status, retry_count, max_retries, metadata, created_at, sent_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            notification.id,
            notification.telegram_id,
            notification.message,
            notification.notification_type,
            notification.priority.value,
            notification.scheduled_time,
            notification.status.value,
            notification.retry_count,
            notification.max_retries,
            json.dumps(notification.metadata),
            notification.created_at,
            notification.sent_at
        ))
        
        conn.commit()
        conn.close()
        
    def start_scheduler(self):
        """بدء جدولة الإشعارات"""
        if self.running:
            logger.warning("الجدولة تعمل بالفعل")
            return
            
        self.running = True
        
        # جدولة المهام
        schedule.every(1).minutes.do(self._process_pending_notifications)
        schedule.every(1).hours.do(self._cleanup_old_notifications)
        schedule.every(1).days.do(self._update_daily_stats)
        
        # بدء خيط الجدولة
        self.scheduler_thread = Thread(target=self._run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("تم بدء جدولة الإشعارات")
        
    def stop_scheduler(self):
        """إيقاف جدولة الإشعارات"""
        self.running = False
        schedule.clear()
        
        if self.scheduler_thread:
            self.scheduler_thread.join(timeout=5)
            
        logger.info("تم إيقاف جدولة الإشعارات")
        
    def _run_scheduler(self):
        """تشغيل الجدولة في خيط منفصل"""
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(30)  # فحص كل 30 ثانية
            except Exception as e:
                logger.error(f"خطأ في الجدولة: {e}")
                time.sleep(60)  # انتظار دقيقة عند حدوث خطأ
                
    async def _process_pending_notifications(self):
        """معالجة الإشعارات المعلقة"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # الحصول على الإشعارات المستحقة
            cursor.execute('''
                SELECT * FROM scheduled_notifications 
                WHERE status = ? AND scheduled_time <= ?
                ORDER BY priority DESC, scheduled_time ASC
                LIMIT 50
            ''', (NotificationStatus.PENDING.value, datetime.now()))
            
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            
            for row in rows:
                notification_data = dict(zip(columns, row))
                await self._send_scheduled_notification(notification_data)
                
            conn.close()
            
        except Exception as e:
            logger.error(f"خطأ في معالجة الإشعارات المعلقة: {e}")
            
    async def _send_scheduled_notification(self, notification_data: Dict):
        """إرسال إشعار مجدول"""
        try:
            success = await self.notification_service.send_notification(
                notification_data['telegram_id'],
                notification_data['message'],
                notification_data['notification_type']
            )
            
            # تحديث حالة الإشعار
            if success:
                self._update_notification_status(
                    notification_data['id'],
                    NotificationStatus.SENT,
                    datetime.now()
                )
                logger.info(f"تم إرسال إشعار مجدول: {notification_data['id']}")
            else:
                # إعادة المحاولة أو تعليم كفاشل
                retry_count = notification_data['retry_count'] + 1
                max_retries = notification_data['max_retries']
                
                if retry_count < max_retries:
                    # إعادة جدولة للمحاولة مرة أخرى بعد 5 دقائق
                    new_time = datetime.now() + timedelta(minutes=5)
                    self._reschedule_notification(notification_data['id'], new_time, retry_count)
                    logger.info(f"إعادة جدولة إشعار: {notification_data['id']} - المحاولة {retry_count}")
                else:
                    self._update_notification_status(
                        notification_data['id'],
                        NotificationStatus.FAILED
                    )
                    logger.error(f"فشل في إرسال إشعار نهائياً: {notification_data['id']}")
                    
        except Exception as e:
            logger.error(f"خطأ في إرسال إشعار مجدول: {e}")
            
    def _update_notification_status(
        self,
        notification_id: str,
        status: NotificationStatus,
        sent_at: Optional[datetime] = None
    ):
        """تحديث حالة الإشعار"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        if sent_at:
            cursor.execute('''
                UPDATE scheduled_notifications 
                SET status = ?, sent_at = ?
                WHERE id = ?
            ''', (status.value, sent_at, notification_id))
        else:
            cursor.execute('''
                UPDATE scheduled_notifications 
                SET status = ?
                WHERE id = ?
            ''', (status.value, notification_id))
            
        conn.commit()
        conn.close()
        
    def _reschedule_notification(
        self,
        notification_id: str,
        new_time: datetime,
        retry_count: int
    ):
        """إعادة جدولة إشعار"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE scheduled_notifications 
            SET scheduled_time = ?, retry_count = ?, status = ?
            WHERE id = ?
        ''', (new_time, retry_count, NotificationStatus.PENDING.value, notification_id))
        
        conn.commit()
        conn.close()
        
    def _cleanup_old_notifications(self):
        """تنظيف الإشعارات القديمة"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # حذف الإشعارات المرسلة أو الفاشلة الأقدم من 30 يوم
            cutoff_date = datetime.now() - timedelta(days=30)
            
            cursor.execute('''
                DELETE FROM scheduled_notifications 
                WHERE (status = ? OR status = ?) AND created_at < ?
            ''', (NotificationStatus.SENT.value, NotificationStatus.FAILED.value, cutoff_date))
            
            deleted_count = cursor.rowcount
            conn.commit()
            conn.close()
            
            if deleted_count > 0:
                logger.info(f"تم حذف {deleted_count} إشعار قديم")
                
        except Exception as e:
            logger.error(f"خطأ في تنظيف الإشعارات القديمة: {e}")
            
    def _update_daily_stats(self):
        """تحديث الإحصائيات اليومية"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            today = datetime.now().date()
            
            # حساب الإحصائيات
            cursor.execute('''
                SELECT 
                    COUNT(*) as total_sent,
                    notification_type,
                    priority
                FROM scheduled_notifications 
                WHERE status = ? AND DATE(sent_at) = ?
                GROUP BY notification_type, priority
            ''', (NotificationStatus.SENT.value, today))
            
            sent_stats = cursor.fetchall()
            
            cursor.execute('''
                SELECT COUNT(*) as total_failed
                FROM scheduled_notifications 
                WHERE status = ? AND DATE(created_at) = ?
            ''', (NotificationStatus.FAILED.value, today))
            
            failed_count = cursor.fetchone()[0]
            
            # تجميع الإحصائيات
            total_sent = sum(stat[0] for stat in sent_stats)
            by_type = {}
            by_priority = {}
            
            for count, ntype, priority in sent_stats:
                by_type[ntype] = by_type.get(ntype, 0) + count
                by_priority[str(priority)] = by_priority.get(str(priority), 0) + count
                
            # حفظ الإحصائيات
            cursor.execute('''
                INSERT OR REPLACE INTO notification_stats
                (date, total_sent, total_failed, by_type, by_priority)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                today,
                total_sent,
                failed_count,
                json.dumps(by_type),
                json.dumps(by_priority)
            ))
            
            conn.commit()
            conn.close()
            
            logger.info(f"تم تحديث إحصائيات اليوم: {total_sent} مرسل، {failed_count} فاشل")
            
        except Exception as e:
            logger.error(f"خطأ في تحديث الإحصائيات اليومية: {e}")
            
    def get_notification_stats(self, days: int = 7) -> Dict[str, Any]:
        """الحصول على إحصائيات الإشعارات"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            start_date = datetime.now().date() - timedelta(days=days)
            
            cursor.execute('''
                SELECT * FROM notification_stats 
                WHERE date >= ?
                ORDER BY date DESC
            ''', (start_date,))
            
            rows = cursor.fetchall()
            columns = [description[0] for description in cursor.description]
            
            stats = []
            for row in rows:
                stat = dict(zip(columns, row))
                stat['by_type'] = json.loads(stat['by_type']) if stat['by_type'] else {}
                stat['by_priority'] = json.loads(stat['by_priority']) if stat['by_priority'] else {}
                stats.append(stat)
                
            conn.close()
            
            return {
                'period_days': days,
                'daily_stats': stats,
                'total_sent': sum(stat['total_sent'] for stat in stats),
                'total_failed': sum(stat['total_failed'] for stat in stats)
            }
            
        except Exception as e:
            logger.error(f"خطأ في الحصول على الإحصائيات: {e}")
            return {'error': str(e)}

# إنشاء مثيل عام للجدولة
notification_scheduler = NotificationScheduler()

# دوال مساعدة للاستخدام السريع
def schedule_mining_notification(telegram_id: int, amount: float, delay_minutes: int = 0):
    """جدولة إشعار التعدين"""
    scheduled_time = datetime.now() + timedelta(minutes=delay_minutes)
    return notification_scheduler.schedule_notification(
        telegram_id,
        'mining_success',
        scheduled_time,
        {'amount': amount},
        NotificationPriority.NORMAL
    )

def schedule_referral_notification(telegram_id: int, referral_name: str, bonus: float, delay_minutes: int = 0):
    """جدولة إشعار الإحالة"""
    scheduled_time = datetime.now() + timedelta(minutes=delay_minutes)
    return notification_scheduler.schedule_notification(
        telegram_id,
        'referral_bonus',
        scheduled_time,
        {'referral_name': referral_name, 'bonus': bonus},
        NotificationPriority.HIGH
    )

def schedule_task_notification(telegram_id: int, task_name: str, reward: float, delay_minutes: int = 0):
    """جدولة إشعار المهمة"""
    scheduled_time = datetime.now() + timedelta(minutes=delay_minutes)
    return notification_scheduler.schedule_notification(
        telegram_id,
        'task_completed',
        scheduled_time,
        {'task_name': task_name, 'reward': reward},
        NotificationPriority.NORMAL
    )

