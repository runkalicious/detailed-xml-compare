/**
 * Parse files and display data
 * Adapted from Google example at:
 *    https://github.com/GoogleChrome/chrome-app-samples/tree/master/samples/filesystem-access
 */

var xmlDocuments = [];
var output = document.querySelector('#status');
var reset = document.querySelector('#reset');
var pane = document.querySelector('#pane');

function errorHandler(e) {
    console.error(e);
}

function item(key, value) {
    var val = $("<span/>").text(value);
    var item = $("<div/>").addClass("field").text(key + ": ");
    return $(item).append(val);
}

function updateDisplay(filename) {
    $("h3").hide();
    $(reset).show();

    var $xmlDoc = $(xmlDocuments[xmlDocuments.length - 1]);

    // Add new item to pane
    var entry = $("<div/>").addClass("entry").append($("<div class=\"title\" /><br/>"));
    $(entry).append( item("Application Name", $xmlDoc.find("detailedreport").attr("app_name")) );
    $(entry).append( item("Build Name", $xmlDoc.find("detailedreport").attr("version")) );
    $(entry).append( item("Engine", $xmlDoc.find("static-analysis").attr("engine_version")) );
    $(pane).append($(entry));

    // Fill in file path information
    chrome.fileSystem.getDisplayPath(filename, function(path) {
        $(entry).find(".title").text(path);
    });

    // Set all entry widths
    var width = 100.0 / xmlDocuments.length;
    $(".entry").width(width + "%");
}

function readAsXml(fileEntry, callback) {
    fileEntry.file(function(file) {
        var reader = new FileReader();

        reader.onerror = errorHandler;
        reader.onload = function(e) {
            var xmlDoc = $.parseXML(e.target.result);
            callback( xmlDoc );
        };

        reader.readAsText(file);
    });
}

// Support dropping a single file onto this app.
var dnd = new DnDFileController('body', function(data) {
    var xmlFile = null;
    for (var i = 0; i < data.items.length; i++) {
        var item = data.items[i];
        if (item.kind == 'file' &&
            item.type.match('text/xml') &&
            item.webkitGetAsEntry()) {
            xmlFile = item.webkitGetAsEntry();
            break;
        }
    }

    if (!xmlFile) {
        output.textContent = "Only XML files are permitted";
        return;
    }
    else if (xmlDocuments.length > 1) {
        output.textContent = "Only two files can be compared";
        return;
    }
    else {
        output.textContent = "";
    }

    // Parse the file
    readAsXml(xmlFile, function(result) {
        xmlDocuments.push(result);

        updateDisplay(xmlFile);
    });
});

// Clear all values
$(reset).click(function(e) {
    xmlDocuments = [];

    $(pane).empty();
    $(reset).hide();
    $("h3").show();
});
