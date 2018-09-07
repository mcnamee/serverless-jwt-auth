module.exports = () => {
  return ({
    after: (handler, next) => {
      handler.response = {
        statusCode: handler.response.statusCode || 200,
        body: JSON.stringify(handler.response.body),
      };
      next();
    },
    onError: (handler, next) => {
      handler.response = {
        statusCode: handler.response.statusCode || 500,
        body: JSON.stringify(handler.response.body),
      };
      next();
    }
  })
}
