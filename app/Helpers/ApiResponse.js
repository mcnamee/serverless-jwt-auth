module.exports.success = data => ({
  statusCode: 200,
  body: JSON.stringify(data)
});

module.exports.failure = err => ({
  statusCode: err.statusCode || 500,
  body: JSON.stringify({ message: err.message })
});
