"use client";

import { useState } from "react";

export default function Home() {
  const [unMute, setunMute] = useState(false);

  return (
    <>
      <video
        className="object-cover h-full w-full"
        autoPlay
        src="/assets/harry-grad-movie.mp4"
        loop
        playsInline
        muted={!unMute}
      />
      <button
        className="text-white absolute bottom-10 right-5 md:right-10"
        onClick={() => setunMute(!unMute)}
      >
        {(unMute ? "" : "un-") + "mute"}
      </button>
    </>
  );
}
