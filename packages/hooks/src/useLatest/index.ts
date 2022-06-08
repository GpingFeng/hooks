import { useRef } from 'react';
// 通过 useRef，保持每次获取到的都是最新的值
function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;

  return ref;
}

export default useLatest;
