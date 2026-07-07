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

// Helper for SweetAlert2 settings based on current theme
function getSwalConfig() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    background: isDark ? '#111827' : '#ffffff',
    color: isDark ? '#f1f5f9' : '#1e293b',
    confirmButtonColor: '#0284c7', // <-- Đổi từ màu tím cũ sang màu Xanh Dương (Blue) ở đây
    cancelButtonColor: '#6b7280',  // Màu xám của nút Hủy (giữ nguyên vì nó là màu phẳng trung tính)
  };
}

// Delete document
async function deleteDocument(docId, redirectUrl = '/folders') {
  const result = await Swal.fire({
    title: 'Xóa tài liệu?',
    text: 'Bạn có chắc chắn muốn xóa tài liệu này từ đám mây? Hành động này không thể hoàn tác.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Xóa tài liệu',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#ef4444',
    ...getSwalConfig()
  });

  if (!result.isConfirmed) return;

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
      Swal.fire({
        title: 'Lỗi!',
        text: data.error || 'Không thể xóa tài liệu',
        icon: 'error',
        ...getSwalConfig()
      });
    }
  } catch (err) {
    console.error('Delete document error:', err);
    Swal.fire({
      title: 'Lỗi!',
      text: 'Đã xảy ra lỗi khi xóa tài liệu',
      icon: 'error',
      ...getSwalConfig()
    });
  }
}

// Rename folder
async function renameFolder(folderId, currentName) {
  const result = await Swal.fire({
    title: 'Đổi tên thư mục',
    input: 'text',
    inputValue: currentName,
    inputPlaceholder: 'Nhập tên mới...',
    showCancelButton: true,
    confirmButtonText: 'Lưu',
    cancelButtonText: 'Hủy',
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return 'Tên thư mục không được để trống!';
      }
    },
    ...getSwalConfig()
  });

  if (!result.isConfirmed) return;
  const newName = result.value.trim();
  if (newName === currentName) return;

  try {
    const response = await fetch(`/folder/${folderId}/rename`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    });
    
    const data = await response.json();
    if (response.ok && data.success) {
      window.location.reload();
    } else {
      Swal.fire({
        title: 'Lỗi!',
        text: data.error || 'Không thể đổi tên thư mục',
        icon: 'error',
        ...getSwalConfig()
      });
    }
  } catch (err) {
    console.error('Rename folder error:', err);
    Swal.fire({
      title: 'Lỗi!',
      text: 'Đã xảy ra lỗi khi đổi tên thư mục',
      icon: 'error',
      ...getSwalConfig()
    });
  }
}

// Delete folder
async function deleteFolder(folderId, redirectUrl = '/folders') {
  const result = await Swal.fire({
    title: 'CẢNH BÁO CỰC KỲ QUAN TRỌNG!',
    text: 'Xóa thư mục này sẽ xóa TOÀN BỘ các thư mục con và TẤT CẢ các tài liệu/hình ảnh được lưu trữ bên trong trên Cloud S3! Bạn có chắc chắn muốn tiếp tục không?',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Vẫn xóa tất cả',
    cancelButtonText: 'Hủy',
    confirmButtonColor: '#ef4444',
    ...getSwalConfig()
  });

  if (!result.isConfirmed) return;
  
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
      Swal.fire({
        title: 'Lỗi!',
        text: data.error || 'Không thể xóa thư mục',
        icon: 'error',
        ...getSwalConfig()
      });
    }
  } catch (err) {
    console.error('Delete folder error:', err);
    Swal.fire({
      title: 'Lỗi!',
      text: 'Đã xảy ra lỗi khi xóa thư mục',
      icon: 'error',
      ...getSwalConfig()
    });
  }
}

