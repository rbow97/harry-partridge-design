import React from "react";

/** Corner crop marks, like a technical drawing or specimen tray */
export default function CropMarks() {
  const mark = "absolute w-3 h-3 border-ink/50";
  return (
    <span aria-hidden="true">
      <span className={`hp-mark ${mark} top-3 left-3 border-t border-l`} />
      <span className={`hp-mark ${mark} top-3 right-3 border-t border-r`} />
      <span className={`hp-mark ${mark} bottom-3 left-3 border-b border-l`} />
      <span className={`hp-mark ${mark} bottom-3 right-3 border-b border-r`} />
    </span>
  );
}
