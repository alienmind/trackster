import { useEffect, useRef } from 'react';
import { useAudioStore } from '../../stores/useAudioStore';

export default function Oscilloscope() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  const analyser = useAudioStore((s) => s.analyser);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgba(24, 24, 27, 0.8)'; // bg-background basically
      canvasCtx.fillRect(0, 0, width, height);

      canvasCtx.lineWidth = 2;
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

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
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
        width={300} 
        height={100} 
        className="w-full h-full block"
      />
    </div>
  );
}
