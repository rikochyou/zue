class ZVue {
  constructor(options) {
    this.$options = options;

    this.$data = options.data;
    this.observe(this.$data);

    // new Watcher()
    // this.$data.test
    new Compile(options.el, this);

    // created执行
    if (options.created) {
      options.created.call(this);
    }
  }

  observe(value) {
    if (!value || typeof value !== 'object') {
      return;
    }

    Object.keys(value).forEach(key => {
      
      this.defineReactive(value, key, value[key]);
      //代理data中的属性到vue实例上
      this.proxyData(key)
    });
  }

  defineReactive(obj, key, val) {
    this.observe(val);

    const dep = new Dep();

    Object.defineProperty(obj, key, {
      get() {
        Dep.target && dep.addDep(Dep.target);
        return val;
      },
      set(newVal) {
        if (newVal === val) {
          return;
        }
        val = newVal;
        dep.notify();
      }
    });
  }

  proxyData(key) {
    Object.defineProperty(this,key, {
      get() {
        return this.$data[key]
      },
      set(newVal) {
        this.$data[key] = newVal
      }
    })
  }
}

class Dep {
  constructor() {
    this.deps = [];
  }

  addDep(dep) {
    this.deps.push(dep);
  }

  notify() {
    this.deps.forEach(dep => dep.update());
  }
}

class Watcher {
  constructor(vm, key, cb) {
    (this.vm = vm), (this.key = key), (this.cb = cb);
    Dep.target = this;
    this.vm[this.key];
    Dep.target = null;
  }
  update() {
    this.cb.call(this.vm, this.vm[this.key]);
  }
}
