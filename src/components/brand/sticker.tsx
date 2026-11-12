const STICKERS = [
  "badge-thumbs",
  "studio-card",
  "crafting-curating",
  "wordmark-sticker",
  "checkerboard",
  "meet-tape",
  "sticky-manifesto",
  "dog",
  "carrier",
  "laptop",
  "binoculars",
  "spark",
  "burst-script",
  "barcode",
] as const;

export type StickerName = (typeof STICKERS)[number];

export function Sticker({ name, className }: { name: StickerName; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/brand/stickers/${name}.svg`}
      alt=""
      aria-hidden="true"
      draggable={false}
      className={className ? `sticker ${className}` : "sticker"}
    />
  );
}
