"use client";

import { useEffect, useRef, useState } from "react";

import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EraserIcon, TrashIcon } from "lucide-react";

interface Point {
  x: number;
  y: number;
  color: string; // Add color to Point interface
  isEraser?: boolean; // Add eraser property
}

export default function Whiteboard() {
  const { socket, gameState, updateGameState } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<string>("black");
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const [isEraser, setIsEraser] = useState(false);
  const router = useRouter();
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add touch event prevention
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      e.preventDefault();
    };

    // Prevent default touch actions
    canvas.addEventListener("touchstart", preventDefault, { passive: false });
    canvas.addEventListener("touchmove", preventDefault, { passive: false });
    canvas.addEventListener("touchend", preventDefault, { passive: false });

    return () => {
      canvas.removeEventListener("touchstart", preventDefault);
      canvas.removeEventListener("touchmove", preventDefault);
      canvas.removeEventListener("touchend", preventDefault);
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const context = canvas.getContext("2d");
        const imageData = context?.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        // Get device pixel ratio and physical dimensions
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set canvas dimensions accounting for device pixel ratio
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        // Scale the context to match device pixel ratio
        if (context) {
          context.scale(dpr, dpr);
          context.lineWidth = 4;
          context.lineCap = "round";
          if (imageData) {
            context.putImageData(imageData, 0, 0);
          }
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getCoordinates = (
    event: React.MouseEvent | React.TouchEvent
  ): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas || !("nativeEvent" in event)) return null;

    const rect = canvas.getBoundingClientRect();

    if (event.nativeEvent instanceof MouseEvent) {
      return {
        x: event.nativeEvent.clientX - rect.left,
        y: event.nativeEvent.clientY - rect.top,
        color: currentColor,
        isEraser,
      };
    } else if (event.nativeEvent instanceof TouchEvent) {
      const touch = event.nativeEvent.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        color: currentColor,
        isEraser,
      };
    }
    return null;
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const point = getCoordinates(e);
    if (point) {
      setIsDrawing(true);
      setLastPoint(point);
    }
  };

  const sendDrawingUpdate = () => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas || !gameState.playerId) return;

      try {
        const imageData = canvas.toDataURL("image/png");
        socket?.emit("drawingUpdate", {
          playerId: gameState.playerId,
          imageData: imageData,
        });
      } catch (error) {
        console.error("Error sending drawing update:", error);
      }
    }, 100); // Throttle to max 10 updates per second
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint) return;

    const point = getCoordinates(e);
    if (!point) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context) {
      context.strokeStyle = point.isEraser ? "white" : point.color;
      context.lineWidth = point.isEraser ? 40 : 4; // Make eraser bigger
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();

      sendDrawingUpdate(); // Send update immediately after drawing
    }
    setLastPoint(point);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setLastPoint(null);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context && canvas) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      updateGameState({ submitError: "Canvas not found" });
      return;
    }

    try {
      updateGameState({
        isSubmittingDrawing: true,
        submitError: null,
      });

      const context = canvas.getContext("2d");
      if (!context) throw new Error("Failed to get canvas context");

      // Get image data
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const index = (y * canvas.width + x) * 4;
          const alpha = data[index + 3];
          if (alpha !== 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      if (minX > maxX || minY > maxY) {
        throw new Error("No drawing found on canvas");
      }

      const margin = 50;

      minX = Math.max(0, minX - margin);
      minY = Math.max(0, minY - margin);
      maxX = Math.min(canvas.width, maxX + margin);
      maxY = Math.min(canvas.height, maxY + margin);

      const width = maxX - minX;
      const height = maxY - minY;

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempContext = tempCanvas.getContext("2d");
      if (!tempContext) throw new Error("Failed to get temp canvas context");

      tempContext.fillStyle = "white"; // Ensure white background
      tempContext.fillRect(0, 0, width, height);

      tempContext.drawImage(
        canvas,
        minX,
        minY,
        width,
        height,
        0,
        0,
        width,
        height
      );

      const croppedImageData = tempCanvas.toDataURL("image/png");
      if (!croppedImageData) {
        throw new Error("Failed to convert canvas to image");
      }

      updateGameState({
        hasSubmittedDrawing: true,
        waitingForOthersToSubmit: true,
        isSubmittingDrawing: false,
      });
      socket?.emit("submitDrawing", croppedImageData);
      router.push("/results");
    } catch (error) {
      updateGameState({
        submitError: (error as Error).message,
        isSubmittingDrawing: false,
      });
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="pointer-events-auto flex gap-4 p-2 rounded-lg bg-background border bg-white">
            <Button
              onClick={() => {
                setIsEraser(true);
              }}
              variant="outline"
              className={`w-9 sm:w-auto ${isEraser ? "ring-4 ring-black" : ""}`}
            >
              <EraserIcon /> {<span className="hidden sm:inline">Eraser</span>}
            </Button>
            <div className="flex gap-2">
              {["black", "red", "blue", "green"].map((color) => (
                <Button
                  key={color}
                  onClick={() => {
                    setCurrentColor(color);
                    setIsEraser(false);
                  }}
                  className={`w-9 h-9 p-0 ${
                    currentColor === color && !isEraser
                      ? "ring-4 ring-black"
                      : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              onClick={clearCanvas}
              variant="outline"
              className="w-9 sm:w-auto"
            >
              <TrashIcon /> {<span className="hidden sm:inline">Restart</span>}
            </Button>
          </div>
        </div>
        <div className="pointer-events-auto absolute top-4 right-16 flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={
              gameState.isSubmittingDrawing || gameState.hasSubmittedDrawing
            }
            variant="outline"
          >
            Submit Drawing
          </Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="fixed top-0 left-0 w-screen h-screen bg-white"
        onMouseDown={startDrawing}
        onTouchStart={startDrawing}
        onMouseMove={draw}
        onTouchMove={draw}
        onMouseUp={stopDrawing}
        onTouchEnd={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchCancel={stopDrawing}
      />
      {gameState.submitError && (
        <p className="fixed bottom-4 right-4 text-red-500 bg-white p-2 rounded shadow">
          Error: {gameState.submitError}
        </p>
      )}
    </>
  );
}
