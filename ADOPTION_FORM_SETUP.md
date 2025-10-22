# Adoption Form PDF Upload Setup Guide

This guide will help you set up the adoption form PDF upload feature using Supabase.

## ✅ Issues Fixed

1. **Created missing Supabase library file** (`/frontend/src/lib/supabase.ts`)
2. **Installed @supabase/supabase-js package**
3. **Added adoptionFormUrl field to Mongoose schema** (backend/Models/adoptionModels.js)
4. **Updated adoptionController** to properly extract and save adoptionFormUrl
5. **Created .env.local template** for Supabase credentials

---

## 🔧 Setup Instructions

### Step 1: Configure Supabase

1. Go to your Supabase project dashboard: https://app.supabase.com
2. If you don't have a project, create one (it's free)
3. Once in your project, go to **Settings** → **API**
4. Copy these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon/public key** (a long JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### Step 2: Create Storage Bucket

1. In your Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name it: `adoption-forms`
4. Make it **Public** (so you can get public URLs)
5. Click **Create bucket**

### Step 3: Set up Storage Policies

1. Click on the `adoption-forms` bucket
2. Go to **Policies** tab
3. Add these policies:

**Policy 1: Allow file uploads**
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'adoption-forms');
```

**Policy 2: Allow public access to files**
```sql
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'adoption-forms');
```

Or use the Supabase UI to create policies:
- **Allow INSERT**: Authenticated users can upload
- **Allow SELECT**: Public can read files

### Step 4: Configure Environment Variables

1. Open `/workspace/frontend/.env.local`
2. Replace the placeholder values with your actual Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here
```

### Step 5: Restart Your Servers

**Backend:**
```bash
cd /workspace/backend
npm start
```

**Frontend:**
```bash
cd /workspace/frontend
npm run dev
```

---

## 🧪 Testing the Feature

### Test 1: Submit an Adoption Form

1. Go to a pet details page: `http://localhost:3000/pet?id=<pet-id>`
2. Click **"Adopt Me"** button
3. Fill in the form details
4. Click **"Download PDF"** to download the adoption form
5. Fill out the PDF form and save it
6. Click **"Upload Form"** and select the filled PDF
7. Submit the form
8. Check the browser console for logs showing:
   - File upload to Supabase
   - Public URL generated
   - Adoption data sent to backend with `adoptionFormUrl`

### Test 2: Verify Data in MongoDB

Check backend logs for:
```
📦 RAW REQUEST BODY: { ... "adoptionFormUrl": "https://..." }
💾 BEFORE SAVE - adoption.adoptionFormUrl: https://...
✅ AFTER SAVE - Adoption request created: { adoptionFormUrl: "https://...", hasFormUrl: true }
🔍 FETCHED FROM DB: { adoptionFormUrl: "https://...", hasFormUrl: true }
```

### Test 3: View in Admin Panel

1. Go to admin adoptions page: `http://localhost:3000/admin/adoptions`
2. Click on an adoption request
3. You should see:
   - **"Adoption Form (PDF)"** section with a blue badge
   - **"Open PDF"** button (opens in new tab)
   - **"Download"** button (downloads the file)

---

## 🐛 Troubleshooting

### Issue: "Supabase credentials are missing"

**Solution:** Make sure you've added the correct credentials to `.env.local` and restarted the Next.js dev server.

### Issue: "Permission denied" or "new row violates row-level security"

**Solution:** Check your Storage Policies in Supabase. Make sure you have:
- INSERT policy for authenticated/public users
- SELECT policy for public access

### Issue: "Bucket not found"

**Solution:** Create the `adoption-forms` bucket in your Supabase Storage dashboard.

### Issue: adoptionFormUrl is empty in MongoDB

**Solution:** 
1. Check browser console for upload errors
2. Verify the file is actually uploaded to Supabase
3. Check backend logs to see if `adoptionFormUrl` is in the request body
4. Restart both frontend and backend servers

### Issue: "Failed to upload file"

**Solution:**
1. Check file size (must be < 10MB)
2. Check file type (must be PDF)
3. Verify Supabase credentials are correct
4. Check your internet connection

---

## 📝 Testing Endpoints

### Test Supabase Connection

Open browser console on any page and run:
```javascript
const response = await fetch(process.env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/', {
  headers: {
    'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
});
console.log('Supabase Status:', response.status); // Should be 200
```

### Test Backend Endpoint

```bash
# Check if adoption has adoptionFormUrl field
curl http://localhost:5003/api/adoptions/test/form-urls \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## 📊 Database Schema

The `adoptions` collection now has this field:

```javascript
{
  // ... other fields ...
  adoptionFormUrl: {
    type: String,
    required: false,
    default: "",
  },
  // ... other fields ...
}
```

---

## 🎯 Expected Flow

1. **User uploads PDF** → Frontend uploads to Supabase Storage
2. **Supabase returns URL** → e.g., `https://abc.supabase.co/storage/v1/object/public/adoption-forms/123456.pdf`
3. **Frontend sends adoption data** → Includes `adoptionFormUrl: "https://..."`
4. **Backend receives data** → Logs show adoptionFormUrl in request body
5. **Backend saves to MongoDB** → Document includes adoptionFormUrl field
6. **Admin views adoption** → Can see PDF link and download/view the form

---

## 📞 Support

If you encounter any issues:
1. Check browser console for frontend errors
2. Check backend terminal for server errors
3. Check Supabase dashboard logs
4. Verify all environment variables are set correctly
5. Ensure MongoDB connection is working

---

## ✨ Next Steps

Once everything is working:
1. Test with different file sizes
2. Test with multiple adoptions
3. Add file validation (PDF only, max 10MB)
4. Add progress indicator for large uploads
5. Consider adding file compression for large PDFs

---

**Last Updated:** 2025-10-22
