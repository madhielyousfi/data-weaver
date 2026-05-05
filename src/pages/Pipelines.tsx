import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Workflow, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-success/15 text-success border border-success/30",
  paused: "bg-warning/15 text-warning border border-warning/30",
};

const Pipelines = () => {
  const navigate = useNavigate();
  const [pipelines, setPipelines] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = async () => {
    const { data } = await supabase.from("pipelines").select("*").order("updated_at", { ascending: false });
    setPipelines(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!name.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("pipelines").insert({
      name, description, user_id: user.id,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setOpen(false); setName(""); setDescription("");
    navigate(`/app/pipelines/${data.id}`);
  };

  return (
    <>
      <PageHeader
        title="Pipelines"
        description="Visual ETL pipelines you can build, schedule and run."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 size-4" /> New pipeline</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create pipeline</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Daily orders sync" /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-8">
        {pipelines.length === 0 ? (
          <Card className="p-12 text-center">
            <Workflow className="size-10 text-muted-foreground mx-auto" />
            <h3 className="mt-4 font-semibold">No pipelines yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Create your first pipeline to get started.</p>
            <Button className="mt-6" onClick={() => setOpen(true)}><Plus className="mr-1 size-4" /> New pipeline</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelines.map(p => (
              <Link key={p.id} to={`/app/pipelines/${p.id}`}>
                <Card className="p-5 hover:shadow-elegant transition-shadow h-full">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-lg bg-accent text-accent-foreground grid place-items-center"><Workflow className="size-5" /></div>
                    <Badge className={statusColor[p.status] ?? ""} variant="outline">{p.status}</Badge>
                  </div>
                  <h3 className="font-semibold mt-4">{p.name}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description || "No description"}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4">
                    <Calendar className="size-3.5" /> Updated {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Pipelines;
