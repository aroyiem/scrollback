var assert = require("assert");
var config  = require('../config.js');
var core = new (require("../lib/emitter.js"))();
var threader = require("./threader.js");
var gen = require("../lib/generate.js");
var guid = gen.uid;
var names = gen.names;
var msg = {id:guid(), text: "values : " + Math.random(), from : "guest-" + names(6), to: "scrollback", type: 'text', time: new Date().getTime(), labels: {}, threads: []};

describe('threader', function() {
	before( function(done) {
		this.timeout(10000);
		threader(core);
		setTimeout(function(){
			done();	
		}, 9000);
	});
	it('should get a thread with title', function(done) {
		core.emit("text", msg, function(err, msg) {
			console.log("message= ", msg);
			var m = (msg.threads  && msg.threads instanceof Array && msg.threads.length) > 0 ? true : false;
            m = m && (msg.threads[0].id && msg.threads[0].score ? true : false);
			assert.equal(m, true, "Unable to get a thread for message OR typeof thread is not an array.");
			done();
		});
	});

	it('should get a thread with lables', function(done) {
		core.emit("text", msg, function(err, msg) {
			console.log("message= ", msg);
			var m = (msg.labels && msg.labels.normal && msg.labels.nonsense && msg.labels.spam) ? true : false;
			assert.equal(m, true, "Unable to get a labels");
			done();
		});
	});

    it('should Update thread ID', function (done) {
		msg.threads = [{
			id: "new",
			score: 1
		}];
		core.emit("text", msg, function (err, msg) {
			console.log("message= ", msg);
			var m = (msg.threads && msg.threads instanceof Array && msg.threads.length) > 0 ? true : false;
			m = m && (msg.threads[0].id && msg.threads[0].id !== 'new' && msg.threads[0].score ? true : false);
			assert.equal(m, true, "Not updating thread ID OR typeof thread is not an array.");
			done();
		});
	});

	it('should not take more then 1 sec', function(done) {
		this.timeout(1100);
		msg.threads = [];
		core.emit("text", msg, function(err, data) {
			console.log(msg);
			done();
		});
	});

});
