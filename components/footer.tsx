export function Footer({
  shopName,
  instagramUrl,
}: {
  shopName: string;
  instagramUrl: string;
}) {
  return (
    <footer className="mt-auto border-t border-neutral-200 px-4 py-8 sm:px-6 lg:px-10">
      <div className="flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.16em] text-neutral-500">
        <p>
          © {new Date().getFullYear()} {shopName}
        </p>
        {instagramUrl ? (
          <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
            Instagram
          </a>
        ) : (
          <span>Streetwear & Luxury</span>
        )}
      </div>
    </footer>
  );
}
