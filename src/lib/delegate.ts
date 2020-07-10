export class Delegator {
    proto: Object;
    target: string;

    constructor(proto, target) {
        this.proto = proto;
        this.target = target;
    }
    getter(name: string) {
        const proto = this.proto;
        const target = this.target;

        Reflect.defineProperty(proto, name, {
            get() {
                return this[target][name]
            }
        })
        return this;
    }

    setter(name: string) {
        const proto = this.proto;
        const target = this.target;

        Reflect.defineProperty(proto, name, {
            set(val) {
                return this[target][name] = val;
            }
        })
        return this;
    }

    access(name: string) {
        return this.getter(name).setter(name);
    }

    method(name: string) {
        const proto = this.proto;
        const target = this.target;

        proto[name] = (...args) => {
            return proto[target][name].apply(proto[target], args)
        }

        return this;
    }

    fluent(name: string) {
        const proto = this.proto;
        const target = this.target;

        proto[name] = (val: string) => {
            if (typeof val === undefined) {
                proto[target][name] = val;
                return this;
            } else {
                return proto[target][name];
            }
        }

        return this;
    }

}
