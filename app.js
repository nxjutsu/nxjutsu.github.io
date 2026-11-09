/* =========================================================
   NX JUTSU · Tienda
   CONFIGURACIÓN: todo lo editable está en este bloque.
   ========================================================= */
const CONFIG = {
  instagram: 'nxjutsu',              // a dónde llegan los pedidos (mensaje directo)
  precios: {                         // precios por TRANSFERENCIA
    remera: { comun: 30000, peinado: 36000 },
    buzo:   { algodon: 47000 },
  },
  calidades: {
    remera: [ { id: 'comun', label: 'Algodón común' }, { id: 'peinado', label: 'Algodón peinado' } ],
    buzo:   [ { id: 'algodon', label: 'Algodón' } ],
  },
  talles: ['14', '16', 'XS', 'S', 'M', 'L', 'XL'],
  mercadoPago: { recargo: 0.15, cuotasMax: 3 },  // 15% de recargo con link de pago
  // Envío estimado con Correo Argentino desde Córdoba (paquete hasta 1 kg).
  // Ajustá estos valores con tu tarifa de MiCorreo / Paq.ar.
  envio: {
    zonas: {
      cordoba:   { nombre: 'Córdoba',              domicilio: 7900,  sucursal: 5900 },
      centro:    { nombre: 'Región Centro / Cuyo', domicilio: 10900, sucursal: 8400 },
      norte:     { nombre: 'Norte / Litoral',      domicilio: 12400, sucursal: 9600 },
      patagonia: { nombre: 'Patagonia',            domicilio: 14900, sucursal: 11800 },
    },
    pesoKg: { remera: 0.25, buzo: 0.6 },
    // multiplicador según el peso total del paquete
    escalas: [ { hasta: 1, x: 1 }, { hasta: 2, x: 1.3 }, { hasta: 5, x: 1.7 }, { hasta: 99, x: 2.3 } ],
  },
  // Opcional: endpoint de Formspree (https://formspree.io) para recibir además cada pedido por email.
  formspree: '',
};

const PROVINCIAS = [
  ['Buenos Aires','centro'],['Ciudad Autónoma de Buenos Aires','centro'],['Catamarca','centro'],['Chaco','norte'],
  ['Chubut','patagonia'],['Córdoba','cordoba'],['Corrientes','norte'],['Entre Ríos','centro'],['Formosa','norte'],
  ['Jujuy','norte'],['La Pampa','centro'],['La Rioja','centro'],['Mendoza','centro'],['Misiones','norte'],
  ['Neuquén','patagonia'],['Río Negro','patagonia'],['Salta','norte'],['San Juan','centro'],['San Luis','centro'],
  ['Santa Cruz','patagonia'],['Santa Fe','centro'],['Santiago del Estero','centro'],
  ['Tierra del Fuego','patagonia'],['Tucumán','centro'],
];

/* ---------- utilidades ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => '$' + Math.round(n).toLocaleString('es-AR');
const roundUp = (n, step = 100) => Math.ceil(n / step) * step;
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
};
const tipoLabel = { remera: 'Remera', buzo: 'Buzo' };
const igLink = txt => `https://ig.me/m/${CONFIG.instagram}?text=${encodeURIComponent(txt)}`;
const minPrice = tipo => Math.min(...Object.values(CONFIG.precios[tipo]));
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('on');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('on'), 2200);
}

/* ---------- catálogo ---------- */
const ANIME_ORDER = ['Naruto', 'Attack On Titan', 'Demon Slayer', 'Dragon Ball', 'Pokémon', 'Jujutsu Kaisen', 'My Hero Academia', 'Tokyo Revengers', 'One Piece', 'Akira', 'Bungo Stray Dogs', 'Chainsaw Man'];
const animeRank = a => { const i = ANIME_ORDER.indexOf(a); return i < 0 ? 99 : i; };
const ALL = (window.CATALOG || []).map((p, i) => ({ ...p, _i: i })).sort((x, y) =>
  animeRank(x.anime) - animeRank(y.anime) || (x.tipo === y.tipo ? 0 : x.tipo === 'remera' ? -1 : 1) || x._i - y._i);
const PRODUCTS = ALL;
const findProduct = id => ALL.find(x => x.id === id);
const state = { tipo: 'todos', anime: 'Todos', q: '', ptipo: 'todos' };

