import { supabase } from '@/integrations/supabase/client';

export interface UploadProgressInfo {
  roomId: string;
  fileName: string;
  progress: number;
  type: 'image' | 'video';
  status: 'uploading' | 'complete' | 'error';
}

export interface UploadHandle {
  abort: () => void;
}

export async function uploadFileWithProgress(
  file: File,
  bucket: string,
  filePath: string,
  onProgress: (progress: number) => void,
  uploadHandle?: { current: UploadHandle | null }
): Promise<string> {
  // Get the user's access token for authenticated upload
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    let wasAborted = false;
    
    // Store abort function if handle provided
    if (uploadHandle) {
      uploadHandle.current = {
        abort: () => {
          wasAborted = true;
          xhr.abort();
        }
      };
    }
    
    // Get Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    
    // Start with 0 progress
    onProgress(0);
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && !wasAborted) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', async () => {
      // Check if aborted before resolving - prevents race condition
      if (wasAborted) {
        reject(new Error('Upload cancelled'));
        return;
      }
      
      if (xhr.status >= 200 && xhr.status < 300) {
        // Get public URL
        const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
        resolve(data.publicUrl);
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText || xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    // Use Supabase storage API endpoint
    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`;
    
    xhr.open('POST', url);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
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
