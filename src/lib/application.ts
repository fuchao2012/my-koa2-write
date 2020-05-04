import { EventEmitter } from 'events';
import * as http from 'http';
import { format } from 'util';
import { onFinished } from 'on-finished';
import { Stream } from 'stream';
import * as statuses from 'statuses';
import { compose } from './compose';

interface KoaMiddleware extends Middleware<any> {

}

interface KoaError extends Error {
  status?: number;
  expose?: boolean;
}

interface KoaResponse extends http.ServerResponse {
  statusCode: number;
  length?: number;
  _explicitNullBody?: boolean;
  remove?: (head?: string) => void;
  has?: (head?: string) => boolean;
}

interface KoaRequest extends http.IncomingMessage {
  url?: string;
}

interface KoaContext {
  res: KoaResponse;
  req: KoaRequest;
  response: KoaResponse;
  request: KoaRequest;

  respond: boolean;

  method?: string; // HTTP VERB
  message?: string;
  body: string | Stream | Buffer;
  status: number;
  writable?: boolean;
  length: number;
  type?: string;

  onerror?: (err?: KoaError) => void;
}

export class Application extends EventEmitter {
  private readonly middleware: KoaMiddleware[];
  private silent: boolean = false;
  private context: KoaContext;
  private request: KoaRequest;
  private response: KoaResponse;

  constructor() {
    super();
    this.middleware = [];
  }

  /**
   * 封装Listen方法
   * @param args
   */
  listen(...args: any[]) {
    const server = http.createServer(this.callback());
    return server.listen(...args);
  }

  use(fn?: KoaMiddleware) {
    if (typeof fn !== 'function') throw new TypeError('middleware must be a function!');
    this.middleware.push(fn);
    return this;
  }

  callback() {
    const fn: Function = compose(this.middleware);
    if (this.listenerCount('error') > 0) {
      this.on('error', this.onerror);
    }
    return (req, res) => {
      const ctx = this.createContext(req, res);
      return this.handleRequest(ctx, fn);
    };
  }

  private onerror(err?: KoaError) {
    if (!(err instanceof Error)) throw new TypeError(format('non-error thrown: %j', err));

    if (err.status === 404 || err.expose) return;
    if (this.silent) return;

    const msg = err.stack || err.toString();
    console.error(msg.replace(/^/gm, '  '));
  }

  private createContext(req: KoaRequest, res: KoaResponse): KoaContext {
    const context = Object.create(this.context);
    const request = context.request = Object.create(this.request);
    const response = context.response = Object.create(this.response);
    context.app = request.app = response.app = this;
    context.req = request.req = response.req = req;
    context.res = request.res = response.res = res;
    request.ctx = response.ctx = context;
    request.response = response;
    response.request = request;
    context.originalUrl = request.originalUrl = req.url;
    context.state = {};
    return context;
  }

  private handleRequest(ctx: KoaContext, fn: Function) {
    const res = ctx.res;
    res.statusCode = 404;
    const onerror = err => ctx.onerror(err);
    const handleResponse = () => Application.respond(ctx);
    onFinished(res, onerror);
    return fn(ctx).then(handleResponse).catch(onerror);
  }

  private static respond(ctx: KoaContext) {
    // allow bypassing koa
    if (false === ctx.respond) return;

    if (!ctx.writable) return;

    const res = ctx.res;
    let body = ctx.body;
    const code = ctx.status;

    // ignore body
    if (statuses.empty[code]) {
      // strip headers
      ctx.body = null;
      return res.end();
    }

    if ('HEAD' === ctx.method) {
      if (!res.headersSent && !ctx.response.has('Content-Length')) {
        const { length } = ctx.response;
        if (Number.isInteger(length)) ctx.length = length;
      }
      return res.end();
    }

    // status body
    if (null == body) {
      if (ctx.response._explicitNullBody) {
        ctx.response.remove('Content-Type');
        ctx.response.remove('Transfer-Encoding');
        return res.end();
      }
      if (ctx.req.httpVersionMajor >= 2) {
        body = String(code);
      } else {
        body = ctx.message || String(code);
      }
      if (!res.headersSent) {
        ctx.type = 'text';
        ctx.length = Buffer.byteLength(body as any);
      }
      return res.end(body);
    }

    // responses
    if (Buffer.isBuffer(body)) return res.end(body);
    if ('string' == typeof body) return res.end(body);
    if (body instanceof Stream) return body.pipe(res);

    // body: json
    body = JSON.stringify(body);
    if (!res.headersSent) {
      ctx.length = Buffer.byteLength(body);
    }
    res.end(body);
  }
}
