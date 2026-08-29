"use client";

import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export function PdfCanvasRenderer({ file, pageNumber, onRenderSuccess }: { file: File; pageNumber: number; onRenderSuccess?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let renderTask: any;
    let isCancelled = false;

    async function renderPage() {
      if (!file || !canvasRef.current) return;
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (pageNumber > pdf.numPages || pageNumber < 1) {
          setError(`Invalid page number ${pageNumber}`);
          return;
        }

        const page = await pdf.getPage(pageNumber);
        
        // Use a standard viewport for rendering
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = canvasRef.current;
        const context = canvas.getContext("2d");
        
        if (!context) return;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        
        renderTask = page.render(renderContext);
        await renderTask.promise;
        
        if (!isCancelled && onRenderSuccess) {
          onRenderSuccess();
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF Render error:", err);
          setError(err.message || "Failed to render PDF");
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [file, pageNumber, onRenderSuccess]);

  if (error) {
    return <div style={{ color: "red", padding: 20 }}>PDF Error: {error}</div>;
  }

  return (
    <canvas 
      ref={canvasRef} 
      style={{ width: "100%", height: "auto", display: "block" }} 
      className="uploaded-sheet-img"
    />
  );
}
