(function () {
  "use strict";

  const FEIXIANG_PROXY_URL = "/html2html-api/fetch";

  // =====================================================================
  // Application State
  // =====================================================================
  const vfsMap = new Map();          // relativePath -> { file, relativePath, handle }
  const originalHtmlMap = new Map(); // relativePath -> original HTML string (untouched)
  const blobUrlMap = new Map();      // relativePath -> blobUrl (for preview only)

  let activeFilePath = null;
  let activeFileHandle = null;
  let folderName = "网页导出";
  let selectedElement = null;
  let hoveredElement = null;

  // =====================================================================
  // Patch-Based Edit Tracking System
  // =====================================================================
  // Each patch: { selector, type: 'text'|'style'|'imgSrc', key?, value }
  const editPatches = [];

  // =====================================================================
  // Undo / Redo System
  // =====================================================================
  // Each entry: { selector, type, key, oldValue, newValue }
  const undoStack = [];
  const redoStack = [];
  // Text being edited — snapshot taken when element is first selected
  let textSnapshotOnSelect = null;
  let textSnapshotSelector = null;

  function pushUndoEntry(selector, type, key, oldValue, newValue) {
    if (oldValue === newValue) return;
    undoStack.push({ selector, type, key, oldValue, newValue });
    redoStack.length = 0; // any new action clears redo
    updateUndoRedoButtons();
  }

  function performUndo() {
    if (undoStack.length === 0) return;
    const entry = undoStack.pop();
    redoStack.push(entry);

    // Apply oldValue to iframe DOM
    applyValueToIframe(entry.selector, entry.type, entry.key, entry.oldValue);
    // Update patch
    recordPatch(entry.type, entry.selector, entry.key, entry.oldValue);
    updateUndoRedoButtons();
  }

  function performRedo() {
    if (redoStack.length === 0) return;
    const entry = redoStack.pop();
    undoStack.push(entry);

    // Apply newValue to iframe DOM
    applyValueToIframe(entry.selector, entry.type, entry.key, entry.newValue);
    // Update patch
    recordPatch(entry.type, entry.selector, entry.key, entry.newValue);
    updateUndoRedoButtons();
  }

  function applyValueToIframe(selector, type, key, value) {
    const iframeDoc = previewIframe.contentDocument;
    if (!iframeDoc) return;
    let el;
    try { el = iframeDoc.querySelector(selector); } catch (e) { return; }
    if (!el) return;

    switch (type) {
      case "text":
        el.textContent = value;
        break;
      case "style":
        el.style[key] = value;
        break;
      case "imgSrc":
        el.src = value;
        break;
    }
  }

  function updateUndoRedoButtons() {
    const btnUndo = document.getElementById("btn-undo");
    const btnRedo = document.getElementById("btn-redo");
    if (btnUndo) btnUndo.disabled = undoStack.length === 0;
    if (btnRedo) btnRedo.disabled = redoStack.length === 0;
  }

  // Flush any pending text snapshot as an undo entry
  function flushTextSnapshot() {
    if (textSnapshotSelector && selectedElement) {
      const currentText = selectedElement.textContent ? selectedElement.textContent.trim() : "";
      if (currentText !== textSnapshotOnSelect) {
        pushUndoEntry(textSnapshotSelector, "text", null, textSnapshotOnSelect, currentText);
      }
    }
    textSnapshotOnSelect = null;
    textSnapshotSelector = null;
  }

  // =====================================================================
  // Patch Helpers
  // =====================================================================
  function getUniqueSelector(el, doc) {
    if (!el || el === doc.body || el === doc.documentElement) return null;
    const path = [];
    let current = el;

    while (current && current !== doc.body && current !== doc.documentElement) {
      const tag = current.tagName.toLowerCase();
      if (current.id === "editor-outline" || current.id === "tiptap-toolbar" || current.id === "editor-style") return null;

      if (current.getAttribute("data-id")) {
        path.unshift(`[data-id="${current.getAttribute("data-id")}"]`);
        break;
      }
      if (current.id && !current.id.startsWith("tiptap-") && !current.id.startsWith("editor-")) {
        path.unshift(`#${CSS.escape(current.id)}`);
        break;
      }

      let index = 1;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName.toLowerCase() === tag) index++;
        sibling = sibling.previousElementSibling;
      }
      path.unshift(`${tag}:nth-of-type(${index})`);
      current = current.parentElement;
    }

    if (path.length === 0) return null;
    if (path[0].startsWith("#") || path[0].startsWith("[data-id=")) return path.join(" > ");
    return "body > " + path.join(" > ");
  }

  function recordPatch(type, selector, key, value) {
    if (!selector) return;
    const idx = editPatches.findIndex(
      (p) => p.selector === selector && p.type === type && p.key === key
    );
    if (idx !== -1) {
      editPatches[idx].value = value;
    } else {
      editPatches.push({ selector, type, key, value });
    }
  }

  function applyPatches(originalHtml) {
    if (!originalHtml) return originalHtml;
    if (editPatches.length === 0) return originalHtml;

    const parser = new DOMParser();
    const doc = parser.parseFromString(originalHtml, "text/html");

    // Group style patches by selector
    const styleMap = {};

    for (const patch of editPatches) {
      let el;
      try { el = doc.querySelector(patch.selector); } catch (e) { continue; }

      switch (patch.type) {
        case "text":
          if (el) el.textContent = patch.value;
          break;
        case "style":
          if (el) el.style[patch.key] = patch.value;
          // Also collect for CSS injection to survive JS DOM rebuilds
          if (!styleMap[patch.selector]) styleMap[patch.selector] = {};
          const cssKey = patch.key.replace(/([A-Z])/g, "-$1").toLowerCase();
          styleMap[patch.selector][cssKey] = patch.value;
          break;
        case "imgSrc":
          if (el) el.setAttribute("src", patch.value);
          break;
      }
    }

    // Inject CSS for styles to survive JS DOM rebuilds (like Klotski)
    const selectors = Object.keys(styleMap);
    if (selectors.length > 0) {
      let cssText = "\n/* ClickDeck User Edits */\n";
      for (const sel of selectors) {
        cssText += `${sel} {\n`;
        for (const [k, v] of Object.entries(styleMap[sel])) {
          cssText += `  ${k}: ${v} !important;\n`;
        }
        cssText += `}\n`;
      }
      let styleTag = doc.getElementById("clickdeck-user-edits");
      if (!styleTag) {
        styleTag = doc.createElement("style");
        styleTag.id = "clickdeck-user-edits";
        if (doc.head) {
          doc.head.appendChild(styleTag);
        } else {
          doc.documentElement.insertBefore(styleTag, doc.documentElement.firstChild);
        }
      }
      styleTag.textContent = cssText;
    }

    // Sync script data arrays for dynamic-rendering pages (e.g. Klotski)
    for (const patch of editPatches) {
      if (patch.type !== "text") continue;
      const dataIdMatch = patch.selector.match(/\[data-id="([^"]+)"\]/);
      if (!dataIdMatch) continue;
      const dataId = dataIdMatch[1];
      const newText = patch.value;

      doc.querySelectorAll("script").forEach((script) => {
        if (!script.textContent) return;
        const sq = new RegExp(`(id\\s*:\\s*'${dataId}'\\s*,\\s*name\\s*:\\s*')[^']*(')`,"g");
        const dq = new RegExp(`(id\\s*:\\s*"${dataId}"\\s*,\\s*name\\s*:\\s*")[^"]*(")`,"g");
        script.textContent = script.textContent.replace(sq, `$1${newText}$2`).replace(dq, `$1${newText}$2`);
      });
    }

    const doctypeMatch = originalHtml.match(/<!DOCTYPE[^>]*>/i);
    const doctype = doctypeMatch ? doctypeMatch[0] : "<!DOCTYPE html>";
    return doctype + "\n" + doc.documentElement.outerHTML;
  }

  // =====================================================================
  // DOM Elements
  // =====================================================================
  const welcomeView = document.getElementById("welcome-view");
  const previewIframe = document.getElementById("preview-iframe");
  const floatingPanel = document.getElementById("floating-panel");
  const panelHeader = document.getElementById("panel-drag-handle");
  const toastContainer = document.getElementById("toast-container");
  const linkContextMenu = document.getElementById("link-context-menu");
  const btnPasteLink = document.getElementById("btn-paste-link");

  const btnSelectFile = document.getElementById("btn-select-file");
  const btnSelectDir = document.getElementById("btn-select-dir");
  const btnSaveCopy = document.getElementById("btn-save-copy");
  const btnExportZip = document.getElementById("btn-export-zip");
  const btnOpenFile = document.getElementById("btn-open-file");
  const btnUndo = document.getElementById("btn-undo");
  const btnRedo = document.getElementById("btn-redo");

  const inputFile = document.getElementById("input-file");
  const inputDir = document.getElementById("input-dir");

  // =====================================================================
  // Utility: Timestamp Generator
  // =====================================================================
  function getTimestampString() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return now.getFullYear() + pad(now.getMonth() + 1) + pad(now.getDate()) + "_" + pad(now.getHours()) + pad(now.getMinutes()) + pad(now.getSeconds());
  }

  // =====================================================================
  // Toast Notification
  // =====================================================================
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // =====================================================================
  // Custom Context Menu
  // =====================================================================
  const contextMenuDocuments = new WeakSet();

  function hideLinkContextMenu() {
    linkContextMenu.hidden = true;
  }

  function showLinkContextMenu(clientX, clientY) {
    linkContextMenu.hidden = false;
    linkContextMenu.style.left = "0px";
    linkContextMenu.style.top = "0px";

    const edgeGap = 8;
    const left = Math.max(edgeGap, Math.min(clientX, window.innerWidth - linkContextMenu.offsetWidth - edgeGap));
    const top = Math.max(edgeGap, Math.min(clientY, window.innerHeight - linkContextMenu.offsetHeight - edgeGap));
    linkContextMenu.style.left = left + "px";
    linkContextMenu.style.top = top + "px";
    btnPasteLink.focus({ preventScroll: true });
  }

  function bindLinkContextMenu(targetDocument, getOffset = () => ({ left: 0, top: 0 })) {
    if (!targetDocument || contextMenuDocuments.has(targetDocument)) return;
    contextMenuDocuments.add(targetDocument);

    targetDocument.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const offset = getOffset();
      showLinkContextMenu(e.clientX + offset.left, e.clientY + offset.top);
    }, true);

    targetDocument.addEventListener("pointerdown", (e) => {
      if (targetDocument !== document || !linkContextMenu.contains(e.target)) {
        hideLinkContextMenu();
      }
    }, true);
    targetDocument.addEventListener("scroll", hideLinkContextMenu, true);
    targetDocument.addEventListener("keydown", (e) => {
      if (e.key === "Escape") hideLinkContextMenu();
    }, true);
  }

  async function fetchFeixiangHtml(sourceUrl) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);

    try {
      // A string body stays CORS-safelisted and avoids an unnecessary preflight.
      const response = await fetch(FEIXIANG_PROXY_URL, {
        method: "POST",
        body: JSON.stringify({ url: sourceUrl }),
        referrer: window.location.href,
        referrerPolicy: "unsafe-url",
        signal: controller.signal,
      });
      const responseText = await response.text();

      if (!response.ok) {
        let message = `中转请求失败（HTTP ${response.status}）`;
        try {
          const errorBody = JSON.parse(responseText);
          if (errorBody.error) message = errorBody.error;
          if (errorBody.requestId) message += ` [${errorBody.requestId}]`;
        } catch (_) {
          // Keep the HTTP fallback message when the response is not JSON.
        }
        throw new Error(message);
      }

      return responseText;
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("中转抓取超时，请稍后重试");
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // =====================================================================
  // Draggable Floating Panel — Pointer Events (robust hold-and-drag)
  // =====================================================================
  let panelDragPointerId = null;

  panelHeader.addEventListener("pointerdown", (e) => {
    if (panelDragPointerId !== null) return; // already dragging
    e.preventDefault();
    panelDragPointerId = e.pointerId;
    panelHeader.setPointerCapture(e.pointerId);

    const rect = floatingPanel.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    function onMove(ev) {
      if (ev.pointerId !== panelDragPointerId) return;
      let left = ev.clientX - offsetX;
      let top = ev.clientY - offsetY;
      const maxLeft = window.innerWidth - floatingPanel.offsetWidth - 10;
      const maxTop = window.innerHeight - floatingPanel.offsetHeight - 10;
      left = Math.max(10, Math.min(left, maxLeft));
      top = Math.max(10, Math.min(top, maxTop));
      floatingPanel.style.left = left + "px";
      floatingPanel.style.top = top + "px";
      floatingPanel.style.right = "auto";
      floatingPanel.style.bottom = "auto";
    }

    function onUp(ev) {
      if (ev.pointerId !== panelDragPointerId) return;
      panelDragPointerId = null;
      panelHeader.removeEventListener("pointermove", onMove);
      panelHeader.removeEventListener("pointerup", onUp);
      panelHeader.removeEventListener("pointercancel", onUp);
    }

    panelHeader.addEventListener("pointermove", onMove);
    panelHeader.addEventListener("pointerup", onUp);
    panelHeader.addEventListener("pointercancel", onUp);
  });

  // =====================================================================
  // Blob URL Management (preview only)
  // =====================================================================
  function cleanupBlobUrls() {
    for (const url of blobUrlMap.values()) URL.revokeObjectURL(url);
    blobUrlMap.clear();
  }

  function prepareAssetBlobUrls() {
    cleanupBlobUrls();
    for (const [path, item] of vfsMap.entries()) {
      if (!path.endsWith(".html") && !path.endsWith(".htm")) {
        const url = URL.createObjectURL(item.file);
        blobUrlMap.set(path, url);
        const normalized = path.startsWith("/") ? path.slice(1) : path;
        blobUrlMap.set(normalized, url);
      }
    }
  }

  // =====================================================================
  // Rewrite HTML Assets for Preview (string-based, never touches saved output)
  // =====================================================================
  function rewriteHtmlForPreview(htmlText, currentHtmlPath) {
    const dirParts = currentHtmlPath.split("/").slice(0, -1);
    const resolveRel = (relPath) => {
      if (!relPath || relPath.startsWith("http://") || relPath.startsWith("https://") || relPath.startsWith("data:") || relPath.startsWith("blob:")) return null;
      const targetParts = relPath.split("/");
      const resolvedParts = [...dirParts];
      for (const part of targetParts) {
        if (part === ".") continue;
        if (part === "..") resolvedParts.pop();
        else resolvedParts.push(part);
      }
      return blobUrlMap.get(resolvedParts.join("/")) || blobUrlMap.get(relPath) || null;
    };
    return htmlText.replace(
      /(<(?:link|img|script)\s[^>]*(?:href|src)\s*=\s*["'])([^"']+)(["'])/gi,
      (match, prefix, url, suffix) => {
        const resolved = resolveRel(url);
        return resolved ? prefix + resolved + suffix : match;
      }
    );
  }

  // =====================================================================
  // Feixiang Laoshi Purification Logic (from Extension)
  // =====================================================================
  function isFeixiangHtml(html) {
      return html.includes('feixianglaoshi') || html.includes('fbcontent.cn') || html.includes('data-build-marker') || html.includes('deployment-id');
  }

  function purifyFeixiangHtml(rawHtml, providedTitle) {
      rawHtml = rawHtml.replace(/<img[^>]*\/t\.gif[^>]*>/gi, '');
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');

      let iframe = doc.querySelector('iframe[srcdoc]');
      if (!iframe) iframe = doc.querySelector('iframe.content-iframe');
      let htmlContent = rawHtml;
      if (iframe && iframe.hasAttribute('srcdoc')) {
          htmlContent = iframe.getAttribute('srcdoc');
          htmlContent = htmlContent.replace(/<img[^>]*\/t\.gif[^>]*>/gi, '');
      }

      const soup = parser.parseFromString(htmlContent, 'text/html');

      const selectors = [
          'span[data-build-marker]', 'meta[name="deployment-id"]', 'meta[name="build-id"]',
          'meta[name="cache-control"]', 'meta[name="feature-flag"]', 'meta[name="analytics-config"]',
          'style[data-module]', 'style[data-build]',
          'script[type="application/json"][data-config]',
          'script[type="application/ld+json"]', 'template[id^="metadata-"]',
          'link[rel="preconnect"]', 'link[rel="dns-prefetch"]',
          'b[data-checkpoint]', 'i[data-flag]'
      ];
      selectors.forEach(sel => {
          soup.querySelectorAll(sel).forEach(el => el.remove());
      });

      soup.querySelectorAll('div[data-tracking-id]').forEach(el => el.remove());

      soup.querySelectorAll('script:not([src])').forEach(el => {
          const text = el.textContent;
          if (text.includes('Feature flag:') || text.includes('_bm_') || text.includes('_ck_') || text.includes('Performance budget:')) el.remove();
      });

      soup.querySelectorAll('noscript').forEach(el => el.remove());

      soup.querySelectorAll('style').forEach(el => {
          const text = el.textContent;
          if (text.includes('@media(max-width:0px)') || text.includes('/* chunk:')) el.remove();
      });

      const iterator = document.createNodeIterator(soup, 128, null);
      let currentNode;
      const commentsToRemove = [];
      while (currentNode = iterator.nextNode()) {
          if (/^(Security|Feature Flag|WCAG|Build|CDN|Analytics|Performance|CMS Sync)/i.test(currentNode.nodeValue.trim())) {
              commentsToRemove.push(currentNode);
          }
      }
      commentsToRemove.forEach(el => el.remove());

      const nodesToMove = [];
      for (const node of soup.body.childNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
              const tagName = node.tagName.toLowerCase();
              if (['meta', 'title', 'link', 'style', 'script'].includes(tagName)) {
                  nodesToMove.push(node);
              } else {
                  break;
              }
          } else if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.COMMENT_NODE) {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') break;
              nodesToMove.push(node);
          }
      }
      nodesToMove.forEach(node => soup.head.appendChild(node));

      soup.querySelectorAll('body meta, body title, body link, body style').forEach(el => {
          const prev = el.previousSibling;
          if (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent.trim() === '') soup.head.appendChild(prev);
          soup.head.appendChild(el);
      });

      let cleanHtml = soup.documentElement.outerHTML;
      cleanHtml = cleanHtml.split('\n').filter(l => l.trim()).join('\n');

      let finalTitle = providedTitle;
      if (!finalTitle || finalTitle === '课件' || finalTitle.includes('飞象') || finalTitle.includes('musk')) {
          const titleEl = soup.querySelector('title');
          if (titleEl && titleEl.textContent.trim()) {
              finalTitle = titleEl.textContent.trim();
          } else {
              finalTitle = providedTitle || '净化后课件';
          }
      }
      finalTitle = finalTitle.replace(/[\\/:*?"<>|]/g, '_');
      return { title: finalTitle, html: cleanHtml };
  }

  // =====================================================================
  // Load HTML File
  // =====================================================================
  async function loadHtmlFile(path) {
    const item = vfsMap.get(path);
    if (!item) return;

    activeFilePath = path;
    activeFileHandle = item.handle || null;

    let originalHtml = originalHtmlMap.get(path);
    if (!originalHtml) {
      originalHtml = await item.file.text();
      
      // Check for watermarkUrl in window.__SERVER_DATA__
      const watermarkUrlMatch = originalHtml.match(/watermarkUrl:\s*["'](https?:\/\/[^"']+)["']/);
      if (watermarkUrlMatch && watermarkUrlMatch[1]) {
          try {
              showToast("检测到 watermarkUrl，正在尝试在线获取最新源码...", "info");
              originalHtml = await fetchFeixiangHtml(watermarkUrlMatch[1]);
              showToast("在线源码获取成功", "success");
          } catch (err) {
              console.error("Fetch watermarkUrl error:", err);
              showToast("在线获取异常，将使用本地代码", "warning");
          }
      }

      // Feixiang check
      if (isFeixiangHtml(originalHtml) || item.file.name.includes("飞象") || item.file.name.includes("华容道") || item.file.name.includes("生成华容道交互教学动画")) {
          const purified = purifyFeixiangHtml(originalHtml, item.file.name.replace(/\.html?$/i, ""));
          originalHtml = purified.html;
          showToast(`已应用飞象课件净化: ${purified.title}`, "info");
      }
      originalHtmlMap.set(path, originalHtml);
    }

    editPatches.length = 0;
    undoStack.length = 0;
    redoStack.length = 0;
    selectedElement = null;
    textSnapshotOnSelect = null;
    updateUndoRedoButtons();

    const previewHtml = rewriteHtmlForPreview(originalHtml, path);
    const iframeDoc = previewIframe.contentDocument || previewIframe.contentWindow?.document;
    if (!iframeDoc) return;
    iframeDoc.open();
    iframeDoc.write(previewHtml);
    iframeDoc.close();

    previewIframe.onload = () => initIframeEditor();
    initIframeEditor();
  }

  // =====================================================================
  // Iframe Editor
  // =====================================================================
  function initIframeEditor() {
    const iframeWin = previewIframe.contentWindow;
    const iframeDoc = previewIframe.contentDocument;
    if (!iframeWin || !iframeDoc || !iframeDoc.body) return;

    bindLinkContextMenu(iframeDoc, () => {
      const rect = previewIframe.getBoundingClientRect();
      return { left: rect.left, top: rect.top };
    });

    // ----- Inject styles -----
    if (!iframeDoc.getElementById("editor-style")) {
      const style = iframeDoc.createElement("style");
      style.id = "editor-style";
      style.textContent = `
        .editor-outline {
          position: fixed; display: none;
          border: 2px solid #2563eb; border-radius: 4px;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.2);
          pointer-events: none; z-index: 2147483646;
          transition: all 0.05s ease-out;
        }
        [contenteditable="true"], [contenteditable="true"] * {
          -webkit-user-select: text !important;
          user-select: text !important;
          cursor: text !important;
        }
        .tiptap-toolbar {
          position: fixed; z-index: 2147483647;
          display: none; flex-direction: column; gap: 6px;
          padding: 8px 10px;
          background: rgba(255,255,255,0.98);
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          border: 1px solid #cbd5e1; border-radius: 8px;
          box-shadow: 0 10px 25px -5px rgba(15,23,42,0.18), 0 0 0 1px rgba(0,0,0,0.05);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none; pointer-events: auto;
          transition: opacity 0.15s ease;
        }
        .tiptap-row {
          display: flex; align-items: center; gap: 4px;
        }
        .tiptap-tag {
          font-size: 10px; font-weight: 700; color: #2563eb;
          background: #eff6ff; padding: 2px 6px; border-radius: 4px;
          text-transform: uppercase;
        }
        .tiptap-divider {
          width: 1px; height: 16px; background-color: #e2e8f0; margin: 0 2px;
        }
        .tiptap-btn {
          height: 28px; padding: 0 8px; font-size: 12px; font-weight: 600;
          color: #0f172a; background: #ffffff; border: 1px solid #e2e8f0;
          border-radius: 4px; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          transition: all 0.1s ease;
        }
        .tiptap-btn:hover {
          background-color: #eff6ff; border-color: #2563eb; color: #2563eb;
        }
        .tiptap-color-label {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 4px; height: 28px; padding: 0 8px; font-size: 12px; font-weight: 600;
          color: #0f172a; border: 1px solid #e2e8f0; border-radius: 4px;
          cursor: pointer; background: #ffffff; position: relative;
        }
        .tiptap-color-label:hover {
          border-color: #2563eb; background: #eff6ff; color: #2563eb;
        }
        .tiptap-color-label input[type="color"] {
          position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer;
        }
      `;
      (iframeDoc.head || iframeDoc.documentElement).appendChild(style);
    }

    // ----- Outline -----
    let outline = iframeDoc.getElementById("editor-outline");
    if (!outline) {
      outline = iframeDoc.createElement("div");
      outline.id = "editor-outline";
      outline.className = "editor-outline";
      iframeDoc.body.appendChild(outline);
    }

    // ----- Tiptap Toolbar (Two Rows) -----
    let tiptap = iframeDoc.getElementById("tiptap-toolbar");
    if (!tiptap) {
      tiptap = iframeDoc.createElement("div");
      tiptap.id = "tiptap-toolbar";
      tiptap.className = "tiptap-toolbar";
      tiptap.innerHTML = `
        <div class="tiptap-row">
          <span class="tiptap-tag" id="tiptap-tag" style="display:none;">TAG</span>
          <div class="tiptap-divider" id="tiptap-tag-divider" style="display:none;"></div>
          <button class="tiptap-btn" id="tiptap-font-smaller" title="减小字号">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg>
            <span>缩小</span>
          </button>
          <button class="tiptap-btn" id="tiptap-font-larger" title="增大字号">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
            <span>增大</span>
          </button>
          <button class="tiptap-btn" id="tiptap-weight" title="加粗/取消加粗" style="font-weight:800;">B 加粗</button>
          <div class="tiptap-divider"></div>
          <button class="tiptap-btn" id="tiptap-align-left" title="左对齐"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="15" x2="3" y1="12" y2="12"/><line x1="17" x2="3" y1="18" y2="18"/></svg>左</button>
          <button class="tiptap-btn" id="tiptap-align-center" title="居中对齐"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="17" x2="7" y1="12" y2="12"/><line x1="19" x2="5" y1="18" y2="18"/></svg>中</button>
          <button class="tiptap-btn" id="tiptap-align-right" title="右对齐"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="9" y1="12" y2="12"/><line x1="21" x2="7" y1="18" y2="18"/></svg>右</button>
          <button class="tiptap-btn" id="tiptap-align-justify" title="两端对齐"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="21" x2="3" y1="6" y2="6"/><line x1="21" x2="3" y1="12" y2="12"/><line x1="21" x2="3" y1="18" y2="18"/></svg>两端</button>
        </div>
        <div class="tiptap-row">
          <label class="tiptap-color-label" title="文字颜色">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.92 0 1.7-.75 1.7-1.67 0-.42-.15-.82-.42-1.15-.27-.33-.42-.74-.42-1.18 0-.92.75-1.67 1.67-1.67h1.92c2.48 0 4.5-2.02 4.5-4.5 0-4.69-3.81-8.5-8.5-8.5Z"/></svg>
            <span>字色</span>
            <input type="color" id="tiptap-color" />
          </label>
          <label class="tiptap-color-label" title="背景颜色">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18.37 2.63 14 7l-1.59-1.59a2 2 0 0 0-2.83 0L8 7l-5 5 4 4 5-5 1.59 1.59a2 2 0 0 0 2.83 0L21.37 7a2.12 2.12 0 0 0 0-3l-.37-.37a2.12 2.12 0 0 0-3 0Z"/><path d="M9 13.5 4.5 18H2v2.5L4.5 23H7v-2.5L11.5 16"/></svg>
            <span>背景</span>
            <input type="color" id="tiptap-bg" />
          </label>
          <button class="tiptap-btn" id="tiptap-replace-img" title="替换图片" style="display:none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span>换图</span>
          </button>
        </div>
      `;
      iframeDoc.body.appendChild(tiptap);
    }

    // ----- Toolbar refs -----
    const tiptapTag = iframeDoc.getElementById("tiptap-tag");
    const tiptapTagDivider = iframeDoc.getElementById("tiptap-tag-divider");
    const btnFontSmaller = iframeDoc.getElementById("tiptap-font-smaller");
    const btnFontLarger = iframeDoc.getElementById("tiptap-font-larger");
    const btnWeight = iframeDoc.getElementById("tiptap-weight");
    const btnAlignLeft = iframeDoc.getElementById("tiptap-align-left");
    const btnAlignCenter = iframeDoc.getElementById("tiptap-align-center");
    const btnAlignRight = iframeDoc.getElementById("tiptap-align-right");
    const btnAlignJustify = iframeDoc.getElementById("tiptap-align-justify");
    const inputColor = iframeDoc.getElementById("tiptap-color");
    const inputBg = iframeDoc.getElementById("tiptap-bg");
    const btnReplaceImg = iframeDoc.getElementById("tiptap-replace-img");

    // ----- Positioning -----
    function positionTiptapToolbar(target) {
      if (!target || target === iframeDoc.body || target === iframeDoc.documentElement) {
        tiptap.style.display = "none";
        return;
      }
      const rect = target.getBoundingClientRect();
      const toolbarHeight = tiptap.offsetHeight || 70;
      const toolbarWidth = tiptap.offsetWidth || 500;
      let top = rect.top >= toolbarHeight + 10 ? rect.top - toolbarHeight - 6 : rect.bottom + 6;
      let left = rect.left + rect.width / 2 - toolbarWidth / 2;
      left = Math.max(10, Math.min(left, iframeWin.innerWidth - toolbarWidth - 10));
      tiptap.style.display = "flex";
      tiptap.style.top = top + "px";
      tiptap.style.left = left + "px";
    }

    function updateOutline(target) {
      if (!target || target === iframeDoc.body || target === iframeDoc.documentElement) {
        outline.style.display = "none"; return;
      }
      const rect = target.getBoundingClientRect();
      outline.style.display = "block";
      outline.style.left = rect.left + "px";
      outline.style.top = rect.top + "px";
      outline.style.width = rect.width + "px";
      outline.style.height = rect.height + "px";
    }

    function rgbToHex(rgbStr) {
      if (!rgbStr || rgbStr === "transparent") return "#ffffff";
      const match = rgbStr.match(/\d+/g);
      if (!match || match.length < 3) return "#ffffff";
      return "#" + match.slice(0, 3).map((x) => parseInt(x).toString(16).padStart(2, "0")).join("");
    }

    function currentSelector() {
      return selectedElement ? getUniqueSelector(selectedElement, iframeDoc) : null;
    }

    // ----- Select Element (shared logic) -----
    function selectElement(target) {
      // Flush any pending text undo for the previously selected element
      flushTextSnapshot();

      selectedElement = target;
      updateOutline(target);

      target.setAttribute("contenteditable", "true");
      target.focus();

      // Snapshot current text for undo tracking
      const sel = getUniqueSelector(target, iframeDoc);
      textSnapshotSelector = sel;
      textSnapshotOnSelect = target.textContent ? target.textContent.trim() : "";

      // Update tag label
      const tag = target.tagName.toLowerCase();
      if (tag === "div") {
        tiptapTag.style.display = "none";
        tiptapTagDivider.style.display = "none";
      } else {
        tiptapTag.textContent = `${tag}${target.id ? "#" + target.id : ""}`;
        tiptapTag.style.display = "inline-block";
        tiptapTagDivider.style.display = "inline-block";
      }

      btnReplaceImg.style.display = tag === "img" ? "inline-flex" : "none";

      const computed = iframeWin.getComputedStyle(target);
      inputColor.value = rgbToHex(computed.color);
      inputBg.value = rgbToHex(computed.backgroundColor);

      positionTiptapToolbar(target);
    }

    // ----- Hover -----
    iframeWin.addEventListener("mousemove", (e) => {
      const target = e.target;
      if (target && target !== outline && !tiptap.contains(target) && target !== iframeDoc.body && target !== iframeDoc.documentElement) {
        hoveredElement = target;
        if (!selectedElement) updateOutline(target);
      }
    }, true);

    // ----- Single-Click -----
    iframeWin.addEventListener("click", (e) => {
      const target = e.target;
      if (!target || target === iframeDoc.body || target === iframeDoc.documentElement || target.id === "editor-outline" || tiptap.contains(target)) return;
      if (selectedElement === target && target.getAttribute("contenteditable") === "true") return;

      e.preventDefault();
      e.stopPropagation();
      selectElement(target);
    }, true);

    // ----- Double-Click: Select All Text -----
    iframeWin.addEventListener("dblclick", (e) => {
      const target = e.target;
      if (!target || target === iframeDoc.body || target === iframeDoc.documentElement || target.id === "editor-outline" || tiptap.contains(target)) return;

      if (selectedElement !== target) selectElement(target);

      try {
        const range = iframeDoc.createRange();
        range.selectNodeContents(target);
        const sel = iframeWin.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (err) {}
    }, true);

    // ----- Input: Record text edit -----
    iframeDoc.addEventListener("input", () => {
      if (selectedElement) {
        updateOutline(selectedElement);
        positionTiptapToolbar(selectedElement);
        // Record patch (the undo entry will be flushed when element is deselected)
        const sel = currentSelector();
        if (sel) recordPatch("text", sel, null, selectedElement.textContent ? selectedElement.textContent.trim() : "");
      }
    }, true);

    // ----- Scroll / Resize -----
    iframeWin.addEventListener("scroll", () => { if (selectedElement) { updateOutline(selectedElement); positionTiptapToolbar(selectedElement); } }, true);
    iframeWin.addEventListener("resize", () => { if (selectedElement) { updateOutline(selectedElement); positionTiptapToolbar(selectedElement); } }, true);

    // ----- Iframe Keydown (Ctrl+S / Ctrl+Z) -----
    iframeWin.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        executeSaveCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          performRedo();
        } else {
          e.preventDefault();
          performUndo();
        }
      }
    });

    // =====================================================================
    // Toolbar Button Handlers (with undo tracking)
    // =====================================================================
    function applyStyleWithUndo(prop, newValue) {
      if (!selectedElement) return;
      const sel = currentSelector();
      if (!sel) return;
      const oldValue = selectedElement.style[prop] || "";
      selectedElement.style[prop] = newValue;
      recordPatch("style", sel, prop, newValue);
      pushUndoEntry(sel, "style", prop, oldValue, newValue);
    }

    btnFontSmaller.onclick = (e) => {
      e.stopPropagation();
      if (!selectedElement) return;
      const current = parseFloat(iframeWin.getComputedStyle(selectedElement).fontSize) || 16;
      applyStyleWithUndo("fontSize", Math.max(8, current - 2) + "px");
      updateOutline(selectedElement);
      positionTiptapToolbar(selectedElement);
    };

    btnFontLarger.onclick = (e) => {
      e.stopPropagation();
      if (!selectedElement) return;
      const current = parseFloat(iframeWin.getComputedStyle(selectedElement).fontSize) || 16;
      applyStyleWithUndo("fontSize", (current + 2) + "px");
      updateOutline(selectedElement);
      positionTiptapToolbar(selectedElement);
    };

    btnWeight.onclick = (e) => {
      e.stopPropagation();
      if (!selectedElement) return;
      const current = iframeWin.getComputedStyle(selectedElement).fontWeight;
      applyStyleWithUndo("fontWeight", (current === "700" || current === "bold") ? "normal" : "bold");
    };

    btnAlignLeft.onclick = (e) => { e.stopPropagation(); applyStyleWithUndo("textAlign", "left"); };
    btnAlignCenter.onclick = (e) => { e.stopPropagation(); applyStyleWithUndo("textAlign", "center"); };
    btnAlignRight.onclick = (e) => { e.stopPropagation(); applyStyleWithUndo("textAlign", "right"); };
    btnAlignJustify.onclick = (e) => { e.stopPropagation(); applyStyleWithUndo("textAlign", "justify"); };

    inputColor.oninput = (e) => {
      e.stopPropagation();
      applyStyleWithUndo("color", inputColor.value);
    };

    inputBg.oninput = (e) => {
      e.stopPropagation();
      applyStyleWithUndo("backgroundColor", inputBg.value);
    };

    btnReplaceImg.onclick = (e) => {
      e.stopPropagation();
      if (!selectedElement || selectedElement.tagName.toLowerCase() !== "img") return;
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.accept = "image/*";
      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const sel = currentSelector();
            const oldSrc = selectedElement.src || "";
            selectedElement.src = ev.target.result;
            if (sel) {
              recordPatch("imgSrc", sel, null, ev.target.result);
              pushUndoEntry(sel, "imgSrc", null, oldSrc, ev.target.result);
            }
            updateOutline(selectedElement);
            positionTiptapToolbar(selectedElement);
            showToast("图片已替换", "success");
          };
          reader.readAsDataURL(fileInput.files[0]);
        }
      };
      fileInput.click();
    };
  }

  // =====================================================================
  // View Switching
  // =====================================================================
  function showEditorView() {
    welcomeView.style.display = "none";
    previewIframe.style.display = "block";
    floatingPanel.style.display = "flex";
    prepareAssetBlobUrls();
    for (const [path] of vfsMap.entries()) {
      if (path.endsWith(".html") || path.endsWith(".htm")) { loadHtmlFile(path); break; }
    }
  }

  function showWelcomeView() {
    welcomeView.style.display = "flex";
    previewIframe.style.display = "none";
    floatingPanel.style.display = "none";
  }

  // =====================================================================
  // File Processing
  // =====================================================================
  async function processFiles(files, handles) {
    vfsMap.clear();
    originalHtmlMap.clear();
    editPatches.length = 0;
    undoStack.length = 0;
    redoStack.length = 0;

    files.forEach((file, idx) => {
      const relativePath = file.webkitRelativePath || file.name;
      const handle = handles ? handles[idx] : undefined;
      vfsMap.set(relativePath, { file, relativePath, handle });
    });

    if (vfsMap.size > 0) {
      showToast("文件处理成功，加载全屏编辑", "success");
      showEditorView();
    } else {
      showToast("未检测到有效文件", "warning");
    }
  }

  // =====================================================================
  // Directory Traversal
  // =====================================================================
  async function traverseDirectoryEntry(entry, path = "") {
    const files = [];
    if (entry.isFile) {
      const file = await new Promise((resolve, reject) => entry.file(resolve, reject));
      Object.defineProperty(file, "webkitRelativePath", { value: path + file.name, writable: false });
      files.push(file);
    } else if (entry.isDirectory) {
      const dirReader = entry.createReader();
      const entries = await new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));
      for (const child of entries) {
        const childFiles = await traverseDirectoryEntry(child, path + entry.name + "/");
        files.push(...childFiles);
      }
    }
    return files;
  }

  // =====================================================================
  // Drag & Drop
  // =====================================================================
  function setupDragAndDrop() {
    window.addEventListener("dragover", (e) => { e.preventDefault(); welcomeView.classList.add("drag-over"); });
    window.addEventListener("dragleave", (e) => { if (e.relatedTarget === null) welcomeView.classList.remove("drag-over"); });
    window.addEventListener("drop", async (e) => {
      e.preventDefault();
      welcomeView.classList.remove("drag-over");
      const items = e.dataTransfer?.items;
      if (!items || items.length === 0) return;
      const files = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
          if (entry) {
            if (entry.isDirectory) folderName = entry.name;
            files.push(...(await traverseDirectoryEntry(entry)));
          } else {
            const file = item.getAsFile();
            if (file) files.push(file);
          }
        }
      }
      if (files.length > 0) processFiles(files);
    });
  }

  // =====================================================================
  // File Pickers
  // =====================================================================
  async function openFilePicker() {
    if ("showOpenFilePicker" in window) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: false,
          types: [{ description: "HTML 文件", accept: { "text/html": [".html", ".htm"] } }],
        });
        if (handles.length > 0) {
          const file = await handles[0].getFile();
          folderName = file.name.replace(/\.[^/.]+$/, "");
          processFiles([file], [handles[0]]);
        }
      } catch (err) { if (err.name !== "AbortError") console.error(err); }
    } else {
      inputFile.click();
    }
  }

  async function openDirPicker() {
    if ("showDirectoryPicker" in window) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        folderName = dirHandle.name;
        const files = [], handles = [];
        async function scanDir(handle, currentPath = "") {
          for await (const entry of handle.values()) {
            if (entry.kind === "file") {
              const file = await entry.getFile();
              const relPath = currentPath ? `${currentPath}/${file.name}` : file.name;
              Object.defineProperty(file, "webkitRelativePath", { value: relPath, writable: false });
              files.push(file);
              handles.push(entry);
            } else if (entry.kind === "directory") {
              await scanDir(entry, currentPath ? `${currentPath}/${entry.name}` : entry.name);
            }
          }
        }
        await scanDir(dirHandle);
        processFiles(files, handles);
      } catch (err) { if (err.name !== "AbortError") console.error(err); }
    } else {
      inputDir.click();
    }
  }

  // =====================================================================
  // Save / Export (Patch-Based)
  // =====================================================================
  function executeSaveCopy() {
    if (!activeFilePath) return;
    flushTextSnapshot(); // commit any in-progress text edit

    const originalHtml = originalHtmlMap.get(activeFilePath);
    if (!originalHtml) { showToast("原始文件数据丢失，无法保存", "warning"); return; }

    const patchedHtml = applyPatches(originalHtml);
    const fileName = activeFilePath.split("/").pop() || "index.html";
    const baseName = fileName.replace(/\.html?$/i, "");
    const copyFileName = `${baseName}_${getTimestampString()}.html`;

    const blob = new Blob([patchedHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = copyFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`副本已另存为: ${copyFileName}`, "success");
  }

  async function executeExportZip() {
    if (!activeFilePath) return;
    flushTextSnapshot();

    if (typeof window.JSZip === "undefined") { showToast("未检测到 JSZip 库，打包失败", "warning"); return; }

    try {
      showToast("正在生成 ZIP 压缩包...", "info");
      const zip = new window.JSZip();

      for (const [path, item] of vfsMap.entries()) {
        if ((path.endsWith(".html") || path.endsWith(".htm")) && path === activeFilePath) {
          const originalHtml = originalHtmlMap.get(path);
          zip.file(item.relativePath, originalHtml ? applyPatches(originalHtml) : await item.file.text());
        } else {
          zip.file(item.relativePath, await item.file.arrayBuffer());
        }
      }

      const zipName = `${folderName}_${getTimestampString()}.zip`;
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast(`副本压缩包导出成功: ${zipName}`, "success");
    } catch (err) {
      console.error(err);
      showToast("导出 ZIP 失败", "warning");
    }
  }

  // =====================================================================
  // Handle Paste URLs (Feixiang/Musk Online)
  // =====================================================================
  function getSupportedPastedUrl(text) {
    try {
      const url = new URL((text || "").trim());
      const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
      const supportedHost = ["feixianglaoshi.com", "fbcontent.cn"].some(
        (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
      );
      return url.protocol === "https:" && supportedHost ? url.href : null;
    } catch (_) {
      return null;
    }
  }

  async function processPastedLink(url) {
    showToast("检测到飞象链接，正在抓取并净化...", "info");
    try {
      const rawHtml = await fetchFeixiangHtml(url);
      const purified = purifyFeixiangHtml(rawHtml, "网络课件");
      const file = new File([purified.html], purified.title + ".html", { type: "text/html" });
      Object.defineProperty(file, "webkitRelativePath", { value: file.name, writable: false });
      folderName = purified.title;
      processFiles([file]);
    } catch (err) {
      console.error(err);
      showToast("抓取或净化链接失败: " + err.message, "warning");
    }
  }

  document.addEventListener("paste", (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    const url = getSupportedPastedUrl(text);
    if (!url) return;
    e.preventDefault();
    processPastedLink(url);
  });

  btnPasteLink.addEventListener("click", async () => {
    hideLinkContextMenu();
    if (!navigator.clipboard?.readText) {
      showToast("当前浏览器无法读取剪贴板，请使用 Ctrl/⌘+V", "warning");
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        showToast("剪贴板中没有链接", "warning");
        return;
      }
      const url = getSupportedPastedUrl(text);
      if (!url) {
        showToast("仅支持飞象老师和 fbcontent.cn 的 HTTPS 链接", "warning");
        return;
      }
      await processPastedLink(url);
    } catch (err) {
      showToast("无法读取剪贴板，请允许权限或使用 Ctrl/⌘+V", "warning");
    }
  });

  // =====================================================================
  // Wire Up Events
  // =====================================================================
  bindLinkContextMenu(document);
  window.addEventListener("blur", hideLinkContextMenu);
  window.addEventListener("resize", hideLinkContextMenu);

  setupDragAndDrop();

  btnSelectFile.onclick = openFilePicker;
  btnSelectDir.onclick = openDirPicker;
  btnOpenFile.onclick = () => { showWelcomeView(); openDirPicker(); };

  inputFile.onchange = () => {
    if (inputFile.files && inputFile.files.length > 0) {
      const fileList = Array.from(inputFile.files);
      folderName = fileList[0].name.replace(/\.[^/.]+$/, "");
      processFiles(fileList);
    }
  };

  inputDir.onchange = () => {
    if (inputDir.files && inputDir.files.length > 0) {
      const fileList = Array.from(inputDir.files);
      if (fileList[0].webkitRelativePath) folderName = fileList[0].webkitRelativePath.split("/")[0];
      processFiles(fileList);
    }
  };

  btnSaveCopy.onclick = executeSaveCopy;
  btnExportZip.onclick = executeExportZip;
  btnUndo.onclick = performUndo;
  btnRedo.onclick = performRedo;

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
      e.preventDefault();
      executeSaveCopy();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      if (e.shiftKey) {
        e.preventDefault();
        performRedo();
      } else {
        e.preventDefault();
        performUndo();
      }
    }
  });
})();
