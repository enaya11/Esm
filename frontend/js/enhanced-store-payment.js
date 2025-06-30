// نظام الدفع المحسن في المتجر - SmartCoin
document.addEventListener('DOMContentLoaded', function() {
  // عناوين المحافظ الفعلية
  const WALLET_ADDRESSES = {
    TON: 'UQAmI5QQbc7HbxSbUHUkh5_7vltnn_bWb3qmS3pz7S1YPgbV',
    SOLANA: '6SeS6QVwkEuBvW8ibCMcenY9c522q9W4PV95xbRhFEZv'
  };
  
  // حزم التعدين مع الأسعار المحدثة
  const miningPackages = [
    { 
      id: 1, 
      name: 'باقة أساسية', 
      rate: 20, 
      price: 1,
      description: 'مثالية للمبتدئين - 20 عملة يومياً',
      features: ['20 عملة يومياً', 'دعم فني أساسي', 'صالحة لمدة 30 يوم']
    },
    { 
      id: 2, 
      name: 'باقة متوسطة', 
      rate: 35, 
      price: 2,
      description: 'للمستخدمين النشطين - 35 عملة يومياً',
      features: ['35 عملة يومياً', 'دعم فني متقدم', 'مكافآت إضافية', 'صالحة لمدة 30 يوم']
    },
    { 
      id: 3, 
      name: 'باقة متقدمة', 
      rate: 50, 
      price: 5,
      description: 'للمحترفين - 50 عملة يومياً',
      features: ['50 عملة يومياً', 'دعم فني VIP', 'مكافآت حصرية', 'أولوية في المهام', 'صالحة لمدة 30 يوم']
    }
  ];
  
  // أسعار العملات المحدثة (يجب تحديثها من API حقيقي)
  const cryptoPrices = {
    TON: 3.12, // سعر TON بالدولار
    SOL: 133.45 // سعر Solana بالدولار
  };
  
  // تحويل المبلغ من دولار إلى العملة المشفرة
  function convertToToken(amount, currency) {
    return (amount / cryptoPrices[currency]).toFixed(6);
  }
  
  // إنشاء رابط دفع TON محسن
  function createTONPaymentLink(amount, orderId) {
    const tonAmount = convertToToken(amount, 'TON');
    const nanoTons = Math.floor(parseFloat(tonAmount) * 1e9);
    return `ton://transfer/${WALLET_ADDRESSES.TON}?amount=${nanoTons}&text=SmartCoin_Order_${orderId}`;
  }
  
  // إنشاء رابط دفع Solana
  function createSolanaPaymentLink(amount, orderId) {
    const solAmount = convertToToken(amount, 'SOL');
    // في التطبيق الحقيقي، يجب استخدام Solana Pay API
    return `https://phantom.app/ul/v1/transfer?recipient=${WALLET_ADDRESSES.SOLANA}&amount=${solAmount}&memo=SmartCoin_Order_${orderId}`;
  }
  
  // إنشاء معرف فريد للطلب محسن
  function generateOrderId() {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
    const userId = getUserId();
    return `SC${userId}_${timestamp}_${randomPart}`;
  }
  
  // الحصول على معرف المستخدم من localStorage
  function getUserId() {
    const userData = localStorage.getItem('smartcoin_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id ? user.id.substring(0, 8) : 'ANON';
      } catch (e) {
        return 'ANON';
      }
    }
    return 'ANON';
  }
  
  // تخزين معلومات الطلب محسن
  function saveOrderInfo(orderId, packageId, price, currency) {
    const orderInfo = {
      orderId: orderId,
      packageId: packageId,
      price: price,
      currency: currency,
      cryptoAmount: convertToToken(price, currency),
      userId: getUserId(),
      timestamp: Date.now(),
      status: 'pending',
      walletAddress: WALLET_ADDRESSES[currency],
      expiresAt: Date.now() + (30 * 60 * 1000) // ينتهي بعد 30 دقيقة
    };
    
    // تخزين في localStorage
    localStorage.setItem(`order_${orderId}`, JSON.stringify(orderInfo));
    
    // تخزين في قائمة الطلبات النشطة
    const activeOrders = JSON.parse(localStorage.getItem('active_orders') || '[]');
    activeOrders.push(orderId);
    localStorage.setItem('active_orders', JSON.stringify(activeOrders));
    
    return orderInfo;
  }
  
  // تفعيل أزرار الشراء المحسنة
  const buyButtons = document.querySelectorAll('.buy-button, .purchase-btn');
  
  buyButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      
      const packageId = this.getAttribute('data-package') || this.getAttribute('data-package-id');
      const paymentMethod = this.getAttribute('data-payment') || this.getAttribute('data-currency');
      
      // التحقق من طريقة الدفع المدعومة
      if (!paymentMethod || !['ton', 'TON', 'solana', 'SOL'].includes(paymentMethod)) {
        showNotification('يتم دعم الدفع عبر TON و Solana فقط حالياً', 'error');
        return;
      }
      
      const packageInfo = miningPackages.find(pkg => pkg.id == packageId);
      
      if (!packageInfo) {
        showNotification('حزمة غير صالحة', 'error');
        return;
      }
      
      // تحديد العملة
      const currency = paymentMethod.toUpperCase() === 'TON' ? 'TON' : 'SOL';
      
      // إنشاء معرف فريد للطلب
      const orderId = generateOrderId();
      
      // تخزين معلومات الطلب
      const orderInfo = saveOrderInfo(orderId, packageId, packageInfo.price, currency);
      
      // إنشاء رابط الدفع
      let paymentLink;
      if (currency === 'TON') {
        paymentLink = createTONPaymentLink(packageInfo.price, orderId);
      } else {
        paymentLink = createSolanaPaymentLink(packageInfo.price, orderId);
      }
      
      // عرض نافذة الدفع المحسنة
      showEnhancedPaymentModal(packageInfo, paymentLink, orderId, currency, orderInfo);
    });
  });
  
  // عرض نافذة الدفع المحسنة
  function showEnhancedPaymentModal(packageInfo, paymentLink, orderId, currency, orderInfo) {
    // إنشاء عناصر النافذة
    const modal = document.createElement('div');
    modal.className = 'payment-modal-enhanced';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(10px);
      animation: modalFadeIn 0.3s ease-out;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.className = 'payment-modal-content-enhanced';
    modalContent.style.cssText = `
      background: linear-gradient(145deg, #1a1a1a, #000);
      padding: 40px;
      border-radius: 20px;
      max-width: 550px;
      width: 90%;
      box-shadow: 
        0 20px 40px rgba(0, 0, 0, 0.5),
        0 0 30px rgba(255, 215, 0, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 215, 0, 0.3);
      position: relative;
      animation: modalSlideIn 0.4s ease-out;
    `;
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.cssText = `
      position: absolute;
      top: 15px;
      right: 15px;
      background: none;
      border: none;
      color: #FFD700;
      font-size: 28px;
      cursor: pointer;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    `;
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.background = 'rgba(255, 215, 0, 0.2)';
      closeButton.style.transform = 'scale(1.1)';
    });
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.background = 'none';
      closeButton.style.transform = 'scale(1)';
    });
    
    const title = document.createElement('h2');
    title.textContent = 'تأكيد الدفع';
    title.style.cssText = `
      color: #FFD700;
      text-align: center;
      margin-bottom: 25px;
      font-size: 1.8rem;
      background: linear-gradient(45deg, #FFD700, #FF9800);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    `;
    
    const packageDetails = document.createElement('div');
    packageDetails.innerHTML = `
      <div style="text-align: center; margin-bottom: 25px;">
        <div style="background: linear-gradient(135deg, #FFD700, #FF9800); padding: 20px; border-radius: 15px; margin-bottom: 20px;">
          <h3 style="color: #000; margin: 0 0 10px 0; font-size: 1.4rem;">${packageInfo.name}</h3>
          <p style="color: #333; margin: 0; font-size: 1rem;">${packageInfo.description}</p>
        </div>
        
        <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
          <p style="color: #fff; margin: 0 0 10px 0;">الميزات المشمولة:</p>
          <ul style="color: #FFD700; text-align: right; margin: 0; padding-right: 20px;">
            ${packageInfo.features.map(feature => `<li style="margin-bottom: 5px;">${feature}</li>`).join('')}
          </ul>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 15px;">
          <span style="color: #fff;">السعر:</span>
          <span style="color: #FFD700; font-weight: bold; font-size: 1.2rem;">${packageInfo.price} دولار</span>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
          <span style="color: #fff;">المبلغ بعملة ${currency}:</span>
          <span style="color: #00BCD4; font-weight: bold; font-size: 1.1rem;">${orderInfo.cryptoAmount} ${currency}</span>
        </div>
        
        <div style="background: rgba(255, 215, 0, 0.05); padding: 10px; border-radius: 8px; border: 1px solid rgba(255, 215, 0, 0.2);">
          <p style="color: #aaa; font-size: 0.9rem; margin: 0;">معرف الطلب:</p>
          <p style="color: #FFD700; font-size: 0.8rem; margin: 5px 0 0 0; word-break: break-all; font-family: monospace;">${orderId}</p>
        </div>
      </div>
    `;
    
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <div style="background: linear-gradient(135deg, rgba(0, 188, 212, 0.1), rgba(156, 39, 176, 0.1)); padding: 20px; border-radius: 15px; margin-bottom: 20px; border: 1px solid rgba(0, 188, 212, 0.3);">
        <h4 style="color: #00BCD4; margin: 0 0 15px 0; text-align: center;">تعليمات الدفع</h4>
        <ol style="color: #fff; text-align: right; margin: 0; padding-right: 20px; line-height: 1.6;">
          <li>اضغط على زر "الدفع عبر ${currency === 'TON' ? 'محفظة TON' : 'محفظة Solana'}" أدناه</li>
          <li>سيتم فتح تطبيق المحفظة تلقائياً</li>
          <li>تأكد من المبلغ وعنوان المحفظة</li>
          <li>أكمل عملية الدفع في المحفظة</li>
          <li>انتظر تأكيد المعاملة (قد يستغرق بضع دقائق)</li>
        </ol>
      </div>
    `;
    
    const payButton = document.createElement('a');
    payButton.href = paymentLink;
    payButton.textContent = `الدفع عبر محفظة ${currency === 'TON' ? 'TON' : 'Solana'}`;
    payButton.style.cssText = `
      display: block;
      background: linear-gradient(135deg, ${currency === 'TON' ? '#0088cc, #0099dd' : '#9945FF, #14F195'});
      color: white;
      text-align: center;
      padding: 18px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: bold;
      font-size: 1.1rem;
      margin: 20px 0;
      transition: all 0.3s ease;
      box-shadow: 0 8px 25px rgba(${currency === 'TON' ? '0, 136, 204' : '153, 69, 255'}, 0.3);
    `;
    
    payButton.addEventListener('mouseenter', () => {
      payButton.style.transform = 'translateY(-2px) scale(1.02)';
      payButton.style.boxShadow = `0 12px 35px rgba(${currency === 'TON' ? '0, 136, 204' : '153, 69, 255'}, 0.4)`;
    });
    
    payButton.addEventListener('mouseleave', () => {
      payButton.style.transform = 'translateY(0) scale(1)';
      payButton.style.boxShadow = `0 8px 25px rgba(${currency === 'TON' ? '0, 136, 204' : '153, 69, 255'}, 0.3)`;
    });
    
    const walletAddress = document.createElement('div');
    walletAddress.innerHTML = `
      <div style="background: rgba(0, 0, 0, 0.3); padding: 15px; border-radius: 10px; margin: 20px 0;">
        <p style="color: #fff; margin: 0 0 10px 0; text-align: center; font-size: 0.9rem;">أو قم بالتحويل يدوياً إلى العنوان:</p>
        <div style="background: #000; padding: 10px; border-radius: 8px; border: 1px solid #FFD700;">
          <p style="color: #FFD700; text-align: center; font-size: 0.75rem; margin: 0; word-break: break-all; font-family: monospace;">${orderInfo.walletAddress}</p>
        </div>
        <p style="color: #aaa; text-align: center; font-size: 0.8rem; margin: 10px 0 0 0;">تأكد من إضافة معرف الطلب في حقل المذكرة/التعليق</p>
      </div>
    `;
    
    const statusCheck = document.createElement('div');
    statusCheck.innerHTML = `
      <div style="text-align: center; margin-top: 25px;">
        <div id="payment-status" style="color: #00BCD4; margin-bottom: 15px; font-weight: bold;">
          <i class="fas fa-clock" style="margin-left: 8px;"></i>
          في انتظار الدفع...
        </div>
        <div style="width: 100%; height: 6px; background-color: #333; border-radius: 6px; overflow: hidden;">
          <div id="progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #FFD700, #00BCD4); transition: width 0.5s; border-radius: 6px;"></div>
        </div>
        <div id="timer-display" style="color: #aaa; font-size: 0.9rem; margin-top: 10px;">
          الوقت المتبقي: <span id="countdown">30:00</span>
        </div>
      </div>
    `;
    
    // إضافة العناصر إلى النافذة
    modalContent.appendChild(closeButton);
    modalContent.appendChild(title);
    modalContent.appendChild(packageDetails);
    modalContent.appendChild(instructions);
    modalContent.appendChild(payButton);
    modalContent.appendChild(walletAddress);
    modalContent.appendChild(statusCheck);
    modal.appendChild(modalContent);
    
    // إضافة النافذة إلى الصفحة
    document.body.appendChild(modal);
    
    // إضافة مستمع أحداث لزر الإغلاق
    closeButton.addEventListener('click', function() {
      document.body.removeChild(modal);
    });
    
    // إضافة مستمع أحداث للنقر خارج النافذة
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
    
    // بدء التحقق من حالة الدفع والعد التنازلي
    startEnhancedPaymentCheck(orderId, modal, orderInfo);
  }
  
  // بدء التحقق المحسن من حالة الدفع
  function startEnhancedPaymentCheck(orderId, modal, orderInfo) {
    const progressBar = modal.querySelector('#progress-bar');
    const statusElement = modal.querySelector('#payment-status');
    const countdownElement = modal.querySelector('#countdown');
    
    let timeRemaining = 30 * 60; // 30 دقيقة بالثواني
    let checkCount = 0;
    const maxChecks = 360; // التحقق لمدة 30 دقيقة (5 ثوانٍ × 360)
    
    // تحديث العد التنازلي
    const countdownInterval = setInterval(() => {
      timeRemaining--;
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      if (timeRemaining <= 0) {
        clearInterval(countdownInterval);
        showTimeoutMessage(modal);
      }
    }, 1000);
    
    // التحقق من حالة الدفع
    const checkInterval = setInterval(function() {
      checkCount++;
      const progress = (checkCount / maxChecks) * 100;
      progressBar.style.width = `${Math.min(progress, 100)}%`;
      
      // تحديث حالة التحقق
      if (checkCount % 4 === 0) { // كل 20 ثانية
        statusElement.innerHTML = '<i class="fas fa-search" style="margin-left: 8px;"></i>جاري البحث عن المعاملة...';
      } else if (checkCount % 4 === 2) {
        statusElement.innerHTML = '<i class="fas fa-clock" style="margin-left: 8px;"></i>في انتظار الدفع...';
      }
      
      // التحقق من حالة الدفع
      checkPaymentStatus(orderId).then(result => {
        if (result.success) {
          clearInterval(checkInterval);
          clearInterval(countdownInterval);
          showSuccessMessage(modal, result.package);
        } else if (checkCount >= maxChecks || timeRemaining <= 0) {
          clearInterval(checkInterval);
          clearInterval(countdownInterval);
          showTimeoutMessage(modal);
        }
      });
    }, 5000); // التحقق كل 5 ثوانٍ
  }
  
  // التحقق من حالة الدفع (محسن)
  async function checkPaymentStatus(orderId) {
    return new Promise(resolve => {
      setTimeout(() => {
        const orderKey = `order_${orderId}`;
        const orderData = localStorage.getItem(orderKey);
        
        if (orderData) {
          const order = JSON.parse(orderData);
          
          // محاكاة فرصة نجاح الدفع (في التطبيق الحقيقي، يجب التحقق من البلوكتشين)
          const successChance = Math.random();
          if (successChance > 0.95) { // 5% فرصة نجاح في كل فحص
            // تحديث حالة الطلب
            order.status = 'completed';
            order.completedAt = Date.now();
            localStorage.setItem(orderKey, JSON.stringify(order));
            
            // تفعيل الباقة
            activatePackage(order.userId, order.packageId);
            
            resolve({
              success: true,
              message: 'تم الدفع بنجاح',
              package: {
                id: order.packageId,
                price: order.price,
                currency: order.currency
              }
            });
          } else {
            resolve({
              success: false,
              message: 'لم يتم التحقق من الدفع بعد'
            });
          }
        } else {
          resolve({
            success: false,
            message: 'لم يتم العثور على الطلب'
          });
        }
      }, 1000);
    });
  }
  
  // تفعيل الباقة
  function activatePackage(userId, packageId) {
    const packageInfo = miningPackages.find(pkg => pkg.id == packageId);
    if (!packageInfo) return;
    
    // تخزين معلومات الباقة المفعلة
    const activatedPackages = JSON.parse(localStorage.getItem('activatedPackages') || '{}');
    activatedPackages[userId] = {
      packageId: packageId,
      packageName: packageInfo.name,
      rate: packageInfo.rate,
      activatedAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 يوم
    };
    
    localStorage.setItem('activatedPackages', JSON.stringify(activatedPackages));
    
    // تحديث معدل التعدين
    localStorage.setItem('miningRate', packageInfo.rate.toString());
  }
  
  // عرض رسالة نجاح الدفع المحسنة
  function showSuccessMessage(modal, packageInfo) {
    const modalContent = modal.querySelector('.payment-modal-content-enhanced');
    
    modalContent.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #4CAF50, #66BB6A); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: successPulse 1s ease-out;">
            <i class="fas fa-check" style="color: white; font-size: 2.5rem;"></i>
          </div>
          <h2 style="color: #4CAF50; margin-bottom: 15px; font-size: 1.8rem;">تم الدفع بنجاح!</h2>
          <div style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(102, 187, 106, 0.1)); padding: 20px; border-radius: 15px; border: 1px solid rgba(76, 175, 80, 0.3); margin-bottom: 25px;">
            <p style="color: #fff; margin: 0 0 10px 0; font-size: 1.1rem;">تم تفعيل الباقة بنجاح!</p>
            <p style="color: #4CAF50; margin: 0; font-weight: bold;">ستحصل الآن على معدل تعدين محسّن</p>
          </div>
        </div>
        
        <div style="background: rgba(255, 215, 0, 0.1); padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 1px solid rgba(255, 215, 0, 0.3);">
          <h3 style="color: #FFD700; margin: 0 0 15px 0;">تفاصيل الباقة المفعلة</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #aaa;">اسم الباقة:</span>
            <span style="color: #fff; font-weight: bold;">${miningPackages.find(p => p.id == packageInfo.id)?.name || 'غير محدد'}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span style="color: #aaa;">معدل التعدين:</span>
            <span style="color: #FFD700; font-weight: bold;">${miningPackages.find(p => p.id == packageInfo.id)?.rate || 0} عملة/يوم</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #aaa;">صالحة حتى:</span>
            <span style="color: #00BCD4; font-weight: bold;">${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA')}</span>
          </div>
        </div>
        
        <button id="close-success-modal" style="
          width: 100%;
          background: linear-gradient(135deg, #FFD700, #FF9800);
          color: #000;
          text-align: center;
          padding: 18px;
          border-radius: 50px;
          border: none;
          font-weight: bold;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 25px rgba(255, 215, 0, 0.3);
        ">
          العودة إلى المتجر
        </button>
      </div>
    `;
    
    // إضافة تأثيرات للزر
    const closeBtn = modal.querySelector('#close-success-modal');
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.transform = 'translateY(-2px) scale(1.02)';
      closeBtn.style.boxShadow = '0 12px 35px rgba(255, 215, 0, 0.4)';
    });
    
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.transform = 'translateY(0) scale(1)';
      closeBtn.style.boxShadow = '0 8px 25px rgba(255, 215, 0, 0.3)';
    });
    
    // إضافة مستمع أحداث لزر الإغلاق
    closeBtn.addEventListener('click', function() {
      document.body.removeChild(modal);
      // تحديث الصفحة لعرض التغييرات
      window.location.reload();
    });
  }
  
  // عرض رسالة انتهاء مهلة التحقق المحسنة
  function showTimeoutMessage(modal) {
    const modalContent = modal.querySelector('.payment-modal-content-enhanced');
    
    modalContent.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <div style="margin-bottom: 30px;">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FF9800, #F57C00); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; animation: warningPulse 1s ease-out;">
            <i class="fas fa-clock" style="color: white; font-size: 2.5rem;"></i>
          </div>
          <h2 style="color: #FF9800; margin-bottom: 15px; font-size: 1.8rem;">انتهت مهلة التحقق</h2>
          <div style="background: linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.1)); padding: 20px; border-radius: 15px; border: 1px solid rgba(255, 152, 0, 0.3); margin-bottom: 25px;">
            <p style="color: #fff; margin: 0 0 15px 0; line-height: 1.6;">
              لم نتمكن من التحقق من الدفع خلال المهلة المحددة. إذا قمت بالدفع بالفعل، فسيتم تفعيل الباقة تلقائياً عند التحقق من المعاملة.
            </p>
            <p style="color: #FF9800; margin: 0; font-weight: bold;">
              يمكنك التحقق من حالة الطلب لاحقاً من خلال قسم "طلباتي"
            </p>
          </div>
        </div>
        
        <div style="display: flex; gap: 15px;">
          <button id="check-status-btn" style="
            flex: 1;
            background: linear-gradient(135deg, #00BCD4, #0097A7);
            color: white;
            text-align: center;
            padding: 15px;
            border-radius: 50px;
            border: none;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            التحقق من الحالة
          </button>
          <button id="close-timeout-modal" style="
            flex: 1;
            background: linear-gradient(135deg, #FFD700, #FF9800);
            color: #000;
            text-align: center;
            padding: 15px;
            border-radius: 50px;
            border: none;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
          ">
            العودة إلى المتجر
          </button>
        </div>
      </div>
    `;
    
    // إضافة مستمعي أحداث للأزرار
    modal.querySelector('#close-timeout-modal').addEventListener('click', function() {
      document.body.removeChild(modal);
    });
    
    modal.querySelector('#check-status-btn').addEventListener('click', function() {
      // إعادة فحص حالة الدفع
      showNotification('جاري التحقق من حالة الدفع...', 'info');
      // يمكن إضافة منطق إعادة الفحص هنا
    });
  }
  
  // عرض إشعار محسن للمستخدم
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-enhanced ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 20px;
      border-radius: 10px;
      color: #fff;
      z-index: 10001;
      max-width: 350px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(10px);
      animation: notificationSlideIn 0.4s ease-out;
      font-weight: 500;
    `;
    
    if (type === 'error') {
      notification.style.background = 'linear-gradient(135deg, #F44336, #E53935)';
    } else if (type === 'success') {
      notification.style.background = 'linear-gradient(135deg, #4CAF50, #66BB6A)';
    } else if (type === 'warning') {
      notification.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
    } else {
      notification.style.background = 'linear-gradient(135deg, #2196F3, #1976D2)';
    }
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 5 ثوانٍ
    setTimeout(function() {
      if (document.body.contains(notification)) {
        notification.style.animation = 'notificationSlideOut 0.3s ease-in';
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);
  }
  
  // التحقق من وجود طلبات معلقة عند تحميل الصفحة
  function checkPendingOrders() {
    const activeOrders = JSON.parse(localStorage.getItem('active_orders') || '[]');
    
    activeOrders.forEach(orderId => {
      const orderKey = `order_${orderId}`;
      const orderData = localStorage.getItem(orderKey);
      
      if (orderData) {
        try {
          const order = JSON.parse(orderData);
          
          // التحقق من انتهاء صلاحية الطلب
          if (Date.now() > order.expiresAt) {
            // إزالة الطلب المنتهي الصلاحية
            localStorage.removeItem(orderKey);
            const updatedOrders = activeOrders.filter(id => id !== orderId);
            localStorage.setItem('active_orders', JSON.stringify(updatedOrders));
            return;
          }
          
          // التحقق من حالة الطلب
          if (order.status === 'pending') {
            checkPaymentStatus(orderId).then(result => {
              if (result.success) {
                showNotification('تم تفعيل إحدى الباقات التي اشتريتها سابقاً!', 'success');
              }
            });
          }
        } catch (e) {
          console.error('خطأ في قراءة بيانات الطلب:', e);
        }
      }
    });
  }
  
  // إضافة CSS للحركات
  const style = document.createElement('style');
  style.textContent = `
    @keyframes modalFadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }
    
    @keyframes modalSlideIn {
      0% { transform: translateY(-50px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    
    @keyframes successPulse {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes warningPulse {
      0% { transform: scale(0.8); opacity: 0; }
      50% { transform: scale(1.1); }
      100% { transform: scale(1); opacity: 1; }
    }
    
    @keyframes notificationSlideIn {
      0% { transform: translateX(100%); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes notificationSlideOut {
      0% { transform: translateX(0); opacity: 1; }
      100% { transform: translateX(100%); opacity: 0; }
    }
  `;
  
  document.head.appendChild(style);
  
  // التحقق من الطلبات المعلقة عند تحميل الصفحة
  checkPendingOrders();
  
  // تصدير الوظائف للاستخدام الخارجي
  window.SmartCoinPayment = {
    showNotification,
    checkPaymentStatus,
    generateOrderId
  };
});

