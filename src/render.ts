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
<html lang="en" data-theme="${options.theme}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:">
  <title>${escapeHtml(options.title)} · Repo Metro</title>
  <style>${styles()}</style>
</head>
<body>
  <a class="skip-link" href="#metro-map">Skip to map</a>
  <a class="skip-link" href="#commit-details">Skip to commit details</a>
  <header class="site-header">
    <div class="brand-row">
      <div class="brand-lockup">
        ${brandMark()}
        <div>
          <p class="eyebrow">Repo Metro</p>
          <h1>${escapeHtml(options.title)}</h1>
          <p class="subtitle">${escapeHtml(history.head)} · ${escapeHtml(range)}</p>
        </div>
      </div>
      <button class="icon-button" id="theme-toggle" type="button" aria-label="Change color theme">Theme: system</button>
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
        <span>Search</span>
        <input id="search-input" type="search" placeholder="Message, SHA, author, ref…" autocomplete="off">
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
      <p class="search-status" id="search-status" aria-live="polite">Showing all commits</p>
    </nav>

    <section class="explorer" aria-label="Repository history explorer">
      <figure class="map-panel" id="map-panel">
        <figcaption>Newest commits are at the top. Scroll down to travel back in time.</figcaption>
        <div class="map-scroll">
          ${renderSvg(history, layout, clientData, initialHash)}
        </div>
      </figure>

      <section class="list-panel" id="list-panel" hidden aria-label="Commit list">
        <ol class="commit-list">
          ${clientData.commits.map((commit) => renderListItem(commit, commit.hash === initialHash)).join("")}
        </ol>
      </section>

      <aside class="details-panel" id="commit-details" aria-live="polite">
        <p class="eyebrow">Selected station</p>
        <h2 id="detail-subject">Select a commit</h2>
        <p class="detail-author" id="detail-author"></p>
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
      </aside>
    </section>
  </main>

  <footer>
    <p>Generated locally. No repository data was uploaded.</p>
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

