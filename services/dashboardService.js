import Folder from '../models/Folder.js';
import Document from '../models/Document.js';

export const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getDashboardStats = async (userId) => {
  const totalFolders = await Folder.countDocuments({ owner: userId });
  const totalDocuments = await Document.countDocuments({ owner: userId });
  
  // Total images (by checking mime types or extension in query)
  const totalImages = await Document.countDocuments({
    owner: userId,
    fileType: { $in: ['image/jpeg', 'image/png', 'image/webp'] }
  });

  // Total storage capacity
  const storageAggregation = await Document.aggregate([
    { $match: { owner: userId } },
    { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
  ]);
  const totalStorageBytes = storageAggregation.length > 0 ? storageAggregation[0].totalSize : 0;
  const formattedStorage = formatBytes(totalStorageBytes);

  // Recent Documents
  const recentDocuments = await Document.find({ owner: userId })
    .populate('folderId', 'name')
    .sort({ uploadedAt: -1 })
    .limit(5)
    .lean();

  return {
    totalFolders,
    totalDocuments,
    totalImages,
    totalStorage: formattedStorage,
    totalStorageBytes,
    recentDocuments
  };
};
