/**
 * سكريبت المحفظة - SmartCoin
 * يوفر وظائف إدارة المحفظة وعمليات الإيداع والسحب
 */

class WalletManager {
  constructor() {
    this.apiBaseUrl = 'https://api.smartcoin-app.com';
    this.userData = JSON.parse(localStorage.getItem('smartcoin_user') || '{}');
    this.authToken = localStorage.getItem('smartcoin_auth_token');
    this.walletAddress = localStorage.getItem('smartcoin_wallet');
    this.scWallet = null;
    this.tonWallet = null;
    this.transactions = [];
  }

  /**
   * تهيئة مدير المحفظة
   */
  async initialize() {
    console.log('تهيئة مدير المحفظة...');

    try {
      // التحقق من وجود توكن المصادقة
      if (!this.authToken && !this.walletAddress) {
        console.error('لم يتم العثور على توكن المصادقة أو عنوان المحفظة');
        return false;
      }

      // تحميل بيانات المحفظة
      await this.loadWalletData();

      // إعداد مستمعي الأحداث
      this.setupEventListeners();

      console.log('تم تهيئة مدير المحفظة بنجاح');
      return true;
    } catch (error) {
      console.error('خطأ في تهيئة مدير المحفظة:', error);
      return false;
    }
  }

  /**
   * تحميل بيانات المحفظة
   */
  async loadWalletData() {
    try {
      // تحميل بيانات محفظة SmartCoin
      await this.loadSmartCoinWallet();

      // تحميل بيانات محفظة TON
      if (this.walletAddress) {
        await this.loadTonWallet();
      }

      // تحميل العمليات الأخيرة
      await this.loadTransactions();
    } catch (error) {
      console.error('خطأ في تحميل بيانات المحفظة:', error);
      throw error;
    }
  }

