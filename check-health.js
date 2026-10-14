#!/usr/bin/env node

/**
 * AgriMart Health Check Script
 * Diagnoses common issues and provides fixes
 */

const https = require('https');
const http = require('http');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}━━━ ${msg} ━━━${colors.reset}\n`),
};

// Read environment variables
function loadEnv(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });
    return env;
  } catch (err) {
    return null;
  }
}

// Check DNS resolution
function checkDNS(hostname) {
  return new Promise((resolve) => {
    dns.resolve4(hostname, (err, addresses) => {
      if (err) {
        resolve({ success: false, error: err.message });
      } else {
        resolve({ success: true, addresses });
      }
    });
  });
}

// Check HTTPS connectivity
function checkHTTPS(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 5000 }, (res) => {
      resolve({ success: true, statusCode: res.statusCode });
    });
    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Request timeout' });
    });
  });
}

// Check HTTP connectivity (backend)
function checkHTTP(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ success: true, statusCode: res.statusCode, data });
      });
    });
    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Backend not running' });
    });
  });
}

async function runHealthCheck() {
  console.log(`
${colors.cyan}╔═══════════════════════════════════════╗
║   AgriMart Health Check & Diagnostics ║
╚═══════════════════════════════════════╝${colors.reset}
`);

  // 1. Check Frontend Environment
  log.section('Frontend Environment');
  const frontendEnv = loadEnv(path.join(__dirname, 'frontend', '.env'));
  
  if (!frontendEnv) {
    log.error('frontend/.env file not found');
    log.info('Create it with: cp .env.example frontend/.env');
  } else {
    log.success('frontend/.env exists');
    
    if (frontendEnv.VITE_SUPABASE_URL) {
      log.success(`Supabase URL: ${frontendEnv.VITE_SUPABASE_URL}`);
    } else {
      log.error('VITE_SUPABASE_URL not set');
    }
    
    if (frontendEnv.VITE_SUPABASE_ANON_KEY) {
      log.success(`Supabase Key: ${frontendEnv.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...`);
    } else {
      log.error('VITE_SUPABASE_ANON_KEY not set');
    }
    
    if (frontendEnv.VITE_API_URL) {
      log.success(`API URL: ${frontendEnv.VITE_API_URL}`);
    } else {
      log.warn('VITE_API_URL not set (using default)');
    }
  }

  // 2. Check Backend Environment
  log.section('Backend Environment');
  const backendEnv = loadEnv(path.join(__dirname, 'backend', '.env'));
  
  if (!backendEnv) {
    log.warn('backend/.env file not found');
    log.info('Backend features (AI, voice) will not work');
  } else {
    log.success('backend/.env exists');
    
    const requiredKeys = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'GEMINI_API_KEY',
      'RAZORPAY_KEY_ID'
    ];
    
    requiredKeys.forEach(key => {
      if (backendEnv[key]) {
        log.success(`${key} is set`);
      } else {
        log.warn(`${key} is missing`);
      }
    });
  }

  // 3. Check DNS Resolution
  if (frontendEnv?.VITE_SUPABASE_URL) {
    log.section('DNS Resolution');
    const url = new URL(frontendEnv.VITE_SUPABASE_URL);
    const hostname = url.hostname;
    
    log.info(`Resolving ${hostname}...`);
    const dnsResult = await checkDNS(hostname);
    
    if (dnsResult.success) {
      log.success(`DNS resolved to: ${dnsResult.addresses.join(', ')}`);
    } else {
      log.error(`DNS resolution failed: ${dnsResult.error}`);
      log.warn('Possible fixes:');
      log.info('  1. Flush DNS cache: ipconfig /flushdns (Windows)');
      log.info('  2. Change DNS to Google DNS: 8.8.8.8, 8.8.4.4');
      log.info('  3. Check if your ISP/firewall blocks Supabase');
      log.info('  4. Try using a VPN');
    }
  }

  // 4. Check Supabase Connectivity
  if (frontendEnv?.VITE_SUPABASE_URL) {
    log.section('Supabase Connectivity');
    log.info('Testing connection...');
    
    const supabaseResult = await checkHTTPS(frontendEnv.VITE_SUPABASE_URL);
    
    if (supabaseResult.success) {
      log.success(`Supabase reachable (Status: ${supabaseResult.statusCode})`);
    } else {
      log.error(`Cannot reach Supabase: ${supabaseResult.error}`);
      log.warn('App will use offline fallback mode');
    }
  }

  // 5. Check Backend API
  log.section('Backend API');
  const apiUrl = frontendEnv?.VITE_API_URL || 'http://localhost:8000';
  log.info(`Testing ${apiUrl}/health...`);
  
  const backendResult = await checkHTTP(`${apiUrl}/health`);
  
  if (backendResult.success) {
    log.success(`Backend is running (Status: ${backendResult.statusCode})`);
    try {
      const health = JSON.parse(backendResult.data);
      log.success(`Health: ${JSON.stringify(health)}`);
    } catch (e) {
      log.success('Backend responded');
    }
  } else {
    log.warn(`Backend not accessible: ${backendResult.error}`);
    log.info('Start backend with: cd backend && python -m uvicorn app.main:app --reload');
    log.info('Voice features (KisanVani, Crop Doctor) will not work');
  }

  // 6. Check Node Modules
  log.section('Dependencies');
  const frontendNodeModules = fs.existsSync(path.join(__dirname, 'frontend', 'node_modules'));
  const backendVenv = fs.existsSync(path.join(__dirname, 'backend', 'venv'));
  
  if (frontendNodeModules) {
    log.success('Frontend node_modules installed');
  } else {
    log.error('Frontend dependencies missing');
    log.info('Run: cd frontend && npm install');
  }
  
  if (backendVenv) {
    log.success('Backend virtual environment exists');
  } else {
    log.warn('Backend venv not found');
    log.info('Run: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt');
  }

  // 7. Summary & Recommendations
  log.section('Summary');
  
  let issues = 0;
  let warnings = 0;
  
  if (!frontendEnv) issues++;
  if (!backendEnv) warnings++;
  if (frontendEnv && !frontendEnv.VITE_SUPABASE_URL) issues++;
  if (!frontendNodeModules) issues++;
  
  if (issues === 0 && warnings === 0) {
    log.success('All checks passed! Your AgriMart setup looks good. 🎉');
    console.log('\nStart the app with:');
    console.log(`  ${colors.cyan}cd frontend && npm run dev${colors.reset}`);
  } else {
    if (issues > 0) {
      log.error(`Found ${issues} critical issue(s)`);
    }
    if (warnings > 0) {
      log.warn(`Found ${warnings} warning(s)`);
    }
    console.log(`\nSee TROUBLESHOOTING.md for detailed solutions`);
  }
  
  console.log('');
}

// Run the health check
runHealthCheck().catch(err => {
  log.error(`Health check failed: ${err.message}`);
  process.exit(1);
});
