/**
 * Design Integration Component
 * Integrates design features into the main chat interface
 */

import React, { useState, useEffect } from 'react';
import { DesignCanvas } from './DesignCanvas';
import { DesignPanel } from './DesignPanel';
import { 
  Palette, 
  Grid3X3, 
  Layers, 
  Code, 
  Eye,
  Plus,
  Folder
} from 'lucide-react';

interface DesignIntegrationProps {
  onGenerateUI?: (prompt: string) => void;
  onSelectDesign?: (design: any) => void;
}

export function DesignIntegration({ onGenerateUI, onSelectDesign }: DesignIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'canvas' | 'projects'>('canvas');
  const [designs, setDesigns] = useState<any[]>([]);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const mockDesigns = [
      {
        id: '1',
        title: 'Modern Login Form',
        description: 'Clean login form with social media buttons',
        code: `import React from 'react';

export const LoginForm = () => {
  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6">Welcome Back</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your email"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your password"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Sign In
        </button>
      </form>
    </div>
  );
};`,
        preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiMzMzMiPgogICAgTG9naW4gRm9ybSBQcmV2aWV3CiAgPC90ZXh0Pgo8L3N2Zz4=',
        type: 'component',
        metadata: {
          framework: 'react',
          style: 'modern',
          responsive: true,
          createdAt: new Date().toISOString(),
        },
      },
      {
        id: '2',
        title: 'Product Card',
        description: 'E-commerce product card with image and pricing',
        code: `import React from 'react';

export const ProductCard = ({ product }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-3">{product.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold text-blue-600">${product.price}</span>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};`,
        preview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y4ZjlmYSIvPgogIDx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTYiIGZpbGw9IiMzMzMiPgogICAgUHJvZHVjdCBDYXJkIFByZXZpZXcKICA8L3RleHQ+Cjwvc3ZnPg==',
        type: 'component',
        metadata: {
          framework: 'react',
          style: 'modern',
          responsive: true,
          createdAt: new Date().toISOString(),
        },
      },
    ];
    setDesigns(mockDesigns);
  }, []);

  const handleSelectDesign = (design: any) => {
    setSelectedDesign(design);
    onSelectDesign?.(design);
  };

  const handleGenerateUI = async (prompt: string) => {
    setIsGenerating(true);
    try {
      // This would call your design API
      onGenerateUI?.(prompt);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const handleDownloadDesign = (design: any) => {
    const element = document.createElement('a');
    const file = new Blob([design.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${design.title}.tsx`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="design-integration h-full flex flex-col">
      <div className="design-header p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette size={24} className="text-blue-500" />
            <h2 className="text-xl font-semibold">Design Studio</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center gap-2 px-3 py-1 rounded ${
                activeTab === 'canvas' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Grid3X3 size={16} />
              Canvas
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center gap-2 px-3 py-1 rounded ${
                activeTab === 'projects' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Folder size={16} />
              Projects
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'canvas' ? (
          <DesignCanvas
            designs={designs}
            onSelectDesign={handleSelectDesign}
            onCopyCode={handleCopyCode}
            onDownloadDesign={handleDownloadDesign}
          />
        ) : (
          <DesignPanel
            onSelectProject={(project) => {
              console.log('Selected project:', project);
            }}
            onSelectIteration={(project, iteration) => {
              handleSelectDesign(iteration);
            }}
            onCreateProject={() => {
              console.log('Create new project');
            }}
          />
        )}
      </div>

      {isGenerating && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span>Generating UI design...</span>
          </div>
        </div>
      )}
    </div>
  );
}
