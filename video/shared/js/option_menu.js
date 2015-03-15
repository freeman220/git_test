// Verizon Proprietary and Confidential
'use strict';

/*
 Generic action menu. Options should have the following structure:


  new OptionMenu(options);

  options {

    items: An array of menu options to render
    eg.
    [
      {
        buttonId: 0x0100,
        text: 'Lorem ipsum',
        l10nId: 'lorem',
        l10nArgs: 'ipsum',
        disabled: true,
        method: function optionMethod(param1, param2) {
          // Method and params if needed
        },
        params: ['param1', '123123123']
      },
      ....
      ,


      Last option has a different UI compared with the previous one.
      This is because it's recommended to use as a 'Cancel' option
      {
        buttonId: 0x0101,
        text: 'Cancel',
        l10nId: 'Cancel'
        disabled: false,
        method: function optionMethod(param) {
          // Method and param if needed
        },
        params: ['Optional params'],

        // Optional boolean flag to tell the
        // menu button handlers that this option
        // will not execute the "complete" callback.
        // Defaults to "false"

        incomplete: false [true]
      }
    ],

    // Optional header text or node
    header: ...,

    // additional classes on the dialog, as an array of strings
    classes: ...

    // Optional section text or node
    section: ...

    // Optional data-type: confirm or action
    type: 'confirm'

    // Optional callback to be invoked when a
    // button in the menu is pressed. Can be
    // overridden by an "incomplete: true" set
    // on the menu item in the items array.
    complete: function() {...}
  }
*/

const MAIN_MENU_ID = 'mainMenu';

var OptionMenu = function(options) {
  if (!options || !options.items || options.items.length === 0) {
    return;
  }
  // Create a private, weakly held entry for
  // this instances DOM object references
  // More info:
  // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/WeakMap
  this.handlers = new WeakMap();
  
  // Create the structure
  //this.form = null;
  //this.subform = null;
  this.options = options;
  this.subForms = {};
  this.form = createForm.call(this, MAIN_MENU_ID);
  createMenu.call(this, this.form, this.options.items);
  function createForm(formId) {
    var form = document.createElement('form');
    form.id = formId;
    form.dataset.type = this.options.type || 'action';
    form.setAttribute('role', 'dialog');    

    // Add classes if needed

    if (this.options.classes) 
      form.classList.add(this.options.classes);

    // Append title if needed
    if (this.options.header) {
    var header = document.createElement('header');

      if (typeof this.options.header === 'string') {
        header.textContent = this.options.header || '';
      } else if (this.options.header.l10nId) {
        header.setAttribute('data-l10n-id', this.options.header.l10nId);
    } else {
        header.appendChild(this.options.header);
    }

      form.appendChild(header);
  }
    // Append section if needed
    if (this.options.section) {
    var section = document.createElement('section');

      if (typeof this.options.section === 'string') {
        section.textContent = this.options.section || '';
    } else {
        section.appendChild(this.options.section);
    }

      form.appendChild(section);
  }
    form.addEventListener('submit', function(event) {
      event.preventDefault();
    });

    form.addEventListener('transitionend', function(event) {
      console.log('transitionend: ' + event.target);
      if (event.target !== form) {
        return;
      }
      if (!form.classList.contains('visible') && form.parentNode) {
        console.log('Remove form: ' + form.id);
        document.body.removeChild(form);
      }
    }.bind(this)); 
    return form;
  };
  function createMenu(form, items) {
    // Retrieve items to be rendered
    var subMenuItems = {}; 
  // We append a menu with the list of options
  var menu = document.createElement('menu');
  menu.dataset.items = items.length;

  // For each option, we append the item and listener
  items.forEach(function renderOption(item) {
      // Only support one level submenu now. 
      if(MAIN_MENU_ID === form.id && item.buttonId) {
        if(item.buttonId & 0x00FF) {
          menu.dataset.items--;
          var fatherId = item.buttonId & 0xFF00;
          if(typeof subMenuItems[fatherId] === 'undefined')
            subMenuItems[fatherId] = [item];
          else
            subMenuItems[fatherId].push(item);       
          return;
        }
      }
      createButton.call(this, menu, item);      
    }.bind(this));
    // Appending the action menu to the form
    form.appendChild(menu);
    // Create sub menu if needed
    for (var fatherId in subMenuItems)
      createSubMenu.call(this, fatherId, subMenuItems[fatherId]);  
  }
  function createSubMenu(fatherId, items) {
    this.subForms[fatherId] = createForm.call(this, 'subMenu_' + fatherId); 
    this.subForms[fatherId].classList.add('submenu');
    createMenu.call(this, this.subForms[fatherId], items);    
    // Append <span> for submenu's owner 
    var button = getButton(this.form, fatherId);    
    var span = document.createElement('span');
    span.setAttribute('data-icon', 'play');
    button.appendChild(span);
    function getButton(form, fatherId){
      var menu = form.lastChild;
      for (var i=0; i<menu.children.length; i++) {
        var button = menu.children[i];    
        var start = button.id.lastIndexOf('_');
        if(-1 !== start) {
          var fid = button.id.substr(start + 1);
          if(fatherId === fid) return button;
        }
      }
      console.error('buttonId: 0x' + fatherId.toString(16) + ' was not found in your OptionMenu!');
      return null;
    }
  }
  function createButton(menu, item) {
    var button = document.createElement('button');
    
    if (item.l10nId) {
      navigator.mozL10n.setAttributes(button, item.l10nId, item.l10nArgs);
    } else if (item.text && item.text.length) {
      button.textContent = item.text || '';
    } else if (item.name && item.name.length) {
      button.textContent = item.name || '';
    } else {
      // no l10n or text, just empty item, don't add to the menu
      return;
    }
    button.id = item.optionId || '';
    if(item.buttonId) button.id += '_' + item.buttonId;
    if(item.disabled) button.disabled = item.disabled;
    button.classList.add('action-menu-item');
    menu.appendChild(button);
    // Add a mapping from the button object
    // directly to its options item.
    item.incomplete = item.incomplete || false;

    this.handlers.set(button, item);

    menu.addEventListener('click', function(event) {
      var action = this.handlers.get(event.target);
    var method;

    // Delegate operation to target method. This allows
    // for a custom "Cancel" to be provided by calling program.
    //
    // Further operations should only be processed if
    // an actual button was pressed.
      if (typeof action !== 'undefined' && !item.disable) {
      method = action.method || function() {};

      method.apply(null, action.params || []);

      // Hide action menu when click is received
      this.hide();

        if (typeof this.options.complete === 'function' && !action.incomplete) {
          this.options.complete();
      }
    }
  }.bind(this));
  };
  
};

