import Image from "next/image";
import { productImage } from "@/lib/images";

type ProductImageViewProps = {
  url: string | null;
  alt: string;
  sizes: string;
  width: number;
  priority?: boolean;
  mode?: "fill" | "limit";
  className?: string;
};

export function ProductImageView({
  url,
  alt,
  sizes,
  width,
  priority = false,
  mode = "fill",
  className,
}: ProductImageViewProps) {
  if (!url) return null;

  return (
    <Image
      src={productImage(url, width, mode)}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={className ?? (mode === "fill" ? "object-cover" : "object-contain")}
    />
  );
}
