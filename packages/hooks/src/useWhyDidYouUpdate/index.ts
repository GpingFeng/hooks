import { useEffect, useRef } from 'react';

export type IProps = Record<string, any>;

export default function useWhyDidYouUpdate(componentName: string, props: IProps) {
  const prevProps = useRef<IProps>({});

  useEffect(() => {
    if (prevProps.current) {
      // 获取到所有的 keys
      const allKeys = Object.keys({ ...prevProps.current, ...props });
      const changedProps: IProps = {};

      // 看哪些 key 进行了更新
      allKeys.forEach((key) => {
        // 通过 Object.is 判断是否进行更新
        if (!Object.is(prevProps.current[key], props[key])) {
          changedProps[key] = {
            from: prevProps.current[key],
            to: props[key],
          };
        }
      });

      // 有 diff，则输出
      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', componentName, changedProps);
      }
    }

    // 记录上一次的值
    prevProps.current = props;
  });
}
