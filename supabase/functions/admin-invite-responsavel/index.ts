import { createClient } from "npm:@supabase/supabase-js@2.89.0";

const origin = "https://odairfjr.github.io";
const headers = {
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { headers, status });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers });
  if (request.method !== "POST") return reply({ error: "Método inválido." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization) return reply({ error: "Entre novamente no aplicativo." }, 401);
  const url = Deno.env.get("SUPABASE_URL")!;
  const options = { auth: { persistSession: false, autoRefreshToken: false } };
  const caller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    ...options, global: { headers: { Authorization: authorization } },
  });
  const { data: userData, error: authError } = await caller.auth.getUser();
  if (authError || !userData.user) return reply({ error: "Sessão inválida." }, 401);
  const { data: rows, error: listError } = await caller.rpc("listar_lote_responsaveis");
  if (listError || !rows?.length) return reply({ error: "Acesso reservado à administração." }, 403);

  const body = await request.json().catch(() => null);
  const id = body?.id;
  if (!Number.isSafeInteger(id) || id <= 0) return reply({ error: "Cadastro inválido." }, 400);
  const row = rows.find((entry: { id: number }) => entry.id === id);
  if (!row || !["Pronto para convidar", "Convite pendente"].includes(row.situacao)) {
    return reply({ error: "O cadastro precisa ser conferido ou já está ativo." }, 409);
  }

  const service = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, options);
  const redirectTo = origin + "/gearpc-conecta/";
  if (row.situacao === "Convite pendente") {
    const { data: profile } = await service.from("perfis_usuarios")
      .select("user_id").eq("responsavel_id", id).eq("tipo", "responsavel").eq("ativo", true).single();
    if (!profile) return reply({ error: "Vínculo de acesso não encontrado." }, 409);
    const { data: account } = await service.auth.admin.getUserById(profile.user_id);
    if (account?.user?.email?.toLowerCase() !== row.email?.toLowerCase()) {
      return reply({ error: "O e-mail da conta diverge do cadastro. Confira antes de reenviar." }, 409);
    }
    const { error } = await service.auth.resetPasswordForEmail(row.email, { redirectTo });
    return error ? reply({ error: "O reenvio falhou. Confira a configuração de e-mail e tente novamente." }, 502) : reply({ ok: true });
  }
  const { data, error } = await service.auth.admin.inviteUserByEmail(row.email, { redirectTo });
  if (error || !data.user) {
    return reply({ error: "O convite falhou. Confira o e-mail e o limite de envio do projeto." }, 502);
  }
  const { error: profileError } = await service.from("perfis_usuarios").insert({
    user_id: data.user.id, nome_completo: row.nome, responsavel_id: id,
    tipo: "responsavel", ativo: true, eh_teste: false, troca_senha_obrigatoria: false,
  });
  if (profileError) {
    const { error: cleanupError } = await service.auth.admin.deleteUser(data.user.id);
    return reply({ error: cleanupError
      ? "O convite foi gerado sem vínculo. Confira a conta em Authentication antes de tentar novamente."
      : "O vínculo falhou e a conta foi removida. Gere um novo convite." }, 502);
  }
  return reply({ ok: true });
});
