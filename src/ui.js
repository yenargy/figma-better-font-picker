import './ui.css'
import $ from 'jquery';

// Fetching list of fonts from figma
$(document).ready(() => {
    parent.postMessage({ pluginMessage: { type: 'fetch-fonts'} }, '*')
})

let fonts = [];
let paginationIndex = 0;
let limit = 500;
let fontDiv = document.getElementById("fonts");
let firstCall = true;

//event handler from figma
onmessage = event => {
    const message = event.data.pluginMessage;
    const data = message.data;
    const type = message.type;

    if (type === 'FONT_LOADED') {
        addFontRows(data, false);
        // addFonts(data, false);
        fonts = data;
    }
    if (type === 'SHOW_TOAST') {
        showToast('Unfortunately, this font could not be loaded :[');
    }
    if (type === 'NO_TEXT_LAYER') {
        showToast('Please select a text layer');
    }
    if (type === 'FONT_LOAD_ERROR') {
        showToast('There was an error while loading the font :[  Please restart the plugin');
    }
}

$(document).on("click",".font-row", function(){
    const name = $(this).attr('data-content');
    console.log(name);
    parent.postMessage({ pluginMessage: { type: 'set-font', data: name} }, '*')
});

const showToast = (str) => {
    $('#toast').text(str);
    $('#toast').fadeIn(200, function() {
        $('#toast').delay(2500).fadeOut();
    });
}

const addFontRows = (fonts, searchResults) => {
    let fontRowDiv = [];
    let cleanedFontList = [];
    for(let i = 0; i < fonts.length; i++) {
        if (fonts[i] && !fonts[i].fontName.family.startsWith('.')) {
            if (((i > 0 && fonts[i].fontName.family !== fonts[i-1].fontName.family) || i==0)) {
                cleanedFontList.push(fonts[i].fontName.family);
                fontRowDiv.push(`
                <div class="font-row" data-content="` + fonts[i].fontName.family + `" ` +
                `style="font-family: '` + fonts[i].fontName.family.toString() + `', serif">` +
                fonts[i].fontName.family +
                `</div>`);
            }
        } else {
            fonts.splice(i, 1);
        }
    }

    // detectFont(fonts[i].fontName.family);
    let detectIndex = 0;
    console.log(fontRowDiv.length);
    let clusterize = null;
    clusterize = new Clusterize({
        rows: fontRowDiv,
        rows_in_block: 15,
        scrollId: 'scrollArea',
        contentId: 'contentArea',
        callbacks: {
            clusterChanged: function() {
                for(detectIndex; detectIndex < 15; detectIndex++) {
                    if (!detectFont(cleanedFontList[detectIndex])) {
                        fontRowDiv.splice(detectIndex, 1);
                        console.log(clusterize);
                        // clusterize.update(fontRowDiv);
                    }
                }
                console.log(fontRowDiv.length);
            },
        }
    });

    console.log(clusterize.getScrollProgress());
}

// Debounce setup variables
let typingTimer;
let doneTypingInterval = 500;
let searchInput = document.getElementById('search');

// On keyup event listener
searchInput.addEventListener('keyup', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(doneTyping, doneTypingInterval);
});

// After debounce function
const doneTyping = () => {
    $('#search-results').empty();
    const searchValue = searchInput.value.toLowerCase();
    if (searchValue.length > 2) {
        let filteredFonts = fonts.filter((font, index) =>  {
            if (font.fontName.family.toLowerCase().includes(searchValue) && detectFont(font.fontName.family)) {
                return true;
            }
            return false;
        });

        if (filteredFonts.length === 0) {
            $('#fonts').hide();
            $('#search-results').hide();
            $('#empty-search').show();
        } else {
            $('#empty-search').hide();
            $('#fonts').hide();
            addFontRows(filteredFonts, true);
            $('#search-results').show();
        }
    }
    if (searchValue.length === 0) {
        $('#fonts').show();
        $('#empty-search').hide();
        $('#empty-search').show();
    }
}

$('#clear-search').on('click', function(e) {
    $('#search-results').empty();
    $('#empty-search').hide();
    $('#search-results').hide();
    $('#fonts').show();
    $('#search').val('');
    addFontRows(fonts, false);
});

/* Figma returns bunch of unnecessary/weird system fonts that don't render in browser.
 * Hence this following font detection piece to eliminate those fonts for better UX
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
s.innerHTML = testString;
s.style.fontFamily = 'serif';
body.appendChild(s);
defaultWidth = s.offsetWidth;
defaultHeight = s.offsetHeight;
// body.removeChild(s);


// for (var i=0; i<10000; i++) {
//     var e = document.createElement("div");
//     e.className = "test-div";
//     fragment.appendChild(e);
// }
// console.log(fragment);
// document.body.appendChild(c);

let i = 0;
const detectFont = (font) =>{
    console.log(font);
    let detected = false;
    s.style.fontFamily = '"' + font + '"' + ',' + 'serif';
    s.style.visibility = 'hidden';
    // console.log(s);
    body.appendChild(s);
    // fragment.appendChild(s)
    // console.log(fragment);
    let matched = (s.offsetWidth != defaultWidth || s.offsetHeight != defaultHeight);
    body.removeChild(s);
    detected = detected || matched;
    console.log(detected);
    // console.log(font + " : " + detected);
    return detected;
}