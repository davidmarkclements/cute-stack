require('../')(require('bad-line'));
function foo() {
  throw new Error('bad error in foo');
}
foo();
