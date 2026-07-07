// Moderador automático básico (ROADMAP Hub G).
// Bloqueia conteúdo com termos proibidos antes da publicação na comunidade.
// A lista pode ser estendida via env MODERATION_BLACKLIST (termos separados por vírgula).

const DEFAULT_BLACKLIST = [
  // palavrões e ofensas comuns
  'merda', 'bosta', 'caralho', 'porra', 'puta', 'putaria', 'viado',
  'arrombado', 'desgraçado', 'desgracado', 'vagabunda', 'vagabundo',
  'fdp', 'filho da puta', 'vai se foder', 'vsf', 'cuzão', 'cuzao',
  'otário', 'otario', 'imbecil', 'idiota', 'retardado', 'macaco',
  // fraude / golpes
  'compre sua vaga', 'venda de vaga', 'diploma comprado', 'comprar diploma',
  'dinheiro fácil', 'dinheiro facil', 'pix premiado', 'renda extra garantida',
  // assédio / conteúdo impróprio
  'nude', 'nudes', 'conteúdo adulto', 'conteudo adulto'
];

function normalize(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[0@]/g, 'o')
    .replace(/[1!]/g, 'i')
    .replace(/3/g, 'e')
    .replace(/4/g, 'a')
    .replace(/5/g, 's')
    .replace(/\s+/g, ' ');
}

function getBlacklist() {
  const extra = (process.env.MODERATION_BLACKLIST || '')
    .split(',')
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
  return [...DEFAULT_BLACKLIST, ...extra];
}

// Retorna { allowed, matches } — matches lista os termos encontrados.
function moderateText(...texts) {
  const normalized = normalize(texts.filter(Boolean).join(' '));
  const matches = getBlacklist().filter(term => {
    const normalizedTerm = normalize(term);
    // termos de uma palavra: casar palavra inteira; frases: substring
    if (!normalizedTerm.includes(' ')) {
      return new RegExp(`(^|[^a-z])${normalizedTerm}([^a-z]|$)`).test(normalized);
    }
    return normalized.includes(normalizedTerm);
  });

  return { allowed: matches.length === 0, matches };
}

module.exports = { moderateText };
