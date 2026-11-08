import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <p className="kicker">Missing</p>
      <h1>That page is not part of the experience.</h1>
      <Link className="btn btn-primary" href="/dashboard">Back to the dashboard</Link>
    </main>
  );
}