  /**
   * تحميل بيانات محفظة SmartCoin
   */
  async loadSmartCoinWallet() {
    try {
      if (!this.userData.id || !this.authToken) {
        return;
      }

      const response = await fetch(`${this.apiBaseUrl}/wallets/user/${this.userData.id}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();

      if (data.success && data.wallet) {
        this.scWallet = data.wallet;
        this.updateScWalletUI();
      } else {
        // إنشاء محفظة جديدة إذا لم تكن موجودة
        await this.createSmartCoinWallet();
      }
    } catch (error) {
      console.error('خطأ في تحميل بيانات محفظة SmartCoin:', error);
      throw error;
    }
  }

  /**
   * إنشاء محفظة SmartCoin جديدة
   */
  async createSmartCoinWallet() {
    try {
      if (!this.userData.id || !this.authToken) {
        return;
      }

      const response = await fetch(`${this.apiBaseUrl}/wallets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          userId: this.userData.id,
          tonAddress: this.walletAddress || 'not_connected'
        })
      });

      const data = await response.json();

      if (data.success && data.wallet) {
        this.scWallet = data.wallet;
        this.updateScWalletUI();
      }
    } catch (error) {
      console.error('خطأ في إنشاء محفظة SmartCoin جديدة:', error);
      throw error;
    }
  }

  /**
   * تحميل بيانات محفظة TON
   */
  async loadTonWallet() {
    try {
      // تحديث عنوان محفظة TON في واجهة المستخدم
      document.getElementById('ton-address').textContent = this.walletAddress;
      document.getElementById('connect-ton-btn').style.display = 'none';

      // الحصول على رصيد محفظة TON
      await this.fetchTonBalance();
    } catch (error) {
      console.error('خطأ في تحميل بيانات محفظة TON:', error);
      throw error;
    }
  }

  /**
   * الحصول على رصيد محفظة TON
   */
  async fetchTonBalance() {
    try {
      const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${this.walletAddress}`);
      const data = await response.json();

      if (data.ok && data.result) {
        // تحويل الرصيد من نانو TON إلى TON
        const balanceInTon = parseFloat(data.result) / 1000000000;
        document.getElementById('ton-balance').textContent = balanceInTon.toFixed(4);
      }
    } catch (error) {
      console.error('خطأ في الحصول على رصيد محفظة TON:', error);
      throw error;
    }
  }

  /**
   * تحميل العمليات الأخيرة
   */
  async loadTransactions() {
    try {
      if (!this.userData.id || !this.authToken) {
        return;
      }

      const response = await fetch(`${this.apiBaseUrl}/transactions/user/${this.userData.id}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });

      const data = await response.json();

      if (data.success && data.transactions) {
        this.transactions = data.transactions;
        this.updateTransactionsUI();
      }
    } catch (error) {
      console.error('خطأ في تحميل العمليات الأخيرة:', error);
      throw error;
    }
  }

  /**
   * تحديث واجهة محفظة SmartCoin
   */
  updateScWalletUI() {
    if (this.scWallet) {
      document.getElementById('sc-address').textContent = this.scWallet.internalAddress;
      document.getElementById('sc-balance').textContent = this.scWallet.balance;
    }
  }

  /**
   * تحديث واجهة العمليات
   */
  updateTransactionsUI() {
    const transactionsList = document.getElementById('transactions-list');
    
    if (!this.transactions || this.transactions.length === 0) {
      transactionsList.innerHTML = '<div class="no-transactions">لا توجد عمليات حتى الآن</div>';
      return;
    }
    
    transactionsList.innerHTML = '';
    
    this.transactions.forEach(transaction => {
      const transactionItem = document.createElement('div');
      transactionItem.className = `transaction-item ${transaction.type}`;
      
      const transactionDate = new Date(transaction.createdAt).toLocaleDateString('ar-SA');
      const transactionTime = new Date(transaction.createdAt).toLocaleTimeString('ar-SA');
      
      transactionItem.innerHTML = `
        <div class="transaction-icon">
          <img src="img/${transaction.type}-icon.png" alt="${transaction.type}">
        </div>
        <div class="transaction-details">
          <div class="transaction-title">${transaction.description}</div>
          <div class="transaction-date">${transactionDate} ${transactionTime}</div>
        </div>
        <div class="transaction-amount ${transaction.type === 'deposit' ? 'positive' : 'negative'}">
          ${transaction.type === 'deposit' ? '+' : '-'}${transaction.amount} SM
        </div>
      `;
      
      transactionsList.appendChild(transactionItem);
    });
  }

  /**
   * إعداد مستمعي الأحداث
   */
  setupEventListeners() {
    // زر الإيداع
    const depositBtn = document.querySelector('.deposit-btn');
    if (depositBtn) {
      depositBtn.addEventListener('click', () => this.showDepositPopup());
    }
    
    // زر السحب
    const withdrawBtn = document.querySelector('.withdraw-btn');
    if (withdrawBtn) {
      withdrawBtn.addEventListener('click', () => this.showWithdrawPopup());
    }
    
    // زر إغلاق النافذة المنبثقة
    const popupClose = document.getElementById('popup-close');
    if (popupClose) {
      popupClose.addEventListener('click', () => this.closePopup());
    }
    
    // أزرار النسخ
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', function() {
        const target = document.querySelector(this.dataset.clipboardTarget);
        if (target) {
          navigator.clipboard.writeText(target.textContent)
            .then(() => {
              // تغيير نص الزر مؤقتاً
              const originalText = this.textContent;
              this.textContent = 'تم النسخ!';
              setTimeout(() => {
                this.textContent = originalText;
              }, 2000);
            })
            .catch(err => {
              console.error('فشل في نسخ النص:', err);
            });
        }
      });
    });
  }

  /**
   * إظهار نافذة الإيداع
   */
  showDepositPopup() {
    const popupContainer = document.getElementById('popup-container');
    const popupTitle = document.getElementById('popup-title');
    const popupContent = document.getElementById('popup-content');
    
    popupTitle.textContent = 'إيداع في محفظة SmartCoin';
    
    popupContent.innerHTML = `
      <div class="deposit-form">
        <p>يمكنك إيداع عملات SmartCoin في محفظتك من خلال:</p>
        
        <div class="deposit-methods">
          <div class="deposit-method">
            <h4>1. التعدين</h4>
            <p>قم بتعدين عملات SmartCoin من خلال صفحة التعدين.</p>
            <a href="earn-enhanced.html" class="action-btn deposit-btn">الذهاب إلى صفحة التعدين</a>
          </div>
          
          <div class="deposit-method">
            <h4>2. إكمال المهام</h4>
            <p>قم بإكمال المهام للحصول على عملات SmartCoin كمكافأة.</p>
            <a href="tasks-enhanced.html" class="action-btn deposit-btn">الذهاب إلى صفحة المهام</a>
          </div>
          
          <div class="deposit-method">
            <h4>3. دعوة الأصدقاء</h4>
            <p>احصل على عملات SmartCoin مقابل كل صديق تدعوه للانضمام.</p>
            <a href="referrals-enhanced.html" class="action-btn deposit-btn">الذهاب إلى صفحة الإحالات</a>
          </div>
        </div>
      </div>
    `;
    
    popupContainer.style.display = 'flex';
  }

  /**
   * إظهار نافذة السحب
   */
  showWithdrawPopup() {
    const popupContainer = document.getElementById('popup-container');
    const popupTitle = document.getElementById('popup-title');
    const popupContent = document.getElementById('popup-content');
    
    popupTitle.textContent = 'سحب من محفظة SmartCoin';
    
    popupContent.innerHTML = `
      <div class="withdraw-form">
        <p>يمكنك سحب عملات SmartCoin من محفظتك إلى محفظة TON الخاصة بك.</p>
        
        <div class="form-group">
          <label for="withdraw-amount">المبلغ (SM):</label>
          <input type="number" id="withdraw-amount" min="1" max="${this.scWallet?.balance || 0}" value="1">
        </div>
        
        <div class="form-group">
          <label for="withdraw-address">عنوان محفظة TON:</label>
          <input type="text" id="withdraw-address" value="${this.walletAddress || ''}" ${this.walletAddress ? 'readonly' : ''}>
        </div>
        
        <div class="form-actions">
          <button id="withdraw-submit" class="action-btn withdraw-btn">سحب</button>
        </div>
        
        <div class="withdraw-note">
          <p>ملاحظة: سيتم تحويل عملات SmartCoin إلى TON بمعدل 1 SM = 0.01 TON.</p>
        </div>
      </div>
    `;
    
    popupContainer.style.display = 'flex';
    
    // إضافة مستمع لزر السحب
    document.getElementById('withdraw-submit').addEventListener('click', () => this.processWithdraw());
  }

  /**
   * معالجة عملية السحب
   */
  async processWithdraw() {
    try {
      const amount = parseFloat(document.getElementById('withdraw-amount').value);
      const address = document.getElementById('withdraw-address').value;
      
      if (isNaN(amount) || amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح');
        return;
      }
      
      if (!address) {
        alert('يرجى إدخال عنوان محفظة TON');
        return;
      }
      
      if (amount > (this.scWallet?.balance || 0)) {
        alert('رصيدك غير كافٍ');
        return;
      }
      
      // إرسال طلب السحب إلى الخادم
      const response = await fetch(`${this.apiBaseUrl}/transactions/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          userId: this.userData.id,
          amount,
          tonAddress: address
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // تحديث الرصيد
        this.scWallet.balance -= amount;
        this.updateScWalletUI();
        
        // إضافة العملية إلى قائمة العمليات
        this.transactions.unshift(data.transaction);
        this.updateTransactionsUI();
        
        // إغلاق النافذة المنبثقة
        this.closePopup();
        
        // عرض رسالة نجاح
        alert('تم إرسال طلب السحب بنجاح');
      } else {
        alert(data.message || 'حدث خطأ أثناء معالجة طلب السحب');
      }
    } catch (error) {
      console.error('خطأ في معالجة عملية السحب:', error);
      alert('حدث خطأ أثناء معالجة طلب السحب');
    }
  }

  /**
   * إغلاق النافذة المنبثقة
   */
  closePopup() {
    const popupContainer = document.getElementById('popup-container');
    popupContainer.style.display = 'none';
  }
}

// إنشاء مثيل من مدير المحفظة وتهيئته عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
  const walletManager = new WalletManager();
  walletManager.initialize();
  
  // حفظ المثيل في نطاق عام
  window.walletManager = walletManager;
});

