export function paintingStyles(): string {
  const art = ':root:is([data-skin="starry"], [data-skin="sunflowers"], [data-skin="pearl"])';
  return `
  .art-heading { display: none; }
  .art-gallery { margin: 22px 0; }
  .gallery-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; color: var(--muted); font: 10px/1.5 ui-monospace, Consolas, monospace; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 10px; }
  .gallery-heading > span:last-child { text-transform: none; letter-spacing: 0; }
  .gallery-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
  .gallery-choice { display: flex; align-items: center; gap: 14px; padding: 7px; border: 1px solid var(--border); border-radius: 4px; background: var(--surface); text-align: left; min-width: 0; }
  .gallery-choice:hover { border-color: var(--accent); }
  .gallery-choice[aria-pressed="true"] { border-color: var(--accent); box-shadow: inset 0 -2px var(--accent); }
  .gallery-preview { flex: 0 0 76px; height: 48px; background-position: 78% 45%; background-size: cover; border-radius: 2px; }
  .gallery-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .gallery-copy strong { font: 17px/1.2 Georgia, "Times New Roman", serif; font-weight: 400; }
  .gallery-copy small { color: var(--muted); font-size: 10px; }
  .gallery-number { margin: 0 8px 0 auto; color: var(--muted); font: 11px ui-monospace, Consolas, monospace; }
  .appearance-popover { width: 430px; max-height: min(680px, calc(100dvh - 100px)); overflow-y: auto; }
  .appearance .preview-art { height: 78px; background-size: cover; background-position: 80% 40%; }
  .art-skin-options .skin-option strong { font-family: Georgia, "Times New Roman", serif; font-size: 13px; min-height: 32px; font-weight: 400; }
  .art-skin-options .skin-option small { font-size: 9px; white-space: normal; }
  .essentials-label { margin: 18px 0 8px; color: var(--muted); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
  :root[data-skin="starry"] { --art-image: var(--art-starry); --hero-surface: #091b32; --hero-ink: #fff2ca; --hero-muted: #c6d1e0; --hero-gold: #ecc570; --radius: 12px; }
  :root[data-skin="sunflowers"] { --art-image: var(--art-sunflowers); --hero-surface: #f0dbab; --hero-ink: #463014; --hero-muted: #684b26; --hero-gold: #8b631f; --radius: 3px; }
  :root[data-skin="pearl"] { --art-image: var(--art-pearl); --hero-surface: #0c1918; --hero-ink: #f6edd6; --hero-muted: #c6ccb9; --hero-gold: #d0bd8b; --radius: 2px; }
  ART body { background-image: radial-gradient(ellipse at 5% 0%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 65%); }
  ART .topbar { min-height: 68px; }
  ART .brand-row { position: relative; isolation: isolate; overflow: hidden; min-height: 340px; padding: 36px 44px; margin-bottom: 22px; border: 1px solid color-mix(in srgb, var(--hero-gold) 45%, var(--hero-surface)); border-radius: var(--radius); background: var(--hero-surface); color: var(--hero-ink); box-shadow: 0 18px 40px #00000012; }
  ART .brand-row::before { content: ""; position: absolute; z-index: -1; inset: 0 0 0 31%; background: var(--art-image) right 46% / cover no-repeat; mask-image: linear-gradient(to right, transparent, black 38%); }
  ART .brand-row::after { content: ""; position: absolute; z-index: -1; inset: 10px; border: 1px solid color-mix(in srgb, var(--hero-gold) 24%, transparent); border-radius: max(0px, calc(var(--radius) - 6px)); pointer-events: none; }
  ART .brand-lockup { width: 60%; min-width: 0; }
  ART .brand-lockup > div { position: relative; }
  ART .brand-lockup > div > .eyebrow, ART .journey-mark { display: none; }
  ART .art-heading { display: block; }
  ART .art-kicker { display: flex; align-items: center; gap: 24px; font: 10px/1.6 ui-monospace, Consolas, monospace; letter-spacing: .14em; text-transform: uppercase; color: var(--hero-gold); margin: 0 0 16px; }
  ART #art-title { margin: 0; max-width: 600px; font: italic 58px/.99 Georgia, "Times New Roman", serif; font-weight: 400; letter-spacing: -.04em; text-wrap: balance; }
  ART .art-description { margin: 18px 0 8px; color: var(--hero-ink); font-size: 13px; }
  ART .art-credit { margin: 0; color: var(--hero-muted); font-size: 10px; letter-spacing: .04em; }
  ART h1 { font-size: 15px; font-weight: 500; font-family: "Segoe UI", system-ui, sans-serif; margin: 25px 0 8px; letter-spacing: -.01em; line-height: 1.4; }
  ART .subtitle { font-size: 10px; color: var(--hero-muted); gap: 10px; }
  ART .head-badge { background: var(--hero-surface); border-color: color-mix(in srgb, var(--hero-gold) 55%, var(--hero-surface)); color: var(--hero-ink); font-size: 10px; }
  ART .head-badge::before { color: var(--hero-gold); }
  ART .stats { border-radius: 0; border-left: 0; border-right: 0; background: transparent; padding: 14px 0; margin-bottom: 22px; }
  ART .stats > div { flex-direction: row-reverse; justify-content: flex-end; align-items: baseline; gap: 12px; }
  ART .stats dd { font-family: Georgia, "Times New Roman", serif; font-size: 29px; font-weight: 400; }
  ART .stats dt { font-size: 11px; }
  ART .toolbar { padding: 16px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface); }
  ART .toolbar input, ART .toolbar select { background: var(--bg); }
  ART .map-heading { margin-top: 26px; }
  ART .map-heading h2 { font: 20px Georgia, "Times New Roman", serif; letter-spacing: -.02em; }
  ART .map-direction { letter-spacing: .04em; }
  ART .map-panel, ART .list-panel { box-shadow: 0 10px 28px #0000000b; }
  ART .map-panel figcaption { padding: 16px 20px; font-size: 11px; }
  ART .map-scroll { max-height: 630px; padding-top: 18px; }
  ART .subject-label { font-size: 13px; }
  ART .hash-label { font-size: 10px !important; }
  ART .row-highlight { rx: 3px; }
  ART .commit-label.is-selected .row-highlight { fill: color-mix(in srgb, var(--accent) 9%, transparent); stroke: color-mix(in srgb, var(--accent) 22%, transparent); }
  ART .details-panel { padding: 24px; border: 1px solid var(--border); box-shadow: 0 10px 28px #0000000b; }
  ART .details-panel::before { content: ""; display: block; height: 100px; margin: -24px -24px 22px; border-radius: var(--radius) var(--radius) 0 0; background: linear-gradient(to top, var(--surface), transparent 65%), var(--art-image) 80% 50% / cover; }
  ART .details-panel h2 { font: 24px/1.25 Georgia, "Times New Roman", serif; font-weight: 400; letter-spacing: -.025em; }
  ART .ticket-heading { padding-bottom: 18px; }
  ART .ticket-footer { border-top-style: solid; }
  ART .ref-chip, ART .parent-button, ART .copy-button { border-radius: max(2px, calc(var(--radius) / 2)); }
  ART .copy-button { letter-spacing: .035em; }
  ART .details-panel .author-avatar { border: 1px solid var(--border); color: var(--text); }
  ART .list-line strong { font-size: 14px; font-weight: 500; }
  :root[data-skin="starry"] .map-scroll { background-image: radial-gradient(circle at 7px 9px, color-mix(in srgb, var(--accent) 22%, transparent) .8px, transparent 1px), radial-gradient(circle at 27px 30px, color-mix(in srgb, var(--lane-1) 20%, transparent) .8px, transparent 1px); background-size: 44px 44px, 66px 66px; }
  :root[data-skin="starry"] .metro-edge { filter: drop-shadow(0 0 3px color-mix(in srgb, var(--lane-0) 24%, transparent)); }
  :root[data-skin="starry"] .station-core, :root[data-skin="starry"] .merge-outer { filter: drop-shadow(0 0 4px color-mix(in srgb, var(--lane-0) 45%, transparent)); }
  :root[data-skin="starry"] .head-ring { stroke: var(--accent); stroke-dasharray: 2 4; }
  :root[data-skin="starry"] .ticket-track { letter-spacing: 4px; }
  :root[data-skin="sunflowers"] .brand-row { border: 5px solid var(--hero-gold); box-shadow: inset 0 0 0 1px #fff3, 0 9px 25px #4f361420; }
  :root[data-skin="sunflowers"] #art-title { font-size: 68px; font-style: normal; }
  :root[data-skin="sunflowers"] .map-panel, :root[data-skin="sunflowers"] .details-panel { border: 1px solid var(--border); outline: 1px solid var(--border); outline-offset: 4px; }
  :root[data-skin="sunflowers"] .map-scroll { background-image: repeating-linear-gradient(0deg, transparent, transparent 3px, color-mix(in srgb, var(--accent) 4%, transparent) 4px), repeating-linear-gradient(90deg, transparent, transparent 4px, color-mix(in srgb, var(--accent) 3%, transparent) 5px); background-size: auto; }
  :root[data-skin="sunflowers"] .metro-edge { stroke-width: 7px; opacity: .85; }
  :root[data-skin="sunflowers"] .head-ring { stroke: var(--lane-0); stroke-width: 4px; stroke-dasharray: 2 5; }
  :root[data-skin="sunflowers"] .author-avatar { border-radius: 4px; }
  :root[data-skin="pearl"] #art-title { font-size: 49px; max-width: 440px; line-height: 1.04; }
  :root[data-skin="pearl"] .brand-row { border-width: 1px; }
  :root[data-skin="pearl"] .map-panel, :root[data-skin="pearl"] .details-panel { border-style: double; border-width: 3px; }
  :root[data-skin="pearl"] .map-scroll { background-image: radial-gradient(ellipse at 5% 5%, color-mix(in srgb, var(--lane-1) 8%, transparent), transparent 65%); background-size: auto; }
  :root[data-skin="pearl"] .metro-edge { stroke-width: 3px; }
  :root[data-skin="pearl"] .station-core { fill: var(--accent); stroke: var(--surface); stroke-width: 2px; filter: drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 60%, transparent)); }
  :root[data-skin="pearl"] .head-ring { stroke: var(--accent); stroke-dasharray: none; stroke-width: 1px; }
  :root[data-skin="pearl"] .ticket-heading .eyebrow { letter-spacing: .17em; }
  @media (max-width: 1050px) {
    .gallery-preview { flex-basis: 54px; height: 48px; }
    .gallery-choice { gap: 10px; }
    .gallery-copy strong { font-size: 14px; }
    .gallery-number { display: none; }
    ART .brand-row { padding: 32px; }
    ART #art-title { font-size: 48px; }
    :root[data-skin="sunflowers"] #art-title { font-size: 58px; }
    :root[data-skin="pearl"] #art-title { font-size: 43px; }
    ART .brand-lockup { width: 65%; }
    ART .details-panel { padding: 20px; }
    ART .details-panel::before { margin: -20px -20px 20px; }
    ART .stats > div { padding-inline: 16px; gap: 8px; }
  }
  @media (max-width: 760px) {
    .art-gallery { margin: 18px 0; }
    .gallery-heading { font-size: 9px; }
    .gallery-heading > span:last-child { display: none; }
    .gallery-options { gap: 8px; }
    .gallery-choice { position: relative; flex-direction: column; align-items: stretch; gap: 7px; padding: 5px 5px 9px; }
    .gallery-preview { flex: none; height: 62px; width: 100%; }
    .gallery-copy { gap: 0; padding: 0 3px; }
    .gallery-copy strong { font-size: 12px; line-height: 1.25; min-height: 30px; }
    .gallery-copy small { display: none; }
    ART .brand-row { display: block; min-height: 490px; padding: 230px 24px 26px; margin-bottom: 20px; }
    ART .brand-row::before { inset: 0 0 auto; height: 300px; background-position: right 43%; mask-image: linear-gradient(to bottom, black 60%, transparent); }
    ART .brand-row::after { inset: 8px; }
    ART .brand-lockup, ART .brand-lockup > div { width: 100%; }
    ART .art-kicker { font-size: 8px; gap: 16px; margin-bottom: 12px; }
    ART #art-title { font-size: 43px; }
    :root[data-skin="sunflowers"] #art-title { font-size: 45px; }
    :root[data-skin="pearl"] #art-title { font-size: 37px; max-width: 300px; }
    ART .art-description { font-size: 12px; margin: 14px 0 8px; }
    ART .art-credit { font-size: 9px; }
    ART h1 { font-size: 14px; margin-top: 22px; }
    ART .stats { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 0; }
    ART .stats > div { padding-inline: 12px; }
    ART .stats > div:nth-child(2) { border: 0; }
    ART .stats dd { font-size: 26px; }
    ART .stats dt { font-size: 10px; }
    ART .toolbar { padding: 12px; }
    ART .map-heading h2 { font-size: 19px; }
    ART .map-heading .map-direction { font-size: 9px; }
    ART .map-scroll { max-height: 440px; }
    ART .map-panel figcaption { font-size: 10px; padding: 14px; }
    ART .details-panel { padding: 20px; margin-top: 8px; }
    ART .details-panel::before { height: 110px; margin: -20px -20px 20px; }
    .appearance-popover { width: min(430px, calc(100vw - 32px)); max-height: calc(100dvh - 85px); }
    .art-skin-options .skin-option strong { font-size: 12px; min-height: 44px; }
    .appearance .preview-art { height: 66px; }
  }
  @media print {
    .art-gallery, .art-heading, .map-pan-hint { display: none !important; }
    ART .brand-row { min-height: 0; padding: 15px 0; border: 0; box-shadow: none; background: transparent; color: #222; }
    ART .brand-row::before, ART .brand-row::after { display: none; }
    ART .brand-lockup { width: 100%; }
    ART h1 { font-size: 28px; }
    ART .subtitle { color: #444; }
    ART .map-panel { outline: none; box-shadow: none; }
    ART .map-scroll { max-height: none; overflow: visible; background: none; }
  }
`.replaceAll("ART", art);
}

