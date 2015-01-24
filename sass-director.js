#!/usr/bin/env node

function mkdir(path) {
	function create(path) {
		if (path) {
			if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
				try {
					fs.mkdirSync(path);
				} catch (error) {
					return false;
				}
			}
		}

		return true;
	}

	path.replace(/^\/+/, '').split(/\/+/).reduce(function (previousValue, currentValue) {
		create('/' + previousValue);

		return previousValue + '/' + currentValue;
	});

	return create(path);
}

function exit(code, message) {
	console.log(message);

	process.exit(code || 0);
}

var
fs = require('fs'),
path = require('path'),
manifestFile = 2 in process.argv ? path.resolve(process.argv[2]) : '',
manifestDirectory = path.dirname(manifestFile);

if (process.argv.length < 3) {
	exit(1, 'Usage: sass-director <manifest-file>');
}

if (!fs.existsSync(manifestFile)) {
	exit(1, 'Sorry, sass-director could not access ' + manifestFile + '.');
}

if (!mkdir(manifestDirectory)) {
	exit(1, 'Sorry, sass-director could not access ' + manifestDirectory + '.');
}

fs.readFile(manifestFile, 'utf8', function (error, data) {
	if (error) {
		exit(1, 'Sorry, sass-director could not access ' + manifestFile + '.');
	}

	var
	importStatements = data.match(/^[ \t]*@import[ \t]+(['"])(.+?)\1/mg),
	importDirectories = [],
	importBasenames = [];

	if (importStatements) {
		importStatements.forEach(function (importStatement) {
			var
			importPath = importStatement.match(/^[ \t]*@import[ \t]+(['"])(.+?)\1/)[2];

			importPath = importPath.match(/\.scss$/) ? importPath : importPath + '.scss';

			var
			importDirectory = manifestDirectory + '/' + path.dirname(importPath),
			importBasename = importDirectory + '/_' + path.basename(importPath);

			if (!fs.existsSync(importDirectory) && importDirectories.indexOf(importDirectory) === -1) {
				importDirectories.push(importDirectory);
			}

			if (!fs.existsSync(importBasename) && importDirectories.indexOf(importBasename) === -1) {
				importBasenames.push(importBasename);
			}
		});
	}

	importDirectories.forEach(function (importDirectory) {
		if (!mkdir(importDirectory)) {
			exit(1, 'Sorry, sass-director could not create the ' + importDirectory + ' directory.');
		}
	});

	importBasenames.forEach(function (importBasename) {
		try {
			fs.closeSync(fs.openSync(importBasename, 'w'));
		} catch (error) {
			exit(1, 'Sorry, sass-director could not create the ' + importBasename + ' file.');
		}
	});

	exit(0, 'Hurray, sass-director created ' + importDirectories.length + ' directories and ' + importBasenames.length + ' files!');
});
