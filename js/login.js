import { db } from './firebase-config.js';
import { authenticateUser } from './auth.js';

if(localStorage.getItem('is_msfs_admin_logged_in') === 'true') {
  window.location.href = "dashboard.html";
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  try {
    const isAuthenticated = await authenticateUser(db, username, password);
    if (isAuthenticated) {
      localStorage.setItem('is_msfs_admin_logged_in', 'true');
      localStorage.setItem('msfs_admin_username', username);
      localStorage.setItem('msfs_admin_type', "admin");
      window.location.href = "dashboard.html";
    } else {
      alert("Invalid username or password");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed. Please try again later.");
  }
});