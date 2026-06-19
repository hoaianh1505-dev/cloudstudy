import * as dashboardService from '../services/dashboardService.js';

export const getDashboard = async (req, res) => {
  try {
    const userId = req.session.userId;
    const stats = await dashboardService.getDashboardStats(userId);

    res.render('dashboard', {
      totalFolders: stats.totalFolders,
      totalDocuments: stats.totalDocuments,
      totalImages: stats.totalImages,
      totalStorage: stats.totalStorage,
      totalStorageBytes: stats.totalStorageBytes,
      recentDocuments: stats.recentDocuments,
      formatBytes: dashboardService.formatBytes,
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
      formatBytes: dashboardService.formatBytes,
      title: 'Dashboard - Cloud Study Document Manager',
      error: 'Không thể tải được dữ liệu Dashboard'
    });
  }
};
