function MyPromise(fn) {
  if (!(this instanceof MyPromise)) {
    throw new TypeError('MyPromise must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('MyPromise constructor argument is not a function');
  }
  this.state = 'pending';  // 初始化状态
  this.value = undefined;  // 初始化一个值, 用来存储resolve或者reject的值
  // 执行 fn 方法
  executeFn(fn, this);
}

MyPromise.prototype.then = function(onFullfilled, onRejected) {
  var self = this;
  var res = undefined;
  var cb = this.state === 'resolved' ? onFullfilled : onRejected;
  if(typeof cb !== 'function') {
    cb = function(val) { return val; }
  }
  var newPromise = new MyPromise(function(_resolve, _reject) {
    if(self.state === 'pending') return;
    try {
      res = cb(self.value);
      _resolve(res);
    }
    catch(err) {
      _reject(err);
    }
  });

  return newPromise;
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
}

function reject(promise, error) {
  promise.state = 'rejected';
  promise.value = error;
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