function styles(): string {
  return `
    :root {
      color-scheme: light;
      --bg: #f3f5f8;
      --surface: #ffffff;
      --surface-raised: #ffffff;
      --text: #172033;
      --muted: #627087;
      --faint: #d9dee8;
      --border: #cfd6e2;
      --accent: #20283a;
      --accent-text: #ffffff;
      --focus: #2563eb;
      --shadow: 0 18px 50px rgba(35, 45, 65, 0.10);
      --lane-0: #2563eb; --lane-1: #dc2626; --lane-2: #059669; --lane-3: #d97706;
      --lane-4: #7c3aed; --lane-5: #0891b2; --lane-6: #db2777; --lane-7: #4d7c0f;
      --lane-8: #9333ea; --lane-9: #0f766e; --lane-10: #c2410c; --lane-11: #4f46e5;
    }
    :root[data-theme="dark"] {
      color-scheme: dark;
      --bg: #0b111b; --surface: #111a27; --surface-raised: #152131; --text: #edf2f8;
      --muted: #a7b3c4; --faint: #253247; --border: #334158; --accent: #f2f6fb;
      --accent-text: #111827; --focus: #60a5fa; --shadow: 0 18px 55px rgba(0, 0, 0, 0.34);
      --lane-0: #60a5fa; --lane-1: #fb7185; --lane-2: #34d399; --lane-3: #fbbf24;
      --lane-4: #a78bfa; --lane-5: #22d3ee; --lane-6: #f472b6; --lane-7: #a3e635;
      --lane-8: #c084fc; --lane-9: #2dd4bf; --lane-10: #fb923c; --lane-11: #818cf8;
    }
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        color-scheme: dark;
        --bg: #0b111b; --surface: #111a27; --surface-raised: #152131; --text: #edf2f8;
        --muted: #a7b3c4; --faint: #253247; --border: #334158; --accent: #f2f6fb;
        --accent-text: #111827; --focus: #60a5fa; --shadow: 0 18px 55px rgba(0, 0, 0, 0.34);
        --lane-0: #60a5fa; --lane-1: #fb7185; --lane-2: #34d399; --lane-3: #fbbf24;
        --lane-4: #a78bfa; --lane-5: #22d3ee; --lane-6: #f472b6; --lane-7: #a3e635;
        --lane-8: #c084fc; --lane-9: #2dd4bf; --lane-10: #fb923c; --lane-11: #818cf8;
      }
    }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; }
    button, input, select { font: inherit; color: inherit; }
    button:focus-visible, input:focus-visible, select:focus-visible, [role="button"]:focus-visible { outline: 3px solid var(--focus); outline-offset: 3px; }
    .skip-link { position: absolute; left: 1rem; top: -5rem; z-index: 20; padding: .65rem .9rem; background: var(--accent); color: var(--accent-text); border-radius: .5rem; }
    .skip-link:focus { top: 1rem; }
    .site-header, main, footer { width: min(1440px, calc(100% - 2rem)); margin-inline: auto; }
    .site-header { padding: 2.25rem 0 1.2rem; }
    .brand-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; }
    .brand-lockup { display: flex; align-items: center; gap: 1rem; min-width: 0; }
    .brand-mark { width: 48px; height: 48px; flex: 0 0 auto; }
    .brand-mark path { fill: none; stroke: var(--text); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .brand-mark circle { fill: var(--surface); stroke: var(--text); stroke-width: 4; }
    .eyebrow { margin: 0 0 .2rem; color: var(--muted); font-size: .75rem; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(1.9rem, 4vw, 3.3rem); line-height: 1.05; letter-spacing: -.045em; }
    .subtitle { margin: .55rem 0 0; color: var(--muted); }
    .icon-button, .view-switch button, .copy-button { border: 1px solid var(--border); background: var(--surface); border-radius: .7rem; padding: .65rem .85rem; cursor: pointer; }
    .icon-button:hover, .view-switch button:hover, .copy-button:hover:not(:disabled) { background: var(--surface-raised); border-color: var(--muted); }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; margin: 1.7rem 0 0; }
    .stats div { padding: .9rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: .85rem; }
    .stats dt { color: var(--muted); font-size: .76rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
    .stats dd { margin: .2rem 0 0; font-size: 1.45rem; font-weight: 750; letter-spacing: -.03em; }
    .toolbar { position: sticky; top: 0; z-index: 10; display: flex; flex-wrap: wrap; align-items: end; gap: .8rem; padding: .85rem; background: color-mix(in srgb, var(--bg) 88%, transparent); backdrop-filter: blur(12px); border: 1px solid var(--border); border-radius: .9rem; }
    .search-field, .branch-field { display: grid; gap: .3rem; color: var(--muted); font-size: .76rem; font-weight: 700; }
    .search-field { flex: 1 1 320px; }
    .branch-field { flex: 0 1 230px; }
    input, select { width: 100%; min-height: 42px; border: 1px solid var(--border); background: var(--surface); border-radius: .65rem; padding: .55rem .7rem; }
    .view-switch { display: flex; gap: .35rem; }
    .view-switch button[aria-pressed="true"] { background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
    .search-status { flex: 1 0 100%; margin: 0; color: var(--muted); font-size: .84rem; }
    .explorer { display: grid; grid-template-columns: minmax(0, 1fr) 310px; gap: 1rem; align-items: start; margin-top: 1rem; }
    .map-panel, .list-panel { min-width: 0; margin: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; box-shadow: var(--shadow); overflow: hidden; }
    .map-panel figcaption { padding: .8rem 1rem; border-bottom: 1px solid var(--border); color: var(--muted); font-size: .84rem; }
    .map-scroll { overflow-x: auto; padding: .4rem; }
    .metro-map { display: block; max-width: none; background: var(--surface); }
    .date-marker line { stroke: var(--faint); stroke-width: 1; }
    .date-marker text { fill: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .metro-edge, .continuation { fill: none; stroke-width: 6; stroke-linecap: round; opacity: .84; transition: opacity 120ms ease; }
    .continuation { stroke-dasharray: 4 9; }
    .station { cursor: pointer; transition: opacity 120ms ease; }
    .station-hit { fill: transparent; pointer-events: all; }
    .station-core { stroke: var(--surface); stroke-width: 3; }
    .merge-outer { fill: var(--surface); stroke-width: 5; }
    .merge-inner { stroke: none; }
    .head-ring { fill: none; stroke: var(--text); stroke-width: 2; stroke-dasharray: 3 2; }
    .station.is-selected .station-core, .station.is-selected .merge-outer { stroke: var(--text); stroke-width: 4; }
    .station.is-selected .station-hit { fill: color-mix(in srgb, var(--focus) 18%, transparent); }
    .commit-label { transition: opacity 120ms ease; }
    .commit-label text { fill: var(--text); font-size: 12px; }
    .hash-label { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 700; }
    .subject-label { font-weight: 650; }
    .meta-label { fill: var(--muted) !important; }
    .ref-label { fill: var(--focus) !important; font-weight: 700; }
    .label-guide { stroke: var(--faint); stroke-width: 1; }
    .commit-label.is-selected .subject-label { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
    .is-outside-focus, .is-search-dimmed { opacity: .13 !important; }
    .is-match .station-hit { fill: color-mix(in srgb, var(--focus) 22%, transparent); }
    .is-match .station-core, .is-match .merge-outer { stroke: var(--focus); stroke-width: 4; }
    .details-panel { position: sticky; top: 8.6rem; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 1rem; box-shadow: var(--shadow); overflow-wrap: anywhere; }
    .details-panel h2 { margin: .2rem 0 .55rem; font-size: 1.18rem; line-height: 1.35; }
    .detail-author { margin: 0 0 1rem; color: var(--muted); }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: .7rem; }
    .detail-grid .hash-field { grid-column: 1 / -1; }
    .hash-field code { word-break: break-all; }
    .detail-grid div, .detail-section { display: grid; gap: .25rem; }
    .detail-grid span, .detail-section > span { color: var(--muted); font-size: .72rem; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; }
    code { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .85em; }
    .detail-section { margin-top: 1rem; }
    .ref-list, .parent-list { display: flex; flex-wrap: wrap; gap: .4rem; }
    .ref-chip, .parent-button { border: 1px solid var(--border); background: var(--bg); border-radius: 999px; padding: .25rem .55rem; font-size: .78rem; }
    .parent-button { cursor: pointer; font-family: ui-monospace, SFMono-Regular, Consolas, monospace; }
    .empty-value { color: var(--muted); font-size: .85rem; }
    .copy-button { width: 100%; margin-top: 1rem; background: var(--accent); color: var(--accent-text); border-color: var(--accent); }
    .copy-button:disabled { opacity: .45; cursor: not-allowed; }
    .copy-status { min-height: 1.4em; margin: .35rem 0 0; color: var(--muted); font-size: .8rem; text-align: center; }
    .list-panel { padding: .5rem; }
    .commit-list { list-style: none; padding: 0; margin: 0; }
    .commit-list-item button { display: grid; gap: .25rem; width: 100%; padding: .8rem; border: 0; border-bottom: 1px solid var(--faint); background: transparent; color: inherit; text-align: left; cursor: pointer; }
    .commit-list-item:last-child button { border-bottom: 0; }
    .commit-list-item button:hover, .commit-list-item.is-selected button { background: var(--bg); }
    .list-line { display: flex; gap: .7rem; align-items: baseline; }
    .list-line strong { font-size: .95rem; }
    .list-meta { color: var(--muted); font-size: .82rem; }
    footer { padding: 1.5rem 0 2.5rem; color: var(--muted); font-size: .84rem; }
    footer p { margin: .25rem 0; }
    .truncation-note { color: var(--text); }
    ${Array.from({ length: lanePaletteSize }, (_, lane) => `.lane-${lane}.metro-edge, .lane-${lane}.continuation { stroke: var(--lane-${lane}); } .lane-${lane} .station-core, .lane-${lane} .merge-inner { fill: var(--lane-${lane}); } .lane-${lane} .merge-outer { stroke: var(--lane-${lane}); }`).join("\n")}
    @media (max-width: 900px) { .explorer { grid-template-columns: 1fr; } .details-panel { position: static; } }
    @media (max-width: 640px) {
      html, body { max-width: 100%; overflow-x: hidden; }
      .site-header, main, footer { width: calc(100% - 1rem); max-width: 1440px; }
      .site-header { padding-top: 1rem; }
      .brand-row { display: block; }
      .brand-lockup { width: 100%; align-items: flex-start; }
      .brand-lockup > div { width: calc(100% - 54px); min-width: 0; }
      .brand-lockup h1 { font-size: 1.65rem; overflow-wrap: anywhere; }
      .brand-mark { width: 38px; height: 38px; }
      .icon-button { width: 100%; margin: .75rem 0 0; padding: .5rem; font-size: .78rem; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .toolbar { top: 0; }
      .toolbar > * { min-width: 0; }
      .search-field, .branch-field { flex: 1 0 100%; width: 100%; }
      .view-switch { flex: 1 0 100%; }
      .view-switch button { min-width: 0; flex: 1; }
      .detail-grid { grid-template-columns: 1fr; }
    }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { transition-duration: .01ms !important; } }
    @media print {
      :root, :root[data-theme] { color-scheme: light; --bg: #fff; --surface: #fff; --text: #111827; --muted: #4b5563; --faint: #d1d5db; --border: #9ca3af; --shadow: none; }
      .toolbar, .icon-button, .copy-button, .skip-link { display: none !important; }
      .site-header, main, footer { width: 100%; }
      .explorer { display: block; }
      .details-panel { display: none; }
      .map-panel { border: 0; box-shadow: none; }
      .map-scroll { overflow: visible; }
    }
  `;
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
        matchIndex = matches.length > 0 ? 0 : -1;
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
        if (shouldFocus) station?.focus({ preventScroll: true });
        document.getElementById("detail-subject").textContent = commit.subject;
        document.getElementById("detail-author").textContent = commit.author;
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
              stationFor(parent)?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
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
      function moveSelection(delta) {
        const current = Math.max(0, commitOrder.indexOf(selectedHash));
        const next = Math.max(0, Math.min(commitOrder.length - 1, current + delta));
        selectCommit(commitOrder[next], true);
        stationFor(commitOrder[next])?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
      function jumpMatch(direction) {
        if (matches.length === 0) return;
        matchIndex = (matchIndex + direction + matches.length) % matches.length;
        const hash = matches[matchIndex];
        selectCommit(hash, true);
        stationFor(hash)?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
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

      document.querySelectorAll(".station").forEach((station) => {
        station.addEventListener("click", () => selectCommit(station.dataset.hash));
        station.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectCommit(station.dataset.hash); }
          if (event.key === "ArrowDown" || event.key.toLocaleLowerCase() === "j") { event.preventDefault(); moveSelection(1); }
          if (event.key === "ArrowUp" || event.key.toLocaleLowerCase() === "k") { event.preventDefault(); moveSelection(-1); }
        });
      });
      document.querySelectorAll(".commit-list-item button").forEach((button) => button.addEventListener("click", () => selectCommit(button.dataset.hash)));
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
        if (event.key === "/" && document.activeElement !== search) { event.preventDefault(); search.focus(); }
      });
      let storedTheme = null;
      try { storedTheme = localStorage.getItem("repo-metro-theme"); } catch {}
      setTheme(["auto", "light", "dark"].includes(storedTheme) ? storedTheme : document.documentElement.dataset.theme || "auto");
      applyFilters();
      const hashFromUrl = location.hash.startsWith("#commit-") ? location.hash.slice(8) : "";
      selectCommit(commits.has(hashFromUrl) ? hashFromUrl : selectedHash);
    })();
  `;
}
