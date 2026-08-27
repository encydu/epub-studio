
document.addEventListener('DOMContentLoaded', () => {

  const pathInput = document.getElementById('epub-path-input');
  const btnAnalyze = document.getElementById('btn-analyze');
  const btnExecuteAction = document.getElementById('btn-execute-action');
  const btnActionLabel = document.getElementById('btn-action-label');
  const chapterSelect = document.getElementById('chapter-select');

  const modeTabs = document.querySelectorAll('.mode-tab');
  const tabModeBatch = document.getElementById('tab-mode-batch');
  const navBatchBadge = document.getElementById('nav-batch-badge');

  const modeLeftPanels = {
    clean: document.getElementById('panel-options-clean'),
    compress: document.getElementById('panel-options-compress'),
    split: document.getElementById('panel-options-split'),
    metadata: document.getElementById('panel-options-metadata')
  };

  const modeRightViews = {
    clean: document.getElementById('right-panel-clean'),
    compress: document.getElementById('right-panel-compress'),
    split: document.getElementById('right-panel-split'),
    metadata: document.getElementById('right-panel-metadata'),
    batch: document.getElementById('right-panel-batch')
  };

  const metaTitleInput = document.getElementById('meta-title-input');
  const metaCreatorInput = document.getElementById('meta-creator-input');
  const metaDescInput = document.getElementById('meta-desc-input');
  const metaPublisherInput = document.getElementById('meta-publisher-input');
  const metaLangInput = document.getElementById('meta-lang-input');
  const coverFilePicker = document.getElementById('cover-file-picker');
  const btnBrowseCover = document.getElementById('btn-browse-cover');
  const coverFileName = document.getElementById('cover-file-name');

  const bookCoverImg = document.getElementById('book-cover-img');
  const bookCoverPlaceholder = document.getElementById('book-cover-placeholder');
  const bookTitleHead = document.getElementById('book-title-head');
  const bookAuthorSub = document.getElementById('book-author-sub');
  const bookBadgeLang = document.getElementById('book-badge-lang');
  const bookBadgePublisher = document.getElementById('book-badge-publisher');
  const bookDescText = document.getElementById('book-desc-text');

  let currentMetadata = null;
  let newCoverB64 = null;
  let newCoverExt = 'jpg';

  const optZws = document.getElementById('opt-zws');
  const optHidden = document.getElementById('opt-hidden');
  const optAttrs = document.getElementById('opt-attrs');
  const optCustom = document.getElementById('opt-custom');

  const webpQualityInput = document.getElementById('webp-quality-input');
  const webpQualityVal = document.getElementById('webp-quality-val');
  const maxResSelect = document.getElementById('max-res-select');
  const compressSavingsBadge = document.getElementById('compress-savings-badge');
  const compressSavingsAmount = document.getElementById('compress-savings-amount');
  const compressSavingsTarget = document.getElementById('compress-savings-target');
  const splitSizeInput = document.getElementById('split-size-input');
  const optSplitWebp = document.getElementById('opt-split-webp');

  const compStatCount = document.getElementById('comp-stat-count');
  const compStatOrigSize = document.getElementById('comp-stat-orig-size');
  const compStatWebpSize = document.getElementById('comp-stat-webp-size');
  const compStatSavedPct = document.getElementById('comp-stat-saved-pct');
  const imageListContainer = document.getElementById('image-list-container');
  const imageListToolbar = document.getElementById('image-list-toolbar');
  const checkSelectAllImages = document.getElementById('check-select-all-images');
  const imageListSummary = document.getElementById('image-list-summary');
  const btnDeleteAllUnused = document.getElementById('btn-delete-all-unused');
  const unusedCountBadge = document.getElementById('unused-count-badge');
  const btnDeleteSelected = document.getElementById('btn-delete-selected');
  const selectedCountBadge = document.getElementById('selected-count-badge');

  const splitStatOrigSize = document.getElementById('split-stat-orig-size');
  const splitStatEstTotal = document.getElementById('split-stat-est-total');
  const splitStatPartsEst = document.getElementById('split-stat-parts-est');
  const splitPartitionList = document.getElementById('split-partition-list');

  const statZws = document.getElementById('stat-zws');
  const statHidden = document.getElementById('stat-hidden');
  const statAttrs = document.getElementById('stat-attrs');
  const statSizeSaved = document.getElementById('stat-size-saved');

  const beforePreview = document.getElementById('before-preview');
  const afterPreview = document.getElementById('after-preview');
  const rawBeforeCode = document.getElementById('raw-before-code');
  const cleanAfterCode = document.getElementById('clean-after-code');

  const progressWrapper = document.getElementById('cleaning-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const progressPercent = document.getElementById('progress-percent');
  const btnCancelBatch = document.getElementById('btn-cancel-batch');

  const downloadBox = document.getElementById('download-result-box');
  const resultSuccessMsg = document.getElementById('result-success-msg');
  const resultOutputPath = document.getElementById('result-output-path');
  const resultOrigSize = document.getElementById('result-orig-size');
  const resultNewSize = document.getElementById('result-new-size');
  const resultSavedBadge = document.getElementById('result-saved-badge');

  const singleDownloadWrapper = document.getElementById('single-download-wrapper');
  const multiDownloadWrapper = document.getElementById('multi-download-wrapper');
  const btnDownloadFile = document.getElementById('btn-download-file');
  const batchDownloadWrapper = document.getElementById('batch-download-wrapper');
  const btnDownloadBatchZip = document.getElementById('btn-download-batch-zip');
  const btnOpenFolder = document.getElementById('btn-open-folder');

  const batchQueueContainer = document.getElementById('batch-queue-container');
  const batchFileCount = document.getElementById('batch-file-count');
  const batchSelectedCount = document.getElementById('batch-selected-count');
  const btnAddMoreFiles = document.getElementById('btn-add-more-files');
  const btnClearBatch = document.getElementById('btn-clear-batch');
  const chkBatchSelectAll = document.getElementById('chk-batch-select-all');
  const batchQueueTotals = document.getElementById('batch-queue-totals');
  const batchQueueList = document.getElementById('batch-queue-list');
  const outputFolderInput = document.getElementById('output-folder-input');
  const btnBrowseOutputFolder = document.getElementById('btn-browse-output-folder');
  const btnResetOutputFolder = document.getElementById('btn-reset-output-folder');
  let chosenOutputFolder = '';

  function getOutputDestination() {
    if (chosenOutputFolder) {
      return {
        output_mode: 'custom_dir',
        output_dir: chosenOutputFolder
      };
    }
    return {
      output_mode: 'same_dir',
      output_dir: ''
    };
  }

  const batchStatTotalFiles = document.getElementById('batch-stat-total-files');
  const batchStatOrigSize = document.getElementById('batch-stat-orig-size');
  const batchStatProcSize = document.getElementById('batch-stat-proc-size');
  const batchStatSavedSize = document.getElementById('batch-stat-saved-size');
  const batchMatrixStatusSummary = document.getElementById('batch-matrix-status-summary');
  const chkMatrixSelectAll = document.getElementById('chk-matrix-select-all');
  const batchMatrixTbody = document.getElementById('batch-matrix-tbody');
  const batchMatrixSearch = document.getElementById('batch-matrix-search');
  const batchFilterStatus = document.getElementById('batch-filter-status');
  const btnBatchDashRetryFailed = document.getElementById('btn-batch-dash-retry-failed');
  const batchFailedCount = document.getElementById('batch-failed-count');
  const btnBatchDashExport = document.getElementById('btn-batch-dash-export');

  const tabs = document.querySelectorAll('.diff-tab');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const searchBanner = document.getElementById('search-banner');
  const searchBannerText = document.getElementById('search-banner-text');
  const btnNextMatch = document.getElementById('btn-next-match');
  const dropZone = document.getElementById('drop-zone');
  const filePicker = document.getElementById('file-picker');
  const btnBrowseFile = document.getElementById('btn-browse-file');
  const statCards = document.querySelectorAll('.stat-card');

  const imageLightboxModal = document.getElementById('image-lightbox-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const modalPrevBtn = document.getElementById('modal-prev-btn');
  const modalNextBtn = document.getElementById('modal-next-btn');
  const modalImageElement = document.getElementById('modal-image-element');
  const modalImageLoader = document.getElementById('modal-image-loader');
  const modalImageTitle = document.getElementById('modal-image-title');
  const modalImageCounter = document.getElementById('modal-image-counter');
  const modalFilenameVal = document.getElementById('modal-filename-val');
  const modalChapterVal = document.getElementById('modal-chapter-val');
  const modalDimensionVal = document.getElementById('modal-dimension-val');
  const modalDeleteBtn = document.getElementById('modal-delete-btn');

  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const mainGrid = document.querySelector('.main-grid');

  function toggleSidebar(forceState) {
    if (!mainGrid) return;
    const shouldCollapse = typeof forceState === 'boolean' ? forceState : !mainGrid.classList.contains('sidebar-collapsed');
    mainGrid.classList.toggle('sidebar-collapsed', shouldCollapse);
    document.body.classList.toggle('sidebar-is-collapsed', shouldCollapse);
  }

  if (btnToggleSidebar) {
    btnToggleSidebar.addEventListener('click', () => toggleSidebar());
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      toggleSidebar();
    }
  });

  document.querySelectorAll('.card.collapsible .card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('a')) return;
      const card = header.closest('.card');
      if (card) {
        card.classList.toggle('collapsed');
      }
    });

    header.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        header.click();
      }
    });
  });

  let activeMode = 'clean';
  let previousModeBeforeBatch = 'clean';
  let currentAnalysis = null;
  let currentEpubPath = '';
  let activeFilter = 'all';

  let batchFiles = [];
  let batchAbortController = null;
  let isBatchRunning = false;

  let currentImageList = [];
  let currentModalIndex = 0;
  let selectedImageFilenames = new Set();

  const inputNewPattern = document.getElementById('input-new-pattern');
  const btnAddPattern = document.getElementById('btn-add-pattern');
  const patternTagsList = document.getElementById('pattern-tags-list');

  const defaultPatterns = [
    'Read on [A-Za-z0-9\\s]+',
    'Visit [A-Za-z0-9\\s\\.-]+ for next chapters',
    'First published on [A-Za-z0-9\\s\\.-]+'
  ];

  function loadCustomPatterns() {
    try {
      const saved = localStorage.getItem('epub_custom_patterns');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [...defaultPatterns];
  }

  let customPatterns = loadCustomPatterns();

  function saveCustomPatterns() {
    try {
      localStorage.setItem('epub_custom_patterns', JSON.stringify(customPatterns));
    } catch (e) {}
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function renderPatternTags() {
    if (!patternTagsList) return;
    if (customPatterns.length === 0) {
      patternTagsList.innerHTML = '<span class="skeleton-loader">No custom ad regex patterns added yet.</span>';
      return;
    }

    patternTagsList.innerHTML = customPatterns.map((pat, idx) => `
      <span class="pattern-tag">
        <code>${escapeHtml(pat)}</code>
        <button type="button" class="btn-remove-tag" data-idx="${idx}" title="Remove pattern">&times;</button>
      </span>
    `).join('');

    patternTagsList.querySelectorAll('.btn-remove-tag').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        customPatterns.splice(idx, 1);
        saveCustomPatterns();
        renderPatternTags();
        if (currentEpubPath) analyzeEpub(currentEpubPath);
      });
    });
  }

  if (btnAddPattern && inputNewPattern) {
    btnAddPattern.addEventListener('click', () => {
      const val = inputNewPattern.value.trim();
      if (val && !customPatterns.includes(val)) {
        customPatterns.push(val);
        saveCustomPatterns();
        renderPatternTags();
        inputNewPattern.value = '';
        if (currentEpubPath) analyzeEpub(currentEpubPath);
      }
    });

    inputNewPattern.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnAddPattern.click();
      }
    });
  }

  renderPatternTags();

  function getSelectedOptions() {
    return {
      clean_zws: optZws ? optZws.checked : true,
      clean_hidden_elements: optHidden ? optHidden.checked : true,
      clean_watermark_attrs: optAttrs ? optAttrs.checked : true,
      clean_custom_patterns: optCustom ? optCustom.checked : true,
      custom_patterns_list: customPatterns
    };
  }

  function switchMode(mode) {
    if (activeMode !== 'batch' && mode !== 'batch') {
      previousModeBeforeBatch = mode;
    }
    activeMode = mode;

    modeTabs.forEach(t => {
      if (t.getAttribute('data-mode') === activeMode) t.classList.add('active');
      else t.classList.remove('active');
    });

    const leftModeKey = (mode === 'batch') ? previousModeBeforeBatch : mode;
    Object.keys(modeLeftPanels).forEach(m => {
      if (modeLeftPanels[m]) {
        if (m === leftModeKey) modeLeftPanels[m].classList.remove('hidden');
        else modeLeftPanels[m].classList.add('hidden');
      }
    });

    Object.keys(modeRightViews).forEach(m => {
      if (modeRightViews[m]) {
        if (m === activeMode) modeRightViews[m].classList.remove('hidden');
        else modeRightViews[m].classList.add('hidden');
      }
    });

    updateActionButtonLabel();

    if (activeMode === 'batch') {
      renderBatchDashboard();
    } else if (currentEpubPath) {
      renderActiveRightView();
    }
  }

  function updateActionButtonLabel() {
    const selectedFiles = batchFiles.filter(b => b.selected);
    const count = selectedFiles.length;

    if (batchFiles.length > 1) {
      if (activeMode === 'clean') {
        btnActionLabel.textContent = `Clean ${count} EPUB Files (Batch Clean)`;
      } else if (activeMode === 'compress') {
        btnActionLabel.textContent = `Compress Images in ${count} EPUB Files (Batch Compress)`;
      } else if (activeMode === 'split') {
        const activeName = currentEpubPath ? currentEpubPath.split(/[\/\\]/).pop() : 'EPUB';
        btnActionLabel.textContent = `Split ${activeName} into Volumes`;
      } else if (activeMode === 'metadata') {
        btnActionLabel.textContent = `Apply Metadata to ${count} EPUB Files (Batch Metadata)`;
      } else if (activeMode === 'batch') {
        const modeTitle = previousModeBeforeBatch === 'compress' ? 'Compression' : (previousModeBeforeBatch === 'metadata' ? 'Metadata' : 'Cleaning');
        btnActionLabel.textContent = `Start Execution on ${count} Files (${modeTitle})`;
      }
    } else {
      if (activeMode === 'clean') btnActionLabel.textContent = 'Clean EPUB Now';
      else if (activeMode === 'compress') btnActionLabel.textContent = 'Compress Images to WebP';
      else if (activeMode === 'split') btnActionLabel.textContent = 'Split EPUB into Volumes';
      else if (activeMode === 'metadata') btnActionLabel.textContent = 'Save EPUB Metadata & Cover';
      else if (activeMode === 'batch') btnActionLabel.textContent = 'Start Batch Processing';
    }
  }

  function renderActiveRightView() {
    if (activeMode === 'clean' && currentAnalysis) {
      updateStatsUI(currentAnalysis);
    } else if (activeMode === 'compress' && currentAnalysis) {
      renderCompressView(currentAnalysis);
    } else if (activeMode === 'split' && currentAnalysis) {
      renderSplitView(currentAnalysis);
    } else if (activeMode === 'metadata') {
      fetchMetadata(currentEpubPath);
    } else if (activeMode === 'batch') {
      renderBatchDashboard();
    }
  }

  function updateBatchQueueUI() {
    if (!batchQueueContainer || !batchQueueList) return;

    const totalCount = batchFiles.length;
    const selectedCount = batchFiles.filter(b => b.selected).length;

    if (totalCount === 0) {
      batchQueueContainer.classList.add('hidden');
      if (navBatchBadge) navBatchBadge.classList.add('hidden');
      updateActionButtonLabel();
      renderBatchDashboard();
      return;
    }

    batchQueueContainer.classList.remove('hidden');
    if (batchFileCount) batchFileCount.textContent = totalCount.toString();
    if (batchSelectedCount) batchSelectedCount.textContent = `${selectedCount} selected`;

    if (navBatchBadge) {
      navBatchBadge.textContent = totalCount.toString();
      navBatchBadge.classList.remove('hidden');
    }

    const totalBytes = batchFiles.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
    if (batchQueueTotals) batchQueueTotals.textContent = `Total: ${formatFileSize(totalBytes)}`;

    if (chkBatchSelectAll) {
      chkBatchSelectAll.checked = (totalCount > 0 && selectedCount === totalCount);
      chkBatchSelectAll.indeterminate = (selectedCount > 0 && selectedCount < totalCount);
    }

    updateActionButtonLabel();

    batchQueueList.innerHTML = batchFiles.map((item, idx) => {
      let statusBadge = '<span class="status-badge badge-pending">Pending</span>';
      let itemClass = '';

      if (item.status === 'uploading') {
        statusBadge = '<span class="status-badge badge-processing"><span class="spinner-icon">&#9696;</span> Uploading...</span>';
        itemClass = 'processing';
      } else if (item.status === 'analyzing') {
        statusBadge = '<span class="status-badge badge-processing"><span class="spinner-icon">&#9696;</span> Analyzing...</span>';
        itemClass = 'processing';
      } else if (item.status === 'processing') {
        statusBadge = '<span class="status-badge badge-processing"><span class="spinner-icon">&#9696;</span> Processing</span>';
        itemClass = 'processing';
      } else if (item.status === 'ready') {
        statusBadge = '<span class="status-badge badge-ready">Ready</span>';
      } else if (item.status === 'success') {
        const savedText = item.savings_bytes ? ` (-${formatFileSize(item.savings_bytes)})` : '';
        statusBadge = `<span class="status-badge badge-success">&#10003; Done${savedText}</span>`;
        itemClass = 'success-item';
      } else if (item.status === 'error') {
        statusBadge = `<span class="status-badge badge-error" title="${escapeHtml(item.error || 'Failed')}">&#10007; Failed</span>`;
        itemClass = 'error-item';
      }

      let metaInfo = formatFileSize(item.size_bytes);
      if (item.analysis) {
        metaInfo += ` | ${item.analysis.total_zws_chars || 0} ZWS | ${item.analysis.total_hidden_elements || 0} Hidden`;
      }

      return `
        <div class="batch-file-item ${item.path === currentEpubPath ? 'selected' : ''} ${itemClass}" data-idx="${idx}">
          <div class="batch-item-left">
            <input type="checkbox" class="batch-item-chk" data-idx="${idx}" ${item.selected ? 'checked' : ''}>
            <div class="batch-file-info">
              <span class="batch-file-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
              <span class="batch-file-meta">${metaInfo}</span>
            </div>
          </div>
          <div class="batch-file-actions">
            ${statusBadge}
            <button type="button" class="btn-remove-batch-item" data-idx="${idx}" title="Remove from queue">&times;</button>
          </div>
        </div>
      `;
    }).join('');

    batchQueueList.querySelectorAll('.batch-item-chk').forEach(chk => {
      chk.addEventListener('click', (e) => e.stopPropagation());
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (batchFiles[idx]) {
          batchFiles[idx].selected = e.currentTarget.checked;
          updateBatchQueueUI();
        }
      });
    });

    batchQueueList.querySelectorAll('.btn-remove-batch-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        batchFiles.splice(idx, 1);
        if (batchFiles.length > 0) {
          if (!batchFiles.some(b => b.path === currentEpubPath)) {
            selectBatchItem(0);
          }
        } else {
          currentEpubPath = '';
          if (pathInput) pathInput.value = '';
          currentAnalysis = null;
        }
        updateBatchQueueUI();
      });
    });

    batchQueueList.querySelectorAll('.batch-file-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        selectBatchItem(idx);
      });
    });

    renderBatchDashboard();
  }

  function selectBatchItem(idx) {
    const target = batchFiles[idx];
    if (!target || !target.path) return;

    currentEpubPath = target.path;
    if (pathInput) pathInput.value = currentEpubPath;

    if (target.analysis) {
      currentAnalysis = target.analysis;
      populateChapterDropdown(currentAnalysis);
      renderActiveRightView();
      loadChapterPreview(currentEpubPath, 0);
    } else {
      analyzeEpub(currentEpubPath);
    }
    updateBatchQueueUI();
  }

  if (btnClearBatch) {
    btnClearBatch.addEventListener('click', () => {
      if (isBatchRunning) {
        alert('Cannot clear queue while a batch job is running.');
        return;
      }
      batchFiles = [];
      currentEpubPath = '';
      if (pathInput) pathInput.value = '';
      currentAnalysis = null;
      updateBatchQueueUI();
    });
  }

  if (chkBatchSelectAll) {
    chkBatchSelectAll.addEventListener('change', () => {
      const isChecked = chkBatchSelectAll.checked;
      batchFiles.forEach(b => { b.selected = isChecked; });
      updateBatchQueueUI();
    });
  }

  if (btnAddMoreFiles && filePicker) {
    btnAddMoreFiles.addEventListener('click', () => {
      filePicker.click();
    });
  }

  if (btnBrowseOutputFolder) {
    btnBrowseOutputFolder.addEventListener('click', async () => {
      try {
        btnBrowseOutputFolder.disabled = true;
        btnBrowseOutputFolder.textContent = 'Opening...';
        const res = await fetch(`/api/browse-folder?initial=${encodeURIComponent(chosenOutputFolder || '')}&title=${encodeURIComponent('Select Output Folder')}`);
        const data = await res.json();
        if (data.status === 'ok' && data.folder) {
          chosenOutputFolder = data.folder;
          if (outputFolderInput) {
            outputFolderInput.value = chosenOutputFolder;
            outputFolderInput.title = chosenOutputFolder;
          }
          if (btnResetOutputFolder) {
            btnResetOutputFolder.classList.remove('hidden');
          }
        }
      } catch (err) {
        console.error('Failed to open folder picker:', err);
      } finally {
        btnBrowseOutputFolder.disabled = false;
        btnBrowseOutputFolder.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> Browse...`;
      }
    });
  }

  if (btnResetOutputFolder) {
    btnResetOutputFolder.addEventListener('click', () => {
      chosenOutputFolder = '';
      if (outputFolderInput) {
        outputFolderInput.value = '';
        outputFolderInput.title = '';
      }
      btnResetOutputFolder.classList.add('hidden');
    });
  }

  const btnCleanTempCache = document.getElementById('btn-clean-temp-cache');
  if (btnCleanTempCache) {
    btnCleanTempCache.addEventListener('click', async () => {
      try {
        btnCleanTempCache.textContent = 'Cleaning...';
        const res = await fetch('/api/cleanup-temp', { method: 'POST' });
        const data = await res.json();
        if (data.status === 'ok') {
          showToast(`Cleaned ${data.removed_count || 0} temporary uploaded files from cache.`, 'success');
        } else {
          showToast('Failed to clean temp cache: ' + (data.error || 'Unknown error'), 'info');
        }
      } catch (err) {
        showToast('Network error while cleaning cache.', 'info');
      } finally {
        btnCleanTempCache.textContent = 'Clean Temp';
      }
    });
  }

  function renderBatchDashboard() {
    if (!batchMatrixTbody) return;

    const totalFiles = batchFiles.length;
    const selectedFiles = batchFiles.filter(b => b.selected);
    const successFiles = batchFiles.filter(b => b.status === 'success');
    const failedFiles = batchFiles.filter(b => b.status === 'error');

    if (batchStatTotalFiles) {
      batchStatTotalFiles.textContent = `${totalFiles} Files (${selectedFiles.length} Active)`;
    }

    const totalOrigBytes = batchFiles.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
    if (batchStatOrigSize) batchStatOrigSize.textContent = formatFileSize(totalOrigBytes);

    let totalProcBytes = 0;
    let hasProcessed = false;
    batchFiles.forEach(f => {
      if (f.cleaned_size_bytes) {
        totalProcBytes += f.cleaned_size_bytes;
        hasProcessed = true;
      } else {
        totalProcBytes += f.size_bytes || 0;
      }
    });

    if (batchStatProcSize) {
      batchStatProcSize.textContent = hasProcessed ? formatFileSize(totalProcBytes) : '-';
    }

    const totalSavedBytes = hasProcessed ? Math.max(0, totalOrigBytes - totalProcBytes) : 0;
    const totalSavedPct = (totalOrigBytes > 0 && hasProcessed) ? ((totalSavedBytes / totalOrigBytes) * 100).toFixed(1) : '0';

    if (batchStatSavedSize) {
      batchStatSavedSize.textContent = hasProcessed ? `${formatFileSize(totalSavedBytes)} (${totalSavedPct}%)` : '-';
    }

    if (batchMatrixStatusSummary) {
      const waiting = batchFiles.filter(b => b.status === 'ready' || b.status === 'pending').length;
      batchMatrixStatusSummary.textContent = `${successFiles.length} Succeeded | ${failedFiles.length} Failed | ${waiting} Pending`;
    }

    if (btnBatchDashRetryFailed && batchFailedCount) {
      batchFailedCount.textContent = failedFiles.length.toString();
      if (failedFiles.length > 0) {
        btnBatchDashRetryFailed.classList.remove('hidden');
      } else {
        btnBatchDashRetryFailed.classList.add('hidden');
      }
    }

    const searchQuery = (batchMatrixSearch && typeof batchMatrixSearch.value === 'string') ? batchMatrixSearch.value.trim().toLowerCase() : '';
    const statusFilter = (batchFilterStatus && batchFilterStatus.value) ? batchFilterStatus.value : 'all';

    const filteredFiles = batchFiles.filter(f => {
      if (searchQuery && !f.name.toLowerCase().includes(searchQuery)) return false;
      if (statusFilter !== 'all' && f.status !== statusFilter) return false;
      return true;
    });

    if (chkMatrixSelectAll) {
      const allSelected = filteredFiles.length > 0 && filteredFiles.every(f => f.selected);
      chkMatrixSelectAll.checked = allSelected;
    }

    if (filteredFiles.length === 0) {
      batchMatrixTbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-batch-cell">
            <div class="skeleton-loader">No EPUB files in queue match the selected filter.</div>
          </td>
        </tr>
      `;
      return;
    }

    batchMatrixTbody.innerHTML = filteredFiles.map(item => {
      const globalIdx = batchFiles.indexOf(item);
      const isInspected = (item.path === currentEpubPath);
      const isProc = (item.status === 'processing' || item.status === 'uploading' || item.status === 'analyzing');

      let statusBadge = '<span class="status-badge badge-pending">Pending</span>';
      if (isProc) {
        statusBadge = '<span class="status-badge badge-processing"><span class="spinner-icon">&#9696;</span> Processing</span>';
      } else if (item.status === 'ready') {
        statusBadge = '<span class="status-badge badge-ready">Ready</span>';
      } else if (item.status === 'success') {
        statusBadge = '<span class="status-badge badge-success">&#10003; Done</span>';
      } else if (item.status === 'error') {
        statusBadge = `<span class="status-badge badge-error" title="${escapeHtml(item.error || '')}">&#10007; Failed</span>`;
      }

      let findingsHtml = '<span class="matrix-tag tag-clean">Clean</span>';
      if (item.analysis) {
        const an = item.analysis;
        const tags = [];
        if (an.total_zws_chars > 0) tags.push(`<span class="matrix-tag tag-zws" title="Zero-Width Spaces">${an.total_zws_chars} ZWS</span>`);
        if (an.total_hidden_elements > 0) tags.push(`<span class="matrix-tag tag-hidden" title="Hidden Elements">${an.total_hidden_elements} Hidden</span>`);
        if (an.total_watermark_attrs > 0) tags.push(`<span class="matrix-tag tag-attrs" title="Watermark Attributes">${an.total_watermark_attrs} Attrs</span>`);
        if (an.total_images_count > 0) tags.push(`<span class="matrix-tag tag-images" title="Internal Images">${an.total_images_count} Img</span>`);
        if (tags.length > 0) findingsHtml = tags.join(' ');
      }

      const origSizeText = formatFileSize(item.size_bytes);
      const newSizeText = item.cleaned_size_bytes ? formatFileSize(item.cleaned_size_bytes) : '-';
      const savedText = item.savings_bytes ? `<span class="matrix-saved-badge">-${formatFileSize(item.savings_bytes)}</span>` : '-';

      let actionsHtml = `
        <button type="button" class="matrix-action-btn btn-inspect" data-idx="${globalIdx}" title="Inspect chapter in Live Preview">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          Inspect
        </button>
      `;

      if (item.status === 'success' && item.result && item.result.output_file) {
        actionsHtml += `
          <a href="/api/download?file=${encodeURIComponent(item.result.output_file)}" class="matrix-action-btn btn-dl" title="Download this file">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </a>
        `;
      } else if (item.status === 'error') {
        actionsHtml += `
          <button type="button" class="matrix-action-btn btn-retry" data-idx="${globalIdx}" title="Retry processing this file">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          </button>
        `;
      }

      return `
        <tr class="matrix-row ${isInspected ? 'active-inspect' : ''} ${isProc ? 'is-processing' : ''}" data-idx="${globalIdx}">
          <td class="col-check">
            <input type="checkbox" class="matrix-row-chk" data-idx="${globalIdx}" ${item.selected ? 'checked' : ''}>
          </td>
          <td class="col-name">
            <div class="matrix-file-cell">
              <span class="matrix-file-name" data-idx="${globalIdx}" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
              <span class="matrix-file-path" title="${escapeHtml(item.path || '')}">${escapeHtml(item.path || '')}</span>
            </div>
          </td>
          <td class="col-size"><span class="matrix-size-val">${origSizeText}</span></td>
          <td class="col-newsize"><span class="matrix-size-val">${newSizeText}</span></td>
          <td class="col-saved">${savedText}</td>
          <td class="col-findings"><div class="matrix-findings-wrap">${findingsHtml}</div></td>
          <td class="col-status">${statusBadge}</td>
          <td class="col-actions"><div class="matrix-actions-cell">${actionsHtml}</div></td>
        </tr>
      `;
    }).join('');

    batchMatrixTbody.querySelectorAll('.matrix-row-chk').forEach(chk => {
      chk.addEventListener('click', (e) => e.stopPropagation());
      chk.addEventListener('change', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (batchFiles[idx]) {
          batchFiles[idx].selected = e.currentTarget.checked;
          updateBatchQueueUI();
        }
      });
    });

    batchMatrixTbody.querySelectorAll('.matrix-file-name, .btn-inspect').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        selectBatchItem(idx);
        switchMode('clean');
      });
    });

    batchMatrixTbody.querySelectorAll('.btn-retry').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (batchFiles[idx]) {
          batchFiles[idx].status = 'ready';
          batchFiles[idx].error = null;
          updateBatchQueueUI();
          runSingleBatchItem(idx);
        }
      });
    });
  }

  if (chkMatrixSelectAll) {
    chkMatrixSelectAll.addEventListener('change', () => {
      const isChecked = chkMatrixSelectAll.checked;
      batchFiles.forEach(b => { b.selected = isChecked; });
      updateBatchQueueUI();
    });
  }

  if (batchMatrixSearch) {
    batchMatrixSearch.addEventListener('input', () => renderBatchDashboard());
  }

  if (batchFilterStatus) {
    batchFilterStatus.addEventListener('change', () => renderBatchDashboard());
  }

  if (btnBatchDashRetryFailed) {
    btnBatchDashRetryFailed.addEventListener('click', () => {
      batchFiles.filter(b => b.status === 'error').forEach(b => {
        b.status = 'ready';
        b.selected = true;
        b.error = null;
      });
      updateBatchQueueUI();
      executeAction();
    });
  }

  if (btnBatchDashExport) {
    btnBatchDashExport.addEventListener('click', () => {
      exportBatchReport();
    });
  }

  function exportBatchReport() {
    if (batchFiles.length === 0) {
      alert('No batch data available to export.');
      return;
    }

    const reportData = {
      export_time: new Date().toISOString(),
      active_mode: activeMode,
      total_files: batchFiles.length,
      successful: batchFiles.filter(b => b.status === 'success').length,
      failed: batchFiles.filter(b => b.status === 'error').length,
      total_original_bytes: batchFiles.reduce((acc, f) => acc + (f.size_bytes || 0), 0),
      total_cleaned_bytes: batchFiles.reduce((acc, f) => acc + (f.cleaned_size_bytes || f.size_bytes || 0), 0),
      files: batchFiles.map(f => ({
        name: f.name,
        path: f.path,
        status: f.status,
        original_size_bytes: f.size_bytes,
        processed_size_bytes: f.cleaned_size_bytes || null,
        savings_bytes: f.savings_bytes || 0,
        error: f.error || null,
        analysis: f.analysis || null,
        result: f.result || null
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `epub_batch_report_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function handleBatchFiles(fileList) {
    const files = Array.from(fileList).filter(f => f.name.toLowerCase().endsWith('.epub'));
    if (files.length === 0) {
      alert('No valid .epub files selected.');
      return;
    }

    const newBatchItems = [];
    for (const f of files) {
      const existing = batchFiles.find(b => b.name === f.name && b.size_bytes === f.size);
      if (!existing) {
        const item = {
          id: 'b_' + Math.random().toString(36).substr(2, 9),
          name: f.name,
          size_bytes: f.size,
          selected: true,
          status: 'uploading',
          fileObj: f,
          path: null,
          analysis: null,
          result: null,
          cleaned_size_bytes: null,
          savings_bytes: null,
          error: null
        };
        batchFiles.push(item);
        newBatchItems.push(item);
      }
    }

    updateBatchQueueUI();

    for (const item of newBatchItems) {
      try {
        item.status = 'uploading';
        updateBatchQueueUI();

        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Filename': encodeURIComponent(item.name)
          },
          body: item.fileObj
        });
        const data = await res.json();

        if (data.status === 'ok') {
          item.path = data.path;
          item.status = 'analyzing';
          updateBatchQueueUI();

          const anRes = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: item.path, options: getSelectedOptions() })
          });
          const anData = await anRes.json();
          if (anData.status === 'ok') {
            item.analysis = anData.analysis;
            item.status = 'ready';
          } else {
            item.status = 'ready';
          }
        } else {
          item.status = 'error';
          item.error = 'Failed to upload file';
        }
      } catch (err) {
        item.status = 'error';
        item.error = 'Network error: ' + err.message;
      }
      updateBatchQueueUI();
    }

    if (batchFiles.length > 0 && !currentEpubPath) {
      selectBatchItem(0);
    }
  }

  async function executeAction() {
    if (!currentEpubPath && pathInput && pathInput.value.trim()) {
      currentEpubPath = pathInput.value.trim();
    }
    const selectedFiles = batchFiles.filter(b => b.selected);

    if (selectedFiles.length === 0 && !currentEpubPath) {
      alert('Please select or enter an EPUB file to process.');
      return;
    }

    if (activeMode === 'split') {
      if (!currentEpubPath) {
        alert('Please select an EPUB file to split.');
        return;
      }
      runSingleSplit(currentEpubPath);
      return;
    }

    if (batchFiles.length > 1 || (selectedFiles.length > 0 && activeMode === 'batch')) {
      runBatchExecution(selectedFiles);
    } else {
      const targetPath = currentEpubPath || (selectedFiles[0] ? selectedFiles[0].path : null);
      if (!targetPath) {
        alert('Please select an EPUB file first.');
        return;
      }
      runSingleExecution(targetPath);
    }
  }

  async function runBatchExecution(targetFiles) {
    if (isBatchRunning) return;
    isBatchRunning = true;
    batchAbortController = new AbortController();

    btnExecuteAction.disabled = true;
    if (btnCancelBatch) btnCancelBatch.classList.remove('hidden');
    progressWrapper.classList.remove('hidden');
    downloadBox.classList.add('hidden');
    singleDownloadWrapper.classList.add('hidden');
    multiDownloadWrapper.classList.add('hidden');
    if (batchDownloadWrapper) batchDownloadWrapper.classList.add('hidden');

    const destConfig = getOutputDestination();
    const effectiveMode = (activeMode === 'batch') ? previousModeBeforeBatch : activeMode;
    const totalToProcess = targetFiles.length;

    updateProgress(0, `Starting batch execution (${totalToProcess} files)...`);

    let processedCount = 0;
    let successfulCount = 0;
    let failedCount = 0;
    let totalSavingsAccum = 0;

    for (let i = 0; i < targetFiles.length; i++) {
      if (batchAbortController.signal.aborted) {
        break;
      }

      const item = targetFiles[i];
      item.status = 'processing';
      updateBatchQueueUI();

      const pct = Math.round(((i) / totalToProcess) * 100);
      updateProgress(pct, `[${i + 1}/${totalToProcess}] Processing: ${item.name}...`);

      try {
        let resData = null;

        if (effectiveMode === 'clean') {
          const res = await fetch('/api/clean', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: item.path,
              options: getSelectedOptions(),
              output_mode: destConfig.output_mode,
              output_dir: destConfig.output_dir
            }),
            signal: batchAbortController.signal
          });
          resData = await res.json();

        } else if (effectiveMode === 'compress') {
          const quality = parseInt(webpQualityInput ? webpQualityInput.value : 75, 10) || 75;
          const maxRes = parseInt(maxResSelect ? maxResSelect.value : 1000, 10) || 1000;

          const res = await fetch('/api/compress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: item.path,
              webp_quality: quality,
              max_image_res: maxRes,
              output_mode: destConfig.output_mode,
              output_dir: destConfig.output_dir
            }),
            signal: batchAbortController.signal
          });
          resData = await res.json();

        } else if (effectiveMode === 'metadata') {
          const updatedMeta = {
            title: metaTitleInput.value.trim(),
            creator: metaCreatorInput.value.trim(),
            description: metaDescInput.value.trim(),
            publisher: metaPublisherInput.value.trim(),
            language: metaLangInput.value.trim()
          };

          const res = await fetch('/api/metadata/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: item.path,
              metadata: updatedMeta,
              cover_b64: newCoverB64,
              cover_ext: newCoverExt,
              output_mode: destConfig.output_mode,
              output_dir: destConfig.output_dir
            }),
            signal: batchAbortController.signal
          });
          resData = await res.json();
        }

        if (resData && resData.status === 'ok') {
          const r = resData.result;
          item.status = 'success';
          item.result = r;
          item.cleaned_size_bytes = r.cleaned_size_bytes || r.compressed_size_bytes || item.size_bytes;
          item.savings_bytes = r.size_difference_bytes || Math.max(0, item.size_bytes - item.cleaned_size_bytes);
          totalSavingsAccum += item.savings_bytes;
          successfulCount++;
        } else {
          item.status = 'error';
          item.error = (resData && resData.error) ? resData.error : 'Failed to process file';
          failedCount++;
        }
      } catch (err) {
        if (batchAbortController.signal.aborted) {
          item.status = 'ready';
          break;
        }
        item.status = 'error';
        item.error = err.message || 'Network error';
        failedCount++;
      }

      processedCount++;
      updateBatchQueueUI();
    }

    const wasAborted = batchAbortController.signal.aborted;
    isBatchRunning = false;
    btnExecuteAction.disabled = false;
    if (btnCancelBatch) btnCancelBatch.classList.add('hidden');

    if (wasAborted) {
      updateProgress(100, `Batch process cancelled. (${processedCount} processed, ${successfulCount} succeeded).`);
    } else {
      updateProgress(100, `Batch Complete: ${successfulCount} Succeeded, ${failedCount} Failed.`);
    }

    setTimeout(() => {
      progressWrapper.classList.add('hidden');
      downloadBox.classList.remove('hidden');

      const actionTitle = effectiveMode === 'compress' ? 'Batch Compression Complete' : (effectiveMode === 'metadata' ? 'Batch Metadata Update Complete' : 'Batch Cleaning Complete');
      resultSuccessMsg.textContent = `${actionTitle}! (${successfulCount} of ${totalToProcess} files succeeded)`;

      const origSum = targetFiles.reduce((acc, f) => acc + (f.size_bytes || 0), 0);
      const newSum = targetFiles.reduce((acc, f) => acc + (f.cleaned_size_bytes || f.size_bytes || 0), 0);
      updateSizeDetailsUI(origSum, newSum);

      const successfulFiles = targetFiles.filter(f => f.status === 'success' && f.result && f.result.output_file);
      if (successfulFiles.length > 0) {
        resultOutputPath.textContent = `Saved to destination (${destConfig.output_mode === 'same_dir' ? 'Source Directory' : 'Output Directory'}). Download individually or as ZIP archive:`;

        if (batchDownloadWrapper) batchDownloadWrapper.classList.remove('hidden');
        singleDownloadWrapper.classList.add('hidden');

        multiDownloadWrapper.innerHTML = successfulFiles.map((f, idx) => `
          <div class="part-download-item">
            <span class="part-name" title="${escapeHtml(f.name)}">${escapeHtml(f.name)} (${formatFileSize(f.cleaned_size_bytes)})</span>
            <a href="/api/download?file=${encodeURIComponent(f.result.output_file)}">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </a>
          </div>
        `).join('');
        multiDownloadWrapper.classList.remove('hidden');
        showToast(`${actionTitle}! (${successfulCount} of ${totalToProcess} files succeeded)`, 'success');

        if (btnDownloadBatchZip) {
          btnDownloadBatchZip.onclick = async () => {
            const pathsToZip = successfulFiles.map(f => f.result.output_file);
            try {
              const zRes = await fetch('/api/download-zip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ files: pathsToZip })
              });
              const zData = await zRes.json();
              if (zData.status === 'ok') {
                window.location.href = `/api/download?file=${encodeURIComponent(zData.zip_path)}`;
              } else {
                alert('Failed to pack ZIP archive: ' + (zData.error || 'Unknown error'));
              }
            } catch (err) {
              alert('Network error occurred.');
            }
          };
        }

        if (btnOpenFolder) {
          const sampleOutput = successfulFiles[0].result.output_file;
          btnOpenFolder.onclick = async () => {
            try {
              await fetch('/api/open-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: sampleOutput })
              });
            } catch (e) {}
          };
        }
      }
    }, 600);
  }

  if (btnCancelBatch) {
    btnCancelBatch.addEventListener('click', () => {
      if (batchAbortController) {
        batchAbortController.abort();
        btnCancelBatch.textContent = 'Cancelling...';
      }
    });
  }

  async function runSingleBatchItem(idx) {
    const item = batchFiles[idx];
    if (!item) return;
    item.selected = true;
    runBatchExecution([item]);
  }

  async function runSingleExecution(targetPath) {
    btnExecuteAction.disabled = true;
    progressWrapper.classList.remove('hidden');
    downloadBox.classList.add('hidden');
    singleDownloadWrapper.classList.add('hidden');
    multiDownloadWrapper.classList.add('hidden');
    if (batchDownloadWrapper) batchDownloadWrapper.classList.add('hidden');

    const destConfig = getOutputDestination();

    if (activeMode === 'clean') {
      updateProgress(20, 'Reading EPUB structure...');
      try {
        setTimeout(() => updateProgress(50, 'Removing zero-width characters & hidden containers...'), 300);

        const res = await fetch('/api/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: targetPath,
            options: getSelectedOptions(),
            output_mode: destConfig.output_mode,
            output_dir: destConfig.output_dir
          })
        });
        const data = await res.json();

        if (data.status === 'ok') {
          updateProgress(100, 'Cleaning Complete!');
          setTimeout(() => {
            resetProgressUI();
            const r = data.result;
            resultSuccessMsg.textContent = 'EPUB Cleaned Successfully!';
            resultOutputPath.textContent = `Saved to: ${r.output_file}`;
            btnDownloadFile.href = `/api/download?file=${encodeURIComponent(r.output_file)}`;
            updateSizeDetailsUI(r.original_size_bytes, r.cleaned_size_bytes);

            singleDownloadWrapper.classList.remove('hidden');
            downloadBox.classList.remove('hidden');

            statZws.textContent = r.zws_removed.toLocaleString();
            statHidden.textContent = r.hidden_elements_removed.toLocaleString();
            statAttrs.textContent = r.watermark_attrs_removed.toLocaleString();
            statSizeSaved.textContent = formatFileSize(r.size_difference_bytes);

            currentEpubPath = r.output_file;
            if (pathInput) pathInput.value = r.output_file;

            showToast('EPUB Cleaned Successfully!', 'success', `/api/download?file=${encodeURIComponent(r.output_file)}`);
            analyzeEpub(r.output_file);
          }, 500);
        } else {
          alert('Failed to clean EPUB: ' + (data.error || 'Unknown error'));
          resetProgressUI();
        }
      } catch (err) {
        alert('Network error occurred.');
        resetProgressUI();
      }

    } else if (activeMode === 'compress') {
      updateProgress(20, 'Scanning internal EPUB images...');
      try {
        setTimeout(() => updateProgress(50, 'Converting & compressing images to WebP...'), 400);

        const quality = parseInt(webpQualityInput ? webpQualityInput.value : 75, 10) || 75;
        const maxRes = parseInt(maxResSelect ? maxResSelect.value : 1000, 10) || 1000;

        const res = await fetch('/api/compress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: targetPath,
            webp_quality: quality,
            max_image_res: maxRes,
            output_mode: destConfig.output_mode,
            output_dir: destConfig.output_dir
          })
        });
        const data = await res.json();

        if (data.status === 'ok') {
          updateProgress(100, 'Image Compression Complete!');
          setTimeout(() => {
            resetProgressUI();
            const r = data.result;
            resultSuccessMsg.textContent = `Compression Complete! (${r.images_compressed} images compressed)`;
            resultOutputPath.textContent = `Saved to: ${r.output_file}`;
            btnDownloadFile.href = `/api/download?file=${encodeURIComponent(r.output_file)}`;
            updateSizeDetailsUI(r.original_size_bytes, r.compressed_size_bytes);

            singleDownloadWrapper.classList.remove('hidden');
            downloadBox.classList.remove('hidden');

            statSizeSaved.textContent = formatFileSize(r.size_difference_bytes);

            currentEpubPath = r.output_file;
            if (pathInput) pathInput.value = r.output_file;

            const savedPct = r.original_size_bytes > 0 ? ((r.size_difference_bytes / r.original_size_bytes) * 100).toFixed(0) : 0;
            showToast(`Image Compression Complete! Saved ${formatFileSize(r.size_difference_bytes)} (~${savedPct}%)`, 'success', `/api/download?file=${encodeURIComponent(r.output_file)}`);

            analyzeEpub(r.output_file);
          }, 500);
        } else {
          alert('Failed to compress EPUB: ' + (data.error || 'Unknown error'));
          resetProgressUI();
        }
      } catch (err) {
        alert('Network error occurred.');
        resetProgressUI();
      }

    } else if (activeMode === 'metadata') {
      updateProgress(20, 'Preparing metadata & cover image...');
      try {
        setTimeout(() => updateProgress(50, 'Updating OPF document & packing book cover...'), 400);

        const updatedMeta = {
          title: metaTitleInput.value.trim(),
          creator: metaCreatorInput.value.trim(),
          description: metaDescInput.value.trim(),
          publisher: metaPublisherInput.value.trim(),
          language: metaLangInput.value.trim()
        };

        const res = await fetch('/api/metadata/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: targetPath,
            metadata: updatedMeta,
            cover_b64: newCoverB64,
            cover_ext: newCoverExt,
            output_mode: destConfig.output_mode,
            output_dir: destConfig.output_dir
          })
        });
        const data = await res.json();

        if (data.status === 'ok') {
          updateProgress(100, 'Metadata & Cover Successfully Saved!');
          setTimeout(() => {
            resetProgressUI();
            const r = data.result;
            resultSuccessMsg.textContent = 'EPUB Information & Cover Updated Successfully!';
            resultOutputPath.textContent = `Saved to: ${r.output_file}`;
            btnDownloadFile.href = `/api/download?file=${encodeURIComponent(r.output_file)}`;

            singleDownloadWrapper.classList.remove('hidden');
            downloadBox.classList.remove('hidden');

            currentEpubPath = r.output_file;
            if (pathInput) pathInput.value = r.output_file;

            showToast('EPUB Information & Cover Updated Successfully!', 'success', `/api/download?file=${encodeURIComponent(r.output_file)}`);

            fetchMetadata(r.output_file);
          }, 500);
        } else {
          alert('Failed to save metadata: ' + (data.error || 'Unknown error'));
          resetProgressUI();
        }
      } catch (err) {
        alert('Network error occurred.');
        resetProgressUI();
      }
    }
  }

  async function runSingleSplit(targetPath) {
    btnExecuteAction.disabled = true;
    progressWrapper.classList.remove('hidden');
    downloadBox.classList.add('hidden');
    singleDownloadWrapper.classList.add('hidden');
    multiDownloadWrapper.classList.add('hidden');

    updateProgress(20, 'Selecting EPUB volume split points...');
    try {
      setTimeout(() => updateProgress(50, 'Partitioning OPF manifest & compressing volumes...'), 400);

      const maxSizeMb = parseFloat(splitSizeInput ? splitSizeInput.value : 10) || 10;
      const quality = parseInt(webpQualityInput ? webpQualityInput.value : 75, 10) || 75;
      const maxRes = parseInt(maxResSelect ? maxResSelect.value : 1000, 10) || 1000;

      const res = await fetch('/api/split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: targetPath,
          max_size_mb: maxSizeMb,
          use_webp: optSplitWebp ? optSplitWebp.checked : true,
          webp_quality: quality,
          max_image_res: maxRes
        })
      });
      const data = await res.json();

      if (data.status === 'ok') {
        updateProgress(100, 'EPUB Splitting Complete!');
        setTimeout(() => {
          resetProgressUI();
          const parts = data.parts || [];
          resultSuccessMsg.textContent = `Successfully Split into ${parts.length} Volumes!`;
          resultOutputPath.textContent = `Saved in target folder (${parts.length} volume files). Click links below to download:`;

          const origTotal = currentAnalysis ? currentAnalysis.file_size_bytes : 0;
          const newTotal = parts.reduce((acc, p) => acc + p.size_bytes, 0);
          updateSizeDetailsUI(origTotal, newTotal);

          multiDownloadWrapper.innerHTML = parts.map((p, idx) => `
            <div class="part-download-item">
              <span class="part-name" title="${escapeHtml(p.filename)}">${escapeHtml(p.filename)} (${formatFileSize(p.size_bytes)})</span>
              <a href="/api/download?file=${encodeURIComponent(p.path)}">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download Volume ${idx + 1}
              </a>
            </div>
          `).join('');

          multiDownloadWrapper.classList.remove('hidden');
          downloadBox.classList.remove('hidden');

          showToast(`Successfully Split EPUB into ${parts.length} Volumes!`, 'success');
        }, 500);
      } else {
        alert('Failed to split EPUB: ' + (data.error || 'Unknown error'));
        resetProgressUI();
      }
    } catch (err) {
      alert('Network error occurred.');
      resetProgressUI();
    }
  }

  function showToast(message, type = 'success', downloadUrl = null) {
    let toastContainer = document.getElementById('app-toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'app-toast-container';
      toastContainer.className = 'app-toast-container';
      document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `app-toast toast-${type}`;

    let downloadBtnHtml = '';
    if (downloadUrl) {
      downloadBtnHtml = `
        <a href="${downloadUrl}" class="toast-btn-download" title="Download processed file">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Download
        </a>
      `;
    }

    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
        <span class="toast-msg">${escapeHtml(message)}</span>
      </div>
      ${downloadBtnHtml}
      <button type="button" class="toast-close" title="Close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('toast-fadeout');
      setTimeout(() => toast.remove(), 250);
    });

    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('toast-fadeout');
        setTimeout(() => toast.remove(), 250);
      }
    }, 7000);
  }

  function updateProgress(percent, text) {
    if (progressFill) progressFill.style.width = `${percent}%`;
    if (progressPercent) progressPercent.textContent = `${percent}%`;
    if (progressText) progressText.textContent = text;
  }

  function resetProgressUI() {
    btnExecuteAction.disabled = false;
    if (btnCancelBatch) btnCancelBatch.classList.add('hidden');
    progressWrapper.classList.add('hidden');
  }

  function updateSizeDetailsUI(origBytes, newBytes) {
    if (!resultOrigSize || !resultNewSize || !resultSavedBadge) return;
    resultOrigSize.textContent = formatFileSize(origBytes);
    resultNewSize.textContent = formatFileSize(newBytes);

    const saved = Math.max(0, origBytes - newBytes);
    const pct = origBytes > 0 ? ((saved / origBytes) * 100).toFixed(1) : 0;
    resultSavedBadge.textContent = `Saved ${formatFileSize(saved)} (${pct}%)`;
  }

  async function analyzeEpub(filePath) {
    if (!filePath) return;

    if (beforePreview) beforePreview.innerHTML = '<div class="skeleton-loader">Analyzing EPUB structure...</div>';
    if (afterPreview) afterPreview.innerHTML = '<div class="skeleton-loader">Calculating cleaning preview...</div>';

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          options: getSelectedOptions()
        })
      });
      const data = await res.json();

      if (data.status === 'ok') {
        currentAnalysis = data.analysis;

        const matched = batchFiles.find(b => b.path === filePath);
        if (matched) {
          matched.analysis = currentAnalysis;
          matched.status = 'ready';
          updateBatchQueueUI();
        }

        populateChapterDropdown(currentAnalysis);
        renderActiveRightView();
        loadChapterPreview(filePath, 0);
      } else {
        if (beforePreview) beforePreview.textContent = 'Analysis failed: ' + (data.error || 'Unknown error');
        if (afterPreview) afterPreview.textContent = 'Failed to generate preview.';
      }
    } catch (err) {
      if (beforePreview) beforePreview.textContent = 'Network error occurred.';
      if (afterPreview) afterPreview.textContent = 'Network error occurred.';
    }
  }

  function populateChapterDropdown(analysis) {
    if (!chapterSelect || !analysis || !analysis.chapters_summary) return;
    chapterSelect.disabled = false;
    chapterSelect.innerHTML = analysis.chapters_summary.map(ch => {
      const issues = [];
      if (ch.zws_count > 0) issues.push(`${ch.zws_count} ZWS`);
      if (ch.hidden_elements_count > 0) issues.push(`${ch.hidden_elements_count} Hidden`);
      if (ch.watermark_attrs_count > 0) issues.push(`${ch.watermark_attrs_count} Attrs`);
      if (ch.custom_patterns_matched > 0) issues.push(`${ch.custom_patterns_matched} Promo`);

      const issueStr = issues.length > 0 ? ` [${issues.join(', ')}]` : '';
      return `<option value="${ch.index}">${escapeHtml(ch.short_name)}${issueStr}</option>`;
    }).join('');
  }

  async function loadChapterPreview(filePath, chapterIndex) {
    if (!filePath) return;

    if (beforePreview) beforePreview.innerHTML = '<div class="skeleton-loader">Loading chapter preview...</div>';
    if (afterPreview) afterPreview.innerHTML = '<div class="skeleton-loader">Loading chapter preview...</div>';

    try {
      const res = await fetch('/api/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: filePath,
          chapter_index: chapterIndex,
          options: getSelectedOptions()
        })
      });
      const data = await res.json();

      if (data.status === 'ok') {
        const preview = data.preview;
        if (beforePreview) beforePreview.innerHTML = preview.before_html;
        if (afterPreview) afterPreview.innerHTML = preview.after_html;

        if (rawBeforeCode) {
          let escapedRaw = escapeHtml(preview.before_html);
          escapedRaw = escapedRaw.replace(
            /(class|id|style|title|lang|dir|data-[a-z0-9_-]+|aria-[a-z0-9_-]+|epub:[a-z0-9_-]+|xml:[a-z0-9_-]+|xlink:[a-z0-9_-]+|xmlns:[a-z0-9_-]+|[a-z0-9_-]+)=&quot;([^&]*)&quot;/gi,
            (match, p1, p2) => {
              const lowerP1 = p1.toLowerCase();
              const stdAttrs = ['id', 'class', 'style', 'title', 'lang', 'dir', 'src', 'href', 'alt', 'type', 'rel', 'name', 'content'];
              const isValid = stdAttrs.includes(lowerP1) ||
                ['data-', 'aria-', 'xml:', 'xmlns:', 'epub:', 'xlink:'].some(prefix => lowerP1.startsWith(prefix));

              if (!isValid) {
                return `<span class="highlight-attr highlight-target">${p1}=&quot;${p2}&quot;</span>`;
              }
              return match;
            }
          );
          rawBeforeCode.innerHTML = escapedRaw;
        }

        if (cleanAfterCode) cleanAfterCode.textContent = preview.after_html;
      }
    } catch (err) {
      console.error(err);
    }
  }

  function updateStatsUI(analysis) {
    if (!analysis) return;
    if (statZws) statZws.textContent = (analysis.total_zws_chars || 0).toLocaleString();
    if (statHidden) statHidden.textContent = (analysis.total_hidden_elements || 0).toLocaleString();
    if (statAttrs) statAttrs.textContent = (analysis.total_watermark_attrs || 0).toLocaleString();

    const zwsSaved = (analysis.total_zws_chars || 0) * 3;
    const hiddenSaved = (analysis.total_hidden_elements || 0) * 80;
    const attrsSaved = (analysis.total_watermark_attrs || 0) * 45;
    const estSavedBytes = zwsSaved + hiddenSaved + attrsSaved;

    if (statSizeSaved) statSizeSaved.textContent = formatFileSize(estSavedBytes);
  }

  function findNextMatchingChapter(fromIdx) {
    if (!currentAnalysis || !currentAnalysis.chapters_summary) return null;
    const chapters = currentAnalysis.chapters_summary;
    const len = chapters.length;
    if (len === 0) return null;

    for (let offset = 0; offset < len; offset++) {
      const idx = (fromIdx + offset) % len;
      const ch = chapters[idx];
      let matches = false;
      if (activeFilter === 'zws' && ch.zws_count > 0) matches = true;
      else if (activeFilter === 'hidden' && ch.hidden_elements_count > 0) matches = true;
      else if (activeFilter === 'attrs' && ch.watermark_attrs_count > 0) matches = true;
      else if (activeFilter === 'custom' && ch.custom_patterns_matched > 0) matches = true;

      if (matches) return ch;
    }
    return null;
  }

  function updateSearchBanner(match) {
    if (!searchBanner || !searchBannerText) return;
    searchBanner.classList.remove('hidden');
    let label = 'Findings';
    if (activeFilter === 'zws') label = `${match.zws_count} Zero-Width Spaces`;
    else if (activeFilter === 'hidden') label = `${match.hidden_elements_count} Hidden Elements`;
    else if (activeFilter === 'attrs') label = `${match.watermark_attrs_count} Watermark Attributes`;
    else if (activeFilter === 'custom') label = `${match.custom_patterns_matched} Promo Keywords`;

    searchBannerText.textContent = `Showing ${match.short_name} (${label})`;
  }

  statCards.forEach(card => {
    card.addEventListener('click', () => {
      const filter = card.getAttribute('data-filter');
      activeFilter = (activeFilter === filter && filter !== 'all') ? 'all' : filter;

      statCards.forEach(c => c.classList.remove('active'));
      const activeCard = document.querySelector(`.stat-card[data-filter="${activeFilter}"]`);
      if (activeCard) activeCard.classList.add('active');

      if (currentEpubPath) {
        let currentChapterIdx = parseInt(chapterSelect.value || 0, 10);

        if (activeFilter === 'all') {
          if (searchBanner) searchBanner.classList.add('hidden');
          loadChapterPreview(currentEpubPath, currentChapterIdx);
        } else {
          let match = findNextMatchingChapter(currentChapterIdx);
          if (!match) match = findNextMatchingChapter(0);

          if (match) {
            currentChapterIdx = match.index;
            chapterSelect.value = match.index.toString();
            updateSearchBanner(match);
          } else {
            if (searchBanner) searchBanner.classList.add('hidden');
          }
          loadChapterPreview(currentEpubPath, currentChapterIdx);
        }
      }
    });
  });

  if (btnNextMatch) {
    btnNextMatch.addEventListener('click', () => {
      if (!currentAnalysis || activeFilter === 'all') return;
      const currentChapterIdx = parseInt(chapterSelect.value || 0, 10);
      const match = findNextMatchingChapter(currentChapterIdx + 1);
      if (match) {
        chapterSelect.value = match.index.toString();
        updateSearchBanner(match);
        loadChapterPreview(currentEpubPath, match.index);
      }
    });
  }

  function calculateSingleImageEst(img, quality, maxRes) {
    const origBytes = img.size_bytes || 0;
    const ext = (img.ext || '').toLowerCase();
    const isAlreadyWebp = ext === '.webp';

    let resFactor = 1.0;
    let isResized = false;

    if (img.width && img.height) {
      const maxDim = Math.max(img.width, img.height);
      if (maxRes > 0 && maxDim > maxRes) {
        const scale = maxRes / maxDim;
        resFactor = Math.max(0.04, Math.pow(scale, 1.55));
        isResized = true;
      }
    } else if (maxRes > 0) {
      if (maxRes === 800) resFactor = 0.65;
      else if (maxRes === 1000) resFactor = 0.80;
      else if (maxRes === 1200) resFactor = 0.90;
    }

    let qFactor = 1.0;
    if (isAlreadyWebp) {
      qFactor = isResized ? 0.88 : (quality < 75 ? Math.pow(quality / 80, 1.15) : 1.0);
    } else {
      let baseRatio = 0.32;
      if (ext === '.png') baseRatio = 0.22;
      else if (ext === '.gif' || ext === '.bmp') baseRatio = 0.18;
      const qScale = Math.pow(quality / 75, 1.35);
      qFactor = Math.min(0.92, baseRatio * qScale);
    }

    let estBytes = Math.round(origBytes * qFactor * resFactor);
    estBytes = Math.max(300, Math.min(origBytes, estBytes));
    const savedBytes = Math.max(0, origBytes - estBytes);
    const savedPct = origBytes > 0 ? (savedBytes / origBytes) * 100 : 0;

    return { origBytes, estBytes, savedBytes, savedPct, isAlreadyWebp, isResized };
  }

  function renderCompressView(analysis) {
    if (!analysis) return;
    const images = analysis.images_summary || [];
    currentImageList = images;

    if (compStatCount) compStatCount.textContent = (analysis.total_images_count || 0).toString();

    const quality = parseInt(webpQualityInput ? webpQualityInput.value : 75, 10) || 75;
    const maxRes = parseInt(maxResSelect ? maxResSelect.value : 1000, 10) || 1000;

    let totalOrigBytes = 0;
    let totalEstimatedWebpBytes = 0;

    const computedList = images.map(img => {
      totalOrigBytes += img.size_bytes;
      const est = calculateSingleImageEst(img, quality, maxRes);
      totalEstimatedWebpBytes += est.estBytes;
      return { img, est };
    });

    const totalSavedBytes = Math.max(0, totalOrigBytes - totalEstimatedWebpBytes);
    const totalSavedPct = totalOrigBytes > 0 ? ((totalSavedBytes / totalOrigBytes) * 100).toFixed(0) : '0';

    if (compStatOrigSize) compStatOrigSize.textContent = formatFileSize(totalOrigBytes);
    if (compStatWebpSize) compStatWebpSize.textContent = formatFileSize(totalEstimatedWebpBytes);
    if (compStatSavedPct) compStatSavedPct.textContent = `~${totalSavedPct}%`;

    if (compressSavingsBadge) compressSavingsBadge.textContent = `~${totalSavedPct}%`;
    if (compressSavingsAmount) compressSavingsAmount.textContent = formatFileSize(totalSavedBytes);
    if (compressSavingsTarget) compressSavingsTarget.textContent = formatFileSize(totalEstimatedWebpBytes);

    const unusedImages = analysis.unused_images || images.filter(i => i.is_unused);
    if (unusedCountBadge) unusedCountBadge.textContent = unusedImages.length.toString();
    if (btnDeleteAllUnused) {
      if (unusedImages.length > 0) btnDeleteAllUnused.classList.remove('hidden');
      else btnDeleteAllUnused.classList.add('hidden');
    }

    if (imageListToolbar) {
      if (images.length > 0) imageListToolbar.classList.remove('hidden');
      else imageListToolbar.classList.add('hidden');
    }

    if (imageListContainer) {
      if (images.length === 0) {
        imageListContainer.innerHTML = '<div class="skeleton-loader">No image files found in this EPUB.</div>';
        return;
      }

      imageListContainer.innerHTML = computedList.map((item, idx) => {
        const img = item.img;
        const est = item.est;
        const imgKey = img.filename || img.name || img.short_name;
        const imgName = img.short_name || img.filename || img.name || 'image.jpg';
        const isSelected = selectedImageFilenames.has(imgKey);
        const isCover = img.is_cover || imgName.toLowerCase().includes('cover');
        const isUnused = img.is_unused || (!img.chapters || img.chapters.length === 0);
        const previewUrl = `/api/image-preview?path=${encodeURIComponent(currentEpubPath)}&image=${encodeURIComponent(imgKey)}`;

        let chapterListStr = '';
        if (img.chapters && img.chapters.length > 0) {
          chapterListStr = img.chapters.map(c => c.short_name || c.file || c).join(', ');
        }

        return `
          <div class="asset-row ${isSelected ? 'selected' : ''}" data-idx="${idx}">
            <div class="asset-row-left">
              <div class="asset-check-col">
                <input type="checkbox" class="asset-check-input img-item-chk" data-name="${escapeHtml(imgKey)}" ${isSelected ? 'checked' : ''}>
              </div>
              <div class="asset-thumb-wrap" data-idx="${idx}" title="Click to view image preview">
                <img class="asset-thumb-img" src="${previewUrl}" alt="${escapeHtml(imgName)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                <div class="asset-thumb-fallback" style="display:none;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              </div>
              <div class="asset-text-details" data-idx="${idx}">
                <div class="asset-info">
                  <span class="asset-name" title="${escapeHtml(imgName)}">${escapeHtml(imgName)}</span>
                  <span class="asset-badge">${escapeHtml((img.ext || '').replace('.', ''))}</span>
                  ${img.width && img.height ? `<span class="asset-dim-badge">${img.width}×${img.height}</span>` : ''}
                  ${isCover ? `<span class="asset-cover-badge">Cover</span>` : ''}
                  ${isUnused ? `<span class="asset-unused-badge">Unreferenced</span>` : ''}
                </div>
                <div class="asset-sub-details">
                  ${chapterListStr ? `<span class="asset-chapter-badge" title="${escapeHtml(chapterListStr)}">${escapeHtml(chapterListStr)}</span>` : ''}
                </div>
              </div>
            </div>
            <div class="asset-sizes">
              <span class="asset-orig-size">${formatFileSize(img.size_bytes)}</span>
              <span class="asset-webp-size">➔ ${formatFileSize(est.estBytes)}</span>
              <span class="asset-saved-tag">-${est.savedPct.toFixed(0)}%</span>
              <button type="button" class="btn-preview-trigger" data-idx="${idx}" title="View full size preview">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button type="button" class="btn-row-delete" data-name="${escapeHtml(imgKey)}" title="Delete this image from EPUB">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Wire image card clicks
      imageListContainer.querySelectorAll('.img-item-chk').forEach(chk => {
        chk.addEventListener('click', (e) => e.stopPropagation());
        chk.addEventListener('change', (e) => {
          const name = e.currentTarget.getAttribute('data-name');
          if (e.currentTarget.checked) selectedImageFilenames.add(name);
          else selectedImageFilenames.delete(name);
          updateImageSelectionUI();
          const card = e.currentTarget.closest('.asset-row');
          if (card) card.classList.toggle('selected', e.currentTarget.checked);
        });
      });

      imageListContainer.querySelectorAll('.asset-thumb-wrap, .asset-text-details, .btn-preview-trigger').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          openImageLightbox(idx);
        });
      });

      imageListContainer.querySelectorAll('.btn-row-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const targetKey = btn.getAttribute('data-name');
          if (confirm(`Are you sure you want to delete "${targetKey}" from this EPUB?`)) {
            await deleteImagesFromEpub([targetKey]);
          }
        });
      });
    }

    updateImageSelectionUI();
  }

  // --- Image Lightbox Modal & Operations ---
  function openImageLightbox(idx) {
    if (!currentImageList || currentImageList.length === 0 || !imageLightboxModal) return;
    currentModalIndex = Math.max(0, Math.min(currentImageList.length - 1, idx));
    const img = currentImageList[currentModalIndex];
    const imgKey = img.filename || img.name || img.short_name;
    const imgName = img.short_name || img.filename || img.name;

    if (modalImageTitle) modalImageTitle.textContent = imgName;
    if (modalImageCounter) modalImageCounter.textContent = `${currentModalIndex + 1} / ${currentImageList.length}`;
    if (modalFilenameVal) modalFilenameVal.textContent = imgName;

    let chStr = '-';
    if (img.chapters && img.chapters.length > 0) {
      chStr = img.chapters.map(c => c.short_name || c.file || c).join(', ');
    } else if (img.referenced_in_chapters && img.referenced_in_chapters.length > 0) {
      chStr = img.referenced_in_chapters.join(', ');
    } else {
      chStr = 'Unreferenced (Unused)';
    }

    if (modalChapterVal) modalChapterVal.textContent = chStr;
    if (modalDimensionVal) modalDimensionVal.textContent = `${img.width || '?'} × ${img.height || '?'} px (${formatFileSize(img.size_bytes)})`;

    if (modalImageElement) {
      modalImageElement.src = `/api/image-preview?path=${encodeURIComponent(currentEpubPath)}&image=${encodeURIComponent(imgKey)}`;
    }

    imageLightboxModal.classList.remove('hidden');
  }

  function closeImageLightbox() {
    if (imageLightboxModal) imageLightboxModal.classList.add('hidden');
  }

  if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeImageLightbox);
  if (modalPrevBtn) {
    modalPrevBtn.addEventListener('click', () => {
      if (currentModalIndex > 0) openImageLightbox(currentModalIndex - 1);
      else openImageLightbox(currentImageList.length - 1);
    });
  }
  if (modalNextBtn) {
    modalNextBtn.addEventListener('click', () => {
      if (currentModalIndex < currentImageList.length - 1) openImageLightbox(currentModalIndex + 1);
      else openImageLightbox(0);
    });
  }

  document.addEventListener('keydown', (e) => {
    if (imageLightboxModal && !imageLightboxModal.classList.contains('hidden')) {
      if (e.key === 'Escape') closeImageLightbox();
      else if (e.key === 'ArrowLeft' && modalPrevBtn) modalPrevBtn.click();
      else if (e.key === 'ArrowRight' && modalNextBtn) modalNextBtn.click();
    }
  });

  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', async () => {
      if (!currentEpubPath || !currentImageList[currentModalIndex]) return;
      const imgKey = currentImageList[currentModalIndex].filename || currentImageList[currentModalIndex].name || currentImageList[currentModalIndex].short_name;
      if (confirm(`Are you sure you want to delete image "${imgKey}" from this EPUB?`)) {
        await deleteImagesFromEpub([imgKey]);
        closeImageLightbox();
      }
    });
  }

  async function deleteImagesFromEpub(imagesToDelete) {
    if (!currentEpubPath || imagesToDelete.length === 0) return;
    try {
      const res = await fetch('/api/image/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: currentEpubPath,
          images: imagesToDelete
        })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        const r = data.result;
        currentEpubPath = r.output_file;
        if (pathInput) pathInput.value = currentEpubPath;
        analyzeEpub(currentEpubPath);
      } else {
        alert('Failed to delete image: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert('Network error occurred.');
    }
  }

  if (btnDeleteAllUnused) {
    btnDeleteAllUnused.addEventListener('click', async () => {
      if (!currentAnalysis || !currentAnalysis.unused_images || currentAnalysis.unused_images.length === 0) return;
      const count = currentAnalysis.unused_images.length;
      if (confirm(`Are you sure you want to delete ${count} unreferenced images from this EPUB?`)) {
        await deleteImagesFromEpub(currentAnalysis.unused_images.map(img => img.filename || img.name));
      }
    });
  }

  if (btnDeleteSelected) {
    btnDeleteSelected.addEventListener('click', async () => {
      if (selectedImageFilenames.size === 0) return;
      const count = selectedImageFilenames.size;
      if (confirm(`Are you sure you want to delete ${count} selected images from this EPUB?`)) {
        await deleteImagesFromEpub(Array.from(selectedImageFilenames));
        selectedImageFilenames.clear();
        updateImageSelectionUI();
      }
    });
  }

  function updateImageSelectionUI() {
    const count = selectedImageFilenames.size;
    if (selectedCountBadge) selectedCountBadge.textContent = count.toString();
    if (imageListSummary) imageListSummary.textContent = `${count} selected`;

    if (btnDeleteSelected) {
      if (count > 0) btnDeleteSelected.classList.remove('hidden');
      else btnDeleteSelected.classList.add('hidden');
    }

    if (checkSelectAllImages) {
      const total = currentImageList.length;
      checkSelectAllImages.checked = (total > 0 && count === total);
      checkSelectAllImages.indeterminate = (count > 0 && count < total);
    }
  }

  if (checkSelectAllImages) {
    checkSelectAllImages.addEventListener('change', () => {
      if (checkSelectAllImages.checked) {
        currentImageList.forEach(img => selectedImageFilenames.add(img.filename || img.name || img.short_name));
      } else {
        selectedImageFilenames.clear();
      }
      updateImageSelectionUI();
      if (currentAnalysis) renderCompressView(currentAnalysis);
    });
  }

  // --- Split View ---
  function renderSplitView(analysis) {
    if (!analysis || !splitPartitionList) return;
    const chapters = analysis.chapters_summary || [];
    const totalChapters = chapters.length;
    const totalSize = analysis.file_size_bytes || 0;
    const maxSizeMb = parseFloat(splitSizeInput ? splitSizeInput.value : 10) || 10;
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (splitStatOrigSize) splitStatOrigSize.textContent = formatFileSize(totalSize);

    const estVolumeCount = Math.max(1, Math.ceil(totalSize / maxSizeBytes));
    if (splitStatPartsEst) splitStatPartsEst.textContent = `${estVolumeCount} Volumes`;
    if (splitStatEstTotal) splitStatEstTotal.textContent = formatFileSize(totalSize);

    splitPartitionList.innerHTML = `
      <div class="part-simulation-card">
        <div class="part-header">
          <span>Splitting Projection (~${maxSizeMb} MB per Volume)</span>
          <span class="part-range-badge">${totalChapters} Total Chapters</span>
        </div>
        <div class="part-chapters-list">
          EPUB will be cleanly partitioned based on internal spine and chapter structure.
        </div>
      </div>
    `;
  }

  // --- Metadata View ---
  async function fetchMetadata(filePath) {
    if (!filePath) return;
    try {
      const res = await fetch('/api/metadata/get', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        const meta = data.metadata;
        currentMetadata = meta;

        if (metaTitleInput) metaTitleInput.value = meta.title || '';
        if (metaCreatorInput) metaCreatorInput.value = meta.creator || '';
        if (metaDescInput) metaDescInput.value = meta.description || '';
        if (metaPublisherInput) metaPublisherInput.value = meta.publisher || '';
        if (metaLangInput) metaLangInput.value = meta.language || 'en';

        if (bookTitleHead) bookTitleHead.textContent = meta.title || 'Unknown Title';
        if (bookAuthorSub) bookAuthorSub.textContent = `Author: ${meta.creator || '-'}`;
        if (bookBadgeLang) bookBadgeLang.textContent = `Language: ${(meta.language || 'en').toUpperCase()}`;
        if (bookBadgePublisher) bookBadgePublisher.textContent = `Publisher: ${meta.publisher || '-'}`;
        if (bookDescText) bookDescText.textContent = meta.description || 'No description available.';

        if (meta.cover_b64 && bookCoverImg && bookCoverPlaceholder) {
          bookCoverImg.src = meta.cover_b64;
          bookCoverImg.classList.remove('hidden');
          bookCoverPlaceholder.classList.add('hidden');
        } else if (bookCoverImg && bookCoverPlaceholder) {
          bookCoverImg.classList.add('hidden');
          bookCoverPlaceholder.classList.remove('hidden');
        }
      }
    } catch (err) {}
  }

  if (btnBrowseCover && coverFilePicker) {
    btnBrowseCover.addEventListener('click', () => coverFilePicker.click());
    coverFilePicker.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (coverFileName) coverFileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = (ev) => {
          newCoverB64 = ev.target.result;
          newCoverExt = file.name.split('.').pop() || 'jpg';
          if (bookCoverImg && bookCoverPlaceholder) {
            bookCoverImg.src = newCoverB64;
            bookCoverImg.classList.remove('hidden');
            bookCoverPlaceholder.classList.add('hidden');
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }

  [optZws, optHidden, optAttrs, optCustom].forEach(chk => {
    if (chk) {
      chk.addEventListener('change', () => {
        if (currentEpubPath) analyzeEpub(currentEpubPath);
      });
    }
  });

  document.querySelectorAll('.toggle-option').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName.toLowerCase() === 'input') return;
      const checkbox = card.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });

  if (webpQualityInput && webpQualityVal) {
    webpQualityInput.addEventListener('input', (e) => {
      webpQualityVal.textContent = e.target.value;
      if (activeMode === 'compress' && currentAnalysis) renderCompressView(currentAnalysis);
    });
  }

  if (maxResSelect) {
    maxResSelect.addEventListener('change', () => {
      if (activeMode === 'compress' && currentAnalysis) renderCompressView(currentAnalysis);
    });
  }

  if (splitSizeInput) {
    splitSizeInput.addEventListener('input', () => {
      if (activeMode === 'split' && currentAnalysis) renderSplitView(currentAnalysis);
    });
  }

  modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const mode = tab.getAttribute('data-mode');
      switchMode(mode);
    });
  });

  if (btnExecuteAction) btnExecuteAction.addEventListener('click', executeAction);

  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', async () => {
      const p = pathInput.value.trim();
      if (!p) return;

      try {
        btnAnalyze.disabled = true;
        const res = await fetch('/api/analyze-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: p, options: getSelectedOptions() })
        });
        const data = await res.json();
        btnAnalyze.disabled = false;

        if (data.status === 'ok' && data.batch_analysis) {
          const batchAn = data.batch_analysis;
          if (batchAn.total_files > 1) {
            batchFiles = batchAn.files.map(f => {
              const fName = f.file_name || (f.input_file ? f.input_file.split(/[\/\\]/).pop() : 'Book.epub');
              const fPath = f.input_file || (f.file_name ? (p.replace(/[\/\\]$/, '') + '/' + f.file_name) : p);
              return {
                id: 'b_' + Math.random().toString(36).substr(2, 9),
                name: fName,
                path: fPath,
                size_bytes: f.file_size_bytes || 0,
                selected: true,
                status: 'ready',
                analysis: f,
                result: null,
                cleaned_size_bytes: null,
                savings_bytes: null,
                error: null
              };
            });
            updateBatchQueueUI();
            if (batchFiles.length > 0) {
              selectBatchItem(0);
              switchMode('batch');
            }
            return;
          }
        }
      } catch (err) {}

      btnAnalyze.disabled = false;
      currentEpubPath = p;
      analyzeEpub(p);
    });
  }

  if (chapterSelect) {
    chapterSelect.addEventListener('change', (e) => {
      const idx = parseInt(e.target.value, 10);
      if (currentEpubPath) {
        loadChapterPreview(currentEpubPath, idx);
      }
    });
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetTab = tab.getAttribute('data-tab');
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  if (btnBrowseFile && filePicker) {
    btnBrowseFile.addEventListener('click', (e) => {
      e.stopPropagation();
      filePicker.click();
    });
  }

  if (dropZone && filePicker) {
    dropZone.addEventListener('click', () => filePicker.click());
    filePicker.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handleBatchFiles(e.target.files);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      }, false);
    });

    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files.length > 0) {
        handleBatchFiles(dt.files);
      }
    });
  }

  if (pathInput) pathInput.value = '';
  currentEpubPath = '';
  currentAnalysis = null;
  updateBatchQueueUI();
});
