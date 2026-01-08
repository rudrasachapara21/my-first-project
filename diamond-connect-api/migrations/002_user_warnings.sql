-- Create user_warnings table for tracking admin warnings
CREATE TABLE IF NOT EXISTS user_warnings (
    warning_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    warning_text TEXT NOT NULL,
    warned_by INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_warnings_user_id ON user_warnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_warnings_created_at ON user_warnings(created_at DESC);
