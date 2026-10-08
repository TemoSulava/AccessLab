// Machado, Oliveira & Fernandes (2009), DOI 10.1109/TVCG.2009.113.
// Full-severity supplementary matrices; verified against Colorspacious cvd.py
// at 58948923b706879a54071568c7501be3f108797c. Attribution in ADR 006.
export type ColorMode='protanopia'|'deuteranopia'|'tritanopia';
export const COLOR_MATRICES:Record<ColorMode,readonly (readonly number[])[]>={
 protanopia:[[.152286,1.052583,-.204868],[.114503,.786281,.099216],[-.003882,-.048116,1.051998]],
 deuteranopia:[[.367322,.860646,-.227968],[.280085,.672501,.047413],[-.011820,.042940,.968881]],
 tritanopia:[[1.255528,-.076749,-.178779],[-.078411,.930809,.147602],[.004733,.691367,.303900]],
};
export function transformRGB(rgb:readonly number[],mode:ColorMode){const linear=rgb.map(value=>{const n=value/255;return n<=.04045?n/12.92:((n+.055)/1.055)**2.4});return COLOR_MATRICES[mode].map(row=>{const n=Math.min(1,Math.max(0,row.reduce((sum,c,i)=>sum+c*linear[i],0)));return Math.round(255*(n<=.0031308?12.92*n:1.055*n**(1/2.4)-.055));});}
export function colorFilter(document:Document,id:string,mode:ColorMode){
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg'),filter=document.createElementNS(ns,'filter'),matrix=document.createElementNS(ns,'feColorMatrix');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');svg.setAttribute('data-accesslab-color-resource','');svg.setAttribute('style','all:initial!important;position:fixed!important;width:0!important;height:0!important;pointer-events:none!important;overflow:hidden!important;');
 filter.id=id;filter.setAttribute('color-interpolation-filters','linearRGB');filter.setAttribute('x','0');filter.setAttribute('y','0');filter.setAttribute('width','100%');filter.setAttribute('height','100%');matrix.setAttribute('type','matrix');matrix.setAttribute('values',COLOR_MATRICES[mode].flatMap(row=>[...row,0,0]).concat([0,0,0,1,0]).join(' '));filter.append(matrix);svg.append(filter);return svg;
}
