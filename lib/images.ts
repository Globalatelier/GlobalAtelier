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
