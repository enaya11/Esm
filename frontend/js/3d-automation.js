// نظام الأتمتة ثلاثية الأبعاد المتقدم لمنصة SmartCoin
class SmartCoin3DAutomation {
    constructor() {
        this.isInitialized = false;
        this.miningInProgress = false;
        this.animationFrameId = null;
        this.particles = [];
        this.soundEnabled = true;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.createBackgroundEffects();
        this.initializeMiningButton();
        this.startAutomationLoop();
        this.setupResponsiveEffects();
        
        this.isInitialized = true;
        console.log('🚀 نظام الأتمتة ثلاثية الأبعاد تم تفعيله بنجاح!');
    }

    setupEventListeners() {
        // مستمع تحميل الصفحة
        document.addEventListener('DOMContentLoaded', () => {
            this.enhancePageElements();
            this.startPageLoadAnimation();
        });

        // مستمع حركة الماوس للتأثيرات التفاعلية
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });

        // مستمع تغيير حجم النافذة
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // مستمع التمرير للتأثيرات المتوازية
        window.addEventListener('scroll', () => {
            this.handleScroll();
        });
    }

    // تحسين عناصر الصفحة بتأثيرات ثلاثية الأبعاد
    enhancePageElements() {
        // تحسين البطاقات
        const cards = document.querySelectorAll('.card, .task-card, .stat-card');
        cards.forEach((card, index) => {
            this.enhance3DCard(card, index);
        });

        // تحسين الأزرار
        const buttons = document.querySelectorAll('button:not(.mining-button)');
        buttons.forEach((button, index) => {
            this.enhance3DButton(button, index);
        });

        // تحسين العدادات
        const counters = document.querySelectorAll('.balance, .coins, .level, .progress');
        counters.forEach((counter, index) => {
            this.enhance3DCounter(counter, index);
        });

        // تحسين أشرطة التقدم
        const progressBars = document.querySelectorAll('.progress-bar');
        progressBars.forEach((bar, index) => {
            this.enhance3DProgressBar(bar, index);
        });
    }

    // تحسين البطاقات ثلاثية الأبعاد
    enhance3DCard(card, index) {
        card.classList.add('card-3d');
        card.style.animationDelay = `${index * 0.1}s`;
        
        // إضافة تأثير الإضاءة
        const lightEffect = document.createElement('div');
        lightEffect.className = 'card-light-effect';
        lightEffect.innerHTML = `
            <div class="light-beam"></div>
            <div class="light-glow"></div>
        `;
        card.appendChild(lightEffect);

        // إضافة مستمع التفاعل
        card.addEventListener('mouseenter', () => {
            this.triggerCardHoverEffect(card);
        });

        card.addEventListener('mouseleave', () => {
            this.resetCardEffect(card);
        });
    }

    // تحسين الأزرار ثلاثية الأبعاد
    enhance3DButton(button, index) {
        if (button.classList.contains('enhanced')) return;
        
        button.classList.add('btn-3d', 'enhanced');
        button.style.animationDelay = `${index * 0.05}s`;

        // إضافة تأثير الموجات
        const rippleEffect = document.createElement('div');
        rippleEffect.className = 'button-ripple-effect';
        button.appendChild(rippleEffect);

        // إضافة تأثير الجزيئات
        const particleEffect = document.createElement('div');
        particleEffect.className = 'button-particle-effect';
        button.appendChild(particleEffect);

        // مستمع النقر
        button.addEventListener('click', (e) => {
            this.triggerButtonClickEffect(button, e);
        });
    }

    // تحسين العدادات ثلاثية الأبعاد
    enhance3DCounter(counter, index) {
        counter.classList.add('counter-3d');
        counter.style.animationDelay = `${index * 0.2}s`;

        // إضافة تأثير العد المتحرك
        const originalValue = counter.textContent;
        this.animateCounterValue(counter, 0, parseFloat(originalValue) || 0);
    }

    // تحسين أشرطة التقدم ثلاثية الأبعاد
    enhance3DProgressBar(bar, index) {
        const container = bar.parentElement;
        container.classList.add('progress-3d');
        bar.classList.add('progress-bar-3d');

        // إضافة تأثير الجزيئات المتحركة
        const particles = document.createElement('div');
        particles.className = 'progress-particles';
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'progress-particle';
            particle.style.animationDelay = `${i * 0.2}s`;
            particles.appendChild(particle);
        }
        container.appendChild(particles);
    }

    // إنشاء زر التعدين المذهل
    initializeMiningButton() {
        const miningContainer = document.querySelector('.mining-container, #mining-section');
        if (!miningContainer) return;

        // إنشاء الحاوية الجديدة
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'mining-button-container';
        buttonContainer.innerHTML = `
            <div class="mining-particles">
                ${Array.from({length: 6}, () => '<div class="particle"></div>').join('')}
            </div>
            <div class="energy-ring"></div>
            <button class="mining-button" id="enhanced-mining-btn">
                <div class="mining-button-inner">
                    <div class="mining-icon">⛏️</div>
                    <div class="mining-text">بدء التعدين</div>
                </div>
            </button>
        `;

        // استبدال الزر القديم
        const oldButton = miningContainer.querySelector('button, .mining-btn');
        if (oldButton) {
            oldButton.replaceWith(buttonContainer);
        } else {
            miningContainer.appendChild(buttonContainer);
        }

        // إضافة مستمعي الأحداث
        const miningButton = buttonContainer.querySelector('.mining-button');
        miningButton.addEventListener('click', () => {
            this.startMiningProcess();
        });

        // إضافة تأثيرات الصوت (اختيارية)
        this.setupSoundEffects(miningButton);
    }

    // بدء عملية التعدين مع التأثيرات
    async startMiningProcess() {
        if (this.miningInProgress) return;

        const miningButton = document.querySelector('.mining-button');
        const miningIcon = miningButton.querySelector('.mining-icon');
        const miningText = miningButton.querySelector('.mining-text');

        try {
            this.miningInProgress = true;
            miningButton.classList.add('mining-active');
            miningText.textContent = 'جاري التعدين...';

            // تأثيرات بصرية
            this.startMiningVisualEffects();

            // محاكاة عملية التعدين
            await this.simulateMiningProcess();

            // النتيجة
            const result = await this.processMining();
            
            if (result.success) {
                await this.showMiningSuccess(result.amount);
                this.updateBalance(result.amount);
            } else {
                await this.showMiningError(result.error);
            }

        } catch (error) {
            console.error('خطأ في التعدين:', error);
            await this.showMiningError('حدث خطأ غير متوقع');
        } finally {
            this.miningInProgress = false;
            miningButton.classList.remove('mining-active');
            miningText.textContent = 'بدء التعدين';
            this.stopMiningVisualEffects();
        }
    }

    // محاكاة عملية التعدين
    async simulateMiningProcess() {
        return new Promise((resolve) => {
            let progress = 0;
            const progressBar = this.createMiningProgressBar();
            
            const interval = setInterval(() => {
                progress += Math.random() * 10;
                this.updateMiningProgress(progressBar, progress);
                
                if (progress >= 100) {
                    clearInterval(interval);
                    progressBar.remove();
                    resolve();
                }
            }, 200);
        });
    }

    // إنشاء شريط تقدم التعدين
    createMiningProgressBar() {
        const progressContainer = document.createElement('div');
        progressContainer.className = 'mining-progress-container';
        progressContainer.innerHTML = `
            <div class="mining-progress-label">تقدم التعدين</div>
            <div class="progress-3d">
                <div class="progress-bar-3d mining-progress-bar" style="width: 0%"></div>
            </div>
            <div class="mining-progress-text">0%</div>
        `;

        const miningContainer = document.querySelector('.mining-button-container');
        miningContainer.appendChild(progressContainer);

        return progressContainer;
    }

    // تحديث تقدم التعدين
    updateMiningProgress(progressContainer, progress) {
        const progressBar = progressContainer.querySelector('.mining-progress-bar');
        const progressText = progressContainer.querySelector('.mining-progress-text');
        
        const clampedProgress = Math.min(progress, 100);
        progressBar.style.width = `${clampedProgress}%`;
        progressText.textContent = `${Math.round(clampedProgress)}%`;
    }

    // معالجة التعدين الفعلي
    async processMining() {
        try {
            // التحقق من المصادقة
            if (!authSystem.isLoggedIn()) {
                throw new Error('يجب تسجيل الدخول أولاً');
            }

            const token = authSystem.getToken();
            const response = await fetch('/api/mining/start', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
                return {
                    success: true,
                    amount: result.amount || Math.floor(Math.random() * 50) + 10
                };
            } else {
                throw new Error(result.message || 'فشل في التعدين');
            }
        } catch (error) {
            console.error('خطأ في معالجة التعدين:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // إظهار نجاح التعدين
    async showMiningSuccess(amount) {
        // إنشاء تأثير الانفجار
        this.createSuccessExplosion();

        // إظهار رسالة النجاح
        const successMessage = this.createFloatingMessage(
            `🎉 تم التعدين بنجاح!\n💰 حصلت على ${amount} عملة SM`,
            'success'
        );

        // تأثير صوتي
        this.playSuccessSound();

        // انتظار لإظهار التأثيرات
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        successMessage.remove();
    }

    // إظهار خطأ التعدين
    async showMiningError(error) {
        const errorMessage = this.createFloatingMessage(
            `❌ فشل في التعدين\n${error}`,
            'error'
        );

        await new Promise(resolve => setTimeout(resolve, 3000));
        errorMessage.remove();
    }

    // إنشاء رسالة عائمة
    createFloatingMessage(text, type) {
        const message = document.createElement('div');
        message.className = `floating-message floating-message-${type}`;
        message.innerHTML = `
            <div class="floating-message-content">
                ${text.split('\n').map(line => `<div>${line}</div>`).join('')}
            </div>
        `;

        document.body.appendChild(message);

        // تأثير الظهور
        setTimeout(() => {
            message.classList.add('show');
        }, 100);

        return message;
    }

    // تحديث الرصيد مع تأثيرات
    updateBalance(amount) {
        const balanceElements = document.querySelectorAll('.balance, .user-balance, #sm-balance');
        
        balanceElements.forEach(element => {
            const currentBalance = parseFloat(element.textContent) || 0;
            const newBalance = currentBalance + amount;
            
            // تأثير العد المتحرك
            this.animateCounterValue(element, currentBalance, newBalance);
            
            // تأثير الوهج
            element.classList.add('balance-updated');
            setTimeout(() => {
                element.classList.remove('balance-updated');
            }, 2000);
        });
    }

    // تحريك قيمة العداد
    animateCounterValue(element, startValue, endValue, duration = 1000) {
        const startTime = performance.now();
        const difference = endValue - startValue;

        const updateCounter = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // استخدام easing function للحركة الطبيعية
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (difference * easeOutQuart);
            
            element.textContent = Math.round(currentValue);
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            }
        };

        requestAnimationFrame(updateCounter);
    }

    // إنشاء تأثيرات الخلفية
    createBackgroundEffects() {
        const backgroundContainer = document.createElement('div');
        backgroundContainer.className = 'background-3d';
        
        // إضافة الأشكال العائمة
        for (let i = 0; i < 3; i++) {
            const shape = document.createElement('div');
            shape.className = 'floating-shape';
            backgroundContainer.appendChild(shape);
        }

        document.body.appendChild(backgroundContainer);
    }

    // بدء التأثيرات البصرية للتعدين
    startMiningVisualEffects() {
        const particles = document.querySelectorAll('.mining-particles .particle');
        particles.forEach((particle, index) => {
            particle.style.animationDuration = '0.5s';
            particle.style.animationDelay = `${index * 0.1}s`;
        });

        // تأثير الطاقة
        const energyRing = document.querySelector('.energy-ring');
        if (energyRing) {
            energyRing.style.animationDuration = '1s';
        }
    }

    // إيقاف التأثيرات البصرية للتعدين
    stopMiningVisualEffects() {
        const particles = document.querySelectorAll('.mining-particles .particle');
        particles.forEach(particle => {
            particle.style.animationDuration = '3s';
        });

        const energyRing = document.querySelector('.energy-ring');
        if (energyRing) {
            energyRing.style.animationDuration = '4s';
        }
    }

    // إنشاء تأثير الانفجار للنجاح
    createSuccessExplosion() {
        const explosion = document.createElement('div');
        explosion.className = 'success-explosion';
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.setProperty('--angle', `${(360 / 20) * i}deg`);
            particle.style.setProperty('--delay', `${i * 0.05}s`);
            explosion.appendChild(particle);
        }

        const miningContainer = document.querySelector('.mining-button-container');
        miningContainer.appendChild(explosion);

        setTimeout(() => {
            explosion.remove();
        }, 2000);
    }

    // معالجة حركة الماوس للتأثيرات التفاعلية
    handleMouseMove(e) {
        const cards = document.querySelectorAll('.card-3d');
        
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            const deltaX = (e.clientX - centerX) / (rect.width / 2);
            const deltaY = (e.clientY - centerY) / (rect.height / 2);
            
            const rotateX = deltaY * 10;
            const rotateY = deltaX * 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
    }

    // معالجة تغيير حجم النافذة
    handleResize() {
        // إعادة حساب المواضع والأحجام
        this.recalculateEffects();
    }

    // معالجة التمرير للتأثيرات المتوازية
    handleScroll() {
        const scrollY = window.scrollY;
        const floatingShapes = document.querySelectorAll('.floating-shape');
        
        floatingShapes.forEach((shape, index) => {
            const speed = 0.5 + (index * 0.2);
            shape.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }

    // بدء حلقة الأتمتة
    startAutomationLoop() {
        const animate = () => {
            this.updateAnimations();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    // تحديث الرسوم المتحركة
    updateAnimations() {
        // تحديث الجزيئات
        this.updateParticles();
        
        // تحديث التأثيرات التفاعلية
        this.updateInteractiveEffects();
    }

    // تحديث الجزيئات
    updateParticles() {
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            // تحديث موضع الجزيئات بناءً على الوقت
            const time = Date.now() * 0.001;
            const offset = parseFloat(particle.style.animationDelay) || 0;
            const y = Math.sin(time + offset) * 10;
            const x = Math.cos(time + offset) * 5;
            
            particle.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // تحديث التأثيرات التفاعلية
    updateInteractiveEffects() {
        // تحديث تأثيرات الإضاءة والوهج
        const glowElements = document.querySelectorAll('.card-3d, .btn-3d, .counter-3d');
        const time = Date.now() * 0.002;
        
        glowElements.forEach((element, index) => {
            const intensity = (Math.sin(time + index) + 1) * 0.5;
            element.style.setProperty('--glow-intensity', intensity);
        });
    }

    // إعداد التأثيرات المتجاوبة
    setupResponsiveEffects() {
        const mediaQuery = window.matchMedia('(max-width: 768px)');
        
        const handleResponsive = (e) => {
            if (e.matches) {
                // تقليل التأثيرات للأجهزة المحمولة
                this.enableMobileOptimizations();
            } else {
                // تفعيل التأثيرات الكاملة للأجهزة المكتبية
                this.enableDesktopEffects();
            }
        };

        mediaQuery.addListener(handleResponsive);
        handleResponsive(mediaQuery);
    }

    // تحسينات الأجهزة المحمولة
    enableMobileOptimizations() {
        document.body.classList.add('mobile-optimized');
        
        // تقليل عدد الجزيئات
        const particles = document.querySelectorAll('.particle');
        particles.forEach((particle, index) => {
            if (index > 3) particle.style.display = 'none';
        });
    }

    // تأثيرات الأجهزة المكتبية
    enableDesktopEffects() {
        document.body.classList.remove('mobile-optimized');
        
        // إظهار جميع الجزيئات
        const particles = document.querySelectorAll('.particle');
        particles.forEach(particle => {
            particle.style.display = 'block';
        });
    }

    // إعداد التأثيرات الصوتية
    setupSoundEffects(button) {
        if (!this.soundEnabled) return;

        // أصوات التفاعل (يمكن إضافة ملفات صوتية حقيقية)
        const sounds = {
            click: () => this.playTone(800, 100),
            success: () => this.playSuccessSound(),
            error: () => this.playErrorSound()
        };

        button.addEventListener('click', sounds.click);
    }

    // تشغيل نغمة
    playTone(frequency, duration) {
        if (!this.soundEnabled || !window.AudioContext) return;

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration / 1000);
    }

    // تشغيل صوت النجاح
    playSuccessSound() {
        this.playTone(523, 200); // C5
        setTimeout(() => this.playTone(659, 200), 100); // E5
        setTimeout(() => this.playTone(784, 300), 200); // G5
    }

    // تشغيل صوت الخطأ
    playErrorSound() {
        this.playTone(200, 500);
    }

    // تفعيل/إلغاء تفعيل الصوت
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        console.log(`الصوت ${this.soundEnabled ? 'مفعل' : 'معطل'}`);
    }

    // تنظيف الموارد
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        // إزالة مستمعي الأحداث
        document.removeEventListener('mousemove', this.handleMouseMove);
        window.removeEventListener('resize', this.handleResize);
        window.removeEventListener('scroll', this.handleScroll);
        
        console.log('تم تنظيف نظام الأتمتة ثلاثية الأبعاد');
    }
}

// إنشاء مثيل النظام وتفعيله
const smartCoin3D = new SmartCoin3DAutomation();

// إضافة دوال عامة للاستخدام
window.smartCoin3D = smartCoin3D;
window.toggleSound = () => smartCoin3D.toggleSound();

// تصدير للاستخدام في ملفات أخرى
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartCoin3DAutomation;
}

