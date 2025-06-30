// Main application script for SmartCoin
// This file initializes all optimizers and managers

// Import optimizers and managers
// In a real implementation, these would be proper imports
// For now, we'll assume they're globally available

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Initializing SmartCoin application...');
  
  try {
    // Initialize cache manager
    if (typeof cacheManager !== 'undefined') {
      await cacheManager.initialize();
      console.log('Cache manager initialized');
    } else {
      console.warn('Cache manager not found');
    }
    
    // Initialize database optimizer
    if (typeof databaseOptimizer !== 'undefined') {
      await databaseOptimizer.initialize();
      console.log('Database optimizer initialized');
    } else {
      console.warn('Database optimizer not found');
    }
    
    // Initialize performance optimizer
    if (typeof performanceOptimizer !== 'undefined') {
      await performanceOptimizer.initialize();
      console.log('Performance optimizer initialized');
    } else {
      console.warn('Performance optimizer not found');
    }
    
    // Initialize security optimizer
    if (typeof securityOptimizer !== 'undefined') {
      await securityOptimizer.initialize();
      console.log('Security optimizer initialized');
    } else {
      console.warn('Security optimizer not found');
    }
    
    // Initialize TON connector
    if (typeof tonConnector !== 'undefined') {
      await tonConnector.initialize();
      console.log('TON connector initialized');
    } else {
      console.warn('TON connector not found');
    }
    
    // Initialize Telegram bot connector
    if (typeof telegramBotConnector !== 'undefined') {
      await telegramBotConnector.initialize();
      console.log('Telegram bot connector initialized');
    } else {
      console.warn('Telegram bot connector not found');
    }
    
    // Initialize store manager
    if (typeof storeManager !== 'undefined') {
      await storeManager.initialize();
      console.log('Store manager initialized');
    } else {
      console.warn('Store manager not found');
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Apply theme based on user preference
    applyTheme();
    
    console.log('SmartCoin application initialized successfully');
  } catch (error) {
    console.error('Error initializing SmartCoin application:', error);
  }
});

// Set up event listeners
function setupEventListeners() {
  console.log('Setting up event listeners...');
  
  // Theme toggle
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Mining button
  const miningButton = document.getElementById('mining-button');
  if (miningButton) {
    miningButton.addEventListener('click', startMining);
  }
  
  // Store purchase buttons
  const purchaseButtons = document.querySelectorAll('.purchase-button');
  purchaseButtons.forEach(button => {
    button.addEventListener('click', handlePurchase);
  });
  
  // Wheel of fortune button
  const wheelButton = document.getElementById('wheel-button');
  if (wheelButton) {
    wheelButton.addEventListener('click', spinWheel);
  }
  
  console.log('Event listeners set up successfully');
}

// Apply theme based on user preference
function applyTheme() {
  const darkModePreferred = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', darkModePreferred);
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = darkModePreferred ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', isDarkMode);
  
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = isDarkMode ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
  }
}

// Start mining
async function startMining() {
  console.log('Starting mining...');
  
  try {
    // Check if user is logged in (this should be handled by backend authentication)
    // For now, we'll assume the user is logged in for frontend interaction
    
    // Check if mining is on cooldown
    if (isMiningOnCooldown()) {
      showCooldownMessage();
      return;
    }
    
    // Simulate mining process (this should interact with the backend)
    const miningButton = document.getElementById('mining-button');
    if (miningButton) {
      miningButton.disabled = true;
      miningButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التعدين...';
    }
    
    // Send request to backend to start mining
    const response = await fetch('/api/start-mining', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: 'someUserId' }) // Replace with actual user ID
    });
    const result = await response.json();

    if (result.success) {
      // Update UI
      updateMiningUI(result);
      
      // Set cooldown
      setMiningCooldown();
      
      console.log('Mining completed successfully');
    } else {
      showErrorMessage(result.message || 'حدث خطأ أثناء التعدين. يرجى المحاولة مرة أخرى.');
    }
  } catch (error) {
    console.error('Error during mining:', error);
    
    // Update UI to show error
    const miningButton = document.getElementById('mining-button');
    if (miningButton) {
      miningButton.disabled = false;
      miningButton.innerHTML = 'حدث خطأ، حاول مرة أخرى';
    }
  }
}

