import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { getConnector } from "@/lib/connectors";
import { cn } from "@/lib/utils";

export interface PipelineNodeData {
  connectorId: string;
  label?: string;
}

const categoryStyle: Record<string, string> = {
  source: "border-l-4 border-l-[hsl(210_70%_50%)]",
  transform: "border-l-4 border-l-[hsl(232_78%_58%)]",
  destination: "border-l-4 border-l-[hsl(38_90%_50%)]",
};

const PipelineNode = ({ data, selected }: NodeProps<PipelineNodeData>) => {
  const conn = getConnector(data.connectorId);
  if (!conn) return null;
  const Icon = conn.icon;

  return (
    <div
      className={cn(
        "rounded-lg bg-card border border-border shadow-sm min-w-[200px] transition-all",
        categoryStyle[conn.category],
        selected && "ring-2 ring-primary shadow-elegant"
      )}
    >
      {conn.category !== "source" && <Handle type="target" position={Position.Left} />}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="size-9 rounded-md grid place-items-center" style={{ background: `${conn.color}20`, color: conn.color }}>
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium truncate">{data.label ?? conn.name}</div>
          <div className="text-xs text-muted-foreground capitalize">{conn.category}</div>
        </div>
      </div>
      {conn.category !== "destination" && <Handle type="source" position={Position.Right} />}
    </div>
  );
};

export default memo(PipelineNode);
