import { appearanceStyles, appearanceControls } from "./appearance.js";
import { artGallery, artSkins } from "./art.js";
import type {
  GitCommit,
  GitRef,
  MetroLayout,
  PrivacyMode,
  RenderOptions,
  RepositoryHistory,
} from "./types.js";

interface ClientRef {
  readonly name: string;
  readonly kind: GitRef["kind"];
  readonly target: string;
  readonly reachable: readonly string[];
}

interface ClientCommit {
  readonly hash: string;
  readonly shortHash: string;
  readonly parents: readonly string[];
  readonly author: string;
  readonly authoredAt: string;
  readonly subject: string;
  readonly refs: readonly Pick<GitRef, "name" | "kind">[];
  readonly lane: number;
  readonly row: number;
  readonly x: number;
  readonly y: number;
  readonly isMerge: boolean;
  readonly searchText: string;
}

interface ClientData {
  readonly repository: string;
  readonly head: string;
  readonly headHash: string;
  readonly truncated: boolean;
  readonly maxCommits: number;
  readonly commits: readonly ClientCommit[];
  readonly refs: readonly ClientRef[];
}

const lanePaletteSize = 12;

export function renderMetroHtml(
  history: RepositoryHistory,
  layout: MetroLayout,
  options: RenderOptions,
): string {
  const clientData = createClientData(history, layout, options.privacy);
  const authors = new Set(clientData.commits.map((commit) => commit.author));
  const branchCount = clientData.refs.filter((ref) => ref.kind === "branch").length;
  const mergeCount = clientData.commits.filter((commit) => commit.isMerge).length;
  const firstCommit = clientData.commits[0];
  const lastCommit = clientData.commits.at(-1);
  const initialHash = clientData.commits.some((commit) => commit.hash === history.headHash)
    ? history.headHash
    : (firstCommit?.hash ?? "");
  const range = firstCommit === undefined || lastCommit === undefined
    ? "No commits"
    : `${dateOnly(lastCommit.authoredAt)} – ${dateOnly(firstCommit.authoredAt)}`;

  return `<!doctype html>
<html lang="en" data-theme="${options.theme}" data-skin="starry">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">
  <title>${escapeHtml(options.title)} · Repo Metro</title>
  <style>${appearanceStyles()}</style>
</head>
<body>
  <a class="skip-link" href="#metro-map">Skip to map</a>
  <a class="skip-link" href="#commit-details">Skip to commit details</a>
  <header class="site-header">
    <div class="topbar">
      <div class="product-name">${brandMark()}<span>Repo Metro</span><span class="product-divider">/</span><span class="workspace-name">History explorer</span></div>
      <div class="topbar-actions"><span class="offline-badge"><i></i> Local &amp; offline</span>${appearanceControls()}</div>
    </div>
    ${artGallery()}
    <div class="brand-row">
      <div class="brand-lockup">
        <div>
          <div class="art-heading"><p class="art-kicker">The painted collection <span id="art-number">/ 01</span></p><h2 id="art-title">The Starry Night</h2><p class="art-description" id="art-description">A little starlight between every line.</p><p class="art-credit" id="art-credit">Inspired by Vincent van Gogh · 1889</p></div>
          <p class="eyebrow">Every commit, a place in the story</p>
          <h1>${escapeHtml(options.title)}</h1>
          <p class="subtitle"><span class="head-badge">${escapeHtml(history.head)}</span><span>${escapeHtml(range)}</span></p>
        </div>
      </div>
      <div class="journey-mark" aria-hidden="true"><span>YOUR CODE. CONNECTED.</span><svg viewBox="0 0 180 56"><path d="M4 42H62Q78 42 78 26T96 10H176"/><path d="M4 10H42Q58 10 58 26T76 42H176"/><circle cx="22" cy="42" r="5"/><circle cx="120" cy="10" r="5"/><circle cx="158" cy="42" r="5"/></svg></div>
    </div>
    <dl class="stats" aria-label="Repository summary">
      ${stat("Commits", String(clientData.commits.length))}
      ${stat("Branches", String(branchCount))}
      ${stat("Contributors", String(authors.size))}
      ${stat("Interchanges", String(mergeCount))}
    </dl>
  </header>

  <main>
    <nav class="toolbar" aria-label="Map controls">
      <label class="search-field" for="search-input">
        <span>Find a station</span>
        <input id="search-input" type="search" placeholder="Message, SHA, author, ref…" autocomplete="off">
        <kbd aria-hidden="true">/</kbd>
      </label>
      <label class="branch-field" for="branch-select">
        <span>Focus line</span>
        <select id="branch-select">
          <option value="all">All history</option>
          ${clientData.refs
            .filter((ref) => ref.kind === "branch" && ref.reachable.length > 0)
            .map((ref) => `<option value="${escapeAttribute(ref.name)}">${escapeHtml(ref.name)}</option>`)
            .join("")}
        </select>
      </label>
      <div class="view-switch" role="group" aria-label="View">
        <button id="map-view-button" type="button" aria-pressed="true">Map</button>
        <button id="list-view-button" type="button" aria-pressed="false">List</button>
      </div>
    </nav>

    <div class="map-heading"><div><span class="section-marker" aria-hidden="true"></span><h2>Repository network</h2><span class="search-status" id="search-status" aria-live="polite">Showing all commits</span></div><span class="map-direction">Newest first <span aria-hidden="true">↓</span></span></div>

    <section class="explorer" aria-label="Repository history explorer">
      <figure class="map-panel" id="map-panel">
        <figcaption><span>Follow the lines. Explore the history.</span><span class="map-legend"><span><i class="legend-station"></i>Commit</span><span><i class="legend-merge"></i>Merge</span><span><i class="legend-head"></i>HEAD</span></span></figcaption>
        <div class="map-scroll">
          ${renderSvg(history, layout, clientData, initialHash)}
        </div>
        <p class="map-pan-hint">Swipe sideways to explore longer messages <span aria-hidden="true">↔</span></p>
      </figure>

      <section class="list-panel" id="list-panel" hidden aria-label="Commit list">
        <ol class="commit-list">
          ${clientData.commits.map((commit) => renderListItem(commit, commit.hash === initialHash)).join("")}
        </ol>
      </section>

      <aside class="details-panel" id="commit-details" aria-live="polite">
        <div class="ticket-heading"><p class="eyebrow">Station details</p><span class="station-number" id="detail-number">—</span></div>
        <span class="commit-kind" id="detail-kind">Commit</span>
        <h2 id="detail-subject">Select a commit</h2>
        <div class="author-row"><span class="author-avatar" id="detail-avatar" aria-hidden="true"></span><p class="detail-author" id="detail-author"></p></div>
        <div class="detail-grid">
          <div class="hash-field"><span>Commit</span><code id="detail-hash">—</code></div>
          <div><span>Date</span><time id="detail-date">—</time></div>
        </div>
        <div class="detail-section">
          <span>Refs</span>
          <div class="ref-list" id="detail-refs"><span class="empty-value">None</span></div>
        </div>
        <div class="detail-section">
          <span>Parents</span>
          <div class="parent-list" id="detail-parents"><span class="empty-value">Root commit</span></div>
        </div>
        <button class="copy-button" id="copy-hash" type="button" disabled>Copy full SHA</button>
        <p class="copy-status" id="copy-status" aria-live="polite"></p>
        <div class="ticket-footer"><span class="ticket-track" aria-hidden="true">●━━━━●━━━━◎</span><span>One stop in your story</span></div>
      </aside>
    </section>
  </main>

  <footer>
    <p><span class="footer-brand">Repo Metro</span> Made from your history. Built to explore.</p>
    <p class="keyboard-help"><kbd>/</kbd> Search <kbd>J</kbd><kbd>K</kbd> Move between stations <span>·</span> Generated locally</p>
    ${history.truncated ? `<p class="truncation-note">Showing the newest ${history.maxCommits} commits. Earlier history continues beyond the map.</p>` : ""}
  </footer>

  <script id="metro-data" type="application/json">${safeJson(clientData)}</script>
  <script>${clientScript(initialHash)}</script>
</body>
</html>`;
}

