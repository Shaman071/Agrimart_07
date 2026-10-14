# AgriMart Troubleshooting Guide

## Common Issues & Solutions

### 1. ERR_NAME_NOT_RESOLVED (Supabase Connection)

**Problem:** Browser shows `ERR_NAME_NOT_RESOLVED` when trying to connect to Supabase.

**Symptoms:**
```
GET https://vdbnuswvhbbuitkkbfwo.supabase.co/rest/v1/... net::ERR_NAME_NOT_RESOLVED
```

**Solutions:**

#### Option A: Check DNS Settings
1. Flush DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns
   
   # Mac/Linux
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   ```

2. Try using Google DNS:
   - Go to Network Settings
   - Change DNS to: `8.8.8.8` and `8.8.4.4`

#### Option B: Check Firewall/Antivirus
- Temporarily disable antivirus/firewall
- Add exception for `*.supabase.co` domains

#### Option C: Use a VPN
- Some ISPs/networks block Supabase
- Try connecting through a VPN

#### Option D: Check Supabase Project Status
1. Go to https://status.supabase.com/
2. Verify your project is not paused
3. Check if the project URL is correct in `.env` files

#### Option E: Verify Environment Variables
```bash
# Check frontend/.env
cat frontend/.env

# Should contain:
VITE_SUPABASE_URL=https://vdbnuswvhbbuitkkbfwo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

### 2. Slow Loading / Features Stuck

**Problem:** Website takes too long to load, features appear frozen.

**Solutions:**

1. **Clear Browser Cache:**
   - Press `Ctrl+Shift+Delete` (Windows/Linux)
   - Press `Cmd+Shift+Delete` (Mac)
   - Clear cache and reload

2. **Check Network Connection:**
   ```bash
   # Test Supabase connectivity
   ping vdbnuswvhbbuitkkbfwo.supabase.co
   
   # Test API endpoint
   curl https://vdbnuswvhbbuitkkbfwo.supabase.co
   ```

3. **Use Offline Fallback Mode:**
   - The app now automatically uses cached/demo data if connection fails
   - Look for amber warning banner at top of dashboard

4. **Restart Development Server:**
   ```bash
   # Frontend
   cd frontend
   npm run dev
   
   # Backend (if needed)
   cd backend
   python -m uvicorn app.main:app --reload
   ```

### 3. Voice Assistant (KisanVani) Not Working

**Problem:** Voice recognition not capturing speech or giving default responses.

**Solutions:**

1. **Browser Permissions:**
   - Click the microphone icon in browser address bar
   - Allow microphone access
   - Refresh page

2. **Supported Browsers:**
   - ✅ Chrome (recommended)
   - ✅ Edge
   - ❌ Firefox (limited support)
   - ❌ Safari (limited support)

3. **Test Microphone:**
   - Go to Settings → Privacy → Microphone
   - Ensure browser has mic access
   - Test with another app

4. **Use Text Input Fallback:**
   - Type your query in the text box below mic button
   - Click "Parse" button

5. **Use Sample Prompts:**
   - Click the pre-written sample buttons
   - "I have 500 kg tomato at 28 rupees per kg in Bangalore"

### 4. Unprofessional "farmer.dashboard" Text

**Problem:** UI shows raw translation keys like "farmer.dashboard.title" instead of proper text.

**Status:** ✅ FIXED in latest version

**Verification:**
- Navigation should show: "Dashboard", "KisanVani Voice", "Inventory Manager"
- NOT: "farmer.dashboard.title", "farmer.kisanVani.title"

### 5. Crop Doctor AI Not Scanning

**Problem:** AI image analysis stuck or not returning results.

**Solutions:**

1. **Image Format:**
   - Use JPG or PNG only
   - Max file size: 5MB
   - Clear, well-lit photos

2. **Backend Connection:**
   ```bash
   # Check if backend is running
   curl http://localhost:8000/health
   
   # Start backend if needed
   cd backend
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. **API Keys:**
   - Verify `GEMINI_API_KEY` in `backend/.env`
   - Verify `ROBOFLOW_API_KEY` in `backend/.env`

## Performance Optimization

### For Developers

1. **Enable Production Build:**
   ```bash
   cd frontend
   npm run build
   npm run preview
   ```

2. **Check Bundle Size:**
   ```bash
   cd frontend
   npm run build -- --report
   ```

3. **Optimize Images:**
   - Use WebP format
   - Compress before upload
   - Max 800x800px for crop photos

### For Users

1. **Close Unused Tabs**
2. **Disable Browser Extensions** (test in incognito mode)
3. **Use Latest Chrome/Edge**

## Database Issues

### Cannot Insert Listings

**Problem:** "Failed to create listing" error

**Solutions:**

1. **Check Supabase Policies:**
   - Go to Supabase Dashboard
   - Table Editor → produce_listings
   - Authentication → Policies
   - Ensure INSERT policy exists for authenticated users

2. **Verify User Authentication:**
   ```javascript
   // In browser console
   const { data } = await supabase.auth.getUser()
   console.log(data)
   ```

3. **Fallback to Local Storage:**
   - App automatically saves to localStorage if DB fails
   - Data persists in browser only
   - Check browser DevTools → Application → Local Storage

## Getting Help

### Logs to Check

1. **Browser Console:**
   - Press F12
   - Go to Console tab
   - Copy any red error messages

2. **Network Tab:**
   - F12 → Network tab
   - Filter by "Fetch/XHR"
   - Check failed requests (red)
   - Copy request/response details

3. **Backend Logs:**
   ```bash
   cd backend
   tail -f logs/app.log
   ```

### Support Channels

1. **GitHub Issues:** [github.com/yourusername/agrimart/issues](https://github.com)
2. **Email:** support@agrimart.com
3. **Discord:** [discord.gg/agrimart](https://discord.gg)

### Information to Provide

When reporting issues, include:
- Browser version (Chrome 120, Firefox 121, etc.)
- Operating System (Windows 11, macOS 14, Ubuntu 22.04)
- Screenshot of error
- Browser console logs
- Steps to reproduce

## Quick Health Check

Run this in browser console:

```javascript
// Test Supabase Connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase.from('farmers').select('count', { count: 'exact', head: true })
    if (error) throw error
    console.log('✅ Supabase connected')
  } catch (err) {
    console.error('❌ Supabase error:', err.message)
  }
}
testConnection()

// Test Backend API
fetch('http://localhost:8000/health')
  .then(r => r.json())
  .then(d => console.log('✅ Backend:', d))
  .catch(e => console.error('❌ Backend:', e))

// Check Environment
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL)
console.log('API URL:', import.meta.env.VITE_API_URL)
```

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Authentication | ✅ Working | Supabase Auth |
| Dashboard | ✅ Fixed | No more translation keys |
| KisanVani Voice | ✅ Working | Chrome/Edge only |
| Crop Doctor AI | ✅ Working | Requires backend |
| Inventory Manager | ✅ Working | Local + DB sync |
| Order Management | ✅ Working | Real-time updates |
| Escrow Payments | ✅ Working | Razorpay integration |
| AgriGemini AI Chat | ✅ Working | Gemini 1.5 Flash |

Last Updated: 2026-09-17
