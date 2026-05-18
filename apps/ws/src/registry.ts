import type { ServerWebSocket } from "bun";
import type { wsData } from "./types";

export const registry = new Map<string, Map<string, ServerWebSocket<wsData>>>();

