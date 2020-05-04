type Next = () => Promise<any>;
type Middleware<T> = (context: T, next: Next) => any;
type ComposedMiddleware<T> = (context: T, next?: Next) => Promise<void>;
