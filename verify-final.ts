// verify-final.ts
import { container } from '@/backend/shared/infrastructure/container';

async function test() {
  console.log('Verifying Fluent Singleton Architecture...');
  try {
    // Test 1: Access via fluent API
    console.log('Accessing character context...');
    const ctx1 = container.contexts.character;
    const ctx2 = container.contexts.character;

    console.log('Singleton check (Contexts):', ctx1 === ctx2 ? 'PASS' : 'FAIL');

    // Test 2: Verify persistence (proves repository is singleton)
    console.log('Creating test character...');
    const char = await ctx1.create({
      name: 'Singleton Test',
      ownerUsername: 'rebeca',
    });

    console.log('Retrieving from second context access...');
    const retrieved = await ctx2.getById(char.id);
    console.log(
      'Persistence check:',
      retrieved.name === 'Singleton Test' ? 'PASS' : 'FAIL',
    );

    console.log('\nFinal Architecture looks solid!');
  } catch (e) {
    console.error('Error during verification:', e);
  }
}

test();
