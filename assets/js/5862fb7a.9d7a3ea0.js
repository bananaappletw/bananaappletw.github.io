"use strict";(self.webpackChunkblog=self.webpackChunkblog||[]).push([[7226],{3905:(e,t,n)=>{n.d(t,{Zo:()=>s,kt:()=>f});var r=n(67294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function o(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},l=Object.keys(e);for(r=0;r<l.length;r++)n=l[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(r=0;r<l.length;r++)n=l[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var p=r.createContext({}),c=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},s=function(e){var t=c(e.components);return r.createElement(p.Provider,{value:t},e.children)},u={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,l=e.originalType,p=e.parentName,s=o(e,["components","mdxType","originalType","parentName"]),d=c(n),f=a,m=d["".concat(p,".").concat(f)]||d[f]||u[f]||l;return n?r.createElement(m,i(i({ref:t},s),{},{components:n})):r.createElement(m,i({ref:t},s))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var l=n.length,i=new Array(l);i[0]=d;var o={};for(var p in t)hasOwnProperty.call(t,p)&&(o[p]=t[p]);o.originalType=e,o.mdxType="string"==typeof e?e:a,i[1]=o;for(var c=2;c<l;c++)i[c]=n[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},76268:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>p,contentTitle:()=>i,default:()=>u,frontMatter:()=>l,metadata:()=>o,toc:()=>c});var r=n(87462),a=(n(67294),n(3905));const l={title:"Preview file using send_file",author:"bananaapple",tags:["ruby on rails","send_file"],categories:["computer science"],date:new Date("2017-01-05T16:15:00.000Z")},i=void 0,o={permalink:"/archives/Preview-file-using-send-file",editUrl:"https://github.com/banananappletw/blog/edit/master/blog/archives/archives/Preview-file-using-send-file.md",source:"@site/archives/Preview-file-using-send-file.md",title:"Preview file using send_file",description:"\u5728 Ruby on rails \u88e1\u9762",date:"2017-01-05T16:15:00.000Z",formattedDate:"January 5, 2017",tags:[{label:"ruby on rails",permalink:"/archives/tags/ruby-on-rails"},{label:"send_file",permalink:"/archives/tags/send-file"}],readingTime:1.035,hasTruncateMarker:!1,authors:[{name:"bananaapple"}],frontMatter:{title:"Preview file using send_file",author:"bananaapple",tags:["ruby on rails","send_file"],categories:["computer science"],date:"2017-01-05T16:15:00.000Z"},prevItem:{title:"Concurrency vs parallelism",permalink:"/archives/concurrency-vs-parallelism"},nextItem:{title:"db/seeds for carrierwave",permalink:"/archives/db-seeds-for-carrierwave"}},p={authorsImageUrls:[void 0]},c=[{value:"<code>app/controllers/challenges_controller.rb</code>",id:"appcontrollerschallenges_controllerrb",level:2}],s={toc:c};function u(e){let{components:t,...n}=e;return(0,a.kt)("wrapper",(0,r.Z)({},s,n,{components:t,mdxType:"MDXLayout"}),(0,a.kt)("p",null,"\u5728 Ruby on rails \u88e1\u9762"),(0,a.kt)("p",null,"\u901a\u5e38\u90fd\u662f\u56e0\u70ba\u8981\u505a\u6a94\u6848\u6b0a\u9650\u63a7\u7ba1"),(0,a.kt)("p",null,"\u6240\u4ee5\u624d\u6703\u4f7f\u7528 ",(0,a.kt)("inlineCode",{parentName:"p"},"send_file")," \u9019\u500b method"),(0,a.kt)("p",null,"\u5982\u679c\u4e0d\u9700\u8981\u505a\u6a94\u6848\u4e0b\u8f09\u7684\u6b0a\u9650\u63a7\u7ba1\u7684\u8a71"),(0,a.kt)("p",null,"\u76f4\u63a5\u628a\u6a94\u6848\u653e\u5728 public \u8cc7\u6599\u593e\u5373\u53ef"),(0,a.kt)("p",null,"\u6709 access control \u7684\u6a94\u6848\u4e0b\u8f09\u53ef\u4ee5\u53c3\u8003\u9019\u7bc7 ",(0,a.kt)("a",{parentName:"p",href:"https://github.com/carrierwaveuploader/carrierwave/wiki/how-to:-secure-upload"},"carrierwave secure upload"),"\n\u9019\u6a23\u505a\u5b8c\u5f8c\u4f60\u7684 model \u88e1\u5c31\u6703\u6709\u4e00\u500b download method"),(0,a.kt)("p",null,"\u4f86\u5e6b\u4f60\u8b80\u6a94\u518d\u7528 ",(0,a.kt)("inlineCode",{parentName:"p"},"send_file")," \u4f86\u9001\u51fa\u53bb"),(0,a.kt)("h2",{id:"appcontrollerschallenges_controllerrb"},(0,a.kt)("inlineCode",{parentName:"h2"},"app/controllers/challenges_controller.rb")),(0,a.kt)("pre",null,(0,a.kt)("code",{parentName:"pre"},"def download\n  send_file file_path, disposition: 'inline'\nend\n")),(0,a.kt)("p",null,"\u91cd\u9ede\u6709\u5169\u500b"),(0,a.kt)("ol",null,(0,a.kt)("li",{parentName:"ol"},(0,a.kt)("inlineCode",{parentName:"li"},":disposition")," \u53c3\u6578\u7528\u4f86\u6307\u5b9a\u662f ",(0,a.kt)("inlineCode",{parentName:"li"},"inline")," \u9084\u662f ",(0,a.kt)("inlineCode",{parentName:"li"},"attachment"),"\uff0cdefault \u662f ",(0,a.kt)("inlineCode",{parentName:"li"},"attachment"),"\uff0c\u6240\u4ee5\u8981\u6307\u5b9a\u6210 ",(0,a.kt)("inlineCode",{parentName:"li"},"inline")),(0,a.kt)("li",{parentName:"ol"},"\u8a2d\u5b9a ",(0,a.kt)("inlineCode",{parentName:"li"},":type"),"\uff0c\u8a2d\u5b9a HTTP content type\uff0c\u700f\u89bd\u5668\u77e5\u9053\u8981\u600e\u9ebc\u5448\u73fe\u9019\u500b\u6a94\u6848\uff0c\u5c31\u662f\u6240\u8b02\u7684 ",(0,a.kt)("inlineCode",{parentName:"li"},"preview"),"\uff0c\u901a\u5e38\u9019\u500b\u53c3\u6578\u53ef\u4ee5\u4e0d\u7528\u8a2d\uff0c\u5b83\u6703\u81ea\u52d5\u5f9e ",(0,a.kt)("inlineCode",{parentName:"li"},":filename")," \u88e1\u6293\u53d6 file extension \u4e26\u9078\u64c7\u9069\u7576\u7684 MIME type \u7576\u4f5c HTTP content type")),(0,a.kt)("p",null,"#","Reference"),(0,a.kt)("ul",null,(0,a.kt)("li",{parentName:"ul"},(0,a.kt)("a",{parentName:"li",href:"http://api.rubyonrails.org/classes/ActionController/DataStreaming.html#method-i-send_file"},"send_file"))))}u.isMDXComponent=!0}}]);