function createClientData(
  history: RepositoryHistory,
  layout: MetroLayout,
  privacy: PrivacyMode,
): ClientData {
  const aliases = createAuthorAliases(history.commits, privacy);
  const commits = layout.commits.map<ClientCommit>((commit) => {
    const author = aliases.get(authorKey(commit)) ?? (commit.authorName || "Unknown contributor");
    const refs = commit.refs.map(({ name, kind }) => ({ name, kind }));
    return {
      hash: commit.hash,
      shortHash: commit.shortHash,
      parents: commit.parents,
      author,
      authoredAt: commit.authoredAt,
      subject: commit.subject || "(no commit message)",
      refs,
      lane: commit.lane,
      row: commit.row,
      x: commit.x,
      y: commit.y,
      isMerge: commit.isMerge,
      searchText: [
        commit.hash,
        commit.shortHash,
        commit.subject,
        author,
        ...refs.map((ref) => ref.name),
      ].join(" ").toLocaleLowerCase(),
    };
  });
  const commitMap = new Map(history.commits.map((commit) => [commit.hash, commit]));
  const refs = history.refs
    .filter((ref) => commitMap.has(ref.target))
    .map<ClientRef>((ref) => ({
      name: ref.name,
      kind: ref.kind,
      target: ref.target,
      reachable: [...reachableFrom(ref.target, commitMap)],
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    repository: history.name,
    head: history.head,
    headHash: history.headHash,
    truncated: history.truncated,
    maxCommits: history.maxCommits,
    commits,
    refs,
  };
}

function createAuthorAliases(
  commits: readonly GitCommit[],
  privacy: PrivacyMode,
): Map<string, string> {
  const keys = [...new Set(commits.map(authorKey))].sort((left, right) => left.localeCompare(right));
  return new Map(
    keys.map((key, index) => [
      key,
      privacy === "strict"
        ? `Contributor ${index + 1}`
        : commits.find((commit) => authorKey(commit) === key)?.authorName || "Unknown contributor",
    ]),
  );
}

function authorKey(commit: GitCommit): string {
  return (commit.authorEmail || commit.authorName || "unknown").toLocaleLowerCase();
}

function reachableFrom(start: string, commits: ReadonlyMap<string, GitCommit>): Set<string> {
  const reachable = new Set<string>();
  const pending = [start];
  while (pending.length > 0) {
    const hash = pending.pop();
    if (hash === undefined || reachable.has(hash)) continue;
    const commit = commits.get(hash);
    if (commit === undefined) continue;
    reachable.add(hash);
    pending.push(...commit.parents);
  }
  return reachable;
}

function renderSvg(
  history: RepositoryHistory,
  layout: MetroLayout,
  data: ClientData,
  initialHash: string,
): string {
  const positions = new Map(layout.commits.map((commit) => [commit.hash, commit]));
  const months = new Set<string>();
  const monthLines = layout.commits.flatMap((commit) => {
    const month = commit.authoredAt.slice(0, 7);
    if (months.has(month)) return [];
    months.add(month);
    return [`<g class="date-marker" aria-hidden="true">
      <line x1="18" x2="${layout.width - 24}" y1="${commit.y - 26}" y2="${commit.y - 26}"></line>
      <text x="18" y="${commit.y - 34}">${escapeHtml(formatMonth(commit.authoredAt))}</text>
    </g>`];
  }).join("");

  const edges = layout.edges.map((edge) => {
    const from = positions.get(edge.from);
    const to = positions.get(edge.to);
    if (from === undefined || to === undefined) return "";
    const distance = Math.max(24, to.y - from.y);
    const bend = Math.min(distance * 0.45, 42);
    const path = `M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${to.x} ${to.y - bend}, ${to.x} ${to.y}`;
    return `<path class="metro-edge lane-${edge.fromLane % lanePaletteSize}" data-from="${edge.from}" data-to="${edge.to}" d="${path}"></path>`;
  }).join("");

  const continuations = history.truncated
    ? layout.continuationLanes.map((lane) => {
      const x = layout.graphStartX + lane * layout.laneWidth;
      const bottom = layout.height - 28;
      return `<path class="continuation lane-${lane % lanePaletteSize}" d="M ${x} ${bottom - 44} L ${x} ${bottom}"></path>`;
    }).join("")
    : "";

  const stations = data.commits.map((commit) => {
    const refs = commit.refs.map((ref) => ref.name).join(", ");
    const label = [commit.shortHash, commit.subject, commit.author, dateOnly(commit.authoredAt), refs]
      .filter(Boolean)
      .join(" · ");
    const isHead = commit.hash === history.headHash;
    return `<g class="station lane-${commit.lane % lanePaletteSize}${commit.hash === initialHash ? " is-selected" : ""}" data-hash="${commit.hash}" transform="translate(${commit.x} ${commit.y})" role="button" tabindex="${commit.hash === initialHash ? "0" : "-1"}" aria-label="${escapeAttribute(label)}">
      <title>${escapeHtml(label)}</title>
      <circle class="station-hit" r="22"></circle>
      ${isHead ? `<circle class="head-ring" r="14"></circle>` : ""}
      ${commit.isMerge
        ? `<circle class="merge-outer" r="10"></circle><circle class="merge-inner" r="4"></circle>`
        : `<circle class="station-core" r="7"></circle>`}
    </g>`;
  }).join("");

  const labels = data.commits.map((commit) => {
    const refText = commit.refs.slice(0, 2).map((ref) => ref.name).join(" · ");
    return `<g class="commit-label${commit.hash === initialHash ? " is-selected" : ""}" data-hash="${commit.hash}" transform="translate(0 ${commit.y})">
      <rect class="row-highlight" x="8" y="-23" width="${layout.width - 16}" height="46" rx="7"></rect>
      <line class="label-guide" x1="${commit.x + 16}" x2="${layout.labelStartX - 18}" y1="0" y2="0"></line>
      <text class="hash-label" x="${layout.labelStartX}" y="-5">${escapeHtml(commit.shortHash)}</text>
      <text class="subject-label" x="${layout.labelStartX + 78}" y="-5">${escapeHtml(truncate(commit.subject, 66))}</text>
      <text class="meta-label" x="${layout.labelStartX}" y="15">${escapeHtml(commit.author)} · ${escapeHtml(dateOnly(commit.authoredAt))}</text>
      ${refText.length > 0 ? `<text class="ref-label" x="${layout.labelStartX + 300}" y="15">${escapeHtml(truncate(refText, 36))}</text>` : ""}
    </g>`;
  }).join("");

  return `<svg id="metro-map" class="metro-map" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}" role="img" aria-labelledby="map-title map-description">
    <title id="map-title">Git history metro map for ${escapeHtml(history.name)}</title>
    <desc id="map-description">Branches are represented as colored tracks, commits as stations, and merges as interchange stations. Newest commits appear first.</desc>
    ${monthLines}
    <g class="edges">${edges}${continuations}</g>
    <g class="labels">${labels}</g>
    <g class="stations">${stations}</g>
  </svg>`;
}

function renderListItem(commit: ClientCommit, selected: boolean): string {
  return `<li class="commit-list-item${selected ? " is-selected" : ""}" data-hash="${commit.hash}">
    <button type="button" data-hash="${commit.hash}" aria-pressed="${selected ? "true" : "false"}">
      <span class="list-line"><code>${escapeHtml(commit.shortHash)}</code><strong>${escapeHtml(commit.subject)}</strong></span>
      <span class="list-meta">${escapeHtml(commit.author)} · ${escapeHtml(dateOnly(commit.authoredAt))}${commit.isMerge ? " · Merge" : ""}</span>
    </button>
  </li>`;
}

function stat(label: string, value: string): string {
  return `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`;
}

function brandMark(): string {
  return `<svg class="brand-mark" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M13 7v34M24 7v11c0 5 11 5 11 10v13"></path>
    <circle cx="13" cy="9" r="5"></circle>
    <circle cx="24" cy="9" r="5"></circle>
    <circle cx="13" cy="39" r="5"></circle>
    <circle cx="35" cy="39" r="5"></circle>
  </svg>`;
}

function dateOnly(value: string): string {
  return value.slice(0, 10) || "Unknown date";
}

function formatMonth(value: string): string {
  const date = new Date(`${value.slice(0, 7)}-01T00:00:00Z`);
  if (Number.isNaN(date.valueOf())) return value.slice(0, 7);
  return new Intl.DateTimeFormat("en", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

function truncate(value: string, limit: number): string {
  const characters = [...value];
  return characters.length <= limit ? value : `${characters.slice(0, limit - 1).join("")}…`;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}


function clientScript(initialHash: string): string {
  return `
    (() => {
      "use strict";
      const data = JSON.parse(document.getElementById("metro-data").textContent);
      const commits = new Map(data.commits.map((commit) => [commit.hash, commit]));
      const commitOrder = data.commits.map((commit) => commit.hash);
      const refs = new Map(data.refs.map((ref) => [ref.name, ref]));
      const search = document.getElementById("search-input");
      const branchSelect = document.getElementById("branch-select");
      const searchStatus = document.getElementById("search-status");
      const mapPanel = document.getElementById("map-panel");
      const listPanel = document.getElementById("list-panel");
      const mapButton = document.getElementById("map-view-button");
      const listButton = document.getElementById("list-view-button");
      const themeButton = document.getElementById("theme-toggle");
      const artworks = ${safeJson(artSkins)};
      const appearance = document.getElementById("appearance");
      const skinButtons = [...document.querySelectorAll("[data-skin-choice], [data-gallery-choice]")];
      const copyButton = document.getElementById("copy-hash");
      const copyStatus = document.getElementById("copy-status");
      let selectedHash = ${JSON.stringify(initialHash)};
      let matches = [];
      let matchIndex = -1;

      const stationFor = (hash) => document.querySelector('.station[data-hash="' + CSS.escape(hash) + '"]');
      const labelFor = (hash) => document.querySelector('.commit-label[data-hash="' + CSS.escape(hash) + '"]');
      const listItemFor = (hash) => document.querySelector('.commit-list-item[data-hash="' + CSS.escape(hash) + '"]');

      function applyFilters() {
        const query = search.value.trim().toLocaleLowerCase();
        const focusedRef = branchSelect.value === "all" ? null : refs.get(branchSelect.value);
        const reachable = focusedRef ? new Set(focusedRef.reachable) : null;
        matches = query ? data.commits.filter((commit) => commit.searchText.includes(query)).map((commit) => commit.hash) : [];
        const matchSet = new Set(matches);
        for (const commit of data.commits) {
          const outsideFocus = reachable !== null && !reachable.has(commit.hash);
          const outsideSearch = query.length > 0 && !matchSet.has(commit.hash);
          for (const element of [stationFor(commit.hash), labelFor(commit.hash), listItemFor(commit.hash)]) {
            if (!element) continue;
            element.classList.toggle("is-outside-focus", outsideFocus);
            element.classList.toggle("is-search-dimmed", outsideSearch);
            element.classList.toggle("is-match", query.length > 0 && !outsideSearch);
          }
        }
        document.querySelectorAll(".metro-edge").forEach((edge) => {
          const from = edge.dataset.from;
          const to = edge.dataset.to;
          edge.classList.toggle("is-outside-focus", reachable !== null && (!reachable.has(from) || !reachable.has(to)));
          edge.classList.toggle("is-search-dimmed", query.length > 0 && !matchSet.has(from) && !matchSet.has(to));
        });
        matchIndex = -1;
        const focusLabel = focusedRef ? " on " + focusedRef.name : "";
        searchStatus.textContent = query.length === 0
          ? "Showing " + (reachable ? reachable.size : data.commits.length) + " commits" + focusLabel
          : matches.length + (matches.length === 1 ? " match" : " matches") + focusLabel + ". Press Enter to jump.";
      }

      function selectCommit(hash, shouldFocus = false) {
        const commit = commits.get(hash);
        if (!commit) return;
        selectedHash = hash;
        document.querySelectorAll(".station, .commit-label, .commit-list-item").forEach((element) => element.classList.remove("is-selected"));
        document.querySelectorAll(".commit-list-item button").forEach((button) => button.setAttribute("aria-pressed", "false"));
        document.querySelectorAll(".station").forEach((station) => station.setAttribute("tabindex", "-1"));
        const station = stationFor(hash);
        const label = labelFor(hash);
        const listItem = listItemFor(hash);
        station?.classList.add("is-selected");
        station?.setAttribute("tabindex", "0");
        label?.classList.add("is-selected");
        listItem?.classList.add("is-selected");
        listItem?.querySelector("button")?.setAttribute("aria-pressed", "true");
        if (shouldFocus) {
          (mapPanel.hidden ? listItem?.querySelector("button") : station)?.focus({ preventScroll: true });
        }
        document.getElementById("detail-subject").textContent = commit.subject;
        document.getElementById("detail-author").textContent = commit.author;
        document.getElementById("detail-avatar").textContent = [...commit.author][0]?.toLocaleUpperCase() || "?";
        document.getElementById("detail-number").textContent = String(commit.row + 1).padStart(2, "0") + " / " + String(data.commits.length).padStart(2, "0");
        document.getElementById("detail-kind").textContent = commit.hash === data.headHash ? "HEAD · " + (commit.isMerge ? "Interchange" : "Commit") : commit.isMerge ? "Interchange" : "Commit";
        document.getElementById("commit-details").style.setProperty("--station-color", "var(--lane-" + (commit.lane % 12) + ")");
        document.getElementById("detail-hash").textContent = commit.hash;
        const detailDate = document.getElementById("detail-date");
        detailDate.textContent = new Date(commit.authoredAt).toLocaleString();
        detailDate.setAttribute("datetime", commit.authoredAt);
        const refList = document.getElementById("detail-refs");
        refList.replaceChildren();
        if (commit.refs.length === 0) appendText(refList, "span", "empty-value", "None");
        for (const ref of commit.refs) appendText(refList, "span", "ref-chip", ref.name);
        const parentList = document.getElementById("detail-parents");
        parentList.replaceChildren();
        if (commit.parents.length === 0) appendText(parentList, "span", "empty-value", "Root commit");
        for (const parent of commit.parents) {
          if (commits.has(parent)) {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "parent-button";
            button.textContent = parent.slice(0, 7);
            button.addEventListener("click", () => {
              selectCommit(parent, true);
              scrollToCommit(parent);
            });
            parentList.append(button);
          } else {
            appendText(parentList, "span", "ref-chip", parent.slice(0, 7) + " (outside snapshot)");
          }
        }
        copyButton.disabled = false;
        copyStatus.textContent = "";
        history.replaceState(null, "", "#commit-" + hash);
      }

      function appendText(parent, tag, className, text) {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        parent.append(element);
      }
      function prefersReducedMotion() { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; }
      function scrollToCommit(hash) {
        const target = mapPanel.hidden ? listItemFor(hash) : stationFor(hash);
        target?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
      function moveSelection(delta) {
        const current = Math.max(0, commitOrder.indexOf(selectedHash));
        const next = Math.max(0, Math.min(commitOrder.length - 1, current + delta));
        selectCommit(commitOrder[next], true);
        scrollToCommit(commitOrder[next]);
      }
      function jumpMatch(direction) {
        if (matches.length === 0) return;
        matchIndex = matchIndex < 0 ? (direction < 0 ? matches.length - 1 : 0) : (matchIndex + direction + matches.length) % matches.length;
        const hash = matches[matchIndex];
        selectCommit(hash, true);
        scrollToCommit(hash);
        searchStatus.textContent = "Match " + (matchIndex + 1) + " of " + matches.length;
      }
      function setView(view) {
        const map = view === "map";
        mapPanel.hidden = !map;
        listPanel.hidden = map;
        mapButton.setAttribute("aria-pressed", String(map));
        listButton.setAttribute("aria-pressed", String(!map));
      }
      function setTheme(theme) {
        document.documentElement.dataset.theme = theme;
        themeButton.textContent = "Theme: " + (theme === "auto" ? "system" : theme);
        themeButton.setAttribute("aria-label", "Color theme is " + theme + ". Activate to change it.");
        try { localStorage.setItem("repo-metro-theme", theme); } catch {}
      }
      function setSkin(skin) {
        const validSkin = ["studio", "paper", "dusk", ...artworks.map((art) => art.id)].includes(skin) ? skin : "starry";
        document.documentElement.dataset.skin = validSkin;
        skinButtons.forEach((button) => button.setAttribute("aria-pressed", String((button.dataset.skinChoice || button.dataset.galleryChoice) === validSkin)));
        const artwork = artworks.find((art) => art.id === validSkin);
        if (artwork) {
          document.getElementById("art-title").textContent = artwork.title;
          document.getElementById("art-number").textContent = "/ " + artwork.number;
          document.getElementById("art-description").textContent = artwork.description;
          document.getElementById("art-credit").textContent = "Inspired by " + artwork.artist + " · " + artwork.year;
        }
        try { localStorage.setItem("repo-metro-skin", validSkin); } catch {}
      }
      skinButtons.forEach((button) => button.addEventListener("click", () => setSkin(button.dataset.skinChoice || button.dataset.galleryChoice)));
      document.addEventListener("click", (event) => {
        if (!appearance.contains(event.target)) appearance.open = false;
      });
      appearance.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          appearance.open = false;
          appearance.querySelector("summary").focus();
        }
      });

      document.querySelectorAll(".station").forEach((station) => {
        station.addEventListener("click", () => selectCommit(station.dataset.hash));
        station.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCommit(station.dataset.hash); }
          if (event.key === "ArrowDown" || event.key.toLocaleLowerCase() === "j") { event.preventDefault(); moveSelection(1); }
          if (event.key === "ArrowUp" || event.key.toLocaleLowerCase() === "k") { event.preventDefault(); moveSelection(-1); }
        });
      });
      document.querySelectorAll(".commit-label").forEach((label) => label.addEventListener("click", () => selectCommit(label.dataset.hash)));
      document.querySelectorAll(".commit-list-item button").forEach((button) => {
        button.addEventListener("click", () => selectCommit(button.dataset.hash));
        button.addEventListener("keydown", (event) => {
          if (["ArrowDown", "j", "ArrowUp", "k"].includes(event.key)) {
            event.preventDefault();
            moveSelection(["ArrowDown", "j"].includes(event.key) ? 1 : -1);
          }
        });
      });
      search.addEventListener("input", applyFilters);
      search.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); jumpMatch(event.shiftKey ? -1 : 1); }
        if (event.key === "Escape") { search.value = ""; applyFilters(); search.blur(); }
      });
      branchSelect.addEventListener("change", applyFilters);
      mapButton.addEventListener("click", () => setView("map"));
      listButton.addEventListener("click", () => setView("list"));
      copyButton.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(selectedHash); }
        catch {
          const text = document.createElement("textarea");
          text.value = selectedHash; text.style.position = "absolute"; text.style.left = "-9999px";
          document.body.append(text); text.select(); document.execCommand("copy"); text.remove();
        }
        copyStatus.textContent = "SHA copied";
      });
      themeButton.addEventListener("click", () => {
        const current = document.documentElement.dataset.theme || "auto";
        setTheme(current === "auto" ? "light" : current === "light" ? "dark" : "auto");
      });
      document.addEventListener("keydown", (event) => {
        const editing = event.target instanceof Element && (event.target.matches("input, textarea, select") || event.target.isContentEditable);
        if (event.key === "/" && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); search.focus(); }
      });
      let storedTheme = null;
      let storedSkin = null;
      try {
        storedTheme = localStorage.getItem("repo-metro-theme");
        storedSkin = localStorage.getItem("repo-metro-skin");
      } catch {}
      setSkin(storedSkin);
      setTheme(["auto", "light", "dark"].includes(storedTheme) ? storedTheme : document.documentElement.dataset.theme || "auto");
      applyFilters();
      const hashFromUrl = location.hash.startsWith("#commit-") ? location.hash.slice(8) : "";
      selectCommit(commits.has(hashFromUrl) ? hashFromUrl : selectedHash);
    })();
  `;
}
