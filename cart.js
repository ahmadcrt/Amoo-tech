// Cart state with LocalStorage persistence.
const Cart = {
  KEY: "amootech_cart", items: [],
  load(){ try{ const d=JSON.parse(localStorage.getItem(this.KEY)); this.items=Array.isArray(d)?d.filter(i=>PRODUCTS.some(p=>p.id===i.id)&&i.qty>0):[]; }catch(e){ this.items=[]; } },
  save(){ try{ localStorage.setItem(this.KEY, JSON.stringify(this.items)); }catch(e){} },
  add(id,qty=1){ const p=PRODUCTS.find(x=>x.id===id); if(!p||p.stock<1) return false;
    const it=this.items.find(i=>i.id===id); if(it) it.qty=Math.min(it.qty+qty,p.stock); else this.items.push({id,qty:Math.min(qty,p.stock)}); this.save(); return true; },
  setQty(id,qty){ const p=PRODUCTS.find(x=>x.id===id); const it=this.items.find(i=>i.id===id); if(!it) return;
    if(qty<1) return this.remove(id); it.qty=Math.min(qty,p.stock); this.save(); },
  remove(id){ this.items=this.items.filter(i=>i.id!==id); this.save(); },
  clear(){ this.items=[]; this.save(); },
  count(){ return this.items.reduce((s,i)=>s+i.qty,0); },
  detailed(){ return this.items.map(i=>({...PRODUCTS.find(p=>p.id===i.id),qty:i.qty})); },
  subtotal(){ return this.detailed().reduce((s,i)=>s+i.price*i.qty,0); },
  total(){ return this.subtotal(); } // Delivery is free in this demo
};
