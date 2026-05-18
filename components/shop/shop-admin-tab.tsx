"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { createProductAction, deleteProductAction } from "@/lib/admin-actions";
import { uploadImageToStorage } from "@/lib/supabase-queries";

const ORDER_STATUSES = ["pending","awaiting_payment","paid","processing","shipped","delivered","cancelled"];
const STATUS_COLORS: Record<string, string> = {
  pending:"bg-yellow-100 text-yellow-700",awaiting_payment:"bg-orange-100 text-orange-700",
  paid:"bg-green-100 text-green-700",processing:"bg-blue-100 text-blue-700",
  shipped:"bg-blue-100 text-blue-700",delivered:"bg-gray-100 text-gray-600",
  cancelled:"bg-red-100 text-red-700",requested:"bg-yellow-100 text-yellow-700",
  reviewing:"bg-blue-100 text-blue-700",quoted:"bg-purple-100 text-purple-700",
  approved:"bg-green-100 text-green-700",agreement_sent:"bg-orange-100 text-orange-700",
  agreed:"bg-green-100 text-green-700",in_progress:"bg-blue-100 text-blue-700",
  checking:"bg-yellow-100 text-yellow-700",completed:"bg-gray-100 text-gray-600",
  on_sale:"bg-green-100 text-green-700",sold_out:"bg-red-100 text-red-700",
  draft:"bg-gray-100 text-gray-500",
};

