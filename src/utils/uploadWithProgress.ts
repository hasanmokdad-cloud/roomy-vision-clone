import { supabase } from '@/integrations/supabase/client';

export interface UploadProgressInfo {
  roomId: string;
  fileName: string;
  progress: number;
  type: 'image' | 'video';
  status: 'uploading' | 'complete' | 'error';
}

export async function uploadFileWithProgress(
  file: File,
  bucket: string,
  filePath: string,
  onProgress: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Get Supabase URL and key
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        resolve(data.publicUrl);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });

    // Use Supabase storage API endpoint
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;
    
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
    xhr.setRequestHeader('x-upsert', 'true');
    
    xhr.send(file);
  });
}

export function generateFilePath(folder: string, fileName: string, isVideo: boolean = false): string {
  const ext = fileName.split('.').pop();
  const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const subFolder = isVideo ? 'videos/' : '';
  return `${folder}/${subFolder}${uniqueName}`;
}
