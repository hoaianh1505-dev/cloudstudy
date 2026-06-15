import Folder from '../models/Folder.js';
import Document from '../models/Document.js';

// Helper to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    
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

    res.render('dashboard', {
      totalFolders,
      totalDocuments,
      totalImages,
      totalStorage: formattedStorage,
      totalStorageBytes,
      recentDocuments,
      formatBytes,
      title: 'Dashboard - Cloud Study Document Manager'
    });
  } catch (error) {
    console.error('Lỗi khi tải trang Dashboard:', error);
    res.status(500).render('dashboard', {
      totalFolders: 0,
      totalDocuments: 0,
      totalImages: 0,
      totalStorage: '0 Bytes',
      totalStorageBytes: 0,
      recentDocuments: [],
      formatBytes,
      title: 'Dashboard - Cloud Study Document Manager',
      error: 'Không thể tải được dữ liệu Dashboard'
    });
  }
};
