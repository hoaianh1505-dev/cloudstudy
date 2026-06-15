const buildFolderTree = (folders, parentId = null) => {
  return folders
    .filter(f => {
      const parentStr = f.parentFolder ? String(f.parentFolder) : null;
      const targetStr = parentId ? String(parentId) : null;
      return parentStr === targetStr;
    })
    .map(f => ({
      ...f,
      children: buildFolderTree(folders, f._id)
    }));
};

const renderFolderTreeHtml = (tree, activeFolderId = null) => {
  if (!tree || tree.length === 0) return '';
  let html = '<ul class="folder-tree-list list-unstyled ps-3">';
  for (const node of tree) {
    const isActive = activeFolderId && String(node._id) === String(activeFolderId);
    const hasChildren = node.children && node.children.length > 0;
    
    html += `<li class="folder-tree-item my-1">
      <div class="folder-tree-node d-flex align-items-center justify-content-between p-1 px-2 rounded ${isActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold active-node' : 'hover-bg-light'}">
        <a href="/folder/${node._id}" class="text-decoration-none text-reset d-flex align-items-center flex-grow-1 py-1">
          <i class="bi ${hasChildren ? 'bi-folder-symlink-fill' : 'bi-folder-fill'} me-2 text-warning"></i>
          <span class="folder-name-text text-truncate" style="max-width: 160px;" title="${node.name}">${node.name}</span>
        </a>
      </div>`;
    
    if (hasChildren) {
      html += renderFolderTreeHtml(node.children, activeFolderId);
    }
    
    html += '</li>';
  }
  html += '</ul>';
  return html;
};

const getBreadcrumbs = (folderId, allFolders) => {
  const crumbs = [];
  let current = allFolders.find(f => String(f._id) === String(folderId));
  while (current) {
    crumbs.unshift({
      _id: current._id,
      name: current.name
    });
    if (current.parentFolder) {
      current = allFolders.find(f => String(f._id) === String(current.parentFolder));
    } else {
      current = null;
    }
  }
  return crumbs;
};

module.exports = {
  buildFolderTree,
  renderFolderTreeHtml,
  getBreadcrumbs
};
