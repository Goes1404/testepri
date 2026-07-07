// Virus scanning for uploaded documents (Roadmap Fase Final 1, item 2).
//
// Production setup: point CLAMAV_HOST/CLAMAV_PORT at a running clamd daemon
// (ClamAV) and install the optional `clamscan` package. Without a reachable
// daemon, this falls back to EICAR test-string signature detection only —
// that is sufficient to prove the reject path works, but it will NOT catch
// real malware. Do not treat the fallback as a production-grade AV.
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
const { Readable } = require('stream');

let clamscanClientPromise = null;

function getClamscanClient() {
  if (!process.env.CLAMAV_HOST) return null;
  if (!clamscanClientPromise) {
    clamscanClientPromise = (async () => {
      const NodeClam = require('clamscan');
      const clamscan = await new NodeClam().init({
        clamscan: {
          active: false
        },
        clamdscan: {
          host: process.env.CLAMAV_HOST,
          port: parseInt(process.env.CLAMAV_PORT || '3310', 10),
          timeout: 30000,
          localFallback: false
        },
        preference: 'clamdscan'
      });
      return clamscan;
    })();
  }
  return clamscanClientPromise;
}

// Returns { clean: boolean, engine: 'clamav'|'eicar-fallback', virusName: string|null }
async function scanBuffer(buffer) {
  const clamscanPromise = getClamscanClient();

  if (clamscanPromise) {
    try {
      const clamscan = await clamscanPromise;
      const { isInfected, viruses = [] } = await clamscan.scanStream(Readable.from([buffer]));
      return {
        clean: !isInfected,
        engine: 'clamav',
        virusName: isInfected ? viruses.join(', ') : null
      };
    } catch (err) {
      throw new Error(`ClamAV scan failed: ${err.message}`);
    }
  }

  const isEicar = buffer.toString('utf8').includes(EICAR_SIGNATURE);
  return {
    clean: !isEicar,
    engine: 'eicar-fallback',
    virusName: isEicar ? 'Eicar-Test-Signature' : null
  };
}

module.exports = { scanBuffer, EICAR_SIGNATURE };
