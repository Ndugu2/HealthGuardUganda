const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Generating a free Ethereal Email test account for you...');
  try {
    const account = await nodemailer.createTestAccount();
    console.log('\nSUCCESS! Ethereal Email account generated:');
    console.log(`Username/Email: ${account.user}`);
    console.log(`Password: ${account.pass}`);
    console.log(`SMTP Host: ${account.smtp.host}`);
    console.log(`SMTP Port: ${account.smtp.port}`);
    console.log(`Web Mail Login: https://ethereal.email/login`);
    console.log('\nWriting credentials to server/.env file...');

    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Replace SMTP keys with the new Ethereal ones
    envContent = envContent.replace(/SMTP_HOST=".*"/g, `SMTP_HOST="${account.smtp.host}"`);
    envContent = envContent.replace(/SMTP_PORT=.*/g, `SMTP_PORT=${account.smtp.port}`);
    envContent = envContent.replace(/SMTP_USER=".*"/g, `SMTP_USER="${account.user}"`);
    envContent = envContent.replace(/SMTP_PASS=".*"/g, `SMTP_PASS="${account.pass}"`);
    envContent = envContent.replace(/SMTP_FROM=".*"/g, `SMTP_FROM='"HealthGuard Uganda" <${account.user}>'`);

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('Successfully configured server/.env with your test credentials!');
    
    // Save login details to a text file for the user's reference
    const credentialsPath = path.join(__dirname, 'ethereal_credentials.txt');
    fs.writeFileSync(credentialsPath, `Ethereal Email Test Account:\n\nEmail: ${account.user}\nPassword: ${account.pass}\nLogin URL: https://ethereal.email/login\n`, 'utf8');
    console.log(`Saved credentials reference to: server/ethereal_credentials.txt`);

  } catch (error) {
    console.error('Failed to generate Ethereal account:', error);
  }
}

main();
