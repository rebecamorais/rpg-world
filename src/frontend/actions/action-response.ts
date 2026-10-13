/** Result of a server action: actions return error codes instead of throwing to the client. */
export interface ActionResponse {
  success: boolean;
  error?: string;
}
