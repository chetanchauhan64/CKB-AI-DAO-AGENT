

/**
 * Simple script to test the Agent API connection from a local Node environment
 * Usage: npx ts-node testApi.ts
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';

async function main() {
  console.log('🔍 Testing connection to CKB DAO Agent Backend...');
  console.log(`📡 URL: ${API_BASE}/api/v1/health`);

  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) {
      console.log('✅ Backend is reachable.');
    } else {
      console.error(`❌ Backend returned status: ${res.status}`);
    }
  } catch (err) {
    console.error('❌ Could not connect to the backend. Is it running on port 3001?');
  }
}

main().catch(console.error);
