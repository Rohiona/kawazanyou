type BrandProps = {
  href?: string;
  className?: string;
};

export function Brand({ href, className = "" }: BrandProps) {
  const content = (
    <>
      <span className="brand-mark" aria-hidden="true">皮</span>
      <span className="brand-name">皮算用</span>
    </>
  );
  const classes = `brand${className ? ` ${className}` : ""}`;

  return href ? (
    <a className={classes} href={href} aria-label="皮算用 ホーム">{content}</a>
  ) : (
    <div className={classes} aria-label="皮算用">{content}</div>
  );
}
