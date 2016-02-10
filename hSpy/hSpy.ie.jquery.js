+function($, $window, blackBox, IE, PLUGIN_NAME, VERSION){

    ////////////////////////////////////////////////////////
    /////////////////Default Settings///////////////////////
    ////////////////////////////////////////////////////////

    var defOptions =

        {
            classTitles  : "current",  //String:.. | Classes established active title
            classTargets : "current",  //String:.. | Classes established active target
            spaces       : false,      //Boolean:..| If False, then it is not visible when not 1 unit stands next {False/True}
            middleLine   : 0,          //Function or Number:..| The distance from the top/left of the window, below which is considered to be a dedicated unit
            bottomLine   : 0,          //Function or Number:..| The distance from the bottom/right of the window, above which is considered to be a dedicated unit
            axis         : "y"         //String:..| Axis {"x"/"y"}
        },

        defHundlers =

        {
            onAlwToggle   : function(prevElem, currElem){  console.log("always", arguments) }, //Triggered when change target
            onRealToggle  : function(prevElem, currElem){  console.log("real", arguments) },   //Triggered when change the target with anything on the Block
            onBeforeSpace : function(prevElem){  console.log("bef", arguments) },              //It triggered when moving from Block to a Space
            onAfterSpace  : function(currElem){  console.log("after", arguments) }             //It triggered when moving from Space to the Block
        }

        ;

    ////////////////////////////////////////////////////////
    /////////////////////Main Function//////////////////////
    ////////////////////////////////////////////////////////

    function hSpy_construct(scrollTargets, options, hundlers){

        var toggleTargets = $(this), scrollTargetsArray,
            toggleTargetsArray = toggleTargets.get();

        options  = $.extend( {}, defOptions, typeof options == "object" && options );
        hundlers = $.extend( {}, defHundlers, typeof hundlers == "object" && hundlers );

        /*
         #########################
         ### Checking for errors ###
         #########################
         */

        var  ERROR_PLAGINNAME = "hSpy said: "
            ,ERROR_LENGTH     = "Number of menu items is less than the target of number of blocks!"
            ,ERROR_NOELEMENT  = "Trying to plant something other than Elements?"
            ,ERROR_NULL       = "Emptiness? Really?"
            ,ERROR_TARGET     = "What are you trying to do? It's not even the elements!"
            ;

        function throwError(err){
            throw new Error(ERROR_PLAGINNAME + err);
        }

        function isElement(e){
            return e instanceof Element;
        }


        try{

            scrollTargets = $( scrollTargets );
            scrollTargetsArray = scrollTargets.get();

        }catch(e){

            throwError( ERROR_TARGET );

        }

        switch(false){

            case ( toggleTargets.length && scrollTargets.length ):
                throwError( ERROR_NULL );

            case ( toggleTargets.length === scrollTargets.length ):
                throwError( ERROR_LENGTH );

            case ( scrollTargetsArray.every( isElement ) && toggleTargetsArray.every( isElement )  ):
                throwError( ERROR_NOELEMENT );
        }

        /*
         #####################
         ###    Initilize    ###
         #####################
         */

        blackBox.push(
            {
                switches  : toggleTargets,
                scrollers : scrollTargets.map(function(i, e){
                    return {
                        element : e,
                        index   : i,
                        jq      : $(e)
                    }
                }).get(),
                options : options,
                hundlers : hundlers,
                prevElem : null
            }
        );

        return this;
    }


    hSpy_construct.setOption = function(obj, val){
        $.extend(defOptions, obj);
    }

    hSpy_construct.setHundler = function(obj){
        $.extend(defHundlers, obj);
    }

    hSpy_construct.version = VERSION;

    ////////////////////////////////////////////////////////
    /////////////////////And the main thing/////////////////
    ////////////////////////////////////////////////////////

    function hSpy_monitor(blackItem){

        function useF(f){
            return f instanceof Function
                ? f.apply( null, Array.prototype.slice.call( arguments, 1 ) )
                : f
                ;
        }

        //Search purposes
        function hSpy_maxPoint(vi, lineTop, lineBottom, orientation){

            var gE = "getBoundingClientRect";

            lineBottom = $window[orientation ? "width" : "height"]() - lineTop - lineBottom;

            function isAllow(e){
                var rects = e.element[gE](), rectsAllow = orientation
                        ? rects.left > lineBottom || rects.right < lineTop
                        : rects.top > lineBottom  || rects.bottom < lineTop
                    ;

                return !rectsAllow && document.documentElement.contains( e.element );
            }

            function getMaxRect(rect, cord){
                return Math.max(
                    Math.abs(lineBottom - rect[ cord[0] ]),
                    Math.abs(lineBottom - rect[ cord[1] ])
                );
            }

            function getMax(p, t){

                var axis = orientation ? ["left", "right"] : ["top", "bottom"],
                    pRect = getMaxRect(p.element[gE](), orientation),
                    tRect  = getMaxRect(t.element[gE](), orientation)
                    ;

                return pRect < tRect ? p : t;

            }

            vi = IE.Array.filter(vi, isAllow);

            return vi.length > 1 ? IE.Array.reduce(vi, getMax) : vi[ 0 ];
        }

        /*
         .:realTarget - new block-data [switcher, scroller] or null
         .:prevTarget - old block-data [switcher, scroller] or null
         .:target - new comer block { element : Element, index : Number } or false
         */

        var options = blackItem.options,
            hundlers = blackItem.hundlers, realTarget,
            prevTarget = blackItem.prevElem !== null && [
                    blackItem.switches.eq(blackItem.prevElem),
                    blackItem.scrollers[blackItem.prevElem].jq
                ]
            ;

        var target = hSpy_maxPoint(
            blackItem.scrollers,
            Number( useF(options.middleLine) ) || 0,
            Number( useF(options.bottomLine) ) || 0,
            options.axis.toLowerCase() === "x"
        );

        if(!target){

            if(options.spaces){

                realTarget = null;
                prevTarget && useF( hundlers.onBeforeSpace, prevTarget );

            }else{

                return "__-_---384---___--__";

            }

        }else{

            //Add ClassNames
            realTarget = [
                blackItem.switches.eq(target.index).addClass( options.classTitles ),
                blackItem.scrollers[target.index].jq.addClass( options.classTargets )
            ];


            if( !prevTarget ){

                useF( hundlers.onAfterSpace, realTarget );

            }else if(target.index != blackItem.prevElem){

                useF( hundlers.onRealToggle, prevTarget, realTarget );

            }

        }


        //Remove ClassNames
        if(prevTarget && (!target || target.index != blackItem.prevElem)){

            prevTarget[0].removeClass( options.classTitles );
            prevTarget[1].removeClass( options.classTargets );

        }

        if(prevTarget !== realTarget &&
            (!prevTarget ||
                !realTarget ||
                target.index !== blackItem.prevElem
            )
        ){
            useF( hundlers.onAlwToggle, prevTarget, realTarget );
        }

        //Save Result
        blackItem.prevElem = realTarget && target.index;
    }

    ////////////////////////////////////////////////////////
    //////////////////Window hundler////////////////////////
    ////////////////////////////////////////////////////////


    function hSpy_hundler(){
        IE.Array.forEach(blackBox, hSpy_monitor);
    }


    //################################################//

    $.fn[PLUGIN_NAME] = hSpy_construct;

    $window.scroll(hSpy_hundler).resize(hSpy_hundler);
    $(hSpy_hundler);

}( jQuery, jQuery(window), [], {

    Array : {

        _modify: function(array, f){
            var returnVal = new Array();

            $.each(array, function(i, e){
                f(returnVal, e, i, array);
            });


            return returnVal;
        },

        reduce : function(array, f, def){

            var prev = arguments.length > 2 ? def : array[0],
                next = Number(arguments.length < 2);

            while( next < array.length ){
                prev = f(prev, array[next], next++, array);
            }

            return prev;
        },

        every : function(array, f){

            var bool = true, i = -1;

            while(bool && ++i < array.length){

                bool = f(array[i], i, array);

            }

            return Boolean(bool);
        },

        some : function(array, f){
            return !this.every(array, function(e, i){
                return !f(e, i, array);
            });
        },

        filter : function(array, f){

            return this._modify(array, function(retV, e, i){
                f(e, i, array) && retV.push( e );
            });

        },

        forEach : function(array, f){
            $.each(array, function(i, e){
                f(e, i, array);
            });
        }
    }

}, 'hSpy', 'v2.1');
