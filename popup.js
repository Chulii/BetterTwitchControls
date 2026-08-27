function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function inlineFormat(s) {
  // order matters: escape first, then format
  let out = escapeHtml(s);
  out = out.replace(/`([^`]+)`/g, "<code>$1</code>");
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  return out;
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const html = [];

  let listStack = []; // array of indent levels

  const closeListsDownTo = (targetDepth) => {
    while (listStack.length > targetDepth) {
      html.push("</ul>");
      listStack.pop();
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings (we only use ### in this repo)
    if (/^###\s+/.test(line)) {
      closeListsDownTo(0);
      const text = line.replace(/^###\s+/, "");
      html.push(`<h2>${inlineFormat(text)}</h2>`);
      continue;
    }

    // Blank line
    if (!line.trim()) {
      closeListsDownTo(0);
      continue;
    }

    // List items: support nested lists via leading spaces
    const m = line.match(/^(\s*)-\s+(.*)$/);
    if (m) {
      const indentSpaces = m[1].length;
      const depth = Math.floor(indentSpaces / 2); // 2 spaces per depth in our markdown

      while (listStack.length < depth + 1) {
        html.push("<ul>");
        listStack.push(depth);
      }
      closeListsDownTo(depth + 1);

      html.push(`<li>${inlineFormat(m[2])}</li>`);
      continue;
    }

    // Paragraph fallback
    closeListsDownTo(0);
    html.push(`<div>${inlineFormat(line.trim())}</div>`);
  }

  closeListsDownTo(0);
  return html.join("\n");
}

async function loadControls() {
  const contentEl = document.getElementById("content");
  try {
    const url = chrome.runtime.getURL("CONTROLS.md");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load controls: ${res.status}`);
    const md = await res.text();
    contentEl.innerHTML = renderMarkdown(md);
  } catch (err) {
    contentEl.innerHTML = `<div class="error">${escapeHtml(
      String(err && err.message ? err.message : err),
    )}</div>`;
  }
}

function setVersion() {
  const el = document.getElementById("versionLine");
  if (!el) return;
  try {
    const v = chrome.runtime.getManifest().version;
    el.textContent = `v${v}`;
  } catch {
    el.textContent = "v—";
  }
}

function openUrl(url) {
  try {
    chrome.tabs.create({ url });
  } catch {
    window.open(url, "_blank", "noreferrer");
  }
}

function setupFooterLinks() {
  const updateLink = document.getElementById("updateLink");
  if (updateLink) {
    const isFirefox = navigator.userAgent.includes("Firefox");
    const url = isFirefox
      ? "about:addons"
      : `chrome://extensions/?id=${chrome.runtime.id}`;
    updateLink.textContent = isFirefox
      ? "Manage updates in Add-ons"
      : "Manage updates in Extensions";
    updateLink.addEventListener("click", (e) => {
      e.preventDefault();
      openUrl(url);
    });
  }

  const contributeLink = document.getElementById("contributeLink");
  if (contributeLink) {
    contributeLink.addEventListener("click", (e) => {
      e.preventDefault();
      openUrl("https://github.com/Chulii/BetterTwitchControls");
    });
  }
}


document.addEventListener("DOMContentLoaded", () => {
  setupFooterLinks();
  setVersion();
  loadControls();
});
