#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)) {
	console.log("%s does not exist. Exitting.", instr);
	process.exit(1); 
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, url, checksfile) {

    var finishWork = function() {
	var checks = loadChecks(checksfile).sort();
	var out = {};
	for (var ii in checks) {
	    var present = $(checks[ii]).length > 0;
	    out[checks[ii]] = present;
	    
	}
	
	var outJson = JSON.stringify(out, null, 4);
	console.log(outJson);

    }

    if (url)
    {
	var restler = require("restler");
	restler.get(url).on('complete', function(data, response) {
	    if (!response || response.statusCode != 200) {
		console.log("%s cannot be loaded", url);
		process.exit(1);
	    }
	    else {
		$ = cheerio.load(data);
		finishWork();
	    }
	});
    }
    else
    {
	$ = cheerioHtmlFile(htmlfile);
	var ret = finishWork();
    }

};

var clone = function(fn) {
    return fn.bind({});
};

if (require.main == module) {
    program
	.option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
	.option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), '')
	.option('-u, --url <url>', 'URL to index.html', '')
	.parse(process.argv);

    if (program.url && program.file)
    {
	console.log("Please provide File OR URL, not both");
	process.exit(1);
    }

    if (!(program.url || program.file))
    {
	program.file = HTMLFILE_DEFAULT;
    }

    checkHtmlFile(program.file, program.url, program.checks);
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
