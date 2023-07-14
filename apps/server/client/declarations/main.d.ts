type Roles = "super_admin" | "admin" | "user";

export interface User {
  id: number | undefined;
  email: string;
  firstName: string;
  lastName: string;
  role: Roles;
  createdAt: string;
  updatedAt: string;
}