// Folder creation form interceptor for AJAX modal
document.addEventListener('DOMContentLoaded', () => {
  const createFolderForm = document.getElementById('createFolderForm');
  if (createFolderForm) {
    createFolderForm.addEventListener('submit', async (e) => {
      // Standard submit is used
    });
  }

  // Handle all file upload forms to show progress and allow cancel
  const uploadForms = document.querySelectorAll('form[enctype="multipart/form-data"]');
  uploadForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // Stop standard redirect/submit
      
      const fileInput = form.querySelector('input[type="file"]');
      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        return;
      }

      const footer = form.querySelector('.modal-footer');
      const closeBtn = form.closest('.modal')?.querySelector('.btn-close');
      const progressContainer = document.getElementById('uploadProgressContainer');
      const progressBar = document.getElementById('uploadProgressBar');
      const progressPercent = document.getElementById('uploadProgressPercent');
      const progressStatusText = document.getElementById('uploadProgressStatusText');
      const formGroups = form.querySelectorAll('.modal-body > .mb-3');

      // Hide inputs and footer, show progress bar
      formGroups.forEach(el => {
        if (el.id !== 'uploadProgressContainer') el.classList.add('d-none');
      });
      if (footer) footer.classList.add('d-none');
      if (closeBtn) closeBtn.style.pointerEvents = 'none'; // Lock close
      if (progressContainer) progressContainer.classList.remove('d-none');
      if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.setAttribute('aria-valuenow', 0);
      }
      if (progressPercent) progressPercent.textContent = '0%';
      if (progressStatusText) progressStatusText.textContent = 'Đang chuẩn bị file...';

      const formData = new FormData(form);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', form.action, true);

      // Helper to reset the form view on cancel/error
      const resetForm = () => {
        formGroups.forEach(el => {
          if (el.id !== 'uploadProgressContainer') el.classList.remove('d-none');
        });
        if (progressContainer) progressContainer.classList.add('d-none');
        if (footer) footer.classList.remove('d-none');
        if (closeBtn) closeBtn.style.pointerEvents = 'auto';
        if (fileInput) fileInput.value = '';
      };

      // Progress listener
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          if (progressStatusText) progressStatusText.textContent = 'Đang tải lên đám mây...';
          if (progressBar) {
            progressBar.style.width = percent + '%';
            progressBar.setAttribute('aria-valuenow', percent);
          }
          if (progressPercent) {
            progressPercent.textContent = percent + '%';
          }
        }
      });

      // Complete listener
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Success! Redirect to the destination page
          window.location.href = xhr.responseURL || '/folders';
        } else {
          let errMsg = 'Đã xảy ra lỗi khi tải lên tài liệu.';
          try {
            const resData = JSON.parse(xhr.responseText);
            errMsg = resData.error || errMsg;
          } catch (e) {}
          Swal.fire({
            title: 'Lỗi!',
            text: errMsg,
            icon: 'error',
            ...getSwalConfig()
          });
          resetForm();
        }
      };

      // Error listener
      xhr.onerror = () => {
        Swal.fire({
          title: 'Lỗi kết nối!',
          text: 'Không thể kết nối tới máy chủ.',
          icon: 'error',
          ...getSwalConfig()
        });
        resetForm();
      };

      // Cancel button listener
      const cancelUploadBtn = document.getElementById('cancelUploadBtn');
      if (cancelUploadBtn) {
        cancelUploadBtn.onclick = () => {
          xhr.abort();
          Swal.fire({
            title: 'Đã hủy!',
            text: 'Tiến trình tải lên đã được hủy bỏ.',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false,
            ...getSwalConfig()
          });
          resetForm();
        };
      }

      xhr.send(formData);
    });
  });

  // Initial theme icon update on load
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  updateThemeIcon(currentTheme);
  setupUploadDropzones();
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
  const icons = document.querySelectorAll('.themeToggleIconClass');
  icons.forEach(icon => {
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill themeToggleIconClass';
    } else {
      icon.className = 'bi bi-moon-stars-fill themeToggleIconClass';
    }
  });
}

