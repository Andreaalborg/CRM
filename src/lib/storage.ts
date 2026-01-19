import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization av Supabase client
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase miljøvariabler mangler. Sett NEXT_PUBLIC_SUPABASE_URL og NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

const BUCKET_NAME = 'uploads';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Last opp fil til Supabase Storage
 */
export async function uploadFile(
  file: File,
  folder: string = 'images'
): Promise<UploadResult> {
  try {
    // Generer unik filnavn
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    const supabase = getSupabase();
    
    // Last opp til Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Hent offentlig URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return {
      success: true,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Kunne ikke laste opp fil',
    };
  }
}

/**
 * Slett fil fra Supabase Storage
 */
export async function deleteFile(filePath: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    return !error;
  } catch {
    return false;
  }
}

/**
 * Valider filtype
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  return validTypes.includes(file.type);
}

/**
 * Valider filstørrelse (maks 5MB)
 */
export function isValidFileSize(file: File, maxSizeMB: number = 5): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}


