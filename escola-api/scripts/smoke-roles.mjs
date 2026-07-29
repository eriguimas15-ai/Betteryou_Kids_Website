/**
 * Smoke HTTP por perfil (cookies HttpOnly) — só Node built-ins.
 * Uso: node scripts/smoke-roles.mjs
 * Requer API em http://127.0.0.1:3001 e seed actualizado.
 */
const API = process.env.API_BASE || "http://127.0.0.1:3001/api";

const ACCOUNTS = [
  {
    label: "ADMIN",
    email: "admin@betteryoukids.com",
    password: "Admin123!",
    expectModules: ["dashboard", "acessos", "financeiro"],
  },
  {
    label: "COMUNICACAO",
    email: "comunicacao@betteryoukids.com",
    password: "Comunica123!",
    expectModules: ["comunicados", "conteudo"],
  },
  {
    label: "DIRECAO",
    email: "direcao@betteryoukids.com",
    password: "Direcao123!",
    expectModules: ["painel", "financeiro", "auditoria"],
  },
  {
    label: "COORDENACAO",
    email: "coordenacao@betteryoukids.com",
    password: "Coordena123!",
    expectModules: ["academico", "turmas", "relatorios"],
  },
  {
    label: "ENCARREGADO",
    email: "encarregado@betteryoukids.com",
    password: "Encarrega123!",
    expectModules: ["portal", "ficha"],
    minePath: "/financeiro/mine/invoices",
  },
];

/** Extrai pares name=value de Set-Cookie (incl. getSetCookie). */
function collectCookies(res, jar) {
  const raw =
    typeof res.headers.getSetCookie === "function"
      ? res.headers.getSetCookie()
      : res.headers.get("set-cookie")
        ? [res.headers.get("set-cookie")]
        : [];
  for (const line of raw) {
    const part = String(line).split(";")[0];
    const eq = part.indexOf("=");
    if (eq <= 0) continue;
    const name = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    // Max-Age=0 / empty → remove
    if (
      /Max-Age=0/i.test(line) ||
      /Expires=Thu, 01 Jan 1970/i.test(line) ||
      value === ""
    ) {
      delete jar[name];
    } else {
      jar[name] = value;
    }
  }
}

function cookieHeader(jar) {
  return Object.entries(jar)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

async function api(jar, path, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };
  const cookie = cookieHeader(jar);
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  collectCookies(res, jar);
  let body = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await res.json().catch(() => null);
  }
  return { res, body };
}

async function smokeAccount(account) {
  const jar = {};
  const result = {
    label: account.label,
    login: "—",
    me: "—",
    modules: "—",
    mine: account.minePath ? "—" : "n/a",
    logout: "—",
    afterLogout: "—",
    ok: false,
  };

  try {
    const { res: loginRes, body: loginBody } = await api(jar, "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: account.email,
        password: account.password,
      }),
    });
    if ((loginRes.status !== 200 && loginRes.status !== 201) || !jar.by_access_token) {
      result.login = `FAIL ${loginRes.status}${jar.by_access_token ? "" : " (sem cookie)"}`;
      return result;
    }
    if (loginBody?.accessToken || loginBody?.refreshToken) {
      result.login = "FAIL tokens no JSON";
      return result;
    }
    result.login = "OK";

    const { res: meRes, body: me } = await api(jar, "/auth/me");
    if (meRes.status !== 200 || me?.role !== account.label) {
      result.me = `FAIL ${meRes.status} role=${me?.role}`;
      return result;
    }
    result.me = "OK";

    const modules = Array.isArray(me.modules) ? me.modules : [];
    const missing = account.expectModules.filter((m) => !modules.includes(m));
    if (missing.length) {
      result.modules = `FAIL missing ${missing.join(",")}`;
      return result;
    }
    result.modules = `OK (${modules.length})`;

    if (account.minePath) {
      const { res: mineRes } = await api(jar, account.minePath);
      if (mineRes.status !== 200) {
        result.mine = `FAIL ${mineRes.status}`;
        return result;
      }
      result.mine = "OK";
    }

    const { res: logoutRes } = await api(jar, "/auth/logout", {
      method: "POST",
    });
    if (logoutRes.status !== 200 && logoutRes.status !== 201) {
      result.logout = `FAIL ${logoutRes.status}`;
      return result;
    }
    result.logout = "OK";

    const { res: after } = await api(jar, "/auth/me");
    if (after.status !== 401) {
      result.afterLogout = `FAIL ${after.status}`;
      return result;
    }
    result.afterLogout = "OK";
    result.ok = true;
  } catch (err) {
    result.login = `ERR ${err instanceof Error ? err.message : String(err)}`;
  }
  return result;
}

async function main() {
  const results = [];
  for (const account of ACCOUNTS) {
    results.push(await smokeAccount(account));
  }

  console.log(
    "| Perfil | Login | /auth/me | Módulos | /mine | Logout | Pós-logout |",
  );
  console.log(
    "|--------|-------|----------|---------|-------|--------|------------|",
  );
  for (const r of results) {
    console.log(
      `| ${r.label} | ${r.login} | ${r.me} | ${r.modules} | ${r.mine} | ${r.logout} | ${r.afterLogout} |`,
    );
  }
  const failed = results.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\nFalhas: ${failed.map((f) => f.label).join(", ")}`);
    process.exit(1);
  }
  console.log("\nSmoke de perfis: OK");
}

main();
