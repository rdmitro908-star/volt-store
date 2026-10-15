export default async (req) => {
  const password = process.env.ADMIN_PASSWORD;
  const supplied = req.headers.get("x-admin-password");
  if (!password || supplied !== password) return Response.json({error:"Невірний пароль адміністратора."},{status:401});
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return Response.json({error:"Базу даних ще не підключено."},{status:503});
  if (req.method === "GET") {
    const r = await fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc`, {headers:{apikey:key,Authorization:`Bearer ${key}`}});
    if (!r.ok) return Response.json({error:"Не вдалося завантажити замовлення."},{status:500});
    return Response.json(await r.json());
  }
  if (req.method === "PATCH") {
    const {id,status} = await req.json();
    const allowed = ["Новий","Підтверджений","Відправлений","Доставлений","Скасований"];
    if (!allowed.includes(status)) return Response.json({error:"Невідомий статус."},{status:400});
    const r = await fetch(`${url}/rest/v1/orders?id=eq.${encodeURIComponent(id)}`, {
      method:"PATCH",headers:{apikey:key,Authorization:`Bearer ${key}`,"Content-Type":"application/json",Prefer:"return=representation"},
      body:JSON.stringify({status})
    });
    if (!r.ok) return Response.json({error:"Не вдалося оновити статус."},{status:500});
    return Response.json(await r.json());
  }
  return new Response("Method not allowed",{status:405});
};
