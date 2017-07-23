#!/usr/bin/env node

"use strict";

const p = require('./parse-platform');
const t = require('../lib/unit-test');
const s = require('../../../src/space');

const platform = new p.Platform();

t.test('Parsing impala (prod) - source sets', ass => {
    let path  = t.spaceFile('simple-impala', 'prod');
    let space = s.Space.load(platform, path, {}, {}, {});
    // the $* and @* params
    ass.params('The parameters', space, {});
    ass.equal('The @code param', space.param('@code'), 'simple-impala');
    // the source sets
    const srcs = space.sources();
    ass.equal('There must be 3 source sets', srcs.length, 3);
    ass.source('The foo source', srcs[0], 'foo', {
        dir:     'foo',
        include: ['*.xqy', '*.xql', '*.xq']
    });
    ass.equal('The garbage of foo source', srcs[0].prop('garbage'), ['*~']);
    ass.source('The foo source', srcs[1], 'bar', {
        dir:     'bar',
        exclude: ['*.bck', '*.ignore']
    });
    ass.equal('The garbage of bar source', srcs[1].prop('garbage'), ['*~']);
    ass.source('The baz source', srcs[2], 'baz', {
        dir:     'baz',
        include: ['*.jpg', '*.png'],
        exclude: ['*ignore*', '*2017*']
    });
    ass.equal('The garbage of baz source', srcs[2].prop('garbage'), ['*~']);
    // the databases
    const dbs = space.databases();
    ass.equal('There must be no database', dbs.length, 0);
    // the app servers
    const srvs = space.servers();
    ass.equal('There must be no app server', srvs.length, 0);
});

t.test('Parsing impala (extended) - source sets inheritence', ass => {
    let path  = t.spaceFile('simple-impala', 'extended');
    let space = s.Space.load(platform, path, {}, {}, {});
    // the $* and @* params
    ass.params('The parameters', space, {});
    ass.equal('The @code param', space.param('@code'), 'simple-impala');
    // the source sets
    const srcs = space.sources();
    ass.equal('There must be 3 source sets', srcs.length, 3);
    ass.source('The foo source', srcs[0], 'foo', {
        dir:     'foo',
        include: ['*.sjs']
    });
    ass.equal('The garbage of foo source', srcs[0].prop('garbage'), ['*~', '$$$']);
    ass.source('The foo source', srcs[1], 'bar', {
        dir:     'newbar',
        exclude: ['*.bck', '*.ignore']
    });
    ass.equal('The garbage of bar source', srcs[1].prop('garbage'), ['*~', '$$$']);
    ass.source('The baz source', srcs[2], 'baz', {
        dir:     'baz',
        include: ['*.jpg', '*.png'],
        exclude: ['*ignore*', '*2017*']
    });
    ass.equal('The garbage of baz source', srcs[2].prop('garbage'), ['*~', '$$$']);
    // the databases
    const dbs = space.databases();
    ass.equal('There must be no database', dbs.length, 0);
    // the app servers
    const srvs = space.servers();
    ass.equal('There must be no app server', srvs.length, 0);
});