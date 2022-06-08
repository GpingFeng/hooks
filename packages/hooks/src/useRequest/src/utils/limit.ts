export default function limit(fn: any, timespan: number) {
  // 设置一个标识位，标识还在 pending 阶段，不应该进行请求
  let pending = false;
  return (...args: any[]) => {
    // 假如正处于 pending，则直接返回
    if (pending) return;
    pending = true;
    fn(...args);
    setTimeout(() => {
      // 标识位置为 false，允许请求
      pending = false;
    }, timespan);
  };
}
