const $ = s => document.querySelector(s);
const naira = n => "₦" + n.toLocaleString("en-NG");
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const FALLBACK = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><rect width='600' height='600' fill='#e9eefb'/><text x='300' y='310' font-family='sans-serif' font-size='28' text-anchor='middle' fill='#2563ff'>AMOO TECH</text></svg>");
const img = p => `<img src="${p.img}" alt="${esc(p.name)}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK}'">`;
const state = {q:"", cat:"All", sort:"featured", stock:"all"};
let lastFocus = null;

function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(toast.t); toast.t=setTimeout(()=>t.classList.remove("show"),2200); }
const discount = p => p.old ? Math.round((1-p.price/p.old)*100) : 0;

function visible(){
  const q = state.q.trim().toLowerCase();
  const l = PRODUCTS.filter(p =>
    p.name.toLowerCase().includes(q) &&
    (state.cat==="All" || p.cat===state.cat) &&
    (state.stock==="all" || (state.stock==="in" ? p.stock>0 : p.stock===0)));
  if(state.sort==="low") l.sort((a,b)=>a.price-b.price);
  if(state.sort==="high") l.sort((a,b)=>b.price-a.price);
  if(state.sort==="new") l.sort((a,b)=>b.date.localeCompare(a.date));
  return l;
}
function renderProducts(){
  const l = visible();
  $("#resultCount").textContent = `${l.length} product${l.length===1?"":"s"} shown`;
  $("#grid").innerHTML = l.length ? l.map(p=>`
   <article class="card"><div class="pic">${img(p)}${p.old?`<span class="badge">-${discount(p)}%</span>`:""}${p.stock===0?`<span class="badge out">Out of stock</span>`:""}</div>
   <div class="cbody"><small>${p.cat}</small><h3>${esc(p.name)}</h3><p>${esc(p.desc)}</p>
   <div class="price">${naira(p.price)}${p.old?`<s>${naira(p.old)}</s>`:""}</div>
   <div class="actions"><button class="btn ghost sm" data-view="${p.id}">View Details</button><button class="btn sm" data-add="${p.id}" ${p.stock===0?"disabled":""}>${p.stock===0?"Sold out":"Add to Cart"}</button></div></div></article>`).join("")
   : `<div class="empty"><h3>No products match</h3><p>Try a different search or clear your filters.</p><button class="btn" data-reset>Reset filters</button></div>`;
  document.querySelectorAll(".cat").forEach(b=>b.classList.toggle("on", b.dataset.cat===state.cat));
}
function setCat(c){ state.cat=c; $("#category").value=c; renderProducts(); }
function resetFilters(){ Object.assign(state,{q:"",cat:"All",sort:"featured",stock:"all"}); $("#search").value=$("#headerSearch").value=""; $("#category").value="All"; $("#sort").value="featured"; $("#stock").value="all"; renderProducts(); }

function openLayer(el, withOverlay){ lastFocus=document.activeElement; el.hidden=false; $("#overlay").hidden=!withOverlay; document.body.style.overflow="hidden"; (el.querySelector("button,input")||el).focus(); }
function closeAll(){ ["#drawer","#modal","#overlay"].forEach(s=>$(s).hidden=true); document.body.style.overflow=""; if(lastFocus&&document.contains(lastFocus)) lastFocus.focus(); }

