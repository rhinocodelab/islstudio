// Audio file management service for handling recordings
export interface AudioFile {
  fileName: string;
  blob: Blob;
  timestamp: number;
  language: string;
  duration?: number;
  filePath?: string;
}

// Generate random filename for audio recordings
export const generateRandomFileName = (extension: string = 'wav'): string => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  return `recording_${timestamp}_${randomId}.${extension}`;
};

// Save audio file to temp_recordings folder via API
export const saveAudioToTempFolder = async (
  audioBlob: Blob, 
  fileName?: string
): Promise<{ fileName: string; filePath: string }> => {
  const finalFileName = fileName || generateRandomFileName();
  
  try {
    // Convert blob to base64 for transmission
    const base64Data = await audioBlobToBase64(audioBlob);
    
    // Send to backend API to save in temp_recordings folder
    const response = await fetch('/api/save-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: finalFileName,
        audioData: base64Data,
        mimeType: audioBlob.type || 'audio/wav'
      }),
      mode: 'cors',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to save audio: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return {
      fileName: finalFileName,
      filePath: result.filePath || `/temp_recordings/${finalFileName}`
    };
  } catch (error) {
    console.error('Error saving audio file to server:', error);
    
    // Fallback: save to browser downloads as before
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFileName;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Return fallback info
    return {
      fileName: finalFileName,
      filePath: `downloads/${finalFileName}` // Indicates it was downloaded instead
    };
  }
};

// Clear all recordings from temp_recordings folder
export const clearAllRecordings = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch('/api/clear-recordings', {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear recordings: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error clearing recordings:', error);
    return {
      success: false,
      message: error.message || 'Failed to clear recordings'
    };
  }
};

// Clear all temporary files (both recordings and videos)
export const clearAllTempFiles = async (): Promise<{ success: boolean; message: string; details?: any }> => {
  try {
    const response = await fetch('/api/clear-all-temp', {
      method: 'DELETE',
      mode: 'cors',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error(`Failed to clear temporary files: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error clearing all temporary files:', error);
    return {
      success: false,
      message: error.message || 'Failed to clear temporary files'
    };
  }
};

// Convert audio blob to base64 for storage/transmission
export const audioBlobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      resolve(base64Data.split(',')[1]); // Remove data:audio/wav;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Get audio duration from blob
export const getAudioDuration = (blob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(blob);
    
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
      URL.revokeObjectURL(url);
    });
    
    audio.addEventListener('error', () => {
      reject(new Error('Failed to load audio metadata'));
      URL.revokeObjectURL(url);
    });
    
    audio.src = url;
  });
};

// Create audio file object with metadata
export const createAudioFile = async (
  blob: Blob,
  language: string,
  fileName?: string
): Promise<AudioFile> => {
  const finalFileName = fileName || generateRandomFileName();
  let duration: number | undefined;
  
  try {
    duration = await getAudioDuration(blob);
  } catch (error) {
    console.warn('Could not determine audio duration:', error);
  }
  
  return {
    fileName: finalFileName,
    blob,
    timestamp: Date.now(),
    language,
    duration
  };
};

// List saved recordings from temp_recordings folder
export const listSavedRecordings = async (): Promise<string[]> => {
  try {
    const response = await fetch('/api/list-recordings', {
      method: 'GET',
      mode: 'cors',
      credentials: 'same-origin',
    });

    if (!response.ok) {
      throw new Error('Failed to list recordings');
    }

    const result = await response.json();
    return result.recordings || [];
  } catch (error) {
    console.error('Error listing recordings:', error);
    return [];
  }
};

// Delete recording from temp_recordings folder
export const deleteRecording = async (fileName: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/delete-recording', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileName }),
      mode: 'cors',
      credentials: 'same-origin',
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting recording:', error);
    return false;
  }
};

// Format file size for display
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format duration for display
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Validate audio file type
export const isValidAudioFile = (file: File): boolean => {
  const validTypes = [
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'audio/mp4',
    'audio/m4a',
    'audio/webm',
    'audio/ogg',
    'audio/flac'
  ];
  
  return validTypes.includes(file.type);
};

// Get audio file info
export const getAudioFileInfo = (file: File): Promise<{
  name: string;
  size: string;
  duration?: string;
  type: string;
}> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener('loadedmetadata', () => {
      resolve({
        name: file.name,
        size: formatFileSize(file.size),
        duration: formatDuration(audio.duration),
        type: file.type
      });
      URL.revokeObjectURL(url);
    });
    
    audio.addEventListener('error', () => {
      // Return basic info even if metadata loading fails
      resolve({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type
      });
      URL.revokeObjectURL(url);
    });
    
    audio.src = url;
  });
};