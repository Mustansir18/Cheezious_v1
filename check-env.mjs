// @ts-check
import dotenv from 'dotenv';
import sql from 'mssql';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(color, message) {
  console.log(`${color}%s${colors.reset}`, message);
}

async function checkConnectivity() {
  log(colors.cyan, '🚀 Starting Cheezious Kiosk Environment & Connectivity Check...');
  dotenv.config();

  let hasError = false;

  // 1. Check for Environment Variables
  log(colors.yellow, '\n[1/2] Checking for database credentials...');
  const requiredVars = ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_NAME', 'DB_PORT'];
  const missingVars = requiredVars.filter(v => !process.env[v]);

  if (missingVars.length > 0) {
    log(colors.red, `   ❌ ERROR: Missing required environment variables in .env file: ${missingVars.join(', ')}`);
    hasError = true;
  } else {
    log(colors.green, '   ✅ SUCCESS: All database credentials are present in .env file.');
  }

  // 2. Check Database Connection
  log(colors.yellow, '\n[2/2] Checking database connectivity...');
  if (!hasError) {
    const dbConfig = {
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 1433,
      options: {
        encrypt: process.env.NODE_ENV === 'production',
        trustServerCertificate: true,
      },
       pool: {
        max: 1 // We only need one connection for this check
      },
      connectionTimeout: 5000 // 5 seconds
    };

    try {
      const pool = await sql.connect(dbConfig);
      log(colors.green, `   ✅ SUCCESS: Connected to database "${dbConfig.database}" on "${dbConfig.server}".`);
      await pool.close();
    } catch (err) {
      log(colors.red, '   ❌ ERROR: Failed to connect to the database.');
      console.error(err);
      hasError = true;
    }
  } else {
      log(colors.red, '   Skipped due to missing credentials.');
  }

  // Final Result
  if (hasError) {
    log(colors.red, '\nEnvironment check failed. Please fix the errors above before starting the application.');
    process.exit(1); // Exit with an error code
  } else {
    log(colors.green, '\n✨ All checks passed! Starting application...');
  }
}

checkConnectivity();
