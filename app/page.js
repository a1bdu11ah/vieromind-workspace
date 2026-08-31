import Link from "next/link";
import Navbar from "@/components/Navbar";
import Image from "next/image";

export default function Home() {
  return <div className="landing">
    <Navbar />
    <main>
      <div className="hero-zone">
        <section className="hero container">
          <div className="hero-copy">
            <div className="internal-badge"><span/> VieroMind employee workspace</div>
            <h1>One team.<br/>Clearer progress.</h1>
            <p className="hero-text">A focused internal workspace for VieroMind employees to organize responsibilities, collaborate with their team, and keep meaningful work moving forward.</p>
            <div className="hero-actions"><Link className="button employee-cta" href="/register">Create your workspace <span>→</span></Link><Link className="text-link" href="/login">Already have an account? Sign in</Link></div>
            <div className="trust-row"><span>Employees only</span><span>Role-based access</span><span>Private by design</span></div>
          </div>

          <div className="workspace-preview">
            <div className="preview-top"><div className="preview-brand"><Image src="/vieromind-logo.png" alt="" width={38} height={38}/><div><strong>VieroMind</strong><span>Team workspace</span></div></div><span className="live-pill"><i/> Live</span></div>
            <div className="preview-welcome"><p>Good morning, team</p><h2>Work that moves with you.</h2></div>
            <div className="preview-stats"><div><span>Team progress</span><strong>78%</strong><i><b style={{width:"78%"}}/></i></div><div><span>Tasks completed</span><strong>24</strong><small>+6 this week</small></div></div>
            <div className="preview-task"><span className="preview-check">✓</span><div><strong>Finalize community launch plan</strong><small>Assigned to Outreach team</small></div><span className="preview-status">In review</span></div>
            <div className="preview-task"><span className="preview-check blue">↗</span><div><strong>Prepare monthly impact report</strong><small>Assigned to Operations</small></div><span className="preview-status progress">In progress</span></div>
          </div>
        </section>
      </div>

      <section id="platform" className="section container employee-features">
        <div className="section-heading"><div><p className="eyebrow">BUILT FOR OUR TEAM</p><h2 className="section-title">Everything VieroMind employees need to stay aligned.</h2></div><p>A calm, secure place to turn priorities into accountable progress—without unnecessary complexity.</p></div>
        <div className="feature-grid">
          <article><span className="feature-icon">01</span><h3>Clear ownership</h3><p>Owners and admins assign priorities, due dates, and responsibilities so everyone knows what comes next.</p><Link href="/login">View your tasks →</Link></article>
          <article><span className="feature-icon">02</span><h3>Visible progress</h3><p>Update task status and completion in real time while leaders get a clear view across the whole team.</p><Link href="/login">Track progress →</Link></article>
          <article><span className="feature-icon">03</span><h3>Secure collaboration</h3><p>Employee accounts, role-based permissions, and workspace-isolated data keep internal work protected.</p><Link href="/login">Sign in securely →</Link></article>
        </div>
      </section>

      <section className="employee-cta-section container"><div><Image src="/vieromind-logo.png" alt="VieroMind" width={60} height={60}/><div><p className="eyebrow">READY WHEN YOU ARE</p><h2>Continue to your workspace.</h2></div></div><Link href="/login" className="button">Employee sign in <span>→</span></Link></section>
    </main>
    <footer className="landing-footer container"><span>© 2026 VieroMind Health Technologies</span><span>Internal workspace · Authorized employees only</span></footer>
  </div>;
}
