sc_require('pouchdb-nightly.min');

// wrapper around some PouchDB
SC.PouchDB = SC.Object.extend({
  // API
  database: null,

  options: null,

  init: function(){
    var dbname = this.get('database');
    var opts = this.get('options');
    if(!dbname) throw new Error("SC.PouchDB#init: we need a database name.");
    this._database = new PouchDB(dbname, opts);
  },

  destroyDb: function(notifyMethod){
    PouchDB.destroy(this.database,this._createCallback(notifyMethod));
  },

  _perform: function(action, doc, options, notifyMethod){
    if(options && !notifyMethod && SC.typeOf(options) === SC.T_STRING){
      this._database[action](doc,this._createCallback(options));
    }
    else {
      this._database[action](doc,options,this._createCallback(notifyMethod));
    }
  },

  put: function(doc, options, notifyMethod){
    this._perform('put',doc,options,notifyMethod);
  },

  post: function(doc, options, notifyMethod){
    this._perform('post',doc,options,notifyMethod);
  },

  retrieve: function(doc,options, notifyMethod){
    this._perform('get',doc,options,notifyMethod);
  },

  remove: function(doc, options, notifyMethod){
    this._perform('remove', doc, options, notifyMethod);
  },

  bulkDocs: function(docs, options, notifyMethod){
    this._perform('bulkDocs',docs,options,notifyMethod);
  },

  allDocs: function(options,notifyMethod){
    if(!notifyMethod && SC.typeOf(options) === SC.T_STRING){
      this._database.allDocs(this._createCallback(options));
    }
    else this._database.allDocs(options,this._createCallback(notifyMethod));
  },

  // internals
  _database: null,

  defaultResponder: function(){
    return SC.PouchDB.defaultResponder;
  }.property().cacheable(),

  _createCallback: function(){
    SC.PouchDB._createCallback.apply(this,arguments);
  },

  replicate: {
    to: function(remote, options){ // from this to remote
      SC.PouchDB.replicate(this.get('database'),remote,options);
    },
    from: function(remote, options){ // from remote to this
      SC.PouchDB.replicate(remote,this.get('database'),options);
    }
  },

  info: function(notifyMethod){
    this._database.info(this._createCallback(notifyMethod));
  }

});

SC.PouchDB.defaultResponder = null;

SC.PouchDB._createCallback = function(evt){
  var dR = this.get('defaultResponder');
  var me = this;
  return function(err,result){
    var ret = err? { isError: true, errorValue: err }: result;
    dR.sendEvent(evt,ret);
  };
};

/*
The same as PouchDB#replicate, but instead of functions you can also provide events in the opts hash
*/

SC.PouchDB.replicate = function(source, target, opts){
  if(opts){
    if(opts.onChange && SC.typeOf(opts.onChange) === SC.T_STRING){
      opts.onChange = SC.PouchDB._createCallback(opts.onChange);
    }
    if(opts.onComplete && SC.typeOf(opts.onComplete) === SC.T_STRING){
      opts.onComplete = SC.PouchDB._createCallback(opts.onComplete);
    }
  }
  PouchDB.replicate(source,target,opts);
};

SC.PouchDB.database = function(dbname, opts){
  return SC.PouchDB.create({ database: dbname, options: opts });
};