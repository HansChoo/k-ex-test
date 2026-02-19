interface MetaTagData {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
}

const setMetaTag = (attribute: string, key: string, value: string) => {
  let element = document.querySelector(`meta[${attribute}="${key}"]`) as HTMLMetaElement | null;
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
};

export const updateMetaTags = (data: MetaTagData) => {
  if (data.title) {
    document.title = data.title;
    setMetaTag('property', 'og:title', data.title);
    setMetaTag('name', 'twitter:title', data.title);
  }

  if (data.description) {
    setMetaTag('name', 'description', data.description);
    setMetaTag('property', 'og:description', data.description);
    setMetaTag('name', 'twitter:description', data.description);
  }

  if (data.image) {
    setMetaTag('property', 'og:image', data.image);
    setMetaTag('name', 'twitter:image', data.image);
  }

  if (data.url) {
    setMetaTag('property', 'og:url', data.url);
  }

  if (data.type) {
    setMetaTag('property', 'og:type', data.type);
  }

  if (data.keywords) {
    setMetaTag('name', 'keywords', data.keywords);
  }

  setMetaTag('name', 'twitter:card', 'summary_large_image');
};
