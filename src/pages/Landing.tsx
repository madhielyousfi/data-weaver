import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Workflow, Plug, Activity, ArrowRight, Database, Cloud, Boxes } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-gradient-primary grid place-items-center shadow-glow">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Fluxion</span>
          </div>
          <nav className="flex items-center gap-3">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth"><Button>Get started</Button></Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-subtle">
        <div className="container py-24 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-success" /> Now in public beta
          </div>
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
            The visual <span className="text-transparent bg-clip-text bg-gradient-primary">ETL platform</span> for modern data teams
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Build, schedule and monitor data pipelines on a drag-and-drop canvas. Connect 50+ sources, transform with SQL, deliver anywhere.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link to="/auth"><Button size="lg" className="shadow-elegant">Start building free <ArrowRight className="ml-1" /></Button></Link>
            <Button size="lg" variant="outline">View docs</Button>
          </div>
        </div>
      </section>

      <section className="container py-20 grid md:grid-cols-3 gap-6">
        {[
          { icon: Workflow, title: "Visual canvas", body: "Compose sources, transforms and destinations on a React Flow canvas." },
          { icon: Plug, title: "50+ connectors", body: "Postgres, Snowflake, BigQuery, S3, HTTP APIs and more — all built in." },
          { icon: Activity, title: "Live monitoring", body: "Run history, throughput, and error logs at your fingertips." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="size-10 rounded-lg bg-accent text-accent-foreground grid place-items-center mb-4"><Icon className="size-5" /></div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{body}</p>
          </div>
        ))}
      </section>

      <section className="container pb-24">
        <div className="rounded-2xl bg-gradient-primary p-12 text-center text-primary-foreground shadow-lift">
          <h2 className="text-3xl font-semibold">Ready to ship your first pipeline?</h2>
          <p className="mt-2 opacity-90">No credit card required.</p>
          <Link to="/auth"><Button size="lg" variant="secondary" className="mt-6">Get started</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="container py-6 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Fluxion</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><Database className="size-3.5" /> Sources</span>
            <span className="flex items-center gap-1"><Boxes className="size-3.5" /> Transforms</span>
            <span className="flex items-center gap-1"><Cloud className="size-3.5" /> Destinations</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
