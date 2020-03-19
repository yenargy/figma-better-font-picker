import './ui.css'
import $ from 'jquery';

// Global variable declarations
let fontsCluster = null;
let searchInput = $('#search');
let fontRowDiv = [];
let cleanedFontList = [];
let searchResults = [];
let detectIndex = 0;
let detectLimit = 15;

// Fetching list of fonts from figma
$(document).ready(() => {
    parent.postMessage({ pluginMessage: { type: 'fetch-fonts'} }, '*')
    searchInput.focus();
})

// Initing search cluster
let searchCluster = new Clusterize({
    rows: searchResults,
    rows_in_block: 15,
    tag: 'div',
    scrollId: 'search-scroll-area',
    contentId: 'search-content-area',
    show_no_data_row: false
});

//event handler from figma
onmessage = event => {
    const message = event.data.pluginMessage;
    const data = message.data;
    const type = message.type;

    if (type === 'FONT_LOADED') {
        addFontRows(data, false);
    }
}

// On click listener for font rows
$(document).on("click", ".font-row", function(){
    const name = $(this).attr('data-content');
    parent.postMessage({ pluginMessage: { type: 'set-font', data: name } }, '*')
});

// Function to clean out the fonts array returned from figma
const addFontRows = (fonts) => {
    for(let i = 0; i < fonts.length; i++) {
        if (fonts[i] && !fonts[i].fontName.family.startsWith('.')) {
            if (((i > 0 && fonts[i].fontName.family !== fonts[i-1].fontName.family) || i==0)) {
                cleanedFontList.push(fonts[i].fontName.family);
                fontRowDiv.push(`
                <div class="font-row" data-content="` + fonts[i].fontName.family + `" ` +
                `style="font-family: '` + fonts[i].fontName.family.toString() + `', sans-serif">` +
                fonts[i].fontName.family +
                `</div>`);
            }
        } else {
            fonts.splice(i, 1);
            i++;
        }
    }

    for (detectIndex; detectIndex < detectLimit; detectIndex++) {
        if (!detectFont(cleanedFontList[detectIndex])) {
            // console.log('-------------------------------------');
            // console.log('removing: ', cleanedFontList[detectIndex]);
            // console.log('-------------------------------------');
            cleanedFontList.splice(detectIndex, 1);
            fontRowDiv.splice(detectIndex, 1);
            detectIndex--;
        }
    }

    fontsCluster = new Clusterize({
        rows: fontRowDiv,
        rows_in_block: 15,
        tag: 'div',
        scrollId: 'fonts-scroll-area',
        contentId: 'fonts-content-area',
        no_data_text: 'No fonts found :(',
        callbacks: {
            clusterChanged: function() {
                if (detectIndex > cleanedFontList.length || searchInput.val().length > 0) {
                    return;
                }
                for(detectIndex; detectIndex < detectLimit; detectIndex++) {
                    if (detectIndex < cleanedFontList.length && !detectFont(cleanedFontList[detectIndex])) {
                        // console.log('-------------------------------------');
                        // console.log('removing: ' + detectIndex +": " + cleanedFontList[detectIndex]);
                        // console.log('-------------------------------------');
                        cleanedFontList.splice(detectIndex, 1);
                        fontRowDiv.splice(detectIndex, 1);
                        detectIndex--;
                        fontsCluster.update(fontRowDiv);
                    }
                }
                detectLimit += 15;
            },
        }
    });
}

// Debounce setup variables
let typingTimer;
let doneTypingInterval = 500;

// On keyup event listener
searchInput.on('keyup', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
});


// After debounce function
const doneTyping = () => {
    searchCluster.update([]);
    const searchValue = searchInput.val().toLowerCase();
    if (searchValue.length > 2) {
        let searchResults = fontRowDiv.filter((font, index) =>  {
            let fontName = font.substring(font.indexOf(">") + 1, font.lastIndexOf("<"));
            if (fontName.toLowerCase().includes(searchValue) && detectFont(fontName)) {
                return true;
            }
            return false;
        });
        if (searchResults.length === 0) {
            searchCluster.update([]);
            $('#fonts-scroll-area').hide();
            $('#seach-scroll-area').hide();
            $('#empty-search').show();
        } else {
            searchCluster.update(searchResults);
            $('#empty-search').hide();
            $('#fonts-scroll-area').hide();
            $('#search-scroll-area').show();
        }
    }
    if (searchValue.length === 0) {
        $('#fonts-scroll-area').show();
        $('#empty-search').hide();
        $('#empty-search').show();
    }
}

$('#clear-search').on('click', function(e) {
    searchCluster.update([]);
    $('#empty-search').hide();
    $('#search-scroll-area').hide();
    $('#fonts-scroll-area').show();
    $('#search').val('');
});

/* Figma returns bunch of unnecessary/weird system fonts that don't render in browser.
 * Hence this following font detection piece to eliminate those fonts
 * https://github.com/alanhogan/bookmarklets/blob/master/font-stack-guess.js
 */

// Using m or w because these two characters take up the maximum width.
// And a LLi so that the same matching fonts can get separated
let testString = "mmmmmmmmmmlli";

//Testing using 72px font size. I guess larger the better.
let testSize = '72px';
let defaultWidth = 0;
let defaultHeight = 0;

let body = document.getElementsByTagName("body")[0];

// create a SPAN in the document to get the width of the text we use to test
let s = document.createElement("span");
s.style.fontSize = testSize;
s.style.visibility = 'hidden';
s.innerHTML = testString;
s.style.fontFamily = 'serif';
body.appendChild(s);
defaultWidth = s.offsetWidth;
defaultHeight = s.offsetHeight;

/* Function which adds a text layer, calculates the width with defaul ones to
 * detect wether browser has the font installed or not
 */
const detectFont = (font) =>{
    let detected = false;
    s.style.fontFamily = '"' + font + '"' + ',' + 'serif';
    let matched = (s.offsetWidth != defaultWidth || s.offsetHeight != defaultHeight);
    detected = detected || matched;
    // console.log(font + " : " + detected);
    return detected;
}