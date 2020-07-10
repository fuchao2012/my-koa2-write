import test from 'ava';
import { Delegator } from './delegate';

const Pet = {
  dog: {
    name: 'nick',
    age: 1,
    sex: 'male',
    bar() {
      console.log('bar!');
    }
  }
};

const delegator = new Delegator(Pet, 'dog');

test('delegates getter works', async t => {
  delegator.getter('name');

  // @ts-ignore
  t.log(Pet.name);

  t.pass();
});
