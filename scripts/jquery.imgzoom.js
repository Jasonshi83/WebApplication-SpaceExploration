/*
 * imgZoom jQuery plugin
 * version 0.2.2
 *
 * Copyright (c) 2009-2011 Michal Wojciechowski (odyniec.net)
 *
 * Dual licensed under the MIT (MIT-LICENSE.txt)

 * and GPL (GPL-LICENSE.txt) licenses.
 *
 * http://odyniec.net/projects/imgzoom/
 *
 */

(function ($) {

$.imgZoom = function (img, options) {
    var

        svgns = "http://www.w3.org/2000/svg",

        $a,

        winWidth, winHeight,

        pageWidth, pageHeight,

        width, height,

        thumbWidth, thumbHeight,

        src,

        image,

        over,

        imgOfs,

        endX, endY,

        endOpacity,

        $bigImg = $("<img/>"),

        $wrap,

        zIndex = 0,

        time,

        group,

        fx = $.extend($("<div/>")[0], { imgZoom: this, pos: 0, mode: 0 }),

        imgZoom = this,

        Z = $.imgZoom, M = Math;

    function setOptions(newOptions) {
        if (!(img.complete || img.readyState == 'complete'))
            return $(img).one('load', function () { setOptions(newOptions); });

        $.extend(options, newOptions);

        endOpacity = $.isArray(options.opacity) ? options.opacity[1] : 1;

        $("<img/>").attr("src", options.loadingImg);
        Z.$loading.css({
            backgroundImage: "url(" + options.loadingImg + ")",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat"
        });
    }

    function className(name) {
        return options.classPrefix + '-' + name;
    }

    function getImgOfs() {
        imgOfs = {
            left: M.round($(img).offset().left + ($(img).outerWidth() - thumbWidth) / 2),
            top: M.round($(img).offset().top + ($(img).outerHeight() - thumbHeight) / 2)
        };
    }

    function reset() {
        if (Z.animating || !Z.$overlay)
            return;

        winWidth = $(window).width();
        winHeight = window.innerHeight
            ? window.innerHeight : $(window).height();
        Z.$overlay.css({ width: 0, height: 0 });

        pageWidth = M.max($.browser.msie ?
                document.documentElement.scrollWidth :
                $(document).width(), winWidth);
        pageHeight = M.max($.browser.msie ?
                document.documentElement.scrollHeight :
                $(document).height(), winHeight);

        Z.$overlay.css({
            position: "absolute",
            left: 0,
            top: 0,
            width: pageWidth,
            height: pageHeight,
            overflow: "hidden",
            zIndex: zIndex + 1
        });

        if (Z.svg) {
            Z.svg.setAttribute("width", pageWidth);
            Z.svg.setAttribute("height", pageHeight);
        }
        else {
            $(Z.vmlGroup).css({
                position: "absolute",
                left: 0,
                top: 0,
                width: pageWidth,
                height: pageHeight,
                overflow: "hidden"
            });

            Z.vmlGroup.coordsize = (pageWidth) + "," + pageHeight;
        }
    }

    function animate(pos) {
        var w = M.round(thumbWidth + (width - thumbWidth) * pos),
            h = M.round(thumbHeight + (height - thumbHeight) * pos),
            angle = M.round(pos * parseInt(options.rotate + 0) * 360),
            opacity = ($.isArray(options.opacity) ?
                options.opacity[0] : options.opacity) * (1 - pos) +
                pos * endOpacity,
            overlayOpacity = (Z.keepOverlay || pos) * options.overlayOpacity,
            overOpacity = (1 - pos) * overlayOpacity * opacity;

        fx.pos = pos;

        getImgOfs();

        if (fx.mode == 1) {
            $(image).add($(over)).css('opacity', pos * endOpacity);
            return;
        }

        var x = M.round(imgOfs.left * (1 - pos) + endX * pos),
            y = M.round(imgOfs.top * (1 - pos) + endY * pos),
            rotate = "rotate(" + angle +
                "," + M.round(x + w/2) + ", " + M.round(y + h/2) + ")";
        Z.$overlay.css('opacity', options.showOverlay ? overlayOpacity : 0);

        if (Z.svg) {
            image.setAttribute("width", w);
            image.setAttribute("height", h);
            image.setAttribute("x", x);
            image.setAttribute("y", y);

            over.setAttribute("width", w);
            over.setAttribute("height", h);
            over.setAttribute("x", x);
            over.setAttribute("y", y);
            over.setAttribute('fill', options.showOverlay ?
                Z.$overlay.css('background-color') : 'none');

            if (options.rotate) {
                image.setAttribute("transform", rotate);
                over.setAttribute("transform", rotate);
            }

            if ($.browser.safari) {
                var rect = document.createElementNS(svgns, "rect");
                rect.setAttribute("x", -pageWidth);
                rect.setAttribute("y", -pageHeight);
                rect.setAttribute("width", 3 * pageWidth);
                rect.setAttribute("height", 3 * pageHeight);
                rect.setAttribute("fill", "none");
                $(Z.svg).append(rect);
                setTimeout(function () { $(rect).remove(); }, 0);
            }
        }
        else {
            $(image).add($(over)).css({
                width: w,
                height: h,
                left: x,
                top: y
            });

            over.filled = over.stroked = options.showOverlay;
            over.fillcolor = Z.$overlay.css('background-color');

            if (options.rotate) {
                image.style.rotation = angle;
                over.style.rotation = angle;
            }
        }

        $(image).css("opacity", opacity);
        $(over).css('opacity', options.showOverlay ? overOpacity : 0);
    }

    function zoom(duration, callback, out) {
        if (isNaN(duration))
            duration = options.duration;

        reset();

        Z.animating++;

        if (!out) {
            Z.$anim.show();

            endX = M.round((winWidth - width) / 2 + $(document).scrollLeft());
            endY = M.round((winHeight - height) / 2 + $(document).scrollTop());

            if (Z.svg) {
                image.setAttributeNS("http://www.w3.org/1999/xlink", "href", src);

                $(Z.svg).append(image).append(over).css({ zIndex: zIndex + 2 });
            }
            else
                $(Z.vmlGroup).add($(image)).add($(over))
                    .css({ zIndex: zIndex + 2 });
        }

        if (!options.fastSwitch || !Z.nextToZoom) {
            $(image).add($(over)).show();

            if (!out && options.hideThumbnail)
                $(img).fadeTo(0, 0);
        }

        $(fx).animate({ pos: out ? 0 : 1 }, duration, function () {
            if (!out) {
                if (!$wrap)
                    $wrap = $(options.wrap || Z.$wrap);

                $wrap.filter('.' + className('width')).width(width);
                $wrap.filter('.' + className('height')).height(height);

                $wrap.toggleClass(className('wrap-first'), !imgZoom.prev);
                $wrap.toggleClass(className('wrap-last'), !imgZoom.next);

                $wrap.find('.' + className('current')).text(imgZoom.number);
                $wrap.find('.' + className('last')).text(group.last.number);
                $wrap.find('.' + className('title')).text(options.title ||
                    $a.attr('title') || $(img).attr('title'));

                $bigImg.css({ position: 'absolute', opacity: endOpacity }).click(zoomOut);

                var $container = $wrap.find('.' + className('container'));
                $container.width(width).height(height).prepend($bigImg);
                $wrap.css({ left: 0, top: 0 }).insertAfter(Z.svg || Z.vmlGroup)
                    .show();

                $('.' + className('next')).add($('.' + className('prev')))
                    .add($('.' + className('close'))).unbind('click');
                $('.' + className('next')).click(nextClick);
                $('.' + className('prev')).click(prevClick);
                $('.' + className('close')).click(zoomOut);
                $wrap.css({
                    left: endX - $container.offset().left + $wrap.offset().left,
                    top: endY - $container.offset().top + $wrap.offset().top,
                    zIndex: zIndex + 4
                });

                if (options.hideThumbnail)
                    $(img).fadeTo(options.fastSwitch && Z.nextToZoom ?
                        options.wrapDuration : 0, 0);

                if (endOpacity < 1) {
                    fx.pos = 1;
                    fx.mode = 1;
                    $(fx).animate({ pos: 0 }, options.wrapDuration,
                        function () {
                            fx.pos = 1;
                            fx.mode = 0;
                        });
                }

                $bigImg.css({ opacity: 1 }).show();

                Z.zoomed = imgZoom;

                if (endOpacity < 1)
                    $wrap.css({ opacity: 0 })
                        .fadeTo(options.wrapDuration, endOpacity, function () {
                            finishZoom(callback);
                        });
                else
                    $wrap.hide().fadeIn(options.wrapDuration, function () {
                        finishZoom(callback);
                    });
            }

            else {
                if (options.hideThumbnail)
                    $(img).fadeTo(options.fastSwitch && Z.nextToZoom ?
                        options.wrapDuration : 0, 1);

                if (Z.zoomed == imgZoom)
                    Z.zoomed = null;

                finishZoom(callback);
            }
        });
    }

    function finishZoom(callback) {
        $(image).add($(over)).css({ zIndex: "" }).hide();

        if (!--Z.animating) {
            Z.keepOverlay = false;

            $(Z.svg||Z.vmlGroup).hide();

            if (!options.showOverlay || !(Z.zoomed || Z.nextToZoom))
                Z.$anim.hide();
        }

        if (callback)
            callback.call();

        if (Z.nextToZoom == imgZoom)
            Z.nextToZoom = null;
    }

    function doZoomIn(duration, callback) {
        if (Z.zoomed)
            Z.zoomed.zoomOut();

        zoom(duration, callback);
    }

    function zoomIn(duration, callback) {
        if (Z.animating || Z.zoomed == imgZoom)
            return;

        if (width != null) {
            $(image).add($(over)).css({ zIndex: zIndex + 5 });
            doZoomIn(duration, callback);
        }
        else {
            Z.$loading.css({
                position: "absolute",
                left: imgOfs.left,
                top: imgOfs.top,
                width: thumbWidth,
                height: thumbHeight
            }).appendTo("body").show();

            time = (new Date()).getTime();

            $bigImg.one("load", function () {
                width = $bigImg[0].width;
                height = $bigImg[0].height;

                time = (new Date()).getTime() - time;

                if (Z.svg) {
                    Z.$loading.hide();
                    doZoomIn(duration, callback);
                }
                else {
                    image.src = src;

                    setTimeout(function () {
                        Z.$loading.hide();
                        doZoomIn(duration, callback);
                    }, time*2 + 50);
                }
            })
            .attr("src", src);
        }
    }

    function zoomOut(duration, callback) {
        if (Z.animating || Z.zoomed != imgZoom)
            return;

        $(image).add($(over)).css({ zIndex: zIndex + 1 });

        if (endOpacity < 1) {
            $(image).add($(over)).show().css('opacity', endOpacity);
            fx.pos = 0;
            fx.mode = 1;
            $(fx).animate({ pos: 1 }, options.wrapDuration,
                function () {
                    fx.mode = 0;
                });
        }
        else
            $(image).add($(over)).show();

        $wrap.insertBefore(Z.svg||Z.vmlGroup);

        Z.$anim.show();

        if (endOpacity < 1)
            $wrap.fadeTo(options.wrapDuration, 0, function () {
                $bigImg.remove();
                $wrap.hide();

                zoom(duration, callback, true);
            });
        else

            $wrap.fadeOut(options.wrapDuration, function () {
                $bigImg.remove();

                zoom(duration, callback, true);
            });
    }

    function imgClick() {
        if (!Z.animating)
            if (Z.zoomed == imgZoom)
                zoomOut();
            else
                zoomIn();

        return false;
    }

    function aClick() {
        return false;
    }

    function init() {
        if (!(img.complete || img.readyState == 'complete'))
            return $(img).one('load', imgZoom.init);
        ($a = $(img).closest("a")).click(aClick);

        if (!Z.$loading)
            Z.$loading = $("<div/>");

        setOptions(options = $.extend({
            classPrefix: "imgzoom",
            duration: 500,
            wrapDuration: 300,
            loadingImg: "css/imgzoom-loading.gif",
            opacity: 1,
            overlayOpacity: 0.75,
            onInit: function () {}
        }, options));

        if (!Z.$overlay)
            Z.$overlay = $("<div/>").addClass(className("overlay"))
                .click(function () {
                    if (Z.zoomed)
                        Z.zoomed.zoomOut();
                });

        if (!Z.$wrap)
            Z.$wrap = $('<div class="imgzoom-wrap imgzoom-width">' +
                '<div class="imgzoom-container imgzoom-width imgzoom-height">' +
                '<a href="#" class="imgzoom-prev"><span>Prev</span></a>' +
                '<a href="#" class="imgzoom-next"><span>Next</span></a>' +
                '</div>' +
                '<div class="imgzoom-counter">' +
                '<span class="imgzoom-current" />&nbsp;of&nbsp;' +
                '<span class="imgzoom-last" />' +
                '</div>' +
                '<div class="imgzoom-title" />' +
                '<div class="imgzoom-close">Close</div>' +
                '</div>');


        src = options.src || $(img).parent().attr("href");

        thumbWidth = img.width;
        thumbHeight = img.height;

        if (window.SVGAngle) {
            if (!Z.svg)
                $(Z.svg = document.createElementNS(svgns, "svg")).css({
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: zIndex + 3
                });

            $(image = document.createElementNS(svgns, "image")).hide();
            $(over = document.createElementNS(svgns, "rect")).hide();
            over.setAttribute("fill", Z.$overlay.css("background-color"));

            $(Z.svg).append(image).append(over);
        }
        else {
            if (!Z.vmlGroup) {
                document.createStyleSheet().addRule(".imgzoom-vml", "behavior:url(#default#VML)");

                if (!document.namespaces.izvml)
                    document.namespaces.add("izvml", "urn:schemas-microsoft-com:vml");

                Z.vmlElem = function (tagName) {
                    return document.createElement("<izvml:" + tagName + " class=\"imgzoom-vml\">");
                };

                $(Z.vmlGroup = Z.vmlElem("group")).css({
                    position: "absolute",
                    left: 0,
                    top: 0,
                    zIndex: zIndex + 3
                });
                Z.vmlGroup.coordorigin = "0,0";
            }

            $(image = Z.vmlElem("image")).hide();
            $(over = Z.vmlElem("rect")).hide();
            over.fillcolor = Z.$overlay.css("background-color");

            $(Z.vmlGroup).append(image).append(over);
        }

        (Z.$anim = Z.$overlay.add($(Z.svg || Z.vmlGroup))).hide()
            .appendTo("body");
        getImgOfs();

        $(img).click(imgClick);

        if (!Z.fxStepDefault) {
            Z.fxStepDefault = $.fx.step._default;

            $.fx.step._default = function (fx) {
                return fx.elem.imgZoom ? fx.elem.imgZoom.animate(fx.now) :
                    Z.fxStepDefault(fx);
            };
        }

        $(window).resize(getImgOfs);

        if (imgZoom.number == 1)
            $(window).resize(reset);

        setTimeout(function () { options.onInit(img); }, 0);
    }

    function switchImg(next) {
        if (Z.zoomed && Z.zoomed[next]) {
            Z.keepOverlay = options.showOverlay;
            if (options.fastSwitch) {
                Z.nextToZoom = Z.zoomed[next];
                Z.zoomed.zoomOut(0, function () {
                    Z.zoomed = null;
                    Z.keepOverlay = options.showOverlay;
                    Z.nextToZoom.zoomIn(0);
                });
            }
            else
                Z.zoomed[next].zoomIn();
        }

        return false;
    }

    function prevClick() {
        return switchImg('prev');
    }

    function nextClick() {
        return switchImg('next');
    }
    this.init = init;
    this.animate = animate;

    this.remove = function () {
        $a.unbind('click', aClick);
        $(img).unbind('click', imgClick);
        $(window).unbind('resize', getImgOfs);

        if (imgZoom.prev)
            imgZoom.prev.next = imgZoom.next;

        if (imgZoom.next)
            imgZoom.next.prev = imgZoom.prev;
        else
            group.last = imgZoom.prev;

        for (var z = imgZoom.next; z; z = z.next)
            z.number--;

        if (!--Z.count) {
            $(window).unbind('resize', reset);

            Z.$wrap.add(Z.$anim).add(Z.$overlay).add(Z.$loading).remove();
            Z.$wrap = Z.$anim = Z.$overlay = Z.$loading = undefined;

            $.fx.step._default = Z.fxStepDefault;
            Z.fxStepDefault = null;
        }
    };

    this.getOptions = function () { return options; };

    this.setOptions = setOptions;

    this.zoomIn = zoomIn;

    this.zoomOut = zoomOut;

    if (options.group !== undefined) {
        if (!(group = Z.groups[options.group]))
            group = Z.groups[options.group] = { last: null };
    }
    else
        group = Z;

    if (group.last) {
        group.last.next = imgZoom;
        imgZoom.number = group.last.number + 1;
    }
    else
        imgZoom.number = 1;

    imgZoom.prev = group.last;
    group.last = imgZoom;

    Z.count++;

    init();
};

$.imgZoom.animating = 0;

$.imgZoom.keepOverlay = false;

$.imgZoom.groups = {};

$.imgZoom.count = 0;

$(window).load(function () {
    $.imgZoom.windowLoaded = true;
});

$.fn.imgZoom = function (options) {
    options = options || {};

    this.find("img").add(this.filter("img")).each(function () {
        if ($(this).data("imgZoom"))
            if (options.remove) {
                $(this).data('imgZoom').remove();
                $(this).removeData('imgZoom');
            }
            else
                $(this).data("imgZoom").setOptions(options);
        else if (!options.remove)
            $(this).data("imgZoom", new $.imgZoom(this, options));
    });

    if (options.instance)
        return this.find("img").add(this.filter("img")).data("imgZoom");

    return this;
};

})(jQuery);