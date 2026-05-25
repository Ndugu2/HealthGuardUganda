// script.js - Handles contact form submission via mailto link

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
