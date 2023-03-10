

// Handles the user's file selection. The file input button specifies this handler.
function handleFileSelect(selector) {
    var files = document.getElementById(selector).files; // FileList object

    // The list will contain only one file.
    for (var i = 0, f; f = files[i]; i++) {

        // Only process image files.
        if (!f.type.match('image.*')) {
            alert("Selected file must be an image file.");
            document.getElementById("uploadImage").value = null;
            continue;
        }

        // Image must be <= 1 MB and should be about 1500px.
        if (f.size > 1000000) {
            alert("Image must be less than 1 MB.");
            document.getElementById("uploadImage").value = null;
            continue;
        }
        


        var reader = new FileReader();

        // Capture the file information.
        reader.onload = (function (theFile) {
            return function (e) {
                var fileOutput = document.getElementById('thumbnail');

                if (fileOutput.childElementCount > 0) {
                    fileOutput.removeChild(fileOutput.lastChild);  // Remove the current pic, if it exists
                }

                // Render thumbnail.
                var span = document.createElement('span');
                span.innerHTML = ['<img class="thumb" src="', e.target.result,
                    '" title="', escape(theFile.name), '"/>'].join('');
                fileOutput.insertBefore(span, null);
            };
        })(f);

        // Read in the image file as a data URL.
        reader.readAsDataURL(f);
    }
}


// Contains the toggle state of divs.
var divToggleMap = {};  // divToggleMap['foo'] = 0;  // 1 = show, 0 = hide


// Toggles between showing and hiding the specified div.
function expandCollapse(divToToggle) {
    var div = document.getElementById(divToToggle);

    if (divToggleMap[divToToggle] == 1) {   // if div is expanded
        div.style.display = "none";
        divToggleMap[divToToggle] = 0;
    }
    else {                                  // if div is collapsed
        div.style.display = "inline-block";
        divToggleMap[divToToggle] = 1;
    }
}


// Called when the user clicks the Query insights button.
function handleQuery() {
    var subscriptionKey = '228d949518f14528b96bed00b79b1573';

    // Make sure user provided a subscription key and image.
    // For this demo, the user provides the key but typically you'd 
    // get it from secured storage.
    if (subscriptionKey.length !== 32) {
        alert("Subscription key length is not valid. Enter a valid key.");
        document.getElementById('key').focus();
        return;
    }

    var imagePath = document.getElementById('uploadImage').value;

    if (imagePath.length === 0) {
        alert("Please select an image to upload.");
        document.getElementById('uploadImage').focus();
        return;
    }

    var responseDiv = document.getElementById('responseSection');

    // Clear out the response from the last query.
    while (responseDiv.childElementCount > 0) {
        responseDiv.removeChild(responseDiv.lastChild);
    }

    // Send the request to Bing to get insights about the image.
    var f = document.getElementById('uploadImage').files[0];
    sendRequest(f, subscriptionKey);
}


// Format the request and send it.
function sendRequest(file, key) {
    // var market = document.getElementById('mkt').value;
    // var safeSearch = document.getElementById('safesearch').value;
    // https://southeastasia.api.cognitive.microsoft.com/bing/v7.0/search.
    // let baseUri = "https://api.bing.microsoft.com/v7.0/images/search?q=iphone";
    let baseUri = "https://api.bing.microsoft.com/v7.0/images/visualsearch";

    // var baseUri = `https://api.bing.microsoft.com/bing/v7.0/images/search`;
    // let baseUri = "https://management.azure.com/bing/?api-version=v7.0/images/visualsearch";
    // var baseUri = 'https://api.cognitive.microsoft.com/bing/v7.0/images/visualsearch';

    let newob = {
        "knowledgeRequest": {
            "filters": {
                "site": "www.flipkart.com"
            }
        }

    }
    let visualSearchRequest = JSON.stringify(newob);

    var form = new FormData();
    form.append("image", file);
    form.append("knowledgeRequest",visualSearchRequest);


    var request = new XMLHttpRequest();

    request.open("POST", baseUri);
    request.setRequestHeader('Ocp-Apim-Subscription-Key', key);
    request.addEventListener('load', handleResponse);
    request.send(form);
}


