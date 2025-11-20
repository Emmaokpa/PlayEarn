
'use server';
/**
 * @fileOverview An AI flow for predicting game outcomes or giving tips.
 *
 * - predictGameOutcome - A function that provides a prediction for a given game.
 */

import {ai} from '@/ai/genkit';
import { GamePredictorInputSchema, GamePredictorOutputSchema, type GamePredictorInput, type GamePredictorOutput } from '@/ai/schemas';

export async function predictGameOutcome(input: GamePredictorInput): Promise<GamePredictorOutput> {
  return gamePredictorFlow(input);
}

const gamePredictorPrompt = ai.definePrompt({
  name: 'gamePredictorPrompt',
  input: {schema: GamePredictorInputSchema},
  output: {schema: GamePredictorOutputSchema},
  prompt: `You are a mystical and wise gaming oracle.
  A user wants a fun, interesting, and slightly cryptic prediction or tip for the game: {{{gameName}}}.
  
  Provide a short, engaging prediction. Frame it as a secret tip or a glimpse into the future of their gameplay. Do not break character.
  
  Example for a racing game: "The stars align for a perfect drift in the final lap. Look for the shortcut after the Crimson Bridge, but only if you are in 3rd place or lower."
  Example for a puzzle game: "The blue block hides a secret. Do not be distracted by the flashing lights; the true path is the one least traveled."
  
  Generate a prediction for the game: {{{gameName}}}.`,
});

const gamePredictorFlow = ai.defineFlow(
  {
    name: 'gamePredictorFlow',
    inputSchema: GamePredictorInputSchema,
    outputSchema: GamePredictorOutputSchema,
  },
  async (input) => {
    const {output} = await gamePredictorPrompt(input);
    return output!;
  }
);
