var x=!0,y=null;function z(a,b,d){function e(c){c=parseInt(c.getResponseHeader("Content-Length"),10)||-1;b(new h(a,c))}function f(){var c=y;window.XMLHttpRequest?c=new XMLHttpRequest:window.ActiveXObject&&(c=new ActiveXObject("Microsoft.XMLHTTP"));return c}function h(c,a){var b,g;function e(c){var a=~~(c[0]/b)-g,c=~~(c[1]/b)+1+g;0>a&&(a=0);c>=blockTotal&&(c=blockTotal-1);return[a,c]}function h(e,g){function m(c){parseInt(c.getResponseHeader("Content-Length"),10)==a&&(e[0]=0,e[1]=blockTotal-1,i[0]=0,i[1]=a-1);for(var c=
{data:c.U||c.responseText,offset:i[0]},b=e[0];b<=e[1];b++)A[b]=c;l+=i[1]-i[0]+1;g&&g()}for(;A[e[0]];)if(e[0]++,e[0]>e[1]){g&&g();return}for(;A[e[1]];)if(e[1]--,e[0]>e[1]){g&&g();return}var i=[e[0]*b,(e[1]+1)*b-1],w=c,r=d,L=q,I=!!g,n=f();n?("undefined"===typeof I&&(I=x),m&&("undefined"!=typeof n.onload?n.onload=function(){"200"==n.status||"206"==n.status?(n.fileSize=L||n.getResponseHeader("Content-Length"),m(n)):r&&r();n=y}:n.onreadystatechange=function(){4==n.readyState&&("200"==n.status||"206"==
n.status?(n.fileSize=L||n.getResponseHeader("Content-Length"),m(n)):r&&r(),n=y)}),n.open("GET",w,I),n.overrideMimeType&&n.overrideMimeType("text/plain; charset=x-user-defined"),i&&n.setRequestHeader("Range","bytes="+i[0]+"-"+i[1]),n.setRequestHeader("If-Modified-Since","Sat, 1 Jan 1970 00:00:00 GMT"),n.send(y)):r&&r()}var q,l=0,w=new B("",0,a),A=[];b=b||2048;g="undefined"===typeof g?0:g;blockTotal=~~((a-1)/b)+1;for(var r in w)w.hasOwnProperty(r)&&"function"===typeof w[r]&&(this[r]=w[r]);this.a=function(c){var a;
h(e([c,c]));a=A[~~(c/b)];if("string"==typeof a.data)return a.data.charCodeAt(c-a.offset)&255;if("unknown"==typeof a.data)return IEBinary_getByteAt(a.data,c-a.offset)};this.L=function(){return l};this.g=function(c,a){h(e(c),a)}}var c=f();c&&(e&&("undefined"!=typeof c.onload?c.onload=function(){"200"==c.status&&e(this);c=y}:c.onreadystatechange=function(){4==c.readyState&&("200"==c.status&&e(this),c=y)}),c.open("HEAD",a,x),c.send(y))}
function B(a,b,d){var e=a,f=b||0,h=0;this.N=function(){return e};"string"==typeof a?(h=d||e.length,this.a=function(c){return e.charCodeAt(c+f)&255}):"unknown"==typeof a&&(h=d||IEBinary_getLength(e),this.a=function(c){return IEBinary_getByteAt(e,c+f)});this.m=function(c,a){for(var b=Array(a),d=0;d<a;d++)b[d]=this.a(c+d);return b};this.o=function(){return h};this.c=function(c,a){return 0!=(this.a(c)&1<<a)};this.O=function(c){c=this.a(c);return 127<c?c-256:c};this.p=function(c,a){var b=a?(this.a(c)<<
8)+this.a(c+1):(this.a(c+1)<<8)+this.a(c);0>b&&(b+=65536);return b};this.Q=function(c,a){var b=this.p(c,a);return 32767<b?b-65536:b};this.h=function(c,a){var b=this.a(c),d=this.a(c+1),e=this.a(c+2),f=this.a(c+3),b=a?(((b<<8)+d<<8)+e<<8)+f:(((f<<8)+e<<8)+d<<8)+b;0>b&&(b+=4294967296);return b};this.P=function(c,a){var b=this.h(c,a);return 2147483647<b?b-4294967296:b};this.n=function(c){var a=this.a(c),b=this.a(c+1),c=this.a(c+2),a=((a<<8)+b<<8)+c;0>a&&(a+=16777216);return a};this.d=function(a,b){for(var d=
[],e=a,g=0;e<a+b;e++,g++)d[g]=String.fromCharCode(this.a(e));return d.join("")};this.e=function(a,b,d){a=this.m(a,b);switch(d.toLowerCase()){case "utf-16":case "utf-16le":case "utf-16be":var b=d,e,g=0,f=1,d=0;e=Math.min(e||a.length,a.length);254==a[0]&&255==a[1]?(b=x,g=2):255==a[0]&&254==a[1]&&(b=!1,g=2);b&&(f=0,d=1);for(var b=[],h=0;g<e;h++){var q=a[g+f],l=(q<<8)+a[g+d],g=g+2;if(0==l)break;else 216>q||224<=q?b[h]=String.fromCharCode(l):(q=(a[g+f]<<8)+a[g+d],g+=2,b[h]=String.fromCharCode(l,q))}a=
new String(b.join(""));a.f=g;break;case "utf-8":e=0;g=Math.min(g||a.length,a.length);239==a[0]&&(187==a[1]&&191==a[2])&&(e=3);f=[];for(d=0;e<g&&!(b=a[e++],0==b);d++)128>b?f[d]=String.fromCharCode(b):194<=b&&224>b?(h=a[e++],f[d]=String.fromCharCode(((b&31)<<6)+(h&63))):224<=b&&240>b?(h=a[e++],l=a[e++],f[d]=String.fromCharCode(((b&255)<<12)+((h&63)<<6)+(l&63))):240<=b&&245>b&&(h=a[e++],l=a[e++],q=a[e++],b=((b&7)<<18)+((h&63)<<12)+((l&63)<<6)+(q&63)-65536,f[d]=String.fromCharCode((b>>10)+55296,(b&1023)+
56320));a=new String(f.join(""));a.f=e;break;default:g=[];f=f||a.length;for(e=0;e<f;){d=a[e++];if(0==d)break;g[e-1]=String.fromCharCode(d)}a=new String(g.join(""));a.f=e}return a};this.K=function(a){return String.fromCharCode(this.a(a))};this.X=function(){return window.btoa(e)};this.J=function(a){e=window.atob(a)};this.g=function(a,b){b()}}document.write("<script type='text/vbscript'>\r\nFunction IEBinary_getByteAt(strBinary, iOffset)\r\n\tIEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\nEnd Function\r\nFunction IEBinary_getLength(strBinary)\r\n\tIEBinary_getLength = LenB(strBinary)\r\nEnd Function\r\n<\/script>\r\n");this.FileAPIReader=function(a){return function(b,d){var e=new FileReader;e.onload=function(a){d(new B(a.target.result))};e.readAsBinaryString(a)}};this.Base64=this.j={i:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",w:function(a){for(var b="",d,e,f,h,c,k,v=0;v<a.length;)d=a[v++],e=a[v++],f=a[v++],h=d>>2,d=(d&3)<<4|e>>4,c=(e&15)<<2|f>>6,k=f&63,isNaN(e)?c=k=64:isNaN(f)&&(k=64),b=b+Base64.i.charAt(h)+Base64.i.charAt(d)+Base64.i.charAt(c)+Base64.i.charAt(k);return b}};this.j.encodeBytes=this.j.w;var C=this.s={},E={},F=[0,7];C.B=function(a,b,d){d=d||{};(d.dataReader||z)(a,function(e){e.g(F,function(){var f="ftypM4A"==e.d(4,7)?ID4:"ID3"==e.d(0,3)?ID3v2:ID3v1;f.q(e,function(){var h=d.tags,c=f.r(e,h),h=E[a]||{},k;for(k in c)c.hasOwnProperty(k)&&(h[k]=c[k]);E[a]=h;b&&b()})})})};C.z=function(a){if(!E[a])return y;var b={},d;for(d in E[a])E[a].hasOwnProperty(d)&&(b[d]=E[a][d]);return b};C.A=function(a,b){return!E[a]?y:E[a][b]};this.ID3=this.s;C.loadTags=C.B;C.getAllTags=C.z;C.getTag=C.A;
C.BinaryFile=B;this.ID3v1=this.t={};function G(a,b){var d=b.a(a),e=b.a(a+1),f=b.a(a+2);return b.a(a+3)&127|(f&127)<<7|(e&127)<<14|(d&127)<<21}var H=this.D={};H.b={};
H.frames={BUF:"Recommended buffer size",CNT:"Play counter",COM:"Comments",CRA:"Audio encryption",CRM:"Encrypted meta frame",ETC:"Event timing codes",EQU:"Equalization",GEO:"General encapsulated object",IPL:"Involved people list",LNK:"Linked information",MCI:"Music CD Identifier",MLL:"MPEG location lookup table",PIC:"Attached picture",POP:"Popularimeter",REV:"Reverb",RVA:"Relative volume adjustment",SLT:"Synchronized lyric/text",STC:"Synced tempo codes",TAL:"Album/Movie/Show title",TBP:"BPM (Beats Per Minute)",
TCM:"Composer",TCO:"Content type",TCR:"Copyright message",TDA:"Date",TDY:"Playlist delay",TEN:"Encoded by",TFT:"File type",TIM:"Time",TKE:"Initial key",TLA:"Language(s)",TLE:"Length",TMT:"Media type",TOA:"Original artist(s)/performer(s)",TOF:"Original filename",TOL:"Original Lyricist(s)/text writer(s)",TOR:"Original release year",TOT:"Original album/Movie/Show title",TP1:"Lead artist(s)/Lead performer(s)/Soloist(s)/Performing group",TP2:"Band/Orchestra/Accompaniment",TP3:"Conductor/Performer refinement",
TP4:"Interpreted, remixed, or otherwise modified by",TPA:"Part of a set",TPB:"Publisher",TRC:"ISRC (International Standard Recording Code)",TRD:"Recording dates",TRK:"Track number/Position in set",TSI:"Size",TSS:"Software/hardware and settings used for encoding",TT1:"Content group description",TT2:"Title/Songname/Content description",TT3:"Subtitle/Description refinement",TXT:"Lyricist/text writer",TXX:"User defined text information frame",TYE:"Year",UFI:"Unique file identifier",ULT:"Unsychronized lyric/text transcription",
WAF:"Official audio file webpage",WAR:"Official artist/performer webpage",WAS:"Official audio source webpage",WCM:"Commercial information",WCP:"Copyright/Legal information",WPB:"Publishers official webpage",WXX:"User defined URL link frame",AENC:"Audio encryption",APIC:"Attached picture",COMM:"Comments",COMR:"Commercial frame",ENCR:"Encryption method registration",EQUA:"Equalization",ETCO:"Event timing codes",GEOB:"General encapsulated object",GRID:"Group identification registration",IPLS:"Involved people list",
LINK:"Linked information",MCDI:"Music CD identifier",MLLT:"MPEG location lookup table",OWNE:"Ownership frame",PRIV:"Private frame",PCNT:"Play counter",POPM:"Popularimeter",POSS:"Position synchronisation frame",RBUF:"Recommended buffer size",RVAD:"Relative volume adjustment",RVRB:"Reverb",SYLT:"Synchronized lyric/text",SYTC:"Synchronized tempo codes",TALB:"Album/Movie/Show title",TBPM:"BPM (beats per minute)",TCOM:"Composer",TCON:"Content type",TCOP:"Copyright message",TDAT:"Date",TDLY:"Playlist delay",
TENC:"Encoded by",TEXT:"Lyricist/Text writer",TFLT:"File type",TIME:"Time",TIT1:"Content group description",TIT2:"Title/songname/content description",TIT3:"Subtitle/Description refinement",TKEY:"Initial key",TLAN:"Language(s)",TLEN:"Length",TMED:"Media type",TOAL:"Original album/movie/show title",TOFN:"Original filename",TOLY:"Original lyricist(s)/text writer(s)",TOPE:"Original artist(s)/performer(s)",TORY:"Original release year",TOWN:"File owner/licensee",TPE1:"Lead performer(s)/Soloist(s)",TPE2:"Band/orchestra/accompaniment",
TPE3:"Conductor/performer refinement",TPE4:"Interpreted, remixed, or otherwise modified by",TPOS:"Part of a set",TPUB:"Publisher",TRCK:"Track number/Position in set",TRDA:"Recording dates",TRSN:"Internet radio station name",TRSO:"Internet radio station owner",TSIZ:"Size",TSRC:"ISRC (international standard recording code)",TSSE:"Software/Hardware and settings used for encoding",TYER:"Year",TXXX:"User defined text information frame",UFID:"Unique file identifier",USER:"Terms of use",USLT:"Unsychronized lyric/text transcription",
WCOM:"Commercial information",WCOP:"Copyright/Legal information",WOAF:"Official audio file webpage",WOAR:"Official artist/performer webpage",WOAS:"Official audio source webpage",WORS:"Official internet radio station homepage",WPAY:"Payment",WPUB:"Publishers official webpage",WXXX:"User defined URL link frame"};
var J={title:["TIT2","TT2"],artist:["TPE1","TP1"],album:["TALB","TAL"],year:["TYER","TYE"],comment:["COMM","COM"],track:["TRCK","TRK"],genre:["TCON","TCO"],picture:["APIC","PIC"],lyrics:["USLT","ULT"]},K=["title","artist","album","track"];H.q=function(a,b){a.g([0,G(6,a)],b)};
H.r=function(a,b){var d=0,e=a.a(d+3);if(4<e)return{version:">2.4"};var f=a.a(d+4),h=a.c(d+5,7),c=a.c(d+5,6),k=a.c(d+5,5),v=G(d+6,a),d=d+10;if(c)var p=a.h(d,x),d=d+(p+4);var e={version:"2."+e+"."+f,major:e,revision:f,flags:{unsynchronisation:h,extended_header:c,experimental_indicator:k},size:v},g;if(h)g={};else{for(var v=v-10,h=a,f=b,c={},k=e.major,p=[],m=0,i;i=(f||K)[m];m++)p=p.concat(J[i]||[i]);for(f=p;d<v;){p=y;m=h;i=d;var q=y;switch(k){case 2:g=m.d(i,3);var l=m.n(i+3),w=6;break;case 3:g=m.d(i,
4);l=m.h(i+4,x);w=10;break;case 4:g=m.d(i,4),l=G(i+4,m),w=10}if(""==g)break;d+=w+l;if(!(0>f.indexOf(g))&&(2<k&&(q={message:{W:m.c(i+8,6),I:m.c(i+8,5),T:m.c(i+8,4)},l:{R:m.c(i+8+1,7),F:m.c(i+8+1,3),H:m.c(i+8+1,2),C:m.c(i+8+1,1),v:m.c(i+8+1,0)}}),i+=w,q&&q.l.v&&(G(i,m),i+=4,l-=4),!q||!q.l.C))g in H.b?p=H.b[g]:"T"==g[0]&&(p=H.b["T*"]),p=p?p(i,l,m,q):void 0,p={id:g,size:l,description:g in H.frames?H.frames[g]:"Unknown",data:p},g in c?(c[g].id&&(c[g]=[c[g]]),c[g].push(p)):c[g]=p}g=c}for(var A in J)if(J.hasOwnProperty(A)){a:{l=
J[A];"string"==typeof l&&(l=[l]);w=0;for(d=void 0;d=l[w];w++)if(d in g){a=g[d].data;break a}a=void 0}a&&(e[A]=a)}for(var r in g)g.hasOwnProperty(r)&&(e[r]=g[r]);return e};this.ID3v2=H;function M(a){var b;switch(a){case 0:b="iso-8859-1";break;case 1:b="utf-16";break;case 2:b="utf-16be";break;case 3:b="utf-8"}return b}var N="32x32 pixels 'file icon' (PNG only);Other file icon;Cover (front);Cover (back);Leaflet page;Media (e.g. lable side of CD);Lead artist/lead performer/soloist;Artist/performer;Conductor;Band/Orchestra;Composer;Lyricist/text writer;Recording Location;During recording;During performance;Movie/video screen capture;A bright coloured fish;Illustration;Band/artist logotype;Publisher/Studio logotype".split(";");
ID3v2.b.APIC=function(a,b,d,e,f){var f=f||"3",e=a,h=M(d.a(a));switch(f){case "2":var c=d.d(a+1,3),a=a+4;break;case "3":case "4":c=d.e(a+1,b-(a-e),h),a+=1+c.f}f=d.a(a,1);f=N[f];h=d.e(a+1,b-(a-e),h);a+=1+h.f;return{format:c.toString(),type:f,description:h.toString(),data:d.m(a,e+b-a)}};ID3v2.b.COMM=function(a,b,d){var e=a,f=M(d.a(a)),h=d.d(a+1,3),c=d.e(a+4,b-4,f),a=a+(4+c.f),a=d.e(a,e+b-a,f);return{language:h,V:c.toString(),text:a.toString()}};ID3v2.b.COM=ID3v2.b.COMM;
ID3v2.b.PIC=function(a,b,d,e){return ID3v2.b.APIC(a,b,d,e,"2")};ID3v2.b.PCNT=function(a,b,d){return d.M(a)};ID3v2.b.CNT=ID3v2.b.PCNT;ID3v2.b["T*"]=function(a,b,d){var e=M(d.a(a));return d.e(a+1,b-1,e).toString()};ID3v2.b.TCON=function(a,b,d){return ID3v2.b["T*"].apply(this,arguments).replace(/^\(\d+\)/,"")};ID3v2.b.TCO=ID3v2.b.TCON;ID3v2.b.USLT=function(a,b,d){var e=a,f=M(d.a(a)),h=d.d(a+1,3),c=d.e(a+4,b-4,f),a=a+(4+c.f),a=d.e(a,e+b-a,f);return{language:h,G:c.toString(),S:a.toString()}};
ID3v2.b.ULT=ID3v2.b.USLT;function O(a,b,d,e){var f=a.h(b,x);if(0==f)e();else{var h=a.d(b+4,4);-1<["moov","udta","meta","ilst"].indexOf(h)?("meta"==h&&(b+=4),a.g([b+8,b+8+8],function(){O(a,b+8,f-8,e)})):a.g([b+(h in P.k?0:f),b+f+8],function(){O(a,b+f,d,e)})}}
function Q(a,b,d,e,f){for(var f=void 0===f?"":f+"  ",h=d;h<d+e;){var c=b.h(h,x);if(0==c)break;var k=b.d(h+4,4);if(-1<["moov","udta","meta","ilst"].indexOf(k)){"meta"==k&&(h+=4);Q(a,b,h+8,c-8,f);break}if(P.k[k]){var v=b.n(h+16+1),p=P.k[k],v=P.types[v];if("trkn"==k)a[p[0]]=b.a(h+16+11),a.count=b.a(h+16+13);else{var k=h+16+4+4,g=c-16-4-4;switch(v){case "text":a[p[0]]=b.e(k,g,"UTF-8");break;case "uint8":a[p[0]]=b.p(k);break;case "jpeg":case "png":a[p[0]]={l:"image/"+v,data:b.m(k,g)}}}}h+=c}}
var P=this.u={};P.types={"0":"uint8",1:"text",13:"jpeg",14:"png",21:"uint8"};P.k={"\u00a9alb":["album"],"\u00a9art":["artist"],"\u00a9ART":["artist"],aART:["artist"],"\u00a9day":["year"],"\u00a9nam":["title"],"\u00a9gen":["genre"],trkn:["track"],"\u00a9wrt":["composer"],"\u00a9too":["encoder"],cprt:["copyright"],covr:["picture"],"\u00a9grp":["grouping"],keyw:["keyword"],"\u00a9lyr":["lyrics"],"\u00a9gen":["genre"]};P.q=function(a,b){a.g([0,7],function(){O(a,0,a.o(),b)})};
P.r=function(a){var b={};Q(b,a,0,a.o());return b};this.ID4=this.u;


FileAPI.addInfoReader(/^audio/i, function (file, callback){
	FileAPI.readAsBinaryString(file, function (evt){
		if( evt.type == 'load' ){
			ID3.loadTags(file.name, function (){
				callback(false, ID3.getAllTags(file.name));
			}, {
				dataReader: function (url, fn){
					var oFile = new ID3.BinaryFile(evt.result, 0, file.size);
					fn(oFile)
				}
			});
		} else if( evt.type == 'error' ){
			callback('read_as_binary_string_id3');
		}
	});
});
