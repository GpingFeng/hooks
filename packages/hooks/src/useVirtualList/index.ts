import { useEffect, useMemo, useState, useRef } from 'react';
import useEventListener from '../useEventListener';
import useLatest from '../useLatest';
import useMemoizedFn from '../useMemoizedFn';
import useSize from '../useSize';
import { getTargetElement } from '../utils/domTarget';
import type { BasicTarget } from '../utils/domTarget';
import { isNumber } from '../utils';

// 提供虚拟化列表能力的 Hook，用于解决展示海量数据渲染时首屏渲染缓慢和滚动卡顿问题。
export interface Options<T> {
  containerTarget: BasicTarget;
  wrapperTarget: BasicTarget;
  itemHeight: number | ((index: number, data: T) => number);
  overscan?: number;
}

const useVirtualList = <T = any>(
  // 源数据
  list: T[],
  options: Options<T>,
) => {
  const {
    // 外面容器，支持 DOM 节点或者 Ref 对象
    containerTarget,
    // 内部容器，支持 DOM 节点或者 Ref 对象
    wrapperTarget,
    // 行高度，静态高度可以直接写入像素值，动态高度可传入函数
    itemHeight,
    // 视区上、下额外展示的 DOM 节点数量
    overscan = 5,
  } = options;

  // 取到最新的行高
  const itemHeightRef = useLatest(itemHeight);
  // 获取到元素的 size，{ width: **, height: ** }
  const size = useSize(containerTarget);

  const scrollTriggerByScrollToFunc = useRef(false);
  // 需要渲染出来的 list
  const [targetList, setTargetList] = useState<{ index: number; data: T }[]>([]);

  // 计算出可视区域内的数量
  const getVisibleCount = (containerHeight: number, fromIndex: number) => {
    // 知道每一行的高度 - number 类型，则根据容器计算
    if (isNumber(itemHeightRef.current)) {
      return Math.ceil(containerHeight / itemHeightRef.current);
    }

    let sum = 0;
    let endIndex = 0;
    for (let i = fromIndex; i < list.length; i++) {
      // 计算每一个 Item 的高度
      const height = itemHeightRef.current(i, list[i]);
      sum += height;
      endIndex = i;
      // 大于容器宽度的时候，停止
      if (sum >= containerHeight) {
        break;
      }
    }
    // 最后一个的下标减去开始一个的下标
    return endIndex - fromIndex;
  };

  // 根据 scrollTop 计算上面有多少个 DOM 节点
  const getOffset = (scrollTop: number) => {
    if (isNumber(itemHeightRef.current)) {
      return Math.floor(scrollTop / itemHeightRef.current) + 1;
    }
    let sum = 0;
    let offset = 0;
    // 从 0 开始
    for (let i = 0; i < list.length; i++) {
      const height = itemHeightRef.current(i, list[i]);
      sum += height;
      if (sum >= scrollTop) {
        offset = i;
        break;
      }
    }
    // 满足要求的最后一个 + 1
    return offset + 1;
  };

  // 获取上部高度
  const getDistanceTop = (index: number) => {
    if (isNumber(itemHeightRef.current)) {
      const height = index * itemHeightRef.current;
      return height;
    }
    const height = list
      .slice(0, index)
      // reduce 计算总和
      // @ts-ignore
      .reduce((sum, _, i) => sum + itemHeightRef.current(i, list[index]), 0);
    return height;
  };

  // 计算总的高度
  const totalHeight = useMemo(() => {
    if (isNumber(itemHeightRef.current)) {
      return list.length * itemHeightRef.current;
    }
    // @ts-ignore
    return list.reduce((sum, _, index) => sum + itemHeightRef.current(index, list[index]), 0);
  }, [list]);

  // 计算范围，由哪个开始，哪个结束
  const calculateRange = () => {
    // 获取外部和内部容器
    // 外部容器
    const container = getTargetElement(containerTarget);
    // 内部容器
    const wrapper = getTargetElement(wrapperTarget);

    if (container && wrapper) {
      const {
        // 滚动距离顶部的距离。设置或获取位于对象最顶端和窗口中可见内容的最顶端之间的距离
        scrollTop,
        // 内容可视区域的高度
        clientHeight,
      } = container;

      // 上面有多少个 Item
      const offset = getOffset(scrollTop);
      // 可视区域的 DOM 个数
      const visibleCount = getVisibleCount(clientHeight, offset);

      // 开始的下标
      const start = Math.max(0, offset - overscan);
      // 结束的下标
      const end = Math.min(list.length, offset + visibleCount + overscan);

      // 获取上方高度
      const offsetTop = getDistanceTop(start);
      // 设置内部容器的高度，总的盖度 - 上方高度
      // @ts-ignore
      wrapper.style.height = totalHeight - offsetTop + 'px';
      // margin top 为上方高度
      // @ts-ignore
      wrapper.style.marginTop = offsetTop + 'px';

      setTargetList(
        list.slice(start, end).map((ele, index) => ({
          data: ele,
          index: index + start,
        })),
      );
    }
  };

  // 当外部容器的 size 发生变化的时候，触发
  useEffect(() => {
    if (!size?.width || !size?.height) {
      return;
    }
    // 重新计算逻辑
    calculateRange();
  }, [size?.width, size?.height, list]);

  // 监听 scroll 事件
  useEventListener(
    'scroll',
    (e) => {
      // 如果是直接跳转，则不需要重新计算
      if (scrollTriggerByScrollToFunc.current) {
        scrollTriggerByScrollToFunc.current = false;
        return;
      }
      e.preventDefault();
      calculateRange();
    },
    {
      // 外部容器
      target: containerTarget,
    },
  );

  // 滚动到指定的 index
  const scrollTo = (index: number) => {
    const container = getTargetElement(containerTarget);
    if (container) {
      scrollTriggerByScrollToFunc.current = true;
      // 滚动
      container.scrollTop = getDistanceTop(index);
      calculateRange();
    }
  };
  // as const https://juejin.cn/post/6844903848939634696
  // 该表达式中的字面类型不应被扩展（例如：不能从“hello”转换为字符串）
  // 对象字面量获取只读属性
  // 数组文字成为只读元组
  return [targetList, useMemoizedFn(scrollTo)] as const;
};

export default useVirtualList;
