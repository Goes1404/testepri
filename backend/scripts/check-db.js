// Diagnóstico SOMENTE LEITURA do Supabase de produção: nenhuma escrita.
// Uso: node scripts/check-db.js (lê SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY do .env)
require('dotenv').config();

const URL_BASE = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, Prefer: 'count=exact' };

const EXPECTED_TABLES = [
  'users', 'user_profiles', 'universities', 'scholarships', 'cut_score_history',
  'applications', 'documents', 'notifications', 'audit_logs', 'alerts', 'deadlines',
  'events', 'event_registrations', 'community_posts', 'community_answers',
  'achievements', 'activity_log', 'vocational_results', 'quiz_sessions',
  'quiz_questions', 'push_tokens', 'nps_responses'
];

async function main() {
  const rest = await fetch(`${URL_BASE}/rest/v1/`, { headers });
  console.log('REST status:', rest.status);

  const bucketsRes = await fetch(`${URL_BASE}/storage/v1/bucket`, { headers });
  const buckets = await bucketsRes.json();
  console.log('Buckets:', Array.isArray(buckets) ? buckets.map(b => `${b.id}(public=${b.public})`).join(', ') : JSON.stringify(buckets));

  const missing = [];
  for (const table of EXPECTED_TABLES) {
    const res = await fetch(`${URL_BASE}/rest/v1/${table}?select=*&limit=0`, { headers });
    if (res.ok) {
      const range = res.headers.get('content-range') || '';
      const count = range.split('/')[1] || '?';
      console.log(`  ${table}: OK (${count} linhas)`);
    } else {
      missing.push(table);
      console.log(`  ${table}: AUSENTE (${res.status})`);
    }
  }
  console.log('\nResumo — tabelas ausentes:', missing.join(', ') || 'nenhuma');
}

main().catch(err => { console.error('ERRO:', err.message); process.exit(1); });
