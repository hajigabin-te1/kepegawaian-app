// Deletes a Supabase Auth user and its user_accounts row. Callable only by accounts with `user.manage`.
// Deployed with verify_jwt = false: the caller session is verified below. Linked history rows keep or drop
// their user reference through the schema foreign keys; the employee record itself is never deleted.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function fail(status: number, error: string, message: string): Response {
  return json(status, { error, message });
}

/** Reads the `default` key from the new JSON key variables, falling back to the legacy variable. */
function readKey(jsonVariable: string, legacyVariable: string): string {
  const raw = Deno.env.get(jsonVariable);
  if (raw) {
    try {
      const key = (JSON.parse(raw) as Record<string, string>)["default"];
      if (key) return key;
    } catch {
      // Fall through to the legacy key.
    }
  }
  return Deno.env.get(legacyVariable) ?? "";
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (request.method !== "POST") {
    return fail(405, "method_not_allowed", "Metode tidak diizinkan.");
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = readKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
  const secretKey = readKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return fail(401, "unauthenticated", "Sesi tidak ditemukan. Silakan masuk kembali.");
  }

    const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: callerData, error: callerError } = await callerClient.auth.getUser(token);
  if (callerError || !callerData.user) {
    return fail(401, "unauthenticated", "Sesi tidak valid. Silakan masuk kembali.");
  }
  const { data: allowed } = await callerClient.rpc("has_permission", { permission_code: "user.manage" });
  if (allowed !== true) {
    return fail(403, "forbidden", "Anda tidak memiliki akses untuk menghapus akun.");
  }

  let body: { userId?: unknown };
  try {
    body = (await request.json()) as { userId?: unknown };
  } catch {
    return fail(400, "invalid_body", "Data tidak valid.");
  }
  const userId = typeof body.userId === "string" ? body.userId : "";
  if (!UUID_PATTERN.test(userId)) {
    return fail(400, "invalid_user", "Akun tidak valid.");
  }
  if (userId === callerData.user.id) {
    return fail(400, "self_delete", "Anda tidak dapat menghapus akun Anda sendiri.");
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: target } = await admin.from("user_accounts").select("id, role:roles(code)").eq("id", userId).maybeSingle();
  if (!target) {
    return fail(404, "not_found", "Akun tidak ditemukan.");
  }

  // Never remove the last superadmin, otherwise nobody can manage accounts anymore.
  if (target.role?.code === "superadmin") {
    const { count } = await admin
      .from("user_accounts")
      .select("id, role:roles!inner(code)", { count: "exact", head: true })
      .eq("roles.code", "superadmin")
      .neq("id", userId);
    if (!count) {
      return fail(409, "last_superadmin", "Akun superadmin terakhir tidak dapat dihapus.");
    }
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  const email = authUser.user?.email ?? userId;

  // user_accounts is removed by ON DELETE CASCADE from auth.users.
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return fail(500, "delete_failed", "Akun gagal dihapus. Silakan coba lagi.");
  }

  await admin.from("audit_logs").insert({
    user_id: callerData.user.id,
    action: "delete_account",
    entity: "user_accounts",
    entity_id: userId,
    change_description: `Deleted account ${email}`,
  });

  return json(200, { id: userId });
});
