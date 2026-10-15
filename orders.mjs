export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const data = await req.json();
    const name = String(data.name || "").trim();
    const phone = String(data.phone || "").trim();
    const delivery = String(data.delivery || "").trim();
    const quantity = Math.max(1, Math.min(10, Number(data.quantity) || 1));
    if (name.length < 2 || phone.length < 7 || delivery.length < 4) {
      return Response.json({ ok: false, error: "Перевірте ім’я, телефон і дані доставки." }, { status: 400 });
    }
    const order = {
      name, phone, delivery,
      color: String(data.color || "Не вказано"),
      quantity, total: 2290 * quantity,
      status: "Новий"
    };
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return Response.json({ ok:false, error:"Система замовлень ще налаштовується. Спробуйте пізніше." }, {status:503});
    const saved = await fetch(`${url}/rest/v1/orders`, {
      method: "POST",
      headers: { apikey:key, Authorization:`Bearer ${key}`, "Content-Type":"application/json", Prefer:"return=representation" },
      body: JSON.stringify(order)
    });
    if (!saved.ok) throw new Error("Не вдалося зберегти замовлення.");
    const rows = await saved.json();
    const created = rows[0];
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (token && chat) {
      const message = `🛒 Нове замовлення VOLT\\n№ ${created.id}\\nІм’я: ${name}\\nТелефон: ${phone}\\nДоставка: ${delivery}\\nКолір: ${order.color}\\nКількість: ${quantity}\\nСума: ${order.total} грн`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({chat_id:chat,text:message})
      });
    }
    return Response.json({ok:true,id:created.id}, {status:201});
  } catch (e) {
    return Response.json({ok:false,error:e.message || "Помилка сервера."},{status:500});
  }
};
