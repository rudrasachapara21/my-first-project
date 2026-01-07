const db = require('../db');
const { sendOtpEmail } = require('../services/emailService');

function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

async function upsertOtp({ email, purpose = 'register', code, expiresInMinutes = 10 }) {
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  // Upsert OTP: ensure only one active OTP per email+purpose
  const upsertQuery = `
    INSERT INTO user_otps (email, otp_code, purpose, expires_at)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (email, purpose)
    DO UPDATE SET otp_code = EXCLUDED.otp_code, expires_at = EXCLUDED.expires_at, created_at = NOW()
  `;
  await db.query(upsertQuery, [email, code, purpose, expiresAt]);
}

async function verifyOtp({ email, purpose = 'register', code }) {
  const sel = `SELECT id, expires_at FROM user_otps WHERE email = $1 AND purpose = $2 AND otp_code = $3`;
  const { rows } = await db.query(sel, [email, purpose, code]);
  if (rows.length === 0) return { ok: false, reason: 'invalid' };
  const rec = rows[0];
  if (new Date(rec.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  await db.query('DELETE FROM user_otps WHERE id = $1', [rec.id]);
  return { ok: true };
}

// POST /api/auth/verify-otp
exports.verifyRegistrationOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    const result = await verifyOtp({ email, code: String(otp), purpose: 'register' });
    if (!result.ok) {
      const msg = result.reason === 'expired' ? 'OTP has expired. Please request a new one.' : 'Invalid OTP.';
      return res.status(400).json({ message: msg });
    }

    // Mark user email as verified
    await db.query('UPDATE users SET email_verified = TRUE WHERE email = $1', [email]);

    return res.status(200).json({ message: 'Email verified successfully. Awaiting admin approval.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-otp
exports.resendRegistrationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    // Ensure the user exists and is not already verified
    const { rows } = await db.query('SELECT full_name, email_verified FROM users WHERE email = $1', [email]);
    if (rows.length === 0) return res.status(404).json({ message: 'No user found with this email.' });
    if (rows[0].email_verified) return res.status(400).json({ message: 'Email is already verified.' });

    await exports.sendRegistrationOtp({ email, name: rows[0].full_name });
    return res.status(200).json({ message: 'OTP resent successfully.' });
  } catch (err) {
    next(err);
  }
};

// Helper to be called from register flow
exports.sendRegistrationOtp = async ({ email, name }) => {
  const code = generateOtp(6);
  await upsertOtp({ email, code, purpose: 'register', expiresInMinutes: 10 });
  await sendOtpEmail({ to: email, code, expiresInMinutes: 10, name });
};
