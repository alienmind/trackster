import { useEffect, useRef } from 'react';
import { useAudioStore } from '../../../stores/useAudioStore';

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const peakAmpRef = useRef<number>(0);
  const peakFreqRef = useRef<number>(0);
  const peakTimeRef = useRef<number>(0);
  
  const analyser = useAudioStore((s) => s.analyser);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = Math.round(rect.width * dpr);
      const displayHeight = Math.round(rect.height * dpr);

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
      }

      const width = canvas.width;
      const height = canvas.height;
      const halfWidth = width / 2;

      const timeDataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(timeDataArray);

      const freqDataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqDataArray);

      canvasCtx.fillStyle = 'rgba(24, 24, 27, 0.8)'; // bg-background basically
      canvasCtx.fillRect(0, 0, width, height);

      // --- Left Half: Waveform ---
      canvasCtx.lineWidth = 2 * dpr;
      canvasCtx.strokeStyle = '#00e5ff'; // primary accent
      canvasCtx.beginPath();

      const sliceWidth = halfWidth * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = timeDataArray[i]! / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(halfWidth, height / 2);
      canvasCtx.stroke();

      // --- Vertical Separator ---
      canvasCtx.beginPath();
      canvasCtx.moveTo(halfWidth, 0);
      canvasCtx.lineTo(halfWidth, height);
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      canvasCtx.stroke();

      // --- Right Half: Logarithmic Granular FFT ---
      const minFreq = 50;
      const maxFreq = analyser.context.sampleRate / 2;
      
      const getXLog = (freq: number) => {
        if (freq <= minFreq) return halfWidth;
        if (freq >= maxFreq) return width;
        return halfWidth + (halfWidth * (Math.log2(freq / minFreq) / Math.log2(maxFreq / minFreq)));
      };

      const getFreqFromX = (x: number) => {
        const ratio = (x - halfWidth) / halfWidth;
        return minFreq * Math.pow(maxFreq / minFreq, ratio);
      };

      // Draw grid lines and labels linearly
      const logFreqs = [100, 200, 400, 800, 1600, 3200, 6400, 12800];
      canvasCtx.font = '9px monospace';
      canvasCtx.textAlign = 'center';
      
      logFreqs.forEach(f => {
        if (f >= maxFreq) return;
        const x = getXLog(f);
        // Vertical line
        canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        canvasCtx.beginPath();
        canvasCtx.moveTo(x, 0);
        canvasCtx.lineTo(x, height);
        canvasCtx.stroke();
        
        // Label
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        canvasCtx.fillText(f >= 1000 ? `${(f/1000).toFixed(1)}k` : `${f}`, x, height - 4);
      });

      // Draw bins in granular style
      const barWidth = 2.5; 
      const gap = 1;
      let barX = halfWidth + 2;
      
      let currentFramePeakAmp = 0;
      let currentFramePeakFreq = 0;

      // Find global peak among bins
      for (let i = 0; i < bufferLength; i++) {
        const binFreq = i * maxFreq / bufferLength;
        const amp = freqDataArray[i]!;

        if (amp > currentFramePeakAmp && binFreq >= 20) {
          currentFramePeakAmp = amp;
          currentFramePeakFreq = binFreq;
        }
      }

      // Draw evenly spaced bars on screen mapping to log frequencies
      while (barX < width) {
        const startFreq = getFreqFromX(barX);
        const endFreq = getFreqFromX(barX + barWidth + gap);
        
        const startBin = Math.floor(startFreq * bufferLength / maxFreq);
        const endBin = Math.ceil(endFreq * bufferLength / maxFreq);
        
        let maxAmp = 0;
        let count = 0;
        
        for (let i = Math.max(0, startBin); i <= Math.min(bufferLength - 1, endBin); i++) {
          const val = freqDataArray[i] || 0;
          if (val > maxAmp) {
            maxAmp = val;
          }
          count++;
        }
        
        if (count === 0) {
          const nearestBin = Math.round(startFreq * bufferLength / maxFreq);
          maxAmp = freqDataArray[Math.min(bufferLength - 1, Math.max(0, nearestBin))] || 0;
        }

        const barHeight = (maxAmp / 255.0) * height;

        const i_ratio = (barX - halfWidth) / halfWidth;
        const r = barHeight + (25 * i_ratio);
        const g = 250 * i_ratio;
        const b = 250;
        
        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(barX, height - barHeight, barWidth, barHeight);

        barX += barWidth + gap;
      }

      // Peak tracking
      const now = Date.now();
      if (currentFramePeakAmp > 50 && (currentFramePeakAmp >= peakAmpRef.current * 0.95 || now - peakTimeRef.current > 500)) {
        peakAmpRef.current = currentFramePeakAmp;
        peakFreqRef.current = currentFramePeakFreq;
        peakTimeRef.current = now;
      } else {
        peakAmpRef.current *= 0.98; // Decay peak slowly
      }

      // Draw peak info with fade out
      const timeSincePeak = now - peakTimeRef.current;
      const holdTime = 2000;
      const fadeTime = 1000;
      let alpha = 0;

      if (timeSincePeak < holdTime && peakTimeRef.current !== 0) {
        alpha = 1;
      } else if (timeSincePeak < holdTime + fadeTime && peakTimeRef.current !== 0) {
        alpha = 1 - (timeSincePeak - holdTime) / fadeTime;
      }

      if (alpha > 0 && peakFreqRef.current > 0) {
        const noteNum = 12 * Math.log2(peakFreqRef.current / 440) + 69;
        const roundedNoteNum = Math.round(noteNum);
        let noteStr = '';
        if (roundedNoteNum >= 0) {
          const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
          const octave = Math.floor(roundedNoteNum / 12) - 1;
          noteStr = ` (${notes[roundedNoteNum % 12]}${octave})`;
        }

        const peakX = getXLog(peakFreqRef.current);
        const text = `PEAK: ${Math.round(peakFreqRef.current)}Hz${noteStr}`;

        // Vertical dashed line at the peak
        canvasCtx.beginPath();
        canvasCtx.moveTo(peakX, 30);
        canvasCtx.lineTo(peakX, height);
        canvasCtx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.5})`;
        canvasCtx.setLineDash([2, 4]);
        canvasCtx.stroke();
        canvasCtx.setLineDash([]);

        // Label at top right
        canvasCtx.font = 'bold 11px monospace';
        canvasCtx.textAlign = 'right';
        canvasCtx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        canvasCtx.fillText(text, width - 15, 20);
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [analyser]);

  return (
    <div className="h-full w-full relative bg-background rounded-md border border-border overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full block z-0"
      />

      <div className="absolute top-2 left-3 text-[10px] uppercase font-mono font-bold tracking-widest text-primary/60 pointer-events-none z-10">
        Waveform
      </div>
      <div className="absolute top-2 left-1/2 ml-3 text-[10px] uppercase font-mono font-bold tracking-widest text-primary/60 pointer-events-none z-10">
        Spectrum (FFT)
      </div>
    </div>
  );
}
