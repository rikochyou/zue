class Compile {
  constructor(el, vm) {
    // 要遍历的宿主节点
    this.$el = document.querySelector(el);
    this.$vm = vm;

    // 编译
    if (this.$el) {
      // 转换内部内容为片段fragment
      this.$fragment = this.node2Fragment(this.$el);
      // 执行编译
      this.compile(this.$fragment);
      // 将编译完的html结果追加至$el
      this.$el.appendChild(this.$fragment);
    }
  }

  // 将宿主元素中代码片段拿出来遍历，这样做比较高效
  node2Fragment(el) {
    const frag = document.createDocumentFragment();
    // 将el中所有子元素搬家至frag中
    let child;
    while ((child = el.firstChild)) {
      frag.appendChild(child);
    }
    return frag;
  }

  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach(node => {
      // 类型判断
      if (this.isElement(node)) {
        // 元素
        // 查找z-, @, :
        const nodeAttrs = node.attributes;
        Array.from(nodeAttrs).forEach(attr => {
          const attrName = attr.name;
          const exp = attr.value;
          if (this.isDirective(attrName)) {
            const dir = attrName.substring(2);
            this[dir] && this[dir](node, this.$vm, exp);
          }
          if (this.isEvent(attrName)) {
            const dir = attrName.substring(1);
            this.eventHandler(node, this.$vm, exp, dir);
          }
        });
      } else if (this.isInsert(node)) {
        //文本
        this.compileText(node);
      }

      if (node.childNodes && node.childNodes.length > 0) {
        this.compile(node);
      }
    });
  }

  // 更新函数
  update(node, vm, exp, dir) {
    const updaterFn = this[dir + 'Updater'];
    // 初始化
    updaterFn && updaterFn(node, vm[exp]);
    // 依赖收集
    new Watcher(vm, exp, function(value) {
      updaterFn && updaterFn(node, value);
    });
  }

  text(node, vm, exp) {
    this.update(node, this.$vm, RegExp.$1, 'text');
  }

  textUpdater(node, value) {
    node.textContent = value;
  }

  compileText(node) {
    this.update(node, this.$vm, RegExp.$1, 'text');
  }

  isElement(node) {
    return node.nodeType === 1;
  }

  isInsert(node) {
    return node.nodeType === 3 && /\{\{(.*)\}\}/.test(node.textContent);
  }

  isDirective(attr) {
    return attr.indexOf('z-') == 0;
  }
  isEvent(attr) {
    return attr.indexOf('@') == 0;
  }

  eventHandler(node, vm, exp, dir) {
    let fn = vm.$options.methods && vm.$options.methods[exp];
    if (dir && fn) {
      node.addEventListener(dir, fn.bind(vm));
    }
  }

  // 双向绑定
  model(node, vm, exp) {
    // 指定input的value属性
    this.update(node, vm, exp, 'model');

    // 视图对模型的影响
    node.addEventListener('input', e => {
      vm[exp] = e.target.value;
    });
  }

  modelUpdater(node, value) {
    node.value = value;
  }
}
