// ====================================================================
// 📱 DISPATCH NOTIFIER SERVICE (SMS / EMAIL INTEGRATION)
// ====================================================================
// Real-world production integration for Twilio, Fast2SMS, or SMTP.
// 🛡️ PRODUCTION SAFETY RULE: NEVER report success: true unless SMS/Email
// was actually dispatched by a confirmed external carrier/gateway.

import net from 'net';
import tls from 'tls';

export async function sendSmsNotification({ toPhone, message, priority: _priority = 'NORMAL' }) {
  const smsApiKey = process.env.SMS_API_KEY;
  const smsProvider = (process.env.SMS_PROVIDER || 'FAST2SMS').toUpperCase(); // 'TWILIO' | 'FAST2SMS'

  if (!toPhone) {
    return { success: false, delivered: false, error: 'No recipient phone number provided.' };
  }

  // 1. Live Twilio SMS Integration
  if (smsProvider === 'TWILIO') {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.warn(`⚠️ [SMS GATEWAY]: Twilio requested but TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN missing.`);
      return {
        success: false,
        delivered: false,
        provider: 'TWILIO',
        error: 'Twilio credentials not configured in environment (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN missing).'
      };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      const params = new URLSearchParams();
      params.append('To', toPhone);
      params.append('From', process.env.TWILIO_PHONE_NUMBER || '');
      params.append('Body', message);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });
      const data = await res.json();
      if (res.ok && data.sid) {
        return { success: true, delivered: true, provider: 'TWILIO', sid: data.sid };
      }
      return {
        success: false,
        delivered: false,
        provider: 'TWILIO',
        error: data.message || `Twilio HTTP error ${res.status}`
      };
    } catch (err) {
      console.error('Twilio SMS delivery failed:', err.message);
      return { success: false, delivered: false, error: err.message };
    }
  }

  // 2. Live Fast2SMS Integration (India Standard SMS Route)
  if (smsProvider === 'FAST2SMS') {
    if (!smsApiKey || smsApiKey === 'your_sms_api_key_here') {
      console.warn(`⚠️ [SMS GATEWAY]: Fast2SMS requested but SMS_API_KEY is not configured.`);
      return {
        success: false,
        delivered: false,
        provider: 'FAST2SMS',
        error: 'Carrier SMS provider not configured in environment: SMS_API_KEY missing.'
      };
    }

    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': smsApiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: 'v3',
          sender_id: 'TXTIND',
          message,
          language: 'english',
          flash: 0,
          numbers: toPhone
        })
      });
      const data = await res.json();
      const isOk = res.ok && (data.return === true || data.status_code === 200);
      if (isOk) {
        return { success: true, delivered: true, provider: 'FAST2SMS', details: data };
      }
      return {
        success: false,
        delivered: false,
        provider: 'FAST2SMS',
        error: (data && data.message) ? (Array.isArray(data.message) ? data.message.join(', ') : data.message) : `Fast2SMS error code ${res.status}`
      };
    } catch (err) {
      console.error('Fast2SMS delivery failed:', err.message);
      return { success: false, delivered: false, error: err.message };
    }
  }

  // 3. Unconfigured fallback: NEVER report success = true
  console.warn(`⚠️ [SMS GATEWAY]: No valid carrier provider configured. Dispatch skipped.`);
  return {
    success: false,
    delivered: false,
    provider: 'UNCONFIGURED',
    error: 'SMS carrier dispatch skipped: No valid provider configured in environment.'
  };
}

