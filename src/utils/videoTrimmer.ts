/**
 * Client-side video trimming utility using HTML5 Video + Canvas + MediaRecorder
 */

export interface TrimRange {
  start: number; // in seconds
  end: number;   // in seconds
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

/**
 * Load video metadata from a file
 */
export const getVideoMetadata = (file: File): Promise<VideoMetadata> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      resolve({
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
      });
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to load video metadata'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Create a video element from a file
 */
export const createVideoElement = (file: File): Promise<HTMLVideoElement> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => resolve(video);
    video.onerror = () => reject(new Error('Failed to load video'));
    
    video.src = URL.createObjectURL(file);
  });
};

/**
 * Trim a video file to specified start and end times
 * Returns a new File with the trimmed video
 */
export const trimVideo = async (
  file: File,
  trimRange: TrimRange,
  onProgress?: (progress: number) => void
): Promise<File> => {
  const { start, end } = trimRange;
  const duration = end - start;
  
  if (duration <= 0) {
    throw new Error('Invalid trim range: end must be greater than start');
  }
  
  // Create video element
  const video = await createVideoElement(file);
  const { videoWidth, videoHeight } = video;
  
  // Create canvas to capture video frames
  const canvas = document.createElement('canvas');
  canvas.width = videoWidth;
  canvas.height = videoHeight;
  const ctx = canvas.getContext('2d')!;
  
  // Setup MediaRecorder with canvas stream
  const stream = canvas.captureStream(30); // 30 FPS
  
  // Try to get audio track from original video
  try {
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaElementSource(video);
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioCtx.destination);
    
    destination.stream.getAudioTracks().forEach(track => {
      stream.addTrack(track);
    });
  } catch {
    // Video might not have audio, continue without it
  }
  
  // Determine supported MIME type
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  
  let mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
  
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 2500000, // 2.5 Mbps
  });
  
  const chunks: Blob[] = [];
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };
  
  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      // Cleanup
      URL.revokeObjectURL(video.src);
      
      const blob = new Blob(chunks, { type: mimeType });
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const trimmedFile = new File(
        [blob],
        file.name.replace(/\.[^/.]+$/, `-trimmed.${ext}`),
        { type: mimeType }
      );
      
      resolve(trimmedFile);
    };
    
    mediaRecorder.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(new Error('MediaRecorder error'));
    };
    
    // Seek to start position
    video.currentTime = start;
    
    video.onseeked = () => {
      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Draw video frames to canvas
      const drawFrame = () => {
        if (video.currentTime >= end || video.ended) {
          video.pause();
          mediaRecorder.stop();
          return;
        }
        
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        
        // Report progress
        if (onProgress) {
          const progress = ((video.currentTime - start) / duration) * 100;
          onProgress(Math.min(progress, 100));
        }
        
        requestAnimationFrame(drawFrame);
      };
      
      video.play().then(drawFrame).catch(reject);
    };
  });
};

/**
 * Format seconds to MM:SS display format
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Generate a thumbnail from a video file at a specific time
 */
export const generateVideoThumbnail = (
  file: File,
  time: number = 0
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    
    video.onloadeddata = () => {
      video.currentTime = time;
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      URL.revokeObjectURL(video.src);
      resolve(dataUrl);
    };
    
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error('Failed to generate thumbnail'));
    };
    
    video.src = URL.createObjectURL(file);
  });
};
