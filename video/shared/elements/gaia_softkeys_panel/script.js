// Verizon Proprietary and Confidential
'use strict';
/* global ComponentUtils */

window.GaiaSoftkeysPanel = (function(win) {
  // Extend from HTMLElement prototype
  var proto = Object.create(HTMLElement.prototype);

  proto.lsk = null;
  proto.csk = null;
  proto.rsk = null;
  proto.actions = null;
  proto._menu = null;
  proto._menuVisible = false;
  proto._menuActionsPriority = 5;
  proto._lskPriority = 1;
  proto._cskPriority = 2;
  proto.menuStartIndex = -1;
  proto.lskIndex = -1;
  proto.cskIndex = -1;
  proto.rskIndex = -1;

  // Allow baseurl to be overridden (used for demo page)
  var baseurl = window.GaiaSoftkeysPanelBaseurl ||
    '/shared/elements/gaia_softkeys_panel/';

  function _bindHWKeys() {
    window.addEventListener('softkeys-init-event', (e) => {
      console.log("[el] _BHK::skListener this == " + this + " | proto = " + proto);
      this.actions = JSON.parse(e.detail.actions);
      // let's sort actions array according to priorities
      this.actions.sort(function(a, b) {
        return a.priority - b.priority;
      });

      _initSKByPriority.call(this);
      _setSoftkeysVisuals.call(this);
      if(this._menu){
        this._menu.removeForms();
        this._menu = null;
      }
    });

    window.addEventListener('softkey-down', (e) => {
      console.log('softkey-down');
      if(e.detail.key == "RSK" && !(this.rsk.hasAttribute('disabled'))) {
        this.rsk.classList.add('active');
      } else if(e.detail.key == "CSK") {
        if (!(this.csk.hasAttribute('disabled'))) {
          this.csk.classList.add('active'); // css styling applied only if softkey enabled
        }
        if(typeof this.cskIndex == 'undefined' || this.cskIndex == -1) {
          _dispatchCskDefaulEvent.call(this, e);
        }
      } else if(e.detail.key == "LSK" && !(this.lsk.hasAttribute('disabled'))) {
        this.lsk.classList.add('active');
      }
    });

    window.addEventListener('softkey-up', (e) => {
      console.log('softkey-up');
      if(e.detail.key == "RSK" && !(this.rsk.hasAttribute('disabled'))) {
        this.rsk.classList.remove('active');
        if(this.menuStartIndex != -1) {
          _openGroupMenu.call(this);
        } else {
          _dispatchCallbackEvent.call(this, e);
        }
      } else if(e.detail.key == "CSK") {
        if (!(this.csk.hasAttribute('disabled'))) {
          this.csk.classList.remove('active'); // css styling applied only if softkey enabled
        }
        if ((typeof this.cskIndex != 'undefined' && this.cskIndex != -1) || this._menuVisible) {
          _dispatchCallbackEvent.call(this, e);
        } else {
          _dispatchCskDefaulEvent.call(this, e);
        }
      } else if(e.detail.key == "LSK" && !(this.lsk.hasAttribute('disabled'))) {
        this.lsk.classList.remove('active');
        _dispatchCallbackEvent.call(this, e);
      }
    });
    // 'Back' handler for dismissing menu
    window.addEventListener('hw-keyup', (e) => {
      if((this._menuVisible) && (e.detail.key == "Back")) {
        _closeGroupMenu.call(this);
      }
    });

    window.addEventListener('softkeys-config-event', (e) => {
      if(e.detail.param === 'visibility') {
        console.log('[el] got visibility evt');
        if (e.detail.data == true) {
          this.show();
        } else if (e.detail.data == false) {
          this.hide();
        } else {
          console.warn('[el] trying to set unexpected value to visibility');
        }
      } else if(e.detail.param === 'updatetext') {
        console.log('[el] got updatetext evt: ' + e.detail.data);
        handleConfigEvent.call(this, e.detail.data,
          (sk,value)=>{sk.innerHTML=value;},
          (isButton,obj,value)=>{ 
            if(isButton) obj.textContent=value;
            else obj.text=value;
          }
        );
      } else if(e.detail.param === 'availability') {
        console.log('[el] got availability evt: ' + e.detail.data);       
        handleConfigEvent.call(this, e.detail.data,             
          (sk,value)=>{_setSkDisabled(sk, value);},
          (isButton,obj,value)=>{obj.disabled=value;}
        );
      }
      function handleConfigEvent(data, skCallback, menuCallback) {
        var optionId = data[0];
        var value = data[1];       
        // Soft Key
        if (-1 !== this.lskIndex &&
          optionId === this.actions[this.lskIndex].optionId){
          skCallback(this.lsk, value); return;
        }
        else if (-1 !== this.cskIndex &&
          optionId === this.actions[this.cskIndex].optionId){
          skCallback(this.csk, value); return;
        }
        else if (-1 !== this.rskIndex &&
          optionId === this.actions[this.rskIndex].optionId){
          skCallback(this.rsk, value); return;
        }
        // Menu Option
        if(this._menu){
          var button = this._menu.getButtonById(optionId);
          if(button) {
            menuCallback(true, button, value);
          }
        }
        if(this.menuStartIndex > -1) {
          for(var i = this.menuStartIndex; i < this.actions.length; i++){
            if(optionId === this.actions[i].optionId) {
              menuCallback(false, this.actions[i], value); return;
            }
          } 
        }
        console.warn('[Menu] optionId: ' + optionId + ' not found!');
      };
    });
  };

  function _initSKByPriority() {
    var lskReady = false;
    var cskReady = false;
    var rskReady = false;
    //reset indexes
    this.menuStartIndex = -1;
    this.lskIndex = -1;
    this.cskIndex = -1;
    this.rskIndex = -1;

    for (var i = 0; i < this.actions.length; i++) {
      var curPriority = this.actions[i].priority;
      if(curPriority < this._menuActionsPriority) {
        // trying to initialize softkeys, if they are not initialized yet
        if (!lskReady && curPriority == this._lskPriority) {
          this.lskIndex = i;
          lskReady = true;
          continue;
        } else if (!cskReady && curPriority == this._cskPriority) {
          this.cskIndex = i;
          cskReady = true;
          continue;
        } else if(!rskReady) {
          if (i == (this.actions.length - 1)) {
            // it's last item in actions list && it have proper priority
            // let's put it onto RSK
            this.rskIndex = i;
          } else {
            // there are > 1 items in the actions list left:
            // - assign 'Options' to RSK and move tail to menu actions.
            this.menuStartIndex = i;
          }
          rskReady = true;
          break;
        } else {
          console.warn("[el] initSKByPriority():: what are we doing here???");
        }
      } else {
        if (!rskReady) {
          // there are no more actions with sufficient priorities in list
          // - assign 'Options' to RSK and move tail to menu actions.
          this.menuStartIndex = i;
          rskReady = true;
          break;
        }
      }
    }
    console.log("[el] SKs Init completed: l|c|r || menu == " + this.lskIndex + "|" + this.cskIndex +"|"+this.rskIndex +"||"+ this.menuStartIndex);
  };

  function _setSoftkeysVisuals() {
    var needDisable = false;
    if (this.lskIndex != -1) {
      this.lsk.innerHTML = this.actions[this.lskIndex].text;
      needDisable = this.actions[this.lskIndex].disabled;
    } else {
      this.lsk.innerHTML = "";
      needDisable = true;
    }
    _setSkDisabled(this.lsk, needDisable);

    if (this.cskIndex != -1) {
      this.csk.innerHTML = this.actions[this.cskIndex].text;
      needDisable = this.actions[this.cskIndex].disabled;
    } else {
      this.csk.innerHTML = "";
      needDisable = true;
    }
    _setSkDisabled(this.csk, needDisable);

    if (this.rskIndex != -1) {
      this.rsk.innerHTML = this.actions[this.rskIndex].text;
      needDisable = this.actions[this.rskIndex].disabled;
    } else if (this.menuStartIndex != -1) {
      this.rsk.innerHTML = "Options";
      needDisable = false;
    } else {
      this.rsk.innerHTML = "";
      needDisable = true;
    }
    _setSkDisabled(this.rsk, needDisable);
  };

  function _openGroupMenu() {
    console.log("Softkeys engine: open group menu");
    //dirty hack of softkeys for opened menu
    //TODO: need to disable 'blank' softkeys, since we don't want to digg into mess
    //      appeared after SK Events processig when they are not expected at all.
    this.lsk.innerHTML = "";
    _setSkDisabled(this.lsk, true);
    this.csk.innerHTML = "OK";
    _setSkDisabled(this.csk, false);
    this.rsk.innerHTML = "";
    _setSkDisabled(this.rsk, true);

    var om_params;
    om_params = {
        items: this.actions.slice(this.menuStartIndex),
        classes: ['group-menu']
    };
    if (typeof OptionMenu == 'undefined') {
      console.log("[el] OptMenu undefined - start LazyLoading");
      LazyLoader.load(['shared/js/option_menu.js',
                       'shared/style/action_menu.css',
                       'shared/style/option_menu.css'], () => {
        console.log("[el] LazyLoad of OptMenu done!");
        this._menu = new OptionMenu(om_params);
        this._menu.show();
      });
    } else {
      console.log("[el] OptMenu already loaded - just init menu and show it");
      if(!this._menu) this._menu = new OptionMenu(om_params);
      this._menu.show();
    }
    this._menuVisible = true;
  }

  // Since we are not sending 'click' event to OptionsMenu here the only place where it's closed
  function _closeGroupMenu() {
    console.log("Softkeys engine: close group menu");
    setTimeout(() => {
      if(this._menu) this._menu.hide();
      this._menuVisible = false;
      _setSoftkeysVisuals.call(this);
    }, 50);
  }

  function _dispatchCskDefaulEvent(e) {
    console.log("[el] SKeng: _dispatchCskDefaulEvent");
    if(e.type == "softkey-down") {
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
    } else if(e.type == "softkey-up") {
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

      /*var selected = getCurrent();
      var inp = selected.find("input");
      if(inp.length != 0) {
        if(inp[0].type == "checkbox" || inp[0].type == "radio") {
          selected.addClass($.keyFocus.conf.focusClass);
          selected.focus();
        }
      }*/
    }
  }

  function _dispatchCallbackEvent(e) {
    console.log("[el] SKeng: CallBack | JS e.detail = " + JSON.stringify(e.detail));
    //TODO: fixme - it's an ugly dirty hack to identify selected action by comparing
    // target's innerHTML with all possible values came from caller
    // Bug*** submitted for this refactoring
    var focusedMenuItems = $('.action-menu-item.focus');
    var tgtText = "";
    var actionId = -1;
    if (focusedMenuItems != undefined && focusedMenuItems != null && focusedMenuItems.length > 0) {
      // event from menu
      if(focusedMenuItems.children().length > 0) {
        this._menu.showSubMenu(focusedMenuItems[0].id, 
          focusedMenuItems.offset().top, focusedMenuItems.height());
      } else {
      tgtText = focusedMenuItems[0].innerHTML;
      this.actions.forEach(function searchTargetAction(action) {
          if(action.text === tgtText) {
          actionId = action.optionId;
          return;
        }
      });
      _closeGroupMenu.call(this);
      }
    } else {
      //event from softkey directly
      switch (e.detail.key) {
      case "LSK":
        if (this.lskIndex != 'undefined' && this.lskIndex != -1) {
          actionId = this.actions[this.lskIndex].optionId;
        }
        break;
      case "CSK":
        if (this.cskIndex != 'undefined' && this.cskIndex != -1) {
          actionId = this.actions[this.cskIndex].optionId;
        }
        break;
      case "RSK":
        if (this.rskIndex != 'undefined' && this.rskIndex != -1) {
          actionId = this.actions[this.rskIndex].optionId;
        }
      }
      console.log("[el] SK own action Id == " + actionId);
    }
    if (actionId != -1) {
      var evt = new CustomEvent("softkeys-callback-event", {
        detail: {
          id: actionId
        },
        bubbles: true,
        cancelable: false
      });
      console.log('softkeys-callback-event:' + actionId);
      window.dispatchEvent(evt);
    } else {
      console.warn("[el] _dispatchCallbackEvent() | Unable to determine action originator");
    }
  }

// Utility function for setting 'disabled' attribute for particular softkey
  function _setSkDisabled(skBtn, isDisabled) {
    var alreadyDisabled = skBtn.hasAttribute('disabled');
    if (isDisabled && !alreadyDisabled) {
      skBtn.setAttribute('disabled', 'disabled');
    } else if (!isDisabled && alreadyDisabled) {
      skBtn.removeAttribute('disabled');
    }
  }

  proto.createdCallback = function () {
    console.log("[el] sk-panel created");
    var shadow = this.createShadowRoot();
    this._template = template.content.cloneNode(true);
    shadow.appendChild(this._template);
    ComponentUtils.style.call(this, baseurl);
    // using 'proto' since here 'this == just created HTMLObject without additional attributes'
    proto.lsk = shadow.getElementById('gaia-lsk');
    proto.csk = shadow.getElementById('gaia-csk');
    proto.rsk = shadow.getElementById('gaia-rsk');

    _bindHWKeys.call(proto);

    navigator.mozL10n.ready(this.localize.bind(this));
  };

  proto.localize = function() {
    //TODO: add l10n logic here
  };

  proto.show = function() {
    this.removeAttribute('hidden');
  };

  proto.hide = function() {
    this.setAttribute('hidden', 'hidden');
  };

  var template = document.createElement('template');

  template.innerHTML =
    `<section>
      <table class="skbar">
        <tbody>
          <tr>
            <td align="left" width="33%" nowrap>
              <button id="gaia-lsk" class="sk-button"><content select="l-sk"></button>
            </td>
            <td align="center" nowrap>
              <button id="gaia-csk" class="sk-button"><content select="c-sk"></button>
            </td>
            <td align="right" width="33%" nowrap>
              <button id="gaia-rsk" class="sk-button"><content select="r-sk"></button>
            </td>
          </tr>
        </tbody>
     </table>
   </section>`;

  // Register and return the constructor
  return document.registerElement('gaia-softkeys-panel', { prototype: proto });

})(window);

/**
* AppAction class definition, to be used in applications for defining softkeys
  and OptionsMenu items.
*
* @param {String} text The text to be displayed on Softkey OR on menu item.
* @param {String} id will be reported by SK Engine in callback
* @param {Integer} priority to let SK Engine position action either on SoftKey
                  or in Application menu. All actions with priority > 10 will
                  be located in menu even if there will be free softkeys.
*/
var AppAction = function(text, id, priority) {
  this.text = text;
  this.optionId = id;
  this.priority = priority;
  Object.defineProperty(this, 'disabled', {
    value: false,
    writable: true,
    enumerable: true
  });
};
