#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ملف تشغيل بوت SmartCoin
"""

import sys
import logging
import argparse
import asyncio
from pathlib import Path

# إضافة مجلد البوت إلى المسار
bot_dir = Path(__file__).parent
sys.path.insert(0, str(bot_dir))

# إعداد التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('bot.log', encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

async def main():
    """الدالة الرئيسية لتشغيل البوت"""
    parser = argparse.ArgumentParser(description='تشغيل بوت SmartCoin')
    parser.add_argument(
        '--mode',
        choices=['auth', 'basic', 'enhanced'],
        default='auth',
        help='وضع تشغيل البوت (auth, basic, أو enhanced)'
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
    
    bot = None
    try:
        if args.mode == 'main':
            logger.info("بدء تشغيل البوت الرئيسي...")
            from main_bot import EnhancedSmartCoinBot
            bot = EnhancedSmartCoinBot()
        else:
            logger.error("وضع تشغيل البوت غير صالح. يرجى استخدام 'main'.")
            sys.exit(1)
        
        # تشغيل البوت
        if bot:
            # التحقق مما إذا كان للبوت دالة `run` غير متزامنة
            if asyncio.iscoroutinefunction(bot.run):
                await bot.run()
            else:
                bot.run()
        
    except KeyboardInterrupt:
        logger.info("تم إيقاف البوت بواسطة المستخدم")
    except Exception as e:
        logger.error(f"خطأ في تشغيل البوت: {e}", exc_info=True)
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
