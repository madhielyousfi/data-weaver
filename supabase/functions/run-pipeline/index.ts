import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });

    const { pipeline_id } = await req.json();
    if (!pipeline_id) return new Response(JSON.stringify({ error: "pipeline_id required" }), { status: 400, headers: corsHeaders });

    const { data: pipeline, error: pErr } = await supabase.from("pipelines").select("*").eq("id", pipeline_id).single();
    if (pErr || !pipeline) return new Response(JSON.stringify({ error: "pipeline not found" }), { status: 404, headers: corsHeaders });

    const start = Date.now();
    const { data: run } = await supabase.from("pipeline_runs").insert({
      pipeline_id, user_id: user.id, status: "running",
    }).select().single();

    // Simulate execution
    const nodes = (pipeline.graph?.nodes ?? []) as any[];
    const edges = (pipeline.graph?.edges ?? []) as any[];
    const sources = nodes.filter((n: any) => n.data?.connectorId && !edges.some((e: any) => e.target === n.id));
    const destinations = nodes.filter((n: any) => !edges.some((e: any) => e.source === n.id));

    const logs: any[] = [
      { ts: new Date().toISOString(), level: "info", msg: `Starting pipeline ${pipeline.name}` },
      { ts: new Date().toISOString(), level: "info", msg: `Found ${sources.length} source(s), ${nodes.length - sources.length - destinations.length} transform(s), ${destinations.length} destination(s)` },
    ];

    await new Promise((r) => setTimeout(r, 600 + Math.random() * 1200));

    const failed = Math.random() < 0.12;
    const rows = failed ? Math.floor(Math.random() * 200) : 1000 + Math.floor(Math.random() * 50000);
    const duration = Date.now() - start;

    logs.push({
      ts: new Date().toISOString(),
      level: failed ? "error" : "info",
      msg: failed ? "Connection refused at destination" : `Successfully wrote ${rows} rows`,
    });

    await supabase.from("pipeline_runs").update({
      status: failed ? "failed" : "success",
      finished_at: new Date().toISOString(),
      duration_ms: duration,
      rows_processed: rows,
      logs,
      error: failed ? "Connection refused at destination" : null,
    }).eq("id", run!.id);

    return new Response(JSON.stringify({
      run_id: run!.id, status: failed ? "failed" : "success", rows_processed: rows, duration_ms: duration,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: corsHeaders });
  }
});
