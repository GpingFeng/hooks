import { useCallback, useRef, useState } from 'react';

// 管理动态列表状态，并能生成唯一 key 的 hook
const useDynamicList = <T>(
  // 列表的初始值
  initialList: T[] = [],
) => {
  // 当前的指向
  const counterRef = useRef(-1);
  // key List
  const keyList = useRef<number[]>([]);
  // 设置唯一的 key，通过 ref 保证 key 的唯一性
  const setKey = useCallback((index: number) => {
    // 每次都加1
    counterRef.current += 1;
    // 将 key 值放入到列表中
    keyList.current.splice(index, 0, counterRef.current);
  }, []);
  // 列表设置
  const [list, setList] = useState(() => {
    initialList.forEach((_, index) => {
      setKey(index);
    });
    return initialList;
  });

  // 重置 list，重新设置 list 的值
  const resetList = useCallback((newList: T[]) => {
    // 先重置 key
    keyList.current = [];
    setList(() => {
      // 设置 key
      newList.forEach((_, index) => {
        setKey(index);
      });
      return newList;
    });
  }, []);

  // 在指定位置插入元素
  const insert = useCallback((index: number, item: T) => {
    setList((l) => {
      const temp = [...l];
      temp.splice(index, 0, item);
      setKey(index);
      return temp;
    });
  }, []);

  // 获取某个元素的 key 值
  const getKey = useCallback((index: number) => keyList.current[index], []);

  // 获取某个值的下标
  const getIndex = useCallback(
    (key: number) => keyList.current.findIndex((ele) => ele === key),
    [],
  );

  // 将两个列表合并
  const merge = useCallback((index: number, items: T[]) => {
    setList((l) => {
      // 维护一个临时列表
      const temp = [...l];
      // 设置 key
      items.forEach((_, i) => {
        setKey(index + i);
      });
      // 合并
      temp.splice(index, 0, ...items);
      return temp;
    });
  }, []);

  // 替换
  const replace = useCallback((index: number, item: T) => {
    setList((l) => {
      const temp = [...l];
      temp[index] = item;
      return temp;
    });
  }, []);

  // 移除
  const remove = useCallback((index: number) => {
    setList((l) => {
      const temp = [...l];
      temp.splice(index, 1);

      // remove keys if necessary
      try {
        keyList.current.splice(index, 1);
      } catch (e) {
        console.error(e);
      }
      return temp;
    });
  }, []);

  // 移动元素
  const move = useCallback((oldIndex: number, newIndex: number) => {
    if (oldIndex === newIndex) {
      return;
    }
    setList((l) => {
      // 维护一个临时数组
      const newList = [...l];
      // 过滤掉「源数据下标项」
      const temp = newList.filter((_, index: number) => index !== oldIndex);
      // 插入到目标下标项中
      temp.splice(newIndex, 0, newList[oldIndex]);

      // move keys if necessary
      try {
        // 维护 keyList
        const keyTemp = keyList.current.filter((_, index: number) => index !== oldIndex);
        keyTemp.splice(newIndex, 0, keyList.current[oldIndex]);
        keyList.current = keyTemp;
      } catch (e) {
        console.error(e);
      }

      return temp;
    });
  }, []);

  // 在列表末尾添加元素	
  const push = useCallback((item: T) => {
    setList((l) => {
      setKey(l.length);
      return l.concat([item]);
    });
  }, []);

  // 移除末尾项
  const pop = useCallback(() => {
    // remove keys if necessary
    try {
      keyList.current = keyList.current.slice(0, keyList.current.length - 1);
    } catch (e) {
      console.error(e);
    }

    setList((l) => l.slice(0, l.length - 1));
  }, []);

  // 在列表起始位置添加元素
  const unshift = useCallback((item: T) => {
    setList((l) => {
      setKey(0);
      return [item].concat(l);
    });
  }, []);

  // 移除起始位置元素
  const shift = useCallback(() => {
    // remove keys if necessary
    try {
      keyList.current = keyList.current.slice(1, keyList.current.length);
    } catch (e) {
      console.error(e);
    }
    setList((l) => l.slice(1, l.length));
  }, []);

  // 校准排序
  const sortList = useCallback(
    (result: T[]) =>
      result
        .map((item, index) => ({ key: index, item })) // add index into obj
        .sort((a, b) => getIndex(a.key) - getIndex(b.key)) // sort based on the index of table
        .filter((item) => !!item.item) // remove undefined(s)
        .map((item) => item.item), // retrive the data
    [],
  );

  return {
    list,
    insert,
    merge,
    replace,
    remove,
    getKey,
    getIndex,
    move,
    push,
    pop,
    unshift,
    shift,
    sortList,
    resetList,
  };
};

export default useDynamicList;
