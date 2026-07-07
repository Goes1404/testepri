const test = require('node:test');
const assert = require('node:assert');
const { buildIcs } = require('../src/routes/events');

const sampleEvent = {
  id: 'evt-1',
  titulo: 'Portas Abertas USP',
  descricao: 'Visite o campus; converse com bolsistas, tire dúvidas.',
  data: '2026-07-28',
  horario: '09:00',
  local: 'Cidade Universitária',
  cidade: 'São Paulo',
  estado: 'SP',
  universidade: 'USP'
};

test('buildIcs produces a valid VCALENDAR envelope', () => {
  const ics = buildIcs(sampleEvent);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR'));
  assert.ok(ics.endsWith('END:VCALENDAR'));
  assert.ok(ics.includes('BEGIN:VEVENT'));
  assert.ok(ics.includes('END:VEVENT'));
  assert.ok(ics.includes('UID:evt-1@portal-do-aluno'));
});

test('buildIcs converts BRT (-03:00) start time to UTC', () => {
  const ics = buildIcs(sampleEvent);
  // 09:00 -03:00 == 12:00Z
  assert.ok(ics.includes('DTSTART:20260728T120000Z'));
  // duração padrão de 2h
  assert.ok(ics.includes('DTEND:20260728T140000Z'));
});

test('buildIcs escapes commas and semicolons in text fields', () => {
  const ics = buildIcs(sampleEvent);
  assert.ok(ics.includes('DESCRIPTION:Visite o campus\\; converse com bolsistas\\, tire dúvidas.'));
  assert.ok(ics.includes('LOCATION:Cidade Universitária - São Paulo/SP'));
});

test('buildIcs uses CRLF line endings per RFC 5545', () => {
  const ics = buildIcs(sampleEvent);
  assert.ok(ics.includes('\r\n'));
  assert.ok(!/[^\r]\n/.test(ics));
});
