import * as folderService from '../services/folderService.js';
import { formatBytes } from '../services/dashboardService.js'; // Re-use formatBytes from dashboardService

export const getFolders = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { subfolders, documents } = await folderService.getFoldersList(userId);

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

export const getFolderDetail = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folderId = req.params.id;

    const details = await folderService.getFolderDetails(folderId, userId);

    res.render('folder', {
      title: `${details.currentFolder.name} - Cloud Study`,
      breadcrumbs: details.breadcrumbs,
      currentFolder: details.currentFolder,
      subfolders: details.subfolders,
      documents: details.documents,
      formatBytes,
      error: null,
      success: null
    });
  } catch (error) {
    console.error('Error fetching folder details:', error);
    res.status(404).render('folders', {
      title: 'Thư mục không tồn tại',
      breadcrumbs: [],
      currentFolder: null,
      subfolders: [],
      documents: [],
      formatBytes,
      error: error.message || 'Thư mục không tồn tại hoặc bạn không có quyền truy cập.',
      success: null
    });
  }
};

export const createFolder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { name, parentFolder } = req.body;

    const newFolder = await folderService.createFolder(name, parentFolder, userId);
    
    // Redirect or return JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true, folder: newFolder });
    }
    
    const parentId = parentFolder && parentFolder.trim() !== '' ? parentFolder : null;
    const redirectUrl = parentId ? `/folder/${parentId}` : '/folders';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error creating folder:', error);
    res.status(500).json({ error: error.message || 'Lỗi máy chủ khi tạo thư mục' });
  }
};

export const renameFolder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folderId = req.params.id;
    const { name } = req.body;

    const folder = await folderService.renameFolder(folderId, name, userId);
    res.json({ success: true, folder });
  } catch (error) {
    console.error('Error renaming folder:', error);
    res.status(500).json({ error: error.message || 'Lỗi máy chủ khi đổi tên thư mục' });
  }
};

export const deleteFolder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const folderId = req.params.id;

    const parentId = await folderService.deleteFolder(folderId, userId);

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({ success: true });
    }

    const redirectUrl = parentId ? `/folder/${parentId}` : '/folders';
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error deleting folder:', error);
    res.status(500).json({ error: error.message || 'Lỗi máy chủ khi xóa thư mục' });
  }
};
