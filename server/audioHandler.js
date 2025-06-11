import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fsSync from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp_recordings directory exists
const ensureTempRecordingsDir = async () => {
  const tempDir = path.join(process.cwd(), 'public', 'temp_recordings');
  try {
    await fs.access(tempDir);
  } catch (error) {
    // Directory doesn't exist, create it
    await fs.mkdir(tempDir, { recursive: true });
  }
  return tempDir;
};

// Save audio file to temp_recordings folder
const saveAudioFile = async (req, res) => {
  try {
    const { fileName, audioData, mimeType } = req.body;

    if (!fileName || !audioData) {
      return res.status(400).json({ error: 'Missing fileName or audioData' });
    }

    // Ensure directory exists
    const tempDir = await ensureTempRecordingsDir();
    const filePath = path.join(tempDir, fileName);

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioData, 'base64');

    // Save file
    await fs.writeFile(filePath, audioBuffer);

    // Return success response
    res.json({
      success: true,
      fileName,
      filePath: `/temp_recordings/${fileName}`,
      size: audioBuffer.length
    });

  } catch (error) {
    console.error('Error saving audio file:', error);
    res.status(500).json({ error: 'Failed to save audio file' });
  }
};

// List recordings in temp_recordings folder
const listRecordings = async (req, res) => {
  try {
    const tempDir = await ensureTempRecordingsDir();
    const files = await fs.readdir(tempDir);
    
    // Filter for audio files only
    const audioFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.flac'].includes(ext);
    });

    // Get file stats
    const recordings = await Promise.all(
      audioFiles.map(async (file) => {
        const filePath = path.join(tempDir, file);
        const stats = await fs.stat(filePath);
        return {
          fileName: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    );

    res.json({ recordings });

  } catch (error) {
    console.error('Error listing recordings:', error);
    res.status(500).json({ error: 'Failed to list recordings' });
  }
};

// Delete recording from temp_recordings folder
const deleteRecording = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({ error: 'Missing fileName' });
    }

    const tempDir = await ensureTempRecordingsDir();
    const filePath = path.join(tempDir, fileName);

    // Check if file exists
    try {
      await fs.access(filePath);
    } catch (error) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete file
    await fs.unlink(filePath);

    res.json({ success: true, message: 'File deleted successfully' });

  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ error: 'Failed to delete recording' });
  }
};

// Clear all recordings from temp_recordings folder
async function clearAllRecordings() {
  try {
    console.log('🧹 Clearing all recordings...');
    const recordingsDir = path.join(process.cwd(), 'public', 'temp_recordings');
    
    // Ensure the directory exists
    if (!fsSync.existsSync(recordingsDir)) {
      console.log('📁 Creating temp_recordings directory');
      await fs.mkdir(recordingsDir, { recursive: true });
      return { success: true, message: 'No recordings to clear' };
    }

    const files = await fs.readdir(recordingsDir);
    console.log(`Found ${files.length} recording files to delete:`, files);
    
    // Delete all files in the directory
    await Promise.all(files.map(file => 
      fs.unlink(path.join(recordingsDir, file))
    ));

    console.log('✨ All recordings cleared successfully');
    return { success: true, message: `Cleared ${files.length} recording files successfully` };
  } catch (error) {
    console.error('❌ Error clearing all recordings:', error);
    return { success: false, message: error.message };
  }
}

// Express route handler for clearing recordings
const clearAllRecordingsHandler = async (req, res) => {
  try {
    const result = await clearAllRecordings();
    res.json(result);
  } catch (error) {
    console.error('Error in clearAllRecordingsHandler:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear recordings', 
      details: error.message 
    });
  }
};

export {
  saveAudioFile,
  listRecordings,
  deleteRecording,
  clearAllRecordings,
  clearAllRecordingsHandler
};