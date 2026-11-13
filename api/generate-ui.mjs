// Vercel serverless endpoint. Never expose OPENAI_API_KEY to the browser.
const themes={midnight:'midnight blue and brushed steel',graphite:'graphite and dark aluminum',copper:'dark copper and bronze'};
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Méthode non autorisée.'});}
  const key=process.env.OPENAI_API_KEY;
  if(!key)return res.status(503).json({error:'La clé IA doit être configurée dans les variables privées du site.'});
  const {description,theme}=req.body||{};
  if(typeof description!=='string'||!description.trim()||description.length>2000||!Object.hasOwn(themes,theme))return res.status(400).json({error:'Description ou ambiance graphique invalide.'});
  const prompt='Professional premium virtual audio software plugin front-panel artwork, perfectly straight-on landscape composition, sophisticated material realism, '+themes[theme]+'. Concept: '+description+'. Balanced visual hierarchy, clean module zones, empty space for functional knobs and buttons to be overlaid, beautiful premium typography where possible. No hands, no physical device, no perspective, no watermark.';
  try{
    const response=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-1',prompt,size:'1536x1024',quality:'medium',n:1}),signal:AbortSignal.timeout(110000)});
    if(!response.ok)return res.status(502).json({error:'Le fournisseur IA a refusé la demande (HTTP '+response.status+'). Vérifie les crédits et les autorisations du compte.'});
    const data=await response.json();
    const b64=data?.data?.[0]?.b64_json;
    if(typeof b64!=='string'||!b64)return res.status(502).json({error:'Aucune image reçue du fournisseur IA.'});
    return res.status(200).json({image:'data:image/png;base64,'+b64});
  }catch(e){return res.status(502).json({error:e?.name==='TimeoutError'?'Génération trop longue. Réessaie.':'Impossible de joindre le service IA.'});}
}