function renderChips() {
  const animes = ['Todos', ...[...new Set(PRODUCTS.map(p => p.anime))].sort((x, y) => animeRank(x) - animeRank(y))];
  $('#animeChips').innerHTML = animes.map(a =>
    `<button class="chip${a === state.anime ? ' on' : ''}" data-anime="${a}">${a}</button>`).join('');
}

function cardHTML(p) {
  const colors = Object.keys(p.imgs);
  const main = p.imgs.negro || p.imgs.blanco;
  const alt = colors.length > 1 ? p.imgs.blanco : null;
  return `<button class="card" data-id="${p.id}" aria-label="${tipoLabel[p.tipo]} ${p.nombre}">
    <div class="card-media">
      <img src="${main}" alt="${tipoLabel[p.tipo]} ${p.nombre} negro" loading="lazy">
      ${alt ? `<img class="alt" src="${alt}" alt="" loading="lazy">` : ''}
      <span class="badge">${tipoLabel[p.tipo]}</span>
      <span class="card-quick">Elegir talle</span>
    </div>
    <div class="card-info">
      <div class="card-anime">${p.anime}</div>
      <div class="card-name">${p.nombre}</div>
      <div class="card-row">
        <span class="card-price">${money(minPrice(p.tipo))}</span>
        <span class="dots">${colors.map(c => `<i class="dot ${c}" title="${c}"></i>`).join('')}</span>
      </div>
    </div>
  </button>`;
}

function renderGrid() {
  const q = state.q.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (state.tipo === 'todos' || p.tipo === state.tipo) &&
    (state.anime === 'Todos' || p.anime === state.anime) &&
    (!q || (p.nombre + ' ' + p.anime).toLowerCase().includes(q)));
  $('#grid').innerHTML = list.map(cardHTML).join('');
  $('#empty').hidden = list.length > 0;
  $('#resultCount').textContent = `${list.length} ${list.length === 1 ? 'diseño' : 'diseños'}`;
}

function setTipo(t) {
  state.tipo = t;
  $$('#tipoSeg button').forEach(b => b.classList.toggle('on', b.dataset.tipo === t));
  renderGrid();
}

/* ---------- modal de producto ---------- */
let current = null;
function openProduct(id) {
  const p = findProduct(id); if (!p) return;
  const colors = Object.keys(p.imgs);
  current = { p, color: colors[0], calidad: CONFIG.calidades[p.tipo][0].id, talle: null, qty: 1, view: 'espalda' };
  $('#pmViews').hidden = !p.frente;
  $('#pmAnime').textContent = `${tipoLabel[p.tipo]} · ${p.anime}`;
  $('#pmTitle').textContent = p.nombre;
  const cal = CONFIG.calidades[p.tipo];
  $('#pmCalidadWrap').hidden = cal.length < 2;
  $('#pmCalidad').innerHTML = cal.map(c =>
    `<button class="pill" data-cal="${c.id}">${c.label}<small>${money(CONFIG.precios[p.tipo][c.id])}</small></button>`).join('');
  $('#pmColor').innerHTML = colors.map(c =>
    `<button class="swatch ${c}" data-color="${c}" aria-label="${c}" title="${c}"></button>`).join('');
  $('#pmTalle').innerHTML = CONFIG.talles.map(t => `<button class="pill" data-talle="${t}">${t}</button>`).join('');
  $('#pmQty').value = 1; $('#pmError').hidden = true;
  syncProduct();
  openOverlay('#productOverlay');
}
function syncProduct() {
  const { p, color, calidad, talle } = current;
  const front = p.frente && current.view === 'frente';
  $('#pmImg').src = front ? p.frente[color] : p.imgs[color];
  $$('#pmViews button').forEach(b => b.classList.toggle('on', b.dataset.view === current.view));
  $('#pmImg').alt = `${tipoLabel[p.tipo]} ${p.nombre} ${color}`;
  $('#pmColorName').textContent = color;
  $('#pmPrice').textContent = money(CONFIG.precios[p.tipo][calidad]);
  $$('#pmCalidad .pill').forEach(b => b.classList.toggle('on', b.dataset.cal === calidad));
  $$('#pmColor .swatch').forEach(b => b.classList.toggle('on', b.dataset.color === color));
  $$('#pmTalle .pill').forEach(b => b.classList.toggle('on', b.dataset.talle === talle));
}

