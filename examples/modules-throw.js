require('../')('table', 50)

var mkdirp = require('mkdirp');
var fs = require('fs');
var foo = 'node_modules/foo/'
var bar = 'node_modules/bar/'
var baz = 'node_modules/baz/'
var foobar = foo+bar;
var foobarbaz = foobar+baz;

mkdirp.sync(foobarbaz);

fs.writeFileSync(foo + '/index.js', 'require("bar")');
fs.writeFileSync(foobar + '/index.js', 'require("baz")');
fs.writeFileSync(foobarbaz + '/index.js', 'throw x');

require('foo');

