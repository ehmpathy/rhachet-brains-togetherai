import OpenAI from 'openai';
import {
  BrainAtom,
  type BrainEpisode,
  BrainOutput,
  BrainOutputMetrics,
  type BrainPlugs,
  type BrainPlugToolExecution,
  type BrainPlugToolInvocation,
  calcBrainOutputCost,
  castBriefsToPrompt,
  genBrainContinuables,
} from 'rhachet/brains';
import type { Artifact } from 'rhachet-artifact';
import type { GitFile } from 'rhachet-artifact-git';
import type { Empty } from 'type-fns';
import { z } from 'zod';

import { castFromTogetherToolCall } from '../../infra/cast/castFromTogetherToolCall';
import { castIntoTogetherToolDef } from '../../infra/cast/castIntoTogetherToolDef';
import { castIntoTogetherToolMessages } from '../../infra/cast/castIntoTogetherToolMessages';
import {
  CONFIG_BY_ATOM_SLUG,
  type TogetherBrainAtomSlug,
} from './BrainAtom.config';

// re-export for consumers
export type { TogetherBrainAtomSlug } from './BrainAtom.config';

/**
 * .what = factory to generate together ai brain atom instances
 * .why = enables model variant selection via slug
 *
 * .note = together ai api is openai-compatible with baseURL override
 *
 * .example
 *   genBrainAtom({ slug: 'together/qwen3/coder-next' })
 *   genBrainAtom({ slug: 'together/llama3.3/70b' }) // fast + cheap
 *   genBrainAtom({ slug: 'together/kimi/k2.5' }) // best swe-bench
 */
