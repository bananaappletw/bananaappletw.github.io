"use strict";(self.webpackChunkblog=self.webpackChunkblog||[]).push([[922],{3905:(t,e,n)=>{n.d(e,{Zo:()=>s,kt:()=>d});var r=n(67294);function i(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function a(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function o(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?a(Object(n),!0).forEach((function(e){i(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function l(t,e){if(null==t)return{};var n,r,i=function(t,e){if(null==t)return{};var n,r,i={},a=Object.keys(t);for(r=0;r<a.length;r++)n=a[r],e.indexOf(n)>=0||(i[n]=t[n]);return i}(t,e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);for(r=0;r<a.length;r++)n=a[r],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(i[n]=t[n])}return i}var u=r.createContext({}),c=function(t){var e=r.useContext(u),n=e;return t&&(n="function"==typeof t?t(e):o(o({},e),t)),n},s=function(t){var e=c(t.components);return r.createElement(u.Provider,{value:e},t.children)},p={inlineCode:"code",wrapper:function(t){var e=t.children;return r.createElement(r.Fragment,{},e)}},m=r.forwardRef((function(t,e){var n=t.components,i=t.mdxType,a=t.originalType,u=t.parentName,s=l(t,["components","mdxType","originalType","parentName"]),m=c(n),d=i,h=m["".concat(u,".").concat(d)]||m[d]||p[d]||a;return n?r.createElement(h,o(o({ref:e},s),{},{components:n})):r.createElement(h,o({ref:e},s))}));function d(t,e){var n=arguments,i=e&&e.mdxType;if("string"==typeof t||i){var a=n.length,o=new Array(a);o[0]=m;var l={};for(var u in e)hasOwnProperty.call(e,u)&&(l[u]=e[u]);l.originalType=t,l.mdxType="string"==typeof t?t:i,o[1]=l;for(var c=2;c<a;c++)o[c]=n[c];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},43916:(t,e,n)=>{n.r(e),n.d(e,{assets:()=>u,contentTitle:()=>o,default:()=>p,frontMatter:()=>a,metadata:()=>l,toc:()=>c});var r=n(87462),i=(n(67294),n(3905));const a={title:"qira introduction",tags:["qira","ctf"],categories:["computer science"],date:new Date("2016-03-22T13:42:00.000Z")},o=void 0,l={permalink:"/archives/qira-introduction",editUrl:"https://github.com/banananappletw/blog/edit/master/blog/archives/archives/qira-introduction.md",source:"@site/archives/qira-introduction.md",title:"qira introduction",description:"image from qira.me website",date:"2016-03-22T13:42:00.000Z",formattedDate:"March 22, 2016",tags:[{label:"qira",permalink:"/archives/tags/qira"},{label:"ctf",permalink:"/archives/tags/ctf"}],readingTime:1.84,hasTruncateMarker:!1,authors:[],frontMatter:{title:"qira introduction",tags:["qira","ctf"],categories:["computer science"],date:"2016-03-22T13:42:00.000Z"},prevItem:{title:"how python pass argument in function",permalink:"/archives/how-python-pass-argument-in-function"},nextItem:{title:"useful tools",permalink:"/archives/useful-tools"}},u={authorsImageUrls:[]},c=[{value:"qira website",id:"qira-website",level:2},{value:"qira github repository",id:"qira-github-repository",level:2},{value:"Installation",id:"installation",level:2},{value:"Usage",id:"usage",level:2},{value:"Keyboard Shortcuts in web/client/controls.js",id:"keyboard-shortcuts-in-webclientcontrolsjs",level:2},{value:"Further",id:"further",level:2},{value:"Working with ida plugin",id:"working-with-ida-plugin",level:2},{value:"Testing environment",id:"testing-environment",level:3}],s={toc:c};function p(t){let{components:e,...n}=t;return(0,i.kt)("wrapper",(0,r.Z)({},s,n,{components:e,mdxType:"MDXLayout"}),(0,i.kt)("p",null,(0,i.kt)("img",{parentName:"p",src:"http://qira.me/img/first_splash.png",alt:"image from qira.me website"})),(0,i.kt)("hr",null),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"QIRA is timeless debugger"),(0,i.kt)("li",{parentName:"ul"},"Fullname is QEMU Interactive Runtime Analyser"),(0,i.kt)("li",{parentName:"ul"},"QIRA was initially developed at Google by George Hotz. Work continues at CMU.")),(0,i.kt)("h2",{id:"qira-website"},"qira website"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"http://qira.me/"},"http://qira.me/")),(0,i.kt)("h2",{id:"qira-github-repository"},"qira github repository"),(0,i.kt)("p",null,(0,i.kt)("a",{parentName:"p",href:"https://github.com/BinaryAnalysisPlatform/qira"},"https://github.com/BinaryAnalysisPlatform/qira")),(0,i.kt)("h2",{id:"installation"},"Installation"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"cd ~/\ngit clone https://github.com/BinaryAnalysisPlatform/qira.git\ncd qira/\n./install.sh\n")),(0,i.kt)("p",null,"If you want to run with other architecture, run the following command"),(0,i.kt)("p",null,"It will fetch other architecture's library"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"./fetchlib.sh\n")),(0,i.kt)("h2",{id:"usage"},"Usage"),(0,i.kt)("p",null,(0,i.kt)("img",{parentName:"p",src:"http://i.imgur.com/N5EpyfB.png",alt:"Usage"})),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"cd ~/\nwget http://train.cs.nctu.edu.tw/files/magic\nchmod +x ./magic\nqira  -s ./magic\n")),(0,i.kt)("p",null,"open other terminal and type"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"nc 0 4000\n")),(0,i.kt)("p",null,"use this terminal to interactive with program"),(0,i.kt)("p",null,"You could trace the instructions with web browser on http://localhost:3002/"),(0,i.kt)("h2",{id:"keyboard-shortcuts-in-webclientcontrolsjs"},"Keyboard Shortcuts in web/client/controls.js"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre"},"j -- next invocation of instruction\nk -- prev invocation of instruction\n\nshift-j -- next toucher of data\nshift-k -- prev toucher of data\n\nm -- go to return from current function\n, -- go to start of current function\n\nz -- zoom out max on vtimeline\n\nl -- set iaddr to instruction at current clnum\n\nleft  -- -1 fork\nright -- +1 fork\nup    -- -1 clnum\ndown  -- +1 clnum\n\nesc -- back\n\nshift-c -- clear all forks\n\nn -- rename instruction\nshift-n -- rename data\n; -- add comment at instruction\nshift-; -- add comment at data\n\ng -- go to change, address, or name\nspace -- toggle flat/function view\n\np -- analyze function at iaddr\nc -- make code at iaddr, one instruction\na -- make ascii at iaddr\nd -- make data at iaddr\nu -- make undefined at iaddr\n")),(0,i.kt)("h2",{id:"further"},"Further"),(0,i.kt)("p",null,"qira is made of following compoments"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"qemu"),(0,i.kt)("li",{parentName:"ul"},"flask"),(0,i.kt)("li",{parentName:"ul"},"python"),(0,i.kt)("li",{parentName:"ul"},"qiradb")),(0,i.kt)("p",null,"qemu is used to emulate other architecture"),(0,i.kt)("p",null,"Flask is a microframework for Python based on Werkzeug, Jinja 2 and good intentions"),(0,i.kt)("p",null,"The most code of qira is written by Python"),(0,i.kt)("p",null,"qiradb is a python package deal with the instruction trace"),(0,i.kt)("h2",{id:"working-with-ida-plugin"},"Working with ida plugin"),(0,i.kt)("h3",{id:"testing-environment"},"Testing environment"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},"Windows 10"),(0,i.kt)("li",{parentName:"ul"},"Vmware workstation Pro 12 with Ubuntu 15.10")),(0,i.kt)("p",null,"Install qira 1.2 on Ubuntu 15.10 and port-forwarding 3002 port"),(0,i.kt)("p",null,"Copy qira_ida66_windows.p64 and qira_ida66_windows.plw from qira/ida/bin/ to ida pro plugins/ directory"),(0,i.kt)("p",null,"Open Chrome and IDA PRO on windows 10"),(0,i.kt)("p",null,"It should work like this"),(0,i.kt)("p",null,(0,i.kt)("img",{parentName:"p",src:"http://qira.me/img/ida.png",alt:"ida plugin"})))}p.isMDXComponent=!0}}]);