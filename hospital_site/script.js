// script.js - Handles contact form submission via mailto link
const API_URL = "https://healthguarduganda.onrender.com";

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = encodeURIComponent(document.getElementById('name').value.trim());
    const email = encodeURIComponent(document.getElementById('email').value.trim());
    const phone = encodeURIComponent(document.getElementById('phone').value.trim());
    const message = encodeURIComponent(document.getElementById('message').value.trim());

    const subject = encodeURIComponent('Contact Form Submission');
    let body = `Name: ${name}%0D%0A`;
    body += `Email: ${email}%0D%0A`;
    if (phone) body += `Phone: ${phone}%0D%0A`;
    body += `Message:%0D%0A${message}`;
    const mailtoLink = `mailto:info@healthguarduganda.org?subject=${subject}&body=${body}`;
    // Open the user's default mail client
    window.location.href = mailtoLink;
  });
});
// Registration form handler
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      phone: document.getElementById('phone').value.trim(),
      name: document.getElementById('name').value.trim(),
      password: document.getElementById('password').value,
      role: document.getElementById('role').value,
      village: document.getElementById('village').value.trim(),
      district: document.getElementById('district').value.trim()
    };
    const msgBox = document.getElementById('register-msg');
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        msgBox.textContent = `✅ Account created (ID: ${json.userId})`;
        msgBox.style.color = 'green';
        registerForm.reset();
      } else {
        msgBox.textContent = json.error || 'Registration failed';
        msgBox.style.color = 'red';
      }
    } catch (err) {
      console.error(err);
      msgBox.textContent = 'Network error';
      msgBox.style.color = 'red';
    }
  });
}
