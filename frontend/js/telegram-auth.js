// Callback function for Telegram Login Widget
function onTelegramAuth(user) {
    console.log('Telegram user data received:', user);

    // Display a loading message
    showStatusMessage('جاري تسجيل الدخول عبر تليجرام...', 'info');

    // Send user data to your backend for verification and authentication
    fetch('/auth/telegram-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(user),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Login successful:', data);
                // Store JWT token and redirect
                localStorage.setItem('smartcoin_token', data.token);
                localStorage.setItem('smartcoin_user_id', data.user.id);
                localStorage.setItem('smartcoin_telegram_id', data.user.telegramId);
                localStorage.setItem('smartcoin_username', data.user.username);
                localStorage.setItem('smartcoin_login_time', Date.now().toString());

                showStatusMessage('تم تسجيل الدخول بنجاح! جاري التحويل...', 'success');
                window.location.href = 'index.html'; // Redirect to dashboard or main page
            } else {
                console.error('Login failed:', data.message);
                showStatusMessage(`فشل تسجيل الدخول: ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Error during Telegram login:', error);
            showStatusMessage('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.', 'error');
        });
}

// Function to display status messages
function showStatusMessage(message, type) {
    const statusMessageElement = document.getElementById('statusMessage');
    if (statusMessageElement) {
        statusMessageElement.textContent = message;
        statusMessageElement.className = `status-message ${type}`;
        statusMessageElement.style.display = 'block';
    }
}

// Hide verification section if it exists (as it's no longer needed for this flow)
document.addEventListener('DOMContentLoaded', () => {
    const verificationSection = document.getElementById('verificationSection');
    if (verificationSection) {
        verificationSection.style.display = 'none';
    }
});