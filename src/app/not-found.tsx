import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col items-center justify-center bg-white px-6 py-20 text-center">
      <p className="section-label">404</p>
      <h1 className="mt-4 text-2xl md:text-3xl">Page not found</h1>
      <p className="mt-4 max-w-md text-sm text-ink/50">
        The page you are looking for has moved or no longer exists.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to home
      </Link>
    </div>
  );
}
