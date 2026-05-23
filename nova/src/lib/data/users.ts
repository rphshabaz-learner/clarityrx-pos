import type { NovaUser } from "@/types";

export const USERS: NovaUser[] = [
  { id: 1, name: "Admin", role: "admin", pin: "0000", initials: "AD", color: "#FFB800" },
  { id: 2, name: "Sarah K.", role: "cashier", pin: "1111", initials: "SK", color: "#00E5FF" },
  { id: 3, name: "Mike R.", role: "cashier", pin: "2222", initials: "MR", color: "#69F0AE" },
  { id: 4, name: "Jenny L.", role: "cashier", pin: "3333", initials: "JL", color: "#FF6E6E" },
  { id: 5, name: "Tom B.", role: "cashier", pin: "4444", initials: "TB", color: "#CE93D8" },
  { id: 6, name: "Dana W.", role: "cashier", pin: "5555", initials: "DW", color: "#80DEEA" },
];

export function findUserById(id: number) {
  return USERS.find((u) => u.id === id);
}
