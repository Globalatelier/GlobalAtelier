import Image from "next/image";

type ProductImageViewProps = {
  url: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  mode?: "fill" | "limit";
  className?: string;
};

export function ProductImageView({
  url,
  alt,
  sizes,
  priority = false,
  mode = "fill",
  className,
}: ProductImageViewProps) {
  if (!url) return null;

  return (
    <Image
      src={url}
      alt={alt}
      fill
      sizes={sizes}
      quality={90}
      priority={priority}
      className={className ?? (mode === "fill" ? "object-cover" : "object-contain")}
    />
  );
}
