export default function Home() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <main style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 700, marginBottom: '1rem' }}>Offside AI</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--muted)', marginBottom: '2rem' }}>
          Elite-level tactical intelligence for your team.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="/dashboard" className="btn-primary">Go to Dashboard</a>
          <a href="/login" style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>Login</a>
        </div>
      </main>
    </div>
  );
}
