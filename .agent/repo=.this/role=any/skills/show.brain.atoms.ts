#!/usr/bin/env npx tsx
/**
 * .what = show brain atoms table with cost, grades, and tier ranks
 * .why = quick reference for model selection with frontier vs cheapfast tiers
 *
 * usage:
 *   npx tsx .agent/repo=.this/role=any/skills/show.brain.atoms.ts
 */

import { multiplyPrice, asIsoPriceHuman } from 'iso-price';
import {
  CONFIG_BY_ATOM_SLUG,
  type TogetherBrainAtomSlug,
} from '../../../../src/domain.operations/atom/BrainAtom.config';

// extract cost and grades from each atom
type AtomRow = {
  slug: TogetherBrainAtomSlug;
  contextK: number;
  inputPer1M: string;
  outputPer1M: string;
  cachePer1M: string;
  inputPer1MNum: number;
  outputPer1MNum: number;
  sweVerified: number | null;
};

const rows: AtomRow[] = Object.entries(CONFIG_BY_ATOM_SLUG).map(
  ([slug, config]) => {
    const spec = config.spec;
    const cash = spec.cost.cash;
    const gain = spec.gain;

    // multiply per-token price by 1M to get per-1M price
    const inputPer1M = multiplyPrice({ of: cash.input, by: 1_000_000 });
    const outputPer1M = multiplyPrice({ of: cash.output, by: 1_000_000 });
    const cachePer1M = multiplyPrice({ of: cash.cache.get, by: 1_000_000 });

    // parse numeric values for sort/rank
    const inputPer1MNum = parseFloat(asIsoPriceHuman(inputPer1M).replace(/[^0-9.]/g, ''));
    const outputPer1MNum = parseFloat(asIsoPriceHuman(outputPer1M).replace(/[^0-9.]/g, ''));

    // context in K
    const contextK = Math.round(gain.size.context.tokens / 1000);

    // swe-bench verified score (if available)
    const sweVerified =
      gain.grades && typeof gain.grades.swe === 'number'
        ? gain.grades.swe
        : null;

    return {
      slug: slug as TogetherBrainAtomSlug,
      contextK,
      inputPer1M,
      outputPer1M,
      cachePer1M,
      inputPer1MNum,
      outputPer1MNum,
      sweVerified,
    };
  },
);

// calculate tiers based on 2% threshold
const assignTiers = (
  items: { slug: string; value: number }[],
  ascending: boolean, // true = lower is better (cost), false = higher is better (score)
): Record<string, string> => {
  const sorted = [...items].sort((a, b) =>
    ascending ? a.value - b.value : b.value - a.value,
  );

  const tiers: Record<string, string> = {};
  const medals = ['🥇', '🥈', '🥉'];
  let currentTier = 0;
  let prevValue: number | null = null;

  for (const item of sorted) {
    if (currentTier >= 3) break; // only top 3 tiers

    if (prevValue === null) {
      tiers[item.slug] = medals[currentTier]!;
      prevValue = item.value;
    } else {
      // check if within 2% of previous tier leader
      const threshold = Math.abs(prevValue * 0.02);
      const diff = Math.abs(item.value - prevValue);

      if (diff <= threshold) {
        // same tier
        tiers[item.slug] = medals[currentTier]!;
      } else {
        // new tier
        currentTier++;
        if (currentTier < 3) {
          tiers[item.slug] = medals[currentTier]!;
          prevValue = item.value;
        }
      }
    }
  }

  return tiers;
};

// frontier tiers (higher swe score = better)
const modelsWithSwe = rows.filter((r) => r.sweVerified !== null);
const frontierTiers = assignTiers(
  modelsWithSwe.map((r) => ({ slug: r.slug, value: r.sweVerified! })),
  false, // higher is better
);

// cheapfast tiers (lower total cost = better)
// use input + output as proxy for "cheap"
const cheapfastTiers = assignTiers(
  rows.map((r) => ({
    slug: r.slug,
    value: r.inputPer1MNum + r.outputPer1MNum,
  })),
  true, // lower is better
);

// format fns
const fmtPrice = (isoPrice: string): string => {
  const human = asIsoPriceHuman(isoPrice);
  if (human === '$0.00') return '-';
  // extract numeric value and format to 2 decimals
  const num = parseFloat(human.replace(/[^0-9.]/g, ''));
  return `$${num.toFixed(2)}`;
};

const fmtContext = (k: number): string => {
  if (k >= 1000) return `${(k / 1000).toFixed(0)}M`;
  return `${k}K`;
};

const fmtSwe = (val: number | null): string => {
  if (val === null) return '-';
  return `${val.toFixed(1)}%`;
};

// print table
console.log('');
console.log('together.ai brain atoms');
console.log('========================');
console.log('');

// header
const header = [
  'model'.padEnd(28),
  'tier'.padEnd(6),
  'ctx'.padStart(6),
  'in $/1M'.padStart(9),
  'out $/1M'.padStart(10),
  'cache'.padStart(8),
  'swe%'.padStart(7),
].join(' | ');

console.log(header);
console.log('-'.repeat(header.length));

// sort by swe score desc (with scores first, then without)
const sortedRows = [...rows].sort((a, b) => {
  if (a.sweVerified !== null && b.sweVerified !== null) {
    return b.sweVerified - a.sweVerified;
  }
  if (a.sweVerified !== null) return -1;
  if (b.sweVerified !== null) return 1;
  return a.inputPer1MNum - b.inputPer1MNum;
});

for (const row of sortedRows) {
  // determine tier badge
  const frontier = frontierTiers[row.slug] ?? '';
  const cheap = cheapfastTiers[row.slug] ?? '';
  const tier = frontier || cheap || '  ';

  const line = [
    row.slug.replace('together/', '').padEnd(28),
    tier.padEnd(6),
    fmtContext(row.contextK).padStart(6),
    fmtPrice(row.inputPer1M).padStart(9),
    fmtPrice(row.outputPer1M).padStart(10),
    fmtPrice(row.cachePer1M).padStart(8),
    fmtSwe(row.sweVerified).padStart(7),
  ].join(' | ');

  console.log(line);
}

console.log('');
console.log('tier legend:');
console.log('  frontier (swe score): 🥇🥈🥉 = top 3 tiers by swe-bench verified');
console.log('  cheapfast (cost):     🥇🥈🥉 = top 3 tiers by input+output cost');
console.log('  models within 2% of tier leader share same medal');
console.log('');
