export const normalizeVietnameseFilename = (filename) => {
  if (typeof filename !== 'string' || !filename.trim()) {
    return filename;
  }

  const hasMojibakeMarkers = /Ã|Ä|Â|Ê|Ô|á|à|ả|ã|ạ/i.test(filename);
  if (!hasMojibakeMarkers) {
    return filename;
  }

  try {
    const decoded = Buffer.from(filename, 'latin1').toString('utf8');
    return decoded || filename;
  } catch {
    return filename;
  }
};

export const toContentDispositionFilename = (filename) => {
  const safeName = normalizeVietnameseFilename(filename) || 'download';
  const fallbackName = safeName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w.\-()\s]/g, '_');

  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`;
};