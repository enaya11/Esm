#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ملف تشغيل بوت SmartCoin
"""

import sys
import os
import logging
import argparse
from pathlib import Path

# إضافة مجلد البوت إلى المسار
bot_dir = Path(__file__).parent
sys.path.insert(0, str(bot_dir))

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

def main():
    """الدالة الرئيسية لتشغيل البوت"""
    parser = argparse.ArgumentParser(description='تشغيل بوت SmartCoin')
    parser.add_argument(
        '--mode',
        choices=['basic', 'enhanced'],
        default='enhanced',
        help='وضع تشغيل البوت (basic أو enhanced)'
    )
    parser.add_argument(
        '--config',
        help='مسار ملف الإعدادات المخصص'
    )
    parser.add_argument(
        '--debug',
        action='store_true',
        help='تفعيل وضع التصحيح'
    )
    
    args = parser.parse_args()
    
    # تعديل مستوى التسجيل إذا كان في وضع التصحيح
    if args.debug:
        logging.getLogger().setLevel(logging.DEBUG)
        logger.debug("تم تفعيل وضع التصحيح")
    
    # تحديث الإعدادات إذا تم تحديد ملف مخصص
    if args.config:
        logger.info(f"استخدام ملف الإعدادات: {args.config}")
        # يمكن إضافة منطق تحميل الإعدادات المخصصة هنا
    
    try:
        if args.mode == 'enhanced':
            logger.info("بدء تشغيل البوت المحسن...")
            from enhanced_bot import EnhancedSmartCoinBot
            bot = EnhancedSmartCoinBot()
        else:
            logger.info("بدء تشغيل البوت الأساسي...")
            from telegramBot import SmartCoinBot
            bot = SmartCoinBot()
        
        # تشغيل البوت
        bot.run()
        
    except KeyboardInterrupt:
        logger.info("تم إيقاف البوت بواسطة المستخدم")
    except Exception as e:
        logger.error(f"خطأ في تشغيل البوت: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    main()

