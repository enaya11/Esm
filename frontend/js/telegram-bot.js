// Telegram Bot Handler for SmartCoin
// This file handles the interaction with the Telegram bot for verification

class TelegramBotHandler {
  constructor() {
    this.botUsername = 'MySmartCoin_bot';
    this.botUrl = 'http://t.me/MySmartCoin_bot';
    // توكن البوت محفوظ بشكل آمن في الخادم وغير معروض للمستخدمين
    this.verificationCodes = new Map();
    this.verificationTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds
  }

  // Initialize the Telegram bot handler
  async initialize() {
    console.log('Initializing Telegram bot handler...');
    
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Telegram bot handler initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing Telegram bot handler:', error);
      return false;
    }
  }

  // Set up event listeners
  setupEventListeners() {
    console.log('Setting up Telegram bot event listeners...');
    
    // Listen for verification code submission
    const verifyCodeBtn = document.getElementById('verify-code-btn');
    if (verifyCodeBtn) {
      verifyCodeBtn.addEventListener('click', this.handleVerificationSubmit.bind(this));
    }
    
    // Listen for Telegram login button click
    const telegramLoginBtn = document.getElementById('telegram-login-btn');
    if (telegramLoginBtn) {
      telegramLoginBtn.addEventListener('click', this.handleTelegramLoginClick.bind(this));
    }
  }

  // Handle Telegram login button click
  handleTelegramLoginClick() {
    console.log('Telegram login button clicked');
    
    // Show verification form
    const verificationContainer = document.getElementById('telegram-verification');
    if (verificationContainer) {
      verificationContainer.style.display = 'block';
    }
    
    // Hide login methods
    const loginMethods = document.querySelectorAll('.login-method');
    loginMethods.forEach(method => {
      method.style.display = 'none';
    });
  }

  // Handle verification code submission
  async handleVerificationSubmit() {
    console.log('Verification code submitted');
    
    const usernameInput = document.getElementById('telegram-username');
    const codeInput = document.getElementById('verification-code');
    
    if (!usernameInput || !codeInput) {
      console.error('Username or code input not found');
      return;
    }
    
    const username = usernameInput.value.trim();
    const code = codeInput.value.trim();
    
    if (!username) {
      this.showError('يرجى إدخال معرف تيليجرام الخاص بك');
      return;
    }
    
    if (!code) {
      this.showError('يرجى إدخال رمز التحقق');
      return;
    }
    
    try {
      // Verify the code
      const isValid = await this.verifyCode(username, code);
      
      if (isValid) {
        // Redirect to dashboard
        this.handleSuccessfulLogin(username);
      } else {
        this.showError('رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى');
      }
    } catch (error) {
      console.error('Error verifying code:', error);
      this.showError('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى');
    }
  }

  // Generate a verification code for a user
  generateVerificationCode(username) {
    console.log(`Generating verification code for ${username}`);
    
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store the code with expiration
    this.verificationCodes.set(username, {
      code,
      expiresAt: Date.now() + this.verificationTimeout
    });
    
    return code;
  }

  // Send a verification code to a user via the Telegram bot
  async sendVerificationCode(username) {
    console.log(`Sending verification code to ${username}`);
    
    try {
      // Generate a verification code
      const code = this.generateVerificationCode(username);
      
      // In a real implementation, this would send the code via the Telegram bot API
      // For now, we'll simulate sending the code
      console.log(`Verification code for ${username}: ${code}`);
      
      // Show instructions to the user
      this.showInfo(`تم إرسال رمز التحقق إلى بوت تيليجرام. يرجى التحقق من الرسائل في بوت SmartCoin وإدخال الرمز هنا.`);
      
      return true;
    } catch (error) {
      console.error('Error sending verification code:', error);
      this.showError('حدث خطأ أثناء إرسال رمز التحقق. يرجى المحاولة مرة أخرى');
      return false;
    }
  }

  // Verify a verification code
  async verifyCode(username, code) {
    console.log(`Verifying code for ${username}: ${code}`);
    
    // Get the stored verification data
    const verificationData = this.verificationCodes.get(username);
    
    if (!verificationData) {
      console.log(`No verification code found for ${username}`);
      
      // For demo purposes, we'll generate and accept a code
      // In a real implementation, this would fail
      const newCode = this.generateVerificationCode(username);
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return code === newCode;
    }
    
    // Check if the code has expired
    if (Date.now() > verificationData.expiresAt) {
      console.log(`Verification code for ${username} has expired`);
      this.verificationCodes.delete(username);
      return false;
    }
    
    // Check if the code matches
    const isValid = verificationData.code === code;
    
    if (isValid) {
      console.log(`Verification successful for ${username}`);
      this.verificationCodes.delete(username);
    } else {
      console.log(`Invalid verification code for ${username}`);
    }
    
    return isValid;
  }

  // Handle successful login
  handleSuccessfulLogin(username) {
    console.log(`User ${username} logged in successfully`);
    
    // Store user session
    localStorage.setItem('smartcoin_user', username);
    localStorage.setItem('smartcoin_login_time', Date.now().toString());
    
    // Redirect to dashboard
    window.location.href = 'index.html';
  }

  // Show an error message
  showError(message) {
    alert(message);
  }

  // Show an info message
  showInfo(message) {
    alert(message);
  }

  // Get the bot URL
  getBotUrl() {
    return this.botUrl;
  }

  // Check if a user is logged in
  isUserLoggedIn() {
    const user = localStorage.getItem('smartcoin_user');
    const loginTime = localStorage.getItem('smartcoin_login_time');
    
    if (!user || !loginTime) {
      return false;
    }
    
    // Check if the session has expired (24 hours)
    const sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    const now = Date.now();
    const timeSinceLogin = now - parseInt(loginTime);
    
    return timeSinceLogin < sessionTimeout;
  }

  // Log out the current user
  logoutUser() {
    localStorage.removeItem('smartcoin_user');
    localStorage.removeItem('smartcoin_login_time');
    
    // Redirect to login page
    window.location.href = 'login.html';
  }

  // Send a reminder notification to the user
  async sendReminderNotification(username, message) {
    console.log(`Sending reminder notification to ${username}: ${message}`);
    
    try {
      // In a real implementation, this would send a notification via the Telegram bot API
      // For now, we'll simulate sending the notification
      console.log(`Notification sent to ${username}`);
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Schedule a mining reminder
  scheduleMiningReminder(username) {
    console.log(`Scheduling mining reminder for ${username}`);
    
    // In a real implementation, this would schedule a reminder on the server
    // For now, we'll simulate scheduling a reminder
    
    // Check if the user has mined today
    const lastMiningTime = localStorage.getItem('lastMiningTime');
    if (!lastMiningTime) {
      // Send a reminder after 12 hours
      setTimeout(() => {
        this.sendReminderNotification(username, 'لا تنس التعدين اليومي للحصول على عملات SmartCoin!');
      }, 12 * 60 * 60 * 1000);
    }
  }
}

// Create and initialize the Telegram bot handler
const telegramBotHandler = new TelegramBotHandler();
document.addEventListener('DOMContentLoaded', () => {
  telegramBotHandler.initialize();
});

// Function to verify Telegram code (used by login.html)
function verifyTelegramCode(username, code) {
  telegramBotHandler.verifyCode(username, code)
    .then(isValid => {
      if (isValid) {
        telegramBotHandler.handleSuccessfulLogin(username);
      } else {
        alert('رمز التحقق غير صحيح. يرجى المحاولة مرة أخرى');
      }
    })
    .catch(error => {
      console.error('Error verifying code:', error);
      alert('حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى');
    });
}
