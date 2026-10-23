import { useEffect, useRef, useState } from "react";
import { hush } from "@/stores/sound";
import { embedSrc, videoAnchor, type Video } from "@/lib/video";

/**
 * A YouTube or Vimeo video in the work column. Until the visitor presses play it's only a
 * still and a button, so the page loads no third-party player. Pressing play swaps in the
 * player, which starts straight away, and quiets the site's own sound.
 */
export default function VideoEmbed({ video }: { video: Video }) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const source = video.provider === "youtube" ? "YouTube" : "Vimeo";

  // the button is gone once the player is in, so focus moves to the player
  useEffect(() => {
    if (playing) frame.current?.focus();
  }, [playing]);

  const play = () => {
    hush();
    setPlaying(true);
  };

  return (
    <figure id={videoAnchor(video.key)} className="scroll-mt-[calc(var(--size-bar)+2rem)]">
      <div className={`relative overflow-hidden bg-ink ${video.vertical ? "aspect-[9/16] max-w-sm" : "aspect-video"}`}>
        {playing ? (
          <iframe
            ref={frame}
            src={embedSrc(video)}
            title={video.title}
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        ) : (
          <button type="button" onClick={play} className="group absolute inset-0 w-full h-full cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-rust">
            {video.poster && <img src={video.poster} alt="" loading="lazy" className="hp-img absolute inset-0 w-full h-full object-cover" />}
            <span className="sr-only">Play video: {video.title}</span>
            <span
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-paper text-ink grid place-items-center transition duration-300 group-hover:bg-rust group-hover:text-paper group-hover:scale-110 motion-reduce:transition-none"
            >
              <svg viewBox="0 0 16 16" className="w-5 h-5 ml-0.5" fill="currentColor">
                <path d="M4 2.5v11l9-5.5z" />
              </svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-3 hp-label text-muted flex flex-wrap gap-x-3">
        <span className="text-ink">{video.title}</span>
        <span aria-hidden="true">·</span>
        <span>{source}</span>
      </figcaption>
    </figure>
  );
}
