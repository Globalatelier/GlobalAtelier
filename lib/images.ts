const LARGE_EDGE = 2400;

function bumpSmallSize(size: string) {
  const value = Number(size);
  return value > 0 && value < 1600 ? String(LARGE_EDGE) : size;
}

/** Prefer a large rendition when the link itself encodes a thumbnail size. */
export function largerImageCandidates(source: string) {
  const trimmed = source.trim();
  const enlarged = trimmed
    .replace(
      /([?&](?:w|width|h|height|sw|sh|wid|hei|imwidth|imheight)=)(\d{2,4})\b/gi,
      (match, prefix: string, size: string) => `${prefix}${bumpSmallSize(size)}`,
    )
    .replace(/\b([wh])_(\d{2,4})\b/g, (match, axis: string, size: string) => {
      const next = bumpSmallSize(size);
      return next === size ? match : `${axis}_${next}`;
    })
    .replace(/(\d{2,4})x(\d{2,4})/g, (match, width: string, height: string) => {
      if (bumpSmallSize(width) === width || bumpSmallSize(height) === height) return match;
      return `${LARGE_EDGE}x${LARGE_EDGE}`;
    })
    .replace(
      /_(\d{2,4})x(\d{0,4})(?=\.(?:jpe?g|png|webp|avif))/gi,
      (match, width: string, height: string) => {
        if (bumpSmallSize(width) === width) return match;
        return height ? `_${LARGE_EDGE}x${LARGE_EDGE}` : `_${LARGE_EDGE}x`;
      },
    );
  const wordpress = trimmed.replace(
    /-(\d{2,4})x(\d{2,4})(?=\.(?:jpe?g|png|webp|avif)$)/i,
    (match, width: string, height: string) => {
      if (bumpSmallSize(width) === width || bumpSmallSize(height) === height) return match;
      return "";
    },
  );
  const stripped = trimmed.replace(
    /(\.(?:jpe?g|png|webp))_\d{2,4}x\d{2,4}(?:q\d+)?\.(?:jpe?g|png|webp)$/i,
    "$1",
  );
  const master = trimmed.replace(
    /(?<!\.(?:jpe?g|png|webp))_\d{2,4}x\d{0,4}(?=\.(?:jpe?g|png|webp|avif)$)/i,
    "",
  );
  const candidates = [wordpress, enlarged, stripped, master]
    .filter((url, index, all) => url.length > 0 && url !== trimmed && all.indexOf(url) === index);
  candidates.push(trimmed);

  return candidates;
}

export function productImage(
  url: string,
  width: number,
  mode: "fill" | "limit" = "fill",
) {
  const marker = "/upload/";
  const index = url.indexOf(marker);

  if (index === -1) return url;

  const transform =
    mode === "fill"
      ? `f_auto,q_auto,c_fill,g_auto,w_${width},ar_3:4`
      : `f_auto,q_auto,c_limit,w_${width}`;

  return `${url.slice(0, index)}${marker}${transform}/${url.slice(index + marker.length)}`;
}
