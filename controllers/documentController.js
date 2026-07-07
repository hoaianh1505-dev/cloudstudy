import * as documentService from '../services/documentService.js';
import { formatBytes } from '../services/dashboardService.js'; // re-use formatBytes
import { toContentDispositionFilename } from '../utils/filenameHelper.js';

export const getUploadPage = (req, res) => {
  res.render('upload', {
    title: 'Tải tài liệu lên - Cloud Study',
    currentFolderId: req.query.folderId || null,
    error: null
  });
};

export const postUpload = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { folderId } = req.body;

    const result = await documentService.uploadDocument(req.file, folderId, userId);

    const redirectUrl = result.destFolderId ? `/folder/${result.destFolderId}` : '/folders';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in postUpload:', error);
    res.status(500).render('upload', {
      title: 'Tải tài liệu lên - Cloud Study',
      currentFolderId: req.body.folderId || null,
      error: error.message || 'Lỗi khi tải file lên Cloud Storage'
    });
  }
};

export const getDocumentDetail = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const details = await documentService.getDocumentDetails(docId, userId);

    res.render('document', {
      title: `${details.doc.fileName} - Chi tiết`,
      doc: details.doc,
      breadcrumbs: details.breadcrumbs,
      isImage: details.isImage,
      formatBytes
    });
  } catch (error) {
    console.error('Error fetching document detail:', error);
    res.status(404).send(error.message || 'Tài liệu không tồn tại');
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const result = await documentService.getDownloadStream(docId, userId);
    res.setHeader('Content-Disposition', toContentDispositionFilename(result.fileName));
    res.setHeader('Content-Type', result.fileType);
    
    result.stream.pipe(res);
  } catch (error) {
    console.error('Error downloading document from S3:', error);
    res.status(500).send('Không thể tải file từ S3 Cloud');
  }
};

export const previewDocument = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const result = await documentService.getDownloadStream(docId, userId);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(result.fileName)}"`);
    res.setHeader('Content-Type', result.fileType);

    result.stream.pipe(res);
  } catch (error) {
    console.error('Error previewing document from S3:', error);
    res.status(500).send('Không thể xem trước file từ S3 Cloud');
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    await documentService.deleteDocument(docId, userId);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: error.message || 'Lỗi máy chủ khi xóa tài liệu' });
  }
};

export const search = async (req, res) => {
  try {
    const userId = req.session.userId;
    const query = req.query.q || '';

    if (!query.trim()) {
      return res.render('search', {
        title: 'Tìm kiếm tài liệu',
        query: '',
        folders: [],
        documents: [],
        formatBytes
      });
    }

    const { folders, documents } = await documentService.searchDocumentsAndFolders(query, userId);

    res.render('search', {
      title: `Kết quả tìm kiếm cho "${query}"`,
      query,
      folders,
      documents,
      formatBytes
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send('Lỗi máy chủ khi tìm kiếm');
  }
};

export const apiListDocuments = async (req, res) => {
  try {
    const userId = req.session.userId;
    const documents = await documentService.getUserDocuments(userId);
    res.json(documents);
  } catch (error) {
    console.error('Error in apiListDocuments:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi lấy danh sách tài liệu' });
  }
};

