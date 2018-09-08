const { signToken } = require('../../app/Helpers/Users');
const jwt = require('jsonwebtoken');

test('JWT Token should generate + when decoded, should be equal to input ID', async () => {
  const userId = '464b5e40-b2fb-11e8-89b6-b5c77595a2ec';
  const token = await signToken(userId);

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // When token is decoded, the user id should be equal to input
    expect(decoded.id).toEqual(userId);
  });
});
