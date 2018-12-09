class MyPromise {
  constructor(fn) {
    if(!(this instanceof MyPromise)) {
      throw new TypeError('MyPromise must be constructed via new');
    }
    if(typeof fn !== 'function') {
      throw new TypeError('MyPromise constructor argument is not a function');
    }
    this.state = 'pending';  // 初始化状态
    this.value = undefined;  // 初始化一个值, 用来存储resolve或者reject的值
    this.callbacks = [];     // 存储异步的回调方法
    // 执行 fn 方法
    executeFn(fn, this);
  }

  then(onFullfilled, onRejected) {
    const newPromise = new MyPromise((_resolve, _reject) => {
      if(this.state === 'pending') {
        this.callbacks.push(() => {
          handleResolved(this, onFullfilled, onRejected, _resolve, _reject);
        });
        return;
      }
      handleResolved(this, onFullfilled, onRejected, _resolve, _reject);
    });

    return newPromise;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }

  finally(cb) {
    return this.then(
      value => {
        return MyPromise.resolve(cb()).then(() => {
          return value;
        });
      },
      err => {
        return MyPromise.resolve(cb()).then(() => {
          throw err;
        });
      }
    );
  }

  static resolve(val) {
    return new MyPromise((_resolve, _reject) => {
      _resolve(val);
    });
  }

  static reject(err) {
    return new MyPromise((_resolve, _reject) => {
      _reject(err);
    });
  }

  // 参数可以不是数组，但必须具有 Iterator 接口, 同时里面的值可能也不是promise实例
  static all(promiseArr) {
    const args = [].slice.call(promiseArr);

    return new MyPromise((_resolve, _reject) => {
      const arr = [];
      let resolveCount = 0;
      const argsLen = args.length;
      for(let i = 0; i < argsLen; i++) {
        handle(i, args[i]);
      }
      function handle(index, val) {
        MyPromise.resolve(val).then(value => {
          arr[index] = value;
          if(++resolveCount === argsLen) {
            _resolve(arr);
          }
        }, _reject);
      }
    });
  }

  static race(promiseArr) {
    const args = [].slice.call(promiseArr);
    return new MyPromise((_resolve, _reject) => {
      for(let i = 0; i < args.length; i++) {
        MyPromise.resolve(args[i]).then(_resolve, _reject);
      }
    });
  }
}


function handleResolved(promise, onFullfilled, onRejected, _resolve, _reject) {
  setTimeout(() => {
    const cb = promise.state === 'resolved' ? onFullfilled : onRejected;
    if(typeof cb !== 'function') {
      if(promise.state === 'resolved') {
        _resolve(promise.value);
      }
      else {
        _reject(promise.value);
      }
      return;
    }
    try {
      const res = cb(promise.value);
      _resolve(res);
    }
    catch(err) {
      _reject(err);
    }
  });
}

// 执行 fn 方法
function executeFn(fn, promise) {
  let done = false;     // 声明一个变量, 防止resolve, reject连续调用
  try {
    fn(value => {
      if(done) return;
      done = true;
      resolve(promise, value);
    }, reason => {
      if(done) return;
      done = true;
      reject(promise, reason);
    });
  }
  catch(err) {
    if(!done) {
      done = true;
      reject(promise, err);
    }
  }
}

function resolve(promise, value) {
  if(!handlePromise(promise, value)) return;

  promise.state = 'resolved';
  promise.value = value;
  promise.callbacks.forEach(cb => {
    cb();
  });
}

function reject(promise, error) {
  promise.state = 'rejected';
  promise.value = error;
  promise.callbacks.forEach(cb => {
    cb();
  });
}

// 用来处理返回值或者resolve的参数是promise的情况, 最后的返回值起个标识作用
function handlePromise(promise, value) {
  if(value === promise) {
    reject(promise, 'A promise cannot be resolved with itself');
    return;
  }
  if(value && (typeof value === 'object' || typeof value === 'function')) {
    const then = value.then;
    if(typeof then === 'function') {
      executeFn(then.bind(value), promise);
      return;
    }
  }
  return true;
}

if(typeof window !== 'undefined') {
  window['MyPromise'] = MyPromise;
}