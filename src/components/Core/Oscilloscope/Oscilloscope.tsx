import { useEffect, useRef } from 'react';
import { useCircuitTracksStore } from '../../../stores/useCircuitTracksStore';

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const analyser = useCircuitTracksStore((s) => s.analyser);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

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

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgba(24, 24, 27, 0.8)'; // bg-background basically
      canvasCtx.fillRect(0, 0, width, height);

      canvasCtx.lineWidth = 2 * dpr;
      canvasCtx.strokeStyle = '#00e5ff'; // primary accent
      canvasCtx.beginPath();

      const sliceWidth = width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i]! / 128.0;
        const y = v * height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(width, height / 2);
      canvasCtx.stroke();

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
        className="w-full h-full block"
      />
    </div>
  );
}
