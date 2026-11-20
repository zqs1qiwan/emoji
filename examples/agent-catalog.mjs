import {
  getResource,
  listResources,
  resolveResource,
  resourceCatalog,
  resources,
  resourceSources,
} from 'emoji-kit';

const first = resolveResource({ app: 'wechat', format: 'png' });
const weibo = listResources({ app: 'weibo', format: 'png', limit: 3 });
const twemoji = getResource('twemoji-svg:1f44d.svg');

console.log(JSON.stringify({
  counts: resourceCatalog.counts,
  resources: resources.length,
  sources: resourceSources.length,
  firstWechat: first && {
    id: first.id,
    path: first.path,
    url: first.url,
    sha256: first.sha256,
  },
  weibo: weibo.map(({ id, path, format }) => ({ id, path, format })),
  twemojiThumbsUp: twemoji && {
    id: twemoji.id,
    path: twemoji.path,
    license: twemoji.license,
  },
}, null, 2));
