// Enhanced Animations and Interactions for SmartCoin
// This file contains advanced animations and interactive effects

document.addEventListener('DOMContentLoaded', function() {
  console.log('تهيئة الحركات والتأثيرات المحسنة...');
  
  // تهيئة جميع التأثيرات
  initScrollAnimations();
  initParticleEffects();
  initInteractiveElements();
  initAdvancedAnimations();
  initFAQAnimations();
  initCounterAnimations();
  initTypewriterEffect();
  initFloatingElements();
  initMagneticButtons();
  initGlowEffects();
  
  console.log('تم تحميل جميع التأثيرات بنجاح!');
});

// تأثيرات التمرير المتقدمة
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const element = entry.target;
        
        // إضافة تأثيرات مختلفة حسب نوع العنصر
        if (element.classList.contains('feature-card')) {
          animateFeatureCard(element);
        } else if (element.classList.contains('step-card')) {
          animateStepCard(element);
        } else if (element.classList.contains('contact-method')) {
          animateContactMethod(element);
        } else {
          element.classList.add('fade-in');
        }
        
        observer.unobserve(element);
      }
    });
  }, observerOptions);

  // مراقبة العناصر القابلة للتحريك
  const animatableElements = document.querySelectorAll(
    '.feature-card, .step-card, .contact-method, .faq-item, .social-link'
  );
  
  animatableElements.forEach(element => {
    observer.observe(element);
  });
}

// تحريك بطاقات الميزات
function animateFeatureCard(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateY(50px) scale(0.9)';
  element.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0) scale(1)';
  }, Math.random() * 300);
}

// تحريك بطاقات الخطوات
function animateStepCard(element) {
  element.style.opacity = '0';
  element.style.transform = 'translateX(-50px) rotateY(-15deg)';
  element.style.transition = 'all 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateX(0) rotateY(0deg)';
  }, Math.random() * 400);
}

// تحريك طرق الاتصال
function animateContactMethod(element) {
  element.style.opacity = '0';
  element.style.transform = 'scale(0.8) rotate(-5deg)';
  element.style.transition = 'all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  
  setTimeout(() => {
    element.style.opacity = '1';
    element.style.transform = 'scale(1) rotate(0deg)';
  }, Math.random() * 200);
}

// تأثيرات الجزيئات المتحركة
function initParticleEffects() {
  createFloatingParticles();
  createMouseTrail();
}

// إنشاء جزيئات عائمة
function createFloatingParticles() {
  const particleContainer = document.createElement('div');
  particleContainer.className = 'particle-container';
  particleContainer.style.position = 'fixed';
  particleContainer.style.top = '0';
  particleContainer.style.left = '0';
  particleContainer.style.width = '100%';
  particleContainer.style.height = '100%';
  particleContainer.style.pointerEvents = 'none';
  particleContainer.style.zIndex = '-1';
  
  document.body.appendChild(particleContainer);
  
  // إنشاء جزيئات متعددة
  for (let i = 0; i < 20; i++) {
    createParticle(particleContainer);
  }
}

// إنشاء جزيء واحد
function createParticle(container) {
  const particle = document.createElement('div');
  particle.className = 'floating-particle';
  
  const size = Math.random() * 4 + 2;
  const colors = ['#FFD700', '#9C27B0', '#00BCD4', '#FF9800'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  particle.style.position = 'absolute';
  particle.style.width = size + 'px';
  particle.style.height = size + 'px';
  particle.style.backgroundColor = color;
  particle.style.borderRadius = '50%';
  particle.style.opacity = '0.6';
  particle.style.left = Math.random() * 100 + '%';
  particle.style.top = Math.random() * 100 + '%';
  particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;
  
  container.appendChild(particle);
  
  // تحريك الجزيء
  animateParticle(particle);
}

// تحريك الجزيء
function animateParticle(particle) {
  const duration = Math.random() * 20000 + 10000; // 10-30 ثانية
  const startX = parseFloat(particle.style.left);
  const startY = parseFloat(particle.style.top);
  const endX = Math.random() * 100;
  const endY = Math.random() * 100;
  
  particle.animate([
    {
      left: startX + '%',
      top: startY + '%',
      opacity: 0.6
    },
    {
      left: endX + '%',
      top: endY + '%',
      opacity: 0.2
    }
  ], {
    duration: duration,
    easing: 'ease-in-out'
  }).onfinish = () => {
    // إعادة تحريك الجزيء
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    animateParticle(particle);
  };
}

// إنشاء أثر الماوس
function createMouseTrail() {
  let mouseX = 0;
  let mouseY = 0;
  const trail = [];
  
  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    
    // إنشاء نقطة أثر جديدة
    createTrailPoint(mouseX, mouseY);
  });
}

