const TestController = async (req, res) => {
	console.log('yoyo');
	res.status(200).send({message: 'Testing successful'});
};

module.exports = {
	TestController,
};
