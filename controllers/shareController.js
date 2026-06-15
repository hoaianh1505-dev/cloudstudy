import crypto from 'crypto';
import SharedLink from '../models/SharedLink.js';
import Document from '../models/Document.js';
import * as s3Service from '../services/s3Service.js';

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const createShareLink = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { documentId } = req.body;

    const doc = await Document.findOne({ _id: documentId, owner: userId });
    if (!doc) {
      return res.status(404).json({ error: 'Tài liệu không tồn tại hoặc bạn không có quyền' });
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

    const shareUrl = `${req.protocol}://${req.get('host')}/share/${sharedLink.token}`;
    res.json({ success: true, shareUrl, token: sharedLink.token });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi tạo link chia sẻ' });
  }
};

export const deleteShareLink = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { documentId } = req.body;

    const doc = await Document.findOne({ _id: documentId, owner: userId });
    if (!doc) {
      return res.status(404).json({ error: 'Tài liệu không tồn tại hoặc bạn không có quyền' });
    }

    await SharedLink.deleteOne({ documentId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting share link:', error);
    res.status(500).json({ error: 'Lỗi hệ thống khi hủy chia sẻ' });
  }
};

export const viewShareLink = async (req, res) => {
  try {
    const { token } = req.params;
    const sharedLink = await SharedLink.findOne({ token }).populate('documentId');
    if (!sharedLink || !sharedLink.documentId) {
      return res.status(404).render('share', {
        title: 'Không tìm thấy tài liệu',
        doc: null,
        error: 'Liên kết chia sẻ này không tồn tại hoặc đã bị chủ sở hữu thu hồi.',
        formatBytes
      });
    }

    const doc = sharedLink.documentId;
    const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(doc.fileType);

    res.render('share', {
      title: `${doc.fileName} - Chia sẻ tài liệu`,
      doc,
      isImage,
      token,
      error: null,
      formatBytes
    });
  } catch (error) {
    console.error('Error viewing share link:', error);
    res.status(500).send('Lỗi hệ thống khi truy cập tài liệu chia sẻ');
  }
};

export const downloadSharedDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const sharedLink = await SharedLink.findOne({ token }).populate('documentId');
    if (!sharedLink || !sharedLink.documentId) {
      return res.status(404).send('Tài liệu chia sẻ này không còn khả dụng.');
    }

    const doc = sharedLink.documentId;
    const stream = await s3Service.getFileStream(doc.s3Key);
    
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
    res.setHeader('Content-Type', doc.fileType);
    
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading shared document:', error);
    res.status(500).send('Không thể tải file từ cloud storage');
  }
};
