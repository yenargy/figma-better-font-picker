// This shows the HTML page in "ui.html". UI is completely optional. Feel free
// to delete this if you don't want your plugin to have any UI. In that case
// you can just call methods directly on the "figma" object in your plugin.
figma.showUI(__html__, { width: 300, height: 600 });

// Calls to "parent.postMessage" from within the HTML page will trigger this
// callback. The callback will be passed the "pluginMessage" property of the
// posted message.
figma.ui.onmessage = msg => {

  if (msg.type === 'fetch-fonts') {
    figma.listAvailableFontsAsync().then(fonts => {
      figma.ui.postMessage({ data: fonts, type: 'FONT_LOADED' })
    }).catch(error => {
      figma.ui.postMessage({ data: null, type: 'FONT_LOAD_ERROR' })
      console.log(error);
    });
  }

  if (msg.type === 'set-font') {
    for (const node of figma.currentPage.selection) {
      if (node.type === 'TEXT') {
        loadFont(msg.data, node);
      }
    }

    if (figma.currentPage.selection.length === 0) {
      figma.ui.postMessage({ data: null, type: 'NO_TEXT_LAYER' })
    }
  }

};

const loadFont = async (font, node) => {
  console.log(font);
  let fontStyles = ['Regular', 'Book', 'Plain', 'Normal', 'Mono', 'Medium', 'Light', 'Bold', 'Semi Bold', 'Heavy'];
  for (let index = 0; index < fontStyles.length; index++) {
    try {
      console.log('Trying font with ' + font + ' ' + fontStyles[index]);
      await figma.loadFontAsync({family: font, style: fontStyles[index]})
      node.fontName = { family: font, style: fontStyles[index]};
      index = fontStyles.length;
    } catch(error) {
      console.log(error + '. Will try with another font style 🤞');
      if (index == fontStyles.length -1) {
        figma.ui.postMessage({ data: null, type: 'SHOW_TOAST' })
      }
    }
  }
}