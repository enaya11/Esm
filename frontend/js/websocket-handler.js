// WebSocket Handler for SmartCoin
// This file handles WebSocket connections to Solana and TON networks

class WebSocketHandler {
  constructor() {
    // رابط WebSocket الخاص بـ Solana و TON
    this.socketUrlSolana = 'wss://indulgent-thrumming-sky.solana-mainnet.quiknode.pro/011e3efccc9ddf2f45fe73987cf6e21ba163d077/';
    this.socketUrlTON = 'wss://toncenter.com/api/v2/websocket?api_key=32e3df1bb58960b9f1da65807c36836f71b71f93363450e2624fecd31bc57c3e';
    
    this.wsSolana = null;
    this.wsTON = null;
    this.isConnectedSolana = false;
    this.isConnectedTON = false;
    this.reconnectInterval = 5000; // 5 seconds
    this.maxReconnectAttempts = 5;
    this.reconnectAttemptsSolana = 0;
    this.reconnectAttemptsTON = 0;
  }

  // Initialize WebSocket connections
  async initialize() {
    console.log('Initializing WebSocket connections...');
    
    try {
      // Connect to Solana WebSocket
      await this.connectSolana();
      
      // Connect to TON WebSocket
      await this.connectTON();
      
      console.log('WebSocket connections initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing WebSocket connections:', error);
      return false;
    }
  }

