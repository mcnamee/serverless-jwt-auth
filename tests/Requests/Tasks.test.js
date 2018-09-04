const TaskRequest = require('../../app/Requests/Tasks');

test('Task Create should fail', async () => {
  expect(TaskRequest.create({ name: 'a' })).toHaveProperty('message');
});
