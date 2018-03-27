module.exports = {
  normalize: (name) => {
    let parts = name.split('-')
    for(let i in parts){ parts[i] = parts[i].charAt(0).toUpperCase() + parts[i].slice(1) }
    return parts.join('-')
  },

  set: (response, headers) => {

  },

  AsyncFunction: ((async () => {}).constructor)
}
