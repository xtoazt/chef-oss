/**
 * Design Tools for Chef Agent - Inspired by SuperDesign
 * Tools for generating UI components, mockups, and wireframes
 */

import { z } from 'zod';
import { ConvexTool } from '../types';
import { designAgent, DesignPrompt } from '../../app/lib/.server/design/design-agent';

export const generateUITool: ConvexTool = {
  name: 'generateUI',
  description: 'Generate UI components, mockups, or wireframes from natural language prompts',
  parameters: z.object({
    prompt: z.string().describe('Natural language description of the UI to generate'),
    type: z.enum(['component', 'mockup', 'wireframe', 'layout']).describe('Type of UI to generate'),
    framework: z.enum(['react', 'vue', 'html', 'tailwind']).optional().describe('Target framework'),
    style: z.enum(['modern', 'minimal', 'corporate', 'creative']).optional().describe('Design style'),
    projectId: z.string().optional().describe('Existing project ID to add to'),
  }),
  handler: async (args) => {
    try {
      const { prompt, type, framework = 'react', style = 'modern', projectId } = args;

      // Create design prompt
      const designPrompt: DesignPrompt = {
        id: `prompt_${Date.now()}`,
        text: prompt,
        type,
        framework,
        style,
      };

      let iteration;
      if (projectId) {
        // Add to existing project
        iteration = await designAgent.generateDesign(projectId, designPrompt);
      } else {
        // Create new project
        const project = await designAgent.createProject(
          `Generated ${type}`,
          `UI generated from: ${prompt}`
        );
        iteration = await designAgent.generateDesign(project.id, designPrompt);
      }

      return {
        success: true,
        result: {
          iterationId: iteration.id,
          projectId: projectId || 'new',
          title: iteration.result.title,
          description: iteration.result.description,
          code: iteration.result.code,
          preview: iteration.result.preview,
          metadata: iteration.result.metadata,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate UI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export const generateUIVariationsTool: ConvexTool = {
  name: 'generateUIVariations',
  description: 'Generate multiple variations of a UI design',
  parameters: z.object({
    prompt: z.string().describe('Natural language description of the UI to generate'),
    type: z.enum(['component', 'mockup', 'wireframe', 'layout']).describe('Type of UI to generate'),
    count: z.number().min(2).max(5).optional().describe('Number of variations to generate (2-5)'),
    framework: z.enum(['react', 'vue', 'html', 'tailwind']).optional().describe('Target framework'),
    projectId: z.string().optional().describe('Existing project ID to add to'),
  }),
  handler: async (args) => {
    try {
      const { prompt, type, count = 3, framework = 'react', projectId } = args;

      // Create design prompt
      const designPrompt: DesignPrompt = {
        id: `prompt_${Date.now()}`,
        text: prompt,
        type,
        framework,
      };

      let iterations;
      if (projectId) {
        // Add to existing project
        iterations = await designAgent.generateVariations(projectId, designPrompt, count);
      } else {
        // Create new project
        const project = await designAgent.createProject(
          `Generated ${type} variations`,
          `UI variations generated from: ${prompt}`
        );
        iterations = await designAgent.generateVariations(project.id, designPrompt, count);
      }

      return {
        success: true,
        result: {
          projectId: projectId || 'new',
          variations: iterations.map(iteration => ({
            iterationId: iteration.id,
            title: iteration.result.title,
            description: iteration.result.description,
            code: iteration.result.code,
            preview: iteration.result.preview,
            metadata: iteration.result.metadata,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to generate UI variations: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export const iterateDesignTool: ConvexTool = {
  name: 'iterateDesign',
  description: 'Iterate on an existing design with feedback and improvements',
  parameters: z.object({
    projectId: z.string().describe('Project ID containing the design'),
    iterationId: z.string().describe('Iteration ID to iterate on'),
    feedback: z.string().describe('Feedback on the current design'),
    improvements: z.array(z.string()).describe('List of specific improvements to make'),
  }),
  handler: async (args) => {
    try {
      const { projectId, iterationId, feedback, improvements } = args;

      const iteration = await designAgent.iterateDesign(
        projectId,
        iterationId,
        feedback,
        improvements
      );

      return {
        success: true,
        result: {
          iterationId: iteration.id,
          parentIterationId: iteration.parentId,
          title: iteration.result.title,
          description: iteration.result.description,
          code: iteration.result.code,
          preview: iteration.result.preview,
          feedback: iteration.feedback,
          improvements: iteration.improvements,
          metadata: iteration.result.metadata,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to iterate design: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export const createDesignProjectTool: ConvexTool = {
  name: 'createDesignProject',
  description: 'Create a new design project for organizing UI designs',
  parameters: z.object({
    name: z.string().describe('Name of the design project'),
    description: z.string().describe('Description of the project'),
  }),
  handler: async (args) => {
    try {
      const { name, description } = args;

      const project = await designAgent.createProject(name, description);

      return {
        success: true,
        result: {
          projectId: project.id,
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to create design project: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export const getDesignSuggestionsTool: ConvexTool = {
  name: 'getDesignSuggestions',
  description: 'Get design suggestions based on context or requirements',
  parameters: z.object({
    context: z.string().describe('Context or requirements for design suggestions'),
  }),
  handler: async (args) => {
    try {
      const { context } = args;

      const suggestions = await designAgent.getDesignSuggestions(context);

      return {
        success: true,
        result: {
          suggestions,
          context,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to get design suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

export const analyzeDesignTool: ConvexTool = {
  name: 'analyzeDesign',
  description: 'Analyze a design and provide feedback and suggestions',
  parameters: z.object({
    projectId: z.string().describe('Project ID containing the design'),
    iterationId: z.string().describe('Iteration ID to analyze'),
  }),
  handler: async (args) => {
    try {
      const { projectId, iterationId } = args;

      const iteration = designAgent.getIteration(iterationId);
      if (!iteration) {
        return {
          success: false,
          error: 'Iteration not found',
        };
      }

      const analysis = await designAgent.analyzeDesign(iteration);

      return {
        success: true,
        result: {
          iterationId,
          analysis,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to analyze design: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  },
};

// Export all design tools
export const designTools = {
  generateUI: generateUITool,
  generateUIVariations: generateUIVariationsTool,
  iterateDesign: iterateDesignTool,
  createDesignProject: createDesignProjectTool,
  getDesignSuggestions: getDesignSuggestionsTool,
  analyzeDesign: analyzeDesignTool,
};


export const designTools = {
  generateUI: generateUITool,
  generateUIVariations: generateUIVariationsTool,
  createDesignProject: createDesignProjectTool,
  iterateDesign: iterateDesignTool,
  getDesignSuggestions: getDesignSuggestionsTool,
  analyzeDesign: analyzeDesignTool,
};
