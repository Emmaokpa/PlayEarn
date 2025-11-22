'use server';
/**
 * @fileOverview An AI flow for generating short stories based on a user prompt.
 *
 * - generateStory - A function that handles the story generation process.
 * - StoryGeneratorInput - The input type for the generateStory function.
 * - StoryGeneratorOutput - The return type for the generateStory function.
 */

import {ai} from '@/ai/genkit';
import {
  StoryGeneratorInput,
  StoryGeneratorInputSchema,
  StoryGeneratorOutput,
  StoryGeneratorOutputSchema,
} from '@/ai/schemas';

const storyPrompt = ai.definePrompt({
  name: 'storyPrompt',
  input: {schema: StoryGeneratorInputSchema},
  output: {schema: StoryGeneratorOutputSchema},
  prompt: `You are a master storyteller for a mobile app. Your task is to write a short, engaging story (200-400 words) based on the user's prompt.

The story should be creative, have a clear beginning, middle, and end, and be suitable for a general audience.

Generate a creative title for the story.

User's Prompt: {{{prompt}}}`,
});

const storyGeneratorFlow = ai.defineFlow(
  {
    name: 'storyGeneratorFlow',
    inputSchema: StoryGeneratorInputSchema,
    outputSchema: StoryGeneratorOutputSchema,
  },
  async input => {
    const {output} = await storyPrompt(input);
    return output!;
  }
);

export async function generateStory(
  input: StoryGeneratorInput
): Promise<StoryGeneratorOutput> {
  return storyGeneratorFlow(input);
}
