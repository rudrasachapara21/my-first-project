const { Pool } = require('pg');

// Enforce that the DATABASE_URL is set.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Configuration for the database connection pool.
const config = {
  connectionString: process.env.DATABASE_URL,
};

// ## --- THIS IS THE FIX --- ##
// Instead of checking NODE_ENV, we check if the URL is a Supabase URL.
// Supabase requires SSL.
if (process.env.DATABASE_URL.includes('supabase.co')) {
  config.ssl = {
    rejectUnauthorized: false,
  };
}
// ## --- END OF FIX --- ##

const pool = new Pool(config);

// --- DIAGNOSTIC LOG ---
console.log('--- DATABASE CONNECTION CHECK ---');
if (process.env.DATABASE_URL.includes('supabase.co')) {
    console.log('Connecting to Supabase with SSL.');
} else {
    console.log(`Connecting with URL: ${config.connectionString}`);
}
console.log('-----------------------------');


// Listener for errors on idle clients in the pool.
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

module.exports = {
  /**
   * Executes a query on the database pool.
   * @param {string} text - The SQL query string.
   * @param {Array} params - The parameters for the query.
   * @returns {Promise<QueryResult>} A promise that resolves with the query results.
   */
  query: (text, params) => pool.query(text, params),

  /**
   * Checks out a client from the pool for running transactions.
   * @returns {Promise<PoolClient>} A promise that resolves with a client.
   * Remember to call client.release() when you are done!
   */
  connect: () => pool.connect(),

  // Export the pool itself for more advanced use cases if needed.
  pool,
};

// --- GRACEFUL SHUTDOWN ---
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  pool.end().then(() => {
    console.log('PostgreSQL pool has been closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);