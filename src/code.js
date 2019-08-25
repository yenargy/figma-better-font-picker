figma.showUI(__html__, { width: 300, height: 600 });
let fontList = [];
figma.ui.onmessage = msg => {

  if (msg.type === 'fetch-fonts') {
    figma.listAvailableFontsAsync().then(fonts => {
      fontList = fonts;
      figma.ui.postMessage({ data: fonts, type: 'FONT_LOADED' })
    }).catch(error => {
      figma.notify('There was an error while loading the font :[  Please restart the plugin');
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
      figma.notify('Please select a text layer');
    }
  }

};

const loadFont = async (font, node) => {
  let fontStyles = ['Regular', 'Book', 'Plain', 'Normal', 'Roman', 'Mono', 'Medium', 'Light', 'Italic', 'Bold', 'Semi Bold', 'Heavy'];
  for (let index = 0; index < fontStyles.length; index++) {
    try {
      console.log('Trying font with ' + font + ' ' + fontStyles[index]);
      await figma.loadFontAsync({family: font, style: fontStyles[index]})
      node.fontName = { family: font, style: fontStyles[index]};
      index = fontStyles.length;
      console.log('Success!');
    } catch(error) {
      console.log(error + '. Will try with another font style 🤞');
      if (index == fontStyles.length -1) {
        for(let fontIndex in fontList) {
          if (fontList[fontIndex].fontName.family === font) {
            fontStyles.push(fontList[fontIndex].fontName.style)
          }
        }
      }
    }
  }
}