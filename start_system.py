#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SmartCoin System Launcher
مشغل نظام SmartCoin المتكامل

هذا الملف يقوم بتشغيل جميع مكونات النظام:
1. بوت تليجرام
2. خادم الباك إند (NestJS)
3. خادم الفرونت إند (HTTP Server)
"""

import os
import sys
import subprocess
import threading
import time
import signal
import json
from pathlib import Path

class SmartCoinLauncher:
    def __init__(self):
        self.base_dir = Path(__file__).parent
        self.backend_dir = self.base_dir / 'backend'
        self.frontend_dir = self.base_dir / 'frontend'
        self.processes = []
        self.running = True
        
        print("🚀 SmartCoin System Launcher")
        print("=" * 50)
        print("💰 بدعم رأس مال 350 مليون دولار")
        print("🌟 أقوى منصة تداول لامركزية في العالم")
        print("=" * 50)

    def check_requirements(self):
        """التحقق من متطلبات النظام"""
        print("\n🔍 فحص متطلبات النظام...")
        
        # التحقق من Python
        try:
            python_version = sys.version_info
            if python_version.major < 3 or python_version.minor < 8:
                print("❌ يتطلب Python 3.8 أو أحدث")
                return False
            print(f"✅ Python {python_version.major}.{python_version.minor}.{python_version.micro}")
        except Exception as e:
            print(f"❌ خطأ في فحص Python: {e}")
            return False

        # التحقق من Node.js
        try:
            result = subprocess.run(['node', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ Node.js {result.stdout.strip()}")
            else:
                print("❌ Node.js غير مثبت")
                return False
        except FileNotFoundError:
            print("❌ Node.js غير موجود في PATH")
            return False

        # التحقق من npm
        try:
            result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
            if result.returncode == 0:
                print(f"✅ npm {result.stdout.strip()}")
            else:
                print("❌ npm غير مثبت")
                return False
        except FileNotFoundError:
            print("❌ npm غير موجود في PATH")
            return False

        return True

    def install_python_dependencies(self):
        """تثبيت تبعيات Python"""
        print("\n📦 تثبيت تبعيات Python...")
        
        requirements = [
            'python-telegram-bot==20.7',
            'aiohttp==3.9.1',
            'python-dotenv==1.0.0',
            'sqlite3',  # مدمج مع Python
        ]
        
        for package in requirements:
            if package == 'sqlite3':
                continue  # مدمج مع Python
                
            try:
                print(f"📥 تثبيت {package}...")
                result = subprocess.run([
                    sys.executable, '-m', 'pip', 'install', package
                ], capture_output=True, text=True)
                
                if result.returncode == 0:
                    print(f"✅ تم تثبيت {package}")
                else:
                    print(f"❌ فشل تثبيت {package}: {result.stderr}")
                    return False
            except Exception as e:
                print(f"❌ خطأ في تثبيت {package}: {e}")
                return False
        
        return True

    def install_node_dependencies(self):
        """تثبيت تبعيات Node.js"""
        print("\n📦 تثبيت تبعيات Node.js...")
        
        if not self.backend_dir.exists():
            print("❌ مجلد الباك إند غير موجود")
            return False
        
        try:
            print("📥 تثبيت تبعيات الباك إند...")
            result = subprocess.run([
                'npm', 'install'
            ], cwd=self.backend_dir, capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ تم تثبيت تبعيات الباك إند")
            else:
                print(f"❌ فشل تثبيت تبعيات الباك إند: {result.stderr}")
                return False
                
        except Exception as e:
            print(f"❌ خطأ في تثبيت تبعيات Node.js: {e}")
            return False
        
        return True

    def setup_environment(self):
        """إعداد متغيرات البيئة"""
        print("\n⚙️ إعداد متغيرات البيئة...")
        
        env_file = self.backend_dir / '.env'
        
        env_content = """# SmartCoin Environment Configuration
# إعدادات بيئة SmartCoin

# Database
DATABASE_TYPE=sqlite
DATABASE_PATH=./smartcoin.db

