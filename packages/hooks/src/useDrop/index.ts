import useLatest from '../useLatest';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import useEffectWithTarget from '../utils/useEffectWithTarget';
import { useRef } from 'react';

export interface Options {
  onFiles?: (files: File[], event?: React.DragEvent) => void;
  onUri?: (url: string, event?: React.DragEvent) => void;
  onDom?: (content: any, event?: React.DragEvent) => void;
  onText?: (text: string, event?: React.ClipboardEvent) => void;
  onDragEnter?: (event?: React.DragEvent) => void;
  onDragOver?: (event?: React.DragEvent) => void;
  onDragLeave?: (event?: React.DragEvent) => void;
  onDrop?: (event?: React.DragEvent) => void;
  onPaste?: (event?: React.ClipboardEvent) => void;
}

// useDrop 可以单独使用来接收文件、文字和网址的拖拽。
const useDrop = (target: BasicTarget, options: Options = {}) => {
  const optionsRef = useLatest(options);

  // https://stackoverflow.com/a/26459269
  const dragEnterTarget = useRef<any>();

  useEffectWithTarget(
    () => {
      const targetElement = getTargetElement(target);
      if (!targetElement?.addEventListener) {
        return;
      }

      const onData = (
        dataTransfer: DataTransfer,
        event: React.DragEvent | React.ClipboardEvent,
      ) => {
        const uri = dataTransfer.getData('text/uri-list');
        const dom = dataTransfer.getData('custom');

        // 拖拽/粘贴自定义 DOM 节点的回调	
        if (dom && optionsRef.current.onDom) {
          let data = dom;
          try {
            data = JSON.parse(dom);
          } catch (e) {
            data = dom;
          }
          optionsRef.current.onDom(data, event as React.DragEvent);
          return;
        }

        // 拖拽/粘贴链接的回调
        if (uri && optionsRef.current.onUri) {
          optionsRef.current.onUri(uri, event as React.DragEvent);
          return;
        }

        // 拖拽/粘贴文件的回调
        if (dataTransfer.files && dataTransfer.files.length && optionsRef.current.onFiles) {
          optionsRef.current.onFiles(Array.from(dataTransfer.files), event as React.DragEvent);
          return;
        }

        // 拖拽/粘贴文字的回调
        if (dataTransfer.items && dataTransfer.items.length && optionsRef.current.onText) {
          dataTransfer.items[0].getAsString((text) => {
            optionsRef.current.onText!(text, event as React.ClipboardEvent);
          });
        }
      };

      const onDragEnter = (event: React.DragEvent) => {
        // 阻止默认事件
        event.preventDefault();
        // 阻止事件冒泡
        event.stopPropagation();
        dragEnterTarget.current = event.target;
        // 拖拽进入
        optionsRef.current.onDragEnter?.(event);
      };

      const onDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        // 拖拽中
        optionsRef.current.onDragOver?.(event);
      };

      const onDragLeave = (event: React.DragEvent) => {
        if (event.target === dragEnterTarget.current) {
          // 拖拽出去
          optionsRef.current.onDragLeave?.(event);
        }
      };

      const onDrop = (event: React.DragEvent) => {
        event.preventDefault();
        onData(event.dataTransfer, event);
        // 拖拽任意内容的回调
        optionsRef.current.onDrop?.(event);
      };

      const onPaste = (event: React.ClipboardEvent) => {
        // DataTransfer 对象用于保存拖动并放下（drag and drop）过程中的数据。它可以保存一项或多项数据，这些数据项可以是一种或者多种数据类型。关于拖放的更多信息，请参见 Drag and Drop.
        onData(event.clipboardData, event);
        // 粘贴内容的回调
        optionsRef.current.onPaste?.(event);
      };
      targetElement.addEventListener('dragenter', onDragEnter as any);
      targetElement.addEventListener('dragover', onDragOver as any);
      targetElement.addEventListener('dragleave', onDragLeave as any);
      targetElement.addEventListener('drop', onDrop as any);
      targetElement.addEventListener('paste', onPaste as any);

      return () => {
        targetElement.removeEventListener('dragenter', onDragEnter as any);
        targetElement.removeEventListener('dragover', onDragOver as any);
        targetElement.removeEventListener('dragleave', onDragLeave as any);
        targetElement.removeEventListener('drop', onDrop as any);
        targetElement.removeEventListener('paste', onPaste as any);
      };
    },
    [],
    target,
  );
};

export default useDrop;
