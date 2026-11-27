// Weighted decision matrix and sensitivity analysis. Scores are justified in 09-decision-matrix.md.
// Run: node docs/discovery/localization-infrastructure/scripts/decision-matrix.mjs
const criteria = [
  'finance',
  'maintenance',
  'capacity',
  'quality',
  'infra',
  'git',
  'licensing',
  'implementation',
  'community',
];
const base = {
  finance: 20,
  maintenance: 20,
  capacity: 15,
  quality: 10,
  infra: 10,
  git: 10,
  licensing: 5,
  implementation: 5,
  community: 5,
};
// E is disqualified (mandatory requirement: low maintenance for a solo developer); kept for reference.
const scores = {
  // Revised after the adversarial review: capacity now includes human review throughput (PR diffs
  // score lower than a review UI), implementation separates 8-16 h (5) from 20-55 h (4), and B's
  // infrastructure is scored on what already runs today (its dependence on the Libre plan is counted
  // once, under finance).
  'A Adopt (self-hosted Weblate)': [2, 3, 4, 3, 2, 4, 5, 5, 5],
  'B Extend (Weblate + local MT worker)': [4, 4, 4, 4, 5, 4, 5, 4, 5],
  'C Fork': [2, 1, 4, 3, 2, 4, 3, 1, 4],
  'D Standalone CLI engine (new project)': [5, 2, 3, 4, 5, 5, 5, 2, 2],
  'E Full platform (disqualified)': [3, 0, 4, 3, 2, 4, 5, 0, 4],
  'F GitHub-native (in-repo script + CI)': [5, 4, 3, 4, 5, 5, 5, 4, 2],
  'G Hybrid (F + optional Weblate UI)': [5, 3, 4, 4, 5, 5, 5, 4, 4],
};
const boost = (name, to) => {
  const rest = 100 - base[name];
  return Object.fromEntries(
    criteria.map((c) => [c, c === name ? to : (base[c] * (100 - to)) / rest]),
  );
};
const scenarios = {
  Base: base,
  'Finance 35%': boost('finance', 35),
  'Maintenance 35%': boost('maintenance', 35),
  'Community 20%': boost('community', 20),
};
for (const [label, w] of Object.entries(scenarios)) {
  console.log(`\n${label}`);
  Object.entries(scores)
    .map(([opt, s]) => [opt, s.reduce((sum, v, i) => sum + (v * w[criteria[i]]) / 100, 0)])
    .sort((a, b) => b[1] - a[1])
    .forEach(([opt, total]) => console.log(`  ${total.toFixed(2)}  ${opt}`));
}
