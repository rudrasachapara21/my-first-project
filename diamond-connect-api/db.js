const { Pool } = require('pg');

// Enforce that the DATABASE_URL is set.
// This prevents the app from starting with a misconfigured database connection.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// Configuration for the database connection pool.
const config = {
  connectionString: process.env.DATABASE_URL,
};

// In a production environment, it's a best practice to require SSL connections.
// Many database providers (like Heroku, AWS RDS) require this.
if (process.env.NODE_ENV === 'production') {
  config.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(config);

// --- DIAGNOSTIC LOG ---
console.log('--- DATABASE CONNECTION CHECK ---');
// Avoid logging the full connection string in production for security.
if (process.env.NODE_ENV !== 'production') {
    console.log(`Connecting with URL: ${config.connectionString}`);
} else {
    console.log('Connecting to the production database with SSL.');
}
console.log('-----------------------------');


// Listener for errors on idle clients in the pool.
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // It's recommended to exit the process so a process manager can restart it.
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
// This ensures that when your application is shutting down,
// it will close the database connections gracefully.
const gracefulShutdown = () => {
  console.log('Shutting down gracefully...');
  pool.end().then(() => {
    console.log('PostgreSQL pool has been closed.');
    process.exit(0);
  });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);