/* ---------- carrito ---------- */
let cart = store.get('nx_cart', []);
const saveCart = () => { store.set('nx_cart', cart); renderCart(); };
const itemPrice = it => CONFIG.precios[it.tipo][it.calidad];
const subtotal = () => cart.reduce((s, it) => s + itemPrice(it) * it.qty, 0);
const calLabel = (tipo, id) => (CONFIG.calidades[tipo].find(c => c.id === id) || {}).label || '';

function addToCart() {
  const { p, color, calidad, talle } = current;
  if (!talle) { $('#pmError').hidden = false; return; }
  const qty = Math.max(1, Math.min(20, parseInt($('#pmQty').value) || 1));
  const key = [p.id, color, calidad, talle].join('|');
  const ex = cart.find(i => i.key === key);
  if (ex) ex.qty += qty;
  else cart.push({ key, id: p.id, nombre: p.nombre, linea: p.linea || 'nx', tipo: p.tipo, color, calidad, talle, qty, img: p.imgs[color] });
  saveCart();
  closeOverlay('#productOverlay');
  const c = $('#cartCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  toast(`${tipoLabel[p.tipo]} ${p.nombre} agregada al carrito`);
}

function renderCart() {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  $('#cartCount').textContent = n;
  $('#cartEmpty').hidden = cart.length > 0;
  $('#cartItems').innerHTML = cart.map((it, i) => `
    <div class="citem">
      <img src="${it.img}" alt="">
      <div>
        <h4>${tipoLabel[it.tipo]} ${it.nombre}</h4>
        <p>${cap(it.color)} · Talle ${it.talle}${CONFIG.calidades[it.tipo].length > 1 ? ' · ' + calLabel(it.tipo, it.calidad) : ''}</p>
        <div class="qty"><button data-ci="${i}" data-d="-1" aria-label="Restar">−</button><input value="${it.qty}" readonly aria-label="Cantidad"><button data-ci="${i}" data-d="1" aria-label="Sumar">+</button></div>
      </div>
      <div class="citem-right"><b>${money(itemPrice(it) * it.qty)}</b><button class="rm" data-rm="${i}">Quitar</button></div>
    </div>`).join('');
  if (step === 0) renderFoot();
}
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

/* ---------- envío ---------- */
function pesoTotal() { return cart.reduce((s, it) => s + CONFIG.envio.pesoKg[it.tipo] * it.qty, 0); }
function costoEnvio(modo, prov) {
  if (modo === 'retiro') return 0;
  const z = (PROVINCIAS.find(p => p[0] === prov) || [])[1];
  if (!z) return null;
  const base = CONFIG.envio.zonas[z][modo];
  const esc = CONFIG.envio.escalas.find(e => pesoTotal() <= e.hasta) || CONFIG.envio.escalas.at(-1);
  return roundUp(base * esc.x);
}
const checkout = store.get('nx_checkout', {});
function getModo() { return ($('input[name="modo"]:checked') || {}).value || 'domicilio'; }
function getPago() { return ($('input[name="pago"]:checked') || {}).value || 'transferencia'; }
let cuotas = 1;

function syncEnvio() {
  const modo = getModo(), prov = $('#fProv').value;
  $('#envioCampos').hidden = modo === 'retiro';
  $('#dirWrap').hidden = modo !== 'domicilio';
  $('#sucWrap').hidden = modo !== 'sucursal';
  $('#sucLinkTxt').textContent = prov ? `Ver sucursales de Correo Argentino en ${prov}` : 'Ver sucursales de Correo Argentino';
  $('#sucProvTxt').textContent = prov ? `“${prov.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}”` : '(sin tildes)';
  ['domicilio', 'sucursal'].forEach(m => {
    const c = costoEnvio(m, prov);
    $(`.rprice[data-price="${m}"]`).textContent = c == null ? '' : money(c);
  });
  const z = (PROVINCIAS.find(p => p[0] === prov) || [])[1];
  $('#shipBox').innerHTML = z
    ? `Envío estimado a <b>${prov}</b> (${CONFIG.envio.zonas[z].nombre}) para ${cart.reduce((s, i) => s + i.qty, 0)} prenda(s): <b>${money(costoEnvio(modo, prov))}</b>.<br>Es un valor aproximado de Correo Argentino: antes de pagar te confirmamos el costo exacto según tu código postal.`
    : 'Elegí tu provincia para calcular el envío.';
  renderFoot();
}

/* ---------- totales ---------- */
function calc() {
  const sub = subtotal();
  const envio = step >= 2 ? (costoEnvio(getModo(), $('#fProv').value) ?? 0) : null;
  const base = sub + (envio || 0);
  const mp = step >= 3 && getPago() === 'mp';
  const recargo = mp ? roundUp(base * CONFIG.mercadoPago.recargo, 10) : 0;
  return { sub, envio, base, mp, recargo, total: base + recargo };
}
function renderFoot() {
  const t = calc();
  let h = `<div><span>Subtotal</span><span>${money(t.sub)}</span></div>`;
  if (t.envio !== null) h += `<div><span>Envío${getModo() === 'retiro' ? ' (retiro)' : ' estimado'}</span><span>${t.envio ? money(t.envio) : 'Gratis'}</span></div>`;
  if (t.mp) h += `<div><span>Recargo Mercado Pago (${CONFIG.mercadoPago.recargo * 100}%)</span><span>${money(t.recargo)}</span></div>`;
  h += `<div class="grand"><span>Total</span><span>${money(t.total)}</span></div>`;
  if (t.mp && cuotas > 1) h += `<div><span>${cuotas} cuotas de</span><span>${money(t.total / cuotas)}</span></div>`;
  if (step === 0 && cart.length) h += `<div class="save"><span>Precio por transferencia · hasta 3 cuotas con Mercado Pago</span></div>`;
  $('#totals').innerHTML = cart.length ? h : '';
  if (step === 3) {
    $('#payTransfer').textContent = money(t.base);
    $('#payMp').textContent = money(t.base + roundUp(t.base * CONFIG.mercadoPago.recargo, 10));
    renderCuotas(t);
  }
}
function renderCuotas() {
  const show = getPago() === 'mp';
  $('#cuotas').hidden = !show; if (!show) return;
  const base = subtotal() + (costoEnvio(getModo(), $('#fProv').value) || 0);
  const tot = base + roundUp(base * CONFIG.mercadoPago.recargo, 10);
  $('#cuotas').innerHTML = Array.from({ length: CONFIG.mercadoPago.cuotasMax }, (_, i) => i + 1).map(n =>
    `<div class="cuota${n === cuotas ? ' on' : ''}" data-cuotas="${n}"><b>${n} ${n === 1 ? 'pago' : 'cuotas'}</b><span>${money(tot / n)}</span><small>${n > 1 ? 'por mes' : 'total'}</small></div>`).join('');
}

/* ---------- pasos del checkout ---------- */
let step = 0;
const titles = ['Tu carrito', 'Tus datos', 'Envío', 'Pago', 'Pedido listo'];
const nextLabels = ['Iniciar compra', 'Continuar al envío', 'Continuar al pago', 'Confirmar pedido', ''];

function goStep(s) {
  step = s;
  $$('.step').forEach(el => el.hidden = +el.dataset.step !== s);
  $('#drawerTitle').textContent = titles[s];
  $('#stepper').hidden = s === 0;
  $$('#stepper span').forEach(sp => sp.classList.toggle('on', +sp.dataset.s <= s));
  $('#stepBack').hidden = s === 0 || s === 4;
  $('#drawerFoot').hidden = s === 4 || (s === 0 && !cart.length);
  $('#stepNext').textContent = nextLabels[s];
  $('#stepError').hidden = true;
  if (s === 2) syncEnvio();
  renderFoot();
  $('.drawer-body').scrollTop = 0;
}

function validate(ids) {
  let ok = true;
  ids.forEach(id => {
    const el = $('#' + id); if (el.closest('[hidden]')) return;
    let v = el.value.trim(), good = !!v;
    if (id === 'fEmail') good = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (id === 'fCp') good = /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/.test(v);
    if (id === 'fDni') good = /^\d{7,8}$/.test(v.replace(/\./g, ''));
    if (id === 'fTel') good = v.replace(/\D/g, '').length >= 8;
    el.classList.toggle('bad', !good); if (!good) ok = false;
  });
  return ok;
}
function err(msg) { const e = $('#stepError'); e.textContent = msg; e.hidden = false; }
function persistForm() {
  ['fNombre', 'fIg', 'fDni', 'fTel', 'fEmail', 'fProv', 'fCp', 'fLocalidad', 'fDir', 'fSuc'].forEach(id => checkout[id] = $('#' + id).value);
  store.set('nx_checkout', checkout);
}

function next() {
  if (step === 0) { if (!cart.length) return; goStep(1); return; }
  if (step === 1) {
    if (!validate(['fNombre', 'fIg', 'fDni', 'fTel', 'fEmail'])) return err('Revisá los campos marcados.');
    persistForm(); goStep(2); return;
  }
  if (step === 2) {
    if (getModo() !== 'retiro' && !validate(['fProv', 'fCp', 'fLocalidad', 'fDir', 'fSuc'])) return err(getModo() === 'sucursal' && !$('#fSuc').value.trim() ? 'Elegí la sucursal en el buscador del Correo y escribila.' : 'Completá los datos de envío.');
    persistForm(); goStep(3); return;
  }
  if (step === 3) {
    if (!$('#fAcepto').checked) return err('Confirmá que entendés que la prenda es por encargo y sin cambio.');
    finish();
  }
}

function orderText(id, t) {
  const modo = getModo(), pago = getPago();
  const L = [];
  L.push(`🛒 NUEVO PEDIDO ${id} · NX JUTSU`, '');
  cart.forEach(it => L.push(`• ${it.qty}x ${tipoLabel[it.tipo]} ${it.nombre} · ${cap(it.color)} · Talle ${it.talle}${CONFIG.calidades[it.tipo].length > 1 ? ' · ' + calLabel(it.tipo, it.calidad) : ''} — ${money(itemPrice(it) * it.qty)}`));
  L.push('', `Subtotal: ${money(t.sub)}`);
  L.push(modo === 'retiro' ? 'Entrega: Retiro en Córdoba capital (gratis)' : `Envío Correo Argentino a ${modo}: ${money(t.envio)} (estimado)`);
  if (t.mp) L.push(`Recargo Mercado Pago ${CONFIG.mercadoPago.recargo * 100}%: ${money(t.recargo)}`);
  L.push(`TOTAL: ${money(t.total)}`);
  L.push(`Pago: ${pago === 'mp' ? `Link de Mercado Pago en ${cuotas} ${cuotas === 1 ? 'pago' : `cuotas de ${money(t.total / cuotas)}`}` : 'Transferencia bancaria'}`, '');
  L.push(`👤 ${$('#fNombre').value} · ${$('#fIg').value} · DNI ${$('#fDni').value}`);
  L.push(`📞 ${$('#fTel').value} · ✉️ ${$('#fEmail').value}`);
  if (modo !== 'retiro') {
    L.push(`📦 ${modo === 'domicilio' ? $('#fDir').value + ', ' : ''}${$('#fLocalidad').value}, ${$('#fProv').value} (CP ${$('#fCp').value})`);
    if (modo === 'sucursal' && $('#fSuc').value) L.push(`Sucursal: ${$('#fSuc').value}`);
  }
  if ($('#fNotas').value.trim()) L.push(`📝 ${$('#fNotas').value.trim()}`);
  return L.join('\n');
}

async function copy(txt) {
  try { await navigator.clipboard.writeText(txt); return true; }
  catch {
    const ta = document.createElement('textarea'); ta.value = txt; document.body.append(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {} ta.remove(); return ok;
  }
}

function finish() {
  const t = calc();
  const id = 'NX-' + Date.now().toString(36).toUpperCase().slice(-6);
  const txt = orderText(id, t);
  $('#orderId').textContent = id;
  $('#orderText').textContent = txt;
  copy(txt);
  if (CONFIG.formspree) {
    fetch(CONFIG.formspree, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ pedido: id, total: t.total, detalle: txt, email: $('#fEmail').value }) }).catch(() => {});
  }
  $('#sendIg').href = igLink(txt);
  store.set('nx_last_order', { id, txt, at: Date.now() });
  goStep(4);
  cart = []; store.set('nx_cart', cart); renderCart();
}

