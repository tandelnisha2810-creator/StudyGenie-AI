const path = require('path');

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function parsePossibleJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  if (!trimmed) return fallback;

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return value;
  }
}

function stripCodeFences(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;

  return trimmed
    .replace(/^```(?:json|javascript|js)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function toNumber(value, fallback = 0) {
  if (value == null || value === '') return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getRequestBaseUrl(req) {
  const protocol = req.protocol || 'http';
  const host = req.get('host');
  return host ? `${protocol}://${host}` : '';
}

function toPublicAudioUrl(req, storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return '';

  if (/^https?:\/\//i.test(storedPath)) {
    return storedPath;
  }

  const normalized = storedPath.startsWith('/') ? storedPath : `/${storedPath}`;
  const baseUrl = getRequestBaseUrl(req);
  return baseUrl ? `${baseUrl}${normalized}` : normalized;
}

function audioUrlToDiskPath(audioUrl, uploadsDir) {
  if (!audioUrl || typeof audioUrl !== 'string') return null;

  const cleanUrl = audioUrl.startsWith('http')
    ? new URL(audioUrl).pathname
    : audioUrl;

  const normalizedPath = cleanUrl.split('?')[0].split('#')[0];
  const relativePath = normalizedPath.startsWith('/uploads/')
    ? normalizedPath.replace('/uploads/', '')
    : normalizedPath.replace(/^\/+/, '');

  if (!relativePath) return null;
  return path.join(uploadsDir, relativePath);
}

function buildSummaryPrompt(transcript) {
  return [
    'You are an assistant that summarizes voice note transcripts.',
    'Write a concise, clear summary in 3 to 5 bullet points or 1 short paragraph.',
    'Return plain text only. Do not include markdown fences.',
    '',
    `Transcript: ${transcript}`,
  ].join('\n');
}

function buildQuizPrompt(transcript, count) {
  return [
    'You are an assistant that turns transcripts into study quizzes.',
    `Create exactly ${count} quiz questions based only on the transcript.`,
    'Return valid JSON only with this shape:',
    '{"quiz":[{"question":"...","options":["...","...","...","..."],"answer":"..."}]}',
    'Keep questions concise and directly grounded in the transcript.',
    'Do not include markdown fences or extra commentary.',
    '',
    `Transcript: ${transcript}`,
  ].join('\n');
}

module.exports = {
  audioUrlToDiskPath,
  buildQuizPrompt,
  buildSummaryPrompt,
  normalizeText,
  parsePossibleJson,
  stripCodeFences,
  toNumber,
  toPublicAudioUrl,
};