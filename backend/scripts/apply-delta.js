// Aplica supabase/delta_producao.sql no banco de produção.
// Credenciais via .env (SUPABASE_URL + SUPABASE_DB_PASSWORD). Nenhum segredo em linha de comando.
// Tenta conexão direta e poolers regionais (redes IPv4 domésticas não alcançam o host direto IPv6).
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const REF = new URL(process.env.SUPABASE_URL).hostname.split('.')[0];
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;

if (!PASSWORD) {
  console.error('SUPABASE_DB_PASSWORD ausente no .env');
  process.exit(1);
}

const CANDIDATES = [
  { host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres' },
  { host: 'aws-0-sa-east-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { host: 'aws-1-sa-east-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { host: 'aws-1-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { host: 'aws-0-us-east-2.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { host: 'aws-0-us-west-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` }
];

// CA da Supabase fixado (gerar antes com: node scripts/fetch-supabase-ca.js)
function loadCa() {
  const caPath = path.join(__dirname, '..', '..', 'supabase', 'supabase-ca.pem');
  return fs.existsSync(caPath) ? fs.readFileSync(caPath, 'utf8') : null;
}

async function connect() {
  // TLS com verificação estrita sempre; usa CA fixado quando disponível
  const ca = loadCa();
  for (const cand of CANDIDATES) {
    const client = new Client({
      host: cand.host,
      port: cand.port,
      user: cand.user,
      password: PASSWORD,
      database: 'postgres',
      ssl: ca ? { ca } : true,
      connectionTimeoutMillis: 8000
    });
    try {
      await client.connect();
      console.log(`Conectado via ${cand.host} (${cand.user})`);
      return client;
    } catch (err) {
      console.log(`  ${cand.host}: ${err.message}`);
      try { await client.end(); } catch (e) {}
    }
  }
  throw new Error('Nenhum host de conexão funcionou. Verifique senha/rede.');
}

async function main() {
  const sqlPath = path.join(__dirname, '..', '..', 'supabase', 'delta_producao.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = await connect();
  try {
    await client.query('begin');
    const result = await client.query(sql);
    await client.query('commit');

    // último statement do delta lista as tabelas
    const results = Array.isArray(result) ? result : [result];
    const last = results[results.length - 1];
    if (last && last.rows) {
      console.log(`\nTabelas no schema public (${last.rows.length}):`);
      console.log(last.rows.map(r => r.table_name).join(', '));
    }
    console.log('\nDELTA APLICADO COM SUCESSO.');
  } catch (err) {
    await client.query('rollback').catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

main().catch(err => { console.error('ERRO:', err.message); process.exit(1); });
