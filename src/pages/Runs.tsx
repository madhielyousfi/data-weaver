import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

const statusBadge: Record<string, JSX.Element> = {
  success: <Badge variant="outline" className="bg-success/10 text-success border-success/30"><CheckCircle2 className="size-3 mr-1" /> success</Badge>,
  failed: <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="size-3 mr-1" /> failed</Badge>,
  running: <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30"><Loader2 className="size-3 mr-1 animate-spin" /> running</Badge>,
};

const Runs = () => {
  const [runs, setRuns] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("pipeline_runs")
        .select("*, pipelines(name)")
        .order("started_at", { ascending: false })
        .limit(200);
      setRuns(data ?? []);
    })();
  }, []);

  return (
    <>
      <PageHeader title="Run history" description="Every pipeline execution, with status and metrics." />
      <div className="p-8">
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pipeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Rows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-12">No runs yet — go run a pipeline.</TableCell></TableRow>
              )}
              {runs.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.pipelines?.name ?? "—"}</TableCell>
                  <TableCell>{statusBadge[r.status] ?? r.status}</TableCell>
                  <TableCell className="text-muted-foreground">{format(new Date(r.started_at), "MMM d, HH:mm:ss")}</TableCell>
                  <TableCell className="text-muted-foreground">{r.duration_ms ? `${r.duration_ms} ms` : "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{r.rows_processed ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
};

export default Runs;
