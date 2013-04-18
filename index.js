/*
 * Copyright (c) 2011-2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */
'use strict';

var path = require('path'),
    log = require('./lib/log'),
    util = require('./lib/utils'),
    create = require('./lib/create'),

    // todo: enable user configuration
    SRCPATHS = ['.', path.resolve(__dirname, 'archetypes')];


function error(msg, exit_code) {
    var err = new Error(msg);
    err.errno = exit_code || 1;
    return err;
}

function errorWithUsage(msg, exit_code) {
    var err = error(msg, exit_code);
    err.usage = module.exports.usage;
    return err;
}

function pathify(subpath) {
    return util.findInPaths(SRCPATHS, subpath);
}

function subtypePath(type, args) {
    var subtype = args.length > 1 ? args.shift() : 'default';
    return path.join(type, subtype).toLowerCase(); // i.e. 'app/full'
}

function getSourceDir(type, args) {
    var source, err;

    // get archetype source directory based on first one OR two arguments
    switch (type.toLowerCase()) {
    case 'app':
    case 'mojit':
        // 1. mojito create [options] <app|mojit> [full|simple|default] <name>
        source = pathify(subtypePath(type, args));
        err = 'Invalid subtype.';
        break;

    case 'custom':
        // 2. mojito create [options] custom <path/to/archetype> <name>
        source = pathify(args.shift());
        err = 'Custom archtype path is invalid.';
        break;

    default:
        // 3. mojito create [options] <path/to/archetype> <name>
        source = pathify(type);
        err = type + ' is not a valid archetype or path.';
    }

    return err ? errorWithUsage(err, 5) : source;
}

function checkArgs(type, args) {
    var err;

    if (!type) {
        err = 'No parameters.';

    } else if (!args.length) {
        err = 'Missing type, subtype, or source.';
    }

    return errorWithUsage(err, 3);
}

function main(args, opts, meta, cb) {
    var type = args.shift() || '',
        source = checkArgs(type, args) || getSourceDir(type, args),
        name = args.shift(),
        keyval = util.parseCsvObj(opts.keyval),
        destination;

    if (source instanceof Error) {
        cb(source);

    } else if (!name) {
        cb(errorWithUsage('Missing name.', 3));

    } else {
        keyval.name = name;
        keyval.port = opts.port || 8666;
        destination = path.join(opts.directory || '.', name);
        create(source, destination, keyval, cb);
    }
}

exports = main;

exports.usage = [
    'Usage: mojito create [options] <app|mojit> [full|simple|default] <name>',
    'Usage: mojito create [options] custom <path/to/archetype> <name>',
    'Usage: mojito create [options] <path/to/archetype> <name>',
    '',
    'Example: mojito create app Foo',
    '  (creates directory "Foo" containing a new Mojito application named "Foo")',
    '',
    'Example: mojito create mojit Bar',
    '  (creates directory "Bar" containing new Mojit named "Bar")',
    '',
    'OPTIONS: ',
    '  --port [number]  Specifies default port for your Mojito app to run on.',
    '  -p [number]      Short for --port',
    '  -keyval [string] key value pairs to pass to a custom archetype template',
    '                   a key/value is separated by colons, key/value pairs by',
    '                   commas: "key1:val1,key2:val2',
    '  -k [string]      Short for --keyval'].join('\n');

exports.options = [
    {shortName: 'd', hasValue: true,  longName: 'directory'},
    {shortName: 'k', hasValue: true,  longName: 'keyval'},
    {shortName: 'p', hasValue: true,  longName: 'port'}
];

exports.test = {
    checkArgs: checkArgs,
    getSourceDir: getSourceDir
};
