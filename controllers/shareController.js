import * as shareService from '../services/shareService.js';
import { formatBytes } from '../services/dashboardService.js'; // re-use formatBytes

export const createShareLink = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { documentId } = req.body;

    const result = await shareService.createShareLink(
      documentId, 
      userId, 
      req.protocol, 
      req.get('host')
    );

    res.json({ success: true, shareUrl: result.shareUrl, token: result.token });
  } catch (error) {
    console.error('Error creating share link:', error);
    res.status(500).json({ error: error.message || 'Lỗi hệ thống khi tạo link chia sẻ' });
  }
};

export const deleteShareLink = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { documentId } = req.body;

    await shareService.deleteShareLink(documentId, userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting share link:', error);
    res.status(500).json({ error: error.message || 'Lỗi hệ thống khi hủy chia sẻ' });
  }
};

export const viewShareLink = async (req, res) => {
  try {
    const { token } = req.params;
    const details = await shareService.getSharedDocument(token);

    res.render('share', {
      title: `${details.doc.fileName} - Chia sẻ tài liệu`,
      doc: details.doc,
      isImage: details.isImage,
      token,
      error: null,
      formatBytes
    });
  } catch (error) {
    console.error('Error viewing share link:', error);
    res.status(404).render('share', {
      title: 'Không tìm thấy tài liệu',
      doc: null,
      error: error.message || 'Liên kết chia sẻ này không tồn tại hoặc đã bị chủ sở hữu thu hồi.',
      formatBytes
    });
  }
};

export const downloadSharedDocument = async (req, res) => {
  try {
    const { token } = req.params;
    const result = await shareService.getSharedDownloadStream(token);
    
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.setHeader('Content-Type', result.fileType);
    
    result.stream.pipe(res);
  } catch (error) {
    console.error('Error downloading shared document:', error);
    res.status(500).send('Không thể tải file từ cloud storage');
  }
};
