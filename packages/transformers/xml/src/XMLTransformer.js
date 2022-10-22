// @flow
import {Transformer} from '@parcel/plugin';
import {DOMParser, XMLSerializer} from '@xmldom/xmldom';
import * as atom from './atom';
import * as rss from './rss';

const HANDLERS = {
  'http://www.w3.org/2005/Atom': atom,
};

const NON_NAMESPACED_HANDLERS = {
  rss,
};

export default (new Transformer({
  async transform({asset}) {
    let code = await asset.getCode();
    let parser = new DOMParser();
    let dom = parser.parseFromString(code, 'application/xml');

    let parts = [];
    let nonNamespacedHandlers = !dom.documentElement.namespaceURI
      ? NON_NAMESPACED_HANDLERS[dom.documentElement.nodeName] || {}
      : {};

    walk(dom, node => {
      if (node.nodeType !== 1) {
        return;
      }

      let handler = node.namespaceURI
        ? HANDLERS[node.namespaceURI]?.[node.localName]
        : nonNamespacedHandlers[node.nodeName];

      if (handler) {
        handler(node, asset, parts);
      }
    });

    code = new XMLSerializer().serializeToString(dom);
    asset.setCode(code);

    return [asset, ...parts];
  },
}): Transformer);

function walk(element: any, visit: any) {
  visit(element);

  element = element.firstChild;
  while (element) {
    walk(element, visit);
    element = element.nextSibling;
  }
}
