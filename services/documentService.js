import Document from '../models/Document.js';
import Folder from '../models/Folder.js';
import * as s3Service from './s3Service.js';
import { getBreadcrumbs } from '../utils/folderHelper.js';
import { normalizeVietnameseFilename } from '../utils/filenameHelper.js';

export const uploadDocument = async (file, folderId, userId) => {
  if (!file) {
    throw new Error('Vui lòng chọn file hợp lệ để tải lên');
  }

  const destFolderId = folderId && folderId.trim() !== '' ? folderId : null;
  const normalizedFileName = normalizeVietnameseFilename(file.originalname);

  // Upload S3 source file
  const s3Result = await s3Service.uploadFile(file.buffer, normalizedFileName, file.mimetype);

  const doc = new Document({
    fileName: normalizedFileName,
    fileType: file.mimetype,
    fileSize: file.size,
    s3Key: s3Result.key,
    s3Url: s3Result.url,
    folderId: destFolderId,
    owner: userId
  });

  await doc.save();
  return { doc, destFolderId };
};

export const getDocumentDetails = async (docId, userId) => {
  const doc = await Document.findOne({ _id: docId, owner: userId }).populate('folderId').lean();
  if (!doc) {
    throw new Error('Tài liệu không tồn tại');
  }

  doc.fileName = normalizeVietnameseFilename(doc.fileName);

  const allFolders = await Folder.find({ owner: userId }).lean();
  const breadcrumbs = doc.folderId ? getBreadcrumbs(doc.folderId._id, allFolders) : [];

  // Identify if the document is an image (for thumbnail rendering)
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(doc.fileType);

  return {
    doc,
    breadcrumbs,
    isImage
  };
};

export const getDownloadStream = async (docId, userId) => {
  const doc = await Document.findOne({ _id: docId, owner: userId });
  if (!doc) {
    throw new Error('Tài liệu không tồn tại');
  }

  const stream = await s3Service.getFileStream(doc.s3Key);
  return { stream, fileName: doc.fileName, fileType: doc.fileType };
};

export const deleteDocument = async (docId, userId) => {
  const doc = await Document.findOne({ _id: docId, owner: userId });
  if (!doc) {
    throw new Error('Tài liệu không tồn tại');
  }

  // Delete S3 source file
  await s3Service.deleteFile(doc.s3Key);

  // Delete metadata
  await Document.deleteOne({ _id: docId });
};

export const searchDocumentsAndFolders = async (query, userId) => {
  if (!query || !query.trim()) {
    return { folders: [], documents: [] };
  }

  const regex = new RegExp(query.trim(), 'i');

  const folders = await Folder.find({
    owner: userId,
    name: regex
  }).lean();

  const documents = await Document.find({
    owner: userId,
    fileName: regex
  }).populate('folderId').lean();

  documents.forEach(doc => {
    doc.fileName = normalizeVietnameseFilename(doc.fileName);
  });

  return { folders, documents };
};

export const getUserDocuments = async (userId) => {
  const documents = await Document.find({ owner: userId }).sort({ uploadedAt: -1 }).lean();
  documents.forEach(doc => {
    doc.fileName = normalizeVietnameseFilename(doc.fileName);
  });
  return documents;
};

