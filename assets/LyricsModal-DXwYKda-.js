import{a6 as e,j as l}from"./index-DaNVfHH5.js";import{r as t}from"./redux-BaDTb7KV.js";import{M as r}from"./Modal-CZT9fYGu.js";import{u as s,aD as a}from"./App-EHVD4Ae-.js";import{L as n}from"./LazyFlag-5IaG-wO3.js";import"./react-D41Hy763.js";const o=o=>{var i,c;const d=s((e=>e.year)),[u,m]=t.useState(""),[x,f]=t.useState(""),[p,h]=t.useState(""),[v,g]=t.useState(""),[b,j]=t.useState(!1),y=null==(i=o.countryContestant)?void 0:i.contestant;function N(e,l){if(!e)return e;let t=e.split("\\n");t.length>=2&&t[0]===l&&!t[1].trim()&&(t=t.slice(2));return t.join("\\n")}t.useEffect((()=>{d&&(null==y?void 0:y.song)&&(j(!1),g(""),h(""),m(void 0),f(void 0),e(y.id).then((e=>{!function(e,l,t){if(!(null==e?void 0:e.length))return void m("N/A");const r=N(e,t);m(r);const s=N(l,t);f(s)}(null==e?void 0:e.lyrics,null==e?void 0:e.engLyrics,y.song),h((null==e?void 0:e.composers)??""),g((null==e?void 0:e.lyricists)??"")})).catch(console.error))}),[o.countryContestant]);const k=({label:e,value:t})=>{if(!t)return null;const r=t.replaceAll(";",", ");return l.jsxs("div",{className:"flex",children:[l.jsxs("span",{className:"text-sm mr-[0.8em] w-[6.2em] text-right font-semibold",children:[e,":"]}),l.jsx("span",{className:"text-sm flex-1",children:r})]})};return l.jsxs(r,{isOpen:o.isOpen,onClose:o.onClose,className:"z-50 select-text min-h-[20em] gradient-background-modal",children:[l.jsx("div",{className:"-mt-[0.5em] mr-[1.2em] mb-3 font-semibold text-base text-slate-[400px]",children:l.jsxs("span",{children:[null==(c=o.countryContestant)?void 0:c.country.name," - ",null==y?void 0:y.artist,' - "',null==y?void 0:y.song,'"',(null==y?void 0:y.youtube)&&l.jsx("span",{className:"inline-block ml-3 -mb-1",children:l.jsx("a",{href:null==y?void 0:y.youtube,target:"_blank",rel:"noopener noreferrer",className:" float-right rounded text-slate-500 hover:text-slate-300",children:l.jsx(a,{className:"text-xl text-[#FF0000]x -mb-[0.1em]",title:"youtube"})})}),x&&l.jsxs("label",{className:"inline-flex float-right mr-2 mt-1 items-center cursor-pointer",title:"translate",children:[l.jsx("input",{type:"checkbox",value:"",onChange:e=>{j(e.target.checked)},className:"sr-only peer"}),l.jsx("div",{className:"relative w-7 h-4 bg-gray-00 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-gray-400 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-400 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"}),l.jsxs("span",{className:"ms-3 text-sm font-medium text-gray-900 dark:text-gray-300",children:[l.jsx(n,{code:"gb",className:"mr-3 w-6 opacity-60  float-right text-md flag-icon mr-1"})," "]})]})]})}),l.jsx("hr",{className:"mb-[1em] border-slate-500"}),l.jsxs("div",{className:"overflow-auto",children:[l.jsx(k,{label:"Composer(s)",value:null==p?void 0:p.replaceAll(";",", ")}),l.jsx(k,{label:"Lyricist(s)",value:null==v?void 0:v.replaceAll(";",", ")}),l.jsx("hr",{className:"mt-[1em] mr-2 border-slate-500"}),l.jsx("div",{className:"mt-[1em] relative overflow-hidden",children:l.jsxs("div",{className:"lyrics-wrapper",children:[l.jsx("div",{className:"lyrics-container "+(b&&(null==u?void 0:u.length)?"slide-out-left":"slide-in-right"),children:null==u?void 0:u.split("\\n").map(((e,t)=>l.jsx("div",{children:(null==e?void 0:e.length)?e:" "},t)))}),l.jsx("div",{className:"lyrics-container "+(b?"slide-in-right":"slide-out-left"),children:null==x?void 0:x.split("\\n").map(((e,t)=>l.jsx("div",{children:(null==e?void 0:e.length)?e:" "},t)))})]})})]})]})};export{o as default};