function setupUploadDropzones() {
  const dropzones = document.querySelectorAll('[data-upload-dropzone]');

  dropzones.forEach(dropzone => {
    const form = dropzone.closest('form');
    const fileInput = dropzone.querySelector('input[type="file"]') || form?.querySelector('input[type="file"]');
    const browseBtn = dropzone.querySelector('[data-upload-browse]');
    const fileNameTarget = dropzone.querySelector('[data-upload-filename]');

    if (!fileInput) {
      return;
    }

    const updateFileName = () => {
      if (!fileNameTarget) {
        return;
      }

      if (fileInput.files && fileInput.files[0]) {
        fileNameTarget.textContent = `Đã chọn file: ${fileInput.files[0].name}`;
        fileNameTarget.classList.remove('d-none');
        dropzone.classList.add('has-file');
      } else {
        fileNameTarget.textContent = '';
        fileNameTarget.classList.add('d-none');
        dropzone.classList.remove('has-file');
      }
    };

    const setFiles = (files) => {
      if (!files || files.length === 0) {
        return;
      }

      const dataTransfer = new DataTransfer();
      Array.from(files).forEach(file => dataTransfer.items.add(file));
      fileInput.files = dataTransfer.files;
      fileInput.dispatchEvent(new Event('change', { bubbles: true }));
      updateFileName();
    };

    dropzone.addEventListener('dragenter', (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragover', (event) => {
      event.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (event) => {
      if (!dropzone.contains(event.relatedTarget)) {
        dropzone.classList.remove('dragover');
      }
    });

    dropzone.addEventListener('drop', (event) => {
      event.preventDefault();
      dropzone.classList.remove('dragover');
      setFiles(event.dataTransfer.files);
    });

    if (browseBtn) {
      browseBtn.addEventListener('click', () => fileInput.click());
    }

    dropzone.addEventListener('click', (event) => {
      if (event.target.closest('button, input, select, a, label')) {
        return;
      }
      fileInput.click();
    });

    fileInput.addEventListener('change', updateFileName);
    updateFileName();
  });
}

// --- AI ASSISTANT CHAT HANDLERS ---
let aiChatHistory = [];

function formatBytesClient(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

async function loadAiDocuments() {
  const select = document.getElementById('aiDocSelect');
  if (!select) return;

  const currentValue = select.value;
  
  try {
    const response = await fetch('/documents/api/list');
    if (!response.ok) return;
    const documents = await response.json();
    
    // Giữ nguyên tùy chọn mặc định hoặc tệp đang chọn
    select.innerHTML = '<option value="">-- Chọn tài liệu để AI đọc --</option>';
    documents.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc._id;
      option.textContent = `${doc.fileName} (${formatBytesClient(doc.fileSize)})`;
      if (doc._id === currentValue) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  } catch (err) {
    console.error('Error loading documents for AI selector:', err);
  }
}

function toggleAiDocSelect() {
  const checkbox = document.getElementById('aiReadDocCheckbox');
  const container = document.getElementById('aiDocSelectContainer');
  if (checkbox && container) {
    if (checkbox.checked) {
      container.classList.remove('d-none');
      loadAiDocuments();
    } else {
      container.classList.add('d-none');
    }
  }
}

function toggleAiChat() {
  const chatWindow = document.getElementById('aiChatWindow');
  if (chatWindow) {
    chatWindow.classList.toggle('d-none');
    if (!chatWindow.classList.contains('d-none')) {
      const input = document.getElementById('aiChatInput');
      if (input) input.focus();
      
      const checkbox = document.getElementById('aiReadDocCheckbox');
      if (checkbox && checkbox.checked) {
        loadAiDocuments();
      }
    }
  }
}

function parseMarkdownToHtml(text) {
  // Bold replacer
  let html = text.replace(/\*\*(.*?)\*\//g, '<strong>$1</strong>');
  // Handle markdown bold closing edge cases
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Newlines replacer
  html = html.replace(/\n/g, '<br>');
  // Bullet point replacer
  html = html.replace(/^[-\*]\s+(.*?)$/gm, '• $1');
  return html;
}

async function sendAiMessage(e) {
  e.preventDefault();
  const input = document.getElementById('aiChatInput');
  const chatBody = document.getElementById('aiChatBody');
  if (!input || !chatBody) return;

  const msgText = input.value.trim();
  if (!msgText) return;

  // Append user message bubble (escaped)
  const userBubble = document.createElement('div');
  userBubble.className = 'd-flex gap-2 align-items-start justify-content-end mb-2';
  userBubble.innerHTML = `
    <div class="p-2 bg-primary text-white rounded-3" style="max-width: 85%;">
      ${msgText.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>
  `;
  chatBody.appendChild(userBubble);
  input.value = '';
  chatBody.scrollTop = chatBody.scrollHeight;

  // Append thinking spinner
  const typingBubble = document.createElement('div');
  typingBubble.id = 'aiTypingIndicator';
  typingBubble.className = 'd-flex gap-2 align-items-start mb-2';
  typingBubble.innerHTML = `
    <div class="p-2 rounded-3 border bg-light text-dark text-muted" style="max-width: 85%;">
      <span class="spinner-grow spinner-grow-sm me-1 text-primary" role="status"></span> Đang suy nghĩ...
    </div>
  `;
  chatBody.appendChild(typingBubble);
  chatBody.scrollTop = chatBody.scrollHeight;

  const aiReadDocCheckbox = document.getElementById('aiReadDocCheckbox');
  const aiDocSelect = document.getElementById('aiDocSelect');

  let docId = null;

  if (aiReadDocCheckbox && aiReadDocCheckbox.checked) {
    if (aiDocSelect) docId = aiDocSelect.value || null;
  }

  try {
    const response = await fetch('/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        message: msgText,
        history: aiChatHistory,
        documentId: docId
      })
    });

    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.remove();

    const data = await response.json();
    
    // Append AI bubble
    const aiBubble = document.createElement('div');
    aiBubble.className = 'd-flex gap-2 align-items-start mb-2';
    aiBubble.innerHTML = `
      <div class="p-2 rounded-3 border bg-light text-dark" style="max-width: 85%;">
        ${parseMarkdownToHtml(data.reply)}
      </div>
    `;
    chatBody.appendChild(aiBubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Track history
    aiChatHistory.push({ role: 'user', text: msgText });
    aiChatHistory.push({ role: 'model', text: data.reply });

    if (aiChatHistory.length > 6) {
      aiChatHistory = aiChatHistory.slice(aiChatHistory.length - 6);
    }
  } catch (err) {
    console.error(err);
    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.remove();

    const errorBubble = document.createElement('div');
    errorBubble.className = 'd-flex gap-2 align-items-start mb-2';
    errorBubble.innerHTML = `
      <div class="p-2 rounded-3 border bg-danger bg-opacity-10 text-danger" style="max-width: 85%;">
        Rất tiếc, tôi không kết nối được với Trợ lý AI. Vui lòng thử lại sau.
      </div>
    `;
    chatBody.appendChild(errorBubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}

// Toggle mobile sidebar drawer view
function toggleMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    sidebar.classList.toggle('show');
  }
}


