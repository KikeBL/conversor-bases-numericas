/* Comprobaciones sin dependencias: node comprobar.cjs
   El DOM simulado comprueba los eventos y los estados, no el renderizado del navegador. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, 'conversor_num_rico.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const elements = new Map();
const allElements = new Set();
const domEvents = {};
const windowEvents = {};
let copyResult = true;
let clipboardText;
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks++; };
const equal = (actual, expected, message) => { assert.equal(actual, expected, message); checks++; };
const throws = (action, message) => { assert.throws(action, undefined, message); checks++; };

class Element {
  constructor(tag, attrs = {}) {
    this.tag = tag;
    this.attrs = attrs;
    this.id = attrs.id;
    this.dataset = {};
    for (const [key, value] of Object.entries(attrs)) {
      if (key.startsWith('data-')) this.dataset[key.slice(5)] = value;
    }
    this.value = attrs.value || '';
    this.hidden = Object.hasOwn(attrs, 'hidden');
    this.disabled = false;
    this.open = false;
    this.textContent = '';
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.events = {};
    this.children = [];
    allElements.add(this);
    if (this.id) elements.set(this.id, this);
  }
  setAttribute(key, value) { this.attrs[key] = value; }
  getAttribute(key) { return this.attrs[key]; }
  addEventListener(event, handler) { this.events[event] = handler; }
  dispatch(event) { if (this.events[event]) return this.events[event](); }
  focus() { document.activeElement = this; }
  select() { this.focus(); this.selectionStart = 0; this.selectionEnd = this.value.length; }
  setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; }
  set innerHTML(value) {
    const remove = child => { child.children.forEach(remove); allElements.delete(child); if (child.id) elements.delete(child.id); };
    this.children.forEach(remove);
    this.children = [];
    this.markup = value;
    parseElements(value, this);
  }
  get innerHTML() { return this.markup || ''; }
}
function parseElements(markup, owner) {
  const stack = [owner];
  for (const match of markup.matchAll(/<(\/?)([a-z][a-z0-9-]*)(\s[^<>]*?)?>/gi)) {
    const [, closing, tag, attrText = ''] = match;
    if (closing) { if (stack.length > 1 && stack.at(-1).tag === tag) stack.pop(); continue; }
    const attrs = {};
    for (const attr of attrText.matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[attr[1]] = attr[2] || '';
    const element = new Element(tag, attrs);
    stack.at(-1).children.push(element);
    if (!['input', 'meta', 'link', 'br', 'hr'].includes(tag)) stack.push(element);
  }
}
const root = new Element('root');
parseElements(html.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script>[\s\S]*?<\/script>/, ''), root);
const document = {
  activeElement: null,
  getElementById(id) { const result = elements.get(id); assert.ok(result, `Existe #${id}`); return result; },
  addEventListener(event, handler) { domEvents[event] = handler; },
  querySelectorAll(selector) {
    if (selector.startsWith('[data-')) {
      const attr = selector.slice(1, -1);
      return [...allElements].filter(element => Object.hasOwn(element.attrs, attr));
    }
    if (selector.startsWith('.')) return [...allElements].filter(element => (element.attrs.class || '').split(' ').includes(selector.slice(1)));
    throw new Error(`Selector no simulado: ${selector}`);
  },
  execCommand(command) { equal(command, 'copy'); return copyResult; }
};
const window = { isSecureContext: false, addEventListener(event, handler) { windowEvents[event] = handler; }, print() {} };
const navigator = {};
const ctx = vm.createContext({ document, window, navigator, console, setTimeout() { return 1; }, clearTimeout() {} });
vm.runInContext(script, ctx);
const run = expression => vm.runInContext(expression, ctx);
const api = run('({ parseNumber, divisionSteps, positionalSteps, binaryGroups, asciiLabel, format, directionHTML, state, MAX_VALUE, setValue, copyValue })');
const max = (1n << 256n) - 1n;

// Casos conocidos independientes y entradas inválidas.
for (const [text, base, decimal] of [['11111111',2,255n], ['377',8,255n], ['FF',16,255n], ['2A',16,42n], ['101010',2,42n], ['9007199254740993',10,9007199254740993n]]) {
  equal(api.parseNumber(text,base),decimal);
}
for (const [text, base] of [['-12',10], ['+12',10], ['1.5',10], ['1,5',10], ['102',2], ['8',8], ['G',16], ['1 000',10], ['0x',16], ['0b',2], ['0o',8], ['<img>',16], ['١',10], ['2',2], ['Z',35], ['0xFF',2]]) throws(() => api.parseNumber(text,base));
for (const base of [1,3,4,32,36,37,2.5,NaN]) throws(() => api.parseNumber('1',base));
for (const [text, base, decimal] of [['  ff  ',16,255n], ['0xFf',16,255n], ['0b101',2,5n], ['0o77',8,63n], ['000',10,0n]]) equal(api.parseNumber(text,base),decimal);
equal(api.parseNumber('',10),null);
equal(api.parseNumber('   ',10),null);
throws(() => api.parseNumber('1'.repeat(259),2));
equal(api.parseNumber(max.toString(10),10),max);
throws(() => api.parseNumber((max+1n).toString(10),10));

// Reconstrucción exacta por ambos métodos para todas las bases.
const values = [0n,1n,2n,7n,8n,15n,16n,31n,32n,42n,65n,127n,128n,255n,256n,1024n,65535n,65536n,16777215n,9007199254740993n,max];
let seed = 20310930n;
for (let index=0;index<40;index++) { seed=(seed*6364136223846793005n+1442695040888963407n)&max; values.push(seed); }
let cases = 0;
for (const base of [2,8,10,16]) {
  for (const value of values) {
    const representation=value.toString(base).toUpperCase();
    equal(api.parseNumber(representation,base),value);
    const divisions=api.divisionSteps(value,base);
    equal(divisions.map(row=>row.digit).reverse().join(''),representation);
    for (const row of divisions) {
      equal(row.dividend,row.divisor*row.quotient+row.remainder);
      check(row.remainder>=0n && row.remainder<BigInt(base));
    }
    equal(divisions.at(-1).quotient,0n);
    const positions=api.positionalSteps(value,base);
    equal(positions.reduce((sum,row)=>sum+row.product,0n),value);
    equal(positions.at(-1).position,0);
    cases++;
  }
}
for (const base of [2,8,16]) {
  for (const value of values) {
    const data=api.binaryGroups(value,base);
    equal(data.groups.map(group=>group.digit).join(''),value.toString(base).toUpperCase());
    equal(BigInt('0b'+data.groups.map(group=>group.bits).join('')),value);
    check(data.padding>=0 && data.padding<data.width);
    for(const group of data.groups) equal(group.bits.length,data.width);
  }
}
// ASCII estricto, cero y bits superiores.
equal(api.asciiLabel(65n),'A (0x41)');
equal(api.asciiLabel(321n),'A (0x41)');
equal(api.asciiLabel(255n),'0xFF: fuera de ASCII');
equal(api.asciiLabel(32n),'Espacio (0x20)');
equal(api.asciiLabel(0n),'NUL (0x00)');
equal(api.asciiLabel(127n),'DEL (0x7F)');

// Estado inicial y eventos del documento, sin motor de renderizado.
domEvents.DOMContentLoaded();
const el=id=>document.getElementById(id);
const type=(id,value)=>{ el(id).value=value; el(id).dispatch('input'); };
equal(el('dec').value,'255');
equal(el('hex').value,'FF');
equal(el('base-a').value,'10');
equal(el('base-b').value,'2');
for (const id of ['base-a','base-b']) {
  equal([...el(id).innerHTML.matchAll(/<option value="(\d+)"/g)].map(match=>match[1]).join(','),'2,8,10,16');
}
check(el('directions').innerHTML.includes('Divide entre 2'));
check(el('directions').innerHTML.includes('Multiplica y suma las potencias'));
equal((el('reference-content').innerHTML.match(/<caption>/g) || []).length, 2);
equal((el('reference-content').innerHTML.match(/<tbody>/g) || []).length, 2);
check(el('reference-content').innerHTML.includes('0</th><td class="mono">000</td>'));
check(el('reference-content').innerHTML.includes('7</th><td class="mono">111</td>'));
check(el('reference-content').innerHTML.includes('F</th><td class="mono">1111</td>'));
check(!el('reference-content').innerHTML.includes('Z'));
equal(el('stat-parity').textContent,'Par (8 unos)');
equal(el('stat-ascii').textContent,'0xFF: fuera de ASCII');
for (const [id,value,expected] of [['hex','2a',42n],['bin','0b100000000',256n],['oct','777',511n],['dec','9007199254740993',9007199254740993n],['value-a','42',42n],['value-b','1111',15n]]) {
  type(id,value);
  equal(api.state.value,expected);
  check(api.state.valid);
}
type('dec','-12');
equal(el('dec').value,'-12','Nunca se eliminan silenciosamente caracteres');
equal(el('hex').value,'');
check(!el('input-error').hidden);
check(el('lesson-content').hidden);
check(el('bit-0').disabled);
check(el('print-button').disabled);
equal(el('dec').getAttribute('aria-invalid'),'true');
type('dec','12');
check(api.state.valid);
check(el('input-error').hidden);
equal(el('bin').value,'1100');
check(!el('bit-0').disabled);
type('hex','');
check(!api.state.valid);
check(el('input-error').hidden);
check(!el('empty-state').hidden);
equal(el('stat-bytes').textContent,'Sin datos');
document.querySelectorAll('[data-value]').find(button=>button.dataset.value==='0').dispatch('click');
check(api.state.valid);
equal(el('bin').value,'0');
equal(el('stat-bytes').textContent,'1 byte (1 bit)');
check(el('directions').innerHTML.includes('0 ÷ 2'));
check(el('directions').innerHTML.includes('2<sup>0</sup>'));
api.setValue(65536n);
el('bit-0').dispatch('click');
equal(api.state.value,65537n,'Se conservan los bits superiores');
el('bit-0').dispatch('click');
equal(api.state.value,65536n);

// Parejas de bases, intercambio, tablas y recuperación tras errores.
api.setValue(255n);
el('base-a').value='8'; el('base-a').dispatch('change');
el('base-b').value='16'; el('base-b').dispatch('change');
equal(el('value-a').value,'377');
equal(el('value-b').value,'FF');
check(el('grouping').innerHTML.includes('convierte con tablas'));
check(el('directions').innerHTML.includes('como puente'));
el('swap-bases').dispatch('click');
equal(api.state.a,16); equal(api.state.b,8);
equal(el('value-a').value,'FF'); equal(el('value-b').value,'377');
type('value-a','GG');
check(!api.state.valid);
el('swap-bases').dispatch('click');
equal(api.state.invalidSource,'value-b');
equal(el('value-b').value,'GG');
check(!api.state.valid);
type('value-b','AB');
equal(api.state.value,171n);
el('base-a').value='10'; el('base-a').dispatch('change');
el('base-b').value='16'; el('base-b').dispatch('change');
equal(el('value-a').value,'171');
type('value-b','F');
equal(api.state.value,15n);
equal(el('value-a').value,'15');
el('base-b').value='10'; el('base-b').dispatch('change');
check(el('directions').innerHTML.includes('La base no cambia'));
api.setValue(max);
check(el('directions').innerHTML.length<10000,'Bases iguales no generan operaciones redundantes');
el('base-a').value='2'; el('base-a').dispatch('change');
el('base-b').value='16'; el('base-b').dispatch('change');
check(document.querySelectorAll('.more-rows').length>0);
windowEvents.beforeprint();
check(document.querySelectorAll('.more-rows').every(details=>details.open));
windowEvents.afterprint();
check(document.querySelectorAll('.more-rows').every(details=>!details.open));

(async()=>{
  // La interfaz solo confirma copia cuando el navegador confirma el éxito.
  api.setValue(42n);
  copyResult=false;
  await api.copyValue('dec');
  check(el('toast').textContent.includes('No se pudo copiar'));
  copyResult=true;
  await api.copyValue('hex');
  equal(el('toast').textContent,'Número copiado.');
  window.isSecureContext=true;
  navigator.clipboard={ async writeText(text) { clipboardText=text; } };
  await api.copyValue('bin');
  equal(clipboardText,'101010');
  navigator.clipboard={ async writeText() { throw Error('Sin permiso'); } };
  await api.copyValue('dec');
  equal(el('toast').textContent,'Número copiado.');

  // Documento autónomo: ninguna dependencia externa ni ejecución de recursos remotos.
  check(!/<script\s+[^>]*src=/i.test(html));
  check(!/<link\s+[^>]*href=/i.test(html));
  check(!/@import|fetch\(|XMLHttpRequest|https?:\/\//.test(html));
  check(html.includes('prefers-reduced-motion'));
  check(html.includes('@media print'));
  console.log(`OK: ${cases} conversiones exactas entre bases 2, 8, 10 y 16; ${checks} comprobaciones.`);
  console.log('Incluye tablas, agrupación de bits, validación, eventos simulados, impresión y las dos rutas de copia.');
  console.log('La apariencia y el portapapeles real requieren comprobación en un navegador.');
})().catch(error=>{ console.error(error); process.exitCode=1; });
