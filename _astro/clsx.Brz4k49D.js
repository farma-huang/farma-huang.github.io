import{r as d}from"./index.BX2CdW4Z.js";var _={exports:{}},s={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var R;function O(){if(R)return s;R=1;var r=d(),n=Symbol.for("react.element"),t=Symbol.for("react.fragment"),e=Object.prototype.hasOwnProperty,i=r.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,v={key:!0,ref:!0,__self:!0,__source:!0};function m(f,o,c){var u,a={},p=null,l=null;c!==void 0&&(p=""+c),o.key!==void 0&&(p=""+o.key),o.ref!==void 0&&(l=o.ref);for(u in o)e.call(o,u)&&!v.hasOwnProperty(u)&&(a[u]=o[u]);if(f&&f.defaultProps)for(u in o=f.defaultProps,o)a[u]===void 0&&(a[u]=o[u]);return{$$typeof:n,type:f,key:p,ref:l,props:a,_owner:i.current}}return s.Fragment=t,s.jsx=m,s.jsxs=m,s}var x;function h(){return x||(x=1,_.exports=O()),_.exports}var E=h();function y(r){var n,t,e="";if(typeof r=="string"||typeof r=="number")e+=r;else if(typeof r=="object")if(Array.isArray(r)){var i=r.length;for(n=0;n<i;n++)r[n]&&(t=y(r[n]))&&(e&&(e+=" "),e+=t)}else for(t in r)r[t]&&(e&&(e+=" "),e+=t);return e}function b(){for(var r,n,t=0,e="",i=arguments.length;t<i;t++)(r=arguments[t])&&(n=y(r))&&(e&&(e+=" "),e+=n);return e}export{b as c,E as j};
