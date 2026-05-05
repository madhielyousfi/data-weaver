import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Plug, History, Activity, ArrowRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { formatDistanceToNow } from "date-fns";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ pipelines: 0, connections: 0, runs: 0, success: 0 });
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [chart, setChart] = useState<{ day: string; runs: number }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ count: pCount }, { count: cCount }, { data: runs }] = await Promise.all([
        supabase.from("pipelines").select("*", { count: "exact", head: true }),
        supabase.from("connections").select("*", { count: "exact", head: true }),
        supabase.from("pipeline_runs").select("*, pipelines(name)").order("started_at", { ascending: false }).limit(50),
      ]);
      const successCount = (runs ?? []).filter(r => r.status === "success").length;
      setStats({
        pipelines: pCount ?? 0,
        connections: cCount ?? 0,
        runs: runs?.length ?? 0,
        success: runs && runs.length ? Math.round((successCount / runs.length) * 100) : 0,
      });
      setRecentRuns((runs ?? []).slice(0, 6));

      // build last 7 days chart
      const days: { day: string; runs: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const count = (runs ?? []).filter(r => (r.started_at as string).slice(0, 10) === key).length;
        days.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), runs: count });
      }
      setChart(days);
    })();
  }, [user]);

  return (
    <>
      <PageHeader title="Dashboard" description="Overview of your pipelines and recent activity." />
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Pipelines", value: stats.pipelines, icon: Workflow, to: "/app/pipelines" },
            { label: "Connections", value: stats.connections, icon: Plug, to: "/app/connections" },
            { label: "Runs (recent)", value: stats.runs, icon: History, to: "/app/runs" },
            { label: "Success rate", value: `${stats.success}%`, icon: Activity, to: "/app/runs" },
          ].map(({ label, value, icon: Icon, to }) => (
            <Link key={label} to={to}>
              <Card className="p-5 hover:shadow-elegant transition-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <Icon className="size-4 text-muted-foreground" />
                </div>
                <div className="text-3xl font-semibold mt-2">{value}</div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-semibold">Pipeline runs — last 7 days</h2>
                <p className="text-sm text-muted-foreground">Throughput over time</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="runs" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Recent runs</h2>
              <Link to="/app/runs"><Button variant="ghost" size="sm">All <ArrowRight className="ml-1 size-3.5" /></Button></Link>
            </div>
            <div className="space-y-3">
              {recentRuns.length === 0 && <p className="text-sm text-muted-foreground">No runs yet.</p>}
              {recentRuns.map(r => (
                <div key={r.id} className="flex items-center gap-3 text-sm">
                  {r.status === "success" ? <CheckCircle2 className="size-4 text-success" /> :
                    r.status === "failed" ? <XCircle className="size-4 text-destructive" /> :
                    <Loader2 className="size-4 text-primary animate-spin" />}
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium">{r.pipelines?.name ?? "Pipeline"}</div>
                    <div className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.started_at), { addSuffix: true })}</div>
                  </div>
                  <span className="text-xs text-muted-foreground">{r.rows_processed ?? 0} rows</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
