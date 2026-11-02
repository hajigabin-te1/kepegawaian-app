// Creates a Supabase Auth user and its user_accounts row. Callable only by accounts with `user.manage`.
// Deployed with verify_jwt = false: the caller's session is verified below (required for publishable/secret keys).
import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type CreateAccountBody = {
  email?: unknown;
  password?: unknown;
  roleCode?: unknown;
};

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

  // 1. Who is calling, and may they manage accounts? (Checked with the caller's own permissions.)
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
    return fail(403, "forbidden", "Anda tidak memiliki akses untuk membuat akun.");
  }

  // 2. Validate input.
  let body: CreateAccountBody;
  try {
    body = (await request.json()) as CreateAccountBody;
  } catch {
    return fail(400, "invalid_body", "Data tidak valid.");
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const roleCode = typeof body.roleCode === "string" ? body.roleCode : "";
  if (!EMAIL_PATTERN.test(email)) {
    return fail(400, "invalid_email", "Format email tidak valid.");
  }
  if (password.length < 8 || password.length > 72) {
    return fail(400, "invalid_password", "Password sementara harus 8–72 karakter.");
  }

  const admin = createClient(supabaseUrl, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: role } = await admin.from("roles").select("id").eq("code", roleCode).maybeSingle();
  if (!role) {
    return fail(400, "invalid_role", "Peran tidak dikenal.");
  }

  // 3. Create the auth user (already confirmed) and link it to the role.
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    if (createError?.code === "email_exists") {
      return fail(409, "email_exists", "Email sudah terdaftar.");
    }
    if (createError?.code === "weak_password") {
      return fail(400, "weak_password", "Password terlalu lemah. Gunakan kombinasi huruf dan angka.");
    }
    return fail(500, "create_failed", "Akun gagal dibuat. Silakan coba lagi.");
  }

  const { error: linkError } = await admin.from("user_accounts").insert({ id: created.user.id, role_id: role.id });
  if (linkError) {
    // Do not leave an auth user without an account row.
    await admin.auth.admin.deleteUser(created.user.id);
    return fail(500, "create_failed", "Akun gagal dibuat. Silakan coba lagi.");
  }

  await admin.from("audit_logs").insert({
    user_id: callerData.user.id,
    action: "create_account",
    entity: "user_accounts",
    entity_id: created.user.id,
    change_description: `Created account ${email} with role ${roleCode}`,
  });

  return json(201, { id: created.user.id, email });
});
