// SmartCoin Ultra Animations - نظام أتمتة متقدم وتأثيرات خارقة

class UltraAnimations {
    constructor() {
        this.isInitialized = false;
        this.observers = [];
        this.particles = [];
        this.animationFrameId = null;
        this.mousePosition = { x: 0, y: 0 };
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        console.log('🚀 تهيئة نظام الأتمتة المتقدم...');
        
        // انتظار تحميل DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupAnimations());
        } else {
            this.setupAnimations();
        }
        
        this.isInitialized = true;
    }

    setupAnimations() {
        this.setupIntersectionObserver();
        this.setupMouseTracking();
        this.setupParticleSystem();
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupLoadingAnimations();
        this.setupTypewriterEffect();
        this.setupFloatingElements();
        this.setupGlitchEffects();
        this.setupMorphingShapes();
        this.startAnimationLoop();
        
        console.log('✨ تم تفعيل جميع التأثيرات المتقدمة');
    }

    // نظام مراقبة العناصر للأتمتة
    setupIntersectionObserver() {
        const observerOptions = {
            threshold: [0, 0.1, 0.5, 0.9],
            rootMargin: '50px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const element = entry.target;
                const ratio = entry.intersectionRatio;

                if (ratio > 0.1) {
                    this.animateElementEntry(element, ratio);
                } else {
                    this.animateElementExit(element);
                }
            });
        }, observerOptions);

        // مراقبة جميع العناصر القابلة للأتمتة
        const animatableElements = document.querySelectorAll(
            '.card-ultra, .btn-ultra, .text-gradient, .glass-effect, .hover-lift, [data-animate]'
        );

        animatableElements.forEach(el => {
            observer.observe(el);
            el.style.opacity = '0';
            el.style.transform = 'translateY(50px)';
        });

        this.observers.push(observer);
    }

    animateElementEntry(element, ratio) {
        const delay = Array.from(element.parentNode.children).indexOf(element) * 100;
        
        setTimeout(() => {
            element.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
            
            // إضافة تأثيرات خاصة حسب نوع العنصر
            if (element.classList.contains('card-ultra')) {
                this.addCardSparkle(element);
            }
            
            if (element.classList.contains('btn-ultra')) {
                this.addButtonPulse(element);
            }
            
            if (element.classList.contains('text-gradient')) {
                this.addTextShimmer(element);
            }
        }, delay);
    }

    animateElementExit(element) {
        // تأثيرات الخروج (اختيارية)
    }

    // نظام تتبع الماوس للتأثيرات التفاعلية
    setupMouseTracking() {
        document.addEventListener('mousemove', (e) => {
            this.mousePosition.x = e.clientX;
            this.mousePosition.y = e.clientY;
            
            this.updateParallaxElements(e);
            this.updateGlowEffects(e);
        });
    }

    updateParallaxElements(e) {
        const parallaxElements = document.querySelectorAll('[data-parallax]');
        
        parallaxElements.forEach(element => {
            const speed = element.dataset.parallax || 0.1;
            const x = (e.clientX - window.innerWidth / 2) * speed;
            const y = (e.clientY - window.innerHeight / 2) * speed;
            
            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    updateGlowEffects(e) {
        const glowElements = document.querySelectorAll('.glow-follow');
        
        glowElements.forEach(element => {
            const rect = element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            element.style.setProperty('--mouse-x', `${x}px`);
            element.style.setProperty('--mouse-y', `${y}px`);
        });
    }

    // نظام الجسيمات المتقدم
    setupParticleSystem() {
        this.createParticleCanvas();
        this.generateParticles();
    }

    createParticleCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particle-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            opacity: 0.6;
        `;
        
        document.body.appendChild(canvas);
        
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resizeCanvas();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    generateParticles() {
        const particleCount = Math.min(100, Math.floor(window.innerWidth / 20));
        
        for (let i = 0; i < particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 3 + 1,
                opacity: Math.random() * 0.5 + 0.2,
                color: this.getRandomColor(),
                life: Math.random() * 100 + 50
            });
        }
    }

    getRandomColor() {
        const colors = ['#FFD700', '#00FFFF', '#8A2BE2', '#39FF14', '#FF1493'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach((particle, index) => {
            // تحديث الموقع
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // إعادة تدوير الجسيمات
            if (particle.x < 0) particle.x = this.canvas.width;
            if (particle.x > this.canvas.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.canvas.height;
            if (particle.y > this.canvas.height) particle.y = 0;
            
            // تأثير الماوس
            const dx = this.mousePosition.x - particle.x;
            const dy = this.mousePosition.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx += (dx / distance) * force * 0.1;
                particle.vy += (dy / distance) * force * 0.1;
            }
            
            // رسم الجسيمة
            this.ctx.save();
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fillStyle = particle.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
            
            // تقليل السرعة
            particle.vx *= 0.99;
            particle.vy *= 0.99;
        });
    }

    // تأثيرات التمرير المتقدمة
    setupScrollAnimations() {
        let ticking = false;
        
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.updateScrollEffects();
                    ticking = false;
                });
                ticking = true;
            }
        });
    }

    updateScrollEffects() {
        const scrollY = window.pageYOffset;
        const windowHeight = window.innerHeight;
        
        // تأثير البارالاكس للخلفية
        const parallaxBg = document.querySelector('.parallax-bg');
        if (parallaxBg) {
            parallaxBg.style.transform = `translateY(${scrollY * 0.5}px)`;
        }
        
        // تأثير الكشف التدريجي
        const revealElements = document.querySelectorAll('.scroll-reveal');
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < windowHeight - elementVisible) {
                element.classList.add('revealed');
            }
        });
        
        // تأثير تغيير الشفافية حسب التمرير
        const fadeElements = document.querySelectorAll('.scroll-fade');
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const opacity = Math.max(0, Math.min(1, 1 - (elementTop / windowHeight)));
            element.style.opacity = opacity;
        });
    }

    // تأثيرات التحويم المتقدمة
    setupHoverEffects() {
        // تأثير الموجة للأزرار
        document.querySelectorAll('.btn-ultra').forEach(button => {
            button.addEventListener('mouseenter', (e) => {
                this.createRippleEffect(e.target, e);
            });
        });
        
        // تأثير الإضاءة للبطاقات
        document.querySelectorAll('.card-ultra').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                this.updateCardGlow(card, e);
            });
            
            card.addEventListener('mouseleave', () => {
                this.resetCardGlow(card);
            });
        });
        
        // تأثير التكبير للصور
        document.querySelectorAll('img').forEach(img => {
            img.addEventListener('mouseenter', () => {
                img.style.transform = 'scale(1.05)';
                img.style.transition = 'transform 0.3s ease';
            });
            
            img.addEventListener('mouseleave', () => {
                img.style.transform = 'scale(1)';
            });
        });
    }

    createRippleEffect(element, event) {
        const ripple = document.createElement('span');
        const rect = element.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s ease-out;
            pointer-events: none;
        `;
        
        element.style.position = 'relative';
        element.style.overflow = 'hidden';
        element.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }

    updateCardGlow(card, event) {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        
        card.style.background = `
            radial-gradient(circle at ${x}% ${y}%, 
            rgba(255, 215, 0, 0.1) 0%, 
            transparent 50%), 
            var(--sc-glass-bg)
        `;
    }

    resetCardGlow(card) {
        card.style.background = 'var(--sc-glass-bg)';
    }

    // تأثيرات التحميل
    setupLoadingAnimations() {
        // إنشاء شاشة تحميل متقدمة
        this.createAdvancedLoader();
        
        // إخفاء شاشة التحميل عند اكتمال التحميل
        window.addEventListener('load', () => {
            setTimeout(() => {
                this.hideLoader();
            }, 2000);
        });
    }

    createAdvancedLoader() {
        const loader = document.createElement('div');
        loader.id = 'ultra-loader';
        loader.innerHTML = `
            <div class="loader-content">
                <div class="loader-logo">
                    <div class="logo-text">SmartCoin</div>
                    <div class="loader-particles"></div>
                </div>
                <div class="loader-progress">
                    <div class="progress-bar"></div>
                    <div class="progress-text">جاري التحميل...</div>
                </div>
            </div>
        `;
        
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #000428, #004e92);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            opacity: 1;
            transition: opacity 1s ease;
        `;
        
        document.body.appendChild(loader);
        this.animateLoader();
    }

    animateLoader() {
        const progressBar = document.querySelector('#ultra-loader .progress-bar');
        const progressText = document.querySelector('#ultra-loader .progress-text');
        let progress = 0;
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            if (progressBar) {
                progressBar.style.width = `${progress}%`;
            }
            
            if (progressText) {
                progressText.textContent = `جاري التحميل... ${Math.floor(progress)}%`;
            }
            
            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 200);
    }

    hideLoader() {
        const loader = document.getElementById('ultra-loader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.remove();
            }, 1000);
        }
    }

    // تأثير الكتابة التدريجية
    setupTypewriterEffect() {
        const typewriterElements = document.querySelectorAll('.typewriter');
        
        typewriterElements.forEach(element => {
            const text = element.textContent;
            element.textContent = '';
            element.style.borderRight = '2px solid var(--sc-gold)';
            
            let i = 0;
            const typeInterval = setInterval(() => {
                element.textContent += text.charAt(i);
                i++;
                
                if (i >= text.length) {
                    clearInterval(typeInterval);
                    setTimeout(() => {
                        element.style.borderRight = 'none';
                    }, 1000);
                }
            }, 100);
        });
    }

    // العناصر العائمة
    setupFloatingElements() {
        const floatingElements = document.querySelectorAll('.floating');
        
        floatingElements.forEach((element, index) => {
            const duration = 3 + Math.random() * 2;
            const delay = index * 0.5;
            
            element.style.animation = `float ${duration}s ease-in-out ${delay}s infinite`;
        });
    }

    // تأثيرات الخلل (Glitch)
    setupGlitchEffects() {
        const glitchElements = document.querySelectorAll('.glitch');
        
        glitchElements.forEach(element => {
            setInterval(() => {
                if (Math.random() < 0.1) { // 10% احتمال
                    element.classList.add('glitch-active');
                    setTimeout(() => {
                        element.classList.remove('glitch-active');
                    }, 200);
                }
            }, 2000);
        });
    }

    // الأشكال المتحولة
    setupMorphingShapes() {
        const morphElements = document.querySelectorAll('.morph-shape');
        
        morphElements.forEach(element => {
            let morphState = 0;
            
            setInterval(() => {
                morphState = (morphState + 1) % 4;
                element.style.borderRadius = this.getMorphRadius(morphState);
            }, 2000);
        });
    }

    getMorphRadius(state) {
        const radiuses = [
            '50%',
            '10% 90% 10% 90%',
            '90% 10% 90% 10%',
            '50% 10% 50% 10%'
        ];
        return radiuses[state];
    }

    // حلقة الأتمتة الرئيسية
    startAnimationLoop() {
        const animate = () => {
            this.updateParticles();
            this.updateFloatingElements();
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    updateFloatingElements() {
        const time = Date.now() * 0.001;
        const floatingElements = document.querySelectorAll('.auto-float');
        
        floatingElements.forEach((element, index) => {
            const offset = index * 0.5;
            const y = Math.sin(time + offset) * 10;
            const x = Math.cos(time * 0.5 + offset) * 5;
            
            element.style.transform = `translate(${x}px, ${y}px)`;
        });
    }

    // إضافة تأثيرات خاصة للعناصر
    addCardSparkle(card) {
        const sparkle = document.createElement('div');
        sparkle.className = 'card-sparkle';
        sparkle.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            width: 20px;
            height: 20px;
            background: radial-gradient(circle, var(--sc-gold) 0%, transparent 70%);
            border-radius: 50%;
            animation: sparkle 2s ease-in-out infinite;
            pointer-events: none;
        `;
        
        card.style.position = 'relative';
        card.appendChild(sparkle);
        
        setTimeout(() => {
            sparkle.remove();
        }, 2000);
    }

    addButtonPulse(button) {
        button.style.animation = 'buttonPulse 1s ease-in-out';
        
        setTimeout(() => {
            button.style.animation = '';
        }, 1000);
    }

    addTextShimmer(text) {
        text.style.animation = 'textShimmer 2s ease-in-out';
        
        setTimeout(() => {
            text.style.animation = '';
        }, 2000);
    }

    // تنظيف الموارد
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        
        this.observers.forEach(observer => observer.disconnect());
        
        const canvas = document.getElementById('particle-canvas');
        if (canvas) {
            canvas.remove();
        }
        
        const loader = document.getElementById('ultra-loader');
        if (loader) {
            loader.remove();
        }
        
        console.log('🧹 تم تنظيف نظام الأتمتة');
    }
}

