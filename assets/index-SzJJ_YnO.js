const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/App-ZxbP04f2.js","assets/redux-DJT57R-M.js","assets/react-D-p_NVSb.js"])))=>i.map(i=>d[i]);
var e=Object.defineProperty,t=(t,a,n)=>((t,a,n)=>a in t?e(t,a,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[a]=n)(t,"symbol"!=typeof a?a+"":a,n);import{r as a,g as n,a as o,c as r,b as s,d as i,e as l,P as d}from"./redux-DJT57R-M.js";import{r as c}from"./react-D-p_NVSb.js";!function(){const e=document.createElement("link").relList;if(!(e&&e.supports&&e.supports("modulepreload"))){for(const e of document.querySelectorAll('link[rel="modulepreload"]'))t(e);new MutationObserver((e=>{for(const a of e)if("childList"===a.type)for(const e of a.addedNodes)"LINK"===e.tagName&&"modulepreload"===e.rel&&t(e)})).observe(document,{childList:!0,subtree:!0})}function t(e){if(e.ep)return;e.ep=!0;const t=function(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),"use-credentials"===e.crossOrigin?t.credentials="include":"anonymous"===e.crossOrigin?t.credentials="omit":t.credentials="same-origin",t}(e);fetch(e.href,t)}}();const u={},g=function(e,t,a){let n=Promise.resolve();if(t&&t.length>0){let e=function(e){return Promise.all(e.map((e=>Promise.resolve(e).then((e=>({status:"fulfilled",value:e})),(e=>({status:"rejected",reason:e}))))))};document.getElementsByTagName("link");const a=document.querySelector("meta[property=csp-nonce]"),o=(null==a?void 0:a.nonce)||(null==a?void 0:a.getAttribute("nonce"));n=e(t.map((e=>{if((e=function(e){return"/"+e}(e))in u)return;u[e]=!0;const t=e.endsWith(".css"),a=t?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${e}"]${a}`))return;const n=document.createElement("link");return n.rel=t?"stylesheet":"modulepreload",t||(n.as="script"),n.crossOrigin="",n.href=e,o&&n.setAttribute("nonce",o),document.head.appendChild(n),t?new Promise(((t,a)=>{n.addEventListener("load",t),n.addEventListener("error",(()=>a(new Error(`Unable to preload CSS for ${e}`))))})):void 0})))}function o(e){const t=new Event("vite:preloadError",{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return n.then((t=>{for(const e of t||[])"rejected"===e.status&&o(e.reason);return e().catch(o)}))};var p,y,m={exports:{}},f={};var h,k=(y||(y=1,m.exports=function(){if(p)return f;p=1;var e=a(),t=Symbol.for("react.element"),n=Symbol.for("react.fragment"),o=Object.prototype.hasOwnProperty,r=e.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,s={key:!0,ref:!0,__self:!0,__source:!0};function i(e,a,n){var i,l={},d=null,c=null;for(i in void 0!==n&&(d=""+n),void 0!==a.key&&(d=""+a.key),void 0!==a.ref&&(c=a.ref),a)o.call(a,i)&&!s.hasOwnProperty(i)&&(l[i]=a[i]);if(e&&e.defaultProps)for(i in a=e.defaultProps)void 0===l[i]&&(l[i]=a[i]);return{$$typeof:t,type:e,key:d,ref:c,props:l,_owner:r.current}}return f.Fragment=n,f.jsx=i,f.jsxs=i,f}()),m.exports),v={};const b=n(function(){if(h)return v;h=1;var e=c();return v.createRoot=e.createRoot,v.hydrateRoot=e.hydrateRoot,v}());function S(e){return JSON.parse(JSON.stringify(e))}const w=e=>{const t=e.map((e=>{var t;return null==(t=null==e?void 0:e.contestant)?void 0:t.year})).filter((e=>void 0!==e));return Array.from(new Set(t))},R={log:(...e)=>{},debug:(...e)=>{},info:(...e)=>{},warn:(...e)=>{},error:(...e)=>{}},C=Array.from({length:71},((e,t)=>(1956+t).toString())).reverse();function x(e){return 2===(null==e?void 0:e.length)?parseInt(e)<40?"20"+e:"19"+e:4===(null==e?void 0:e.length)?e:I}const I="2026",P=[{id:"a",name:"Albania",key:"al",icon:"flag-icon-al"},{id:".p",name:"Andorra",key:"ad",icon:"flag-icon-ad"},{id:"b",name:"Armenia",key:"am",icon:"flag-icon-am"},{id:"c",name:"Australia",key:"au",icon:"flag-icon-au"},{id:".d",name:"Austria",key:"at",icon:"flag-icon-at"},{id:".e",name:"Azerbaijan",key:"az",icon:"flag-icon-az"},{id:".f",name:"Belarus",key:"by",icon:"flag-icon-by"},{id:".g",name:"Belgium",key:"be",icon:"flag-icon-be"},{id:".h",name:"Bulgaria",key:"bg",icon:"flag-icon-bg"},{id:".m",name:"Bosnia & Herzegovina",key:"ba",icon:"flag-icon-ba"},{id:"i",name:"Croatia",key:"hr",icon:"flag-icon-hr"},{id:"j",name:"Cyprus",key:"cy",icon:"flag-icon-cy"},{id:"k",name:"Czechia",key:"cz",icon:"flag-icon-cz"},{id:"l",name:"Denmark",key:"dk",icon:"flag-icon-dk"},{id:"m",name:"Estonia",key:"ee",icon:"flag-icon-ee"},{id:"n",name:"Finland",key:"fi",icon:"flag-icon-fi"},{id:"o",name:"France",key:"fr",icon:"flag-icon-fr"},{id:"p",name:"Georgia",key:"ge",icon:"flag-icon-ge"},{id:"q",name:"Germany",key:"de",icon:"flag-icon-de"},{id:"r",name:"Greece",key:"gr",icon:"flag-icon-gr"},{id:"s",name:"Hungary",key:"hu",icon:"flag-icon-hu"},{id:"t",name:"Iceland",key:"is",icon:"flag-icon-is"},{id:"u",name:"Ireland",key:"ie",icon:"flag-icon-ie"},{id:"v",name:"Israel",key:"il",icon:"flag-icon-il"},{id:"w",name:"Italy",key:"it",icon:"flag-icon-it"},{id:"x",name:"Latvia",key:"lv",icon:"flag-icon-lv"},{id:"y",name:"Lithuania",key:"lt",icon:"flag-icon-lt"},{id:"z",name:"Luxembourg",key:"lu",icon:"flag-icon-lu"},{id:"0",name:"Malta",key:"mt",icon:"flag-icon-mt"},{id:"1",name:"Moldova",key:"md",icon:"flag-icon-md"},{id:"2",name:"Montenegro",key:"me",icon:"flag-icon-me"},{id:".i",name:"Monaco",key:"mc",icon:"flag-icon-mc"},{id:".l",name:"Morocco",key:"ma",icon:"flag-icon-ma"},{id:"3",name:"Netherlands",key:"nl",icon:"flag-icon-nl"},{id:"4",name:"Norway",key:"no",icon:"flag-icon-no"},{id:"5",name:"North Macedonia",key:"mk",icon:"flag-icon-mk"},{id:"6",name:"Poland",key:"pl",icon:"flag-icon-pl"},{id:"7",name:"Portugal",key:"pt",icon:"flag-icon-pt"},{id:"8",name:"Romania",key:"ro",icon:"flag-icon-ro"},{id:"9",name:"Russia",key:"ru",icon:"flag-icon-ru"},{id:".a",name:"San Marino",key:"sm",icon:"flag-icon-sm"},{id:".b",name:"Serbia",key:"rs",icon:"flag-icon-rs"},{id:".o",name:"Serbia & Montenegro",key:"cs",icon:"flag-icon-cs"},{id:".c",name:"Slovenia",key:"si",icon:"flag-icon-si"},{id:".n",name:"Slovakia",key:"sk",icon:"flag-icon-sk"},{id:"d",name:"Spain",key:"es",icon:"flag-icon-es"},{id:"e",name:"Sweden",key:"se",icon:"flag-icon-se"},{id:"f",name:"Switzerland",key:"ch",icon:"flag-icon-ch"},{id:".k",name:"Turkey",key:"tr",icon:"flag-icon-tr"},{id:"g",name:"Ukraine",key:"ua",icon:"flag-icon-ua"},{id:"h",name:"United Kingdom",key:"gb",icon:"flag-icon-gb"},{id:".j",name:"Yugoslavia",key:"yu",icon:"flag-icon-yu"}];function E(e){var t;if((null==e?void 0:e.length)&&"All"!==e){const a=null==(t=P.find((t=>t.name===e)))?void 0:t.key;return(null==a?void 0:a.length)||R.error("Source country not found for "+e),a}}function A(e){return e.some((e=>{var t,a,n,o;return(null==(a=null==(t=null==e?void 0:e.contestant)?void 0:t.votes)?void 0:a.juryPoints)&&(null==(o=null==(n=null==e?void 0:e.contestant)?void 0:n.votes)?void 0:o.juryPoints)>0}))}function O(e){return e.some((e=>{var t,a,n,o;return(null==(a=null==(t=null==e?void 0:e.contestant)?void 0:t.votes)?void 0:a.telePoints)&&(null==(o=null==(n=null==e?void 0:e.contestant)?void 0:n.votes)?void 0:o.telePoints)>0}))}function _(e){return e=x(e),parseInt(e)>2016?["Total","Televote","Jury"]:["Total"]}function T(e){if(e)switch(null==e?void 0:e.toLowerCase()){case"jury":return"j";case"total":return"t";case"tele":case"televote":return"tv";default:return}}function j(e,t,a){let n=`${e}-${t}`;const o=E(a);return(null==o?void 0:o.length)&&(n+=`-${o}`),n}function $(e,t){const a=function(e){const t={};return e.forEach((e=>{let a=t[N(e)];a||(a={totalPoints:void 0,juryPoints:void 0,telePoints:void 0,year:e.year,round:e.round},t[N(e)]=a);const n=M(e,"totalPoints"),o=M(e,"juryPoints"),r=M(e,"telePoints");isNaN(n)||(a.totalPoints=(a.totalPoints??0)+n),isNaN(o)||(a.juryPoints=(a.juryPoints??0)+o),isNaN(r)||(a.telePoints=(a.telePoints??0)+r)})),t}(t);return(e=S(e)).forEach((e=>{var t,n;e.contestant&&(e.contestant.votes=a[(t=e,`${t.country.key}-${null==(n=null==t?void 0:t.contestant)?void 0:n.year}`)]||void 0)})),e}function N(e){return`${e.toCountryKey}-${e.year}`}function M(e,t){const a=e[t];return parseInt(a,10)}let D,z,G,L={data:""},U=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||L,F=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,V=/\/\*[^]*?\*\/|  +/g,B=/\n+/g,H=(e,t)=>{let a="",n="",o="";for(let r in e){let s=e[r];"@"==r[0]?"i"==r[1]?a=r+" "+s+";":n+="f"==r[1]?H(s,r):r+"{"+H(s,"k"==r[1]?"":t)+"}":"object"==typeof s?n+=H(s,t?t.replace(/([^,])+/g,(e=>r.replace(/(^:.*)|([^,])+/g,(t=>/&/.test(t)?t.replace(/&/g,e):e?e+" "+t:t)))):r):null!=s&&(r=/^--/.test(r)?r:r.replace(/[A-Z]/g,"-$&").toLowerCase(),o+=H.p?H.p(r,s):r+":"+s+";")}return a+(t&&o?t+"{"+o+"}":o)+n},q={},J=e=>{if("object"==typeof e){let t="";for(let a in e)t+=a+J(e[a]);return t}return e},W=(e,t,a,n,o)=>{let r=J(e),s=q[r]||(q[r]=(e=>{let t=0,a=11;for(;t<e.length;)a=101*a+e.charCodeAt(t++)>>>0;return"go"+a})(r));if(!q[s]){let t=r!==e?e:(e=>{let t,a,n=[{}];for(;t=F.exec(e.replace(V,""));)t[4]?n.shift():t[3]?(a=t[3].replace(B," ").trim(),n.unshift(n[0][a]=n[0][a]||{})):n[0][t[1]]=t[2].replace(B," ").trim();return n[0]})(e);q[s]=H(o?{["@keyframes "+s]:t}:t,a?"":"."+s)}let i=a&&q.g?q.g:null;return a&&(q.g=q[s]),l=q[s],d=t,c=n,(u=i)?d.data=d.data.replace(u,l):-1===d.data.indexOf(l)&&(d.data=c?l+d.data:d.data+l),s;var l,d,c,u},Y=(e,t,a)=>e.reduce(((e,n,o)=>{let r=t[o];if(r&&r.call){let e=r(a),t=e&&e.props&&e.props.className||/^go/.test(e)&&e;r=t?"."+t:e&&"object"==typeof e?e.props?"":H(e,""):!1===e?"":e}return e+n+(null==r?"":r)}),"");function K(e){let t=this||{},a=e.call?e(t.p):e;return W(a.unshift?a.raw?Y(a,[].slice.call(arguments,1),t.p):a.reduce(((e,a)=>Object.assign(e,a&&a.call?a(t.p):a)),{}):a,U(t.target),t.g,t.o,t.k)}K.bind({g:1});let Z=K.bind({k:1});function Q(e,t){let a=this||{};return function(){let t=arguments;return function n(o,r){let s=Object.assign({},o),i=s.className||n.className;a.p=Object.assign({theme:z&&z()},s),a.o=/ *go\d+/.test(i),s.className=K.apply(a,t)+(i?" "+i:"");let l=e;return e[0]&&(l=s.as||e,delete s.as),G&&l[0]&&G(s),D(l,s)}}}var X=(e,t)=>(e=>"function"==typeof e)(e)?e(t):e,ee=(()=>{let e=0;return()=>(++e).toString()})(),te=(()=>{let e;return()=>{if(void 0===e&&typeof window<"u"){let t=matchMedia("(prefers-reduced-motion: reduce)");e=!t||t.matches}return e}})(),ae=new Map,ne=e=>{if(ae.has(e))return;let t=setTimeout((()=>{ae.delete(e),ie({type:4,toastId:e})}),1e3);ae.set(e,t)},oe=(e,t)=>{switch(t.type){case 0:return{...e,toasts:[t.toast,...e.toasts].slice(0,20)};case 1:return t.toast.id&&(e=>{let t=ae.get(e);t&&clearTimeout(t)})(t.toast.id),{...e,toasts:e.toasts.map((e=>e.id===t.toast.id?{...e,...t.toast}:e))};case 2:let{toast:a}=t;return e.toasts.find((e=>e.id===a.id))?oe(e,{type:1,toast:a}):oe(e,{type:0,toast:a});case 3:let{toastId:n}=t;return n?ne(n):e.toasts.forEach((e=>{ne(e.id)})),{...e,toasts:e.toasts.map((e=>e.id===n||void 0===n?{...e,visible:!1}:e))};case 4:return void 0===t.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter((e=>e.id!==t.toastId))};case 5:return{...e,pausedAt:t.time};case 6:let o=t.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map((e=>({...e,pauseDuration:e.pauseDuration+o})))}}},re=[],se={toasts:[],pausedAt:void 0},ie=e=>{se=oe(se,e),re.forEach((e=>{e(se)}))},le={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},de=e=>(t,a)=>{let n=((e,t="blank",a)=>({createdAt:Date.now(),visible:!0,type:t,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...a,id:(null==a?void 0:a.id)||ee()}))(t,e,a);return ie({type:2,toast:n}),n.id},ce=(e,t)=>de("blank")(e,t);ce.error=de("error"),ce.success=de("success"),ce.loading=de("loading"),ce.custom=de("custom"),ce.dismiss=e=>{ie({type:3,toastId:e})},ce.remove=e=>ie({type:4,toastId:e}),ce.promise=(e,t,a)=>{let n=ce.loading(t.loading,{...a,...null==a?void 0:a.loading});return e.then((e=>(ce.success(X(t.success,e),{id:n,...a,...null==a?void 0:a.success}),e))).catch((e=>{ce.error(X(t.error,e),{id:n,...a,...null==a?void 0:a.error})})),e};var ue,ge,pe,ye,me=(e,t)=>{ie({type:1,toast:{id:e,height:t}})},fe=()=>{ie({type:5,time:Date.now()})},he=e=>{let{toasts:t,pausedAt:a}=((e={})=>{let[t,a]=o.useState(se);o.useEffect((()=>(re.push(a),()=>{let e=re.indexOf(a);e>-1&&re.splice(e,1)})),[t]);let n=t.toasts.map((t=>{var a,n;return{...e,...e[t.type],...t,duration:t.duration||(null==(a=e[t.type])?void 0:a.duration)||(null==e?void 0:e.duration)||le[t.type],style:{...e.style,...null==(n=e[t.type])?void 0:n.style,...t.style}}}));return{...t,toasts:n}})(e);o.useEffect((()=>{if(a)return;let e=Date.now(),n=t.map((t=>{if(t.duration===1/0)return;let a=(t.duration||0)+t.pauseDuration-(e-t.createdAt);if(!(a<0))return setTimeout((()=>ce.dismiss(t.id)),a);t.visible&&ce.dismiss(t.id)}));return()=>{n.forEach((e=>e&&clearTimeout(e)))}}),[t,a]);let n=o.useCallback((()=>{a&&ie({type:6,time:Date.now()})}),[a]),r=o.useCallback(((e,a)=>{let{reverseOrder:n=!1,gutter:o=8,defaultPosition:r}=a||{},s=t.filter((t=>(t.position||r)===(e.position||r)&&t.height)),i=s.findIndex((t=>t.id===e.id)),l=s.filter(((e,t)=>t<i&&e.visible)).length;return s.filter((e=>e.visible)).slice(...n?[l+1]:[0,l]).reduce(((e,t)=>e+(t.height||0)+o),0)}),[t]);return{toasts:t,handlers:{updateHeight:me,startPause:fe,endPause:n,calculateOffset:r}}},ke=Z`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,ve=Z`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,be=Z`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,Se=Q("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ke} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${ve} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${be} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,we=Z`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,Re=Q("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${we} 1s linear infinite;
`,Ce=Z`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,xe=Z`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,Ie=Q("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${Ce} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${xe} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,Pe=Q("div")`
  position: absolute;
`,Ee=Q("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,Ae=Z`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,Oe=Q("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Ae} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,_e=({toast:e})=>{let{icon:t,type:a,iconTheme:n}=e;return void 0!==t?"string"==typeof t?o.createElement(Oe,null,t):t:"blank"===a?null:o.createElement(Ee,null,o.createElement(Re,{...n}),"loading"!==a&&o.createElement(Pe,null,"error"===a?o.createElement(Se,{...n}):o.createElement(Ie,{...n})))},Te=e=>`\n0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,je=e=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}\n`,$e=Q("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,Ne=Q("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,Me=o.memo((({toast:e,position:t,style:a,children:n})=>{let r=e.height?((e,t)=>{let a=e.includes("top")?1:-1,[n,o]=te()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[Te(a),je(a)];return{animation:t?`${Z(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${Z(o)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||t||"top-center",e.visible):{opacity:0},s=o.createElement(_e,{toast:e}),i=o.createElement(Ne,{...e.ariaProps},X(e.message,e));return o.createElement($e,{className:e.className,style:{...r,...a,...e.style}},"function"==typeof n?n({icon:s,message:i}):o.createElement(o.Fragment,null,s,i))}));ue=o.createElement,H.p=ge,D=ue,z=pe,G=ye;var De=({id:e,className:t,style:a,onHeightUpdate:n,children:r})=>{let s=o.useCallback((t=>{if(t){let a=()=>{let a=t.getBoundingClientRect().height;n(e,a)};a(),new MutationObserver(a).observe(t,{subtree:!0,childList:!0,characterData:!0})}}),[e,n]);return o.createElement("div",{ref:s,className:t,style:a},r)},ze=K`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,Ge=({reverseOrder:e,position:t="top-center",toastOptions:a,gutter:n,children:r,containerStyle:s,containerClassName:i})=>{let{toasts:l,handlers:d}=he(a);return o.createElement("div",{style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...s},className:i,onMouseEnter:d.startPause,onMouseLeave:d.endPause},l.map((a=>{let s=a.position||t,i=((e,t)=>{let a=e.includes("top"),n=a?{top:0}:{bottom:0},o=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:te()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${t*(a?1:-1)}px)`,...n,...o}})(s,d.calculateOffset(a,{reverseOrder:e,gutter:n,defaultPosition:t}));return o.createElement(De,{id:a.id,key:a.id,onHeightUpdate:d.updateHeight,className:a.visible?ze:"",style:i},"custom"===a.type?X(a.message,a):r?r(a):o.createElement(Me,{toast:a,position:s}))})))},Le=ce;class Ue extends Error{constructor(e,a,n,o=""){super(e),t(this,"status"),t(this,"kind"),t(this,"body"),this.name="ApiError",this.status=a,this.kind=n,this.body=o}}const Fe="https://api.eurovision-ranker.com";const Ve="eurovision_ranker_token";function Be(){try{return localStorage.getItem(Ve)}catch{return null}}function He(e){try{e?localStorage.setItem(Ve,e):localStorage.removeItem(Ve)}catch{}}let qe=null;async function Je(e){const{method:t="GET",path:a,body:n,auth:o=!0,isAuthEndpoint:r=!1}=e,s=`${Fe}${a.startsWith("/")?a:`/${a}`}`,i={};if(void 0!==n&&(i["Content-Type"]="application/json"),o){const e=Be();e&&(i.Authorization=`Bearer ${e}`)}let l;try{l=await fetch(s,{method:t,headers:i,body:void 0!==n?JSON.stringify(n):void 0})}catch(ue){const t=ue instanceof Error?ue.message:"Network error";throw new Ue(t||"Network error",0,"network")}const d=await l.text();if(!l.ok){const e=function(e,t){return 401===e?"unauthorized":403===e?"forbidden":404===e?"not_found":410===e?"gone":429===e?"rate_limited":400===e&&t.toLowerCase().startsWith("maximum number of rankings")?"max_rankings":e>=400&&e<500?"bad_request":e>=500?"server":"unknown"}(l.status,d);throw"unauthorized"===e&&(He(null),qe&&qe()),"rate_limited"===e&&r&&Le.error("Too many login/register attempts — try again in a minute."),new Ue(d||l.statusText,l.status,e,d)}if(d)try{return JSON.parse(d)}catch{return d}}function We(e){try{const t=e.split(".");return 3!==t.length?null:JSON.parse(atob(t[1].replace(/-/g,"+").replace(/_/g,"/")))}catch{return null}}function Ye(e){const t=We(e);if(!t)return null;const a=t.sub??t.user_id,n=t.email;return a&&n?{id:String(a),email:String(n)}:null}const Ke=function(){const e=Be();return e?function(e){const t=We(e);return!(!t||"number"!=typeof t.exp)&&1e3*t.exp<=Date.now()}(e)?(He(null),{token:null,user:null}):{token:e,user:Ye(e)}:{token:null,user:null}}(),Ze=r({name:"auth",initialState:{user:Ke.user,token:Ke.token,authStatus:"idle",authError:null,currentRankingId:null,lastSavedSignature:null,savedRankings:null,loadedAuthor:null},reducers:{setAuthStatus:(e,t)=>{e.authStatus=t.payload,"error"!==t.payload&&(e.authError=null)},setAuthError:(e,t)=>{e.authError=t.payload,e.authStatus=t.payload?"error":"idle"},loginSuccess:(e,t)=>{e.token=t.payload.token,e.user=t.payload.user,e.authStatus="idle",e.authError=null,He(t.payload.token)},logout:e=>{e.token=null,e.user=null,e.authStatus="idle",e.authError=null,e.currentRankingId=null,e.lastSavedSignature=null,e.loadedAuthor=null,e.savedRankings=null,He(null)},setCurrentRankingId:(e,t)=>{e.currentRankingId=t.payload},setLastSavedSignature:(e,t)=>{e.lastSavedSignature=t.payload},clearCurrentRanking:e=>{e.currentRankingId=null,e.lastSavedSignature=null,e.loadedAuthor=null},setLoadedAuthor:(e,t)=>{e.loadedAuthor=t.payload},patchUser:(e,t)=>{e.user&&(e.user={...e.user,...t.payload})},setSavedRankings:(e,t)=>{e.savedRankings=t.payload},upsertSavedRanking:(e,t)=>{const a=t.payload;if(!e.savedRankings)return void(e.savedRankings=[a]);const n=e.savedRankings.findIndex((e=>e.ranking_id===a.ranking_id));n>=0?e.savedRankings[n]=a:e.savedRankings.unshift(a)},removeSavedRanking:(e,t)=>{e.savedRankings&&(e.savedRankings=e.savedRankings.filter((e=>e.ranking_id!==t.payload)))},addGroupIdToRanking:(e,t)=>{if(!e.savedRankings)return;const a=e.savedRankings.find((e=>e.ranking_id===t.payload.rankingId));if(!a)return;const n=new Set(a.group_ids??[]);n.add(t.payload.groupId),a.group_ids=Array.from(n)},removeGroupIdFromRanking:(e,t)=>{if(!e.savedRankings)return;const a=e.savedRankings.find((e=>e.ranking_id===t.payload.rankingId));a&&a.group_ids&&(a.group_ids=a.group_ids.filter((e=>e!==t.payload.groupId)))}}}),{setAuthStatus:Qe,setAuthError:Xe,loginSuccess:et,logout:tt,setCurrentRankingId:at,setLastSavedSignature:nt,clearCurrentRanking:ot,setLoadedAuthor:rt,patchUser:st,setSavedRankings:it,upsertSavedRanking:lt,removeSavedRanking:dt,addGroupIdToRanking:ct,removeGroupIdFromRanking:ut}=Ze.actions,gt=Ze.reducer,pt=s("table/sortTable",(async(e,{getState:t})=>{const a=t(),n=a.table.tableState.sortColumn,o=a.table.tableState.sortDirection;let r="asc";return e===n&&(r="asc"===o?"desc":"asc"),{column:e,direction:r}})),yt=s("table/filterTable",(async(e,{getState:t})=>e)),mt=s("table/changePageSize",(async(e,{getState:t})=>e));s("items/addAllUnranked",(async(e,{dispatch:t,getState:a})=>{const n=a(),{categoryRankings:o,activeCategory:r,unrankedItems:s,categories:i}=n.root,l=o[r??0]??[];if(t(ta([])),t(Bt(l.concat(s))),t(Wt(s)),i.length>0){const e=new URLSearchParams(window.location.search);i.forEach(((t,a)=>{const n=`r${a+1}`,o=`${e.get(n)||""}${s.map((e=>e.country.id)).join("")}`;e.set(n,o)}));const t=`${window.location.pathname}?${e.toString()}`;window.history.replaceState(null,"",t)}return{rankedItems:l.concat(s),unrankedItems:[]}}));const ft=r({name:"table",initialState:{tableState:{sortColumn:"year",sortDirection:"desc",filters:{},pageSize:10,currentPage:1,filteredEntries:[],entries:[],searchTerm:"",selectedContestants:[],paginatedContestants:[]}},reducers:{setTableCurrentPage:(e,t)=>{e.tableState.currentPage=t.payload},setEntries:(e,t)=>{e.tableState.entries=t.payload},setSelectedContestants:(e,t)=>{e.tableState.selectedContestants=t.payload},setPaginatedContestants:(e,t)=>{e.tableState.paginatedContestants=t.payload},toggleSelectedContestant:(e,t)=>{const a=t.payload,n=e.tableState.selectedContestants.findIndex((e=>e.id===a));if(-1!==n)e.tableState.selectedContestants.splice(n,1);else{const t=e.tableState.entries.find((e=>e.id===a));t&&e.tableState.selectedContestants.push(t)}},addAllPaginatedContestants:e=>{const t=e.tableState.paginatedContestants.filter((t=>!e.tableState.selectedContestants.some((e=>e.id===t.id))));e.tableState.selectedContestants=[...e.tableState.selectedContestants,...t]}},extraReducers:e=>{e.addCase(pt.fulfilled,((e,t)=>{e.tableState.sortColumn=t.payload.column,e.tableState.sortDirection=t.payload.direction})).addCase(yt.fulfilled,((e,t)=>{e.tableState.filters=t.payload,e.tableState.currentPage=1})).addCase(mt.fulfilled,((e,t)=>{e.tableState.pageSize=t.payload,e.tableState.currentPage=1}))}}),{setTableCurrentPage:ht,setEntries:kt,setSelectedContestants:vt,setPaginatedContestants:bt,toggleSelectedContestant:St,addAllPaginatedContestants:wt}=ft.actions,Rt=ft.reducer,Ct=r({name:"groups",initialState:{groups:null,groupDetails:{},groupInvites:{},groupSharedRankings:{}},reducers:{setGroups:(e,t)=>{e.groups=t.payload},upsertGroup:(e,t)=>{const a=t.payload;if(e.groups){const t=e.groups.findIndex((e=>e.id===a.id));t>=0?e.groups[t]={...e.groups[t],...a}:e.groups.unshift(a)}else e.groups=[a];a.members?e.groupDetails[a.id]=a:e.groupDetails[a.id]&&(e.groupDetails[a.id]={...e.groupDetails[a.id],...a,members:e.groupDetails[a.id].members})},setGroupDetail:(e,t)=>{if(e.groupDetails[t.payload.id]=t.payload,e.groups){const a=e.groups.findIndex((e=>e.id===t.payload.id)),n={...t.payload,members:void 0};a>=0?e.groups[a]=n:e.groups.unshift(n)}},removeGroup:(e,t)=>{e.groups&&(e.groups=e.groups.filter((e=>e.id!==t.payload))),delete e.groupDetails[t.payload],delete e.groupInvites[t.payload],delete e.groupSharedRankings[t.payload]},setGroupInvites:(e,t)=>{e.groupInvites[t.payload.groupId]=t.payload.invites},addGroupInvite:(e,t)=>{const a=e.groupInvites[t.payload.group_id]??[];e.groupInvites[t.payload.group_id]=[t.payload,...a]},removeGroupInvite:(e,t)=>{const a=e.groupInvites[t.payload.groupId];a&&(e.groupInvites[t.payload.groupId]=a.filter((e=>e.token!==t.payload.token)))},setGroupSharedRankings:(e,t)=>{e.groupSharedRankings[t.payload.groupId]=t.payload.rankings}},extraReducers:e=>{e.addCase(tt,(e=>{e.groups=null,e.groupDetails={},e.groupInvites={},e.groupSharedRankings={}}))}}),{setGroups:xt,upsertGroup:It,setGroupDetail:Pt,removeGroup:Et,setGroupInvites:At,addGroupInvite:Ot,removeGroupInvite:_t,setGroupSharedRankings:Tt}=Ct.actions,jt=Ct.reducer,$t=e=>e.activeCategory??0,Nt=e=>{"public"===e.viewMode&&(e.viewMode="normal",e.publicViewId=void 0)},Mt=r({name:"root",initialState:{name:"",year:"",theme:"",vote:"loading",globalSearch:!1,showUnranked:!1,isDeleteMode:!1,headerMenuOpen:!1,contestants:[],categoryRankings:[[]],unrankedItems:[],categories:[],activeCategory:void 0,showTotalRank:!1,showComparison:!1,showThumbnail:!0,showPlace:!1,welcomeOverlayIsOpen:!1,viewMode:"normal",publicViewId:void 0},reducers:{setName:(e,t)=>{e.name=t.payload,Nt(e)},setYear:(e,t)=>{e.year=t.payload,Nt(e)},setTheme:(e,t)=>{e.theme=t.payload},setVote:(e,t)=>{e.vote=t.payload},setShowUnranked:(e,t)=>{e.showUnranked=t.payload},setIsDeleteMode:(e,t)=>{e.isDeleteMode=t.payload},setHeaderMenuOpen:(e,t)=>{e.headerMenuOpen=t.payload},setWelcomeOverlayIsOpen:(e,t)=>{e.welcomeOverlayIsOpen=t.payload},setRankedItems:(e,t)=>{e.categoryRankings[$t(e)]=t.payload,Nt(e)},setCategoryRankings:(e,t)=>{e.categoryRankings=t.payload.length?t.payload:[[]]},setActiveRankingAndSyncCategoryMembership:(e,t)=>{const a=t.payload,n=$t(e);e.categoryRankings[n]=a,Nt(e);const o=t=>e.globalSearch?t.uid:t.id,r=new Set(a.map(o)),s=Math.max(e.categories.length,e.categoryRankings.length);for(let i=0;i<s;i++){if(i===n)continue;const t=(e.categoryRankings[i]??[]).filter((e=>r.has(o(e)))),s=new Set(t.map(o)),l=a.filter((e=>!s.has(o(e))));e.categoryRankings[i]=[...t,...l]}},addCountryToOtherCategories:(e,t)=>{const a=$t(e),n=Math.max(e.categories.length,e.categoryRankings.length);for(let o=0;o<n;o++)o!==a&&(e.categoryRankings[o]||(e.categoryRankings[o]=[]),e.categoryRankings[o].push(t.payload));Nt(e)},appendCountriesToOtherCategories:(e,t)=>{const a=$t(e),n=Math.max(e.categories.length,e.categoryRankings.length);for(let o=0;o<n;o++)o!==a&&(e.categoryRankings[o]||(e.categoryRankings[o]=[]),e.categoryRankings[o].push(...t.payload));Nt(e)},removeCountryFromCategories:(e,t)=>{const a=t.payload;e.categoryRankings=e.categoryRankings.map((e=>e.filter((e=>e.id!==a&&e.uid!==a)))),Nt(e)},clearAllCategoryRankings:e=>{e.categoryRankings=e.categoryRankings.length?e.categoryRankings.map((()=>[])):[[]],Nt(e)},seedCategoryRankingSlots:(e,t)=>{const a=t.payload,n=e.categoryRankings[$t(e)]??[];for(let o=0;o<a;o++)e.categoryRankings[o]||(e.categoryRankings[o]=S(n))},removeCategoryRankingSlot:(e,t)=>{e.categoryRankings.splice(t.payload,1),e.categoryRankings.length||(e.categoryRankings=[[]])},collapseCategoryRankingsToSlot:(e,t)=>{const a=e.categoryRankings[t.payload]??e.categoryRankings.find((e=>e.length))??[];e.categoryRankings=[S(a)]},setCategoryRankingAtSlot:(e,t)=>{const{index:a,ranking:n}=t.payload;e.categoryRankings[a]=n},setUnrankedItems:(e,t)=>{e.unrankedItems=t.payload},setContestants:(e,t)=>{e.contestants=t.payload},setCategories:(e,t)=>{e.categories=t.payload},setActiveCategory:(e,t)=>{e.activeCategory=t.payload},setShowTotalRank:(e,t)=>{e.showTotalRank=t.payload},setShowComparison:(e,t)=>{e.showComparison=t.payload},setShowThumbnail:(e,t)=>{e.showThumbnail=t.payload},setShowPlace:(e,t)=>{e.showPlace=t.payload},setGlobalSearch:(e,t)=>{e.globalSearch=t.payload},enterPublicView:(e,t)=>{e.viewMode="public",e.publicViewId=t.payload},exitPublicView:e=>{e.viewMode="normal",e.publicViewId=void 0},assignVotesToContestants:(e,t)=>{const a=t.payload;e.contestants=$(S(e.contestants),a),e.categoryRankings=e.categoryRankings.map((e=>$(S(e),a))),e.unrankedItems=$(S(e.unrankedItems),a)}}}),{setName:Dt,setYear:zt,setTheme:Gt,setVote:Lt,setShowUnranked:Ut,setIsDeleteMode:Ft,setHeaderMenuOpen:Vt,setRankedItems:Bt,setCategoryRankings:Ht,setActiveRankingAndSyncCategoryMembership:qt,addCountryToOtherCategories:Jt,appendCountriesToOtherCategories:Wt,removeCountryFromCategories:Yt,clearAllCategoryRankings:Kt,seedCategoryRankingSlots:Zt,removeCategoryRankingSlot:Qt,collapseCategoryRankingsToSlot:Xt,setCategoryRankingAtSlot:ea,setUnrankedItems:ta,setContestants:aa,setCategories:na,setActiveCategory:oa,setShowTotalRank:ra,setShowComparison:sa,setShowThumbnail:ia,setShowPlace:la,assignVotesToContestants:da,setGlobalSearch:ca,setWelcomeOverlayIsOpen:ua,enterPublicView:ga,exitPublicView:pa}=Mt.actions,ya=Mt.reducer,ma=()=>e=>t=>e(t),fa=l({reducer:i({root:ya,auth:gt,table:Rt,groups:jt}),middleware:e=>e().concat(ma)}),ha=Object.freeze(Object.defineProperty({__proto__:null},Symbol.toStringTag,{value:"Module"}));qe=()=>{fa.dispatch(tt())};const ka=o.lazy((()=>g((()=>import("./App-ZxbP04f2.js").then((e=>e.bk))),__vite__mapDeps([0,1,2])))),va=()=>k.jsx("div",{className:"w-full h-full normal-bg","aria-label":"Loading"});b.createRoot(document.getElementById("root")).render(k.jsx(d,{store:fa,children:k.jsx(o.Suspense,{fallback:k.jsx(va,{}),children:k.jsx(ka,{})})}));export{ht as $,Qe as A,Ye as B,et as C,Le as D,Ue as E,xt as F,ua as G,Be as H,Ge as I,at as J,nt as K,rt as L,ga as M,pa as N,Yt as O,Jt as P,A as Q,O as R,da as S,na as T,ra as U,oa as V,st as W,ce as X,Vt as Y,C as Z,g as _,$ as a,bt as a0,kt as a1,qt as a2,mt as a3,yt as a4,pt as a5,w as a6,_ as a7,T as a8,E as a9,ea as aa,It as ab,Pt as ac,Et as ad,Tt as ae,At as af,ut as ag,_t as ah,Ot as ai,j as aj,it as ak,tt as al,lt as am,ct as an,ot as ao,dt as ap,S as aq,Xt as ar,Zt as as,Qt as at,ha as au,aa as b,P as c,I as d,Ht as e,ta as f,Dt as g,ca as h,sa as i,k as j,ia as k,R as l,la as m,Gt as n,Lt as o,zt as p,Bt as q,Wt as r,x as s,Kt as t,vt as u,Ft as v,wt as w,Ut as x,Je as y,Xe as z};
