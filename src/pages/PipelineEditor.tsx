import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactFlow, {
  Background, BackgroundVariant, Controls, MiniMap, addEdge,
  useEdgesState, useNodesState, type Connection, type Node, type Edge, ReactFlowProvider, useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { CONNECTORS, getConnector } from "@/lib/connectors";
import PipelineNode from "@/canvas/PipelineNode";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

const nodeTypes = { pipeline: PipelineNode };

const Inner = ({ pipeline, onSaved }: { pipeline: any; onSaved: () => void }) => {
  const navigate = useNavigate();
  const wrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [name, setName] = useState(pipeline.name);
  const [nodes, setNodes, onNodesChange] = useNodesState(pipeline.graph?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(pipeline.graph?.edges ?? []);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);

  const onConnect = useCallback((c: Connection) => setEdges(eds => addEdge({ ...c, animated: true }, eds)), [setEdges]);

  const onDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }, []);
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const connectorId = e.dataTransfer.getData("application/reactflow");
    if (!connectorId) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const newNode: Node = {
      id: `${connectorId}-${Date.now()}`, type: "pipeline", position,
      data: { connectorId, label: getConnector(connectorId)?.name },
    };
    setNodes(nds => nds.concat(newNode));
  }, [screenToFlowPosition, setNodes]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("pipelines").update({
      name, graph: { nodes, edges }, status: nodes.length > 0 ? "active" : "draft",
    }).eq("id", pipeline.id);
    setSaving(false);
    if (error) toast.error(error.message); else { toast.success("Saved"); onSaved(); }
  };

  const run = async () => {
    setRunning(true);
    await save();
    const { data, error } = await supabase.functions.invoke("run-pipeline", {
      body: { pipeline_id: pipeline.id },
    });
    setRunning(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Run ${data.status} • ${data.rows_processed} rows`);
    navigate("/app/runs");
  };

  const grouped = useMemo(() => ({
    source: CONNECTORS.filter(c => c.category === "source"),
    transform: CONNECTORS.filter(c => c.category === "transform"),
    destination: CONNECTORS.filter(c => c.category === "destination"),
  }), []);

  return (
    <div className="h-screen flex flex-col">
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/pipelines")}><ArrowLeft className="size-4" /></Button>
          <Input value={name} onChange={e => setName(e.target.value)} className="font-semibold border-none shadow-none text-lg w-80" />
          <Badge variant="outline">{nodes.length} nodes</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />} Save
          </Button>
          <Button onClick={run} disabled={running || nodes.length === 0}>
            {running ? <Loader2 className="size-4 animate-spin mr-1" /> : <Play className="size-4 mr-1" />} Run
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <aside className="w-64 border-r border-border bg-sidebar shrink-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Connector palette</h3>
              {(["source", "transform", "destination"] as const).map(cat => (
                <div key={cat} className="mb-5">
                  <div className="text-xs font-medium text-muted-foreground capitalize mb-2">{cat}s</div>
                  <div className="space-y-1.5">
                    {grouped[cat].map(c => {
                      const Icon = c.icon;
                      return (
                        <div
                          key={c.id}
                          draggable
                          onDragStart={e => { e.dataTransfer.setData("application/reactflow", c.id); e.dataTransfer.effectAllowed = "move"; }}
                          className="flex items-center gap-2 p-2 rounded-md bg-card border border-border cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-primary/30 transition"
                        >
                          <div className="size-7 rounded grid place-items-center" style={{ background: `${c.color}20`, color: c.color }}>
                            <Icon className="size-3.5" />
                          </div>
                          <span className="text-sm">{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        <div className="flex-1 min-w-0" ref={wrapper}>
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
            onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver}
            nodeTypes={nodeTypes} fitView
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="hsl(var(--border))" />
            <Controls />
            <MiniMap pannable zoomable className="!bg-card !border !border-border" maskColor="hsl(var(--surface) / 0.6)" />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
};

const PipelineEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pipeline, setPipeline] = useState<any>(null);

  const load = async () => {
    const { data, error } = await supabase.from("pipelines").select("*").eq("id", id!).single();
    if (error) { toast.error(error.message); navigate("/app/pipelines"); return; }
    setPipeline(data);
  };
  useEffect(() => { load(); }, [id]);

  if (!pipeline) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  return <ReactFlowProvider><Inner pipeline={pipeline} onSaved={load} /></ReactFlowProvider>;
};

export default PipelineEditor;
