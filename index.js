function MyPromise(fn) {
  if (!(this instanceof MyPromise)) {
    throw new TypeError('MyPromise must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('MyPromise constructor argument is not a function');
  }
  this.state = 'pending';  // 出初始化状态
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
  promise.state = 'resolved';
  promise.value = value;
}

function reject(promise, error) {
  promise.state = 'rejected';
  promise.value = error;
}