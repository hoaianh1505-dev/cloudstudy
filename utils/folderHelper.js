export const buildFolderTree = (folders, parentId = null) => {
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

const hasActiveChildNode = (node, activeFolderId) => {
  if (!activeFolderId) return false;
  if (String(node._id) === String(activeFolderId)) return true;
  if (node.children && node.children.length > 0) {
    return node.children.some(child => hasActiveChildNode(child, activeFolderId));
  }
  return false;
};

export const renderFolderTreeHtml = (tree, activeFolderId = null) => {
  if (!tree || tree.length === 0) return '';
  let html = '<ul class="folder-tree-list list-unstyled ps-2">';
  for (const node of tree) {
    const isActive = activeFolderId && String(node._id) === String(activeFolderId);
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = activeFolderId && hasActiveChildNode(node, activeFolderId);
    
    html += `<li class="folder-tree-item my-1">
      <div class="folder-tree-node d-flex align-items-center justify-content-between p-1 px-2 rounded ${isActive ? 'bg-primary bg-opacity-10 text-primary fw-semibold active-node' : 'hover-bg-light'}">
        <div class="d-flex align-items-center flex-grow-1 text-truncate">
          ${hasChildren ? `
            <button class="btn btn-link p-0 border-0 me-1 folder-toggle-btn text-muted d-flex align-items-center justify-content-center" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#folder-children-${node._id}" 
                    aria-expanded="${isExpanded ? 'true' : 'false'}"
                    style="width: 20px; height: 20px; text-decoration: none; box-shadow: none;">
              <i class="bi bi-chevron-right folder-chevron-icon" style="font-size: 10px;"></i>
            </button>
          ` : '<span style="width: 20px; display: inline-block;"></span>'}
          <a href="/folder/${node._id}" class="text-decoration-none text-reset d-flex align-items-center flex-grow-1 py-1 text-truncate">
            <i class="bi ${hasChildren ? 'bi-folder-symlink-fill' : 'bi-folder-fill'} me-2 text-warning"></i>
            <span class="folder-name-text text-truncate" style="max-width: 140px;" title="${node.name}">${node.name}</span>
          </a>
        </div>
      </div>`;
    
    if (hasChildren) {
      html += `<ul class="folder-tree-list list-unstyled ps-3 collapse ${isExpanded ? 'show' : ''}" id="folder-children-${node._id}">`;
      html += renderFolderTreeHtml(node.children, activeFolderId);
      html += '</ul>';
    }
    
    html += '</li>';
  }
  html += '</ul>';
  return html;
};

export const getBreadcrumbs = (folderId, allFolders) => {
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
