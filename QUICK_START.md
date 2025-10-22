# Quick Start Guide - Adoption Form PDF Upload

## 🚀 Quick Setup (5 minutes)

### Step 1: Get Supabase Credentials (2 min)

1. Go to https://app.supabase.com
2. Sign in or create account (free)
3. Create a new project or select existing one
4. Go to **Settings** → **API**
5. Copy these two values:
   - `Project URL` (e.g., https://abcdefg.supabase.co)
   - `anon public` key (starts with `eyJhbGci...`)

### Step 2: Create Storage Bucket (1 min)

1. In Supabase dashboard, click **Storage** (left sidebar)
2. Click **New bucket**
3. Name: `adoption-forms`
4. **Public bucket**: ✅ YES (check this box)
5. Click **Create bucket**

### Step 3: Set Storage Policies (1 min)

1. Click on the `adoption-forms` bucket
2. Go to **Policies** tab
3. Click **New policy** → **For full customization**

**First Policy - Allow Uploads:**
- Policy name: `Allow file uploads`
- Policy command: `INSERT`
- Target roles: `public` or `authenticated`
- Policy definition: `true`
- Click **Save**

**Second Policy - Allow Downloads:**
- Policy name: `Allow public access`
- Policy command: `SELECT`
- Target roles: `public`
- Policy definition: `true`
- Click **Save**

### Step 4: Configure Environment (1 min)

Edit `/workspace/frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

Replace with your actual values from Step 1.

### Step 5: Restart Servers

**Terminal 1 - Backend:**
```bash
cd /workspace/backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd /workspace/frontend
npm run dev
```

## ✅ Verify Setup

### Check 1: Environment Variables
```bash
cd /workspace/frontend
cat .env.local | grep NEXT_PUBLIC_SUPABASE
```
Should show your actual Supabase URL and key (not the placeholder text).

### Check 2: Test Upload
1. Go to http://localhost:3000
2. Find any pet and click on it
3. Click "Adopt Me" button
4. Fill in the form
5. Upload a PDF file
6. Submit the form
7. Check browser console - should see:
   ```
   📤 Starting file upload: ...
   ✅ File uploaded successfully: ...
   🔗 Public URL generated: https://...
   ```

### Check 3: Verify in Supabase
1. Go to Supabase dashboard
2. Click **Storage** → **adoption-forms**
3. You should see your uploaded file

### Check 4: Verify in MongoDB
1. Check backend terminal logs for:
   ```
   📦 RAW REQUEST BODY: { ... "adoptionFormUrl": "https://..." }
   ✅ AFTER SAVE - Adoption request created: { adoptionFormUrl: "https://...", hasFormUrl: true }
   ```

### Check 5: Admin Panel
1. Go to http://localhost:3000/admin/adoptions
2. Click on the adoption you just created
3. Should see "Adoption Form (PDF)" section with blue icon
4. Should have "Open PDF" and "Download" buttons

## 🐛 Quick Troubleshooting

### "Supabase credentials are missing"
- ❌ Problem: `.env.local` not configured or server not restarted
- ✅ Solution: Edit `.env.local` with real values, restart frontend server

### "Permission denied" or "RLS policy"
- ❌ Problem: Storage policies not set up correctly
- ✅ Solution: Add INSERT and SELECT policies (see Step 3)

### "Bucket not found"
- ❌ Problem: Storage bucket doesn't exist
- ✅ Solution: Create `adoption-forms` bucket (see Step 2)

### "adoptionFormUrl is empty in database"
- ❌ Problem: Old backend code or server not restarted
- ✅ Solution: 
  1. Restart backend server
  2. Try submitting a new adoption
  3. Check backend logs for "adoptionFormUrl"

### "File upload fails"
- ❌ Problem: File too large or wrong type
- ✅ Solution: Ensure PDF file < 10MB

## 📞 Need Help?

Check these files for detailed info:
- `/workspace/ADOPTION_FORM_SETUP.md` - Full setup guide
- `/workspace/CHANGES_SUMMARY.md` - What was changed and why
- `/workspace/backend/test-adoption-form-urls.js` - Test script

## 🎉 Success Checklist

- [x] Supabase project created
- [x] Storage bucket `adoption-forms` created
- [x] Storage policies configured (INSERT + SELECT)
- [x] `.env.local` configured with real credentials
- [x] Frontend server restarted
- [x] Backend server restarted
- [ ] Test adoption form submission with PDF upload
- [ ] Verify PDF appears in Supabase dashboard
- [ ] Verify `adoptionFormUrl` is saved in MongoDB
- [ ] Verify PDF can be viewed/downloaded in admin panel

---

**Estimated Time:** 5 minutes  
**Difficulty:** ⭐⭐☆☆☆ (Easy)  
**Status:** Ready to test!
