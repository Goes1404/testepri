// Extrai a cadeia de certificados TLS do pooler Supabase e salva o CA raiz em
// supabase/supabase-ca.pem, para que as conexões Postgres usem verificação
// ESTRITA com CA fixado (cert pinning / trust-on-first-use).
//
// IMPORTANTE: este probe NÃO envia credencial nenhuma — apenas abre o handshake
// TLS, lê a cadeia de certificados apresentada pelo servidor e encerra.
const tls = require('tls');
const fs = require('fs');
const path = require('path');

const HOSTS = [
  'aws-0-sa-east-1.pooler.supabase.com',
  'aws-1-sa-east-1.pooler.supabase.com',
  'aws-0-us-east-1.pooler.supabase.com'
];

function derToPem(der) {
  const b64 = der.toString('base64').match(/.{1,64}/g).join('\n');
  return `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----\n`;
}

const net = require('net');

function probe(host) {
  return new Promise((resolve, reject) => {
    // Postgres usa STARTTLS: abre TCP, envia SSLRequest (8 bytes), espera 'S',
    // e só então faz o handshake TLS. Nenhuma credencial é enviada — o probe
    // encerra logo após ler a cadeia de certificados, que passa a ser o CA
    // fixado para as conexões reais com verificação estrita.
    const raw = net.connect({ host, port: 5432, timeout: 8000 }, () => {
      // SSLRequest: comprimento 8 + código 80877103 (0x04D2162F)
      raw.write(Buffer.from([0x00, 0x00, 0x00, 0x08, 0x04, 0xd2, 0x16, 0x2f]));
    });
    raw.once('data', byte => {
      if (byte.toString('latin1')[0] !== 'S') {
        raw.destroy();
        return reject(new Error('Servidor recusou TLS (resposta ' + byte.toString('latin1')[0] + ')'));
      }
      const socket = tls.connect({ socket: raw, rejectUnauthorized: false, timeout: 8000 }, () => {
        const chain = [];
        let cert = socket.getPeerCertificate(true);
        const seen = new Set();
        while (cert && cert.raw && !seen.has(cert.fingerprint256)) {
          seen.add(cert.fingerprint256);
          chain.push({ subject: cert.subject?.CN, issuer: cert.issuer?.CN, pem: derToPem(cert.raw) });
          cert = cert.issuerCertificate;
        }
        socket.end();
        resolve(chain);
      });
      socket.on('error', reject);
    });
    raw.on('error', reject);
    raw.on('timeout', () => { raw.destroy(); reject(new Error('timeout')); });
  });
}

async function main() {
  for (const host of HOSTS) {
    try {
      const chain = await probe(host);
      if (!chain.length) continue;
      console.log(`Cadeia obtida de ${host}:`);
      chain.forEach(c => console.log(`  subject=${c.subject} issuer=${c.issuer}`));
      // salva a cadeia completa (root + intermediários) como bundle de CA
      const bundle = chain.map(c => c.pem).join('');
      const out = path.join(__dirname, '..', '..', 'supabase', 'supabase-ca.pem');
      fs.writeFileSync(out, bundle);
      console.log(`\nCA bundle salvo em ${out}`);
      return;
    } catch (err) {
      console.log(`${host}: ${err.message}`);
    }
  }
  process.exit(1);
}

main();
