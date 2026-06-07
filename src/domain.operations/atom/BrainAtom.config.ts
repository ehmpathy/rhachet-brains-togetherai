import { asIsoPrice, dividePrice } from 'iso-price';
import { BrainSpec } from 'rhachet';

/**
 * .what = atom config type
 * .why = shared type for model configs
 */
export type BrainAtomConfig = {
  model: string;
  description: string;
  spec: BrainSpec;
};

/**
 * .what = supported together ai atom slugs
 * .why = enables type-safe slug specification with model variants
 */
export type TogetherBrainAtomSlug =
  // qwen family (serverless)
  | 'together/qwen3/235b'
  | 'together/qwen3.5/9b'
  | 'together/qwen3.5/397b'
  | 'together/qwen3.6/plus'
  | 'together/qwen3.7/max'
  // deepseek family (serverless)
  | 'together/deepseek/v4-pro'
  // kimi family (serverless)
  | 'together/kimi/k2.6'
  // llama family (serverless)
  | 'together/llama3.3/70b'
  // glm family (serverless)
  | 'together/glm/5'
  | 'together/glm/5.1'
  // gemma family
  | 'together/gemma4/31b'
  // liquid family
  | 'together/lfm2/24b'
  // openai oss
  | 'together/gpt-oss/20b'
  | 'together/gpt-oss/120b';

/**
 * .what = model configuration by slug
 * .why = maps slugs to api model names, descriptions, and specs
 *
 * .sources:
 *   - rates: https://www.together.ai/pricing
 *   - models: https://docs.together.ai/docs/serverless-models
 *   - api docs: https://docs.together.ai/reference/chat-completions-1
 */
export const CONFIG_BY_ATOM_SLUG: Record<
  TogetherBrainAtomSlug,
  BrainAtomConfig
