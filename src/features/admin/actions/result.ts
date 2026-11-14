export type AdminActionResult =
  | { success: true }
  | { success: false; error: "invalid_data" | "forbidden" | "not_found" | "unexpected" };
