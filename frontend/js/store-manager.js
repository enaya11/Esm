// Store Manager for SmartCoin
// This file handles the store functionality including package purchases

class StoreManager {
  constructor() {
    this.packages = {
      mining: [
        { id: 'package1', name: 'باقة أساسية', rate: 20, price: { ton: 0.32, sol: 0.0075 } },
        { id: 'package2', name: 'باقة متوسطة', rate: 35, price: { ton: 0.64, sol: 0.015 } },
        { id: 'package3', name: 'باقة متقدمة', rate: 50, price: { ton: 1.6, sol: 0.0375 } }
      ],
      giftCards: [
        { id: 'google_play_10', name: 'بطاقة Google Play', value: 10, price: 500 },
        { id: 'amazon_10', name: 'بطاقة Amazon', value: 10, price: 500 },
        { id: 'google_play_25', name: 'بطاقة Google Play', value: 25, price: 1200 },
        { id: 'amazon_25', name: 'بطاقة Amazon', value: 25, price: 1200 },
        { id: 'google_play_50', name: 'بطاقة Google Play', value: 50, price: 2300 },
        { id: 'amazon_50', name: 'بطاقة Amazon', value: 50, price: 2300 }
      ]
    };
    
    this.giftCardsLockDays = 40;
    this.launchDate = new Date('2025-05-01T00:00:00Z'); // تاريخ إطلاق العملة
  }