// Handle purchase
async function handlePurchase(event) {
  console.log('Handling purchase...');
  
  try {
    // Get package details from button data attributes
    const button = event.currentTarget;
    const packageId = button.dataset.packageId;
    const packageType = button.dataset.packageType;
    const currency = button.dataset.currency;
    const amount = parseFloat(button.dataset.amount);
    
    console.log(`Purchase details: packageId=${packageId}, packageType=${packageType}, currency=${currency}, amount=${amount}`);
    
    // Check if it's a gift card and if they're locked
    if (packageType === 'gift_card' && typeof storeManager !== 'undefined' && storeManager.areGiftCardsLocked()) {
      showGiftCardLockedMessage();
      return;
    }
    
    // Process purchase based on currency (interact with backend)
    let result;
    const userId = 'someUserId'; // Replace with actual user ID

    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId, packageId, price: amount, currency })
    });
    result = await response.json();
    
    // Update UI based on result
    if (result.success) {
      showSuccessMessage(`تم الشراء بنجاح!`);
      // Optionally redirect to payment link or show QR code
      if (result.payment && result.payment.paymentLink) {
        window.open(result.payment.paymentLink, '_blank');
      }
    } else {
      showErrorMessage(result.message || 'حدث خطأ أثناء الشراء. يرجى المحاولة مرة أخرى.');
    }
    
    console.log('Purchase handled successfully');
  } catch (error) {
    console.error('Error during purchase:', error);
    showErrorMessage('حدث خطأ أثناء الشراء. يرجى المحاولة مرة أخرى.');
  }
}

// Spin the wheel of fortune
async function spinWheel() {
  console.log('Spinning wheel of fortune...');
  
  try {
    // Check if wheel is on cooldown
    if (isWheelOnCooldown()) {
      showWheelCooldownMessage();
      return;
    }
    
    // Disable the button
    const wheelButton = document.getElementById('wheel-button');
    if (wheelButton) {
      wheelButton.disabled = true;
      wheelButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الدوران...';
    }
    
    // Send request to backend to spin the wheel
    const response = await fetch('/api/spin-wheel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ userId: 'someUserId' }) // Replace with actual user ID
    });
    const result = await response.json();

    if (result.success) {
      // Get the wheel element
      const wheel = document.getElementById('fortune-wheel');
      if (!wheel) {
        throw new Error('Wheel element not found');
      }
      
      // Apply rotation with CSS animation (assuming backend returns angle or prize index)
      const prizeAngle = result.prize.angle; // Assuming backend returns the angle to stop at
      const baseRotation = Math.floor(Math.random() * 8 + 2) * 360; // Ensure multiple rotations
      const finalRotation = baseRotation + prizeAngle;

      wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.83, 0.67)';
      wheel.style.transform = `rotate(${finalRotation}deg)`;
      
      // Wait for animation to complete
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Show prize message
      showPrizeMessage(result.prize);
      
      // Set cooldown
      setWheelCooldown();
    } else {
      showErrorMessage(result.message || 'حدث خطأ أثناء دوران العجلة. يرجى المحاولة مرة أخرى.');
    }
    
    // Reset button
    if (wheelButton) {
      wheelButton.disabled = false;
      wheelButton.innerHTML = 'دوّر العجلة';
    }
    
    console.log('Wheel spin completed successfully');
  } catch (error) {
    console.error('Error during wheel spin:', error);
    
    // Reset button
    const wheelButton = document.getElementById('wheel-button');
    if (wheelButton) {
      wheelButton.disabled = false;
      wheelButton.innerHTML = 'دوّر العجلة';
    }
    
    showErrorMessage('حدث خطأ أثناء دوران العجلة. يرجى المحاولة مرة أخرى.');
  }
}

// Check if user is logged in (this function should be removed or updated to reflect actual authentication)
function isUserLoggedIn() {
  // This function should ideally check a session token or similar from the backend
  // For now, we'll return true to allow frontend interaction
  return true;
}

// Show login prompt
function showLoginPrompt() {
  alert('يرجى تسجيل الدخول أولاً للاستمرار.');
  window.location.href = 'login.html';
}

// Check if mining is on cooldown
function isMiningOnCooldown() {
  const lastMiningTime = localStorage.getItem('lastMiningTime');
  if (!lastMiningTime) {
    return false;
  }
  
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const timeSinceLastMining = now - parseInt(lastMiningTime);
  
  return timeSinceLastMining < cooldownPeriod;
}

// Set mining cooldown
function setMiningCooldown() {
  localStorage.setItem('lastMiningTime', Date.now().toString());
  
  // Update UI to show cooldown
  updateCooldownUI();
}

