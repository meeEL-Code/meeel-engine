import type { PropertyDef } from "../../grammar/types";

// Backend-specific properties — extend the base PROPERTIES map.
// Count: +3 (type, api-key, project-id)

export const BACKEND_PROPERTIES: Record<string, PropertyDef> = {
  "type":       { valueMode: "text", description: "Backend type (rest / firebase / supabase / custom)" },
  "api-key":    { valueMode: "text", description: "API key or token for backend" },
  "project-id": { valueMode: "text", description: "Project ID (Firebase, Supabase)" },
};
