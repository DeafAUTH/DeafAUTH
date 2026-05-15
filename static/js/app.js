/**
 * DeafAuth - Frontend JavaScript
 * Handles authentication UI interactions
 */

// API Base URL - change this to your deployed API URL
const API_BASE = window.location.origin;

// Token storage
let authToken = localStorage.getItem('deafauth_token');

// Tab switching
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(tab.dataset.tab).classList.add('active');
        
        // Load profile if switching to profile tab
        if (tab.dataset.tab === 'profile') {
            loadProfile();
        }
    });
});

// Show result message
function showResult(elementId, message, isSuccess, data = null) {
    const el = document.getElementById(elementId);
    el.className = `result show ${isSuccess ? 'success' : 'error'}`;
    el.innerHTML = `<strong>${message}</strong>`;
    if (data) {
        el.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
}

// Signup form
document.getElementById('signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showResult('signup-result', 'Account created successfully!', true, data);
            document.getElementById('signup-form').reset();
        } else {
            showResult('signup-result', data.error || 'Signup failed', false);
        }
    } catch (error) {
        showResult('signup-result', 'Network error. Is the API running?', false);
    }
});

// Login form
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('deafauth_token', authToken);
            showResult('login-result', 'Login successful!', true, { user: data.user });
            document.getElementById('login-form').reset();
            
            // Switch to profile tab
            setTimeout(() => {
                document.querySelector('[data-tab="profile"]').click();
            }, 1000);
        } else {
            showResult('login-result', data.error || 'Login failed', false);
        }
    } catch (error) {
        showResult('login-result', 'Network error. Is the API running?', false);
    }
});

// Load profile
async function loadProfile() {
    const profileContent = document.getElementById('profile-content');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!authToken) {
        profileContent.innerHTML = '<p class="muted">Login to view your profile</p>';
        logoutBtn.style.display = 'none';
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            profileContent.innerHTML = `
                <div class="profile-info">
                    <div>
                        <label>Email</label>
                        <span>${data.user.email}</span>
                    </div>
                    <div>
                        <label>User ID</label>
                        <span>${data.user.id}</span>
                    </div>
                    <div>
                        <label>Verified</label>
                        <span>${data.user.is_verified ? '✅ Yes' : '❌ No'}</span>
                    </div>
                    <div>
                        <label>Created</label>
                        <span>${new Date(data.user.created_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
            logoutBtn.style.display = 'block';
        } else {
            // Token expired or invalid
            authToken = null;
            localStorage.removeItem('deafauth_token');
            profileContent.innerHTML = '<p class="muted">Session expired. Please login again.</p>';
            logoutBtn.style.display = 'none';
        }
    } catch (error) {
        profileContent.innerHTML = '<p class="muted">Network error. Is the API running?</p>';
    }
}

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    authToken = null;
    localStorage.removeItem('deafauth_token');
    document.getElementById('profile-content').innerHTML = '<p class="muted">You have been logged out.</p>';
    document.getElementById('logout-btn').style.display = 'none';
    
    // Switch to home tab
    document.querySelector('[data-tab="home"]').click();
});

// Check if already logged in on page load
if (authToken) {
    loadProfile();
}
