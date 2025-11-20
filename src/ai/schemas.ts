import {z} from 'zod';

/**
 * @fileOverview This file contains the Zod schemas and TypeScript types for AI flows.
 * By separating schemas from the flow definitions, we avoid Next.js "use server" build errors.
 */

export const GamePredictorInputSchema = z.object({
  gameName: z.string().describe('The name of the game to predict.'),
});
export type GamePredictorInput = z.infer<typeof GamePredictorInputSchema>;

export const GamePredictorOutputSchema = z.object({
  prediction: z.string().describe("The AI's prediction or tip for the game."),
});
export type GamePredictorOutput = z.infer<typeof GamePredictorOutputSchema>;
