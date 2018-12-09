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

function handleResolved(promise, onFullfilled, onRejected, _resolve, _reject) {
  var res = undefined;
  var cb = promise.state === 'resolved' ? onFullfilled : onRejected;
  if(typeof cb !== 'function') {
    cb = function(val) { return val; }
  }
  setTimeout(function() {
    cb = promise.state === 'resolved' ? onFullfilled : onRejected;
    cb = typeof cb === 'function' ? cb : function(val) { return val; }
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