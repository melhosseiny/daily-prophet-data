export function Transform(spec) {
  let imgNode = function(node, loading, host = '') {
    // console.log(`imgNode`, node)
    node._type = 'html_block';
    node.literal = '<figure><picture><source srcset="' + host + '/' + node.destination + '" type="image/png"><img' + (loading === 'lazy' ? ' loading="lazy"' : '') + ' src="' + host + '/' + node.destination + '" alt=""></picture></figure>';
    node.destination = null;
    node._parent._type = 'document';
    return node;
  }

  let imgInHtmlBlock = function(node, loading, host = '') {
    let parser = new DOMParser();
    let doc = parser.parseFromString(node.literal, 'text/html');
    let imgs = doc.querySelectorAll('img');
    [...imgs].map(img => {
      // console.log(`imginHtmlBlock`, node, img);
      let srcParts = img.src.split('/');
      let relPath = srcParts.slice(3,srcParts.length).join('/');
      // console.log(host, srcParts, relPath);
      if (loading === 'lazy') {
        img.setAttribute('loading', loading);
      }
      img.setAttribute('src', host + '/' + relPath);

      let picture = doc.createElement('picture');
      let source = doc.createElement('source');
      source.setAttribute('type','image/png');
      source.setAttribute('srcset', host + '/' + relPath);
      picture.appendChild(source);
      img.parentNode.insertBefore(picture,img);
      picture.appendChild(img);

    })
    let s = new XMLSerializer();
    let serializedDom = s.serializeToString(doc.body.children[0]).replace(' xmlns="http://www.w3.org/1999/xhtml"',"");
    //console.log(serializedDom);
    node.literal = serializedDom;
    return node;
  }

  let videoInHtmlBlock = function(node, loading, host = '') {
    let parser = new DOMParser();
    let doc = parser.parseFromString(node.literal, 'text/html');
    let sources = doc.querySelectorAll('video source');
    console.log('videos', sources);


    [...sources].map(source => {
      let srcParts = source.src.split('/');
      let relPath = srcParts.slice(3,srcParts.length).join("/");
      console.log('src', host + '/' + relPath);
      source.setAttribute('src', host + '/' + relPath);

      let s = new XMLSerializer();
      let serializedDom = s.serializeToString(doc.body.children[0]).replace(' xmlns="http://www.w3.org/1999/xhtml"',"");
      node.literal = serializedDom;
      return node;
    })

    return node;
  }

  return Object.freeze({
    imgNode,
    imgInHtmlBlock,
    videoInHtmlBlock
  });
}
