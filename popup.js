function appendInlineFormat(parent, text) {
  const tokenPattern = /(`([^`]+)`|\*\*([^*]+)\*\*)/g;
  let lastIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    parent.append(document.createTextNode(text.slice(lastIndex, match.index)));

    if (match[2] !== undefined) {
      const code = document.createElement("code");
      code.textContent = match[2];
      parent.append(code);
    } else {
      const strong = document.createElement("strong");
      strong.textContent = match[3];
      parent.append(strong);
    }

    lastIndex = match.index + match[0].length;
  }

  parent.append(document.createTextNode(text.slice(lastIndex)));
}

function renderMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const fragment = document.createDocumentFragment();
  const listStack = [];

  const closeListsDownTo = (targetDepth) => {
    listStack.length = targetDepth;
  };

  for (const line of lines) {
    if (/^###\s+/.test(line)) {
      closeListsDownTo(0);
      const heading = document.createElement("h2");
      appendInlineFormat(heading, line.replace(/^###\s+/, ""));
      fragment.append(heading);
      continue;
    }

    if (!line.trim()) {
      closeListsDownTo(0);
      continue;
    }

    const match = line.match(/^(\s*)-\s+(.*)$/);
    if (match) {
      const depth = Math.floor(match[1].length / 2);

      closeListsDownTo(depth + 1);
      while (listStack.length < depth + 1) {
        const list = document.createElement("ul");
        const parentList = listStack.at(-1);
        if (parentList) {
          parentList.lastElementChild?.append(list);
        } else {
          fragment.append(list);
        }
        listStack.push(list);
      }

      const item = document.createElement("li");
      appendInlineFormat(item, match[2]);
      listStack.at(-1).append(item);
      continue;
    }

    closeListsDownTo(0);
    const paragraph = document.createElement("div");
    appendInlineFormat(paragraph, line.trim());
    fragment.append(paragraph);
  }

  return fragment;
}

async function loadControls() {
  const contentEl = document.getElementById("content");
  try {
    const url = chrome.runtime.getURL("CONTROLS.md");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to load controls: ${res.status}`);
    contentEl.replaceChildren(renderMarkdown(await res.text()));
  } catch (err) {
    const error = document.createElement("div");
    error.className = "error";
    error.textContent = String(err && err.message ? err.message : err);
    contentEl.replaceChildren(error);
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