// إضافة الأنيميشنز CSS المطلوبة
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
    }
    
    @keyframes sparkle {
        0%, 100% { opacity: 0; transform: scale(0); }
        50% { opacity: 1; transform: scale(1); }
    }
    
    @keyframes buttonPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
    
    @keyframes textShimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
    }
    
    .glitch-active {
        animation: glitch 0.2s ease-in-out;
    }
    
    @keyframes glitch {
        0% { transform: translate(0); }
        20% { transform: translate(-2px, 2px); }
        40% { transform: translate(-2px, -2px); }
        60% { transform: translate(2px, 2px); }
        80% { transform: translate(2px, -2px); }
        100% { transform: translate(0); }
    }
    
    .scroll-reveal {
        opacity: 0;
        transform: translateY(50px);
        transition: all 0.8s ease;
    }
    
    .scroll-reveal.revealed {
        opacity: 1;
        transform: translateY(0);
    }
    
    .typewriter {
        overflow: hidden;
        white-space: nowrap;
    }
    
    .floating {
        animation: float 3s ease-in-out infinite;
    }
    
    .morph-shape {
        transition: border-radius 2s ease-in-out;
    }
    
    .glow-follow {
        position: relative;
        overflow: hidden;
    }
    
    .glow-follow::before {
        content: '';
        position: absolute;
        top: var(--mouse-y, 50%);
        left: var(--mouse-x, 50%);
        width: 100px;
        height: 100px;
        background: radial-gradient(circle, rgba(255, 215, 0, 0.3) 0%, transparent 70%);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .glow-follow:hover::before {
        opacity: 1;
    }
    
    #ultra-loader .loader-content {
        text-align: center;
        color: white;
    }
    
    #ultra-loader .logo-text {
        font-size: 3rem;
        font-weight: 800;
        background: var(--sc-gold-gradient);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 2rem;
        animation: logoGlow 2s ease-in-out infinite alternate;
    }
    
    @keyframes logoGlow {
        from { filter: drop-shadow(0 0 10px var(--sc-gold)); }
        to { filter: drop-shadow(0 0 30px var(--sc-gold)); }
    }
    
    #ultra-loader .loader-progress {
        width: 300px;
        margin: 0 auto;
    }
    
    #ultra-loader .progress-bar {
        width: 0%;
        height: 4px;
        background: var(--sc-gold-gradient);
        border-radius: 2px;
        transition: width 0.3s ease;
        box-shadow: 0 0 10px var(--sc-gold);
    }
    
    #ultra-loader .progress-text {
        margin-top: 1rem;
        font-size: 1.2rem;
        opacity: 0.8;
    }
`;

document.head.appendChild(animationStyles);

// تهيئة النظام تلقائياً
const ultraAnimations = new UltraAnimations();

// تصدير للاستخدام العام
window.UltraAnimations = UltraAnimations;
window.ultraAnimations = ultraAnimations;

console.log('🎨 تم تحميل نظام الأتمتة المتقدم بنجاح!');

