export default function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="h-14 w-48 animate-pulse bg-neutral-100" />
      <div className="mt-10 space-y-4">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="h-24 animate-pulse border-t border-neutral-100 bg-neutral-50" />
        ))}
      </div>
    </div>
  );
}
