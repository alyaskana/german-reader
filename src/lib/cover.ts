/**
 * Render story cover SVG through an <img> data URI: an image element never
 * executes scripts, so pasted SVG from generated stories stays inert.
 */
export function coverSrc(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
