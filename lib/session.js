module.exports = function configure(options) {
	var key = options.key || 'connect.sid'
	,	store = options.store
	,	primus = this;

	if (!store) {
		throw new Error('Session middleware configuration failed due to missing `store` option');
	}

	function session(req, res, next) {
		var sid = req.signedCookies[key];
		req.session = {};
		if (!sid) return next();
		req.pause();
		store.get(sid, function (err, session) {
			req.resume();
			if (err) {
				primus.emit('log', 'error', err);
				return next();
			}
			if(session){req.session = session};
			next();
		});
	}

	return session;
};