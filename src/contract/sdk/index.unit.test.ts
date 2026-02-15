import { BrainAtom } from 'rhachet';
import { given, then, when } from 'test-fns';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
import { getBrainAtomsByTogetherAI } from './index';

describe('rhachet-brains-togetherai.unit', () => {
  given('[case1] getBrainAtomsByTogetherAI', () => {
    when('[t0] called', () => {
      then('returns array with 10 atoms', () => {
        const atoms = getBrainAtomsByTogetherAI();
        expect(atoms).toHaveLength(10);
      });

      then('returns BrainAtom instances', () => {
        const atoms = getBrainAtomsByTogetherAI();
        for (const atom of atoms) {
          expect(atom).toBeInstanceOf(BrainAtom);
        }
      });

      then('includes together/qwen3/coder-next', () => {
        const atoms = getBrainAtomsByTogetherAI();
        const slugs = atoms.map((a: BrainAtom) => a.slug);
        expect(slugs).toContain('together/qwen3/coder-next');
      });
    });
  });

  given('[case2] genBrainAtom factory', () => {
    when('[t0] called with together/qwen3/coder-next slug', () => {
      const atom = genBrainAtom({ slug: 'together/qwen3/coder-next' });

      then('returns BrainAtom instance', () => {
        expect(atom).toBeInstanceOf(BrainAtom);
      });

      then('has correct slug', () => {
        expect(atom.slug).toEqual('together/qwen3/coder-next');
      });

      then('has correct repo', () => {
        expect(atom.repo).toEqual('together');
      });
    });
  });
});
