// آلية الدفع في المتجر
document.addEventListener('DOMContentLoaded', function() {
  // عناوين المحافظ
  const TON_WALLET_ADDRESS = 'UQAmI5QQbc7HbxSbUHUkh5_7vltnn_bWb3qmS3pz7S1YPgbV';
  
  // حزم التعدين
  const miningPackages = [
    { id: 1, name: 'باقة أساسية', rate: 20, price: 1 },
    { id: 2, name: 'باقة متوسطة', rate: 35, price: 2 },
    { id: 3, name: 'باقة متقدمة', rate: 50, price: 5 }
  ];
  
  // أسعار العملات (افتراضية، يجب تحديثها من API)
  const cryptoPrices = {
    TON: 5 // سعر TON بالدولار
  };
  
  // تحويل المبلغ من دولار إلى TON
  function dollarToTON(amount) {
    return amount / cryptoPrices.TON;
  }
  
  // إنشاء رابط دفع TON
  function createTONPaymentLink(amount, orderId) {
    const tonAmount = dollarToTON(amount);
    const nanoTons = Math.floor(tonAmount * 1e9);
    return `ton://transfer/${TON_WALLET_ADDRESS}?amount=${nanoTons}&text=${orderId}`;
  }
  
  // إنشاء معرف فريد للطلب
  function generateOrderId() {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 10);
    const userId = getUserId();
    return `order_${userId}_${timestamp}_${randomPart}`;
  }
  
  // الحصول على معرف المستخدم من localStorage
  function getUserId() {
    const userData = localStorage.getItem('smartcoin_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.id || 'anonymous';
      } catch (e) {
        return 'anonymous';
      }
    }
    return 'anonymous';
  }
  
  // تخزين معلومات الطلب
  function saveOrderInfo(orderId, packageId, price) {
    const orderInfo = {
      orderId: orderId,
      packageId: packageId,
      price: price,
      userId: getUserId(),
      timestamp: Date.now(),
      status: 'pending'
    };
    
    // تخزين في localStorage
    localStorage.setItem(`order_${orderId}`, JSON.stringify(orderInfo));
    
    // إرسال معلومات الطلب إلى الخادم (في التطبيق الحقيقي)
    // في هذه النسخة المبسطة، نستخدم localStorage فقط
    
    return orderInfo;
  }
  
  // تفعيل أزرار الشراء
  const buyButtons = document.querySelectorAll('.buy-button');
  
  buyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const packageId = this.getAttribute('data-package');
      const paymentMethod = this.getAttribute('data-payment');
      
      // التحقق من أن طريقة الدفع هي TON فقط
      if (paymentMethod !== 'ton') {
        showNotification('عذراً، يتم دعم الدفع عبر TON فقط حالياً', 'error');
        return;
      }
      
      const packageInfo = miningPackages.find(pkg => pkg.id == packageId);
      
      if (!packageInfo) {
        showNotification('حزمة غير صالحة', 'error');
        return;
      }
      
      // إنشاء معرف فريد للطلب
      const orderId = generateOrderId();
      
      // تخزين معلومات الطلب
      saveOrderInfo(orderId, packageId, packageInfo.price);
      
      // إنشاء رابط الدفع
      const paymentLink = createTONPaymentLink(packageInfo.price, orderId);
      
      // عرض معلومات الدفع للمستخدم
      showPaymentModal(packageInfo, paymentLink, orderId);
    });
  });
  
  // عرض نافذة الدفع
  function showPaymentModal(packageInfo, paymentLink, orderId) {
    // إنشاء عناصر النافذة
    const modal = document.createElement('div');
    modal.className = 'payment-modal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.style.zIndex = '1000';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'payment-modal-content';
    modalContent.style.backgroundColor = '#111';
    modalContent.style.padding = '30px';
    modalContent.style.borderRadius = '10px';
    modalContent.style.maxWidth = '500px';
    modalContent.style.width = '90%';
    modalContent.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';
    modalContent.style.position = 'relative';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '10px';
    closeButton.style.right = '10px';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = '#FFD700';
    closeButton.style.fontSize = '24px';
    closeButton.style.cursor = 'pointer';
    
    const title = document.createElement('h2');
    title.textContent = 'تأكيد الدفع';
    title.style.color = '#FFD700';
    title.style.textAlign = 'center';
    title.style.marginBottom = '20px';
    
    const packageDetails = document.createElement('div');
    packageDetails.innerHTML = `
      <p style="color: #fff; margin-bottom: 10px; text-align: center;">أنت على وشك شراء:</p>
      <h3 style="color: #FFD700; text-align: center; margin-bottom: 15px;">${packageInfo.name}</h3>
      <p style="color: #fff; text-align: center; margin-bottom: 20px;">
        السعر: <strong>${packageInfo.price} دولار</strong> (${dollarToTON(packageInfo.price).toFixed(2)} TON)
      </p>
      <p style="color: #fff; text-align: center; margin-bottom: 10px;">معرف الطلب:</p>
      <p style="color: #aaa; text-align: center; font-size: 12px; margin-bottom: 20px; word-break: break-all;">${orderId}</p>
    `;
    
    const instructions = document.createElement('div');
    instructions.innerHTML = `
      <p style="color: #fff; margin-bottom: 10px; text-align: center;">للمتابعة، اضغط على الزر أدناه للدفع عبر محفظة TON الخاصة بك.</p>
      <p style="color: #aaa; text-align: center; font-size: 12px; margin-bottom: 20px;">سيتم تفعيل الباقة تلقائياً بعد التحقق من الدفع.</p>
    `;
    
    const payButton = document.createElement('a');
    payButton.href = paymentLink;
    payButton.textContent = 'الدفع عبر محفظة TON';
    payButton.style.display = 'block';
    payButton.style.backgroundColor = '#FFD700';
    payButton.style.color = '#000';
    payButton.style.textAlign = 'center';
    payButton.style.padding = '15px';
    payButton.style.borderRadius = '5px';
    payButton.style.textDecoration = 'none';
    payButton.style.fontWeight = 'bold';
    payButton.style.margin = '20px 0';
    
    const walletAddress = document.createElement('div');
    walletAddress.innerHTML = `
      <p style="color: #fff; margin-bottom: 10px; text-align: center;">أو قم بالتحويل يدوياً إلى العنوان:</p>
      <p style="color: #FFD700; text-align: center; font-size: 12px; margin-bottom: 10px; word-break: break-all;">${TON_WALLET_ADDRESS}</p>
      <p style="color: #fff; text-align: center; font-size: 12px;">مع إضافة معرف الطلب في حقل التعليق</p>
    `;
    
    const statusCheck = document.createElement('div');
    statusCheck.innerHTML = `
      <p style="color: #aaa; text-align: center; margin-top: 20px;">جاري التحقق من حالة الدفع...</p>
      <div style="width: 100%; height: 5px; background-color: #333; margin-top: 10px; border-radius: 5px; overflow: hidden;">
        <div class="progress-bar" style="width: 0%; height: 100%; background-color: #FFD700; transition: width 0.5s;"></div>
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
    
    // بدء التحقق من حالة الدفع
    startPaymentCheck(orderId, modal);
  }
  
  // بدء التحقق من حالة الدفع
  function startPaymentCheck(orderId, modal) {
    const progressBar = modal.querySelector('.progress-bar');
    let progress = 0;
    let checkCount = 0;
    const maxChecks = 60; // التحقق لمدة 5 دقائق (5 ثوانٍ × 60)
    
    const checkInterval = setInterval(function() {
      checkCount++;
      progress = (checkCount / maxChecks) * 100;
      progressBar.style.width = `${progress}%`;
      
      // التحقق من حالة الدفع (في التطبيق الحقيقي، يجب إرسال طلب إلى الخادم)
      checkPaymentStatus(orderId).then(result => {
        if (result.success) {
          clearInterval(checkInterval);
          showSuccessMessage(modal, result.package);
        } else if (checkCount >= maxChecks) {
          clearInterval(checkInterval);
          showTimeoutMessage(modal);
        }
      });
    }, 5000); // التحقق كل 5 ثوانٍ
  }
  
  // التحقق من حالة الدفع
  async function checkPaymentStatus(orderId) {
    // في التطبيق الحقيقي، يجب إرسال طلب إلى الخادم للتحقق من حالة الدفع
    // هنا نستخدم محاكاة بسيطة للتحقق
    
    return new Promise(resolve => {
      // محاكاة تأخير الشبكة
      setTimeout(() => {
        // التحقق من localStorage (في التطبيق الحقيقي، يجب التحقق من الخادم)
        const orderKey = `order_${orderId}`;
        const orderData = localStorage.getItem(orderKey);
        
        if (orderData) {
          const order = JSON.parse(orderData);
          
          // التحقق من حالة الطلب
          if (order.status === 'completed') {
            // تم الدفع بنجاح
            resolve({
              success: true,
              message: 'تم الدفع بنجاح',
              package: {
                id: order.packageId,
                price: order.price
              }
            });
          } else {
            // لم يتم الدفع بعد
            resolve({
              success: false,
              message: 'لم يتم التحقق من الدفع بعد'
            });
          }
        } else {
          // لم يتم العثور على الطلب
          resolve({
            success: false,
            message: 'لم يتم العثور على الطلب'
          });
        }
      }, 1000);
    });
  }
  
  // عرض رسالة نجاح الدفع
  function showSuccessMessage(modal, packageInfo) {
    const modalContent = modal.querySelector('.payment-modal-content');
    
    modalContent.innerHTML = `
      <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">تم الدفع بنجاح!</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-check-circle" style="color: #FFD700; font-size: 64px;"></i>
      </div>
      <p style="color: #fff; text-align: center; margin-bottom: 20px;">
        تم تفعيل الباقة بنجاح. ستحصل الآن على معدل تعدين محسّن.
      </p>
      <button id="close-success-modal" style="display: block; width: 100%; background-color: #FFD700; color: #000; text-align: center; padding: 15px; border-radius: 5px; border: none; font-weight: bold; cursor: pointer; margin-top: 20px;">
        العودة إلى المتجر
      </button>
    `;
    
    // إضافة مستمع أحداث لزر الإغلاق
    document.getElementById('close-success-modal').addEventListener('click', function() {
      document.body.removeChild(modal);
      // تحديث الصفحة لعرض التغييرات
      window.location.reload();
    });
  }
  
  // عرض رسالة انتهاء مهلة التحقق
  function showTimeoutMessage(modal) {
    const modalContent = modal.querySelector('.payment-modal-content');
    
    modalContent.innerHTML = `
      <h2 style="color: #FFD700; text-align: center; margin-bottom: 20px;">انتهت مهلة التحقق</h2>
      <div style="text-align: center; margin-bottom: 20px;">
        <i class="fas fa-exclamation-triangle" style="color: #FFD700; font-size: 64px;"></i>
      </div>
      <p style="color: #fff; text-align: center; margin-bottom: 20px;">
        لم نتمكن من التحقق من الدفع خلال المهلة المحددة. إذا قمت بالدفع بالفعل، فسيتم تفعيل الباقة تلقائياً عند التحقق من المعاملة.
      </p>
      <button id="close-timeout-modal" style="display: block; width: 100%; background-color: #FFD700; color: #000; text-align: center; padding: 15px; border-radius: 5px; border: none; font-weight: bold; cursor: pointer; margin-top: 20px;">
        العودة إلى المتجر
      </button>
    `;
    
    // إضافة مستمع أحداث لزر الإغلاق
    document.getElementById('close-timeout-modal').addEventListener('click', function() {
      document.body.removeChild(modal);
    });
  }
  
  // عرض إشعار للمستخدم
  function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.position = 'fixed';
    notification.style.bottom = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '5px';
    notification.style.color = '#fff';
    notification.style.zIndex = '1000';
    notification.style.maxWidth = '300px';
    notification.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.2)';
    
    if (type === 'error') {
      notification.style.backgroundColor = '#ff4d4d';
    } else if (type === 'success') {
      notification.style.backgroundColor = '#4CAF50';
    } else {
      notification.style.backgroundColor = '#2196F3';
    }
    
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار بعد 5 ثوانٍ
    setTimeout(function() {
      document.body.removeChild(notification);
    }, 5000);
  }
  
  // التحقق من وجود طلبات معلقة عند تحميل الصفحة
  function checkPendingOrders() {
    // البحث عن جميع الطلبات المخزنة في localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('order_')) {
        try {
          const orderData = JSON.parse(localStorage.getItem(key));
          
          // التحقق من حالة الطلب
          if (orderData.status === 'pending') {
            // التحقق من الطلب المعلق
            checkPaymentStatus(orderData.orderId).then(result => {
              if (result.success) {
                showNotification('تم تفعيل إحدى الباقات التي اشتريتها سابقاً!', 'success');
              }
            });
          }
        } catch (e) {
          console.error('خطأ في قراءة بيانات الطلب:', e);
        }
      }
    }
  }
  
  // التحقق من الطلبات المعلقة عند تحميل الصفحة
  checkPendingOrders();
});
