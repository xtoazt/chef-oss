import { z } from 'zod';

export const bashToolParameters = z.object({ command: z.string() });
