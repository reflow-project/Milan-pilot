(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["chunk-591f293c"],{4711:function(t,e,i){"use strict";i.d(e,"a",(function(){return h}));var a=i("2b0e"),n=i("b42e"),r=i("c637"),s=i("a723"),c=i("d82f"),o=i("cf75"),b=i("aa59");function l(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),i.push.apply(i,a)}return i}function u(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?l(Object(i),!0).forEach((function(e){f(t,e,i[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):l(Object(i)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e))}))}return t}function f(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}var d=Object(o["d"])(Object(c["m"])(u(u({},Object(c["j"])(b["b"],["event","routerTag"])),{},{linkAttrs:Object(o["c"])(s["p"],{}),linkClasses:Object(o["c"])(s["e"])})),r["ab"]),h=a["default"].extend({name:r["ab"],functional:!0,props:d,render:function(t,e){var i=e.props,a=e.data,r=e.listeners,s=e.children;return t("li",Object(n["a"])(Object(c["j"])(a,["on"]),{staticClass:"nav-item"}),[t(b["a"],{staticClass:"nav-link",class:i.linkClasses,attrs:i.linkAttrs,props:i,on:r},s)])}})},"59fb":function(t,e,i){"use strict";i.d(e,"b",(function(){return l})),i.d(e,"a",(function(){return u}));var a=i("2b0e"),n=i("b42e"),r=i("c637"),s=i("a723"),c=i("cf75");function o(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}var b=function(t){return t="left"===t?"start":"right"===t?"end":t,"justify-content-".concat(t)},l=Object(c["d"])({align:Object(c["c"])(s["r"]),cardHeader:Object(c["c"])(s["g"],!1),fill:Object(c["c"])(s["g"],!1),justified:Object(c["c"])(s["g"],!1),pills:Object(c["c"])(s["g"],!1),small:Object(c["c"])(s["g"],!1),tabs:Object(c["c"])(s["g"],!1),tag:Object(c["c"])(s["r"],"ul"),vertical:Object(c["c"])(s["g"],!1)},r["X"]),u=a["default"].extend({name:r["X"],functional:!0,props:l,render:function(t,e){var i,a=e.props,r=e.data,s=e.children,c=a.tabs,l=a.pills,u=a.vertical,f=a.align,d=a.cardHeader;return t(a.tag,Object(n["a"])(r,{staticClass:"nav",class:(i={"nav-tabs":c,"nav-pills":l&&!c,"card-header-tabs":!u&&d&&c,"card-header-pills":!u&&d&&l&&!c,"flex-column":u,"nav-fill":!u&&a.fill,"nav-justified":!u&&a.justified},o(i,b(f),!u&&f),o(i,"small",a.small),i)}),s)}})},"90d6":function(t,e,i){"use strict";i("c1d8")},a434:function(t,e,i){"use strict";var a=i("23e7"),n=i("23cb"),r=i("a691"),s=i("50c4"),c=i("7b0b"),o=i("65f0"),b=i("8418"),l=i("1dde"),u=i("ae40"),f=l("splice"),d=u("splice",{ACCESSORS:!0,0:0,1:2}),h=Math.max,v=Math.min,p=9007199254740991,O="Maximum allowed length exceeded";a({target:"Array",proto:!0,forced:!f||!d},{splice:function(t,e){var i,a,l,u,f,d,j=c(this),m=s(j.length),g=n(t,m),T=arguments.length;if(0===T?i=a=0:1===T?(i=0,a=m-g):(i=T-2,a=v(h(r(e),0),m-g)),m+i-a>p)throw TypeError(O);for(l=o(j,a),u=0;u<a;u++)f=g+u,f in j&&b(l,u,j[f]);if(l.length=a,i<a){for(u=g;u<m-a;u++)f=u+a,d=u+i,f in j?j[d]=j[f]:delete j[d];for(u=m;u>m-a+i;u--)delete j[u-1]}else if(i>a)for(u=m-a;u>g;u--)f=u+a-1,d=u+i-1,f in j?j[d]=j[f]:delete j[d];for(u=0;u<i;u++)j[u+g]=arguments[u+2];return j.length=m-a+i,l}})},b98e:function(t,e,i){"use strict";i.r(e);var a,n=function(){var t=this,e=t.$createElement,i=t._self._c||e;return i("b-tabs",{attrs:{id:"selector-tabs"},scopedSlots:t._u([{key:"tabs-end",fn:function(){return[i("b-nav-item",{attrs:{role:"presentation"},on:{click:function(e){return e.preventDefault(),t.newTab.apply(null,arguments)}}},[i("b",[t._v("+")])])]},proxy:!0},{key:"empty",fn:function(){return[i("div",{staticClass:"text-center text-muted"},[t._v(" Non ci sono linee aperte, clicca su + per aprirne una. ")])]},proxy:!0}])},t._l(t.tabs,(function(e){return i("b-tab",{key:"dyn-tab-"+e,attrs:{title:"Linea "+e},on:{click:function(i){return t.changeTab(e)}}},[i("div",{staticClass:"selector-container"},[i("iframe",{staticClass:"selector-frame",attrs:{src:"/",frameborder:"0",id:"frame_"+e}}),i("b-button",{staticClass:"float-right selector-button-close",attrs:{size:"sm",variant:"danger"},on:{click:function(i){return t.closeTab(e)}}},[t._v(" Chiudi linea "+t._s(e)+" ")])],1)])})),1)},r=[],s=(i("a434"),i("2b0e")),c=i("2f79"),o=i("c637"),b=i("e863"),l=i("0056"),u=i("9bfa"),f=i("a723"),d=i("9b76"),h=i("2326"),v=i("6d40"),p=i("906c"),O=i("6b77"),j=i("6c06"),m=i("7b1e"),g=i("3c21"),T=i("a8c8"),y=i("58f2"),k=i("3a58"),C=i("d82f"),w=i("47df"),x=i("cf75"),_=function(t,e){return t.map((function(t,e){return[e,t]})).sort(function(t,e){return this(t[1],e[1])||t[0]-e[0]}.bind(e)).map((function(t){return t[1]}))},P=i("90ef"),$=i("8c18"),B=i("aa59"),I=i("59fb");function S(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),i.push.apply(i,a)}return i}function A(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?S(Object(i),!0).forEach((function(e){z(t,e,i[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):S(Object(i)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e))}))}return t}function z(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}var N,D,E=Object(y["a"])("value",{type:f["m"]}),F=E.mixin,L=E.props,K=E.prop,H=E.event,V=function(t){return!t.disabled},J=s["default"].extend({name:o["kb"],inject:{bvTabs:{default:function(){return{}}}},props:{controls:Object(x["c"])(f["r"]),id:Object(x["c"])(f["r"]),noKeyNav:Object(x["c"])(f["g"],!1),posInSet:Object(x["c"])(f["m"]),setSize:Object(x["c"])(f["m"]),tab:Object(x["c"])(),tabIndex:Object(x["c"])(f["m"])},methods:{focus:function(){Object(p["d"])(this.$refs.link)},handleEvt:function(t){if(!this.tab.disabled){var e=t.type,i=t.keyCode,a=t.shiftKey;"click"===e||"keydown"===e&&i===u["j"]?(Object(O["f"])(t),this.$emit(l["f"],t)):"keydown"!==e||this.noKeyNav||(-1!==[u["k"],u["f"],u["e"]].indexOf(i)?(Object(O["f"])(t),a||i===u["e"]?this.$emit(l["m"],t):this.$emit(l["A"],t)):-1!==[u["a"],u["i"],u["b"]].indexOf(i)&&(Object(O["f"])(t),a||i===u["b"]?this.$emit(l["t"],t):this.$emit(l["w"],t)))}}},render:function(t){var e=this.id,i=this.tabIndex,a=this.setSize,n=this.posInSet,r=this.controls,s=this.handleEvt,c=this.tab,o=c.title,b=c.localActive,l=c.disabled,u=c.titleItemClass,f=c.titleLinkClass,h=c.titleLinkAttributes,v=t(B["a"],{staticClass:"nav-link",class:[{active:b&&!l,disabled:l},f,b?this.bvTabs.activeNavItemClass:null],props:{disabled:l},attrs:A(A({},h),{},{id:e,role:"tab",tabindex:i,"aria-selected":b&&!l?"true":"false","aria-setsize":a,"aria-posinset":n,"aria-controls":r}),on:{click:s,keydown:s},ref:"link"},[this.tab.normalizeSlot(d["F"])||o]);return t("li",{staticClass:"nav-item",class:[u],attrs:{role:"presentation"}},[v])}}),M=Object(C["j"])(I["b"],["tabs","isNavBar","cardHeader"]),W=Object(x["d"])(Object(C["m"])(A(A(A(A({},P["b"]),L),M),{},{activeNavItemClass:Object(x["c"])(f["e"]),activeTabClass:Object(x["c"])(f["e"]),card:Object(x["c"])(f["g"],!1),contentClass:Object(x["c"])(f["e"]),end:Object(x["c"])(f["g"],!1),lazy:Object(x["c"])(f["g"],!1),navClass:Object(x["c"])(f["e"]),navWrapperClass:Object(x["c"])(f["e"]),noFade:Object(x["c"])(f["g"],!1),noKeyNav:Object(x["c"])(f["g"],!1),noNavStyle:Object(x["c"])(f["g"],!1),tag:Object(x["c"])(f["r"],"div")})),o["jb"]),U=s["default"].extend({name:o["jb"],mixins:[P["a"],F,$["a"]],provide:function(){return{bvTabs:this}},props:W,data:function(){return{currentTab:Object(k["b"])(this[K],-1),tabs:[],registeredTabs:[]}},computed:{fade:function(){return!this.noFade},localNavClass:function(){var t=[];return this.card&&this.vertical&&t.push("card-header","h-100","border-bottom-0","rounded-0"),[].concat(t,[this.navClass])}},watch:(a={},z(a,K,(function(t,e){if(t!==e){t=Object(k["b"])(t,-1),e=Object(k["b"])(e,0);var i=this.tabs[t];i&&!i.disabled?this.activateTab(i):t<e?this.previousTab():this.nextTab()}})),z(a,"currentTab",(function(t){var e=-1;this.tabs.forEach((function(i,a){a!==t||i.disabled?i.localActive=!1:(i.localActive=!0,e=a)})),this.$emit(H,e)})),z(a,"tabs",(function(t,e){var i=this;Object(g["a"])(t.map((function(t){return t[c["a"]]})),e.map((function(t){return t[c["a"]]})))||this.$nextTick((function(){i.$emit(l["e"],t.slice(),e.slice())}))})),z(a,"registeredTabs",(function(){this.updateTabs()})),a),created:function(){this.$_observer=null},mounted:function(){this.setObserver(!0)},beforeDestroy:function(){this.setObserver(!1),this.tabs=[]},methods:{registerTab:function(t){Object(h["a"])(this.registeredTabs,t)||this.registeredTabs.push(t)},unregisterTab:function(t){this.registeredTabs=this.registeredTabs.slice().filter((function(e){return e!==t}))},setObserver:function(){var t=this,e=!(arguments.length>0&&void 0!==arguments[0])||arguments[0];if(this.$_observer&&this.$_observer.disconnect(),this.$_observer=null,e){var i=function(){t.$nextTick((function(){Object(p["z"])((function(){t.updateTabs()}))}))};this.$_observer=Object(w["a"])(this.$refs.content,i,{childList:!0,subtree:!1,attributes:!0,attributeFilter:["id"]})}},getTabs:function(){var t=this.registeredTabs.filter((function(t){return 0===t.$children.filter((function(t){return t._isTab})).length})),e=[];if(b["f"]&&t.length>0){var i=t.map((function(t){return"#".concat(t.safeId())})).join(", ");e=Object(p["B"])(i,this.$el).map((function(t){return t.id})).filter(j["a"])}return _(t,(function(t,i){return e.indexOf(t.safeId())-e.indexOf(i.safeId())}))},updateTabs:function(){var t=this.getTabs(),e=t.indexOf(t.slice().reverse().find((function(t){return t.localActive&&!t.disabled})));if(e<0){var i=this.currentTab;i>=t.length?e=t.indexOf(t.slice().reverse().find(V)):t[i]&&!t[i].disabled&&(e=i)}e<0&&(e=t.indexOf(t.find(V))),t.forEach((function(t,i){t.localActive=i===e})),this.tabs=t,this.currentTab=e},getButtonForTab:function(t){return(this.$refs.buttons||[]).find((function(e){return e.tab===t}))},updateButton:function(t){var e=this.getButtonForTab(t);e&&e.$forceUpdate&&e.$forceUpdate()},activateTab:function(t){var e=this.currentTab,i=this.tabs,a=!1;if(t){var n=i.indexOf(t);if(n!==e&&n>-1&&!t.disabled){var r=new v["a"](l["a"],{cancelable:!0,vueTarget:this,componentId:this.safeId()});this.$emit(r.type,n,e,r),r.defaultPrevented||(this.currentTab=n,a=!0)}}return a||this[K]===e||this.$emit(H,e),a},deactivateTab:function(t){return!!t&&this.activateTab(this.tabs.filter((function(e){return e!==t})).find(V))},focusButton:function(t){var e=this;this.$nextTick((function(){Object(p["d"])(e.getButtonForTab(t))}))},emitTabClick:function(t,e){Object(m["d"])(e)&&t&&t.$emit&&!t.disabled&&t.$emit(l["f"],e)},clickTab:function(t,e){this.activateTab(t),this.emitTabClick(t,e)},firstTab:function(t){var e=this.tabs.find(V);this.activateTab(e)&&t&&(this.focusButton(e),this.emitTabClick(e,t))},previousTab:function(t){var e=Object(T["c"])(this.currentTab,0),i=this.tabs.slice(0,e).reverse().find(V);this.activateTab(i)&&t&&(this.focusButton(i),this.emitTabClick(i,t))},nextTab:function(t){var e=Object(T["c"])(this.currentTab,-1),i=this.tabs.slice(e+1).find(V);this.activateTab(i)&&t&&(this.focusButton(i),this.emitTabClick(i,t))},lastTab:function(t){var e=this.tabs.slice().reverse().find(V);this.activateTab(e)&&t&&(this.focusButton(e),this.emitTabClick(e,t))}},render:function(t){var e=this,i=this.align,a=this.card,n=this.end,r=this.fill,s=this.firstTab,o=this.justified,b=this.lastTab,u=this.nextTab,f=this.noKeyNav,h=this.noNavStyle,v=this.pills,p=this.previousTab,O=this.small,j=this.tabs,m=this.vertical,g=j.find((function(t){return t.localActive&&!t.disabled})),T=j.find((function(t){return!t.disabled})),y=j.map((function(i,a){var n,r=i.safeId,o=null;return f||(o=-1,(i===g||!g&&i===T)&&(o=null)),t(J,{props:{controls:r?r():null,id:i.controlledBy||(r?r("_BV_tab_button_"):null),noKeyNav:f,posInSet:a+1,setSize:j.length,tab:i,tabIndex:o},on:(n={},z(n,l["f"],(function(t){e.clickTab(i,t)})),z(n,l["m"],s),z(n,l["A"],p),z(n,l["w"],u),z(n,l["t"],b),n),key:i[c["a"]]||a,ref:"buttons",refInFor:!0})})),k=t(I["a"],{class:this.localNavClass,attrs:{role:"tablist",id:this.safeId("_BV_tab_controls_")},props:{fill:r,justified:o,align:i,tabs:!h&&!v,pills:!h&&v,vertical:m,small:O,cardHeader:a&&!m},ref:"nav"},[this.normalizeSlot(d["D"])||t(),y,this.normalizeSlot(d["C"])||t()]);k=t("div",{class:[{"card-header":a&&!m&&!n,"card-footer":a&&!m&&n,"col-auto":m},this.navWrapperClass],key:"bv-tabs-nav"},[k]);var C=this.normalizeSlot()||[],w=t();0===C.length&&(w=t("div",{class:["tab-pane","active",{"card-body":a}],key:"bv-empty-tab"},this.normalizeSlot(d["i"])));var x=t("div",{staticClass:"tab-content",class:[{col:m},this.contentClass],attrs:{id:this.safeId("_BV_tab_container_")},key:"bv-content",ref:"content"},[C,w]);return t(this.tag,{staticClass:"tabs",class:{row:m,"no-gutters":m&&a},attrs:{id:this.safeId()}},[n?x:t(),k,n?t():x])}}),X=i("ce2a");function R(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(t);e&&(a=a.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),i.push.apply(i,a)}return i}function q(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?R(Object(i),!0).forEach((function(e){G(t,e,i[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):R(Object(i)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e))}))}return t}function G(t,e,i){return e in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}var Q="active",Y=l["J"]+Q,Z=Object(x["d"])(Object(C["m"])(q(q({},P["b"]),{},(N={},G(N,Q,Object(x["c"])(f["g"],!1)),G(N,"buttonId",Object(x["c"])(f["r"])),G(N,"disabled",Object(x["c"])(f["g"],!1)),G(N,"lazy",Object(x["c"])(f["g"],!1)),G(N,"noBody",Object(x["c"])(f["g"],!1)),G(N,"tag",Object(x["c"])(f["r"],"div")),G(N,"title",Object(x["c"])(f["r"])),G(N,"titleItemClass",Object(x["c"])(f["e"])),G(N,"titleLinkAttributes",Object(x["c"])(f["p"])),G(N,"titleLinkClass",Object(x["c"])(f["e"])),N))),o["ib"]),tt=s["default"].extend({name:o["ib"],mixins:[P["a"],$["a"]],inject:{bvTabs:{default:function(){return{}}}},props:Z,data:function(){return{localActive:this[Q]&&!this.disabled}},computed:{_isTab:function(){return!0},tabClasses:function(){var t=this.localActive,e=this.disabled;return[{active:t,disabled:e,"card-body":this.bvTabs.card&&!this.noBody},t?this.bvTabs.activeTabClass:null]},controlledBy:function(){return this.buttonId||this.safeId("__BV_tab_button__")},computedNoFade:function(){return!this.bvTabs.fade},computedLazy:function(){return this.bvTabs.lazy||this.lazy}},watch:(D={},G(D,Q,(function(t,e){t!==e&&(t?this.activate():this.deactivate()||this.$emit(Y,this.localActive))})),G(D,"disabled",(function(t,e){if(t!==e){var i=this.bvTabs.firstTab;t&&this.localActive&&i&&(this.localActive=!1,i())}})),G(D,"localActive",(function(t){this.$emit(Y,t)})),D),mounted:function(){this.registerTab()},updated:function(){var t=this.bvTabs.updateButton;t&&this.hasNormalizedSlot(d["F"])&&t(this)},beforeDestroy:function(){this.unregisterTab()},methods:{registerTab:function(){var t=this.bvTabs.registerTab;t&&t(this)},unregisterTab:function(){var t=this.bvTabs.unregisterTab;t&&t(this)},activate:function(){var t=this.bvTabs.activateTab;return!(!t||this.disabled)&&t(this)},deactivate:function(){var t=this.bvTabs.deactivateTab;return!(!t||!this.localActive)&&t(this)}},render:function(t){var e=this.localActive,i=t(this.tag,{staticClass:"tab-pane",class:this.tabClasses,directives:[{name:"show",value:e}],attrs:{role:"tabpanel",id:this.safeId(),"aria-hidden":e?"false":"true","aria-labelledby":this.controlledBy||null},ref:"panel"},[e||!this.computedLazy?this.normalizeSlot():t()]);return t(X["a"],{props:{mode:"out-in",noFade:this.computedNoFade}},[i])}}),et=i("4711"),it=i("1947"),at={components:{BTabs:U,BTab:tt,BNavItem:et["a"],BButton:it["a"]},data:function(){return{tabs:[1],tabCounter:1}},methods:{closeTab:function(t){for(var e=0;e<this.tabs.length;e+=1)this.tabs[e]===t&&this.tabs.splice(e,1)},newTab:function(){this.tabs.push(this.tabCounter+=1)},changeTab:function(t){var e=document.getElementById("frame_"+t);e.contentWindow.focus()}}},nt=at,rt=(i("90d6"),i("2877")),st=Object(rt["a"])(nt,n,r,!1,null,null,null);e["default"]=st.exports},c1d8:function(t,e,i){}}]);
//# sourceMappingURL=chunk-591f293c.9da7b810.js.map