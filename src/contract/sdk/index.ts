import type { BrainAtom } from 'rhachet';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

/**
 * .what = returns all brain atoms provided by together ai
 * .why = enables consumers to register together ai atoms with genContextBrain
 */
export const getBrainAtomsByTogetherAI = (): BrainAtom[] => {
  return [
    // qwen family (serverless)
    genBrainAtom({ slug: 'together/qwen3/235b' }),
    genBrainAtom({ slug: 'together/qwen3.5/9b' }),
    genBrainAtom({ slug: 'together/qwen3.5/397b' }),
    genBrainAtom({ slug: 'together/qwen3.6/plus' }),
    genBrainAtom({ slug: 'together/qwen3.7/max' }),
    // deepseek family (serverless)
    genBrainAtom({ slug: 'together/deepseek/v4-pro' }),
    // kimi family (serverless)
    genBrainAtom({ slug: 'together/kimi/k2.6' }),
    // llama family (serverless)
    genBrainAtom({ slug: 'together/llama3.3/70b' }),
    // glm family (serverless)
    genBrainAtom({ slug: 'together/glm/5' }),
    genBrainAtom({ slug: 'together/glm/5.1' }),
    // gemma family
    genBrainAtom({ slug: 'together/gemma4/31b' }),
    // liquid family
    genBrainAtom({ slug: 'together/lfm2/24b' }),
    // openai oss
    genBrainAtom({ slug: 'together/gpt-oss/20b' }),
    genBrainAtom({ slug: 'together/gpt-oss/120b' }),
  ];
};

// re-export factory for direct access
export { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
