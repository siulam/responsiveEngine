//from https://github.com/paulirish/matchMedia.js/blob/master/matchMedia.js
window.matchMedia || (window.matchMedia = function() {
    "use strict";

    // For browsers that support matchMedium api such as IE 9 and webkit
    var styleMedia = (window.styleMedia || window.media);

    // For those that don't support matchMedium
    if (!styleMedia) {
        var style       = document.createElement('style'),
            script      = document.getElementsByTagName('script')[0],
            info        = null;

        style.type  = 'text/css';
        style.id    = 'matchmediajs-test';

        script.parentNode.insertBefore(style, script);

        // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
        info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

        styleMedia = {
            matchMedium: function(media) {
                var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                if (style.styleSheet) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }

                // Test if media query is true or false
                return info.width === '1px';
            }
        };
    }

    return function(media) {
        return {
            matches: styleMedia.matchMedium(media),
            "media": media 
        };
    };
}());
var responsive=(function(docEl){
	var _m=window.matchMedia("only all"),
		isSupportMeidaQuery=_m.matches,
		isSupportMeidaAddListener=!!_m.addListener,
		/*
		 wave 当前viewportWidth是否在media query的【min max】区间
		*/
		wave=function(mediaQuery){
			if (isSupportMeidaQuery) return window.matchMedia(mediaQuery).matches;
			else{
				  var min, max, 
					  widthOrHeight = /width/.test(mediaQuery)? 'width' : 'height',
					  viewportWidthOrHeight = widthOrHeight == 'width' ? docEl.clientWidth : docEl.clientHeight,
					  queryValReg= widthOrHeight + '[\\:\\s]+(\\d+)px.*';
				  //(max-width: 1009px) and (min-width:480px) ==> min = 480; max = 1009
				  min = mediaQuery.replace(new RegExp('.*min-' + queryValReg,'ig'),'$1');
				  max = mediaQuery.replace(new RegExp('.*max-' + queryValReg,'ig'),'$1');
				  min = /^\d/.test(min)? min : 0;
				  max = /^\d/.test(max)? max : 0;		
				  return max ? (viewportWidthOrHeight >= min && viewportWidthOrHeight <= max): (viewportWidthOrHeight >= min);
			}
		},
		/*
		media query 事件监听 
		{"(min-width:10px) and (max-width:1000px)":function(){console.log(1);}}
		*/
		listeners={},
		callListener=function(mediaQueenList){
			var media=mediaQueenList.media.replace(/: /g,":"),listener=listeners[media];
			for(var i=0,l=listener.length;i<l;i++){
				listener[i]({media:media,matches:true});
			}
		},	
		_addListener=function(mediaQuery,listener){
			if(listeners[mediaQuery]) listeners[mediaQuery].push(listener);
			else listeners[mediaQuery]=[listener];
			if(isSupportMeidaQuery){
				var mq= window.matchMedia(mediaQuery);
				mq.matches && listener({media:mediaQuery,matches:true});
				isSupportMeidaAddListener && mq.addListener(function(mediaQueenList){mediaQueenList.matches && callListener(mediaQueenList)});
			}
			else wave(mediaQuery) && listener({media:mediaQuery,matches:true});
		},
		changeHtmlClass=function(){
			var w=docEl.clientWidth,
				htmlClass=docEl.className,
				name="nvw",
				classR=new RegExp(name+"\\d+","g"),				
				result=widthPoint[widthPoint.length-1];
			for(var i=0,l=widthPoint.length-1;i<l;i++){
				if(widthPoint[i]<=w && widthPoint[i+1]>w) {
					result=widthPoint[i];
					break;
				}
			}	
			docEl.className=classR.test(htmlClass) ? docEl.className.replace(classR,name+result) : docEl.className+" "+name+result;
		},
		currWidth = docEl.clientWidth, 
		currHeight = docEl.clientHeight;
	return {
		setWidthPoint:function(wp){widthPoint=wp;},
		addOneListener:function(mediaQuery,listener){
			_addListener(mediaQuery,listener);
		},
		addListener:function(listenerObj){
			for(var mediaQuery in listenerObj){
				_addListener(mediaQuery,listenerObj[mediaQuery]);
			}
		},
		init:function(){
			if(!isSupportMeidaAddListener){
				$(window).resize(function(){
					if(currWidth != docEl.clientWidth || currHeight != docEl.clientHeight) {
						for(var mediaQuery in listeners){
							for (var i=0,l=listeners[mediaQuery].length;i<l ;i++ ){								
								wave(mediaQuery) && listeners[mediaQuery][i]({media:mediaQuery,matches:true});
								changeHtmlClass();
							}					
						}					
					}
					currWidth = docEl.clientWidth;
					currHeight = docEl.clientHeight;				
				});	
				changeHtmlClass();
			}
		}
	};		
})(document.documentElement);
var templateEngine=(function(){
	var cache = {};
	return {
		tmpl : function tmpl(str, data){
		  var fn = /\s/.test(str) ?
			  new Function("obj",
			  "var p=[];"
			  +	"with(obj){p.push('" 
			  +	str
				.replace(/[\r\t\n]/g, " ")
				.split("<%").join("\t")
				.replace(/((^|%>)[^\t]*)'/g, "$1\r")
				.replace(/\t=(.*?)%>/g, "',$1,'")
				.split("\t").join("');")
				.split("%>").join("p.push('")
				.split("\r").join("\\'")
			+ "');}return p.join('');") :
			cache[str] = cache[str] || tmpl(document.getElementById(str).value) 			
		  return data ? fn(data) : fn;
		}
	}
})();
var templateData=function(templateID){
	this.templateID=templateID;
	this.data;
	this.callBack;
};
/*
https://github.com/faisalman/ua-parser-js/blob/master/src/ua-parser.js
*/
/*
var env=(function(ua){
	return{
		os:,
		device:
	}
})((window && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : ""));
*/
var responsiveEngine=(function(){
	/*
	{"(max-width:500px) and (min-width:1024px)":["tab1","news"]}
	*/
	var _templates={},
		_templateIDs={},
		_widthPoint=[],
		_currentTemplates=[],
		_currentTemplateIDs=[],
		getTemplateByID=function(templateID){
			for(var i=0,l=_currentTemplates.length;i<l;i++){
				if(_currentTemplates[i].templateID==templateID) return _currentTemplates[i];
			}
			return null;
		};
	return {
		set:function(){
			for(var i=0,l=arguments.length;i<l;i++){
					var mq="(max-width:"+arguments[i].maxWidth+"px) and (min-width:"+arguments[i].minWidth+"px)";
					_templates[mq]=arguments[i].templates;
					_templateIDs[mq]=[]
					for(var j=0,k=arguments[i].templates.length;j<k;j++){
						_templateIDs[mq].push(arguments[i].templates[j].templateID);
					}
					_widthPoint.push(arguments[i].minWidth);
					responsive.addOneListener(mq,function(mql){
						_currentTemplates=_templates[mql.media];
						_currentTemplateIDs=_templateIDs[mql.media];
					});
			}						
			
		},
		init:function(){
			responsive.setWidthPoint(_widthPoint.sort(function(a,b){return a-b;}));
			responsive.init();
			_widthPoint=null;
			$(function(){
				var lazyload=function(e,selector,top,bot){						
						var selector=selector||"#"+_currentTemplateIDs.join(",#"),								
							self=$(selector).eq(0);					
						if(self.length>0){
							var selfY=self.offset().top,
								top=top||$(window).scrollTop(),
								bot=bot||$(window).height()+top+20;
							if(selfY>=top && selfY<=bot){
								var id=self.attr("id"),tmp=getTemplateByID(id),html=templateEngine.tmpl(id,tmp.data);
								$(html).insertBefore(self);
								self.remove();
								$.isFunction(tmp.callBack) && tmp.callBack();
								lazyload(e,selector,top,bot);
							}
						};
					};
				lazyload();
				$(window)
					.scroll(lazyload)
					.resize(lazyload);
			});
		}
	};
})();