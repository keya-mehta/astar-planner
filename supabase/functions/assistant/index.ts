// Quire assistant: answers study questions and proposes changes to the student's plan.
// Deploy in Supabase: Edge Functions → Deploy a new function → name it "assistant" → paste this file.
// Secrets (Edge Functions → Secrets): ANTHROPIC_API_KEY (required), ALLOWED_EMAILS (optional, comma-separated), MODEL (optional).

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TOOLS = [
  { name: "add_event", description: "Block out time for something the student is doing (sport, tuition change, appointment, outing). Use weekly=true only when it repeats every week.",
    input_schema: { type: "object", properties: { title: { type: "string" }, date: { type: "string", description: "YYYY-MM-DD" }, start: { type: "string", description: "HH:MM 24h" }, end: { type: "string", description: "HH:MM 24h" }, weekly: { type: "boolean" } }, required: ["title", "date", "start", "end"] } },
  { name: "mark_day", description: "Mark a whole day as a school holiday (no classes, full study day) or as away (nothing planned).",
    input_schema: { type: "object", properties: { date: { type: "string" }, kind: { type: "string", enum: ["holiday", "away"] }, title: { type: "string" } }, required: ["date", "kind"] } },
  { name: "cancel_classes", description: "Cancel classes or tuition on one date. Give subject to cancel only that subject. tuition_only=true cancels only tuition.",
    input_schema: { type: "object", properties: { date: { type: "string" }, subject: { type: "string" }, tuition_only: { type: "boolean" } }, required: ["date"] } },
  { name: "add_homework", description: "Add homework with its due date and how many minutes it will take.",
    input_schema: { type: "object", properties: { title: { type: "string" }, subject: { type: "string", description: "One of the student's subjects" }, due: { type: "string" }, minutes: { type: "number" } }, required: ["title", "subject", "due", "minutes"] } },
  { name: "add_test", description: "Add an upcoming test or exam.",
    input_schema: { type: "object", properties: { title: { type: "string" }, subject: { type: "string" }, date: { type: "string" }, time: { type: "string" }, minutes: { type: "number", description: "Length of the test" } }, required: ["title", "subject", "date"] } },
  { name: "move_test", description: "Move an existing test to a new date.",
    input_schema: { type: "object", properties: { title: { type: "string", description: "Exact title of the existing test" }, date: { type: "string" }, time: { type: "string" } }, required: ["title", "date"] } },
  { name: "update_settings", description: "Change daily study amounts or the time studying must stop.",
    input_schema: { type: "object", properties: { stop_by: { type: "string", description: "HH:MM" }, study_school_day_min: { type: "number" }, study_day_off_min: { type: "number" } } } },
];

function system(ctx: unknown) {
  return `You are the assistant inside Quire, a study planner used by a school student.
You do two things:
1. Help with changes to their schedule. When they describe a change, call the matching tool. The student confirms every change in the app, so propose it directly without asking for permission, then add one short sentence saying what you proposed. Ask a short question only if a needed detail (date, time, subject) is missing.
2. Help with study doubts. Explain clearly and step by step at school level, with a small example where it helps. For homework or exam questions, guide them to the answer and check their working rather than only handing over the final answer, unless they ask you to check an answer they already have.
Keep replies short and plain. Use only the schedule facts in the context below; never invent classes, tests or homework. Times are 24-hour, dates are YYYY-MM-DD, and the week starts on Monday.
Keep everything appropriate for a school student. If they seem stressed or overwhelmed, be kind and suggest a manageable next step; if they mention anything about being unsafe, encourage them to talk to a parent, teacher or another trusted adult.

Student's planner (JSON):
${JSON.stringify(ctx)}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
  try {
    const key = Deno.env.get("ANTHROPIC_API_KEY");
    if (!key) return json({ text: "The assistant service is missing its API key." });

    const allowed = (Deno.env.get("ALLOWED_EMAILS") || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (allowed.length) {
      const auth = req.headers.get("Authorization") || "";
      const r = await fetch(`${Deno.env.get("SUPABASE_URL")}/auth/v1/user`, { headers: { Authorization: auth, apikey: Deno.env.get("SUPABASE_ANON_KEY") || "" } });
      const u = r.ok ? await r.json() : null;
      if (!u?.email || !allowed.includes(String(u.email).toLowerCase())) return json({ text: "This account isn't allowed to use the assistant." }, 403);
    }

    const { messages = [], context = {} } = await req.json();
    const msgs = (messages as { role: string; content: string }[])
      .filter((m) => m && typeof m.content === "string" && m.content.trim())
      .slice(-12)
      .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content.slice(0, 4000) }));
    while (msgs.length && msgs[0].role !== "user") msgs.shift();
    if (!msgs.length) return json({ text: "" });

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: Deno.env.get("MODEL") || "claude-sonnet-5-5", max_tokens: 1200, system: system(context), tools: TOOLS, messages: msgs }),
    });
    if (!res.ok) return json({ text: "The assistant is unavailable right now. Try again in a minute." }, 502);
    const data = await res.json();
    const text = (data.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n").trim();
    const actions = (data.content || []).filter((c: { type: string }) => c.type === "tool_use").map((c: { name: string; input: unknown }) => ({ name: c.name, input: c.input }));
    return json({ text, actions });
  } catch (_e) {
    return json({ text: "Something went wrong. Try again." }, 500);
  }
});
