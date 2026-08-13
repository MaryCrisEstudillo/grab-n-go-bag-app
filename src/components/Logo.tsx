interface LogoProps {
  /** Rendered width and height, in px. */
  size?: number;
  className?: string;
}

/**
 * The backpack mark.
 *
 * Two artworks rather than one: the line work is black on the light page and
 * white on the dark one, with the brand red flap common to both. `.logo-mark`
 * owns both URLs and picks between them off the `dark` class. A media query
 * would be wrong there, since the theme toggle can put a dark page in front of
 * a light-set OS.
 *
 * The size is the only thing that varies per instance, so it is the only thing
 * inlined here.
 *
 * Always decorative. Every place it appears, the "GrabnGo" wordmark next to it
 * is the accessible name.
 */
export function Logo({ size = 64, className = '' }: LogoProps) {
  return (
    <span
      aria-hidden="true"
      className={`logo-mark block shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * The mark stacked over the wordmark, centred. It is the arrangement the
 * welcome and login screens both open with. The wordmark is the `h1` on both,
 * which is why it is one here rather than at each call site.
 */
export function BrandMark({ size = 150, className = '' }: LogoProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <Logo size={size} />
      <h1 className="mt-2 text-4xl font-bold tracking-tight">GrabnGo</h1>
    </div>
  );
}
