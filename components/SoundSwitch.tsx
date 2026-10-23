"use client";

import React from "react";
import { useSound } from "./sound/SoundProvider";

/**
 * The site's one sound control, at the right end of the bar: a switch whose label names
 * the setting and whose meter shows the state, bars moving means sound is on, flat means
 * off. Muted, so next to the page links it reads as a control, not a destination. On
 * phones only the meter shows, beside the menu button. A fixed corner was tried and sat
 * on top of content on every page. Clicking it is the gesture that unlocks audio.
 */
export default function SoundSwitch() {
  const { soundOn, toggle } = useSound();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={soundOn}
      aria-label="Sound"
      onClick={toggle}
      className="hp-rule flex items-center gap-2.5 border-l border-ink px-4 md:px-6 font-mono text-[11px] uppercase tracking-wider text-muted hover:text-rust hover:transition-colors"
    >
      <span className="hidden md:inline">Sound</span>
      <span aria-hidden="true" className={`hp-meter ${soundOn ? "hp-meter-on" : ""}`}>
        <span />
        <span />
        <span />
        <span />
      </span>
    </button>
  );
}
