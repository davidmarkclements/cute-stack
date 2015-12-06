require('../')()

var l = (fn) => fn()

l(()=>{ throw Error() })

