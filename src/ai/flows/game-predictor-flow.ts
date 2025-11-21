
'use server';
/**
 * @fileOverview An AI flow for providing casino game and betting predictions.
 *
 * - predictGameOutcome - A function that provides a prediction for a given betting scenario.
 */

import {ai} from '@/ai/genkit';
import { GamePredictorInputSchema, GamePredictorOutputSchema, type GamePredictorInput, type GamePredictorOutput } from '@/ai/schemas';
import {z} from 'zod';

export async function predictGameOutcome(input: GamePredictorInput): Promise<GamePredictorOutput> {
  return gamePredictorFlow(input);
}

const gamePredictorPrompt = ai.definePrompt({
  name: 'gamePredictorPrompt',
  input: {schema: GamePredictorInputSchema},
  output: {schema: GamePredictorOutputSchema},
  prompt: `You are a professional and analytical casino game and betting expert.
  A user wants your analysis on a specific scenario. Provide a clear, concise, and helpful prediction or statistical insight.
  Do not give financial advice. Frame your response as a statistical analysis of the odds.

  User's scenario: {{{description}}}.
  
  Example for a Blackjack query: "Blackjack: With a hand of 16 and the dealer showing a 10, basic strategy suggests you should 'hit'. The probability of busting is approximately 62%, but standing has a lower expected return against a dealer's strong card."
  Example for a Roulette query: "Roulette: Betting on a single number has a 2.7% chance of winning on a European wheel. While the payout is high (35 to 1), it is a high-risk, high-reward bet. A corner bet on four numbers offers a 10.8% chance of winning with an 8 to 1 payout."

  Analyze the user's scenario and provide your expert insight.`,
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
