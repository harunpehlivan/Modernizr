var fs = require('fs');
var file = require('file');
var marked = require('marked');

var viewRoot = file.path.abspath(__dirname + '/feature-detects');
var tests = [];
file.walkSync(viewRoot, function (start, dirs, files) {
  files.forEach(function (file) {
    if ( file === '.DS_Store') {
      return;
    }
    var test = fs.readFileSync(start + '/' + file, 'utf8');
    // TODO :: make this regex not suck
    var metaRE = /\/\*\!([^\!\*]*)\!\*\//m;
    var matches = test.match(metaRE);
    var docRE = /\/\*\sDOC([^\!\*]*)\*\//m
    var docmatches = test.match(docRE);
    var depRE = /define\((\[[^\]]*\]),/;
    var depMatches = test.match(depRE);

    var metadata;

    if (matches && matches[1]) {
      try {
        metadata = JSON.parse(matches[1]);
      }
      catch(e) {
        throw new Error('Error Parsing Metadata: ' + file + '\nInput: `' + matches[1] + '`');
      }
    }
    else {
      metadata = {};
    }

    var docs = null;
    if (docmatches && docmatches[1]) {
      docs = marked(docmatches[1].trim());
    }
    metadata.docs = docs;

    var deps = [];
    if (depMatches && depMatches[1]) {
      try {
        var matchedDeps = JSON.parse(depMatches[1].replace(/'/g, '"'));
      }
      catch (e) {
        throw new Error("Couldn't parse dependencies for `" + file + "`:\n`" + depMatches[1] + "\n`");
      }
      matchedDeps.forEach(function( dep ) {
        if (dep === 'Modernizr') {
          return;
        }
        deps.push(dep);
      });
    }
    else {
      throw new Error("Couldn't find the define for `" + file + "`");
    }
    metadata.deps = deps;

    metadata.path = (start + '/' + file).replace(__dirname, '');
    metadata.amdPath = metadata.path.replace('/feature-detects', 'test').replace(/\.js$/i, '');

    if (!metadata.name) {
      metadata.name = metadata.amdPath;
    }

    if (!metadata.async) {
      metadata.async = false;
    }

    if (!metadata.notes) {
      metadata.notes = [];
    }

    if (!metadata.warnings) {
      metadata.warnings = [];
    }

    if (!metadata.caniuse) {
      metadata.caniuse = null;
    }

    if (!metadata.helptext) {
      metadata.helptext = null;
    }

    if (!metadata.cssclass && metadata.property) {
      metadata.cssclass = metadata.property;
    }
    else {
      metadata.cssclass = null;
    }

    // Maybe catch a bug
    if (!metadata.doc && metadata.docs) {
      metadata.doc = metadata.docs || null;
      delete metadata.docs;
    }

    // If you want markdown parsed code minus the docs and metadata, this'll do it.
    // Off by default for now.
    // metadata.code =  marked('```javascript\n' + test.replace(metaRE, '').replace(docRE, '') + '\n```');

    if (!metadata.tags) {
      metadata.tags = [];
    }

    if (!metadata.authors) {
      metadata.authors = [];
    }

    if (!metadata.knownBugs) {
      metadata.knownBugs = [];
    }

    tests.push(metadata);
  });
});

console.log(JSON.stringify(tests), null, "  ");
