const TestController = async (req, res) => {
	console.log('yoyo');
	res.status(200).send('hii as');
};

module.exports = {
	TestController,
};
