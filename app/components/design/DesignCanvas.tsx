/**
 * Design Canvas Component - Inspired by SuperDesign
 * Interactive canvas for viewing and editing UI designs
 */

import React, { useState, useRef, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download, 
  Copy, 
  Edit3, 
  Eye,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface DesignCanvasProps {
  designs: Array<{
    id: string;
    title: string;
    description: string;
    code: string;
    preview: string;
    type: string;
    metadata: {
      framework: string;
      style: string;
      responsive: boolean;
      createdAt: string;
    };
  }>;
  onSelectDesign?: (design: any) => void;
  onEditDesign?: (design: any) => void;
  onCopyCode?: (code: string) => void;
  onDownloadDesign?: (design: any) => void;
}

export function DesignCanvas({ 
  designs, 
  onSelectDesign, 
  onEditDesign, 
  onCopyCode, 
  onDownloadDesign 
}: DesignCanvasProps) {
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'canvas'>('grid');
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleSelectDesign = (design: any) => {
    setSelectedDesign(design);
    onSelectDesign?.(design);
  };

  const handleCopyCode = () => {
    if (selectedDesign) {
      navigator.clipboard.writeText(selectedDesign.code);
      onCopyCode?.(selectedDesign.code);
    }
  };

  const handleDownloadDesign = () => {
    if (selectedDesign) {
      onDownloadDesign?.(selectedDesign);
    }
  };

  const handleEditDesign = () => {
    if (selectedDesign) {
      onEditDesign?.(selectedDesign);
    }
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'grid' ? 'canvas' : 'grid');
  };

  if (viewMode === 'grid') {
    return (
      <div className="design-canvas">
        <div className="canvas-header">
          <h2 className="text-xl font-semibold">Design Gallery</h2>
          <div className="flex gap-2">
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Maximize2 size={16} />
              Canvas View
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {designs.map((design) => (
            <DesignCard
              key={design.id}
              design={design}
              isSelected={selectedDesign?.id === design.id}
              onClick={() => handleSelectDesign(design)}
              onEdit={() => onEditDesign?.(design)}
              onCopy={() => onCopyCode?.(design.code)}
              onDownload={() => onDownloadDesign?.(design)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="design-canvas h-full flex flex-col">
      <div className="canvas-header flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold">Design Canvas</h2>
          {selectedDesign && (
            <span className="text-sm text-gray-600">
              {selectedDesign.title} • {selectedDesign.metadata.framework}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.1, 3))}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.1, 0.1))}
            className="p-2 hover:bg-gray-100 rounded"
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
          <div className="w-px h-6 bg-gray-300 mx-2" />
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            title="Copy Code"
          >
            <Copy size={16} />
            Copy Code
          </button>
          <button
            onClick={handleEditDesign}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white hover:bg-blue-600 rounded"
            title="Edit Design"
          >
            <Edit3 size={16} />
            Edit
          </button>
          <button
            onClick={handleDownloadDesign}
            className="flex items-center gap-2 px-3 py-1 bg-green-500 text-white hover:bg-green-600 rounded"
            title="Download Design"
          >
            <Download size={16} />
            Download
          </button>
          <button
            onClick={toggleViewMode}
            className="flex items-center gap-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded"
            title="Grid View"
          >
            <Minimize2 size={16} />
            Grid View
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {selectedDesign ? (
          <TransformWrapper
            initialScale={zoom}
            minScale={0.1}
            maxScale={3}
            centerOnInit
            wheel={{ step: 0.1 }}
            pinch={{ step: 5 }}
          >
            <TransformComponent
              wrapperClass="w-full h-full"
              contentClass="w-full h-full flex items-center justify-center"
            >
              <div className="design-preview bg-white shadow-lg rounded-lg overflow-hidden">
                <iframe
                  srcDoc={`
                    <!DOCTYPE html>
                    <html>
                      <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <title>${selectedDesign.title}</title>
                        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
                        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
                        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
                        <style>
                          body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                          * { box-sizing: border-box; }
                        </style>
                      </head>
                      <body>
                        <div id="root"></div>
                        <script type="text/babel">
                          ${selectedDesign.code}
                          ReactDOM.render(<GeneratedComponent />, document.getElementById('root'));
                        </script>
                      </body>
                    </html>
                  `}
                  className="w-full h-full border-0"
                  style={{ minHeight: '600px' }}
                />
              </div>
            </TransformComponent>
          </TransformWrapper>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <Eye size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a design to view in canvas</p>
              <p className="text-sm">Choose from the grid view to get started</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface DesignCardProps {
  design: any;
  isSelected: boolean;
  onClick: () => void;
  onEdit: () => void;
  onCopy: () => void;
  onDownload: () => void;
}

function DesignCard({ design, isSelected, onClick, onEdit, onCopy, onDownload }: DesignCardProps) {
  return (
    <div
      className={`design-card bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
      }`}
      onClick={onClick}
    >
      <div className="aspect-video bg-gray-100 relative">
        <img
          src={design.preview}
          alt={design.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 bg-white/80 hover:bg-white rounded"
            title="Edit"
          >
            <Edit3 size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            className="p-1 bg-white/80 hover:bg-white rounded"
            title="Copy Code"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="p-1 bg-white/80 hover:bg-white rounded"
            title="Download"
          >
            <Download size={14} />
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1">{design.title}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{design.description}</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="px-2 py-1 bg-gray-100 rounded">{design.metadata.framework}</span>
          <span>{new Date(design.metadata.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
