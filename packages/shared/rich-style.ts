export const TEXT_COLORS=[['เริ่มต้น','#263540'],['เทา','#667085'],['น้ำตาล','#925e3b'],['ส้ม','#bd5d20'],['เขียว','#287452'],['น้ำเงิน','#355ec9'],['ม่วง','#7950b5'],['แดง','#b83e4b']] as const;
export const HIGHLIGHT_COLORS=[['เทา','#edf0f3'],['น้ำตาล','#f1e6dd'],['ส้ม','#ffead8'],['เหลือง','#fff1b8'],['เขียว','#dff1e7'],['น้ำเงิน','#e0eaff'],['ม่วง','#eee3fa'],['ชมพู','#fbe1e7']] as const;
export const FONT_SIZES=[12,14,16,18,20,24,28,32,40,48] as const;
export const FONT_CHOICES=[['เว็บไซต์',''],['Sans','IBM Plex Sans'],['Serif','Georgia'],['Mono','monospace']] as const;
export const CALLOUT_TONES=['note','info','success','warning'] as const;
const named:Record<string,string>={black:'#000000',white:'#ffffff',red:'#ff0000',blue:'#0000ff',green:'#008000',gray:'#808080',grey:'#808080',yellow:'#ffff00',purple:'#800080',orange:'#ffa500',pink:'#ffc0cb',brown:'#a52a2a',navy:'#000080',teal:'#008080',maroon:'#800000',silver:'#c0c0c0'};
export function normalizeColor(input:string):string|null{
 const value=input.trim().toLowerCase();if(/^#[a-f0-9]{6}$/.test(value))return value;if(/^#[a-f0-9]{3}$/.test(value))return '#'+[...value.slice(1)].map(c=>c+c).join('');
 const rgb=value.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*1(?:\.0+)?)?\s*\)$/);if(rgb){const parts=rgb.slice(1,4).map(Number);if(parts.every(n=>n<=255))return '#'+parts.map(n=>n.toString(16).padStart(2,'0')).join('');}return named[value]||null;
}
