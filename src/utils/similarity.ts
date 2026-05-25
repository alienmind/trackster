export function computeSimilarity(fp1: number[], fp2: number[]): number {
  if (fp1.length !== fp2.length) return 0;
  
  // Exact duplicate check
  if (fp1[0] === fp2[0] && fp1[1] === fp2[1]) {
    return 1.0;
  }
  
  // Otherwise compute a basic distance (very naive for this MVP)
  const sizeDiff = Math.abs(fp1[0]! - fp2[0]!) / Math.max(fp1[0]!, fp2[0]!);
  const sumDiff = Math.abs(fp1[1]! - fp2[1]!) / Math.max(fp1[1]!, fp2[1]!);
  
  const score = 1.0 - (sizeDiff * 0.5 + sumDiff * 0.5);
  return Math.max(0, score);
}
