// Verizon Proprietary and Confidential

'use strict';

(function(exports) {

  function SoftkeysHelper(actions) {
    console.log('[el] SoftkeysHelper CTOR');
    this.actionsArray = actions;
  }

  SoftkeysHelper.prototype = {
    actionsArray: null,
    /**
     * Initialize softkeys&actions for current view.
     * @param {Object} selectedTab a tab to select object.
     * @param {Array} actions an array of actions.
     */
    initActions: function skh_initActions() {
      var actStr = JSON.stringify(this.actionsArray);
      var evt = new CustomEvent('softkeys-init-event', {
        detail: {
          actions: actStr
        },
        bubbles: true,
        cancelable: false
      });
      window.dispatchEvent(evt);
    },

    updateVisible: function skh_updateVisible(vis) {
      var evt = new CustomEvent('softkeys-config-event', {
        detail: {
          param: 'visibility',
          data: vis
        },
        bubbles: true,
        cancelable: false
      });
      window.dispatchEvent(evt);
    },
    updateText: function skh_updateText(optionId, text) {
      var evt = new CustomEvent('softkeys-config-event', {
        detail: {
          param: 'updatetext',
          data: [optionId, text]
        },
        bubbles: true,
        cancelable: false
      });
      window.dispatchEvent(evt);
    },
    disableButton: function skh_disableButton(optionId, disabled) {
      var evt = new CustomEvent('softkeys-config-event', {
        detail: {
          param: 'availability',
          data: [optionId, disabled]
        },
        bubbles: true,
        cancelable: false
      });
      window.dispatchEvent(evt);
    }

  };

  exports.SoftkeysHelper = SoftkeysHelper;

})(window);
