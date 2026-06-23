import { BrainAtom } from 'rhachet';
import { given, then, when } from 'test-fns';

import { genBrainAtom } from '../../domain.operations/atom/genBrainAtom';
import { getBrainAtomsByTogetherAI } from './index';

describe('rhachet-brains-togetherai.unit', () => {
  given('[case1] getBrainAtomsByTogetherAI', () => {
    when('[t0] called', () => {
      then('returns array with 15 atoms', () => {
        const atoms = getBrainAtomsByTogetherAI();
        expect(atoms).toHaveLength(15);
      });

      then('returns BrainAtom instances', () => {
        const atoms = getBrainAtomsByTogetherAI();
        for (const atom of atoms) {
          expect(atom).toBeInstanceOf(BrainAtom);
        }
      });

      then('includes together/deepseek/v4-pro', () => {
        const atoms = getBrainAtomsByTogetherAI();
        const slugs = atoms.map((a: BrainAtom) => a.slug);
        expect(slugs).toContain('together/deepseek/v4-pro');
      });
    });
  });

  given('[case2] genBrainAtom factory', () => {
    when('[t0] called with together/deepseek/v4-pro slug', () => {
      const atom = genBrainAtom({ slug: 'together/deepseek/v4-pro' });

      then('returns BrainAtom instance', () => {
        expect(atom).toBeInstanceOf(BrainAtom);
      });

      then('has correct slug', () => {
        expect(atom.slug).toEqual('together/deepseek/v4-pro');
      });

      then('has correct repo', () => {
        expect(atom.repo).toEqual('together');
      });
    });
  });
});
