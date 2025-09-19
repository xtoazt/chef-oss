/**
 * Design Panel Component - Inspired by SuperDesign
 * Panel for managing design projects and iterations
 */

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Folder, 
  FileText, 
  Eye, 
  Edit3, 
  Copy, 
  Download,
  Trash2,
  Star,
  MoreHorizontal
} from 'lucide-react';

interface DesignProject {
  id: string;
  name: string;
  description: string;
  iterations: Array<{
    id: string;
    title: string;
    description: string;
    type: string;
    metadata: {
      framework: string;
      style: string;
      createdAt: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface DesignPanelProps {
  onSelectProject?: (project: DesignProject) => void;
  onSelectIteration?: (project: DesignProject, iteration: any) => void;
  onCreateProject?: () => void;
  onEditProject?: (project: DesignProject) => void;
  onDeleteProject?: (project: DesignProject) => void;
}

export function DesignPanel({
  onSelectProject,
  onSelectIteration,
  onCreateProject,
  onEditProject,
  onDeleteProject,
}: DesignPanelProps) {
  const [projects, setProjects] = useState<DesignProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DesignProject | null>(null);
  const [viewMode, setViewMode] = useState<'projects' | 'iterations'>('projects');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with actual data fetching
  useEffect(() => {
    const mockProjects: DesignProject[] = [
      {
        id: '1',
        name: 'E-commerce Dashboard',
        description: 'Modern dashboard for e-commerce management',
        iterations: [
          {
            id: '1-1',
            title: 'Main Dashboard Layout',
            description: 'Primary dashboard with metrics and charts',
            type: 'layout',
            metadata: {
              framework: 'react',
              style: 'modern',
              createdAt: '2024-01-15T10:00:00Z',
            },
          },
          {
            id: '1-2',
            title: 'Product Card Component',
            description: 'Reusable product card with image and pricing',
            type: 'component',
            metadata: {
              framework: 'react',
              style: 'modern',
              createdAt: '2024-01-15T11:00:00Z',
            },
          },
        ],
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      },
      {
        id: '2',
        name: 'Landing Page',
        description: 'Marketing landing page with hero section',
        iterations: [
          {
            id: '2-1',
            title: 'Hero Section',
            description: 'Eye-catching hero with call-to-action',
            type: 'component',
            metadata: {
              framework: 'react',
              style: 'creative',
              createdAt: '2024-01-14T14:00:00Z',
            },
          },
        ],
        createdAt: '2024-01-14T13:00:00Z',
        updatedAt: '2024-01-14T14:00:00Z',
      },
    ];
    setProjects(mockProjects);
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectProject = (project: DesignProject) => {
    setSelectedProject(project);
    setViewMode('iterations');
    onSelectProject?.(project);
  };

  const handleSelectIteration = (iteration: any) => {
    if (selectedProject) {
      onSelectIteration?.(selectedProject, iteration);
    }
  };

  const handleBackToProjects = () => {
    setSelectedProject(null);
    setViewMode('projects');
  };

  const handleCreateProject = () => {
    onCreateProject?.();
  };

  const handleEditProject = (project: DesignProject, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditProject?.(project);
  };

  const handleDeleteProject = (project: DesignProject, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteProject?.(project);
  };

  if (viewMode === 'iterations' && selectedProject) {
    return (
      <div className="design-panel h-full flex flex-col">
        <div className="panel-header p-4 border-b">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToProjects}
              className="p-1 hover:bg-gray-100 rounded"
              title="Back to Projects"
            >
              ←
            </button>
            <div>
              <h2 className="font-semibold">{selectedProject.name}</h2>
              <p className="text-sm text-gray-600">{selectedProject.description}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {selectedProject.iterations.map((iteration) => (
              <div
                key={iteration.id}
                className="iteration-item p-3 bg-white rounded-lg border hover:border-blue-300 cursor-pointer transition-colors"
                onClick={() => handleSelectIteration(iteration)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{iteration.title}</h3>
                    <p className="text-xs text-gray-600 mt-1">{iteration.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {iteration.metadata.framework}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-xs rounded">
                        {iteration.type}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(iteration.metadata.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      title="View"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Edit"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Copy"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="design-panel h-full flex flex-col">
      <div className="panel-header p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Design Projects</h2>
          <button
            onClick={handleCreateProject}
            className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>
        
        <div className="relative">
          <input
            type="text"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="project-item p-4 bg-white rounded-lg border hover:border-blue-300 cursor-pointer transition-colors"
              onClick={() => handleSelectProject(project)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Folder size={20} className="text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{project.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{project.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>{project.iterations.length} iterations</span>
                      <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={(e) => handleEditProject(project, e)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Edit Project"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteProject(project, e)}
                    className="p-1 hover:bg-gray-100 rounded text-red-600"
                    title="Delete Project"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Folder size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No projects found</p>
            <p className="text-sm">Create your first design project to get started</p>
          </div>
        )}
      </div>
    </div>
  );
}
