/* eslint-env node */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { buildSync } = require("esbuild");
const path = require("node:path");

function load(file, env = {}) {
  const result = buildSync({
    entryPoints: [path.join(__dirname, "..", file)],
    bundle: true,
    format: "cjs",
    platform: "node",
    write: false,
    external: ["pinia", "vue"], // dùng chung một bản pinia/vue giữa các module
    define: { "import.meta.env": JSON.stringify(env) },
  });
  const holder = { exports: {} };
  new Function("module", "exports", "require", result.outputFiles[0].text)(holder, holder.exports, require);
  return holder.exports;
}

const memory = () => {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, v), removeItem: (k) => map.delete(k) };
};
global.localStorage = memory();
global.sessionStorage = memory();
global.window = { location: { protocol: "https:" }, dispatchEvent() {}, addEventListener() {} };

const { createPinia, setActivePinia } = require("pinia");

test("extractRole và homeFor ánh xạ vai trò backend sang vai trò giao diện", () => {
  const { extractRole, homeFor } = load("src/stores/auth.js");
  assert.equal(extractRole(null), "guest");
  assert.equal(extractRole({ role: "KHACH_HANG" }), "customer");
  assert.equal(extractRole({ vaiTro: "NHAN_VIEN_SAN" }), "staff_onsite");
  assert.equal(extractRole({ user: { role: "ROLE_ADMIN" } }), "admin");
  assert.equal(homeFor("admin"), "/admin/dashboard");
  assert.equal(homeFor("customer"), "/");
});

test("auth store: đăng xuất xóa phiên và đổi vai trò về guest", () => {
  const { useAuthStore } = load("src/stores/auth.js");
  setActivePinia(createPinia());
  localStorage.setItem("phien", JSON.stringify({ role: "ADMIN", hoTen: "a@b.c" }));
  const auth = useAuthStore();
  auth.sync();
  assert.equal(auth.role, "admin");
  assert.equal(auth.isOperations, true);
  assert.equal(auth.displayName, "a");
  auth.logout();
  assert.equal(auth.role, "guest");
  assert.equal(auth.isLoggedIn, false);
});

test("booking store: chọn khung giờ, tính tổng tiền và chặn chọn khung đã đặt", async () => {
  const { useBookingStore } = load("src/stores/booking.js");
  setActivePinia(createPinia());
  global.fetch = async () =>
    new Response(
      JSON.stringify([
        { khungGioId: 1, gioBatDau: "07:00:00", gioKetThuc: "08:00:00", gia: 200000, trangThai: "TRONG" },
        { khungGioId: 2, gioBatDau: "08:00:00", gioKetThuc: "09:00:00", gia: 250000, trangThai: "booked" },
      ]),
      { headers: { "content-type": "application/json" } },
    );
  const cart = useBookingStore();
  cart.open(5);
  await cart.loadSlots();
  assert.equal(cart.slots.length, 2);
  assert.equal(cart.slots[0].gioBatDauDisplay, "07:00");
  assert.equal(cart.availableCount, 1);
  assert.equal(cart.canSubmit, false);
  cart.selectSlot(cart.slots[1]); // đã đặt -> không chọn được
  assert.equal(cart.selectedSlot, null);
  cart.selectSlot(cart.slots[0]);
  assert.equal(cart.total, 200000);
  assert.equal(cart.canSubmit, true);
  cart.setDate("2099-01-01"); // đổi ngày -> bỏ chọn
  assert.equal(cart.selectedSlot, null);
  assert.equal(cart.total, 0);
});

