import Folder from '../models/Folder.js';
import { buildFolderTree, renderFolderTreeHtml } from '../utils/folderHelper.js';

export default async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const allFolders = await Folder.find({ owner: req.session.userId }).lean();
      const tree = buildFolderTree(allFolders);
      
      // Determine active folder if applicable
      let activeFolderId = null;
      if (req.params && req.params.id) {
        activeFolderId = req.params.id;
      }
      
      res.locals.folderTreeHtml = renderFolderTreeHtml(tree, activeFolderId);
      res.locals.rawFolders = allFolders;
      res.locals.user = {
        id: req.session.userId,
        username: req.session.username
      };
    } catch (error) {
      console.error('Error in folder tree middleware:', error);
      res.locals.folderTreeHtml = '';
      res.locals.rawFolders = [];
      res.locals.user = {
        id: req.session.userId,
        username: req.session.username
      };
    }
  } else {
    res.locals.folderTreeHtml = '';
    res.locals.rawFolders = [];
    res.locals.user = null;
  }
  next();
};