export function ShopAdminTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"products"|"orders"|"commissions">("products");
  const [showNew, setShowNew] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    nameJa:"",nameEn:"",descJa:"",descEn:"",price:"",
    type:"digital" as "digital"|"physical"|"skill",
    status:"draft" as "on_sale"|"sold_out"|"draft",
    stock:"",deliveryType:"file",deliveryContent:"",
    file:null as File|null,previewUrl:"",
  });

  const loadData = async () => {
    if (!supabase) return;
    const [{ data: p },{ data: o },{ data: c }] = await Promise.all([
      supabase.from("products").select("*").order("sort_order",{ascending:true}),
      supabase.from("orders").select("*").order("created_at",{ascending:false}),
      supabase.from("commissions").select("*").order("created_at",{ascending:false}),
    ]);
    if (p) setProducts(p);
    if (o) setOrders(o);
    if (c) setCommissions(c);
    setLoading(false);
  };

  useEffect(()=>{ loadData(); },[]);

  const resetForm = () => setForm({nameJa:"",nameEn:"",descJa:"",descEn:"",price:"",type:"digital",status:"draft",stock:"",deliveryType:"file",deliveryContent:"",file:null,previewUrl:""});

  const handleCreate = async () => {
    if (!form.nameJa && !form.nameEn) { alert("Name required"); return; }
    if (!form.price) { alert("Price required"); return; }
    setSubmitting(true);
    try {
      let image_url = null;
      if (form.file) image_url = await uploadImageToStorage("portfolio-images", form.file);
      await createProductAction({
        name_ja: form.nameJa||form.nameEn, name_en: form.nameEn||form.nameJa,
        description_ja: form.descJa||form.descEn||null, description_en: form.descEn||form.descJa||null,
        price: parseInt(form.price), type: form.type, status: form.status,
        stock: form.stock ? parseInt(form.stock) : null, image_url, sort_order: products.length,
      });
      if (form.type==="digital" && form.deliveryContent && supabase) {
        const { data: latest } = await supabase.from("products").select("id").order("created_at",{ascending:false}).limit(1).single();
        if (latest) {
          if (form.deliveryType==="activate_code") {
            const codes = form.deliveryContent.split("\n").map((c:string)=>c.trim()).filter(Boolean);
            await supabase.from("activate_codes").insert(codes.map((code:string)=>({product_id:latest.id,code})));
          } else {
            await supabase.from("digital_contents").insert({product_id:latest.id,delivery_type:form.deliveryType,content:form.deliveryContent});
          }
        }
      }
      await loadData(); setShowNew(false); resetForm();
    } catch(e:any) { alert("Error: "+e.message); }
    setSubmitting(false);
  };

  const updateOrderStatus = async (id:string,status:string) => {
    if (!supabase) return;
    await supabase.from("orders").update({status}).eq("id",id);
    setOrders(prev=>prev.map(o=>o.id===id?{...o,status}:o));
  };

  const updateCommissionStatus = async (id:string,status:string) => {
    if (!supabase) return;
    await supabase.from("commissions").update({status}).eq("id",id);
    setCommissions(prev=>prev.map(c=>c.id===id?{...c,status}:c));
  };

  if (loading) return <div className="py-8 text-center text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["products","orders","commissions"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab===t?"bg-white shadow-sm text-black":"text-gray-500 hover:text-black"}`}>
            {t==="products"?`Products (${products.length})`:t==="orders"?`Orders (${orders.length})`:`Commissions (${commissions.length})`}
          </button>
        ))}
      </div>

      {tab==="products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-widest text-gray-400">Products</h3>
            <button onClick={()=>setShowNew(true)} className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-gray-900">+ New Product</button>
          </div>
          {showNew && (
            <div className="border border-black rounded-2xl p-5 space-y-4 bg-gray-50">
              <div className="flex justify-between items-center">
                <h4 className="font-black text-sm">New Product</h4>
                <button onClick={()=>{setShowNew(false);resetForm();}} className="text-xs text-gray-400 hover:text-black">Cancel</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Name (JA) *</label>
                  <input type="text" value={form.nameJa} onChange={e=>setForm(f=>({...f,nameJa:e.target.value}))} placeholder="商品名"
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold focus:outline-none focus:border-black"/></div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Name (EN) *</label>
                  <input type="text" value={form.nameEn} onChange={e=>setForm(f=>({...f,nameEn:e.target.value}))} placeholder="Product Name"
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold focus:outline-none focus:border-black"/></div>
              </div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description (JA)</label>
                <textarea rows={2} value={form.descJa} onChange={e=>setForm(f=>({...f,descJa:e.target.value}))} placeholder="商品説明"
                  className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold resize-none focus:outline-none focus:border-black"/></div>
              <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Description (EN)</label>
                <textarea rows={2} value={form.descEn} onChange={e=>setForm(f=>({...f,descEn:e.target.value}))} placeholder="Product description"
                  className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold resize-none focus:outline-none focus:border-black"/></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Price (JPY) *</label>
                  <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="1500"
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold focus:outline-none focus:border-black"/></div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Type *</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value as any}))}
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold appearance-none focus:outline-none focus:border-black">
                    <option value="digital">Digital</option><option value="physical">Physical</option><option value="skill">Skill</option>
                  </select></div>
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as any}))}
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold appearance-none focus:outline-none focus:border-black">
                    <option value="draft">Draft</option><option value="on_sale">On Sale</option><option value="sold_out">Sold Out</option>
                  </select></div>
              </div>
              {form.type==="physical" && (
                <div><label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Stock</label>
                  <input type="number" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="10"
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold focus:outline-none focus:border-black"/></div>
              )}
              {form.type==="digital" && (
                <div className="space-y-2 pt-3 border-t border-black/5">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Digital Content</label>
                  <select value={form.deliveryType} onChange={e=>setForm(f=>({...f,deliveryType:e.target.value}))}
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold appearance-none focus:outline-none focus:border-black">
                    <option value="file">File URL (R2)</option><option value="activate_code">Activate Code(s)</option>
                    <option value="link">Link URL</option><option value="text">Text Content</option>
                  </select>
                  <textarea rows={3} value={form.deliveryContent} onChange={e=>setForm(f=>({...f,deliveryContent:e.target.value}))}
                    className="w-full p-3 bg-white border border-black/10 rounded-xl text-sm font-bold resize-none focus:outline-none focus:border-black"
                    placeholder={form.deliveryType==="activate_code"?"One code per line":form.deliveryType==="file"?"https://pub-xxx.r2.dev/file.pdf":"https://..."}/>
                  <p className="text-[10px] text-gray-400">Delivered to customer after purchase.</p>
                </div>
              )}
              <div className="pt-3 border-t border-black/5">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Product Image</label>
                {form.previewUrl && <img src={form.previewUrl} alt="" className="w-20 h-20 object-cover rounded-xl mb-2"/>}
                <input type="file" accept="image/*" onChange={e=>{const file=e.target.files?.[0];if(file)setForm(f=>({...f,file,previewUrl:URL.createObjectURL(file)}));}} className="text-xs"/>
              </div>
              <button onClick={handleCreate} disabled={submitting}
                className="w-full py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-900 disabled:opacity-50">
                {submitting?"Creating...":"Create Product"}
              </button>
            </div>
          )}
          <div className="space-y-2">
            {products.length===0 ? <p className="text-center py-8 text-gray-400 text-sm">No products yet</p> :
              products.map(p=>(
                <div key={p.id} className="flex items-center gap-4 p-4 border border-black/10 rounded-xl hover:border-black/30">
                  <div className="w-12 h-12 bg-gray-50 rounded-lg overflow-hidden shrink-0">
                    {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover"/> :
                      <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-gray-300">{p.type?.toUpperCase()}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.name_ja||p.name_en}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">{String.fromCharCode(165)}{p.price?.toLocaleString()}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status]||"bg-gray-100"}`}>{p.status}</span>
                      <span className="text-xs text-gray-400">{p.type}</span>
                    </div>
                  </div>
                  <button onClick={async()=>{if(!confirm("Delete?"))return;await deleteProductAction(p.id);await loadData();}}
                    className="text-xs text-red-400 hover:text-red-600 font-bold shrink-0">Delete</button>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab==="orders" && (
        <div className="space-y-3">
          {orders.length===0 ? <p className="text-center py-8 text-gray-400 text-sm">No orders yet</p> :
            orders.map(o=><OrderCard key={o.id} order={o} onStatusChange={updateOrderStatus}/>)}
            {false && orders.map(o=>(
              <div key={o.id} className="border border-black/10 rounded-xl p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-black text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
                    {o.shipping_name && <p className="text-xs text-gray-500 mt-1">{o.shipping_name} / {o.shipping_prefecture} {o.shipping_city}</p>}
                  </div>
                  <p className="font-black text-sm">{String.fromCharCode(165)}{o.total_price?.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[o.status]||"bg-gray-100"}`}>{o.status?.replace(/_/g," ")}</span>
                  <select value={o.status} onChange={e=>updateOrderStatus(o.id,e.target.value)}
                    className="text-xs border border-black/10 rounded-lg px-2 py-1 font-bold appearance-none focus:outline-none focus:border-black">
                    {ORDER_STATUSES.map(s=><option key={s} value={s}>{s.replace(/_/g," ")}</option>)}
                  </select>
                </div>
              </div>
            ))
          }
        </div>
      )}

      {tab==="commissions" && (
        <div className="space-y-3">
          {commissions.length===0 ? <p className="text-center py-8 text-gray-400 text-sm">No commission requests yet</p> :
            commissions.map(c=><CommissionCard key={c.id} c={c} onStatus={updateCommissionStatus}/>)
          }
        </div>
      )}
    </div>
  );
}