// Handles the response from Bing. Parses the response and 
// the tag divs.
function handleResponse() {
    if (this.status !== 200) {
        alert("Error doing Visual Search.Please try again");
        console.log(this.responseText);
        return;
    }

    console.log(this.responseText);

    var tags = parseResponse(JSON.parse(this.responseText));
    console.log(tags);
    var h2 = document.createElement('h2');
    h2.textContent = 'Search results';
    document.getElementById('responseSection').appendChild(h2);
    buildTagSections(tags);

    document.body.style.cursor = 'default'; // reset the wait curor set by query insights button
}


// Parses the json response by tags.
function parseResponse(json) {
    var dict = {};

    for (var i = 0; i < json.tags.length; i++) {
        var tag = json.tags[i];

        if (tag.displayName === '') {
            dict['Default'] = JSON.stringify(tag);
        }
        else {
            dict[tag.displayName] = JSON.stringify(tag);
        }
    }

    return (dict);
}


// Builds divs fro each tag in the response.
function buildTagSections(tags) {
    for (var tag in tags) {
        if (tags.hasOwnProperty(tag)) {
            var tagSection = buildDiv(tags, tag);
            document.getElementById('responseSection').appendChild(tagSection);
        }
    }
}


// Builds the div for the specified tag. The div is shown as a
// link that when clicked, expands or collapses. The divs are 
// initially collapsed.
function buildDiv(tags, tag) {
    var tagSection = document.createElement('div');
    tagSection.setAttribute('class', 'subSection');

    var link = document.createElement('a');
    link.setAttribute('href', '#');
    link.setAttribute('style', 'float: left;')
    link.text = tag;
    tagSection.appendChild(link);

    var contentDiv = document.createElement('div');
    contentDiv.setAttribute('id', tag);
    contentDiv.setAttribute('style', 'clear: left;')
    contentDiv.setAttribute('class', 'section');
    tagSection.appendChild(contentDiv);

    link.setAttribute('onclick', `expandCollapse("${tag}")`);
    divToggleMap[tag] = 0;  // 1 = show, 0 = hide

    addDivContent(contentDiv, tag, tags[tag]);

    return tagSection;
}


// Adds the tag's action types to the div.
function addDivContent(div, tag, json) {

    // Adds the first 100 characters of the json that contains
    // the tag's data. The user can click the text to show the
    // full json. They can click it again to collapse the json.
    var para = document.createElement('p');
    para.textContent = String(json).substr(0, 100) + '...';
    para.setAttribute('title', 'click to expand');
    para.setAttribute('style', 'cursor: pointer;')
    para.setAttribute('data-json', json);
    para.addEventListener('click', function (e) {
        var json = e.target.getAttribute('data-json');

        if (e.target.textContent.length <= 103) {  // 100 + '...'
            e.target.textContent = json;
            para.setAttribute('title', 'click to collapse');
        }
        else {
            para.textContent = String(json).substr(0, 100) + '...';
            para.setAttribute('title', 'click to expand');
        }
    });
    div.appendChild(para);

    var parsedJson = JSON.parse(json);

    // Loop through all the actions in the tag and display them.
    for (var j = 0; j < parsedJson.actions.length; j++) {
        var action = parsedJson.actions[j];

        var subSectionDiv = document.createElement('div');
        subSectionDiv.setAttribute('class', 'subSection');
        div.appendChild(subSectionDiv);

        var h4 = document.createElement('h4');
        h4.innerHTML = action.actionType;
        subSectionDiv.appendChild(h4);

        if (action.actionType === 'ImageResults') {
            addImageWithWebSearchUrl(subSectionDiv, parsedJson.image, action);
        }
        else if (action.actionType === 'DocumentLevelSuggestions') {
            addRelatedSearches(subSectionDiv, action.data.value);
        }
        else if (action.actionType === 'RelatedSearches') {
            addRelatedSearches(subSectionDiv, action.data.value);
        }
        else if (action.actionType === 'PagesIncluding') {
            addPagesIncluding(subSectionDiv, action.data.value);
        }
        else if (action.actionType === 'VisualSearch') {
            addRelatedImages(subSectionDiv, action.data.value);
        }
        else if (action.actionType === 'Recipes') {
            addRecipes(subSectionDiv, action.data.value);
        }
        else if (action.actionType === 'ShoppingSources') {
            addShopping(subSectionDiv, action.data.offers);
        }
        else if (action.actionType === 'ProductVisualSearch') {
            addProducts(subSectionDiv, action.data.value);
        }
        else if (action.actionType === 'TextResults') {
            addTextResult(subSectionDiv, action);
        }
        else if (action.actionType === 'Entity') {
            addEntity(subSectionDiv, action);
        }
    }
}


