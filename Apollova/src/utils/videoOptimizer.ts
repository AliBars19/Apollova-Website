// src/utils/videoOptimizer.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

interface OptimizeOptions {
  width?: number;
  height?: number;
  bitrate?: string;
  fps?: number;
}

/**
 * Optimizes video for TikTok using ffmpeg
 * 
 * TikTok optimal specs:
 * - Codec: H.264 (High Profile)
 * - Resolution: 1080x1920 (9:16) or 1080x1080 (1:1)
 * - Bitrate: 4000-6000 kbps
 * - Frame rate: 30fps
 * - Audio: AAC, 192 kbps
 * - Minimum size: 21MB (for chunked upload compatibility)
 */
export async function optimizeForTikTok(
  inputPath: string,
  options: OptimizeOptions = {}
): Promise<string> {
  const {
    width = 1080,
    height = 1920,
    bitrate = '5000k', // 5 Mbps for high quality
    fps = 30,
  } = options;

  const dir = path.dirname(inputPath);
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  const outputPath = path.join(dir, `${basename}_optimized${ext}`);

  console.log('Optimizing video for TikTok...');
  console.log(`Input: ${inputPath}`);
  console.log(`Output: ${outputPath}`);

  try {
    // Check if ffmpeg is available
    await execAsync('ffmpeg -version');
  } catch (error) {
    console.error('ffmpeg not found! Skipping optimization.');
    return inputPath; // Return original if ffmpeg not available
  }

  try {
    // Get input file size
    const stats = await fs.stat(inputPath);
    const inputSizeMB = stats.size / (1024 * 1024);
    
    console.log(`Input file size: ${inputSizeMB.toFixed(2)} MB`);
    
    // Determine if we need to pad the file
    const MIN_SIZE_MB = 21;
    const needsPadding = inputSizeMB < MIN_SIZE_MB;
    
    if (needsPadding) {
      console.log(`⚠️  File is under ${MIN_SIZE_MB}MB, will pad to meet TikTok chunk requirements`);
    }

    // Calculate bitrate to reach target size if padding needed
    let finalBitrate = bitrate;
    if (needsPadding) {
      // Get video duration
      const probeCommand = `ffprobe -v quiet -print_format json -show_format "${inputPath}"`;
      const { stdout: probeOutput } = await execAsync(probeCommand);
      const probeData = JSON.parse(probeOutput);
      const durationSeconds = parseFloat(probeData.format.duration);
      
      // Calculate bitrate needed to reach 21MB
      // Target size = 21MB = 21 * 8 megabits
      const targetSizeMegabits = MIN_SIZE_MB * 8;
      const targetBitrateKbps = Math.floor((targetSizeMegabits * 1024) / durationSeconds);
      
      // Use higher of target bitrate or original
      const originalBitrateKbps = parseInt(bitrate.replace('k', ''));
      finalBitrate = `${Math.max(targetBitrateKbps, originalBitrateKbps)}k`;
      
      console.log(`Adjusting bitrate to ${finalBitrate} to reach ${MIN_SIZE_MB}MB`);
    }

    // FFmpeg command for TikTok optimization
    const command = [
      'ffmpeg',
      '-i', `"${inputPath}"`,
      '-c:v', 'libx264',           // H.264 codec
      '-profile:v', 'high',        // High profile for better quality
      '-level', '4.2',             // Compatibility level
      '-preset', 'slow',           // Slower = better quality
      '-crf', '18',                // Quality (18 = very high, 23 = default)
      '-b:v', finalBitrate,        // Target bitrate (adjusted for padding if needed)
      '-maxrate', finalBitrate,    // Max bitrate
      '-bufsize', '10000k',        // Buffer size
      `-vf`, `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,
      '-r', fps.toString(),        // Frame rate
      '-c:a', 'aac',               // AAC audio codec
      '-b:a', '192k',              // Audio bitrate
      '-ar', '48000',              // Audio sample rate
      '-movflags', '+faststart',   // Fast start for streaming
      '-pix_fmt', 'yuv420p',       // Pixel format
      '-y',                        // Overwrite output
      `"${outputPath}"`
    ].join(' ');

    console.log('Running ffmpeg...');
    const { stdout, stderr } = await execAsync(command, { 
      maxBuffer: 50 * 1024 * 1024 // 50MB buffer
    });

    // Check if output file was created
    const outputExists = await fs.access(outputPath).then(() => true).catch(() => false);
    
    if (!outputExists) {
      console.error('Optimized file not created, using original');
      return inputPath;
    }

    const originalSize = (await fs.stat(inputPath)).size;
    const optimizedSize = (await fs.stat(outputPath)).size;

    console.log(`✓ Video optimized!`);
    console.log(`  Original: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Optimized: ${(optimizedSize / 1024 / 1024).toFixed(2)} MB`);
    
    if (optimizedSize < MIN_SIZE_MB * 1024 * 1024) {
      console.warn(`⚠️  Output is still under ${MIN_SIZE_MB}MB (${(optimizedSize / 1024 / 1024).toFixed(2)} MB)`);
      console.warn(`   TikTok may still reject this file`);
    }

    return outputPath;

  } catch (error) {
    console.error('Video optimization failed:', error);
    console.log('Using original video file');
    return inputPath; // Fallback to original
  }
}

/**
 * Cleans up optimized video file after upload
 */
export async function cleanupOptimizedVideo(filePath: string): Promise<void> {
  if (filePath.includes('_optimized')) {
    try {
      await fs.unlink(filePath);
      console.log(`✓ Cleaned up optimized file: ${filePath}`);
    } catch (error) {
      console.error('Failed to cleanup optimized file:', error);
    }
  }
}

/**
 * Gets video info using ffprobe
 */
export async function getVideoInfo(videoPath: string): Promise<any> {
  try {
    const command = `ffprobe -v quiet -print_format json -show_format -show_streams "${videoPath}"`;
    const { stdout } = await execAsync(command);
    return JSON.parse(stdout);
  } catch (error) {
    console.error('Failed to get video info:', error);
    return null;
  }
}