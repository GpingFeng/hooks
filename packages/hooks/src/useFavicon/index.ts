import { useEffect } from 'react';

const ImgTypeMap = {
  SVG: 'image/svg+xml',
  ICO: 'image/x-icon',
  GIF: 'image/gif',
  PNG: 'image/png',
};

type ImgTypes = keyof typeof ImgTypeMap;

const useFavicon = (href: string) => {
  useEffect(() => {
    if (!href) return;

    const cutUrl = href.split('.');
    const imgSuffix = cutUrl[cutUrl.length - 1].toLocaleUpperCase() as ImgTypes;

    const link: HTMLLinkElement =
      document.querySelector("link[rel*='icon']") || document.createElement('link');
    // 用于定义链接的内容的类型。
    link.type = ImgTypeMap[imgSuffix];
    // 指定被链接资源的URL。
    link.href = href;
    // 此属性命名链接文档与当前文档的关系。
    link.rel = 'shortcut icon';

    document.getElementsByTagName('head')[0].appendChild(link);
  }, [href]);
};

export default useFavicon;
