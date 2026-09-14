/** Appearance tokens stay separate from Git data and the layout algorithm. */
type Colors = readonly [string, string, string, string, string, string, string, string, string];
const skins: Record<string, { light: Colors; dark: Colors }> = {
  studio: {
    light: ["#f6f7f9", "#ffffff", "#f0f2f5", "#202631", "#637083", "#e9ecf1", "#dce1e8", "#4863d8", "#ffffff"],
    dark: ["#101114", "#181a1f", "#22252d", "#eceef3", "#a0a8b9", "#292d37", "#343945", "#a4b2ff", "#151929"],
  },
  paper: {
    light: ["#f1ede4", "#fffcf5", "#f4eedf", "#373d35", "#64685b", "#eae4d6", "#d9d3c3", "#376654", "#ffffff"],
    dark: ["#1c211e", "#242b25", "#2d362e", "#eeeade", "#b1b5a3", "#333d33", "#465044", "#b1cc96", "#202a22"],
  },
  dusk: {
    light: ["#eff1f5", "#ffffff", "#e6e9f0", "#4c4f69", "#656982", "#e0e3ed", "#cdd1df", "#8047c8", "#ffffff"],
    dark: ["#181825", "#1e1e2e", "#29293e", "#cdd6f4", "#a6adc8", "#303046", "#45475a", "#cba6f7", "#1e1e2e"],
  },
};

const lightLanes = ["#4863d8", "#c15370", "#268074", "#ac7424", "#8558b8", "#287b99", "#b34c87", "#698136", "#6a58b1", "#33836b", "#b66b32", "#586daa"];
const darkLanes = ["#a4b2ff", "#f099ac", "#73cbb7", "#e9bf77", "#c7a3ed", "#7fc4e0", "#e8a1ca", "#b5ce80", "#b1a4ed", "#80d0b1", "#e6b185", "#a2bcea"];

function tokens(colors: Colors, dark: boolean, skin: string): string {
  const lanes = [...(dark ? darkLanes : lightLanes)];
  if (skin === "paper") lanes.splice(0, 3, ...(dark ? ["#b1cc96", "#e6b185", "#87b9bb"] : ["#376654", "#a97138", "#397f83"]));
  if (skin === "dusk") lanes.splice(0, 3, ...(dark ? ["#cba6f7", "#f5c2e7", "#94e2d5"] : ["#8839bf", "#ad428e", "#25887f"]));
  const names = ["bg", "surface", "surface-raised", "text", "muted", "faint", "border", "accent", "accent-text"];
  return names.map((name, i) => "--" + name + ":" + colors[i] + ";").join("")
    + "color-scheme:" + (dark ? "dark" : "light") + ";"
    + lanes.map((color, i) => "--lane-" + i + ":" + color + ";").join("");
}

export function appearanceControls(): string {
  return '<details class="appearance" id="appearance"><summary>Appearance <span aria-hidden="true">◐</span></summary>'
    + '<div class="appearance-popover"><p class="eyebrow">Make it yours</p><p class="appearance-description">A different mood. The same journey.</p>'
    + '<div class="skin-options" role="group" aria-label="Visual skin">'
    + [["studio", "Studio", "Clean & focused"], ["paper", "Paper", "Warm & tactile"], ["dusk", "Dusk", "Soft & colorful"]].map(([id, name, description]) =>
      '<button type="button" class="skin-option" data-skin-choice="' + id + '" aria-pressed="' + (id === "studio") + '">'
      + '<span class="skin-preview preview-' + id + '" aria-hidden="true"><i></i><i></i><i></i></span>'
      + '<strong>' + name + '</strong><small>' + description + '</small></button>').join("")
    + '</div><div class="appearance-mode"><span>Color mode</span><button class="icon-button" id="theme-toggle" type="button" aria-label="Change color theme">Theme: system</button></div>'
    + '<p class="appearance-note">Your preference is saved in this browser.</p></div></details>';
}

