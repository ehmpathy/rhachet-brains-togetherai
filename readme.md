# rhachet-brains-togetherai

rhachet brain.atom adapter for together ai open-source models

## install

```sh
npm install rhachet-brains-togetherai
```

## usage

```ts
import { genBrainAtom } from 'rhachet-brains-togetherai';
import { z } from 'zod';

// create a brain atom for direct model inference
const brainAtom = genBrainAtom({ slug: 'together/qwen3/coder-next' });

// simple string output
const { output: explanation } = await brainAtom.ask({
  role: { briefs: [] },
  prompt: 'explain this code',
  schema: { output: z.string() },
});

// structured object output
const { output: { summary, issues } } = await brainAtom.ask({
  role: { briefs: [] },
  prompt: 'analyze this code',
  schema: { output: z.object({ summary: z.string(), issues: z.array(z.string()) }) },
});
```

## available brains

### atoms (via genBrainAtom)

stateless inference without tool use.

| slug | model id | context | swe-bench | input | output |
| --- | --- | --- | --- | --- | --- |
| `together/qwen3/coder-next` | Qwen/Qwen3-Coder-Next-FP8 | 262K | 74.2% | $0.50/1M | $1.20/1M |
| `together/qwen3/coder-480b` | Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8 | 262K | 69.6% | $2.00/1M | $2.00/1M |
| `together/qwen3/235b` | Qwen/Qwen3-235B-A22B-Instruct-2507-tput | 131K | — | $0.20/1M | $0.60/1M |
| `together/deepseek/v3.1` | deepseek-ai/DeepSeek-V3.1 | 128K | — | $1.25/1M | $1.25/1M |
| `together/deepseek/r1` | deepseek-ai/DeepSeek-R1 | 128K | — | $3.00/1M | $7.00/1M |
| `together/kimi/k2` | moonshotai/Kimi-K2-Instruct | 128K | — | $1.00/1M | $3.00/1M |
| `together/kimi/k2.5` | moonshotai/Kimi-K2.5 | 128K | 76.8% | $0.50/1M | $2.80/1M |
| `together/llama4/maverick` | meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8 | 1M | — | $0.27/1M | $0.85/1M |
| `together/llama3.3/70b` | meta-llama/Llama-3.3-70B-Instruct-Turbo | 128K | — | $0.88/1M | $0.88/1M |
| `together/glm/4.7` | zai-org/GLM-4.7 | 128K | 73.8% | $0.45/1M | $2.00/1M |

## environment

requires `TOGETHER_API_KEY` environment variable.

get your api key at https://api.together.xyz/settings/api-keys

## sources

- [together ai api docs](https://docs.together.ai/reference/chat-completions-1)
- [together ai models](https://docs.together.ai/docs/serverless-models)
- [together ai rates](https://www.together.ai/rates)
