// Copy link to clipboard
function copyToClipboard(inputId) {
  const copyText = document.getElementById(inputId);
  if (!copyText) return;
  
  copyText.select();
  copyText.setSelectionRange(0, 99999); // For mobile devices
  
  navigator.clipboard.writeText(copyText.value).then(() => {
    // Show toast or alert
    const btn = document.querySelector('[onclick="copyToClipboard(\'' + inputId + '\')"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="bi bi-check-all"></i> Đã chép!';
    btn.classList.replace('btn-outline-primary', 'btn-success');
    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.classList.replace('btn-success', 'btn-outline-primary');
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy text: ', err);
    alert('Không thể sao chép tự động. Hãy bôi đen và nhấn Ctrl+C.');
  });
}

// Generate share link
async function generateShareLink(documentId) {
  try {
    const response = await fetch('/share/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ documentId })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      const container = document.getElementById('shareLinkContainer');
      const input = document.getElementById('shareInput');
      const genBtn = document.getElementById('generateShareBtn');
      const revBtn = document.getElementById('revokeShareBtn');
      
      if (input) input.value = data.shareUrl;
      if (container) container.classList.remove('d-none');
      if (genBtn) genBtn.classList.add('d-none');
      if (revBtn) revBtn.classList.remove('d-none');
    } else {
      alert('Lỗi: ' + (data.error || 'Không thể tạo liên kết chia sẻ'));
    }
  } catch (err) {
    console.error('Generate share error:', err);
    alert('Đã xảy ra lỗi khi tạo liên kết chia sẻ');
  }
}

// Revoke share link
async function revokeShareLink(documentId) {
  if (!confirm('Bạn có chắc chắn muốn hủy chia sẻ tài liệu này? Liên kết chia sẻ hiện tại sẽ không thể sử dụng được nữa.')) {
    return;
  }
  try {
    const response = await fetch('/share/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ documentId })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      const container = document.getElementById('shareLinkContainer');
      const input = document.getElementById('shareInput');
      const genBtn = document.getElementById('generateShareBtn');
      const revBtn = document.getElementById('revokeShareBtn');
      
      if (input) input.value = '';
      if (container) container.classList.add('d-none');
      if (genBtn) genBtn.classList.remove('d-none');
      if (revBtn) revBtn.classList.add('d-none');
    } else {
      alert('Lỗi: ' + (data.error || 'Không thể hủy chia sẻ'));
    }
  } catch (err) {
    console.error('Revoke share error:', err);
    alert('Đã xảy ra lỗi khi hủy chia sẻ');
  }
}

// Delete document
async function deleteDocument(docId, redirectUrl = '/folders') {
  if (!confirm('Bạn có chắc chắn muốn xóa tài liệu này từ đám mây? Hành động này không thể hoàn tác.')) {
    return;
  }
  try {
    const response = await fetch(`/document/${docId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      window.location.href = redirectUrl;
    } else {
      alert('Lỗi: ' + (data.error || 'Không thể xóa tài liệu'));
    }
  } catch (err) {
    console.error('Delete document error:', err);
    alert('Đã xảy ra lỗi khi xóa tài liệu');
  }
}

// Rename folder
async function renameFolder(folderId, currentName) {
  const newName = prompt('Nhập tên mới cho thư mục:', currentName);
  if (newName === null) return; // Cancelled
  
  const trimmed = newName.trim();
  if (!trimmed) {
    alert('Tên thư mục không được để trống.');
    return;
  }
  if (trimmed === currentName) return;

  try {
    const response = await fetch(`/folder/${folderId}/rename`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name: trimmed })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      window.location.reload();
    } else {
      alert('Lỗi: ' + (data.error || 'Không thể đổi tên thư mục'));
    }
  } catch (err) {
    console.error('Rename folder error:', err);
    alert('Đã xảy ra lỗi khi đổi tên thư mục');
  }
}

// Delete folder
async function deleteFolder(folderId, redirectUrl = '/folders') {
  if (!confirm('CẢNH BÁO CỰC KỲ QUAN TRỌNG:\nXóa thư mục này sẽ xóa TOÀN BỘ các thư mục con và TẤT CẢ các tài liệu/hình ảnh được lưu trữ bên trong trên Cloud S3!\n\nBạn có chắc chắn muốn tiếp tục không?')) {
    return;
  }
  
  try {
    const response = await fetch(`/folder/${folderId}/delete`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      window.location.href = redirectUrl;
    } else {
      alert('Lỗi: ' + (data.error || 'Không thể xóa thư mục'));
    }
  } catch (err) {
    console.error('Delete folder error:', err);
    alert('Đã xảy ra lỗi khi xóa thư mục');
  }
}

// Folder creation form interceptor for AJAX modal
document.addEventListener('DOMContentLoaded', () => {
  const createFolderForm = document.getElementById('createFolderForm');
  if (createFolderForm) {
    createFolderForm.addEventListener('submit', async (e) => {
      // If we are using standard redirect, let it be. But let's support standard redirect.
      // Simply regular form action is fine, no complex interceptor needed unless it's SPA.
    });
  }

  // Initial theme icon update on load
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcon(currentTheme);
});

// Toggle Light/Dark Theme
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', targetTheme);
  localStorage.setItem('theme', targetTheme);
  
  updateThemeIcon(targetTheme);
}

function updateThemeIcon(theme) {
  const icon = document.getElementById('themeToggleIcon');
  if (!icon) return;
  if (theme === 'dark') {
    icon.className = 'bi bi-sun-fill';
  } else {
    icon.className = 'bi bi-moon-stars-fill';
  }
}

