/**
 * The words of a recording, for anyone who can't hear it or would rather read (WCAG 1.2.1). A native
 * disclosure, so it opens with the keyboard and screen readers announce it as expandable, and it
 * needs no script. Nothing shows until a transcript has been written in Studio.
 */
export default function Transcript({ text, label = "Transcript" }: { text?: string | null; label?: string }) {
  const paragraphs = (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (!paragraphs.length) return null;
  return (
    <details className="group mt-3">
      <summary className="hp-label text-accent cursor-pointer list-none w-fit [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
        <span className="group-open:hidden">Read the transcript</span>
        <span className="hidden group-open:inline">Hide the transcript</span>
        <span className="sr-only"> ({label})</span>
      </summary>
      <div className="mt-3 flex flex-col gap-3 text-small leading-relaxed">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </details>
  );
}
