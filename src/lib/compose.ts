export const compose = (
  middlewares: Middleware<any>[]
): ComposedMiddleware<any> => {
  // 是数组
  if (!Array.isArray(middlewares)) throw TypeError('middlewares must be Array');
  // 数组中都是函数
  if (middlewares.some(mid => typeof mid !== 'function'))
    throw TypeError('every middleware must be Function');

  return (context, next?) => {
    let cursor = -1;
    // 按照压入middlewares数组顺序依次执行，从0开始
    return dispatch(0);

    function dispatch(index: number) {
      if (index <= cursor)
        return Promise.reject(new Error('next() called multiple times'));
      cursor = index;
      let middleware = middlewares[index];
      // 递归终止条件
      if (middlewares.length === index) middleware = next;
      if (!middleware) return Promise.resolve();

      try {
        return Promise.resolve(middleware(context, () => dispatch(index + 1)));
      } catch (e) {
        return Promise.reject(e);
      }
    }
  };
};
