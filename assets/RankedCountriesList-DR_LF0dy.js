const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/IntroColumn-ph-iF1nO.js","assets/index-CT1OnLq_.js","assets/react-D41Hy763.js","assets/redux-BaDTb7KV.js","assets/index-L-9YDoCi.css","assets/App-Dow6NKPA.js"])))=>i.map(i=>d[i]);
import{j as e,v as t,w as s,b as n,a,x as o,_ as l,n as r,y as i,e as c}from"./index-CT1OnLq_.js";import{r as d,R as u}from"./redux-BaDTb7KV.js";import{S as m,C as p}from"./Card-Cb9wYr5X.js";import{u as x,c as f,F as h,a as g,b as v,g as b,f as y,d as j,e as N,h as w,R as E,_ as C,i as k,r as S,j as M,k as R,l as T,m as D,n as P,o as O,p as L,q as _,s as I,t as $,v as A,w as U,x as Y,P as F,I as V,y as z}from"./App-Dow6NKPA.js";import{F as W}from"./react-world-flags-DN7W7A3o.js";import{D as X}from"./Dropdown-DLgSCTjh.js";import{c as B,a as H,E as q}from"./ExportUtil-EsctzqDV.js";import{R as G}from"./index-H0OwOG-2.js";import"./react-D41Hy763.js";const J=e=>e.some((e=>{var t,s;return null==(s=null==(t=null==e?void 0:e.contestant)?void 0:t.youtube)?void 0:s.length})),K=e=>{const t=e.match(/^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/);return t&&11===t[7].length?t[7]:null},Q=e=>e?`https://img.youtube.com/vi/${e}/hqdefault.jpg`:null,Z=s=>{var n,a,o,l,r,i,c,u;const m=x((e=>e.vote)),p=x((e=>e.categories)),E=x((e=>e.activeCategory)),C=x((e=>e.globalSearch)),k=x((e=>e.showTotalRank)),S=x((e=>e.showComparison)),M=x((e=>e.showThumbnail)),R=s.countryContestant.contestant,T=s.countryContestant.country,D=d.useRef(null);x((e=>e.theme));const P=(e=>{if(!e)return null;const t=K(e);return Q(t)||null})(null==R?void 0:R.youtube);d.useEffect((()=>{D.current&&(D.current.scrollLeft=s.categoryScrollPosition)}),[s.categoryScrollPosition]);const O=function(){if(k||S)return b(p,s.countryContestant)}();return e.jsxs("div",{children:[e.jsxs("div",{className:f(s.className,"m-auto text-slate-400 bg-[#03022d] bg-opacity-30 no-select","relative mx-[.5rem] min-h-[2.5em] py-[0.4em] flex flex-row","items-stretch !cursor-grabber whitespace-normal text-sm overflow-hidden","shadow rounded border border-0.5",s.isDragging?"shadow-slate-700 shadow-sm border-solid":"",s.isDragging||1!==s.rank?"":"first-card-glow",s.rank?"border-solid border-slate-400":"border-dashed"),style:{position:"relative"},children:[P&&M&&e.jsx("div",{className:"absolute top-0 right-0 h-full w-[30%] pointer-events-none overflow-hidden",children:e.jsx("div",{className:"relative w-full h-full",children:e.jsx("img",{src:P,className:"w-full h-full object-cover opacity-40",style:{display:"block",WebkitMaskImage:"linear-gradient(to right, transparent 0%, black 30%)",maskImage:"linear-gradient(to right, transparent 0%, black 30%)",objectPosition:"50% 50%",scale:"1.1"},onError:e=>{e.target.parentElement.parentElement.style.display="none"},onLoad:e=>{const t=e.target;120!==t.naturalWidth&&320!==t.naturalWidth||(t.parentElement.parentElement.style.display="none")},alt:""})})}),e.jsxs("div",{className:"relative z-10 flex flex-row items-stretch w-full",children:[e.jsx("div",{className:"-my-2 flex-shrink-0 pb-[1px] mr-3 font-bold w-8 pr-[0.01em] border-r-[0.05em] border-slate-500 bg-[#334678] bg-opacity-80 text-slate-300 tracking-tighter items-center justify-center flex text-lg rounded-sm",children:s.rank}),e.jsx("div",{className:"relative w-12 mr-3 flex items-center",children:e.jsxs("div",{className:"relative w-full",children:["yu"!==T.key?e.jsx(W,{code:T.key,className:"w-full opacity-80"}):e.jsx("img",{src:"https://upload.wikimedia.org/wikipedia/commons/6/61/Flag_of_Yugoslavia_%281946-1992%29.svg",alt:"Flag of Yugoslavia",className:"w-full h-auto opacity-80"}),C&&R&&e.jsx("div",{className:"bottom-0 left-0 right-0 bg-slate-600 bg-opacity-30 text-slate-300 text-sm font-bold text-center py-1",children:R.year})]})}),e.jsxs("div",{className:f("flex-grow text-slate-300 font-bold"),children:[e.jsxs("div",{className:"overflow-hidden overflow-ellipsis",children:[e.jsxs("span",{className:f("float-right flex flex-row items-center",(null==R?void 0:R.youtube)?"bg-opacity-80 bg-[#1c214c] border-[0.1em] border-gray-600 rounded-[0.2em] px-[0.5em] py-[0.1em] mr-[0.4em]":""),children:[(null==R?void 0:R.youtube)&&e.jsx("div",{onClick:()=>{s.openSongModal()},className:"cursor-pointer rounded text-slate-500 hover:text-slate-300 mr-[0.7em]",children:e.jsx(h,{className:"text-base",title:"lyrics"})}),(null==R?void 0:R.youtube)&&e.jsx("a",{href:null==R?void 0:R.youtube,target:"_blank",rel:"noopener noreferrer",className:"rounded text-slate-500 hover:text-slate-300",children:e.jsx(g,{className:"text-xl mr-[0.1em]",title:"youtube"})})]}),e.jsx("span",{className:"overflow-hidden overflow-ellipsis",children:null==T?void 0:T.name})]}),e.jsx("div",{className:"pr-[1.5em] flex flex-grow items-center justify-between font-normal",children:e.jsx("div",{className:"",children:R?e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"font-xs text-sm text-slate-400",children:null==R?void 0:R.artist}),e.jsx("span",{className:f("ml-2 font-xs text-xs text-slate-400 rounded-sm bg-[#1c214c] bg-opacity-60"),children:(null==(n=R.song)?void 0:n.length)&&!(null==(a=R.song)?void 0:a.includes("TBD"))?`"${R.song}"`:`${R.song}`}),e.jsxs("div",{className:"mt-1 font-xs text-xs text-gray-400 mb-1 flex flex-wrap",children:[void 0!==(null==(o=null==R?void 0:R.votes)?void 0:o.totalPoints)&&t(m,"t")&&e.jsxs("div",{className:"flex items-center mr-2",children:[e.jsx("span",{className:"text-gray-500",children:"total: "}),e.jsx("span",{children:`${null==(l=null==R?void 0:R.votes)?void 0:l.totalPoints}`})]}),void 0!==(null==(r=null==R?void 0:R.votes)?void 0:r.telePoints)&&t(m,"tv")&&e.jsxs("div",{className:"flex items-center mr-2",children:[e.jsx("span",{className:"text-gray-500",children:"tele: "}),e.jsx("span",{children:`${null==(i=null==R?void 0:R.votes)?void 0:i.telePoints}`})]}),void 0!==(null==(c=null==R?void 0:R.votes)?void 0:c.juryPoints)&&t(m,"j")&&e.jsxs("div",{className:"flex items-center mr-2",children:[e.jsx("span",{className:"text-gray-500",children:"jury: "}),e.jsx("span",{children:`${null==(u=null==R?void 0:R.votes)?void 0:u.juryPoints}`})]})]})]}):e.jsx("span",{className:"font-xs text-xs text-gray-500 strong",children:"Did not participate"})})})]}),!k&&e.jsx("div",{id:"right-edge",className:"mb-[0em] absolute bottom-0 right-0 flex-shrink-0 flex flex-row justify-between text-xl font-bold text-slate-500 z-10",children:e.jsx("div",{id:"gripper",className:"text-right pl-[0.3em] mr-[0.3em]",children:"⋮⋮"})})]})]},s.rank?"ranked-":`unranked-card-${(null==R?void 0:R.id)??T.id}`),(null==p?void 0:p.length)>0&&(k||S)&&e.jsx("div",{ref:D,className:"mt-0 mx-[0.6em] shadow-lg rounded-b-md bg-[#1c214c] bg-opacity-100 border-gray-600 border-x-[0.01em] border-b-[0.01em] overflow-x-auto relative ml-[2em]",onScroll:s.onCategoryScroll,children:e.jsx("div",{className:"flex",children:p.map(((t,n)=>{if(!k&&n===E)return null;const a=null==O?void 0:O[t.name],{arrowIcon:o,rankDifference:l}=function(e,t){const s=e&&t?t-e:0;let n=null;return s<0?n=Math.abs(s)>=3?y:j:s>0&&(n=s>=3?N:w),{arrowIcon:n,rankDifference:s}}(s.rank,a);return e.jsxs("div",{className:"px-2 py-1 text-xs flex-shrink-0 text-slate-400 h-[2em] flex",title:`weight: ${t.weight}`,children:[e.jsxs("span",{className:"",children:[t.name,":"]})," ",e.jsx("span",{className:"ml-1 font-medium text-slate-300",children:a||"--"}),o&&e.jsx(v,{icon:o,className:f("pt-[0.2em] ml-1 inline-block text-sm text-opacity-40",l<0?"text-green-500":"text-red-500")})]},n)}))})})]})};function ee(e,t){if(null==e)return{};var s={};for(var n in e)if({}.hasOwnProperty.call(e,n)){if(t.includes(n))continue;s[n]=e[n]}return s}function te(e,t){return(te=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,t){return e.__proto__=t,e})(e,t)}function se(e,t){e.prototype=Object.create(t.prototype),e.prototype.constructor=e,te(e,t)}function ne(e,t){return e.replace(new RegExp("(^|\\s)"+t+"(?:\\s|$)","g"),"$1").replace(/\s+/g," ").replace(/^\s*|\s*$/g,"")}const ae=!1,oe=u.createContext(null);var le=function(e){return e.scrollTop},re="unmounted",ie="exited",ce="entering",de="entered",ue="exiting",me=function(e){function t(t,s){var n;n=e.call(this,t,s)||this;var a,o=s&&!s.isMounting?t.enter:t.appear;return n.appearStatus=null,t.in?o?(a=ie,n.appearStatus=ce):a=de:a=t.unmountOnExit||t.mountOnEnter?re:ie,n.state={status:a},n.nextCallback=null,n}se(t,e),t.getDerivedStateFromProps=function(e,t){return e.in&&t.status===re?{status:ie}:null};var s=t.prototype;return s.componentDidMount=function(){this.updateStatus(!0,this.appearStatus)},s.componentDidUpdate=function(e){var t=null;if(e!==this.props){var s=this.state.status;this.props.in?s!==ce&&s!==de&&(t=ce):s!==ce&&s!==de||(t=ue)}this.updateStatus(!1,t)},s.componentWillUnmount=function(){this.cancelNextCallback()},s.getTimeouts=function(){var e,t,s,n=this.props.timeout;return e=t=s=n,null!=n&&"number"!=typeof n&&(e=n.exit,t=n.enter,s=void 0!==n.appear?n.appear:t),{exit:e,enter:t,appear:s}},s.updateStatus=function(e,t){if(void 0===e&&(e=!1),null!==t)if(this.cancelNextCallback(),t===ce){if(this.props.unmountOnExit||this.props.mountOnEnter){var s=this.props.nodeRef?this.props.nodeRef.current:E.findDOMNode(this);s&&le(s)}this.performEnter(e)}else this.performExit();else this.props.unmountOnExit&&this.state.status===ie&&this.setState({status:re})},s.performEnter=function(e){var t=this,s=this.props.enter,n=this.context?this.context.isMounting:e,a=this.props.nodeRef?[n]:[E.findDOMNode(this),n],o=a[0],l=a[1],r=this.getTimeouts(),i=n?r.appear:r.enter;!e&&!s||ae?this.safeSetState({status:de},(function(){t.props.onEntered(o)})):(this.props.onEnter(o,l),this.safeSetState({status:ce},(function(){t.props.onEntering(o,l),t.onTransitionEnd(i,(function(){t.safeSetState({status:de},(function(){t.props.onEntered(o,l)}))}))})))},s.performExit=function(){var e=this,t=this.props.exit,s=this.getTimeouts(),n=this.props.nodeRef?void 0:E.findDOMNode(this);t&&!ae?(this.props.onExit(n),this.safeSetState({status:ue},(function(){e.props.onExiting(n),e.onTransitionEnd(s.exit,(function(){e.safeSetState({status:ie},(function(){e.props.onExited(n)}))}))}))):this.safeSetState({status:ie},(function(){e.props.onExited(n)}))},s.cancelNextCallback=function(){null!==this.nextCallback&&(this.nextCallback.cancel(),this.nextCallback=null)},s.safeSetState=function(e,t){t=this.setNextCallback(t),this.setState(e,t)},s.setNextCallback=function(e){var t=this,s=!0;return this.nextCallback=function(n){s&&(s=!1,t.nextCallback=null,e(n))},this.nextCallback.cancel=function(){s=!1},this.nextCallback},s.onTransitionEnd=function(e,t){this.setNextCallback(t);var s=this.props.nodeRef?this.props.nodeRef.current:E.findDOMNode(this),n=null==e&&!this.props.addEndListener;if(s&&!n){if(this.props.addEndListener){var a=this.props.nodeRef?[this.nextCallback]:[s,this.nextCallback],o=a[0],l=a[1];this.props.addEndListener(o,l)}null!=e&&setTimeout(this.nextCallback,e)}else setTimeout(this.nextCallback,0)},s.render=function(){var e=this.state.status;if(e===re)return null;var t=this.props,s=t.children;t.in,t.mountOnEnter,t.unmountOnExit,t.appear,t.enter,t.exit,t.timeout,t.addEndListener,t.onEnter,t.onEntering,t.onEntered,t.onExit,t.onExiting,t.onExited,t.nodeRef;var n=ee(t,["children","in","mountOnEnter","unmountOnExit","appear","enter","exit","timeout","addEndListener","onEnter","onEntering","onEntered","onExit","onExiting","onExited","nodeRef"]);return u.createElement(oe.Provider,{value:null},"function"==typeof s?s(e,n):u.cloneElement(u.Children.only(s),n))},t}(u.Component);function pe(){}me.contextType=oe,me.propTypes={},me.defaultProps={in:!1,mountOnEnter:!1,unmountOnExit:!1,appear:!1,enter:!0,exit:!0,onEnter:pe,onEntering:pe,onEntered:pe,onExit:pe,onExiting:pe,onExited:pe},me.UNMOUNTED=re,me.EXITED=ie,me.ENTERING=ce,me.ENTERED=de,me.EXITING=ue;var xe=function(e,t){return e&&t&&t.split(" ").forEach((function(t){return n=t,void((s=e).classList?s.classList.remove(n):"string"==typeof s.className?s.className=ne(s.className,n):s.setAttribute("class",ne(s.className&&s.className.baseVal||"",n)));var s,n}))},fe=function(e){function t(){for(var t,s=arguments.length,n=new Array(s),a=0;a<s;a++)n[a]=arguments[a];return(t=e.call.apply(e,[this].concat(n))||this).appliedClasses={appear:{},enter:{},exit:{}},t.onEnter=function(e,s){var n=t.resolveArguments(e,s),a=n[0],o=n[1];t.removeClasses(a,"exit"),t.addClass(a,o?"appear":"enter","base"),t.props.onEnter&&t.props.onEnter(e,s)},t.onEntering=function(e,s){var n=t.resolveArguments(e,s),a=n[0],o=n[1]?"appear":"enter";t.addClass(a,o,"active"),t.props.onEntering&&t.props.onEntering(e,s)},t.onEntered=function(e,s){var n=t.resolveArguments(e,s),a=n[0],o=n[1]?"appear":"enter";t.removeClasses(a,o),t.addClass(a,o,"done"),t.props.onEntered&&t.props.onEntered(e,s)},t.onExit=function(e){var s=t.resolveArguments(e)[0];t.removeClasses(s,"appear"),t.removeClasses(s,"enter"),t.addClass(s,"exit","base"),t.props.onExit&&t.props.onExit(e)},t.onExiting=function(e){var s=t.resolveArguments(e)[0];t.addClass(s,"exit","active"),t.props.onExiting&&t.props.onExiting(e)},t.onExited=function(e){var s=t.resolveArguments(e)[0];t.removeClasses(s,"exit"),t.addClass(s,"exit","done"),t.props.onExited&&t.props.onExited(e)},t.resolveArguments=function(e,s){return t.props.nodeRef?[t.props.nodeRef.current,e]:[e,s]},t.getClassNames=function(e){var s=t.props.classNames,n="string"==typeof s,a=n?""+(n&&s?s+"-":"")+e:s[e];return{baseClassName:a,activeClassName:n?a+"-active":s[e+"Active"],doneClassName:n?a+"-done":s[e+"Done"]}},t}se(t,e);var s=t.prototype;return s.addClass=function(e,t,s){var n=this.getClassNames(t)[s+"ClassName"],a=this.getClassNames("enter").doneClassName;"appear"===t&&"done"===s&&a&&(n+=" "+a),"active"===s&&e&&le(e),n&&(this.appliedClasses[t][s]=n,function(e,t){e&&t&&t.split(" ").forEach((function(t){return n=t,void((s=e).classList?s.classList.add(n):function(e,t){return e.classList?!!t&&e.classList.contains(t):-1!==(" "+(e.className.baseVal||e.className)+" ").indexOf(" "+t+" ")}(s,n)||("string"==typeof s.className?s.className=s.className+" "+n:s.setAttribute("class",(s.className&&s.className.baseVal||"")+" "+n)));var s,n}))}(e,n))},s.removeClasses=function(e,t){var s=this.appliedClasses[t],n=s.base,a=s.active,o=s.done;this.appliedClasses[t]={},n&&xe(e,n),a&&xe(e,a),o&&xe(e,o)},s.render=function(){var e=this.props;e.classNames;var t=ee(e,["classNames"]);return u.createElement(me,C({},t,{onEnter:this.onEnter,onEntered:this.onEntered,onEntering:this.onEntering,onExit:this.onExit,onExiting:this.onExiting,onExited:this.onExited}))},t}(u.Component);fe.defaultProps={classNames:""},fe.propTypes={};const he=({icon:t,text:s,className:n,url:a,onClick:o,afterClick:l})=>e.jsxs("li",{role:"menuitem",className:f("text-slate-300 bg-slate-600 hover:bg-slate-700 flex w-full cursor-pointer select-none items-center gap-2 px-3 pt-[9px] pb-2 text-start transition-all hover:bg-blue-gray-50 hover:text-blue-gray-900 focus:bg-blue-gray-50 focus:bg-opacity-80 focus:text-blue-gray-900 active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900 bg-opacity-95 hover:bg-opacity-100",n),onClick:void 0!==a?()=>{return e=a,void window.open(e,"_blank","noopener,noreferrer");var e}:()=>{null==o||o(),null==l||l()},children:[e.jsx("div",{className:"w-[1.2em] text-center",children:t&&e.jsx(v,{icon:t})}),e.jsx("p",{className:"text-sm font-medium",children:s})]}),ge=({buttonIcon:t,text:s,children:n})=>{const[a,o]=d.useState(!1),[l,r]=d.useState({opacity:0,visibility:"hidden",transition:"opacity 200ms ease, visibility 200ms ease"}),i=d.useRef(null);d.useEffect((()=>{if(i.current){const e=i.current.getBoundingClientRect(),t={top:`${e.top+window.scrollY}px`,left:e.left+window.scrollX-180+"px",opacity:a?1:0,visibility:a?"visible":"hidden",transition:"opacity 200ms ease, visibility 200ms ease"};r(t)}}),[a]);return e.jsxs("li",{ref:i,className:f("relative bg-slate-600 hover:bg-slate-700 flex w-full cursor-pointer select-none items-center justify-between gap-2 px-3 pt-[9px] pb-2 text-start transition-all bg-opacity-95 hover:bg-opacity-100",{"!bg-slate-700":a}),onClick:()=>{o(!a)},children:[e.jsxs("div",{className:"flex items-center",children:[e.jsx("div",{className:"w-[1.2em] text-center",children:t&&e.jsx(v,{icon:t})}),e.jsx("p",{className:f("text-sm font-medium mx-2"),children:s})]}),e.jsx(v,{icon:k,className:"transition-transform "+(a?"rotate-90":"")}),S.createPortal(e.jsx("ul",{style:l,className:"absolute shadow-lg shadow-blue-gray-500/10 rounded-sm border border-slate-500 overflow-auto flex flex-col min-w-[180px] z-20 ",children:n}),document.body)]})},ve=t=>{const[n,a]=d.useState(!1),o=d.useRef(null),l=x((e=>e.rankedItems)),r=x((e=>e.headerMenuOpen)),i=M(),c=d.useRef(null),u=e=>{var t;const s=e.target,n=(e=>{for(;e;){if(e.id&&e.id.startsWith("react-joyride"))return!0;e=e.parentElement}return!1})(s);(null==(t=o.current)?void 0:t.contains(s))||n||a(!1)};function m(){a(!1)}return d.useEffect((()=>(document.addEventListener("mousedown",u),()=>{document.removeEventListener("mousedown",u),clearTimeout(undefined),document.body.classList.remove("no-scroll")})),[]),d.useEffect((()=>{r?(a(!0),document.body.classList.add("no-scroll"),i(s(!1))):setTimeout((()=>{document.body.classList.remove("no-scroll")}),300)}),[r]),e.jsxs("div",{className:"relative inline-block",ref:o,children:[e.jsx("button",{className:f("tour-step-6 w-6 h-6 bg-[#6e6795] hover:bg-slate-400 rounded-full flex justify-center items-center cursor-pointer",{"!bg-slate-400":n}),onClick:()=>{const e=n;a(!n),e?setTimeout((()=>{document.body.classList.remove("no-scroll")}),300):document.body.classList.add("no-scroll")},children:e.jsx(v,{className:"text-slate-300",icon:R})}),e.jsx(fe,{in:n,timeout:200,classNames:"menu",nodeRef:c,unmountOnExit:!0,children:e.jsxs("ul",{role:"menu",className:"absolute z-20 min-w-[180px] right-0 mt-1 shadow-lg shadow-blue-gray-500/10 rounded-sm border border-slate-500 overflow-auto flex flex-col",children:[e.jsx(he,{icon:T,text:"View Heat Map",className:"tour-step-8",onClick:t.onMapClick,afterClick:m}),J(l)&&e.jsx(he,{icon:D,text:"YouTube Playlist",className:"tour-step-7",onClick:()=>{var e;return window.open(null==(e=t.generateYoutubePlaylistUrl)?void 0:e.call(t),"_blank")},afterClick:m}),e.jsx(he,{icon:P,text:"Edit Name",onClick:()=>t.openNameModal(),afterClick:m}),e.jsx(he,{icon:O,text:"Categories",className:"tour-step-9",onClick:()=>t.openConfig("categories"),afterClick:m}),e.jsx(he,{icon:L,text:"Rankings",onClick:()=>t.openConfig("rankings"),afterClick:m}),e.jsx(he,{icon:_,text:"Display settings",onClick:()=>t.openConfig("display"),afterClick:m}),e.jsxs(ge,{text:"Copy",buttonIcon:I,children:[e.jsx(he,{text:"URL",icon:$,onClick:B}),e.jsx(he,{text:"Text",icon:A,onClick:()=>H(l,q.TEXT)}),e.jsx(he,{text:"CSV",icon:U,onClick:()=>H(l,q.CSV)}),e.jsx(he,{text:"JSON",icon:U,onClick:()=>H(l,q.JSON)})]})]})})]})},be=({setMapModalShow:t,generateYoutubePlaylistUrl:s,openNameModal:l,openConfig:r,supportedYears:i,className:c})=>{const u=M(),m=x((e=>e.year)),p=x((e=>e.name)),h=x((e=>e.globalSearch)),g=x((e=>e.rankedItems)),v=x((e=>e.showTotalRank)),b=x((e=>e.categories)),y=x((e=>e.showUnranked)),j=x((e=>e.activeCategory)),[N,w]=d.useState(0);return d.useEffect((()=>{0!==N?(v&&u(n(!1)),u(a(N-1))):!v&&(null==b?void 0:b.length)&&u(n(!0))}),[N]),d.useEffect((()=>{w(void 0!==j?j+1:0)}),[j]),e.jsxs("div",{className:f("z-40 rounded-t-md round-b-sm w-full text-center font-bold bg-blue-900 gradient-background text-slate-300 py-1 text-md tracking-tighter shadow-md ranked-bar-background",c),children:[y?e.jsx("div",{className:"w-full m-auto flex items-center justify-center",children:e.jsx(X,{className:"tour-step-1 w-[5em]",buttonClassName:"!h-[1.8em]",value:m,onChange:e=>{u(o(e))},options:i,showSearch:!0})}):e.jsxs("div",{className:"mr-2 ml-5 flex justify-between items-center",children:[(null==g?void 0:g.length)>0&&e.jsx(e.Fragment,{}),e.jsxs("div",{className:"justify-center w-full ml-2 mr-2",children:[h?null:m,p&&e.jsxs("span",{className:"font-bold text-slate-400 text-md",children:[h?"":" - ",p]})]}),e.jsx(ve,{openNameModal:l,openConfig:r,onMapClick:t,generateYoutubePlaylistUrl:()=>s(g)})]}),!y&&b.length>0&&e.jsxs("div",{className:"flex bg-gray-800 bg-opacity-40 border-gray-200 mt-1 -mb-[0.2em] overflow-x-auto",children:[e.jsx(G,{placeholder:e.jsx(e.Fragment,{}),children:e.jsx("button",{className:f("px-4 py-[0.2em] text-sm font-strong flex-shrink-0",0===N?"text-blue-400 border-b-0 border-blue-400":"text-gray-400 hover:text-blue-500"),onClick:()=>w(0),children:"Total"},"total-tab")},"total-ripple"),b.map(((t,s)=>e.jsx(G,{placeholder:e.jsx(e.Fragment,{}),children:e.jsx("button",{className:f("px-4 py-[0.2em] text-sm font-medium flex-shrink-0",N===s+1?"text-blue-400 border-b-0 border-blue-400":"text-gray-500 hover:text-blue-500"),onClick:()=>w(s+1),children:t.name},`cat-btn-${s+1}`)},`ripple-${s+1}`)))]},"total-tab-container")]})},ye=u.lazy((()=>l((()=>import("./IntroColumn-ph-iF1nO.js")),__vite__mapDeps([0,1,2,3,4,5])))),je=t=>{const[s,n]=d.useState(!1);return d.useEffect((()=>{n(!0)}),[]),e.jsx(d.Suspense,{fallback:e.jsx("div",{className:"w-[10em]"}),children:s?e.jsx(ye,{...t}):e.jsx("div",{children:"Loading..."})})},Ne=({openSongModal:t,openModal:s,openConfigModal:n,setRunTour:a,openNameModal:o,openMapModal:l})=>{const u=M(),[h,g]=d.useState(0),v=x((e=>e.showUnranked)),b=x((e=>e.theme)),y=x((e=>e.showTotalRank)),j=x((e=>e.isDeleteMode)),N=x((e=>e.rankedItems)),w=x((e=>e.categories)),E=x((e=>e.activeCategory)),[C,k]=d.useState(0),S=e=>{k(e.currentTarget.scrollLeft)};d.useEffect((()=>{0!==h&&r(E,w,N)}),[h]);const R=d.useCallback((e=>{u(Y(e)),g(Math.random())}),[u]);return e.jsx("div",{className:"tour-step-5 z-20",children:e.jsx(m,{droppableId:"rankedItems",children:r=>e.jsxs("div",{className:f("grid h-full max-h-full min-h-full grid-rows-[auto_1fr]"),children:[e.jsx(be,{setMapModalShow:()=>l(),generateYoutubePlaylistUrl:()=>(e=>"https://www.youtube.com/watch_videos?video_ids="+e.map((e=>{var t,s,n;if(!(null==(s=null==(t=null==e?void 0:e.contestant)?void 0:t.youtube)?void 0:s.length))return;let a=new URL(null==(n=null==e?void 0:e.contestant)?void 0:n.youtube);return new URLSearchParams(a.search).get("v")})).filter((e=>null==e?void 0:e.length)).join(","))(N),supportedYears:i,openNameModal:o,openConfig:n,className:v?"min-w-[9em] max-w-50vw-6em":"w-[80vw] max-w-[30.5em] min-w-[20.5em]"}),e.jsx("div",{className:"px-1 overflow-y-auto h-full",children:e.jsxs("ul",{...r.droppableProps,ref:r.innerRef,className:f("overflow-y-auto overflow-x-hidden pt-3 ranked-items-background w-full h-full",v?"min-w-[9em] max-w-50vw-6em":"w-[85vw] max-w-[30em] min-w-[20em]",{"auroral-background":b.includes("ab")}),children:[0===N.length&&v&&e.jsx(je,{openModal:s,openConfigModal:n,setRunTour:a}),!v&&0===N.length&&e.jsx("div",{className:"flex items-center justify-center h-full",children:e.jsxs("span",{className:"text-center mb-40 min-mt-5 text-slate-500 mx-10 text-sm",children:[e.jsx("div",{children:"Click 'Select' to choose"})," countries to rank",e.jsx("div",{children:e.jsx("img",{src:"/eurovision-heart.svg",alt:"Heart",style:{display:"inline",verticalAlign:"middle"},className:"ml-[0.5em] mt-3 w-5 h-5 opacity-70 grayscale"})})]})}),N.map(((s,n)=>e.jsx(F,{draggableId:(null==s?void 0:s.uid)??s.id,index:n,isDragDisabled:y,children:(a,o)=>e.jsx("li",{ref:a.innerRef,...a.draggableProps,...a.dragHandleProps,className:f("no-select m-2 mx-1",{"mt-0":0===n}),children:v?e.jsx(p,{className:"m-auto text-slate-400 bg-[#03022d] no-select",rank:n+1,countryContestant:s,isDeleteMode:v&&j,deleteCallBack:R,isDragging:o.isDragging},`card-${(null==s?void 0:s.uid)??s.id}`):e.jsx(Z,{rank:n+1,countryContestant:s,openSongModal:()=>t(s),isDragging:o.isDragging,categoryScrollPosition:C,onCategoryScroll:S},`card-${(null==s?void 0:s.uid)??s.id}`)},`li-${(null==s?void 0:s.uid)??s.id}`)},`draggable-${(null==s?void 0:s.uid)??s.id}`))),r.placeholder]})}),v&&(null==N?void 0:N.length)>0&&e.jsxs("div",{className:"pl-2 rounded-b-md h-8 bg-blue-900 ranked-bar-background text-slate-300 items-center flex shadow-md gradient-background",children:[e.jsx(V,{className:f("tour-step-4 ml-auto py-1 pl-[0.7em] pr-[0.9em] mr-0 w-[6em]",{"tada-animation-6s":v&&(null==N?void 0:N.length)}),onClick:()=>u(c(!v)),title:"View List"}),e.jsx(z,{className:f("ml-2 mr-auto text-lg justify-center align-center bounce-right text-blue-300",{"tada-animation":v&&(null==N?void 0:N.length)})})]})]})})})};export{Ne as default};
