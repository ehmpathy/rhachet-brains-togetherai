import type OpenAI from 'openai';
import type { BrainPlugToolDefinition } from 'rhachet/brains';
import { z } from 'zod';

/**
 * .what = converts a rhachet tool definition to together ai / openai format
 * .why = enables tool use via together ai's openai-compatible api
 *
 * .note = together ai uses openai's function call format:
 *   - type: 'function'
 *   - function: { name, description, parameters, strict }
 */
export const castIntoTogetherToolDef = (input: {
  tool: BrainPlugToolDefinition;
}): OpenAI.ChatCompletionTool => {
  // convert zod schema to json schema for function parameters
  const parametersSchema = z.toJSONSchema(input.tool.schema.input);

  return {
    type: 'function',
    function: {
      name: input.tool.slug,
      description: input.tool.description,
      parameters: parametersSchema,
      strict: true,
    },
  };
};
