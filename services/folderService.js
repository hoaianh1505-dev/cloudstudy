import Folder from '../models/Folder.js';
import Document from '../models/Document.js';
import SharedLink from '../models/SharedLink.js';
import * as s3Service from './s3Service.js';
import { getBreadcrumbs } from '../utils/folderHelper.js';

export const getFoldersList = async (userId) => {
  const subfolders = await Folder.find({ parentFolder: null, owner: userId }).sort({ name: 1 }).lean();
  const documents = await Document.find({ folderId: null, owner: userId }).sort({ uploadedAt: -1 }).lean();
  return { subfolders, documents };
};

export const getFolderDetails = async (folderId, userId) => {
  const currentFolder = await Folder.findOne({ _id: folderId, owner: userId });
  if (!currentFolder) {
    throw new Error('Thư mục không tồn tại hoặc bạn không có quyền truy cập.');
  }

  const allFolders = await Folder.find({ owner: userId }).lean();
  const breadcrumbs = getBreadcrumbs(folderId, allFolders);

  const subfolders = await Folder.find({ parentFolder: folderId, owner: userId }).sort({ name: 1 }).lean();
  const documents = await Document.find({ folderId, owner: userId }).sort({ uploadedAt: -1 }).lean();

  return {
    currentFolder,
    breadcrumbs,
    subfolders,
    documents
  };
};

export const createFolder = async (name, parentFolder, userId) => {
  if (!name || name.trim() === '') {
    throw new Error('Tên thư mục không được để trống');
  }

  const parentId = parentFolder && parentFolder.trim() !== '' ? parentFolder : null;

  // Check for duplicate name in this hierarchy level
  const existing = await Folder.findOne({
    name: name.trim(),
    parentFolder: parentId,
    owner: userId
  });

  if (existing) {
    throw new Error('Thư mục với tên này đã tồn tại ở cấp này');
  }

  const newFolder = new Folder({
    name: name.trim(),
    parentFolder: parentId,
    owner: userId
  });

  await newFolder.save();
  return newFolder;
};

export const renameFolder = async (folderId, name, userId) => {
  if (!name || name.trim() === '') {
    throw new Error('Tên thư mục không được để trống');
  }

  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  if (!folder) {
    throw new Error('Thư mục không tồn tại');
  }

  // Check duplicate
  const duplicate = await Folder.findOne({
    name: name.trim(),
    parentFolder: folder.parentFolder,
    owner: userId,
    _id: { $ne: folderId }
  });

  if (duplicate) {
    throw new Error('Thư mục cùng tên đã tồn tại');
  }

  folder.name = name.trim();
  await folder.save();
  return folder;
};

export const deleteFolderRecursive = async (folderId, userId) => {
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

export const deleteFolder = async (folderId, userId) => {
  const folder = await Folder.findOne({ _id: folderId, owner: userId });
  if (!folder) {
    throw new Error('Thư mục không tồn tại');
  }

  const parentId = folder.parentFolder;
  await deleteFolderRecursive(folderId, userId);
  return parentId;
};
