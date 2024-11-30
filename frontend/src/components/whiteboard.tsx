"use client";

import { useEffect, useRef, useState } from "react";
import { useGameState } from "@/context/game-state";
import { useRouter } from "next/navigation";

interface Point {
  x: number;
  y: number;
}

export default function Whiteboard() {
  const { socket, gameState, updateGameState } = useGameState();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<Point | null>(null);
  const router = useRouter();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        const pixelRatio = window.devicePixelRatio || 1;
        context.scale(pixelRatio, pixelRatio);
        context.strokeStyle = "black";
        context.lineWidth = 2;
        context.lineCap = "round";
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const pixelRatio = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * pixelRatio;
        canvas.height = rect.height * pixelRatio;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;

        // Re-apply context settings after resize
        const context = canvas.getContext("2d");
        if (context) {
          context.scale(pixelRatio, pixelRatio);
          context.strokeStyle = "black";
          context.lineWidth = 2;
          context.lineCap = "round";
        }
      }
    };

    handleResize(); // Set initial size
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getCoordinates = (
    event: React.MouseEvent | React.TouchEvent
  ): Point | null => {
    if ("nativeEvent" in event) {
      if (event.nativeEvent instanceof MouseEvent) {
        return { x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY };
      } else if (event.nativeEvent instanceof TouchEvent) {
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const touch = event.nativeEvent.touches[0];
          return {
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top,
          };
        }
      }
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

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !lastPoint) return;

    const point = getCoordinates(e);
    if (!point) return;

    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (context) {
      context.beginPath();
      context.moveTo(lastPoint.x, lastPoint.y);
      context.lineTo(point.x, point.y);
      context.stroke();

      socket?.emit("draw", { start: lastPoint, end: point });
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

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = canvas.width;
      tempCanvas.height = canvas.height;
      const tempContext = tempCanvas.getContext("2d");

      tempContext!.fillStyle = "white";
      tempContext!.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempContext!.drawImage(canvas, 0, 0);

      const imageData = tempCanvas.toDataURL("image/png");
      if (!imageData) {
        throw new Error("Failed to convert canvas to image");
      }

      updateGameState({
        hasSubmittedDrawing: true,
        waitingForOthersToSubmit: true,
        isSubmittingDrawing: false,
      });
      socket?.emit("submitDrawing", imageData);
      router.push("/results");
    } catch (error) {
      updateGameState({
        submitError: (error as Error).message,
        isSubmittingDrawing: false,
      });
    }
  };

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10">
        <div className="pointer-events-auto absolute top-4 right-4 flex gap-2">
          {gameState.waitingForOthersToSubmit ? (
            <div className="px-4 py-2 bg-yellow-500 text-white rounded-md">
              Waiting for other players...
            </div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={gameState.isSubmittingDrawing || gameState.hasSubmittedDrawing}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400"
            >
              {gameState.isSubmittingDrawing
                ? "Processing..."
                : gameState.hasSubmittedDrawing
                ? "Submitted"
                : "Submit Drawing"}
            </button>
          )}
          <button
            onClick={clearCanvas}
            disabled={gameState.hasSubmittedDrawing}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400"
          >
            Clear
          </button>
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
