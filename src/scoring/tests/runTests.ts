/**
 * Standalone test runner script for command-line execution (`npm test` / `tsx src/scoring/tests/runTests.ts`).
 */

import { TEST_SUITE } from './testCases.ts';

console.log('====================================================');
console.log('🧪 RUNNING FRAUD RISK TRIAGE UNIT TESTS');
console.log('====================================================\n');

let passedCount = 0;
let failedCount = 0;
const startTime = performance.now();

for (const test of TEST_SUITE) {
  const testStart = performance.now();
  try {
    const result = test.run();
    const duration = (performance.now() - testStart).toFixed(2);
    if (result.passed) {
      console.log(`✅ [PASS] ${test.name} (${duration}ms)`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${test.name} (${duration}ms)`);
      console.error(`   Expected: ${result.expectedSummary}`);
      console.error(`   Actual:   ${JSON.stringify(result.actual, null, 2)}`);
      failedCount++;
    }
  } catch (err: any) {
    const duration = (performance.now() - testStart).toFixed(2);
    console.error(`💥 [ERROR] ${test.name} threw unexpectedly (${duration}ms):`, err?.message || err);
    failedCount++;
  }
}

const totalDuration = (performance.now() - startTime).toFixed(2);

console.log('\n----------------------------------------------------');
console.log(`Test Summary: ${passedCount} passed, ${failedCount} failed (${totalDuration}ms total)`);
console.log('----------------------------------------------------');

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 All test cases passed successfully!\n');
}
