/**
 * Smoke CRUD crítico (cookies HttpOnly) — só Node built-ins.
 * Uso: node scripts/smoke-crud.mjs
 * Requer API em http://127.0.0.1:3001 e seed actualizado.
 *
 * ADMIN: listagens + rascunho de comunicado + inscrição/upload/docs + cleanup
 * ENCARREGADO: GET /mine (financeiro, comunicados, inscrições)
 */
import { Buffer } from "node:buffer";

const API = process.env.API_BASE || "http://127.0.0.1:3001/api";

const ADMIN = {
  email: "admin@betteryoukids.com",
  password: "Admin123!",
};
const GUARDIAN = {
  email: "encarregado@betteryoukids.com",
  password: "Encarrega123!",
};

/** PNG 1x1 mínimo válido */
const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

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
  const headers = { ...(options.headers || {}) };
  const cookie = cookieHeader(jar);
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(`${API}${path}`, { ...options, headers });
  collectCookies(res, jar);
  let body = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    body = await res.json().catch(() => null);
  } else if (!options.raw) {
    body = await res.text().catch(() => null);
  }
  return { res, body };
}

async function login(account) {
  const jar = {};
  const { res, body } = await api(jar, "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: account.email,
      password: account.password,
    }),
  });
  if ((res.status !== 200 && res.status !== 201) || !jar.by_access_token) {
    throw new Error(
      `login FAIL ${res.status}${jar.by_access_token ? "" : " (sem cookie)"}`,
    );
  }
  if (body?.accessToken || body?.refreshToken) {
    throw new Error("login FAIL tokens no JSON");
  }
  return jar;
}

function ok(label, detail = "OK") {
  return { label, detail, ok: true };
}
function fail(label, detail) {
  return { label, detail: String(detail), ok: false };
}

async function stepAdminLists(jar) {
  const results = [];

  const units = await api(jar, "/units");
  if (units.res.status !== 200 || !Array.isArray(units.body) || !units.body.length) {
    results.push(fail("GET /units", `${units.res.status} len=${units.body?.length}`));
    return { results, ctx: null };
  }
  results.push(ok("GET /units", `OK (${units.body.length})`));

  const years = await api(jar, "/academic-years");
  if (years.res.status !== 200 || !Array.isArray(years.body) || !years.body.length) {
    results.push(fail("GET /academic-years", `${years.res.status}`));
    return { results, ctx: null };
  }
  results.push(ok("GET /academic-years", `OK (${years.body.length})`));

  const active = await api(jar, "/academic-years/active");
  if (active.res.status !== 200 || !active.body?.label) {
    results.push(fail("GET /academic-years/active", `${active.res.status}`));
    return { results, ctx: null };
  }
  results.push(ok("GET /academic-years/active", active.body.label));

  const rooms = await api(jar, "/rooms");
  if (rooms.res.status !== 200 || !Array.isArray(rooms.body)) {
    results.push(fail("GET /rooms", `${rooms.res.status}`));
    return { results, ctx: null };
  }
  results.push(ok("GET /rooms", `OK (${rooms.body.length})`));

  const classes = await api(jar, "/classes");
  if (classes.res.status !== 200 || !Array.isArray(classes.body)) {
    results.push(fail("GET /classes", `${classes.res.status}`));
    return { results, ctx: null };
  }
  results.push(ok("GET /classes", `OK (${classes.body.length})`));

  const unit =
    units.body.find((u) => /patriota/i.test(u.name || "")) || units.body[0];
  return {
    results,
    ctx: {
      yearLabel: active.body.label,
      unitName: unit.name,
      unitId: unit.id,
    },
  };
}

