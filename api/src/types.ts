export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "owner" | "agent";
  google_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Session {
  id: string;
  user_id: string;
  expires_at: Date;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  role: "owner" | "agent";
  sessionId: string;
}
