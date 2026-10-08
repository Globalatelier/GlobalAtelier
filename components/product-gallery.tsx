"use client";

import { useState } from "react";
import { ProductImageView } from "@/components/product-image";
import type { ProductImage } from "@/types";

export function ProductGallery({
  images,
  name,
}: {
  images: ProductImage[];
  name: string;
}) {
  const [index, setIndex] = useState(0);
  const active = images[index] ?? images[0];

  if (!active) {
    return (
      <div className="flex aspect-[3/4] items-end bg-[#f3f3f1] p-6">
        <p className="font-serif text-4xl uppercase leading-none tracking-[0.08em] text-neutral-400">
          {name}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative aspect-[3/4] bg-[#f3f3f1]">
        <ProductImageView
          url={active.url}
          alt={name}
          sizes="(max-width: 1024px) 100vw, 50vw"
          mode="limit"
          priority
          className="object-contain"
        />
      </div>
      {images.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((image, imageIndex) => (
            <li key={image.publicId}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`Bild ${imageIndex + 1} von ${name}`}
                aria-current={imageIndex === index}
                className={`relative h-20 w-16 shrink-0 bg-[#f3f3f1] ${
                  imageIndex === index ? "outline outline-1 outline-black" : ""
                }`}
              >
                <ProductImageView
                  url={image.url}
                  alt=""
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
