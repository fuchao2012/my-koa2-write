import test, { afterEach, beforeEach } from 'ava';
import { Application } from './application';

let serverHandler;

beforeEach(() => {
  const app = new Application();
  app.use((req, res) => {
    console.log('req', req);
    res.body = 'hello';
  });
  serverHandler = app.listen(3000);
});

afterEach(() => {
  serverHandler.close(() => {
    console.log('server 3000 closed');
  });
});

test('application is good to run', async t => {
  t.pass();
});
