/** Result of a server action: actions return error codes instead of throwing to the client. */
export interface ActionResponse {
  success: boolean;
  error?: string;
}

/** Response of an action that sends an e-mail. On a preview deployment it carries the link. */
export interface EmailActionResponse extends ActionResponse {
  previewLink?: string;
}
