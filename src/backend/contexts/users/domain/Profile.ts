export interface Profile {
  id: string;
  username?: string;
  /** Whether the person picked the username; a generated one is never shown to anyone. */
  usernameChosen?: boolean;
  fullName?: string;
  avatarUrl?: string;
  primaryColor?: string;
  updatedAt?: string;
}
