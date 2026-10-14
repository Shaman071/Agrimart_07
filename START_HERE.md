# 🚀 Start Here - AgriMart Quick Launch Guide

## ⚡ 3-Minute Setup

### Step 1: Check Your System (30 seconds)
```bash
# Run health check
node check-health.js
```

**What to look for:**
- ✅ All green checkmarks = You're ready!
- ⚠️ Yellow warnings = App will work, some features disabled
- ❌ Red errors = Follow the fix suggestions shown

---

### Step 2: Start the Application (1 minute)

#### Option A: Frontend Only (Recommended for Testing)
```bash
cd frontend
npm install  # First time only
npm run dev
```
Then open: **http://localhost:5173**

#### Option B: Full Stack (All Features)
```bash
# Terminal 1: Backend
cd backend
python -m venv venv  # First time only
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt  # First time only
python -m uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm install  # First time only
npm run dev
```
- Frontend: **http://localhost:5173**
- Backend: **http://localhost:8000**

---

### Step 3: Test the App (1 minute)

1. **Login/Register**
   - Email: anything@example.com
   - Password: test123
   - Role: Farmer

2. **Check Dashboard**
   - Should show "Dashboard" (not "farmer.dashboard.title")
   - Should load within 5 seconds
   - If slow: amber warning banner will appear

3. **Test Voice Feature**
   - Click "KisanVani Voice" in sidebar
   - Click microphone button
   - Speak: "I have 500 kg tomato at 28 rupees"
   - Or click sample button for instant test

---

## 🆘 Quick Troubleshooting

### Problem: ERR_NAME_NOT_RESOLVED
```bash
# Windows
ipconfig /flushdns

# Mac/Linux
sudo dscacheutil -flushcache
```

### Problem: "farmer.dashboard" showing
```bash
# Pull latest code
git pull origin main

# Verify the fix
grep "Dashboard" frontend/src/components/FarmerLayout.jsx
# Should show: label: 'Dashboard'
```

### Problem: Stuck loading
- Wait 5 seconds - app will auto-fallback to demo data
- Look for amber warning banner
- App is designed to work offline

### Problem: Voice not working
- Use Chrome or Edge (required)
- Allow microphone permissions
- Use text input as fallback
- Or click sample prompt buttons

---

## 📂 Project Structure (Quick Reference)

```
agrimart/
├── frontend/               # React app
│   ├── src/pages/farmer/  # Farmer pages
│   ├── src/pages/buyer/   # Buyer pages
│   └── .env               # Frontend config
│
├── backend/               # Python API
│   └── .env              # Backend config
│
├── check-health.js        # 🆕 Run this first!
├── TROUBLESHOOTING.md    # 🆕 Detailed fixes
├── FIXES_APPLIED.md      # 🆕 What was fixed
└── START_HERE.md         # 🆕 This file
```

---

## 🎯 User Roles to Test

### 1. Farmer (Recommended First)
- **Features:** Voice listing, crop doctor, inventory, orders
- **Login:** farmer@test.com / test123

### 2. Buyer
- **Features:** Browse market, cart, group buying, orders
- **Login:** buyer@test.com / test123

### 3. Admin
- **Features:** Metrics, verification, escrow, disputes
- **Login:** admin@test.com / test123

---

## ✅ Features to Try

### Must-Try Features:
1. **KisanVani Voice** - Voice-based crop listing
2. **AgriGemini AI** - Floating AI assistant (bottom right)
3. **Crop Doctor** - Upload crop photo for diagnosis
4. **Live Marketplace** - Browse and filter crops
5. **Group Buying** - Join bulk orders for discounts

### Works Offline:
- Dashboard
- Inventory Manager
- Profile
- Marketplace (cached data)

### Requires Backend:
- Voice transcription
- Crop doctor AI
- Demand forecasting
- Real-time data sync

---

## 🔧 Environment Variables

### Required (Frontend)
```bash
# frontend/.env
VITE_SUPABASE_URL=https://vdbnuswvhbbuitkkbfwo.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:8000
```

### Optional (Backend - for AI features)
```bash
# backend/.env
GEMINI_API_KEY=your_key_here
ROBOFLOW_API_KEY=your_key_here
RAZORPAY_KEY_ID=your_key_here
```

**Note:** App works without backend - uses fallback data

---

## 📊 Health Check Output Explained

```bash
✅ Frontend .env exists           # Good - config loaded
✅ Supabase URL: https://...      # Good - database configured
✅ DNS resolved to: 1.2.3.4       # Good - can reach Supabase
✅ Supabase reachable             # Good - connection OK
⚠️  Backend not accessible        # OK - app works without it
✅ Frontend node_modules installed # Good - dependencies OK
```

**All ✅ = Perfect!**  
**Some ⚠️ = Still works, limited features**  
**Any ❌ = Follow fix suggestions**

---

## 🎉 Success Checklist

After starting the app, verify:

- [ ] Dashboard loads within 5 seconds
- [ ] Navigation shows "Dashboard" not "farmer.dashboard.title"
- [ ] Can create crop listing
- [ ] Can browse marketplace
- [ ] Voice button appears (may need Chrome/Edge)
- [ ] AgriGemini AI button visible (bottom right)

If all checked: **You're ready to develop/demo!** 🚀

---

## 🚨 Emergency Mode

If nothing works:

1. **Check health:**
   ```bash
   node check-health.js
   ```

2. **Reset everything:**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run dev
   ```

3. **Use offline mode:**
   - Disconnect internet
   - App will auto-use demo data
   - Perfect for demos/testing

---

## 📞 Get Help

1. **Check:** `TROUBLESHOOTING.md` (comprehensive guide)
2. **Check:** `FIXES_APPLIED.md` (what was fixed)
3. **Run:** `node check-health.js` (diagnose issues)
4. **GitHub Issues:** Open with diagnostic output

---

## 🎯 Next Steps After Setup

1. **Explore Features:**
   - Try KisanVani voice listing
   - Chat with AgriGemini AI
   - Upload crop photo to Crop Doctor

2. **Customize:**
   - Add your branding
   - Configure your Supabase project
   - Add your API keys

3. **Deploy:**
   - Frontend: Vercel/Netlify
   - Backend: Railway/Render
   - Database: Supabase (already hosted)

---

**Happy Farming! 🌾🚀**

*Everything is fixed and working. No more stuck features or unprofessional text!*

---

Quick Links:
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [All Fixes Applied](./FIXES_APPLIED.md)
- [Main README](./README.md)