// إنشاء نقطة أثر الماوس
function createTrailPoint(x, y) {
  const point = document.createElement('div');
  point.className = 'mouse-trail-point';
  point.style.position = 'fixed';
  point.style.left = x + 'px';
  point.style.top = y + 'px';
  point.style.width = '6px';
  point.style.height = '6px';
  point.style.backgroundColor = '#FFD700';
  point.style.borderRadius = '50%';
  point.style.pointerEvents = 'none';
  point.style.zIndex = '9999';
  point.style.opacity = '0.8';
  point.style.boxShadow = '0 0 10px #FFD700';
  
  document.body.appendChild(point);
  
  // تحريك وإزالة النقطة
  point.animate([
    { opacity: 0.8, transform: 'scale(1)' },
    { opacity: 0, transform: 'scale(0.3)' }
  ], {
    duration: 800,
    easing: 'ease-out'
  }).onfinish = () => {
    document.body.removeChild(point);
  };
}

// تأثيرات العناصر التفاعلية
function initInteractiveElements() {
  // تأثيرات الأزرار
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(button => {
    addButtonEffects(button);
  });
  
  // تأثيرات البطاقات
  const cards = document.querySelectorAll('.feature-card, .step-card, .contact-method');
  cards.forEach(card => {
    addCardEffects(card);
  });
}

// إضافة تأثيرات الأزرار
function addButtonEffects(button) {
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'translateY(-3px) scale(1.05)';
    createRippleEffect(button);
  });
  
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'translateY(0) scale(1)';
  });
  
  button.addEventListener('click', (e) => {
    createClickEffect(e.target, e.clientX, e.clientY);
  });
}

// إضافة تأثيرات البطاقات
function addCardEffects(card) {
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-8px) scale(1.02)';
    addGlowEffect(card);
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'translateY(0) scale(1)';
    removeGlowEffect(card);
  });
}

// إنشاء تأثير الموجة
function createRippleEffect(element) {
  const ripple = document.createElement('div');
  ripple.className = 'ripple-effect';
  ripple.style.position = 'absolute';
  ripple.style.borderRadius = '50%';
  ripple.style.background = 'rgba(255, 255, 255, 0.3)';
  ripple.style.transform = 'scale(0)';
  ripple.style.animation = 'ripple 0.6s linear';
  ripple.style.left = '50%';
  ripple.style.top = '50%';
  ripple.style.width = '20px';
  ripple.style.height = '20px';
  ripple.style.marginLeft = '-10px';
  ripple.style.marginTop = '-10px';
  
  element.style.position = 'relative';
  element.appendChild(ripple);
  
  setTimeout(() => {
    element.removeChild(ripple);
  }, 600);
}

// إنشاء تأثير النقر
function createClickEffect(element, x, y) {
  const effect = document.createElement('div');
  effect.className = 'click-effect';
  effect.style.position = 'fixed';
  effect.style.left = x + 'px';
  effect.style.top = y + 'px';
  effect.style.width = '20px';
  effect.style.height = '20px';
  effect.style.borderRadius = '50%';
  effect.style.background = 'radial-gradient(circle, #FFD700, transparent)';
  effect.style.pointerEvents = 'none';
  effect.style.zIndex = '9999';
  effect.style.transform = 'translate(-50%, -50%) scale(0)';
  
  document.body.appendChild(effect);
  
  effect.animate([
    { transform: 'translate(-50%, -50%) scale(0)', opacity: 1 },
    { transform: 'translate(-50%, -50%) scale(3)', opacity: 0 }
  ], {
    duration: 500,
    easing: 'ease-out'
  }).onfinish = () => {
    document.body.removeChild(effect);
  };
}

// تأثيرات متقدمة
function initAdvancedAnimations() {
  // تأثير التموج للعنوان الرئيسي
  const heroTitle = document.querySelector('.hero-title');
  if (heroTitle) {
    addWaveEffect(heroTitle);
  }
  
  // تأثير الدوران للشعار
  const logo = document.querySelector('.logo');
  if (logo) {
    addRotationEffect(logo);
  }
}

// إضافة تأثير التموج
function addWaveEffect(element) {
  const text = element.textContent;
  element.innerHTML = '';
  
  [...text].forEach((char, index) => {
    const span = document.createElement('span');
    span.textContent = char;
    span.style.display = 'inline-block';
    span.style.animation = `wave 2s ease-in-out infinite ${index * 0.1}s`;
    element.appendChild(span);
  });
}

// إضافة تأثير الدوران
function addRotationEffect(element) {
  let rotation = 0;
  
  setInterval(() => {
    rotation += 0.5;
    element.style.transform = `rotate(${rotation}deg)`;
  }, 50);
}