/* ---------- overlays ---------- */
function openOverlay(sel) { $(sel).hidden = false; document.body.style.overflow = 'hidden'; }
function closeOverlay(sel) {
  $(sel).hidden = true;
  if ($$('.overlay').every(o => o.hidden)) document.body.style.overflow = '';
  if (sel === '#cartOverlay' && step === 4) goStep(0);
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const card = t.closest('.card'); if (card) return openProduct(card.dataset.id);
  const chip = t.closest('.chip'); if (chip) { state.anime = chip.dataset.anime; renderChips(); renderGrid(); return; }
  const seg = t.closest('#tipoSeg button'); if (seg) return setTipo(seg.dataset.tipo);
  const ft = t.closest('[data-filter-tipo]'); if (ft) { setTipo(ft.dataset.filterTipo); $('#nav').classList.remove('on'); $('#burger').classList.remove('on'); }
  if (t.closest('.nav a')) { $('#nav').classList.remove('on'); $('#burger').classList.remove('on'); }
  const closeBtn = t.closest('[data-close]');
  if (closeBtn) { const ov = closeBtn.closest('.overlay'); if (ov) closeOverlay('#' + ov.id); return; }
  if (t.classList.contains('overlay')) return closeOverlay('#' + t.id);
  // modal producto
  const cal = t.closest('[data-cal]'); if (cal) { current.calidad = cal.dataset.cal; return syncProduct(); }
  const vw = t.closest('[data-view]'); if (vw) { current.view = vw.dataset.view; return syncProduct(); }
  const col = t.closest('[data-color]'); if (col) { current.color = col.dataset.color; return syncProduct(); }
  const tal = t.closest('[data-talle]'); if (tal) { current.talle = tal.dataset.talle; $('#pmError').hidden = true; return syncProduct(); }
  const q = t.closest('[data-q]'); if (q) { const i = $('#pmQty'); i.value = Math.max(1, Math.min(20, (parseInt(i.value) || 1) + +q.dataset.q)); return; }
  // carrito
  const d = t.closest('[data-ci]'); if (d) { const it = cart[+d.dataset.ci]; it.qty = Math.max(1, Math.min(20, it.qty + +d.dataset.d)); return saveCart(); }
  const rm = t.closest('[data-rm]'); if (rm) { cart.splice(+rm.dataset.rm, 1); saveCart(); if (!cart.length) goStep(0); return; }
  const cu = t.closest('[data-cuotas]'); if (cu) { cuotas = +cu.dataset.cuotas; return renderFoot(); }
});
$('#pmAdd').addEventListener('click', addToCart);
$('#openCart').addEventListener('click', () => { goStep(step === 4 ? 0 : step); openOverlay('#cartOverlay'); });
$('#stepNext').addEventListener('click', next);
$('#stepBack').addEventListener('click', () => goStep(Math.max(0, step - 1)));
$('#burger').addEventListener('click', () => { $('#burger').classList.toggle('on'); $('#nav').classList.toggle('on'); });
$('#search').addEventListener('input', e => { state.q = e.target.value; renderGrid(); });
$('#formEnvio').addEventListener('change', syncEnvio);
$('#fProv').addEventListener('change', syncEnvio);
$('#pagoModo').addEventListener('change', () => { if (getPago() !== 'mp') cuotas = 1; renderFoot(); });
$('#sucLink').addEventListener('click', e => {
  const w = 960, h = 820;
  const left = Math.max(0, (window.screenX || 0) + (window.outerWidth - w) / 2);
  const top = Math.max(0, (window.screenY || 0) + (window.outerHeight - h) / 2);
  let win = null;
  try { win = window.open(e.currentTarget.href, 'sucursalesCorreo', `popup=yes,width=${w},height=${h},left=${left},top=${top}`); } catch {}
  if (win) { e.preventDefault(); try { win.focus(); } catch {} }
});
$('#sendIg').addEventListener('click', () => {
  copy($('#orderText').textContent);
  toast('Pedido copiado: si no aparece en el chat, pegalo');
});
$('#copyOrder').addEventListener('click', async () => { toast(await copy($('#orderText').textContent) ? 'Pedido copiado' : 'No se pudo copiar, seleccionalo a mano'); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') $$('.overlay').filter(o => !o.hidden).forEach(o => closeOverlay('#' + o.id));
});
$$('#formDatos, #formEnvio').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); next(); }));
/* ---------- personalizados ---------- */
let fotos = [];
const lugares = () => $$('#cLugares input:checked').map(i => i.value);
function customTxt() {
  const ig = $('#cIg').value.trim();
  return [`🎨 COTIZACIÓN DISEÑO PERSONALIZADO · NX JUTSU`, '',
    `Prenda: ${$('#cPrenda').value}`, `Color: ${$('#cColor').value} · Talle: ${$('#cTalle').value} · Cantidad: ${$('#cCant').value || 1}`,
    `Estampado: ${lugares().join(' + ') || 'A definir'}`, '', `Idea: ${$('#cIdea').value.trim()}`, '',
    fotos.length ? `📷 Te adjunto ${fotos.length === 1 ? 'la foto' : fotos.length + ' fotos'} de referencia.` : '',
    `👤 ${$('#cNombre').value.trim()}${ig ? ' · ' + ig : ''}`].filter((l, i, arr) => l !== '' || arr[i - 1] !== '').join('\n');
}
function syncCustom() {
  const ok = $('#cIdea').value.trim().length >= 5 && $('#cNombre').value.trim().length >= 2;
  $('#cCotizar').hidden = !ok;
  $('#cHint').hidden = ok;
}
function renderThumbs() {
  $('#cThumbs').innerHTML = fotos.map((f, i) => `<div class="thumb"><img src="${f.url}" alt="Foto de referencia ${i + 1}"><button type="button" data-rmfoto="${i}" aria-label="Quitar foto">×</button></div>`).join('');
  $('#uploadBox').classList.toggle('has', fotos.length > 0);
}
$('#cFotos').addEventListener('change', e => {
  [...e.target.files].forEach(f => { if (fotos.length < 4 && f.type.startsWith('image/')) fotos.push({ file: f, url: URL.createObjectURL(f) }); });
  e.target.value = ''; renderThumbs(); syncCustom();
});
$('#cThumbs').addEventListener('click', e => {
  const b = e.target.closest('[data-rmfoto]'); if (!b) return;
  URL.revokeObjectURL(fotos[+b.dataset.rmfoto].url); fotos.splice(+b.dataset.rmfoto, 1); renderThumbs();
});
['#cIdea', '#cNombre'].forEach(s => $(s).addEventListener('input', syncCustom));
$('#customForm').addEventListener('submit', e => {
  e.preventDefault();
  syncCustom(); if ($('#cCotizar').hidden) return;
  const txt = customTxt();
  copy(txt);
  const a = document.createElement('a'); a.href = igLink(txt); a.target = '_blank'; a.rel = 'noopener';
  document.body.append(a); a.click(); a.remove();
  $('#cDone').hidden = false;
  $('#cFotoNote').hidden = !fotos.length;
  const files = fotos.map(f => f.file);
  $('#cShare').hidden = !(files.length && navigator.canShare && navigator.canShare({ files }));
  $('#cDone').scrollIntoView({ behavior: 'smooth', block: 'center' });
});
$('#cCopy').addEventListener('click', async () => toast(await copy(customTxt()) ? 'Mensaje copiado' : 'No se pudo copiar'));
$('#cShare').addEventListener('click', async () => {
  try { await navigator.share({ files: fotos.map(f => f.file), title: 'Referencia NX JUTSU' }); } catch {}
});
$$('.field input').forEach(i => i.addEventListener('input', () => i.classList.remove('bad')));

/* ---------- init ---------- */
$('#fProv').innerHTML = '<option value="">Elegí…</option>' + PROVINCIAS.map(p => `<option>${p[0]}</option>`).join('');
['fNombre', 'fIg', 'fDni', 'fTel', 'fEmail', 'fProv', 'fCp', 'fLocalidad', 'fDir', 'fSuc'].forEach(id => { if (checkout[id]) $('#' + id).value = checkout[id]; });
$$('.mp-pct').forEach(s => s.textContent = Math.round(CONFIG.mercadoPago.recargo * 100));
$('#year').textContent = new Date().getFullYear();
renderChips(); renderGrid(); renderCart(); goStep(0);
