/** Who a password attempt counts against: the e-mail typed, and the client's IP when known. */
export interface LoginAttemptKeys {
  email: string;
  ip?: string;
}

export interface AuthLoginThrottleRepo {
  /**
   * Takes one password attempt for the e-mail and the IP before Auth is asked. Returns 0 when the
   * attempt may go on, or the seconds left until either key unlocks (then nothing is counted).
   * Atomic, so simultaneous guesses can't all slip under the limit.
   */
  claim(keys: LoginAttemptKeys): Promise<number>;
  /** Gives back an attempt that turned out not to be a wrong password (e.g. Auth failed). */
  release(keys: LoginAttemptKeys): Promise<void>;
  /** The password was right: the e-mail starts over, the IP only gets its attempt back. */
  succeed(keys: LoginAttemptKeys): Promise<void>;
}
