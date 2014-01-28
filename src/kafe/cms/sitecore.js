/* @echo header */

	var Local = {};

	Local.getPlaceholders = function(){
		var $placeholders = $('[data-sitecore-placeholder]');
		var _output = [];

		$placeholders.each(function(i,v){
			var _ph = {};
			_ph.$element = $(this);
			_ph.name = _ph.$element.data('sitecore-placeholder');
			_ph.label = !!_ph.$element.data('sitecore-displayname') ? _ph.$element.data('sitecore-displayname') : _ph.name;
			_ph.filter = ':not(code, .scEmptyPlaceholder, .clearer)';
			_ph.$locator = $('<span class="sitecore-editor-toolbox-locator"></span>');
			_ph.$field = $('<input id="sitecore-editor-toolbox-placeholder'+i+'" type="checkbox" checked="checked"/>');
			_ph.$fieldLabel = $('<label for="sitecore-editor-toolbox-placeholder'+i+'">'+_ph.label+'</label>');
			if(!!_ph.$element.data('sitecore-placeholder-opposite')){
				_ph.opposite = _ph.$element.data('sitecore-placeholder-opposite');
			}
			_output.push(_ph);
		});

		$.each(_output, function(i,_currentPh){
			if(!!_currentPh.opposite){
				$.each(_output, function(i,_otherPh){
					if(_currentPh.opposite == _otherPh.name){
						_currentPh.opposite = {
							$element:_otherPh.$element,
							$field:_otherPh.$field
						}
						return false;
					}
				});
				_currentPh.opposite = $.isPlainObject(_currentPh.opposite) ? _currentPh.opposite : null;
			}
		});

		return _output;
	}

	/**
	* ### Version <!-- @echo VERSION -->
	* Additionnal methods for Sitecore
	*
	* @module <!-- @echo MODULE -->
	* @class <!-- @echo NAME_FULL -->
	*/
	var sitecore = {};
	K.env("sitecore-editor", $('html').data('sitecore-editor') === true);

	/**
	* Creates a toolbox for the Sitecore page editor. Allows the user to toggle unused placeholders to reflect a closer to reality result of the page.
	*
	* @method editorToolbox
	* @param {Object} [options] Initial configurations.
	* 	@param {String} [options.label='Editor Toolbox'] The label shown on the toolbox handle.
	* 	@param {Function} [options.onUpdate] Callback that fires everytime the toolbox updates its component status.
	* @example
	*	// Initializing placeholders for the toolbox using data attributes
	*	<section data-sitecore-placeholder="sidebar-left" data-sitecore-displayname="Left column" data-sitecore-placeholder-opposite="sidebar-right">
	*		<ul>
	*			<li>This is the optional left column</li>
	*			<li>data-sitecore-placeholder : *Required* The name of the placeholder defined in Sitecore, this attribute initiates the element has a placeholder for the toolbox.</li>
	*			<li>data-sitecore-displayname : The label identifying the placeholder within the toolbox, defaults to the value of 'data-sitecore-placeholder' if not set.</li>
	*			<li>data-sitecore-placeholder-opposite : The 'data-sitecore-placeholder' value of the opposite placeholder. Determines that the current placeholder should not be toggled if the opposite placeholder is active.</li>
	*        </ul>
	*	</section>
	* @example
	*	// Initializing the toolbox
	*	<!-- @echo NAME_FULL -->.editorToolbox({
	*		label:"My Toolbox",
	*		onUpdate:function(data){
	*			console.log('There are ' + data.placeholders.filter(':visible').length + ' visible in the page');
	*		}
	*	});
	*/
	sitecore.editorToolbox = function(){
		/*--- Options ---*/
		var c = {};
        var options = (arguments) ? arguments[0] : {};

        c.label = !!options.label ? options.label : 'Editor Toolbox';
        c.placeholders = {};
        	c.placeholders.label = !!options.placeholders.label ? options.placeholders.label : 'Placeholders'
        	c.placeholders.$elements = Local.getPlaceholders();
    	c.updateCallback = $.isFunction(options.onUpdate) ? options.onUpdate : function(){};

    	/*--- Config ---*/
    	var _showToolbox = false;
    	var _toolboxOpenClass = 'open';
    	var _callbackData = _getCallbackData();

    	/*--- Elements ---*/
		var $editorToolbox = $('<div id="sitecore-editor-toolbox"></div>');
		var $toolboxContent = $('<div class="content"></div>').appendTo($editorToolbox).hide();
		var _toolboxHandle = {
			$self:$('<a href="#" class="handle"></a>'),
			$label:$('<span class="label">'+c.label+'</span>')
		}
		_toolboxHandle.$self.append(_toolboxHandle.$label).appendTo($editorToolbox);

		/*--- Bindings ---*/
		_toolboxHandle.$self.on('click', function(e){
			e.preventDefault();
			$toolboxContent.toggle();
			$editorToolbox.toggleClass(_toolboxOpenClass);
			if($editorToolbox.hasClass(_toolboxOpenClass)){
				_updateToolbox();
			}
		});

		$editorToolbox.on('mouseleave',function(e){
			if($editorToolbox.hasClass(_toolboxOpenClass)){
				_toolboxHandle.$self.trigger('click');
			}
		});

		/*--- Functions ---*/
		function _updateToolbox(){
			/* Placeholders */
			$.each(c.placeholders.$elements, function(i,_ph){
				var _phIsEmpty = _ph.$element.children(_ph.filter).length === 0;
				var _oppositeIsActive = _ph.opposite ? _ph.opposite.$field.is(':checked') : false;
				var _phIsActive = _phIsEmpty && !_oppositeIsActive;
				_ph.$field.prop('disabled', !_phIsActive);
			});
			c.updateCallback(_callbackData);
		}

		function _getCallbackData(){
			/* Placeholders */
			var _placeholders = [];
			$.each(c.placeholders.$elements, function(i,_ph){
				_placeholders.push(_ph.$element.get(0));
			});

			return {
				placeholders:$(_placeholders)
			};
		}

		/*--- Contents ---*/

		/* Placeholders */
		if(c.placeholders.$elements.length > 0){
			var $scPlaceholders = $('<div class="toolbox-section placeholders"></div>').appendTo($toolboxContent);
			var $pendingBox = $('<div style="display:none !important;"></div>').appendTo($editorToolbox);

			$.each(c.placeholders.$elements, function(i,_ph){
				var $currentItem = $('<div class="toolbox-item"></div>').appendTo($scPlaceholders);
				_ph.$field.appendTo($currentItem).after(_ph.$fieldLabel)
					.on('change', function(e, _isInit){
						if(_ph.$field.is(':checked')){
							_ph.$locator.replaceWith(_ph.$element);
						}else{
							_ph.$element.before(_ph.$locator).appendTo($pendingBox);
						}
						if(!_isInit){ _updateToolbox(); }
					});

				if(_ph.$element.children(_ph.filter).length === 0){
					_ph.$field.prop('checked', false).trigger('change', true);
				}

				_showToolbox = true;
			});
		}

		/*--- Initialization ---*/
		if(_showToolbox){
			$editorToolbox.prependTo('body').css({
				'position':'fixed',
				'top':'50%',
				'left':'0',
				'min-height':_toolboxHandle.$label.outerWidth()
			}).css('margin-top','-'+($editorToolbox.outerHeight() / 2)+'px')
			_toolboxHandle.$label.width($editorToolbox.outerHeight()).addClass('initialized');
			_updateToolbox();
		}
	}

	return sitecore;

/* @echo footer */