// ✉️ Real SMTP Dispatch Engine (Native TLS/Net Socket Dialog)
function executeSmtpTransaction({ host, port, secure, user, pass, from, to, subject, text, html }) {
  return new Promise((resolve, reject) => {
    let socket;
    let step = 0;
    let buffer = '';
    const timeout = 12000;

    const fromAddress = from || user;
    const boundary = `----CommunityBrainBoundary_${Date.now()}`;
    const mailBody = html ? (
      `Content-Type: multipart/alternative; boundary="${boundary}"\r\n\r\n` +
      `--${boundary}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${text || ''}\r\n\r\n` +
      `--${boundary}\r\nContent-Type: text/html; charset=utf-8\r\n\r\n${html}\r\n\r\n` +
      `--${boundary}--\r\n`
    ) : (
      `Content-Type: text/plain; charset=utf-8\r\n\r\n${text || ''}\r\n`
    );

    const fullMessage = [
      `From: <${fromAddress}>`,
      `To: <${to}>`,
      `Subject: ${subject}`,
      `Date: ${new Date().toUTCString()}`,
      `MIME-Version: 1.0`,
      mailBody,
      '.'
    ].join('\r\n') + '\r\n';

    const connectOpts = { host, port };

    const onConnect = () => {
      // Waiting for greeting 220
    };

    try {
      if (secure) {
        socket = tls.connect(connectOpts, onConnect);
      } else {
        socket = net.connect(connectOpts, onConnect);
      }
    } catch (err) {
      return reject(err);
    }

    socket.setTimeout(timeout);
    socket.setEncoding('utf8');

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`SMTP connection timeout after ${timeout}ms`));
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('data', (chunk) => {
      buffer += chunk;
      const lines = buffer.split('\r\n');
      buffer = lines.pop(); // keep remainder

      for (const line of lines) {
        if (!line) continue;
        const code = parseInt(line.substring(0, 3), 10);
        const isMultiLine = line.charAt(3) === '-';
        if (isMultiLine) continue;

        if (code >= 400) {
          socket.write('QUIT\r\n');
          socket.end();
          return reject(new Error(`SMTP server rejected command: [${code}] ${line}`));
        }

        switch (step) {
          case 0: // Greeting received (220)
            if (code === 220) {
              step = 1;
              socket.write(`EHLO ${host}\r\n`);
            }
            break;
          case 1: // EHLO response (250)
            if (code === 250) {
              if (user && pass) {
                step = 2;
                socket.write('AUTH LOGIN\r\n');
              } else {
                step = 5;
                socket.write(`MAIL FROM:<${fromAddress}>\r\n`);
              }
            }
            break;
          case 2: // Prompt for Username (334)
            if (code === 334) {
              step = 3;
              socket.write(Buffer.from(user).toString('base64') + '\r\n');
            }
            break;
          case 3: // Prompt for Password (334)
            if (code === 334) {
              step = 4;
              socket.write(Buffer.from(pass).toString('base64') + '\r\n');
            }
            break;
          case 4: // Auth success (235)
            if (code === 235) {
              step = 5;
              socket.write(`MAIL FROM:<${fromAddress}>\r\n`);
            }
            break;
          case 5: // MAIL FROM accepted (250)
            if (code === 250) {
              step = 6;
              socket.write(`RCPT TO:<${to}>\r\n`);
            }
            break;
          case 6: // RCPT TO accepted (250)
            if (code === 250) {
              step = 7;
              socket.write('DATA\r\n');
            }
            break;
          case 7: // DATA prompt (354)
            if (code === 354) {
              step = 8;
              socket.write(fullMessage);
            }
            break;
          case 8: // Message accepted for delivery (250)
            if (code === 250) {
              step = 9;
              socket.write('QUIT\r\n');
              resolve({ delivered: true, response: line });
            }
            break;
          case 9: // QUIT accepted (221)
            socket.end();
            break;
        }
      }
    });
  });
}

export async function sendEmailNotification({ toEmail, subject, text, html }) {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

  if (!toEmail) {
    return { success: false, delivered: false, error: 'No recipient email provided.' };
  }

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const result = await executeSmtpTransaction({
        host: smtpHost,
        port: smtpPort,
        secure: isSecure,
        user: smtpUser,
        pass: smtpPass,
        from: smtpFrom,
        to: toEmail,
        subject: subject || 'Community Alert',
        text,
        html
      });
      return { success: true, delivered: true, provider: 'SMTP', details: result };
    } catch (err) {
      console.error(`❌ [SMTP GATEWAY]: Failed to dispatch email to ${toEmail}:`, err.message);
      return { success: false, delivered: false, provider: 'SMTP', error: err.message };
    }
  }

  console.warn(`✉️ [EMAIL NOTIFIER]: Notice to ${toEmail} skipped: SMTP credentials missing in environment.`);
  return {
    success: false,
    delivered: false,
    provider: 'UNCONFIGURED',
    error: 'Email dispatch skipped: SMTP credentials not configured in environment.'
  };
}