function renderCart(){
  $("#cartCount").textContent = Cart.count();
  const items = Cart.detailed();
  $("#cartItems").innerHTML = items.length ? items.map(i=>`
   <div class="item">${img(i)}<div><h4>${esc(i.name)}</h4><small>${naira(i.price)}</small>
   <div class="qty"><button data-dec="${i.id}" aria-label="Decrease quantity">−</button><span>${i.qty}</span><button data-inc="${i.id}" aria-label="Increase quantity" ${i.qty>=i.stock?"disabled":""}>+</button></div></div>
   <div><strong>${naira(i.price*i.qty)}</strong><br><button class="link" data-rm="${i.id}">Remove</button></div></div>`).join("")
   : `<div class="cart-empty"><h3>Your cart is empty</h3><p>Add something you like and it will show up here.</p><button class="btn" data-close data-goshop>Browse products</button></div>`;
  $("#cartFoot").innerHTML = items.length ? `<div class="tot"><span>Subtotal</span><span>${naira(Cart.subtotal())}</span></div><div class="tot"><span>Delivery</span><span>Free (demo)</span></div><div class="tot big"><span>Total</span><span>${naira(Cart.total())}</span></div><button class="btn" id="checkoutBtn">Checkout (demo)</button><button class="link" id="clearBtn">Clear cart</button>` : "";
}
function addToCart(id, qty=1){ if(Cart.add(id,qty)){ renderCart(); toast("Added to cart"); } }

function openProduct(id){
  const p = PRODUCTS.find(x=>x.id===id);
  $("#modalBody").innerHTML = `<div class="detail">${img(p)}<div><small>${p.cat}</small><h2>${esc(p.name)}</h2>
   <div class="price">${naira(p.price)}${p.old?`<s>${naira(p.old)}</s>`:""}</div>
   <p>${esc(p.desc)}</p><p><small>${p.stock>0?`${p.stock} in stock`:"Currently out of stock"}. Fictional demo product.</small></p>
   <ul class="specs">${Object.entries(p.specs).map(([k,v])=>`<li><span>${k}</span>${esc(v)}</li>`).join("")}</ul>
   <div class="row"><div class="qty"><button id="mDec" aria-label="Decrease">−</button><span id="mQty">1</span><button id="mInc" aria-label="Increase">+</button></div>
   <button class="btn" id="mAdd" ${p.stock===0?"disabled":""}>Add to Cart</button></div></div></div>`;
  let q=1; const set=v=>{ q=Math.max(1,Math.min(v,p.stock||1)); $("#mQty").textContent=q; };
  $("#mDec").onclick=()=>set(q-1); $("#mInc").onclick=()=>set(q+1);
  $("#mAdd").onclick=()=>{ addToCart(p.id,q); closeAll(); };
  openLayer($("#modal"),false);
}

const RULES = {
  name: v=>v.trim().length>=2 || "Enter your full name.",
  email: v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter a valid email like you@example.com.",
  phone: v=>/^\+?[0-9\s-]{7,15}$/.test(v.trim()) || "Enter a phone number with 7–15 digits.",
  address: v=>v.trim().length>=8 || "Enter your full delivery address."
};
function openCheckout(){
  if(!Cart.count()) return;
  const items = Cart.detailed();
  $("#modalBody").innerHTML = `<h2>Checkout demonstration</h2><p class="demo-tag">Demo only. No payment is taken and no order is sent to a real store. Please don't enter real card details.</p>
  <form class="co" id="coForm" novalidate>
   ${[["name","Full name","text","name"],["email","Email","email","email"],["phone","Phone number","tel","tel"],["address","Delivery address","text","street-address"]].map(([id,l,t,a])=>`<label>${l}<input id="f_${id}" type="${t}" autocomplete="${a}" required><span class="e" id="e_${id}"></span></label>`).join("")}
   <div class="summary"><strong>Order summary</strong>${items.map(i=>`<div class="tot"><span>${i.qty} × ${esc(i.name)}</span><span>${naira(i.price*i.qty)}</span></div>`).join("")}<div class="tot big"><span>Total</span><span>${naira(Cart.total())}</span></div></div>
   <button class="btn">Place Demo Order</button></form>`;
  $("#coForm").addEventListener("submit", submitOrder);
  $("#drawer").hidden=true; openLayer($("#modal"),true);
}
function submitOrder(e){
  e.preventDefault(); let ok=true;
  for(const k in RULES){ const f=$("#f_"+k), r=RULES[k](f.value), bad=r!==true; f.setAttribute("aria-invalid", bad); $("#e_"+k).textContent = bad?r:""; if(bad&&ok){ f.focus(); ok=false; } }
  if(!ok) return;
  const btn=e.target.querySelector(".btn"); btn.disabled=true; btn.textContent="Placing demo order…";
  const total=Cart.total();
  setTimeout(()=>{
    const ref="AMOO-DEMO-"+Date.now().toString(36).toUpperCase().slice(-6)+Math.floor(Math.random()*90+10);
    Cart.clear(); renderCart();
    $("#modalBody").innerHTML=`<h2>Demo order placed</h2><p class="demo-tag">This is a demonstration. No real order was created.</p><p>Reference: <strong>${ref}</strong></p><p>Total: <strong>${naira(total)}</strong></p><button class="btn" data-close data-goshop>Continue shopping</button>`;
  },800);
}

