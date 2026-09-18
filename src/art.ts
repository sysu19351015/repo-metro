import { readFileSync } from "node:fs";

export const artSkins = [
  { id: "starry", title: "The Starry Night", artist: "Vincent van Gogh", year: "1889", number: "01", description: "A little starlight between every line." },
  { id: "sunflowers", title: "Sunflowers", artist: "Vincent van Gogh", year: "1888", number: "02", description: "A history in bloom, one golden moment at a time." },
  { id: "pearl", title: "Girl with a Pearl Earring", artist: "Johannes Vermeer", year: "c. 1665", number: "03", description: "Quiet connections. A luminous point of view." },
] as const;

let cachedAssets: string | undefined;

export function artAssetStyles(): string {
  // Resolve from the compiled module, not the user's working directory.
  // Each image is embedded once and reused by the hero, swatches, and details.
  cachedAssets ??= ":root{" + artSkins.map(({ id }) => {
    const bytes = readFileSync(new URL("../../assets/paintings/" + id + ".webp", import.meta.url));
    return "--art-" + id + ":url(data:image/webp;base64," + bytes.toString("base64") + ");";
  }).join("") + "}";
  return cachedAssets;
}

export function artGallery(): string {
  return '<section class="art-gallery" aria-label="Painting collection">'
    + '<div class="gallery-heading"><span>The painted collection</span><span>Three paintings. Your history.</span></div>'
    + '<div class="gallery-options" role="group" aria-label="Painting theme">'
    + artSkins.map((art) => '<button type="button" class="gallery-choice" data-gallery-choice="' + art.id + '" aria-pressed="' + (art.id === "starry") + '">'
      + '<span class="gallery-preview" style="background-image:var(--art-' + art.id + ')" aria-hidden="true"></span>'
      + '<span class="gallery-copy"><strong>' + art.title + '</strong><small>' + art.artist + '</small></span>'
      + '<span class="gallery-number" aria-hidden="true">' + art.number + '</span></button>').join("")
    + '</div></section>';
}
