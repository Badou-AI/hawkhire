"use client";


export interface PDFViewerProps {
  filePath: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ filePath }) => {
  return (
    <div className="w-full h-full min-h-[calc(100vh-200px)] relative">
      <iframe
        src={filePath}
        className="w-full h-full absolute inset-0"
        style={{ minHeight: 'calc(100vh - 200px)' }}
        title="PDF Viewer"
        allowFullScreen
      />
    </div>
  );
};

export default PDFViewer; 