function init(){
  Cart.load();
  $("#category").innerHTML = ["All",...CATEGORIES].map(c=>`<option value="${c}">${c==="All"?"All categories":c}</option>`).join("");
  $("#cats").innerHTML = CATEGORIES.map(c=>`<button class="cat" data-cat="${c}">${c}</button>`).join("");
  $("#footCats").innerHTML = CATEGORIES.map(c=>`<a href="#shop" data-cat="${c}">${c}</a>`).join("");
  renderProducts(); renderCart();

  $("#search").addEventListener("input",e=>{ state.q=e.target.value; $("#headerSearch").value=e.target.value; renderProducts(); });
  $("#headerSearch").addEventListener("input",e=>{ state.q=e.target.value; $("#search").value=e.target.value; renderProducts(); });
  $("#headerSearch").addEventListener("keydown",e=>{ if(e.key==="Enter") location.hash="#shop"; });
  $("#category").onchange=e=>setCat(e.target.value);
  $("#sort").onchange=e=>{ state.sort=e.target.value; renderProducts(); };
  $("#stock").onchange=e=>{ state.stock=e.target.value; renderProducts(); };
  $("#reset").onclick=resetFilters;
  $("#dealsBtn").onclick=()=>{ resetFilters(); document.getElementById("shop").scrollIntoView(); toast("Discount badges mark the deals"); };
  $("#cartBtn").onclick=()=>openLayer($("#drawer"),true);
  $("#menuBtn").onclick=e=>{ const o=$("#nav").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded",o); };
  $("#nav").addEventListener("click",()=>$("#nav").classList.remove("open"));
  $("#overlay").onclick=closeAll;
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") closeAll(); });
  $("#modal").addEventListener("click",e=>{ if(e.target===$("#modal")) closeAll(); });

  document.addEventListener("click",e=>{
    const t=e.target.closest("button,a"); if(!t) return;
    const d=t.dataset;
    if(d.cat){ setCat(d.cat); if(t.tagName==="BUTTON") document.getElementById("shop").scrollIntoView(); }
    if(d.view) openProduct(+d.view);
    if(d.add) addToCart(+d.add);
    if("reset" in d) resetFilters();
    if("close" in d){ closeAll(); if("goshop" in d) location.hash="#shop"; }
    if(d.inc){ const it=Cart.items.find(i=>i.id==d.inc); Cart.setQty(+d.inc,it.qty+1); renderCart(); }
    if(d.dec){ const it=Cart.items.find(i=>i.id==d.dec); Cart.setQty(+d.dec,it.qty-1); renderCart(); }
    if(d.rm){ Cart.remove(+d.rm); renderCart(); }
    if(t.id==="clearBtn"){ Cart.clear(); renderCart(); toast("Cart cleared"); }
    if(t.id==="checkoutBtn") openCheckout();
    if("demo" in d){ e.preventDefault(); toast("Demo link: no real social page"); }
  });

  $("#newsForm").addEventListener("submit",e=>{
    e.preventDefault(); const v=$("#nEmail").value, m=$("#newsMsg");
    if(RULES.email(v)!==true){ m.className="err"; m.textContent="Enter a valid email address."; return; }
    m.className="ok"; m.textContent="Demo only: thanks! Your email was not stored or sent anywhere."; e.target.reset();
  });
}
document.addEventListener("DOMContentLoaded",init);