export function appearanceStyles(): string {
  return Object.entries(skins).map(([name, palette]) =>
    ':root[data-skin="' + name + '"]{' + tokens(palette.light, false, name) + '}'
    + ':root[data-skin="' + name + '"][data-theme="dark"]{' + tokens(palette.dark, true, name) + '}'
    + '@media(prefers-color-scheme:dark){:root[data-skin="' + name + '"][data-theme="auto"]{' + tokens(palette.dark, true, name) + '}}'
  ).join("\n") + `
    :root { --focus: var(--accent); --radius: 14px; }
    * { box-sizing: border-box; }
    [hidden] { display: none !important; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 14px/1.5 "Inter", "Segoe UI", system-ui, sans-serif; }
    button, input, select { font: inherit; color: inherit; }
    button, summary, select { cursor: pointer; }
    button, input, select, summary { -webkit-tap-highlight-color: transparent; }
    button:focus-visible, input:focus-visible, select:focus-visible, summary:focus-visible, [role="button"]:focus-visible { outline: 2px solid var(--focus); outline-offset: 4px; }
    button { transition: background 150ms, border-color 150ms, box-shadow 150ms; }
    button:disabled { cursor: not-allowed; opacity: .45; }
    .skip-link { position: absolute; top: -100px; left: 20px; z-index: 40; padding: 10px; background: var(--accent); color: var(--accent-text); }
    .skip-link:focus { top: 10px; }
    .site-header, main, footer { width: min(1440px, calc(100% - 80px)); margin-inline: auto; }
    .topbar { min-height: 78px; display: flex; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--border); }
    .product-name, .topbar-actions { display: flex; align-items: center; gap: 12px; }
    .product-name { font-weight: 650; letter-spacing: -.02em; }
    .brand-mark { width: 28px; height: 28px; }
    .brand-mark path { fill: none; stroke: var(--accent); stroke-width: 5; stroke-linecap: round; stroke-linejoin: round; }
    .brand-mark circle { fill: var(--bg); stroke: var(--accent); stroke-width: 4; }
    .product-divider { margin-inline: 6px; color: var(--border); font-weight: 400; font-size: 20px; }
    .workspace-name { color: var(--muted); font-size: 12px; font-weight: 450; }
    .offline-badge { display: flex; gap: 7px; align-items: center; color: var(--muted); font-size: 11px; white-space: nowrap; }
    .offline-badge i { width: 6px; height: 6px; border-radius: 50%; background: var(--lane-2); box-shadow: 0 0 0 3px color-mix(in srgb, var(--lane-2) 12%, transparent); }
    .appearance { position: relative; z-index: 30; }
    .appearance summary, .icon-button { list-style: none; border: 1px solid var(--border); border-radius: 7px; padding: 7px 10px; font-size: 12px; background: var(--surface); }
    .appearance summary::-webkit-details-marker { display: none; }
    .appearance summary span { padding-left: 8px; color: var(--accent); }
    .appearance summary:hover, .icon-button:hover { border-color: var(--muted); }
    .appearance[open] summary { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent); }
    .appearance-popover { position: absolute; top: calc(100% + 12px); right: 0; width: 348px; padding: 20px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); box-shadow: 0 18px 60px #0002; }
    .appearance-description { color: var(--muted); font-size: 12px; margin: 6px 0 18px; }
    .skin-options { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
    .skin-option { padding: 5px; min-width: 0; border: 1px solid var(--border); border-radius: 9px; background: var(--surface); text-align: left; }
    .skin-option[aria-pressed="true"] { border-color: var(--accent); box-shadow: 0 0 0 1px var(--accent); }
    .skin-option strong, .skin-option small { display: block; margin: 5px 2px; }
    .skin-option strong { font-size: 12px; }
    .skin-option small { font-size: 9px; color: var(--muted); white-space: nowrap; }
    .skin-preview { display: flex; gap: 8px; padding: 10px 12px; height: 58px; border-radius: 5px; background: #edf0f7; overflow: hidden; }
    .skin-preview i { width: 5px; height: 42px; background: #4863d8; border-radius: 9px; transform: rotate(30deg); }
    .skin-preview i:nth-child(2) { background: #c15370; margin-top: -18px; }
    .skin-preview i:nth-child(3) { background: #268074; }
    .preview-paper { background: #f1ede4; }
    .preview-paper i { background: #376654; }
    .preview-paper i:nth-child(2) { background: #bb8345; }
    .preview-dusk { background: #1e1e2e; }
    .preview-dusk i { background: #cba6f7; }
    .preview-dusk i:nth-child(2) { background: #f5c2e7; }
    .appearance-mode { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid var(--faint); font-size: 12px; }
    .appearance-note { margin: 12px 0 0; font-size: 10px; color: var(--muted); }
    .brand-row { display: flex; align-items: center; justify-content: space-between; gap: 24px; padding: 38px 0 30px; }
    .brand-lockup { min-width: 0; }
    .eyebrow { margin: 0; font-size: 10px; font-weight: 650; letter-spacing: .13em; text-transform: uppercase; color: var(--muted); }
    h1 { margin: 10px 0 12px; font-size: clamp(26px, 3vw, 40px); font-weight: 620; line-height: 1.15; letter-spacing: -.045em; overflow-wrap: anywhere; }
    .subtitle { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; color: var(--muted); font-size: 12px; margin: 0; }
    .head-badge { padding: 2px 9px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; font: 11px/1.7 ui-monospace, Consolas, monospace; color: var(--text); }
    .head-badge::before { content: "⑂"; color: var(--accent); margin-right: 6px; }
    .journey-mark { flex: 0 0 190px; color: var(--muted); }
    .journey-mark > span { display: block; text-align: right; font: 9px ui-monospace, Consolas, monospace; letter-spacing: .15em; margin-bottom: 8px; }
    .journey-mark svg { width: 180px; float: right; overflow: visible; }
    .journey-mark path { stroke: var(--lane-0); stroke-width: 3; stroke-linecap: round; fill: none; }
    .journey-mark path:nth-child(2) { stroke: var(--lane-2); }
    .journey-mark circle { fill: var(--bg); stroke: var(--muted); stroke-width: 2; }
    .stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); margin: 0 0 28px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); padding: 20px 0; }
    .stats > div { display: flex; flex-direction: column-reverse; gap: 3px; padding: 0 24px; border-right: 1px solid var(--faint); }
    .stats > div:last-child { border: 0; }
    .stats dt { font-size: 12px; color: var(--muted); }
    .stats dd { margin: 0; font: 500 27px/1.25 ui-monospace, Consolas, monospace; letter-spacing: -.07em; font-variant-numeric: tabular-nums; }
    .toolbar { display: flex; align-items: end; gap: 12px; }
    .search-field, .branch-field { display: grid; gap: 7px; color: var(--muted); font-size: 11px; font-weight: 600; }
    .search-field { position: relative; flex: 1; min-width: 0; }
    .branch-field { flex: 0 1 210px; min-width: 0; }
    input, select { width: 100%; min-width: 0; height: 40px; padding: 9px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); font-size: 12px; font-weight: 400; }
    input::placeholder { color: var(--muted); }
    .search-field input { padding-right: 54px; }
    .search-field > kbd { position: absolute; right: 12px; bottom: 10px; }
    kbd { display: inline-block; min-width: 18px; padding: 0 4px; border: 1px solid var(--border); border-bottom-width: 2px; border-radius: 4px; background: var(--surface); font: 10px/17px ui-monospace, Consolas, monospace; text-align: center; color: var(--muted); }
    .view-switch { display: flex; gap: 3px; height: 40px; padding: 3px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: 8px; }
    .view-switch button { padding: 0 18px; font-size: 12px; border: 1px solid transparent; border-radius: 5px; color: var(--muted); background: transparent; }
    .view-switch button[aria-pressed="true"] { color: var(--text); background: var(--surface); border-color: var(--border); box-shadow: 0 1px 3px #0001; }
    .map-heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 30px 0 12px; }
    .map-heading > div { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .map-heading h2 { margin: 0; font-size: 12px; font-weight: 650; }
    .section-marker { width: 7px; height: 7px; background: var(--accent); border-radius: 2px; }
    .search-status { font-size: 11px; color: var(--muted); }
    .map-direction { color: var(--muted); font-size: 10px; white-space: nowrap; }
    .map-direction > span { margin-left: 10px; }
    .explorer { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 20px; align-items: start; }
    .map-panel, .list-panel { min-width: 0; margin: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; }
    .map-panel figcaption { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding: 15px 20px; border-bottom: 1px solid var(--faint); color: var(--muted); font-size: 10px; }
    .map-legend { display: flex; align-items: center; gap: 14px; }
    .map-legend > span { display: flex; align-items: center; gap: 5px; }
    .map-legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .legend-station { background: var(--lane-0); }
    .legend-merge { border: 2px solid var(--muted); }
    .legend-head { border: 1px dashed var(--muted); }
    .map-scroll { overflow: auto; max-height: 680px; padding: 14px 6px; scrollbar-width: thin; scrollbar-color: var(--border) transparent; background-image: radial-gradient(var(--faint) .7px, transparent .7px); background-size: 16px 16px; }
    .metro-map { display: block; max-width: none; }
    .map-pan-hint { display: none; }
    .date-marker line { stroke: var(--faint); stroke-width: 1; }
    .date-marker text { fill: var(--muted); font: 10px ui-monospace, Consolas, monospace; letter-spacing: .04em; text-transform: uppercase; }
    .metro-edge, .continuation { fill: none; stroke-width: 5; stroke-linecap: round; opacity: .9; transition: opacity 120ms ease; }
    .continuation { stroke-dasharray: 4 9; }
    .station { cursor: pointer; transition: opacity 120ms ease; }
    .station-hit { fill: transparent; pointer-events: all; }
    .station-core { stroke: var(--surface); stroke-width: 3; }
    .merge-outer { fill: var(--surface); stroke-width: 4; }
    .merge-inner { stroke: none; }
    .head-ring { fill: none; stroke: var(--text); stroke-width: 1.5; stroke-dasharray: 3 3; }
    .station.is-selected .station-core, .station.is-selected .merge-outer { stroke: var(--text); stroke-width: 3; }
    .station.is-selected .station-hit { fill: color-mix(in srgb, var(--accent) 12%, transparent); }
    .commit-label { cursor: pointer; transition: opacity 120ms ease; }
    .row-highlight { fill: transparent; }
    .commit-label:hover .row-highlight { fill: color-mix(in srgb, var(--accent) 4%, transparent); }
    .commit-label.is-selected .row-highlight { fill: color-mix(in srgb, var(--accent) 7%, transparent); stroke: color-mix(in srgb, var(--accent) 14%, transparent); }
    .commit-label text { fill: var(--text); font-size: 12px; }
    .hash-label { font-family: ui-monospace, Consolas, monospace; fill: var(--muted) !important; font-size: 11px !important; }
    .subject-label { font-weight: 550; }
    .meta-label { fill: var(--muted) !important; font-size: 10px !important; }
    .ref-label { fill: var(--accent) !important; font-size: 10px !important; font-weight: 550; }
    .label-guide { stroke: var(--faint); stroke-width: 1; stroke-dasharray: 2 4; }
    .is-outside-focus, .is-search-dimmed { opacity: .16 !important; }
    .is-match .station-hit { fill: color-mix(in srgb, var(--focus) 22%, transparent); }
    .is-match .station-core, .is-match .merge-outer { stroke: var(--focus); stroke-width: 4; }
    .details-panel { --station-color: var(--lane-0); position: sticky; top: 20px; padding: 20px; border: 1px solid var(--border); border-top: 3px solid var(--station-color); border-radius: var(--radius); background: var(--surface); overflow-wrap: anywhere; }
    .ticket-heading { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding-bottom: 20px; }
    .station-number { color: var(--muted); font: 10px ui-monospace, Consolas, monospace; }
    .commit-kind { display: inline-flex; align-items: center; gap: 6px; color: var(--station-color); background: color-mix(in srgb, var(--station-color) 10%, transparent); padding: 3px 7px; border-radius: 4px; font-size: 10px; }
    .commit-kind::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
    .details-panel h2 { margin: 12px 0 16px; font-size: 19px; line-height: 1.4; font-weight: 570; letter-spacing: -.025em; }
    .author-row { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; }
    .author-avatar { display: grid; place-items: center; width: 25px; height: 25px; border-radius: 50%; background: var(--surface-raised); color: var(--accent); font-size: 10px; font-weight: 600; }
    .detail-author { margin: 0; font-size: 12px; color: var(--muted); }
    .detail-grid { display: grid; gap: 16px; border-top: 1px dashed var(--border); padding-top: 20px; }
    .detail-grid div, .detail-section { display: grid; gap: 6px; }
    .detail-grid span, .detail-section > span { color: var(--muted); font-size: 9px; font-weight: 600; letter-spacing: .1em; text-transform: uppercase; }
    .detail-grid code { font-size: 11px; line-height: 1.7; }
    .detail-grid time { font-size: 12px; }
    .hash-field code { word-break: break-all; }
    code { font-family: ui-monospace, Consolas, monospace; }
    .detail-section { margin-top: 17px; }
    .ref-list, .parent-list { display: flex; flex-wrap: wrap; gap: 5px; }
    .ref-chip, .parent-button { padding: 3px 7px; border: 1px solid var(--border); border-radius: 5px; background: var(--bg); font: 10px/1.5 ui-monospace, Consolas, monospace; }
    .parent-button:hover { border-color: var(--accent); }
    .empty-value { color: var(--muted); font-size: 12px; }
    .copy-button { width: 100%; margin-top: 22px; padding: 10px 12px; border: 1px solid var(--accent); border-radius: 7px; background: var(--accent); color: var(--accent-text); font-size: 12px; font-weight: 550; }
    .copy-button:hover:not(:disabled) { box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent); }
    .copy-status { min-height: 15px; margin: 6px 0 0; color: var(--muted); font-size: 10px; text-align: center; }
    .ticket-footer { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 12px; padding-top: 16px; border-top: 1px dashed var(--border); color: var(--muted); font-size: 9px; }
    .ticket-track { color: var(--station-color); font-size: 11px; letter-spacing: 2px; }
    .list-panel { padding: 8px; max-height: 760px; overflow: auto; }
    .commit-list { list-style: none; padding: 0; margin: 0; }
    .commit-list-item button { display: grid; gap: 5px; width: 100%; padding: 16px 12px; border: 0; border-bottom: 1px solid var(--faint); border-radius: 5px; background: transparent; text-align: left; }
    .commit-list-item:last-child button { border-bottom: 0; }
    .commit-list-item button:hover, .commit-list-item.is-selected button { background: color-mix(in srgb, var(--accent) 7%, transparent); }
    .list-line { display: flex; gap: 16px; align-items: baseline; }
    .list-line code { color: var(--muted); font-size: 11px; }
    .list-line strong { font-size: 12px; font-weight: 550; overflow-wrap: anywhere; }
    .list-meta { color: var(--muted); font-size: 10px; }
    footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 10px; padding: 24px 0 32px; color: var(--muted); font-size: 10px; }
    footer p { margin: 0; }
    .footer-brand { color: var(--text); font-weight: 650; margin-right: 12px; }
    .keyboard-help { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
    .truncation-note { flex-basis: 100%; }
    :root[data-skin="paper"] { --radius: 6px; }
    :root[data-skin="paper"] h1, :root[data-skin="paper"] .details-panel h2 { font-family: Georgia, "Times New Roman", serif; font-weight: 400; }
    :root[data-skin="paper"] .map-scroll { background-size: 20px 20px; }
    :root[data-skin="paper"] .map-panel { border-bottom: 3px double var(--border); }
    @media (min-width: 1600px) { .explorer { grid-template-columns: minmax(0, 1fr) 320px; gap: 24px; } }
    @media (max-width: 1050px) {
      .site-header, main, footer { width: calc(100% - 40px); }
      .explorer { grid-template-columns: minmax(0, 1fr) 270px; gap: 14px; }
      .map-panel figcaption > span:first-child { display: none; }
      .details-panel { padding: 16px; }
    }
    @media (max-width: 760px) {
      .site-header, main, footer { width: calc(100% - 32px); }
      .topbar { min-height: 64px; }
      .workspace-name, .product-divider, .offline-badge, .journey-mark { display: none; }
      .brand-row { padding: 30px 0 24px; }
      .stats { margin-bottom: 22px; padding: 16px 0; }
      .stats > div { padding: 0 12px; }
      .stats dd { font-size: 24px; }
      .stats dt { font-size: 10px; }
      .toolbar { flex-wrap: wrap; gap: 10px; }
      .search-field { flex: 1 0 100%; }
      .branch-field { flex: 1; }
      .view-switch { flex: 0 0 auto; }
      .view-switch button { min-height: 34px; }
      .explorer { grid-template-columns: minmax(0, 1fr); }
      .details-panel { position: static; padding: 20px; }
      .map-scroll { max-height: 440px; }
      .map-pan-hint { display: flex; justify-content: space-between; margin: 0; padding: 10px 14px; border-top: 1px solid var(--faint); color: var(--muted); font-size: 10px; }
      .hash-label { transform: translateY(-7px); font-size: 10px !important; }
      .subject-label { transform: translate(-78px, 12px); }
      .meta-label { transform: translateY(12px); }
      .ref-label { display: none; }
      .list-panel { max-height: 440px; }
      .map-heading { margin-top: 24px; }
      .map-heading > div { gap: 7px; }
      .search-status { flex-basis: 100%; margin-left: 14px; }
      .map-panel figcaption > span:first-child { display: inline; }
      .detail-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
      .hash-field { grid-column: 1 / -1; }
      .appearance-popover { width: min(348px, calc(100vw - 32px)); padding: 16px; }
      .skin-option { min-height: 112px; }
      .ticket-footer { flex-direction: row; justify-content: space-between; }
      footer { gap: 12px; }
    }
    @media (max-width: 390px) {
      .map-panel figcaption > span:first-child { display: none; }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 0; }
      .stats > div { padding: 0 16px; }
      .stats > div:nth-child(2) { border: 0; }
      .product-name { gap: 7px; font-size: 12px; }
      .map-direction { font-size: 9px; }
    }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { transition-duration: .01ms !important; } }
    @media print {
      :root[data-skin][data-theme] { color-scheme: light; --bg: white; --surface: white; --text: #202631; --muted: #555; --faint: #ddd; --border: #bbb; }
      .topbar-actions, .toolbar, .keyboard-help, .details-panel, .skip-link { display: none !important; }
      .site-header, main, footer { width: 100%; }
      .explorer { display: block; }
      .map-scroll, .list-panel { max-height: none; overflow: visible; }
      .map-panel { border: 0; }
    }
` + Array.from({ length: 12 }, (_, lane) => `
    .lane-${lane}.metro-edge, .lane-${lane}.continuation { stroke: var(--lane-${lane}); }
    .lane-${lane} .station-core, .lane-${lane} .merge-inner { fill: var(--lane-${lane}); }
    .lane-${lane} .merge-outer { stroke: var(--lane-${lane}); }
  `.trimEnd()).join("\n");
}
