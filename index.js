var util = require('util');
var colors = require('colors');
var Table = require('cli-table');
var treeify = require('treeify');

module.exports = cute;

cute.uncute = function () {
  Error.stackTraceLimit = 10;
  Error.prepareStackTrace = null;
}
cute.noStack = function () { cute(null, 0); }

cute.ui = {
  default: pretty,
  pretty: pretty,
  table: table,
  json: JSON.stringify.bind(JSON),
  tree: tree
}

cute.ui['pretty-json'] = function (frame) {
  return JSON.stringify(frame, 0, 2);
}

cute.ui['pretty-json'].print = cute.ui.json.print = function (data) {
  return '['+data+']'
}

function cute(type, stackSize, opts) {
  opts = opts || {}
  if (typeof type === 'number') {
    stackSize = type;
    type = null;
  }
  if (typeof stackSize === 'number') {
    Error.stackTraceLimit = stackSize;
  }
  if (opts.emulated) {
    Error.stackTraceLimit += 7;
  }
  if (typeof type !== 'function') {
    type = cute.ui[type] || cute.ui.default;
  }
  if (type.init) { type.init(); }

  var filter = type.filter ? type.filter : function (x) { return x; };

  function details(frame) {
    var fn = frame.getFunction();
    var sig = fn ? 
      ((fn+'').split('{')[0].trim() + ' { [body] }') : 
      findSig(frame);

    return {
      file: frame.getFileName()
        .replace(process.cwd(), '.')
        .replace(/\/node_modules\//g, '♦'),
      line: frame.getLineNumber(),
      column: frame.getColumnNumber(),
      name: frame.getFunctionName(),
      meth: frame.getMethodName(),
      sig: sig,
      id: function () {
        return this.name || this.meth || this.sig;
      }
    }
  }

  // https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi
  Error.prepareStackTrace = function (error, stack) {
    if (opts.emulated) { stack = strip(stack); }

    var text = (error+'').bgRed.white
      + '\n\n' + (type.print||join)(
        stack.map(details).filter(filter).map(type)
      );

    return text;
  }
  return cute;
}

function pretty(frame) {
  return [
    frame.file.cyan,
    (' ' + frame.line + ',' + frame.column + ' ').bgYellow.black,
    (' ' + (frame.id()) + ' ').gray
    ].join(' ') + '\n';
}

function join(a) {
  return Array.prototype.join.call(a, '');
}

table.init = function () {

  table._ = new Table({
    head: ['file', 'line', 'col', 'name/sig'],
    colWidths: [20, 8, 6, 46]

  })


}

table.print = function () {
  var t = table._ + '';
  table._ = null;
  return t;
}

function table(frame) {
  var file = (frame.file.length > 18) ?
    '…' + frame.file.substring(-16) :
    frame.file;

  table._.push([
    file, frame.line, frame.column, frame.id()
  ]);
}

function tree(frame) {
  return {
    file: frame.file,
    line: frame.line,
    column: frame.column,
    id: frame.id()
  };
}

tree.print = function treePrint(frames) {
  if (!frames.length) {
    return;
  }

  frames.reduce(function (prev, curr) {
    if (prev !== curr) {
      prev.caller = curr;
    }
    return curr;
  }, frames[0]);

  return treeify.asTree(frames[0], true);
};

function findSig(frame) {
  var path = require('path');
  var mod = require('module');
  var name = frame.getFileName();
  var line = frame.getLineNumber();
  var col = frame.getColumnNumber();
  var comments = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
  var sig = '';
  mod.wrap = (function (wrap) {
    return function (script) {
      script = mod.wrapper[0] + script + mod.wrapper[1];
      
      var lines = script.split('\n');

      var match = lines[line]
        .substr(0, col)
        .replace(comments, '')
        .match(/function.+{/);

      if (match) {
        sig = match[0] + ' [body] }';
        return;
      }
      
      lines.slice(0, line).reverse().some(function (l, ix) {
        var match = l
          .replace(comments, '')
          .match(/function\s*\(.+\)/m);

        if (match) {
          sig = lines[lines.indexOf(l)]
              .replace(comments, '')
              .match(/function.+{/)[0] + ' [body] }';
        }  
        return match;
      });
      
      mod.wrap = wrap;
      return script;
    };
  }(mod.wrap));
  
  try { 
    if (path.join(__dirname + '/cmd.js') !== name) {
      require(require.resolve(name.replace(path.extname(name), '')));
    }

  } catch (e) {}

  return sig;
}

function strip(stack) {
  var loadfn = stack.filter(function (frame) { 
    return /cmd\.js/.test(frame.getFileName()) && frame.getFunctionName() === 'load'
  })[0];
  var startFrame = stack.indexOf(loadfn);
  var endFrame = stack.indexOf(stack.slice(startFrame, stack.length).filter(function (frame) {
    return /module\.js/.test(frame.getFileName()) && frame.getFunctionName() === 'Module.runMain'
  })[0]);
  return stack.slice(0, startFrame).concat(stack.slice(endFrame, stack.length))
}



