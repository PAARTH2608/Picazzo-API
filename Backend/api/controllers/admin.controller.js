const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 14;
const { Admin } = require('../models');

const registerAdmin = async (req, res) => {
	try {
		const checkExistence = await Admin.findOne({
			email: req.body.email,
		});
		if (checkExistence) {
			res.status(200).send({
				message: 'Admin Already Exists',
				error: true,
			});
		} else {
			const hasedPassword = await bcrypt.hash(
				req.body.password,
				saltRounds
			);
			const newAdmin = req.body;
			newAdmin.password = hasedPassword;
			const AdminInfo = await Admin.create(newAdmin);
			const token = jwt.sign(
				{
					email: AdminInfo.email,
					adminId: AdminInfo._id,
				},
				process.env.JWT_SECRET || 'key'
			);
			res.status(200).send({
				message: 'Admin Registered Successfully',
				AdminInfo,
				token,
			});
		}
	} catch (error) {
		console.log('error', error);
		res.status(500).send({
			message: error.toString(),
		});
	}
};

const login = async (req, res) => {
	try {
		console.log('llll');
		console.log(req.body);
		let admin = await Admin.findOne({ email: req.body.email });
		if (admin === null) {
			return res.status(404).send({
				message: 'Admin not found',
			});
		}
		const token = jwt.sign(
			{
				phone: admin.phone,
				adminId: admin._id,
			},
			process.env.JWT_SECRET || 'key'
		);
		let adminInfo = {
			...admin._doc,
		};
		delete adminInfo['password'];
		return res.status(200).send({ adminInfo, token });
	} catch (err) {
		console.log('error:', err);
		res.status(500).send({
			message: err.toString(),
		});
	}
};
module.exports = {
	registerAdmin,
	login
};
