import Link from "next/link";

type WordmarkProps = {
  className?: string;
  href?: string;
};

/** Two-part lockup: italic serif "make" + sans "happn." in the current ink color. */
export function Wordmark({ className, href }: WordmarkProps) {
  const classNames = ["wordmark", className].filter(Boolean).join(" ");
  const mark = (
    <>
      <span className="wordmark-make">make</span>
      <span className="wordmark-happn">happn</span>
      <span className="dot">.</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={classNames}>
        {mark}
      </Link>
    );
  }
  return <span className={classNames}>{mark}</span>;
}
