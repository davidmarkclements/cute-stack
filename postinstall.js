var spawn = require('child_process').spawn;

if (!+process.versions.node[0]) {
  console.log('\u001b[33minstall setflags on 0.10 and 0.12\u001b[0m');
  var npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  spawn(npm, ['i', 'setflags'], {stdio: 'inherit'});
}
