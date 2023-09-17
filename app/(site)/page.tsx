"use client";

import { useState } from "react";

export default function Home() {
  const [unMute, setunMute] = useState(false);

  return (
    <>
      <video
        className="object-cover w-full video"
        autoPlay
        src="/assets/harry-grad-movie.mp4"
        loop
        playsInline
        muted={!unMute}
      />
      <button
        className="text-white absolute p-2 rounded-full z-10 text-xs md:text-lg bottom-4 md:bottom-10 right-5 md:right-10 hover:bg-slate-200/[0.3] transition-all"
        onClick={() => setunMute(!unMute)}
      >
        {unMute ? (
          <img
            alt="Your data is loading"
            src="/images/un-mute.svg"
            className="w-5"
          />
        ) : (
          <img
            alt="Your data is loading"
            src="/images/mute.svg"
            className="w-5"
          />
        )}
      </button>
    </>
  );
}
