/* jshint browser:true */
/* global libsb */

var spaceManager = require('./spaceManager.js');
var ArrayCache = require('./ArrayCache.js');

window.backTimes = {};

var _this;

function findLastTime(messages) {
	// finds the last message time in the array of messages.
	var len = messages.length;
	var lastMsgTime = messages[len - 1].time;
	for (var i = len - 1; i > 0; i--) {
		if (messages[i].type === "text") {
			lastMsgTime = messages[i].time;
			break;
		}
	}
	return lastMsgTime;
}


function applyUpdates(data, cacheName, endType) {
	// applies edits till no more messages are left.
	var pos;
	data.forEach(function(msg) {
		pos = _this.cache[cacheName].find(endType, msg.time);
		if (msg && _this.cache[cacheName].d[pos] && (msg.id === _this.cache[cacheName].d[pos].id)) {
			_this.cache[cacheName].d[pos] = msg;
		}
	});
}

module.exports = {
	cache: {},
	clear: function(key) {
		spaceManager.clear(key);
	},
	saveArrayCache: function(key) {
		spaceManager.set(key, this.cache[key].d);
	},
	loadArrayCache: function(key) {
		var data = spaceManager.get(key);
		if (data !== null) this.cache[key] = new ArrayCache(data);
		else this.cache[key] = new ArrayCache([]);
	},
	start: function(endType, key, time, pos) {
		/* Adds a result-start to the cache evaluating various conditions */
		var rs = {
			type: 'result-start',
			time: time,
			endType: endType
		};
		this.loadArrayCache(key);
		if (pos === 'begin') {
			try {
				if (this.cache[key][0].type !== 'result-start') {
					this.cache[key].d.unshift(rs);
				}
			} catch (e) {
				this.cache[key].d.unshift(rs);
			}
		} else {
			try {
				if (this.cache[key].d[this.cache[key].d.length - 1].type !== 'result-start') {
					this.cache[key].d.push(rs);
				}
			} catch (e) {
				// in case of empty ArrayCache.
				this.cache[key].d.push(rs);
			}
		}
		this.saveArrayCache(key);
	},
	end: function(endType, key, time, pos) {
		/* Adds a result-end to the cache evaluating various conditions */
		var re = {
			type: 'result-end',
			time: time,
			endType: endType
		};
		var rs = {
			type: 'result-start',
			time: time,
			endType: endType
		};
		this.loadArrayCache(key);
		if (pos === 'begin') {
			try {
				if (this.cache[key][0].type !== 'result-end') {
					this.cache[key].d.unshift(re);
				}
			} catch (e) {
				this.cache[key].d.unshift(re);
			}
		} else {
			try {
				var lastItem = this.cache[key].d[this.cache[key].d.length - 1];

				if (lastItem.type === 'result-start') {
					this.cache[key].d.pop();
					this.cache[key].push(rs); // push a new result start, replacing older one
				} else if (lastItem.type !== 'result-end') {
					this.cache[key].d.push(re);
				}

			} catch (e) {
				// if the cache is empty, there is no need to push result end 
			}
		}
		this.saveArrayCache(key);
	},
	generateLSKey: function() {
		var args = Array.prototype.slice.call(arguments, 0);
		if (!args) {
			return;
		}
		var argumentsLC = args.map(function(val) {
			if (typeof val == "string") return val.toLowerCase();
		});
		return argumentsLC.join('_');
	},
	updateArrayCache: function(key, roomName, endType) {
		var msgs = this.cache[key].d;
		//var msgs = JSON.parse(localStorage[key]);
		var lastTime = findLastTime(msgs);
		_this = this;

		if (typeof lastTime === "undefined") return;
		libsb.emit("getTexts", {
			to: roomName,
			updateTime: lastTime,
			after: 256
		}, function(err, data) {
			applyUpdates(data.results, key, endType);
		});
	}

};