import * as documentService from '../services/documentService.js';
import Folder from '../models/Folder.js'; // still needed to fetch lists for select menus in view renders
import { formatBytes } from '../services/dashboardService.js'; // re-use formatBytes

export const getUploadPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folders = await Folder.find({ owner: userId }).sort({ name: 1 }).lean();
    res.render('upload', {
      title: 'Tải tài liệu lên - Cloud Study',
      folders,
      currentFolderId: req.query.folderId || null,
      error: null
    });
  } catch (error) {
    console.error('Error fetching folders for upload page:', error);
    res.status(500).send('Lỗi máy chủ');
  }
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
      folders: await Folder.find({ owner: req.session.userId }).sort({ name: 1 }).lean(),
      currentFolderId: req.body.folderId || null,
      error: error.message || 'Lỗi khi tải file lên Cloud Storage'
    });
  }
};

export const getDocumentDetail = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const details = await documentService.getDocumentDetails(
      docId, 
      userId, 
      req.protocol, 
      req.get('host')
    );

    res.render('document', {
      title: `${details.doc.fileName} - Chi tiết`,
      doc: details.doc,
      breadcrumbs: details.breadcrumbs,
      shareUrl: details.shareUrl,
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
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.fileName)}"`);
    res.setHeader('Content-Type', result.fileType);
    
    result.stream.pipe(res);
  } catch (error) {
    console.error('Error downloading document from S3:', error);
    res.status(500).send('Không thể tải file từ S3 Cloud');
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