export const genBrainAtom = (input: {
  slug: TogetherBrainAtomSlug;
}): BrainAtom => {
  const config = CONFIG_BY_ATOM_SLUG[input.slug];

  return new BrainAtom({
    repo: 'together',
    slug: input.slug,
    description: config.description,
    spec: config.spec,

    /**
     * .what = stateless inference with optional tool use
     * .why = provides direct model access for tasks
     *
     * .note = supports continuation via `on.episode`
     * .note = supports tool use via `plugs.tools`
     */
    ask: async <TOutput, TPlugs extends BrainPlugs = BrainPlugs>(
      askInput: {
        on?: { episode: BrainEpisode };
        plugs?: TPlugs;
        role: { briefs?: Artifact<typeof GitFile>[] };
        prompt: string | BrainPlugToolExecution[];
        schema: { output: z.Schema<TOutput> };
      },
      context?: Empty,
    ): Promise<BrainOutput<TOutput, 'atom', TPlugs>> => {
      // track start time for elapsed duration
      const startedAt = Date.now();

      // compose system prompt from briefs
      const systemPrompt = askInput.role.briefs
        ? await castBriefsToPrompt({ briefs: askInput.role.briefs })
        : undefined;

      // get openai client from context or create new one with together ai baseURL
      const openai =
        (context?.openai as OpenAI | undefined) ??
        new OpenAI({
          apiKey: process.env.TOGETHER_API_KEY,
          baseURL: 'https://api.together.xyz/v1',
        });

      // build messages array with prior exchanges for continuation
      const messages: OpenAI.ChatCompletionMessageParam[] = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      if (askInput.on?.episode) {
        for (const exchange of askInput.on.episode.exchanges) {
          messages.push({ role: 'user', content: exchange.input });
          messages.push({ role: 'assistant', content: exchange.output });
        }
      }

      // handle prompt: string or BrainPlugToolExecution[]
      const promptIsToolExecutions = Array.isArray(askInput.prompt);
      if (promptIsToolExecutions) {
        // tool continuation: add assistant message with tool_calls, then tool messages
        const executions = askInput.prompt as BrainPlugToolExecution[];

        // reconstruct assistant message with tool_calls from prior exchange
        // note: this is needed because together ai expects the assistant message before tool messages
        const toolCalls: OpenAI.ChatCompletionMessageToolCall[] =
          executions.map((exec) => ({
            id: exec.exid,
            type: 'function' as const,
            function: {
              name: exec.slug,
              arguments: JSON.stringify(exec.input),
            },
          }));

        messages.push({
          role: 'assistant',
          content: null,
          tool_calls: toolCalls,
        });

        // add tool result messages
        const toolMessages = castIntoTogetherToolMessages({ executions });
        messages.push(...toolMessages);
      } else {
        // regular prompt
        messages.push({ role: 'user', content: askInput.prompt as string });
      }

      // convert zod schema to json schema for structured output
      const jsonSchema = z.toJSONSchema(askInput.schema.output);

      // convert tools to together ai format if plugged
      const tools = askInput.plugs?.tools?.map((tool) =>
        castIntoTogetherToolDef({ tool }),
      );

      // call together ai api
      // note: response_format conflicts with tools on initial invocation — model prioritizes json_schema over tool invocation
      // send response_format when:
      // - no tools provided (always want structured output)
      // - OR prompt is tool executions (continuation - want structured final answer)
      const hasTools = tools && tools.length > 0;
      const wantStructuredOutput = !hasTools || promptIsToolExecutions;
      const response = await openai.chat.completions.create({
        model: config.model,
        messages,
        ...(hasTools ? { tools, tool_choice: 'auto' as const } : {}),
        ...(wantStructuredOutput
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: {
                  name: 'response',
                  strict: true,
                  schema: jsonSchema,
                },
              },
            }
          : {}),
      });

      // extract response message
      const message = response.choices[0]?.message;
      const content = message?.content ?? '';
      const toolCalls = message?.tool_calls;

      // calculate elapsed time
      const elapsedMs = Date.now() - startedAt;

      // extract token usage from response
      const tokensInput = response.usage?.prompt_tokens ?? 0;
      const tokensOutput = response.usage?.completion_tokens ?? 0;
      const tokensCached =
        (
          response.usage as {
            prompt_tokens_details?: { cached_tokens?: number };
          }
        )?.prompt_tokens_details?.cached_tokens ?? 0;

      // calculate character counts
      const promptLength = promptIsToolExecutions
        ? JSON.stringify(askInput.prompt).length
        : (askInput.prompt as string).length;
      const charsInput = (systemPrompt?.length ?? 0) + promptLength;
      const charsOutput = content.length;

      // define size for metrics and cost calculation
      const size = {
        tokens: {
          input: tokensInput,
          output: tokensOutput,
          cache: { get: tokensCached, set: 0 },
        },
        chars: {
          input: charsInput,
          output: charsOutput,
          cache: { get: 0, set: 0 },
        },
      };

      // calculate cash costs via rhachet utility
      const { cash } = calcBrainOutputCost({
        for: { tokens: size.tokens },
        with: { cost: { cash: config.spec.cost.cash } },
      });

      // build metrics
      const metrics = new BrainOutputMetrics({
        size,
        cost: {
          time: { milliseconds: elapsedMs },
          cash,
        },
      });

      // handle tool calls if present
      if (toolCalls && toolCalls.length > 0) {
        // brain requested tool invocations
        const invocations: BrainPlugToolInvocation[] = toolCalls.map(
          (toolCall) => castFromTogetherToolCall({ toolCall }),
        );

        // build continuables for tool call exchange
        const { episode, series } = await genBrainContinuables({
          for: { grain: 'atom' },
          on: { episode: askInput.on?.episode ?? null, series: null },
          with: {
            exchange: {
              input: promptIsToolExecutions
                ? JSON.stringify(askInput.prompt)
                : (askInput.prompt as string),
              output: JSON.stringify(toolCalls),
              exid: response.id ?? null,
            },
            episode: { exid: response.id ?? null },
          },
        });

        // note: cast input because TypeScript can't verify conditional types at construction
        return new BrainOutput({
          output: null,
          calls: { tools: invocations },
          metrics,
          episode,
          series,
        } as unknown as BrainOutput<TOutput, 'atom', TPlugs>);
      }

      // no tool calls: parse JSON response and validate via schema
      const parsed = JSON.parse(content);
      const output = askInput.schema.output.parse(parsed);

      // build continuables (episode + series) for this invocation
      const { episode, series } = await genBrainContinuables({
        for: { grain: 'atom' },
        on: { episode: askInput.on?.episode ?? null, series: null },
        with: {
          exchange: {
            input: promptIsToolExecutions
              ? JSON.stringify(askInput.prompt)
              : (askInput.prompt as string),
            output: content,
            exid: response.id ?? null,
          },
          episode: { exid: response.id ?? null },
        },
      });

      // note: cast input because TypeScript can't verify conditional types at construction
      return new BrainOutput({
        output,
        calls: null,
        metrics,
        episode,
        series,
      } as unknown as BrainOutput<TOutput, 'atom', TPlugs>);
    },
  });
};