  // Connect to Solana WebSocket
  async connectSolana() {
    console.log('Connecting to Solana WebSocket...');
    
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        this.wsSolana = new WebSocket(this.socketUrlSolana);
        
        // Set up event handlers
        this.wsSolana.onopen = () => {
          console.log('تم الاتصال بـ WebSocket لـ Solana بنجاح!');
          this.isConnectedSolana = true;
          this.reconnectAttemptsSolana = 0;
          resolve(true);
        };
        
        this.wsSolana.onmessage = (event) => {
          this.handleSolanaMessage(event.data);
        };
        
        this.wsSolana.onerror = (error) => {
          console.error('حدث خطأ في الاتصال بـ WebSocket لـ Solana:', error);
          this.isConnectedSolana = false;
          reject(error);
        };
        
        this.wsSolana.onclose = () => {
          console.log('تم إغلاق الاتصال بـ WebSocket لـ Solana');
          this.isConnectedSolana = false;
          this.handleSolanaDisconnect();
        };
      } catch (error) {
        console.error('Error connecting to Solana WebSocket:', error);
        reject(error);
      }
    });
  }

  // Connect to TON WebSocket
  async connectTON() {
    console.log('Connecting to TON WebSocket...');
    
    return new Promise((resolve, reject) => {
      try {
        // Create WebSocket connection
        this.wsTON = new WebSocket(this.socketUrlTON);
        
        // Set up event handlers
        this.wsTON.onopen = () => {
          console.log('تم الاتصال بـ WebSocket لـ TON بنجاح!');
          this.isConnectedTON = true;
          this.reconnectAttemptsTON = 0;
          resolve(true);
        };
        
        this.wsTON.onmessage = (event) => {
          this.handleTONMessage(event.data);
        };
        
        this.wsTON.onerror = (error) => {
          console.error('حدث خطأ في الاتصال بـ WebSocket لـ TON:', error);
          this.isConnectedTON = false;
          reject(error);
        };
        
        this.wsTON.onclose = () => {
          console.log('تم إغلاق الاتصال بـ WebSocket لـ TON');
          this.isConnectedTON = false;
          this.handleTONDisconnect();
        };
      } catch (error) {
        console.error('Error connecting to TON WebSocket:', error);
        reject(error);
      }
    });
  }

  // Handle Solana WebSocket disconnect
  handleSolanaDisconnect() {
    if (this.reconnectAttemptsSolana < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect to Solana WebSocket (${this.reconnectAttemptsSolana + 1}/${this.maxReconnectAttempts})...`);
      this.reconnectAttemptsSolana++;
      
      setTimeout(() => {
        this.connectSolana()
          .catch(error => {
            console.error('Error reconnecting to Solana WebSocket:', error);
          });
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnect attempts reached for Solana WebSocket');
    }
  }

  // Handle TON WebSocket disconnect
  handleTONDisconnect() {
    if (this.reconnectAttemptsTON < this.maxReconnectAttempts) {
      console.log(`Attempting to reconnect to TON WebSocket (${this.reconnectAttemptsTON + 1}/${this.maxReconnectAttempts})...`);
      this.reconnectAttemptsTON++;
      
      setTimeout(() => {
        this.connectTON()
          .catch(error => {
            console.error('Error reconnecting to TON WebSocket:', error);
          });
      }, this.reconnectInterval);
    } else {
      console.log('Max reconnect attempts reached for TON WebSocket');
    }
  }

  // Handle Solana WebSocket message
  handleSolanaMessage(data) {
    console.log('تم تلقي البيانات من Solana:', data);
    
    try {
      const message = JSON.parse(data);
      
      if (message.method && message.method === 'signatureNotification') {
        const transaction = message.params.result;
        if (transaction.status === 'success') {
          const userId = transaction.userId; // تأكد من أن الرسالة تحتوي على معرف المستخدم
          const amountPaid = transaction.amount; // تحقق من المبلغ المدفوع
          
          // تحقق من المبلغ المدفوع وفعّل الحزمة إذا كان المبلغ صحيحًا
          if (amountPaid === 0.0075) {
            console.log('تم دفع 1 دولار بالـ SOL!');
            this.activatePackage(userId, 'package1', 'SOL');
          } else if (amountPaid === 0.015) {
            console.log('تم دفع 2 دولار بالـ SOL!');
            this.activatePackage(userId, 'package2', 'SOL');
          } else if (amountPaid === 0.0375) {
            console.log('تم دفع 5 دولار بالـ SOL!');
            this.activatePackage(userId, 'package3', 'SOL');
          } else {
            console.log('المبلغ المدفوع غير صحيح!');
          }
        } else {
          console.log('فشلت المعاملة');
        }
      }
    } catch (error) {
      console.error('حدث خطأ أثناء تحليل البيانات من Solana:', error);
    }
  }

  // Handle TON WebSocket message
  handleTONMessage(data) {
    console.log('تم تلقي البيانات من TON:', data);
    
    try {
      const message = JSON.parse(data);
      
      if (message.method && message.method === 'transactionUpdate') {
        const transaction = message.params.result;
        if (transaction.status === 'success') {
          const userId = transaction.userId; // تأكد من أن الرسالة تحتوي على معرف المستخدم
          const amountPaid = transaction.amount; // تحقق من المبلغ المدفوع
          
          // تحقق من المبلغ المدفوع وفعّل الحزمة إذا كان المبلغ صحيحًا
          if (amountPaid === 0.32) {
            console.log('تم دفع 1 دولار بالـ TON!');
            this.activatePackage(userId, 'package1', 'TON');
          } else if (amountPaid === 0.64) {
            console.log('تم دفع 2 دولار بالـ TON!');
            this.activatePackage(userId, 'package2', 'TON');
          } else if (amountPaid === 1.6) {
            console.log('تم دفع 5 دولار بالـ TON!');
            this.activatePackage(userId, 'package3', 'TON');
          } else {
            console.log('المبلغ المدفوع غير صحيح!');
          }
        } else {
          console.log('فشلت المعاملة');
        }
      }
    } catch (error) {
      console.error('حدث خطأ أثناء تحليل البيانات من TON:', error);
    }
  }

  // Activate package for user
  async activatePackage(userId, packageId, currency) {
    console.log(`Activating package ${packageId} for user ${userId} paid with ${currency}`);
    
    try {
      // In a real implementation, this would call an API to activate the package
      // For now, we'll simulate activation
      
      // Define package details
      const packages = {
        package1: { name: 'باقة أساسية', rate: 20, price: 1 },
        package2: { name: 'باقة متوسطة', rate: 35, price: 2 },
        package3: { name: 'باقة متقدمة', rate: 50, price: 5 }
      };
      
      const packageDetails = packages[packageId];
      
      if (!packageDetails) {
        throw new Error(`Invalid package ID: ${packageId}`);
      }
      
      // Store package activation in local storage for demo purposes
      const activatedPackages = JSON.parse(localStorage.getItem('activatedPackages') || '{}');
      
      activatedPackages[userId] = {
        packageId,
        currency,
        activatedAt: Date.now(),
        expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days in milliseconds
      };
      
      localStorage.setItem('activatedPackages', JSON.stringify(activatedPackages));
      
      console.log(`Package ${packageId} activated successfully for user ${userId}`);
      
      // Show success message to user
      this.showSuccessMessage(`تم تفعيل ${packageDetails.name} بنجاح! ستحصل الآن على ${packageDetails.rate} عملة يومياً.`);
      
      return true;
    } catch (error) {
      console.error('Error activating package:', error);
      
      // Show error message to user
      this.showErrorMessage('حدث خطأ أثناء تفعيل الباقة. يرجى المحاولة مرة أخرى أو التواصل مع الدعم.');
      
      return false;
    }
  }

  // Show success message
  showSuccessMessage(message) {
    // In a real implementation, this would show a toast or modal
    // For now, we'll use alert
    alert(message);
  }

  // Show error message
  showErrorMessage(message) {
    // In a real implementation, this would show a toast or modal
    // For now, we'll use alert
    alert(message);
  }

  // Close WebSocket connections
  close() {
    console.log('Closing WebSocket connections...');
    
    if (this.wsSolana) {
      this.wsSolana.close();
    }
    
    if (this.wsTON) {
      this.wsTON.close();
    }
  }

  // Check if WebSocket connections are active
  isConnected() {
    return this.isConnectedSolana && this.isConnectedTON;
  }

  // Get connection status
  getConnectionStatus() {
    return {
      solana: this.isConnectedSolana,
      ton: this.isConnectedTON
    };
  }
}

// Create and export a singleton instance
const webSocketHandler = new WebSocketHandler();

// Initialize WebSocket connections when the page loads
document.addEventListener('DOMContentLoaded', () => {
  webSocketHandler.initialize()
    .catch(error => {
      console.error('Error initializing WebSocket connections:', error);
    });
});

// Close WebSocket connections when the page unloads
window.addEventListener('beforeunload', () => {
  webSocketHandler.close();
});
