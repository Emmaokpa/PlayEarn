import {z} from 'zod';

/**
 * @fileOverview This file contains the Zod schemas and TypeScript types for AI flows.
 * By separating schemas from the flow definitions, we avoid Next.js "use server" build errors.
 */

export const StoryGeneratorInputSchema = z.object({
  prompt: z.string().min(10).max(200).describe('A short prompt or idea for the story.'),
});
export type StoryGeneratorInput = z.infer<typeof StoryGeneratorInputSchema>;


export const StoryGeneratorOutputSchema = z.object({
  title: z.string().describe('A creative and fitting title for the generated story.'),
  story: z
    .string()
    .describe('The full text of the generated story, which should be between 200 and 400 words.'),
});
export type StoryGeneratorOutput = z.infer<typeof StoryGeneratorOutputSchema>;
