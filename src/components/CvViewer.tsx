import { Viewer, Worker } from '@react-pdf-viewer/core';
import '@react-pdf-viewer/core/lib/styles/index.css';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';

interface CvViewerProps {
  fileUrl: string;
}

export default function CvViewer({ fileUrl }: CvViewerProps) {
  return (
    <div 
      className="h-[75vh] w-full overflow-hidden rounded-xl border border-orange-100 bg-white"
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      style={{ userSelect: 'none' } as React.CSSProperties}
    >
      <style>{`
        .rpv-core__viewer {
          user-select: none;
        }
        .rpv-core__toolbar {
          display: none !important;
        }
      `}</style>
      <Worker workerUrl={workerUrl}>
        <Viewer fileUrl={fileUrl} />
      </Worker>
    </div>
  );
}
