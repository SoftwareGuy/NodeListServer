// This is a shared object of our server list
// We'll import it to any other file that needs it.

var ServersList = {
  _list: [],
  timeLastPurged: Date.now(),
  get list() {
    return this._list;
  },
  add(server) {
    return this._list.push(server);
  },
  push(server) {
    return this._list.push(server);
  },
  remove(server) {
    return this._list.splice(this._list.indexOf(server), 1);
  },
  filter(callbackFn) {
    return this._list.filter(callbackFn);
  },
  some(callbackFn) {
    return this._list.some(callbackFn);
  },
  purge(filter) {
    this._list = this._list.filter(filter);
    return (this.timeLastPurged = Date.now());
  },
  forEach(callbackFn) {
    return this._list.forEach(callbackFn);
  },
  map(callbackFn) {
    return this._list.map(callbackFn);
  },
};

module.exports = ServersList;
