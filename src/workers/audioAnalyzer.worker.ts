import Meyda from 'meyda';
import type { SpectralFeatures } from '../utils/clustering';

/**
 * Audio analysis Web Worker.
 * Extracts MFCC and Spectral Centroid features from raw audio buffers to identify similar files.
 */

// Initialize meyda buffer size
Meyda.bufferSize = 1024; // Must be a power of 2

function extractFeaturesFromWav(buffer: ArrayBuffer): SpectralFeatures {
  const view = new DataView(buffer);
  const startOffset = 44; // Standard WAV header size
  
  const numSamples = Math.floor((buffer.byteLength - startOffset) / 2);
  const frameSize = 1024;
  
  // Skip leading silence (find the transient)
  let startSample = 0;
  for (let i = 0; i < numSamples; i++) {
    if (Math.abs(view.getInt16(startOffset + i * 2, true) / 32768.0) > 0.01) {
      startSample = i;
      break;
    }
  }
  
  // Process up to 10 frames (~230ms at 44.1kHz) to capture the transient and body
  const framesToProcess = Math.min(10, Math.floor((numSamples - startSample) / frameSize));
  
  if (framesToProcess <= 0) {
    return { mfcc: new Array(13).fill(0), spectralCentroid: 0 };
  }

  const float32Array = new Float32Array(frameSize);
  const avgMfcc = new Array(13).fill(0);
  let avgCentroid = 0;
  let validFrames = 0;

  for (let f = 0; f < framesToProcess; f++) {
    const frameStart = startSample + f * frameSize;
    for (let i = 0; i < frameSize; i++) {
      float32Array[i] = view.getInt16(startOffset + (frameStart + i) * 2, true) / 32768.0;
    }
    
    const features = Meyda.extract(['mfcc', 'spectralCentroid'], float32Array) as any;
    if (features && features.mfcc) {
      for (let j = 0; j < 13; j++) {
        avgMfcc[j] += features.mfcc[j];
      }
      avgCentroid += features.spectralCentroid;
      validFrames++;
    }
  }

  if (validFrames > 0) {
    for (let j = 0; j < 13; j++) {
      avgMfcc[j] /= validFrames;
    }
    avgCentroid /= validFrames;
  }
  
  return {
    mfcc: avgMfcc,
    spectralCentroid: avgCentroid
  };
}

let batchResults: { originalFilename: string; features: SpectralFeatures }[] = [];
let batchSize = 10;
let processedCount = 0;
let totalExpected = 0;

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'INIT') {
    // console.log(`[Worker] INIT received. totalExpected = ${payload.totalExpected}`);
    totalExpected = payload.totalExpected;
    batchResults = [];
    processedCount = 0;
    return;
  }

  if (type === 'PROCESS_FILE') {
    const { originalFilename, buffer } = payload;
    // console.log(`[Worker] Processing: ${originalFilename}`);

    try {
      const features = extractFeaturesFromWav(buffer);
      batchResults.push({ originalFilename, features });
      processedCount++;

      // Send batch update if we hit the batch size OR if it's the very last file
      if (batchResults.length >= batchSize || processedCount === totalExpected) {
        self.postMessage({
          type: 'BATCH_RESULT',
          payload: {
            results: batchResults,
            processedCount,
            totalExpected
          }
        });
        batchResults = []; // Reset batch
      }
    } catch (err: any) {
      console.error(`[Worker] Error analyzing ${originalFilename}:`, err);
      processedCount++;
      self.postMessage({
        type: 'ERROR',
        payload: { originalFilename, error: err.message || 'Analysis failed' }
      });
      
      // Still need to check if we should send a batch result because we incremented processedCount
      if (batchResults.length >= batchSize || processedCount === totalExpected) {
        self.postMessage({
          type: 'BATCH_RESULT',
          payload: {
            results: batchResults,
            processedCount,
            totalExpected
          }
        });
        batchResults = [];
      }
    }
  }
};
