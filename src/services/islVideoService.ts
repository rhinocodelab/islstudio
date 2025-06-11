import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import ffmpeg, { FfprobeData } from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';

interface VideoSequenceResult {
  videoPath: string;
  duration: number;
}

interface FFmpegProgress {
  percent: number;
  frames: number;
  currentFps: number;
  currentKbps: number;
  targetSize: number;
  timemark: string;
}

interface FFmpegMetadata {
  streams: Array<{
    codec_type: string;
    codec_name: string;
    duration: string;
    width?: number;
    height?: number;
  }>;
  format: {
    duration: string;
    size: string;
    bit_rate: string;
  };
}

export class ISLVideoService {
  private readonly datasetPath: string;
  private readonly outputPath: string;

  constructor() {
    this.datasetPath = path.join(process.cwd(), 'public', 'isl_dataset');
    this.outputPath = path.join(process.cwd(), 'public', 'temp_videos');
    console.log('ISLVideoService initialized with paths:', {
      datasetPath: this.datasetPath,
      outputPath: this.outputPath
    });
  }

  /**
   * Generates a sequence of ISL videos from input text
   * @param text Input text to convert to ISL video sequence
   * @returns Promise with the path to the generated video
   */
  async generateVideoSequence(text: string): Promise<VideoSequenceResult> {
    console.log('Generating video sequence for text:', text);
    
    // Split text into words and remove stop words
    const words = text.toLowerCase().split(/\s+/);
    console.log('Words:', words);

    // Find videos for each word
    const videoPaths = await Promise.all(
      words.map(async (word) => {
        const videoPath = path.join(this.datasetPath, word, `${word}.mp4`);
        try {
          await fs.access(videoPath);
          console.log('Found video for word:', word);
          return videoPath;
        } catch (error) {
          console.log('No video found for word:', word);
          return null;
        }
      })
    );

    console.log('Found video paths:', videoPaths);

    // Filter out null values and ensure all videos exist
    const validVideos = videoPaths.filter((path): path is string => 
      path !== null && fsSync.existsSync(path)
    );

    console.log('Valid videos:', validVideos);

    if (validVideos.length === 0) {
      throw new Error('No valid videos found for the given text');
    }

    // Concatenate videos
    try {
      return await this.concatVideos(validVideos);
    } catch (error) {
      console.error('Error in generateVideoSequence:', error);
      throw error;
    }
  }

  /**
   * Normalizes input text for processing
   */
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ');   // Normalize spaces
  }

  /**
   * Gets the video path for a given word
   */
  private async getVideoPathForWord(word: string): Promise<string | null> {
    try {
      // Check if word exists in dataset
      const wordDir = path.join(this.datasetPath, word);
      const videoPath = path.join(wordDir, `${word}.mp4`);
      console.log(`Checking for video at: ${videoPath}`);

      await fs.access(videoPath);
      console.log(`Found video for word: ${word}`);
      return videoPath;
    } catch {
      console.warn(`No video found for word: ${word}`);
      return null;
    }
  }

  private async concatVideos(videoFiles: string[]): Promise<VideoSequenceResult> {
    const outputFile = path.join(this.outputPath, `${uuidv4()}.mp4`);
    const tempListFile = path.join(this.outputPath, 'temp_list.txt');

    try {
      // Ensure the output directory exists
      if (!fsSync.existsSync(this.outputPath)) {
        console.log('Creating temp_videos directory:', this.outputPath);
        await fs.mkdir(this.outputPath, { recursive: true });
      }

      // Create a temporary file listing all videos to concatenate
      const fileList = videoFiles.map(file => `file '${file}'`).join('\n');
      await fs.writeFile(tempListFile, fileList);
      console.log('Created video list file:', tempListFile);
      console.log('File contents:', fileList);

      return new Promise((resolve, reject) => {
        const command = ffmpeg()
          .input(tempListFile)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .outputOptions([
            '-c:v', 'libx264',  // Use H.264 codec
            '-preset', 'medium', // Balance between quality and encoding speed
            '-crf', '23',       // Constant Rate Factor (lower = better quality)
            '-movflags', '+faststart', // Enable fast start for web playback
            '-pix_fmt', 'yuv420p', // Ensure compatibility with most players
            '-c:a', 'aac',      // Use AAC audio codec
            '-b:a', '128k'      // Audio bitrate
          ])
          .output(outputFile);

        command.on('start', (commandLine: string) => {
          console.log('Started FFmpeg with command:', commandLine);
        });

        command.on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        });

        command.on('error', (err: Error) => {
          console.error('Error during video concatenation:', err);
          // Clean up temporary file on error
          fs.unlink(tempListFile).catch(error => {
            console.error('Error cleaning up temporary file:', error);
          });
          reject(err);
        });

        command.on('end', () => {
          console.log('Video concatenation finished');
          // Get video duration
          ffmpeg.ffprobe(outputFile, (err: Error | null, metadata: FfprobeData) => {
            // Clean up temporary file after ffmpeg is done
            fs.unlink(tempListFile).catch(error => {
              console.error('Error cleaning up temporary file:', error);
            });

            if (err) {
              console.error('Error getting video metadata:', err);
              reject(err);
              return;
            }
            const durationStr = metadata.format.duration || '0';
            const duration = parseFloat(durationStr);
            resolve({ videoPath: outputFile, duration });
          });
        });

        command.run();
      });
    } catch (error) {
      // Clean up temporary file if there's an error before ffmpeg starts
      try {
        await fs.unlink(tempListFile);
        console.log('Cleaned up temporary file:', tempListFile);
      } catch (unlinkError) {
        console.error('Error cleaning up temporary file:', unlinkError);
      }
      throw error;
    }
  }

  /**
   * Gets the duration of a video in seconds
   */
  private async getVideoDuration(videoPath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      console.log('Getting video duration for:', videoPath);
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          console.error('Error getting video duration:', err);
          reject(err);
          return;
        }
        const duration = metadata.format.duration || 0;
        console.log('Video duration:', duration);
        resolve(duration);
      });
    });
  }

  private async deleteFileOrDirectory(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        // If it's a directory, delete its contents first
        const files = await fs.readdir(filePath);
        await Promise.all(files.map(file => 
          this.deleteFileOrDirectory(path.join(filePath, file))
        ));
        // Then delete the empty directory
        await fs.rmdir(filePath);
        console.log('🗑️ Deleted directory:', filePath);
      } else {
        // If it's a file, delete it directly
        await fs.unlink(filePath);
        console.log('🗑️ Deleted file:', filePath);
      }
    } catch (error) {
      console.error('❌ Error deleting:', filePath, error);
      throw error;
    }
  }

  public async cleanupTempVideos(): Promise<void> {
    try {
      console.log('🧹 Cleaning up temporary videos...');
      
      // Ensure the temp_videos directory exists
      if (!fsSync.existsSync(this.outputPath)) {
        console.log('📁 Creating temp_videos directory');
        await fs.mkdir(this.outputPath, { recursive: true });
        return;
      }

      const files = await fs.readdir(this.outputPath);
      console.log(`Found ${files.length} video files to delete:`, files);
      
      // Delete all files and directories in temp_videos
      await Promise.all(files.map(file => 
        this.deleteFileOrDirectory(path.join(this.outputPath, file))
      ));

      console.log('✨ Temporary videos cleanup completed');
    } catch (error) {
      console.error('❌ Error during temporary videos cleanup:', error);
      throw error;
    }
  }
} 