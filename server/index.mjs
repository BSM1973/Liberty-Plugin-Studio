import { createServer } from 'node:http';
const port = Number(process.env.PORT || 8787);
const key = process.env.OPENAI_API_KEY;
const allowedThemes = new Set(['midnight','graphite','copper']);
const readBody = async (req) => {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (raw.length > 12000) throw new Error('Description trop longue.');
  }
  return JSON.parse(raw);
};
const reply = (res,status,body) => {
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'same-origin'});
  res.end(JSON.stringify(body));
};
createServer(async (req,res) => {
  if (req.url !== '/api/generate-ui' || req.method !== 'POST') return reply(res,404,{error:'Route inconnue.'});
  if (!key) return reply(res,503,{error:'Le service IA n’est pas configuré. Ajoutez OPENAI_API_KEY sur le serveur.'});
  try {
    const {description,theme} = await readBody(req);
    if (typeof description !== 'string' || !description.trim() || description.length > 2000 || !allowedThemes.has(theme)) return reply(res,400,{error:'Description ou thème invalide.'});
    const palette = {midnight:'midnight blue and brushed steel',graphite:'graphite and dark aluminum',copper:'dark copper and bronze'}[theme];
    const prompt = 'Create a high-end professional virtual audio plugin front panel artwork, straight-on view, landscape 3:2, premium material realism, '+palette+'. Musical software concept: '+description+'. Crisp visual hierarchy, elegant labeled module zones, clean negative space for overlaying functional UI controls. No physical device, no perspective, no hands, no watermark. This image is a decorative background; functional knobs and buttons will be overlaid separately.';
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),110000);
    let upstream;
    try {
      upstream = await fetch('https://api.openai.com/v1/images/generations',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-1',prompt,size:'1536x1024',quality:'medium',n:1})});
    } finally {clearTimeout(timer)}
    if (!upstream.ok) return reply(res,502,{error:'Le fournisseur IA a refusé la génération (HTTP '+upstream.status+'). Vérifiez la configuration, les droits et le crédit API.'});
    const data = await upstream.json();
    const encoded = data?.data?.[0]?.b64_json;
    if (typeof encoded !== 'string' || !encoded) return reply(res,502,{error:'Le fournisseur IA n’a pas renvoyé d’image.'});
    return reply(res,200,{image:'data:image/png;base64,'+encoded});
  } catch (err) {
    return reply(res,err?.name==='AbortError'?504:400,{error:err?.name==='AbortError'?'Le délai de génération est dépassé.':err instanceof SyntaxError?'Requête JSON invalide.':err?.message||'Erreur de génération.'});
  }
}).listen(port,'127.0.0.1',()=>console.log('Liberty AI backend listening on 127.0.0.1:'+port));