# JWT Configuration
JWT_SECRET=smartcoin_super_secret_key_2024_350million_dollars
JWT_EXPIRES_IN=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=7519072707:AAE-Jn9vGSorlh1OPEkNNQcxQcTYLcfgQjQ
TELEGRAM_WEBHOOK_URL=http://localhost:3000/api/v1/auth/telegram-webhook

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# SmartCoin Platform
PLATFORM_NAME=SmartCoin
PLATFORM_CAPITAL=350000000
PLATFORM_CURRENCY=USD
PLATFORM_LANGUAGES=ar,en

# Mining Configuration
DEFAULT_MINING_RATE=1.0
REGISTRATION_BONUS=100
DAILY_BONUS_BASE=10

# Referral System
REFERRAL_BONUS=50
REFERRAL_PERCENTAGE=10
"""
        
        try:
            with open(env_file, 'w', encoding='utf-8') as f:
                f.write(env_content)
            print("✅ تم إنشاء ملف .env")
        except Exception as e:
            print(f"❌ خطأ في إنشاء ملف .env: {e}")
            return False
        
        return True

    def start_telegram_bot(self):
        """تشغيل بوت تليجرام"""
        print("\n🤖 تشغيل بوت تليجرام...")
        
        bot_file = self.base_dir / 'telegram_bot.py'
        if not bot_file.exists():
            print("❌ ملف البوت غير موجود")
            return None
        
        try:
            process = subprocess.Popen([
                sys.executable, str(bot_file)
            ], cwd=self.base_dir)
            
            print("✅ تم تشغيل بوت تليجرام")
            return process
            
        except Exception as e:
            print(f"❌ خطأ في تشغيل البوت: {e}")
            return None

    def start_backend_server(self):
        """تشغيل خادم الباك إند"""
        print("\n🖥️ تشغيل خادم الباك إند...")
        
        if not self.backend_dir.exists():
            print("❌ مجلد الباك إند غير موجود")
            return None
        
        try:
            # بناء المشروع أولاً
            print("🔨 بناء مشروع الباك إند...")
            build_result = subprocess.run([
                'npm', 'run', 'build'
            ], cwd=self.backend_dir, capture_output=True, text=True)
            
            if build_result.returncode != 0:
                print(f"⚠️ تحذير في البناء: {build_result.stderr}")
            
            # تشغيل الخادم
            process = subprocess.Popen([
                'npm', 'run', 'start:prod'
            ], cwd=self.backend_dir)
            
            print("✅ تم تشغيل خادم الباك إند على http://localhost:3000")
            return process
            
        except Exception as e:
            print(f"❌ خطأ في تشغيل الباك إند: {e}")
            return None

    def start_frontend_server(self):
        """تشغيل خادم الفرونت إند"""
        print("\n🌐 تشغيل خادم الفرونت إند...")
        
        if not self.frontend_dir.exists():
            print("❌ مجلد الفرونت إند غير موجود")
            return None
        
        try:
            # استخدام خادم HTTP بسيط
            process = subprocess.Popen([
                sys.executable, '-m', 'http.server', '8080'
            ], cwd=self.frontend_dir)
            
            print("✅ تم تشغيل خادم الفرونت إند على http://localhost:8080")
            return process
            
        except Exception as e:
            print(f"❌ خطأ في تشغيل الفرونت إند: {e}")
            return None

    def wait_for_services(self):
        """انتظار تشغيل الخدمات"""
        print("\n⏳ انتظار تشغيل الخدمات...")
        
        # انتظار الباك إند
        for i in range(30):
            try:
                import urllib.request
                urllib.request.urlopen('http://localhost:3000/api/v1/auth/stats', timeout=1)
                print("✅ الباك إند جاهز")
                break
            except:
                time.sleep(1)
                if i == 29:
                    print("⚠️ الباك إند قد يحتاج وقت إضافي للتشغيل")
        
        # انتظار الفرونت إند
        for i in range(10):
            try:
                import urllib.request
                urllib.request.urlopen('http://localhost:8080', timeout=1)
                print("✅ الفرونت إند جاهز")
                break
            except:
                time.sleep(1)
                if i == 9:
                    print("⚠️ الفرونت إند قد يحتاج وقت إضافي للتشغيل")

    def show_system_info(self):
        """عرض معلومات النظام"""
        print("\n" + "=" * 60)
        print("🎉 تم تشغيل نظام SmartCoin بنجاح!")
        print("=" * 60)
        print("🌐 الروابط:")
        print("   📱 الفرونت إند: http://localhost:8080")
        print("   🖥️  الباك إند: http://localhost:3000")
        print("   📚 API Docs: http://localhost:3000/api/docs")
        print("   🤖 بوت تليجرام: @SmartCoinBot")
        print()
        print("📋 الصفحات المتاحة:")
        print("   🔐 تسجيل الدخول: http://localhost:8080/login-ultra.html")
        print("   💰 الربح: http://localhost:8080/earn-ultra.html")
        print("   📊 المهام: http://localhost:8080/tasks-ultra.html")
        print("   🎰 عجلة الحظ: http://localhost:8080/wheel-ultra.html")
        print("   👥 الإحالات: http://localhost:8080/referrals-ultra.html")
        print("   💳 المحفظة: http://localhost:8080/wallet-ultra.html")
        print()
        print("⚡ الميزات:")
        print("   ✅ تسجيل دخول عبر تليجرام")
        print("   ✅ نظام تعدين ذكي")
        print("   ✅ مهام يومية")
        print("   ✅ نظام إحالات")
        print("   ✅ عجلة الحظ")
        print("   ✅ واجهة مستخدم متطورة")
        print()
        print("🛑 لإيقاف النظام: اضغط Ctrl+C")
        print("=" * 60)

    def signal_handler(self, signum, frame):
        """معالج إشارة الإيقاف"""
        print("\n\n🛑 إيقاف النظام...")
        self.running = False
        
        for process in self.processes:
            try:
                process.terminate()
                process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        print("✅ تم إيقاف جميع الخدمات")
        sys.exit(0)

    def run(self):
        """تشغيل النظام"""
        # إعداد معالج الإشارات
        signal.signal(signal.SIGINT, self.signal_handler)
        signal.signal(signal.SIGTERM, self.signal_handler)
        
        # فحص المتطلبات
        if not self.check_requirements():
            print("❌ فشل في فحص المتطلبات")
            return False
        
        # تثبيت التبعيات
        if not self.install_python_dependencies():
            print("❌ فشل في تثبيت تبعيات Python")
            return False
        
        if not self.install_node_dependencies():
            print("❌ فشل في تثبيت تبعيات Node.js")
            return False
        
        # إعداد البيئة
        if not self.setup_environment():
            print("❌ فشل في إعداد البيئة")
            return False
        
        # تشغيل الخدمات
        bot_process = self.start_telegram_bot()
        if bot_process:
            self.processes.append(bot_process)
        
        backend_process = self.start_backend_server()
        if backend_process:
            self.processes.append(backend_process)
        
        frontend_process = self.start_frontend_server()
        if frontend_process:
            self.processes.append(frontend_process)
        
        # انتظار تشغيل الخدمات
        self.wait_for_services()
        
        # عرض معلومات النظام
        self.show_system_info()
        
        # انتظار إيقاف النظام
        try:
            while self.running:
                time.sleep(1)
                
                # فحص حالة العمليات
                for process in self.processes[:]:
                    if process.poll() is not None:
                        print(f"⚠️ عملية توقفت: {process.pid}")
                        self.processes.remove(process)
        
        except KeyboardInterrupt:
            self.signal_handler(signal.SIGINT, None)
        
        return True

def main():
    """الدالة الرئيسية"""
    launcher = SmartCoinLauncher()
    success = launcher.run()
    
    if not success:
        print("❌ فشل في تشغيل النظام")
        sys.exit(1)

if __name__ == '__main__':
    main()

