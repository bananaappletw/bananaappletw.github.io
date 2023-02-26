"use strict";(self.webpackChunkblog=self.webpackChunkblog||[]).push([[3838],{3905:(e,t,r)=>{r.d(t,{Zo:()=>u,kt:()=>d});var n=r(67294);function o(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function a(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function i(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?a(Object(r),!0).forEach((function(t){o(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function l(e,t){if(null==e)return{};var r,n,o=function(e,t){if(null==e)return{};var r,n,o={},a=Object.keys(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||(o[r]=e[r]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(n=0;n<a.length;n++)r=a[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(o[r]=e[r])}return o}var p=n.createContext({}),c=function(e){var t=n.useContext(p),r=t;return e&&(r="function"==typeof e?e(t):i(i({},t),e)),r},u=function(e){var t=c(e.components);return n.createElement(p.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},m=n.forwardRef((function(e,t){var r=e.components,o=e.mdxType,a=e.originalType,p=e.parentName,u=l(e,["components","mdxType","originalType","parentName"]),m=c(r),d=o,f=m["".concat(p,".").concat(d)]||m[d]||s[d]||a;return r?n.createElement(f,i(i({ref:t},u),{},{components:r})):n.createElement(f,i({ref:t},u))}));function d(e,t){var r=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var a=r.length,i=new Array(a);i[0]=m;var l={};for(var p in t)hasOwnProperty.call(t,p)&&(l[p]=t[p]);l.originalType=e,l.mdxType="string"==typeof e?e:o,i[1]=l;for(var c=2;c<a;c++)i[c]=r[c];return n.createElement.apply(null,i)}return n.createElement.apply(null,r)}m.displayName="MDXCreateElement"},65615:(e,t,r)=>{r.r(t),r.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>s,frontMatter:()=>a,metadata:()=>l,toc:()=>c});var n=r(87462),o=(r(67294),r(3905));const a={title:"OpSec",tags:["security"],date:new Date("2021-07-27T00:00:00.000Z")},i=void 0,l={permalink:"/blog/opsec",editUrl:"https://github.com/bananaappletw/blog/edit/master/blog/opsec.md",source:"@site/blog/opsec.md",title:"OpSec",description:"Two-Factor Authentication (2FA)",date:"2021-07-27T00:00:00.000Z",formattedDate:"July 27, 2021",tags:[{label:"security",permalink:"/blog/tags/security"}],readingTime:.595,hasTruncateMarker:!1,authors:[],frontMatter:{title:"OpSec",tags:["security"],date:"2021-07-27T00:00:00.000Z"},prevItem:{title:"How to interview security engineer",permalink:"/blog/how-to-interview-security-engineer"},nextItem:{title:"GCP resource hierarchy",permalink:"/blog/gcp-resource-hierarchy"}},p={authorsImageUrls:[]},c=[{value:"Two-Factor Authentication (2FA)",id:"two-factor-authentication-2fa",level:2},{value:"FileVault",id:"filevault",level:2},{value:"Seperate browsers for different purposes",id:"seperate-browsers-for-different-purposes",level:2},{value:"Email",id:"email",level:2},{value:"Privacy",id:"privacy",level:2},{value:"Periodically check your data not leaked",id:"periodically-check-your-data-not-leaked",level:2}],u={toc:c};function s(e){let{components:t,...r}=e;return(0,o.kt)("wrapper",(0,n.Z)({},u,r,{components:t,mdxType:"MDXLayout"}),(0,o.kt)("h2",{id:"two-factor-authentication-2fa"},"Two-Factor Authentication (2FA)"),(0,o.kt)("p",null,"Enable Two-Factor Authentication on every service, and keep your device with you."),(0,o.kt)("h2",{id:"filevault"},"FileVault"),(0,o.kt)("p",null,"Enable FileVault to encrypt disk"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://support.apple.com/en-us/HT204837"},"Ref")),(0,o.kt)("admonition",{type:"warning"},(0,o.kt)("p",{parentName:"admonition"},"Lock Your Desktop When You're Away.")),(0,o.kt)("h2",{id:"seperate-browsers-for-different-purposes"},"Seperate browsers for different purposes"),(0,o.kt)("p",null,"For example, I usually used two browsers(Chrome Stable and Chrome Canary). Chrome Stable for my personal use, I will install any Chrome plugin I want on this browser. Chrome Canary for company use, without any Chrome plugin installed."),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://blog.chromium.org/2017/08/run-multiple-versions-of-chrome-side-by.html"},"run-multiple-versions-of-chrome-side-by.html")),(0,o.kt)("h2",{id:"email"},"Email"),(0,o.kt)("p",null,"Register SPF for your domain to detect forging sender addresses"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://en.wikipedia.org/wiki/Sender_Policy_Framework"},"SPF")),(0,o.kt)("h2",{id:"privacy"},"Privacy"),(0,o.kt)("p",null,"Whenever we are using the software, some of them will collect your data. For example, search history."),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://www.privacytools.io/"},"Privacy tool")),(0,o.kt)("h2",{id:"periodically-check-your-data-not-leaked"},"Periodically check your data not leaked"),(0,o.kt)("p",null,(0,o.kt)("a",{parentName:"p",href:"https://haveibeenpwned.com/"},"https://haveibeenpwned.com/")))}s.isMDXComponent=!0}}]);