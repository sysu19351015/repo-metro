# Painting assets and generation prompts

Generated with the built-in OpenAI image generation tool on 2026-09-16. These are AI-generated interpretations inspired by the named paintings, not museum reproduction downloads. Museum pages below document the inspiration and dates; no museum image files are bundled.

The three selected assets are stored here as 1200 × 800 WebP files. Each is embedded once into every generated HTML document and reused for the hero, gallery, appearance previews, and detail card. Original PNG outputs are retained locally in `.artifacts/art-originals/` (ignored by Git) and at the image tool's original save location.

Optimization: `scripts/prepare-art.mjs` uses optional Sharp tooling to resize and encode WebP at quality 80; it does not change the composition. It accepts the three source PNG paths in starry/sunflowers/pearl order. This tool is only needed when replacing the artwork; rendering and the CLI require no extra dependencies.

## starry

Asset: [`starry.webp`](starry.webp)

Inspiration: [Museum collection page](https://www.moma.org/collection/works/79802)

Final prompt:

> Use case: stylized-concept. Asset type: fine-art website theme hero background. Create an original oil painting interpretation of Vincent van Gogh's The Starry Night: luminous golden stars and a sweeping cobalt and ultramarine spiral sky, energetic thick impasto brush marks, a low distant village and a slender dark cypress silhouette. Landscape canvas, 1536x1024 composition. This will be used on the right half of a web hero and as a thumbnail: concentrate the brightest whirlpool and stars in the RIGHT half and keep the LEFT third quiet dark navy with subdued brush texture for text blending. Deep indigo, cobalt, pale blue and small warm ochre lights. Tangible ridged oil pigment, beautiful museum print quality, authentic painterly strokes rather than smooth digital gradients. No typography, no signature, no logos, no frames, no UI. One painting only.

## sunflowers

Asset: [`sunflowers.webp`](sunflowers.webp)

Inspiration: [Museum collection page](https://www.nationalgallery.org.uk/paintings/learn-about-art/paintings-in-depth/the-sunflowers)

Final prompt:

> Use case: stylized-concept. Asset type: fine-art website theme hero background. Create an original oil painting interpretation of Vincent van Gogh's Sunflowers: a generous bouquet of expressive golden sunflowers in a simple ochre ceramic vase, textured saffron petals, burnt umber seed centers, muted olive stems, thick confident impasto marks on warm linen. Landscape canvas, 1536x1024 composition. Bouquet and vase occupy the RIGHT half, with the main flower heads around the right upper-middle. The LEFT third is softly painted empty pale buttercream and warm ochre canvas to blend into a web hero containing text. Luminous warm late-summer atmosphere, actual oil-painted texture, tactile canvas, restrained museum editorial aesthetic. Show varied blooming and drooping flowers. No typography, no signature, no logos, no frames, no UI. One painting only.

## pearl

Asset: [`pearl.webp`](pearl.webp)

Inspiration: [Museum collection page](https://www.mauritshuis.nl/en/our-collection/artworks/670-girl-with-a-pearl-earring)

Final prompt:

> Use case: stylized-concept. Asset type: fine-art website theme hero background. Create an original painted homage to Johannes Vermeer's Girl with a Pearl Earring: a young adult woman in three-quarter view turning toward the viewer, luminous face, blue and golden ochre turban, a single softly glowing pearl earring, muted ochre clothing. Landscape canvas, 1536x1024 composition. Position the portrait in the RIGHT half, face and pearl entirely visible around the right upper-middle; the LEFT half is near-black deep petrol-green darkness with subtle old-master oil glaze, providing negative space for a website hero. Quiet chiaroscuro, delicate natural skin, soft edges, restrained painterly brushwork, one small pearl highlight. Evoke the intimate light and dark of the painting, no photographic modern styling. No typography, no signature, no logos, no frame, no UI. One painting only.

