// Verizon Proprietary and Confidential
(function() {
  var modules = [], // private record of module data
  order = []; // private record of module load order
  var selected;
  var loader = LazyLoader;

  console.log('start keyboard handler');
  loader.load("js/jquery-1.11.1.min.js", function() {
    console.log('jquery-1.11.1.min.js loaded');
  });

  loader.load("js/focusables_filter.js", function() {
    console.log('focusables_filter.js loaded');

    var filter = FocusablesFilter;
    modules[1] = filter;
    filter.init(function() {
      console.log('_resetFocus');

      if(document.URL != "app://system.gaiamobile.org/index.html") {
        $('iframe').contents().keydown(function(e) {
          console.log("iframe keydown");
          handleKeydown(e);
        });
      }

      if(selected != null && typeof selected != 'undefined') {
        selected.removeClass($.keyFocus.conf.focusClass);
      }
      var item = getCurrent();
      selected = $(item).addClass($.keyFocus.conf.focusClass);
      var valueSel = document.querySelector(".value-selector");
      if(valueSel != null && valueSel.hidden == false) {
            selected.blur();
        } else {
            selected.focus();
        }
      window.focus();
    });

    LazyLoader.load(['/shared/elements/gaia_softkeys_panel/js/group_menu_navigator.js'], function() {
      var filter = GroupMenuNavigator;
      modules[0] = filter;
      filter.init(function() {
        console.log('_resetFocus');
        if(selected != null && typeof selected != 'undefined') {
          selected.removeClass($.keyFocus.conf.focusClass);
        }
        var item = getCurrent();
        selected = $(item).addClass($.keyFocus.conf.focusClass);
        selected.focus();
        window.focus();
      });
    });

    if (typeof jQuery == 'undefined') {
      if (console && console.log) {
        console.log('Keyboard Focus plugin could not be initialised because jQuery is not available');
      }
    } else { /* Start if jQuery exists */
      console.log('jQuery is defined');
      jQuery.keyFocus = {};
      jQuery.keyFocus.conf = {
        keyFocusClass: 'keyboard-focus',
        mouseFocusClass: 'mouse-focus',
        focusClass: 'focus',
        mouseTimeout: 50
      };

      $(document).ready(function() {
        console.log('ready');
        $('body').trackFocus();
      });

      /**
       * @see http://www.w3.org/TR/wai-aria-practices/#kbd_generalnav
       * @param DOMNode this The container element that acts as "toolbar" for the controls.
       * @param jQuerySelector controlSelector Individual controls to navigate between.
       * @param Object options A set of options to override the $.AKN.defaultOptions.
       */
      if(document.URL != "app://system.gaiamobile.org/index.html"){
        $.fn.trackFocus = function() {
          console.log('track focus function');
          $(this).data('last-device-used', '');

          $(this)
            .bind('mousedown', function(e) {
            $(this).data('last-device-used', 'mouse');
            $(this).data('last-device-used-when', new Date().getTime());
          })
            .bind('keydown', function(e) {
            $(this).data('last-device-used', 'keyboard');
          })
            .bind('focusin', function(e) {
            // Keyboard events sometimes go undetected (if tabbing in from outside the document,
            // but mouse clicks used to focus will always be closely
            // followed by the focus event. Clearing the last-device-used
            // after a short timeout and assuming keyboard when no device is known
            // works!
            if ($(this).data('last-device-used') != 'mouse' || new Date().getTime() - 50 > $(this).data('last-device-used-when')) {
              $(e.target).addClass($.keyFocus.conf.keyFocusClass);
            } else {
              $(e.target).addClass($.keyFocus.conf.mouseFocusClass);
            }
            $(e.target).addClass($.keyFocus.conf.focusClass);
          })
            .bind('focusout', function(e) {
            $('.' + $.keyFocus.conf.keyFocusClass + ', .' + $.keyFocus.conf.mouseFocusClass).removeClass($.keyFocus.conf.keyFocusClass + ' ' + $.keyFocus.conf.mouseFocusClass);
            $(e.target).removeClass($.keyFocus.conf.focusClass);
          });
        };
      }

      window.addEventListener('lockscreen-appclosed', function(e) {
        if(System.currentApp != null) {
          System.currentApp.focus();
        }
      });

      window.addEventListener('activityterminated', function(e) {
        if(System.currentApp != null) {
          System.currentApp.focus();
        }
      });

      window.addEventListener("keyup", function(e) {
        console.log('keyup');
        console.log(e.key);
        handleKeyup(e);
      });

      function handleKeyup(e) {
        var res = handleEventByCurrent(e);
        if(res == false) {
          if(e.key == 'Enter' || e.key == 'Accept') {
            if(modules[0] != null &&
               modules[0].getCurrent() != null) {
              var evt = new CustomEvent("softkey-up", {
                detail: {
                  key: "CSK"
                },
                bubbles: true,
                cancelable: false
              });
              e.target.dispatchEvent(evt);

              var selected = getCurrent();
              var inp = selected.find("input");
              if(inp.length != 0) {
                if(inp[0].type == "checkbox" || inp[0].type == "radio") {
                  selected.addClass($.keyFocus.conf.focusClass);
                  selected.focus();
                }
              }
            } else {
              handleEnterAccept(e);
            }
          } else if(e.key == "Backspace" || e.key == "BrowserBack" || e.key == "KanjiMode") {
            var evt = new CustomEvent("hw-keyup", {
              detail: {
                key: "Back"
              },
              bubbles: true,
              cancelable: false
            });
            window.dispatchEvent(evt);
          } else if(e.key == "ContextMenu" || e.key == "SoftLeft") {
              var evt = new CustomEvent("softkey-up", {
                detail: {
                  key: "LSK"
                },
                bubbles: true,
                cancelable: false
              });
              window.dispatchEvent(evt);
          } else if(e.key == "SoftRight") {
              var evt = new CustomEvent("softkey-up", {
                detail: {
                  key: "RSK"
                },
                bubbles: true,
                cancelable: false
              });
              window.dispatchEvent(evt);
          }
        }
      };

      window.addEventListener("keydown", function(e) {
        console.log('keydown');
        handleKeydown(e);
      });

      function handleKeydown(e) {
        var res = handleEventByCurrent(e);
        if(res == false) {
          selected = getCurrent();
          var preventDefault = false;
          if (e.key === 'ArrowDown') {
            if(selected != null && typeof selected != 'undefined') {
              selected.removeClass($.keyFocus.conf.focusClass);
            }
            var item = getBottom();
            selected = $(item).addClass($.keyFocus.conf.focusClass);
            var valueSel = document.querySelector(".value-selector");
            if(valueSel != null && valueSel.hidden == false) {
              selected.blur();
            } else {
              selected.focus();
            }
            preventDefault = true;
          } else if (e.key === 'ArrowUp') {
            if(selected != null && typeof selected != 'undefined') {
              selected.removeClass($.keyFocus.conf.focusClass);
            }
            var item = getTop();
            selected = $(item).addClass($.keyFocus.conf.focusClass);
            var valueSel = document.querySelector(".value-selector");
            if(valueSel != null && valueSel.hidden == false) {
              selected.blur();
            } else {
              selected.focus();
            }
            preventDefault = true;
          } else if(e.key === 'ArrowRight') {
            var item = getRight();
            if(item != null) {
              if(selected != null && typeof selected != 'undefined') {
                selected.removeClass($.keyFocus.conf.focusClass);
              }
              selected = $(item).addClass($.keyFocus.conf.focusClass);
              var valueSel = document.querySelector(".value-selector");
              if(valueSel != null && valueSel.hidden == false) {
                selected.blur();
              } else {
                selected.focus();
              }
            }
            preventDefault = true;
          } else if(e.key == 'ArrowLeft') {
            var item = getLeft();
            if(item != null) {
              if(selected != null && typeof selected != 'undefined') {
                selected.removeClass($.keyFocus.conf.focusClass);
              }
              selected = $(item).addClass($.keyFocus.conf.focusClass);
              var valueSel = document.querySelector(".value-selector");
              if(valueSel != null && valueSel.hidden == false) {
                selected.blur();
              } else {
                selected.focus();
              }
            }
            preventDefault = true;
          } else if(e.key == 'Enter' || e.key == 'Accept') {
            if(modules[0] != null) {
              var evt = new CustomEvent("softkey-down", {
                detail: {
                  key: "CSK"
                },
                bubbles: true,
                cancelable: false
              });
              e.target.dispatchEvent(evt);
            } else {
              handleEnterAccept(e);
            }
          } else if(e.key == "Backspace" || e.key == "BrowserBack" || e.key == "KanjiMode") {
            var evt = new CustomEvent("hw-keydown", {
              detail: {
                key: "Back"
              },
              bubbles: true,
              cancelable: false
            });
            window.dispatchEvent(evt);
          } else if(e.key == "ContextMenu" || e.key == "SoftLeft") {
            var evt = new CustomEvent("softkey-down", {
              detail: {
                key: "LSK"
              },
              bubbles: true,
              cancelable: false
            });
            window.dispatchEvent(evt);
          } else if(e.key == "SoftRight") {
            var evt = new CustomEvent("softkey-down", {
              detail: {
                key: "RSK"
              },
              bubbles: true,
              cancelable: false
            });
            window.dispatchEvent(evt);
          }

          if(preventDefault && document.URL != "app://system.gaiamobile.org/index.html") {
            e.preventDefault();
          }
        }
      }

      function getCurrent() {
        var res = null;
        if(modules[0] != null) {
          res = modules[0].getCurrent();
        }

        if(res == null || typeof res == 'undefined') {
          res = modules[1].getCurrent();
        }
        return res;
      }

      function getBottom() {
        var res = null;
        if(modules[0] != null) {
          res = modules[0].getBottom();
        }
        if(res == null || typeof res == 'undefined') {
          res = modules[1].getBottom();
        }
        return res;
      }

      function getTop() {
        var res = null;
        if(modules[0] != null) {
          res = modules[0].getTop();
        }
        if(res == null || typeof res == 'undefined') {
          res = modules[1].getTop();
        }
        return res;
      }

      function getLeft() {
        var res = null;
        if(modules[0] != null) {
          res = modules[0].getLeft();
        }
        if(res == null || typeof res == 'undefined') {
          res = modules[1].getLeft();
        }
        return res;
      }

      function getRight() {
        var res = null;
        if(modules[0] != null) {
          res = modules[0].getRight();
        }
        if(res == null || typeof res == 'undefined') {
          res = modules[1].getRight();
        }
        return res;
      }

      function handleEventByCurrent(e) {
        var current = getCurrent();
        if(current != null && current != 'undefined') {
          if(current[0].type == 'text' || current[0].getAttribute('role') == 'textbox' ) {
            if(e.key == 'ArrowLeft' || e.key == 'ArrowRight') {
              current[0].focus();
              return true;
            }
          } else {
            var inputs = $(current).find("input");
            if(inputs.length !== 0) {
              if(inputs[0].type == 'range') {
                if(e.key == 'ArrowLeft') {
                  inputs[0].stepDown(1);
                  e.preventDefault();
                  return true;
                } else if(e.key == 'ArrowRight') {
                  inputs[0].stepUp(1);
                  e.preventDefault();
                  return true;
                }
              } else if(inputs[0].type == 'text' || inputs[0].type == 'password') {
                inputs[0].focus();
              }
            } else {
              select = $(current).find('select');
              if(select.length > 0) {
                if(e.key == 'Enter' || e.key == 'Accept') {
                  select.eq(0).focus();
                  console.log($('*'));
                  return true;
                }
              }
            }
          }
        }
        return false;
      }

      function handleEnterAccept(e) {
        if(e.type == "keydown") {
          if(typeof app != 'undefined' && app.grid._grid.dragdrop.inEditMode) {
            return;
          }

          var event = document.createEvent('TouchEvent');
          var touch = document.createTouch(window, e.target);
          var touchList = document.createTouchList(touch);
          event.initTouchEvent('touchstart', true, true, window,
                       0, false, false, false, false,
                       touchList, touchList, touchList);

          e.target.dispatchEvent(event);
        } else if(e.type == "keyup") {
          var event = document.createEvent('TouchEvent');
          var touch = document.createTouch(window, e.target);
          var touchList = document.createTouchList(touch);
          event.initTouchEvent('touchend', true, true, window,
                        0, false, false, false, false,
                        touchList, touchList, touchList);

          e.target.dispatchEvent(event);
          e.target.click();

          for(var i=0; i<e.target.children.length; i++) {
            //Settings:  for USB storage case, run menu Transfer protocol
            if($(".pack-split").length!=0 && e.target.className == $(".pack-split")[0].className) {
              if(e.target.children[i].id == 'menuItem-enableStorage') {
                e.target.children[i].click();
              }
            } else {
              e.target.children[i].click();
            }
          }

          var selected = getCurrent();
          var inp = selected.find("input");
          if(inp.length != 0) {
            if(inp[0].type == "checkbox" || inp[0].type == "radio") {
              selected.addClass($.keyFocus.conf.focusClass);
              selected.focus();
            }
          }
        }
      }
    }
  });
})();
