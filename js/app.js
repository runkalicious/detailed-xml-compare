/**
 * Parse files and display data
 * Adapted from Google example at:
 *    https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/filesystem-access
 */

var chosenEntry = null;
var output = document.querySelector('#status');

function errorHandler(e) {
    console.error(e);
}

function readAsText(fileEntry, callback) {
    fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onerror = errorHandler;
        reader.onload = function(e) {
            callback(e.target.result);
        };

        reader.readAsText(file);
    });
}

// Support dropping a single file onto this app.
var dnd = new DnDFileController('body', function(data) {
    chosenEntry = null;
    for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i];
        if (item.kind == 'file' &&
            item.type.match('text/*') &&
            item.webkitGetAsEntry()) {
            chosenEntry = item.webkitGetAsEntry();
            break;
        }
    }

    if (!chosenEntry) {
        output.textContent = "Sorry. That's not a text file.";
        return;
    }
    else {
        output.textContent = "";
    }

    // Parse the file
    readAsText(chosenEntry, function(result) {
        console.log(result);
    });

    // Update display.
    // TODO
});
