"use client";

import React, { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";

// Set worker source
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

type PdfCanvasRendererProps = {
  file: File;
  pageNumber: number;
  onRenderSuccess?: () => void;
  onLoadDoc?: (numPages: number) => void;
};

export function PdfCanvasRenderer({ file, pageNumber, onRenderSuccess, onLoadDoc }: PdfCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let renderTask: any;
    let isCancelled = false;

    async function renderPage() {
      if (!file || !canvasRef.current) return;
      setLoading(true);
      setError("");
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        if (!isCancelled && onLoadDoc) {
          onLoadDoc(pdf.numPages);
        }

        const safePage = Math.max(1, Math.min(pdf.numPages, pageNumber));
        const page = await pdf.getPage(safePage);
        
        // High quality viewport rendering
        const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
        const scale = 1.6 * Math.min(2, dpr);
        const viewport = page.getViewport({ scale });
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
        
        if (!isCancelled) {
          setLoading(false);
          if (onRenderSuccess) onRenderSuccess();
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error("PDF Render error:", err);
          setError(err.message || "Failed to render PDF page");
          setLoading(false);
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
  }, [file, pageNumber, onRenderSuccess, onLoadDoc]);

  if (error) {
    return (
      <div className="pdf-render-error-box">
        <p>Could not render PDF Page {pageNumber}: {error}</p>
      </div>
    );
  }

  return (
    <div className="pdf-canvas-container-inner" style={{ position: "relative", width: "100%" }}>
      {loading && (
        <div className="pdf-page-loading-skeleton">
          <span className="loader-ring small" />
          <span>Loading Page {pageNumber}...</span>
        </div>
      )}
      <canvas 
        ref={canvasRef} 
        style={{ 
          width: "100%", 
          height: "auto", 
          display: "block",
          borderRadius: "4px"
        }} 
        className="uploaded-sheet-img"
      />
    </div>
  );
}

