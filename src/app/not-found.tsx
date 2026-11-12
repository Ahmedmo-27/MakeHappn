import Link from "next/link";
import { Sticker } from "@/components/brand/sticker";

export default function NotFound() {
  return (
    <main className="page">
      <Sticker name="binoculars" className="sticker-plate missing-mark" />
      <p className="kicker">Missing</p>
      <h1>That page is not part of the experience.</h1>
      <Link className="btn btn-primary" href="/dashboard">Back to the dashboard</Link>
    </main>
  );
}
