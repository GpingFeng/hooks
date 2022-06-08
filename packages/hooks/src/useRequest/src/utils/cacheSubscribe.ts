type Listener = (data: any) => void;
// 事件列表
const listeners: Record<string, Listener[]> = {};

// 触发某个 key 的所有事件
const trigger = (key: string, data: any) => {
  if (listeners[key]) {
    listeners[key].forEach((item) => item(data));
  }
};

// 每个 key 维护一个事件列表
const subscribe = (key: string, listener: Listener) => {
  if (!listeners[key]) {
    listeners[key] = [];
  }
  // push
  listeners[key].push(listener);

  // 返回清除订阅方法
  return function unsubscribe() {
    const index = listeners[key].indexOf(listener);
    listeners[key].splice(index, 1);
  };
};

export { trigger, subscribe };