// Display the first 10 related images.
// TODO: Add 'more' link in case the user wants to see all of them.
function addRelatedImages(div, images) {
    var length = (images.length > 10) ? 10 : images.length;

    // Set the title to the website that hosts the image. The title displays 
    // when the user hovers over the image. 

    // Make the image clickable. If the user clicks the image, they're taken
    // to the image in Bing.com.

    for (var j = 0; j < length; j++) {
        var img = document.createElement('img');
        img.setAttribute('src', images[j].thumbnailUrl + '&w=120&h=120');
        img.setAttribute('style', 'margin: 20px 20px 0 0; cursor: pointer;');
        img.setAttribute('title', images[j].hostPageDisplayUrl);
        img.setAttribute('data-webSearchUrl', images[j].webSearchUrl)

        img.addEventListener('click', function (e) {
            var url = e.target.getAttribute('data-webSearchUrl');
            window.open(url, 'foo');
        })

        div.appendChild(img);
    }
}


// Display links to the first 5 webpages that include the image.
// TODO: Add 'more' link in case the user wants to see all of them.
function addPagesIncluding(div, pages) {
    var length = (pages.length > 5) ? 5 : pages.length;

    for (var j = 0; j < length; j++) {
        var page = document.createElement('a');
        page.text = pages[j].name;
        page.setAttribute('href', pages[j].hostPageUrl);
        page.setAttribute('style', 'margin: 20px 20px 0 0');
        page.setAttribute('target', '_blank')
        div.appendChild(page);

        div.appendChild(document.createElement('br'));
    }
}


// Display the first 10 related searches. Include a link with the image
// that when clicked, takes the user to Bing.com and displays the 
// related search results.
// TODO: Add 'more' link in case the user wants to see all of them.
function addRelatedSearches(div, relatedSearches) {
    var length = (relatedSearches.length > 10) ? 10 : relatedSearches.length;

    for (var j = 0; j < length; j++) {
        var childDiv = document.createElement('div');
        childDiv.setAttribute('class', 'stackLink');
        div.appendChild(childDiv);

        var img = document.createElement('img');
        img.setAttribute('src', relatedSearches[j].thumbnail.url + '&w=120&h=120');
        img.setAttribute('style', 'margin: 20px 20px 0 0;');
        childDiv.appendChild(img);

        var relatedSearch = document.createElement('a');
        relatedSearch.text = relatedSearches[j].displayText;
        relatedSearch.setAttribute('href', relatedSearches[j].webSearchUrl);
        relatedSearch.setAttribute('target', '_blank');
        childDiv.appendChild(relatedSearch);

    }
}


// Display links to the first 10 recipes. Include the recipe's rating,
// if available. 
// TODO: Add 'more' link in case the user wants to see all of them.
function addRecipes(div, recipes) {
    var length = (recipes.length > 10) ? 10 : recipes.length;

    for (var j = 0; j < length; j++) {
        var para = document.createElement('p');

        var recipe = document.createElement('a');
        recipe.text = recipes[j].name;
        recipe.setAttribute('href', recipes[j].url);
        recipe.setAttribute('style', 'margin: 20px 20px 0 0');
        recipe.setAttribute('target', '_blank')
        para.appendChild(recipe);

        if (recipes[j].hasOwnProperty('aggregateRating')) {
            var span = document.createElement('span');
            span.textContent = 'rating: ' + recipes[j].aggregateRating.text;
            para.appendChild(span);
        }

        div.appendChild(para);
    }
}


