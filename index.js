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


function cute(type, stackSize) {
  if (typeof type === 'number') {
    stackSize = type;
    type = null;
  }
  if (typeof stackSize === 'number') {
    Error.stackTraceLimit = stackSize
  }
  if (typeof type !== 'function') {
    type = cute.ui[type] || cute.ui.default;
  }
  if (type.init) { type.init(); }

  var filter = type.filter ? type.filter : function (x) { return x; };

  function details(frame) {
    var fn = frame.getFunction();

    return {
      fn: fn,
      file: frame.getFileName()
        .replace(process.cwd(), '.')
        .replace(/\/node_modules\//g, '♦'),
      line: frame.getLineNumber(),
      column: frame.getColumnNumber(),
      args: fn ? fn.arguments : '',
      name: frame.getFunctionName(),
      meth: frame.getMethodName(),
      sig: fn ? ((fn+'').split('{')[0].trim() + ' { [body] }') : '',
      id: function () {
        return this.name || this.meth || this.sig;
      }
    }
  }

  // https://code.google.com/p/v8-wiki/wiki/JavaScriptStackTraceApi
  Error.prepareStackTrace = function (error, stack) {
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
    head: ['file', 'line', 'column', 'name/sig'],
    colWidths: [50, 10, 10, 50]
  })


}

table.print = function () {
  var t = table._ + '';
  table._ = null;
  return t;
}

function table(frame) {
  table._.push([
    frame.file, frame.line, frame.column, frame.id()
  ])
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
