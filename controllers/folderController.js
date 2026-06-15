const Folder = require('../models/Folder');
const Document = require('../models/Document');
const SharedLink = require('../models/SharedLink');
const s3Service = require('../services/s3Service');
const { getBreadcrumbs } = require('../utils/folderHelper');

// Helper to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Recursive folder deletion
const deleteFolderRecursive = async (folderId, userId) => {
  const childFolders = await Folder.find({ parentFolder: folderId, owner: userId });
  for (const child of childFolders) {
    await deleteFolderRecursive(child._id, userId);
  }

  const docs = await Document.find({ folderId, owner: userId });
  for (const doc of docs) {
    try {
      await s3Service.deleteFile(doc.s3Key);
    } catch (err) {
      console.error(`S3 Delete error for key ${doc.s3Key}:`, err);
    }
    await Document.deleteOne({ _id: doc._id });
    await SharedLink.deleteMany({ documentId: doc._id });
  }

  await Folder.deleteOne({ _id: folderId, owner: userId });
};

exports.getFolders = async (req, res) => {
  try {
    const userId = req.session.userId;
    const subfolders = await Folder.find({ parentFolder: null, owner: userId }).sort({ name: 1 }).lean();
    const documents = await Document.find({ folderId: null, owner: userId }).sort({ uploadedAt: -1 }).lean();

    res.render('folders', {
      title: 'Tất cả tài liệu - Cloud Study',
      breadcrumbs: [],
      currentFolder: null,
      subfolders,
      documents,
      formatBytes,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Error listing root folders:', error);
    res.status(500).send('Lỗi máy chủ nội bộ');
  }
};

exports.getFolderDetail = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folderId = req.params.id;

    const currentFolder = await Folder.findOne({ _id: folderId, owner: userId });
    if (!currentFolder) {
      return res.status(404).render('folders', {
        title: 'Thư mục không tồn tại',
        breadcrumbs: [],
        currentFolder: null,
        subfolders: [],
        documents: [],
        formatBytes,
        error: 'Thư mục không tồn tại hoặc bạn không có quyền truy cập.',
        success: null
      });
    }

    const allFolders = await Folder.find({ owner: userId }).lean();
    const breadcrumbs = getBreadcrumbs(folderId, allFolders);

    const subfolders = await Folder.find({ parentFolder: folderId, owner: userId }).sort({ name: 1 }).lean();
    const documents = await Document.find({ folderId, owner: userId }).sort({ uploadedAt: -1 }).lean();

    res.render('folder', {
      title: `${currentFolder.name} - Cloud Study`,
      breadcrumbs,
      currentFolder,
      subfolders,
      documents,
      formatBytes,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Error fetching folder details:', error);
    res.status(500).send('Lỗi máy chủ nội bộ');
  }
};

exports.createFolder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, parentFolder } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Tên thư mục không được để trống' });
    }

    const parentId = parentFolder && parentFolder.trim() !== '' ? parentFolder : null;

    // Check for duplicate name in this hierarchy level
    const existing = await Folder.findOne({
      name: name.trim(),
      parentFolder: parentId,
      owner: userId
    });

    if (existing) {
      return res.status(400).json({ error: 'Thư mục với tên này đã tồn tại ở cấp này' });
    }

    const newFolder = new Folder({
      name: name.trim(),
      parentFolder: parentId,
      owner: userId
    });

    await newFolder.save();
    
    // Redirect or return JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, folder: newFolder });
    }
    
    const redirectUrl = parentId ? `/folder/${parentId}` : '/folders';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi tạo thư mục' });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folderId = req.params.id;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Tên thư mục không được để trống' });
    }

    const folder = await Folder.findOne({ _id: folderId, owner: userId });
    if (!folder) {
      return res.status(404).json({ error: 'Thư mục không tồn tại' });
    }

    // Check duplicate
    const duplicate = await Folder.findOne({
      name: name.trim(),
      parentFolder: folder.parentFolder,
      owner: userId,
      _id: { $ne: folderId }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Thư mục cùng tên đã tồn tại' });
    }

    folder.name = name.trim();
    await folder.save();

    res.json({ success: true, folder });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi đổi tên thư mục' });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folderId = req.params.id;

    const folder = await Folder.findOne({ _id: folderId, owner: userId });
    if (!folder) {
      return res.status(404).json({ error: 'Thư mục không tồn tại' });
    }

    const parentId = folder.parentFolder;

    await deleteFolderRecursive(folderId, userId);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true });
    }

    const redirectUrl = parentId ? `/folder/${parentId}` : '/folders';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error deleting folder recursively:', error);
    res.status(500).json({ error: 'Lỗi máy chủ khi xóa thư mục' });
  }
};