function CommissionCard({c,onStatus}:{c:any;onStatus:(id:string,status:string)=>void}) {
  const [quote,setQuote] = useState(c.quoted_price?.toString()||"");
  const [showQuote,setShowQuote] = useState(false);
  const [saving,setSaving] = useState(false);

  const saveQuote = async () => {
    if (!supabase||!quote) return;
    setSaving(true);
    await supabase.from("commissions").update({quoted_price:parseInt(quote),status:"quoted"}).eq("id",c.id);
    onStatus(c.id,"quoted");
    setShowQuote(false);
    setSaving(false);
  };

  return (
    <div className="border border-black/10 rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-black text-sm">#{c.id.slice(0,8).toUpperCase()}</p>
          <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${STATUS_COLORS[c.status]||"bg-gray-100"}`}>{c.status?.replace(/_/g," ")}</span>
      </div>
      <p className="text-sm text-gray-600 line-clamp-3">{c.detail}</p>
      <div className="flex gap-2 text-xs text-gray-400">
        {c.budget && <span>Budget: {String.fromCharCode(165)}{c.budget.toLocaleString()}</span>}
        {c.quoted_price && <span className="font-bold text-black">Quote: {String.fromCharCode(165)}{c.quoted_price.toLocaleString()}</span>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <select value={c.status} onChange={e=>onStatus(c.id,e.target.value)}
          className="text-xs border border-black/10 rounded-lg px-2 py-1 font-bold appearance-none focus:outline-none focus:border-black">
          {["requested","reviewing","quoted","approved","agreement_sent","agreed","in_progress","checking","completed","cancelled"].map(s=>(
            <option key={s} value={s}>{s.replace(/_/g," ")}</option>
          ))}
        </select>
        <button onClick={()=>setShowQuote(!showQuote)} className="text-xs border border-black/20 rounded-lg px-3 py-1 font-bold hover:border-black">
          {showQuote?"Cancel":"Set Quote"}
        </button>
      </div>
      {showQuote && (
        <div className="flex gap-2">
          <input type="number" value={quote} onChange={e=>setQuote(e.target.value)}
            className="flex-1 border border-black/20 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-black" placeholder="Quote (JPY)"/>
          <button onClick={saveQuote} disabled={saving}
            className="px-4 py-1.5 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-900 disabled:opacity-50">
            {saving?"...":"Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export function OrderCard({order: o, onStatusChange}: {order: any; onStatusChange: (id: string, status: string) => void}) {
  const [expanded, setExpanded] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState(o.tracking_number || '');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!expanded || !supabase || !o.user_id) return;
    supabase.from('user_profiles').select('*').eq('id', o.user_id).single()
      .then(({ data }) => { if (data) setProfile(data); });
  }, [expanded, o.user_id]);

  const ORDER_STATUSES = ["pending","awaiting_payment","paid","processing","shipped","delivered","cancelled"];
  const STATUS_COLORS: Record<string, string> = {
    pending:"bg-yellow-100 text-yellow-700",paid:"bg-green-100 text-green-700",
    processing:"bg-blue-100 text-blue-700",shipped:"bg-blue-100 text-blue-700",
    delivered:"bg-gray-100 text-gray-600",cancelled:"bg-red-100 text-red-700",
  };

  const saveTracking = async () => {
    if (!supabase || !trackingNumber) return;
    setSaving(true);
    await supabase.from('orders').update({tracking_number: trackingNumber, status: 'shipped'}).eq('id', o.id);
    onStatusChange(o.id, 'shipped');
    setSaving(false);
  };

  return (
    <div className={`border rounded-xl overflow-hidden ${expanded ? 'border-black' : 'border-black/10'}`}>
      <div className="p-5 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-start justify-between">
          <div>
            <p className="font-black text-sm">#{o.id.slice(0,8).toUpperCase()}</p>
            <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
            {o.shipping_name && <p className="text-xs text-gray-500 mt-1">{o.shipping_name}</p>}
          </div>
          <div className="text-right">
            <p className="font-black text-sm">{String.fromCharCode(165)}{o.total_price?.toLocaleString()}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-gray-100 text-gray-600'}`}>
              {o.status?.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="border-t border-black/10 p-5 space-y-4 bg-gray-50">
          {profile && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Customer</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-bold">{profile.last_name} {profile.first_name}</p>
                <p className="text-gray-500">@{profile.display_id || 'unknown'}</p>
                {profile.postal_code && <p>{profile.postal_code}</p>}
                {profile.prefecture && <p>{profile.prefecture} {profile.city}</p>}
                {profile.address_line1 && <p>{profile.address_line1}</p>}
                {profile.address_line2 && <p>{profile.address_line2}</p>}
              </div>
            </div>
          )}
          {o.shipping_name && (
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Shipping Address</p>
              <div className="text-sm text-gray-700 space-y-0.5">
                <p className="font-bold">{o.shipping_name}</p>
                {o.shipping_postal_code && <p>{o.shipping_postal_code}</p>}
                <p>{o.shipping_prefecture} {o.shipping_city}</p>
                <p>{o.shipping_address_line1}</p>
                {o.shipping_address_line2 && <p>{o.shipping_address_line2}</p>}
              </div>
            </div>
          )}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Update Status</p>
            <div className="flex gap-2 flex-wrap">
              {ORDER_STATUSES.map(s => (
                <button key={s} onClick={() => onStatusChange(o.id, s)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold border transition-all ${o.status === s ? 'bg-black text-white border-black' : 'border-black/10 hover:border-black'}`}>
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tracking Number</p>
            <div className="flex gap-2">
              <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)}
                className="flex-1 border border-black/20 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-black"
                placeholder="e.g. 1234-5678-9012" />
              <button onClick={saveTracking} disabled={saving || !trackingNumber}
                className="px-4 py-2 bg-black text-white rounded-lg text-xs font-bold hover:bg-gray-900 disabled:opacity-50">
                {saving ? '...' : 'Mark Shipped'}
              </button>
            </div>
            {o.tracking_number && (
              <p className="text-xs text-gray-500 mt-1">Current: <span className="font-bold text-black">{o.tracking_number}</span></p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
