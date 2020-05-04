import { compose } from './compose';

const wait = (ms = 1) => new Promise(resolve => setTimeout(resolve, ms));
const useContext = (ctx) => ctx;
const target = [1, 2, 3, 4, 5, 6];
const ctx = {};
describe('compose', () => {
  it('should work', async () => {
    const onion = [];
    const middlewares = [];

    middlewares.push(async (context, next) => {
      useContext(context);
      onion.push(1);
      await wait();
      await next();
      await wait();
      onion.push(6);
    });

    middlewares.push(async (context, next) => {
      useContext(context);
      onion.push(2);
      await wait();
      await next();
      await wait();
      onion.push(5);
    });

    middlewares.push(async (context, next) => {
      useContext(context);
      onion.push(3);
      await wait();
      await next();
      await wait();
      onion.push(4);
    });

    await compose(middlewares)(ctx);

    expect(onion).toEqual(expect.arrayContaining(target));
  });

  it('should only accept array', () => {
    let err;
    try {
      // @ts-ignore
      expect(compose()).toThrow();
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(TypeError);
  });

  it('should only accept function as middleware', () => {
    let err;
    try {
      // @ts-ignore
      expect(compose([{}])).toThrow();
    } catch (e) {
      err = e;
    }
    return expect(err).toBeInstanceOf(TypeError);
  });

  it('should work while input 0 middleware', () => {
    return compose([])(ctx);
  });

  it('should reject on errors in middleware', () => {
    const middlewares = [];
    middlewares.push(async () => {
      throw new Error();
    });

    return compose(middlewares)(ctx)
      .then(() => {
        throw new Error('composed middleware was not rejected');
      }).catch(err => {
        expect(err).toBeInstanceOf(Error);
      });
  });

  it('should catch downstream errors', async () => {
    const onion = [];
    const middlewares = [];

    middlewares.push(async (ctx, next) => {
      useContext(ctx);
      onion.push(1);
      try {
        onion.push(2);
        await next();
        onion.push(7);
      } catch (err) {
        onion.push(5);
      }
      onion.push(6);
    });

    middlewares.push(async (ctx, next) => {
      useContext(ctx);
      onion.push(3);
      await next();
      throw new Error();
    });

    middlewares.push(async () => {
      onion.push(4);
    });

    await compose(middlewares)(ctx);
    expect(onion).toEqual(target);
  });

  it('should not change the content of context', () => {
    const middlewares = [];

    middlewares.push(async (ctx1, next) => {
      await next();
      expect(ctx1).toEqual(ctx);
    });

    middlewares.push(async (ctx2, next) => {
      await next();
      expect(ctx2).toEqual(ctx);
    });

    middlewares.push(async (ctx3, next) => {
      await next();
      expect(ctx3).toEqual(ctx);
    });

    return compose(middlewares)(ctx);
  });
});
