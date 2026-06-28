const { query } = require('./db.js');

async function setupDatabase() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run setupDatabase in production. Use migrations instead.');
  }

  const setupQuery = `
    -- Dev-only: create schema if missing (non-destructive for safety)
    -- For durable schema changes, run migrations in production using node-pg-migrate.
    CREATE TYPE IF NOT EXISTS public.user_role AS ENUM ('trader', 'broker', 'admin');

    CREATE TABLE IF NOT EXISTS public.users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role public.user_role NOT NULL,
        full_name VARCHAR(255),
        gst_number VARCHAR(100),
        office_address TEXT,
        phone_number VARCHAR(50),
        office_name VARCHAR(255),
        profile_photo_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        reputation_points INTEGER NOT NULL DEFAULT 0,
        office_hours VARCHAR(255),
        is_suspended BOOLEAN DEFAULT FALSE,
        is_verified BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE
    );

    -- Create other tables only if they do not exist (safe to run multiple times in dev)
    CREATE TABLE IF NOT EXISTS public.demands (
        demand_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES public.users(user_id) ON DELETE CASCADE,
        diamond_details JSONB NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        hired_broker_id INTEGER REFERENCES public.users(user_id),
        final_price NUMERIC(12,2),
        final_weight NUMERIC(12,4),
        broker_review TEXT,
        is_on_memo BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS public.listings (
        listing_id SERIAL PRIMARY KEY,
        trader_id INTEGER REFERENCES public.users(user_id) ON DELETE CASCADE,
        diamond_details JSONB NOT NULL,
        certificate_url TEXT,
        price NUMERIC(12, 2),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        image_urls TEXT[]
    );

    CREATE TABLE IF NOT EXISTS public.demand_interests (
        interest_id SERIAL PRIMARY KEY,
        demand_id INTEGER REFERENCES public.demands(demand_id) ON DELETE CASCADE,
        broker_id INTEGER REFERENCES public.users(user_id) ON DELETE CASCADE,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(demand_id, broker_id)
    );

    CREATE TABLE IF NOT EXISTS public.offers (
        offer_id SERIAL PRIMARY KEY,
        demand_id INTEGER NOT NULL REFERENCES public.demands(demand_id) ON DELETE CASCADE,
        broker_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        price_per_carat NUMERIC(12, 2) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.news (
        news_id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES public.users(user_id),
        title VARCHAR(255) NOT NULL,
        content TEXT,
        image_url TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.conversations (
        conversation_id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_message_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS public.conversation_participants (
        participant_id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(conversation_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS public.messages (
        message_id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES public.conversations(conversation_id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        sent_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS public.notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        message VARCHAR(255) NOT NULL,
        link_url VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.support_queries (
        query_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(user_id),
        query_text TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'submitted',
        submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS public.watchlist (
        watchlist_id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
        listing_id INTEGER NOT NULL REFERENCES public.listings(listing_id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, listing_id)
    );
  `;

  try {
    console.log('Attempting to set up database tables...');
    await query(setupQuery);
    console.log('Database setup complete!');
  } catch (err) {
    console.error('Error during database setup:', err);
    throw err;
  }
}

module.exports = { setupDatabase };