import type { BrainAtom } from 'rhachet';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';

/**
 * .what = returns all brain atoms provided by together ai
 * .why = enables consumers to register together ai atoms with genContextBrain
 */
export const getBrainAtomsByTogetherAI = (): BrainAtom[] => {
  return [
    genBrainAtom({ slug: 'together/qwen3/coder-next' }),
    genBrainAtom({ slug: 'together/qwen3/coder-480b' }),
    genBrainAtom({ slug: 'together/qwen3/235b' }),
    genBrainAtom({ slug: 'together/deepseek/v3.1' }),
    genBrainAtom({ slug: 'together/deepseek/r1' }),
    genBrainAtom({ slug: 'together/kimi/k2' }),
    genBrainAtom({ slug: 'together/kimi/k2.5' }),
    genBrainAtom({ slug: 'together/llama4/maverick' }),
    genBrainAtom({ slug: 'together/llama3.3/70b' }),
    genBrainAtom({ slug: 'together/glm/4.7' }),
  ];
};

// re-export factory for direct access
export { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