  // Initialize the store manager
  async initialize() {
    console.log('Initializing store manager...');
    
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Update UI
      this.updateUI();
      
      console.log('Store manager initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing store manager:', error);
      return false;
    }
  }

  // Set up event listeners
  setupEventListeners() {
    console.log('Setting up store event listeners...');
    
    // Listen for purchase button clicks
    document.addEventListener('click', (event) => {
      const target = event.target;
      
      // Check if the clicked element is a purchase button
      if (target.classList.contains('purchase-button')) {
        event.preventDefault();
        
        const packageId = target.dataset.packageId;
        const packageType = target.dataset.packageType;
        const currency = target.dataset.currency;
        
        if (packageType === 'mining') {
          this.handleMiningPackagePurchase(packageId, currency);
        } else if (packageType === 'giftCard') {
          this.handleGiftCardPurchase(packageId);
        }
      }
    });
  }

  // Update UI
  updateUI() {
    console.log('Updating store UI...');
    
    // Update gift cards lock status
    this.updateGiftCardsLockStatus();
  }

  // Update gift cards lock status
  updateGiftCardsLockStatus() {
    const giftCardButtons = document.querySelectorAll('.gift-card-button');
    const isLocked = this.areGiftCardsLocked();
    const remainingDays = this.getRemainingDaysUntilUnlock();
    
    giftCardButtons.forEach(button => {
      if (isLocked) {
        button.disabled = true;
        button.innerHTML = `مقفل (${remainingDays} يوم متبقي)`;
      } else {
        button.disabled = false;
        button.innerHTML = 'شراء الآن';
      }
    });
    
    const lockInfoElement = document.getElementById('gift-cards-lock-info');
    if (lockInfoElement) {
      if (isLocked) {
        lockInfoElement.style.display = 'block';
        lockInfoElement.textContent = `بطاقات الهدايا مقفلة حالياً. ستكون متاحة بعد ${remainingDays} يوم من إطلاق العملة.`;
      } else {
        lockInfoElement.style.display = 'none';
      }
    }
  }

  // Handle mining package purchase
  async handleMiningPackagePurchase(packageId, currency) {
    console.log(`Handling mining package purchase: ${packageId} with ${currency}`);
    
    try {
      // Check if user is logged in
      if (!this.isUserLoggedIn()) {
        this.showLoginPrompt();
        return;
      }
      
      // Get package details
      const packageDetails = this.getMiningPackageDetails(packageId);
      
      if (!packageDetails) {
        throw new Error(`Invalid package ID: ${packageId}`);
      }
      
      // Get price in selected currency
      const price = packageDetails.price[currency.toLowerCase()];
      
      if (!price) {
        throw new Error(`Invalid currency: ${currency}`);
      }
      
      // Show confirmation dialog
      const confirmed = confirm(`هل أنت متأكد من رغبتك في شراء ${packageDetails.name} مقابل ${price} ${currency}؟`);
      
      if (!confirmed) {
        return;
      }
      
      // Redirect to payment page
      if (currency.toLowerCase() === 'ton') {
        this.redirectToTONPayment(packageId, price);
      } else if (currency.toLowerCase() === 'sol') {
        this.redirectToSolanaPayment(packageId, price);
      } else {
        throw new Error(`Unsupported currency: ${currency}`);
      }
    } catch (error) {
      console.error('Error handling mining package purchase:', error);
      this.showErrorMessage('حدث خطأ أثناء معالجة عملية الشراء. يرجى المحاولة مرة أخرى.');
    }
  }

  // Handle gift card purchase
  async handleGiftCardPurchase(giftCardId) {
    console.log(`Handling gift card purchase: ${giftCardId}`);
    
    try {
      // Check if user is logged in
      if (!this.isUserLoggedIn()) {
        this.showLoginPrompt();
        return;
      }
      
      // Check if gift cards are locked
      if (this.areGiftCardsLocked()) {
        this.showGiftCardLockedMessage();
        return;
      }
      
      // Get gift card details
      const giftCardDetails = this.getGiftCardDetails(giftCardId);
      
      if (!giftCardDetails) {
        throw new Error(`Invalid gift card ID: ${giftCardId}`);
      }
      
      // Check if user has enough balance
      const userBalance = this.getUserBalance();
      
      if (userBalance < giftCardDetails.price) {
        this.showInsufficientBalanceMessage(giftCardDetails.price, userBalance);
        return;
      }
      
      // Show confirmation dialog
      const confirmed = confirm(`هل أنت متأكد من رغبتك في شراء ${giftCardDetails.name} بقيمة ${giftCardDetails.value} دولار مقابل ${giftCardDetails.price} عملة SM؟`);
      
      if (!confirmed) {
        return;
      }
      
      // Process purchase
      const success = await this.processGiftCardPurchase(giftCardId);
      
      if (success) {
        this.showSuccessMessage(`تم شراء ${giftCardDetails.name} بنجاح! ستجد البطاقة في قسم "مشترياتي".`);
      } else {
        this.showErrorMessage('حدث خطأ أثناء معالجة عملية الشراء. يرجى المحاولة مرة أخرى.');
      }
    } catch (error) {
      console.error('Error handling gift card purchase:', error);
      this.showErrorMessage('حدث خطأ أثناء معالجة عملية الشراء. يرجى المحاولة مرة أخرى.');
    }
  }

  // Redirect to TON payment
  redirectToTONPayment(packageId, price) {
    console.log(`Redirecting to TON payment for package ${packageId} with price ${price} TON`);
    
    try {
      // In a real implementation, this would redirect to a TON payment page
      // For now, we'll simulate the payment process
      
      // Get user ID
      const userId = this.getUserId();
      
      // Generate a unique payment ID
      const paymentId = this.generatePaymentId();
      
      // Store payment details in local storage for demo purposes
      const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '{}');
      
      pendingPayments[paymentId] = {
        userId,
        packageId,
        currency: 'TON',
        amount: price,
        status: 'pending',
        createdAt: Date.now()
      };
      
      localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
      
      // Show payment instructions
      alert(`لإكمال عملية الشراء، يرجى تحويل ${price} TON إلى العنوان التالي:\n\nEQBYLTm7ygbDH_Mp9lnFO1WTrFMqAAAAAAAAAAAAAAAAAQID\n\nبعد إتمام التحويل، سيتم تفعيل الباقة تلقائياً.`);
      
      // In a real implementation, this would open a TON wallet for payment
      // For demo purposes, we'll simulate a successful payment after a delay
      setTimeout(() => {
        // Simulate a successful payment
        const transaction = {
          status: 'success',
          userId,
          amount: price
        };
        
        // Handle the transaction
        if (typeof webSocketHandler !== 'undefined') {
          webSocketHandler.handleTONMessage(JSON.stringify({
            method: 'transactionUpdate',
            params: {
              result: transaction
            }
          }));
        }
      }, 5000);
    } catch (error) {
      console.error('Error redirecting to TON payment:', error);
      this.showErrorMessage('حدث خطأ أثناء توجيهك إلى صفحة الدفع. يرجى المحاولة مرة أخرى.');
    }
  }

  // Redirect to Solana payment
  redirectToSolanaPayment(packageId, price) {
    console.log(`Redirecting to Solana payment for package ${packageId} with price ${price} SOL`);
    
    try {
      // In a real implementation, this would redirect to a Solana payment page
      // For now, we'll simulate the payment process
      
      // Get user ID
      const userId = this.getUserId();
      
      // Generate a unique payment ID
      const paymentId = this.generatePaymentId();
      
      // Store payment details in local storage for demo purposes
      const pendingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '{}');
      
      pendingPayments[paymentId] = {
        userId,
        packageId,
        currency: 'SOL',
        amount: price,
        status: 'pending',
        createdAt: Date.now()
      };
      
      localStorage.setItem('pendingPayments', JSON.stringify(pendingPayments));
      
      // Show payment instructions
      alert(`لإكمال عملية الشراء، يرجى تحويل ${price} SOL إلى العنوان التالي:\n\n8ZUgCUxsRmzjgKZQBN9jYKHxyDQZ8fbQPCLeQfwfHGDk\n\nبعد إتمام التحويل، سيتم تفعيل الباقة تلقائياً.`);
      
      // In a real implementation, this would open a Solana wallet for payment
      // For demo purposes, we'll simulate a successful payment after a delay
      setTimeout(() => {
        // Simulate a successful payment
        const transaction = {
          status: 'success',
          userId,
          amount: price
        };
        
        // Handle the transaction
        if (typeof webSocketHandler !== 'undefined') {
          webSocketHandler.handleSolanaMessage(JSON.stringify({
            method: 'signatureNotification',
            params: {
              result: transaction
            }
          }));
        }
      }, 5000);
    } catch (error) {
      console.error('Error redirecting to Solana payment:', error);
      this.showErrorMessage('حدث خطأ أثناء توجيهك إلى صفحة الدفع. يرجى المحاولة مرة أخرى.');
    }
  }

  // Process gift card purchase
  async processGiftCardPurchase(giftCardId) {
    console.log(`Processing gift card purchase: ${giftCardId}`);
    
    try {
      // In a real implementation, this would call an API to process the purchase
      // For now, we'll simulate the purchase process
      
      // Get gift card details
      const giftCardDetails = this.getGiftCardDetails(giftCardId);
      
      if (!giftCardDetails) {
        throw new Error(`Invalid gift card ID: ${giftCardId}`);
      }
      
      // Get user ID
      const userId = this.getUserId();
      
      // Deduct balance
      const userBalance = this.getUserBalance();
      const newBalance = userBalance - giftCardDetails.price;
      
      // Update user balance
      localStorage.setItem('smartcoin_balance', newBalance.toString());
      
      // Store purchase in local storage for demo purposes
      const purchases = JSON.parse(localStorage.getItem('purchases') || '{}');
      
      if (!purchases[userId]) {
        purchases[userId] = [];
      }
      
      purchases[userId].push({
        id: giftCardId,
        name: giftCardDetails.name,
        value: giftCardDetails.value,
        price: giftCardDetails.price,
        purchasedAt: Date.now(),
        code: this.generateGiftCardCode()
      });
      
      localStorage.setItem('purchases', JSON.stringify(purchases));
      
      // Update UI
      this.updateBalanceUI(newBalance);
      
      return true;
    } catch (error) {
      console.error('Error processing gift card purchase:', error);
      return false;
    }
  }

  // Get mining package details
  getMiningPackageDetails(packageId) {
    return this.packages.mining.find(pkg => pkg.id === packageId);
  }

  // Get gift card details
  getGiftCardDetails(giftCardId) {
    return this.packages.giftCards.find(card => card.id === giftCardId);
  }

  // Check if gift cards are locked
  areGiftCardsLocked() {
    const now = new Date();
    const unlockDate = new Date(this.launchDate);
    unlockDate.setDate(unlockDate.getDate() + this.giftCardsLockDays);
    
    return now < unlockDate;
  }

  // Get remaining days until gift cards unlock
  getRemainingDaysUntilUnlock() {
    const now = new Date();
    const unlockDate = new Date(this.launchDate);
    unlockDate.setDate(unlockDate.getDate() + this.giftCardsLockDays);
    
    const diffTime = unlockDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Get remaining time until gift cards unlock
  getRemainingTimeUntilUnlock() {
    const now = new Date();
    const unlockDate = new Date(this.launchDate);
    unlockDate.setDate(unlockDate.getDate() + this.giftCardsLockDays);
    
    return Math.max(0, unlockDate - now);
  }

  // Check if user is logged in
  isUserLoggedIn() {
    const user = localStorage.getItem('smartcoin_user');
    const wallet = localStorage.getItem('smartcoin_wallet');
    
    return !!(user || wallet);
  }

  // Get user ID
  getUserId() {
    return localStorage.getItem('smartcoin_user') || localStorage.getItem('smartcoin_wallet') || 'guest';
  }

  // Get user balance
  getUserBalance() {
    const balance = localStorage.getItem('smartcoin_balance');
    return balance ? parseFloat(balance) : 0;
  }

  // Update balance UI
  updateBalanceUI(balance) {
    const balanceElement = document.getElementById('sm-balance');
    if (balanceElement) {
      balanceElement.textContent = balance.toFixed(2);
    }
  }

  // Generate a unique payment ID
  generatePaymentId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  // Generate a gift card code
  generateGiftCardCode() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    
    for (let i = 0; i < 16; i++) {
      if (i > 0 && i % 4 === 0) {
        code += '-';
      }
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return code;
  }

  // Show login prompt
  showLoginPrompt() {
    alert('يرجى تسجيل الدخول أولاً للاستمرار.');
    window.location.href = 'login.html';
  }

  // Show gift card locked message
  showGiftCardLockedMessage() {
    const remainingDays = this.getRemainingDaysUntilUnlock();
    alert(`بطاقات الهدايا مقفلة حالياً. ستكون متاحة بعد ${remainingDays} يوم من إطلاق العملة.`);
  }

  // Show insufficient balance message
  showInsufficientBalanceMessage(required, current) {
    alert(`رصيدك غير كافٍ. المطلوب: ${required} SM، رصيدك الحالي: ${current} SM.`);
  }

  // Show success message
  showSuccessMessage(message) {
    alert(message);
  }

  // Show error message
  showErrorMessage(message) {
    alert(message);
  }
}

// Create and initialize the store manager
const storeManager = new StoreManager();
document.addEventListener('DOMContentLoaded', () => {
  storeManager.initialize();
});
