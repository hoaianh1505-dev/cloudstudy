import crypto from 'crypto';
import SharedLink from '../models/SharedLink.js';
import Document from '../models/Document.js';
import * as s3Service from './s3Service.js';

export const createShareLink = async (documentId, userId, protocol, host) => {
  const doc = await Document.findOne({ _id: documentId, owner: userId });
  if (!doc) {
    throw new Error('Tài liệu không tồn tại hoặc bạn không có quyền');
  }

  let sharedLink = await SharedLink.findOne({ documentId });
  if (!sharedLink) {
    const token = crypto.randomBytes(16).toString('hex');
    sharedLink = new SharedLink({
      documentId,
      token
    });
    await sharedLink.save();
  }

  const shareUrl = `${protocol}://${host}/share/${sharedLink.token}`;
  return { shareUrl, token: sharedLink.token };
};

export const deleteShareLink = async (documentId, userId) => {
  const doc = await Document.findOne({ _id: documentId, owner: userId });
  if (!doc) {
    throw new Error('Tài liệu không tồn tại hoặc bạn không có quyền');
  }

  await SharedLink.deleteOne({ documentId });
};

export const getSharedDocument = async (token) => {
  const sharedLink = await SharedLink.findOne({ token }).populate('documentId');
  if (!sharedLink || !sharedLink.documentId) {
    throw new Error('Liên kết chia sẻ này không tồn tại hoặc đã bị chủ sở hữu thu hồi.');
  }

  const doc = sharedLink.documentId;
  const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(doc.fileType);

  return { doc, isImage };
};

export const getSharedDownloadStream = async (token) => {
  const sharedLink = await SharedLink.findOne({ token }).populate('documentId');
  if (!sharedLink || !sharedLink.documentId) {
    throw new Error('Tài liệu chia sẻ này không còn khả dụng.');
  }

  const doc = sharedLink.documentId;
  const stream = await s3Service.getFileStream(doc.s3Key);
  return { stream, fileName: doc.fileName, fileType: doc.fileType };
};
