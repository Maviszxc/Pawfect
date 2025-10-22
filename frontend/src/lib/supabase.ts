import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('🔍 Supabase Configuration Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase credentials are missing!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Missing');
  console.warn('Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file');
  console.warn('Example .env.local content:');
  console.warn('NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co');
  console.warn('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here');
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('❌ Invalid Supabase URL format. Must start with https://');
}

// Validate anon key format
if (supabaseAnonKey && supabaseAnonKey.length < 50) {
  console.error('❌ Supabase anon key seems too short. Check if it\'s correct.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
  },
});

/**
 * Upload a file to Supabase Storage
 * @param file - The file to upload
 * @param bucket - The storage bucket name (default: 'adoption-forms')
 * @param folder - Optional folder path within the bucket
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(
  file: File,
  bucket: string = 'adoption-forms',
  folder: string = ''
): Promise<string> {
  try {
    // Validate credentials before attempting upload
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials are not configured. Please check your .env.local file.');
    }

    console.log('📤 Starting file upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      bucket,
      folder,
    });

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    console.log('📁 Upload path:', filePath);

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('❌ Supabase upload error:', {
        message: error.message,
        error: error,
      });
      
      // Provide more helpful error messages
      if (error.message.includes('Bucket not found')) {
        throw new Error(`Storage bucket "${bucket}" does not exist. Please create it in your Supabase dashboard.`);
      } else if (error.message.includes('new row violates row-level security')) {
        throw new Error('Permission denied. Please check your storage policies in Supabase.');
      } else if (error.message.includes('Invalid API key')) {
        throw new Error('Invalid Supabase API key. Please check your NEXT_PUBLIC_SUPABASE_ANON_KEY.');
      } else if (error.message.includes('Invalid URL')) {
        throw new Error('Invalid Supabase URL. Please check your NEXT_PUBLIC_SUPABASE_URL.');
      }
      
      throw error;
    }

    console.log('✅ File uploaded successfully:', data);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    console.log('🔗 Public URL generated:', publicUrl);

    return publicUrl;
  } catch (error: any) {
    console.error('❌ Error uploading file to Supabase:', error);
    throw new Error(error.message || 'Failed to upload file to storage');
  }
}

/**
 * Delete a file from Supabase Storage
 * @param fileUrl - The public URL of the file to delete
 * @param bucket - The storage bucket name (default: 'adoption-forms')
 */
export async function deleteFile(
  fileUrl: string,
  bucket: string = 'adoption-forms'
): Promise<void> {
  try {
    // Extract file path from URL
    const urlParts = fileUrl.split(`/${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL');
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting file from Supabase:', error);
    throw error;
  }
}
