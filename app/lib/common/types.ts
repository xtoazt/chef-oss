import type { Tool, ToolCallUnion } from 'ai';
import { z } from 'zod';

type EmptyArgs = z.ZodObject<Record<string, never>>;

export type ConvexToolSet = {
  deploy: Tool<EmptyArgs, string>;
  str_replace_editor: Tool<any, any>;
};

export type ConvexToolCall = ToolCallUnion<ConvexToolSet>;

export type ConvexToolResult =
  | {
      toolName: 'deploy';
      args?: EmptyArgs;
      result?: string;
    }
  | {
      toolName: 'str_replace_editor';
      args?: any;
      result: string;
    };
export type ConvexToolInvocation =
  | ({
      state: 'partial-call';
      step?: number;
    } & ConvexToolCall)
  | ({
      state: 'call';
      step?: number;
    } & ConvexToolCall)
  | ({
      state: 'result';
      step?: number;
    } & ConvexToolResult);
