const nodemailer = require('nodemailer');
const fetch = require('node-fetch');

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER,
  SMTP_PASS,
  OTP_FROM_NAME,
  MAIL_HTTP_ENABLED,
  MAIL_HTTP_ENDPOINT,
} = process.env;

const FROM_NAME = OTP_FROM_NAME || 'Diamond Connect';
const FROM_EMAIL = SMTP_USER || 'no-reply@example.com';

// ✅ FIXED PRODUCTION LOGIN LINK FOR ALL ENVIRONMENTS
const LOGIN_URL = 'https://diamond-connect-frontend.onrender.com/login#/login';

// Design Constants
const BRAND_COLOR = '#1e293b'; 
const ACCENT_COLOR = '#4f46e5'; 
const SUCCESS_COLOR = '#10b981'; 
const DANGER_COLOR = '#ef4444'; 
const BG_COLOR = '#f8fafc';

let smtpTransport = null;
let smtpReady = false;
let smtpVerificationPromise = null;

/* ===============================
   SMTP TRANSPORT (BEST EFFORT)
================================ */
function createSmtpTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log('[Mail] SMTP credentials missing. Using HTTP fallback mode.');
    return null;
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 465),
    secure: (SMTP_SECURE || 'true') === 'true',
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    connectionTimeout: 10000, 
    socketTimeout: 10000,
  });
}

smtpTransport = createSmtpTransport();

if (smtpTransport) {
  smtpVerificationPromise = smtpTransport.verify()
    .then(() => {
      smtpReady = true;
      console.log('[Mail] SMTP transport verified');
      return true;
    })
    .catch(err => {
      smtpReady = false;
      console.warn('[Mail] SMTP verify failed:', err.message);
      return false;
    });
}

/* ===============================
   HTTP MAILER (RENDER SAFE)
================================ */
async function sendViaHttp({ to, subject, text, html }) {
  if (MAIL_HTTP_ENABLED !== 'true' || !MAIL_HTTP_ENDPOINT) {
    throw new Error('HTTP mailer not enabled or endpoint missing');
  }

  console.log('[Mail] Attempting HTTP send to:', to);

  const res = await fetch(MAIL_HTTP_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, text, html }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(data.error || 'HTTP mail failed');
  }

  console.log('[Mail] HTTP mail successfully sent to:', to);
}

/* ===============================
   UNIFIED SEND
================================ */
async function sendMail({ to, subject, text, html }) {
  if (smtpTransport) {
    try {
      const isVerified = await smtpVerificationPromise;
      if (isVerified) {
        await smtpTransport.sendMail({
          from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
          to,
          subject,
          text,
          html,
        });
        console.log('[Mail] SMTP mail successfully sent to:', to);
        return; 
      }
    } catch (err) {
      console.warn('[Mail] SMTP send failed, falling back to HTTP:', err.message);
    }
  }

  try {
    await sendViaHttp({ to, subject, text, html });
  } catch (httpErr) {
    console.error('[Mail] Critical: All mail delivery methods failed:', httpErr.message);
    throw httpErr; 
  }
}

/* ===============================
   TEMPLATE WRAPPER
================================ */
const wrapTemplate = (content) => `
  <div style="background-color: ${BG_COLOR}; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0;">
    <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
      <tr>
        <td align="center" style="padding: 30px 0; background-color: ${BRAND_COLOR};">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 2px; font-weight: bold;">DIAMOND CONNECT</h1>
        </td>
      </tr>
      <tr>
        <td style="padding: 40px 30px;">
          ${content}
        </td>
      </tr>
      <tr>
        <td style="padding: 20px 30px; background-color: #f1f5f9; text-align: center; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">&copy; 2026 Diamond Connect. All rights reserved.</p>
          <p style="margin: 5px 0 0;">This is an automated security notification.</p>
        </td>
      </tr>
    </table>
  </div>
`;

/* ===============================
   PUBLIC FUNCTIONS
================================ */
async function sendOtpEmail({ to, code, expiresInMinutes = 10, name }) {
  const subject = 'Your Verification Code';
  const text = `Hello ${name || ''}, Your OTP is: ${code}. It expires in ${expiresInMinutes} minutes.`;

  const html = wrapTemplate(`
    <h2 style="color: ${BRAND_COLOR}; margin-top: 0; font-size: 22px;">Verify Your Identity</h2>
    <p style="color: #334155; font-size: 16px;">Hello ${name || 'User'},</p>
    <p style="color: #334155; font-size: 16px;">Please use the following One-Time Password (OTP) to complete your registration:</p>
    <div style="background-color: #f1f5f9; border-radius: 8px; padding: 25px; text-align: center; margin: 25px 0; border: 1px solid #e2e8f0;">
      <span style="font-size: 36px; font-weight: bold; letter-spacing: 10px; color: ${ACCENT_COLOR};">${code}</span>
    </div>
    <p style="color: #64748b; font-size: 14px;">This code is valid for <b style="color: ${BRAND_COLOR};">${expiresInMinutes} minutes</b>. If you did not request this, please ignore this email.</p>
  `);

  await sendMail({ to, subject, text, html });
}

async function sendApprovalEmail({ to, name }) {
  const subject = 'Account Approved - Welcome to Diamond Connect';
  const text = `Hi ${name || ''}, Your account has been approved. You can now sign in.`;

  const html = wrapTemplate(`
    <h2 style="color: ${SUCCESS_COLOR}; margin-top: 0; font-size: 22px;">Welcome Aboard!</h2>
    <p style="color: #334155; font-size: 16px;">Hi ${name || 'User'},</p>
    <p style="color: #334155; font-size: 16px;">We are pleased to inform you that your account has been <b>successfully approved</b> by our administrative team.</p>
    <div style="margin: 35px 0; text-align: center;">
      <a href="${LOGIN_URL}" style="background-color: ${ACCENT_COLOR}; color: #ffffff; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);">Login to Your Workspace</a>
    </div>
    <p style="color: #334155; font-size: 16px;">You can now post listings, view demands, and start trading on the platform. Welcome to the community!</p>
  `);

  await sendMail({ to, subject, text, html });
}

async function sendRejectionEmail({ to, name }) {
  const subject = 'Registration Status Update';
  const text = `Hi ${name || ''}, Your registration for Diamond Connect was not approved.`;

  const html = wrapTemplate(`
    <h2 style="color: ${DANGER_COLOR}; margin-top: 0; font-size: 22px;">Application Update</h2>
    <p style="color: #334155; font-size: 16px;">Hi ${name || 'User'},</p>
    <p style="color: #334155; font-size: 16px;">Thank you for your interest in Diamond Connect. After reviewing your application, we regret to inform you that we cannot approve your account at this time.</p>
    <p style="color: #334155; font-size: 16px;">This decision is usually based on incomplete documentation or verification discrepancies.</p>
    <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
    <p style="color: #64748b; font-size: 14px;">If you have any questions or would like to re-apply with more information, please contact our support team.</p>
  `);

  await sendMail({ to, subject, text, html });
}

module.exports = {
  sendOtpEmail,
  sendApprovalEmail,
  sendRejectionEmail,
};