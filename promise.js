class My {
  //Promise状态参数
  static PENDING = 'pending'
  static FULFILLED = 'fulfilled'
  static REJECTED = 'rejected'
  //静态方法
  static resolve(value) {
    return new My((resolve, reject) => {
      //返回promise对象时
      if (value instanceof My) {
        value.then(resolve, reject)
      }
      //返回普通对象时
      else {
        resolve(value)
      }
    })
  }
  static reject(reason) {
    return new My((resolve, reject) => {
      //返回promise对象时
      if (reason instanceof My) {
        reason.then(resolve, reject)
      }
      //返回普通对象时
      else {
        reject(value)
      }
      reject(reason)
    })
  }
  static all(promises) {
    const values = []
    let count = 0
    return new My((resolve, reject) => {
      promises.forEach((promise, index) => {
        promise.then(
          value => {
            count++
            values[index] = value
            if (count == promises.length) {
              resolve(values)
            }
          },
          reason => {
            reject(reason)
          }
        )
      })
    })
  }
  // Promise.race 在第一个promise对象变为Fulfilled之后，并不会取消其他promise对象的执行
  static race(promises) {
    return new My((resolve, reject) => {
      promises.map(promise => {
        promise.then(
          value => {
            resolve(value)
          },
          reason => {
            reject(reason)
          }
        )
      })
    })
  }
  //promise all的基础上返回最后一个成功执行的返回值
  static allWithErrorhandle(promises) {
    // 变量ret用来保存上一个动画的返回值
    let ret = null
    // 新建一个空的Promise
    let p = Promise.resolve()
    // 使用then方法，添加所有动画
    for (let pro of promises) {
      p = p.then(function (val) {
        ret = val
        return pro(elem)
      })
    }
    // 返回一个部署了错误捕捉机制的Promise
    return p
      .catch(function (e) {
        /* 忽略错误，继续执行 */
      })
      .then(function () {
        return ret
      })
  }
  //并发promise并按顺序输出结果
  async logInOrder(urls) {
    // 并发读取远程URL
    // 只有async函数内部是继发执行，外部不受影响
    const textPromises = urls.map(async url => {
      const response = await fetch(url)
      return response.text()
    })

    // 按次序输出
    for (const textPromise of textPromises) {
      console.log(await textPromise)
    }
  }
  constructor(executor) {
    //状态初始化
    this.status = My.PENDING
    this.value = null
    //以后then要执行的函数
    this.callbacks = []
    //错误交给reject处理
    try {
      //执行resolve或reject
      executor(this.resolve.bind(this), this.reject.bind(this))
    } catch (error) {
      this.reject(error)
    }
  }
  //resolve方法
  resolve(value) {
    //防止重复改变状态
    if (this.status == My.PENDING) {
      this.status = My.FULFILLED
      this.value = value
      //异步调用callbacks中对应的方法
      setTimeout(() => {
        this.callbacks.map(callback => {
          callback.onFulfilled(this.value)
        })
      }, 4)
    }
  }
  //reject方法
  reject(reason) {
    //防止重复改变状态
    if (this.status == My.PENDING) {
      this.status = My.REJECTED
      this.value = reason
      //异步调用callbacks中对应的方法
      setTimeout(() => {
        this.callbacks.map(callback => {
          callback.onRejected(this.value)
        })
      }, 4)
    }
  }
  //then方法
  then(onFulfilled, onRejected) {
    //确保onFulfilled和onRejected为函数
    if (typeof onFulfilled != 'function') {
      //then不传参时返回value实现then的穿透
      onFulfilled = () => this.value
    }
    if (typeof onRejected != 'function') {
      //then不传参时返回value实现then的穿透
      onRejected = () => this.value
    }
    //then的链式操作——返回一个新的My对象
    let promise = new My((resolve, reject) => {
      console.log(this)
      //准备状态对应操作
      if (this.status == My.PENDING) {
        //压入要执行的方法
        this.callbacks.push({
          onFulfilled: value => {
            this.parse(promise, onFulfilled(value), resolve, reject)
          },
          onRejected: reason => {
            this.parse(promise, onRejected(reason), resolve, reject)
          },
        })
      }
      //完成状态对应操作
      else if (this.status == My.FULFILLED) {
        //模拟异步
        setTimeout(() => {
          this.parse(promise, onFulfilled(this.value), resolve, reject)
        }, 4)
      }
      //拒绝状态对应操作
      else if (this.status == My.REJECTED) {
        //模拟异步
        setTimeout(() => {
          this.parse(promise, onRejected(this.value), resolve, reject)
        }, 4)
      }
    })
    return promise
  }
  //promise返回的新的promise
  //result-上一个promise then的结果promise
  parse(promise, result, resolve, reject) {
    //不能再当前promise then处理当中返回当前promise
    if (promise === result) {
      throw new TypeError('Chanining cycle detected')
    }
    try {
      //返回promise对象时
      if (result instanceof My) {
        //调用上一个promise的then方法改变这个promise的状态
        result.then(
          value => {
            resolve(value)
          },
          reason => {
            reject(reason)
          }
        )
        // result.then(resolve, reject);
      }
      //返回普通对象时
      else {
        //将上一个promsie then的结果传给下一个promise
        resolve(result)
      }
    } catch (error) {
      reject(error)
    }
  }
}
