// Verizon Proprietary and Confidential
(function(exports) {
  'use strict';
  const SHIFT_SCROLL = 295;
  
  function focusChanged(newIndex, oldIndex) {
    var evt = new CustomEvent("focus-changed", {
      detail: {
        from: oldIndex,
        to: newIndex
      },
      bubbles: true,
      cancelable: false
    });
    window.dispatchEvent(evt);
  }
  
  var FocusablesFilter = {
    _controls: [], 
    _curIndex: -1,

    init: function(resetCallback) {      
      console.log('filter init');   

      window.addEventListener("hashchanged", function () {
        FocusablesFilter.reset();
        if(resetCallback) {
          resetCallback();
        }
      },true);

      window.addEventListener('moz-app-loaded', function(e) {
        console.log('moz-app-loaded');
        FocusablesFilter.reset();
        if(resetCallback) {
          resetCallback();
        }
        setSoftKeyBar();
      });
    },

    reset: function() {	
      var _this = this;
      this._curIndex = -1;
      this._controls = [];
	  
      console.log('filter reset');
	  
	  thumbnailList.itemGroups.map(function(elem, index, arr){
        _this._controls = _this._controls.concat(elem.thumbnails);
      });
      
      if ( this._controls.length > 0 ) {
        this._curIndex = 0;
        focusChanged(this._curIndex, -1);
      }
    },
    getElements: function() {
      console.log('filter getElements');
	  return this._controls;
    },
    getCurrent: function() {
      var res = null;
      console.log('filter getCurrent');
	  
      if (this._controls.length > 0) {      
        if (this._curIndex < 0 || typeof this._controls[this._curIndex] == 'undefined') {
          this._curIndex = 0;
        }

        this._controls[this._curIndex].htmlNode.setAttribute('tabindex', 1);      
        res = $(this._controls[this._curIndex].htmlNode);
      }
      
      return res;
    },
    getBottom: function() {
      var res = null;
      var oldIndex = this._curIndex;
      
      console.log('filter getBottom');
	  
      if (this._controls.length > 0) {      
        if (this._curIndex >= this._controls.length-1) {
          this._curIndex = 0;
        }
        else {
          this._curIndex++;
        }

        this._controls[this._curIndex].htmlNode.setAttribute('tabindex', 1);
        res = $(this._controls[this._curIndex].htmlNode);
 	    focusChanged(this._curIndex, oldIndex);
      }
      
      return res;
    },
    getTop: function() {
      var res = null;
      var oldIndex = this._curIndex;
      
      console.log('filter getTop');

      if (this._controls.length > 0) {
        if (this._curIndex <= 0) {
          this._curIndex = this._controls.length-1;
        }
        else {
          this._curIndex--;
        }

        this._controls[this._curIndex].htmlNode.setAttribute('tabindex', 1);
        res = $(this._controls[this._curIndex].htmlNode);
        focusChanged(this._curIndex, oldIndex);
      }
     
      return res;
    },
    getLeft: function() {
      console.log('filter getLeft');
    },
    getRight: function() {
      console.log('filter getRight');
    },
    getSize: function() {
      console.log('filter getSize');
      return this._controls.length;
    },
    getDevider: function(source, target) {
      console.log('filter getDevider');
    },
    
    getLastElement: function() {
      console.log('filter getLastElement');
    },
    
    setNewPosition: function (index) {
      console.log('filter setNewPosition');
    },

    getCurIndex: function () {
      console.log('filter getCurIndex');
      return this._curIndex;
    },

    isVisible: function(element) {	
      console.log('filter isVisible');
    },

    toScrollBottom: function() {
        //window.scrollTo(0,100);
    },
    toScrollTop: function() {
        //window.scrollTo(0,this._controls[this._curIndex].htmlNode.y);
    },
    toScrollRight: function() {
        //window.scrollTo(0,this._controls[this._curIndex].htmlNode.y - SHIFT_SCROLL);
    },
    toScrollLeft: function() {
        //window.scrollTo(0,this._controls[this._curIndex].htmlNode.y);
    }
  };

  exports.FocusablesFilter = FocusablesFilter;
})(this);
