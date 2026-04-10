import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { Move, ZoomIn, ZoomOut } from "lucide-react";
import { useRef, useState } from "react";

interface CvViewerProps {
  fileUrl: string;
}

export default function CvViewer({ fileUrl }: CvViewerProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlsRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startY: 0, scrollLeft: 0, scrollTop: 0 });

  return (
    <div 
      ref={containerRef}
      className="relative h-[78vh] w-full overflow-auto rounded-xl border border-orange-100 bg-white cursor-move"
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      onPointerDown={(event) => {
        if (!containerRef.current) return;
        if (controlsRef.current && controlsRef.current.contains(event.target as Node)) return;
        dragState.current = {
          isDragging: true,
          startX: event.clientX,
          startY: event.clientY,
          scrollLeft: containerRef.current.scrollLeft,
          scrollTop: containerRef.current.scrollTop,
        };
        containerRef.current.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!containerRef.current || !dragState.current.isDragging) return;
        const dx = event.clientX - dragState.current.startX;
        const dy = event.clientY - dragState.current.startY;
        containerRef.current.scrollLeft = dragState.current.scrollLeft - dx;
        containerRef.current.scrollTop = dragState.current.scrollTop - dy;
      }}
      onPointerUp={(event) => {
        if (!containerRef.current) return;
        dragState.current.isDragging = false;
        containerRef.current.releasePointerCapture(event.pointerId);
      }}
      onPointerLeave={() => {
        dragState.current.isDragging = false;
      }}
      style={{ userSelect: 'none' } as React.CSSProperties}
    >
      <style>{`
        .rpv-core__viewer {
          user-select: none;
        }
      `}</style>
      <div
        ref={controlsRef}
        data-cv-controls
        className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-2 py-1 shadow-sm backdrop-blur"
      >
        <button
          type="button"
          onClick={() => setScale((prev) => Math.max(0.6, Number((prev - 0.1).toFixed(2))))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-orange-600 hover:bg-orange-50"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <span className="rounded-full border border-orange-200 bg-white px-3 py-1 text-xs font-semibold text-orange-700">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((prev) => Math.min(2, Number((prev + 0.1).toFixed(2))))}
          className="flex h-8 w-8 items-center justify-center rounded-full text-orange-600 hover:bg-orange-50"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>
      <Worker workerUrl={workerUrl}>
        <Viewer key={`${fileUrl}-${scale}`} fileUrl={fileUrl} defaultScale={scale} />
      </Worker>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full border border-orange-200 bg-white/90 px-3 py-2 text-xs font-semibold text-orange-700 shadow-sm backdrop-blur">
        <Move className="h-4 w-4" />
        Drag to move
      </div>
    </div>
  );
}
