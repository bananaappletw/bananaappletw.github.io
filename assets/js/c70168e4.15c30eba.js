"use strict";(self.webpackChunkblog=self.webpackChunkblog||[]).push([[395],{3905:(e,n,t)=>{t.d(n,{Zo:()=>p,kt:()=>d});var r=t(67294);function a(e,n,t){return n in e?Object.defineProperty(e,n,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[n]=t,e}function o(e,n){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);n&&(r=r.filter((function(n){return Object.getOwnPropertyDescriptor(e,n).enumerable}))),t.push.apply(t,r)}return t}function i(e){for(var n=1;n<arguments.length;n++){var t=null!=arguments[n]?arguments[n]:{};n%2?o(Object(t),!0).forEach((function(n){a(e,n,t[n])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):o(Object(t)).forEach((function(n){Object.defineProperty(e,n,Object.getOwnPropertyDescriptor(t,n))}))}return e}function l(e,n){if(null==e)return{};var t,r,a=function(e,n){if(null==e)return{};var t,r,a={},o=Object.keys(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||(a[t]=e[t]);return a}(e,n);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)t=o[r],n.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(a[t]=e[t])}return a}var c=r.createContext({}),s=function(e){var n=r.useContext(c),t=n;return e&&(t="function"==typeof e?e(n):i(i({},n),e)),t},p=function(e){var n=s(e.components);return r.createElement(c.Provider,{value:n},e.children)},u={inlineCode:"code",wrapper:function(e){var n=e.children;return r.createElement(r.Fragment,{},n)}},m=r.forwardRef((function(e,n){var t=e.components,a=e.mdxType,o=e.originalType,c=e.parentName,p=l(e,["components","mdxType","originalType","parentName"]),m=s(t),d=a,g=m["".concat(c,".").concat(d)]||m[d]||u[d]||o;return t?r.createElement(g,i(i({ref:n},p),{},{components:t})):r.createElement(g,i({ref:n},p))}));function d(e,n){var t=arguments,a=n&&n.mdxType;if("string"==typeof e||a){var o=t.length,i=new Array(o);i[0]=m;var l={};for(var c in n)hasOwnProperty.call(n,c)&&(l[c]=n[c]);l.originalType=e,l.mdxType="string"==typeof e?e:a,i[1]=l;for(var s=2;s<o;s++)i[s]=t[s];return r.createElement.apply(null,i)}return r.createElement.apply(null,t)}m.displayName="MDXCreateElement"},53817:(e,n,t)=>{t.r(n),t.d(n,{assets:()=>c,contentTitle:()=>i,default:()=>u,frontMatter:()=>o,metadata:()=>l,toc:()=>s});var r=t(87462),a=(t(67294),t(3905));const o={title:"alignment and round number using & and ~",tags:["linux kernel"],categories:["computer science"],date:new Date("2016-03-31T02:02:00.000Z")},i=void 0,l={permalink:"/archives/alignment-and-round-number-using-and",editUrl:"https://github.com/banananappletw/blog/edit/master/blog/archives/archives/alignment-and-round-number-using-and.md",source:"@site/archives/alignment-and-round-number-using-and.md",title:"alignment and round number using & and ~",description:"While tracing malloc.c code, I found some interesting bitwise operation.",date:"2016-03-31T02:02:00.000Z",formattedDate:"March 31, 2016",tags:[{label:"linux kernel",permalink:"/archives/tags/linux-kernel"}],readingTime:.525,hasTruncateMarker:!1,authors:[],frontMatter:{title:"alignment and round number using & and ~",tags:["linux kernel"],categories:["computer science"],date:"2016-03-31T02:02:00.000Z"},prevItem:{title:"I don't know c language",permalink:"/archives/I-don-t-know-c-language"},nextItem:{title:"2016 review",permalink:"/archives/review"}},c={authorsImageUrls:[]},s=[],p={toc:s};function u(e){let{components:n,...t}=e;return(0,a.kt)("wrapper",(0,r.Z)({},p,t,{components:n,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"While tracing malloc.c code, I found some interesting bitwise operation."),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"#define MALLOC_ALIGN_MASK      (MALLOC_ALIGNMENT - 1)\n#define MINSIZE  \n  (unsigned long)(((MIN_CHUNK_SIZE+MALLOC_ALIGN_MASK) & ~MALLOC_ALIGN_MASK))\n")),(0,a.kt)("p",null,"I found the answer in the stackoverflow."),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"http://stackoverflow.com/questions/14561402/how-is-this-size-alignment-working"},"http://stackoverflow.com/questions/14561402/how-is-this-size-alignment-working")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"All powers of two (1, 2, 4, 8, 16, 32...) can be aligned by simple a and operation.\n\nThis gives the size rounded down:\n\nsize &= ~(alignment - 1); \n\nor if you want to round up:\n\nsize = (size + alignment-1) & ~(alignment-1);\n")),(0,a.kt)("p",null,(0,a.kt)("strong",{parentName:"p"},"MINSIZE")," macro trying to find largest number alignment to ",(0,a.kt)("strong",{parentName:"p"},"MALLOC_ALIGNMENT")),(0,a.kt)("p",null,"For example"),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"MIN_CHUNK_SIZE = 25;\nMALLOC_ALIGNMENT = 8\nMALLOC_ALIGN_MASK = 8-1 = 7;\nMINSIZE = (25+7) & ~7 = 32;\n")),(0,a.kt)("h1",{id:"more"},"More"),(0,a.kt)("p",null,(0,a.kt)("a",{parentName:"p",href:"https://graphics.stanford.edu/%5C~seander/bithacks.html"},"https://graphics.stanford.edu/\\~seander/bithacks.html")))}u.isMDXComponent=!0}}]);