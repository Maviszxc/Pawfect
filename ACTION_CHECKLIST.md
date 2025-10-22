# 📋 ACTION CHECKLIST - Fix Adoption Form PDF Upload

## ✅ What I've Already Done For You

- [x] Created `/frontend/src/lib/supabase.ts` (Supabase client library)
- [x] Installed `@supabase/supabase-js` package
- [x] Added `adoptionFormUrl` field to Mongoose schema
- [x] Updated backend controller to extract and save `adoptionFormUrl`
- [x] Added comprehensive logging for debugging
- [x] Added validation for URL format
- [x] Created `.env.local` template file
- [x] Created detailed setup guides
- [x] Created test script

## 🎯 What YOU Need To Do (5 Steps, 5 Minutes)

### ✨ Step 1: Get Supabase Credentials (2 min)

1. Open https://app.supabase.com in your browser
2. Sign in (or create free account)
3. Click on your project (or create new one - free tier is fine)
4. Click **Settings** (⚙️ icon in left sidebar)
5. Click **API** in the settings menu
6. Copy these two values:
   - **Project URL** → Will look like `https://abcdefg.supabase.co`
   - **anon public** key → Will start with `eyJhbGciOiJIUz...`

### ✨ Step 2: Configure Environment (1 min)

1. Open the file: `/workspace/frontend/.env.local`
2. Replace the placeholder values with your actual credentials from Step 1:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

3. Save the file

### ✨ Step 3: Create Supabase Storage Bucket (1 min)

1. In Supabase dashboard, click **Storage** (left sidebar)
2. Click **New bucket** button
3. Enter bucket name: `adoption-forms`
4. **Make sure to check "Public bucket"** ✅
5. Click **Create bucket**

### ✨ Step 4: Set Storage Policies (1 min)

1. Click on the `adoption-forms` bucket you just created
2. Click **Policies** tab at the top
3. Click **New policy** button

**Create First Policy (Allow Uploads):**
- Click **"For full customization"**
- Policy name: `Allow file uploads`
- Allowed operation: Select **INSERT**
- Target roles: `public` (or `authenticated`)
- WITH CHECK expression: Leave as `true`
- Click **Review** → **Save policy**

**Create Second Policy (Allow Downloads):**
- Click **New policy** again
- Click **"For full customization"**
- Policy name: `Allow public downloads`
- Allowed operation: Select **SELECT**
- Target roles: `public`
- USING expression: Leave as `true`  
- Click **Review** → **Save policy**

### ✨ Step 5: Restart Your Servers (30 sec)

**Terminal 1 - Stop and Restart Backend:**
```bash
cd /workspace/backend
# Press Ctrl+C to stop current server (if running)
npm start
```

**Terminal 2 - Stop and Restart Frontend:**
```bash
cd /workspace/frontend
# Press Ctrl+C to stop current server (if running)
npm run dev
```

## 🧪 Testing (Verify It Works)

### Test 1: Check Environment Variables

```bash
cd /workspace/frontend
cat .env.local | grep NEXT_PUBLIC_SUPABASE
```

**Expected output:** Should show your actual Supabase URL and key (not placeholder text)

### Test 2: Submit a Test Adoption

1. Open http://localhost:3000 in browser
2. Click on any pet
3. Click **"Adopt Me"** button
4. Fill in all the fields (name, email, phone, address)
5. Click **"Download PDF"** to get the adoption form
6. Fill it out and save the PDF
7. Click **"Upload Form"** and select your filled PDF
8. Click **"Submit Application"**

### Test 3: Check Browser Console

Open browser console (F12) and look for these success messages:
```
📤 Starting file upload: ...
✅ File uploaded successfully: ...
🔗 Public URL generated: https://...supabase.co/storage/...
```

### Test 4: Check Backend Terminal

Look for these messages in backend terminal:
```
📦 RAW REQUEST BODY: { ... "adoptionFormUrl": "https://..." }
💾 BEFORE SAVE - adoption.adoptionFormUrl: https://...
✅ AFTER SAVE - Adoption request created: { adoptionFormUrl: "https://...", hasFormUrl: true }
```

### Test 5: Check Supabase Dashboard

1. Go to Supabase dashboard
2. Click **Storage** → **adoption-forms**
3. You should see your uploaded PDF file listed

### Test 6: Check Admin Panel

1. Go to http://localhost:3000/admin/adoptions
2. Click on the adoption you just submitted
3. Look for **"Adoption Form (PDF)"** section with blue icon
4. Click **"Open PDF"** button → Should open PDF in new tab
5. Click **"Download"** button → Should download the PDF

## ✅ Success Indicators

You'll know it's working when:
- ✅ No errors in browser console during upload
- ✅ Backend logs show `adoptionFormUrl` with full URL
- ✅ PDF file appears in Supabase Storage dashboard
- ✅ Admin panel shows PDF with working Open/Download buttons
- ✅ MongoDB has `adoptionFormUrl` field populated (check backend logs)

## ❌ Troubleshooting

### "Supabase credentials are missing"
**Problem:** `.env.local` not configured or wrong values  
**Fix:** 
1. Check `/workspace/frontend/.env.local` has real values (not placeholders)
2. Restart frontend server (`Ctrl+C` then `npm run dev`)

### "Bucket not found"
**Problem:** Storage bucket doesn't exist  
**Fix:** Create `adoption-forms` bucket in Supabase dashboard (Step 3)

### "Permission denied" or "RLS policy violation"
**Problem:** Storage policies not configured  
**Fix:** Add INSERT and SELECT policies (Step 4)

### "adoptionFormUrl is empty in MongoDB"
**Problem:** Backend not receiving the URL or not saving it  
**Fix:**
1. Check browser console for upload errors
2. Check backend terminal logs
3. Verify `.env.local` has correct credentials
4. Restart both servers

### "Failed to upload file"
**Problem:** File size or type issue  
**Fix:**
- File must be PDF format
- File must be less than 10MB
- Check browser console for specific error

## 📚 Additional Resources

- **Quick Start Guide:** `/workspace/QUICK_START.md`
- **Detailed Setup:** `/workspace/ADOPTION_FORM_SETUP.md`
- **All Changes Made:** `/workspace/CHANGES_SUMMARY.md`
- **Fix Summary:** `/workspace/README_FIXES.md`
- **Test Script:** `/workspace/backend/test-adoption-form-urls.js`

## 🎉 You're Done!

Once all tests pass, your adoption form PDF upload feature is fully working!

**Time Required:** ~5 minutes  
**Difficulty:** Easy ⭐⭐☆☆☆

---

**Need help?** Check the troubleshooting section above or the detailed guides in the workspace folder.
