module.exports = !+process.versions.node[0] ? 
  require('setflags').setFlags : 
  require('v8').setFlagsFromString


