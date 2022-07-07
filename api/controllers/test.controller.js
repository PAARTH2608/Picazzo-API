const TestController = async (req, res) => {
	res.status(200).send({message: 'Testing successful'});
};

module.exports = {
	TestController,
};