> = {
  /**
   * qwen3-235b
   * .sources:
   *   - rates: https://www.together.ai/pricing ($0.20/1M input, $0.60/1M output)
   *   - context: 131K
   *   - architecture: 235B total, 22B active (moe)
   */
  'together/qwen3/235b': {
    model: 'Qwen/Qwen3-235B-A22B-Instruct-2507-tput',
    description: 'qwen3-235b - general purpose (131K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 120, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.20', by: 1_000_000 }), // $0.20/1M tokens
          output: dividePrice({ of: '$0.60', by: 1_000_000 }), // $0.60/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 131_000 } }, // 131K context
        grades: {},
        cutoff: '2025-07-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * llama-3.3-70b
   * .sources:
   *   - rates: https://www.together.ai/pricing ($0.88/1M input, $1.04/1M output)
   *   - context: 128K
   *   - architecture: 70B dense
   */
  'together/llama3.3/70b': {
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    description: 'llama-3.3-70b - balanced dense model (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 150, per: { seconds: 1 } },
          latency: { seconds: 0.4 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.88', by: 1_000_000 }), // $0.88/1M tokens
          output: dividePrice({ of: '$1.04', by: 1_000_000 }), // $1.04/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2024-12-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  // ============================================================================
  // new models (2026-06 bump)
  // ============================================================================

  /**
   * qwen3.5-9b
   * .sources:
   *   - model: https://www.together.ai/models/qwen3-5-9b
   *   - rates: $0.17/1M input, $0.25/1M output
   *   - context: 262K
   *   - architecture: 9B dense
   */
  'together/qwen3.5/9b': {
    model: 'Qwen/Qwen3.5-9B',
    description: 'qwen3.5-9b - cheap small model (262K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 200, per: { seconds: 1 } },
          latency: { seconds: 0.3 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.17', by: 1_000_000 }), // $0.17/1M tokens
          output: dividePrice({ of: '$0.25', by: 1_000_000 }), // $0.25/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 262_000 } }, // 262K context
        grades: {},
        cutoff: '2026-01-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * qwen3.5-397b
   * .sources:
   *   - model: https://www.together.ai/models/qwen3-5-397b-a17b
   *   - rates: $0.60/1M input, $3.60/1M output
   *   - context: 262K
   *   - swe-bench: 76.4% verified
   *   - architecture: 397B total, 17B active (moe)
   */
  'together/qwen3.5/397b': {
    model: 'Qwen/Qwen3.5-397B-A17B',
    description: 'qwen3.5-397b - large moe with vision (262K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.60', by: 1_000_000 }), // $0.60/1M tokens
          output: dividePrice({ of: '$3.60', by: 1_000_000 }), // $3.60/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 262_000 } }, // 262K context
        grades: { swe: 76.4 }, // 76.4% swe-bench verified
        cutoff: '2026-01-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * qwen3.6-plus
   * .sources:
   *   - model: https://www.together.ai/models/qwen3-6-plus
   *   - rates: $0.40/1M input, $1.60/1M output
   *   - context: 262K
   */
  'together/qwen3.6/plus': {
    model: 'Qwen/Qwen3.6-Plus',
    description: 'qwen3.6-plus - balanced (262K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 100, per: { seconds: 1 } },
          latency: { seconds: 0.6 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.40', by: 1_000_000 }), // $0.40/1M tokens
          output: dividePrice({ of: '$1.60', by: 1_000_000 }), // $1.60/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 262_000 } }, // 262K context
        grades: {},
        cutoff: '2026-03-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * qwen3.7-max
   * .sources:
   *   - model: https://www.together.ai/models/qwen3-7-max
   *   - rates: $0.80/1M input, $2.40/1M output
   *   - context: 262K
   */
  'together/qwen3.7/max': {
    model: 'Qwen/Qwen3.7-Max',
    description: 'qwen3.7-max - balanced flagship (262K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 90, per: { seconds: 1 } },
          latency: { seconds: 0.8 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.80', by: 1_000_000 }), // $0.80/1M tokens
          output: dividePrice({ of: '$2.40', by: 1_000_000 }), // $2.40/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 262_000 } }, // 262K context
        grades: {},
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * deepseek-v4-pro
   * .sources:
   *   - model: https://www.together.ai/models/deepseek-v4-pro
   *   - rates: $2.10/1M input, $4.40/1M output, cache: $0.20/1M
   *   - context: 512K
   *   - swe-bench: 80.6% verified
   *   - architecture: 1.6T total, 49B active (moe)
   */
  'together/deepseek/v4-pro': {
    model: 'deepseek-ai/DeepSeek-V4-Pro',
    description: 'deepseek-v4-pro - frontier code (512K, 80.6% swe)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1.2 },
        },
        cash: {
          per: 'token',
          cache: {
            get: dividePrice({ of: '$0.20', by: 1_000_000 }), // $0.20/1M cached
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$2.10', by: 1_000_000 }), // $2.10/1M tokens
          output: dividePrice({ of: '$4.40', by: 1_000_000 }), // $4.40/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 512_000 } }, // 512K context
        grades: { swe: 80.6 }, // 80.6% swe-bench verified
        cutoff: '2026-04-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * kimi-k2.6
   * .sources:
   *   - model: https://www.together.ai/models/kimi-k26
   *   - rates: $1.20/1M input, $4.50/1M output, cache: $0.20/1M
   *   - context: 256K
   *   - swe-bench: 80.2% verified
   *   - architecture: 1T total, 32B active (moe)
   */
  'together/kimi/k2.6': {
    model: 'moonshotai/Kimi-K2.6',
    description: 'kimi-k2.6 - frontier code (256K, 80.2% swe)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 90, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: {
            get: dividePrice({ of: '$0.20', by: 1_000_000 }), // $0.20/1M cached
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$1.20', by: 1_000_000 }), // $1.20/1M tokens
          output: dividePrice({ of: '$4.50', by: 1_000_000 }), // $4.50/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 256_000 } }, // 256K context
        grades: { swe: 80.2 }, // 80.2% swe-bench verified
        cutoff: '2026-05-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * glm-5
   * .sources:
   *   - model: https://www.together.ai/models/glm-5
   *   - rates: $1.00/1M input, $3.00/1M output
   *   - context: 200K
   *   - architecture: 744B total, 40B active (moe)
   */
  'together/glm/5': {
    model: 'zai-org/GLM-5',
    description: 'glm-5 - frontier (200K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 90, per: { seconds: 1 } },
          latency: { seconds: 0.9 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$1.00', by: 1_000_000 }), // $1.00/1M tokens
          output: dividePrice({ of: '$3.00', by: 1_000_000 }), // $3.00/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 200_000 } }, // 200K context
        grades: {},
        cutoff: '2026-02-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * glm-5.1
   * .sources:
   *   - model: https://www.together.ai/models/glm-51
   *   - rates: $1.40/1M input, $4.40/1M output
   *   - context: 200K
   *   - swe-bench: 77.8% verified
   *   - architecture: 754B total, 40B active (moe)
   */
  'together/glm/5.1': {
    model: 'zai-org/GLM-5.1',
    description: 'glm-5.1 - frontier code (200K, 77.8% swe)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 80, per: { seconds: 1 } },
          latency: { seconds: 1 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$1.40', by: 1_000_000 }), // $1.40/1M tokens
          output: dividePrice({ of: '$4.40', by: 1_000_000 }), // $4.40/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 200_000 } }, // 200K context
        grades: { swe: 77.8 }, // 77.8% swe-bench verified
        cutoff: '2026-02-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * gemma-4-31b
   * .sources:
   *   - model: https://www.together.ai/models/gemma-4-31b
   *   - rates: $0.39/1M input, $0.97/1M output
   *   - context: 256K
   *   - vision: supported
   */
  'together/gemma4/31b': {
    model: 'google/gemma-4-31B-it',
    description: 'gemma4-31b - vision capable (256K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 120, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.39', by: 1_000_000 }), // $0.39/1M tokens
          output: dividePrice({ of: '$0.97', by: 1_000_000 }), // $0.97/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 256_000 } }, // 256K context
        grades: {},
        cutoff: '2026-03-01',
        domain: 'ALL',
        skills: { tooluse: true },
      },
    }),
  },
  /**
   * lfm2-24b
   * .sources:
   *   - model: https://www.together.ai/models/lfm2-24b-a2b
   *   - rates: $0.03/1M input, $0.12/1M output
   *   - context: 32K
   *   - architecture: 24B total, 2B active (moe)
   */
  'together/lfm2/24b': {
    model: 'LiquidAI/LFM2-24B-A2B',
    description: 'lfm2-24b - ultra cheap (32K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 200, per: { seconds: 1 } },
          latency: { seconds: 0.2 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.03', by: 1_000_000 }), // $0.03/1M tokens
          output: dividePrice({ of: '$0.12', by: 1_000_000 }), // $0.12/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 32_000 } }, // 32K context
        grades: {},
        cutoff: '2026-01-01',
        domain: 'ALL',
        skills: { tooluse: false }, // tool use not confirmed
      },
    }),
  },
  /**
   * gpt-oss-20b
   * .sources:
   *   - model: https://www.together.ai/models/gpt-oss-20b
   *   - rates: $0.05/1M input, $0.20/1M output
   *   - context: 128K
   */
  'together/gpt-oss/20b': {
    model: 'openai/gpt-oss-20b',
    description: 'gpt-oss-20b - cheap openai-style (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 180, per: { seconds: 1 } },
          latency: { seconds: 0.3 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.05', by: 1_000_000 }), // $0.05/1M tokens
          output: dividePrice({ of: '$0.20', by: 1_000_000 }), // $0.20/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2026-01-01',
        domain: 'ALL',
        skills: { tooluse: false }, // tool use not confirmed
      },
    }),
  },
  /**
   * gpt-oss-120b
   * .sources:
   *   - model: https://www.together.ai/models/gpt-oss-120b
   *   - rates: $0.40/1M input, $1.20/1M output
   *   - context: 128K
   */
  'together/gpt-oss/120b': {
    model: 'openai/gpt-oss-120b',
    description: 'gpt-oss-120b - mid-tier openai-style (128K)',
    spec: new BrainSpec({
      cost: {
        time: {
          speed: { tokens: 100, per: { seconds: 1 } },
          latency: { seconds: 0.5 },
        },
        cash: {
          per: 'token',
          cache: {
            get: asIsoPrice('$0'),
            set: asIsoPrice('$0'),
          },
          input: dividePrice({ of: '$0.40', by: 1_000_000 }), // $0.40/1M tokens
          output: dividePrice({ of: '$1.20', by: 1_000_000 }), // $1.20/1M tokens
        },
      },
      gain: {
        size: { context: { tokens: 128_000 } }, // 128K context
        grades: {},
        cutoff: '2026-01-01',
        domain: 'ALL',
        skills: { tooluse: false }, // tool use not confirmed
      },
    }),
  },
};
