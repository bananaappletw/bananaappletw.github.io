"use strict";(self.webpackChunkblog=self.webpackChunkblog||[]).push([[1708],{3905:(e,t,n)=>{n.d(t,{Zo:()=>u,kt:()=>m});var a=n(67294);function r(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function l(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);t&&(a=a.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,a)}return n}function s(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?l(Object(n),!0).forEach((function(t){r(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):l(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function p(e,t){if(null==e)return{};var n,a,r=function(e,t){if(null==e)return{};var n,a,r={},l=Object.keys(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||(r[n]=e[n]);return r}(e,t);if(Object.getOwnPropertySymbols){var l=Object.getOwnPropertySymbols(e);for(a=0;a<l.length;a++)n=l[a],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(r[n]=e[n])}return r}var i=a.createContext({}),o=function(e){var t=a.useContext(i),n=t;return e&&(n="function"==typeof e?e(t):s(s({},t),e)),n},u=function(e){var t=o(e.components);return a.createElement(i.Provider,{value:t},e.children)},c={inlineCode:"code",wrapper:function(e){var t=e.children;return a.createElement(a.Fragment,{},t)}},d=a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,l=e.originalType,i=e.parentName,u=p(e,["components","mdxType","originalType","parentName"]),d=o(n),m=r,k=d["".concat(i,".").concat(m)]||d[m]||c[m]||l;return n?a.createElement(k,s(s({ref:t},u),{},{components:n})):a.createElement(k,s({ref:t},u))}));function m(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var l=n.length,s=new Array(l);s[0]=d;var p={};for(var i in t)hasOwnProperty.call(t,i)&&(p[i]=t[i]);p.originalType=e,p.mdxType="string"==typeof e?e:r,s[1]=p;for(var o=2;o<l;o++)s[o]=n[o];return a.createElement.apply(null,s)}return a.createElement.apply(null,n)}d.displayName="MDXCreateElement"},11485:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>i,contentTitle:()=>s,default:()=>c,frontMatter:()=>l,metadata:()=>p,toc:()=>o});var a=n(87462),r=(n(67294),n(3905));const l={title:"Rails on Ubuntu",author:"bananaapple",tags:["ruby on rails"],categories:["computer science"],date:new Date("2017-06-22T12:39:00.000Z")},s="Introduction",p={permalink:"/archives/Rails-on-Ubuntu",editUrl:"https://github.com/banananappletw/blog/edit/master/blog/archives/archives/Rails-on-Ubuntu.md",source:"@site/archives/Rails-on-Ubuntu.md",title:"Rails on Ubuntu",description:"\u7c21\u55ae\u8a18\u9304\u4e00\u4e0b Ruby on Rails server setup",date:"2017-06-22T12:39:00.000Z",formattedDate:"June 22, 2017",tags:[{label:"ruby on rails",permalink:"/archives/tags/ruby-on-rails"}],readingTime:3.72,hasTruncateMarker:!1,authors:[{name:"bananaapple"}],frontMatter:{title:"Rails on Ubuntu",author:"bananaapple",tags:["ruby on rails"],categories:["computer science"],date:"2017-06-22T12:39:00.000Z"},prevItem:{title:"Review of bamboofox platform",permalink:"/archives/review-of-bamboofox-platform"},nextItem:{title:"Rails best practices",permalink:"/archives/Rails-Best-practice"}},i={authorsImageUrls:[void 0]},o=[{value:"Passenger",id:"passenger",level:2},{value:"Install passenger packages",id:"install-passenger-packages",level:3},{value:"Enable the passenger nginx module and restart nginx",id:"enable-the-passenger-nginx-module-and-restart-nginx",level:3},{value:"Notice",id:"notice",level:3},{value:"Let&#39;s Encrypt",id:"lets-encrypt",level:2},{value:"Postfix",id:"postfix",level:2},{value:"Install postfix package",id:"install-postfix-package",level:3},{value:"Configure postfix",id:"configure-postfix",level:3},{value:"Restart postfix",id:"restart-postfix",level:3},{value:"Deploy ruby on rails project",id:"deploy-ruby-on-rails-project",level:2},{value:"Create deploy user",id:"create-deploy-user",level:3},{value:"Install rvm",id:"install-rvm",level:3},{value:"Install basic gems",id:"install-basic-gems",level:3},{value:"Show passenger config",id:"show-passenger-config",level:3},{value:"Install nvm",id:"install-nvm",level:3},{value:"Install yarn",id:"install-yarn",level:3},{value:"Create basic app",id:"create-basic-app",level:3},{value:"Deploy on nginx",id:"deploy-on-nginx",level:3}],u={toc:o};function c(e){let{components:t,...n}=e;return(0,r.kt)("wrapper",(0,a.Z)({},u,n,{components:t,mdxType:"MDXLayout"}),(0,r.kt)("p",null,"\u7c21\u55ae\u8a18\u9304\u4e00\u4e0b Ruby on Rails server setup\n\u9019\u88e1\u7528\u7684\u662f\u6700\u65b0\u7248\u7684 Ubuntu 17.04 server \u7248\n\u9019\u7bc7\u6703\u6559\u4f60\u8a2d\u5b9a"),(0,r.kt)("ul",null,(0,r.kt)("li",{parentName:"ul"},"nginx"),(0,r.kt)("li",{parentName:"ul"},"passenger"),(0,r.kt)("li",{parentName:"ul"},"Let's Encrypt(https)"),(0,r.kt)("li",{parentName:"ul"},"postfix(mail server)")),(0,r.kt)("p",null,"\u56e0\u70ba\u8981\u8a2d\u5b9a Let's Encrypt \u548c postfix\uff0c\u6240\u4ee5\u8981\u6709\u4e00\u500b DNS \u7684 A Record \u6307\u5411\u4f60\u7684 ip \u4f4d\u7f6e"),(0,r.kt)("h2",{id:"passenger"},"Passenger"),(0,r.kt)("p",null,"\u9019\u88e1\u4e3b\u8981\u6709\u4e09\u7a2e\u65b9\u6cd5\u53ef\u4ee5\u9078"),(0,r.kt)("p",null,"\u8a73\u7d30\u5167\u5bb9\u53ef\u4ee5\u53c3\u8003",(0,r.kt)("a",{parentName:"p",href:"https://www.phusionpassenger.com/library/indepth/integration_modes.html"},"\u9019\u7bc7")),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Standalone mode")),(0,r.kt)("p",null,"\u53ea\u6709 passenger"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Nginx integration mode")),(0,r.kt)("p",null,"passenger \u548c nginx \u6574\u5408"),(0,r.kt)("ol",null,(0,r.kt)("li",{parentName:"ol"},"Apache integration mode")),(0,r.kt)("p",null,"passenger \u548c apache \u6574\u5408"),(0,r.kt)("p",null,"\u9019\u88e1\u9078\u7528\u7684\u662f\u7b2c\u4e8c\u7a2e\u65b9\u6cd5"),(0,r.kt)("p",null,"\u56e0\u70ba nginx \u7684\u6548\u80fd\u6bd4 apache \u597d"),(0,r.kt)("p",null,"\u63a5\u8457\u5c31\u958b\u59cb\u5b89\u88dd nginx + passenger\uff0c\u5927\u90e8\u5206\u7684\u6b65\u9a5f\u90fd\u8ddf",(0,r.kt)("a",{parentName:"p",href:"https://www.phusionpassenger.com/library/install/nginx/install/oss/xenial/"},"\u9019\u7bc7"),"\u4e00\u6a23"),(0,r.kt)("p",null,"\u7a0d\u5fae\u8981\u6ce8\u610f\u4e00\u4e0b ubuntu \u7684 code name\uff0c\u50cf\u662f 17.04 \u7684 code name \u662f Zesty\n\u5728\u52a0 apt \u7684 repo \u7684\u6642\u5019\u8981\u7a0d\u5fae\u6539\u4e00\u4e0b code name"),(0,r.kt)("h3",{id:"install-passenger-packages"},"Install passenger packages"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"deb https://oss-binaries.phusionpassenger.com/apt/passenger xenial main")," =>\n",(0,r.kt)("inlineCode",{parentName:"p"},"deb https://oss-binaries.phusionpassenger.com/apt/passenger zesty main")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 561F9B9CAC40B2F7\nsudo apt-get install -y apt-transport-https ca-certificates\n\n# Add our APT repository\nsudo sh -c 'echo deb https://oss-binaries.phusionpassenger.com/apt/passenger zesty main > /etc/apt/sources.list.d/passenger.list'\nsudo apt-get update\n\n# Install Passenger + Nginx\nsudo apt-get install -y nginx-extras passenger\n")),(0,r.kt)("h3",{id:"enable-the-passenger-nginx-module-and-restart-nginx"},"Enable the passenger nginx module and restart nginx"),(0,r.kt)("p",null,"\u4fee\u6539 ",(0,r.kt)("inlineCode",{parentName:"p"},"/etc/nginx/nginx.conf")," \u6a94\u6848 \u5c07 ",(0,r.kt)("inlineCode",{parentName:"p"},"# include /etc/nginx/passenger.conf")," \u53d6\u6d88\u8a3b\u89e3"),(0,r.kt)("p",null,"\u91cd\u555f nginx"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"sudo service nginx restart\n")),(0,r.kt)("h3",{id:"notice"},"Notice"),(0,r.kt)("p",null,"\u53e6\u5916\u7db2\u8def\u4e0a\u9084\u6709\u53e6\u4e00\u7a2e\u88dd passenger \u548c nginx \u7684\u65b9\u6cd5"),(0,r.kt)("p",null,"\u662f\u81ea\u884c\u4e0b\u8f09\u4e0b\u4f86\u7de8\u8b6f\uff0c\u6240\u6709\u7684\u5957\u4ef6\u6700\u5f8c\u6703\u653e\u5728 /opt \u8cc7\u6599\u593e\u5e95\u4e0b"),(0,r.kt)("p",null,"\u6211\u81ea\u5df1\u662f\u4e0d\u63a8\u85a6\u9019\u7a2e\u65b9\u6cd5\uff0c\u56e0\u70ba\u9084\u8981\u81ea\u5df1\u53bb\u8a2d\u5b9a service script"),(0,r.kt)("h2",{id:"lets-encrypt"},"Let's Encrypt"),(0,r.kt)("p",null,"\u8a73\u7d30\u53ef\u4ee5\u53c3\u8003",(0,r.kt)("a",{parentName:"p",href:"https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-16-04"},"\u9019\u7bc7")),(0,r.kt)("h2",{id:"postfix"},"Postfix"),(0,r.kt)("p",null,"\u8a2d\u5b9a\u597d Let's Encrypt \u5f8c\u5c31\u6703\u6709 ssh key \u4e86"),(0,r.kt)("h3",{id:"install-postfix-package"},"Install postfix package"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"sudo apt install -y postfix\n")),(0,r.kt)("h3",{id:"configure-postfix"},"Configure postfix"),(0,r.kt)("p",null,"\u4fee\u6539 ",(0,r.kt)("inlineCode",{parentName:"p"},"/etc/postfix/main.cf")),(0,r.kt)("p",null,"\u539f\u672c\u61c9\u8a72\u662f"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"# TLS parameters\nsmtpd_tls_cert_file=/etc/ssl/certs/ssl-cert-snakeoil.pem\nsmtpd_tls_key_file=/etc/ssl/private/ssl-cert-snakeoil.key\n")),(0,r.kt)("p",null,"\u4fee\u6539\u6210"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"# TLS parameters\nsmtpd_tls_cert_file=/etc/letsencrypt/live/bamboofox.nctucs.net/fullchain.pem\nsmtpd_tls_key_file=/etc/letsencrypt/live/bamboofox.nctucs.net/privkey.pem\nsmtp_tls_security_level=may\nsmtpd_tls_security_level=may\n")),(0,r.kt)("p",null,"\u6211\u7684 domain name \u662f ",(0,r.kt)("inlineCode",{parentName:"p"},"bamboofox.nctucs.net"),"\uff0c\u9019\u88e1\u8981\u4fee\u6539\u6210\u81ea\u5df1\u7684 domain name"),(0,r.kt)("p",null,(0,r.kt)("inlineCode",{parentName:"p"},"smtp_tls_security_level=may")," \u548c ",(0,r.kt)("inlineCode",{parentName:"p"},"smtpd_tls_security_level=may")," \u662f\u8b93 email \u5bc4\u4fe1\u548c\u6536\u4fe1\u52a0\u5bc6"),(0,r.kt)("p",null,"\u5c07\u81ea\u5df1\u7684 ip \u4e5f\u52a0\u9032 relay \u7684 list"),(0,r.kt)("p",null,"\u4fee\u6539 ",(0,r.kt)("inlineCode",{parentName:"p"},"/etc/postfix/main.cf")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128\n")),(0,r.kt)("p",null,"\u4fee\u6539\u6210"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 140.113.209.18 \n")),(0,r.kt)("p",null,"\u9019\u908a\u5f88\u91cd\u8981\u56e0\u70ba\u4e4b\u5f8c\u7528 ",(0,r.kt)("inlineCode",{parentName:"p"},"devise")," \u5bc4\u4fe1\u7684\u6642\u5019\u6703\u6709 ",(0,r.kt)("inlineCode",{parentName:"p"},"certification")," \u7684\u554f\u984c"),(0,r.kt)("h3",{id:"restart-postfix"},"Restart postfix"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"sudo service postfix restart\n")),(0,r.kt)("h2",{id:"deploy-ruby-on-rails-project"},"Deploy ruby on rails project"),(0,r.kt)("p",null,"\u53c3\u8003",(0,r.kt)("a",{parentName:"p",href:"https://gorails.com/deploy/ubuntu/16.04"},"\u9019\u7bc7")),(0,r.kt)("p",null,"\u76f4\u63a5\u5f9e\u5275 ",(0,r.kt)("inlineCode",{parentName:"p"},"deploy")," \u5e33\u865f\u958b\u59cb\u505a"),(0,r.kt)("h3",{id:"create-deploy-user"},"Create deploy user"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"sudo adduser deploy\nsudo adduser deploy sudo\nsu deploy\n")),(0,r.kt)("h3",{id:"install-rvm"},"Install rvm"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},'gpg --keyserver hkp://keys.gnupg.net --recv-keys 409B6B1796C275462A1703113804BB82D39DC0E3 7D2BAF1CF37B13E2069D6956105BD0E739499BDB\n\\curl -sSL https://get.rvm.io | bash -s stable\necho "source ~/.rvm/scripts/rvm" >> .bashrc\nsource ~/.rvm/scripts/rvm\nrvm install 2.4.0\nrvm use 2.4.0 --default\n')),(0,r.kt)("h3",{id:"install-basic-gems"},"Install basic gems"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"gem install bundler\ngem install rails\n")),(0,r.kt)("h3",{id:"show-passenger-config"},"Show passenger config"),(0,r.kt)("p",null,"\u57f7\u884c\u6307\u4ee4"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"passenger-config about ruby-command\n")),(0,r.kt)("p",null,"\u6703\u5f97\u5230"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"passenger-config was invoked through the following Ruby interpreter:\n  Command: /home/deploy/.rvm/gems/ruby-2.4.0/wrappers/ruby\n  Version: ruby 2.4.0p0 (2016-12-24 revision 57164) [x86_64-linux]\n  To use in Apache: PassengerRuby /home/deploy/.rvm/gems/ruby-2.4.0/wrappers/ruby\n  To use in Nginx : passenger_ruby /home/deploy/.rvm/gems/ruby-2.4.0/wrappers/ruby\n  To use with Standalone: /home/deploy/.rvm/gems/ruby-2.4.0/wrappers/ruby /usr/bin/passenger start\n")),(0,r.kt)("p",null,"\u9019\u8981\u7528\u5728\u7b49\u4e0b\u7684 nginx config"),(0,r.kt)("h3",{id:"install-nvm"},"Install nvm"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},'curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.2/install.sh | bash\nexport NVM_DIR="$HOME/.nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" # This loads nvm\nnvm install stable\n')),(0,r.kt)("h3",{id:"install-yarn"},"Install yarn"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},'curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -\necho "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list\nsudo apt-get update && sudo apt-get install yarn\n')),(0,r.kt)("h3",{id:"create-basic-app"},"Create basic app"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"rails new myapp --webpack=react\n")),(0,r.kt)("h3",{id:"deploy-on-nginx"},"Deploy on nginx"),(0,r.kt)("p",null,"\u4fee\u6539 myapp \u88e1\u7684 ",(0,r.kt)("inlineCode",{parentName:"p"},"config/secrets.yml")),(0,r.kt)("p",null,"\u9019\u88e1 secret \u53ef\u4ee5\u4f7f\u7528 ",(0,r.kt)("inlineCode",{parentName:"p"},"rake secret")," \u7522\u751f"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"production:\n  secret_key_base: d7913c3e87fadd4312ee1c5c1b13320caeecc72548f20b9122e2a1bf9ccdf0e9ecb86675168e578b5b3e960a81daa967c0081f69b082eb0c0e5df4b5810d71a9\n")),(0,r.kt)("p",null,"\u4fee\u6539 ",(0,r.kt)("inlineCode",{parentName:"p"},"/etc/nginx/sites-available/default")),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"server {\n\n        # SSL configuration\n        #\n        listen 443 ssl http2 default_server;\n        listen [::]:443 ssl http2 default_server;\n        include snippets/ssl-bamboofox.nctucs.net.conf;\n        include snippets/ssl-params.conf;\n        \n        # Add these three lines\n        \n        passenger_enabled on;\n        server_name bamboofox.nctucs.net;\n        root /home/deploy/myapp/public;\n}\n")),(0,r.kt)("p",null,"\u91cd\u555f nginx"),(0,r.kt)("pre",null,(0,r.kt)("code",{parentName:"pre"},"sudo service nginx restart\n")))}c.isMDXComponent=!0}}]);