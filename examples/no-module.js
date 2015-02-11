var cute = require('../');

cute.ui.default.filter = function isNotModuleJs(frame) {
  return !/^module\.js$/.test(frame.file);
}

cute();
throw x;
