const mongoose = require('mongoose');

let AdminSchema = mongoose.Schema({
	name: {
		type: String,
		default: '',
	},

	password: {
		type: String,
		default: '',
	},
	email: {
		type: String,
		default: '',
	},
});

let Admin = mongoose.model('Admin', AdminSchema);

module.exports = Admin;
