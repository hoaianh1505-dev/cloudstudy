export const normalizeVietnameseFilename = (filename) => {
  if (typeof filename !== 'string' || !filename.trim()) {
    return filename;
  }

  const stripControlChars = (value) => value.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  const scoreCandidate = (value) => {
    const vietnameseChars = (value.match(/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi) || []).length;
    const replacementChars = (value.match(/�/g) || []).length;
    const mojibakeChars = (value.match(/Ã|Ä|Â|Ê|Ô|á|à|ả|ã|ạ/i) || []).length;
    return (vietnameseChars * 3) - (replacementChars * 5) - mojibakeChars;
  };

  const candidates = new Set();
  const cleanedOriginal = stripControlChars(filename);
  candidates.add(cleanedOriginal);

  try {
    candidates.add(stripControlChars(Buffer.from(cleanedOriginal, 'latin1').toString('utf8')));
  } catch {
    // Ignore decode errors and fall back to the original input.
  }

  try {
    candidates.add(stripControlChars(Buffer.from(cleanedOriginal, 'binary').toString('utf8')));
  } catch {
    // Ignore decode errors and fall back to the original input.
  }

  let bestCandidate = cleanedOriginal;
  let bestScore = scoreCandidate(cleanedOriginal);

  for (const candidate of candidates) {
    const candidateScore = scoreCandidate(candidate);
    if (candidateScore > bestScore) {
      bestCandidate = candidate;
      bestScore = candidateScore;
    }
  }

  return bestCandidate;
};

export const toContentDispositionFilename = (filename) => {
  const safeName = normalizeVietnameseFilename(filename) || 'download';
  const fallbackName = safeName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-()\s]/g, '_');

  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
};