"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";

interface DrawingAreaProps {
  imageSrc: string;
  brushSize: number;
  isErasing: boolean;
  className?: string;
}

export interface DrawingAreaRef {
  downloadMask: (filename?: string) => void;
  clearDrawing: () => void;
}

const DrawingArea = forwardRef<DrawingAreaRef, DrawingAreaProps>(
  ({ imageSrc, brushSize, isErasing, className }, ref) => {
    const imageCanvasRef = useRef<HTMLCanvasElement>(null);
    const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPosition, setLastPosition] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [canvasDimensions, setCanvasDimensions] = useState<{width: number, height: number} | null>(null);


    const getCoordinates = (event: MouseEvent | TouchEvent): { x: number; y: number } | null => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if (event instanceof MouseEvent) {
        clientX = event.clientX;
        clientY = event.clientY;
      } else if (event.touches && event.touches.length > 0) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        return null;
      }
      
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };
    
    const draw = useCallback((x: number, y: number) => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx || !lastPosition) return;

      ctx.beginPath();
      ctx.moveTo(lastPosition.x, lastPosition.y);
      ctx.lineTo(x, y);
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (isErasing) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)"; // doesn't matter for destination-out
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = "black";
      }
      ctx.stroke();
      setLastPosition({ x, y });
    }, [brushSize, isErasing, lastPosition]);

    const startDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
      const coords = getCoordinates(event.nativeEvent);
      if (!coords) return;
      setIsDrawing(true);
      setLastPosition(coords);
      // Draw a dot for single clicks/taps
      const canvas = drawingCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.arc(coords.x, coords.y, brushSize / 2, 0, Math.PI * 2);
        if (isErasing) {
          ctx.globalCompositeOperation = "destination-out";
          ctx.fillStyle = "rgba(0,0,0,1)";
        } else {
          ctx.globalCompositeOperation = "source-over";
          ctx.fillStyle = "black";
        }
        ctx.fill();
      }
    }, [brushSize, isErasing, getCoordinates]);

    const continueDrawing = useCallback((event: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing) return;
      const coords = getCoordinates(event.nativeEvent);
      if (!coords) return;
      draw(coords.x, coords.y);
    }, [isDrawing, draw, getCoordinates]);

    const endDrawing = useCallback(() => {
      setIsDrawing(false);
      setLastPosition(null);
    }, []);
    
    const clearDrawingCanvas = useCallback(() => {
      const canvas = drawingCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
      }
    }, []);

    useEffect(() => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Handle CORS if image is from another domain
      img.src = imageSrc;
      img.onload = () => {
        const container = containerRef.current;
        const iCanvas = imageCanvasRef.current;
        const dCanvas = drawingCanvasRef.current;

        if (container && iCanvas && dCanvas) {
          const containerWidth = container.clientWidth;
          let scaledWidth, scaledHeight;

          if (img.naturalWidth > containerWidth) {
            const scale = containerWidth / img.naturalWidth;
            scaledWidth = containerWidth;
            scaledHeight = img.naturalHeight * scale;
          } else {
            scaledWidth = img.naturalWidth;
            scaledHeight = img.naturalHeight;
          }
          
          setCanvasDimensions({ width: scaledWidth, height: scaledHeight });

          iCanvas.width = scaledWidth;
          iCanvas.height = scaledHeight;
          dCanvas.width = scaledWidth;
          dCanvas.height = scaledHeight;
          
          container.style.height = `${scaledHeight}px`;

          const imageCtx = iCanvas.getContext("2d");
          imageCtx?.drawImage(img, 0, 0, scaledWidth, scaledHeight);
          clearDrawingCanvas();
        }
      };
      img.onerror = () => {
        console.error("Failed to load image.");
      };
    }, [imageSrc, clearDrawingCanvas]);

    // Event listeners for drawing
    useEffect(() => {
      const canvas = drawingCanvasRef.current;
      if (!canvas) return;

      // Prevent page scroll on touch devices
      const preventScroll = (e: TouchEvent) => {
        if (isDrawing) {
          e.preventDefault();
        }
      };
      canvas.addEventListener("touchmove", preventScroll, { passive: false });
      
      // Mouseout/mouseleave to stop drawing if cursor leaves canvas
      const handleMouseLeave = () => {
        if (isDrawing) endDrawing();
      };
      canvas.addEventListener("mouseleave", handleMouseLeave);


      return () => {
        canvas.removeEventListener("touchmove", preventScroll);
        canvas.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [isDrawing, endDrawing]);


    useImperativeHandle(ref, () => ({
      downloadMask: (filename = "mask.png") => {
        const drawingCvs = drawingCanvasRef.current;
        if (!drawingCvs || !canvasDimensions) return;

        const maskCanvas = document.createElement("canvas");
        maskCanvas.width = canvasDimensions.width;
        maskCanvas.height = canvasDimensions.height;
        const ctx = maskCanvas.getContext("2d");

        if (!ctx) return;

        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        ctx.drawImage(drawingCvs, 0, 0);

        const dataUrl = maskCanvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      clearDrawing: clearDrawingCanvas,
    }));

    return (
      <div ref={containerRef} className={`relative w-full touch-none bg-muted rounded-lg overflow-hidden shadow-inner ${className}`} style={{ aspectRatio: canvasDimensions ? `${canvasDimensions.width}/${canvasDimensions.height}` : '16/9' }}>
        <canvas ref={imageCanvasRef} className="absolute top-0 left-0 pointer-events-none opacity-75" data-ai-hint="abstract pattern" />
        <canvas
          ref={drawingCanvasRef}
          className="absolute top-0 left-0 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={continueDrawing}
          onMouseUp={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={continueDrawing}
          onTouchEnd={endDrawing}
        />
      </div>
    );
  }
);

DrawingArea.displayName = "DrawingArea";
export default DrawingArea;
