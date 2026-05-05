import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CONNECTORS, getConnector } from "@/lib/connectors";
import { Plus, Trash2, Plug } from "lucide-react";
import { toast } from "sonner";

const Connections = () => {
  const [items, setItems] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("postgres");

  const load = async () => {
    const { data } = await supabase.from("connections").select("*").order("created_at", { ascending: false });
    setItems(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !name.trim()) return;
    const conn = getConnector(type);
    const { error } = await supabase.from("connections").insert({
      user_id: user.id, name, connector_type: type, category: conn?.category ?? "source",
    });
    if (error) { toast.error(error.message); return; }
    setOpen(false); setName(""); load();
  };

  const remove = async (id: string) => {
    await supabase.from("connections").delete().eq("id", id);
    load();
  };

  return (
    <>
      <PageHeader
        title="Connections"
        description="Sources and destinations available to your pipelines."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 size-4" /> New connection</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New connection</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Production Postgres" /></div>
                <div>
                  <Label>Connector</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONNECTORS.map(c => <SelectItem key={c.id} value={c.id}>{c.name} <span className="text-muted-foreground capitalize">· {c.category}</span></SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button onClick={create}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="p-8">
        {items.length === 0 ? (
          <Card className="p-12 text-center">
            <Plug className="size-10 text-muted-foreground mx-auto" />
            <h3 className="mt-4 font-semibold">No connections yet</h3>
            <p className="text-sm text-muted-foreground mt-1">Add a source or destination to start building pipelines.</p>
            <Button className="mt-6" onClick={() => setOpen(true)}><Plus className="mr-1 size-4" /> New connection</Button>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(c => {
              const def = getConnector(c.connector_type);
              const Icon = def?.icon ?? Plug;
              return (
                <Card key={c.id} className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="size-10 rounded-lg grid place-items-center" style={{ background: `${def?.color ?? "#888"}20`, color: def?.color ?? "#888" }}>
                      <Icon className="size-5" />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
                  </div>
                  <h3 className="font-semibold mt-4">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <span>{def?.name}</span>
                    <span>·</span>
                    <span className="capitalize">{c.category}</span>
                  </div>
                  <Badge variant="outline" className="mt-3 bg-success/10 text-success border-success/30">● {c.status}</Badge>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default Connections;
