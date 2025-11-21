
import {z} from 'zod';

/**
 * @fileOverview This file contains the Zod schemas and TypeScript types for AI flows.
 * By separating schemas from the flow definitions, we avoid Next.js "use server" build errors.
 */

export const GamePredictorInputSchema = z.object({
  description: z.string().describe('A description of the casino game or betting scenario.'),
});
export type GamePredictorInput = z.infer<typeof GamePredictorInputSchema>;

export const GamePredictorOutputSchema = z.object({
  prediction: z.string().describe("The AI's analysis, prediction, or advice for the betting scenario."),
});
export type GamePredictorOutput = z.infer<typeof GamePredictorOutputSchema>;

