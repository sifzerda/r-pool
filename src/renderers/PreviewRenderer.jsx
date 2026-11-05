// src/renderers/PreviewRenderer.jsx

import { useState } from "react";

const PREVIEW_DIR = "/previews";
const FALLBACK_IMAGE = `${PREVIEW_DIR}/default.webp`;

function getPreviewPath(preset) {
  const filename = String(preset || "default")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  return `${PREVIEW_DIR}/${filename}.webp`;
}

export default function PreviewRenderer({ preset = "default", className = "" }) {
  const [failedPath, setFailedPath] = useState(null);
  const path = getPreviewPath(preset);
  const src = failedPath === path ? FALLBACK_IMAGE : path;

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}>

      <img key={src} src={src} alt={`${preset} pool table preview`}
        draggable={false} decoding="async"
        className="block max-h-full max-w-full object-contain"
        onError={() => { if (src !== FALLBACK_IMAGE) { setFailedPath(path) } }}
      />

    </div>
  );
}
