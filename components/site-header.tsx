import Link from 'next/link';

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          <span className="brand-title">Jaundle</span>
          <span className="brand-subtitle">Main Page</span>
        </Link>

        <nav className="nav-links" aria-label="Primary navigation">
          <Link className="nav-link" href="/">
            Today
          </Link>
          <Link className="nav-link" href="/games/daily-crossword/archive">
            Archive
          </Link>
          <Link className="nav-link" href="/admin">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
