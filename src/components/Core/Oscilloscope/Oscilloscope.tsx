import { useEffect, useRef, useMemo } from 'react';
import { useAudioStore } from '../../../stores/useAudioStore';

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const peakAmpRef = useRef<number>(0);
  const peakFreqRef = useRef<number>(0);
  const peakTimeRef = useRef<number>(0);
  
  const analyser = useAudioStore((s) => s.analyser);
  const lastPlayedBuffer = useAudioStore((s) => s.lastPlayedBuffer);
  const lastPlayedStartTime = useAudioStore((s) => s.lastPlayedStartTime);
  const isMonitoring = useAudioStore((s) => s.isMonitoring);

  const monitorHistoryRef = useRef<Float32Array>(new Float32Array(2000));

  const fullWaveformPaths = useMemo(() => {
    if (!lastPlayedBuffer) return [];
    const numPoints = 2000;
    const channelData = lastPlayedBuffer.getChannelData(0);
    const step = Math.max(1, Math.floor(channelData.length / numPoints));
    
    const paths: { min: number; max: number }[] = [];
    for (let i = 0; i < numPoints; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const idx = i * step + j;
        if (idx < channelData.length) {
          const v = channelData[idx];
          if (v !== undefined) {
            if (v < min) min = v;
            if (v > max) max = v;
          }
        }
      }
      paths.push({ min, max });
    }
    return paths;
  }, [lastPlayedBuffer]);

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
      
      const isVert = isMonitoring;
      const thirdWidth = width / 3;
      const twoThirdsWidth = 2 * thirdWidth;
      const thirdHeight = height / 3;
      const twoThirdsHeight = 2 * thirdHeight;

      const timeDataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(timeDataArray);

      const freqDataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(freqDataArray);

      canvasCtx.fillStyle = 'rgba(24, 24, 27, 0.8)'; // bg-background basically
      canvasCtx.fillRect(0, 0, width, height);

      // --- 1. Top/Left: Full Waveform or Monitoring History ---
      const showStaticWaveform = !isMonitoring && fullWaveformPaths.length > 0;

      if (showStaticWaveform) {
        if (fullWaveformPaths.length > 0) {
          canvasCtx.fillStyle = 'rgba(0, 229, 255, 0.6)';
          
          const stepX = thirdWidth / fullWaveformPaths.length;
          for (let i = 0; i < fullWaveformPaths.length; i++) {
            const item = fullWaveformPaths[i]!;
            const { min, max } = item;
            const x = i * stepX;
            const y1 = (height / 2) + (min * height / 2);
            const y2 = (height / 2) + (max * height / 2);
            const h = Math.max(1, y2 - y1);
            
            canvasCtx.fillRect(x, y1, stepX + 0.5, h);
          }
        }

        // Draw traversing playhead line
        if (lastPlayedBuffer && lastPlayedStartTime !== null) {
          const elapsed = analyser.context.currentTime - lastPlayedStartTime;
          let progress = elapsed / lastPlayedBuffer.duration;
          
          if (progress > 1) progress = 1; // Stop at end

          if (progress >= 0 && progress <= 1) {
            const lineX = progress * thirdWidth;
            
            canvasCtx.beginPath();
            canvasCtx.moveTo(lineX, 0);
            canvasCtx.lineTo(lineX, height);
            canvasCtx.lineWidth = 2 * dpr;
            canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            canvasCtx.stroke();
          }
        }
      } else {
        // Calculate max amplitude of current frame
        let maxAmp = 0;
        // Step size optimization for large buffer lengths
        const step = Math.max(1, Math.floor(bufferLength / 1000));
        for (let i = 0; i < bufferLength; i += step) {
          const val = (timeDataArray[i]! - 128) / 128.0;
          if (Math.abs(val) > maxAmp) maxAmp = Math.abs(val);
        }

        // Shift array left
        const hist = monitorHistoryRef.current;
        hist.copyWithin(0, 1);
        hist[hist.length - 1] = maxAmp;

        // Draw seismograph
        canvasCtx.fillStyle = 'rgba(0, 229, 255, 0.6)';
        const boxWidth = isVert ? width : thirdWidth;
        const boxHeight = isVert ? thirdHeight : height;
        const stepX = boxWidth / hist.length;
        
        for (let i = 0; i < hist.length; i++) {
          const amp = hist[i]!;
          if (amp > 0) {
            const x = i * stepX;
            const h = Math.max(1, amp * boxHeight);
            const y = (boxHeight / 2) - (h / 2);
            canvasCtx.fillRect(x, y, stepX + 0.5, h);
          }
        }
      }

      // --- 2. Middle: Live Signal (Amplitude View) ---
      canvasCtx.lineWidth = 2 * dpr;
      canvasCtx.strokeStyle = '#00e5ff'; // primary accent
      canvasCtx.beginPath();

      const sliceWidth = (isVert ? width : thirdWidth) * 1.0 / bufferLength;
      let xMid = isVert ? 0 : thirdWidth;
      const midYOffset = isVert ? thirdHeight : 0;
      const midBoxHeight = isVert ? thirdHeight : height;

      for (let i = 0; i < bufferLength; i++) {
        const v = (timeDataArray[i]! - 128) / 128.0;
        const y = midYOffset + (v * midBoxHeight / 2) + (midBoxHeight / 2);

        if (i === 0) {
          canvasCtx.moveTo(xMid, y);
        } else {
          canvasCtx.lineTo(xMid, y);
        }

        xMid += sliceWidth;
      }

      canvasCtx.lineTo(isVert ? width : twoThirdsWidth, midYOffset + midBoxHeight / 2);
      canvasCtx.stroke();

      // --- Separators ---
      canvasCtx.beginPath();
      if (isVert) {
        canvasCtx.moveTo(0, thirdHeight);
        canvasCtx.lineTo(width, thirdHeight);
        canvasCtx.moveTo(0, twoThirdsHeight);
        canvasCtx.lineTo(width, twoThirdsHeight);
      } else {
        canvasCtx.moveTo(thirdWidth, 0);
        canvasCtx.lineTo(thirdWidth, height);
        canvasCtx.moveTo(twoThirdsWidth, 0);
        canvasCtx.lineTo(twoThirdsWidth, height);
      }
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      canvasCtx.stroke();

      // --- 3. Right/Bottom: Logarithmic Granular FFT ---
      const minFreq = 50;
      const maxFreq = analyser.context.sampleRate / 2;
      
      const fftXOffset = isVert ? 0 : twoThirdsWidth;
      const fftYOffset = isVert ? twoThirdsHeight : 0;
      const fftBoxWidth = isVert ? width : thirdWidth;
      const fftBoxHeight = isVert ? thirdHeight : height;

      const getXLog = (freq: number) => {
        if (freq <= minFreq) return fftXOffset;
        if (freq >= maxFreq) return fftXOffset + fftBoxWidth;
        return fftXOffset + (fftBoxWidth * (Math.log2(freq / minFreq) / Math.log2(maxFreq / minFreq)));
      };

      const getFreqFromX = (x: number) => {
        const ratio = (x - fftXOffset) / fftBoxWidth;
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
        canvasCtx.moveTo(x, fftYOffset);
        canvasCtx.lineTo(x, fftYOffset + fftBoxHeight);
        canvasCtx.stroke();
        
        // Label
        canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        canvasCtx.fillText(f >= 1000 ? `${(f/1000).toFixed(1)}k` : `${f}`, x, fftYOffset + fftBoxHeight - 4);
      });

      // Draw bins in granular style
      const barWidth = (isVert ? 4 : 2.5) * dpr; 
      const gap = (isVert ? 1 : 1) * dpr;
      let barX = fftXOffset + 2 * dpr;
      
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
      while (barX < fftXOffset + fftBoxWidth) {
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

        const barHeight = (maxAmp / 255.0) * fftBoxHeight;

        const i_ratio = (barX - fftXOffset) / fftBoxWidth;
        const r = barHeight + (25 * i_ratio);
        const g = 250 * i_ratio;
        const b = 250;
        
        canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
        canvasCtx.fillRect(barX, fftYOffset + fftBoxHeight - barHeight, barWidth, barHeight);

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
        canvasCtx.moveTo(peakX, fftYOffset + 30);
        canvasCtx.lineTo(peakX, fftYOffset + fftBoxHeight);
        canvasCtx.strokeStyle = `rgba(0, 229, 255, ${alpha * 0.5})`;
        canvasCtx.setLineDash([2, 4]);
        canvasCtx.stroke();
        canvasCtx.setLineDash([]);

        // Label at top right
        canvasCtx.font = 'bold 11px monospace';
        canvasCtx.textAlign = 'right';
        canvasCtx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
        canvasCtx.fillText(text, fftXOffset + fftBoxWidth - 15, fftYOffset + 20);
      }

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [analyser, fullWaveformPaths, lastPlayedBuffer, lastPlayedStartTime, isMonitoring]);

  return (
    <div className="h-full w-full relative bg-background rounded-md border border-border overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 w-full h-full block z-0"
      />

      <div className={`absolute pointer-events-none z-10 text-[10px] uppercase font-mono font-bold tracking-widest text-primary/60 transition-all ${
        isMonitoring ? 'top-2 left-1/2 -translate-x-1/2' : 'top-2 left-[16.66%] -translate-x-1/2'
      }`}>
        {isMonitoring ? 'Seismograph' : 'Waveform'}
      </div>
      <div className={`absolute pointer-events-none z-10 text-[10px] uppercase font-mono font-bold tracking-widest text-primary/60 transition-all ${
        isMonitoring ? 'top-[calc(33.33%+8px)] left-1/2 -translate-x-1/2' : 'top-2 left-1/2 -translate-x-1/2'
      }`}>
        Signal
      </div>
      <div className={`absolute pointer-events-none z-10 text-[10px] uppercase font-mono font-bold tracking-widest text-primary/60 transition-all ${
        isMonitoring ? 'top-[calc(66.66%+8px)] left-1/2 -translate-x-1/2' : 'top-2 left-[83.33%] -translate-x-1/2'
      }`}>
        Spectrum (FFT)
      </div>
    </div>
  );
}