// Display links for the first 10 shopping offers.
// TODO: Add 'more' link in case the user wants to see all of them.
function addShopping(div, offers) {
    var length = (offers.length > 10) ? 10 : offers.length;

    for (var j = 0; j < length; j++) {
        var para = document.createElement('p');

        var offer = document.createElement('a');
        offer.text = offers[j].name;
        offer.setAttribute('href', offers[j].url);
        offer.setAttribute('style', 'margin: 20px 20px 0 0');
        offer.setAttribute('target', '_blank')
        para.appendChild(offer);

        var span = document.createElement('span');
        span.textContent = 'by ' + offers[j].seller.name + ' | ' + offers[j].price + ' ' + offers[j].priceCurrency;
        para.appendChild(span);

        div.appendChild(para);
    }
}


// Display the first 10 related products. Display a clickable image of the 
// product that takes the user to Bing.com search results for the product.
// If there are any offers associated with the product, provide links to the offers.
// TODO: Add 'more' link in case the user wants to see all of them.
function addProducts(div, products) {
    var length = (products.length > 10) ? 10 : products.length;

    for (var j = 0; j < length; j++) {
        var childDiv = document.createElement('div');
        childDiv.setAttribute('class', 'stackLink');
        div.appendChild(childDiv);

        var img = document.createElement('img');
        img.setAttribute('src', products[j].thumbnailUrl + '&w=120&h=120');
        img.setAttribute('title', products[j].name);
        img.setAttribute('style', 'margin: 20px 20px 0 0; cursor: pointer;');
        img.setAttribute('data-webSearchUrl', products[j].webSearchUrl)
        img.addEventListener('click', function (e) {
            var url = e.target.getAttribute('data-webSearchUrl');
            window.open(url, 'foo');
        })
        childDiv.appendChild(img);

        if (products[j].insightsMetadata.hasOwnProperty('aggregateOffer')) {
            if (products[j].insightsMetadata.aggregateOffer.offerCount > 0) {
                var offers = products[j].insightsMetadata.aggregateOffer.offers;

                // Show all the offers. Not all markets provide links to offers.
                for (var i = 0; i < offers.length; i++) {
                    var para = document.createElement('p');

                    var offer = document.createElement('a');
                    offer.text = offers[i].name;
                    offer.setAttribute('href', offers[i].url);
                    offer.setAttribute('style', 'margin: 20px 20px 0 0');
                    offer.setAttribute('target', '_blank')
                    para.appendChild(offer);

                    var span = document.createElement('span');
                    span.textContent = 'by ' + offers[i].seller.name + ' | ' + offers[i].price + ' ' + offers[i].priceCurrency;
                    para.appendChild(span);

                    childDiv.appendChild(para);
                }
            }
            else {  // Otherwise, just show the lowest price that Bing found.
                var offer = products[j].insightsMetadata.aggregateOffer;

                var para = document.createElement('p');
                para.textContent = `${offer.name} | ${offer.lowPrice} ${offer.priceCurrency}`;

                childDiv.appendChild(para);
            }
        }
    }
}


// If Bing recognized any text in the image, display the text.
function addTextResult(div, action) {
    var text = document.createElement('p');
    text.textContent = action.displayName;
    div.appendChild(text);
}


// If the image is of a person, the tag might include an entity
// action type. Display a link that takes the user to Bing.com
// where they can get details about the entity.
function addEntity(div, action) {
    var entity = document.createElement('a');
    entity.text = action.displayName;
    entity.setAttribute('href', action.webSearchUrl);
    entity.setAttribute('style', 'margin: 20px 20px 0 0');
    entity.setAttribute('target', '_blank');
    div.appendChild(entity);
}


// Adds a clickable image to the div that takes the user to
// Bing.com search results.
function addImageWithWebSearchUrl(div, image, action) {
    var img = document.createElement('img');
    img.setAttribute('src', image.thumbnailUrl + '&w=120&h=120');
    img.setAttribute('style', 'margin: 20px 20px 0 0; cursor: pointer;');
    img.setAttribute('data-webSearchUrl', action.webSearchUrl);
    img.addEventListener('click', function (e) {
        var url = e.target.getAttribute('data-webSearchUrl');
        window.open(url, 'foo');
    })
    div.appendChild(img);
}


