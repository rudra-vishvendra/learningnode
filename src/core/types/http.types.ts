import { IncomingMessage, ServerResponse } from "http";
export interface AppRequest extends IncomingMessage {
  tenantId?: string;
}

export type AppResponse = ServerResponse;
