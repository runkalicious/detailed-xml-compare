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
    var item = $("<div/>").addClass("field").text((value) ? key + ": " : key);
    return $(item).append(val);
}

function createDiv(classname) {
    return $("<div/>").addClass(classname);
}

function spacer() {
    return $("<div/>").addClass("clear").html("&nbsp;");
}

function updateDisplay(filename) {
    $("h3").hide();
    $(reset).show();

    var $xmlDoc = $(xmlDocuments[xmlDocuments.length - 1]);

    // Add new item to pane
    var entry = createDiv("entry").append(createDiv("title")).append(spacer());
    $(entry).append( item("Application Name", $xmlDoc.find("detailedreport").attr("app_name")) );
    $(entry).append( item("Build Name", $xmlDoc.find("detailedreport").attr("version")) );
    $(entry).append( item("Engine", $xmlDoc.find("static-analysis").attr("engine_version")) );

    // Elapsed time
    var scan_date = new Date($xmlDoc.find("static-analysis").attr("submitted_date").replace(/-/g,'/'));
    var publish_date = new Date($xmlDoc.find("static-analysis").attr("published_date").replace(/-/g,'/'));
    //var elapsed = new Date().setTime(scan_date - publish_date);
    $(entry).append( item("Submitted Date", scan_date.toString()) );
    $(entry).append( item("Published Date", publish_date.toString()) );
    //$(entry).append( item("Elapsed", elapsed.toString()) );
    $(entry).append(spacer());

    // Modules
    var modules = createDiv("modules");
    $(entry).append( item("Modules", "").addClass("minus").click(function() {
        $(modules).toggle("1000");
        $(this).toggleClass("plus minus");
    }) );

    $(entry).append(modules);
    $.each($xmlDoc.find("module"), function(idx, module) {
        $(modules).append(createDiv("module").text($(module).attr("name")));
    });
    $(modules).append(spacer());

    $(entry).append(spacer());

    // Flaws
    var flaws = createDiv("flaws");
    $(entry).append( item("New Flaws", "").addClass("minus").click(function() {
        $(flaws).toggle("1000");
        $(this).toggleClass("plus minus");
    }) );

    $(entry).append(flaws);
    $.each($xmlDoc.find("flaw"), function(idx, flaw) {
        var rstatus = $(flaw).attr("remediation_status").toLowerCase();
        var chip = createDiv("flaw").text(
            "CWE-" + $(flaw).attr("cweid") + ": #" + $(flaw).attr("issueid")
        );
        if(rstatus == "new" || rstatus == "re-open") {
            $(chip).addClass("added");
        }
        $(flaws).append(chip);
    });
    $(flaws).append(spacer());

    // Add to page
    $(pane).append($(entry));

    // Fill in file path information
    chrome.fileSystem.getDisplayPath(filename, function(path) {
        $(entry).find(".title").text(path);
    });

    // Set all entry widths
    var width = 100.0 / xmlDocuments.length;
    $(".entry").width(width + "%");

    // Run compare
    if (xmlDocuments.length > 1) {
        compareXML();
    }
}

function compareXML() {
    // Retrieve parsed XML
    var $xmlDoc1 = $(xmlDocuments[0]);
    var $xmlDoc2 = $(xmlDocuments[1]);

    /* Find modules differences */
    var modules1 = $($xmlDoc1.find("module")).map(function(){return $(this).attr("name");}).get();
    var modules2 = $($xmlDoc2.find("module")).map(function(){return $(this).attr("name");}).get();

    // Added
    $.each($(modules2).not(modules1).get(), function(idx, module_name) {
        console.log(module);
        $("div:contains(" + module_name + "):last").addClass("added");
    });

    // Removed
    $.each($(modules1).not(modules2).get(), function(idx, module_name) {
        $("div:contains(" + module_name + "):last").addClass("removed");
    });

    /* Find flaw differences */
    var flawids1 = $($xmlDoc1.find("flaw")).map(function(){return $(this).attr("issueid");}).get();
    var flawids2 = $($xmlDoc2.find("flaw")).map(function(){return $(this).attr("issueid");}).get();

    // Removed
    $.each($(flawids1).not(flawids2).get(), function(idx, flawid) {
        $("div:contains(#" + flawid + "):last").addClass("removed");
    });
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
$(reset).click(function() {
    xmlDocuments = [];

    $(pane).empty();
    $(reset).hide();
    $("h3").show();
});
