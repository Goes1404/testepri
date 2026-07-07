const { supabase } = require('../db');

const DOCUMENTS_BUCKET = process.env.DOCUMENTS_BUCKET || 'documents';
const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes

function buildDocumentPath(userId, applicationId, tipo, fileName) {
  const safeName = (fileName || 'arquivo').replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${userId}/${applicationId}/${tipo}-${Date.now()}-${safeName}`;
}

async function uploadDocument({ userId, applicationId, tipo, fileName, mimeType, buffer }) {
  const path = buildDocumentPath(userId, applicationId, tipo, fileName);

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, buffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  return path;
}

async function createSignedDownloadUrl(path) {
  const { data, error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (error) throw new Error(`Signed URL creation failed: ${error.message}`);

  return data.signedUrl;
}

async function removeDocument(path) {
  await supabase.storage.from(DOCUMENTS_BUCKET).remove([path]);
}

module.exports = { DOCUMENTS_BUCKET, uploadDocument, createSignedDownloadUrl, removeDocument };
