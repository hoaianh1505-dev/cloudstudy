const Document = require('../models/Document');
const Folder = require('../models/Folder');
const SharedLink = require('../models/SharedLink');
const s3Service = require('../services/s3Service');
const { getBreadcrumbs } = require('../utils/folderHelper');

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

exports.getUploadPage = async (req, res) => {
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

exports.postUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).render('upload', {
        title: 'Tải tài liệu lên - Cloud Study',
        folders: await Folder.find({ owner: req.session.userId }).sort({ name: 1 }).lean(),
        currentFolderId: req.body.folderId || null,
        error: 'Vui lòng chọn file hợp lệ để tải lên'
      });
    }

    const userId = req.session.userId;
    const { folderId } = req.body;
    const destFolderId = folderId && folderId.trim() !== '' ? folderId : null;

    // Upload to S3
    const s3Result = await s3Service.uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype);

    const doc = new Document({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      s3Key: s3Result.key,
      s3Url: s3Result.url,
      folderId: destFolderId,
      owner: userId
    });

    await doc.save();

    const redirectUrl = destFolderId ? `/folder/${destFolderId}` : '/folders';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error in postUpload:', error);
    res.status(500).send('Lỗi khi tải file lên Cloud Storage');
  }
};

exports.getDocumentDetail = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const doc = await Document.findOne({ _id: docId, owner: userId }).populate('folderId').lean();
    if (!doc) {
      return res.status(404).send('Tài liệu không tồn tại');
    }

    const allFolders = await Folder.find({ owner: userId }).lean();
    const breadcrumbs = doc.folderId ? getBreadcrumbs(doc.folderId._id, allFolders) : [];

    // Check if there is an active shared link
    const sharedLink = await SharedLink.findOne({ documentId: docId }).lean();
    let shareUrl = null;
    if (sharedLink) {
      shareUrl = `${req.protocol}://${req.get('host')}/share/${sharedLink.token}`;
    }

    // Identify if the document is an image (for thumbnail rendering)
    const isImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(doc.fileType);

    res.render('document', {
      title: `${doc.fileName} - Chi tiết`,
      doc,
      breadcrumbs,
      shareUrl,
      isImage,
      formatBytes
    });
  } catch (error) {
    console.error('Error fetching document detail:', error);
    res.status(500).send('Lỗi máy chủ');
  }
};

exports.downloadDocument = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const doc = await Document.findOne({ _id: docId, owner: userId });
    if (!doc) {
      return res.status(404).send('Tài liệu không tồn tại');
    }

    const stream = await s3Service.getFileStream(doc.s3Key);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
    res.setHeader('Content-Type', doc.fileType);
    
    stream.pipe(res);
  } catch (error) {
    console.error('Error downloading document from S3:', error);
    res.status(500).send('Không thể tải file từ S3 Cloud');
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const userId = req.session.userId;
    const docId = req.params.id;

    const doc = await Document.findOne({ _id: docId, owner: userId });
    if (!doc) {
      return res.status(404).json({ error: 'Tài liệu không tồn tại' });
    }

    // Delete S3 source file
    await s3Service.deleteFile(doc.s3Key);

    // Delete sharing tokens
    await SharedLink.deleteMany({ documentId: docId });

    // Delete metadata
    await Document.deleteOne({ _id: docId });

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa tài liệu' });
  }
};

exports.search = async (req, res) => {
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

    const regex = new RegExp(query.trim(), 'i');

    const folders = await Folder.find({
      owner: userId,
      name: regex
    }).lean();

    const documents = await Document.find({
      owner: userId,
      fileName: regex
    }).populate('folderId').lean();

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