async function stepCommunicationDraft(jar) {
  const results = [];
  const stamp = Date.now();
  const title = `[smoke-crud] Rascunho ${stamp}`;

  const created = await api(jar, "/communications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title,
      body: "Comunicado de teste automatizado — eliminar após smoke.",
      audience: "ESCOLA",
      status: "RASCUNHO",
    }),
  });
  if (
    (created.res.status !== 200 && created.res.status !== 201) ||
    !created.body?.id
  ) {
    results.push(
      fail(
        "POST /communications (rascunho)",
        `${created.res.status} ${JSON.stringify(created.body)?.slice(0, 120)}`,
      ),
    );
    return results;
  }
  results.push(ok("POST /communications (rascunho)", created.body.id));

  const list = await api(jar, "/communications");
  const found =
    Array.isArray(list.body) &&
    list.body.some((c) => c.id === created.body.id || c.title === title);
  if (list.res.status !== 200 || !found) {
    results.push(fail("GET /communications (lista)", `${list.res.status}`));
  } else {
    results.push(ok("GET /communications (lista)", "OK (rascunho presente)"));
  }

  const patched = await api(jar, `/communications/${created.body.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: `${title} (editado)` }),
  });
  if (patched.res.status !== 200 && patched.res.status !== 201) {
    results.push(fail("PATCH /communications/:id", `${patched.res.status}`));
  } else {
    results.push(ok("PATCH /communications/:id", "OK"));
  }

  const removed = await api(jar, `/communications/${created.body.id}`, {
    method: "DELETE",
  });
  if (removed.res.status !== 200 && removed.res.status !== 201) {
    results.push(
      fail("DELETE /communications/:id (cleanup)", `${removed.res.status}`),
    );
  } else {
    results.push(ok("DELETE /communications/:id (cleanup)", "OK"));
  }

  return results;
}

async function stepEnrollmentUpload(jar, ctx) {
  const results = [];
  if (!ctx?.yearLabel || !ctx?.unitName) {
    results.push(fail("enrollment", "contexto em falta (ano/unidade)"));
    return results;
  }

  const stamp = Date.now();
  const payload = {
    yearLabel: ctx.yearLabel,
    unitName: ctx.unitName,
    serviceName: "Creche",
    childFullName: `Smoke CRUD ${stamp}`,
    childBirthDate: "2023-03-15",
    childSex: "F",
    childBirthPlace: "Luanda",
    childNationality: "Angolana",
    childAddress: "Rua Smoke 1, Luanda",
    guardianFullName: "Encarregado Smoke",
    guardianIdNumber: "SMK123456",
    guardianPhone: "900000001",
    guardianEmail: `smoke-crud-${stamp}@example.com`,
    guardianProfession: "Teste",
    guardianRelationship: "Mãe",
    guardianAddress: "Rua Smoke 1, Luanda",
    emergencyName: "Contacto Smoke",
    emergencyPhone: "900000002",
    emergencyRelation: "Tia",
    allergies: "Nenhuma",
    medication: "Nenhuma",
    foodRestrictions: "Nenhuma",
  };

  const created = await api(jar, "/enrollments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (
    (created.res.status !== 200 && created.res.status !== 201) ||
    !created.body?.id ||
    !created.body?.uploadToken
  ) {
    results.push(
      fail(
        "POST /enrollments",
        `${created.res.status} ${JSON.stringify(created.body)?.slice(0, 180)}`,
      ),
    );
    return results;
  }
  results.push(
    ok(
      "POST /enrollments",
      `id=${created.body.id} estado=${created.body.estado || created.body.status}`,
    ),
  );

  const form = new FormData();
  form.append(
    "file",
    new Blob([TINY_PNG], { type: "image/png" }),
    "smoke-doc.png",
  );
  form.append("type", "foto");
  form.append("uploadToken", created.body.uploadToken);

  const upload = await api(jar, `/enrollments/${created.body.id}/documents`, {
    method: "POST",
    body: form,
  });
  if (upload.res.status !== 200 && upload.res.status !== 201) {
    results.push(
      fail(
        "POST /enrollments/:id/documents",
        `${upload.res.status} ${JSON.stringify(upload.body)?.slice(0, 160)}`,
      ),
    );
  } else {
    results.push(ok("POST /enrollments/:id/documents", "OK (png)"));
  }

  const docs = await api(
    jar,
    `/enrollments/${created.body.id}/documents?uploadToken=${encodeURIComponent(created.body.uploadToken)}`,
  );
  const docCount = Array.isArray(docs.body)
    ? docs.body.length
    : Array.isArray(docs.body?.documents)
      ? docs.body.documents.length
      : 0;
  if (docs.res.status !== 200 || docCount < 1) {
    results.push(
      fail("GET /enrollments/:id/documents", `${docs.res.status} count=${docCount}`),
    );
  } else {
    results.push(ok("GET /enrollments/:id/documents", `OK (${docCount})`));
  }

  const removed = await api(jar, `/enrollments/${created.body.id}`, {
    method: "DELETE",
  });
  if (removed.res.status !== 200 && removed.res.status !== 201) {
    results.push(
      fail("DELETE /enrollments/:id (cleanup)", `${removed.res.status}`),
    );
  } else {
    results.push(ok("DELETE /enrollments/:id (cleanup)", "OK"));
  }

  return results;
}

async function stepGuardianMine() {
  const results = [];
  let jar;
  try {
    jar = await login(GUARDIAN);
    results.push(ok("ENCARREGADO login", "OK"));
  } catch (err) {
    results.push(fail("ENCARREGADO login", err.message));
    return results;
  }

  const paths = [
    "/financeiro/mine/invoices",
    "/communications/mine",
    "/enrollments/mine",
    "/nee/mine",
  ];
  for (const path of paths) {
    const { res } = await api(jar, path);
    if (res.status !== 200) {
      results.push(fail(`GET ${path}`, `${res.status}`));
    } else {
      results.push(ok(`GET ${path}`, "OK"));
    }
  }

  await api(jar, "/auth/logout", { method: "POST" });
  return results;
}

async function main() {
  const all = [];
  let jar;
  try {
    jar = await login(ADMIN);
    all.push(ok("ADMIN login", "OK"));
  } catch (err) {
    all.push(fail("ADMIN login", err.message));
    printTable(all);
    process.exit(1);
  }

  const { results: listResults, ctx } = await stepAdminLists(jar);
  all.push(...listResults);
  all.push(...(await stepCommunicationDraft(jar)));
  all.push(...(await stepEnrollmentUpload(jar, ctx)));
  await api(jar, "/auth/logout", { method: "POST" });
  all.push(...(await stepGuardianMine()));

  printTable(all);
  const failed = all.filter((r) => !r.ok);
  if (failed.length) {
    console.error(`\nFalhas: ${failed.map((f) => f.label).join(", ")}`);
    process.exit(1);
  }
  console.log("\nSmoke CRUD: OK");
}

function printTable(rows) {
  console.log("| Passo | Resultado |");
  console.log("|-------|-----------|");
  for (const r of rows) {
    console.log(`| ${r.label} | ${r.detail} |`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
