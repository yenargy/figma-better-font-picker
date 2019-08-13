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

// $('#fonts').on('scroll', function(e) {
//     let scrollTop = $('#fonts').scrollTop();
//     let windowHeight = fontDiv.scrollHeight;
//     let scrollPercentage = (scrollTop / windowHeight);
//     console.log(windowHeight);
//     console.log(scrollTop);
//     console.log($('#fonts').height());
//     // if (scrollTop + Math.ceil($('#fonts').height()) >= fontDiv.scrollHeight-10) {
//     //     console.log('reached bottom');
//     //     addFontRows(fonts, false);
//     // }
//     if (scrollPercentage > 0.5 && paginationIndex < fonts.length) {
//         // addFontRows(fonts, false);
//     }
// });

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

const addFonts = (fonts, searchResults) => {
    let fontRowDiv = [];

    for (var i=0; i<fonts.length; i++) {
        fontRowDiv.push(`
        <div class="font-row" data-content="` + fonts[i].fontName.family + `" ` +
        `style="font-family: '` + fonts[i].fontName.family.toString() + `', sans-serif">` +
        fonts[i].fontName.family +
        `</div>`);
    }
    document.getElementById('fonts').innerHTML = fontRowDiv.join('');
}

const setFonts = async (fontRow, name) => {
    fontRow.style.fontFamily = "'" + name + "', sans-serif";
}

const addFontRows = (fonts, searchResults) => {
    let index = paginationIndex;
    let lim = limit;
    if (searchResults) {
        index = 0;
        lim = fonts.length;
    }
    // console.log(limit);
    // console.log(index);
    let fontRowDiv = [];
    console.log(fastdom);
    var c = document.createDocumentFragment();
    console.time("adding fonts");
    for(let i = index; i < fonts.length; i++) {
        if (fonts[i] && !fonts[i].fontName.family.startsWith('.')) {
            if (((i > 0 && fonts[i].fontName.family !== fonts[i-1].fontName.family) || i==0)) {
                // let fontRow = document.createElement("DIV");
                // fontRow.textContent = fonts[i].fontName.family;
                // fontRow.style.fontFamily = "'" + fonts[i].fontName.family.toString() + "', sans-serif";
                // fontRow.className = "font-row"
                // fontRow.style.fontStyle = fonts[i].fontName.style;
                // fontRow.onclick = function() {
                //     parent.postMessage({ pluginMessage: { type: 'set-font', data: fontRow.innerText} }, '*')
                // };

                // let fontRow = document.createElement("DIV");
                // // fontRow.innerHTML = 'mmmmmmmmmmlli';
                // // setTimeout(() => {
                // //     fontRow.style.fontFamily = "'" + fonts[i].fontName.family.toString() + "', sans-serif";
                // // }, 1000)
                // setTimeout(() => {
                //     setFonts(fontRow, fonts[i].fontName.family.toString())
                // }, 1000)
                // fontRow.className = "font-row"
                // // fontRow.style.fontStyle = fonts[i].fontName.style;
                // fontRow.onclick = function() {
                //     parent.postMessage({ pluginMessage: { type: 'set-font', data: fontRow.innerText} }, '*')
                // };
                // h.appendChild(fontRow);
                // let matched = (fontRow.offsetWidth != defaultWidth || fontRow.offsetHeight != defaultHeight);
                // h.removeChild(fontRow);
                // if (matched) {
                //     fontRow.textContent = fonts[i].fontName.family;
                //     c.appendChild(fontRow);
                // }

                // fontRow.textContent = fonts[i].fontName.family;
                // c.appendChild(fontRow);


                fontRowDiv.push(`
                <div class="font-row" data-content="` + fonts[i].fontName.family + `" ` +
                `style="font-family: '` + fonts[i].fontName.family.toString() + `', sans-serif">` +
                fonts[i].fontName.family +
                `</div>`);

                // if (searchResults) {
                //     $('#search-results').append(fontRow);
                // } else {
                //     // $('#fonts').append(fontRow);
                // }
            }
        } else {
            fonts.splice(i, 1);
        }
    }

    let clusterize = new Clusterize({
        rows: fontRowDiv,
        rows_in_block: 15,
        scrollId: 'scrollArea',
        contentId: 'contentArea'
    });

    if (searchResults) {
        return;
    }

    //Pagination stuff. TODO: cleanup this mess
    if (firstCall) {
        paginationIndex += 500;
        if (limit < fonts.length) {
            limit += 500;
            if (limit > fonts.length) {
                limit = fonts.length;
            }
        }
        firstCall = false;
    } else {
        paginationIndex += 500;
        if (limit < fonts.length) {
            limit += 500;
            if (limit > fonts.length) {
                limit = fonts.length;
            }
        }
    }
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

let h = document.getElementsByTagName("body")[0];

// create a SPAN in the document to get the width of the text we use to test
let s = document.createElement("span");
s.style.fontSize = testSize;
s.innerHTML = testString;
let defaultWidth = 0;
let defaultHeight = 0;
s.style.fontFamily = 'serif';
h.appendChild(s);
defaultWidth = s.offsetWidth;
defaultHeight = s.offsetHeight;
h.removeChild(s);

// var c = document.createDocumentFragment();
// for (var i=0; i<10000; i++) {
//     var e = document.createElement("div");
//     e.className = "test-div";
//     c.appendChild(e);
// }
// document.body.appendChild(c);

const detectFont = (font) =>{
    let detected = false;
    s.style.fontFamily = '"' + font + '"' + ',' + 'serif';
    h.appendChild(s);
    let matched = (s.offsetWidth != defaultWidth || s.offsetHeight != defaultHeight);
    h.removeChild(s);
    detected = detected || matched;
    // console.log(font + " : " + detected);
    return detected;
}