test("booking store: lỗi 409 khi đặt sân sẽ bỏ chọn khung giờ", async () => {
  const { useBookingStore } = load("src/stores/booking.js");
  setActivePinia(createPinia());
  localStorage.setItem("token", "t");
  let call = 0;
  global.fetch = async (url) => {
    if (String(url).includes("lich-trong")) {
      return new Response(JSON.stringify([{ khungGioId: 1, gia: 100, trangThai: "TRONG" }]), { headers: { "content-type": "application/json" } });
    }
    call++;
    return new Response(JSON.stringify({ message: "Khung giờ đã được đặt" }), { status: 409 });
  };
  const cart = useBookingStore();
  cart.open(1);
  await cart.loadSlots();
  cart.selectSlot(cart.slots[0]);
  await assert.rejects(cart.checkout(), (err) => err.status === 409);
  assert.equal(call, 1);
  assert.equal(cart.selectedSlot, null);
  assert.equal(cart.submitting, false);
  localStorage.removeItem("token");
});

test("courts store: bộ lọc computed theo từ khóa không dấu và loại sân", async () => {
  const { useCourtsStore } = load("src/stores/courts.js");
  setActivePinia(createPinia());
  global.fetch = async () =>
    new Response(
      JSON.stringify([
        { id: 1, tenSan: "Đông Đô", cumSanId: 7, tenCumSan: "Cụm A", loaiSan: "Sân 5", giaThapNhat: 200 },
        { id: 2, tenSan: "Tây Bắc", cumSanId: 8, tenCumSan: "Cụm B", loaiSan: "Sân 7", giaThapNhat: 100 },
      ]),
      { headers: { "content-type": "application/json" } },
    );
  const courts = useCourtsStore();
  await courts.load();
  assert.equal(courts.filtered.length, 2);
  courts.filters.keyword = "dong do";
  assert.deepEqual(courts.filtered.map((c) => c.id), [1]);
  courts.resetFilters();
  courts.filters.type = "Sân 7";
  assert.deepEqual(courts.filtered.map((c) => c.id), [2]);
  assert.deepEqual(courts.types.sort(), ["Sân 5", "Sân 7"]);
  assert.equal(courts.clusters.length, 2);
});

test("aiApi: dựng system prompt từ danh sách sân và gọi Gemini đúng định dạng", async () => {
  const env = { VITE_AI_PROVIDER: "gemini", VITE_AI_API_KEY: "test-key", VITE_AI_MODEL: "demo-model" };
  const { aiApi, buildSystemPrompt, AI_CONFIGURED } = load("src/api/aiApi.js", env);
  assert.equal(AI_CONFIGURED, true);
  const prompt = buildSystemPrompt([{ tenSan: "Sân Alpha", tenCumSan: "Cụm A", loaiSan: "Sân 5", giaThapNhat: 150000, trangThai: "HOAT_DONG" }]);
  assert.match(prompt, /Sân Alpha/);
  assert.match(prompt, /150\.000đ\/giờ/);
  let seen;
  global.fetch = async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Bạn thử Sân Alpha nhé." }] } }] }));
  };
  const reply = await aiApi.chat([{ role: "user", text: "Gợi ý sân" }], prompt);
  assert.equal(reply, "Bạn thử Sân Alpha nhé.");
  assert.match(seen.url, /models\/demo-model:generateContent$/);
  assert.equal(seen.options.headers["x-goog-api-key"], "test-key");
  const body = JSON.parse(seen.options.body);
  assert.equal(body.contents[0].role, "user");
  assert.equal(body.systemInstruction.parts[0].text, prompt);
});

test("aiApi: gọi OpenAI khi chọn provider openai và báo lỗi khi thiếu khóa", async () => {
  const { aiApi } = load("src/api/aiApi.js", { VITE_AI_PROVIDER: "openai", VITE_AI_API_KEY: "k" });
  let seen;
  global.fetch = async (url, options) => {
    seen = { url, options };
    return new Response(JSON.stringify({ choices: [{ message: { content: "Xin chào" } }] }));
  };
  assert.equal(await aiApi.chat([{ role: "user", text: "hi" }], "sys"), "Xin chào");
  assert.match(seen.url, /api\.openai\.com/);
  assert.equal(JSON.parse(seen.options.body).messages[0].role, "system");
  const missing = load("src/api/aiApi.js", {});
  await assert.rejects(missing.aiApi.chat([], "x"), /VITE_AI_API_KEY/);
});