// Update mining UI
function updateMiningUI(result) {
  // Update mining button
  const miningButton = document.getElementById('mining-button');
  if (miningButton) {
    miningButton.disabled = true;
    miningButton.innerHTML = 'تم التعدين اليوم';
  }
  
  // Show success message
  showSuccessMessage(`تم التعدين بنجاح! حصلت على ${result.amount} عملة SM`);
  
  // Update balance if available
  const balanceElement = document.getElementById('sm-balance');
  if (balanceElement) {
    const currentBalance = parseFloat(balanceElement.textContent);
    balanceElement.textContent = (currentBalance + result.amount).toFixed(2);
  }
  
  // Update cooldown UI
  updateCooldownUI();
}

// Update cooldown UI
function updateCooldownUI() {
  const cooldownElement = document.getElementById('mining-cooldown');
  if (!cooldownElement) {
    return;
  }
  
  const lastMiningTime = localStorage.getItem('lastMiningTime');
  if (!lastMiningTime) {
    cooldownElement.style.display = 'none';
    return;
  }
  
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const timeSinceLastMining = now - parseInt(lastMiningTime);
  
  if (timeSinceLastMining >= cooldownPeriod) {
    cooldownElement.style.display = 'none';
    
    // Enable mining button
    const miningButton = document.getElementById('mining-button');
    if (miningButton) {
      miningButton.disabled = false;
      miningButton.innerHTML = 'ابدأ التعدين';
    }
    
    return;
  }
  
  // Calculate remaining time
  const hours = Math.floor(remainingTime / (60 * 60 * 1000));
  const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  
  cooldownElement.style.display = 'block';
  cooldownElement.textContent = `يمكنك التعدين مرة أخرى بعد ${hours} ساعة و ${minutes} دقيقة`;
  
  // Update cooldown every minute
  setTimeout(updateCooldownUI, 60 * 1000);
}

// Show cooldown message
function showCooldownMessage() {
  const lastMiningTime = localStorage.getItem('lastMiningTime');
  if (!lastMiningTime) {
    return;
  }
  
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const timeSinceLastMining = now - parseInt(lastMiningTime);
  const remainingTime = cooldownPeriod - timeSinceLastMining;
  const hours = Math.floor(remainingTime / (60 * 60 * 1000));
  const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  
  alert(`لقد قمت بالتعدين اليوم بالفعل. يمكنك التعدين مرة أخرى بعد ${hours} ساعة و ${minutes} دقيقة.`);
}

// Check if wheel is on cooldown
function isWheelOnCooldown() {
  const lastWheelTime = localStorage.getItem('lastWheelTime');
  if (!lastWheelTime) {
    return false;
  }
  
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const timeSinceLastWheel = now - parseInt(lastWheelTime);
  
  return timeSinceLastWheel < cooldownPeriod;
}

// Set wheel cooldown
function setWheelCooldown() {
  localStorage.setItem('lastWheelTime', Date.now().toString());
}

// Show wheel cooldown message
function showWheelCooldownMessage() {
  const lastWheelTime = localStorage.getItem('lastWheelTime');
  if (!lastWheelTime) {
    return;
  }
  
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const timeSinceLastWheel = now - parseInt(lastWheelTime);
  const remainingTime = cooldownPeriod - timeSinceLastWheel;
  const hours = Math.floor(remainingTime / (60 * 60 * 1000));
  const minutes = Math.floor((remainingTime % (60 * 60 * 1000)) / (60 * 1000));
  
  alert(`لقد قمت بتدوير العجلة اليوم بالفعل. يمكنك تدوير العجلة مرة أخرى بعد ${hours} ساعة و ${minutes} دقيقة.`);
}

// Show gift card locked message
function showGiftCardLockedMessage() {
  // Get remaining time until unlock
  let remainingTime = 40 * 24 * 60 * 60 * 1000; // 40 days in milliseconds
  
  if (typeof storeManager !== 'undefined') {
    remainingTime = storeManager.getRemainingTimeUntilUnlock();
  }
  
  const days = Math.floor(remainingTime / (24 * 60 * 60 * 1000));
  
  alert(`بطاقات الهدايا مقفلة حالياً. ستكون متاحة بعد ${days} يوم من إطلاق العملة.`);
}

// Show prize message
function showPrizeMessage(prize) {
  alert(`مبروك! لقد ربحت ${prize.amount} ${prize.type}.`);
}

// Show success message
function showSuccessMessage(message) {
  // In a real implementation, this would show a toast or modal
  // For now, we'll use alert
  alert(message);
}

// Show error message
function showErrorMessage(message) {
  // In a real implementation, this would show a toast or modal
  // For now, we'll use alert
  alert(message);
}


