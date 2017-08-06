import EJSON from 'ejson'

function assign (obj, assignments) {
  obj = EJSON.clone(obj)

  Object.keys(assignments).forEach((path) => {
    const splitPath = path.split('.')
    let current = obj

    splitPath.forEach((prop, i) => {
      if (i === splitPath.length - 1) {
        current[prop] = assignments[path]
        return
      }

      if (current[prop] == null) {
        current[prop] = {}
      }

      current = current[prop]
    })
  })

  return obj
}

export { assign }
