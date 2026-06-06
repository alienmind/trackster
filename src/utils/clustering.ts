import { kmeans } from 'ml-kmeans';
import type { SampleFile } from '../types';

export interface SpectralFeatures {
  mfcc: number[];
  spectralCentroid: number;
}

export interface AnalyzedSample {
  sample: SampleFile;
  features: SpectralFeatures;
}

/**
 * Basic Euclidean distance between two vectors.
 */
function euclideanDistance(v1: number[], v2: number[]): number {
  if (v1.length !== v2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < v1.length; i++) {
    if (v1[i] !== undefined && v2[i] !== undefined) {
      sum += Math.pow(v1[i]! - v2[i]!, 2);
    }
  }
  return Math.sqrt(sum);
}

/**
 * Returns a heavily weighted category code based on filename heuristics
 * to force K-Means to cluster these items together first.
 */
export function getCategoryCode(filename: string): number {
  const lowerName = filename.toLowerCase();
  
  if (lowerName.includes('kick') || /\bbd\b/.test(lowerName) || lowerName.startsWith('bd_') || lowerName.includes('bassdrum') || lowerName.includes('thump')) return 1000;
  if (lowerName.includes('snare') || /\bsd\b/.test(lowerName) || lowerName.startsWith('sd_') || lowerName.includes('clap') || lowerName.includes('rim')) return 2000;
  if (lowerName.includes('hat') || /\bhh\b/.test(lowerName) || lowerName.startsWith('hh_') || /\bch\b/.test(lowerName) || /\boh\b/.test(lowerName)) return 3000;
  if (lowerName.includes('cym') || /\bcy\b/.test(lowerName) || lowerName.startsWith('cy_') || lowerName.includes('crash') || lowerName.includes('ride') || lowerName.includes('splash')) return 4000;
  if (lowerName.includes('tom') || /\btm\b/.test(lowerName) || lowerName.startsWith('tm_') || lowerName.includes('conga') || lowerName.includes('bongo')) return 5000;
  if (lowerName.includes('perc') || /\bpc\b/.test(lowerName) || lowerName.startsWith('pc_') || lowerName.includes('shaker') || lowerName.includes('tamb') || lowerName.includes('wood') || lowerName.includes('block')) return 6000;
  if (lowerName.includes('fx') || /\bfx\b/.test(lowerName) || lowerName.startsWith('fx_') || lowerName.includes('synth') || lowerName.includes('stab') || lowerName.includes('vocal') || lowerName.includes('voice') || lowerName.includes('chord') || lowerName.includes('piano') || lowerName.includes('horn') || lowerName.includes('blip') || lowerName.includes('echo')) return 7000;
  
  return 0; // Other
}

/**
 * Creates a hybrid vector combining the categorical weight and spectral features.
 */
function createHybridVector(features: SpectralFeatures, categoryCode: number): number[] {
  return [
    categoryCode,
    Number.isFinite(features.spectralCentroid) ? features.spectralCentroid : 0,
    ...features.mfcc.slice(0, 13).map(v => Number.isFinite(v) ? v : 0) // Meyda usually returns 13 MFCC coefficients, sanitize them
  ];
}

/**
 * Uses K-Means to group samples by family, then calculates Euclidean distances
 * within those families to find actual sonic duplicates.
 */
export function clusterAndFindDuplicates(samples: AnalyzedSample[], similarityThreshold: number = 30.0): SampleFile[][] {
  if (samples.length < 2) return [];

  // 1. Prepare data for K-Means
  const data = samples.map(s => createHybridVector(s.features, getCategoryCode(s.sample.originalFilename)));
  
  // Choose K dynamically: enough clusters to separate the main families and sub-families
  const K = Math.max(1, Math.min(10, Math.floor(Math.sqrt(samples.length))));
  
  // Use random initialization instead of kmeans++ because exact duplicate vectors 
  // can cause kmeans++ to fail (all distances become 0, leading to probability 0).
  const result = kmeans(data, K, { initialization: 'random' });
  
  // Group samples by cluster
  const clusters: AnalyzedSample[][] = Array.from({ length: K }, () => []);
  result.clusters.forEach((clusterIndex: number, dataIndex: number) => {
    const sample = samples[dataIndex];
    if (sample) {
      clusters[clusterIndex]?.push(sample);
    }
  });
  
  // 2. Find duplicates within each cluster
  const duplicateGroups: SampleFile[][] = [];
  
  for (const cluster of clusters) {
    if (cluster.length < 2) continue;
    
    const processed = new Set<string>();
    
    for (let i = 0; i < cluster.length; i++) {
      const sampleA = cluster[i];
      if (!sampleA || processed.has(sampleA.sample.originalFilename)) continue;
      
      const group: SampleFile[] = [sampleA.sample];
      processed.add(sampleA.sample.originalFilename);
      
      for (let j = i + 1; j < cluster.length; j++) {
        const sampleB = cluster[j];
        if (!sampleB || processed.has(sampleB.sample.originalFilename)) continue;
        
        // Calculate Euclidean distance only on the spectral features, NOT the category code
        const dist = euclideanDistance(sampleA.features.mfcc, sampleB.features.mfcc);
        
        // If distance is less than the threshold, consider them duplicates
        if (dist < similarityThreshold) {
          group.push(sampleB.sample);
          processed.add(sampleB.sample.originalFilename);
        }
      }
      
      if (group.length > 1) {
        duplicateGroups.push(group);
      }
    }
  }
  
  return duplicateGroups;
}
