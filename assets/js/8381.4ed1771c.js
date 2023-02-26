"use strict";(self.webpackChunkblog=self.webpackChunkblog||[]).push([[8381],{58381:(t,i,n)=>{n.r(i),n.d(i,{diagram:()=>c});var e=n(51896),s=n(58553),r=n(94646),o=(n(27856),n(11941),function(){var t=function(t,i,n,e){for(n=n||{},e=t.length;e--;n[t[e]]=i);return n},i=[6,9,10],n={trace:function(){},yy:{},symbols_:{error:2,start:3,info:4,document:5,EOF:6,line:7,statement:8,NL:9,showInfo:10,$accept:0,$end:1},terminals_:{2:"error",4:"info",6:"EOF",9:"NL",10:"showInfo"},productions_:[0,[3,3],[5,0],[5,2],[7,1],[7,1],[8,1]],performAction:function(t,i,n,e,s,r,o){switch(r.length,s){case 1:return e;case 4:break;case 6:e.setInfo(!0)}},table:[{3:1,4:[1,2]},{1:[3]},t(i,[2,2],{5:3}),{6:[1,4],7:5,8:6,9:[1,7],10:[1,8]},{1:[2,1]},t(i,[2,3]),t(i,[2,4]),t(i,[2,5]),t(i,[2,6])],defaultActions:{4:[2,1]},parseError:function(t,i){if(!i.recoverable){var n=new Error(t);throw n.hash=i,n}this.trace(t)},parse:function(t){var i=this,n=[0],e=[],s=[null],r=[],o=this.table,h="",l=0,c=0,a=2,y=1,u=r.slice.call(arguments,1),p=Object.create(this.lexer),g={yy:{}};for(var f in this.yy)Object.prototype.hasOwnProperty.call(this.yy,f)&&(g.yy[f]=this.yy[f]);p.setInput(t,g.yy),g.yy.lexer=p,g.yy.parser=this,void 0===p.yylloc&&(p.yylloc={});var m=p.yylloc;r.push(m);var _=p.options&&p.options.ranges;function d(){var t;return"number"!=typeof(t=e.pop()||p.lex()||y)&&(t instanceof Array&&(t=(e=t).pop()),t=i.symbols_[t]||t),t}"function"==typeof g.yy.parseError?this.parseError=g.yy.parseError:this.parseError=Object.getPrototypeOf(this).parseError;for(var k,b,x,v,w,I,S,E,A={};;){if(b=n[n.length-1],this.defaultActions[b]?x=this.defaultActions[b]:(null==k&&(k=d()),x=o[b]&&o[b][k]),void 0===x||!x.length||!x[0]){var P="";for(w in E=[],o[b])this.terminals_[w]&&w>a&&E.push("'"+this.terminals_[w]+"'");P=p.showPosition?"Parse error on line "+(l+1)+":\n"+p.showPosition()+"\nExpecting "+E.join(", ")+", got '"+(this.terminals_[k]||k)+"'":"Parse error on line "+(l+1)+": Unexpected "+(k==y?"end of input":"'"+(this.terminals_[k]||k)+"'"),this.parseError(P,{text:p.match,token:this.terminals_[k]||k,line:p.yylineno,loc:m,expected:E})}if(x[0]instanceof Array&&x.length>1)throw new Error("Parse Error: multiple actions possible at state: "+b+", token: "+k);switch(x[0]){case 1:n.push(k),s.push(p.yytext),r.push(p.yylloc),n.push(x[1]),k=null,c=p.yyleng,h=p.yytext,l=p.yylineno,m=p.yylloc;break;case 2:if(I=this.productions_[x[1]][1],A.$=s[s.length-I],A._$={first_line:r[r.length-(I||1)].first_line,last_line:r[r.length-1].last_line,first_column:r[r.length-(I||1)].first_column,last_column:r[r.length-1].last_column},_&&(A._$.range=[r[r.length-(I||1)].range[0],r[r.length-1].range[1]]),void 0!==(v=this.performAction.apply(A,[h,c,l,g.yy,x[1],s,r].concat(u))))return v;I&&(n=n.slice(0,-1*I*2),s=s.slice(0,-1*I),r=r.slice(0,-1*I)),n.push(this.productions_[x[1]][0]),s.push(A.$),r.push(A._$),S=o[n[n.length-2]][n[n.length-1]],n.push(S);break;case 3:return!0}}return!0}},e={EOF:1,parseError:function(t,i){if(!this.yy.parser)throw new Error(t);this.yy.parser.parseError(t,i)},setInput:function(t,i){return this.yy=i||this.yy||{},this._input=t,this._more=this._backtrack=this.done=!1,this.yylineno=this.yyleng=0,this.yytext=this.matched=this.match="",this.conditionStack=["INITIAL"],this.yylloc={first_line:1,first_column:0,last_line:1,last_column:0},this.options.ranges&&(this.yylloc.range=[0,0]),this.offset=0,this},input:function(){var t=this._input[0];return this.yytext+=t,this.yyleng++,this.offset++,this.match+=t,this.matched+=t,t.match(/(?:\r\n?|\n).*/g)?(this.yylineno++,this.yylloc.last_line++):this.yylloc.last_column++,this.options.ranges&&this.yylloc.range[1]++,this._input=this._input.slice(1),t},unput:function(t){var i=t.length,n=t.split(/(?:\r\n?|\n)/g);this._input=t+this._input,this.yytext=this.yytext.substr(0,this.yytext.length-i),this.offset-=i;var e=this.match.split(/(?:\r\n?|\n)/g);this.match=this.match.substr(0,this.match.length-1),this.matched=this.matched.substr(0,this.matched.length-1),n.length-1&&(this.yylineno-=n.length-1);var s=this.yylloc.range;return this.yylloc={first_line:this.yylloc.first_line,last_line:this.yylineno+1,first_column:this.yylloc.first_column,last_column:n?(n.length===e.length?this.yylloc.first_column:0)+e[e.length-n.length].length-n[0].length:this.yylloc.first_column-i},this.options.ranges&&(this.yylloc.range=[s[0],s[0]+this.yyleng-i]),this.yyleng=this.yytext.length,this},more:function(){return this._more=!0,this},reject:function(){return this.options.backtrack_lexer?(this._backtrack=!0,this):this.parseError("Lexical error on line "+(this.yylineno+1)+". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},less:function(t){this.unput(this.match.slice(t))},pastInput:function(){var t=this.matched.substr(0,this.matched.length-this.match.length);return(t.length>20?"...":"")+t.substr(-20).replace(/\n/g,"")},upcomingInput:function(){var t=this.match;return t.length<20&&(t+=this._input.substr(0,20-t.length)),(t.substr(0,20)+(t.length>20?"...":"")).replace(/\n/g,"")},showPosition:function(){var t=this.pastInput(),i=new Array(t.length+1).join("-");return t+this.upcomingInput()+"\n"+i+"^"},test_match:function(t,i){var n,e,s;if(this.options.backtrack_lexer&&(s={yylineno:this.yylineno,yylloc:{first_line:this.yylloc.first_line,last_line:this.last_line,first_column:this.yylloc.first_column,last_column:this.yylloc.last_column},yytext:this.yytext,match:this.match,matches:this.matches,matched:this.matched,yyleng:this.yyleng,offset:this.offset,_more:this._more,_input:this._input,yy:this.yy,conditionStack:this.conditionStack.slice(0),done:this.done},this.options.ranges&&(s.yylloc.range=this.yylloc.range.slice(0))),(e=t[0].match(/(?:\r\n?|\n).*/g))&&(this.yylineno+=e.length),this.yylloc={first_line:this.yylloc.last_line,last_line:this.yylineno+1,first_column:this.yylloc.last_column,last_column:e?e[e.length-1].length-e[e.length-1].match(/\r?\n?/)[0].length:this.yylloc.last_column+t[0].length},this.yytext+=t[0],this.match+=t[0],this.matches=t,this.yyleng=this.yytext.length,this.options.ranges&&(this.yylloc.range=[this.offset,this.offset+=this.yyleng]),this._more=!1,this._backtrack=!1,this._input=this._input.slice(t[0].length),this.matched+=t[0],n=this.performAction.call(this,this.yy,this,i,this.conditionStack[this.conditionStack.length-1]),this.done&&this._input&&(this.done=!1),n)return n;if(this._backtrack){for(var r in s)this[r]=s[r];return!1}return!1},next:function(){if(this.done)return this.EOF;var t,i,n,e;this._input||(this.done=!0),this._more||(this.yytext="",this.match="");for(var s=this._currentRules(),r=0;r<s.length;r++)if((n=this._input.match(this.rules[s[r]]))&&(!i||n[0].length>i[0].length)){if(i=n,e=r,this.options.backtrack_lexer){if(!1!==(t=this.test_match(n,s[r])))return t;if(this._backtrack){i=!1;continue}return!1}if(!this.options.flex)break}return i?!1!==(t=this.test_match(i,s[e]))&&t:""===this._input?this.EOF:this.parseError("Lexical error on line "+(this.yylineno+1)+". Unrecognized text.\n"+this.showPosition(),{text:"",token:null,line:this.yylineno})},lex:function(){var t=this.next();return t||this.lex()},begin:function(t){this.conditionStack.push(t)},popState:function(){return this.conditionStack.length-1>0?this.conditionStack.pop():this.conditionStack[0]},_currentRules:function(){return this.conditionStack.length&&this.conditionStack[this.conditionStack.length-1]?this.conditions[this.conditionStack[this.conditionStack.length-1]].rules:this.conditions.INITIAL.rules},topState:function(t){return(t=this.conditionStack.length-1-Math.abs(t||0))>=0?this.conditionStack[t]:"INITIAL"},pushState:function(t){this.begin(t)},stateStackSize:function(){return this.conditionStack.length},options:{"case-insensitive":!0},performAction:function(t,i,n,e){switch(n){case 0:return 4;case 1:return 9;case 2:return"space";case 3:return 10;case 4:return 6;case 5:return"TXT"}},rules:[/^(?:info\b)/i,/^(?:[\s\n\r]+)/i,/^(?:[\s]+)/i,/^(?:showInfo\b)/i,/^(?:$)/i,/^(?:.)/i],conditions:{INITIAL:{rules:[0,1,2,3,4,5],inclusive:!0}}};function s(){this.yy={}}return n.lexer=e,s.prototype=n,n.Parser=s,new s}());o.parser=o;var h="",l=!1;const c={parser:o,db:{setMessage:t=>{e.l.debug("Setting message to: "+t),h=t},getMessage:()=>h,setInfo:t=>{l=t},getInfo:()=>l,clear:s.f},renderer:{draw:(t,i,n)=>{try{e.l.debug("Rendering info diagram\n"+t);const s=(0,e.g)().securityLevel;let o;"sandbox"===s&&(o=(0,r.Ys)("#i"+i));const h=("sandbox"===s?(0,r.Ys)(o.nodes()[0].contentDocument.body):(0,r.Ys)("body")).select("#"+i);h.append("g").append("text").attr("x",100).attr("y",40).attr("class","version").attr("font-size","32px").style("text-anchor","middle").text("v "+n),h.attr("height",100),h.attr("width",400)}catch(s){e.l.error("Error while rendering info diagram"),e.l.error(s.message)}}},styles:()=>""}}}]);