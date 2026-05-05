import { Database, Cloud, FileSpreadsheet, Globe, Webhook, Boxes, Server, HardDrive, type LucideIcon } from "lucide-react";

export type ConnectorCategory = "source" | "destination" | "transform";

export interface ConnectorDef {
  id: string;
  name: string;
  category: ConnectorCategory;
  icon: LucideIcon;
  color: string;
  description: string;
}

export const CONNECTORS: ConnectorDef[] = [
  { id: "postgres", name: "PostgreSQL", category: "source", icon: Database, color: "hsl(210 70% 50%)", description: "Relational database" },
  { id: "mysql", name: "MySQL", category: "source", icon: Database, color: "hsl(28 80% 50%)", description: "Relational database" },
  { id: "snowflake", name: "Snowflake", category: "source", icon: Cloud, color: "hsl(195 80% 50%)", description: "Cloud data warehouse" },
  { id: "bigquery", name: "BigQuery", category: "source", icon: Boxes, color: "hsl(220 80% 55%)", description: "Google data warehouse" },
  { id: "csv", name: "CSV File", category: "source", icon: FileSpreadsheet, color: "hsl(150 50% 45%)", description: "Flat file source" },
  { id: "http", name: "HTTP API", category: "source", icon: Globe, color: "hsl(265 60% 55%)", description: "REST endpoint" },
  { id: "transform_sql", name: "SQL Transform", category: "transform", icon: Server, color: "hsl(232 78% 58%)", description: "Run a SQL query" },
  { id: "transform_filter", name: "Filter", category: "transform", icon: Server, color: "hsl(232 78% 58%)", description: "Filter rows" },
  { id: "s3", name: "S3 Bucket", category: "destination", icon: HardDrive, color: "hsl(38 90% 50%)", description: "Object storage" },
  { id: "warehouse", name: "Data Warehouse", category: "destination", icon: Boxes, color: "hsl(232 78% 58%)", description: "Generic warehouse" },
  { id: "webhook", name: "Webhook", category: "destination", icon: Webhook, color: "hsl(340 70% 55%)", description: "POST to URL" },
];

export const getConnector = (id: string) => CONNECTORS.find(c => c.id === id);
