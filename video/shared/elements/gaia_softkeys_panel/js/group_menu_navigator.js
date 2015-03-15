// Verizon Proprietary and Confidential
(function(exports) {
  'use strict';

  var GroupMenuNavigator = {
    _controls: null,
    _curIndex: -1,

    init: function(resetCallback) {
      console.log('Menu items init');

      var body = document.body;
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if(mutation.type == "attributes") {
            if(mutation.attributeName == "class" && mutation.target.classList.contains('group-menu')) {
              console.log(mutation.target.classList);
              GroupMenuNavigator.reset();
              if(resetCallback) {
                resetCallback();
              }
            }
          }
        });
      });

      var config = {
        attributes: true,
        chatacterData: true,
        subtree: true
      };
      observer.observe(body, config);
    },
    reset: function() {
      this._controls = $('.group-menu.visible.focused .action-menu-item');
      this._curIndex = -1;
    },
    getElements: function() {
      this._controls = $('.group-menu.visible.focused .action-menu-item');
      return this._controls;
    },
    getCurrent: function() {
      if(this._controls == null || this._controls.length == 0) {
        return;
      }

      if (this._curIndex < 0) {
        this._curIndex = 0;
      }
      this._controls[this._curIndex].setAttribute('tabindex', 1);
      return this._controls.eq(this._curIndex);
    },
    getBottom: function() {
      if(this._controls == null || this._controls.length == 0) {
        return;
      }

      if (this._curIndex >=0 && this._curIndex < this._controls.length - 1) {
        this._curIndex++;
      } else {
        this._curIndex = 0;
      }
      this._controls[this._curIndex].setAttribute('tabindex', 1);
      return this._controls.eq(this._curIndex);
    },
    getTop: function() {
      if(this._controls == null || this._controls.length == 0) {
        return;
      }

      if (this._curIndex > 0) {
        this._curIndex--;
      } else {
        this._curIndex = this._controls.length - 1;
      }
      this._controls[this._curIndex].setAttribute('tabindex', 1);
      return this._controls.eq(this._curIndex);
    },
    getLeft: function() {
      return null;
    },
    getRight: function() {
      return null;
    },
    getSize: function() {
      return this._controls.length;
    }
  };

  exports.GroupMenuNavigator = GroupMenuNavigator;
})(this);