// We prototype functions to show/hide the UI of action-menu
OptionMenu.prototype.show = function() {
  // Remove the focus to hide the keyboard asap
  document.activeElement && document.activeElement.blur();

  if (!this.form.parentNode) {
    document.body.appendChild(this.form);

    // Flush style on form so that the show transition plays once we add
    // the visible class.
    this.form.clientTop;
  }
  this.form.classList.add('visible','focused');
  // Focus form to blur anything triggered keyboard
  this.form.focus();
};
OptionMenu.prototype.showSubMenu = 
  function(mainMenuItemId, offsetTop, height) {
  console.log('showSubMenu: ' + mainMenuItemId + ',' + offsetTop + ',' + height);
  var start = mainMenuItemId.lastIndexOf('_');
  if(-1 === start) return;
  var fatherId = mainMenuItemId.substr(start + 1);
  var subForm = this.subForms[fatherId];
  if(typeof subForm  === 'undefined') return;
  if (!subForm.parentNode) {
    document.body.appendChild(subForm);   
    /*
    var subMenuHeight = subForm.length * height;
    var maxTop = document.body.clientHeight - subMenuHeight - height;
    var subMenuTop = Math.min(offsetTop, maxTop);  
    subForm.style.top = subMenuTop + 'px';
    subForm.style.height = subMenuHeight + 'px';
    */
  }
  this.form.classList.remove('focused');
  subForm.classList.add('visible','focused');
  // Focus form to blur anything triggered keyboard
  subForm.focus();
};

OptionMenu.prototype.hide = function() {
  this.form.classList.remove('visible','focused');
  for (var fatherId in this.subForms)
    this.subForms[fatherId].classList.remove('visible','focused');
};
OptionMenu.prototype.removeForms = function() {
  his.form.classList.remove('visible','focused');
  if (this.form.parentNode) {    
    document.body.removeChild(this.form);
    console.log('Removed form: ' + this.form.id);
  }
  for (var fatherId in this.subForms){
    var subForm = this.subForms[fatherId];
    if(subForm.parentNode) {      
      document.body.removeChild(subForm);
      console.log('Removed form: ' + subForm.id);
    }
  }
};
OptionMenu.prototype.getButtonById = function(id) {
  var button = getButton(this.form, id);
  if (button) return button;  
  for (var i in this.subForms) {
    button = getButton(this.subForms[i], id);
  }
  return button;
  function getButton(form, id) {
    var menu = form.lastChild;
    for (var i=0; i<menu.children.length; i++) {
      var button = menu.children[i];
      if(0 === button.id.indexOf(id)) {
        return button;
      }
    }
    return null;
  };  
}