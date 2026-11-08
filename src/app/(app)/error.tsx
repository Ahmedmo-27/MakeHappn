"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="page">
      <h1>Something went wrong</h1>
      <p className="lede">{error.message || "The page could not be loaded. Check that the database is running."}</p>
      <button className="btn btn-primary" type="button" onClick={reset}>Try again</button>
    </div>
  );
}
