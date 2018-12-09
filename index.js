function MyPromise(fn) {
  if (!(this instanceof MyPromise)) {
    throw new TypeError('MyPromise must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('MyPromise constructor argument is not a function');
  }
  this.state = 'pending';  // 初始化状态
  this.value = undefined;  // 初始化一个值, 用来存储resolve或者reject的值
  this.callbacks = [];     // 存储异步的回调方法
  // 执行 fn 方法
  executeFn(fn, this);
}

MyPromise.prototype.then = function(onFullfilled, onRejected) {
  var self = this;
  var newPromise = new MyPromise(function(_resolve, _reject) {
    if(self.state === 'pending') {
      self.callbacks.push(function() {
        handleResolved(self, onFullfilled, onRejected, _resolve, _reject);
      });
      return;
    }
    handleResolved(self, onFullfilled, onRejected, _resolve, _reject);
  });

  return newPromise;
}

MyPromise.prototype.catch = function(onRejected) {
  return this.then(null, onRejected);
}

MyPromise.prototype.finally = function(cb) {
  return this.then(
    function(value) {
      return MyPromise.resolve(cb()).then(function() {
        return value;
      });
    },
    function(err) {
      return MyPromise.resolve(cb()).then(function() {
        throw err;
      });
    }
  );
}

MyPromise.resolve = function(val) {
  return new MyPromise(function(resolve, reject) {
    resolve(val);
  });
}

MyPromise.reject = function(err) {
  return new MyPromise(function(resolve, reject) {
    reject(err);
  });
}

// 参数可以不是数组，但必须具有 Iterator 接口, 同时里面的值可能也不是promise实例
MyPromise.all = function(promiseArr) {
  var args = [].slice.call(promiseArr);

  return new MyPromise(function(resolve, reject) {
    var arr = [];
    var resolveCount = 0;
    var argsLen = args.length;
    for(var i = 0; i < argsLen; i++) {
      handle(i, args[i]);
    }
    function handle(index, val) {
      MyPromise.resolve(val).then(function(value) {
        arr[index] = value;
        if(++resolveCount === argsLen) {
          resolve(arr);
        }
      }, reject);
    }  
  });
}

MyPromise.race = function(promiseArr) {
  var args = [].slice.call(promiseArr);
  return new MyPromise(function(resolve, reject) {
    for(var i = 0; i < args.length; i++) {
      MyPromise.resolve(args[i]).then(resolve, reject);
    }
  });
}

function handleResolved(promise, onFullfilled, onRejected, _resolve, _reject) {
  setTimeout(function() {
    var res = undefined;
    var cb = promise.state === 'resolved' ? onFullfilled : onRejected;
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
      res = cb(promise.value);
      _resolve(res);
    }
    catch(err) {
      _reject(err);
    }
  });
}

// 执行 fn 方法
function executeFn(fn, promise) {
  var done = false;     // 声明一个变量, 防止resolve, reject连续调用
  try {
    fn(function _resolve(value) {
      if(done) return;
      done = true;
      resolve(promise, value);
    }, function _reject(reason) {
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
  promise.callbacks.forEach(function(cb) {
    cb();
  });
}

function reject(promise, error) {
  promise.state = 'rejected';
  promise.value = error;
  promise.callbacks.forEach(function(cb) {
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
    var then = value.then;
    if(typeof then === 'function') {
      executeFn(then.bind(value), promise);
      return;
    }
  }
  return true;
}