// تأثيرات الأسئلة الشائعة
function initFAQAnimations() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const answer = question.nextElementSibling;
      const icon = question.querySelector('.faq-icon');
      
      // تبديل حالة السؤال
      question.classList.toggle('active');
      answer.classList.toggle('active');
      
      // تحريك الأيقونة
      if (question.classList.contains('active')) {
        icon.style.transform = 'rotate(180deg)';
        animateAnswerOpen(answer);
      } else {
        icon.style.transform = 'rotate(0deg)';
        animateAnswerClose(answer);
      }
    });
  });
}

// تحريك فتح الإجابة
function animateAnswerOpen(answer) {
  answer.style.maxHeight = answer.scrollHeight + 'px';
  answer.style.opacity = '1';
}

// تحريك إغلاق الإجابة
function animateAnswerClose(answer) {
  answer.style.maxHeight = '0';
  answer.style.opacity = '0';
}

// تأثيرات العداد المتحرك
function initCounterAnimations() {
  const counters = document.querySelectorAll('[data-count]');
  
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-count'));
    animateCounter(counter, target);
  });
}

// تحريك العداد
function animateCounter(element, target) {
  let current = 0;
  const increment = target / 100;
  const timer = setInterval(() => {
    current += increment;
    element.textContent = Math.floor(current);
    
    if (current >= target) {
      element.textContent = target;
      clearInterval(timer);
    }
  }, 20);
}

// تأثير الكتابة المتحركة
function initTypewriterEffect() {
  const typewriterElements = document.querySelectorAll('.typewriter');
  
  typewriterElements.forEach(element => {
    const text = element.textContent;
    element.textContent = '';
    typeText(element, text, 0);
  });
}

// كتابة النص تدريجياً
function typeText(element, text, index) {
  if (index < text.length) {
    element.textContent += text.charAt(index);
    setTimeout(() => typeText(element, text, index + 1), 100);
  }
}

// العناصر العائمة
function initFloatingElements() {
  const floatingElements = document.querySelectorAll('.floating-element');
  
  floatingElements.forEach(element => {
    addFloatingAnimation(element);
  });
}

// إضافة تحريك عائم
function addFloatingAnimation(element) {
  const amplitude = Math.random() * 20 + 10;
  const frequency = Math.random() * 2 + 1;
  
  element.style.animation = `float ${frequency}s ease-in-out infinite`;
  element.style.setProperty('--amplitude', amplitude + 'px');
}

// الأزرار المغناطيسية
function initMagneticButtons() {
  const magneticButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
  
  magneticButtons.forEach(button => {
    addMagneticEffect(button);
  });
}

// إضافة تأثير مغناطيسي
function addMagneticEffect(element) {
  element.addEventListener('mousemove', (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px) scale(1.05)`;
  });
  
  element.addEventListener('mouseleave', () => {
    element.style.transform = 'translate(0, 0) scale(1)';
  });
}

// تأثيرات الوهج
function initGlowEffects() {
  const glowElements = document.querySelectorAll('.glow-effect');
  
  glowElements.forEach(element => {
    addPulsingGlow(element);
  });
}

// إضافة وهج نابض
function addPulsingGlow(element) {
  let intensity = 0;
  let direction = 1;
  
  setInterval(() => {
    intensity += direction * 0.02;
    
    if (intensity >= 1) {
      direction = -1;
    } else if (intensity <= 0) {
      direction = 1;
    }
    
    element.style.boxShadow = `0 0 ${20 + intensity * 20}px rgba(255, 215, 0, ${0.3 + intensity * 0.3})`;
  }, 50);
}

// إضافة تأثير الوهج
function addGlowEffect(element) {
  element.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.4)';
}

// إزالة تأثير الوهج
function removeGlowEffect(element) {
  element.style.boxShadow = '';
}

// إضافة CSS للحركات المخصصة
const style = document.createElement('style');
style.textContent = `
  @keyframes wave {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(var(--amplitude, -20px)); }
  }
  
  .particle-container {
    overflow: hidden;
  }
  
  .floating-particle {
    animation: particleFloat 20s linear infinite;
  }
  
  @keyframes particleFloat {
    0% {
      transform: translateY(0) rotate(0deg);
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100vh) rotate(360deg);
      opacity: 0;
    }
  }
`;

document.head.appendChild(style);

// تصدير الوظائف للاستخدام الخارجي
window.SmartCoinAnimations = {
  createRippleEffect,
  createClickEffect,
  addGlowEffect,
  removeGlowEffect,
  animateCounter,
  typeText
};

