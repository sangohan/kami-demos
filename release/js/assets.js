(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
  * domready (c) Dustin Diaz 2012 - License MIT
  */
!function (name, definition) {
  if (typeof module != 'undefined') module.exports = definition()
  else if (typeof define == 'function' && typeof define.amd == 'object') define(definition)
  else this[name] = definition()
}('domready', function (ready) {

  var fns = [], fn, f = false
    , doc = document
    , testEl = doc.documentElement
    , hack = testEl.doScroll
    , domContentLoaded = 'DOMContentLoaded'
    , addEventListener = 'addEventListener'
    , onreadystatechange = 'onreadystatechange'
    , readyState = 'readyState'
    , loadedRgx = hack ? /^loaded|^c/ : /^loaded|c/
    , loaded = loadedRgx.test(doc[readyState])

  function flush(f) {
    loaded = 1
    while (f = fns.shift()) f()
  }

  doc[addEventListener] && doc[addEventListener](domContentLoaded, fn = function () {
    doc.removeEventListener(domContentLoaded, fn, f)
    flush()
  }, f)


  hack && doc.attachEvent(onreadystatechange, fn = function () {
    if (/^c/.test(doc[readyState])) {
      doc.detachEvent(onreadystatechange, fn)
      flush()
    }
  })

  return (ready = hack ?
    function (fn) {
      self != top ?
        loaded ? fn() : fns.push(fn) :
        function () {
          try {
            testEl.doScroll('left')
          } catch (e) {
            return setTimeout(function() { ready(fn) }, 50)
          }
          fn()
        }()
    } :
    function (fn) {
      loaded ? fn() : fns.push(fn)
    })
})

},{}],2:[function(require,module,exports){
//This is an asset loader queue tailored for Kami/WebGL

var LoaderBase = require('assetloader');
var Class = require('klasse');
var Texture = require('kami').Texture;

//this is a kami-specific loader for a Texture object
//it is assumed that the AssetManager being passed is a WebGLContext
function TextureLoader(name, path, texture, genMipmaps) {
    path = path || name;

    texture = texture || new Texture(this.context);
    
    return {

        value: texture,

        load: function(onComplete, onError) {
            //Texture has a handy function for this sort of thing...
            texture.setup(path, onComplete, onError, genMipmaps);
        }
    }
}

//Setup loader parameters
TextureLoader.extensions = ["png", "gif", "jpg", "jpeg"];
TextureLoader.mediaType = "image";

var AssetLoader = new Class({

    Extends: LoaderBase,

    initialize: function(context) {
        LoaderBase.call(this);

        if (!context)
            throw "Kami AssetLoader must be passed with a valid WebGLContext";

        this.registerLoader(TextureLoader);

        this.context = context;
        this.__invalidateFunc = this.invalidate.bind(this);
        this.context.restored.add( this.__invalidateFunc );
    },

    destroy: function() {
        this.context.restored.remove(this.__invalidateFunc);
    }
});

//Copy static attributes ...
AssetLoader.Status = LoaderBase.Status;

AssetLoader.registerCommonLoader = LoaderBase.registerCommonLoader;

AssetLoader.Descriptor = LoaderBase.Descriptor;

AssetLoader.TextureLoader = TextureLoader;

module.exports = AssetLoader;








/// old docs. 

    /**
     * This is the loading function of a AssetManager plugin, 
     * which handles the asynchronous loading for an asset. 
     * The function must be implemented in a very
     * strict manner for the asset manager to work correctly.
     *
     * Once the async loading is done, you must call the `finished` callback
     * that was passed to this method. You can pass the parameter `false` to the
     * finished callback to indicate the async load has failed. Otherwise, it is assumed
     * to be successful.
     * 
     * If you don't invoke the callback, the asset manager may never finish loading.
     * 
     * @param  {String} name the name of the asset to load
     * @param {Function} finished the function to call when async loading is complete
     * @param {Texture} texture the texture to operate on for this asset
     * @param {String} path the optional image path to use instead of the `name` parameter
     */
/**
 * This is the default implementation of an image loader plugin for AssetManager.
 * This uses a DOM Image object to upload PNG, GIF and JPG images to a WebGL
 * texture. You will not need to deal with this class directly, unless you want
 * to write your own AssetManager loaders.
 *
 * A Loader plugin is a class which handles the asynchronous loading and provides
 * a convenient return value for the `AssetManager.load()` functions. The loader class
 * is constructed with the following parameters: first, the WebGLContext this AssetManager
 * is using, and second, the name of the asset to be loaded. The subsequent arguments are
 * those that were passed as extra to the `AssetManager.load()` functions.
 *
 * A loader must implement a `load()` function, and it's encouraged to also implement a 
 * `getReturnValue()` function, for convenience.
 * 
 * @param {WebGLContext} context the context, passed by AssetManager
 * @param {String} name the unique key for this asset
 * @param {String} path the optional path or data URI to use, will default to the name param
 * @param {Texture} texture an optional texture to act on; if undefined, a new texture
 *                          will be created
 */
},{"assetloader":3,"kami":14,"klasse":5}],3:[function(require,module,exports){
var Class = require('klasse');
var Signal = require('signals');

function registerLoader(loaders, loaderFunc, extensions, mediaType) {
	if (!loaderFunc || !extensions || !extensions.length)
		throw "must specify at least one extension for the loader";
	
	for (var i=0; i<extensions.length; i++) {
		loaders[ extensions[i] ] = loaderFunc;
		if (mediaType) 
			loaders[ mediaType + '/' + extensions[i] ] = loaderFunc;
	}
}

/**
 * This is a base class for asset management; ideal for either
 * generic HTML5 2D canvas or WebGL canvas.
 * 
 * @class  AssetLoader
 * @constructor 
 */
var AssetLoader = new Class({
	
	/**
	 * A read-only property that describes the number of 
	 * assets remaining to be loaded.
	 *
	 * @attribute remaining
	 * @type {Number}
	 * @readOnly
	 */
	remaining: {
		get: function() {
			return this.__loadCount;
		}
	},

	/**
	 * A read-only property that descriibes the total
	 * number of assets in this AssetLoader.
	 * 
	 * @attribute total
	 * @readOnly
	 * @type {Number}
	 */
	total: {
		get: function() {
			return this.__totalItems;
		}
	},

	//Constructor
	initialize: function AssetLoader() {

		/**
		 * An array of Descriptors that this queue is handling.
		 * This should not be modified directly.
		 * 
		 * @property assets
		 * @type {Array}
		 */
		this.assets = [];

		/**
		 * The queue of tasks to load. Each contains
		 * an
		 * {{#crossLink "AssetLoader.Descriptor"}}{{/crossLink}}.
		 *
		 * Loading a task will pop it off this list and fire the async
		 * or synchronous process.
		 *
		 * This should not be modified directly.
		 *
		 * @property tasks
		 * @protected
		 * @type {Array}
		 */
		this.tasks = [];

		//Private stuff... do not touch!

		this.__loadCount = 0;
		this.__totalItems = 0;

		// Signals 
		
		/**
		 * A signal dispatched when loading first begins, 
		 * i.e. when update() is called and the loading queue is the
		 * same size as the total asset list.
		 *
		 * @event loadStarted
		 * @type {Signal}
		 */
		this.loadStarted = new Signal();

		/**
		 * A signal dispatched when all assets have been loaded
		 * (i.e. their async tasks finished).
		 *
		 * @event loadFinished
		 * @type {Signal}
		 */
		this.loadFinished = new Signal();

		/**
		 * A signal dispatched on progress updates, once an asset
		 * has been loaded in full (i.e. its async task finished).
		 *
		 * This passes an event object to the listener function
		 * with the following properties:
		 * 
		 * - `current` number of assets that have been loaded
		 * - `total` number of assets to loaded
		 * - `name` of the asset which was just loaded
		 *  
		 * @event loadProgress
		 * @type {[type]}
		 */
		this.loadProgress = new Signal();

		/**
		 * A signal dispatched on problematic load; e.g. if
		 * the image was not found and "onerror" was triggered. 
		 * The first argument passed to the listener will be 
		 * the string name of the asset.
		 *
		 * The asset manager will continue loading subsequent assets.
		 *
		 * This is dispatched after the status of the asset is
		 * set to Status.LOAD_FAIL, and before the loadProgress
		 * signal is dispatched.
		 *
		 * @event loadError
		 * @type {Signal}
		 */
		this.loadError = new Signal();


		/**
		 * A set of loader plugins for this asset manager. These might be as simple
		 * as pushing HTML Image objects into a Texture, or more complex like decoding
		 * a compressed, mip-mapped, or cube-map texture.
		 *
		 * This object is a simple hashmap of lower-case extension names to Loader functions,
		 * and mime-types like "image/png" for data URIs.
		 * 
		 * @property loaders
		 * @type {Object}
		 */
		this.loaders = {};

		//copy from our common loaders
		for (var k in AssetLoader.commonLoaders) {
			if (AssetLoader.commonLoaders.hasOwnProperty(k)) {
				this.loaders[k] = AssetLoader.commonLoaders[k];
			}
		}
	},

	/**
	 * Destroys this asset manager; deleting the tasks
	 * and assets arrays and resetting the load count.
	 * 
	 * @method  destroy
	 */
	destroy: function() {
		this.removeAll();
	},

	/**
	 * Called to invalidate the asset manager
	 * and require all assets to be re-loaded.
	 * For example, a WebGL app will call this internally
	 * on context loss.
	 *
	 * @protected
	 * @method invalidate
	 */
	invalidate: function() {
		//mark all as not yet loaded
		for (var i=0; i<this.assets.length; i++) {
			this.assets[i].status = AssetLoader.Status.QUEUED;
		}
		
		//copy our assets to a queue which can be popped
		this.tasks = this.assets.slice();

		this.__loadCount = this.__totalItems = this.tasks.length;
	},

	/**
	 * Attempts to extract a mime-type from the given data URI. It will
	 * default to "text/plain" if the string is a data URI with no specified
	 * mime-type. If the string does not begin with "data:", this method 
	 * returns null.
	 *
	 * @method  __getDataType
	 * @private
	 * @param  {String} str the data URI
	 * @return {String}     the mime type
	 */
	__getDataType: function(str) {
		var test = "data:";
		//starts with 'data:'
		var start = str.slice(0, test.length).toLowerCase();
		if (start == test) {
			var data = str.slice(test.length);
			
			var sepIdx = data.indexOf(',');
			if (sepIdx === -1) //malformed data URI scheme
				return null;

			//e.g. "image/gif;base64" => "image/gif"
			var info = data.slice(0, sepIdx).split(';')[0];

			//We might need to handle some special cases here...
			//standardize text/plain to "txt" file extension
			if (!info || info.toLowerCase() == "text/plain")
				return "txt"

			//User specified mime type, try splitting it by '/'
			return info.split('/').pop().toLowerCase();
		}
		return null;
	},

	__extension: function(str) {
		var idx = str.lastIndexOf('.');
		if (idx === -1 || idx === 0 || idx === str.length-1) // does not have a clear file extension
			return "";
		return str.substring(idx+1).toLowerCase();
	},

	/**
	 * Returns the AssetDescriptor by name, or null if not found.
	 * 
	 * @method  getDescriptor
	 * @protected
	 * @param  {AssetDescriptor} name the name of the asset
	 * @return {any}      the asset
	 */
	getDescriptor: function(name) {
		var idx = this.indexOf(this.assets, name);
		return idx !== -1 ? this.assets[idx] : null;
	},

	getStatus: function(name) {
		var d = this.getDescriptor(name);
		return d ? d.status : null;
	},
	
	isLoaded: function(name) {
		return this.getStatus(name) === AssetLoader.Status.LOAD_SUCCESS;
	},
	
	/**
	 * Returns the value stored for this asset, such as an Image
	 * if we are using a Canvas image loading plugin. Returns null
	 * if the asset was not found.
	 * 	
	 * @param  {String} name the name of the asset to get
	 * @return {any}    the asset by name
	 */
	get: function(name) {
		var d = this.getDescriptor(name);
		return d ? d.value : null;
	},

	/**
	 * Removes a reference to the given asset, and returns the removed
	 * asset. If the asset by name was not found, null is returned.
	 *
	 * This will also remove the asset from the task list.
	 *
	 * Note that this will not destroy any resources that asset maintained;
	 * so it is the user's duty to do so after removing it from the queue.
	 * 
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	remove: function(name) {
		var assetIdx = this.indexOf(this.assets, name);
		if (assetIdx === -1)
			return null;

		var asset = this.assets[assetIdx];
		var status = asset.status;

		//let's see.. the asset can either be QUEUED
		//or LOADING, or LOADED (fail/success). if it's queued 

		
		//remove reference to the asset
		this.assets.splice(assetIdx, 1);
		
		//make sure it's not in our task list
		var taskIdx = this.indexOf(this.tasks, name);

		this.__totalItems = Math.max(0, this.__totalItems-1);
		this.__loadCount = Math.max(0, this.__loadCount-1);
		if (taskIdx !== -1) {
			//it's waiting to be loaded... we need to remove it
			//and also decrement the load / total count
			this.tasks.splice(taskIdx, 1);
		} else {
			//not in tasks... already queued
			
		}

		if (this.__loadCount === 0) {
			if (this.loading) {
				this.loadFinished.dispatch({
					current: 0,
					total: 0
				});
			}
			this.loading = false;
		}
		return asset.value;
	},

	removeAll: function() {
		this.assets.length = 0;
		this.tasks.length = 0;
		this.__loadCount = this.__totalItems = 0;

		if (this.loading) {
			this.loadFinished.dispatch({
				current: 0,
				total: 0
			});
		}
		this.loading = false;
	},

	/**
	 * Calls `add()` for each string in the given array.
	 *
	 * @method addAll
	 * @param  {Array} array 
	 */
	addAll: function(array) {
		for (var i=0; i<array.length; i++) {
			this.add(array[i]);
		}
	},

	/**
	 * Pushes an asset onto this stack. This
	 * attempts to detect the loader for you based
	 * on the asset name's file extension (or data URI scheme). 
	 * If the asset name doesn't have a known file extension,
	 * or if there is no loader registered for that filename,
	 * this method throws an error. If you're trying to use 
	 * generic keys for asset names, use the addAs method and
	 * specify a loader plugin.
	 * 
	 * This method's arguments are passed to the constructor
	 * of the loader function. 
	 *
	 * The return value of this method is determined by
	 * the loader's processArguments method. For example, the
	 * default Image loader returns a Texture object.
	 *
	 * @example
	 *    //uses ImageLoader to get a new Texture
	 *    var tex = assets.add("tex0.png"); 
	 *
	 *    //or you can specify your own texture
	 *    assets.add("tex1.png", tex1);
	 *
	 *    //the ImageLoader also accepts a path override, 
	 *    //but the asset key is still "frames0.png"
	 *    assets.add("frame0.png", tex1, "path/to/frame1.png");
	 *    
	 * @method  add
	 * @param  {String} name the asset name
	 * @param  {any} args a variable number of optional arguments
	 * @return {any} returns the best type for this asset's loader
	 */
	add: function(name) {
		if (!name)
			throw "No asset name specified for add()";

		var ext = this.__getDataType(name);
		if (ext === null)
			ext = this.__extension(name);

		if (!ext) 
			throw "Asset name does not have a file extension: " + name;
		if (!this.loaders.hasOwnProperty(ext))
			throw "No known loader for extension "+ext+" in asset "+name;

		var args = [ this.loaders[ext], name ];
		args = args.concat( Array.prototype.slice.call(arguments, 1) );

		return this.addAs.apply(this, args);
	},

	/**
	 * Pushes an asset onto this stack. This allows you to
	 * specify a loader function for the asset. This is useful
	 * if you wish to use generic names for your assets (instead of
	 * filenames), or if you want a particular asset to use a specific
	 * loader. 
	 *
	 * The first argument is the loader function, and the second is the asset
	 * name. Like with {{#crossLink "AssetLoader/load:method"}}{{/crossLink}}, 
	 * any subsequent arguments will be passed along to the loader.
	 *
	 * The return value of this method is determined by
	 * the loader's return value, if it has one. For example, a Canvas ImageLoader
	 * plugin might returnn Image object. This is also the value which can be retrieved with
	 * `get()` or by accessing the `value` of an AssetDescriptor. If the loader function
	 * does not implement a return value, `undefined` is returned. 
	 *
	 * @method  addAs
	 * @param {Fucntion} loader the loader function
	 * @param {String} name the asset name
	 * @param {Object ...} args a variable number of optional arguments
	 * @return {any} returns the best type for this asset's loader
	 */
	addAs: function(loader, name) {
		if (!name)
			throw "no name specified to load";
		if (!loader)
			throw "no loader specified for asset "+name;

		var idx = this.indexOf(this.assets, name);
		if (idx !== -1) //TODO: eventually add support for dependencies and shared assets
			throw "asset already defined in asset manager";

		//grab the arguments, except for the loader function.
		var args = Array.prototype.slice.call(arguments, 1);
		
		//create our loader function and get the new return value
		var retObj = loader.apply(this, args);

		if (typeof retObj.load !== "function")
			throw "loader not implemented correctly; must return a 'load' function";

		//keep hold of this asset and its original name
		var descriptor = new AssetLoader.Descriptor(name, retObj.load, retObj.value);
		this.assets.push( descriptor );

		//also add it to our queue of current tasks
		this.tasks.push( descriptor );
		this.__loadCount++;
		this.__totalItems++;

		return retObj.value;
	},

	indexOf: function(list, name) {
		for (var i=0; i<list.length; i++) {
			if (list[i] && list[i].name === name)
				return i;
		}
		return -1;
	},


	__loadCallback: function(name, success) {
		//if 'false' was passed, use it.
		//otherwise treat as 'true'
		success = success !== false;

		var assetIdx = this.indexOf(this.assets, name);
				
		//If the asset is not found, we can assume it
		//was removed from the queue. in this case we 
		//want to ignore events since they should already
		//have been fired.
		if (assetIdx === -1) {
			return;
		}
		
		this.__loadCount--;

		this.assets[assetIdx].status = success 
						? AssetLoader.Status.LOAD_SUCCESS
						: AssetLoader.Status.LOAD_FAILED;

		var current = (this.__totalItems - this.__loadCount),
			total = this.__totalItems;

		if (!success) {
			this.loadError.dispatch({
				name: name,
				current: current,
				total: total
			});
		}

		this.loadProgress.dispatch({
			name: name,
			current: current,
			total: total
		});
			
		if (this.__loadCount === 0) {
			this.loading = false;
			this.loadFinished.dispatch({
				current: current,
				total: total
			});
		}
	},

	/**
	 * Updates this AssetLoader by loading the next asset in the queue.
	 * If all assets have been loaded, this method returns true, otherwise
	 * it will return false.
	 *
	 * @method  update
	 * @return {Boolean} whether this asset manager has finished loading
	 */
	update: function() {
		if (this.tasks.length === 0)
			return (this.__loadCount === 0);

		//If we still haven't popped any from the assets list...
		if (this.tasks.length === this.assets.length) {
			this.loading = true;
			this.loadStarted.dispatch({
				current: 0,
				total: this.__totalItems
			});
		}

		//grab the next task on the stack
		var nextTask = this.tasks.shift();

		//apply the loading step
		var loader = nextTask.loadFunc;

		var cb = this.__loadCallback.bind(this, nextTask.name, true);
		var cbFail = this.__loadCallback.bind(this, nextTask.name, false);

		//do the async load ...
		loader.call(this, cb, cbFail);

		return (this.__loadCount === 0);
	},

	/**
	 * Registers a loader function for this queue with the given extension(s).
	 * This will override any extensions or mime-types already registered.
	 * 
	 * @method registerLoader
	 * @param {Function} loader the loader function
	 */
	registerLoader: function(loader) {
		registerLoader(this.loaders, loader, loader.extensions, loader.mediaType);
	}
});
	
/**
 * This is a map of "common" loaders, shared by many contexts.
 * For example, an image loader is specific to WebGL, Canvas, SVG, etc,
 * but a JSON loader might be renderer-independent and thus "common". 
 *
 * When a new AssetManager is created, it will use these loaders.
 * 
 * @type {Object}
 */
AssetLoader.commonLoaders = {};

/**
 * Registers a "common" loader function with the given extension(s).
 * 
 * For example, an image loader is specific to WebGL, Canvas, SVG, etc,
 * but a JSON loader might be renderer-independent and thus "common". 
 *
 * When a new AssetManager is created, it will use these loaders.
 * 
 * @method registerCommonLoader
 * @param {Function} loader the loader function
 */
AssetLoader.registerCommonLoader = function(loader) {
	registerLoader(AssetLoader.commonLoaders, loader, loader.extensions, loader.mediaType);
}

/**
 * A simple wrapper for assets which will be passed along to the loader;
 * this is used internally.
 * 
 * //@class AssetLoader.Descriptor
 */
AssetLoader.Descriptor = function(name, loadFunc, value) {
	this.name = name;
	this.loadFunc = loadFunc;
	this.value = value;
	this.status = AssetLoader.Status.QUEUED;
};

/**
 * Defines the status of an asset in the manager queue.
 * The constants under this object are one of:
 * 
 *     QUEUED
 *     LOADING
 *     LOAD_SUCCESS
 *     LOAD_FAIL
 * 
 * @attribute  Status
 * @type {Object}
 */
AssetLoader.Status = {
	QUEUED: "QUEUED",
	LOADING: "LOADING",
	LOAD_SUCCESS: "LOAD_SUCCESS",
	LOAD_FAIL: "LOAD_FAIL"
};

module.exports = AssetLoader;

},{"klasse":5,"signals":4}],4:[function(require,module,exports){
/*jslint onevar:true, undef:true, newcap:true, regexp:true, bitwise:true, maxerr:50, indent:4, white:false, nomen:false, plusplus:false */
/*global define:false, require:false, exports:false, module:false, signals:false */

/** @license
 * JS Signals <http://millermedeiros.github.com/js-signals/>
 * Released under the MIT license
 * Author: Miller Medeiros
 * Version: 1.0.0 - Build: 268 (2012/11/29 05:48 PM)
 */

(function(global){

    // SignalBinding -------------------------------------------------
    //================================================================

    /**
     * Object that represents a binding between a Signal and a listener function.
     * <br />- <strong>This is an internal constructor and shouldn't be called by regular users.</strong>
     * <br />- inspired by Joa Ebert AS3 SignalBinding and Robert Penner's Slot classes.
     * @author Miller Medeiros
     * @constructor
     * @internal
     * @name SignalBinding
     * @param {Signal} signal Reference to Signal object that listener is currently bound to.
     * @param {Function} listener Handler function bound to the signal.
     * @param {boolean} isOnce If binding should be executed just once.
     * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
     * @param {Number} [priority] The priority level of the event listener. (default = 0).
     */
    function SignalBinding(signal, listener, isOnce, listenerContext, priority) {

        /**
         * Handler function bound to the signal.
         * @type Function
         * @private
         */
        this._listener = listener;

        /**
         * If binding should be executed just once.
         * @type boolean
         * @private
         */
        this._isOnce = isOnce;

        /**
         * Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @memberOf SignalBinding.prototype
         * @name context
         * @type Object|undefined|null
         */
        this.context = listenerContext;

        /**
         * Reference to Signal object that listener is currently bound to.
         * @type Signal
         * @private
         */
        this._signal = signal;

        /**
         * Listener priority
         * @type Number
         * @private
         */
        this._priority = priority || 0;
    }

    SignalBinding.prototype = {

        /**
         * If binding is active and should be executed.
         * @type boolean
         */
        active : true,

        /**
         * Default parameters passed to listener during `Signal.dispatch` and `SignalBinding.execute`. (curried parameters)
         * @type Array|null
         */
        params : null,

        /**
         * Call listener passing arbitrary parameters.
         * <p>If binding was added using `Signal.addOnce()` it will be automatically removed from signal dispatch queue, this method is used internally for the signal dispatch.</p>
         * @param {Array} [paramsArr] Array of parameters that should be passed to the listener
         * @return {*} Value returned by the listener.
         */
        execute : function (paramsArr) {
            var handlerReturn, params;
            if (this.active && !!this._listener) {
                params = this.params? this.params.concat(paramsArr) : paramsArr;
                handlerReturn = this._listener.apply(this.context, params);
                if (this._isOnce) {
                    this.detach();
                }
            }
            return handlerReturn;
        },

        /**
         * Detach binding from signal.
         * - alias to: mySignal.remove(myBinding.getListener());
         * @return {Function|null} Handler function bound to the signal or `null` if binding was previously detached.
         */
        detach : function () {
            return this.isBound()? this._signal.remove(this._listener, this.context) : null;
        },

        /**
         * @return {Boolean} `true` if binding is still bound to the signal and have a listener.
         */
        isBound : function () {
            return (!!this._signal && !!this._listener);
        },

        /**
         * @return {boolean} If SignalBinding will only be executed once.
         */
        isOnce : function () {
            return this._isOnce;
        },

        /**
         * @return {Function} Handler function bound to the signal.
         */
        getListener : function () {
            return this._listener;
        },

        /**
         * @return {Signal} Signal that listener is currently bound to.
         */
        getSignal : function () {
            return this._signal;
        },

        /**
         * Delete instance properties
         * @private
         */
        _destroy : function () {
            delete this._signal;
            delete this._listener;
            delete this.context;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[SignalBinding isOnce:' + this._isOnce +', isBound:'+ this.isBound() +', active:' + this.active + ']';
        }

    };


/*global SignalBinding:false*/

    // Signal --------------------------------------------------------
    //================================================================

    function validateListener(listener, fnName) {
        if (typeof listener !== 'function') {
            throw new Error( 'listener is a required param of {fn}() and should be a Function.'.replace('{fn}', fnName) );
        }
    }

    /**
     * Custom event broadcaster
     * <br />- inspired by Robert Penner's AS3 Signals.
     * @name Signal
     * @author Miller Medeiros
     * @constructor
     */
    function Signal() {
        /**
         * @type Array.<SignalBinding>
         * @private
         */
        this._bindings = [];
        this._prevParams = null;

        // enforce dispatch to aways work on same context (#47)
        var self = this;
        this.dispatch = function(){
            Signal.prototype.dispatch.apply(self, arguments);
        };
    }

    Signal.prototype = {

        /**
         * Signals Version Number
         * @type String
         * @const
         */
        VERSION : '1.0.0',

        /**
         * If Signal should keep record of previously dispatched parameters and
         * automatically execute listener during `add()`/`addOnce()` if Signal was
         * already dispatched before.
         * @type boolean
         */
        memorize : false,

        /**
         * @type boolean
         * @private
         */
        _shouldPropagate : true,

        /**
         * If Signal is active and should broadcast events.
         * <p><strong>IMPORTANT:</strong> Setting this property during a dispatch will only affect the next dispatch, if you want to stop the propagation of a signal use `halt()` instead.</p>
         * @type boolean
         */
        active : true,

        /**
         * @param {Function} listener
         * @param {boolean} isOnce
         * @param {Object} [listenerContext]
         * @param {Number} [priority]
         * @return {SignalBinding}
         * @private
         */
        _registerListener : function (listener, isOnce, listenerContext, priority) {

            var prevIndex = this._indexOfListener(listener, listenerContext),
                binding;

            if (prevIndex !== -1) {
                binding = this._bindings[prevIndex];
                if (binding.isOnce() !== isOnce) {
                    throw new Error('You cannot add'+ (isOnce? '' : 'Once') +'() then add'+ (!isOnce? '' : 'Once') +'() the same listener without removing the relationship first.');
                }
            } else {
                binding = new SignalBinding(this, listener, isOnce, listenerContext, priority);
                this._addBinding(binding);
            }

            if(this.memorize && this._prevParams){
                binding.execute(this._prevParams);
            }

            return binding;
        },

        /**
         * @param {SignalBinding} binding
         * @private
         */
        _addBinding : function (binding) {
            //simplified insertion sort
            var n = this._bindings.length;
            do { --n; } while (this._bindings[n] && binding._priority <= this._bindings[n]._priority);
            this._bindings.splice(n + 1, 0, binding);
        },

        /**
         * @param {Function} listener
         * @return {number}
         * @private
         */
        _indexOfListener : function (listener, context) {
            var n = this._bindings.length,
                cur;
            while (n--) {
                cur = this._bindings[n];
                if (cur._listener === listener && cur.context === context) {
                    return n;
                }
            }
            return -1;
        },

        /**
         * Check if listener was attached to Signal.
         * @param {Function} listener
         * @param {Object} [context]
         * @return {boolean} if Signal has the specified listener.
         */
        has : function (listener, context) {
            return this._indexOfListener(listener, context) !== -1;
        },

        /**
         * Add a listener to the signal.
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        add : function (listener, listenerContext, priority) {
            validateListener(listener, 'add');
            return this._registerListener(listener, false, listenerContext, priority);
        },

        /**
         * Add listener to the signal that should be removed after first execution (will be executed only once).
         * @param {Function} listener Signal handler function.
         * @param {Object} [listenerContext] Context on which listener will be executed (object that should represent the `this` variable inside listener function).
         * @param {Number} [priority] The priority level of the event listener. Listeners with higher priority will be executed before listeners with lower priority. Listeners with same priority level will be executed at the same order as they were added. (default = 0)
         * @return {SignalBinding} An Object representing the binding between the Signal and listener.
         */
        addOnce : function (listener, listenerContext, priority) {
            validateListener(listener, 'addOnce');
            return this._registerListener(listener, true, listenerContext, priority);
        },

        /**
         * Remove a single listener from the dispatch queue.
         * @param {Function} listener Handler function that should be removed.
         * @param {Object} [context] Execution context (since you can add the same handler multiple times if executing in a different context).
         * @return {Function} Listener handler function.
         */
        remove : function (listener, context) {
            validateListener(listener, 'remove');

            var i = this._indexOfListener(listener, context);
            if (i !== -1) {
                this._bindings[i]._destroy(); //no reason to a SignalBinding exist if it isn't attached to a signal
                this._bindings.splice(i, 1);
            }
            return listener;
        },

        /**
         * Remove all listeners from the Signal.
         */
        removeAll : function () {
            var n = this._bindings.length;
            while (n--) {
                this._bindings[n]._destroy();
            }
            this._bindings.length = 0;
        },

        /**
         * @return {number} Number of listeners attached to the Signal.
         */
        getNumListeners : function () {
            return this._bindings.length;
        },

        /**
         * Stop propagation of the event, blocking the dispatch to next listeners on the queue.
         * <p><strong>IMPORTANT:</strong> should be called only during signal dispatch, calling it before/after dispatch won't affect signal broadcast.</p>
         * @see Signal.prototype.disable
         */
        halt : function () {
            this._shouldPropagate = false;
        },

        /**
         * Dispatch/Broadcast Signal to all listeners added to the queue.
         * @param {...*} [params] Parameters that should be passed to each handler.
         */
        dispatch : function (params) {
            if (! this.active) {
                return;
            }

            var paramsArr = Array.prototype.slice.call(arguments),
                n = this._bindings.length,
                bindings;

            if (this.memorize) {
                this._prevParams = paramsArr;
            }

            if (! n) {
                //should come after memorize
                return;
            }

            bindings = this._bindings.slice(); //clone array in case add/remove items during dispatch
            this._shouldPropagate = true; //in case `halt` was called before dispatch or during the previous dispatch.

            //execute all callbacks until end of the list or until a callback returns `false` or stops propagation
            //reverse loop since listeners with higher priority will be added at the end of the list
            do { n--; } while (bindings[n] && this._shouldPropagate && bindings[n].execute(paramsArr) !== false);
        },

        /**
         * Forget memorized arguments.
         * @see Signal.memorize
         */
        forget : function(){
            this._prevParams = null;
        },

        /**
         * Remove all bindings from signal and destroy any reference to external objects (destroy Signal object).
         * <p><strong>IMPORTANT:</strong> calling any method on the signal instance after calling dispose will throw errors.</p>
         */
        dispose : function () {
            this.removeAll();
            delete this._bindings;
            delete this._prevParams;
        },

        /**
         * @return {string} String representation of the object.
         */
        toString : function () {
            return '[Signal active:'+ this.active +' numListeners:'+ this.getNumListeners() +']';
        }

    };


    // Namespace -----------------------------------------------------
    //================================================================

    /**
     * Signals namespace
     * @namespace
     * @name signals
     */
    var signals = Signal;

    /**
     * Custom event broadcaster
     * @see Signal
     */
    // alias for backwards compatibility (see #gh-44)
    signals.Signal = Signal;



    //exports to multiple environments
    if(typeof define === 'function' && define.amd){ //AMD
        define(function () { return signals; });
    } else if (typeof module !== 'undefined' && module.exports){ //node
        module.exports = signals;
    } else { //browser
        //use string because of Google closure compiler ADVANCED_MODE
        /*jslint sub:true */
        global['signals'] = signals;
    }

}(this));

},{}],5:[function(require,module,exports){
function hasGetterOrSetter(def) {
	return (!!def.get && typeof def.get === "function") || (!!def.set && typeof def.set === "function");
}

function getProperty(definition, k, isClassDescriptor) {
	//This may be a lightweight object, OR it might be a property
	//that was defined previously.
	
	//For simple class descriptors we can just assume its NOT previously defined.
	var def = isClassDescriptor 
				? definition[k] 
				: Object.getOwnPropertyDescriptor(definition, k);

	if (!isClassDescriptor && def.value && typeof def.value === "object") {
		def = def.value;
	}


	//This might be a regular property, or it may be a getter/setter the user defined in a class.
	if ( def && hasGetterOrSetter(def) ) {
		if (typeof def.enumerable === "undefined")
			def.enumerable = true;
		if (typeof def.configurable === "undefined")
			def.configurable = true;
		return def;
	} else {
		return false;
	}
}

function hasNonConfigurable(obj, k) {
	var prop = Object.getOwnPropertyDescriptor(obj, k);
	if (!prop)
		return false;

	if (prop.value && typeof prop.value === "object")
		prop = prop.value;

	if (prop.configurable === false) 
		return true;

	return false;
}

//TODO: On create, 
//		On mixin, 

function extend(ctor, definition, isClassDescriptor, extend) {
	for (var k in definition) {
		if (!definition.hasOwnProperty(k))
			continue;

		var def = getProperty(definition, k, isClassDescriptor);

		if (def !== false) {
			//If Extends is used, we will check its prototype to see if 
			//the final variable exists.
			
			var parent = extend || ctor;
			if (hasNonConfigurable(parent.prototype, k)) {

				//just skip the final property
				if (Class.ignoreFinals)
					continue;

				//We cannot re-define a property that is configurable=false.
				//So we will consider them final and throw an error. This is by
				//default so it is clear to the developer what is happening.
				//You can set ignoreFinals to true if you need to extend a class
				//which has configurable=false; it will simply not re-define final properties.
				throw new Error("cannot override final property '"+k
							+"', set Class.ignoreFinals = true to skip");
			}

			Object.defineProperty(ctor.prototype, k, def);
		} else {
			ctor.prototype[k] = definition[k];
		}

	}
}

/**
 */
function mixin(myClass, mixins) {
	if (!mixins)
		return;

	if (!Array.isArray(mixins))
		mixins = [mixins];

	for (var i=0; i<mixins.length; i++) {
		extend(myClass, mixins[i].prototype || mixins[i]);
	}
}

/**
 * 
 */
function Class(definition) {
	if (!definition)
		definition = {};

	//The variable name here dictates what we see in Chrome debugger
	var initialize;
	var Extends;

	if (definition.initialize) {
		if (typeof definition.initialize !== "function")
			throw new Error("initialize must be a function");
		initialize = definition.initialize;

		//Usually we should avoid "delete" in V8 at all costs.
		//However, its unlikely to make any performance difference
		//here since we only call this on class creation (i.e. not object creation).
		delete definition.initialize;
	} else {
		if (definition.Extends) {
			var base = definition.Extends;
			initialize = function () {
				base.apply(this, arguments);
			}; 
		} else {
			initialize = function () {}; 
		}
	}

	if (definition.Extends) {
		initialize.prototype = Object.create(definition.Extends.prototype);
		initialize.prototype.constructor = initialize;
		//for getOwnPropertyDescriptor to work, we need to act
		//directly on the Extends (or Mixin)
		Extends = definition.Extends;
		delete definition.Extends;
	} else {
		initialize.prototype.constructor = initialize;
	}

	//Grab the mixins, if they are specified...
	var mixins = null;
	if (definition.Mixins) {
		mixins = definition.Mixins;
		delete definition.Mixins;
	}

	//First, mixin if we can.
	mixin(initialize, mixins);

	//Now we grab the actual definition which defines the overrides.
	extend(initialize, definition, true, Extends);

	return initialize;
};

Class.extend = extend;
Class.mixin = mixin;
Class.ignoreFinals = false;

module.exports = Class;
},{}],6:[function(require,module,exports){
/**
 * The core kami module provides basic 2D sprite batching and 
 * asset management.
 * 
 * @module kami
 */

var Class = require('klasse');
var Mesh = require('./glutils/Mesh');

var colorToFloat = require('number-util').colorToFloat;

/** 
 * A batcher mixin composed of quads (two tris, indexed). 
 *
 * This is used internally; users should look at 
 * {{#crossLink "SpriteBatch"}}{{/crossLink}} instead, which inherits from this
 * class.
 * 
 * The batcher itself is not managed by WebGLContext; however, it makes
 * use of Mesh and Texture which will be managed. For this reason, the batcher
 * does not hold a direct reference to the GL state.
 *
 * Subclasses must implement the following:  
 * {{#crossLink "BaseBatch/_createShader:method"}}{{/crossLink}}  
 * {{#crossLink "BaseBatch/_createVertexAttributes:method"}}{{/crossLink}}  
 * {{#crossLink "BaseBatch/getVertexSize:method"}}{{/crossLink}}  
 * 
 * @class  BaseBatch
 * @constructor
 * @param {WebGLContext} context the context this batcher belongs to
 * @param {Number} size the optional size of this batch, i.e. max number of quads
 * @default  500
 */
var BaseBatch = new Class({

	//Constructor
	initialize: function BaseBatch(context, size) {
		if (typeof context !== "object")
			throw "GL context not specified to SpriteBatch";
		this.context = context;

		this.size = size || 500;
		
		// 65535 is max index, so 65535 / 6 = 10922.
		if (this.size > 10922)  //(you'd have to be insane to try and batch this much with WebGL)
			throw "Can't have more than 10922 sprites per batch: " + this.size;
				
		
		//TODO: make these public
		this._blendSrc = this.context.gl.ONE;
		this._blendDst = this.context.gl.ONE_MINUS_SRC_ALPHA
		this._blendEnabled = true;
		this._shader = this._createShader();

		/**
		 * This shader will be used whenever "null" is passed
		 * as the batch's shader. 
		 *
		 * @property {ShaderProgram} shader
		 */
		this.defaultShader = this._shader;

		/**
		 * By default, a SpriteBatch is created with its own ShaderProgram,
		 * stored in `defaultShader`. If this flag is true, on deleting the SpriteBatch, its
		 * `defaultShader` will also be deleted. If this flag is false, no shaders
		 * will be deleted on destroy.
		 *
		 * Note that if you re-assign `defaultShader`, you will need to dispose the previous
		 * default shader yoursel. 
		 *
		 * @property ownsShader
		 * @type {Boolean}
		 */
		this.ownsShader = true;

		this.idx = 0;
		this.drawing = false;

		this.mesh = this._createMesh(this.size);


		/**
		 * The ABGR packed color, as a single float. The default
		 * value is the color white (255, 255, 255, 255).
		 *
		 * @property {Number} color
		 * @readOnly 
		 */
		this.color = colorToFloat(255, 255, 255, 255);
		
		/**
		 * Whether to premultiply alpha on calls to setColor. 
		 * This is true by default, so that we can conveniently write:
		 *
		 *     batch.setColor(1, 0, 0, 0.25); //tints red with 25% opacity
		 *
		 * If false, you must premultiply the colors yourself to achieve
		 * the same tint, like so:
		 *
		 *     batch.setColor(0.25, 0, 0, 0.25);
		 * 
		 * @property premultiplied
		 * @type {Boolean}
		 * @default  true
		 */
		this.premultiplied = true;
	},

	/**
	 * This is a setter/getter for this batch's current ShaderProgram.
	 * If this is set when the batch is drawing, the state will be flushed
	 * to the GPU and the new shader will then be bound.
	 *
	 * If `null` or a falsy value is specified, the batch's `defaultShader` will be used. 
	 *
	 * Note that shaders are bound on batch.begin().
	 *
	 * @property shader
	 * @type {ShaderProgram}
	 */
	shader: {
		set: function(val) {
			var wasDrawing = this.drawing;

			if (wasDrawing) {
				this.end(); //unbinds the shader from the mesh
			}

			this._shader = val ? val : this.defaultShader;

			if (wasDrawing) {
				this.begin();
			}
		},

		get: function() {
			return this._shader;
		}
	},

	/**
	 * Sets the color of this sprite batcher, which is used in subsequent draw
	 * calls. This does not flush the batch.
	 *
	 * If three or more arguments are specified, this method assumes that RGB 
	 * or RGBA float values (0.0 to 1.0) are being passed. 
	 * 
	 * If less than three arguments are specified, we only consider the first 
	 * and assign it to all four components -- this is useful for setting transparency 
	 * in a premultiplied alpha stage.
	 *
	 * @method  setColor
	 * @param {Number} r the red component, normalized
	 * @param {Number} g the green component, normalized
	 * @param {Number} b the blue component, normalized
	 * @param {Number} a the alpha component, normalized
	 */
	setColor: function(r, g, b, a) {
		if (arguments.length >= 3) {
			//default alpha to one 
			a = (a || a === 0) ? a : 1.0;
		} else {
			r = g = b = a = (arguments[0] || 0);
		}

		if (this.premultiplied) {
			r *= a;
			g *= a;
			b *= a;
		}
		
		this.color = colorToFloat(
			~~(r * 255),
			~~(g * 255),
			~~(b * 255),
			~~(a * 255)
		);
	},

	/**
	 * Called from the constructor to create a new Mesh 
	 * based on the expected batch size. Should set up
	 * verts & indices properly.
	 *
	 * Users should not call this directly; instead, it
	 * should only be implemented by subclasses.
	 * 
	 * @method _createMesh
	 * @param {Number} size the size passed through the constructor
	 */
	_createMesh: function(size) {
		//the total number of floats in our batch
		var numVerts = size * 4 * this.getVertexSize();
		//the total number of indices in our batch
		var numIndices = size * 6;
		var gl = this.context.gl;

		//vertex data
		this.vertices = new Float32Array(numVerts);
		//index data
		this.indices = new Uint16Array(numIndices); 
		
		for (var i=0, j=0; i < numIndices; i += 6, j += 4) 
		{
			this.indices[i + 0] = j + 0; 
			this.indices[i + 1] = j + 1;
			this.indices[i + 2] = j + 2;
			this.indices[i + 3] = j + 0;
			this.indices[i + 4] = j + 2;
			this.indices[i + 5] = j + 3;
		}

		var mesh = new Mesh(this.context, false, 
						numVerts, numIndices, this._createVertexAttributes());
		mesh.vertices = this.vertices;
		mesh.indices = this.indices;
		mesh.vertexUsage = gl.DYNAMIC_DRAW;
		mesh.indexUsage = gl.STATIC_DRAW;
		mesh.dirty = true;
		return mesh;
	},

	/**
	 * Returns a shader for this batch. If you plan to support
	 * multiple instances of your batch, it may or may not be wise
	 * to use a shared shader to save resources.
	 * 
	 * This method initially throws an error; so it must be overridden by
	 * subclasses of BaseBatch.
	 *
	 * @method  _createShader
	 * @return {Number} the size of a vertex, in # of floats
	 */
	_createShader: function() {
		throw "_createShader not implemented"
	},	

	/**
	 * Returns an array of vertex attributes for this mesh; 
	 * subclasses should implement this with the attributes 
	 * expected for their batch.
	 *
	 * This method initially throws an error; so it must be overridden by
	 * subclasses of BaseBatch.
	 *
	 * @method _createVertexAttributes
	 * @return {Array} an array of Mesh.VertexAttrib objects
	 */
	_createVertexAttributes: function() {
		throw "_createVertexAttributes not implemented";
	},


	/**
	 * Returns the number of floats per vertex for this batcher.
	 * 
	 * This method initially throws an error; so it must be overridden by
	 * subclasses of BaseBatch.
	 *
	 * @method  getVertexSize
	 * @return {Number} the size of a vertex, in # of floats
	 */
	getVertexSize: function() {
		throw "getVertexSize not implemented";
	},

	
	/** 
	 * Begins the sprite batch. This will bind the shader
	 * and mesh. Subclasses may want to disable depth or 
	 * set up blending.
	 *
	 * @method  begin
	 */
	begin: function()  {
		if (this.drawing) 
			throw "batch.end() must be called before begin";
		this.drawing = true;

		this.shader.bind();

		//bind the attributes now to avoid redundant calls
		this.mesh.bind(this.shader);
	},

	/** 
	 * Ends the sprite batch. This will flush any remaining 
	 * data and set GL state back to normal.
	 * 
	 * @method  end
	 */
	end: function()  {
		if (!this.drawing)
			throw "batch.begin() must be called before end";
		if (this.idx > 0)
			this.flush();
		this.drawing = false;

		this.mesh.unbind(this.shader);
	},

	/** 
	 * Called before rendering to bind new textures.
	 * This method does nothing by default.
	 *
	 * @method  _preRender
	 */
	_preRender: function()  {
	},

	/** 
	 * Called after flushing the batch. This method
	 * does nothing by default.
	 *
	 * @method  _postRender
	 */
	_postRender: function() {
	},

	/**
	 * Flushes the batch by pushing the current data
	 * to GL.
	 * 
	 * @method flush
	 */
	flush: function()  {
		if (this.idx===0)
			return;

		var gl = this.gl;
		
		this._preRender();

		//number of sprites in batch
		var numComponents = this.getVertexSize();
		var spriteCount = (this.idx / (numComponents * 4));
		
		//draw the sprites
		var gl = this.context.gl;
		this.mesh.verticesDirty = true;
		this.mesh.draw(gl.TRIANGLES, spriteCount * 6, 0, this.idx);

		this.idx = 0;
	},

	/**
	 * Adds a sprite to this batch.
	 * The specifics depend on the sprite batch implementation.
	 *
	 * @method draw
	 * @param  {Texture} texture the texture for this sprite
	 * @param  {Number} x       the x position, defaults to zero
	 * @param  {Number} y       the y position, defaults to zero
	 * @param  {Number} width   the width, defaults to the texture width
	 * @param  {Number} height  the height, defaults to the texture height
	 * @param  {Number} u1      the first U coordinate, default zero
	 * @param  {Number} v1      the first V coordinate, default zero
	 * @param  {Number} u2      the second U coordinate, default one
	 * @param  {Number} v2      the second V coordinate, default one
	 */
	draw: function(texture, x, y, width, height, u1, v1, u2, v2) {
	},

	/**
	 * Adds a single quad mesh to this sprite batch from the given
	 * array of vertices.
	 * The specifics depend on the sprite batch implementation.
	 *
	 * @method  drawVertices
	 * @param {Texture} texture the texture we are drawing for this sprite
	 * @param {Float32Array} verts an array of vertices
	 * @param {Number} off the offset into the vertices array to read from
	 */
	drawVertices: function(texture, verts, off)  {
	},

	drawRegion: function(region, x, y, width, height) {
		this.draw(region.texture, x, y, width, height, region.u, region.v, region.u2, region.v2);
	},

	/**
	 * Destroys the batch, deleting its buffers and removing it from the
	 * WebGLContext management. Trying to use this
	 * batch after destroying it can lead to unpredictable behaviour.
	 *
	 * If `ownsShader` is true, this will also delete the `defaultShader` object.
	 * 
	 * @method destroy
	 */
	destroy: function() {
		this.vertices = [];
		this.indices = [];
		this.size = this.maxVertices = 0;

		if (this.defaultShader)
			this.defaultShader.destroy();
		this.defaultShader = null;
		this._shader = null; // remove reference to whatever shader is currently being used

		if (this.mesh) 
			this.mesh.destroy();
		this.mesh = null;
	}
});

module.exports = BaseBatch;

},{"./glutils/Mesh":12,"klasse":15,"number-util":16}],7:[function(require,module,exports){
/**
 * @module kami
 */

// Requires....
var Class         = require('klasse');

var BaseBatch = require('./BaseBatch');

var Mesh          = require('./glutils/Mesh');
var ShaderProgram = require('./glutils/ShaderProgram');

/**
 * A basic implementation of a batcher which draws 2D sprites.
 * This uses two triangles (quads) with indexed and interleaved
 * vertex data. Each vertex holds 5 floats (Position.xy, Color, TexCoord0.xy).
 *
 * The color is packed into a single float to reduce vertex bandwidth, and
 * the data is interleaved for best performance. We use a static index buffer,
 * and a dynamic vertex buffer that is updated with bufferSubData. 
 * 
 * @example
 *      var SpriteBatch = require('kami').SpriteBatch;  
 *      
 *      //create a new batcher
 *      var batch = new SpriteBatch(context);
 *
 *      function render() {
 *          batch.begin();
 *          
 *          //draw some sprites in between begin and end...
 *          batch.draw( texture, 0, 0, 25, 32 );
 *          batch.draw( texture1, 0, 25, 42, 23 );
 * 
 *          batch.end();
 *      }
 * 
 * @class  SpriteBatch
 * @uses BaseBatch
 * @constructor
 * @param {WebGLContext} context the context for this batch
 * @param {Number} size the max number of sprites to fit in a single batch
 */
var SpriteBatch = new Class({

	//inherit some stuff onto this prototype
	Mixins: BaseBatch,

	//Constructor
	initialize: function SpriteBatch(context, size) {
		BaseBatch.call(this, context, size);

		/**
		 * The projection Float32Array vec2 which is
		 * used to avoid some matrix calculations.
		 *
		 * @property projection
		 * @type {Float32Array}
		 */
		this.projection = new Float32Array(2);

		//Sets up a default projection vector so that the batch works without setProjection
		this.projection[0] = this.context.width/2;
		this.projection[1] = this.context.height/2;

		/**
		 * The currently bound texture. Do not modify.
		 * 
		 * @property {Texture} texture
		 * @readOnly
		 */
		this.texture = null;
	},

	/**
	 * This is a convenience function to set the batch's projection
	 * matrix to an orthographic 2D projection, based on the given screen
	 * size. This allows users to render in 2D without any need for a camera.
	 * 
	 * @param  {[type]} width  [description]
	 * @param  {[type]} height [description]
	 * @return {[type]}        [description]
	 */
	resize: function(width, height) {
		this.setProjection(width/2, height/2);
	},

	/**
	 * The number of floats per vertex for this batcher 
	 * (Position.xy + Color + TexCoord0.xy).
	 *
	 * @method  getVertexSize
	 * @return {Number} the number of floats per vertex
	 */
	getVertexSize: function() {
		return SpriteBatch.VERTEX_SIZE;
	},

	/**
	 * Used internally to return the Position, Color, and TexCoord0 attributes.
	 *
	 * @method  _createVertexAttribuets
	 * @protected
	 * @return {[type]} [description]
	 */
	_createVertexAttributes: function() {
		var gl = this.context.gl;

		return [ 
			new Mesh.Attrib("Position", 2),
			 //pack the color using some crazy wizardry 
			new Mesh.Attrib("Color", 4, null, gl.UNSIGNED_BYTE, true, 1),
			new Mesh.Attrib("TexCoord0", 2)
		];
	},


	/**
	 * Sets the projection vector, an x and y
	 * defining the middle points of your stage.
	 *
	 * @method setProjection
	 * @param {Number} x the x projection value
	 * @param {Number} y the y projection value
	 */
	setProjection: function(x, y) {
		var oldX = this.projection[0];
		var oldY = this.projection[1];
		this.projection[0] = x;
		this.projection[1] = y;

		//we need to flush the batch..
		if (this.drawing && (x != oldX || y != oldY)) {
			this.flush();
			this._updateMatrices();
		}
	},

	/**
	 * Creates a default shader for this batch.
	 *
	 * @method  _createShader
	 * @protected
	 * @return {ShaderProgram} a new instance of ShaderProgram
	 */
	_createShader: function() {
		var shader = new ShaderProgram(this.context,
				SpriteBatch.DEFAULT_VERT_SHADER, 
				SpriteBatch.DEFAULT_FRAG_SHADER);
		if (shader.log)
			console.warn("Shader Log:\n" + shader.log);
		return shader;
	},

	/**
	 * This is called during rendering to update projection/transform
	 * matrices and upload the new values to the shader. For example,
	 * if the user calls setProjection mid-draw, the batch will flush
	 * and this will be called before continuing to add items to the batch.
	 *
	 * You generally should not need to call this directly.
	 * 
	 * @method  updateMatrices
	 * @protected
	 */
	updateMatrices: function() {
		this.shader.setUniformfv("u_projection", this.projection);
	},

	/**
	 * Called before rendering, and binds the current texture.
	 * 
	 * @method _preRender
	 * @protected
	 */
	_preRender: function() {
		if (this.texture)
			this.texture.bind();
	},

	/**
	 * Binds the shader, disables depth writing, 
	 * enables blending, activates texture unit 0, and sends
	 * default matrices and sampler2D uniforms to the shader.
	 *
	 * @method  begin
	 */
	begin: function() {
		//sprite batch doesn't hold a reference to GL since it is volatile
		var gl = this.context.gl;
		
		//This binds the shader and mesh!
		BaseBatch.prototype.begin.call(this);

		this.updateMatrices(); //send projection/transform to shader

		//upload the sampler uniform. not necessary every flush so we just
		//do it here.
		this.shader.setUniformi("u_texture0", 0);

		//disable depth mask
		gl.depthMask(false);

		//premultiplied alpha
		if (this._blendEnabled) {
			gl.enable(gl.BLEND);

			//set either to -1 if you want to call your own 
			//blendFunc or blendFuncSeparate
			if (this._blendSrc !== -1 && this._blendDst !== -1)
				gl.blendFunc(this._blendSrc, this._blendDst); 
		}
	},

	/**
	 * Ends the sprite batcher and flushes any remaining data to the GPU.
	 * 
	 * @method end
	 */
	end: function() {
		//sprite batch doesn't hold a reference to GL since it is volatile
		var gl = this.context.gl;
		
		//just do direct parent call for speed here
		//This binds the shader and mesh!
		BaseBatch.prototype.end.call(this);

		gl.depthMask(true);

		if (this._blendEnabled)
			gl.disable(gl.BLEND);
	},

	/**
	 * Flushes the batch to the GPU. This should be called when
	 * state changes, such as blend functions, depth or stencil states,
	 * shaders, and so forth.
	 * 
	 * @method flush
	 */
	flush: function() {
		//ignore flush if texture is null or our batch is empty
		if (!this.texture)
			return;
		if (this.idx === 0)
			return;
		BaseBatch.prototype.flush.call(this);
		SpriteBatch.totalRenderCalls++;
	},

	/**
	 * Adds a sprite to this batch. The sprite is drawn in 
	 * screen-space with the origin at the upper-left corner (y-down).
	 * 
	 * @method draw
	 * @param  {Texture} texture the Texture
	 * @param  {Number} x       the x position in pixels, defaults to zero
	 * @param  {Number} y       the y position in pixels, defaults to zero
	 * @param  {Number} width   the width in pixels, defaults to the texture width
	 * @param  {Number} height  the height in pixels, defaults to the texture height
	 * @param  {Number} u1      the first U coordinate, default zero
	 * @param  {Number} v1      the first V coordinate, default zero
	 * @param  {Number} u2      the second U coordinate, default one
	 * @param  {Number} v2      the second V coordinate, default one
	 */
	draw: function(texture, x, y, width, height, u1, v1, u2, v2) {
		if (!this.drawing)
			throw "Illegal State: trying to draw a batch before begin()";

		//don't draw anything if GL tex doesn't exist..
		if (!texture)
			return;

		if (this.texture === null || this.texture.id !== texture.id) {
			//new texture.. flush previous data
			this.flush();
			this.texture = texture;
		} else if (this.idx == this.vertices.length) {
			this.flush(); //we've reached our max, flush before pushing more data
		}

		width = (width===0) ? width : (width || texture.width);
		height = (height===0) ? height : (height || texture.height);
		x = x || 0;
		y = y || 0;

		var x1 = x;
		var x2 = x + width;
		var y1 = y;
		var y2 = y + height;

		u1 = u1 || 0;
		u2 = (u2===0) ? u2 : (u2 || 1);
		v1 = v1 || 0;
		v2 = (v2===0) ? v2 : (v2 || 1);

		var c = this.color;

		//xy
		this.vertices[this.idx++] = x1;
		this.vertices[this.idx++] = y1;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u1;
		this.vertices[this.idx++] = v1;
		
		//xy
		this.vertices[this.idx++] = x2;
		this.vertices[this.idx++] = y1;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u2;
		this.vertices[this.idx++] = v1;

		//xy
		this.vertices[this.idx++] = x2;
		this.vertices[this.idx++] = y2;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u2;
		this.vertices[this.idx++] = v2;

		//xy
		this.vertices[this.idx++] = x1;
		this.vertices[this.idx++] = y2;
		//color
		this.vertices[this.idx++] = c;
		//uv
		this.vertices[this.idx++] = u1;
		this.vertices[this.idx++] = v2;
	},

	/**
	 * Adds a single quad mesh to this sprite batch from the given
	 * array of vertices. The sprite is drawn in 
	 * screen-space with the origin at the upper-left corner (y-down).
	 *
	 * This reads 20 interleaved floats from the given offset index, in the format
	 *
	 *  { x, y, color, u, v,
	 *      ...  }
	 *
	 * @method  drawVertices
	 * @param {Texture} texture the Texture object
	 * @param {Float32Array} verts an array of vertices
	 * @param {Number} off the offset into the vertices array to read from
	 */
	drawVertices: function(texture, verts, off) {
		if (!this.drawing)
			throw "Illegal State: trying to draw a batch before begin()";
		
		//don't draw anything if GL tex doesn't exist..
		if (!texture)
			return;


		if (this.texture != texture) {
			//new texture.. flush previous data
			this.flush();
			this.texture = texture;
		} else if (this.idx == this.vertices.length) {
			this.flush(); //we've reached our max, flush before pushing more data
		}

		off = off || 0;
		//TODO: use a loop here?
		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		
		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];

		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];

		//xy
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
		//color
		this.vertices[this.idx++] = verts[off++];
		//uv
		this.vertices[this.idx++] = verts[off++];
		this.vertices[this.idx++] = verts[off++];
	}
});

/**
 * The default vertex size, i.e. number of floats per vertex.
 * @attribute  VERTEX_SIZE
 * @static
 * @final
 * @type {Number}
 * @default  5
 */
SpriteBatch.VERTEX_SIZE = 5;

/**
 * Incremented after each draw call, can be used for debugging.
 *
 *     SpriteBatch.totalRenderCalls = 0;
 *
 *     ... draw your scene ...
 *
 *     console.log("Draw calls per frame:", SpriteBatch.totalRenderCalls);
 *
 * 
 * @attribute  totalRenderCalls
 * @static
 * @type {Number}
 * @default  0
 */
SpriteBatch.totalRenderCalls = 0;

SpriteBatch.DEFAULT_FRAG_SHADER = [
	"precision mediump float;",
	"varying vec2 vTexCoord0;",
	"varying vec4 vColor;",
	"uniform sampler2D u_texture0;",

	"void main(void) {",
	"   gl_FragColor = texture2D(u_texture0, vTexCoord0) * vColor;",
	"}"
].join('\n');

SpriteBatch.DEFAULT_VERT_SHADER = [
	"attribute vec2 Position;",
	"attribute vec4 Color;",
	"attribute vec2 TexCoord0;",

	"uniform vec2 u_projection;",
	"varying vec2 vTexCoord0;",
	"varying vec4 vColor;",

	"void main(void) {",
	"   gl_Position = vec4( Position.x / u_projection.x - 1.0, Position.y / -u_projection.y + 1.0 , 0.0, 1.0);",
	"   vTexCoord0 = TexCoord0;",
	"   vColor = Color;",
	"}"
].join('\n');

module.exports = SpriteBatch;

},{"./BaseBatch":6,"./glutils/Mesh":12,"./glutils/ShaderProgram":13,"klasse":15}],8:[function(require,module,exports){
/**
 * @module kami
 */

var Class = require('klasse');
var Signal = require('signals');
var nextPowerOfTwo = require('number-util').nextPowerOfTwo;
var isPowerOfTwo = require('number-util').isPowerOfTwo;

var Texture = new Class({


	/**
	 * Creates a new texture with the optional width, height, and data.
	 *
	 * If the constructor is passed no parameters other than WebGLContext, then
	 * it will not be initialized and will be non-renderable. You will need to manually
	 * uploadData or uploadImage yourself.
	 *
	 * If you pass a width and height after context, the texture will be initialized with that size
	 * and null data (e.g. transparent black). If you also pass the format and data, 
	 * it will be uploaded to the texture. 
	 *
	 * If you pass a String or Data URI as the second parameter,
	 * this Texture will load an Image object asynchronously. The optional third
	 * and fourth parameters are callback functions for success and failure, respectively. 
	 * The optional fifrth parameter for this version of the constructor is genMipmaps, which defaults to false. 
	 * 
	 * The arguments are kept in memory for future context restoration events. If
	 * this is undesirable (e.g. huge buffers which need to be GC'd), you should not
	 * pass the data in the constructor, but instead upload it after creating an uninitialized 
	 * texture. You will need to manage it yourself, either by extending the create() method, 
	 * or listening to restored events in WebGLContext.
	 *
	 * Most users will want to use the AssetManager to create and manage their textures
	 * with asynchronous loading and context loss. 
	 *
	 * @example
	 * 		new Texture(context, 256, 256); //empty 256x256 texture
	 * 		new Texture(context, 1, 1, Texture.Format.RGBA, Texture.DataType.UNSIGNED_BYTE, 
	 * 					new Uint8Array([255,0,0,255])); //1x1 red texture
	 * 		new Texture(context, "test.png"); //loads image asynchronously
	 * 		new Texture(context, "test.png", successFunc, failFunc, useMipmaps); //extra params for image laoder 
	 *
	 * @class  Texture
	 * @constructor
	 * @param  {WebGLContext} context the WebGL context
	 * @param  {Number} width the width of this texture
	 * @param  {Number} height the height of this texture
	 * @param  {GLenum} format e.g. Texture.Format.RGBA
	 * @param  {GLenum} dataType e.g. Texture.DataType.UNSIGNED_BYTE (Uint8Array)
	 * @param  {GLenum} data the array buffer, e.g. a Uint8Array view
	 * @param  {Boolean} genMipmaps whether to generate mipmaps after uploading the data
	 */
	initialize: function Texture(context, width, height, format, dataType, data, genMipmaps) {
		if (typeof context !== "object")
			throw "GL context not specified to Texture";
		this.context = context;

		/**
		 * The WebGLTexture which backs this Texture object. This
		 * can be used for low-level GL calls.
		 * 
		 * @type {WebGLTexture}
		 */
		this.id = null; //initialized in create()

		/**
		 * The target for this texture unit, i.e. TEXTURE_2D. Subclasses
		 * should override the create() method to change this, for correct
		 * usage with context restore.
		 * 
		 * @property target
		 * @type {GLenum}
		 * @default  gl.TEXTURE_2D
		 */
		this.target = context.gl.TEXTURE_2D;

		/**
		 * The width of this texture, in pixels.
		 * 
		 * @property width
		 * @readOnly
		 * @type {Number} the width
		 */
		this.width = 0; //initialized on texture upload

		/**
		 * The height of this texture, in pixels.
		 * 
		 * @property height
		 * @readOnly
		 * @type {Number} the height
		 */
		this.height = 0; //initialized on texture upload

		// e.g. --> new Texture(gl, 256, 256, gl.RGB, gl.UNSIGNED_BYTE, data);
		//		      creates a new empty texture, 256x256
		//		--> new Texture(gl);
		//			  creates a new texture but WITHOUT uploading any data. 

		/**
		 * The S wrap parameter.
		 * @property {GLenum} wrapS
		 */
		this.wrapS = Texture.DEFAULT_WRAP;
		/**
		 * The T wrap parameter.
		 * @property {GLenum} wrapT
		 */
		this.wrapT = Texture.DEFAULT_WRAP;
		/**
		 * The minifcation filter.
		 * @property {GLenum} minFilter 
		 */
		this.minFilter = Texture.DEFAULT_FILTER;
		
		/**
		 * The magnification filter.
		 * @property {GLenum} magFilter 
		 */
		this.magFilter = Texture.DEFAULT_FILTER;

		/**
		 * When a texture is created, we keep track of the arguments provided to 
		 * its constructor. On context loss and restore, these arguments are re-supplied
		 * to the Texture, so as to re-create it in its correct form.
		 *
		 * This is mainly useful if you are procedurally creating textures and passing
		 * their data directly (e.g. for generic lookup tables in a shader). For image
		 * or media based textures, it would be better to use an AssetManager to manage
		 * the asynchronous texture upload.
		 *
		 * Upon destroying a texture, a reference to this is also lost.
		 *
		 * @property managedArgs
		 * @type {Array} the array of arguments, shifted to exclude the WebGLContext parameter
		 */
		this.managedArgs = Array.prototype.slice.call(arguments, 1);

		//This is maanged by WebGLContext
		this.context.addManagedObject(this);
		this.create();
	},

	/**
	 * This can be called after creating a Texture to load an Image object asynchronously,
	 * or upload image data directly. It takes the same parameters as the constructor, except 
	 * for the context which has already been established. 
	 *
	 * Users will generally not need to call this directly. 
	 * 
	 * @protected
	 * @method  setup
	 */
	setup: function(width, height, format, dataType, data, genMipmaps) {
		var gl = this.gl;

		//If the first argument is a string, assume it's an Image loader
		//second argument will then be genMipmaps, third and fourth the success/fail callbacks
		if (typeof width === "string") {
			var img = new Image();
			var path      = arguments[0];   //first argument, the path
			var successCB = typeof arguments[1] === "function" ? arguments[1] : null;
			var failCB    = typeof arguments[2] === "function" ? arguments[2] : null;
			genMipmaps    = !!arguments[3];

			var self = this;

			//If you try to render a texture that is not yet "renderable" (i.e. the 
			//async load hasn't completed yet, which is always the case in Chrome since requestAnimationFrame
			//fires before img.onload), WebGL will throw us errors. So instead we will just upload some
			//dummy data until the texture load is complete. Users can disable this with the global flag.
			if (Texture.USE_DUMMY_1x1_DATA) {
				self.uploadData(1, 1);
				this.width = this.height = 0;
			}

			img.onload = function() {
				self.uploadImage(img, undefined, undefined, genMipmaps);
				if (successCB)
					successCB();
			}
			img.onerror = function() {
				// console.warn("Error loading image: "+path);
				if (genMipmaps) //we still need to gen mipmaps on the 1x1 dummy
					gl.generateMipmap(gl.TEXTURE_2D);
				if (failCB)
					failCB();
			}
			img.onabort = function() {
				// console.warn("Image load aborted: "+path);
				if (genMipmaps) //we still need to gen mipmaps on the 1x1 dummy
					gl.generateMipmap(gl.TEXTURE_2D);
				if (failCB)
					failCB();
			}

			img.src = path;
		} 
		//otherwise assume our regular list of width/height arguments are passed
		else {
			this.uploadData(width, height, format, dataType, data, genMipmaps);
		}
	},	

	/**
	 * Called in the Texture constructor, and after the GL context has been re-initialized. 
	 * Subclasses can override this to provide a custom data upload, e.g. cubemaps or compressed
	 * textures.
	 *
	 * @method  create
	 */
	create: function() {
		this.gl = this.context.gl; 
		var gl = this.gl;

		this.id = gl.createTexture(); //texture ID is recreated
		this.width = this.height = 0; //size is reset to zero until loaded
		this.target = gl.TEXTURE_2D;  //the provider can change this if necessary (e.g. cube maps)

		this.bind();


		//TODO: clean these up a little. 
		gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, Texture.UNPACK_PREMULTIPLY_ALPHA);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, Texture.UNPACK_ALIGNMENT);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, Texture.UNPACK_FLIP_Y);
		
		var colorspace = Texture.UNPACK_COLORSPACE_CONVERSION || gl.BROWSER_DEFAULT_WEBGL;
		gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, colorspace);

		//setup wrap modes without binding redundantly
		this.setWrap(this.wrapS, this.wrapT, false);
		this.setFilter(this.minFilter, this.magFilter, false);
		
		if (this.managedArgs.length !== 0) {
			this.setup.apply(this, this.managedArgs);
		}
	},

	/**
	 * Destroys this texture by deleting the GL resource,
	 * removing it from the WebGLContext management stack,
	 * setting its size to zero, and id and managed arguments to null.
	 * 
	 * Trying to use this texture after may lead to undefined behaviour.
	 *
	 * @method  destroy
	 */
	destroy: function() {
		if (this.id && this.gl)
			this.gl.deleteTexture(this.id);
		if (this.context)
			this.context.removeManagedObject(this);
		this.width = this.height = 0;
		this.id = null;
		this.managedArgs = null;
		this.context = null;
		this.gl = null;
	},

	/**
	 * Sets the wrap mode for this texture; if the second argument
	 * is undefined or falsy, then both S and T wrap will use the first
	 * argument.
	 *
	 * You can use Texture.Wrap constants for convenience, to avoid needing 
	 * a GL reference.
	 *
	 * @method  setWrap
	 * @param {GLenum} s the S wrap mode
	 * @param {GLenum} t the T wrap mode
	 * @param {Boolean} ignoreBind (optional) if true, the bind will be ignored. 
	 */
	setWrap: function(s, t, ignoreBind) { //TODO: support R wrap mode
		if (s && t) {
			this.wrapS = s;
			this.wrapT = t;
		} else 
			this.wrapS = this.wrapT = s;
		
		//enforce POT rules..
		this._checkPOT();	

		if (!ignoreBind)
			this.bind();

		var gl = this.gl;
		gl.texParameteri(this.target, gl.TEXTURE_WRAP_S, this.wrapS);
		gl.texParameteri(this.target, gl.TEXTURE_WRAP_T, this.wrapT);
	},


	/**
	 * Sets the min and mag filter for this texture; 
	 * if mag is undefined or falsy, then both min and mag will use the
	 * filter specified for min.
	 *
	 * You can use Texture.Filter constants for convenience, to avoid needing 
	 * a GL reference.
	 *
	 * @method  setFilter
	 * @param {GLenum} min the minification filter
	 * @param {GLenum} mag the magnification filter
	 * @param {Boolean} ignoreBind if true, the bind will be ignored. 
	 */
	setFilter: function(min, mag, ignoreBind) { 
		if (min && mag) {
			this.minFilter = min;
			this.magFilter = mag;
		} else 
			this.minFilter = this.magFilter = min;
		
		//enforce POT rules..
		this._checkPOT();

		if (!ignoreBind)
			this.bind();

		var gl = this.gl;
		gl.texParameteri(this.target, gl.TEXTURE_MIN_FILTER, this.minFilter);
		gl.texParameteri(this.target, gl.TEXTURE_MAG_FILTER, this.magFilter);
	},

	/**
	 * A low-level method to upload the specified ArrayBufferView
	 * to this texture. This will cause the width and height of this
	 * texture to change.
	 *
	 * @method  uploadData
	 * @param  {Number} width          the new width of this texture,
	 *                                 defaults to the last used width (or zero)
	 * @param  {Number} height         the new height of this texture
	 *                                 defaults to the last used height (or zero)
	 * @param  {GLenum} format         the data format, default RGBA
	 * @param  {GLenum} type           the data type, default UNSIGNED_BYTE (Uint8Array)
	 * @param  {ArrayBufferView} data  the raw data for this texture, or null for an empty image
	 * @param  {Boolean} genMipmaps	   whether to generate mipmaps after uploading the data, default false
	 */
	uploadData: function(width, height, format, type, data, genMipmaps) {
		var gl = this.gl;

		format = format || gl.RGBA;
		type = type || gl.UNSIGNED_BYTE;
		data = data || null; //make sure falsey value is null for texImage2D

		this.width = (width || width==0) ? width : this.width;
		this.height = (height || height==0) ? height : this.height;

		this._checkPOT();

		this.bind();

		gl.texImage2D(this.target, 0, format, 
					  this.width, this.height, 0, format,
					  type, data);

		if (genMipmaps)
			gl.generateMipmap(this.target);
	},

	/**
	 * Uploads ImageData, HTMLImageElement, HTMLCanvasElement or 
	 * HTMLVideoElement.
	 *
	 * @method  uploadImage
	 * @param  {Object} domObject the DOM image container
	 * @param  {GLenum} format the format, default gl.RGBA
	 * @param  {GLenum} type the data type, default gl.UNSIGNED_BYTE
	 * @param  {Boolean} genMipmaps whether to generate mipmaps after uploading the data, default false
	 */
	uploadImage: function(domObject, format, type, genMipmaps) {
		var gl = this.gl;

		format = format || gl.RGBA;
		type = type || gl.UNSIGNED_BYTE;
		
		this.width = domObject.width;
		this.height = domObject.height;

		this._checkPOT();

		this.bind();

		gl.texImage2D(this.target, 0, format, format,
					  type, domObject);

		if (genMipmaps)
			gl.generateMipmap(this.target);
	},

	/**
	 * If FORCE_POT is false, we verify this texture to see if it is valid, 
	 * as per non-power-of-two rules. If it is non-power-of-two, it must have 
	 * a wrap mode of CLAMP_TO_EDGE, and the minification filter must be LINEAR
	 * or NEAREST. If we don't satisfy these needs, an error is thrown.
	 * 
	 * @method  _checkPOT
	 * @private
	 * @return {[type]} [description]
	 */
	_checkPOT: function() {
		if (!Texture.FORCE_POT) {
			//If minFilter is anything but LINEAR or NEAREST
			//or if wrapS or wrapT are not CLAMP_TO_EDGE...
			var wrongFilter = (this.minFilter !== Texture.Filter.LINEAR && this.minFilter !== Texture.Filter.NEAREST);
			var wrongWrap = (this.wrapS !== Texture.Wrap.CLAMP_TO_EDGE || this.wrapT !== Texture.Wrap.CLAMP_TO_EDGE);

			if ( wrongFilter || wrongWrap ) {
				if (!isPowerOfTwo(this.width) || !isPowerOfTwo(this.height))
					throw new Error(wrongFilter 
							? "Non-power-of-two textures cannot use mipmapping as filter"
							: "Non-power-of-two textures must use CLAMP_TO_EDGE as wrap");
			}
		}
	},

	/**
	 * Binds the texture. If unit is specified,
	 * it will bind the texture at the given slot
	 * (TEXTURE0, TEXTURE1, etc). If unit is not specified,
	 * it will simply bind the texture at whichever slot
	 * is currently active.
	 *
	 * @method  bind
	 * @param  {Number} unit the texture unit index, starting at 0
	 */
	bind: function(unit) {
		var gl = this.gl;
		if (unit || unit === 0)
			gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(this.target, this.id);
	},

	toString: function() {
		return this.id + ":" + this.width + "x" + this.height + "";
	}
});

/** 
 * A set of Filter constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.Filter.NEAREST
 *     Texture.Filter.NEAREST_MIPMAP_LINEAR
 *     Texture.Filter.NEAREST_MIPMAP_NEAREST
 *     Texture.Filter.LINEAR
 *     Texture.Filter.LINEAR_MIPMAP_LINEAR
 *     Texture.Filter.LINEAR_MIPMAP_NEAREST
 * ```
 * @attribute Filter
 * @static
 * @type {Object}
 */
Texture.Filter = {
	NEAREST: 9728,
	NEAREST_MIPMAP_LINEAR: 9986,
	NEAREST_MIPMAP_NEAREST: 9984,
	LINEAR: 9729,
	LINEAR_MIPMAP_LINEAR: 9987,
	LINEAR_MIPMAP_NEAREST: 9985
};

/** 
 * A set of Wrap constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.Wrap.CLAMP_TO_EDGE
 *     Texture.Wrap.MIRRORED_REPEAT
 *     Texture.Wrap.REPEAT
 * ```
 * @attribute Wrap
 * @static
 * @type {Object}
 */
Texture.Wrap = {
	CLAMP_TO_EDGE: 33071,
	MIRRORED_REPEAT: 33648,
	REPEAT: 10497
};

/** 
 * A set of Format constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.Format.RGB
 *     Texture.Format.RGBA
 *     Texture.Format.LUMINANCE_ALPHA
 * ```
 * @attribute Format
 * @static
 * @type {Object}
 */
Texture.Format = {
	DEPTH_COMPONENT: 6402,
	ALPHA: 6406,
	RGBA: 6408,
	RGB: 6407,
	LUMINANCE: 6409,
	LUMINANCE_ALPHA: 6410
};

/** 
 * A set of DataType constants that match their GL counterparts.
 * This is for convenience, to avoid the need for a GL rendering context.
 *
 * @example
 * ```
 *     Texture.DataType.UNSIGNED_BYTE 
 *     Texture.DataType.FLOAT 
 * ```
 * @attribute DataType
 * @static
 * @type {Object}
 */
Texture.DataType = {
	BYTE: 5120,
	SHORT: 5122,
	INT: 5124,
	FLOAT: 5126,
	UNSIGNED_BYTE: 5121,
	UNSIGNED_INT: 5125,
	UNSIGNED_SHORT: 5123,
	UNSIGNED_SHORT_4_4_4_4: 32819,
	UNSIGNED_SHORT_5_5_5_1: 32820,
	UNSIGNED_SHORT_5_6_5: 33635
}

/**
 * The default wrap mode when creating new textures. If a custom 
 * provider was specified, it may choose to override this default mode.
 * 
 * @attribute {GLenum} DEFAULT_WRAP
 * @static 
 * @default  Texture.Wrap.CLAMP_TO_EDGE
 */
Texture.DEFAULT_WRAP = Texture.Wrap.CLAMP_TO_EDGE;


/**
 * The default filter mode when creating new textures. If a custom
 * provider was specified, it may choose to override this default mode.
 *
 * @attribute {GLenum} DEFAULT_FILTER
 * @static
 * @default  Texture.Filter.LINEAR
 */
Texture.DEFAULT_FILTER = Texture.Filter.NEAREST;

/**
 * By default, we do some error checking when creating textures
 * to ensure that they will be "renderable" by WebGL. Non-power-of-two
 * textures must use CLAMP_TO_EDGE as their wrap mode, and NEAREST or LINEAR
 * as their wrap mode. Further, trying to generate mipmaps for a NPOT image
 * will lead to errors. 
 *
 * However, you can disable this error checking by setting `FORCE_POT` to true.
 * This may be useful if you are running on specific hardware that supports POT 
 * textures, or in some future case where NPOT textures is added as a WebGL extension.
 * 
 * @attribute {Boolean} FORCE_POT
 * @static
 * @default  false
 */
Texture.FORCE_POT = false;

//default pixel store operations. Used in create()
Texture.UNPACK_FLIP_Y = false;
Texture.UNPACK_ALIGNMENT = 1;
Texture.UNPACK_PREMULTIPLY_ALPHA = true; 
Texture.UNPACK_COLORSPACE_CONVERSION = undefined;

//for the Image constructor we need to handle things a bit differently..
Texture.USE_DUMMY_1x1_DATA = true;

/**
 * Utility to get the number of components for the given GLenum, e.g. gl.RGBA returns 4.
 * Returns null if the specified format is not of type DEPTH_COMPONENT, ALPHA, LUMINANCE,
 * LUMINANCE_ALPHA, RGB, or RGBA.
 * 
 * @method getNumComponents
 * @static
 * @param  {GLenum} format a texture format, i.e. Texture.Format.RGBA
 * @return {Number} the number of components for this format
 */
Texture.getNumComponents = function(format) {
	switch (format) {
		case Texture.Format.DEPTH_COMPONENT:
		case Texture.Format.ALPHA:
		case Texture.Format.LUMINANCE:
			return 1;
		case Texture.Format.LUMINANCE_ALPHA:
			return 2;
		case Texture.Format.RGB:
			return 3;
		case Texture.Format.RGBA:
			return 4;
	}
	return null;
};

//Unmanaged textures:
//	HTML elements like Image, Video, Canvas
//	pixels buffer from Canvas
//	pixels array

//Need special handling:
//  context.onContextLost.add(function() {
//  	createDynamicTexture();
//  }.bind(this));

//Managed textures:
//	images specified with a path
//	this will use Image under the hood


module.exports = Texture;
},{"klasse":15,"number-util":16,"signals":17}],9:[function(require,module,exports){
var Class = require('klasse');
var Texture = require('./Texture');

//This is a GL-specific texture region, employing tangent space normalized coordinates U and V.
//A canvas-specific region would really just be a lightweight object with { x, y, width, height }
//in pixels.
var TextureRegion = new Class({

	initialize: function TextureRegion(texture, x, y, width, height) {
		this.texture = texture;
		this.setRegion(x, y, width, height);
	},

	setUVs: function(u, v, u2, v2) {
		this.regionWidth = Math.round(Math.abs(u2 - u) * this.texture.width);
        this.regionHeight = Math.round(Math.abs(v2 - v) * this.texture.height);

        // From LibGDX TextureRegion.java -- 
		// For a 1x1 region, adjust UVs toward pixel center to avoid filtering artifacts on AMD GPUs when drawing very stretched.
		if (this.regionWidth == 1 && this.regionHeight == 1) {
			var adjustX = 0.25 / this.texture.width;
			u += adjustX;
			u2 -= adjustX;
			var adjustY = 0.25 / this.texture.height;
			v += adjustY;
			v2 -= adjustY;
		}

		this.u = u;
		this.v = v;
		this.u2 = u2;
		this.v2 = v2;
	},

	setRegion: function(x, y, width, height) {
		x = x || 0;
		y = y || 0;
		width = (width===0 || width) ? width : this.texture.width;
		height = (height===0 || height) ? height : this.texture.height;

		var invTexWidth = 1 / this.texture.width;
		var invTexHeight = 1 / this.texture.height;
		this.setUVs(x * invTexWidth, y * invTexHeight, (x + width) * invTexWidth, (y + height) * invTexHeight);
		this.regionWidth = Math.abs(width);
		this.regionHeight = Math.abs(height);
	},

	/** Sets the texture to that of the specified region and sets the coordinates relative to the specified region. */
	setFromRegion: function(region, x, y, width, height) {
		this.texture = region.texture;
		this.set(region.getRegionX() + x, region.getRegionY() + y, width, height);
	},


	//TODO: add setters for regionX/Y and regionWidth/Height

	regionX: {
		get: function() {
			return Math.round(this.u * this.texture.width);
		} 
	},

	regionY: {
		get: function() {
			return Math.round(this.v * this.texture.height);
		}
	},

	flip: function(x, y) {
		var temp;
		if (x) {
			temp = this.u;
			this.u = this.u2;
			this.u2 = temp;
		}
		if (y) {
			temp = this.v;
			this.v = this.v2;
			this.v2 = temp;
		}
	}
});

module.exports = TextureRegion;
},{"./Texture":8,"klasse":15}],10:[function(require,module,exports){
/**
 * @module kami
 */

var Class = require('klasse');
var Signal = require('signals');

/**
 * A thin wrapper around WebGLRenderingContext which handles
 * context loss and restore with various rendering objects (textures,
 * shaders and buffers). This also handles general viewport management.
 *
 * If the view is not specified, a canvas will be created.
 * 
 * @class  WebGLContext
 * @constructor
 * @param {Number} width the width of the GL canvas
 * @param {Number} height the height of the GL canvas
 * @param {HTMLCanvasElement} view the optional DOM canvas element
 * @param {Object} contextAttribuets an object containing context attribs which
 *                                   will be used during GL initialization
 */
var WebGLContext = new Class({
	
	initialize: function WebGLContext(width, height, view, contextAttributes) {
		/**
		 * The list of rendering objects (shaders, VBOs, textures, etc) which are 
		 * currently being managed. Any object with a "create" method can be added
		 * to this list. Upon destroying the rendering object, it should be removed.
		 * See addManagedObject and removeManagedObject.
		 * 
		 * @property {Array} managedObjects
		 */
		this.managedObjects = [];

		/**
		 * The actual GL context. You can use this for
		 * raw GL calls or to access GLenum constants. This
		 * will be updated on context restore. While the WebGLContext
		 * is not `valid`, you should not try to access GL state.
		 * 
		 * @property gl
		 * @type {WebGLRenderingContext}
		 */
		this.gl = null;

		/**
		 * The canvas DOM element for this context.
		 * @property {Number} view
		 */
		this.view = view || document.createElement("canvas");

		//default size as per spec:
		//http://www.w3.org/TR/2012/WD-html5-author-20120329/the-canvas-element.html#the-canvas-element
		
		/**
		 * The width of this canvas.
		 *
		 * @property width
		 * @type {Number}
		 */
		this.width = this.view.width = width || 300;

		/**
		 * The height of this canvas.
		 * @property height
		 * @type {Number}
		 */
		this.height = this.view.height = height || 150;


		/**
		 * The context attributes for initializing the GL state. This might include
		 * anti-aliasing, alpha settings, verison, and so forth.
		 * 
		 * @property {Object} contextAttributes 
		 */
		this.contextAttributes = contextAttributes;
		
		/**
		 * Whether this context is 'valid', i.e. renderable. A context that has been lost
		 * (and not yet restored) or destroyed is invalid.
		 * 
		 * @property {Boolean} valid
		 */
		this.valid = false;

		/**
		 * A signal dispatched when GL context is lost. 
		 * 
		 * The first argument passed to the listener is the WebGLContext
		 * managing the context loss.
		 * 
		 * @event {Signal} lost
		 */
		this.lost = new Signal();

		/**
		 * A signal dispatched when GL context is restored, after all the managed
		 * objects have been recreated.
		 *
		 * The first argument passed to the listener is the WebGLContext
		 * which managed the restoration.
		 *
		 * This does not gaurentee that all objects will be renderable.
		 * For example, a Texture with an ImageProvider may still be loading
		 * asynchronously.	 
		 * 
		 * @event {Signal} restored
		 */
		this.restored = new Signal();	
		
		//setup context lost and restore listeners
		this.view.addEventListener("webglcontextlost", function (ev) {
			ev.preventDefault();
			this._contextLost(ev);
		}.bind(this));
		this.view.addEventListener("webglcontextrestored", function (ev) {
			ev.preventDefault();
			this._contextRestored(ev);
		}.bind(this));
			
		this._initContext();

		this.resize(this.width, this.height);
	},
	
	_initContext: function() {
		var err = "";
		this.valid = false;

		try {
			this.gl = (this.view.getContext('webgl', this.contextAttributes) 
						|| this.view.getContext('experimental-webgl', this.contextAttributes));
		} catch (e) {
			this.gl = null;
		}

		if (this.gl) {
			this.valid = true;
		} else {
			throw "WebGL Context Not Supported -- try enabling it or using a different browser";
		}	
	},

	/**
	 * Updates the width and height of this WebGL context, resizes
	 * the canvas view, and calls gl.viewport() with the new size.
	 * 
	 * @param  {Number} width  the new width
	 * @param  {Number} height the new height
	 */
	resize: function(width, height) {
		this.width = width;
		this.height = height;

		this.view.width = width;
		this.view.height = height;

		var gl = this.gl;
		gl.viewport(0, 0, this.width, this.height);
	},

	/**
	 * (internal use)
	 * A managed object is anything with a "create" function, that will
	 * restore GL state after context loss. 
	 * 
	 * @param {[type]} tex [description]
	 */
	addManagedObject: function(obj) {
		this.managedObjects.push(obj);
	},

	/**
	 * (internal use)
	 * Removes a managed object from the cache. This is useful to destroy
	 * a texture or shader, and have it no longer re-load on context restore.
	 *
	 * Returns the object that was removed, or null if it was not found in the cache.
	 * 
	 * @param  {Object} obj the object to be managed
	 * @return {Object}     the removed object, or null
	 */
	removeManagedObject: function(obj) {
		var idx = this.managedObjects.indexOf(obj);
		if (idx > -1) {
			this.managedObjects.splice(idx, 1);
			return obj;
		} 
		return null;
	},

	/**
	 * Calls destroy() on each managed object, then removes references to these objects
	 * and the GL rendering context. This also removes references to the view and sets
	 * the context's width and height to zero.
	 *
	 * Attempting to use this WebGLContext or the GL rendering context after destroying it
	 * will lead to undefined behaviour.
	 */
	destroy: function() {
		for (var i=0; i<this.managedObjects.length; i++) {
			var obj = this.managedObjects[i];
			if (obj && typeof obj.destroy)
				obj.destroy();
		}
		this.managedObjects.length = 0;
		this.valid = false;
		this.gl = null;
		this.view = null;
		this.width = this.height = 0;
	},

	_contextLost: function(ev) {
		//all textures/shaders/buffers/FBOs have been deleted... 
		//we need to re-create them on restore
		this.valid = false;

		this.lost.dispatch(this);
	},

	_contextRestored: function(ev) {
		//first, initialize the GL context again
		this._initContext();

		//now we recreate our shaders and textures
		for (var i=0; i<this.managedObjects.length; i++) {
			this.managedObjects[i].create();
		}

		//update GL viewport
		this.resize(this.width, this.height);

		this.restored.dispatch(this);
	}
});

module.exports = WebGLContext;
},{"klasse":15,"signals":17}],11:[function(require,module,exports){
var Class = require('klasse');
var Texture = require('../Texture');


var FrameBuffer = new Class({

	/**
	 * Creates a new Frame Buffer Object with the given width and height.
	 *
	 * If width and height are non-numbers, this method expects the
	 * first parameter to be a Texture object which should be acted upon. 
	 * In this case, the FrameBuffer does not "own" the texture, and so it
	 * won't dispose of it upon destruction. This is an advanced version of the
	 * constructor that assumes the user is giving us a valid Texture that can be bound (i.e.
	 * no async Image textures).
	 *
	 * @class  FrameBuffer
	 * @constructor
	 * @param  {[type]} width  [description]
	 * @param  {[type]} height [description]
	 * @param  {[type]} filter [description]
	 * @return {[type]}        [description]
	 */
	initialize: function FrameBuffer(context, width, height, format) { //TODO: depth component
		if (typeof context !== "object")
			throw "GL context not specified to FrameBuffer";
	

		/**
		 * The underlying ID of the GL frame buffer object.
		 *
		 * @property {WebGLFramebuffer} id
		 */		
		this.id = null;

		/**
		 * The WebGLContext backed by this frame buffer.
		 *
		 * @property {WebGLContext} context
		 */
		this.context = context;

		/**
		 * The Texture backed by this frame buffer.
		 *
		 * @property {Texture} Texture
		 */
		//this Texture is now managed.
		this.texture = new Texture(context, width, height, format);

		//This is maanged by WebGLContext
		this.context.addManagedObject(this);
		this.create();
	},

	/**
	 * A read-only property which returns the width of the backing texture. 
	 * 
	 * @readOnly
	 * @property width
	 * @type {Number}
	 */
	width: {
		get: function() {
			return this.texture.width
		}
	},

	/**
	 * A read-only property which returns the height of the backing texture. 
	 * 
	 * @readOnly
	 * @property height
	 * @type {Number}
	 */
	height: {
		get: function() {
			return this.texture.height;
		}
	},


	/**
	 * Called during initialization to setup the frame buffer; also called on
	 * context restore. Users will not need to call this directly.
	 * 
	 * @method create
	 */
	create: function() {
		this.gl = this.context.gl; 
		var gl = this.gl;

		var tex = this.texture;

		//we assume the texture has already had create() called on it
		//since it was added as a managed object prior to this FrameBuffer
		tex.bind();
 
		this.id = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);

		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, tex.target, tex.id, 0);

		var result = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
		if (result != gl.FRAMEBUFFER_COMPLETE) {
			this.destroy(); //destroy our resources before leaving this function..

			var err = "Framebuffer not complete";
			switch (result) {
				case gl.FRAMEBUFFER_UNSUPPORTED:
					throw new Error(err + ": unsupported");
				case gl.INCOMPLETE_DIMENSIONS:
					throw new Error(err + ": incomplete dimensions");
				case gl.INCOMPLETE_ATTACHMENT:
					throw new Error(err + ": incomplete attachment");
				case gl.INCOMPLETE_MISSING_ATTACHMENT:
					throw new Error(err + ": missing attachment");
				default:
					throw new Error(err);
			}
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	},


	/**
	 * Destroys this frame buffer. Using this object after destroying it will have
	 * undefined results. 
	 * @method destroy
	 */
	destroy: function() {
		var gl = this.gl;

		if (this.texture)
			this.texture.destroy();
		if (this.id && this.gl)
			this.gl.deleteFramebuffer(this.id);
		if (this.context)
			this.context.removeManagedObject(this);

		this.id = null;
		this.texture = null;
	},

	/**
	 * Binds this framebuffer and sets the viewport to the expected size.
	 * @method begin
	 */
	begin: function() {
		var gl = this.gl;
		gl.viewport(0, 0, this.texture.width, this.texture.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.id);
	},

	/**
	 * Binds the default frame buffer (the screen) and sets the viewport back
	 * to the size of the WebGLContext.
	 * 
	 * @method end
	 */
	end: function() {
		var gl = this.gl;
		gl.viewport(0, 0, this.context.width, this.context.height);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}
});

module.exports = FrameBuffer;
},{"../Texture":8,"klasse":15}],12:[function(require,module,exports){
/**
 * @module kami
 */

var Class = require('klasse');

//TODO: decouple into VBO + IBO utilities 
/**
 * A mesh class that wraps VBO and IBO.
 *
 * @class  Mesh
 */
var Mesh = new Class({


	/**
	 * A write-only property which sets both vertices and indices 
	 * flag to dirty or not. 
	 *
	 * @property dirty
	 * @type {Boolean}
	 * @writeOnly
	 */
	dirty: {
		set: function(val) {
			this.verticesDirty = val;
			this.indicesDirty = val;
		}
	},

	/**
	 * Creates a new Mesh with the provided parameters.
	 *
	 * If numIndices is 0 or falsy, no index buffer will be used
	 * and indices will be an empty ArrayBuffer and a null indexBuffer.
	 * 
	 * If isStatic is true, then vertexUsage and indexUsage will
	 * be set to gl.STATIC_DRAW. Otherwise they will use gl.DYNAMIC_DRAW.
	 * You may want to adjust these after initialization for further control.
	 * 
	 * @param  {WebGLContext}  context the context for management
	 * @param  {Boolean} isStatic      a hint as to whether this geometry is static
	 * @param  {[type]}  numVerts      [description]
	 * @param  {[type]}  numIndices    [description]
	 * @param  {[type]}  vertexAttribs [description]
	 * @return {[type]}                [description]
	 */
	initialize: function Mesh(context, isStatic, numVerts, numIndices, vertexAttribs) {
		if (typeof context !== "object")
			throw "GL context not specified to Mesh";
		if (!numVerts)
			throw "numVerts not specified, must be > 0";

		this.context = context;
		this.gl = context.gl;
		
		this.numVerts = null;
		this.numIndices = null;
		
		this.vertices = null;
		this.indices = null;
		this.vertexBuffer = null;
		this.indexBuffer = null;

		this.verticesDirty = true;
		this.indicesDirty = true;
		this.indexUsage = null;
		this.vertexUsage = null;

		/** 
		 * @property
		 * @private
		 */
		this._vertexAttribs = null;

		/** 
		 * @property
		 * @private
		 */
		this._vertexStride = null;

		this.numVerts = numVerts;
		this.numIndices = numIndices || 0;
		this.vertexUsage = isStatic ? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW;
		this.indexUsage  = isStatic ? this.gl.STATIC_DRAW : this.gl.DYNAMIC_DRAW;
		this._vertexAttribs = vertexAttribs || [];
		
		this.indicesDirty = true;
		this.verticesDirty = true;

		//determine the vertex stride based on given attributes
		var totalNumComponents = 0;
		for (var i=0; i<this._vertexAttribs.length; i++)
			totalNumComponents += this._vertexAttribs[i].offsetCount;
		this._vertexStride = totalNumComponents * 4; // in bytes

		this.vertices = new Float32Array(this.numVerts);
		this.indices = new Uint16Array(this.numIndices);

		//add this VBO to the managed cache
		this.context.addManagedObject(this);

		this.create();
	},

	//recreates the buffers on context loss
	create: function() {
		this.gl = this.context.gl;
		var gl = this.gl;
		this.vertexBuffer = gl.createBuffer();

		//ignore index buffer if we haven't specified any
		this.indexBuffer = this.numIndices > 0
					? gl.createBuffer()
					: null;

		this.dirty = true;
	},

	destroy: function() {
		this.vertices = [];
		this.indices = [];
		if (this.vertexBuffer && this.gl)
			this.gl.deleteBuffer(this.vertexBuffer);
		if (this.indexBuffer && this.gl)
			this.gl.deleteBuffer(this.indexBuffer);
		this.vertexBuffer = null;
		this.indexBuffer = null;
		if (this.context)
			this.context.removeManagedObject(this);
		this.gl = null;
		this.context = null;
	},

	_updateBuffers: function(ignoreBind, subDataLength) {
		var gl = this.gl;

		//bind our index data, if we have any
		if (this.numIndices > 0) {
			if (!ignoreBind)
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);

			//update the index data
			if (this.indicesDirty) {
				gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, this.indexUsage);
				this.indicesDirty = false;
			}
		}

		//bind our vertex data
		if (!ignoreBind)
			gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);

		//update our vertex data
		if (this.verticesDirty) {
			if (subDataLength) {
				// TODO: When decoupling VBO/IBO be sure to give better subData support..
				var view = this.vertices.subarray(0, subDataLength);
				gl.bufferSubData(gl.ARRAY_BUFFER, 0, view);
			} else {
				gl.bufferData(gl.ARRAY_BUFFER, this.vertices, this.vertexUsage);	
			}

			
			this.verticesDirty = false;
		}
	},

	draw: function(primitiveType, count, offset, subDataLength) {
		if (count === 0)
			return;

		var gl = this.gl;
		
		offset = offset || 0;

		//binds and updates our buffers. pass ignoreBind as true
		//to avoid binding unnecessarily
		this._updateBuffers(true, subDataLength);

		if (this.numIndices > 0) { 
			gl.drawElements(primitiveType, count, 
						gl.UNSIGNED_SHORT, offset * 2); //* Uint16Array.BYTES_PER_ELEMENT
		} else
			gl.drawArrays(primitiveType, offset, count);
	},

	//binds this mesh's vertex attributes for the given shader
	bind: function(shader) {
		var gl = this.gl;

		var offset = 0;
		var stride = this._vertexStride;

		//bind and update our vertex data before binding attributes
		this._updateBuffers();

		//for each attribtue
		for (var i=0; i<this._vertexAttribs.length; i++) {
			var a = this._vertexAttribs[i];

			//location of the attribute
			var loc = a.location === null 
					? shader.getAttributeLocation(a.name)
					: a.location;

			//TODO: We may want to skip unfound attribs
			// if (loc!==0 && !loc)
			// 	console.warn("WARN:", a.name, "is not enabled");

			//first, enable the vertex array
			gl.enableVertexAttribArray(loc);

			//then specify our vertex format
			gl.vertexAttribPointer(loc, a.numComponents, a.type || gl.FLOAT, 
								   a.normalize, stride, offset);

			//and increase the offset...
			offset += a.offsetCount * 4; //in bytes
		}
	},

	unbind: function(shader) {
		var gl = this.gl;

		//for each attribtue
		for (var i=0; i<this._vertexAttribs.length; i++) {
			var a = this._vertexAttribs[i];

			//location of the attribute
			var loc = a.location === null 
					? shader.getAttributeLocation(a.name)
					: a.location;

			//first, enable the vertex array
			gl.disableVertexAttribArray(loc);
		}
	}
});

Mesh.Attrib = new Class({

	name: null,
	numComponents: null,
	location: null,
	type: null,

	/**
	 * Location is optional and for advanced users that
	 * want vertex arrays to match across shaders. Any non-numerical
	 * value will be converted to null, and ignored. If a numerical
	 * value is given, it will override the position of this attribute
	 * when given to a mesh.
	 * 
	 * @param  {[type]} name          [description]
	 * @param  {[type]} numComponents [description]
	 * @param  {[type]} location      [description]
	 * @return {[type]}               [description]
	 */
	initialize: function(name, numComponents, location, type, normalize, offsetCount) {
		this.name = name;
		this.numComponents = numComponents;
		this.location = typeof location === "number" ? location : null;
		this.type = type;
		this.normalize = Boolean(normalize);
		this.offsetCount = typeof offsetCount === "number" ? offsetCount : this.numComponents;
	}
})


module.exports = Mesh;
},{"klasse":15}],13:[function(require,module,exports){
/**
 * @module kami
 */

var Class = require('klasse');


var ShaderProgram = new Class({
	
	/**
	 * Creates a new ShaderProgram from the given source, and an optional map of attribute
	 * locations as <name, index> pairs.
	 *
	 * _Note:_ Chrome version 31 was giving me issues with attribute locations -- you may
	 * want to omit this to let the browser pick the locations for you.	
	 *
	 * @class  ShaderProgram
	 * @constructor
	 * @param  {WebGLContext} context      the context to manage this object
	 * @param  {String} vertSource         the vertex shader source
	 * @param  {String} fragSource         the fragment shader source
	 * @param  {Object} attributeLocations the attribute locations
	 */
	initialize: function ShaderProgram(context, vertSource, fragSource, attributeLocations) {
		if (!vertSource || !fragSource)
			throw "vertex and fragment shaders must be defined";
		if (typeof context !== "object")
			throw "GL context not specified to ShaderProgram";
		this.context = context;

		this.vertShader = null;
		this.fragShader = null;
		this.program = null;
		this.log = "";

		this.uniformCache = null;
		this.attributeCache = null;

		this.attributeLocations = attributeLocations;

		//We trim (ECMAScript5) so that the GLSL line numbers are
		//accurate on shader log
		this.vertSource = vertSource.trim();
		this.fragSource = fragSource.trim();

		//Adds this shader to the context, to be managed
		this.context.addManagedObject(this);

		this.create();
	},

	/** 
	 * This is called during the ShaderProgram constructor,
	 * and may need to be called again after context loss and restore.
	 * 
	 * @method  create
	 */
	create: function() {
		this.gl = this.context.gl;
		this._compileShaders();
	},

	//Compiles the shaders, throwing an error if the program was invalid.
	_compileShaders: function() {
		var gl = this.gl; 
		
		this.log = "";

		this.vertShader = this._loadShader(gl.VERTEX_SHADER, this.vertSource);
		this.fragShader = this._loadShader(gl.FRAGMENT_SHADER, this.fragSource);

		if (!this.vertShader || !this.fragShader)
			throw "Error returned when calling createShader";

		this.program = gl.createProgram();

		gl.attachShader(this.program, this.vertShader);
		gl.attachShader(this.program, this.fragShader);
	
		//TODO: This seems not to be working on my OSX -- maybe a driver bug?
		if (this.attributeLocations) {
			for (var key in this.attributeLocations) {
				if (this.attributeLocations.hasOwnProperty(key)) {
					gl.bindAttribLocation(this.program, Math.floor(this.attributeLocations[key]), key);
				}
			}
		}

		gl.linkProgram(this.program); 

		this.log += gl.getProgramInfoLog(this.program) || "";

		if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
			throw "Error linking the shader program:\n"
				+ this.log;
		}

		this._fetchUniforms();
		this._fetchAttributes();
	},

	_fetchUniforms: function() {
		var gl = this.gl;

		this.uniformCache = {};

		var len = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
		if (!len) //null or zero
			return;

		for (var i=0; i<len; i++) {
			var info = gl.getActiveUniform(this.program, i);
			if (info === null) 
				continue;
			var name = info.name;
			var location = gl.getUniformLocation(this.program, name);
			
			this.uniformCache[name] = {
				size: info.size,
				type: info.type,
				location: location
			};
		}
	},

	_fetchAttributes: function() { 
		var gl = this.gl; 

		this.attributeCache = {};

		var len = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
		if (!len) //null or zero
			return;	

		for (var i=0; i<len; i++) {
			var info = gl.getActiveAttrib(this.program, i);
			if (info === null) 
				continue;
			var name = info.name;

			//the attrib location is a simple index
			var location = gl.getAttribLocation(this.program, name);
			
			this.attributeCache[name] = {
				size: info.size,
				type: info.type,
				location: location
			};
		}
	},

	_loadShader: function(type, source) {
		var gl = this.gl;

		var shader = gl.createShader(type);
		if (!shader) //should not occur...
			return -1;

		gl.shaderSource(shader, source);
		gl.compileShader(shader);
		
		var logResult = gl.getShaderInfoLog(shader) || "";
		if (logResult) {
			//we do this so the user knows which shader has the error
			var typeStr = (type === gl.VERTEX_SHADER) ? "vertex" : "fragment";
			logResult = "Error compiling "+ typeStr+ " shader:\n"+logResult;
		}

		this.log += logResult;

		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
			throw this.log;
		}
		return shader;
	},

	/**
	 * Called to bind this shader. Note that there is no "unbind" since
	 * technically such a thing is not possible in the programmable pipeline.
	 *
	 * You must bind a shader before settings its uniforms.
	 * 
	 * @method bind
	 */
	bind: function() {
		this.gl.useProgram(this.program);
	},


	/**
	 * Destroys this shader and its resources. You should not try to use this
	 * after destroying it.
	 * @method  destroy
	 */
	destroy: function() {
		if (this.context)
			this.context.removeManagedObject(this);

		if (this.gl) {
			var gl = this.gl;
			gl.detachShader(this.vertShader);
			gl.detachShader(this.fragShader);

			gl.deleteShader(this.vertShader);
			gl.deleteShader(this.fragShader);
			gl.deleteProgram(this.program);
		}
		this.attributeCache = null;
		this.uniformCache = null;
		this.vertShader = null;
		this.fragShader = null;
		this.program = null;
		this.gl = null;
		this.context = null;
	},


	/**
	 * Returns the cached uniform info (size, type, location).
	 * If the uniform is not found in the cache, it is assumed
	 * to not exist, and this method returns null.
	 *
	 * This may return null even if the uniform is defined in GLSL:
	 * if it is _inactive_ (i.e. not used in the program) then it may
	 * be optimized out.
	 *
	 * @method  getUniformInfo
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {Object} an object containing location, size, and type
	 */
	getUniformInfo: function(name) {
		return this.uniformCache[name] || null; 
	},

	/**
	 * Returns the cached attribute info (size, type, location).
	 * If the attribute is not found in the cache, it is assumed
	 * to not exist, and this method returns null.
	 *
	 * This may return null even if the attribute is defined in GLSL:
	 * if it is _inactive_ (i.e. not used in the program or disabled) 
	 * then it may be optimized out.
	 *
	 * @method  getAttributeInfo
	 * @param  {String} name the attribute name as defined in GLSL
	 * @return {object} an object containing location, size and type
	 */
	getAttributeInfo: function(name) {
		return this.attributeCache[name] || null; 
	},


	/**
	 * Returns the cached uniform location object.
	 * If the uniform is not found, this method returns null.
	 *
	 * @method  getAttributeLocation
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {GLint} the location object
	 */
	getAttributeLocation: function(name) { //TODO: make faster, don't cache
		var info = this.getAttributeInfo(name);
		return info ? info.location : null;
	},

	/**
	 * Returns the cached uniform location object, assuming it exists
	 * and is active. Note that uniforms may be inactive if 
	 * the GLSL compiler deemed them unused.
	 *
	 * @method  getUniformLocation
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {WebGLUniformLocation} the location object
	 */
	getUniformLocation: function(name) {
		var info = this.getUniformInfo(name);
		return info ? info.location : null;
	},

	/**
	 * Returns true if the uniform is active and found in this
	 * compiled program. Note that uniforms may be inactive if 
	 * the GLSL compiler deemed them unused.
	 *
	 * @method  hasUniform
	 * @param  {String}  name the uniform name
	 * @return {Boolean} true if the uniform is found and active
	 */
	hasUniform: function(name) {
		return this.getUniformInfo(name) !== null;
	},

	/**
	 * Returns true if the attribute is active and found in this
	 * compiled program.
	 *
	 * @method  hasAttribute
	 * @param  {String}  name the attribute name
	 * @return {Boolean} true if the attribute is found and active
	 */
	hasAttribute: function(name) {
		return this.getAttributeInfo(name) !== null;
	},

	/**
	 * Returns the uniform value by name.
	 *
	 * @method  getUniform
	 * @param  {String} name the uniform name as defined in GLSL
	 * @return {any} The value of the WebGL uniform
	 */
	getUniform: function(name) {
		return this.gl.getUniform(this.program, this.getUniformLocation(name));
	},

	/**
	 * Returns the uniform value at the specified WebGLUniformLocation.
	 *
	 * @method  getUniformAt
	 * @param  {WebGLUniformLocation} location the location object
	 * @return {any} The value of the WebGL uniform
	 */
	getUniformAt: function(location) {
		return this.gl.getUniform(this.program, location);
	},

	/**
	 * A convenience method to set uniformi from the given arguments.
	 * We determine which GL call to make based on the number of arguments
	 * passed. For example, `setUniformi("var", 0, 1)` maps to `gl.uniform2i`.
	 * 
	 * @method  setUniformi
	 * @param {String} name        		the name of the uniform
	 * @param {GLint} x  the x component for ints
	 * @param {GLint} y  the y component for ivec2
	 * @param {GLint} z  the z component for ivec3
	 * @param {GLint} w  the w component for ivec4
	 */
	setUniformi: function(name, x, y, z, w) {
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (arguments.length) {
			case 2: gl.uniform1i(loc, x); return true;
			case 3: gl.uniform2i(loc, x, y); return true;
			case 4: gl.uniform3i(loc, x, y, z); return true;
			case 5: gl.uniform4i(loc, x, y, z, w); return true;
			default:
				throw "invalid arguments to setUniformi"; 
		}
	},

	/**
	 * A convenience method to set uniformf from the given arguments.
	 * We determine which GL call to make based on the number of arguments
	 * passed. For example, `setUniformf("var", 0, 1)` maps to `gl.uniform2f`.
	 * 
	 * @method  setUniformf
	 * @param {String} name        		the name of the uniform
	 * @param {GLfloat} x  the x component for floats
	 * @param {GLfloat} y  the y component for vec2
	 * @param {GLfloat} z  the z component for vec3
	 * @param {GLfloat} w  the w component for vec4
	 */
	setUniformf: function(name, x, y, z, w) {
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (arguments.length) {
			case 2: gl.uniform1f(loc, x); return true;
			case 3: gl.uniform2f(loc, x, y); return true;
			case 4: gl.uniform3f(loc, x, y, z); return true;
			case 5: gl.uniform4f(loc, x, y, z, w); return true;
			default:
				throw "invalid arguments to setUniformf"; 
		}
	},

	//I guess we won't support sequence<GLfloat> .. whatever that is ??
	

	///// 
	
	/**
	 * A convenience method to set uniformNfv from the given ArrayBuffer.
	 * We determine which GL call to make based on the length of the array 
	 * buffer (for 1-4 component vectors stored in a Float32Array). To use
	 * this method to upload data to uniform arrays, you need to specify the
	 * 'count' parameter; i.e. the data type you are using for that array. If
	 * specified, this will dictate whether to call uniform1fv, uniform2fv, etc.
	 *
	 * @method  setUniformfv
	 * @param {String} name        		the name of the uniform
	 * @param {ArrayBuffer} arrayBuffer the array buffer
	 * @param {Number} count            optional, the explicit data type count, e.g. 2 for vec2
	 */
	setUniformfv: function(name, arrayBuffer, count) {
		count = count || arrayBuffer.length;
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (count) {
			case 1: gl.uniform1fv(loc, arrayBuffer); return true;
			case 2: gl.uniform2fv(loc, arrayBuffer); return true;
			case 3: gl.uniform3fv(loc, arrayBuffer); return true;
			case 4: gl.uniform4fv(loc, arrayBuffer); return true;
			default:
				throw "invalid arguments to setUniformf"; 
		}
	},

	/**
	 * A convenience method to set uniformNiv from the given ArrayBuffer.
	 * We determine which GL call to make based on the length of the array 
	 * buffer (for 1-4 component vectors stored in a int array). To use
	 * this method to upload data to uniform arrays, you need to specify the
	 * 'count' parameter; i.e. the data type you are using for that array. If
	 * specified, this will dictate whether to call uniform1fv, uniform2fv, etc.
	 *
	 * @method  setUniformiv
	 * @param {String} name        		the name of the uniform
	 * @param {ArrayBuffer} arrayBuffer the array buffer
	 * @param {Number} count            optional, the explicit data type count, e.g. 2 for ivec2
	 */
	setUniformiv: function(name, arrayBuffer, count) {
		count = count || arrayBuffer.length;
		var gl = this.gl;
		var loc = this.getUniformLocation(name);
		if (!loc) 
			return false;
		switch (count) {
			case 1: gl.uniform1iv(loc, arrayBuffer); return true;
			case 2: gl.uniform2iv(loc, arrayBuffer); return true;
			case 3: gl.uniform3iv(loc, arrayBuffer); return true;
			case 4: gl.uniform4iv(loc, arrayBuffer); return true;
			default:
				throw "invalid arguments to setUniformf"; 
		}
	}
});

module.exports = ShaderProgram;
},{"klasse":15}],14:[function(require,module,exports){
/**
  Auto-generated Kami index file.
  Created on 2013-12-23.
*/
module.exports = {
    //core classes
    'BaseBatch':       require('./BaseBatch.js'),
    'SpriteBatch':     require('./SpriteBatch.js'),
    'Texture':         require('./Texture.js'),
    'TextureRegion':   require('./TextureRegion.js'),
    'WebGLContext':    require('./WebGLContext.js'),
    'FrameBuffer':     require('./glutils/FrameBuffer.js'),
    'Mesh':            require('./glutils/Mesh.js'),
    'ShaderProgram':   require('./glutils/ShaderProgram.js')
};
},{"./BaseBatch.js":6,"./SpriteBatch.js":7,"./Texture.js":8,"./TextureRegion.js":9,"./WebGLContext.js":10,"./glutils/FrameBuffer.js":11,"./glutils/Mesh.js":12,"./glutils/ShaderProgram.js":13}],15:[function(require,module,exports){
module.exports=require(5)
},{}],16:[function(require,module,exports){
var int8 = new Int8Array(4);
var int32 = new Int32Array(int8.buffer, 0, 1);
var float32 = new Float32Array(int8.buffer, 0, 1);

/**
 * A singleton for number utilities. 
 * @class NumberUtil
 */
var NumberUtil = function() {

};


/**
 * Returns a float representation of the given int bits. ArrayBuffer
 * is used for the conversion.
 *
 * @method  intBitsToFloat
 * @static
 * @param  {Number} i the int to cast
 * @return {Number}   the float
 */
NumberUtil.intBitsToFloat = function(i) {
	int32[0] = i;
	return float32[0];
};

/**
 * Returns the int bits from the given float. ArrayBuffer is used
 * for the conversion.
 *
 * @method  floatToIntBits
 * @static
 * @param  {Number} f the float to cast
 * @return {Number}   the int bits
 */
NumberUtil.floatToIntBits = function(f) {
	float32[0] = f;
	return int32[0];
};

/**
 * Encodes ABGR int as a float, with slight precision loss.
 *
 * @method  intToFloatColor
 * @static
 * @param {Number} value an ABGR packed integer
 */
NumberUtil.intToFloatColor = function(value) {
	return NumberUtil.intBitsToFloat( value & 0xfeffffff );
};

/**
 * Returns a float encoded ABGR value from the given RGBA
 * bytes (0 - 255). Useful for saving bandwidth in vertex data.
 *
 * @method  colorToFloat
 * @static
 * @param {Number} r the Red byte (0 - 255)
 * @param {Number} g the Green byte (0 - 255)
 * @param {Number} b the Blue byte (0 - 255)
 * @param {Number} a the Alpha byte (0 - 255)
 * @return {Float32}  a Float32 of the RGBA color
 */
NumberUtil.colorToFloat = function(r, g, b, a) {
	var bits = (a << 24 | b << 16 | g << 8 | r);
	return NumberUtil.intToFloatColor(bits);
};

/**
 * Returns true if the number is a power-of-two.
 *
 * @method  isPowerOfTwo
 * @param  {Number}  n the number to test
 * @return {Boolean}   true if power-of-two
 */
NumberUtil.isPowerOfTwo = function(n) {
	return (n & (n - 1)) == 0;
};

/**
 * Returns the next highest power-of-two from the specified number. 
 * 
 * @param  {Number} n the number to test
 * @return {Number}   the next highest power of two
 */
NumberUtil.nextPowerOfTwo = function(n) {
	n--;
	n |= n >> 1;
	n |= n >> 2;
	n |= n >> 4;
	n |= n >> 8;
	n |= n >> 16;
	return n+1;
};

module.exports = NumberUtil;
},{}],17:[function(require,module,exports){
module.exports=require(4)
},{}],18:[function(require,module,exports){
/*
 * raf.js
 * https://github.com/ngryman/raf.js
 *
 * original requestAnimationFrame polyfill by Erik Möller
 * inspired from paul_irish gist and post
 *
 * Copyright (c) 2013 ngryman
 * Licensed under the MIT license.
 */

(function(window) {
	var lastTime = 0,
		vendors = ['webkit', 'moz'],
		requestAnimationFrame = window.requestAnimationFrame,
		cancelAnimationFrame = window.cancelAnimationFrame,
		i = vendors.length;

	// try to un-prefix existing raf
	while (--i >= 0 && !requestAnimationFrame) {
		requestAnimationFrame = window[vendors[i] + 'RequestAnimationFrame'];
		cancelAnimationFrame = window[vendors[i] + 'CancelAnimationFrame'];
	}

	// polyfill with setTimeout fallback
	// heavily inspired from @darius gist mod: https://gist.github.com/paulirish/1579671#comment-837945
	if (!requestAnimationFrame || !cancelAnimationFrame) {
		requestAnimationFrame = function(callback) {
			var now = Date.now(), nextTime = Math.max(lastTime + 16, now);
			return setTimeout(function() {
				callback(lastTime = nextTime);
			}, nextTime - now);
		};

		cancelAnimationFrame = clearTimeout;
	}

	// export to window
	window.requestAnimationFrame = requestAnimationFrame;
	window.cancelAnimationFrame = cancelAnimationFrame;
}(window));
},{}],19:[function(require,module,exports){
var domready = require('domready');

var WebGLContext = require('kami').WebGLContext;
var Texture = require('kami').Texture;
var SpriteBatch = require('kami').SpriteBatch;

//include the kami-specific AssetLoader
var AssetLoader = require('kami-assets');

//include polyfill for requestAnimationFrame
require('raf.js');

domready(function() {
    //Create a new WebGL canvas with the given size
    var context = new WebGLContext(256, 256);

    //the 'view' is the DOM canvas, so we can just append it to our body
    document.body.appendChild( context.view );

    //We use SpriteBatch to draw textures as 2D quads
    var batch = new SpriteBatch(context);
    
    //pass the context to the asset loader so it can be managed correctly 
    var assets = new AssetLoader(context);
    
    //add some DOM text
    var text = document.createElement("div");
    document.body.appendChild(text);

    //add some listeners...
    assets.loadStarted.add(function(ev) {
        text.innerHTML = "Load started";
    });
    assets.loadProgress.add(function(ev) {
        text.innerHTML = "Progress: "+ev.current + " / " + ev.total;
    });
    assets.loadFinished.add(function(ev) {
        text.innerHTML = "Load finished";
    })

    //These return a Texture object
    var scene = assets.add("img/scene.png");
    var grass = assets.add("img/grass.png");
    var guy   = assets.add("img/guy.png");
    grass.setFilter(Texture.Filter.LINEAR);
    //make the queue a bit longer...
    var tex = new Texture(context);
    for (var i=0; i<50; i++) {
        //we can specify a key, URL, and reusable Texture object to act on
        //We specify a filename so it can find the image loader easily
        assets.add("img"+i+".png", "img/grass.png", tex);
    }

    function render() {
        requestAnimationFrame(render);
        //get the GL rendering context
        var gl = context.gl;

        //clear canvas with opaque black
        gl.clearColor(0,0,0,1);
        gl.clear(gl.COLOR_BUFFER_BIT);            

        //this will start loading the next task on the queue,
        //and only returns true once all assets have finished loading
        if ( assets.update() ) {
            batch.begin();
            batch.draw(grass, 0, 0);
            batch.draw(guy, 25, 25, guy.width*2, guy.height*2);
            batch.end();
        } 
    }

    //Here we can simulate context loss / restore and how it plays with AssetLoader
    var loseCtx = context.gl.getExtension("WEBGL_lose_context");
    if (loseCtx) {
        var desc = document.createElement("div");
        desc.innerHTML = "Click the canvas to simulate context loss";
        document.body.appendChild(desc);

        context.view.addEventListener("mousedown", function() {
            loseCtx.loseContext();
            context.view.style.visibility = "hidden";
            text.style.visibility = "hidden";

            setTimeout(function() {
                context.view.style.visibility = "visible";
                text.style.visibility = "visible";
                loseCtx.restoreContext();
            }, 1000);
        }, true);
    }

    requestAnimationFrame(render);
});
},{"domready":1,"kami":14,"kami-assets":2,"raf.js":18}]},{},[19])
//@ sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlcyI6WyIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMvZG9tcmVhZHkvcmVhZHkuanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS1hc3NldHMvaW5kZXguanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS1hc3NldHMvbm9kZV9tb2R1bGVzL2Fzc2V0bG9hZGVyL2luZGV4LmpzIiwiL3Byb2plY3RzL25wbXV0aWxzL2thbWktZGVtb3Mvbm9kZV9tb2R1bGVzL2thbWktYXNzZXRzL25vZGVfbW9kdWxlcy9hc3NldGxvYWRlci9ub2RlX21vZHVsZXMvc2lnbmFscy9kaXN0L3NpZ25hbHMuanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS1hc3NldHMvbm9kZV9tb2R1bGVzL2tsYXNzZS9pbmRleC5qcyIsIi9wcm9qZWN0cy9ucG11dGlscy9rYW1pLWRlbW9zL25vZGVfbW9kdWxlcy9rYW1pL2xpYi9CYXNlQmF0Y2guanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS9saWIvU3ByaXRlQmF0Y2guanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS9saWIvVGV4dHVyZS5qcyIsIi9wcm9qZWN0cy9ucG11dGlscy9rYW1pLWRlbW9zL25vZGVfbW9kdWxlcy9rYW1pL2xpYi9UZXh0dXJlUmVnaW9uLmpzIiwiL3Byb2plY3RzL25wbXV0aWxzL2thbWktZGVtb3Mvbm9kZV9tb2R1bGVzL2thbWkvbGliL1dlYkdMQ29udGV4dC5qcyIsIi9wcm9qZWN0cy9ucG11dGlscy9rYW1pLWRlbW9zL25vZGVfbW9kdWxlcy9rYW1pL2xpYi9nbHV0aWxzL0ZyYW1lQnVmZmVyLmpzIiwiL3Byb2plY3RzL25wbXV0aWxzL2thbWktZGVtb3Mvbm9kZV9tb2R1bGVzL2thbWkvbGliL2dsdXRpbHMvTWVzaC5qcyIsIi9wcm9qZWN0cy9ucG11dGlscy9rYW1pLWRlbW9zL25vZGVfbW9kdWxlcy9rYW1pL2xpYi9nbHV0aWxzL1NoYWRlclByb2dyYW0uanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS9saWIvaW5kZXguanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMva2FtaS9ub2RlX21vZHVsZXMvbnVtYmVyLXV0aWwvaW5kZXguanMiLCIvcHJvamVjdHMvbnBtdXRpbHMva2FtaS1kZW1vcy9ub2RlX21vZHVsZXMvcmFmLmpzL3JhZi5qcyIsIi9wcm9qZWN0cy9ucG11dGlscy9rYW1pLWRlbW9zL3NyYy9hc3NldHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6bUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzljQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL21CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOU9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2S0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzViQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsInNvdXJjZXNDb250ZW50IjpbIi8qIVxuICAqIGRvbXJlYWR5IChjKSBEdXN0aW4gRGlheiAyMDEyIC0gTGljZW5zZSBNSVRcbiAgKi9cbiFmdW5jdGlvbiAobmFtZSwgZGVmaW5pdGlvbikge1xuICBpZiAodHlwZW9mIG1vZHVsZSAhPSAndW5kZWZpbmVkJykgbW9kdWxlLmV4cG9ydHMgPSBkZWZpbml0aW9uKClcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmIHR5cGVvZiBkZWZpbmUuYW1kID09ICdvYmplY3QnKSBkZWZpbmUoZGVmaW5pdGlvbilcbiAgZWxzZSB0aGlzW25hbWVdID0gZGVmaW5pdGlvbigpXG59KCdkb21yZWFkeScsIGZ1bmN0aW9uIChyZWFkeSkge1xuXG4gIHZhciBmbnMgPSBbXSwgZm4sIGYgPSBmYWxzZVxuICAgICwgZG9jID0gZG9jdW1lbnRcbiAgICAsIHRlc3RFbCA9IGRvYy5kb2N1bWVudEVsZW1lbnRcbiAgICAsIGhhY2sgPSB0ZXN0RWwuZG9TY3JvbGxcbiAgICAsIGRvbUNvbnRlbnRMb2FkZWQgPSAnRE9NQ29udGVudExvYWRlZCdcbiAgICAsIGFkZEV2ZW50TGlzdGVuZXIgPSAnYWRkRXZlbnRMaXN0ZW5lcidcbiAgICAsIG9ucmVhZHlzdGF0ZWNoYW5nZSA9ICdvbnJlYWR5c3RhdGVjaGFuZ2UnXG4gICAgLCByZWFkeVN0YXRlID0gJ3JlYWR5U3RhdGUnXG4gICAgLCBsb2FkZWRSZ3ggPSBoYWNrID8gL15sb2FkZWR8XmMvIDogL15sb2FkZWR8Yy9cbiAgICAsIGxvYWRlZCA9IGxvYWRlZFJneC50ZXN0KGRvY1tyZWFkeVN0YXRlXSlcblxuICBmdW5jdGlvbiBmbHVzaChmKSB7XG4gICAgbG9hZGVkID0gMVxuICAgIHdoaWxlIChmID0gZm5zLnNoaWZ0KCkpIGYoKVxuICB9XG5cbiAgZG9jW2FkZEV2ZW50TGlzdGVuZXJdICYmIGRvY1thZGRFdmVudExpc3RlbmVyXShkb21Db250ZW50TG9hZGVkLCBmbiA9IGZ1bmN0aW9uICgpIHtcbiAgICBkb2MucmVtb3ZlRXZlbnRMaXN0ZW5lcihkb21Db250ZW50TG9hZGVkLCBmbiwgZilcbiAgICBmbHVzaCgpXG4gIH0sIGYpXG5cblxuICBoYWNrICYmIGRvYy5hdHRhY2hFdmVudChvbnJlYWR5c3RhdGVjaGFuZ2UsIGZuID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICgvXmMvLnRlc3QoZG9jW3JlYWR5U3RhdGVdKSkge1xuICAgICAgZG9jLmRldGFjaEV2ZW50KG9ucmVhZHlzdGF0ZWNoYW5nZSwgZm4pXG4gICAgICBmbHVzaCgpXG4gICAgfVxuICB9KVxuXG4gIHJldHVybiAocmVhZHkgPSBoYWNrID9cbiAgICBmdW5jdGlvbiAoZm4pIHtcbiAgICAgIHNlbGYgIT0gdG9wID9cbiAgICAgICAgbG9hZGVkID8gZm4oKSA6IGZucy5wdXNoKGZuKSA6XG4gICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdGVzdEVsLmRvU2Nyb2xsKCdsZWZ0JylcbiAgICAgICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgcmVhZHkoZm4pIH0sIDUwKVxuICAgICAgICAgIH1cbiAgICAgICAgICBmbigpXG4gICAgICAgIH0oKVxuICAgIH0gOlxuICAgIGZ1bmN0aW9uIChmbikge1xuICAgICAgbG9hZGVkID8gZm4oKSA6IGZucy5wdXNoKGZuKVxuICAgIH0pXG59KVxuIiwiLy9UaGlzIGlzIGFuIGFzc2V0IGxvYWRlciBxdWV1ZSB0YWlsb3JlZCBmb3IgS2FtaS9XZWJHTFxuXG52YXIgTG9hZGVyQmFzZSA9IHJlcXVpcmUoJ2Fzc2V0bG9hZGVyJyk7XG52YXIgQ2xhc3MgPSByZXF1aXJlKCdrbGFzc2UnKTtcbnZhciBUZXh0dXJlID0gcmVxdWlyZSgna2FtaScpLlRleHR1cmU7XG5cbi8vdGhpcyBpcyBhIGthbWktc3BlY2lmaWMgbG9hZGVyIGZvciBhIFRleHR1cmUgb2JqZWN0XG4vL2l0IGlzIGFzc3VtZWQgdGhhdCB0aGUgQXNzZXRNYW5hZ2VyIGJlaW5nIHBhc3NlZCBpcyBhIFdlYkdMQ29udGV4dFxuZnVuY3Rpb24gVGV4dHVyZUxvYWRlcihuYW1lLCBwYXRoLCB0ZXh0dXJlLCBnZW5NaXBtYXBzKSB7XG4gICAgcGF0aCA9IHBhdGggfHwgbmFtZTtcblxuICAgIHRleHR1cmUgPSB0ZXh0dXJlIHx8IG5ldyBUZXh0dXJlKHRoaXMuY29udGV4dCk7XG4gICAgXG4gICAgcmV0dXJuIHtcblxuICAgICAgICB2YWx1ZTogdGV4dHVyZSxcblxuICAgICAgICBsb2FkOiBmdW5jdGlvbihvbkNvbXBsZXRlLCBvbkVycm9yKSB7XG4gICAgICAgICAgICAvL1RleHR1cmUgaGFzIGEgaGFuZHkgZnVuY3Rpb24gZm9yIHRoaXMgc29ydCBvZiB0aGluZy4uLlxuICAgICAgICAgICAgdGV4dHVyZS5zZXR1cChwYXRoLCBvbkNvbXBsZXRlLCBvbkVycm9yLCBnZW5NaXBtYXBzKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuLy9TZXR1cCBsb2FkZXIgcGFyYW1ldGVyc1xuVGV4dHVyZUxvYWRlci5leHRlbnNpb25zID0gW1wicG5nXCIsIFwiZ2lmXCIsIFwianBnXCIsIFwianBlZ1wiXTtcblRleHR1cmVMb2FkZXIubWVkaWFUeXBlID0gXCJpbWFnZVwiO1xuXG52YXIgQXNzZXRMb2FkZXIgPSBuZXcgQ2xhc3Moe1xuXG4gICAgRXh0ZW5kczogTG9hZGVyQmFzZSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKGNvbnRleHQpIHtcbiAgICAgICAgTG9hZGVyQmFzZS5jYWxsKHRoaXMpO1xuXG4gICAgICAgIGlmICghY29udGV4dClcbiAgICAgICAgICAgIHRocm93IFwiS2FtaSBBc3NldExvYWRlciBtdXN0IGJlIHBhc3NlZCB3aXRoIGEgdmFsaWQgV2ViR0xDb250ZXh0XCI7XG5cbiAgICAgICAgdGhpcy5yZWdpc3RlckxvYWRlcihUZXh0dXJlTG9hZGVyKTtcblxuICAgICAgICB0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuICAgICAgICB0aGlzLl9faW52YWxpZGF0ZUZ1bmMgPSB0aGlzLmludmFsaWRhdGUuYmluZCh0aGlzKTtcbiAgICAgICAgdGhpcy5jb250ZXh0LnJlc3RvcmVkLmFkZCggdGhpcy5fX2ludmFsaWRhdGVGdW5jICk7XG4gICAgfSxcblxuICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgICAgICB0aGlzLmNvbnRleHQucmVzdG9yZWQucmVtb3ZlKHRoaXMuX19pbnZhbGlkYXRlRnVuYyk7XG4gICAgfVxufSk7XG5cbi8vQ29weSBzdGF0aWMgYXR0cmlidXRlcyAuLi5cbkFzc2V0TG9hZGVyLlN0YXR1cyA9IExvYWRlckJhc2UuU3RhdHVzO1xuXG5Bc3NldExvYWRlci5yZWdpc3RlckNvbW1vbkxvYWRlciA9IExvYWRlckJhc2UucmVnaXN0ZXJDb21tb25Mb2FkZXI7XG5cbkFzc2V0TG9hZGVyLkRlc2NyaXB0b3IgPSBMb2FkZXJCYXNlLkRlc2NyaXB0b3I7XG5cbkFzc2V0TG9hZGVyLlRleHR1cmVMb2FkZXIgPSBUZXh0dXJlTG9hZGVyO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2V0TG9hZGVyO1xuXG5cblxuXG5cblxuXG5cbi8vLyBvbGQgZG9jcy4gXG5cbiAgICAvKipcbiAgICAgKiBUaGlzIGlzIHRoZSBsb2FkaW5nIGZ1bmN0aW9uIG9mIGEgQXNzZXRNYW5hZ2VyIHBsdWdpbiwgXG4gICAgICogd2hpY2ggaGFuZGxlcyB0aGUgYXN5bmNocm9ub3VzIGxvYWRpbmcgZm9yIGFuIGFzc2V0LiBcbiAgICAgKiBUaGUgZnVuY3Rpb24gbXVzdCBiZSBpbXBsZW1lbnRlZCBpbiBhIHZlcnlcbiAgICAgKiBzdHJpY3QgbWFubmVyIGZvciB0aGUgYXNzZXQgbWFuYWdlciB0byB3b3JrIGNvcnJlY3RseS5cbiAgICAgKlxuICAgICAqIE9uY2UgdGhlIGFzeW5jIGxvYWRpbmcgaXMgZG9uZSwgeW91IG11c3QgY2FsbCB0aGUgYGZpbmlzaGVkYCBjYWxsYmFja1xuICAgICAqIHRoYXQgd2FzIHBhc3NlZCB0byB0aGlzIG1ldGhvZC4gWW91IGNhbiBwYXNzIHRoZSBwYXJhbWV0ZXIgYGZhbHNlYCB0byB0aGVcbiAgICAgKiBmaW5pc2hlZCBjYWxsYmFjayB0byBpbmRpY2F0ZSB0aGUgYXN5bmMgbG9hZCBoYXMgZmFpbGVkLiBPdGhlcndpc2UsIGl0IGlzIGFzc3VtZWRcbiAgICAgKiB0byBiZSBzdWNjZXNzZnVsLlxuICAgICAqIFxuICAgICAqIElmIHlvdSBkb24ndCBpbnZva2UgdGhlIGNhbGxiYWNrLCB0aGUgYXNzZXQgbWFuYWdlciBtYXkgbmV2ZXIgZmluaXNoIGxvYWRpbmcuXG4gICAgICogXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhc3NldCB0byBsb2FkXG4gICAgICogQHBhcmFtIHtGdW5jdGlvbn0gZmluaXNoZWQgdGhlIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiBhc3luYyBsb2FkaW5nIGlzIGNvbXBsZXRlXG4gICAgICogQHBhcmFtIHtUZXh0dXJlfSB0ZXh0dXJlIHRoZSB0ZXh0dXJlIHRvIG9wZXJhdGUgb24gZm9yIHRoaXMgYXNzZXRcbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGF0aCB0aGUgb3B0aW9uYWwgaW1hZ2UgcGF0aCB0byB1c2UgaW5zdGVhZCBvZiB0aGUgYG5hbWVgIHBhcmFtZXRlclxuICAgICAqL1xuLyoqXG4gKiBUaGlzIGlzIHRoZSBkZWZhdWx0IGltcGxlbWVudGF0aW9uIG9mIGFuIGltYWdlIGxvYWRlciBwbHVnaW4gZm9yIEFzc2V0TWFuYWdlci5cbiAqIFRoaXMgdXNlcyBhIERPTSBJbWFnZSBvYmplY3QgdG8gdXBsb2FkIFBORywgR0lGIGFuZCBKUEcgaW1hZ2VzIHRvIGEgV2ViR0xcbiAqIHRleHR1cmUuIFlvdSB3aWxsIG5vdCBuZWVkIHRvIGRlYWwgd2l0aCB0aGlzIGNsYXNzIGRpcmVjdGx5LCB1bmxlc3MgeW91IHdhbnRcbiAqIHRvIHdyaXRlIHlvdXIgb3duIEFzc2V0TWFuYWdlciBsb2FkZXJzLlxuICpcbiAqIEEgTG9hZGVyIHBsdWdpbiBpcyBhIGNsYXNzIHdoaWNoIGhhbmRsZXMgdGhlIGFzeW5jaHJvbm91cyBsb2FkaW5nIGFuZCBwcm92aWRlc1xuICogYSBjb252ZW5pZW50IHJldHVybiB2YWx1ZSBmb3IgdGhlIGBBc3NldE1hbmFnZXIubG9hZCgpYCBmdW5jdGlvbnMuIFRoZSBsb2FkZXIgY2xhc3NcbiAqIGlzIGNvbnN0cnVjdGVkIHdpdGggdGhlIGZvbGxvd2luZyBwYXJhbWV0ZXJzOiBmaXJzdCwgdGhlIFdlYkdMQ29udGV4dCB0aGlzIEFzc2V0TWFuYWdlclxuICogaXMgdXNpbmcsIGFuZCBzZWNvbmQsIHRoZSBuYW1lIG9mIHRoZSBhc3NldCB0byBiZSBsb2FkZWQuIFRoZSBzdWJzZXF1ZW50IGFyZ3VtZW50cyBhcmVcbiAqIHRob3NlIHRoYXQgd2VyZSBwYXNzZWQgYXMgZXh0cmEgdG8gdGhlIGBBc3NldE1hbmFnZXIubG9hZCgpYCBmdW5jdGlvbnMuXG4gKlxuICogQSBsb2FkZXIgbXVzdCBpbXBsZW1lbnQgYSBgbG9hZCgpYCBmdW5jdGlvbiwgYW5kIGl0J3MgZW5jb3VyYWdlZCB0byBhbHNvIGltcGxlbWVudCBhIFxuICogYGdldFJldHVyblZhbHVlKClgIGZ1bmN0aW9uLCBmb3IgY29udmVuaWVuY2UuXG4gKiBcbiAqIEBwYXJhbSB7V2ViR0xDb250ZXh0fSBjb250ZXh0IHRoZSBjb250ZXh0LCBwYXNzZWQgYnkgQXNzZXRNYW5hZ2VyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgdW5pcXVlIGtleSBmb3IgdGhpcyBhc3NldFxuICogQHBhcmFtIHtTdHJpbmd9IHBhdGggdGhlIG9wdGlvbmFsIHBhdGggb3IgZGF0YSBVUkkgdG8gdXNlLCB3aWxsIGRlZmF1bHQgdG8gdGhlIG5hbWUgcGFyYW1cbiAqIEBwYXJhbSB7VGV4dHVyZX0gdGV4dHVyZSBhbiBvcHRpb25hbCB0ZXh0dXJlIHRvIGFjdCBvbjsgaWYgdW5kZWZpbmVkLCBhIG5ldyB0ZXh0dXJlXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgd2lsbCBiZSBjcmVhdGVkXG4gKi8iLCJ2YXIgQ2xhc3MgPSByZXF1aXJlKCdrbGFzc2UnKTtcbnZhciBTaWduYWwgPSByZXF1aXJlKCdzaWduYWxzJyk7XG5cbmZ1bmN0aW9uIHJlZ2lzdGVyTG9hZGVyKGxvYWRlcnMsIGxvYWRlckZ1bmMsIGV4dGVuc2lvbnMsIG1lZGlhVHlwZSkge1xuXHRpZiAoIWxvYWRlckZ1bmMgfHwgIWV4dGVuc2lvbnMgfHwgIWV4dGVuc2lvbnMubGVuZ3RoKVxuXHRcdHRocm93IFwibXVzdCBzcGVjaWZ5IGF0IGxlYXN0IG9uZSBleHRlbnNpb24gZm9yIHRoZSBsb2FkZXJcIjtcblx0XG5cdGZvciAodmFyIGk9MDsgaTxleHRlbnNpb25zLmxlbmd0aDsgaSsrKSB7XG5cdFx0bG9hZGVyc1sgZXh0ZW5zaW9uc1tpXSBdID0gbG9hZGVyRnVuYztcblx0XHRpZiAobWVkaWFUeXBlKSBcblx0XHRcdGxvYWRlcnNbIG1lZGlhVHlwZSArICcvJyArIGV4dGVuc2lvbnNbaV0gXSA9IGxvYWRlckZ1bmM7XG5cdH1cbn1cblxuLyoqXG4gKiBUaGlzIGlzIGEgYmFzZSBjbGFzcyBmb3IgYXNzZXQgbWFuYWdlbWVudDsgaWRlYWwgZm9yIGVpdGhlclxuICogZ2VuZXJpYyBIVE1MNSAyRCBjYW52YXMgb3IgV2ViR0wgY2FudmFzLlxuICogXG4gKiBAY2xhc3MgIEFzc2V0TG9hZGVyXG4gKiBAY29uc3RydWN0b3IgXG4gKi9cbnZhciBBc3NldExvYWRlciA9IG5ldyBDbGFzcyh7XG5cdFxuXHQvKipcblx0ICogQSByZWFkLW9ubHkgcHJvcGVydHkgdGhhdCBkZXNjcmliZXMgdGhlIG51bWJlciBvZiBcblx0ICogYXNzZXRzIHJlbWFpbmluZyB0byBiZSBsb2FkZWQuXG5cdCAqXG5cdCAqIEBhdHRyaWJ1dGUgcmVtYWluaW5nXG5cdCAqIEB0eXBlIHtOdW1iZXJ9XG5cdCAqIEByZWFkT25seVxuXHQgKi9cblx0cmVtYWluaW5nOiB7XG5cdFx0Z2V0OiBmdW5jdGlvbigpIHtcblx0XHRcdHJldHVybiB0aGlzLl9fbG9hZENvdW50O1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQSByZWFkLW9ubHkgcHJvcGVydHkgdGhhdCBkZXNjcmlpYmVzIHRoZSB0b3RhbFxuXHQgKiBudW1iZXIgb2YgYXNzZXRzIGluIHRoaXMgQXNzZXRMb2FkZXIuXG5cdCAqIFxuXHQgKiBAYXR0cmlidXRlIHRvdGFsXG5cdCAqIEByZWFkT25seVxuXHQgKiBAdHlwZSB7TnVtYmVyfVxuXHQgKi9cblx0dG90YWw6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX190b3RhbEl0ZW1zO1xuXHRcdH1cblx0fSxcblxuXHQvL0NvbnN0cnVjdG9yXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIEFzc2V0TG9hZGVyKCkge1xuXG5cdFx0LyoqXG5cdFx0ICogQW4gYXJyYXkgb2YgRGVzY3JpcHRvcnMgdGhhdCB0aGlzIHF1ZXVlIGlzIGhhbmRsaW5nLlxuXHRcdCAqIFRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZCBkaXJlY3RseS5cblx0XHQgKiBcblx0XHQgKiBAcHJvcGVydHkgYXNzZXRzXG5cdFx0ICogQHR5cGUge0FycmF5fVxuXHRcdCAqL1xuXHRcdHRoaXMuYXNzZXRzID0gW107XG5cblx0XHQvKipcblx0XHQgKiBUaGUgcXVldWUgb2YgdGFza3MgdG8gbG9hZC4gRWFjaCBjb250YWluc1xuXHRcdCAqIGFuXG5cdFx0ICoge3sjY3Jvc3NMaW5rIFwiQXNzZXRMb2FkZXIuRGVzY3JpcHRvclwifX17ey9jcm9zc0xpbmt9fS5cblx0XHQgKlxuXHRcdCAqIExvYWRpbmcgYSB0YXNrIHdpbGwgcG9wIGl0IG9mZiB0aGlzIGxpc3QgYW5kIGZpcmUgdGhlIGFzeW5jXG5cdFx0ICogb3Igc3luY2hyb25vdXMgcHJvY2Vzcy5cblx0XHQgKlxuXHRcdCAqIFRoaXMgc2hvdWxkIG5vdCBiZSBtb2RpZmllZCBkaXJlY3RseS5cblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB0YXNrc1xuXHRcdCAqIEBwcm90ZWN0ZWRcblx0XHQgKiBAdHlwZSB7QXJyYXl9XG5cdFx0ICovXG5cdFx0dGhpcy50YXNrcyA9IFtdO1xuXG5cdFx0Ly9Qcml2YXRlIHN0dWZmLi4uIGRvIG5vdCB0b3VjaCFcblxuXHRcdHRoaXMuX19sb2FkQ291bnQgPSAwO1xuXHRcdHRoaXMuX190b3RhbEl0ZW1zID0gMDtcblxuXHRcdC8vIFNpZ25hbHMgXG5cdFx0XG5cdFx0LyoqXG5cdFx0ICogQSBzaWduYWwgZGlzcGF0Y2hlZCB3aGVuIGxvYWRpbmcgZmlyc3QgYmVnaW5zLCBcblx0XHQgKiBpLmUuIHdoZW4gdXBkYXRlKCkgaXMgY2FsbGVkIGFuZCB0aGUgbG9hZGluZyBxdWV1ZSBpcyB0aGVcblx0XHQgKiBzYW1lIHNpemUgYXMgdGhlIHRvdGFsIGFzc2V0IGxpc3QuXG5cdFx0ICpcblx0XHQgKiBAZXZlbnQgbG9hZFN0YXJ0ZWRcblx0XHQgKiBAdHlwZSB7U2lnbmFsfVxuXHRcdCAqL1xuXHRcdHRoaXMubG9hZFN0YXJ0ZWQgPSBuZXcgU2lnbmFsKCk7XG5cblx0XHQvKipcblx0XHQgKiBBIHNpZ25hbCBkaXNwYXRjaGVkIHdoZW4gYWxsIGFzc2V0cyBoYXZlIGJlZW4gbG9hZGVkXG5cdFx0ICogKGkuZS4gdGhlaXIgYXN5bmMgdGFza3MgZmluaXNoZWQpLlxuXHRcdCAqXG5cdFx0ICogQGV2ZW50IGxvYWRGaW5pc2hlZFxuXHRcdCAqIEB0eXBlIHtTaWduYWx9XG5cdFx0ICovXG5cdFx0dGhpcy5sb2FkRmluaXNoZWQgPSBuZXcgU2lnbmFsKCk7XG5cblx0XHQvKipcblx0XHQgKiBBIHNpZ25hbCBkaXNwYXRjaGVkIG9uIHByb2dyZXNzIHVwZGF0ZXMsIG9uY2UgYW4gYXNzZXRcblx0XHQgKiBoYXMgYmVlbiBsb2FkZWQgaW4gZnVsbCAoaS5lLiBpdHMgYXN5bmMgdGFzayBmaW5pc2hlZCkuXG5cdFx0ICpcblx0XHQgKiBUaGlzIHBhc3NlcyBhbiBldmVudCBvYmplY3QgdG8gdGhlIGxpc3RlbmVyIGZ1bmN0aW9uXG5cdFx0ICogd2l0aCB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG5cdFx0ICogXG5cdFx0ICogLSBgY3VycmVudGAgbnVtYmVyIG9mIGFzc2V0cyB0aGF0IGhhdmUgYmVlbiBsb2FkZWRcblx0XHQgKiAtIGB0b3RhbGAgbnVtYmVyIG9mIGFzc2V0cyB0byBsb2FkZWRcblx0XHQgKiAtIGBuYW1lYCBvZiB0aGUgYXNzZXQgd2hpY2ggd2FzIGp1c3QgbG9hZGVkXG5cdFx0ICogIFxuXHRcdCAqIEBldmVudCBsb2FkUHJvZ3Jlc3Ncblx0XHQgKiBAdHlwZSB7W3R5cGVdfVxuXHRcdCAqL1xuXHRcdHRoaXMubG9hZFByb2dyZXNzID0gbmV3IFNpZ25hbCgpO1xuXG5cdFx0LyoqXG5cdFx0ICogQSBzaWduYWwgZGlzcGF0Y2hlZCBvbiBwcm9ibGVtYXRpYyBsb2FkOyBlLmcuIGlmXG5cdFx0ICogdGhlIGltYWdlIHdhcyBub3QgZm91bmQgYW5kIFwib25lcnJvclwiIHdhcyB0cmlnZ2VyZWQuIFxuXHRcdCAqIFRoZSBmaXJzdCBhcmd1bWVudCBwYXNzZWQgdG8gdGhlIGxpc3RlbmVyIHdpbGwgYmUgXG5cdFx0ICogdGhlIHN0cmluZyBuYW1lIG9mIHRoZSBhc3NldC5cblx0XHQgKlxuXHRcdCAqIFRoZSBhc3NldCBtYW5hZ2VyIHdpbGwgY29udGludWUgbG9hZGluZyBzdWJzZXF1ZW50IGFzc2V0cy5cblx0XHQgKlxuXHRcdCAqIFRoaXMgaXMgZGlzcGF0Y2hlZCBhZnRlciB0aGUgc3RhdHVzIG9mIHRoZSBhc3NldCBpc1xuXHRcdCAqIHNldCB0byBTdGF0dXMuTE9BRF9GQUlMLCBhbmQgYmVmb3JlIHRoZSBsb2FkUHJvZ3Jlc3Ncblx0XHQgKiBzaWduYWwgaXMgZGlzcGF0Y2hlZC5cblx0XHQgKlxuXHRcdCAqIEBldmVudCBsb2FkRXJyb3Jcblx0XHQgKiBAdHlwZSB7U2lnbmFsfVxuXHRcdCAqL1xuXHRcdHRoaXMubG9hZEVycm9yID0gbmV3IFNpZ25hbCgpO1xuXG5cblx0XHQvKipcblx0XHQgKiBBIHNldCBvZiBsb2FkZXIgcGx1Z2lucyBmb3IgdGhpcyBhc3NldCBtYW5hZ2VyLiBUaGVzZSBtaWdodCBiZSBhcyBzaW1wbGVcblx0XHQgKiBhcyBwdXNoaW5nIEhUTUwgSW1hZ2Ugb2JqZWN0cyBpbnRvIGEgVGV4dHVyZSwgb3IgbW9yZSBjb21wbGV4IGxpa2UgZGVjb2Rpbmdcblx0XHQgKiBhIGNvbXByZXNzZWQsIG1pcC1tYXBwZWQsIG9yIGN1YmUtbWFwIHRleHR1cmUuXG5cdFx0ICpcblx0XHQgKiBUaGlzIG9iamVjdCBpcyBhIHNpbXBsZSBoYXNobWFwIG9mIGxvd2VyLWNhc2UgZXh0ZW5zaW9uIG5hbWVzIHRvIExvYWRlciBmdW5jdGlvbnMsXG5cdFx0ICogYW5kIG1pbWUtdHlwZXMgbGlrZSBcImltYWdlL3BuZ1wiIGZvciBkYXRhIFVSSXMuXG5cdFx0ICogXG5cdFx0ICogQHByb3BlcnR5IGxvYWRlcnNcblx0XHQgKiBAdHlwZSB7T2JqZWN0fVxuXHRcdCAqL1xuXHRcdHRoaXMubG9hZGVycyA9IHt9O1xuXG5cdFx0Ly9jb3B5IGZyb20gb3VyIGNvbW1vbiBsb2FkZXJzXG5cdFx0Zm9yICh2YXIgayBpbiBBc3NldExvYWRlci5jb21tb25Mb2FkZXJzKSB7XG5cdFx0XHRpZiAoQXNzZXRMb2FkZXIuY29tbW9uTG9hZGVycy5oYXNPd25Qcm9wZXJ0eShrKSkge1xuXHRcdFx0XHR0aGlzLmxvYWRlcnNba10gPSBBc3NldExvYWRlci5jb21tb25Mb2FkZXJzW2tdO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogRGVzdHJveXMgdGhpcyBhc3NldCBtYW5hZ2VyOyBkZWxldGluZyB0aGUgdGFza3Ncblx0ICogYW5kIGFzc2V0cyBhcnJheXMgYW5kIHJlc2V0dGluZyB0aGUgbG9hZCBjb3VudC5cblx0ICogXG5cdCAqIEBtZXRob2QgIGRlc3Ryb3lcblx0ICovXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMucmVtb3ZlQWxsKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxlZCB0byBpbnZhbGlkYXRlIHRoZSBhc3NldCBtYW5hZ2VyXG5cdCAqIGFuZCByZXF1aXJlIGFsbCBhc3NldHMgdG8gYmUgcmUtbG9hZGVkLlxuXHQgKiBGb3IgZXhhbXBsZSwgYSBXZWJHTCBhcHAgd2lsbCBjYWxsIHRoaXMgaW50ZXJuYWxseVxuXHQgKiBvbiBjb250ZXh0IGxvc3MuXG5cdCAqXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQG1ldGhvZCBpbnZhbGlkYXRlXG5cdCAqL1xuXHRpbnZhbGlkYXRlOiBmdW5jdGlvbigpIHtcblx0XHQvL21hcmsgYWxsIGFzIG5vdCB5ZXQgbG9hZGVkXG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuYXNzZXRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmFzc2V0c1tpXS5zdGF0dXMgPSBBc3NldExvYWRlci5TdGF0dXMuUVVFVUVEO1xuXHRcdH1cblx0XHRcblx0XHQvL2NvcHkgb3VyIGFzc2V0cyB0byBhIHF1ZXVlIHdoaWNoIGNhbiBiZSBwb3BwZWRcblx0XHR0aGlzLnRhc2tzID0gdGhpcy5hc3NldHMuc2xpY2UoKTtcblxuXHRcdHRoaXMuX19sb2FkQ291bnQgPSB0aGlzLl9fdG90YWxJdGVtcyA9IHRoaXMudGFza3MubGVuZ3RoO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBdHRlbXB0cyB0byBleHRyYWN0IGEgbWltZS10eXBlIGZyb20gdGhlIGdpdmVuIGRhdGEgVVJJLiBJdCB3aWxsXG5cdCAqIGRlZmF1bHQgdG8gXCJ0ZXh0L3BsYWluXCIgaWYgdGhlIHN0cmluZyBpcyBhIGRhdGEgVVJJIHdpdGggbm8gc3BlY2lmaWVkXG5cdCAqIG1pbWUtdHlwZS4gSWYgdGhlIHN0cmluZyBkb2VzIG5vdCBiZWdpbiB3aXRoIFwiZGF0YTpcIiwgdGhpcyBtZXRob2QgXG5cdCAqIHJldHVybnMgbnVsbC5cblx0ICpcblx0ICogQG1ldGhvZCAgX19nZXREYXRhVHlwZVxuXHQgKiBAcHJpdmF0ZVxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IHN0ciB0aGUgZGF0YSBVUklcblx0ICogQHJldHVybiB7U3RyaW5nfSAgICAgdGhlIG1pbWUgdHlwZVxuXHQgKi9cblx0X19nZXREYXRhVHlwZTogZnVuY3Rpb24oc3RyKSB7XG5cdFx0dmFyIHRlc3QgPSBcImRhdGE6XCI7XG5cdFx0Ly9zdGFydHMgd2l0aCAnZGF0YTonXG5cdFx0dmFyIHN0YXJ0ID0gc3RyLnNsaWNlKDAsIHRlc3QubGVuZ3RoKS50b0xvd2VyQ2FzZSgpO1xuXHRcdGlmIChzdGFydCA9PSB0ZXN0KSB7XG5cdFx0XHR2YXIgZGF0YSA9IHN0ci5zbGljZSh0ZXN0Lmxlbmd0aCk7XG5cdFx0XHRcblx0XHRcdHZhciBzZXBJZHggPSBkYXRhLmluZGV4T2YoJywnKTtcblx0XHRcdGlmIChzZXBJZHggPT09IC0xKSAvL21hbGZvcm1lZCBkYXRhIFVSSSBzY2hlbWVcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cblx0XHRcdC8vZS5nLiBcImltYWdlL2dpZjtiYXNlNjRcIiA9PiBcImltYWdlL2dpZlwiXG5cdFx0XHR2YXIgaW5mbyA9IGRhdGEuc2xpY2UoMCwgc2VwSWR4KS5zcGxpdCgnOycpWzBdO1xuXG5cdFx0XHQvL1dlIG1pZ2h0IG5lZWQgdG8gaGFuZGxlIHNvbWUgc3BlY2lhbCBjYXNlcyBoZXJlLi4uXG5cdFx0XHQvL3N0YW5kYXJkaXplIHRleHQvcGxhaW4gdG8gXCJ0eHRcIiBmaWxlIGV4dGVuc2lvblxuXHRcdFx0aWYgKCFpbmZvIHx8IGluZm8udG9Mb3dlckNhc2UoKSA9PSBcInRleHQvcGxhaW5cIilcblx0XHRcdFx0cmV0dXJuIFwidHh0XCJcblxuXHRcdFx0Ly9Vc2VyIHNwZWNpZmllZCBtaW1lIHR5cGUsIHRyeSBzcGxpdHRpbmcgaXQgYnkgJy8nXG5cdFx0XHRyZXR1cm4gaW5mby5zcGxpdCgnLycpLnBvcCgpLnRvTG93ZXJDYXNlKCk7XG5cdFx0fVxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cdF9fZXh0ZW5zaW9uOiBmdW5jdGlvbihzdHIpIHtcblx0XHR2YXIgaWR4ID0gc3RyLmxhc3RJbmRleE9mKCcuJyk7XG5cdFx0aWYgKGlkeCA9PT0gLTEgfHwgaWR4ID09PSAwIHx8IGlkeCA9PT0gc3RyLmxlbmd0aC0xKSAvLyBkb2VzIG5vdCBoYXZlIGEgY2xlYXIgZmlsZSBleHRlbnNpb25cblx0XHRcdHJldHVybiBcIlwiO1xuXHRcdHJldHVybiBzdHIuc3Vic3RyaW5nKGlkeCsxKS50b0xvd2VyQ2FzZSgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBBc3NldERlc2NyaXB0b3IgYnkgbmFtZSwgb3IgbnVsbCBpZiBub3QgZm91bmQuXG5cdCAqIFxuXHQgKiBAbWV0aG9kICBnZXREZXNjcmlwdG9yXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHBhcmFtICB7QXNzZXREZXNjcmlwdG9yfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhc3NldFxuXHQgKiBAcmV0dXJuIHthbnl9ICAgICAgdGhlIGFzc2V0XG5cdCAqL1xuXHRnZXREZXNjcmlwdG9yOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0dmFyIGlkeCA9IHRoaXMuaW5kZXhPZih0aGlzLmFzc2V0cywgbmFtZSk7XG5cdFx0cmV0dXJuIGlkeCAhPT0gLTEgPyB0aGlzLmFzc2V0c1tpZHhdIDogbnVsbDtcblx0fSxcblxuXHRnZXRTdGF0dXM6IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHR2YXIgZCA9IHRoaXMuZ2V0RGVzY3JpcHRvcihuYW1lKTtcblx0XHRyZXR1cm4gZCA/IGQuc3RhdHVzIDogbnVsbDtcblx0fSxcblx0XG5cdGlzTG9hZGVkOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0U3RhdHVzKG5hbWUpID09PSBBc3NldExvYWRlci5TdGF0dXMuTE9BRF9TVUNDRVNTO1xuXHR9LFxuXHRcblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHZhbHVlIHN0b3JlZCBmb3IgdGhpcyBhc3NldCwgc3VjaCBhcyBhbiBJbWFnZVxuXHQgKiBpZiB3ZSBhcmUgdXNpbmcgYSBDYW52YXMgaW1hZ2UgbG9hZGluZyBwbHVnaW4uIFJldHVybnMgbnVsbFxuXHQgKiBpZiB0aGUgYXNzZXQgd2FzIG5vdCBmb3VuZC5cblx0ICogXHRcblx0ICogQHBhcmFtICB7U3RyaW5nfSBuYW1lIHRoZSBuYW1lIG9mIHRoZSBhc3NldCB0byBnZXRcblx0ICogQHJldHVybiB7YW55fSAgICB0aGUgYXNzZXQgYnkgbmFtZVxuXHQgKi9cblx0Z2V0OiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0dmFyIGQgPSB0aGlzLmdldERlc2NyaXB0b3IobmFtZSk7XG5cdFx0cmV0dXJuIGQgPyBkLnZhbHVlIDogbnVsbDtcblx0fSxcblxuXHQvKipcblx0ICogUmVtb3ZlcyBhIHJlZmVyZW5jZSB0byB0aGUgZ2l2ZW4gYXNzZXQsIGFuZCByZXR1cm5zIHRoZSByZW1vdmVkXG5cdCAqIGFzc2V0LiBJZiB0aGUgYXNzZXQgYnkgbmFtZSB3YXMgbm90IGZvdW5kLCBudWxsIGlzIHJldHVybmVkLlxuXHQgKlxuXHQgKiBUaGlzIHdpbGwgYWxzbyByZW1vdmUgdGhlIGFzc2V0IGZyb20gdGhlIHRhc2sgbGlzdC5cblx0ICpcblx0ICogTm90ZSB0aGF0IHRoaXMgd2lsbCBub3QgZGVzdHJveSBhbnkgcmVzb3VyY2VzIHRoYXQgYXNzZXQgbWFpbnRhaW5lZDtcblx0ICogc28gaXQgaXMgdGhlIHVzZXIncyBkdXR5IHRvIGRvIHNvIGFmdGVyIHJlbW92aW5nIGl0IGZyb20gdGhlIHF1ZXVlLlxuXHQgKiBcblx0ICogQHBhcmFtICB7W3R5cGVdfSBuYW1lIFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7W3R5cGVdfSAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdHJlbW92ZTogZnVuY3Rpb24obmFtZSkge1xuXHRcdHZhciBhc3NldElkeCA9IHRoaXMuaW5kZXhPZih0aGlzLmFzc2V0cywgbmFtZSk7XG5cdFx0aWYgKGFzc2V0SWR4ID09PSAtMSlcblx0XHRcdHJldHVybiBudWxsO1xuXG5cdFx0dmFyIGFzc2V0ID0gdGhpcy5hc3NldHNbYXNzZXRJZHhdO1xuXHRcdHZhciBzdGF0dXMgPSBhc3NldC5zdGF0dXM7XG5cblx0XHQvL2xldCdzIHNlZS4uIHRoZSBhc3NldCBjYW4gZWl0aGVyIGJlIFFVRVVFRFxuXHRcdC8vb3IgTE9BRElORywgb3IgTE9BREVEIChmYWlsL3N1Y2Nlc3MpLiBpZiBpdCdzIHF1ZXVlZCBcblxuXHRcdFxuXHRcdC8vcmVtb3ZlIHJlZmVyZW5jZSB0byB0aGUgYXNzZXRcblx0XHR0aGlzLmFzc2V0cy5zcGxpY2UoYXNzZXRJZHgsIDEpO1xuXHRcdFxuXHRcdC8vbWFrZSBzdXJlIGl0J3Mgbm90IGluIG91ciB0YXNrIGxpc3Rcblx0XHR2YXIgdGFza0lkeCA9IHRoaXMuaW5kZXhPZih0aGlzLnRhc2tzLCBuYW1lKTtcblxuXHRcdHRoaXMuX190b3RhbEl0ZW1zID0gTWF0aC5tYXgoMCwgdGhpcy5fX3RvdGFsSXRlbXMtMSk7XG5cdFx0dGhpcy5fX2xvYWRDb3VudCA9IE1hdGgubWF4KDAsIHRoaXMuX19sb2FkQ291bnQtMSk7XG5cdFx0aWYgKHRhc2tJZHggIT09IC0xKSB7XG5cdFx0XHQvL2l0J3Mgd2FpdGluZyB0byBiZSBsb2FkZWQuLi4gd2UgbmVlZCB0byByZW1vdmUgaXRcblx0XHRcdC8vYW5kIGFsc28gZGVjcmVtZW50IHRoZSBsb2FkIC8gdG90YWwgY291bnRcblx0XHRcdHRoaXMudGFza3Muc3BsaWNlKHRhc2tJZHgsIDEpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHQvL25vdCBpbiB0YXNrcy4uLiBhbHJlYWR5IHF1ZXVlZFxuXHRcdFx0XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuX19sb2FkQ291bnQgPT09IDApIHtcblx0XHRcdGlmICh0aGlzLmxvYWRpbmcpIHtcblx0XHRcdFx0dGhpcy5sb2FkRmluaXNoZWQuZGlzcGF0Y2goe1xuXHRcdFx0XHRcdGN1cnJlbnQ6IDAsXG5cdFx0XHRcdFx0dG90YWw6IDBcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLmxvYWRpbmcgPSBmYWxzZTtcblx0XHR9XG5cdFx0cmV0dXJuIGFzc2V0LnZhbHVlO1xuXHR9LFxuXG5cdHJlbW92ZUFsbDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5hc3NldHMubGVuZ3RoID0gMDtcblx0XHR0aGlzLnRhc2tzLmxlbmd0aCA9IDA7XG5cdFx0dGhpcy5fX2xvYWRDb3VudCA9IHRoaXMuX190b3RhbEl0ZW1zID0gMDtcblxuXHRcdGlmICh0aGlzLmxvYWRpbmcpIHtcblx0XHRcdHRoaXMubG9hZEZpbmlzaGVkLmRpc3BhdGNoKHtcblx0XHRcdFx0Y3VycmVudDogMCxcblx0XHRcdFx0dG90YWw6IDBcblx0XHRcdH0pO1xuXHRcdH1cblx0XHR0aGlzLmxvYWRpbmcgPSBmYWxzZTtcblx0fSxcblxuXHQvKipcblx0ICogQ2FsbHMgYGFkZCgpYCBmb3IgZWFjaCBzdHJpbmcgaW4gdGhlIGdpdmVuIGFycmF5LlxuXHQgKlxuXHQgKiBAbWV0aG9kIGFkZEFsbFxuXHQgKiBAcGFyYW0gIHtBcnJheX0gYXJyYXkgXG5cdCAqL1xuXHRhZGRBbGw6IGZ1bmN0aW9uKGFycmF5KSB7XG5cdFx0Zm9yICh2YXIgaT0wOyBpPGFycmF5Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLmFkZChhcnJheVtpXSk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBQdXNoZXMgYW4gYXNzZXQgb250byB0aGlzIHN0YWNrLiBUaGlzXG5cdCAqIGF0dGVtcHRzIHRvIGRldGVjdCB0aGUgbG9hZGVyIGZvciB5b3UgYmFzZWRcblx0ICogb24gdGhlIGFzc2V0IG5hbWUncyBmaWxlIGV4dGVuc2lvbiAob3IgZGF0YSBVUkkgc2NoZW1lKS4gXG5cdCAqIElmIHRoZSBhc3NldCBuYW1lIGRvZXNuJ3QgaGF2ZSBhIGtub3duIGZpbGUgZXh0ZW5zaW9uLFxuXHQgKiBvciBpZiB0aGVyZSBpcyBubyBsb2FkZXIgcmVnaXN0ZXJlZCBmb3IgdGhhdCBmaWxlbmFtZSxcblx0ICogdGhpcyBtZXRob2QgdGhyb3dzIGFuIGVycm9yLiBJZiB5b3UncmUgdHJ5aW5nIHRvIHVzZSBcblx0ICogZ2VuZXJpYyBrZXlzIGZvciBhc3NldCBuYW1lcywgdXNlIHRoZSBhZGRBcyBtZXRob2QgYW5kXG5cdCAqIHNwZWNpZnkgYSBsb2FkZXIgcGx1Z2luLlxuXHQgKiBcblx0ICogVGhpcyBtZXRob2QncyBhcmd1bWVudHMgYXJlIHBhc3NlZCB0byB0aGUgY29uc3RydWN0b3Jcblx0ICogb2YgdGhlIGxvYWRlciBmdW5jdGlvbi4gXG5cdCAqXG5cdCAqIFRoZSByZXR1cm4gdmFsdWUgb2YgdGhpcyBtZXRob2QgaXMgZGV0ZXJtaW5lZCBieVxuXHQgKiB0aGUgbG9hZGVyJ3MgcHJvY2Vzc0FyZ3VtZW50cyBtZXRob2QuIEZvciBleGFtcGxlLCB0aGVcblx0ICogZGVmYXVsdCBJbWFnZSBsb2FkZXIgcmV0dXJucyBhIFRleHR1cmUgb2JqZWN0LlxuXHQgKlxuXHQgKiBAZXhhbXBsZVxuXHQgKiAgICAvL3VzZXMgSW1hZ2VMb2FkZXIgdG8gZ2V0IGEgbmV3IFRleHR1cmVcblx0ICogICAgdmFyIHRleCA9IGFzc2V0cy5hZGQoXCJ0ZXgwLnBuZ1wiKTsgXG5cdCAqXG5cdCAqICAgIC8vb3IgeW91IGNhbiBzcGVjaWZ5IHlvdXIgb3duIHRleHR1cmVcblx0ICogICAgYXNzZXRzLmFkZChcInRleDEucG5nXCIsIHRleDEpO1xuXHQgKlxuXHQgKiAgICAvL3RoZSBJbWFnZUxvYWRlciBhbHNvIGFjY2VwdHMgYSBwYXRoIG92ZXJyaWRlLCBcblx0ICogICAgLy9idXQgdGhlIGFzc2V0IGtleSBpcyBzdGlsbCBcImZyYW1lczAucG5nXCJcblx0ICogICAgYXNzZXRzLmFkZChcImZyYW1lMC5wbmdcIiwgdGV4MSwgXCJwYXRoL3RvL2ZyYW1lMS5wbmdcIik7XG5cdCAqICAgIFxuXHQgKiBAbWV0aG9kICBhZGRcblx0ICogQHBhcmFtICB7U3RyaW5nfSBuYW1lIHRoZSBhc3NldCBuYW1lXG5cdCAqIEBwYXJhbSAge2FueX0gYXJncyBhIHZhcmlhYmxlIG51bWJlciBvZiBvcHRpb25hbCBhcmd1bWVudHNcblx0ICogQHJldHVybiB7YW55fSByZXR1cm5zIHRoZSBiZXN0IHR5cGUgZm9yIHRoaXMgYXNzZXQncyBsb2FkZXJcblx0ICovXG5cdGFkZDogZnVuY3Rpb24obmFtZSkge1xuXHRcdGlmICghbmFtZSlcblx0XHRcdHRocm93IFwiTm8gYXNzZXQgbmFtZSBzcGVjaWZpZWQgZm9yIGFkZCgpXCI7XG5cblx0XHR2YXIgZXh0ID0gdGhpcy5fX2dldERhdGFUeXBlKG5hbWUpO1xuXHRcdGlmIChleHQgPT09IG51bGwpXG5cdFx0XHRleHQgPSB0aGlzLl9fZXh0ZW5zaW9uKG5hbWUpO1xuXG5cdFx0aWYgKCFleHQpIFxuXHRcdFx0dGhyb3cgXCJBc3NldCBuYW1lIGRvZXMgbm90IGhhdmUgYSBmaWxlIGV4dGVuc2lvbjogXCIgKyBuYW1lO1xuXHRcdGlmICghdGhpcy5sb2FkZXJzLmhhc093blByb3BlcnR5KGV4dCkpXG5cdFx0XHR0aHJvdyBcIk5vIGtub3duIGxvYWRlciBmb3IgZXh0ZW5zaW9uIFwiK2V4dCtcIiBpbiBhc3NldCBcIituYW1lO1xuXG5cdFx0dmFyIGFyZ3MgPSBbIHRoaXMubG9hZGVyc1tleHRdLCBuYW1lIF07XG5cdFx0YXJncyA9IGFyZ3MuY29uY2F0KCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpICk7XG5cblx0XHRyZXR1cm4gdGhpcy5hZGRBcy5hcHBseSh0aGlzLCBhcmdzKTtcblx0fSxcblxuXHQvKipcblx0ICogUHVzaGVzIGFuIGFzc2V0IG9udG8gdGhpcyBzdGFjay4gVGhpcyBhbGxvd3MgeW91IHRvXG5cdCAqIHNwZWNpZnkgYSBsb2FkZXIgZnVuY3Rpb24gZm9yIHRoZSBhc3NldC4gVGhpcyBpcyB1c2VmdWxcblx0ICogaWYgeW91IHdpc2ggdG8gdXNlIGdlbmVyaWMgbmFtZXMgZm9yIHlvdXIgYXNzZXRzIChpbnN0ZWFkIG9mXG5cdCAqIGZpbGVuYW1lcyksIG9yIGlmIHlvdSB3YW50IGEgcGFydGljdWxhciBhc3NldCB0byB1c2UgYSBzcGVjaWZpY1xuXHQgKiBsb2FkZXIuIFxuXHQgKlxuXHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgaXMgdGhlIGxvYWRlciBmdW5jdGlvbiwgYW5kIHRoZSBzZWNvbmQgaXMgdGhlIGFzc2V0XG5cdCAqIG5hbWUuIExpa2Ugd2l0aCB7eyNjcm9zc0xpbmsgXCJBc3NldExvYWRlci9sb2FkOm1ldGhvZFwifX17ey9jcm9zc0xpbmt9fSwgXG5cdCAqIGFueSBzdWJzZXF1ZW50IGFyZ3VtZW50cyB3aWxsIGJlIHBhc3NlZCBhbG9uZyB0byB0aGUgbG9hZGVyLlxuXHQgKlxuXHQgKiBUaGUgcmV0dXJuIHZhbHVlIG9mIHRoaXMgbWV0aG9kIGlzIGRldGVybWluZWQgYnlcblx0ICogdGhlIGxvYWRlcidzIHJldHVybiB2YWx1ZSwgaWYgaXQgaGFzIG9uZS4gRm9yIGV4YW1wbGUsIGEgQ2FudmFzIEltYWdlTG9hZGVyXG5cdCAqIHBsdWdpbiBtaWdodCByZXR1cm5uIEltYWdlIG9iamVjdC4gVGhpcyBpcyBhbHNvIHRoZSB2YWx1ZSB3aGljaCBjYW4gYmUgcmV0cmlldmVkIHdpdGhcblx0ICogYGdldCgpYCBvciBieSBhY2Nlc3NpbmcgdGhlIGB2YWx1ZWAgb2YgYW4gQXNzZXREZXNjcmlwdG9yLiBJZiB0aGUgbG9hZGVyIGZ1bmN0aW9uXG5cdCAqIGRvZXMgbm90IGltcGxlbWVudCBhIHJldHVybiB2YWx1ZSwgYHVuZGVmaW5lZGAgaXMgcmV0dXJuZWQuIFxuXHQgKlxuXHQgKiBAbWV0aG9kICBhZGRBc1xuXHQgKiBAcGFyYW0ge0Z1Y250aW9ufSBsb2FkZXIgdGhlIGxvYWRlciBmdW5jdGlvblxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSB0aGUgYXNzZXQgbmFtZVxuXHQgKiBAcGFyYW0ge09iamVjdCAuLi59IGFyZ3MgYSB2YXJpYWJsZSBudW1iZXIgb2Ygb3B0aW9uYWwgYXJndW1lbnRzXG5cdCAqIEByZXR1cm4ge2FueX0gcmV0dXJucyB0aGUgYmVzdCB0eXBlIGZvciB0aGlzIGFzc2V0J3MgbG9hZGVyXG5cdCAqL1xuXHRhZGRBczogZnVuY3Rpb24obG9hZGVyLCBuYW1lKSB7XG5cdFx0aWYgKCFuYW1lKVxuXHRcdFx0dGhyb3cgXCJubyBuYW1lIHNwZWNpZmllZCB0byBsb2FkXCI7XG5cdFx0aWYgKCFsb2FkZXIpXG5cdFx0XHR0aHJvdyBcIm5vIGxvYWRlciBzcGVjaWZpZWQgZm9yIGFzc2V0IFwiK25hbWU7XG5cblx0XHR2YXIgaWR4ID0gdGhpcy5pbmRleE9mKHRoaXMuYXNzZXRzLCBuYW1lKTtcblx0XHRpZiAoaWR4ICE9PSAtMSkgLy9UT0RPOiBldmVudHVhbGx5IGFkZCBzdXBwb3J0IGZvciBkZXBlbmRlbmNpZXMgYW5kIHNoYXJlZCBhc3NldHNcblx0XHRcdHRocm93IFwiYXNzZXQgYWxyZWFkeSBkZWZpbmVkIGluIGFzc2V0IG1hbmFnZXJcIjtcblxuXHRcdC8vZ3JhYiB0aGUgYXJndW1lbnRzLCBleGNlcHQgZm9yIHRoZSBsb2FkZXIgZnVuY3Rpb24uXG5cdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXHRcdFxuXHRcdC8vY3JlYXRlIG91ciBsb2FkZXIgZnVuY3Rpb24gYW5kIGdldCB0aGUgbmV3IHJldHVybiB2YWx1ZVxuXHRcdHZhciByZXRPYmogPSBsb2FkZXIuYXBwbHkodGhpcywgYXJncyk7XG5cblx0XHRpZiAodHlwZW9mIHJldE9iai5sb2FkICE9PSBcImZ1bmN0aW9uXCIpXG5cdFx0XHR0aHJvdyBcImxvYWRlciBub3QgaW1wbGVtZW50ZWQgY29ycmVjdGx5OyBtdXN0IHJldHVybiBhICdsb2FkJyBmdW5jdGlvblwiO1xuXG5cdFx0Ly9rZWVwIGhvbGQgb2YgdGhpcyBhc3NldCBhbmQgaXRzIG9yaWdpbmFsIG5hbWVcblx0XHR2YXIgZGVzY3JpcHRvciA9IG5ldyBBc3NldExvYWRlci5EZXNjcmlwdG9yKG5hbWUsIHJldE9iai5sb2FkLCByZXRPYmoudmFsdWUpO1xuXHRcdHRoaXMuYXNzZXRzLnB1c2goIGRlc2NyaXB0b3IgKTtcblxuXHRcdC8vYWxzbyBhZGQgaXQgdG8gb3VyIHF1ZXVlIG9mIGN1cnJlbnQgdGFza3Ncblx0XHR0aGlzLnRhc2tzLnB1c2goIGRlc2NyaXB0b3IgKTtcblx0XHR0aGlzLl9fbG9hZENvdW50Kys7XG5cdFx0dGhpcy5fX3RvdGFsSXRlbXMrKztcblxuXHRcdHJldHVybiByZXRPYmoudmFsdWU7XG5cdH0sXG5cblx0aW5kZXhPZjogZnVuY3Rpb24obGlzdCwgbmFtZSkge1xuXHRcdGZvciAodmFyIGk9MDsgaTxsaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAobGlzdFtpXSAmJiBsaXN0W2ldLm5hbWUgPT09IG5hbWUpXG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH0sXG5cblxuXHRfX2xvYWRDYWxsYmFjazogZnVuY3Rpb24obmFtZSwgc3VjY2Vzcykge1xuXHRcdC8vaWYgJ2ZhbHNlJyB3YXMgcGFzc2VkLCB1c2UgaXQuXG5cdFx0Ly9vdGhlcndpc2UgdHJlYXQgYXMgJ3RydWUnXG5cdFx0c3VjY2VzcyA9IHN1Y2Nlc3MgIT09IGZhbHNlO1xuXG5cdFx0dmFyIGFzc2V0SWR4ID0gdGhpcy5pbmRleE9mKHRoaXMuYXNzZXRzLCBuYW1lKTtcblx0XHRcdFx0XG5cdFx0Ly9JZiB0aGUgYXNzZXQgaXMgbm90IGZvdW5kLCB3ZSBjYW4gYXNzdW1lIGl0XG5cdFx0Ly93YXMgcmVtb3ZlZCBmcm9tIHRoZSBxdWV1ZS4gaW4gdGhpcyBjYXNlIHdlIFxuXHRcdC8vd2FudCB0byBpZ25vcmUgZXZlbnRzIHNpbmNlIHRoZXkgc2hvdWxkIGFscmVhZHlcblx0XHQvL2hhdmUgYmVlbiBmaXJlZC5cblx0XHRpZiAoYXNzZXRJZHggPT09IC0xKSB7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuX19sb2FkQ291bnQtLTtcblxuXHRcdHRoaXMuYXNzZXRzW2Fzc2V0SWR4XS5zdGF0dXMgPSBzdWNjZXNzIFxuXHRcdFx0XHRcdFx0PyBBc3NldExvYWRlci5TdGF0dXMuTE9BRF9TVUNDRVNTXG5cdFx0XHRcdFx0XHQ6IEFzc2V0TG9hZGVyLlN0YXR1cy5MT0FEX0ZBSUxFRDtcblxuXHRcdHZhciBjdXJyZW50ID0gKHRoaXMuX190b3RhbEl0ZW1zIC0gdGhpcy5fX2xvYWRDb3VudCksXG5cdFx0XHR0b3RhbCA9IHRoaXMuX190b3RhbEl0ZW1zO1xuXG5cdFx0aWYgKCFzdWNjZXNzKSB7XG5cdFx0XHR0aGlzLmxvYWRFcnJvci5kaXNwYXRjaCh7XG5cdFx0XHRcdG5hbWU6IG5hbWUsXG5cdFx0XHRcdGN1cnJlbnQ6IGN1cnJlbnQsXG5cdFx0XHRcdHRvdGFsOiB0b3RhbFxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5sb2FkUHJvZ3Jlc3MuZGlzcGF0Y2goe1xuXHRcdFx0bmFtZTogbmFtZSxcblx0XHRcdGN1cnJlbnQ6IGN1cnJlbnQsXG5cdFx0XHR0b3RhbDogdG90YWxcblx0XHR9KTtcblx0XHRcdFxuXHRcdGlmICh0aGlzLl9fbG9hZENvdW50ID09PSAwKSB7XG5cdFx0XHR0aGlzLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdHRoaXMubG9hZEZpbmlzaGVkLmRpc3BhdGNoKHtcblx0XHRcdFx0Y3VycmVudDogY3VycmVudCxcblx0XHRcdFx0dG90YWw6IHRvdGFsXG5cdFx0XHR9KTtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFVwZGF0ZXMgdGhpcyBBc3NldExvYWRlciBieSBsb2FkaW5nIHRoZSBuZXh0IGFzc2V0IGluIHRoZSBxdWV1ZS5cblx0ICogSWYgYWxsIGFzc2V0cyBoYXZlIGJlZW4gbG9hZGVkLCB0aGlzIG1ldGhvZCByZXR1cm5zIHRydWUsIG90aGVyd2lzZVxuXHQgKiBpdCB3aWxsIHJldHVybiBmYWxzZS5cblx0ICpcblx0ICogQG1ldGhvZCAgdXBkYXRlXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59IHdoZXRoZXIgdGhpcyBhc3NldCBtYW5hZ2VyIGhhcyBmaW5pc2hlZCBsb2FkaW5nXG5cdCAqL1xuXHR1cGRhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnRhc2tzLmxlbmd0aCA9PT0gMClcblx0XHRcdHJldHVybiAodGhpcy5fX2xvYWRDb3VudCA9PT0gMCk7XG5cblx0XHQvL0lmIHdlIHN0aWxsIGhhdmVuJ3QgcG9wcGVkIGFueSBmcm9tIHRoZSBhc3NldHMgbGlzdC4uLlxuXHRcdGlmICh0aGlzLnRhc2tzLmxlbmd0aCA9PT0gdGhpcy5hc3NldHMubGVuZ3RoKSB7XG5cdFx0XHR0aGlzLmxvYWRpbmcgPSB0cnVlO1xuXHRcdFx0dGhpcy5sb2FkU3RhcnRlZC5kaXNwYXRjaCh7XG5cdFx0XHRcdGN1cnJlbnQ6IDAsXG5cdFx0XHRcdHRvdGFsOiB0aGlzLl9fdG90YWxJdGVtc1xuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0Ly9ncmFiIHRoZSBuZXh0IHRhc2sgb24gdGhlIHN0YWNrXG5cdFx0dmFyIG5leHRUYXNrID0gdGhpcy50YXNrcy5zaGlmdCgpO1xuXG5cdFx0Ly9hcHBseSB0aGUgbG9hZGluZyBzdGVwXG5cdFx0dmFyIGxvYWRlciA9IG5leHRUYXNrLmxvYWRGdW5jO1xuXG5cdFx0dmFyIGNiID0gdGhpcy5fX2xvYWRDYWxsYmFjay5iaW5kKHRoaXMsIG5leHRUYXNrLm5hbWUsIHRydWUpO1xuXHRcdHZhciBjYkZhaWwgPSB0aGlzLl9fbG9hZENhbGxiYWNrLmJpbmQodGhpcywgbmV4dFRhc2submFtZSwgZmFsc2UpO1xuXG5cdFx0Ly9kbyB0aGUgYXN5bmMgbG9hZCAuLi5cblx0XHRsb2FkZXIuY2FsbCh0aGlzLCBjYiwgY2JGYWlsKTtcblxuXHRcdHJldHVybiAodGhpcy5fX2xvYWRDb3VudCA9PT0gMCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJlZ2lzdGVycyBhIGxvYWRlciBmdW5jdGlvbiBmb3IgdGhpcyBxdWV1ZSB3aXRoIHRoZSBnaXZlbiBleHRlbnNpb24ocykuXG5cdCAqIFRoaXMgd2lsbCBvdmVycmlkZSBhbnkgZXh0ZW5zaW9ucyBvciBtaW1lLXR5cGVzIGFscmVhZHkgcmVnaXN0ZXJlZC5cblx0ICogXG5cdCAqIEBtZXRob2QgcmVnaXN0ZXJMb2FkZXJcblx0ICogQHBhcmFtIHtGdW5jdGlvbn0gbG9hZGVyIHRoZSBsb2FkZXIgZnVuY3Rpb25cblx0ICovXG5cdHJlZ2lzdGVyTG9hZGVyOiBmdW5jdGlvbihsb2FkZXIpIHtcblx0XHRyZWdpc3RlckxvYWRlcih0aGlzLmxvYWRlcnMsIGxvYWRlciwgbG9hZGVyLmV4dGVuc2lvbnMsIGxvYWRlci5tZWRpYVR5cGUpO1xuXHR9XG59KTtcblx0XG4vKipcbiAqIFRoaXMgaXMgYSBtYXAgb2YgXCJjb21tb25cIiBsb2FkZXJzLCBzaGFyZWQgYnkgbWFueSBjb250ZXh0cy5cbiAqIEZvciBleGFtcGxlLCBhbiBpbWFnZSBsb2FkZXIgaXMgc3BlY2lmaWMgdG8gV2ViR0wsIENhbnZhcywgU1ZHLCBldGMsXG4gKiBidXQgYSBKU09OIGxvYWRlciBtaWdodCBiZSByZW5kZXJlci1pbmRlcGVuZGVudCBhbmQgdGh1cyBcImNvbW1vblwiLiBcbiAqXG4gKiBXaGVuIGEgbmV3IEFzc2V0TWFuYWdlciBpcyBjcmVhdGVkLCBpdCB3aWxsIHVzZSB0aGVzZSBsb2FkZXJzLlxuICogXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5Bc3NldExvYWRlci5jb21tb25Mb2FkZXJzID0ge307XG5cbi8qKlxuICogUmVnaXN0ZXJzIGEgXCJjb21tb25cIiBsb2FkZXIgZnVuY3Rpb24gd2l0aCB0aGUgZ2l2ZW4gZXh0ZW5zaW9uKHMpLlxuICogXG4gKiBGb3IgZXhhbXBsZSwgYW4gaW1hZ2UgbG9hZGVyIGlzIHNwZWNpZmljIHRvIFdlYkdMLCBDYW52YXMsIFNWRywgZXRjLFxuICogYnV0IGEgSlNPTiBsb2FkZXIgbWlnaHQgYmUgcmVuZGVyZXItaW5kZXBlbmRlbnQgYW5kIHRodXMgXCJjb21tb25cIi4gXG4gKlxuICogV2hlbiBhIG5ldyBBc3NldE1hbmFnZXIgaXMgY3JlYXRlZCwgaXQgd2lsbCB1c2UgdGhlc2UgbG9hZGVycy5cbiAqIFxuICogQG1ldGhvZCByZWdpc3RlckNvbW1vbkxvYWRlclxuICogQHBhcmFtIHtGdW5jdGlvbn0gbG9hZGVyIHRoZSBsb2FkZXIgZnVuY3Rpb25cbiAqL1xuQXNzZXRMb2FkZXIucmVnaXN0ZXJDb21tb25Mb2FkZXIgPSBmdW5jdGlvbihsb2FkZXIpIHtcblx0cmVnaXN0ZXJMb2FkZXIoQXNzZXRMb2FkZXIuY29tbW9uTG9hZGVycywgbG9hZGVyLCBsb2FkZXIuZXh0ZW5zaW9ucywgbG9hZGVyLm1lZGlhVHlwZSk7XG59XG5cbi8qKlxuICogQSBzaW1wbGUgd3JhcHBlciBmb3IgYXNzZXRzIHdoaWNoIHdpbGwgYmUgcGFzc2VkIGFsb25nIHRvIHRoZSBsb2FkZXI7XG4gKiB0aGlzIGlzIHVzZWQgaW50ZXJuYWxseS5cbiAqIFxuICogLy9AY2xhc3MgQXNzZXRMb2FkZXIuRGVzY3JpcHRvclxuICovXG5Bc3NldExvYWRlci5EZXNjcmlwdG9yID0gZnVuY3Rpb24obmFtZSwgbG9hZEZ1bmMsIHZhbHVlKSB7XG5cdHRoaXMubmFtZSA9IG5hbWU7XG5cdHRoaXMubG9hZEZ1bmMgPSBsb2FkRnVuYztcblx0dGhpcy52YWx1ZSA9IHZhbHVlO1xuXHR0aGlzLnN0YXR1cyA9IEFzc2V0TG9hZGVyLlN0YXR1cy5RVUVVRUQ7XG59O1xuXG4vKipcbiAqIERlZmluZXMgdGhlIHN0YXR1cyBvZiBhbiBhc3NldCBpbiB0aGUgbWFuYWdlciBxdWV1ZS5cbiAqIFRoZSBjb25zdGFudHMgdW5kZXIgdGhpcyBvYmplY3QgYXJlIG9uZSBvZjpcbiAqIFxuICogICAgIFFVRVVFRFxuICogICAgIExPQURJTkdcbiAqICAgICBMT0FEX1NVQ0NFU1NcbiAqICAgICBMT0FEX0ZBSUxcbiAqIFxuICogQGF0dHJpYnV0ZSAgU3RhdHVzXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5Bc3NldExvYWRlci5TdGF0dXMgPSB7XG5cdFFVRVVFRDogXCJRVUVVRURcIixcblx0TE9BRElORzogXCJMT0FESU5HXCIsXG5cdExPQURfU1VDQ0VTUzogXCJMT0FEX1NVQ0NFU1NcIixcblx0TE9BRF9GQUlMOiBcIkxPQURfRkFJTFwiXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2V0TG9hZGVyO1xuIiwiLypqc2xpbnQgb25ldmFyOnRydWUsIHVuZGVmOnRydWUsIG5ld2NhcDp0cnVlLCByZWdleHA6dHJ1ZSwgYml0d2lzZTp0cnVlLCBtYXhlcnI6NTAsIGluZGVudDo0LCB3aGl0ZTpmYWxzZSwgbm9tZW46ZmFsc2UsIHBsdXNwbHVzOmZhbHNlICovXG4vKmdsb2JhbCBkZWZpbmU6ZmFsc2UsIHJlcXVpcmU6ZmFsc2UsIGV4cG9ydHM6ZmFsc2UsIG1vZHVsZTpmYWxzZSwgc2lnbmFsczpmYWxzZSAqL1xuXG4vKiogQGxpY2Vuc2VcbiAqIEpTIFNpZ25hbHMgPGh0dHA6Ly9taWxsZXJtZWRlaXJvcy5naXRodWIuY29tL2pzLXNpZ25hbHMvPlxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBBdXRob3I6IE1pbGxlciBNZWRlaXJvc1xuICogVmVyc2lvbjogMS4wLjAgLSBCdWlsZDogMjY4ICgyMDEyLzExLzI5IDA1OjQ4IFBNKVxuICovXG5cbihmdW5jdGlvbihnbG9iYWwpe1xuXG4gICAgLy8gU2lnbmFsQmluZGluZyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICAvKipcbiAgICAgKiBPYmplY3QgdGhhdCByZXByZXNlbnRzIGEgYmluZGluZyBiZXR3ZWVuIGEgU2lnbmFsIGFuZCBhIGxpc3RlbmVyIGZ1bmN0aW9uLlxuICAgICAqIDxiciAvPi0gPHN0cm9uZz5UaGlzIGlzIGFuIGludGVybmFsIGNvbnN0cnVjdG9yIGFuZCBzaG91bGRuJ3QgYmUgY2FsbGVkIGJ5IHJlZ3VsYXIgdXNlcnMuPC9zdHJvbmc+XG4gICAgICogPGJyIC8+LSBpbnNwaXJlZCBieSBKb2EgRWJlcnQgQVMzIFNpZ25hbEJpbmRpbmcgYW5kIFJvYmVydCBQZW5uZXIncyBTbG90IGNsYXNzZXMuXG4gICAgICogQGF1dGhvciBNaWxsZXIgTWVkZWlyb3NcbiAgICAgKiBAY29uc3RydWN0b3JcbiAgICAgKiBAaW50ZXJuYWxcbiAgICAgKiBAbmFtZSBTaWduYWxCaW5kaW5nXG4gICAgICogQHBhcmFtIHtTaWduYWx9IHNpZ25hbCBSZWZlcmVuY2UgdG8gU2lnbmFsIG9iamVjdCB0aGF0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBib3VuZCB0by5cbiAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBIYW5kbGVyIGZ1bmN0aW9uIGJvdW5kIHRvIHRoZSBzaWduYWwuXG4gICAgICogQHBhcmFtIHtib29sZWFufSBpc09uY2UgSWYgYmluZGluZyBzaG91bGQgYmUgZXhlY3V0ZWQganVzdCBvbmNlLlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBbbGlzdGVuZXJDb250ZXh0XSBDb250ZXh0IG9uIHdoaWNoIGxpc3RlbmVyIHdpbGwgYmUgZXhlY3V0ZWQgKG9iamVjdCB0aGF0IHNob3VsZCByZXByZXNlbnQgdGhlIGB0aGlzYCB2YXJpYWJsZSBpbnNpZGUgbGlzdGVuZXIgZnVuY3Rpb24pLlxuICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIChkZWZhdWx0ID0gMCkuXG4gICAgICovXG4gICAgZnVuY3Rpb24gU2lnbmFsQmluZGluZyhzaWduYWwsIGxpc3RlbmVyLCBpc09uY2UsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSGFuZGxlciBmdW5jdGlvbiBib3VuZCB0byB0aGUgc2lnbmFsLlxuICAgICAgICAgKiBAdHlwZSBGdW5jdGlvblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fbGlzdGVuZXIgPSBsaXN0ZW5lcjtcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgYmluZGluZyBzaG91bGQgYmUgZXhlY3V0ZWQganVzdCBvbmNlLlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9pc09uY2UgPSBpc09uY2U7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBtZW1iZXJPZiBTaWduYWxCaW5kaW5nLnByb3RvdHlwZVxuICAgICAgICAgKiBAbmFtZSBjb250ZXh0XG4gICAgICAgICAqIEB0eXBlIE9iamVjdHx1bmRlZmluZWR8bnVsbFxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5jb250ZXh0ID0gbGlzdGVuZXJDb250ZXh0O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZWZlcmVuY2UgdG8gU2lnbmFsIG9iamVjdCB0aGF0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBib3VuZCB0by5cbiAgICAgICAgICogQHR5cGUgU2lnbmFsXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9zaWduYWwgPSBzaWduYWw7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExpc3RlbmVyIHByaW9yaXR5XG4gICAgICAgICAqIEB0eXBlIE51bWJlclxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgdGhpcy5fcHJpb3JpdHkgPSBwcmlvcml0eSB8fCAwO1xuICAgIH1cblxuICAgIFNpZ25hbEJpbmRpbmcucHJvdG90eXBlID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBJZiBiaW5kaW5nIGlzIGFjdGl2ZSBhbmQgc2hvdWxkIGJlIGV4ZWN1dGVkLlxuICAgICAgICAgKiBAdHlwZSBib29sZWFuXG4gICAgICAgICAqL1xuICAgICAgICBhY3RpdmUgOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZWZhdWx0IHBhcmFtZXRlcnMgcGFzc2VkIHRvIGxpc3RlbmVyIGR1cmluZyBgU2lnbmFsLmRpc3BhdGNoYCBhbmQgYFNpZ25hbEJpbmRpbmcuZXhlY3V0ZWAuIChjdXJyaWVkIHBhcmFtZXRlcnMpXG4gICAgICAgICAqIEB0eXBlIEFycmF5fG51bGxcbiAgICAgICAgICovXG4gICAgICAgIHBhcmFtcyA6IG51bGwsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENhbGwgbGlzdGVuZXIgcGFzc2luZyBhcmJpdHJhcnkgcGFyYW1ldGVycy5cbiAgICAgICAgICogPHA+SWYgYmluZGluZyB3YXMgYWRkZWQgdXNpbmcgYFNpZ25hbC5hZGRPbmNlKClgIGl0IHdpbGwgYmUgYXV0b21hdGljYWxseSByZW1vdmVkIGZyb20gc2lnbmFsIGRpc3BhdGNoIHF1ZXVlLCB0aGlzIG1ldGhvZCBpcyB1c2VkIGludGVybmFsbHkgZm9yIHRoZSBzaWduYWwgZGlzcGF0Y2guPC9wPlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBbcGFyYW1zQXJyXSBBcnJheSBvZiBwYXJhbWV0ZXJzIHRoYXQgc2hvdWxkIGJlIHBhc3NlZCB0byB0aGUgbGlzdGVuZXJcbiAgICAgICAgICogQHJldHVybiB7Kn0gVmFsdWUgcmV0dXJuZWQgYnkgdGhlIGxpc3RlbmVyLlxuICAgICAgICAgKi9cbiAgICAgICAgZXhlY3V0ZSA6IGZ1bmN0aW9uIChwYXJhbXNBcnIpIHtcbiAgICAgICAgICAgIHZhciBoYW5kbGVyUmV0dXJuLCBwYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5hY3RpdmUgJiYgISF0aGlzLl9saXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHBhcmFtcyA9IHRoaXMucGFyYW1zPyB0aGlzLnBhcmFtcy5jb25jYXQocGFyYW1zQXJyKSA6IHBhcmFtc0FycjtcbiAgICAgICAgICAgICAgICBoYW5kbGVyUmV0dXJuID0gdGhpcy5fbGlzdGVuZXIuYXBwbHkodGhpcy5jb250ZXh0LCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pc09uY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5kZXRhY2goKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaGFuZGxlclJldHVybjtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRGV0YWNoIGJpbmRpbmcgZnJvbSBzaWduYWwuXG4gICAgICAgICAqIC0gYWxpYXMgdG86IG15U2lnbmFsLnJlbW92ZShteUJpbmRpbmcuZ2V0TGlzdGVuZXIoKSk7XG4gICAgICAgICAqIEByZXR1cm4ge0Z1bmN0aW9ufG51bGx9IEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbCBvciBgbnVsbGAgaWYgYmluZGluZyB3YXMgcHJldmlvdXNseSBkZXRhY2hlZC5cbiAgICAgICAgICovXG4gICAgICAgIGRldGFjaCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmlzQm91bmQoKT8gdGhpcy5fc2lnbmFsLnJlbW92ZSh0aGlzLl9saXN0ZW5lciwgdGhpcy5jb250ZXh0KSA6IG51bGw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEByZXR1cm4ge0Jvb2xlYW59IGB0cnVlYCBpZiBiaW5kaW5nIGlzIHN0aWxsIGJvdW5kIHRvIHRoZSBzaWduYWwgYW5kIGhhdmUgYSBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGlzQm91bmQgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gKCEhdGhpcy5fc2lnbmFsICYmICEhdGhpcy5fbGlzdGVuZXIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtib29sZWFufSBJZiBTaWduYWxCaW5kaW5nIHdpbGwgb25seSBiZSBleGVjdXRlZCBvbmNlLlxuICAgICAgICAgKi9cbiAgICAgICAgaXNPbmNlIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2lzT25jZTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259IEhhbmRsZXIgZnVuY3Rpb24gYm91bmQgdG8gdGhlIHNpZ25hbC5cbiAgICAgICAgICovXG4gICAgICAgIGdldExpc3RlbmVyIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2xpc3RlbmVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWx9IFNpZ25hbCB0aGF0IGxpc3RlbmVyIGlzIGN1cnJlbnRseSBib3VuZCB0by5cbiAgICAgICAgICovXG4gICAgICAgIGdldFNpZ25hbCA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zaWduYWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERlbGV0ZSBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfZGVzdHJveSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9zaWduYWw7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fbGlzdGVuZXI7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5jb250ZXh0O1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiB0aGUgb2JqZWN0LlxuICAgICAgICAgKi9cbiAgICAgICAgdG9TdHJpbmcgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1tTaWduYWxCaW5kaW5nIGlzT25jZTonICsgdGhpcy5faXNPbmNlICsnLCBpc0JvdW5kOicrIHRoaXMuaXNCb3VuZCgpICsnLCBhY3RpdmU6JyArIHRoaXMuYWN0aXZlICsgJ10nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbi8qZ2xvYmFsIFNpZ25hbEJpbmRpbmc6ZmFsc2UqL1xuXG4gICAgLy8gU2lnbmFsIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gICAgLy89PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cbiAgICBmdW5jdGlvbiB2YWxpZGF0ZUxpc3RlbmVyKGxpc3RlbmVyLCBmbk5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCAnbGlzdGVuZXIgaXMgYSByZXF1aXJlZCBwYXJhbSBvZiB7Zm59KCkgYW5kIHNob3VsZCBiZSBhIEZ1bmN0aW9uLicucmVwbGFjZSgne2ZufScsIGZuTmFtZSkgKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBicm9hZGNhc3RlclxuICAgICAqIDxiciAvPi0gaW5zcGlyZWQgYnkgUm9iZXJ0IFBlbm5lcidzIEFTMyBTaWduYWxzLlxuICAgICAqIEBuYW1lIFNpZ25hbFxuICAgICAqIEBhdXRob3IgTWlsbGVyIE1lZGVpcm9zXG4gICAgICogQGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgZnVuY3Rpb24gU2lnbmFsKCkge1xuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgQXJyYXkuPFNpZ25hbEJpbmRpbmc+XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICB0aGlzLl9iaW5kaW5ncyA9IFtdO1xuICAgICAgICB0aGlzLl9wcmV2UGFyYW1zID0gbnVsbDtcblxuICAgICAgICAvLyBlbmZvcmNlIGRpc3BhdGNoIHRvIGF3YXlzIHdvcmsgb24gc2FtZSBjb250ZXh0ICgjNDcpXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5kaXNwYXRjaCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICBTaWduYWwucHJvdG90eXBlLmRpc3BhdGNoLmFwcGx5KHNlbGYsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgU2lnbmFsLnByb3RvdHlwZSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2lnbmFscyBWZXJzaW9uIE51bWJlclxuICAgICAgICAgKiBAdHlwZSBTdHJpbmdcbiAgICAgICAgICogQGNvbnN0XG4gICAgICAgICAqL1xuICAgICAgICBWRVJTSU9OIDogJzEuMC4wJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgU2lnbmFsIHNob3VsZCBrZWVwIHJlY29yZCBvZiBwcmV2aW91c2x5IGRpc3BhdGNoZWQgcGFyYW1ldGVycyBhbmRcbiAgICAgICAgICogYXV0b21hdGljYWxseSBleGVjdXRlIGxpc3RlbmVyIGR1cmluZyBgYWRkKClgL2BhZGRPbmNlKClgIGlmIFNpZ25hbCB3YXNcbiAgICAgICAgICogYWxyZWFkeSBkaXNwYXRjaGVkIGJlZm9yZS5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgbWVtb3JpemUgOiBmYWxzZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKiBAcHJpdmF0ZVxuICAgICAgICAgKi9cbiAgICAgICAgX3Nob3VsZFByb3BhZ2F0ZSA6IHRydWUsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIElmIFNpZ25hbCBpcyBhY3RpdmUgYW5kIHNob3VsZCBicm9hZGNhc3QgZXZlbnRzLlxuICAgICAgICAgKiA8cD48c3Ryb25nPklNUE9SVEFOVDo8L3N0cm9uZz4gU2V0dGluZyB0aGlzIHByb3BlcnR5IGR1cmluZyBhIGRpc3BhdGNoIHdpbGwgb25seSBhZmZlY3QgdGhlIG5leHQgZGlzcGF0Y2gsIGlmIHlvdSB3YW50IHRvIHN0b3AgdGhlIHByb3BhZ2F0aW9uIG9mIGEgc2lnbmFsIHVzZSBgaGFsdCgpYCBpbnN0ZWFkLjwvcD5cbiAgICAgICAgICogQHR5cGUgYm9vbGVhblxuICAgICAgICAgKi9cbiAgICAgICAgYWN0aXZlIDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXJcbiAgICAgICAgICogQHBhcmFtIHtib29sZWFufSBpc09uY2VcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbEJpbmRpbmd9XG4gICAgICAgICAqIEBwcml2YXRlXG4gICAgICAgICAqL1xuICAgICAgICBfcmVnaXN0ZXJMaXN0ZW5lciA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgaXNPbmNlLCBsaXN0ZW5lckNvbnRleHQsIHByaW9yaXR5KSB7XG5cbiAgICAgICAgICAgIHZhciBwcmV2SW5kZXggPSB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGxpc3RlbmVyQ29udGV4dCksXG4gICAgICAgICAgICAgICAgYmluZGluZztcblxuICAgICAgICAgICAgaWYgKHByZXZJbmRleCAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBiaW5kaW5nID0gdGhpcy5fYmluZGluZ3NbcHJldkluZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoYmluZGluZy5pc09uY2UoKSAhPT0gaXNPbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IGNhbm5vdCBhZGQnKyAoaXNPbmNlPyAnJyA6ICdPbmNlJykgKycoKSB0aGVuIGFkZCcrICghaXNPbmNlPyAnJyA6ICdPbmNlJykgKycoKSB0aGUgc2FtZSBsaXN0ZW5lciB3aXRob3V0IHJlbW92aW5nIHRoZSByZWxhdGlvbnNoaXAgZmlyc3QuJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBiaW5kaW5nID0gbmV3IFNpZ25hbEJpbmRpbmcodGhpcywgbGlzdGVuZXIsIGlzT25jZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSk7XG4gICAgICAgICAgICAgICAgdGhpcy5fYWRkQmluZGluZyhiaW5kaW5nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYodGhpcy5tZW1vcml6ZSAmJiB0aGlzLl9wcmV2UGFyYW1zKXtcbiAgICAgICAgICAgICAgICBiaW5kaW5nLmV4ZWN1dGUodGhpcy5fcHJldlBhcmFtcyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBiaW5kaW5nO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBAcGFyYW0ge1NpZ25hbEJpbmRpbmd9IGJpbmRpbmdcbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9hZGRCaW5kaW5nIDogZnVuY3Rpb24gKGJpbmRpbmcpIHtcbiAgICAgICAgICAgIC8vc2ltcGxpZmllZCBpbnNlcnRpb24gc29ydFxuICAgICAgICAgICAgdmFyIG4gPSB0aGlzLl9iaW5kaW5ncy5sZW5ndGg7XG4gICAgICAgICAgICBkbyB7IC0tbjsgfSB3aGlsZSAodGhpcy5fYmluZGluZ3Nbbl0gJiYgYmluZGluZy5fcHJpb3JpdHkgPD0gdGhpcy5fYmluZGluZ3Nbbl0uX3ByaW9yaXR5KTtcbiAgICAgICAgICAgIHRoaXMuX2JpbmRpbmdzLnNwbGljZShuICsgMSwgMCwgYmluZGluZyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyXG4gICAgICAgICAqIEByZXR1cm4ge251bWJlcn1cbiAgICAgICAgICogQHByaXZhdGVcbiAgICAgICAgICovXG4gICAgICAgIF9pbmRleE9mTGlzdGVuZXIgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhciBuID0gdGhpcy5fYmluZGluZ3MubGVuZ3RoLFxuICAgICAgICAgICAgICAgIGN1cjtcbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICBjdXIgPSB0aGlzLl9iaW5kaW5nc1tuXTtcbiAgICAgICAgICAgICAgICBpZiAoY3VyLl9saXN0ZW5lciA9PT0gbGlzdGVuZXIgJiYgY3VyLmNvbnRleHQgPT09IGNvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDaGVjayBpZiBsaXN0ZW5lciB3YXMgYXR0YWNoZWQgdG8gU2lnbmFsLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lclxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdXG4gICAgICAgICAqIEByZXR1cm4ge2Jvb2xlYW59IGlmIFNpZ25hbCBoYXMgdGhlIHNwZWNpZmllZCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGhhcyA6IGZ1bmN0aW9uIChsaXN0ZW5lciwgY29udGV4dCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2luZGV4T2ZMaXN0ZW5lcihsaXN0ZW5lciwgY29udGV4dCkgIT09IC0xO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBBZGQgYSBsaXN0ZW5lciB0byB0aGUgc2lnbmFsLlxuICAgICAgICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBsaXN0ZW5lciBTaWduYWwgaGFuZGxlciBmdW5jdGlvbi5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IFtsaXN0ZW5lckNvbnRleHRdIENvbnRleHQgb24gd2hpY2ggbGlzdGVuZXIgd2lsbCBiZSBleGVjdXRlZCAob2JqZWN0IHRoYXQgc2hvdWxkIHJlcHJlc2VudCB0aGUgYHRoaXNgIHZhcmlhYmxlIGluc2lkZSBsaXN0ZW5lciBmdW5jdGlvbikuXG4gICAgICAgICAqIEBwYXJhbSB7TnVtYmVyfSBbcHJpb3JpdHldIFRoZSBwcmlvcml0eSBsZXZlbCBvZiB0aGUgZXZlbnQgbGlzdGVuZXIuIExpc3RlbmVycyB3aXRoIGhpZ2hlciBwcmlvcml0eSB3aWxsIGJlIGV4ZWN1dGVkIGJlZm9yZSBsaXN0ZW5lcnMgd2l0aCBsb3dlciBwcmlvcml0eS4gTGlzdGVuZXJzIHdpdGggc2FtZSBwcmlvcml0eSBsZXZlbCB3aWxsIGJlIGV4ZWN1dGVkIGF0IHRoZSBzYW1lIG9yZGVyIGFzIHRoZXkgd2VyZSBhZGRlZC4gKGRlZmF1bHQgPSAwKVxuICAgICAgICAgKiBAcmV0dXJuIHtTaWduYWxCaW5kaW5nfSBBbiBPYmplY3QgcmVwcmVzZW50aW5nIHRoZSBiaW5kaW5nIGJldHdlZW4gdGhlIFNpZ25hbCBhbmQgbGlzdGVuZXIuXG4gICAgICAgICAqL1xuICAgICAgICBhZGQgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsICdhZGQnKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZWdpc3Rlckxpc3RlbmVyKGxpc3RlbmVyLCBmYWxzZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEFkZCBsaXN0ZW5lciB0byB0aGUgc2lnbmFsIHRoYXQgc2hvdWxkIGJlIHJlbW92ZWQgYWZ0ZXIgZmlyc3QgZXhlY3V0aW9uICh3aWxsIGJlIGV4ZWN1dGVkIG9ubHkgb25jZSkuXG4gICAgICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGxpc3RlbmVyIFNpZ25hbCBoYW5kbGVyIGZ1bmN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2xpc3RlbmVyQ29udGV4dF0gQ29udGV4dCBvbiB3aGljaCBsaXN0ZW5lciB3aWxsIGJlIGV4ZWN1dGVkIChvYmplY3QgdGhhdCBzaG91bGQgcmVwcmVzZW50IHRoZSBgdGhpc2AgdmFyaWFibGUgaW5zaWRlIGxpc3RlbmVyIGZ1bmN0aW9uKS5cbiAgICAgICAgICogQHBhcmFtIHtOdW1iZXJ9IFtwcmlvcml0eV0gVGhlIHByaW9yaXR5IGxldmVsIG9mIHRoZSBldmVudCBsaXN0ZW5lci4gTGlzdGVuZXJzIHdpdGggaGlnaGVyIHByaW9yaXR5IHdpbGwgYmUgZXhlY3V0ZWQgYmVmb3JlIGxpc3RlbmVycyB3aXRoIGxvd2VyIHByaW9yaXR5LiBMaXN0ZW5lcnMgd2l0aCBzYW1lIHByaW9yaXR5IGxldmVsIHdpbGwgYmUgZXhlY3V0ZWQgYXQgdGhlIHNhbWUgb3JkZXIgYXMgdGhleSB3ZXJlIGFkZGVkLiAoZGVmYXVsdCA9IDApXG4gICAgICAgICAqIEByZXR1cm4ge1NpZ25hbEJpbmRpbmd9IEFuIE9iamVjdCByZXByZXNlbnRpbmcgdGhlIGJpbmRpbmcgYmV0d2VlbiB0aGUgU2lnbmFsIGFuZCBsaXN0ZW5lci5cbiAgICAgICAgICovXG4gICAgICAgIGFkZE9uY2UgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGxpc3RlbmVyQ29udGV4dCwgcHJpb3JpdHkpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsICdhZGRPbmNlJyk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVnaXN0ZXJMaXN0ZW5lcihsaXN0ZW5lciwgdHJ1ZSwgbGlzdGVuZXJDb250ZXh0LCBwcmlvcml0eSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZSBhIHNpbmdsZSBsaXN0ZW5lciBmcm9tIHRoZSBkaXNwYXRjaCBxdWV1ZS5cbiAgICAgICAgICogQHBhcmFtIHtGdW5jdGlvbn0gbGlzdGVuZXIgSGFuZGxlciBmdW5jdGlvbiB0aGF0IHNob3VsZCBiZSByZW1vdmVkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gW2NvbnRleHRdIEV4ZWN1dGlvbiBjb250ZXh0IChzaW5jZSB5b3UgY2FuIGFkZCB0aGUgc2FtZSBoYW5kbGVyIG11bHRpcGxlIHRpbWVzIGlmIGV4ZWN1dGluZyBpbiBhIGRpZmZlcmVudCBjb250ZXh0KS5cbiAgICAgICAgICogQHJldHVybiB7RnVuY3Rpb259IExpc3RlbmVyIGhhbmRsZXIgZnVuY3Rpb24uXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmUgOiBmdW5jdGlvbiAobGlzdGVuZXIsIGNvbnRleHQpIHtcbiAgICAgICAgICAgIHZhbGlkYXRlTGlzdGVuZXIobGlzdGVuZXIsICdyZW1vdmUnKTtcblxuICAgICAgICAgICAgdmFyIGkgPSB0aGlzLl9pbmRleE9mTGlzdGVuZXIobGlzdGVuZXIsIGNvbnRleHQpO1xuICAgICAgICAgICAgaWYgKGkgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3NbaV0uX2Rlc3Ryb3koKTsgLy9ubyByZWFzb24gdG8gYSBTaWduYWxCaW5kaW5nIGV4aXN0IGlmIGl0IGlzbid0IGF0dGFjaGVkIHRvIGEgc2lnbmFsXG4gICAgICAgICAgICAgICAgdGhpcy5fYmluZGluZ3Muc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGxpc3RlbmVyO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmUgYWxsIGxpc3RlbmVycyBmcm9tIHRoZSBTaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmVBbGwgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aDtcbiAgICAgICAgICAgIHdoaWxlIChuLS0pIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9iaW5kaW5nc1tuXS5fZGVzdHJveSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fYmluZGluZ3MubGVuZ3RoID0gMDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7bnVtYmVyfSBOdW1iZXIgb2YgbGlzdGVuZXJzIGF0dGFjaGVkIHRvIHRoZSBTaWduYWwuXG4gICAgICAgICAqL1xuICAgICAgICBnZXROdW1MaXN0ZW5lcnMgOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYmluZGluZ3MubGVuZ3RoO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTdG9wIHByb3BhZ2F0aW9uIG9mIHRoZSBldmVudCwgYmxvY2tpbmcgdGhlIGRpc3BhdGNoIHRvIG5leHQgbGlzdGVuZXJzIG9uIHRoZSBxdWV1ZS5cbiAgICAgICAgICogPHA+PHN0cm9uZz5JTVBPUlRBTlQ6PC9zdHJvbmc+IHNob3VsZCBiZSBjYWxsZWQgb25seSBkdXJpbmcgc2lnbmFsIGRpc3BhdGNoLCBjYWxsaW5nIGl0IGJlZm9yZS9hZnRlciBkaXNwYXRjaCB3b24ndCBhZmZlY3Qgc2lnbmFsIGJyb2FkY2FzdC48L3A+XG4gICAgICAgICAqIEBzZWUgU2lnbmFsLnByb3RvdHlwZS5kaXNhYmxlXG4gICAgICAgICAqL1xuICAgICAgICBoYWx0IDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy5fc2hvdWxkUHJvcGFnYXRlID0gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIERpc3BhdGNoL0Jyb2FkY2FzdCBTaWduYWwgdG8gYWxsIGxpc3RlbmVycyBhZGRlZCB0byB0aGUgcXVldWUuXG4gICAgICAgICAqIEBwYXJhbSB7Li4uKn0gW3BhcmFtc10gUGFyYW1ldGVycyB0aGF0IHNob3VsZCBiZSBwYXNzZWQgdG8gZWFjaCBoYW5kbGVyLlxuICAgICAgICAgKi9cbiAgICAgICAgZGlzcGF0Y2ggOiBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgICAgICBpZiAoISB0aGlzLmFjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHBhcmFtc0FyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgICAgICAgbiA9IHRoaXMuX2JpbmRpbmdzLmxlbmd0aCxcbiAgICAgICAgICAgICAgICBiaW5kaW5ncztcblxuICAgICAgICAgICAgaWYgKHRoaXMubWVtb3JpemUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLl9wcmV2UGFyYW1zID0gcGFyYW1zQXJyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoISBuKSB7XG4gICAgICAgICAgICAgICAgLy9zaG91bGQgY29tZSBhZnRlciBtZW1vcml6ZVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYmluZGluZ3MgPSB0aGlzLl9iaW5kaW5ncy5zbGljZSgpOyAvL2Nsb25lIGFycmF5IGluIGNhc2UgYWRkL3JlbW92ZSBpdGVtcyBkdXJpbmcgZGlzcGF0Y2hcbiAgICAgICAgICAgIHRoaXMuX3Nob3VsZFByb3BhZ2F0ZSA9IHRydWU7IC8vaW4gY2FzZSBgaGFsdGAgd2FzIGNhbGxlZCBiZWZvcmUgZGlzcGF0Y2ggb3IgZHVyaW5nIHRoZSBwcmV2aW91cyBkaXNwYXRjaC5cblxuICAgICAgICAgICAgLy9leGVjdXRlIGFsbCBjYWxsYmFja3MgdW50aWwgZW5kIG9mIHRoZSBsaXN0IG9yIHVudGlsIGEgY2FsbGJhY2sgcmV0dXJucyBgZmFsc2VgIG9yIHN0b3BzIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAvL3JldmVyc2UgbG9vcCBzaW5jZSBsaXN0ZW5lcnMgd2l0aCBoaWdoZXIgcHJpb3JpdHkgd2lsbCBiZSBhZGRlZCBhdCB0aGUgZW5kIG9mIHRoZSBsaXN0XG4gICAgICAgICAgICBkbyB7IG4tLTsgfSB3aGlsZSAoYmluZGluZ3Nbbl0gJiYgdGhpcy5fc2hvdWxkUHJvcGFnYXRlICYmIGJpbmRpbmdzW25dLmV4ZWN1dGUocGFyYW1zQXJyKSAhPT0gZmFsc2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3JnZXQgbWVtb3JpemVkIGFyZ3VtZW50cy5cbiAgICAgICAgICogQHNlZSBTaWduYWwubWVtb3JpemVcbiAgICAgICAgICovXG4gICAgICAgIGZvcmdldCA6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB0aGlzLl9wcmV2UGFyYW1zID0gbnVsbDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlIGFsbCBiaW5kaW5ncyBmcm9tIHNpZ25hbCBhbmQgZGVzdHJveSBhbnkgcmVmZXJlbmNlIHRvIGV4dGVybmFsIG9iamVjdHMgKGRlc3Ryb3kgU2lnbmFsIG9iamVjdCkuXG4gICAgICAgICAqIDxwPjxzdHJvbmc+SU1QT1JUQU5UOjwvc3Ryb25nPiBjYWxsaW5nIGFueSBtZXRob2Qgb24gdGhlIHNpZ25hbCBpbnN0YW5jZSBhZnRlciBjYWxsaW5nIGRpc3Bvc2Ugd2lsbCB0aHJvdyBlcnJvcnMuPC9wPlxuICAgICAgICAgKi9cbiAgICAgICAgZGlzcG9zZSA6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMucmVtb3ZlQWxsKCk7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fYmluZGluZ3M7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5fcHJldlBhcmFtcztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQHJldHVybiB7c3RyaW5nfSBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG9iamVjdC5cbiAgICAgICAgICovXG4gICAgICAgIHRvU3RyaW5nIDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICdbU2lnbmFsIGFjdGl2ZTonKyB0aGlzLmFjdGl2ZSArJyBudW1MaXN0ZW5lcnM6JysgdGhpcy5nZXROdW1MaXN0ZW5lcnMoKSArJ10nO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG5cbiAgICAvLyBOYW1lc3BhY2UgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgICAvLz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblxuICAgIC8qKlxuICAgICAqIFNpZ25hbHMgbmFtZXNwYWNlXG4gICAgICogQG5hbWVzcGFjZVxuICAgICAqIEBuYW1lIHNpZ25hbHNcbiAgICAgKi9cbiAgICB2YXIgc2lnbmFscyA9IFNpZ25hbDtcblxuICAgIC8qKlxuICAgICAqIEN1c3RvbSBldmVudCBicm9hZGNhc3RlclxuICAgICAqIEBzZWUgU2lnbmFsXG4gICAgICovXG4gICAgLy8gYWxpYXMgZm9yIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IChzZWUgI2doLTQ0KVxuICAgIHNpZ25hbHMuU2lnbmFsID0gU2lnbmFsO1xuXG5cblxuICAgIC8vZXhwb3J0cyB0byBtdWx0aXBsZSBlbnZpcm9ubWVudHNcbiAgICBpZih0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpeyAvL0FNRFxuICAgICAgICBkZWZpbmUoZnVuY3Rpb24gKCkgeyByZXR1cm4gc2lnbmFsczsgfSk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiBtb2R1bGUuZXhwb3J0cyl7IC8vbm9kZVxuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IHNpZ25hbHM7XG4gICAgfSBlbHNlIHsgLy9icm93c2VyXG4gICAgICAgIC8vdXNlIHN0cmluZyBiZWNhdXNlIG9mIEdvb2dsZSBjbG9zdXJlIGNvbXBpbGVyIEFEVkFOQ0VEX01PREVcbiAgICAgICAgLypqc2xpbnQgc3ViOnRydWUgKi9cbiAgICAgICAgZ2xvYmFsWydzaWduYWxzJ10gPSBzaWduYWxzO1xuICAgIH1cblxufSh0aGlzKSk7XG4iLCJmdW5jdGlvbiBoYXNHZXR0ZXJPclNldHRlcihkZWYpIHtcblx0cmV0dXJuICghIWRlZi5nZXQgJiYgdHlwZW9mIGRlZi5nZXQgPT09IFwiZnVuY3Rpb25cIikgfHwgKCEhZGVmLnNldCAmJiB0eXBlb2YgZGVmLnNldCA9PT0gXCJmdW5jdGlvblwiKTtcbn1cblxuZnVuY3Rpb24gZ2V0UHJvcGVydHkoZGVmaW5pdGlvbiwgaywgaXNDbGFzc0Rlc2NyaXB0b3IpIHtcblx0Ly9UaGlzIG1heSBiZSBhIGxpZ2h0d2VpZ2h0IG9iamVjdCwgT1IgaXQgbWlnaHQgYmUgYSBwcm9wZXJ0eVxuXHQvL3RoYXQgd2FzIGRlZmluZWQgcHJldmlvdXNseS5cblx0XG5cdC8vRm9yIHNpbXBsZSBjbGFzcyBkZXNjcmlwdG9ycyB3ZSBjYW4ganVzdCBhc3N1bWUgaXRzIE5PVCBwcmV2aW91c2x5IGRlZmluZWQuXG5cdHZhciBkZWYgPSBpc0NsYXNzRGVzY3JpcHRvciBcblx0XHRcdFx0PyBkZWZpbml0aW9uW2tdIFxuXHRcdFx0XHQ6IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IoZGVmaW5pdGlvbiwgayk7XG5cblx0aWYgKCFpc0NsYXNzRGVzY3JpcHRvciAmJiBkZWYudmFsdWUgJiYgdHlwZW9mIGRlZi52YWx1ZSA9PT0gXCJvYmplY3RcIikge1xuXHRcdGRlZiA9IGRlZi52YWx1ZTtcblx0fVxuXG5cblx0Ly9UaGlzIG1pZ2h0IGJlIGEgcmVndWxhciBwcm9wZXJ0eSwgb3IgaXQgbWF5IGJlIGEgZ2V0dGVyL3NldHRlciB0aGUgdXNlciBkZWZpbmVkIGluIGEgY2xhc3MuXG5cdGlmICggZGVmICYmIGhhc0dldHRlck9yU2V0dGVyKGRlZikgKSB7XG5cdFx0aWYgKHR5cGVvZiBkZWYuZW51bWVyYWJsZSA9PT0gXCJ1bmRlZmluZWRcIilcblx0XHRcdGRlZi5lbnVtZXJhYmxlID0gdHJ1ZTtcblx0XHRpZiAodHlwZW9mIGRlZi5jb25maWd1cmFibGUgPT09IFwidW5kZWZpbmVkXCIpXG5cdFx0XHRkZWYuY29uZmlndXJhYmxlID0gdHJ1ZTtcblx0XHRyZXR1cm4gZGVmO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiBmYWxzZTtcblx0fVxufVxuXG5mdW5jdGlvbiBoYXNOb25Db25maWd1cmFibGUob2JqLCBrKSB7XG5cdHZhciBwcm9wID0gT2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcihvYmosIGspO1xuXHRpZiAoIXByb3ApXG5cdFx0cmV0dXJuIGZhbHNlO1xuXG5cdGlmIChwcm9wLnZhbHVlICYmIHR5cGVvZiBwcm9wLnZhbHVlID09PSBcIm9iamVjdFwiKVxuXHRcdHByb3AgPSBwcm9wLnZhbHVlO1xuXG5cdGlmIChwcm9wLmNvbmZpZ3VyYWJsZSA9PT0gZmFsc2UpIFxuXHRcdHJldHVybiB0cnVlO1xuXG5cdHJldHVybiBmYWxzZTtcbn1cblxuLy9UT0RPOiBPbiBjcmVhdGUsIFxuLy9cdFx0T24gbWl4aW4sIFxuXG5mdW5jdGlvbiBleHRlbmQoY3RvciwgZGVmaW5pdGlvbiwgaXNDbGFzc0Rlc2NyaXB0b3IsIGV4dGVuZCkge1xuXHRmb3IgKHZhciBrIGluIGRlZmluaXRpb24pIHtcblx0XHRpZiAoIWRlZmluaXRpb24uaGFzT3duUHJvcGVydHkoaykpXG5cdFx0XHRjb250aW51ZTtcblxuXHRcdHZhciBkZWYgPSBnZXRQcm9wZXJ0eShkZWZpbml0aW9uLCBrLCBpc0NsYXNzRGVzY3JpcHRvcik7XG5cblx0XHRpZiAoZGVmICE9PSBmYWxzZSkge1xuXHRcdFx0Ly9JZiBFeHRlbmRzIGlzIHVzZWQsIHdlIHdpbGwgY2hlY2sgaXRzIHByb3RvdHlwZSB0byBzZWUgaWYgXG5cdFx0XHQvL3RoZSBmaW5hbCB2YXJpYWJsZSBleGlzdHMuXG5cdFx0XHRcblx0XHRcdHZhciBwYXJlbnQgPSBleHRlbmQgfHwgY3Rvcjtcblx0XHRcdGlmIChoYXNOb25Db25maWd1cmFibGUocGFyZW50LnByb3RvdHlwZSwgaykpIHtcblxuXHRcdFx0XHQvL2p1c3Qgc2tpcCB0aGUgZmluYWwgcHJvcGVydHlcblx0XHRcdFx0aWYgKENsYXNzLmlnbm9yZUZpbmFscylcblx0XHRcdFx0XHRjb250aW51ZTtcblxuXHRcdFx0XHQvL1dlIGNhbm5vdCByZS1kZWZpbmUgYSBwcm9wZXJ0eSB0aGF0IGlzIGNvbmZpZ3VyYWJsZT1mYWxzZS5cblx0XHRcdFx0Ly9TbyB3ZSB3aWxsIGNvbnNpZGVyIHRoZW0gZmluYWwgYW5kIHRocm93IGFuIGVycm9yLiBUaGlzIGlzIGJ5XG5cdFx0XHRcdC8vZGVmYXVsdCBzbyBpdCBpcyBjbGVhciB0byB0aGUgZGV2ZWxvcGVyIHdoYXQgaXMgaGFwcGVuaW5nLlxuXHRcdFx0XHQvL1lvdSBjYW4gc2V0IGlnbm9yZUZpbmFscyB0byB0cnVlIGlmIHlvdSBuZWVkIHRvIGV4dGVuZCBhIGNsYXNzXG5cdFx0XHRcdC8vd2hpY2ggaGFzIGNvbmZpZ3VyYWJsZT1mYWxzZTsgaXQgd2lsbCBzaW1wbHkgbm90IHJlLWRlZmluZSBmaW5hbCBwcm9wZXJ0aWVzLlxuXHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJjYW5ub3Qgb3ZlcnJpZGUgZmluYWwgcHJvcGVydHkgJ1wiK2tcblx0XHRcdFx0XHRcdFx0K1wiJywgc2V0IENsYXNzLmlnbm9yZUZpbmFscyA9IHRydWUgdG8gc2tpcFwiKTtcblx0XHRcdH1cblxuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGN0b3IucHJvdG90eXBlLCBrLCBkZWYpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRjdG9yLnByb3RvdHlwZVtrXSA9IGRlZmluaXRpb25ba107XG5cdFx0fVxuXG5cdH1cbn1cblxuLyoqXG4gKi9cbmZ1bmN0aW9uIG1peGluKG15Q2xhc3MsIG1peGlucykge1xuXHRpZiAoIW1peGlucylcblx0XHRyZXR1cm47XG5cblx0aWYgKCFBcnJheS5pc0FycmF5KG1peGlucykpXG5cdFx0bWl4aW5zID0gW21peGluc107XG5cblx0Zm9yICh2YXIgaT0wOyBpPG1peGlucy5sZW5ndGg7IGkrKykge1xuXHRcdGV4dGVuZChteUNsYXNzLCBtaXhpbnNbaV0ucHJvdG90eXBlIHx8IG1peGluc1tpXSk7XG5cdH1cbn1cblxuLyoqXG4gKiBcbiAqL1xuZnVuY3Rpb24gQ2xhc3MoZGVmaW5pdGlvbikge1xuXHRpZiAoIWRlZmluaXRpb24pXG5cdFx0ZGVmaW5pdGlvbiA9IHt9O1xuXG5cdC8vVGhlIHZhcmlhYmxlIG5hbWUgaGVyZSBkaWN0YXRlcyB3aGF0IHdlIHNlZSBpbiBDaHJvbWUgZGVidWdnZXJcblx0dmFyIGluaXRpYWxpemU7XG5cdHZhciBFeHRlbmRzO1xuXG5cdGlmIChkZWZpbml0aW9uLmluaXRpYWxpemUpIHtcblx0XHRpZiAodHlwZW9mIGRlZmluaXRpb24uaW5pdGlhbGl6ZSAhPT0gXCJmdW5jdGlvblwiKVxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiaW5pdGlhbGl6ZSBtdXN0IGJlIGEgZnVuY3Rpb25cIik7XG5cdFx0aW5pdGlhbGl6ZSA9IGRlZmluaXRpb24uaW5pdGlhbGl6ZTtcblxuXHRcdC8vVXN1YWxseSB3ZSBzaG91bGQgYXZvaWQgXCJkZWxldGVcIiBpbiBWOCBhdCBhbGwgY29zdHMuXG5cdFx0Ly9Ib3dldmVyLCBpdHMgdW5saWtlbHkgdG8gbWFrZSBhbnkgcGVyZm9ybWFuY2UgZGlmZmVyZW5jZVxuXHRcdC8vaGVyZSBzaW5jZSB3ZSBvbmx5IGNhbGwgdGhpcyBvbiBjbGFzcyBjcmVhdGlvbiAoaS5lLiBub3Qgb2JqZWN0IGNyZWF0aW9uKS5cblx0XHRkZWxldGUgZGVmaW5pdGlvbi5pbml0aWFsaXplO1xuXHR9IGVsc2Uge1xuXHRcdGlmIChkZWZpbml0aW9uLkV4dGVuZHMpIHtcblx0XHRcdHZhciBiYXNlID0gZGVmaW5pdGlvbi5FeHRlbmRzO1xuXHRcdFx0aW5pdGlhbGl6ZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdFx0YmFzZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHRcdFx0fTsgXG5cdFx0fSBlbHNlIHtcblx0XHRcdGluaXRpYWxpemUgPSBmdW5jdGlvbiAoKSB7fTsgXG5cdFx0fVxuXHR9XG5cblx0aWYgKGRlZmluaXRpb24uRXh0ZW5kcykge1xuXHRcdGluaXRpYWxpemUucHJvdG90eXBlID0gT2JqZWN0LmNyZWF0ZShkZWZpbml0aW9uLkV4dGVuZHMucHJvdG90eXBlKTtcblx0XHRpbml0aWFsaXplLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGluaXRpYWxpemU7XG5cdFx0Ly9mb3IgZ2V0T3duUHJvcGVydHlEZXNjcmlwdG9yIHRvIHdvcmssIHdlIG5lZWQgdG8gYWN0XG5cdFx0Ly9kaXJlY3RseSBvbiB0aGUgRXh0ZW5kcyAob3IgTWl4aW4pXG5cdFx0RXh0ZW5kcyA9IGRlZmluaXRpb24uRXh0ZW5kcztcblx0XHRkZWxldGUgZGVmaW5pdGlvbi5FeHRlbmRzO1xuXHR9IGVsc2Uge1xuXHRcdGluaXRpYWxpemUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gaW5pdGlhbGl6ZTtcblx0fVxuXG5cdC8vR3JhYiB0aGUgbWl4aW5zLCBpZiB0aGV5IGFyZSBzcGVjaWZpZWQuLi5cblx0dmFyIG1peGlucyA9IG51bGw7XG5cdGlmIChkZWZpbml0aW9uLk1peGlucykge1xuXHRcdG1peGlucyA9IGRlZmluaXRpb24uTWl4aW5zO1xuXHRcdGRlbGV0ZSBkZWZpbml0aW9uLk1peGlucztcblx0fVxuXG5cdC8vRmlyc3QsIG1peGluIGlmIHdlIGNhbi5cblx0bWl4aW4oaW5pdGlhbGl6ZSwgbWl4aW5zKTtcblxuXHQvL05vdyB3ZSBncmFiIHRoZSBhY3R1YWwgZGVmaW5pdGlvbiB3aGljaCBkZWZpbmVzIHRoZSBvdmVycmlkZXMuXG5cdGV4dGVuZChpbml0aWFsaXplLCBkZWZpbml0aW9uLCB0cnVlLCBFeHRlbmRzKTtcblxuXHRyZXR1cm4gaW5pdGlhbGl6ZTtcbn07XG5cbkNsYXNzLmV4dGVuZCA9IGV4dGVuZDtcbkNsYXNzLm1peGluID0gbWl4aW47XG5DbGFzcy5pZ25vcmVGaW5hbHMgPSBmYWxzZTtcblxubW9kdWxlLmV4cG9ydHMgPSBDbGFzczsiLCIvKipcbiAqIFRoZSBjb3JlIGthbWkgbW9kdWxlIHByb3ZpZGVzIGJhc2ljIDJEIHNwcml0ZSBiYXRjaGluZyBhbmQgXG4gKiBhc3NldCBtYW5hZ2VtZW50LlxuICogXG4gKiBAbW9kdWxlIGthbWlcbiAqL1xuXG52YXIgQ2xhc3MgPSByZXF1aXJlKCdrbGFzc2UnKTtcbnZhciBNZXNoID0gcmVxdWlyZSgnLi9nbHV0aWxzL01lc2gnKTtcblxudmFyIGNvbG9yVG9GbG9hdCA9IHJlcXVpcmUoJ251bWJlci11dGlsJykuY29sb3JUb0Zsb2F0O1xuXG4vKiogXG4gKiBBIGJhdGNoZXIgbWl4aW4gY29tcG9zZWQgb2YgcXVhZHMgKHR3byB0cmlzLCBpbmRleGVkKS4gXG4gKlxuICogVGhpcyBpcyB1c2VkIGludGVybmFsbHk7IHVzZXJzIHNob3VsZCBsb29rIGF0IFxuICoge3sjY3Jvc3NMaW5rIFwiU3ByaXRlQmF0Y2hcIn19e3svY3Jvc3NMaW5rfX0gaW5zdGVhZCwgd2hpY2ggaW5oZXJpdHMgZnJvbSB0aGlzXG4gKiBjbGFzcy5cbiAqIFxuICogVGhlIGJhdGNoZXIgaXRzZWxmIGlzIG5vdCBtYW5hZ2VkIGJ5IFdlYkdMQ29udGV4dDsgaG93ZXZlciwgaXQgbWFrZXNcbiAqIHVzZSBvZiBNZXNoIGFuZCBUZXh0dXJlIHdoaWNoIHdpbGwgYmUgbWFuYWdlZC4gRm9yIHRoaXMgcmVhc29uLCB0aGUgYmF0Y2hlclxuICogZG9lcyBub3QgaG9sZCBhIGRpcmVjdCByZWZlcmVuY2UgdG8gdGhlIEdMIHN0YXRlLlxuICpcbiAqIFN1YmNsYXNzZXMgbXVzdCBpbXBsZW1lbnQgdGhlIGZvbGxvd2luZzogIFxuICoge3sjY3Jvc3NMaW5rIFwiQmFzZUJhdGNoL19jcmVhdGVTaGFkZXI6bWV0aG9kXCJ9fXt7L2Nyb3NzTGlua319ICBcbiAqIHt7I2Nyb3NzTGluayBcIkJhc2VCYXRjaC9fY3JlYXRlVmVydGV4QXR0cmlidXRlczptZXRob2RcIn19e3svY3Jvc3NMaW5rfX0gIFxuICoge3sjY3Jvc3NMaW5rIFwiQmFzZUJhdGNoL2dldFZlcnRleFNpemU6bWV0aG9kXCJ9fXt7L2Nyb3NzTGlua319ICBcbiAqIFxuICogQGNsYXNzICBCYXNlQmF0Y2hcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtXZWJHTENvbnRleHR9IGNvbnRleHQgdGhlIGNvbnRleHQgdGhpcyBiYXRjaGVyIGJlbG9uZ3MgdG9cbiAqIEBwYXJhbSB7TnVtYmVyfSBzaXplIHRoZSBvcHRpb25hbCBzaXplIG9mIHRoaXMgYmF0Y2gsIGkuZS4gbWF4IG51bWJlciBvZiBxdWFkc1xuICogQGRlZmF1bHQgIDUwMFxuICovXG52YXIgQmFzZUJhdGNoID0gbmV3IENsYXNzKHtcblxuXHQvL0NvbnN0cnVjdG9yXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIEJhc2VCYXRjaChjb250ZXh0LCBzaXplKSB7XG5cdFx0aWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcIm9iamVjdFwiKVxuXHRcdFx0dGhyb3cgXCJHTCBjb250ZXh0IG5vdCBzcGVjaWZpZWQgdG8gU3ByaXRlQmF0Y2hcIjtcblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXG5cdFx0dGhpcy5zaXplID0gc2l6ZSB8fCA1MDA7XG5cdFx0XG5cdFx0Ly8gNjU1MzUgaXMgbWF4IGluZGV4LCBzbyA2NTUzNSAvIDYgPSAxMDkyMi5cblx0XHRpZiAodGhpcy5zaXplID4gMTA5MjIpICAvLyh5b3UnZCBoYXZlIHRvIGJlIGluc2FuZSB0byB0cnkgYW5kIGJhdGNoIHRoaXMgbXVjaCB3aXRoIFdlYkdMKVxuXHRcdFx0dGhyb3cgXCJDYW4ndCBoYXZlIG1vcmUgdGhhbiAxMDkyMiBzcHJpdGVzIHBlciBiYXRjaDogXCIgKyB0aGlzLnNpemU7XG5cdFx0XHRcdFxuXHRcdFxuXHRcdC8vVE9ETzogbWFrZSB0aGVzZSBwdWJsaWNcblx0XHR0aGlzLl9ibGVuZFNyYyA9IHRoaXMuY29udGV4dC5nbC5PTkU7XG5cdFx0dGhpcy5fYmxlbmREc3QgPSB0aGlzLmNvbnRleHQuZ2wuT05FX01JTlVTX1NSQ19BTFBIQVxuXHRcdHRoaXMuX2JsZW5kRW5hYmxlZCA9IHRydWU7XG5cdFx0dGhpcy5fc2hhZGVyID0gdGhpcy5fY3JlYXRlU2hhZGVyKCk7XG5cblx0XHQvKipcblx0XHQgKiBUaGlzIHNoYWRlciB3aWxsIGJlIHVzZWQgd2hlbmV2ZXIgXCJudWxsXCIgaXMgcGFzc2VkXG5cdFx0ICogYXMgdGhlIGJhdGNoJ3Mgc2hhZGVyLiBcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSB7U2hhZGVyUHJvZ3JhbX0gc2hhZGVyXG5cdFx0ICovXG5cdFx0dGhpcy5kZWZhdWx0U2hhZGVyID0gdGhpcy5fc2hhZGVyO1xuXG5cdFx0LyoqXG5cdFx0ICogQnkgZGVmYXVsdCwgYSBTcHJpdGVCYXRjaCBpcyBjcmVhdGVkIHdpdGggaXRzIG93biBTaGFkZXJQcm9ncmFtLFxuXHRcdCAqIHN0b3JlZCBpbiBgZGVmYXVsdFNoYWRlcmAuIElmIHRoaXMgZmxhZyBpcyB0cnVlLCBvbiBkZWxldGluZyB0aGUgU3ByaXRlQmF0Y2gsIGl0c1xuXHRcdCAqIGBkZWZhdWx0U2hhZGVyYCB3aWxsIGFsc28gYmUgZGVsZXRlZC4gSWYgdGhpcyBmbGFnIGlzIGZhbHNlLCBubyBzaGFkZXJzXG5cdFx0ICogd2lsbCBiZSBkZWxldGVkIG9uIGRlc3Ryb3kuXG5cdFx0ICpcblx0XHQgKiBOb3RlIHRoYXQgaWYgeW91IHJlLWFzc2lnbiBgZGVmYXVsdFNoYWRlcmAsIHlvdSB3aWxsIG5lZWQgdG8gZGlzcG9zZSB0aGUgcHJldmlvdXNcblx0XHQgKiBkZWZhdWx0IHNoYWRlciB5b3Vyc2VsLiBcblx0XHQgKlxuXHRcdCAqIEBwcm9wZXJ0eSBvd25zU2hhZGVyXG5cdFx0ICogQHR5cGUge0Jvb2xlYW59XG5cdFx0ICovXG5cdFx0dGhpcy5vd25zU2hhZGVyID0gdHJ1ZTtcblxuXHRcdHRoaXMuaWR4ID0gMDtcblx0XHR0aGlzLmRyYXdpbmcgPSBmYWxzZTtcblxuXHRcdHRoaXMubWVzaCA9IHRoaXMuX2NyZWF0ZU1lc2godGhpcy5zaXplKTtcblxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIEFCR1IgcGFja2VkIGNvbG9yLCBhcyBhIHNpbmdsZSBmbG9hdC4gVGhlIGRlZmF1bHRcblx0XHQgKiB2YWx1ZSBpcyB0aGUgY29sb3Igd2hpdGUgKDI1NSwgMjU1LCAyNTUsIDI1NSkuXG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkge051bWJlcn0gY29sb3Jcblx0XHQgKiBAcmVhZE9ubHkgXG5cdFx0ICovXG5cdFx0dGhpcy5jb2xvciA9IGNvbG9yVG9GbG9hdCgyNTUsIDI1NSwgMjU1LCAyNTUpO1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFdoZXRoZXIgdG8gcHJlbXVsdGlwbHkgYWxwaGEgb24gY2FsbHMgdG8gc2V0Q29sb3IuIFxuXHRcdCAqIFRoaXMgaXMgdHJ1ZSBieSBkZWZhdWx0LCBzbyB0aGF0IHdlIGNhbiBjb252ZW5pZW50bHkgd3JpdGU6XG5cdFx0ICpcblx0XHQgKiAgICAgYmF0Y2guc2V0Q29sb3IoMSwgMCwgMCwgMC4yNSk7IC8vdGludHMgcmVkIHdpdGggMjUlIG9wYWNpdHlcblx0XHQgKlxuXHRcdCAqIElmIGZhbHNlLCB5b3UgbXVzdCBwcmVtdWx0aXBseSB0aGUgY29sb3JzIHlvdXJzZWxmIHRvIGFjaGlldmVcblx0XHQgKiB0aGUgc2FtZSB0aW50LCBsaWtlIHNvOlxuXHRcdCAqXG5cdFx0ICogICAgIGJhdGNoLnNldENvbG9yKDAuMjUsIDAsIDAsIDAuMjUpO1xuXHRcdCAqIFxuXHRcdCAqIEBwcm9wZXJ0eSBwcmVtdWx0aXBsaWVkXG5cdFx0ICogQHR5cGUge0Jvb2xlYW59XG5cdFx0ICogQGRlZmF1bHQgIHRydWVcblx0XHQgKi9cblx0XHR0aGlzLnByZW11bHRpcGxpZWQgPSB0cnVlO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBUaGlzIGlzIGEgc2V0dGVyL2dldHRlciBmb3IgdGhpcyBiYXRjaCdzIGN1cnJlbnQgU2hhZGVyUHJvZ3JhbS5cblx0ICogSWYgdGhpcyBpcyBzZXQgd2hlbiB0aGUgYmF0Y2ggaXMgZHJhd2luZywgdGhlIHN0YXRlIHdpbGwgYmUgZmx1c2hlZFxuXHQgKiB0byB0aGUgR1BVIGFuZCB0aGUgbmV3IHNoYWRlciB3aWxsIHRoZW4gYmUgYm91bmQuXG5cdCAqXG5cdCAqIElmIGBudWxsYCBvciBhIGZhbHN5IHZhbHVlIGlzIHNwZWNpZmllZCwgdGhlIGJhdGNoJ3MgYGRlZmF1bHRTaGFkZXJgIHdpbGwgYmUgdXNlZC4gXG5cdCAqXG5cdCAqIE5vdGUgdGhhdCBzaGFkZXJzIGFyZSBib3VuZCBvbiBiYXRjaC5iZWdpbigpLlxuXHQgKlxuXHQgKiBAcHJvcGVydHkgc2hhZGVyXG5cdCAqIEB0eXBlIHtTaGFkZXJQcm9ncmFtfVxuXHQgKi9cblx0c2hhZGVyOiB7XG5cdFx0c2V0OiBmdW5jdGlvbih2YWwpIHtcblx0XHRcdHZhciB3YXNEcmF3aW5nID0gdGhpcy5kcmF3aW5nO1xuXG5cdFx0XHRpZiAod2FzRHJhd2luZykge1xuXHRcdFx0XHR0aGlzLmVuZCgpOyAvL3VuYmluZHMgdGhlIHNoYWRlciBmcm9tIHRoZSBtZXNoXG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuX3NoYWRlciA9IHZhbCA/IHZhbCA6IHRoaXMuZGVmYXVsdFNoYWRlcjtcblxuXHRcdFx0aWYgKHdhc0RyYXdpbmcpIHtcblx0XHRcdFx0dGhpcy5iZWdpbigpO1xuXHRcdFx0fVxuXHRcdH0sXG5cblx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3NoYWRlcjtcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIGNvbG9yIG9mIHRoaXMgc3ByaXRlIGJhdGNoZXIsIHdoaWNoIGlzIHVzZWQgaW4gc3Vic2VxdWVudCBkcmF3XG5cdCAqIGNhbGxzLiBUaGlzIGRvZXMgbm90IGZsdXNoIHRoZSBiYXRjaC5cblx0ICpcblx0ICogSWYgdGhyZWUgb3IgbW9yZSBhcmd1bWVudHMgYXJlIHNwZWNpZmllZCwgdGhpcyBtZXRob2QgYXNzdW1lcyB0aGF0IFJHQiBcblx0ICogb3IgUkdCQSBmbG9hdCB2YWx1ZXMgKDAuMCB0byAxLjApIGFyZSBiZWluZyBwYXNzZWQuIFxuXHQgKiBcblx0ICogSWYgbGVzcyB0aGFuIHRocmVlIGFyZ3VtZW50cyBhcmUgc3BlY2lmaWVkLCB3ZSBvbmx5IGNvbnNpZGVyIHRoZSBmaXJzdCBcblx0ICogYW5kIGFzc2lnbiBpdCB0byBhbGwgZm91ciBjb21wb25lbnRzIC0tIHRoaXMgaXMgdXNlZnVsIGZvciBzZXR0aW5nIHRyYW5zcGFyZW5jeSBcblx0ICogaW4gYSBwcmVtdWx0aXBsaWVkIGFscGhhIHN0YWdlLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBzZXRDb2xvclxuXHQgKiBAcGFyYW0ge051bWJlcn0gciB0aGUgcmVkIGNvbXBvbmVudCwgbm9ybWFsaXplZFxuXHQgKiBAcGFyYW0ge051bWJlcn0gZyB0aGUgZ3JlZW4gY29tcG9uZW50LCBub3JtYWxpemVkXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSBiIHRoZSBibHVlIGNvbXBvbmVudCwgbm9ybWFsaXplZFxuXHQgKiBAcGFyYW0ge051bWJlcn0gYSB0aGUgYWxwaGEgY29tcG9uZW50LCBub3JtYWxpemVkXG5cdCAqL1xuXHRzZXRDb2xvcjogZnVuY3Rpb24ociwgZywgYiwgYSkge1xuXHRcdGlmIChhcmd1bWVudHMubGVuZ3RoID49IDMpIHtcblx0XHRcdC8vZGVmYXVsdCBhbHBoYSB0byBvbmUgXG5cdFx0XHRhID0gKGEgfHwgYSA9PT0gMCkgPyBhIDogMS4wO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyID0gZyA9IGIgPSBhID0gKGFyZ3VtZW50c1swXSB8fCAwKTtcblx0XHR9XG5cblx0XHRpZiAodGhpcy5wcmVtdWx0aXBsaWVkKSB7XG5cdFx0XHRyICo9IGE7XG5cdFx0XHRnICo9IGE7XG5cdFx0XHRiICo9IGE7XG5cdFx0fVxuXHRcdFxuXHRcdHRoaXMuY29sb3IgPSBjb2xvclRvRmxvYXQoXG5cdFx0XHR+fihyICogMjU1KSxcblx0XHRcdH5+KGcgKiAyNTUpLFxuXHRcdFx0fn4oYiAqIDI1NSksXG5cdFx0XHR+fihhICogMjU1KVxuXHRcdCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxlZCBmcm9tIHRoZSBjb25zdHJ1Y3RvciB0byBjcmVhdGUgYSBuZXcgTWVzaCBcblx0ICogYmFzZWQgb24gdGhlIGV4cGVjdGVkIGJhdGNoIHNpemUuIFNob3VsZCBzZXQgdXBcblx0ICogdmVydHMgJiBpbmRpY2VzIHByb3Blcmx5LlxuXHQgKlxuXHQgKiBVc2VycyBzaG91bGQgbm90IGNhbGwgdGhpcyBkaXJlY3RseTsgaW5zdGVhZCwgaXRcblx0ICogc2hvdWxkIG9ubHkgYmUgaW1wbGVtZW50ZWQgYnkgc3ViY2xhc3Nlcy5cblx0ICogXG5cdCAqIEBtZXRob2QgX2NyZWF0ZU1lc2hcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHNpemUgdGhlIHNpemUgcGFzc2VkIHRocm91Z2ggdGhlIGNvbnN0cnVjdG9yXG5cdCAqL1xuXHRfY3JlYXRlTWVzaDogZnVuY3Rpb24oc2l6ZSkge1xuXHRcdC8vdGhlIHRvdGFsIG51bWJlciBvZiBmbG9hdHMgaW4gb3VyIGJhdGNoXG5cdFx0dmFyIG51bVZlcnRzID0gc2l6ZSAqIDQgKiB0aGlzLmdldFZlcnRleFNpemUoKTtcblx0XHQvL3RoZSB0b3RhbCBudW1iZXIgb2YgaW5kaWNlcyBpbiBvdXIgYmF0Y2hcblx0XHR2YXIgbnVtSW5kaWNlcyA9IHNpemUgKiA2O1xuXHRcdHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcblxuXHRcdC8vdmVydGV4IGRhdGFcblx0XHR0aGlzLnZlcnRpY2VzID0gbmV3IEZsb2F0MzJBcnJheShudW1WZXJ0cyk7XG5cdFx0Ly9pbmRleCBkYXRhXG5cdFx0dGhpcy5pbmRpY2VzID0gbmV3IFVpbnQxNkFycmF5KG51bUluZGljZXMpOyBcblx0XHRcblx0XHRmb3IgKHZhciBpPTAsIGo9MDsgaSA8IG51bUluZGljZXM7IGkgKz0gNiwgaiArPSA0KSBcblx0XHR7XG5cdFx0XHR0aGlzLmluZGljZXNbaSArIDBdID0gaiArIDA7IFxuXHRcdFx0dGhpcy5pbmRpY2VzW2kgKyAxXSA9IGogKyAxO1xuXHRcdFx0dGhpcy5pbmRpY2VzW2kgKyAyXSA9IGogKyAyO1xuXHRcdFx0dGhpcy5pbmRpY2VzW2kgKyAzXSA9IGogKyAwO1xuXHRcdFx0dGhpcy5pbmRpY2VzW2kgKyA0XSA9IGogKyAyO1xuXHRcdFx0dGhpcy5pbmRpY2VzW2kgKyA1XSA9IGogKyAzO1xuXHRcdH1cblxuXHRcdHZhciBtZXNoID0gbmV3IE1lc2godGhpcy5jb250ZXh0LCBmYWxzZSwgXG5cdFx0XHRcdFx0XHRudW1WZXJ0cywgbnVtSW5kaWNlcywgdGhpcy5fY3JlYXRlVmVydGV4QXR0cmlidXRlcygpKTtcblx0XHRtZXNoLnZlcnRpY2VzID0gdGhpcy52ZXJ0aWNlcztcblx0XHRtZXNoLmluZGljZXMgPSB0aGlzLmluZGljZXM7XG5cdFx0bWVzaC52ZXJ0ZXhVc2FnZSA9IGdsLkRZTkFNSUNfRFJBVztcblx0XHRtZXNoLmluZGV4VXNhZ2UgPSBnbC5TVEFUSUNfRFJBVztcblx0XHRtZXNoLmRpcnR5ID0gdHJ1ZTtcblx0XHRyZXR1cm4gbWVzaDtcblx0fSxcblxuXHQvKipcblx0ICogUmV0dXJucyBhIHNoYWRlciBmb3IgdGhpcyBiYXRjaC4gSWYgeW91IHBsYW4gdG8gc3VwcG9ydFxuXHQgKiBtdWx0aXBsZSBpbnN0YW5jZXMgb2YgeW91ciBiYXRjaCwgaXQgbWF5IG9yIG1heSBub3QgYmUgd2lzZVxuXHQgKiB0byB1c2UgYSBzaGFyZWQgc2hhZGVyIHRvIHNhdmUgcmVzb3VyY2VzLlxuXHQgKiBcblx0ICogVGhpcyBtZXRob2QgaW5pdGlhbGx5IHRocm93cyBhbiBlcnJvcjsgc28gaXQgbXVzdCBiZSBvdmVycmlkZGVuIGJ5XG5cdCAqIHN1YmNsYXNzZXMgb2YgQmFzZUJhdGNoLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBfY3JlYXRlU2hhZGVyXG5cdCAqIEByZXR1cm4ge051bWJlcn0gdGhlIHNpemUgb2YgYSB2ZXJ0ZXgsIGluICMgb2YgZmxvYXRzXG5cdCAqL1xuXHRfY3JlYXRlU2hhZGVyOiBmdW5jdGlvbigpIHtcblx0XHR0aHJvdyBcIl9jcmVhdGVTaGFkZXIgbm90IGltcGxlbWVudGVkXCJcblx0fSxcdFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIGFuIGFycmF5IG9mIHZlcnRleCBhdHRyaWJ1dGVzIGZvciB0aGlzIG1lc2g7IFxuXHQgKiBzdWJjbGFzc2VzIHNob3VsZCBpbXBsZW1lbnQgdGhpcyB3aXRoIHRoZSBhdHRyaWJ1dGVzIFxuXHQgKiBleHBlY3RlZCBmb3IgdGhlaXIgYmF0Y2guXG5cdCAqXG5cdCAqIFRoaXMgbWV0aG9kIGluaXRpYWxseSB0aHJvd3MgYW4gZXJyb3I7IHNvIGl0IG11c3QgYmUgb3ZlcnJpZGRlbiBieVxuXHQgKiBzdWJjbGFzc2VzIG9mIEJhc2VCYXRjaC5cblx0ICpcblx0ICogQG1ldGhvZCBfY3JlYXRlVmVydGV4QXR0cmlidXRlc1xuXHQgKiBAcmV0dXJuIHtBcnJheX0gYW4gYXJyYXkgb2YgTWVzaC5WZXJ0ZXhBdHRyaWIgb2JqZWN0c1xuXHQgKi9cblx0X2NyZWF0ZVZlcnRleEF0dHJpYnV0ZXM6IGZ1bmN0aW9uKCkge1xuXHRcdHRocm93IFwiX2NyZWF0ZVZlcnRleEF0dHJpYnV0ZXMgbm90IGltcGxlbWVudGVkXCI7XG5cdH0sXG5cblxuXHQvKipcblx0ICogUmV0dXJucyB0aGUgbnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4IGZvciB0aGlzIGJhdGNoZXIuXG5cdCAqIFxuXHQgKiBUaGlzIG1ldGhvZCBpbml0aWFsbHkgdGhyb3dzIGFuIGVycm9yOyBzbyBpdCBtdXN0IGJlIG92ZXJyaWRkZW4gYnlcblx0ICogc3ViY2xhc3NlcyBvZiBCYXNlQmF0Y2guXG5cdCAqXG5cdCAqIEBtZXRob2QgIGdldFZlcnRleFNpemVcblx0ICogQHJldHVybiB7TnVtYmVyfSB0aGUgc2l6ZSBvZiBhIHZlcnRleCwgaW4gIyBvZiBmbG9hdHNcblx0ICovXG5cdGdldFZlcnRleFNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHRocm93IFwiZ2V0VmVydGV4U2l6ZSBub3QgaW1wbGVtZW50ZWRcIjtcblx0fSxcblxuXHRcblx0LyoqIFxuXHQgKiBCZWdpbnMgdGhlIHNwcml0ZSBiYXRjaC4gVGhpcyB3aWxsIGJpbmQgdGhlIHNoYWRlclxuXHQgKiBhbmQgbWVzaC4gU3ViY2xhc3NlcyBtYXkgd2FudCB0byBkaXNhYmxlIGRlcHRoIG9yIFxuXHQgKiBzZXQgdXAgYmxlbmRpbmcuXG5cdCAqXG5cdCAqIEBtZXRob2QgIGJlZ2luXG5cdCAqL1xuXHRiZWdpbjogZnVuY3Rpb24oKSAge1xuXHRcdGlmICh0aGlzLmRyYXdpbmcpIFxuXHRcdFx0dGhyb3cgXCJiYXRjaC5lbmQoKSBtdXN0IGJlIGNhbGxlZCBiZWZvcmUgYmVnaW5cIjtcblx0XHR0aGlzLmRyYXdpbmcgPSB0cnVlO1xuXG5cdFx0dGhpcy5zaGFkZXIuYmluZCgpO1xuXG5cdFx0Ly9iaW5kIHRoZSBhdHRyaWJ1dGVzIG5vdyB0byBhdm9pZCByZWR1bmRhbnQgY2FsbHNcblx0XHR0aGlzLm1lc2guYmluZCh0aGlzLnNoYWRlcik7XG5cdH0sXG5cblx0LyoqIFxuXHQgKiBFbmRzIHRoZSBzcHJpdGUgYmF0Y2guIFRoaXMgd2lsbCBmbHVzaCBhbnkgcmVtYWluaW5nIFxuXHQgKiBkYXRhIGFuZCBzZXQgR0wgc3RhdGUgYmFjayB0byBub3JtYWwuXG5cdCAqIFxuXHQgKiBAbWV0aG9kICBlbmRcblx0ICovXG5cdGVuZDogZnVuY3Rpb24oKSAge1xuXHRcdGlmICghdGhpcy5kcmF3aW5nKVxuXHRcdFx0dGhyb3cgXCJiYXRjaC5iZWdpbigpIG11c3QgYmUgY2FsbGVkIGJlZm9yZSBlbmRcIjtcblx0XHRpZiAodGhpcy5pZHggPiAwKVxuXHRcdFx0dGhpcy5mbHVzaCgpO1xuXHRcdHRoaXMuZHJhd2luZyA9IGZhbHNlO1xuXG5cdFx0dGhpcy5tZXNoLnVuYmluZCh0aGlzLnNoYWRlcik7XG5cdH0sXG5cblx0LyoqIFxuXHQgKiBDYWxsZWQgYmVmb3JlIHJlbmRlcmluZyB0byBiaW5kIG5ldyB0ZXh0dXJlcy5cblx0ICogVGhpcyBtZXRob2QgZG9lcyBub3RoaW5nIGJ5IGRlZmF1bHQuXG5cdCAqXG5cdCAqIEBtZXRob2QgIF9wcmVSZW5kZXJcblx0ICovXG5cdF9wcmVSZW5kZXI6IGZ1bmN0aW9uKCkgIHtcblx0fSxcblxuXHQvKiogXG5cdCAqIENhbGxlZCBhZnRlciBmbHVzaGluZyB0aGUgYmF0Y2guIFRoaXMgbWV0aG9kXG5cdCAqIGRvZXMgbm90aGluZyBieSBkZWZhdWx0LlxuXHQgKlxuXHQgKiBAbWV0aG9kICBfcG9zdFJlbmRlclxuXHQgKi9cblx0X3Bvc3RSZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBGbHVzaGVzIHRoZSBiYXRjaCBieSBwdXNoaW5nIHRoZSBjdXJyZW50IGRhdGFcblx0ICogdG8gR0wuXG5cdCAqIFxuXHQgKiBAbWV0aG9kIGZsdXNoXG5cdCAqL1xuXHRmbHVzaDogZnVuY3Rpb24oKSAge1xuXHRcdGlmICh0aGlzLmlkeD09PTApXG5cdFx0XHRyZXR1cm47XG5cblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXHRcdFxuXHRcdHRoaXMuX3ByZVJlbmRlcigpO1xuXG5cdFx0Ly9udW1iZXIgb2Ygc3ByaXRlcyBpbiBiYXRjaFxuXHRcdHZhciBudW1Db21wb25lbnRzID0gdGhpcy5nZXRWZXJ0ZXhTaXplKCk7XG5cdFx0dmFyIHNwcml0ZUNvdW50ID0gKHRoaXMuaWR4IC8gKG51bUNvbXBvbmVudHMgKiA0KSk7XG5cdFx0XG5cdFx0Ly9kcmF3IHRoZSBzcHJpdGVzXG5cdFx0dmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuXHRcdHRoaXMubWVzaC52ZXJ0aWNlc0RpcnR5ID0gdHJ1ZTtcblx0XHR0aGlzLm1lc2guZHJhdyhnbC5UUklBTkdMRVMsIHNwcml0ZUNvdW50ICogNiwgMCwgdGhpcy5pZHgpO1xuXG5cdFx0dGhpcy5pZHggPSAwO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGEgc3ByaXRlIHRvIHRoaXMgYmF0Y2guXG5cdCAqIFRoZSBzcGVjaWZpY3MgZGVwZW5kIG9uIHRoZSBzcHJpdGUgYmF0Y2ggaW1wbGVtZW50YXRpb24uXG5cdCAqXG5cdCAqIEBtZXRob2QgZHJhd1xuXHQgKiBAcGFyYW0gIHtUZXh0dXJlfSB0ZXh0dXJlIHRoZSB0ZXh0dXJlIGZvciB0aGlzIHNwcml0ZVxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHggICAgICAgdGhlIHggcG9zaXRpb24sIGRlZmF1bHRzIHRvIHplcm9cblx0ICogQHBhcmFtICB7TnVtYmVyfSB5ICAgICAgIHRoZSB5IHBvc2l0aW9uLCBkZWZhdWx0cyB0byB6ZXJvXG5cdCAqIEBwYXJhbSAge051bWJlcn0gd2lkdGggICB0aGUgd2lkdGgsIGRlZmF1bHRzIHRvIHRoZSB0ZXh0dXJlIHdpZHRoXG5cdCAqIEBwYXJhbSAge051bWJlcn0gaGVpZ2h0ICB0aGUgaGVpZ2h0LCBkZWZhdWx0cyB0byB0aGUgdGV4dHVyZSBoZWlnaHRcblx0ICogQHBhcmFtICB7TnVtYmVyfSB1MSAgICAgIHRoZSBmaXJzdCBVIGNvb3JkaW5hdGUsIGRlZmF1bHQgemVyb1xuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHYxICAgICAgdGhlIGZpcnN0IFYgY29vcmRpbmF0ZSwgZGVmYXVsdCB6ZXJvXG5cdCAqIEBwYXJhbSAge051bWJlcn0gdTIgICAgICB0aGUgc2Vjb25kIFUgY29vcmRpbmF0ZSwgZGVmYXVsdCBvbmVcblx0ICogQHBhcmFtICB7TnVtYmVyfSB2MiAgICAgIHRoZSBzZWNvbmQgViBjb29yZGluYXRlLCBkZWZhdWx0IG9uZVxuXHQgKi9cblx0ZHJhdzogZnVuY3Rpb24odGV4dHVyZSwgeCwgeSwgd2lkdGgsIGhlaWdodCwgdTEsIHYxLCB1MiwgdjIpIHtcblx0fSxcblxuXHQvKipcblx0ICogQWRkcyBhIHNpbmdsZSBxdWFkIG1lc2ggdG8gdGhpcyBzcHJpdGUgYmF0Y2ggZnJvbSB0aGUgZ2l2ZW5cblx0ICogYXJyYXkgb2YgdmVydGljZXMuXG5cdCAqIFRoZSBzcGVjaWZpY3MgZGVwZW5kIG9uIHRoZSBzcHJpdGUgYmF0Y2ggaW1wbGVtZW50YXRpb24uXG5cdCAqXG5cdCAqIEBtZXRob2QgIGRyYXdWZXJ0aWNlc1xuXHQgKiBAcGFyYW0ge1RleHR1cmV9IHRleHR1cmUgdGhlIHRleHR1cmUgd2UgYXJlIGRyYXdpbmcgZm9yIHRoaXMgc3ByaXRlXG5cdCAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSB2ZXJ0cyBhbiBhcnJheSBvZiB2ZXJ0aWNlc1xuXHQgKiBAcGFyYW0ge051bWJlcn0gb2ZmIHRoZSBvZmZzZXQgaW50byB0aGUgdmVydGljZXMgYXJyYXkgdG8gcmVhZCBmcm9tXG5cdCAqL1xuXHRkcmF3VmVydGljZXM6IGZ1bmN0aW9uKHRleHR1cmUsIHZlcnRzLCBvZmYpICB7XG5cdH0sXG5cblx0ZHJhd1JlZ2lvbjogZnVuY3Rpb24ocmVnaW9uLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0dGhpcy5kcmF3KHJlZ2lvbi50ZXh0dXJlLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCByZWdpb24udSwgcmVnaW9uLnYsIHJlZ2lvbi51MiwgcmVnaW9uLnYyKTtcblx0fSxcblxuXHQvKipcblx0ICogRGVzdHJveXMgdGhlIGJhdGNoLCBkZWxldGluZyBpdHMgYnVmZmVycyBhbmQgcmVtb3ZpbmcgaXQgZnJvbSB0aGVcblx0ICogV2ViR0xDb250ZXh0IG1hbmFnZW1lbnQuIFRyeWluZyB0byB1c2UgdGhpc1xuXHQgKiBiYXRjaCBhZnRlciBkZXN0cm95aW5nIGl0IGNhbiBsZWFkIHRvIHVucHJlZGljdGFibGUgYmVoYXZpb3VyLlxuXHQgKlxuXHQgKiBJZiBgb3duc1NoYWRlcmAgaXMgdHJ1ZSwgdGhpcyB3aWxsIGFsc28gZGVsZXRlIHRoZSBgZGVmYXVsdFNoYWRlcmAgb2JqZWN0LlxuXHQgKiBcblx0ICogQG1ldGhvZCBkZXN0cm95XG5cdCAqL1xuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnZlcnRpY2VzID0gW107XG5cdFx0dGhpcy5pbmRpY2VzID0gW107XG5cdFx0dGhpcy5zaXplID0gdGhpcy5tYXhWZXJ0aWNlcyA9IDA7XG5cblx0XHRpZiAodGhpcy5kZWZhdWx0U2hhZGVyKVxuXHRcdFx0dGhpcy5kZWZhdWx0U2hhZGVyLmRlc3Ryb3koKTtcblx0XHR0aGlzLmRlZmF1bHRTaGFkZXIgPSBudWxsO1xuXHRcdHRoaXMuX3NoYWRlciA9IG51bGw7IC8vIHJlbW92ZSByZWZlcmVuY2UgdG8gd2hhdGV2ZXIgc2hhZGVyIGlzIGN1cnJlbnRseSBiZWluZyB1c2VkXG5cblx0XHRpZiAodGhpcy5tZXNoKSBcblx0XHRcdHRoaXMubWVzaC5kZXN0cm95KCk7XG5cdFx0dGhpcy5tZXNoID0gbnVsbDtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZUJhdGNoO1xuIiwiLyoqXG4gKiBAbW9kdWxlIGthbWlcbiAqL1xuXG4vLyBSZXF1aXJlcy4uLi5cbnZhciBDbGFzcyAgICAgICAgID0gcmVxdWlyZSgna2xhc3NlJyk7XG5cbnZhciBCYXNlQmF0Y2ggPSByZXF1aXJlKCcuL0Jhc2VCYXRjaCcpO1xuXG52YXIgTWVzaCAgICAgICAgICA9IHJlcXVpcmUoJy4vZ2x1dGlscy9NZXNoJyk7XG52YXIgU2hhZGVyUHJvZ3JhbSA9IHJlcXVpcmUoJy4vZ2x1dGlscy9TaGFkZXJQcm9ncmFtJyk7XG5cbi8qKlxuICogQSBiYXNpYyBpbXBsZW1lbnRhdGlvbiBvZiBhIGJhdGNoZXIgd2hpY2ggZHJhd3MgMkQgc3ByaXRlcy5cbiAqIFRoaXMgdXNlcyB0d28gdHJpYW5nbGVzIChxdWFkcykgd2l0aCBpbmRleGVkIGFuZCBpbnRlcmxlYXZlZFxuICogdmVydGV4IGRhdGEuIEVhY2ggdmVydGV4IGhvbGRzIDUgZmxvYXRzIChQb3NpdGlvbi54eSwgQ29sb3IsIFRleENvb3JkMC54eSkuXG4gKlxuICogVGhlIGNvbG9yIGlzIHBhY2tlZCBpbnRvIGEgc2luZ2xlIGZsb2F0IHRvIHJlZHVjZSB2ZXJ0ZXggYmFuZHdpZHRoLCBhbmRcbiAqIHRoZSBkYXRhIGlzIGludGVybGVhdmVkIGZvciBiZXN0IHBlcmZvcm1hbmNlLiBXZSB1c2UgYSBzdGF0aWMgaW5kZXggYnVmZmVyLFxuICogYW5kIGEgZHluYW1pYyB2ZXJ0ZXggYnVmZmVyIHRoYXQgaXMgdXBkYXRlZCB3aXRoIGJ1ZmZlclN1YkRhdGEuIFxuICogXG4gKiBAZXhhbXBsZVxuICogICAgICB2YXIgU3ByaXRlQmF0Y2ggPSByZXF1aXJlKCdrYW1pJykuU3ByaXRlQmF0Y2g7ICBcbiAqICAgICAgXG4gKiAgICAgIC8vY3JlYXRlIGEgbmV3IGJhdGNoZXJcbiAqICAgICAgdmFyIGJhdGNoID0gbmV3IFNwcml0ZUJhdGNoKGNvbnRleHQpO1xuICpcbiAqICAgICAgZnVuY3Rpb24gcmVuZGVyKCkge1xuICogICAgICAgICAgYmF0Y2guYmVnaW4oKTtcbiAqICAgICAgICAgIFxuICogICAgICAgICAgLy9kcmF3IHNvbWUgc3ByaXRlcyBpbiBiZXR3ZWVuIGJlZ2luIGFuZCBlbmQuLi5cbiAqICAgICAgICAgIGJhdGNoLmRyYXcoIHRleHR1cmUsIDAsIDAsIDI1LCAzMiApO1xuICogICAgICAgICAgYmF0Y2guZHJhdyggdGV4dHVyZTEsIDAsIDI1LCA0MiwgMjMgKTtcbiAqIFxuICogICAgICAgICAgYmF0Y2guZW5kKCk7XG4gKiAgICAgIH1cbiAqIFxuICogQGNsYXNzICBTcHJpdGVCYXRjaFxuICogQHVzZXMgQmFzZUJhdGNoXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7V2ViR0xDb250ZXh0fSBjb250ZXh0IHRoZSBjb250ZXh0IGZvciB0aGlzIGJhdGNoXG4gKiBAcGFyYW0ge051bWJlcn0gc2l6ZSB0aGUgbWF4IG51bWJlciBvZiBzcHJpdGVzIHRvIGZpdCBpbiBhIHNpbmdsZSBiYXRjaFxuICovXG52YXIgU3ByaXRlQmF0Y2ggPSBuZXcgQ2xhc3Moe1xuXG5cdC8vaW5oZXJpdCBzb21lIHN0dWZmIG9udG8gdGhpcyBwcm90b3R5cGVcblx0TWl4aW5zOiBCYXNlQmF0Y2gsXG5cblx0Ly9Db25zdHJ1Y3RvclxuXHRpbml0aWFsaXplOiBmdW5jdGlvbiBTcHJpdGVCYXRjaChjb250ZXh0LCBzaXplKSB7XG5cdFx0QmFzZUJhdGNoLmNhbGwodGhpcywgY29udGV4dCwgc2l6ZSk7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgcHJvamVjdGlvbiBGbG9hdDMyQXJyYXkgdmVjMiB3aGljaCBpc1xuXHRcdCAqIHVzZWQgdG8gYXZvaWQgc29tZSBtYXRyaXggY2FsY3VsYXRpb25zLlxuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHByb2plY3Rpb25cblx0XHQgKiBAdHlwZSB7RmxvYXQzMkFycmF5fVxuXHRcdCAqL1xuXHRcdHRoaXMucHJvamVjdGlvbiA9IG5ldyBGbG9hdDMyQXJyYXkoMik7XG5cblx0XHQvL1NldHMgdXAgYSBkZWZhdWx0IHByb2plY3Rpb24gdmVjdG9yIHNvIHRoYXQgdGhlIGJhdGNoIHdvcmtzIHdpdGhvdXQgc2V0UHJvamVjdGlvblxuXHRcdHRoaXMucHJvamVjdGlvblswXSA9IHRoaXMuY29udGV4dC53aWR0aC8yO1xuXHRcdHRoaXMucHJvamVjdGlvblsxXSA9IHRoaXMuY29udGV4dC5oZWlnaHQvMjtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBjdXJyZW50bHkgYm91bmQgdGV4dHVyZS4gRG8gbm90IG1vZGlmeS5cblx0XHQgKiBcblx0XHQgKiBAcHJvcGVydHkge1RleHR1cmV9IHRleHR1cmVcblx0XHQgKiBAcmVhZE9ubHlcblx0XHQgKi9cblx0XHR0aGlzLnRleHR1cmUgPSBudWxsO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBUaGlzIGlzIGEgY29udmVuaWVuY2UgZnVuY3Rpb24gdG8gc2V0IHRoZSBiYXRjaCdzIHByb2plY3Rpb25cblx0ICogbWF0cml4IHRvIGFuIG9ydGhvZ3JhcGhpYyAyRCBwcm9qZWN0aW9uLCBiYXNlZCBvbiB0aGUgZ2l2ZW4gc2NyZWVuXG5cdCAqIHNpemUuIFRoaXMgYWxsb3dzIHVzZXJzIHRvIHJlbmRlciBpbiAyRCB3aXRob3V0IGFueSBuZWVkIGZvciBhIGNhbWVyYS5cblx0ICogXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gd2lkdGggIFtkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7W3R5cGVdfSBoZWlnaHQgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRyZXNpemU6IGZ1bmN0aW9uKHdpZHRoLCBoZWlnaHQpIHtcblx0XHR0aGlzLnNldFByb2plY3Rpb24od2lkdGgvMiwgaGVpZ2h0LzIpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBUaGUgbnVtYmVyIG9mIGZsb2F0cyBwZXIgdmVydGV4IGZvciB0aGlzIGJhdGNoZXIgXG5cdCAqIChQb3NpdGlvbi54eSArIENvbG9yICsgVGV4Q29vcmQwLnh5KS5cblx0ICpcblx0ICogQG1ldGhvZCAgZ2V0VmVydGV4U2l6ZVxuXHQgKiBAcmV0dXJuIHtOdW1iZXJ9IHRoZSBudW1iZXIgb2YgZmxvYXRzIHBlciB2ZXJ0ZXhcblx0ICovXG5cdGdldFZlcnRleFNpemU6IGZ1bmN0aW9uKCkge1xuXHRcdHJldHVybiBTcHJpdGVCYXRjaC5WRVJURVhfU0laRTtcblx0fSxcblxuXHQvKipcblx0ICogVXNlZCBpbnRlcm5hbGx5IHRvIHJldHVybiB0aGUgUG9zaXRpb24sIENvbG9yLCBhbmQgVGV4Q29vcmQwIGF0dHJpYnV0ZXMuXG5cdCAqXG5cdCAqIEBtZXRob2QgIF9jcmVhdGVWZXJ0ZXhBdHRyaWJ1ZXRzXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7W3R5cGVdfSBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRfY3JlYXRlVmVydGV4QXR0cmlidXRlczogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuXG5cdFx0cmV0dXJuIFsgXG5cdFx0XHRuZXcgTWVzaC5BdHRyaWIoXCJQb3NpdGlvblwiLCAyKSxcblx0XHRcdCAvL3BhY2sgdGhlIGNvbG9yIHVzaW5nIHNvbWUgY3Jhenkgd2l6YXJkcnkgXG5cdFx0XHRuZXcgTWVzaC5BdHRyaWIoXCJDb2xvclwiLCA0LCBudWxsLCBnbC5VTlNJR05FRF9CWVRFLCB0cnVlLCAxKSxcblx0XHRcdG5ldyBNZXNoLkF0dHJpYihcIlRleENvb3JkMFwiLCAyKVxuXHRcdF07XG5cdH0sXG5cblxuXHQvKipcblx0ICogU2V0cyB0aGUgcHJvamVjdGlvbiB2ZWN0b3IsIGFuIHggYW5kIHlcblx0ICogZGVmaW5pbmcgdGhlIG1pZGRsZSBwb2ludHMgb2YgeW91ciBzdGFnZS5cblx0ICpcblx0ICogQG1ldGhvZCBzZXRQcm9qZWN0aW9uXG5cdCAqIEBwYXJhbSB7TnVtYmVyfSB4IHRoZSB4IHByb2plY3Rpb24gdmFsdWVcblx0ICogQHBhcmFtIHtOdW1iZXJ9IHkgdGhlIHkgcHJvamVjdGlvbiB2YWx1ZVxuXHQgKi9cblx0c2V0UHJvamVjdGlvbjogZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciBvbGRYID0gdGhpcy5wcm9qZWN0aW9uWzBdO1xuXHRcdHZhciBvbGRZID0gdGhpcy5wcm9qZWN0aW9uWzFdO1xuXHRcdHRoaXMucHJvamVjdGlvblswXSA9IHg7XG5cdFx0dGhpcy5wcm9qZWN0aW9uWzFdID0geTtcblxuXHRcdC8vd2UgbmVlZCB0byBmbHVzaCB0aGUgYmF0Y2guLlxuXHRcdGlmICh0aGlzLmRyYXdpbmcgJiYgKHggIT0gb2xkWCB8fCB5ICE9IG9sZFkpKSB7XG5cdFx0XHR0aGlzLmZsdXNoKCk7XG5cdFx0XHR0aGlzLl91cGRhdGVNYXRyaWNlcygpO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIGRlZmF1bHQgc2hhZGVyIGZvciB0aGlzIGJhdGNoLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBfY3JlYXRlU2hhZGVyXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQHJldHVybiB7U2hhZGVyUHJvZ3JhbX0gYSBuZXcgaW5zdGFuY2Ugb2YgU2hhZGVyUHJvZ3JhbVxuXHQgKi9cblx0X2NyZWF0ZVNoYWRlcjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIHNoYWRlciA9IG5ldyBTaGFkZXJQcm9ncmFtKHRoaXMuY29udGV4dCxcblx0XHRcdFx0U3ByaXRlQmF0Y2guREVGQVVMVF9WRVJUX1NIQURFUiwgXG5cdFx0XHRcdFNwcml0ZUJhdGNoLkRFRkFVTFRfRlJBR19TSEFERVIpO1xuXHRcdGlmIChzaGFkZXIubG9nKVxuXHRcdFx0Y29uc29sZS53YXJuKFwiU2hhZGVyIExvZzpcXG5cIiArIHNoYWRlci5sb2cpO1xuXHRcdHJldHVybiBzaGFkZXI7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFRoaXMgaXMgY2FsbGVkIGR1cmluZyByZW5kZXJpbmcgdG8gdXBkYXRlIHByb2plY3Rpb24vdHJhbnNmb3JtXG5cdCAqIG1hdHJpY2VzIGFuZCB1cGxvYWQgdGhlIG5ldyB2YWx1ZXMgdG8gdGhlIHNoYWRlci4gRm9yIGV4YW1wbGUsXG5cdCAqIGlmIHRoZSB1c2VyIGNhbGxzIHNldFByb2plY3Rpb24gbWlkLWRyYXcsIHRoZSBiYXRjaCB3aWxsIGZsdXNoXG5cdCAqIGFuZCB0aGlzIHdpbGwgYmUgY2FsbGVkIGJlZm9yZSBjb250aW51aW5nIHRvIGFkZCBpdGVtcyB0byB0aGUgYmF0Y2guXG5cdCAqXG5cdCAqIFlvdSBnZW5lcmFsbHkgc2hvdWxkIG5vdCBuZWVkIHRvIGNhbGwgdGhpcyBkaXJlY3RseS5cblx0ICogXG5cdCAqIEBtZXRob2QgIHVwZGF0ZU1hdHJpY2VzXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICovXG5cdHVwZGF0ZU1hdHJpY2VzOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNoYWRlci5zZXRVbmlmb3JtZnYoXCJ1X3Byb2plY3Rpb25cIiwgdGhpcy5wcm9qZWN0aW9uKTtcblx0fSxcblxuXHQvKipcblx0ICogQ2FsbGVkIGJlZm9yZSByZW5kZXJpbmcsIGFuZCBiaW5kcyB0aGUgY3VycmVudCB0ZXh0dXJlLlxuXHQgKiBcblx0ICogQG1ldGhvZCBfcHJlUmVuZGVyXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICovXG5cdF9wcmVSZW5kZXI6IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnRleHR1cmUpXG5cdFx0XHR0aGlzLnRleHR1cmUuYmluZCgpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBCaW5kcyB0aGUgc2hhZGVyLCBkaXNhYmxlcyBkZXB0aCB3cml0aW5nLCBcblx0ICogZW5hYmxlcyBibGVuZGluZywgYWN0aXZhdGVzIHRleHR1cmUgdW5pdCAwLCBhbmQgc2VuZHNcblx0ICogZGVmYXVsdCBtYXRyaWNlcyBhbmQgc2FtcGxlcjJEIHVuaWZvcm1zIHRvIHRoZSBzaGFkZXIuXG5cdCAqXG5cdCAqIEBtZXRob2QgIGJlZ2luXG5cdCAqL1xuXHRiZWdpbjogZnVuY3Rpb24oKSB7XG5cdFx0Ly9zcHJpdGUgYmF0Y2ggZG9lc24ndCBob2xkIGEgcmVmZXJlbmNlIHRvIEdMIHNpbmNlIGl0IGlzIHZvbGF0aWxlXG5cdFx0dmFyIGdsID0gdGhpcy5jb250ZXh0LmdsO1xuXHRcdFxuXHRcdC8vVGhpcyBiaW5kcyB0aGUgc2hhZGVyIGFuZCBtZXNoIVxuXHRcdEJhc2VCYXRjaC5wcm90b3R5cGUuYmVnaW4uY2FsbCh0aGlzKTtcblxuXHRcdHRoaXMudXBkYXRlTWF0cmljZXMoKTsgLy9zZW5kIHByb2plY3Rpb24vdHJhbnNmb3JtIHRvIHNoYWRlclxuXG5cdFx0Ly91cGxvYWQgdGhlIHNhbXBsZXIgdW5pZm9ybS4gbm90IG5lY2Vzc2FyeSBldmVyeSBmbHVzaCBzbyB3ZSBqdXN0XG5cdFx0Ly9kbyBpdCBoZXJlLlxuXHRcdHRoaXMuc2hhZGVyLnNldFVuaWZvcm1pKFwidV90ZXh0dXJlMFwiLCAwKTtcblxuXHRcdC8vZGlzYWJsZSBkZXB0aCBtYXNrXG5cdFx0Z2wuZGVwdGhNYXNrKGZhbHNlKTtcblxuXHRcdC8vcHJlbXVsdGlwbGllZCBhbHBoYVxuXHRcdGlmICh0aGlzLl9ibGVuZEVuYWJsZWQpIHtcblx0XHRcdGdsLmVuYWJsZShnbC5CTEVORCk7XG5cblx0XHRcdC8vc2V0IGVpdGhlciB0byAtMSBpZiB5b3Ugd2FudCB0byBjYWxsIHlvdXIgb3duIFxuXHRcdFx0Ly9ibGVuZEZ1bmMgb3IgYmxlbmRGdW5jU2VwYXJhdGVcblx0XHRcdGlmICh0aGlzLl9ibGVuZFNyYyAhPT0gLTEgJiYgdGhpcy5fYmxlbmREc3QgIT09IC0xKVxuXHRcdFx0XHRnbC5ibGVuZEZ1bmModGhpcy5fYmxlbmRTcmMsIHRoaXMuX2JsZW5kRHN0KTsgXG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBFbmRzIHRoZSBzcHJpdGUgYmF0Y2hlciBhbmQgZmx1c2hlcyBhbnkgcmVtYWluaW5nIGRhdGEgdG8gdGhlIEdQVS5cblx0ICogXG5cdCAqIEBtZXRob2QgZW5kXG5cdCAqL1xuXHRlbmQ6IGZ1bmN0aW9uKCkge1xuXHRcdC8vc3ByaXRlIGJhdGNoIGRvZXNuJ3QgaG9sZCBhIHJlZmVyZW5jZSB0byBHTCBzaW5jZSBpdCBpcyB2b2xhdGlsZVxuXHRcdHZhciBnbCA9IHRoaXMuY29udGV4dC5nbDtcblx0XHRcblx0XHQvL2p1c3QgZG8gZGlyZWN0IHBhcmVudCBjYWxsIGZvciBzcGVlZCBoZXJlXG5cdFx0Ly9UaGlzIGJpbmRzIHRoZSBzaGFkZXIgYW5kIG1lc2ghXG5cdFx0QmFzZUJhdGNoLnByb3RvdHlwZS5lbmQuY2FsbCh0aGlzKTtcblxuXHRcdGdsLmRlcHRoTWFzayh0cnVlKTtcblxuXHRcdGlmICh0aGlzLl9ibGVuZEVuYWJsZWQpXG5cdFx0XHRnbC5kaXNhYmxlKGdsLkJMRU5EKTtcblx0fSxcblxuXHQvKipcblx0ICogRmx1c2hlcyB0aGUgYmF0Y2ggdG8gdGhlIEdQVS4gVGhpcyBzaG91bGQgYmUgY2FsbGVkIHdoZW5cblx0ICogc3RhdGUgY2hhbmdlcywgc3VjaCBhcyBibGVuZCBmdW5jdGlvbnMsIGRlcHRoIG9yIHN0ZW5jaWwgc3RhdGVzLFxuXHQgKiBzaGFkZXJzLCBhbmQgc28gZm9ydGguXG5cdCAqIFxuXHQgKiBAbWV0aG9kIGZsdXNoXG5cdCAqL1xuXHRmbHVzaDogZnVuY3Rpb24oKSB7XG5cdFx0Ly9pZ25vcmUgZmx1c2ggaWYgdGV4dHVyZSBpcyBudWxsIG9yIG91ciBiYXRjaCBpcyBlbXB0eVxuXHRcdGlmICghdGhpcy50ZXh0dXJlKVxuXHRcdFx0cmV0dXJuO1xuXHRcdGlmICh0aGlzLmlkeCA9PT0gMClcblx0XHRcdHJldHVybjtcblx0XHRCYXNlQmF0Y2gucHJvdG90eXBlLmZsdXNoLmNhbGwodGhpcyk7XG5cdFx0U3ByaXRlQmF0Y2gudG90YWxSZW5kZXJDYWxscysrO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBZGRzIGEgc3ByaXRlIHRvIHRoaXMgYmF0Y2guIFRoZSBzcHJpdGUgaXMgZHJhd24gaW4gXG5cdCAqIHNjcmVlbi1zcGFjZSB3aXRoIHRoZSBvcmlnaW4gYXQgdGhlIHVwcGVyLWxlZnQgY29ybmVyICh5LWRvd24pLlxuXHQgKiBcblx0ICogQG1ldGhvZCBkcmF3XG5cdCAqIEBwYXJhbSAge1RleHR1cmV9IHRleHR1cmUgdGhlIFRleHR1cmVcblx0ICogQHBhcmFtICB7TnVtYmVyfSB4ICAgICAgIHRoZSB4IHBvc2l0aW9uIGluIHBpeGVscywgZGVmYXVsdHMgdG8gemVyb1xuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHkgICAgICAgdGhlIHkgcG9zaXRpb24gaW4gcGl4ZWxzLCBkZWZhdWx0cyB0byB6ZXJvXG5cdCAqIEBwYXJhbSAge051bWJlcn0gd2lkdGggICB0aGUgd2lkdGggaW4gcGl4ZWxzLCBkZWZhdWx0cyB0byB0aGUgdGV4dHVyZSB3aWR0aFxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IGhlaWdodCAgdGhlIGhlaWdodCBpbiBwaXhlbHMsIGRlZmF1bHRzIHRvIHRoZSB0ZXh0dXJlIGhlaWdodFxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHUxICAgICAgdGhlIGZpcnN0IFUgY29vcmRpbmF0ZSwgZGVmYXVsdCB6ZXJvXG5cdCAqIEBwYXJhbSAge051bWJlcn0gdjEgICAgICB0aGUgZmlyc3QgViBjb29yZGluYXRlLCBkZWZhdWx0IHplcm9cblx0ICogQHBhcmFtICB7TnVtYmVyfSB1MiAgICAgIHRoZSBzZWNvbmQgVSBjb29yZGluYXRlLCBkZWZhdWx0IG9uZVxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IHYyICAgICAgdGhlIHNlY29uZCBWIGNvb3JkaW5hdGUsIGRlZmF1bHQgb25lXG5cdCAqL1xuXHRkcmF3OiBmdW5jdGlvbih0ZXh0dXJlLCB4LCB5LCB3aWR0aCwgaGVpZ2h0LCB1MSwgdjEsIHUyLCB2Mikge1xuXHRcdGlmICghdGhpcy5kcmF3aW5nKVxuXHRcdFx0dGhyb3cgXCJJbGxlZ2FsIFN0YXRlOiB0cnlpbmcgdG8gZHJhdyBhIGJhdGNoIGJlZm9yZSBiZWdpbigpXCI7XG5cblx0XHQvL2Rvbid0IGRyYXcgYW55dGhpbmcgaWYgR0wgdGV4IGRvZXNuJ3QgZXhpc3QuLlxuXHRcdGlmICghdGV4dHVyZSlcblx0XHRcdHJldHVybjtcblxuXHRcdGlmICh0aGlzLnRleHR1cmUgPT09IG51bGwgfHwgdGhpcy50ZXh0dXJlLmlkICE9PSB0ZXh0dXJlLmlkKSB7XG5cdFx0XHQvL25ldyB0ZXh0dXJlLi4gZmx1c2ggcHJldmlvdXMgZGF0YVxuXHRcdFx0dGhpcy5mbHVzaCgpO1xuXHRcdFx0dGhpcy50ZXh0dXJlID0gdGV4dHVyZTtcblx0XHR9IGVsc2UgaWYgKHRoaXMuaWR4ID09IHRoaXMudmVydGljZXMubGVuZ3RoKSB7XG5cdFx0XHR0aGlzLmZsdXNoKCk7IC8vd2UndmUgcmVhY2hlZCBvdXIgbWF4LCBmbHVzaCBiZWZvcmUgcHVzaGluZyBtb3JlIGRhdGFcblx0XHR9XG5cblx0XHR3aWR0aCA9ICh3aWR0aD09PTApID8gd2lkdGggOiAod2lkdGggfHwgdGV4dHVyZS53aWR0aCk7XG5cdFx0aGVpZ2h0ID0gKGhlaWdodD09PTApID8gaGVpZ2h0IDogKGhlaWdodCB8fCB0ZXh0dXJlLmhlaWdodCk7XG5cdFx0eCA9IHggfHwgMDtcblx0XHR5ID0geSB8fCAwO1xuXG5cdFx0dmFyIHgxID0geDtcblx0XHR2YXIgeDIgPSB4ICsgd2lkdGg7XG5cdFx0dmFyIHkxID0geTtcblx0XHR2YXIgeTIgPSB5ICsgaGVpZ2h0O1xuXG5cdFx0dTEgPSB1MSB8fCAwO1xuXHRcdHUyID0gKHUyPT09MCkgPyB1MiA6ICh1MiB8fCAxKTtcblx0XHR2MSA9IHYxIHx8IDA7XG5cdFx0djIgPSAodjI9PT0wKSA/IHYyIDogKHYyIHx8IDEpO1xuXG5cdFx0dmFyIGMgPSB0aGlzLmNvbG9yO1xuXG5cdFx0Ly94eVxuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB4MTtcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0geTE7XG5cdFx0Ly9jb2xvclxuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSBjO1xuXHRcdC8vdXZcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdTE7XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHYxO1xuXHRcdFxuXHRcdC8veHlcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0geDI7XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHkxO1xuXHRcdC8vY29sb3Jcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gYztcblx0XHQvL3V2XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHUyO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2MTtcblxuXHRcdC8veHlcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0geDI7XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHkyO1xuXHRcdC8vY29sb3Jcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gYztcblx0XHQvL3V2XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHUyO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2MjtcblxuXHRcdC8veHlcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0geDE7XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHkyO1xuXHRcdC8vY29sb3Jcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gYztcblx0XHQvL3V2XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHUxO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2Mjtcblx0fSxcblxuXHQvKipcblx0ICogQWRkcyBhIHNpbmdsZSBxdWFkIG1lc2ggdG8gdGhpcyBzcHJpdGUgYmF0Y2ggZnJvbSB0aGUgZ2l2ZW5cblx0ICogYXJyYXkgb2YgdmVydGljZXMuIFRoZSBzcHJpdGUgaXMgZHJhd24gaW4gXG5cdCAqIHNjcmVlbi1zcGFjZSB3aXRoIHRoZSBvcmlnaW4gYXQgdGhlIHVwcGVyLWxlZnQgY29ybmVyICh5LWRvd24pLlxuXHQgKlxuXHQgKiBUaGlzIHJlYWRzIDIwIGludGVybGVhdmVkIGZsb2F0cyBmcm9tIHRoZSBnaXZlbiBvZmZzZXQgaW5kZXgsIGluIHRoZSBmb3JtYXRcblx0ICpcblx0ICogIHsgeCwgeSwgY29sb3IsIHUsIHYsXG5cdCAqICAgICAgLi4uICB9XG5cdCAqXG5cdCAqIEBtZXRob2QgIGRyYXdWZXJ0aWNlc1xuXHQgKiBAcGFyYW0ge1RleHR1cmV9IHRleHR1cmUgdGhlIFRleHR1cmUgb2JqZWN0XG5cdCAqIEBwYXJhbSB7RmxvYXQzMkFycmF5fSB2ZXJ0cyBhbiBhcnJheSBvZiB2ZXJ0aWNlc1xuXHQgKiBAcGFyYW0ge051bWJlcn0gb2ZmIHRoZSBvZmZzZXQgaW50byB0aGUgdmVydGljZXMgYXJyYXkgdG8gcmVhZCBmcm9tXG5cdCAqL1xuXHRkcmF3VmVydGljZXM6IGZ1bmN0aW9uKHRleHR1cmUsIHZlcnRzLCBvZmYpIHtcblx0XHRpZiAoIXRoaXMuZHJhd2luZylcblx0XHRcdHRocm93IFwiSWxsZWdhbCBTdGF0ZTogdHJ5aW5nIHRvIGRyYXcgYSBiYXRjaCBiZWZvcmUgYmVnaW4oKVwiO1xuXHRcdFxuXHRcdC8vZG9uJ3QgZHJhdyBhbnl0aGluZyBpZiBHTCB0ZXggZG9lc24ndCBleGlzdC4uXG5cdFx0aWYgKCF0ZXh0dXJlKVxuXHRcdFx0cmV0dXJuO1xuXG5cblx0XHRpZiAodGhpcy50ZXh0dXJlICE9IHRleHR1cmUpIHtcblx0XHRcdC8vbmV3IHRleHR1cmUuLiBmbHVzaCBwcmV2aW91cyBkYXRhXG5cdFx0XHR0aGlzLmZsdXNoKCk7XG5cdFx0XHR0aGlzLnRleHR1cmUgPSB0ZXh0dXJlO1xuXHRcdH0gZWxzZSBpZiAodGhpcy5pZHggPT0gdGhpcy52ZXJ0aWNlcy5sZW5ndGgpIHtcblx0XHRcdHRoaXMuZmx1c2goKTsgLy93ZSd2ZSByZWFjaGVkIG91ciBtYXgsIGZsdXNoIGJlZm9yZSBwdXNoaW5nIG1vcmUgZGF0YVxuXHRcdH1cblxuXHRcdG9mZiA9IG9mZiB8fCAwO1xuXHRcdC8vVE9ETzogdXNlIGEgbG9vcCBoZXJlP1xuXHRcdC8veHlcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2ZXJ0c1tvZmYrK107XG5cdFx0Ly9jb2xvclxuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2ZXJ0c1tvZmYrK107XG5cdFx0Ly91dlxuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2ZXJ0c1tvZmYrK107XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHZlcnRzW29mZisrXTtcblx0XHRcblx0XHQvL3h5XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHZlcnRzW29mZisrXTtcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdC8vY29sb3Jcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdC8vdXZcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2ZXJ0c1tvZmYrK107XG5cblx0XHQvL3h5XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHZlcnRzW29mZisrXTtcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdC8vY29sb3Jcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdC8vdXZcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2ZXJ0c1tvZmYrK107XG5cblx0XHQvL3h5XG5cdFx0dGhpcy52ZXJ0aWNlc1t0aGlzLmlkeCsrXSA9IHZlcnRzW29mZisrXTtcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdC8vY29sb3Jcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdC8vdXZcblx0XHR0aGlzLnZlcnRpY2VzW3RoaXMuaWR4KytdID0gdmVydHNbb2ZmKytdO1xuXHRcdHRoaXMudmVydGljZXNbdGhpcy5pZHgrK10gPSB2ZXJ0c1tvZmYrK107XG5cdH1cbn0pO1xuXG4vKipcbiAqIFRoZSBkZWZhdWx0IHZlcnRleCBzaXplLCBpLmUuIG51bWJlciBvZiBmbG9hdHMgcGVyIHZlcnRleC5cbiAqIEBhdHRyaWJ1dGUgIFZFUlRFWF9TSVpFXG4gKiBAc3RhdGljXG4gKiBAZmluYWxcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAZGVmYXVsdCAgNVxuICovXG5TcHJpdGVCYXRjaC5WRVJURVhfU0laRSA9IDU7XG5cbi8qKlxuICogSW5jcmVtZW50ZWQgYWZ0ZXIgZWFjaCBkcmF3IGNhbGwsIGNhbiBiZSB1c2VkIGZvciBkZWJ1Z2dpbmcuXG4gKlxuICogICAgIFNwcml0ZUJhdGNoLnRvdGFsUmVuZGVyQ2FsbHMgPSAwO1xuICpcbiAqICAgICAuLi4gZHJhdyB5b3VyIHNjZW5lIC4uLlxuICpcbiAqICAgICBjb25zb2xlLmxvZyhcIkRyYXcgY2FsbHMgcGVyIGZyYW1lOlwiLCBTcHJpdGVCYXRjaC50b3RhbFJlbmRlckNhbGxzKTtcbiAqXG4gKiBcbiAqIEBhdHRyaWJ1dGUgIHRvdGFsUmVuZGVyQ2FsbHNcbiAqIEBzdGF0aWNcbiAqIEB0eXBlIHtOdW1iZXJ9XG4gKiBAZGVmYXVsdCAgMFxuICovXG5TcHJpdGVCYXRjaC50b3RhbFJlbmRlckNhbGxzID0gMDtcblxuU3ByaXRlQmF0Y2guREVGQVVMVF9GUkFHX1NIQURFUiA9IFtcblx0XCJwcmVjaXNpb24gbWVkaXVtcCBmbG9hdDtcIixcblx0XCJ2YXJ5aW5nIHZlYzIgdlRleENvb3JkMDtcIixcblx0XCJ2YXJ5aW5nIHZlYzQgdkNvbG9yO1wiLFxuXHRcInVuaWZvcm0gc2FtcGxlcjJEIHVfdGV4dHVyZTA7XCIsXG5cblx0XCJ2b2lkIG1haW4odm9pZCkge1wiLFxuXHRcIiAgIGdsX0ZyYWdDb2xvciA9IHRleHR1cmUyRCh1X3RleHR1cmUwLCB2VGV4Q29vcmQwKSAqIHZDb2xvcjtcIixcblx0XCJ9XCJcbl0uam9pbignXFxuJyk7XG5cblNwcml0ZUJhdGNoLkRFRkFVTFRfVkVSVF9TSEFERVIgPSBbXG5cdFwiYXR0cmlidXRlIHZlYzIgUG9zaXRpb247XCIsXG5cdFwiYXR0cmlidXRlIHZlYzQgQ29sb3I7XCIsXG5cdFwiYXR0cmlidXRlIHZlYzIgVGV4Q29vcmQwO1wiLFxuXG5cdFwidW5pZm9ybSB2ZWMyIHVfcHJvamVjdGlvbjtcIixcblx0XCJ2YXJ5aW5nIHZlYzIgdlRleENvb3JkMDtcIixcblx0XCJ2YXJ5aW5nIHZlYzQgdkNvbG9yO1wiLFxuXG5cdFwidm9pZCBtYWluKHZvaWQpIHtcIixcblx0XCIgICBnbF9Qb3NpdGlvbiA9IHZlYzQoIFBvc2l0aW9uLnggLyB1X3Byb2plY3Rpb24ueCAtIDEuMCwgUG9zaXRpb24ueSAvIC11X3Byb2plY3Rpb24ueSArIDEuMCAsIDAuMCwgMS4wKTtcIixcblx0XCIgICB2VGV4Q29vcmQwID0gVGV4Q29vcmQwO1wiLFxuXHRcIiAgIHZDb2xvciA9IENvbG9yO1wiLFxuXHRcIn1cIlxuXS5qb2luKCdcXG4nKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTcHJpdGVCYXRjaDtcbiIsIi8qKlxuICogQG1vZHVsZSBrYW1pXG4gKi9cblxudmFyIENsYXNzID0gcmVxdWlyZSgna2xhc3NlJyk7XG52YXIgU2lnbmFsID0gcmVxdWlyZSgnc2lnbmFscycpO1xudmFyIG5leHRQb3dlck9mVHdvID0gcmVxdWlyZSgnbnVtYmVyLXV0aWwnKS5uZXh0UG93ZXJPZlR3bztcbnZhciBpc1Bvd2VyT2ZUd28gPSByZXF1aXJlKCdudW1iZXItdXRpbCcpLmlzUG93ZXJPZlR3bztcblxudmFyIFRleHR1cmUgPSBuZXcgQ2xhc3Moe1xuXG5cblx0LyoqXG5cdCAqIENyZWF0ZXMgYSBuZXcgdGV4dHVyZSB3aXRoIHRoZSBvcHRpb25hbCB3aWR0aCwgaGVpZ2h0LCBhbmQgZGF0YS5cblx0ICpcblx0ICogSWYgdGhlIGNvbnN0cnVjdG9yIGlzIHBhc3NlZCBubyBwYXJhbWV0ZXJzIG90aGVyIHRoYW4gV2ViR0xDb250ZXh0LCB0aGVuXG5cdCAqIGl0IHdpbGwgbm90IGJlIGluaXRpYWxpemVkIGFuZCB3aWxsIGJlIG5vbi1yZW5kZXJhYmxlLiBZb3Ugd2lsbCBuZWVkIHRvIG1hbnVhbGx5XG5cdCAqIHVwbG9hZERhdGEgb3IgdXBsb2FkSW1hZ2UgeW91cnNlbGYuXG5cdCAqXG5cdCAqIElmIHlvdSBwYXNzIGEgd2lkdGggYW5kIGhlaWdodCBhZnRlciBjb250ZXh0LCB0aGUgdGV4dHVyZSB3aWxsIGJlIGluaXRpYWxpemVkIHdpdGggdGhhdCBzaXplXG5cdCAqIGFuZCBudWxsIGRhdGEgKGUuZy4gdHJhbnNwYXJlbnQgYmxhY2spLiBJZiB5b3UgYWxzbyBwYXNzIHRoZSBmb3JtYXQgYW5kIGRhdGEsIFxuXHQgKiBpdCB3aWxsIGJlIHVwbG9hZGVkIHRvIHRoZSB0ZXh0dXJlLiBcblx0ICpcblx0ICogSWYgeW91IHBhc3MgYSBTdHJpbmcgb3IgRGF0YSBVUkkgYXMgdGhlIHNlY29uZCBwYXJhbWV0ZXIsXG5cdCAqIHRoaXMgVGV4dHVyZSB3aWxsIGxvYWQgYW4gSW1hZ2Ugb2JqZWN0IGFzeW5jaHJvbm91c2x5LiBUaGUgb3B0aW9uYWwgdGhpcmRcblx0ICogYW5kIGZvdXJ0aCBwYXJhbWV0ZXJzIGFyZSBjYWxsYmFjayBmdW5jdGlvbnMgZm9yIHN1Y2Nlc3MgYW5kIGZhaWx1cmUsIHJlc3BlY3RpdmVseS4gXG5cdCAqIFRoZSBvcHRpb25hbCBmaWZydGggcGFyYW1ldGVyIGZvciB0aGlzIHZlcnNpb24gb2YgdGhlIGNvbnN0cnVjdG9yIGlzIGdlbk1pcG1hcHMsIHdoaWNoIGRlZmF1bHRzIHRvIGZhbHNlLiBcblx0ICogXG5cdCAqIFRoZSBhcmd1bWVudHMgYXJlIGtlcHQgaW4gbWVtb3J5IGZvciBmdXR1cmUgY29udGV4dCByZXN0b3JhdGlvbiBldmVudHMuIElmXG5cdCAqIHRoaXMgaXMgdW5kZXNpcmFibGUgKGUuZy4gaHVnZSBidWZmZXJzIHdoaWNoIG5lZWQgdG8gYmUgR0MnZCksIHlvdSBzaG91bGQgbm90XG5cdCAqIHBhc3MgdGhlIGRhdGEgaW4gdGhlIGNvbnN0cnVjdG9yLCBidXQgaW5zdGVhZCB1cGxvYWQgaXQgYWZ0ZXIgY3JlYXRpbmcgYW4gdW5pbml0aWFsaXplZCBcblx0ICogdGV4dHVyZS4gWW91IHdpbGwgbmVlZCB0byBtYW5hZ2UgaXQgeW91cnNlbGYsIGVpdGhlciBieSBleHRlbmRpbmcgdGhlIGNyZWF0ZSgpIG1ldGhvZCwgXG5cdCAqIG9yIGxpc3RlbmluZyB0byByZXN0b3JlZCBldmVudHMgaW4gV2ViR0xDb250ZXh0LlxuXHQgKlxuXHQgKiBNb3N0IHVzZXJzIHdpbGwgd2FudCB0byB1c2UgdGhlIEFzc2V0TWFuYWdlciB0byBjcmVhdGUgYW5kIG1hbmFnZSB0aGVpciB0ZXh0dXJlc1xuXHQgKiB3aXRoIGFzeW5jaHJvbm91cyBsb2FkaW5nIGFuZCBjb250ZXh0IGxvc3MuIFxuXHQgKlxuXHQgKiBAZXhhbXBsZVxuXHQgKiBcdFx0bmV3IFRleHR1cmUoY29udGV4dCwgMjU2LCAyNTYpOyAvL2VtcHR5IDI1NngyNTYgdGV4dHVyZVxuXHQgKiBcdFx0bmV3IFRleHR1cmUoY29udGV4dCwgMSwgMSwgVGV4dHVyZS5Gb3JtYXQuUkdCQSwgVGV4dHVyZS5EYXRhVHlwZS5VTlNJR05FRF9CWVRFLCBcblx0ICogXHRcdFx0XHRcdG5ldyBVaW50OEFycmF5KFsyNTUsMCwwLDI1NV0pKTsgLy8xeDEgcmVkIHRleHR1cmVcblx0ICogXHRcdG5ldyBUZXh0dXJlKGNvbnRleHQsIFwidGVzdC5wbmdcIik7IC8vbG9hZHMgaW1hZ2UgYXN5bmNocm9ub3VzbHlcblx0ICogXHRcdG5ldyBUZXh0dXJlKGNvbnRleHQsIFwidGVzdC5wbmdcIiwgc3VjY2Vzc0Z1bmMsIGZhaWxGdW5jLCB1c2VNaXBtYXBzKTsgLy9leHRyYSBwYXJhbXMgZm9yIGltYWdlIGxhb2RlciBcblx0ICpcblx0ICogQGNsYXNzICBUZXh0dXJlXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0gIHtXZWJHTENvbnRleHR9IGNvbnRleHQgdGhlIFdlYkdMIGNvbnRleHRcblx0ICogQHBhcmFtICB7TnVtYmVyfSB3aWR0aCB0aGUgd2lkdGggb2YgdGhpcyB0ZXh0dXJlXG5cdCAqIEBwYXJhbSAge051bWJlcn0gaGVpZ2h0IHRoZSBoZWlnaHQgb2YgdGhpcyB0ZXh0dXJlXG5cdCAqIEBwYXJhbSAge0dMZW51bX0gZm9ybWF0IGUuZy4gVGV4dHVyZS5Gb3JtYXQuUkdCQVxuXHQgKiBAcGFyYW0gIHtHTGVudW19IGRhdGFUeXBlIGUuZy4gVGV4dHVyZS5EYXRhVHlwZS5VTlNJR05FRF9CWVRFIChVaW50OEFycmF5KVxuXHQgKiBAcGFyYW0gIHtHTGVudW19IGRhdGEgdGhlIGFycmF5IGJ1ZmZlciwgZS5nLiBhIFVpbnQ4QXJyYXkgdmlld1xuXHQgKiBAcGFyYW0gIHtCb29sZWFufSBnZW5NaXBtYXBzIHdoZXRoZXIgdG8gZ2VuZXJhdGUgbWlwbWFwcyBhZnRlciB1cGxvYWRpbmcgdGhlIGRhdGFcblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIFRleHR1cmUoY29udGV4dCwgd2lkdGgsIGhlaWdodCwgZm9ybWF0LCBkYXRhVHlwZSwgZGF0YSwgZ2VuTWlwbWFwcykge1xuXHRcdGlmICh0eXBlb2YgY29udGV4dCAhPT0gXCJvYmplY3RcIilcblx0XHRcdHRocm93IFwiR0wgY29udGV4dCBub3Qgc3BlY2lmaWVkIHRvIFRleHR1cmVcIjtcblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIFdlYkdMVGV4dHVyZSB3aGljaCBiYWNrcyB0aGlzIFRleHR1cmUgb2JqZWN0LiBUaGlzXG5cdFx0ICogY2FuIGJlIHVzZWQgZm9yIGxvdy1sZXZlbCBHTCBjYWxscy5cblx0XHQgKiBcblx0XHQgKiBAdHlwZSB7V2ViR0xUZXh0dXJlfVxuXHRcdCAqL1xuXHRcdHRoaXMuaWQgPSBudWxsOyAvL2luaXRpYWxpemVkIGluIGNyZWF0ZSgpXG5cblx0XHQvKipcblx0XHQgKiBUaGUgdGFyZ2V0IGZvciB0aGlzIHRleHR1cmUgdW5pdCwgaS5lLiBURVhUVVJFXzJELiBTdWJjbGFzc2VzXG5cdFx0ICogc2hvdWxkIG92ZXJyaWRlIHRoZSBjcmVhdGUoKSBtZXRob2QgdG8gY2hhbmdlIHRoaXMsIGZvciBjb3JyZWN0XG5cdFx0ICogdXNhZ2Ugd2l0aCBjb250ZXh0IHJlc3RvcmUuXG5cdFx0ICogXG5cdFx0ICogQHByb3BlcnR5IHRhcmdldFxuXHRcdCAqIEB0eXBlIHtHTGVudW19XG5cdFx0ICogQGRlZmF1bHQgIGdsLlRFWFRVUkVfMkRcblx0XHQgKi9cblx0XHR0aGlzLnRhcmdldCA9IGNvbnRleHQuZ2wuVEVYVFVSRV8yRDtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSB3aWR0aCBvZiB0aGlzIHRleHR1cmUsIGluIHBpeGVscy5cblx0XHQgKiBcblx0XHQgKiBAcHJvcGVydHkgd2lkdGhcblx0XHQgKiBAcmVhZE9ubHlcblx0XHQgKiBAdHlwZSB7TnVtYmVyfSB0aGUgd2lkdGhcblx0XHQgKi9cblx0XHR0aGlzLndpZHRoID0gMDsgLy9pbml0aWFsaXplZCBvbiB0ZXh0dXJlIHVwbG9hZFxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGhlaWdodCBvZiB0aGlzIHRleHR1cmUsIGluIHBpeGVscy5cblx0XHQgKiBcblx0XHQgKiBAcHJvcGVydHkgaGVpZ2h0XG5cdFx0ICogQHJlYWRPbmx5XG5cdFx0ICogQHR5cGUge051bWJlcn0gdGhlIGhlaWdodFxuXHRcdCAqL1xuXHRcdHRoaXMuaGVpZ2h0ID0gMDsgLy9pbml0aWFsaXplZCBvbiB0ZXh0dXJlIHVwbG9hZFxuXG5cdFx0Ly8gZS5nLiAtLT4gbmV3IFRleHR1cmUoZ2wsIDI1NiwgMjU2LCBnbC5SR0IsIGdsLlVOU0lHTkVEX0JZVEUsIGRhdGEpO1xuXHRcdC8vXHRcdCAgICAgIGNyZWF0ZXMgYSBuZXcgZW1wdHkgdGV4dHVyZSwgMjU2eDI1NlxuXHRcdC8vXHRcdC0tPiBuZXcgVGV4dHVyZShnbCk7XG5cdFx0Ly9cdFx0XHQgIGNyZWF0ZXMgYSBuZXcgdGV4dHVyZSBidXQgV0lUSE9VVCB1cGxvYWRpbmcgYW55IGRhdGEuIFxuXG5cdFx0LyoqXG5cdFx0ICogVGhlIFMgd3JhcCBwYXJhbWV0ZXIuXG5cdFx0ICogQHByb3BlcnR5IHtHTGVudW19IHdyYXBTXG5cdFx0ICovXG5cdFx0dGhpcy53cmFwUyA9IFRleHR1cmUuREVGQVVMVF9XUkFQO1xuXHRcdC8qKlxuXHRcdCAqIFRoZSBUIHdyYXAgcGFyYW1ldGVyLlxuXHRcdCAqIEBwcm9wZXJ0eSB7R0xlbnVtfSB3cmFwVFxuXHRcdCAqL1xuXHRcdHRoaXMud3JhcFQgPSBUZXh0dXJlLkRFRkFVTFRfV1JBUDtcblx0XHQvKipcblx0XHQgKiBUaGUgbWluaWZjYXRpb24gZmlsdGVyLlxuXHRcdCAqIEBwcm9wZXJ0eSB7R0xlbnVtfSBtaW5GaWx0ZXIgXG5cdFx0ICovXG5cdFx0dGhpcy5taW5GaWx0ZXIgPSBUZXh0dXJlLkRFRkFVTFRfRklMVEVSO1xuXHRcdFxuXHRcdC8qKlxuXHRcdCAqIFRoZSBtYWduaWZpY2F0aW9uIGZpbHRlci5cblx0XHQgKiBAcHJvcGVydHkge0dMZW51bX0gbWFnRmlsdGVyIFxuXHRcdCAqL1xuXHRcdHRoaXMubWFnRmlsdGVyID0gVGV4dHVyZS5ERUZBVUxUX0ZJTFRFUjtcblxuXHRcdC8qKlxuXHRcdCAqIFdoZW4gYSB0ZXh0dXJlIGlzIGNyZWF0ZWQsIHdlIGtlZXAgdHJhY2sgb2YgdGhlIGFyZ3VtZW50cyBwcm92aWRlZCB0byBcblx0XHQgKiBpdHMgY29uc3RydWN0b3IuIE9uIGNvbnRleHQgbG9zcyBhbmQgcmVzdG9yZSwgdGhlc2UgYXJndW1lbnRzIGFyZSByZS1zdXBwbGllZFxuXHRcdCAqIHRvIHRoZSBUZXh0dXJlLCBzbyBhcyB0byByZS1jcmVhdGUgaXQgaW4gaXRzIGNvcnJlY3QgZm9ybS5cblx0XHQgKlxuXHRcdCAqIFRoaXMgaXMgbWFpbmx5IHVzZWZ1bCBpZiB5b3UgYXJlIHByb2NlZHVyYWxseSBjcmVhdGluZyB0ZXh0dXJlcyBhbmQgcGFzc2luZ1xuXHRcdCAqIHRoZWlyIGRhdGEgZGlyZWN0bHkgKGUuZy4gZm9yIGdlbmVyaWMgbG9va3VwIHRhYmxlcyBpbiBhIHNoYWRlcikuIEZvciBpbWFnZVxuXHRcdCAqIG9yIG1lZGlhIGJhc2VkIHRleHR1cmVzLCBpdCB3b3VsZCBiZSBiZXR0ZXIgdG8gdXNlIGFuIEFzc2V0TWFuYWdlciB0byBtYW5hZ2Vcblx0XHQgKiB0aGUgYXN5bmNocm9ub3VzIHRleHR1cmUgdXBsb2FkLlxuXHRcdCAqXG5cdFx0ICogVXBvbiBkZXN0cm95aW5nIGEgdGV4dHVyZSwgYSByZWZlcmVuY2UgdG8gdGhpcyBpcyBhbHNvIGxvc3QuXG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkgbWFuYWdlZEFyZ3Ncblx0XHQgKiBAdHlwZSB7QXJyYXl9IHRoZSBhcnJheSBvZiBhcmd1bWVudHMsIHNoaWZ0ZWQgdG8gZXhjbHVkZSB0aGUgV2ViR0xDb250ZXh0IHBhcmFtZXRlclxuXHRcdCAqL1xuXHRcdHRoaXMubWFuYWdlZEFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG5cdFx0Ly9UaGlzIGlzIG1hYW5nZWQgYnkgV2ViR0xDb250ZXh0XG5cdFx0dGhpcy5jb250ZXh0LmFkZE1hbmFnZWRPYmplY3QodGhpcyk7XG5cdFx0dGhpcy5jcmVhdGUoKTtcblx0fSxcblxuXHQvKipcblx0ICogVGhpcyBjYW4gYmUgY2FsbGVkIGFmdGVyIGNyZWF0aW5nIGEgVGV4dHVyZSB0byBsb2FkIGFuIEltYWdlIG9iamVjdCBhc3luY2hyb25vdXNseSxcblx0ICogb3IgdXBsb2FkIGltYWdlIGRhdGEgZGlyZWN0bHkuIEl0IHRha2VzIHRoZSBzYW1lIHBhcmFtZXRlcnMgYXMgdGhlIGNvbnN0cnVjdG9yLCBleGNlcHQgXG5cdCAqIGZvciB0aGUgY29udGV4dCB3aGljaCBoYXMgYWxyZWFkeSBiZWVuIGVzdGFibGlzaGVkLiBcblx0ICpcblx0ICogVXNlcnMgd2lsbCBnZW5lcmFsbHkgbm90IG5lZWQgdG8gY2FsbCB0aGlzIGRpcmVjdGx5LiBcblx0ICogXG5cdCAqIEBwcm90ZWN0ZWRcblx0ICogQG1ldGhvZCAgc2V0dXBcblx0ICovXG5cdHNldHVwOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBmb3JtYXQsIGRhdGFUeXBlLCBkYXRhLCBnZW5NaXBtYXBzKSB7XG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblxuXHRcdC8vSWYgdGhlIGZpcnN0IGFyZ3VtZW50IGlzIGEgc3RyaW5nLCBhc3N1bWUgaXQncyBhbiBJbWFnZSBsb2FkZXJcblx0XHQvL3NlY29uZCBhcmd1bWVudCB3aWxsIHRoZW4gYmUgZ2VuTWlwbWFwcywgdGhpcmQgYW5kIGZvdXJ0aCB0aGUgc3VjY2Vzcy9mYWlsIGNhbGxiYWNrc1xuXHRcdGlmICh0eXBlb2Ygd2lkdGggPT09IFwic3RyaW5nXCIpIHtcblx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdHZhciBwYXRoICAgICAgPSBhcmd1bWVudHNbMF07ICAgLy9maXJzdCBhcmd1bWVudCwgdGhlIHBhdGhcblx0XHRcdHZhciBzdWNjZXNzQ0IgPSB0eXBlb2YgYXJndW1lbnRzWzFdID09PSBcImZ1bmN0aW9uXCIgPyBhcmd1bWVudHNbMV0gOiBudWxsO1xuXHRcdFx0dmFyIGZhaWxDQiAgICA9IHR5cGVvZiBhcmd1bWVudHNbMl0gPT09IFwiZnVuY3Rpb25cIiA/IGFyZ3VtZW50c1syXSA6IG51bGw7XG5cdFx0XHRnZW5NaXBtYXBzICAgID0gISFhcmd1bWVudHNbM107XG5cblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0Ly9JZiB5b3UgdHJ5IHRvIHJlbmRlciBhIHRleHR1cmUgdGhhdCBpcyBub3QgeWV0IFwicmVuZGVyYWJsZVwiIChpLmUuIHRoZSBcblx0XHRcdC8vYXN5bmMgbG9hZCBoYXNuJ3QgY29tcGxldGVkIHlldCwgd2hpY2ggaXMgYWx3YXlzIHRoZSBjYXNlIGluIENocm9tZSBzaW5jZSByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcblx0XHRcdC8vZmlyZXMgYmVmb3JlIGltZy5vbmxvYWQpLCBXZWJHTCB3aWxsIHRocm93IHVzIGVycm9ycy4gU28gaW5zdGVhZCB3ZSB3aWxsIGp1c3QgdXBsb2FkIHNvbWVcblx0XHRcdC8vZHVtbXkgZGF0YSB1bnRpbCB0aGUgdGV4dHVyZSBsb2FkIGlzIGNvbXBsZXRlLiBVc2VycyBjYW4gZGlzYWJsZSB0aGlzIHdpdGggdGhlIGdsb2JhbCBmbGFnLlxuXHRcdFx0aWYgKFRleHR1cmUuVVNFX0RVTU1ZXzF4MV9EQVRBKSB7XG5cdFx0XHRcdHNlbGYudXBsb2FkRGF0YSgxLCAxKTtcblx0XHRcdFx0dGhpcy53aWR0aCA9IHRoaXMuaGVpZ2h0ID0gMDtcblx0XHRcdH1cblxuXHRcdFx0aW1nLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRzZWxmLnVwbG9hZEltYWdlKGltZywgdW5kZWZpbmVkLCB1bmRlZmluZWQsIGdlbk1pcG1hcHMpO1xuXHRcdFx0XHRpZiAoc3VjY2Vzc0NCKVxuXHRcdFx0XHRcdHN1Y2Nlc3NDQigpO1xuXHRcdFx0fVxuXHRcdFx0aW1nLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gY29uc29sZS53YXJuKFwiRXJyb3IgbG9hZGluZyBpbWFnZTogXCIrcGF0aCk7XG5cdFx0XHRcdGlmIChnZW5NaXBtYXBzKSAvL3dlIHN0aWxsIG5lZWQgdG8gZ2VuIG1pcG1hcHMgb24gdGhlIDF4MSBkdW1teVxuXHRcdFx0XHRcdGdsLmdlbmVyYXRlTWlwbWFwKGdsLlRFWFRVUkVfMkQpO1xuXHRcdFx0XHRpZiAoZmFpbENCKVxuXHRcdFx0XHRcdGZhaWxDQigpO1xuXHRcdFx0fVxuXHRcdFx0aW1nLm9uYWJvcnQgPSBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly8gY29uc29sZS53YXJuKFwiSW1hZ2UgbG9hZCBhYm9ydGVkOiBcIitwYXRoKTtcblx0XHRcdFx0aWYgKGdlbk1pcG1hcHMpIC8vd2Ugc3RpbGwgbmVlZCB0byBnZW4gbWlwbWFwcyBvbiB0aGUgMXgxIGR1bW15XG5cdFx0XHRcdFx0Z2wuZ2VuZXJhdGVNaXBtYXAoZ2wuVEVYVFVSRV8yRCk7XG5cdFx0XHRcdGlmIChmYWlsQ0IpXG5cdFx0XHRcdFx0ZmFpbENCKCk7XG5cdFx0XHR9XG5cblx0XHRcdGltZy5zcmMgPSBwYXRoO1xuXHRcdH0gXG5cdFx0Ly9vdGhlcndpc2UgYXNzdW1lIG91ciByZWd1bGFyIGxpc3Qgb2Ygd2lkdGgvaGVpZ2h0IGFyZ3VtZW50cyBhcmUgcGFzc2VkXG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnVwbG9hZERhdGEod2lkdGgsIGhlaWdodCwgZm9ybWF0LCBkYXRhVHlwZSwgZGF0YSwgZ2VuTWlwbWFwcyk7XG5cdFx0fVxuXHR9LFx0XG5cblx0LyoqXG5cdCAqIENhbGxlZCBpbiB0aGUgVGV4dHVyZSBjb25zdHJ1Y3RvciwgYW5kIGFmdGVyIHRoZSBHTCBjb250ZXh0IGhhcyBiZWVuIHJlLWluaXRpYWxpemVkLiBcblx0ICogU3ViY2xhc3NlcyBjYW4gb3ZlcnJpZGUgdGhpcyB0byBwcm92aWRlIGEgY3VzdG9tIGRhdGEgdXBsb2FkLCBlLmcuIGN1YmVtYXBzIG9yIGNvbXByZXNzZWRcblx0ICogdGV4dHVyZXMuXG5cdCAqXG5cdCAqIEBtZXRob2QgIGNyZWF0ZVxuXHQgKi9cblx0Y3JlYXRlOiBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmdsID0gdGhpcy5jb250ZXh0LmdsOyBcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXG5cdFx0dGhpcy5pZCA9IGdsLmNyZWF0ZVRleHR1cmUoKTsgLy90ZXh0dXJlIElEIGlzIHJlY3JlYXRlZFxuXHRcdHRoaXMud2lkdGggPSB0aGlzLmhlaWdodCA9IDA7IC8vc2l6ZSBpcyByZXNldCB0byB6ZXJvIHVudGlsIGxvYWRlZFxuXHRcdHRoaXMudGFyZ2V0ID0gZ2wuVEVYVFVSRV8yRDsgIC8vdGhlIHByb3ZpZGVyIGNhbiBjaGFuZ2UgdGhpcyBpZiBuZWNlc3NhcnkgKGUuZy4gY3ViZSBtYXBzKVxuXG5cdFx0dGhpcy5iaW5kKCk7XG5cblxuXHRcdC8vVE9ETzogY2xlYW4gdGhlc2UgdXAgYSBsaXR0bGUuIFxuXHRcdGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19QUkVNVUxUSVBMWV9BTFBIQV9XRUJHTCwgVGV4dHVyZS5VTlBBQ0tfUFJFTVVMVElQTFlfQUxQSEEpO1xuXHRcdGdsLnBpeGVsU3RvcmVpKGdsLlVOUEFDS19BTElHTk1FTlQsIFRleHR1cmUuVU5QQUNLX0FMSUdOTUVOVCk7XG5cdFx0Z2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0ZMSVBfWV9XRUJHTCwgVGV4dHVyZS5VTlBBQ0tfRkxJUF9ZKTtcblx0XHRcblx0XHR2YXIgY29sb3JzcGFjZSA9IFRleHR1cmUuVU5QQUNLX0NPTE9SU1BBQ0VfQ09OVkVSU0lPTiB8fCBnbC5CUk9XU0VSX0RFRkFVTFRfV0VCR0w7XG5cdFx0Z2wucGl4ZWxTdG9yZWkoZ2wuVU5QQUNLX0NPTE9SU1BBQ0VfQ09OVkVSU0lPTl9XRUJHTCwgY29sb3JzcGFjZSk7XG5cblx0XHQvL3NldHVwIHdyYXAgbW9kZXMgd2l0aG91dCBiaW5kaW5nIHJlZHVuZGFudGx5XG5cdFx0dGhpcy5zZXRXcmFwKHRoaXMud3JhcFMsIHRoaXMud3JhcFQsIGZhbHNlKTtcblx0XHR0aGlzLnNldEZpbHRlcih0aGlzLm1pbkZpbHRlciwgdGhpcy5tYWdGaWx0ZXIsIGZhbHNlKTtcblx0XHRcblx0XHRpZiAodGhpcy5tYW5hZ2VkQXJncy5sZW5ndGggIT09IDApIHtcblx0XHRcdHRoaXMuc2V0dXAuYXBwbHkodGhpcywgdGhpcy5tYW5hZ2VkQXJncyk7XG5cdFx0fVxuXHR9LFxuXG5cdC8qKlxuXHQgKiBEZXN0cm95cyB0aGlzIHRleHR1cmUgYnkgZGVsZXRpbmcgdGhlIEdMIHJlc291cmNlLFxuXHQgKiByZW1vdmluZyBpdCBmcm9tIHRoZSBXZWJHTENvbnRleHQgbWFuYWdlbWVudCBzdGFjayxcblx0ICogc2V0dGluZyBpdHMgc2l6ZSB0byB6ZXJvLCBhbmQgaWQgYW5kIG1hbmFnZWQgYXJndW1lbnRzIHRvIG51bGwuXG5cdCAqIFxuXHQgKiBUcnlpbmcgdG8gdXNlIHRoaXMgdGV4dHVyZSBhZnRlciBtYXkgbGVhZCB0byB1bmRlZmluZWQgYmVoYXZpb3VyLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBkZXN0cm95XG5cdCAqL1xuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5pZCAmJiB0aGlzLmdsKVxuXHRcdFx0dGhpcy5nbC5kZWxldGVUZXh0dXJlKHRoaXMuaWQpO1xuXHRcdGlmICh0aGlzLmNvbnRleHQpXG5cdFx0XHR0aGlzLmNvbnRleHQucmVtb3ZlTWFuYWdlZE9iamVjdCh0aGlzKTtcblx0XHR0aGlzLndpZHRoID0gdGhpcy5oZWlnaHQgPSAwO1xuXHRcdHRoaXMuaWQgPSBudWxsO1xuXHRcdHRoaXMubWFuYWdlZEFyZ3MgPSBudWxsO1xuXHRcdHRoaXMuY29udGV4dCA9IG51bGw7XG5cdFx0dGhpcy5nbCA9IG51bGw7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIHdyYXAgbW9kZSBmb3IgdGhpcyB0ZXh0dXJlOyBpZiB0aGUgc2Vjb25kIGFyZ3VtZW50XG5cdCAqIGlzIHVuZGVmaW5lZCBvciBmYWxzeSwgdGhlbiBib3RoIFMgYW5kIFQgd3JhcCB3aWxsIHVzZSB0aGUgZmlyc3Rcblx0ICogYXJndW1lbnQuXG5cdCAqXG5cdCAqIFlvdSBjYW4gdXNlIFRleHR1cmUuV3JhcCBjb25zdGFudHMgZm9yIGNvbnZlbmllbmNlLCB0byBhdm9pZCBuZWVkaW5nIFxuXHQgKiBhIEdMIHJlZmVyZW5jZS5cblx0ICpcblx0ICogQG1ldGhvZCAgc2V0V3JhcFxuXHQgKiBAcGFyYW0ge0dMZW51bX0gcyB0aGUgUyB3cmFwIG1vZGVcblx0ICogQHBhcmFtIHtHTGVudW19IHQgdGhlIFQgd3JhcCBtb2RlXG5cdCAqIEBwYXJhbSB7Qm9vbGVhbn0gaWdub3JlQmluZCAob3B0aW9uYWwpIGlmIHRydWUsIHRoZSBiaW5kIHdpbGwgYmUgaWdub3JlZC4gXG5cdCAqL1xuXHRzZXRXcmFwOiBmdW5jdGlvbihzLCB0LCBpZ25vcmVCaW5kKSB7IC8vVE9ETzogc3VwcG9ydCBSIHdyYXAgbW9kZVxuXHRcdGlmIChzICYmIHQpIHtcblx0XHRcdHRoaXMud3JhcFMgPSBzO1xuXHRcdFx0dGhpcy53cmFwVCA9IHQ7XG5cdFx0fSBlbHNlIFxuXHRcdFx0dGhpcy53cmFwUyA9IHRoaXMud3JhcFQgPSBzO1xuXHRcdFxuXHRcdC8vZW5mb3JjZSBQT1QgcnVsZXMuLlxuXHRcdHRoaXMuX2NoZWNrUE9UKCk7XHRcblxuXHRcdGlmICghaWdub3JlQmluZClcblx0XHRcdHRoaXMuYmluZCgpO1xuXG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblx0XHRnbC50ZXhQYXJhbWV0ZXJpKHRoaXMudGFyZ2V0LCBnbC5URVhUVVJFX1dSQVBfUywgdGhpcy53cmFwUyk7XG5cdFx0Z2wudGV4UGFyYW1ldGVyaSh0aGlzLnRhcmdldCwgZ2wuVEVYVFVSRV9XUkFQX1QsIHRoaXMud3JhcFQpO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFNldHMgdGhlIG1pbiBhbmQgbWFnIGZpbHRlciBmb3IgdGhpcyB0ZXh0dXJlOyBcblx0ICogaWYgbWFnIGlzIHVuZGVmaW5lZCBvciBmYWxzeSwgdGhlbiBib3RoIG1pbiBhbmQgbWFnIHdpbGwgdXNlIHRoZVxuXHQgKiBmaWx0ZXIgc3BlY2lmaWVkIGZvciBtaW4uXG5cdCAqXG5cdCAqIFlvdSBjYW4gdXNlIFRleHR1cmUuRmlsdGVyIGNvbnN0YW50cyBmb3IgY29udmVuaWVuY2UsIHRvIGF2b2lkIG5lZWRpbmcgXG5cdCAqIGEgR0wgcmVmZXJlbmNlLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBzZXRGaWx0ZXJcblx0ICogQHBhcmFtIHtHTGVudW19IG1pbiB0aGUgbWluaWZpY2F0aW9uIGZpbHRlclxuXHQgKiBAcGFyYW0ge0dMZW51bX0gbWFnIHRoZSBtYWduaWZpY2F0aW9uIGZpbHRlclxuXHQgKiBAcGFyYW0ge0Jvb2xlYW59IGlnbm9yZUJpbmQgaWYgdHJ1ZSwgdGhlIGJpbmQgd2lsbCBiZSBpZ25vcmVkLiBcblx0ICovXG5cdHNldEZpbHRlcjogZnVuY3Rpb24obWluLCBtYWcsIGlnbm9yZUJpbmQpIHsgXG5cdFx0aWYgKG1pbiAmJiBtYWcpIHtcblx0XHRcdHRoaXMubWluRmlsdGVyID0gbWluO1xuXHRcdFx0dGhpcy5tYWdGaWx0ZXIgPSBtYWc7XG5cdFx0fSBlbHNlIFxuXHRcdFx0dGhpcy5taW5GaWx0ZXIgPSB0aGlzLm1hZ0ZpbHRlciA9IG1pbjtcblx0XHRcblx0XHQvL2VuZm9yY2UgUE9UIHJ1bGVzLi5cblx0XHR0aGlzLl9jaGVja1BPVCgpO1xuXG5cdFx0aWYgKCFpZ25vcmVCaW5kKVxuXHRcdFx0dGhpcy5iaW5kKCk7XG5cblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXHRcdGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUlOX0ZJTFRFUiwgdGhpcy5taW5GaWx0ZXIpO1xuXHRcdGdsLnRleFBhcmFtZXRlcmkodGhpcy50YXJnZXQsIGdsLlRFWFRVUkVfTUFHX0ZJTFRFUiwgdGhpcy5tYWdGaWx0ZXIpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBBIGxvdy1sZXZlbCBtZXRob2QgdG8gdXBsb2FkIHRoZSBzcGVjaWZpZWQgQXJyYXlCdWZmZXJWaWV3XG5cdCAqIHRvIHRoaXMgdGV4dHVyZS4gVGhpcyB3aWxsIGNhdXNlIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoaXNcblx0ICogdGV4dHVyZSB0byBjaGFuZ2UuXG5cdCAqXG5cdCAqIEBtZXRob2QgIHVwbG9hZERhdGFcblx0ICogQHBhcmFtICB7TnVtYmVyfSB3aWR0aCAgICAgICAgICB0aGUgbmV3IHdpZHRoIG9mIHRoaXMgdGV4dHVyZSxcblx0ICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWZhdWx0cyB0byB0aGUgbGFzdCB1c2VkIHdpZHRoIChvciB6ZXJvKVxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IGhlaWdodCAgICAgICAgIHRoZSBuZXcgaGVpZ2h0IG9mIHRoaXMgdGV4dHVyZVxuXHQgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRzIHRvIHRoZSBsYXN0IHVzZWQgaGVpZ2h0IChvciB6ZXJvKVxuXHQgKiBAcGFyYW0gIHtHTGVudW19IGZvcm1hdCAgICAgICAgIHRoZSBkYXRhIGZvcm1hdCwgZGVmYXVsdCBSR0JBXG5cdCAqIEBwYXJhbSAge0dMZW51bX0gdHlwZSAgICAgICAgICAgdGhlIGRhdGEgdHlwZSwgZGVmYXVsdCBVTlNJR05FRF9CWVRFIChVaW50OEFycmF5KVxuXHQgKiBAcGFyYW0gIHtBcnJheUJ1ZmZlclZpZXd9IGRhdGEgIHRoZSByYXcgZGF0YSBmb3IgdGhpcyB0ZXh0dXJlLCBvciBudWxsIGZvciBhbiBlbXB0eSBpbWFnZVxuXHQgKiBAcGFyYW0gIHtCb29sZWFufSBnZW5NaXBtYXBzXHQgICB3aGV0aGVyIHRvIGdlbmVyYXRlIG1pcG1hcHMgYWZ0ZXIgdXBsb2FkaW5nIHRoZSBkYXRhLCBkZWZhdWx0IGZhbHNlXG5cdCAqL1xuXHR1cGxvYWREYXRhOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0LCBmb3JtYXQsIHR5cGUsIGRhdGEsIGdlbk1pcG1hcHMpIHtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXG5cdFx0Zm9ybWF0ID0gZm9ybWF0IHx8IGdsLlJHQkE7XG5cdFx0dHlwZSA9IHR5cGUgfHwgZ2wuVU5TSUdORURfQllURTtcblx0XHRkYXRhID0gZGF0YSB8fCBudWxsOyAvL21ha2Ugc3VyZSBmYWxzZXkgdmFsdWUgaXMgbnVsbCBmb3IgdGV4SW1hZ2UyRFxuXG5cdFx0dGhpcy53aWR0aCA9ICh3aWR0aCB8fCB3aWR0aD09MCkgPyB3aWR0aCA6IHRoaXMud2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSAoaGVpZ2h0IHx8IGhlaWdodD09MCkgPyBoZWlnaHQgOiB0aGlzLmhlaWdodDtcblxuXHRcdHRoaXMuX2NoZWNrUE9UKCk7XG5cblx0XHR0aGlzLmJpbmQoKTtcblxuXHRcdGdsLnRleEltYWdlMkQodGhpcy50YXJnZXQsIDAsIGZvcm1hdCwgXG5cdFx0XHRcdFx0ICB0aGlzLndpZHRoLCB0aGlzLmhlaWdodCwgMCwgZm9ybWF0LFxuXHRcdFx0XHRcdCAgdHlwZSwgZGF0YSk7XG5cblx0XHRpZiAoZ2VuTWlwbWFwcylcblx0XHRcdGdsLmdlbmVyYXRlTWlwbWFwKHRoaXMudGFyZ2V0KTtcblx0fSxcblxuXHQvKipcblx0ICogVXBsb2FkcyBJbWFnZURhdGEsIEhUTUxJbWFnZUVsZW1lbnQsIEhUTUxDYW52YXNFbGVtZW50IG9yIFxuXHQgKiBIVE1MVmlkZW9FbGVtZW50LlxuXHQgKlxuXHQgKiBAbWV0aG9kICB1cGxvYWRJbWFnZVxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IGRvbU9iamVjdCB0aGUgRE9NIGltYWdlIGNvbnRhaW5lclxuXHQgKiBAcGFyYW0gIHtHTGVudW19IGZvcm1hdCB0aGUgZm9ybWF0LCBkZWZhdWx0IGdsLlJHQkFcblx0ICogQHBhcmFtICB7R0xlbnVtfSB0eXBlIHRoZSBkYXRhIHR5cGUsIGRlZmF1bHQgZ2wuVU5TSUdORURfQllURVxuXHQgKiBAcGFyYW0gIHtCb29sZWFufSBnZW5NaXBtYXBzIHdoZXRoZXIgdG8gZ2VuZXJhdGUgbWlwbWFwcyBhZnRlciB1cGxvYWRpbmcgdGhlIGRhdGEsIGRlZmF1bHQgZmFsc2Vcblx0ICovXG5cdHVwbG9hZEltYWdlOiBmdW5jdGlvbihkb21PYmplY3QsIGZvcm1hdCwgdHlwZSwgZ2VuTWlwbWFwcykge1xuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cblx0XHRmb3JtYXQgPSBmb3JtYXQgfHwgZ2wuUkdCQTtcblx0XHR0eXBlID0gdHlwZSB8fCBnbC5VTlNJR05FRF9CWVRFO1xuXHRcdFxuXHRcdHRoaXMud2lkdGggPSBkb21PYmplY3Qud2lkdGg7XG5cdFx0dGhpcy5oZWlnaHQgPSBkb21PYmplY3QuaGVpZ2h0O1xuXG5cdFx0dGhpcy5fY2hlY2tQT1QoKTtcblxuXHRcdHRoaXMuYmluZCgpO1xuXG5cdFx0Z2wudGV4SW1hZ2UyRCh0aGlzLnRhcmdldCwgMCwgZm9ybWF0LCBmb3JtYXQsXG5cdFx0XHRcdFx0ICB0eXBlLCBkb21PYmplY3QpO1xuXG5cdFx0aWYgKGdlbk1pcG1hcHMpXG5cdFx0XHRnbC5nZW5lcmF0ZU1pcG1hcCh0aGlzLnRhcmdldCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIElmIEZPUkNFX1BPVCBpcyBmYWxzZSwgd2UgdmVyaWZ5IHRoaXMgdGV4dHVyZSB0byBzZWUgaWYgaXQgaXMgdmFsaWQsIFxuXHQgKiBhcyBwZXIgbm9uLXBvd2VyLW9mLXR3byBydWxlcy4gSWYgaXQgaXMgbm9uLXBvd2VyLW9mLXR3bywgaXQgbXVzdCBoYXZlIFxuXHQgKiBhIHdyYXAgbW9kZSBvZiBDTEFNUF9UT19FREdFLCBhbmQgdGhlIG1pbmlmaWNhdGlvbiBmaWx0ZXIgbXVzdCBiZSBMSU5FQVJcblx0ICogb3IgTkVBUkVTVC4gSWYgd2UgZG9uJ3Qgc2F0aXNmeSB0aGVzZSBuZWVkcywgYW4gZXJyb3IgaXMgdGhyb3duLlxuXHQgKiBcblx0ICogQG1ldGhvZCAgX2NoZWNrUE9UXG5cdCAqIEBwcml2YXRlXG5cdCAqIEByZXR1cm4ge1t0eXBlXX0gW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0X2NoZWNrUE9UOiBmdW5jdGlvbigpIHtcblx0XHRpZiAoIVRleHR1cmUuRk9SQ0VfUE9UKSB7XG5cdFx0XHQvL0lmIG1pbkZpbHRlciBpcyBhbnl0aGluZyBidXQgTElORUFSIG9yIE5FQVJFU1Rcblx0XHRcdC8vb3IgaWYgd3JhcFMgb3Igd3JhcFQgYXJlIG5vdCBDTEFNUF9UT19FREdFLi4uXG5cdFx0XHR2YXIgd3JvbmdGaWx0ZXIgPSAodGhpcy5taW5GaWx0ZXIgIT09IFRleHR1cmUuRmlsdGVyLkxJTkVBUiAmJiB0aGlzLm1pbkZpbHRlciAhPT0gVGV4dHVyZS5GaWx0ZXIuTkVBUkVTVCk7XG5cdFx0XHR2YXIgd3JvbmdXcmFwID0gKHRoaXMud3JhcFMgIT09IFRleHR1cmUuV3JhcC5DTEFNUF9UT19FREdFIHx8IHRoaXMud3JhcFQgIT09IFRleHR1cmUuV3JhcC5DTEFNUF9UT19FREdFKTtcblxuXHRcdFx0aWYgKCB3cm9uZ0ZpbHRlciB8fCB3cm9uZ1dyYXAgKSB7XG5cdFx0XHRcdGlmICghaXNQb3dlck9mVHdvKHRoaXMud2lkdGgpIHx8ICFpc1Bvd2VyT2ZUd28odGhpcy5oZWlnaHQpKVxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcih3cm9uZ0ZpbHRlciBcblx0XHRcdFx0XHRcdFx0PyBcIk5vbi1wb3dlci1vZi10d28gdGV4dHVyZXMgY2Fubm90IHVzZSBtaXBtYXBwaW5nIGFzIGZpbHRlclwiXG5cdFx0XHRcdFx0XHRcdDogXCJOb24tcG93ZXItb2YtdHdvIHRleHR1cmVzIG11c3QgdXNlIENMQU1QX1RPX0VER0UgYXMgd3JhcFwiKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEJpbmRzIHRoZSB0ZXh0dXJlLiBJZiB1bml0IGlzIHNwZWNpZmllZCxcblx0ICogaXQgd2lsbCBiaW5kIHRoZSB0ZXh0dXJlIGF0IHRoZSBnaXZlbiBzbG90XG5cdCAqIChURVhUVVJFMCwgVEVYVFVSRTEsIGV0YykuIElmIHVuaXQgaXMgbm90IHNwZWNpZmllZCxcblx0ICogaXQgd2lsbCBzaW1wbHkgYmluZCB0aGUgdGV4dHVyZSBhdCB3aGljaGV2ZXIgc2xvdFxuXHQgKiBpcyBjdXJyZW50bHkgYWN0aXZlLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBiaW5kXG5cdCAqIEBwYXJhbSAge051bWJlcn0gdW5pdCB0aGUgdGV4dHVyZSB1bml0IGluZGV4LCBzdGFydGluZyBhdCAwXG5cdCAqL1xuXHRiaW5kOiBmdW5jdGlvbih1bml0KSB7XG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblx0XHRpZiAodW5pdCB8fCB1bml0ID09PSAwKVxuXHRcdFx0Z2wuYWN0aXZlVGV4dHVyZShnbC5URVhUVVJFMCArIHVuaXQpO1xuXHRcdGdsLmJpbmRUZXh0dXJlKHRoaXMudGFyZ2V0LCB0aGlzLmlkKTtcblx0fSxcblxuXHR0b1N0cmluZzogZnVuY3Rpb24oKSB7XG5cdFx0cmV0dXJuIHRoaXMuaWQgKyBcIjpcIiArIHRoaXMud2lkdGggKyBcInhcIiArIHRoaXMuaGVpZ2h0ICsgXCJcIjtcblx0fVxufSk7XG5cbi8qKiBcbiAqIEEgc2V0IG9mIEZpbHRlciBjb25zdGFudHMgdGhhdCBtYXRjaCB0aGVpciBHTCBjb3VudGVycGFydHMuXG4gKiBUaGlzIGlzIGZvciBjb252ZW5pZW5jZSwgdG8gYXZvaWQgdGhlIG5lZWQgZm9yIGEgR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYFxuICogICAgIFRleHR1cmUuRmlsdGVyLk5FQVJFU1RcbiAqICAgICBUZXh0dXJlLkZpbHRlci5ORUFSRVNUX01JUE1BUF9MSU5FQVJcbiAqICAgICBUZXh0dXJlLkZpbHRlci5ORUFSRVNUX01JUE1BUF9ORUFSRVNUXG4gKiAgICAgVGV4dHVyZS5GaWx0ZXIuTElORUFSXG4gKiAgICAgVGV4dHVyZS5GaWx0ZXIuTElORUFSX01JUE1BUF9MSU5FQVJcbiAqICAgICBUZXh0dXJlLkZpbHRlci5MSU5FQVJfTUlQTUFQX05FQVJFU1RcbiAqIGBgYFxuICogQGF0dHJpYnV0ZSBGaWx0ZXJcbiAqIEBzdGF0aWNcbiAqIEB0eXBlIHtPYmplY3R9XG4gKi9cblRleHR1cmUuRmlsdGVyID0ge1xuXHRORUFSRVNUOiA5NzI4LFxuXHRORUFSRVNUX01JUE1BUF9MSU5FQVI6IDk5ODYsXG5cdE5FQVJFU1RfTUlQTUFQX05FQVJFU1Q6IDk5ODQsXG5cdExJTkVBUjogOTcyOSxcblx0TElORUFSX01JUE1BUF9MSU5FQVI6IDk5ODcsXG5cdExJTkVBUl9NSVBNQVBfTkVBUkVTVDogOTk4NVxufTtcblxuLyoqIFxuICogQSBzZXQgb2YgV3JhcCBjb25zdGFudHMgdGhhdCBtYXRjaCB0aGVpciBHTCBjb3VudGVycGFydHMuXG4gKiBUaGlzIGlzIGZvciBjb252ZW5pZW5jZSwgdG8gYXZvaWQgdGhlIG5lZWQgZm9yIGEgR0wgcmVuZGVyaW5nIGNvbnRleHQuXG4gKlxuICogQGV4YW1wbGVcbiAqIGBgYFxuICogICAgIFRleHR1cmUuV3JhcC5DTEFNUF9UT19FREdFXG4gKiAgICAgVGV4dHVyZS5XcmFwLk1JUlJPUkVEX1JFUEVBVFxuICogICAgIFRleHR1cmUuV3JhcC5SRVBFQVRcbiAqIGBgYFxuICogQGF0dHJpYnV0ZSBXcmFwXG4gKiBAc3RhdGljXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5UZXh0dXJlLldyYXAgPSB7XG5cdENMQU1QX1RPX0VER0U6IDMzMDcxLFxuXHRNSVJST1JFRF9SRVBFQVQ6IDMzNjQ4LFxuXHRSRVBFQVQ6IDEwNDk3XG59O1xuXG4vKiogXG4gKiBBIHNldCBvZiBGb3JtYXQgY29uc3RhbnRzIHRoYXQgbWF0Y2ggdGhlaXIgR0wgY291bnRlcnBhcnRzLlxuICogVGhpcyBpcyBmb3IgY29udmVuaWVuY2UsIHRvIGF2b2lkIHRoZSBuZWVkIGZvciBhIEdMIHJlbmRlcmluZyBjb250ZXh0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqICAgICBUZXh0dXJlLkZvcm1hdC5SR0JcbiAqICAgICBUZXh0dXJlLkZvcm1hdC5SR0JBXG4gKiAgICAgVGV4dHVyZS5Gb3JtYXQuTFVNSU5BTkNFX0FMUEhBXG4gKiBgYGBcbiAqIEBhdHRyaWJ1dGUgRm9ybWF0XG4gKiBAc3RhdGljXG4gKiBAdHlwZSB7T2JqZWN0fVxuICovXG5UZXh0dXJlLkZvcm1hdCA9IHtcblx0REVQVEhfQ09NUE9ORU5UOiA2NDAyLFxuXHRBTFBIQTogNjQwNixcblx0UkdCQTogNjQwOCxcblx0UkdCOiA2NDA3LFxuXHRMVU1JTkFOQ0U6IDY0MDksXG5cdExVTUlOQU5DRV9BTFBIQTogNjQxMFxufTtcblxuLyoqIFxuICogQSBzZXQgb2YgRGF0YVR5cGUgY29uc3RhbnRzIHRoYXQgbWF0Y2ggdGhlaXIgR0wgY291bnRlcnBhcnRzLlxuICogVGhpcyBpcyBmb3IgY29udmVuaWVuY2UsIHRvIGF2b2lkIHRoZSBuZWVkIGZvciBhIEdMIHJlbmRlcmluZyBjb250ZXh0LlxuICpcbiAqIEBleGFtcGxlXG4gKiBgYGBcbiAqICAgICBUZXh0dXJlLkRhdGFUeXBlLlVOU0lHTkVEX0JZVEUgXG4gKiAgICAgVGV4dHVyZS5EYXRhVHlwZS5GTE9BVCBcbiAqIGBgYFxuICogQGF0dHJpYnV0ZSBEYXRhVHlwZVxuICogQHN0YXRpY1xuICogQHR5cGUge09iamVjdH1cbiAqL1xuVGV4dHVyZS5EYXRhVHlwZSA9IHtcblx0QllURTogNTEyMCxcblx0U0hPUlQ6IDUxMjIsXG5cdElOVDogNTEyNCxcblx0RkxPQVQ6IDUxMjYsXG5cdFVOU0lHTkVEX0JZVEU6IDUxMjEsXG5cdFVOU0lHTkVEX0lOVDogNTEyNSxcblx0VU5TSUdORURfU0hPUlQ6IDUxMjMsXG5cdFVOU0lHTkVEX1NIT1JUXzRfNF80XzQ6IDMyODE5LFxuXHRVTlNJR05FRF9TSE9SVF81XzVfNV8xOiAzMjgyMCxcblx0VU5TSUdORURfU0hPUlRfNV82XzU6IDMzNjM1XG59XG5cbi8qKlxuICogVGhlIGRlZmF1bHQgd3JhcCBtb2RlIHdoZW4gY3JlYXRpbmcgbmV3IHRleHR1cmVzLiBJZiBhIGN1c3RvbSBcbiAqIHByb3ZpZGVyIHdhcyBzcGVjaWZpZWQsIGl0IG1heSBjaG9vc2UgdG8gb3ZlcnJpZGUgdGhpcyBkZWZhdWx0IG1vZGUuXG4gKiBcbiAqIEBhdHRyaWJ1dGUge0dMZW51bX0gREVGQVVMVF9XUkFQXG4gKiBAc3RhdGljIFxuICogQGRlZmF1bHQgIFRleHR1cmUuV3JhcC5DTEFNUF9UT19FREdFXG4gKi9cblRleHR1cmUuREVGQVVMVF9XUkFQID0gVGV4dHVyZS5XcmFwLkNMQU1QX1RPX0VER0U7XG5cblxuLyoqXG4gKiBUaGUgZGVmYXVsdCBmaWx0ZXIgbW9kZSB3aGVuIGNyZWF0aW5nIG5ldyB0ZXh0dXJlcy4gSWYgYSBjdXN0b21cbiAqIHByb3ZpZGVyIHdhcyBzcGVjaWZpZWQsIGl0IG1heSBjaG9vc2UgdG8gb3ZlcnJpZGUgdGhpcyBkZWZhdWx0IG1vZGUuXG4gKlxuICogQGF0dHJpYnV0ZSB7R0xlbnVtfSBERUZBVUxUX0ZJTFRFUlxuICogQHN0YXRpY1xuICogQGRlZmF1bHQgIFRleHR1cmUuRmlsdGVyLkxJTkVBUlxuICovXG5UZXh0dXJlLkRFRkFVTFRfRklMVEVSID0gVGV4dHVyZS5GaWx0ZXIuTkVBUkVTVDtcblxuLyoqXG4gKiBCeSBkZWZhdWx0LCB3ZSBkbyBzb21lIGVycm9yIGNoZWNraW5nIHdoZW4gY3JlYXRpbmcgdGV4dHVyZXNcbiAqIHRvIGVuc3VyZSB0aGF0IHRoZXkgd2lsbCBiZSBcInJlbmRlcmFibGVcIiBieSBXZWJHTC4gTm9uLXBvd2VyLW9mLXR3b1xuICogdGV4dHVyZXMgbXVzdCB1c2UgQ0xBTVBfVE9fRURHRSBhcyB0aGVpciB3cmFwIG1vZGUsIGFuZCBORUFSRVNUIG9yIExJTkVBUlxuICogYXMgdGhlaXIgd3JhcCBtb2RlLiBGdXJ0aGVyLCB0cnlpbmcgdG8gZ2VuZXJhdGUgbWlwbWFwcyBmb3IgYSBOUE9UIGltYWdlXG4gKiB3aWxsIGxlYWQgdG8gZXJyb3JzLiBcbiAqXG4gKiBIb3dldmVyLCB5b3UgY2FuIGRpc2FibGUgdGhpcyBlcnJvciBjaGVja2luZyBieSBzZXR0aW5nIGBGT1JDRV9QT1RgIHRvIHRydWUuXG4gKiBUaGlzIG1heSBiZSB1c2VmdWwgaWYgeW91IGFyZSBydW5uaW5nIG9uIHNwZWNpZmljIGhhcmR3YXJlIHRoYXQgc3VwcG9ydHMgUE9UIFxuICogdGV4dHVyZXMsIG9yIGluIHNvbWUgZnV0dXJlIGNhc2Ugd2hlcmUgTlBPVCB0ZXh0dXJlcyBpcyBhZGRlZCBhcyBhIFdlYkdMIGV4dGVuc2lvbi5cbiAqIFxuICogQGF0dHJpYnV0ZSB7Qm9vbGVhbn0gRk9SQ0VfUE9UXG4gKiBAc3RhdGljXG4gKiBAZGVmYXVsdCAgZmFsc2VcbiAqL1xuVGV4dHVyZS5GT1JDRV9QT1QgPSBmYWxzZTtcblxuLy9kZWZhdWx0IHBpeGVsIHN0b3JlIG9wZXJhdGlvbnMuIFVzZWQgaW4gY3JlYXRlKClcblRleHR1cmUuVU5QQUNLX0ZMSVBfWSA9IGZhbHNlO1xuVGV4dHVyZS5VTlBBQ0tfQUxJR05NRU5UID0gMTtcblRleHR1cmUuVU5QQUNLX1BSRU1VTFRJUExZX0FMUEhBID0gdHJ1ZTsgXG5UZXh0dXJlLlVOUEFDS19DT0xPUlNQQUNFX0NPTlZFUlNJT04gPSB1bmRlZmluZWQ7XG5cbi8vZm9yIHRoZSBJbWFnZSBjb25zdHJ1Y3RvciB3ZSBuZWVkIHRvIGhhbmRsZSB0aGluZ3MgYSBiaXQgZGlmZmVyZW50bHkuLlxuVGV4dHVyZS5VU0VfRFVNTVlfMXgxX0RBVEEgPSB0cnVlO1xuXG4vKipcbiAqIFV0aWxpdHkgdG8gZ2V0IHRoZSBudW1iZXIgb2YgY29tcG9uZW50cyBmb3IgdGhlIGdpdmVuIEdMZW51bSwgZS5nLiBnbC5SR0JBIHJldHVybnMgNC5cbiAqIFJldHVybnMgbnVsbCBpZiB0aGUgc3BlY2lmaWVkIGZvcm1hdCBpcyBub3Qgb2YgdHlwZSBERVBUSF9DT01QT05FTlQsIEFMUEhBLCBMVU1JTkFOQ0UsXG4gKiBMVU1JTkFOQ0VfQUxQSEEsIFJHQiwgb3IgUkdCQS5cbiAqIFxuICogQG1ldGhvZCBnZXROdW1Db21wb25lbnRzXG4gKiBAc3RhdGljXG4gKiBAcGFyYW0gIHtHTGVudW19IGZvcm1hdCBhIHRleHR1cmUgZm9ybWF0LCBpLmUuIFRleHR1cmUuRm9ybWF0LlJHQkFcbiAqIEByZXR1cm4ge051bWJlcn0gdGhlIG51bWJlciBvZiBjb21wb25lbnRzIGZvciB0aGlzIGZvcm1hdFxuICovXG5UZXh0dXJlLmdldE51bUNvbXBvbmVudHMgPSBmdW5jdGlvbihmb3JtYXQpIHtcblx0c3dpdGNoIChmb3JtYXQpIHtcblx0XHRjYXNlIFRleHR1cmUuRm9ybWF0LkRFUFRIX0NPTVBPTkVOVDpcblx0XHRjYXNlIFRleHR1cmUuRm9ybWF0LkFMUEhBOlxuXHRcdGNhc2UgVGV4dHVyZS5Gb3JtYXQuTFVNSU5BTkNFOlxuXHRcdFx0cmV0dXJuIDE7XG5cdFx0Y2FzZSBUZXh0dXJlLkZvcm1hdC5MVU1JTkFOQ0VfQUxQSEE6XG5cdFx0XHRyZXR1cm4gMjtcblx0XHRjYXNlIFRleHR1cmUuRm9ybWF0LlJHQjpcblx0XHRcdHJldHVybiAzO1xuXHRcdGNhc2UgVGV4dHVyZS5Gb3JtYXQuUkdCQTpcblx0XHRcdHJldHVybiA0O1xuXHR9XG5cdHJldHVybiBudWxsO1xufTtcblxuLy9Vbm1hbmFnZWQgdGV4dHVyZXM6XG4vL1x0SFRNTCBlbGVtZW50cyBsaWtlIEltYWdlLCBWaWRlbywgQ2FudmFzXG4vL1x0cGl4ZWxzIGJ1ZmZlciBmcm9tIENhbnZhc1xuLy9cdHBpeGVscyBhcnJheVxuXG4vL05lZWQgc3BlY2lhbCBoYW5kbGluZzpcbi8vICBjb250ZXh0Lm9uQ29udGV4dExvc3QuYWRkKGZ1bmN0aW9uKCkge1xuLy8gIFx0Y3JlYXRlRHluYW1pY1RleHR1cmUoKTtcbi8vICB9LmJpbmQodGhpcykpO1xuXG4vL01hbmFnZWQgdGV4dHVyZXM6XG4vL1x0aW1hZ2VzIHNwZWNpZmllZCB3aXRoIGEgcGF0aFxuLy9cdHRoaXMgd2lsbCB1c2UgSW1hZ2UgdW5kZXIgdGhlIGhvb2RcblxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmU7IiwidmFyIENsYXNzID0gcmVxdWlyZSgna2xhc3NlJyk7XG52YXIgVGV4dHVyZSA9IHJlcXVpcmUoJy4vVGV4dHVyZScpO1xuXG4vL1RoaXMgaXMgYSBHTC1zcGVjaWZpYyB0ZXh0dXJlIHJlZ2lvbiwgZW1wbG95aW5nIHRhbmdlbnQgc3BhY2Ugbm9ybWFsaXplZCBjb29yZGluYXRlcyBVIGFuZCBWLlxuLy9BIGNhbnZhcy1zcGVjaWZpYyByZWdpb24gd291bGQgcmVhbGx5IGp1c3QgYmUgYSBsaWdodHdlaWdodCBvYmplY3Qgd2l0aCB7IHgsIHksIHdpZHRoLCBoZWlnaHQgfVxuLy9pbiBwaXhlbHMuXG52YXIgVGV4dHVyZVJlZ2lvbiA9IG5ldyBDbGFzcyh7XG5cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gVGV4dHVyZVJlZ2lvbih0ZXh0dXJlLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0dGhpcy50ZXh0dXJlID0gdGV4dHVyZTtcblx0XHR0aGlzLnNldFJlZ2lvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KTtcblx0fSxcblxuXHRzZXRVVnM6IGZ1bmN0aW9uKHUsIHYsIHUyLCB2Mikge1xuXHRcdHRoaXMucmVnaW9uV2lkdGggPSBNYXRoLnJvdW5kKE1hdGguYWJzKHUyIC0gdSkgKiB0aGlzLnRleHR1cmUud2lkdGgpO1xuICAgICAgICB0aGlzLnJlZ2lvbkhlaWdodCA9IE1hdGgucm91bmQoTWF0aC5hYnModjIgLSB2KSAqIHRoaXMudGV4dHVyZS5oZWlnaHQpO1xuXG4gICAgICAgIC8vIEZyb20gTGliR0RYIFRleHR1cmVSZWdpb24uamF2YSAtLSBcblx0XHQvLyBGb3IgYSAxeDEgcmVnaW9uLCBhZGp1c3QgVVZzIHRvd2FyZCBwaXhlbCBjZW50ZXIgdG8gYXZvaWQgZmlsdGVyaW5nIGFydGlmYWN0cyBvbiBBTUQgR1BVcyB3aGVuIGRyYXdpbmcgdmVyeSBzdHJldGNoZWQuXG5cdFx0aWYgKHRoaXMucmVnaW9uV2lkdGggPT0gMSAmJiB0aGlzLnJlZ2lvbkhlaWdodCA9PSAxKSB7XG5cdFx0XHR2YXIgYWRqdXN0WCA9IDAuMjUgLyB0aGlzLnRleHR1cmUud2lkdGg7XG5cdFx0XHR1ICs9IGFkanVzdFg7XG5cdFx0XHR1MiAtPSBhZGp1c3RYO1xuXHRcdFx0dmFyIGFkanVzdFkgPSAwLjI1IC8gdGhpcy50ZXh0dXJlLmhlaWdodDtcblx0XHRcdHYgKz0gYWRqdXN0WTtcblx0XHRcdHYyIC09IGFkanVzdFk7XG5cdFx0fVxuXG5cdFx0dGhpcy51ID0gdTtcblx0XHR0aGlzLnYgPSB2O1xuXHRcdHRoaXMudTIgPSB1Mjtcblx0XHR0aGlzLnYyID0gdjI7XG5cdH0sXG5cblx0c2V0UmVnaW9uOiBmdW5jdGlvbih4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0eCA9IHggfHwgMDtcblx0XHR5ID0geSB8fCAwO1xuXHRcdHdpZHRoID0gKHdpZHRoPT09MCB8fCB3aWR0aCkgPyB3aWR0aCA6IHRoaXMudGV4dHVyZS53aWR0aDtcblx0XHRoZWlnaHQgPSAoaGVpZ2h0PT09MCB8fCBoZWlnaHQpID8gaGVpZ2h0IDogdGhpcy50ZXh0dXJlLmhlaWdodDtcblxuXHRcdHZhciBpbnZUZXhXaWR0aCA9IDEgLyB0aGlzLnRleHR1cmUud2lkdGg7XG5cdFx0dmFyIGludlRleEhlaWdodCA9IDEgLyB0aGlzLnRleHR1cmUuaGVpZ2h0O1xuXHRcdHRoaXMuc2V0VVZzKHggKiBpbnZUZXhXaWR0aCwgeSAqIGludlRleEhlaWdodCwgKHggKyB3aWR0aCkgKiBpbnZUZXhXaWR0aCwgKHkgKyBoZWlnaHQpICogaW52VGV4SGVpZ2h0KTtcblx0XHR0aGlzLnJlZ2lvbldpZHRoID0gTWF0aC5hYnMod2lkdGgpO1xuXHRcdHRoaXMucmVnaW9uSGVpZ2h0ID0gTWF0aC5hYnMoaGVpZ2h0KTtcblx0fSxcblxuXHQvKiogU2V0cyB0aGUgdGV4dHVyZSB0byB0aGF0IG9mIHRoZSBzcGVjaWZpZWQgcmVnaW9uIGFuZCBzZXRzIHRoZSBjb29yZGluYXRlcyByZWxhdGl2ZSB0byB0aGUgc3BlY2lmaWVkIHJlZ2lvbi4gKi9cblx0c2V0RnJvbVJlZ2lvbjogZnVuY3Rpb24ocmVnaW9uLCB4LCB5LCB3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0dGhpcy50ZXh0dXJlID0gcmVnaW9uLnRleHR1cmU7XG5cdFx0dGhpcy5zZXQocmVnaW9uLmdldFJlZ2lvblgoKSArIHgsIHJlZ2lvbi5nZXRSZWdpb25ZKCkgKyB5LCB3aWR0aCwgaGVpZ2h0KTtcblx0fSxcblxuXG5cdC8vVE9ETzogYWRkIHNldHRlcnMgZm9yIHJlZ2lvblgvWSBhbmQgcmVnaW9uV2lkdGgvSGVpZ2h0XG5cblx0cmVnaW9uWDoge1xuXHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCh0aGlzLnUgKiB0aGlzLnRleHR1cmUud2lkdGgpO1xuXHRcdH0gXG5cdH0sXG5cblx0cmVnaW9uWToge1xuXHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gTWF0aC5yb3VuZCh0aGlzLnYgKiB0aGlzLnRleHR1cmUuaGVpZ2h0KTtcblx0XHR9XG5cdH0sXG5cblx0ZmxpcDogZnVuY3Rpb24oeCwgeSkge1xuXHRcdHZhciB0ZW1wO1xuXHRcdGlmICh4KSB7XG5cdFx0XHR0ZW1wID0gdGhpcy51O1xuXHRcdFx0dGhpcy51ID0gdGhpcy51Mjtcblx0XHRcdHRoaXMudTIgPSB0ZW1wO1xuXHRcdH1cblx0XHRpZiAoeSkge1xuXHRcdFx0dGVtcCA9IHRoaXMudjtcblx0XHRcdHRoaXMudiA9IHRoaXMudjI7XG5cdFx0XHR0aGlzLnYyID0gdGVtcDtcblx0XHR9XG5cdH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVSZWdpb247IiwiLyoqXG4gKiBAbW9kdWxlIGthbWlcbiAqL1xuXG52YXIgQ2xhc3MgPSByZXF1aXJlKCdrbGFzc2UnKTtcbnZhciBTaWduYWwgPSByZXF1aXJlKCdzaWduYWxzJyk7XG5cbi8qKlxuICogQSB0aGluIHdyYXBwZXIgYXJvdW5kIFdlYkdMUmVuZGVyaW5nQ29udGV4dCB3aGljaCBoYW5kbGVzXG4gKiBjb250ZXh0IGxvc3MgYW5kIHJlc3RvcmUgd2l0aCB2YXJpb3VzIHJlbmRlcmluZyBvYmplY3RzICh0ZXh0dXJlcyxcbiAqIHNoYWRlcnMgYW5kIGJ1ZmZlcnMpLiBUaGlzIGFsc28gaGFuZGxlcyBnZW5lcmFsIHZpZXdwb3J0IG1hbmFnZW1lbnQuXG4gKlxuICogSWYgdGhlIHZpZXcgaXMgbm90IHNwZWNpZmllZCwgYSBjYW52YXMgd2lsbCBiZSBjcmVhdGVkLlxuICogXG4gKiBAY2xhc3MgIFdlYkdMQ29udGV4dFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge051bWJlcn0gd2lkdGggdGhlIHdpZHRoIG9mIHRoZSBHTCBjYW52YXNcbiAqIEBwYXJhbSB7TnVtYmVyfSBoZWlnaHQgdGhlIGhlaWdodCBvZiB0aGUgR0wgY2FudmFzXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSB2aWV3IHRoZSBvcHRpb25hbCBET00gY2FudmFzIGVsZW1lbnRcbiAqIEBwYXJhbSB7T2JqZWN0fSBjb250ZXh0QXR0cmlidWV0cyBhbiBvYmplY3QgY29udGFpbmluZyBjb250ZXh0IGF0dHJpYnMgd2hpY2hcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWxsIGJlIHVzZWQgZHVyaW5nIEdMIGluaXRpYWxpemF0aW9uXG4gKi9cbnZhciBXZWJHTENvbnRleHQgPSBuZXcgQ2xhc3Moe1xuXHRcblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gV2ViR0xDb250ZXh0KHdpZHRoLCBoZWlnaHQsIHZpZXcsIGNvbnRleHRBdHRyaWJ1dGVzKSB7XG5cdFx0LyoqXG5cdFx0ICogVGhlIGxpc3Qgb2YgcmVuZGVyaW5nIG9iamVjdHMgKHNoYWRlcnMsIFZCT3MsIHRleHR1cmVzLCBldGMpIHdoaWNoIGFyZSBcblx0XHQgKiBjdXJyZW50bHkgYmVpbmcgbWFuYWdlZC4gQW55IG9iamVjdCB3aXRoIGEgXCJjcmVhdGVcIiBtZXRob2QgY2FuIGJlIGFkZGVkXG5cdFx0ICogdG8gdGhpcyBsaXN0LiBVcG9uIGRlc3Ryb3lpbmcgdGhlIHJlbmRlcmluZyBvYmplY3QsIGl0IHNob3VsZCBiZSByZW1vdmVkLlxuXHRcdCAqIFNlZSBhZGRNYW5hZ2VkT2JqZWN0IGFuZCByZW1vdmVNYW5hZ2VkT2JqZWN0LlxuXHRcdCAqIFxuXHRcdCAqIEBwcm9wZXJ0eSB7QXJyYXl9IG1hbmFnZWRPYmplY3RzXG5cdFx0ICovXG5cdFx0dGhpcy5tYW5hZ2VkT2JqZWN0cyA9IFtdO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGFjdHVhbCBHTCBjb250ZXh0LiBZb3UgY2FuIHVzZSB0aGlzIGZvclxuXHRcdCAqIHJhdyBHTCBjYWxscyBvciB0byBhY2Nlc3MgR0xlbnVtIGNvbnN0YW50cy4gVGhpc1xuXHRcdCAqIHdpbGwgYmUgdXBkYXRlZCBvbiBjb250ZXh0IHJlc3RvcmUuIFdoaWxlIHRoZSBXZWJHTENvbnRleHRcblx0XHQgKiBpcyBub3QgYHZhbGlkYCwgeW91IHNob3VsZCBub3QgdHJ5IHRvIGFjY2VzcyBHTCBzdGF0ZS5cblx0XHQgKiBcblx0XHQgKiBAcHJvcGVydHkgZ2xcblx0XHQgKiBAdHlwZSB7V2ViR0xSZW5kZXJpbmdDb250ZXh0fVxuXHRcdCAqL1xuXHRcdHRoaXMuZ2wgPSBudWxsO1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIGNhbnZhcyBET00gZWxlbWVudCBmb3IgdGhpcyBjb250ZXh0LlxuXHRcdCAqIEBwcm9wZXJ0eSB7TnVtYmVyfSB2aWV3XG5cdFx0ICovXG5cdFx0dGhpcy52aWV3ID0gdmlldyB8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiY2FudmFzXCIpO1xuXG5cdFx0Ly9kZWZhdWx0IHNpemUgYXMgcGVyIHNwZWM6XG5cdFx0Ly9odHRwOi8vd3d3LnczLm9yZy9UUi8yMDEyL1dELWh0bWw1LWF1dGhvci0yMDEyMDMyOS90aGUtY2FudmFzLWVsZW1lbnQuaHRtbCN0aGUtY2FudmFzLWVsZW1lbnRcblx0XHRcblx0XHQvKipcblx0XHQgKiBUaGUgd2lkdGggb2YgdGhpcyBjYW52YXMuXG5cdFx0ICpcblx0XHQgKiBAcHJvcGVydHkgd2lkdGhcblx0XHQgKiBAdHlwZSB7TnVtYmVyfVxuXHRcdCAqL1xuXHRcdHRoaXMud2lkdGggPSB0aGlzLnZpZXcud2lkdGggPSB3aWR0aCB8fCAzMDA7XG5cblx0XHQvKipcblx0XHQgKiBUaGUgaGVpZ2h0IG9mIHRoaXMgY2FudmFzLlxuXHRcdCAqIEBwcm9wZXJ0eSBoZWlnaHRcblx0XHQgKiBAdHlwZSB7TnVtYmVyfVxuXHRcdCAqL1xuXHRcdHRoaXMuaGVpZ2h0ID0gdGhpcy52aWV3LmhlaWdodCA9IGhlaWdodCB8fCAxNTA7XG5cblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBjb250ZXh0IGF0dHJpYnV0ZXMgZm9yIGluaXRpYWxpemluZyB0aGUgR0wgc3RhdGUuIFRoaXMgbWlnaHQgaW5jbHVkZVxuXHRcdCAqIGFudGktYWxpYXNpbmcsIGFscGhhIHNldHRpbmdzLCB2ZXJpc29uLCBhbmQgc28gZm9ydGguXG5cdFx0ICogXG5cdFx0ICogQHByb3BlcnR5IHtPYmplY3R9IGNvbnRleHRBdHRyaWJ1dGVzIFxuXHRcdCAqL1xuXHRcdHRoaXMuY29udGV4dEF0dHJpYnV0ZXMgPSBjb250ZXh0QXR0cmlidXRlcztcblx0XHRcblx0XHQvKipcblx0XHQgKiBXaGV0aGVyIHRoaXMgY29udGV4dCBpcyAndmFsaWQnLCBpLmUuIHJlbmRlcmFibGUuIEEgY29udGV4dCB0aGF0IGhhcyBiZWVuIGxvc3Rcblx0XHQgKiAoYW5kIG5vdCB5ZXQgcmVzdG9yZWQpIG9yIGRlc3Ryb3llZCBpcyBpbnZhbGlkLlxuXHRcdCAqIFxuXHRcdCAqIEBwcm9wZXJ0eSB7Qm9vbGVhbn0gdmFsaWRcblx0XHQgKi9cblx0XHR0aGlzLnZhbGlkID0gZmFsc2U7XG5cblx0XHQvKipcblx0XHQgKiBBIHNpZ25hbCBkaXNwYXRjaGVkIHdoZW4gR0wgY29udGV4dCBpcyBsb3N0LiBcblx0XHQgKiBcblx0XHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lciBpcyB0aGUgV2ViR0xDb250ZXh0XG5cdFx0ICogbWFuYWdpbmcgdGhlIGNvbnRleHQgbG9zcy5cblx0XHQgKiBcblx0XHQgKiBAZXZlbnQge1NpZ25hbH0gbG9zdFxuXHRcdCAqL1xuXHRcdHRoaXMubG9zdCA9IG5ldyBTaWduYWwoKTtcblxuXHRcdC8qKlxuXHRcdCAqIEEgc2lnbmFsIGRpc3BhdGNoZWQgd2hlbiBHTCBjb250ZXh0IGlzIHJlc3RvcmVkLCBhZnRlciBhbGwgdGhlIG1hbmFnZWRcblx0XHQgKiBvYmplY3RzIGhhdmUgYmVlbiByZWNyZWF0ZWQuXG5cdFx0ICpcblx0XHQgKiBUaGUgZmlyc3QgYXJndW1lbnQgcGFzc2VkIHRvIHRoZSBsaXN0ZW5lciBpcyB0aGUgV2ViR0xDb250ZXh0XG5cdFx0ICogd2hpY2ggbWFuYWdlZCB0aGUgcmVzdG9yYXRpb24uXG5cdFx0ICpcblx0XHQgKiBUaGlzIGRvZXMgbm90IGdhdXJlbnRlZSB0aGF0IGFsbCBvYmplY3RzIHdpbGwgYmUgcmVuZGVyYWJsZS5cblx0XHQgKiBGb3IgZXhhbXBsZSwgYSBUZXh0dXJlIHdpdGggYW4gSW1hZ2VQcm92aWRlciBtYXkgc3RpbGwgYmUgbG9hZGluZ1xuXHRcdCAqIGFzeW5jaHJvbm91c2x5Llx0IFxuXHRcdCAqIFxuXHRcdCAqIEBldmVudCB7U2lnbmFsfSByZXN0b3JlZFxuXHRcdCAqL1xuXHRcdHRoaXMucmVzdG9yZWQgPSBuZXcgU2lnbmFsKCk7XHRcblx0XHRcblx0XHQvL3NldHVwIGNvbnRleHQgbG9zdCBhbmQgcmVzdG9yZSBsaXN0ZW5lcnNcblx0XHR0aGlzLnZpZXcuYWRkRXZlbnRMaXN0ZW5lcihcIndlYmdsY29udGV4dGxvc3RcIiwgZnVuY3Rpb24gKGV2KSB7XG5cdFx0XHRldi5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0dGhpcy5fY29udGV4dExvc3QoZXYpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0dGhpcy52aWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJ3ZWJnbGNvbnRleHRyZXN0b3JlZFwiLCBmdW5jdGlvbiAoZXYpIHtcblx0XHRcdGV2LnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR0aGlzLl9jb250ZXh0UmVzdG9yZWQoZXYpO1xuXHRcdH0uYmluZCh0aGlzKSk7XG5cdFx0XHRcblx0XHR0aGlzLl9pbml0Q29udGV4dCgpO1xuXG5cdFx0dGhpcy5yZXNpemUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHR9LFxuXHRcblx0X2luaXRDb250ZXh0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZXJyID0gXCJcIjtcblx0XHR0aGlzLnZhbGlkID0gZmFsc2U7XG5cblx0XHR0cnkge1xuXHRcdFx0dGhpcy5nbCA9ICh0aGlzLnZpZXcuZ2V0Q29udGV4dCgnd2ViZ2wnLCB0aGlzLmNvbnRleHRBdHRyaWJ1dGVzKSBcblx0XHRcdFx0XHRcdHx8IHRoaXMudmlldy5nZXRDb250ZXh0KCdleHBlcmltZW50YWwtd2ViZ2wnLCB0aGlzLmNvbnRleHRBdHRyaWJ1dGVzKSk7XG5cdFx0fSBjYXRjaCAoZSkge1xuXHRcdFx0dGhpcy5nbCA9IG51bGw7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMuZ2wpIHtcblx0XHRcdHRoaXMudmFsaWQgPSB0cnVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aHJvdyBcIldlYkdMIENvbnRleHQgTm90IFN1cHBvcnRlZCAtLSB0cnkgZW5hYmxpbmcgaXQgb3IgdXNpbmcgYSBkaWZmZXJlbnQgYnJvd3NlclwiO1xuXHRcdH1cdFxuXHR9LFxuXG5cdC8qKlxuXHQgKiBVcGRhdGVzIHRoZSB3aWR0aCBhbmQgaGVpZ2h0IG9mIHRoaXMgV2ViR0wgY29udGV4dCwgcmVzaXplc1xuXHQgKiB0aGUgY2FudmFzIHZpZXcsIGFuZCBjYWxscyBnbC52aWV3cG9ydCgpIHdpdGggdGhlIG5ldyBzaXplLlxuXHQgKiBcblx0ICogQHBhcmFtICB7TnVtYmVyfSB3aWR0aCAgdGhlIG5ldyB3aWR0aFxuXHQgKiBAcGFyYW0gIHtOdW1iZXJ9IGhlaWdodCB0aGUgbmV3IGhlaWdodFxuXHQgKi9cblx0cmVzaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XG5cdFx0dGhpcy53aWR0aCA9IHdpZHRoO1xuXHRcdHRoaXMuaGVpZ2h0ID0gaGVpZ2h0O1xuXG5cdFx0dGhpcy52aWV3LndpZHRoID0gd2lkdGg7XG5cdFx0dGhpcy52aWV3LmhlaWdodCA9IGhlaWdodDtcblxuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cdFx0Z2wudmlld3BvcnQoMCwgMCwgdGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiAoaW50ZXJuYWwgdXNlKVxuXHQgKiBBIG1hbmFnZWQgb2JqZWN0IGlzIGFueXRoaW5nIHdpdGggYSBcImNyZWF0ZVwiIGZ1bmN0aW9uLCB0aGF0IHdpbGxcblx0ICogcmVzdG9yZSBHTCBzdGF0ZSBhZnRlciBjb250ZXh0IGxvc3MuIFxuXHQgKiBcblx0ICogQHBhcmFtIHtbdHlwZV19IHRleCBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRhZGRNYW5hZ2VkT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcblx0XHR0aGlzLm1hbmFnZWRPYmplY3RzLnB1c2gob2JqKTtcblx0fSxcblxuXHQvKipcblx0ICogKGludGVybmFsIHVzZSlcblx0ICogUmVtb3ZlcyBhIG1hbmFnZWQgb2JqZWN0IGZyb20gdGhlIGNhY2hlLiBUaGlzIGlzIHVzZWZ1bCB0byBkZXN0cm95XG5cdCAqIGEgdGV4dHVyZSBvciBzaGFkZXIsIGFuZCBoYXZlIGl0IG5vIGxvbmdlciByZS1sb2FkIG9uIGNvbnRleHQgcmVzdG9yZS5cblx0ICpcblx0ICogUmV0dXJucyB0aGUgb2JqZWN0IHRoYXQgd2FzIHJlbW92ZWQsIG9yIG51bGwgaWYgaXQgd2FzIG5vdCBmb3VuZCBpbiB0aGUgY2FjaGUuXG5cdCAqIFxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IG9iaiB0aGUgb2JqZWN0IHRvIGJlIG1hbmFnZWRcblx0ICogQHJldHVybiB7T2JqZWN0fSAgICAgdGhlIHJlbW92ZWQgb2JqZWN0LCBvciBudWxsXG5cdCAqL1xuXHRyZW1vdmVNYW5hZ2VkT2JqZWN0OiBmdW5jdGlvbihvYmopIHtcblx0XHR2YXIgaWR4ID0gdGhpcy5tYW5hZ2VkT2JqZWN0cy5pbmRleE9mKG9iaik7XG5cdFx0aWYgKGlkeCA+IC0xKSB7XG5cdFx0XHR0aGlzLm1hbmFnZWRPYmplY3RzLnNwbGljZShpZHgsIDEpO1xuXHRcdFx0cmV0dXJuIG9iajtcblx0XHR9IFxuXHRcdHJldHVybiBudWxsO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBDYWxscyBkZXN0cm95KCkgb24gZWFjaCBtYW5hZ2VkIG9iamVjdCwgdGhlbiByZW1vdmVzIHJlZmVyZW5jZXMgdG8gdGhlc2Ugb2JqZWN0c1xuXHQgKiBhbmQgdGhlIEdMIHJlbmRlcmluZyBjb250ZXh0LiBUaGlzIGFsc28gcmVtb3ZlcyByZWZlcmVuY2VzIHRvIHRoZSB2aWV3IGFuZCBzZXRzXG5cdCAqIHRoZSBjb250ZXh0J3Mgd2lkdGggYW5kIGhlaWdodCB0byB6ZXJvLlxuXHQgKlxuXHQgKiBBdHRlbXB0aW5nIHRvIHVzZSB0aGlzIFdlYkdMQ29udGV4dCBvciB0aGUgR0wgcmVuZGVyaW5nIGNvbnRleHQgYWZ0ZXIgZGVzdHJveWluZyBpdFxuXHQgKiB3aWxsIGxlYWQgdG8gdW5kZWZpbmVkIGJlaGF2aW91ci5cblx0ICovXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLm1hbmFnZWRPYmplY3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgb2JqID0gdGhpcy5tYW5hZ2VkT2JqZWN0c1tpXTtcblx0XHRcdGlmIChvYmogJiYgdHlwZW9mIG9iai5kZXN0cm95KVxuXHRcdFx0XHRvYmouZGVzdHJveSgpO1xuXHRcdH1cblx0XHR0aGlzLm1hbmFnZWRPYmplY3RzLmxlbmd0aCA9IDA7XG5cdFx0dGhpcy52YWxpZCA9IGZhbHNlO1xuXHRcdHRoaXMuZ2wgPSBudWxsO1xuXHRcdHRoaXMudmlldyA9IG51bGw7XG5cdFx0dGhpcy53aWR0aCA9IHRoaXMuaGVpZ2h0ID0gMDtcblx0fSxcblxuXHRfY29udGV4dExvc3Q6IGZ1bmN0aW9uKGV2KSB7XG5cdFx0Ly9hbGwgdGV4dHVyZXMvc2hhZGVycy9idWZmZXJzL0ZCT3MgaGF2ZSBiZWVuIGRlbGV0ZWQuLi4gXG5cdFx0Ly93ZSBuZWVkIHRvIHJlLWNyZWF0ZSB0aGVtIG9uIHJlc3RvcmVcblx0XHR0aGlzLnZhbGlkID0gZmFsc2U7XG5cblx0XHR0aGlzLmxvc3QuZGlzcGF0Y2godGhpcyk7XG5cdH0sXG5cblx0X2NvbnRleHRSZXN0b3JlZDogZnVuY3Rpb24oZXYpIHtcblx0XHQvL2ZpcnN0LCBpbml0aWFsaXplIHRoZSBHTCBjb250ZXh0IGFnYWluXG5cdFx0dGhpcy5faW5pdENvbnRleHQoKTtcblxuXHRcdC8vbm93IHdlIHJlY3JlYXRlIG91ciBzaGFkZXJzIGFuZCB0ZXh0dXJlc1xuXHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLm1hbmFnZWRPYmplY3RzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLm1hbmFnZWRPYmplY3RzW2ldLmNyZWF0ZSgpO1xuXHRcdH1cblxuXHRcdC8vdXBkYXRlIEdMIHZpZXdwb3J0XG5cdFx0dGhpcy5yZXNpemUodGhpcy53aWR0aCwgdGhpcy5oZWlnaHQpO1xuXG5cdFx0dGhpcy5yZXN0b3JlZC5kaXNwYXRjaCh0aGlzKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViR0xDb250ZXh0OyIsInZhciBDbGFzcyA9IHJlcXVpcmUoJ2tsYXNzZScpO1xudmFyIFRleHR1cmUgPSByZXF1aXJlKCcuLi9UZXh0dXJlJyk7XG5cblxudmFyIEZyYW1lQnVmZmVyID0gbmV3IENsYXNzKHtcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIG5ldyBGcmFtZSBCdWZmZXIgT2JqZWN0IHdpdGggdGhlIGdpdmVuIHdpZHRoIGFuZCBoZWlnaHQuXG5cdCAqXG5cdCAqIElmIHdpZHRoIGFuZCBoZWlnaHQgYXJlIG5vbi1udW1iZXJzLCB0aGlzIG1ldGhvZCBleHBlY3RzIHRoZVxuXHQgKiBmaXJzdCBwYXJhbWV0ZXIgdG8gYmUgYSBUZXh0dXJlIG9iamVjdCB3aGljaCBzaG91bGQgYmUgYWN0ZWQgdXBvbi4gXG5cdCAqIEluIHRoaXMgY2FzZSwgdGhlIEZyYW1lQnVmZmVyIGRvZXMgbm90IFwib3duXCIgdGhlIHRleHR1cmUsIGFuZCBzbyBpdFxuXHQgKiB3b24ndCBkaXNwb3NlIG9mIGl0IHVwb24gZGVzdHJ1Y3Rpb24uIFRoaXMgaXMgYW4gYWR2YW5jZWQgdmVyc2lvbiBvZiB0aGVcblx0ICogY29uc3RydWN0b3IgdGhhdCBhc3N1bWVzIHRoZSB1c2VyIGlzIGdpdmluZyB1cyBhIHZhbGlkIFRleHR1cmUgdGhhdCBjYW4gYmUgYm91bmQgKGkuZS5cblx0ICogbm8gYXN5bmMgSW1hZ2UgdGV4dHVyZXMpLlxuXHQgKlxuXHQgKiBAY2xhc3MgIEZyYW1lQnVmZmVyXG5cdCAqIEBjb25zdHJ1Y3RvclxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IHdpZHRoICBbZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gaGVpZ2h0IFtkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7W3R5cGVdfSBmaWx0ZXIgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXHRpbml0aWFsaXplOiBmdW5jdGlvbiBGcmFtZUJ1ZmZlcihjb250ZXh0LCB3aWR0aCwgaGVpZ2h0LCBmb3JtYXQpIHsgLy9UT0RPOiBkZXB0aCBjb21wb25lbnRcblx0XHRpZiAodHlwZW9mIGNvbnRleHQgIT09IFwib2JqZWN0XCIpXG5cdFx0XHR0aHJvdyBcIkdMIGNvbnRleHQgbm90IHNwZWNpZmllZCB0byBGcmFtZUJ1ZmZlclwiO1xuXHRcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSB1bmRlcmx5aW5nIElEIG9mIHRoZSBHTCBmcmFtZSBidWZmZXIgb2JqZWN0LlxuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtXZWJHTEZyYW1lYnVmZmVyfSBpZFxuXHRcdCAqL1x0XHRcblx0XHR0aGlzLmlkID0gbnVsbDtcblxuXHRcdC8qKlxuXHRcdCAqIFRoZSBXZWJHTENvbnRleHQgYmFja2VkIGJ5IHRoaXMgZnJhbWUgYnVmZmVyLlxuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtXZWJHTENvbnRleHR9IGNvbnRleHRcblx0XHQgKi9cblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXG5cdFx0LyoqXG5cdFx0ICogVGhlIFRleHR1cmUgYmFja2VkIGJ5IHRoaXMgZnJhbWUgYnVmZmVyLlxuXHRcdCAqXG5cdFx0ICogQHByb3BlcnR5IHtUZXh0dXJlfSBUZXh0dXJlXG5cdFx0ICovXG5cdFx0Ly90aGlzIFRleHR1cmUgaXMgbm93IG1hbmFnZWQuXG5cdFx0dGhpcy50ZXh0dXJlID0gbmV3IFRleHR1cmUoY29udGV4dCwgd2lkdGgsIGhlaWdodCwgZm9ybWF0KTtcblxuXHRcdC8vVGhpcyBpcyBtYWFuZ2VkIGJ5IFdlYkdMQ29udGV4dFxuXHRcdHRoaXMuY29udGV4dC5hZGRNYW5hZ2VkT2JqZWN0KHRoaXMpO1xuXHRcdHRoaXMuY3JlYXRlKCk7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgcmVhZC1vbmx5IHByb3BlcnR5IHdoaWNoIHJldHVybnMgdGhlIHdpZHRoIG9mIHRoZSBiYWNraW5nIHRleHR1cmUuIFxuXHQgKiBcblx0ICogQHJlYWRPbmx5XG5cdCAqIEBwcm9wZXJ0eSB3aWR0aFxuXHQgKiBAdHlwZSB7TnVtYmVyfVxuXHQgKi9cblx0d2lkdGg6IHtcblx0XHRnZXQ6IGZ1bmN0aW9uKCkge1xuXHRcdFx0cmV0dXJuIHRoaXMudGV4dHVyZS53aWR0aFxuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQSByZWFkLW9ubHkgcHJvcGVydHkgd2hpY2ggcmV0dXJucyB0aGUgaGVpZ2h0IG9mIHRoZSBiYWNraW5nIHRleHR1cmUuIFxuXHQgKiBcblx0ICogQHJlYWRPbmx5XG5cdCAqIEBwcm9wZXJ0eSBoZWlnaHRcblx0ICogQHR5cGUge051bWJlcn1cblx0ICovXG5cdGhlaWdodDoge1xuXHRcdGdldDogZnVuY3Rpb24oKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy50ZXh0dXJlLmhlaWdodDtcblx0XHR9XG5cdH0sXG5cblxuXHQvKipcblx0ICogQ2FsbGVkIGR1cmluZyBpbml0aWFsaXphdGlvbiB0byBzZXR1cCB0aGUgZnJhbWUgYnVmZmVyOyBhbHNvIGNhbGxlZCBvblxuXHQgKiBjb250ZXh0IHJlc3RvcmUuIFVzZXJzIHdpbGwgbm90IG5lZWQgdG8gY2FsbCB0aGlzIGRpcmVjdGx5LlxuXHQgKiBcblx0ICogQG1ldGhvZCBjcmVhdGVcblx0ICovXG5cdGNyZWF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nbCA9IHRoaXMuY29udGV4dC5nbDsgXG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblxuXHRcdHZhciB0ZXggPSB0aGlzLnRleHR1cmU7XG5cblx0XHQvL3dlIGFzc3VtZSB0aGUgdGV4dHVyZSBoYXMgYWxyZWFkeSBoYWQgY3JlYXRlKCkgY2FsbGVkIG9uIGl0XG5cdFx0Ly9zaW5jZSBpdCB3YXMgYWRkZWQgYXMgYSBtYW5hZ2VkIG9iamVjdCBwcmlvciB0byB0aGlzIEZyYW1lQnVmZmVyXG5cdFx0dGV4LmJpbmQoKTtcbiBcblx0XHR0aGlzLmlkID0gZ2wuY3JlYXRlRnJhbWVidWZmZXIoKTtcblx0XHRnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuaWQpO1xuXG5cdFx0Z2wuZnJhbWVidWZmZXJUZXh0dXJlMkQoZ2wuRlJBTUVCVUZGRVIsIGdsLkNPTE9SX0FUVEFDSE1FTlQwLCB0ZXgudGFyZ2V0LCB0ZXguaWQsIDApO1xuXG5cdFx0dmFyIHJlc3VsdCA9IGdsLmNoZWNrRnJhbWVidWZmZXJTdGF0dXMoZ2wuRlJBTUVCVUZGRVIpO1xuXHRcdGlmIChyZXN1bHQgIT0gZ2wuRlJBTUVCVUZGRVJfQ09NUExFVEUpIHtcblx0XHRcdHRoaXMuZGVzdHJveSgpOyAvL2Rlc3Ryb3kgb3VyIHJlc291cmNlcyBiZWZvcmUgbGVhdmluZyB0aGlzIGZ1bmN0aW9uLi5cblxuXHRcdFx0dmFyIGVyciA9IFwiRnJhbWVidWZmZXIgbm90IGNvbXBsZXRlXCI7XG5cdFx0XHRzd2l0Y2ggKHJlc3VsdCkge1xuXHRcdFx0XHRjYXNlIGdsLkZSQU1FQlVGRkVSX1VOU1VQUE9SVEVEOlxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIgKyBcIjogdW5zdXBwb3J0ZWRcIik7XG5cdFx0XHRcdGNhc2UgZ2wuSU5DT01QTEVURV9ESU1FTlNJT05TOlxuXHRcdFx0XHRcdHRocm93IG5ldyBFcnJvcihlcnIgKyBcIjogaW5jb21wbGV0ZSBkaW1lbnNpb25zXCIpO1xuXHRcdFx0XHRjYXNlIGdsLklOQ09NUExFVEVfQVRUQUNITUVOVDpcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyICsgXCI6IGluY29tcGxldGUgYXR0YWNobWVudFwiKTtcblx0XHRcdFx0Y2FzZSBnbC5JTkNPTVBMRVRFX01JU1NJTkdfQVRUQUNITUVOVDpcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyICsgXCI6IG1pc3NpbmcgYXR0YWNobWVudFwiKTtcblx0XHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoZXJyKTtcblx0XHRcdH1cblx0XHR9XG5cdFx0Z2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblx0fSxcblxuXG5cdC8qKlxuXHQgKiBEZXN0cm95cyB0aGlzIGZyYW1lIGJ1ZmZlci4gVXNpbmcgdGhpcyBvYmplY3QgYWZ0ZXIgZGVzdHJveWluZyBpdCB3aWxsIGhhdmVcblx0ICogdW5kZWZpbmVkIHJlc3VsdHMuIFxuXHQgKiBAbWV0aG9kIGRlc3Ryb3lcblx0ICovXG5cdGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cblx0XHRpZiAodGhpcy50ZXh0dXJlKVxuXHRcdFx0dGhpcy50ZXh0dXJlLmRlc3Ryb3koKTtcblx0XHRpZiAodGhpcy5pZCAmJiB0aGlzLmdsKVxuXHRcdFx0dGhpcy5nbC5kZWxldGVGcmFtZWJ1ZmZlcih0aGlzLmlkKTtcblx0XHRpZiAodGhpcy5jb250ZXh0KVxuXHRcdFx0dGhpcy5jb250ZXh0LnJlbW92ZU1hbmFnZWRPYmplY3QodGhpcyk7XG5cblx0XHR0aGlzLmlkID0gbnVsbDtcblx0XHR0aGlzLnRleHR1cmUgPSBudWxsO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBCaW5kcyB0aGlzIGZyYW1lYnVmZmVyIGFuZCBzZXRzIHRoZSB2aWV3cG9ydCB0byB0aGUgZXhwZWN0ZWQgc2l6ZS5cblx0ICogQG1ldGhvZCBiZWdpblxuXHQgKi9cblx0YmVnaW46IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cdFx0Z2wudmlld3BvcnQoMCwgMCwgdGhpcy50ZXh0dXJlLndpZHRoLCB0aGlzLnRleHR1cmUuaGVpZ2h0KTtcblx0XHRnbC5iaW5kRnJhbWVidWZmZXIoZ2wuRlJBTUVCVUZGRVIsIHRoaXMuaWQpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBCaW5kcyB0aGUgZGVmYXVsdCBmcmFtZSBidWZmZXIgKHRoZSBzY3JlZW4pIGFuZCBzZXRzIHRoZSB2aWV3cG9ydCBiYWNrXG5cdCAqIHRvIHRoZSBzaXplIG9mIHRoZSBXZWJHTENvbnRleHQuXG5cdCAqIFxuXHQgKiBAbWV0aG9kIGVuZFxuXHQgKi9cblx0ZW5kOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXHRcdGdsLnZpZXdwb3J0KDAsIDAsIHRoaXMuY29udGV4dC53aWR0aCwgdGhpcy5jb250ZXh0LmhlaWdodCk7XG5cdFx0Z2wuYmluZEZyYW1lYnVmZmVyKGdsLkZSQU1FQlVGRkVSLCBudWxsKTtcblx0fVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gRnJhbWVCdWZmZXI7IiwiLyoqXG4gKiBAbW9kdWxlIGthbWlcbiAqL1xuXG52YXIgQ2xhc3MgPSByZXF1aXJlKCdrbGFzc2UnKTtcblxuLy9UT0RPOiBkZWNvdXBsZSBpbnRvIFZCTyArIElCTyB1dGlsaXRpZXMgXG4vKipcbiAqIEEgbWVzaCBjbGFzcyB0aGF0IHdyYXBzIFZCTyBhbmQgSUJPLlxuICpcbiAqIEBjbGFzcyAgTWVzaFxuICovXG52YXIgTWVzaCA9IG5ldyBDbGFzcyh7XG5cblxuXHQvKipcblx0ICogQSB3cml0ZS1vbmx5IHByb3BlcnR5IHdoaWNoIHNldHMgYm90aCB2ZXJ0aWNlcyBhbmQgaW5kaWNlcyBcblx0ICogZmxhZyB0byBkaXJ0eSBvciBub3QuIFxuXHQgKlxuXHQgKiBAcHJvcGVydHkgZGlydHlcblx0ICogQHR5cGUge0Jvb2xlYW59XG5cdCAqIEB3cml0ZU9ubHlcblx0ICovXG5cdGRpcnR5OiB7XG5cdFx0c2V0OiBmdW5jdGlvbih2YWwpIHtcblx0XHRcdHRoaXMudmVydGljZXNEaXJ0eSA9IHZhbDtcblx0XHRcdHRoaXMuaW5kaWNlc0RpcnR5ID0gdmFsO1xuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQ3JlYXRlcyBhIG5ldyBNZXNoIHdpdGggdGhlIHByb3ZpZGVkIHBhcmFtZXRlcnMuXG5cdCAqXG5cdCAqIElmIG51bUluZGljZXMgaXMgMCBvciBmYWxzeSwgbm8gaW5kZXggYnVmZmVyIHdpbGwgYmUgdXNlZFxuXHQgKiBhbmQgaW5kaWNlcyB3aWxsIGJlIGFuIGVtcHR5IEFycmF5QnVmZmVyIGFuZCBhIG51bGwgaW5kZXhCdWZmZXIuXG5cdCAqIFxuXHQgKiBJZiBpc1N0YXRpYyBpcyB0cnVlLCB0aGVuIHZlcnRleFVzYWdlIGFuZCBpbmRleFVzYWdlIHdpbGxcblx0ICogYmUgc2V0IHRvIGdsLlNUQVRJQ19EUkFXLiBPdGhlcndpc2UgdGhleSB3aWxsIHVzZSBnbC5EWU5BTUlDX0RSQVcuXG5cdCAqIFlvdSBtYXkgd2FudCB0byBhZGp1c3QgdGhlc2UgYWZ0ZXIgaW5pdGlhbGl6YXRpb24gZm9yIGZ1cnRoZXIgY29udHJvbC5cblx0ICogXG5cdCAqIEBwYXJhbSAge1dlYkdMQ29udGV4dH0gIGNvbnRleHQgdGhlIGNvbnRleHQgZm9yIG1hbmFnZW1lbnRcblx0ICogQHBhcmFtICB7Qm9vbGVhbn0gaXNTdGF0aWMgICAgICBhIGhpbnQgYXMgdG8gd2hldGhlciB0aGlzIGdlb21ldHJ5IGlzIHN0YXRpY1xuXHQgKiBAcGFyYW0gIHtbdHlwZV19ICBudW1WZXJ0cyAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7W3R5cGVdfSAgbnVtSW5kaWNlcyAgICBbZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge1t0eXBlXX0gIHZlcnRleEF0dHJpYnMgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cdGluaXRpYWxpemU6IGZ1bmN0aW9uIE1lc2goY29udGV4dCwgaXNTdGF0aWMsIG51bVZlcnRzLCBudW1JbmRpY2VzLCB2ZXJ0ZXhBdHRyaWJzKSB7XG5cdFx0aWYgKHR5cGVvZiBjb250ZXh0ICE9PSBcIm9iamVjdFwiKVxuXHRcdFx0dGhyb3cgXCJHTCBjb250ZXh0IG5vdCBzcGVjaWZpZWQgdG8gTWVzaFwiO1xuXHRcdGlmICghbnVtVmVydHMpXG5cdFx0XHR0aHJvdyBcIm51bVZlcnRzIG5vdCBzcGVjaWZpZWQsIG11c3QgYmUgPiAwXCI7XG5cblx0XHR0aGlzLmNvbnRleHQgPSBjb250ZXh0O1xuXHRcdHRoaXMuZ2wgPSBjb250ZXh0LmdsO1xuXHRcdFxuXHRcdHRoaXMubnVtVmVydHMgPSBudWxsO1xuXHRcdHRoaXMubnVtSW5kaWNlcyA9IG51bGw7XG5cdFx0XG5cdFx0dGhpcy52ZXJ0aWNlcyA9IG51bGw7XG5cdFx0dGhpcy5pbmRpY2VzID0gbnVsbDtcblx0XHR0aGlzLnZlcnRleEJ1ZmZlciA9IG51bGw7XG5cdFx0dGhpcy5pbmRleEJ1ZmZlciA9IG51bGw7XG5cblx0XHR0aGlzLnZlcnRpY2VzRGlydHkgPSB0cnVlO1xuXHRcdHRoaXMuaW5kaWNlc0RpcnR5ID0gdHJ1ZTtcblx0XHR0aGlzLmluZGV4VXNhZ2UgPSBudWxsO1xuXHRcdHRoaXMudmVydGV4VXNhZ2UgPSBudWxsO1xuXG5cdFx0LyoqIFxuXHRcdCAqIEBwcm9wZXJ0eVxuXHRcdCAqIEBwcml2YXRlXG5cdFx0ICovXG5cdFx0dGhpcy5fdmVydGV4QXR0cmlicyA9IG51bGw7XG5cblx0XHQvKiogXG5cdFx0ICogQHByb3BlcnR5XG5cdFx0ICogQHByaXZhdGVcblx0XHQgKi9cblx0XHR0aGlzLl92ZXJ0ZXhTdHJpZGUgPSBudWxsO1xuXG5cdFx0dGhpcy5udW1WZXJ0cyA9IG51bVZlcnRzO1xuXHRcdHRoaXMubnVtSW5kaWNlcyA9IG51bUluZGljZXMgfHwgMDtcblx0XHR0aGlzLnZlcnRleFVzYWdlID0gaXNTdGF0aWMgPyB0aGlzLmdsLlNUQVRJQ19EUkFXIDogdGhpcy5nbC5EWU5BTUlDX0RSQVc7XG5cdFx0dGhpcy5pbmRleFVzYWdlICA9IGlzU3RhdGljID8gdGhpcy5nbC5TVEFUSUNfRFJBVyA6IHRoaXMuZ2wuRFlOQU1JQ19EUkFXO1xuXHRcdHRoaXMuX3ZlcnRleEF0dHJpYnMgPSB2ZXJ0ZXhBdHRyaWJzIHx8IFtdO1xuXHRcdFxuXHRcdHRoaXMuaW5kaWNlc0RpcnR5ID0gdHJ1ZTtcblx0XHR0aGlzLnZlcnRpY2VzRGlydHkgPSB0cnVlO1xuXG5cdFx0Ly9kZXRlcm1pbmUgdGhlIHZlcnRleCBzdHJpZGUgYmFzZWQgb24gZ2l2ZW4gYXR0cmlidXRlc1xuXHRcdHZhciB0b3RhbE51bUNvbXBvbmVudHMgPSAwO1xuXHRcdGZvciAodmFyIGk9MDsgaTx0aGlzLl92ZXJ0ZXhBdHRyaWJzLmxlbmd0aDsgaSsrKVxuXHRcdFx0dG90YWxOdW1Db21wb25lbnRzICs9IHRoaXMuX3ZlcnRleEF0dHJpYnNbaV0ub2Zmc2V0Q291bnQ7XG5cdFx0dGhpcy5fdmVydGV4U3RyaWRlID0gdG90YWxOdW1Db21wb25lbnRzICogNDsgLy8gaW4gYnl0ZXNcblxuXHRcdHRoaXMudmVydGljZXMgPSBuZXcgRmxvYXQzMkFycmF5KHRoaXMubnVtVmVydHMpO1xuXHRcdHRoaXMuaW5kaWNlcyA9IG5ldyBVaW50MTZBcnJheSh0aGlzLm51bUluZGljZXMpO1xuXG5cdFx0Ly9hZGQgdGhpcyBWQk8gdG8gdGhlIG1hbmFnZWQgY2FjaGVcblx0XHR0aGlzLmNvbnRleHQuYWRkTWFuYWdlZE9iamVjdCh0aGlzKTtcblxuXHRcdHRoaXMuY3JlYXRlKCk7XG5cdH0sXG5cblx0Ly9yZWNyZWF0ZXMgdGhlIGJ1ZmZlcnMgb24gY29udGV4dCBsb3NzXG5cdGNyZWF0ZTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nbCA9IHRoaXMuY29udGV4dC5nbDtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXHRcdHRoaXMudmVydGV4QnVmZmVyID0gZ2wuY3JlYXRlQnVmZmVyKCk7XG5cblx0XHQvL2lnbm9yZSBpbmRleCBidWZmZXIgaWYgd2UgaGF2ZW4ndCBzcGVjaWZpZWQgYW55XG5cdFx0dGhpcy5pbmRleEJ1ZmZlciA9IHRoaXMubnVtSW5kaWNlcyA+IDBcblx0XHRcdFx0XHQ/IGdsLmNyZWF0ZUJ1ZmZlcigpXG5cdFx0XHRcdFx0OiBudWxsO1xuXG5cdFx0dGhpcy5kaXJ0eSA9IHRydWU7XG5cdH0sXG5cblx0ZGVzdHJveTogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy52ZXJ0aWNlcyA9IFtdO1xuXHRcdHRoaXMuaW5kaWNlcyA9IFtdO1xuXHRcdGlmICh0aGlzLnZlcnRleEJ1ZmZlciAmJiB0aGlzLmdsKVxuXHRcdFx0dGhpcy5nbC5kZWxldGVCdWZmZXIodGhpcy52ZXJ0ZXhCdWZmZXIpO1xuXHRcdGlmICh0aGlzLmluZGV4QnVmZmVyICYmIHRoaXMuZ2wpXG5cdFx0XHR0aGlzLmdsLmRlbGV0ZUJ1ZmZlcih0aGlzLmluZGV4QnVmZmVyKTtcblx0XHR0aGlzLnZlcnRleEJ1ZmZlciA9IG51bGw7XG5cdFx0dGhpcy5pbmRleEJ1ZmZlciA9IG51bGw7XG5cdFx0aWYgKHRoaXMuY29udGV4dClcblx0XHRcdHRoaXMuY29udGV4dC5yZW1vdmVNYW5hZ2VkT2JqZWN0KHRoaXMpO1xuXHRcdHRoaXMuZ2wgPSBudWxsO1xuXHRcdHRoaXMuY29udGV4dCA9IG51bGw7XG5cdH0sXG5cblx0X3VwZGF0ZUJ1ZmZlcnM6IGZ1bmN0aW9uKGlnbm9yZUJpbmQsIHN1YkRhdGFMZW5ndGgpIHtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXG5cdFx0Ly9iaW5kIG91ciBpbmRleCBkYXRhLCBpZiB3ZSBoYXZlIGFueVxuXHRcdGlmICh0aGlzLm51bUluZGljZXMgPiAwKSB7XG5cdFx0XHRpZiAoIWlnbm9yZUJpbmQpXG5cdFx0XHRcdGdsLmJpbmRCdWZmZXIoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaW5kZXhCdWZmZXIpO1xuXG5cdFx0XHQvL3VwZGF0ZSB0aGUgaW5kZXggZGF0YVxuXHRcdFx0aWYgKHRoaXMuaW5kaWNlc0RpcnR5KSB7XG5cdFx0XHRcdGdsLmJ1ZmZlckRhdGEoZ2wuRUxFTUVOVF9BUlJBWV9CVUZGRVIsIHRoaXMuaW5kaWNlcywgdGhpcy5pbmRleFVzYWdlKTtcblx0XHRcdFx0dGhpcy5pbmRpY2VzRGlydHkgPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHQvL2JpbmQgb3VyIHZlcnRleCBkYXRhXG5cdFx0aWYgKCFpZ25vcmVCaW5kKVxuXHRcdFx0Z2wuYmluZEJ1ZmZlcihnbC5BUlJBWV9CVUZGRVIsIHRoaXMudmVydGV4QnVmZmVyKTtcblxuXHRcdC8vdXBkYXRlIG91ciB2ZXJ0ZXggZGF0YVxuXHRcdGlmICh0aGlzLnZlcnRpY2VzRGlydHkpIHtcblx0XHRcdGlmIChzdWJEYXRhTGVuZ3RoKSB7XG5cdFx0XHRcdC8vIFRPRE86IFdoZW4gZGVjb3VwbGluZyBWQk8vSUJPIGJlIHN1cmUgdG8gZ2l2ZSBiZXR0ZXIgc3ViRGF0YSBzdXBwb3J0Li5cblx0XHRcdFx0dmFyIHZpZXcgPSB0aGlzLnZlcnRpY2VzLnN1YmFycmF5KDAsIHN1YkRhdGFMZW5ndGgpO1xuXHRcdFx0XHRnbC5idWZmZXJTdWJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgMCwgdmlldyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRnbC5idWZmZXJEYXRhKGdsLkFSUkFZX0JVRkZFUiwgdGhpcy52ZXJ0aWNlcywgdGhpcy52ZXJ0ZXhVc2FnZSk7XHRcblx0XHRcdH1cblxuXHRcdFx0XG5cdFx0XHR0aGlzLnZlcnRpY2VzRGlydHkgPSBmYWxzZTtcblx0XHR9XG5cdH0sXG5cblx0ZHJhdzogZnVuY3Rpb24ocHJpbWl0aXZlVHlwZSwgY291bnQsIG9mZnNldCwgc3ViRGF0YUxlbmd0aCkge1xuXHRcdGlmIChjb3VudCA9PT0gMClcblx0XHRcdHJldHVybjtcblxuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cdFx0XG5cdFx0b2Zmc2V0ID0gb2Zmc2V0IHx8IDA7XG5cblx0XHQvL2JpbmRzIGFuZCB1cGRhdGVzIG91ciBidWZmZXJzLiBwYXNzIGlnbm9yZUJpbmQgYXMgdHJ1ZVxuXHRcdC8vdG8gYXZvaWQgYmluZGluZyB1bm5lY2Vzc2FyaWx5XG5cdFx0dGhpcy5fdXBkYXRlQnVmZmVycyh0cnVlLCBzdWJEYXRhTGVuZ3RoKTtcblxuXHRcdGlmICh0aGlzLm51bUluZGljZXMgPiAwKSB7IFxuXHRcdFx0Z2wuZHJhd0VsZW1lbnRzKHByaW1pdGl2ZVR5cGUsIGNvdW50LCBcblx0XHRcdFx0XHRcdGdsLlVOU0lHTkVEX1NIT1JULCBvZmZzZXQgKiAyKTsgLy8qIFVpbnQxNkFycmF5LkJZVEVTX1BFUl9FTEVNRU5UXG5cdFx0fSBlbHNlXG5cdFx0XHRnbC5kcmF3QXJyYXlzKHByaW1pdGl2ZVR5cGUsIG9mZnNldCwgY291bnQpO1xuXHR9LFxuXG5cdC8vYmluZHMgdGhpcyBtZXNoJ3MgdmVydGV4IGF0dHJpYnV0ZXMgZm9yIHRoZSBnaXZlbiBzaGFkZXJcblx0YmluZDogZnVuY3Rpb24oc2hhZGVyKSB7XG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblxuXHRcdHZhciBvZmZzZXQgPSAwO1xuXHRcdHZhciBzdHJpZGUgPSB0aGlzLl92ZXJ0ZXhTdHJpZGU7XG5cblx0XHQvL2JpbmQgYW5kIHVwZGF0ZSBvdXIgdmVydGV4IGRhdGEgYmVmb3JlIGJpbmRpbmcgYXR0cmlidXRlc1xuXHRcdHRoaXMuX3VwZGF0ZUJ1ZmZlcnMoKTtcblxuXHRcdC8vZm9yIGVhY2ggYXR0cmlidHVlXG5cdFx0Zm9yICh2YXIgaT0wOyBpPHRoaXMuX3ZlcnRleEF0dHJpYnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhID0gdGhpcy5fdmVydGV4QXR0cmlic1tpXTtcblxuXHRcdFx0Ly9sb2NhdGlvbiBvZiB0aGUgYXR0cmlidXRlXG5cdFx0XHR2YXIgbG9jID0gYS5sb2NhdGlvbiA9PT0gbnVsbCBcblx0XHRcdFx0XHQ/IHNoYWRlci5nZXRBdHRyaWJ1dGVMb2NhdGlvbihhLm5hbWUpXG5cdFx0XHRcdFx0OiBhLmxvY2F0aW9uO1xuXG5cdFx0XHQvL1RPRE86IFdlIG1heSB3YW50IHRvIHNraXAgdW5mb3VuZCBhdHRyaWJzXG5cdFx0XHQvLyBpZiAobG9jIT09MCAmJiAhbG9jKVxuXHRcdFx0Ly8gXHRjb25zb2xlLndhcm4oXCJXQVJOOlwiLCBhLm5hbWUsIFwiaXMgbm90IGVuYWJsZWRcIik7XG5cblx0XHRcdC8vZmlyc3QsIGVuYWJsZSB0aGUgdmVydGV4IGFycmF5XG5cdFx0XHRnbC5lbmFibGVWZXJ0ZXhBdHRyaWJBcnJheShsb2MpO1xuXG5cdFx0XHQvL3RoZW4gc3BlY2lmeSBvdXIgdmVydGV4IGZvcm1hdFxuXHRcdFx0Z2wudmVydGV4QXR0cmliUG9pbnRlcihsb2MsIGEubnVtQ29tcG9uZW50cywgYS50eXBlIHx8IGdsLkZMT0FULCBcblx0XHRcdFx0XHRcdFx0XHQgICBhLm5vcm1hbGl6ZSwgc3RyaWRlLCBvZmZzZXQpO1xuXG5cdFx0XHQvL2FuZCBpbmNyZWFzZSB0aGUgb2Zmc2V0Li4uXG5cdFx0XHRvZmZzZXQgKz0gYS5vZmZzZXRDb3VudCAqIDQ7IC8vaW4gYnl0ZXNcblx0XHR9XG5cdH0sXG5cblx0dW5iaW5kOiBmdW5jdGlvbihzaGFkZXIpIHtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXG5cdFx0Ly9mb3IgZWFjaCBhdHRyaWJ0dWVcblx0XHRmb3IgKHZhciBpPTA7IGk8dGhpcy5fdmVydGV4QXR0cmlicy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGEgPSB0aGlzLl92ZXJ0ZXhBdHRyaWJzW2ldO1xuXG5cdFx0XHQvL2xvY2F0aW9uIG9mIHRoZSBhdHRyaWJ1dGVcblx0XHRcdHZhciBsb2MgPSBhLmxvY2F0aW9uID09PSBudWxsIFxuXHRcdFx0XHRcdD8gc2hhZGVyLmdldEF0dHJpYnV0ZUxvY2F0aW9uKGEubmFtZSlcblx0XHRcdFx0XHQ6IGEubG9jYXRpb247XG5cblx0XHRcdC8vZmlyc3QsIGVuYWJsZSB0aGUgdmVydGV4IGFycmF5XG5cdFx0XHRnbC5kaXNhYmxlVmVydGV4QXR0cmliQXJyYXkobG9jKTtcblx0XHR9XG5cdH1cbn0pO1xuXG5NZXNoLkF0dHJpYiA9IG5ldyBDbGFzcyh7XG5cblx0bmFtZTogbnVsbCxcblx0bnVtQ29tcG9uZW50czogbnVsbCxcblx0bG9jYXRpb246IG51bGwsXG5cdHR5cGU6IG51bGwsXG5cblx0LyoqXG5cdCAqIExvY2F0aW9uIGlzIG9wdGlvbmFsIGFuZCBmb3IgYWR2YW5jZWQgdXNlcnMgdGhhdFxuXHQgKiB3YW50IHZlcnRleCBhcnJheXMgdG8gbWF0Y2ggYWNyb3NzIHNoYWRlcnMuIEFueSBub24tbnVtZXJpY2FsXG5cdCAqIHZhbHVlIHdpbGwgYmUgY29udmVydGVkIHRvIG51bGwsIGFuZCBpZ25vcmVkLiBJZiBhIG51bWVyaWNhbFxuXHQgKiB2YWx1ZSBpcyBnaXZlbiwgaXQgd2lsbCBvdmVycmlkZSB0aGUgcG9zaXRpb24gb2YgdGhpcyBhdHRyaWJ1dGVcblx0ICogd2hlbiBnaXZlbiB0byBhIG1lc2guXG5cdCAqIFxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IG5hbWUgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IG51bUNvbXBvbmVudHMgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtbdHlwZV19IGxvY2F0aW9uICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtbdHlwZV19ICAgICAgICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24obmFtZSwgbnVtQ29tcG9uZW50cywgbG9jYXRpb24sIHR5cGUsIG5vcm1hbGl6ZSwgb2Zmc2V0Q291bnQpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMubnVtQ29tcG9uZW50cyA9IG51bUNvbXBvbmVudHM7XG5cdFx0dGhpcy5sb2NhdGlvbiA9IHR5cGVvZiBsb2NhdGlvbiA9PT0gXCJudW1iZXJcIiA/IGxvY2F0aW9uIDogbnVsbDtcblx0XHR0aGlzLnR5cGUgPSB0eXBlO1xuXHRcdHRoaXMubm9ybWFsaXplID0gQm9vbGVhbihub3JtYWxpemUpO1xuXHRcdHRoaXMub2Zmc2V0Q291bnQgPSB0eXBlb2Ygb2Zmc2V0Q291bnQgPT09IFwibnVtYmVyXCIgPyBvZmZzZXRDb3VudCA6IHRoaXMubnVtQ29tcG9uZW50cztcblx0fVxufSlcblxuXG5tb2R1bGUuZXhwb3J0cyA9IE1lc2g7IiwiLyoqXG4gKiBAbW9kdWxlIGthbWlcbiAqL1xuXG52YXIgQ2xhc3MgPSByZXF1aXJlKCdrbGFzc2UnKTtcblxuXG52YXIgU2hhZGVyUHJvZ3JhbSA9IG5ldyBDbGFzcyh7XG5cdFxuXHQvKipcblx0ICogQ3JlYXRlcyBhIG5ldyBTaGFkZXJQcm9ncmFtIGZyb20gdGhlIGdpdmVuIHNvdXJjZSwgYW5kIGFuIG9wdGlvbmFsIG1hcCBvZiBhdHRyaWJ1dGVcblx0ICogbG9jYXRpb25zIGFzIDxuYW1lLCBpbmRleD4gcGFpcnMuXG5cdCAqXG5cdCAqIF9Ob3RlOl8gQ2hyb21lIHZlcnNpb24gMzEgd2FzIGdpdmluZyBtZSBpc3N1ZXMgd2l0aCBhdHRyaWJ1dGUgbG9jYXRpb25zIC0tIHlvdSBtYXlcblx0ICogd2FudCB0byBvbWl0IHRoaXMgdG8gbGV0IHRoZSBicm93c2VyIHBpY2sgdGhlIGxvY2F0aW9ucyBmb3IgeW91Llx0XG5cdCAqXG5cdCAqIEBjbGFzcyAgU2hhZGVyUHJvZ3JhbVxuXHQgKiBAY29uc3RydWN0b3Jcblx0ICogQHBhcmFtICB7V2ViR0xDb250ZXh0fSBjb250ZXh0ICAgICAgdGhlIGNvbnRleHQgdG8gbWFuYWdlIHRoaXMgb2JqZWN0XG5cdCAqIEBwYXJhbSAge1N0cmluZ30gdmVydFNvdXJjZSAgICAgICAgIHRoZSB2ZXJ0ZXggc2hhZGVyIHNvdXJjZVxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IGZyYWdTb3VyY2UgICAgICAgICB0aGUgZnJhZ21lbnQgc2hhZGVyIHNvdXJjZVxuXHQgKiBAcGFyYW0gIHtPYmplY3R9IGF0dHJpYnV0ZUxvY2F0aW9ucyB0aGUgYXR0cmlidXRlIGxvY2F0aW9uc1xuXHQgKi9cblx0aW5pdGlhbGl6ZTogZnVuY3Rpb24gU2hhZGVyUHJvZ3JhbShjb250ZXh0LCB2ZXJ0U291cmNlLCBmcmFnU291cmNlLCBhdHRyaWJ1dGVMb2NhdGlvbnMpIHtcblx0XHRpZiAoIXZlcnRTb3VyY2UgfHwgIWZyYWdTb3VyY2UpXG5cdFx0XHR0aHJvdyBcInZlcnRleCBhbmQgZnJhZ21lbnQgc2hhZGVycyBtdXN0IGJlIGRlZmluZWRcIjtcblx0XHRpZiAodHlwZW9mIGNvbnRleHQgIT09IFwib2JqZWN0XCIpXG5cdFx0XHR0aHJvdyBcIkdMIGNvbnRleHQgbm90IHNwZWNpZmllZCB0byBTaGFkZXJQcm9ncmFtXCI7XG5cdFx0dGhpcy5jb250ZXh0ID0gY29udGV4dDtcblxuXHRcdHRoaXMudmVydFNoYWRlciA9IG51bGw7XG5cdFx0dGhpcy5mcmFnU2hhZGVyID0gbnVsbDtcblx0XHR0aGlzLnByb2dyYW0gPSBudWxsO1xuXHRcdHRoaXMubG9nID0gXCJcIjtcblxuXHRcdHRoaXMudW5pZm9ybUNhY2hlID0gbnVsbDtcblx0XHR0aGlzLmF0dHJpYnV0ZUNhY2hlID0gbnVsbDtcblxuXHRcdHRoaXMuYXR0cmlidXRlTG9jYXRpb25zID0gYXR0cmlidXRlTG9jYXRpb25zO1xuXG5cdFx0Ly9XZSB0cmltIChFQ01BU2NyaXB0NSkgc28gdGhhdCB0aGUgR0xTTCBsaW5lIG51bWJlcnMgYXJlXG5cdFx0Ly9hY2N1cmF0ZSBvbiBzaGFkZXIgbG9nXG5cdFx0dGhpcy52ZXJ0U291cmNlID0gdmVydFNvdXJjZS50cmltKCk7XG5cdFx0dGhpcy5mcmFnU291cmNlID0gZnJhZ1NvdXJjZS50cmltKCk7XG5cblx0XHQvL0FkZHMgdGhpcyBzaGFkZXIgdG8gdGhlIGNvbnRleHQsIHRvIGJlIG1hbmFnZWRcblx0XHR0aGlzLmNvbnRleHQuYWRkTWFuYWdlZE9iamVjdCh0aGlzKTtcblxuXHRcdHRoaXMuY3JlYXRlKCk7XG5cdH0sXG5cblx0LyoqIFxuXHQgKiBUaGlzIGlzIGNhbGxlZCBkdXJpbmcgdGhlIFNoYWRlclByb2dyYW0gY29uc3RydWN0b3IsXG5cdCAqIGFuZCBtYXkgbmVlZCB0byBiZSBjYWxsZWQgYWdhaW4gYWZ0ZXIgY29udGV4dCBsb3NzIGFuZCByZXN0b3JlLlxuXHQgKiBcblx0ICogQG1ldGhvZCAgY3JlYXRlXG5cdCAqL1xuXHRjcmVhdGU6IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2wgPSB0aGlzLmNvbnRleHQuZ2w7XG5cdFx0dGhpcy5fY29tcGlsZVNoYWRlcnMoKTtcblx0fSxcblxuXHQvL0NvbXBpbGVzIHRoZSBzaGFkZXJzLCB0aHJvd2luZyBhbiBlcnJvciBpZiB0aGUgcHJvZ3JhbSB3YXMgaW52YWxpZC5cblx0X2NvbXBpbGVTaGFkZXJzOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsOyBcblx0XHRcblx0XHR0aGlzLmxvZyA9IFwiXCI7XG5cblx0XHR0aGlzLnZlcnRTaGFkZXIgPSB0aGlzLl9sb2FkU2hhZGVyKGdsLlZFUlRFWF9TSEFERVIsIHRoaXMudmVydFNvdXJjZSk7XG5cdFx0dGhpcy5mcmFnU2hhZGVyID0gdGhpcy5fbG9hZFNoYWRlcihnbC5GUkFHTUVOVF9TSEFERVIsIHRoaXMuZnJhZ1NvdXJjZSk7XG5cblx0XHRpZiAoIXRoaXMudmVydFNoYWRlciB8fCAhdGhpcy5mcmFnU2hhZGVyKVxuXHRcdFx0dGhyb3cgXCJFcnJvciByZXR1cm5lZCB3aGVuIGNhbGxpbmcgY3JlYXRlU2hhZGVyXCI7XG5cblx0XHR0aGlzLnByb2dyYW0gPSBnbC5jcmVhdGVQcm9ncmFtKCk7XG5cblx0XHRnbC5hdHRhY2hTaGFkZXIodGhpcy5wcm9ncmFtLCB0aGlzLnZlcnRTaGFkZXIpO1xuXHRcdGdsLmF0dGFjaFNoYWRlcih0aGlzLnByb2dyYW0sIHRoaXMuZnJhZ1NoYWRlcik7XG5cdFxuXHRcdC8vVE9ETzogVGhpcyBzZWVtcyBub3QgdG8gYmUgd29ya2luZyBvbiBteSBPU1ggLS0gbWF5YmUgYSBkcml2ZXIgYnVnP1xuXHRcdGlmICh0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucykge1xuXHRcdFx0Zm9yICh2YXIga2V5IGluIHRoaXMuYXR0cmlidXRlTG9jYXRpb25zKSB7XG5cdFx0XHRcdGlmICh0aGlzLmF0dHJpYnV0ZUxvY2F0aW9ucy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG5cdFx0XHRcdFx0Z2wuYmluZEF0dHJpYkxvY2F0aW9uKHRoaXMucHJvZ3JhbSwgTWF0aC5mbG9vcih0aGlzLmF0dHJpYnV0ZUxvY2F0aW9uc1trZXldKSwga2V5KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGdsLmxpbmtQcm9ncmFtKHRoaXMucHJvZ3JhbSk7IFxuXG5cdFx0dGhpcy5sb2cgKz0gZ2wuZ2V0UHJvZ3JhbUluZm9Mb2codGhpcy5wcm9ncmFtKSB8fCBcIlwiO1xuXG5cdFx0aWYgKCFnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgZ2wuTElOS19TVEFUVVMpKSB7XG5cdFx0XHR0aHJvdyBcIkVycm9yIGxpbmtpbmcgdGhlIHNoYWRlciBwcm9ncmFtOlxcblwiXG5cdFx0XHRcdCsgdGhpcy5sb2c7XG5cdFx0fVxuXG5cdFx0dGhpcy5fZmV0Y2hVbmlmb3JtcygpO1xuXHRcdHRoaXMuX2ZldGNoQXR0cmlidXRlcygpO1xuXHR9LFxuXG5cdF9mZXRjaFVuaWZvcm1zOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXG5cdFx0dGhpcy51bmlmb3JtQ2FjaGUgPSB7fTtcblxuXHRcdHZhciBsZW4gPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgZ2wuQUNUSVZFX1VOSUZPUk1TKTtcblx0XHRpZiAoIWxlbikgLy9udWxsIG9yIHplcm9cblx0XHRcdHJldHVybjtcblxuXHRcdGZvciAodmFyIGk9MDsgaTxsZW47IGkrKykge1xuXHRcdFx0dmFyIGluZm8gPSBnbC5nZXRBY3RpdmVVbmlmb3JtKHRoaXMucHJvZ3JhbSwgaSk7XG5cdFx0XHRpZiAoaW5mbyA9PT0gbnVsbCkgXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0dmFyIG5hbWUgPSBpbmZvLm5hbWU7XG5cdFx0XHR2YXIgbG9jYXRpb24gPSBnbC5nZXRVbmlmb3JtTG9jYXRpb24odGhpcy5wcm9ncmFtLCBuYW1lKTtcblx0XHRcdFxuXHRcdFx0dGhpcy51bmlmb3JtQ2FjaGVbbmFtZV0gPSB7XG5cdFx0XHRcdHNpemU6IGluZm8uc2l6ZSxcblx0XHRcdFx0dHlwZTogaW5mby50eXBlLFxuXHRcdFx0XHRsb2NhdGlvbjogbG9jYXRpb25cblx0XHRcdH07XG5cdFx0fVxuXHR9LFxuXG5cdF9mZXRjaEF0dHJpYnV0ZXM6IGZ1bmN0aW9uKCkgeyBcblx0XHR2YXIgZ2wgPSB0aGlzLmdsOyBcblxuXHRcdHRoaXMuYXR0cmlidXRlQ2FjaGUgPSB7fTtcblxuXHRcdHZhciBsZW4gPSBnbC5nZXRQcm9ncmFtUGFyYW1ldGVyKHRoaXMucHJvZ3JhbSwgZ2wuQUNUSVZFX0FUVFJJQlVURVMpO1xuXHRcdGlmICghbGVuKSAvL251bGwgb3IgemVyb1xuXHRcdFx0cmV0dXJuO1x0XG5cblx0XHRmb3IgKHZhciBpPTA7IGk8bGVuOyBpKyspIHtcblx0XHRcdHZhciBpbmZvID0gZ2wuZ2V0QWN0aXZlQXR0cmliKHRoaXMucHJvZ3JhbSwgaSk7XG5cdFx0XHRpZiAoaW5mbyA9PT0gbnVsbCkgXG5cdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0dmFyIG5hbWUgPSBpbmZvLm5hbWU7XG5cblx0XHRcdC8vdGhlIGF0dHJpYiBsb2NhdGlvbiBpcyBhIHNpbXBsZSBpbmRleFxuXHRcdFx0dmFyIGxvY2F0aW9uID0gZ2wuZ2V0QXR0cmliTG9jYXRpb24odGhpcy5wcm9ncmFtLCBuYW1lKTtcblx0XHRcdFxuXHRcdFx0dGhpcy5hdHRyaWJ1dGVDYWNoZVtuYW1lXSA9IHtcblx0XHRcdFx0c2l6ZTogaW5mby5zaXplLFxuXHRcdFx0XHR0eXBlOiBpbmZvLnR5cGUsXG5cdFx0XHRcdGxvY2F0aW9uOiBsb2NhdGlvblxuXHRcdFx0fTtcblx0XHR9XG5cdH0sXG5cblx0X2xvYWRTaGFkZXI6IGZ1bmN0aW9uKHR5cGUsIHNvdXJjZSkge1xuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cblx0XHR2YXIgc2hhZGVyID0gZ2wuY3JlYXRlU2hhZGVyKHR5cGUpO1xuXHRcdGlmICghc2hhZGVyKSAvL3Nob3VsZCBub3Qgb2NjdXIuLi5cblx0XHRcdHJldHVybiAtMTtcblxuXHRcdGdsLnNoYWRlclNvdXJjZShzaGFkZXIsIHNvdXJjZSk7XG5cdFx0Z2wuY29tcGlsZVNoYWRlcihzaGFkZXIpO1xuXHRcdFxuXHRcdHZhciBsb2dSZXN1bHQgPSBnbC5nZXRTaGFkZXJJbmZvTG9nKHNoYWRlcikgfHwgXCJcIjtcblx0XHRpZiAobG9nUmVzdWx0KSB7XG5cdFx0XHQvL3dlIGRvIHRoaXMgc28gdGhlIHVzZXIga25vd3Mgd2hpY2ggc2hhZGVyIGhhcyB0aGUgZXJyb3Jcblx0XHRcdHZhciB0eXBlU3RyID0gKHR5cGUgPT09IGdsLlZFUlRFWF9TSEFERVIpID8gXCJ2ZXJ0ZXhcIiA6IFwiZnJhZ21lbnRcIjtcblx0XHRcdGxvZ1Jlc3VsdCA9IFwiRXJyb3IgY29tcGlsaW5nIFwiKyB0eXBlU3RyKyBcIiBzaGFkZXI6XFxuXCIrbG9nUmVzdWx0O1xuXHRcdH1cblxuXHRcdHRoaXMubG9nICs9IGxvZ1Jlc3VsdDtcblxuXHRcdGlmICghZ2wuZ2V0U2hhZGVyUGFyYW1ldGVyKHNoYWRlciwgZ2wuQ09NUElMRV9TVEFUVVMpICkge1xuXHRcdFx0dGhyb3cgdGhpcy5sb2c7XG5cdFx0fVxuXHRcdHJldHVybiBzaGFkZXI7XG5cdH0sXG5cblx0LyoqXG5cdCAqIENhbGxlZCB0byBiaW5kIHRoaXMgc2hhZGVyLiBOb3RlIHRoYXQgdGhlcmUgaXMgbm8gXCJ1bmJpbmRcIiBzaW5jZVxuXHQgKiB0ZWNobmljYWxseSBzdWNoIGEgdGhpbmcgaXMgbm90IHBvc3NpYmxlIGluIHRoZSBwcm9ncmFtbWFibGUgcGlwZWxpbmUuXG5cdCAqXG5cdCAqIFlvdSBtdXN0IGJpbmQgYSBzaGFkZXIgYmVmb3JlIHNldHRpbmdzIGl0cyB1bmlmb3Jtcy5cblx0ICogXG5cdCAqIEBtZXRob2QgYmluZFxuXHQgKi9cblx0YmluZDogZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5nbC51c2VQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG5cdH0sXG5cblxuXHQvKipcblx0ICogRGVzdHJveXMgdGhpcyBzaGFkZXIgYW5kIGl0cyByZXNvdXJjZXMuIFlvdSBzaG91bGQgbm90IHRyeSB0byB1c2UgdGhpc1xuXHQgKiBhZnRlciBkZXN0cm95aW5nIGl0LlxuXHQgKiBAbWV0aG9kICBkZXN0cm95XG5cdCAqL1xuXHRkZXN0cm95OiBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5jb250ZXh0KVxuXHRcdFx0dGhpcy5jb250ZXh0LnJlbW92ZU1hbmFnZWRPYmplY3QodGhpcyk7XG5cblx0XHRpZiAodGhpcy5nbCkge1xuXHRcdFx0dmFyIGdsID0gdGhpcy5nbDtcblx0XHRcdGdsLmRldGFjaFNoYWRlcih0aGlzLnZlcnRTaGFkZXIpO1xuXHRcdFx0Z2wuZGV0YWNoU2hhZGVyKHRoaXMuZnJhZ1NoYWRlcik7XG5cblx0XHRcdGdsLmRlbGV0ZVNoYWRlcih0aGlzLnZlcnRTaGFkZXIpO1xuXHRcdFx0Z2wuZGVsZXRlU2hhZGVyKHRoaXMuZnJhZ1NoYWRlcik7XG5cdFx0XHRnbC5kZWxldGVQcm9ncmFtKHRoaXMucHJvZ3JhbSk7XG5cdFx0fVxuXHRcdHRoaXMuYXR0cmlidXRlQ2FjaGUgPSBudWxsO1xuXHRcdHRoaXMudW5pZm9ybUNhY2hlID0gbnVsbDtcblx0XHR0aGlzLnZlcnRTaGFkZXIgPSBudWxsO1xuXHRcdHRoaXMuZnJhZ1NoYWRlciA9IG51bGw7XG5cdFx0dGhpcy5wcm9ncmFtID0gbnVsbDtcblx0XHR0aGlzLmdsID0gbnVsbDtcblx0XHR0aGlzLmNvbnRleHQgPSBudWxsO1xuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGNhY2hlZCB1bmlmb3JtIGluZm8gKHNpemUsIHR5cGUsIGxvY2F0aW9uKS5cblx0ICogSWYgdGhlIHVuaWZvcm0gaXMgbm90IGZvdW5kIGluIHRoZSBjYWNoZSwgaXQgaXMgYXNzdW1lZFxuXHQgKiB0byBub3QgZXhpc3QsIGFuZCB0aGlzIG1ldGhvZCByZXR1cm5zIG51bGwuXG5cdCAqXG5cdCAqIFRoaXMgbWF5IHJldHVybiBudWxsIGV2ZW4gaWYgdGhlIHVuaWZvcm0gaXMgZGVmaW5lZCBpbiBHTFNMOlxuXHQgKiBpZiBpdCBpcyBfaW5hY3RpdmVfIChpLmUuIG5vdCB1c2VkIGluIHRoZSBwcm9ncmFtKSB0aGVuIGl0IG1heVxuXHQgKiBiZSBvcHRpbWl6ZWQgb3V0LlxuXHQgKlxuXHQgKiBAbWV0aG9kICBnZXRVbmlmb3JtSW5mb1xuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgdGhlIHVuaWZvcm0gbmFtZSBhcyBkZWZpbmVkIGluIEdMU0xcblx0ICogQHJldHVybiB7T2JqZWN0fSBhbiBvYmplY3QgY29udGFpbmluZyBsb2NhdGlvbiwgc2l6ZSwgYW5kIHR5cGVcblx0ICovXG5cdGdldFVuaWZvcm1JbmZvOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0cmV0dXJuIHRoaXMudW5pZm9ybUNhY2hlW25hbWVdIHx8IG51bGw7IFxuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBjYWNoZWQgYXR0cmlidXRlIGluZm8gKHNpemUsIHR5cGUsIGxvY2F0aW9uKS5cblx0ICogSWYgdGhlIGF0dHJpYnV0ZSBpcyBub3QgZm91bmQgaW4gdGhlIGNhY2hlLCBpdCBpcyBhc3N1bWVkXG5cdCAqIHRvIG5vdCBleGlzdCwgYW5kIHRoaXMgbWV0aG9kIHJldHVybnMgbnVsbC5cblx0ICpcblx0ICogVGhpcyBtYXkgcmV0dXJuIG51bGwgZXZlbiBpZiB0aGUgYXR0cmlidXRlIGlzIGRlZmluZWQgaW4gR0xTTDpcblx0ICogaWYgaXQgaXMgX2luYWN0aXZlXyAoaS5lLiBub3QgdXNlZCBpbiB0aGUgcHJvZ3JhbSBvciBkaXNhYmxlZCkgXG5cdCAqIHRoZW4gaXQgbWF5IGJlIG9wdGltaXplZCBvdXQuXG5cdCAqXG5cdCAqIEBtZXRob2QgIGdldEF0dHJpYnV0ZUluZm9cblx0ICogQHBhcmFtICB7U3RyaW5nfSBuYW1lIHRoZSBhdHRyaWJ1dGUgbmFtZSBhcyBkZWZpbmVkIGluIEdMU0xcblx0ICogQHJldHVybiB7b2JqZWN0fSBhbiBvYmplY3QgY29udGFpbmluZyBsb2NhdGlvbiwgc2l6ZSBhbmQgdHlwZVxuXHQgKi9cblx0Z2V0QXR0cmlidXRlSW5mbzogZnVuY3Rpb24obmFtZSkge1xuXHRcdHJldHVybiB0aGlzLmF0dHJpYnV0ZUNhY2hlW25hbWVdIHx8IG51bGw7IFxuXHR9LFxuXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIGNhY2hlZCB1bmlmb3JtIGxvY2F0aW9uIG9iamVjdC5cblx0ICogSWYgdGhlIHVuaWZvcm0gaXMgbm90IGZvdW5kLCB0aGlzIG1ldGhvZCByZXR1cm5zIG51bGwuXG5cdCAqXG5cdCAqIEBtZXRob2QgIGdldEF0dHJpYnV0ZUxvY2F0aW9uXG5cdCAqIEBwYXJhbSAge1N0cmluZ30gbmFtZSB0aGUgdW5pZm9ybSBuYW1lIGFzIGRlZmluZWQgaW4gR0xTTFxuXHQgKiBAcmV0dXJuIHtHTGludH0gdGhlIGxvY2F0aW9uIG9iamVjdFxuXHQgKi9cblx0Z2V0QXR0cmlidXRlTG9jYXRpb246IGZ1bmN0aW9uKG5hbWUpIHsgLy9UT0RPOiBtYWtlIGZhc3RlciwgZG9uJ3QgY2FjaGVcblx0XHR2YXIgaW5mbyA9IHRoaXMuZ2V0QXR0cmlidXRlSW5mbyhuYW1lKTtcblx0XHRyZXR1cm4gaW5mbyA/IGluZm8ubG9jYXRpb24gOiBudWxsO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSBjYWNoZWQgdW5pZm9ybSBsb2NhdGlvbiBvYmplY3QsIGFzc3VtaW5nIGl0IGV4aXN0c1xuXHQgKiBhbmQgaXMgYWN0aXZlLiBOb3RlIHRoYXQgdW5pZm9ybXMgbWF5IGJlIGluYWN0aXZlIGlmIFxuXHQgKiB0aGUgR0xTTCBjb21waWxlciBkZWVtZWQgdGhlbSB1bnVzZWQuXG5cdCAqXG5cdCAqIEBtZXRob2QgIGdldFVuaWZvcm1Mb2NhdGlvblxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgdGhlIHVuaWZvcm0gbmFtZSBhcyBkZWZpbmVkIGluIEdMU0xcblx0ICogQHJldHVybiB7V2ViR0xVbmlmb3JtTG9jYXRpb259IHRoZSBsb2NhdGlvbiBvYmplY3Rcblx0ICovXG5cdGdldFVuaWZvcm1Mb2NhdGlvbjogZnVuY3Rpb24obmFtZSkge1xuXHRcdHZhciBpbmZvID0gdGhpcy5nZXRVbmlmb3JtSW5mbyhuYW1lKTtcblx0XHRyZXR1cm4gaW5mbyA/IGluZm8ubG9jYXRpb24gOiBudWxsO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRydWUgaWYgdGhlIHVuaWZvcm0gaXMgYWN0aXZlIGFuZCBmb3VuZCBpbiB0aGlzXG5cdCAqIGNvbXBpbGVkIHByb2dyYW0uIE5vdGUgdGhhdCB1bmlmb3JtcyBtYXkgYmUgaW5hY3RpdmUgaWYgXG5cdCAqIHRoZSBHTFNMIGNvbXBpbGVyIGRlZW1lZCB0aGVtIHVudXNlZC5cblx0ICpcblx0ICogQG1ldGhvZCAgaGFzVW5pZm9ybVxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9ICBuYW1lIHRoZSB1bmlmb3JtIG5hbWVcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGUgdW5pZm9ybSBpcyBmb3VuZCBhbmQgYWN0aXZlXG5cdCAqL1xuXHRoYXNVbmlmb3JtOiBmdW5jdGlvbihuYW1lKSB7XG5cdFx0cmV0dXJuIHRoaXMuZ2V0VW5pZm9ybUluZm8obmFtZSkgIT09IG51bGw7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdHJ1ZSBpZiB0aGUgYXR0cmlidXRlIGlzIGFjdGl2ZSBhbmQgZm91bmQgaW4gdGhpc1xuXHQgKiBjb21waWxlZCBwcm9ncmFtLlxuXHQgKlxuXHQgKiBAbWV0aG9kICBoYXNBdHRyaWJ1dGVcblx0ICogQHBhcmFtICB7U3RyaW5nfSAgbmFtZSB0aGUgYXR0cmlidXRlIG5hbWVcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gdHJ1ZSBpZiB0aGUgYXR0cmlidXRlIGlzIGZvdW5kIGFuZCBhY3RpdmVcblx0ICovXG5cdGhhc0F0dHJpYnV0ZTogZnVuY3Rpb24obmFtZSkge1xuXHRcdHJldHVybiB0aGlzLmdldEF0dHJpYnV0ZUluZm8obmFtZSkgIT09IG51bGw7XG5cdH0sXG5cblx0LyoqXG5cdCAqIFJldHVybnMgdGhlIHVuaWZvcm0gdmFsdWUgYnkgbmFtZS5cblx0ICpcblx0ICogQG1ldGhvZCAgZ2V0VW5pZm9ybVxuXHQgKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgdGhlIHVuaWZvcm0gbmFtZSBhcyBkZWZpbmVkIGluIEdMU0xcblx0ICogQHJldHVybiB7YW55fSBUaGUgdmFsdWUgb2YgdGhlIFdlYkdMIHVuaWZvcm1cblx0ICovXG5cdGdldFVuaWZvcm06IGZ1bmN0aW9uKG5hbWUpIHtcblx0XHRyZXR1cm4gdGhpcy5nbC5nZXRVbmlmb3JtKHRoaXMucHJvZ3JhbSwgdGhpcy5nZXRVbmlmb3JtTG9jYXRpb24obmFtZSkpO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiBSZXR1cm5zIHRoZSB1bmlmb3JtIHZhbHVlIGF0IHRoZSBzcGVjaWZpZWQgV2ViR0xVbmlmb3JtTG9jYXRpb24uXG5cdCAqXG5cdCAqIEBtZXRob2QgIGdldFVuaWZvcm1BdFxuXHQgKiBAcGFyYW0gIHtXZWJHTFVuaWZvcm1Mb2NhdGlvbn0gbG9jYXRpb24gdGhlIGxvY2F0aW9uIG9iamVjdFxuXHQgKiBAcmV0dXJuIHthbnl9IFRoZSB2YWx1ZSBvZiB0aGUgV2ViR0wgdW5pZm9ybVxuXHQgKi9cblx0Z2V0VW5pZm9ybUF0OiBmdW5jdGlvbihsb2NhdGlvbikge1xuXHRcdHJldHVybiB0aGlzLmdsLmdldFVuaWZvcm0odGhpcy5wcm9ncmFtLCBsb2NhdGlvbik7XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgY29udmVuaWVuY2UgbWV0aG9kIHRvIHNldCB1bmlmb3JtaSBmcm9tIHRoZSBnaXZlbiBhcmd1bWVudHMuXG5cdCAqIFdlIGRldGVybWluZSB3aGljaCBHTCBjYWxsIHRvIG1ha2UgYmFzZWQgb24gdGhlIG51bWJlciBvZiBhcmd1bWVudHNcblx0ICogcGFzc2VkLiBGb3IgZXhhbXBsZSwgYHNldFVuaWZvcm1pKFwidmFyXCIsIDAsIDEpYCBtYXBzIHRvIGBnbC51bmlmb3JtMmlgLlxuXHQgKiBcblx0ICogQG1ldGhvZCAgc2V0VW5pZm9ybWlcblx0ICogQHBhcmFtIHtTdHJpbmd9IG5hbWUgICAgICAgIFx0XHR0aGUgbmFtZSBvZiB0aGUgdW5pZm9ybVxuXHQgKiBAcGFyYW0ge0dMaW50fSB4ICB0aGUgeCBjb21wb25lbnQgZm9yIGludHNcblx0ICogQHBhcmFtIHtHTGludH0geSAgdGhlIHkgY29tcG9uZW50IGZvciBpdmVjMlxuXHQgKiBAcGFyYW0ge0dMaW50fSB6ICB0aGUgeiBjb21wb25lbnQgZm9yIGl2ZWMzXG5cdCAqIEBwYXJhbSB7R0xpbnR9IHcgIHRoZSB3IGNvbXBvbmVudCBmb3IgaXZlYzRcblx0ICovXG5cdHNldFVuaWZvcm1pOiBmdW5jdGlvbihuYW1lLCB4LCB5LCB6LCB3KSB7XG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblx0XHR2YXIgbG9jID0gdGhpcy5nZXRVbmlmb3JtTG9jYXRpb24obmFtZSk7XG5cdFx0aWYgKCFsb2MpIFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdFx0Y2FzZSAyOiBnbC51bmlmb3JtMWkobG9jLCB4KTsgcmV0dXJuIHRydWU7XG5cdFx0XHRjYXNlIDM6IGdsLnVuaWZvcm0yaShsb2MsIHgsIHkpOyByZXR1cm4gdHJ1ZTtcblx0XHRcdGNhc2UgNDogZ2wudW5pZm9ybTNpKGxvYywgeCwgeSwgeik7IHJldHVybiB0cnVlO1xuXHRcdFx0Y2FzZSA1OiBnbC51bmlmb3JtNGkobG9jLCB4LCB5LCB6LCB3KTsgcmV0dXJuIHRydWU7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBcImludmFsaWQgYXJndW1lbnRzIHRvIHNldFVuaWZvcm1pXCI7IFxuXHRcdH1cblx0fSxcblxuXHQvKipcblx0ICogQSBjb252ZW5pZW5jZSBtZXRob2QgdG8gc2V0IHVuaWZvcm1mIGZyb20gdGhlIGdpdmVuIGFyZ3VtZW50cy5cblx0ICogV2UgZGV0ZXJtaW5lIHdoaWNoIEdMIGNhbGwgdG8gbWFrZSBiYXNlZCBvbiB0aGUgbnVtYmVyIG9mIGFyZ3VtZW50c1xuXHQgKiBwYXNzZWQuIEZvciBleGFtcGxlLCBgc2V0VW5pZm9ybWYoXCJ2YXJcIiwgMCwgMSlgIG1hcHMgdG8gYGdsLnVuaWZvcm0yZmAuXG5cdCAqIFxuXHQgKiBAbWV0aG9kICBzZXRVbmlmb3JtZlxuXHQgKiBAcGFyYW0ge1N0cmluZ30gbmFtZSAgICAgICAgXHRcdHRoZSBuYW1lIG9mIHRoZSB1bmlmb3JtXG5cdCAqIEBwYXJhbSB7R0xmbG9hdH0geCAgdGhlIHggY29tcG9uZW50IGZvciBmbG9hdHNcblx0ICogQHBhcmFtIHtHTGZsb2F0fSB5ICB0aGUgeSBjb21wb25lbnQgZm9yIHZlYzJcblx0ICogQHBhcmFtIHtHTGZsb2F0fSB6ICB0aGUgeiBjb21wb25lbnQgZm9yIHZlYzNcblx0ICogQHBhcmFtIHtHTGZsb2F0fSB3ICB0aGUgdyBjb21wb25lbnQgZm9yIHZlYzRcblx0ICovXG5cdHNldFVuaWZvcm1mOiBmdW5jdGlvbihuYW1lLCB4LCB5LCB6LCB3KSB7XG5cdFx0dmFyIGdsID0gdGhpcy5nbDtcblx0XHR2YXIgbG9jID0gdGhpcy5nZXRVbmlmb3JtTG9jYXRpb24obmFtZSk7XG5cdFx0aWYgKCFsb2MpIFxuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdHN3aXRjaCAoYXJndW1lbnRzLmxlbmd0aCkge1xuXHRcdFx0Y2FzZSAyOiBnbC51bmlmb3JtMWYobG9jLCB4KTsgcmV0dXJuIHRydWU7XG5cdFx0XHRjYXNlIDM6IGdsLnVuaWZvcm0yZihsb2MsIHgsIHkpOyByZXR1cm4gdHJ1ZTtcblx0XHRcdGNhc2UgNDogZ2wudW5pZm9ybTNmKGxvYywgeCwgeSwgeik7IHJldHVybiB0cnVlO1xuXHRcdFx0Y2FzZSA1OiBnbC51bmlmb3JtNGYobG9jLCB4LCB5LCB6LCB3KTsgcmV0dXJuIHRydWU7XG5cdFx0XHRkZWZhdWx0OlxuXHRcdFx0XHR0aHJvdyBcImludmFsaWQgYXJndW1lbnRzIHRvIHNldFVuaWZvcm1mXCI7IFxuXHRcdH1cblx0fSxcblxuXHQvL0kgZ3Vlc3Mgd2Ugd29uJ3Qgc3VwcG9ydCBzZXF1ZW5jZTxHTGZsb2F0PiAuLiB3aGF0ZXZlciB0aGF0IGlzID8/XG5cdFxuXG5cdC8vLy8vIFxuXHRcblx0LyoqXG5cdCAqIEEgY29udmVuaWVuY2UgbWV0aG9kIHRvIHNldCB1bmlmb3JtTmZ2IGZyb20gdGhlIGdpdmVuIEFycmF5QnVmZmVyLlxuXHQgKiBXZSBkZXRlcm1pbmUgd2hpY2ggR0wgY2FsbCB0byBtYWtlIGJhc2VkIG9uIHRoZSBsZW5ndGggb2YgdGhlIGFycmF5IFxuXHQgKiBidWZmZXIgKGZvciAxLTQgY29tcG9uZW50IHZlY3RvcnMgc3RvcmVkIGluIGEgRmxvYXQzMkFycmF5KS4gVG8gdXNlXG5cdCAqIHRoaXMgbWV0aG9kIHRvIHVwbG9hZCBkYXRhIHRvIHVuaWZvcm0gYXJyYXlzLCB5b3UgbmVlZCB0byBzcGVjaWZ5IHRoZVxuXHQgKiAnY291bnQnIHBhcmFtZXRlcjsgaS5lLiB0aGUgZGF0YSB0eXBlIHlvdSBhcmUgdXNpbmcgZm9yIHRoYXQgYXJyYXkuIElmXG5cdCAqIHNwZWNpZmllZCwgdGhpcyB3aWxsIGRpY3RhdGUgd2hldGhlciB0byBjYWxsIHVuaWZvcm0xZnYsIHVuaWZvcm0yZnYsIGV0Yy5cblx0ICpcblx0ICogQG1ldGhvZCAgc2V0VW5pZm9ybWZ2XG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lICAgICAgICBcdFx0dGhlIG5hbWUgb2YgdGhlIHVuaWZvcm1cblx0ICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYXJyYXlCdWZmZXIgdGhlIGFycmF5IGJ1ZmZlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gY291bnQgICAgICAgICAgICBvcHRpb25hbCwgdGhlIGV4cGxpY2l0IGRhdGEgdHlwZSBjb3VudCwgZS5nLiAyIGZvciB2ZWMyXG5cdCAqL1xuXHRzZXRVbmlmb3JtZnY6IGZ1bmN0aW9uKG5hbWUsIGFycmF5QnVmZmVyLCBjb3VudCkge1xuXHRcdGNvdW50ID0gY291bnQgfHwgYXJyYXlCdWZmZXIubGVuZ3RoO1xuXHRcdHZhciBnbCA9IHRoaXMuZ2w7XG5cdFx0dmFyIGxvYyA9IHRoaXMuZ2V0VW5pZm9ybUxvY2F0aW9uKG5hbWUpO1xuXHRcdGlmICghbG9jKSBcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRzd2l0Y2ggKGNvdW50KSB7XG5cdFx0XHRjYXNlIDE6IGdsLnVuaWZvcm0xZnYobG9jLCBhcnJheUJ1ZmZlcik7IHJldHVybiB0cnVlO1xuXHRcdFx0Y2FzZSAyOiBnbC51bmlmb3JtMmZ2KGxvYywgYXJyYXlCdWZmZXIpOyByZXR1cm4gdHJ1ZTtcblx0XHRcdGNhc2UgMzogZ2wudW5pZm9ybTNmdihsb2MsIGFycmF5QnVmZmVyKTsgcmV0dXJuIHRydWU7XG5cdFx0XHRjYXNlIDQ6IGdsLnVuaWZvcm00ZnYobG9jLCBhcnJheUJ1ZmZlcik7IHJldHVybiB0cnVlO1xuXHRcdFx0ZGVmYXVsdDpcblx0XHRcdFx0dGhyb3cgXCJpbnZhbGlkIGFyZ3VtZW50cyB0byBzZXRVbmlmb3JtZlwiOyBcblx0XHR9XG5cdH0sXG5cblx0LyoqXG5cdCAqIEEgY29udmVuaWVuY2UgbWV0aG9kIHRvIHNldCB1bmlmb3JtTml2IGZyb20gdGhlIGdpdmVuIEFycmF5QnVmZmVyLlxuXHQgKiBXZSBkZXRlcm1pbmUgd2hpY2ggR0wgY2FsbCB0byBtYWtlIGJhc2VkIG9uIHRoZSBsZW5ndGggb2YgdGhlIGFycmF5IFxuXHQgKiBidWZmZXIgKGZvciAxLTQgY29tcG9uZW50IHZlY3RvcnMgc3RvcmVkIGluIGEgaW50IGFycmF5KS4gVG8gdXNlXG5cdCAqIHRoaXMgbWV0aG9kIHRvIHVwbG9hZCBkYXRhIHRvIHVuaWZvcm0gYXJyYXlzLCB5b3UgbmVlZCB0byBzcGVjaWZ5IHRoZVxuXHQgKiAnY291bnQnIHBhcmFtZXRlcjsgaS5lLiB0aGUgZGF0YSB0eXBlIHlvdSBhcmUgdXNpbmcgZm9yIHRoYXQgYXJyYXkuIElmXG5cdCAqIHNwZWNpZmllZCwgdGhpcyB3aWxsIGRpY3RhdGUgd2hldGhlciB0byBjYWxsIHVuaWZvcm0xZnYsIHVuaWZvcm0yZnYsIGV0Yy5cblx0ICpcblx0ICogQG1ldGhvZCAgc2V0VW5pZm9ybWl2XG5cdCAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lICAgICAgICBcdFx0dGhlIG5hbWUgb2YgdGhlIHVuaWZvcm1cblx0ICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gYXJyYXlCdWZmZXIgdGhlIGFycmF5IGJ1ZmZlclxuXHQgKiBAcGFyYW0ge051bWJlcn0gY291bnQgICAgICAgICAgICBvcHRpb25hbCwgdGhlIGV4cGxpY2l0IGRhdGEgdHlwZSBjb3VudCwgZS5nLiAyIGZvciBpdmVjMlxuXHQgKi9cblx0c2V0VW5pZm9ybWl2OiBmdW5jdGlvbihuYW1lLCBhcnJheUJ1ZmZlciwgY291bnQpIHtcblx0XHRjb3VudCA9IGNvdW50IHx8IGFycmF5QnVmZmVyLmxlbmd0aDtcblx0XHR2YXIgZ2wgPSB0aGlzLmdsO1xuXHRcdHZhciBsb2MgPSB0aGlzLmdldFVuaWZvcm1Mb2NhdGlvbihuYW1lKTtcblx0XHRpZiAoIWxvYykgXG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0c3dpdGNoIChjb3VudCkge1xuXHRcdFx0Y2FzZSAxOiBnbC51bmlmb3JtMWl2KGxvYywgYXJyYXlCdWZmZXIpOyByZXR1cm4gdHJ1ZTtcblx0XHRcdGNhc2UgMjogZ2wudW5pZm9ybTJpdihsb2MsIGFycmF5QnVmZmVyKTsgcmV0dXJuIHRydWU7XG5cdFx0XHRjYXNlIDM6IGdsLnVuaWZvcm0zaXYobG9jLCBhcnJheUJ1ZmZlcik7IHJldHVybiB0cnVlO1xuXHRcdFx0Y2FzZSA0OiBnbC51bmlmb3JtNGl2KGxvYywgYXJyYXlCdWZmZXIpOyByZXR1cm4gdHJ1ZTtcblx0XHRcdGRlZmF1bHQ6XG5cdFx0XHRcdHRocm93IFwiaW52YWxpZCBhcmd1bWVudHMgdG8gc2V0VW5pZm9ybWZcIjsgXG5cdFx0fVxuXHR9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaGFkZXJQcm9ncmFtOyIsIi8qKlxuICBBdXRvLWdlbmVyYXRlZCBLYW1pIGluZGV4IGZpbGUuXG4gIENyZWF0ZWQgb24gMjAxMy0xMi0yMy5cbiovXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvL2NvcmUgY2xhc3Nlc1xuICAgICdCYXNlQmF0Y2gnOiAgICAgICByZXF1aXJlKCcuL0Jhc2VCYXRjaC5qcycpLFxuICAgICdTcHJpdGVCYXRjaCc6ICAgICByZXF1aXJlKCcuL1Nwcml0ZUJhdGNoLmpzJyksXG4gICAgJ1RleHR1cmUnOiAgICAgICAgIHJlcXVpcmUoJy4vVGV4dHVyZS5qcycpLFxuICAgICdUZXh0dXJlUmVnaW9uJzogICByZXF1aXJlKCcuL1RleHR1cmVSZWdpb24uanMnKSxcbiAgICAnV2ViR0xDb250ZXh0JzogICAgcmVxdWlyZSgnLi9XZWJHTENvbnRleHQuanMnKSxcbiAgICAnRnJhbWVCdWZmZXInOiAgICAgcmVxdWlyZSgnLi9nbHV0aWxzL0ZyYW1lQnVmZmVyLmpzJyksXG4gICAgJ01lc2gnOiAgICAgICAgICAgIHJlcXVpcmUoJy4vZ2x1dGlscy9NZXNoLmpzJyksXG4gICAgJ1NoYWRlclByb2dyYW0nOiAgIHJlcXVpcmUoJy4vZ2x1dGlscy9TaGFkZXJQcm9ncmFtLmpzJylcbn07IiwidmFyIGludDggPSBuZXcgSW50OEFycmF5KDQpO1xudmFyIGludDMyID0gbmV3IEludDMyQXJyYXkoaW50OC5idWZmZXIsIDAsIDEpO1xudmFyIGZsb2F0MzIgPSBuZXcgRmxvYXQzMkFycmF5KGludDguYnVmZmVyLCAwLCAxKTtcblxuLyoqXG4gKiBBIHNpbmdsZXRvbiBmb3IgbnVtYmVyIHV0aWxpdGllcy4gXG4gKiBAY2xhc3MgTnVtYmVyVXRpbFxuICovXG52YXIgTnVtYmVyVXRpbCA9IGZ1bmN0aW9uKCkge1xuXG59O1xuXG5cbi8qKlxuICogUmV0dXJucyBhIGZsb2F0IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBpbnQgYml0cy4gQXJyYXlCdWZmZXJcbiAqIGlzIHVzZWQgZm9yIHRoZSBjb252ZXJzaW9uLlxuICpcbiAqIEBtZXRob2QgIGludEJpdHNUb0Zsb2F0XG4gKiBAc3RhdGljXG4gKiBAcGFyYW0gIHtOdW1iZXJ9IGkgdGhlIGludCB0byBjYXN0XG4gKiBAcmV0dXJuIHtOdW1iZXJ9ICAgdGhlIGZsb2F0XG4gKi9cbk51bWJlclV0aWwuaW50Qml0c1RvRmxvYXQgPSBmdW5jdGlvbihpKSB7XG5cdGludDMyWzBdID0gaTtcblx0cmV0dXJuIGZsb2F0MzJbMF07XG59O1xuXG4vKipcbiAqIFJldHVybnMgdGhlIGludCBiaXRzIGZyb20gdGhlIGdpdmVuIGZsb2F0LiBBcnJheUJ1ZmZlciBpcyB1c2VkXG4gKiBmb3IgdGhlIGNvbnZlcnNpb24uXG4gKlxuICogQG1ldGhvZCAgZmxvYXRUb0ludEJpdHNcbiAqIEBzdGF0aWNcbiAqIEBwYXJhbSAge051bWJlcn0gZiB0aGUgZmxvYXQgdG8gY2FzdFxuICogQHJldHVybiB7TnVtYmVyfSAgIHRoZSBpbnQgYml0c1xuICovXG5OdW1iZXJVdGlsLmZsb2F0VG9JbnRCaXRzID0gZnVuY3Rpb24oZikge1xuXHRmbG9hdDMyWzBdID0gZjtcblx0cmV0dXJuIGludDMyWzBdO1xufTtcblxuLyoqXG4gKiBFbmNvZGVzIEFCR1IgaW50IGFzIGEgZmxvYXQsIHdpdGggc2xpZ2h0IHByZWNpc2lvbiBsb3NzLlxuICpcbiAqIEBtZXRob2QgIGludFRvRmxvYXRDb2xvclxuICogQHN0YXRpY1xuICogQHBhcmFtIHtOdW1iZXJ9IHZhbHVlIGFuIEFCR1IgcGFja2VkIGludGVnZXJcbiAqL1xuTnVtYmVyVXRpbC5pbnRUb0Zsb2F0Q29sb3IgPSBmdW5jdGlvbih2YWx1ZSkge1xuXHRyZXR1cm4gTnVtYmVyVXRpbC5pbnRCaXRzVG9GbG9hdCggdmFsdWUgJiAweGZlZmZmZmZmICk7XG59O1xuXG4vKipcbiAqIFJldHVybnMgYSBmbG9hdCBlbmNvZGVkIEFCR1IgdmFsdWUgZnJvbSB0aGUgZ2l2ZW4gUkdCQVxuICogYnl0ZXMgKDAgLSAyNTUpLiBVc2VmdWwgZm9yIHNhdmluZyBiYW5kd2lkdGggaW4gdmVydGV4IGRhdGEuXG4gKlxuICogQG1ldGhvZCAgY29sb3JUb0Zsb2F0XG4gKiBAc3RhdGljXG4gKiBAcGFyYW0ge051bWJlcn0gciB0aGUgUmVkIGJ5dGUgKDAgLSAyNTUpXG4gKiBAcGFyYW0ge051bWJlcn0gZyB0aGUgR3JlZW4gYnl0ZSAoMCAtIDI1NSlcbiAqIEBwYXJhbSB7TnVtYmVyfSBiIHRoZSBCbHVlIGJ5dGUgKDAgLSAyNTUpXG4gKiBAcGFyYW0ge051bWJlcn0gYSB0aGUgQWxwaGEgYnl0ZSAoMCAtIDI1NSlcbiAqIEByZXR1cm4ge0Zsb2F0MzJ9ICBhIEZsb2F0MzIgb2YgdGhlIFJHQkEgY29sb3JcbiAqL1xuTnVtYmVyVXRpbC5jb2xvclRvRmxvYXQgPSBmdW5jdGlvbihyLCBnLCBiLCBhKSB7XG5cdHZhciBiaXRzID0gKGEgPDwgMjQgfCBiIDw8IDE2IHwgZyA8PCA4IHwgcik7XG5cdHJldHVybiBOdW1iZXJVdGlsLmludFRvRmxvYXRDb2xvcihiaXRzKTtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBudW1iZXIgaXMgYSBwb3dlci1vZi10d28uXG4gKlxuICogQG1ldGhvZCAgaXNQb3dlck9mVHdvXG4gKiBAcGFyYW0gIHtOdW1iZXJ9ICBuIHRoZSBudW1iZXIgdG8gdGVzdFxuICogQHJldHVybiB7Qm9vbGVhbn0gICB0cnVlIGlmIHBvd2VyLW9mLXR3b1xuICovXG5OdW1iZXJVdGlsLmlzUG93ZXJPZlR3byA9IGZ1bmN0aW9uKG4pIHtcblx0cmV0dXJuIChuICYgKG4gLSAxKSkgPT0gMDtcbn07XG5cbi8qKlxuICogUmV0dXJucyB0aGUgbmV4dCBoaWdoZXN0IHBvd2VyLW9mLXR3byBmcm9tIHRoZSBzcGVjaWZpZWQgbnVtYmVyLiBcbiAqIFxuICogQHBhcmFtICB7TnVtYmVyfSBuIHRoZSBudW1iZXIgdG8gdGVzdFxuICogQHJldHVybiB7TnVtYmVyfSAgIHRoZSBuZXh0IGhpZ2hlc3QgcG93ZXIgb2YgdHdvXG4gKi9cbk51bWJlclV0aWwubmV4dFBvd2VyT2ZUd28gPSBmdW5jdGlvbihuKSB7XG5cdG4tLTtcblx0biB8PSBuID4+IDE7XG5cdG4gfD0gbiA+PiAyO1xuXHRuIHw9IG4gPj4gNDtcblx0biB8PSBuID4+IDg7XG5cdG4gfD0gbiA+PiAxNjtcblx0cmV0dXJuIG4rMTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gTnVtYmVyVXRpbDsiLCIvKlxuICogcmFmLmpzXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbmdyeW1hbi9yYWYuanNcbiAqXG4gKiBvcmlnaW5hbCByZXF1ZXN0QW5pbWF0aW9uRnJhbWUgcG9seWZpbGwgYnkgRXJpayBNw7ZsbGVyXG4gKiBpbnNwaXJlZCBmcm9tIHBhdWxfaXJpc2ggZ2lzdCBhbmQgcG9zdFxuICpcbiAqIENvcHlyaWdodCAoYykgMjAxMyBuZ3J5bWFuXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4gKi9cblxuKGZ1bmN0aW9uKHdpbmRvdykge1xuXHR2YXIgbGFzdFRpbWUgPSAwLFxuXHRcdHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXSxcblx0XHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lLFxuXHRcdGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lLFxuXHRcdGkgPSB2ZW5kb3JzLmxlbmd0aDtcblxuXHQvLyB0cnkgdG8gdW4tcHJlZml4IGV4aXN0aW5nIHJhZlxuXHR3aGlsZSAoLS1pID49IDAgJiYgIXJlcXVlc3RBbmltYXRpb25GcmFtZSkge1xuXHRcdHJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2ZW5kb3JzW2ldICsgJ1JlcXVlc3RBbmltYXRpb25GcmFtZSddO1xuXHRcdGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gd2luZG93W3ZlbmRvcnNbaV0gKyAnQ2FuY2VsQW5pbWF0aW9uRnJhbWUnXTtcblx0fVxuXG5cdC8vIHBvbHlmaWxsIHdpdGggc2V0VGltZW91dCBmYWxsYmFja1xuXHQvLyBoZWF2aWx5IGluc3BpcmVkIGZyb20gQGRhcml1cyBnaXN0IG1vZDogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vcGF1bGlyaXNoLzE1Nzk2NzEjY29tbWVudC04Mzc5NDVcblx0aWYgKCFyZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgIWNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XG5cdFx0cmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdHZhciBub3cgPSBEYXRlLm5vdygpLCBuZXh0VGltZSA9IE1hdGgubWF4KGxhc3RUaW1lICsgMTYsIG5vdyk7XG5cdFx0XHRyZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHtcblx0XHRcdFx0Y2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7XG5cdFx0XHR9LCBuZXh0VGltZSAtIG5vdyk7XG5cdFx0fTtcblxuXHRcdGNhbmNlbEFuaW1hdGlvbkZyYW1lID0gY2xlYXJUaW1lb3V0O1xuXHR9XG5cblx0Ly8gZXhwb3J0IHRvIHdpbmRvd1xuXHR3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gcmVxdWVzdEFuaW1hdGlvbkZyYW1lO1xuXHR3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBjYW5jZWxBbmltYXRpb25GcmFtZTtcbn0od2luZG93KSk7IiwidmFyIGRvbXJlYWR5ID0gcmVxdWlyZSgnZG9tcmVhZHknKTtcblxudmFyIFdlYkdMQ29udGV4dCA9IHJlcXVpcmUoJ2thbWknKS5XZWJHTENvbnRleHQ7XG52YXIgVGV4dHVyZSA9IHJlcXVpcmUoJ2thbWknKS5UZXh0dXJlO1xudmFyIFNwcml0ZUJhdGNoID0gcmVxdWlyZSgna2FtaScpLlNwcml0ZUJhdGNoO1xuXG4vL2luY2x1ZGUgdGhlIGthbWktc3BlY2lmaWMgQXNzZXRMb2FkZXJcbnZhciBBc3NldExvYWRlciA9IHJlcXVpcmUoJ2thbWktYXNzZXRzJyk7XG5cbi8vaW5jbHVkZSBwb2x5ZmlsbCBmb3IgcmVxdWVzdEFuaW1hdGlvbkZyYW1lXG5yZXF1aXJlKCdyYWYuanMnKTtcblxuZG9tcmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgLy9DcmVhdGUgYSBuZXcgV2ViR0wgY2FudmFzIHdpdGggdGhlIGdpdmVuIHNpemVcbiAgICB2YXIgY29udGV4dCA9IG5ldyBXZWJHTENvbnRleHQoMjU2LCAyNTYpO1xuXG4gICAgLy90aGUgJ3ZpZXcnIGlzIHRoZSBET00gY2FudmFzLCBzbyB3ZSBjYW4ganVzdCBhcHBlbmQgaXQgdG8gb3VyIGJvZHlcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKCBjb250ZXh0LnZpZXcgKTtcblxuICAgIC8vV2UgdXNlIFNwcml0ZUJhdGNoIHRvIGRyYXcgdGV4dHVyZXMgYXMgMkQgcXVhZHNcbiAgICB2YXIgYmF0Y2ggPSBuZXcgU3ByaXRlQmF0Y2goY29udGV4dCk7XG4gICAgXG4gICAgLy9wYXNzIHRoZSBjb250ZXh0IHRvIHRoZSBhc3NldCBsb2FkZXIgc28gaXQgY2FuIGJlIG1hbmFnZWQgY29ycmVjdGx5IFxuICAgIHZhciBhc3NldHMgPSBuZXcgQXNzZXRMb2FkZXIoY29udGV4dCk7XG4gICAgXG4gICAgLy9hZGQgc29tZSBET00gdGV4dFxuICAgIHZhciB0ZXh0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHRleHQpO1xuXG4gICAgLy9hZGQgc29tZSBsaXN0ZW5lcnMuLi5cbiAgICBhc3NldHMubG9hZFN0YXJ0ZWQuYWRkKGZ1bmN0aW9uKGV2KSB7XG4gICAgICAgIHRleHQuaW5uZXJIVE1MID0gXCJMb2FkIHN0YXJ0ZWRcIjtcbiAgICB9KTtcbiAgICBhc3NldHMubG9hZFByb2dyZXNzLmFkZChmdW5jdGlvbihldikge1xuICAgICAgICB0ZXh0LmlubmVySFRNTCA9IFwiUHJvZ3Jlc3M6IFwiK2V2LmN1cnJlbnQgKyBcIiAvIFwiICsgZXYudG90YWw7XG4gICAgfSk7XG4gICAgYXNzZXRzLmxvYWRGaW5pc2hlZC5hZGQoZnVuY3Rpb24oZXYpIHtcbiAgICAgICAgdGV4dC5pbm5lckhUTUwgPSBcIkxvYWQgZmluaXNoZWRcIjtcbiAgICB9KVxuXG4gICAgLy9UaGVzZSByZXR1cm4gYSBUZXh0dXJlIG9iamVjdFxuICAgIHZhciBzY2VuZSA9IGFzc2V0cy5hZGQoXCJpbWcvc2NlbmUucG5nXCIpO1xuICAgIHZhciBncmFzcyA9IGFzc2V0cy5hZGQoXCJpbWcvZ3Jhc3MucG5nXCIpO1xuICAgIHZhciBndXkgICA9IGFzc2V0cy5hZGQoXCJpbWcvZ3V5LnBuZ1wiKTtcbiAgICBncmFzcy5zZXRGaWx0ZXIoVGV4dHVyZS5GaWx0ZXIuTElORUFSKTtcbiAgICAvL21ha2UgdGhlIHF1ZXVlIGEgYml0IGxvbmdlci4uLlxuICAgIHZhciB0ZXggPSBuZXcgVGV4dHVyZShjb250ZXh0KTtcbiAgICBmb3IgKHZhciBpPTA7IGk8NTA7IGkrKykge1xuICAgICAgICAvL3dlIGNhbiBzcGVjaWZ5IGEga2V5LCBVUkwsIGFuZCByZXVzYWJsZSBUZXh0dXJlIG9iamVjdCB0byBhY3Qgb25cbiAgICAgICAgLy9XZSBzcGVjaWZ5IGEgZmlsZW5hbWUgc28gaXQgY2FuIGZpbmQgdGhlIGltYWdlIGxvYWRlciBlYXNpbHlcbiAgICAgICAgYXNzZXRzLmFkZChcImltZ1wiK2krXCIucG5nXCIsIFwiaW1nL2dyYXNzLnBuZ1wiLCB0ZXgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICAgICAgcmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgICAgIC8vZ2V0IHRoZSBHTCByZW5kZXJpbmcgY29udGV4dFxuICAgICAgICB2YXIgZ2wgPSBjb250ZXh0LmdsO1xuXG4gICAgICAgIC8vY2xlYXIgY2FudmFzIHdpdGggb3BhcXVlIGJsYWNrXG4gICAgICAgIGdsLmNsZWFyQ29sb3IoMCwwLDAsMSk7XG4gICAgICAgIGdsLmNsZWFyKGdsLkNPTE9SX0JVRkZFUl9CSVQpOyAgICAgICAgICAgIFxuXG4gICAgICAgIC8vdGhpcyB3aWxsIHN0YXJ0IGxvYWRpbmcgdGhlIG5leHQgdGFzayBvbiB0aGUgcXVldWUsXG4gICAgICAgIC8vYW5kIG9ubHkgcmV0dXJucyB0cnVlIG9uY2UgYWxsIGFzc2V0cyBoYXZlIGZpbmlzaGVkIGxvYWRpbmdcbiAgICAgICAgaWYgKCBhc3NldHMudXBkYXRlKCkgKSB7XG4gICAgICAgICAgICBiYXRjaC5iZWdpbigpO1xuICAgICAgICAgICAgYmF0Y2guZHJhdyhncmFzcywgMCwgMCk7XG4gICAgICAgICAgICBiYXRjaC5kcmF3KGd1eSwgMjUsIDI1LCBndXkud2lkdGgqMiwgZ3V5LmhlaWdodCoyKTtcbiAgICAgICAgICAgIGJhdGNoLmVuZCgpO1xuICAgICAgICB9IFxuICAgIH1cblxuICAgIC8vSGVyZSB3ZSBjYW4gc2ltdWxhdGUgY29udGV4dCBsb3NzIC8gcmVzdG9yZSBhbmQgaG93IGl0IHBsYXlzIHdpdGggQXNzZXRMb2FkZXJcbiAgICB2YXIgbG9zZUN0eCA9IGNvbnRleHQuZ2wuZ2V0RXh0ZW5zaW9uKFwiV0VCR0xfbG9zZV9jb250ZXh0XCIpO1xuICAgIGlmIChsb3NlQ3R4KSB7XG4gICAgICAgIHZhciBkZXNjID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgZGVzYy5pbm5lckhUTUwgPSBcIkNsaWNrIHRoZSBjYW52YXMgdG8gc2ltdWxhdGUgY29udGV4dCBsb3NzXCI7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoZGVzYyk7XG5cbiAgICAgICAgY29udGV4dC52aWV3LmFkZEV2ZW50TGlzdGVuZXIoXCJtb3VzZWRvd25cIiwgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsb3NlQ3R4Lmxvc2VDb250ZXh0KCk7XG4gICAgICAgICAgICBjb250ZXh0LnZpZXcuc3R5bGUudmlzaWJpbGl0eSA9IFwiaGlkZGVuXCI7XG4gICAgICAgICAgICB0ZXh0LnN0eWxlLnZpc2liaWxpdHkgPSBcImhpZGRlblwiO1xuXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGNvbnRleHQudmlldy5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgICAgICAgICAgICAgdGV4dC5zdHlsZS52aXNpYmlsaXR5ID0gXCJ2aXNpYmxlXCI7XG4gICAgICAgICAgICAgICAgbG9zZUN0eC5yZXN0b3JlQ29udGV4dCgpO1xuICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgIH0sIHRydWUpO1xuICAgIH1cblxuICAgIHJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xufSk7Il19
