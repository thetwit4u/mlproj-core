"use strict";

(function() {

    const fs   = require('fs');
    const path = require('path');
    const c    = require('../../../src/context');
    const e    = require('../../../src/environ');

    // utility functions to create expected HTTP calls

    function dbProps(name) {
        var res = {
            verb: 'get',
            api: 'manage',
            url: '/databases/' + name + '/properties',
            response: 'Not found'
        };
        return res;
    }

    function asProps(name) {
        var res = {
            verb: 'get',
            api: 'manage',
            url: '/servers/' + name + '/properties?group-id=Default',
            response: 'Not found'
        };
        return res;
    }

    function forests(list) {
        var res = {
            verb: 'get',
            api: 'manage',
            url: '/forests',
            response: 'OK',
            body: {
                'forest-default-list': {
                    'list-items': {
                        'list-item': list.map(f => {
                            var res = { nameref: f };
                            return res;
                        })
                    } } }
        };
        return res;
    }

    function createDb(props) {
        var res = {
            verb: 'post',
            api: 'manage',
            url: '/databases',
            data: props,
            response: 'OK'
        };
        return res;
    }

    function createForest(props) {
        var res = {
            verb: 'post',
            api: 'manage',
            url: '/forests',
            data: props,
            response: 'OK'
        };
        return res;
    }

    function attachForest(forest, db) {
        var res = {
            verb: 'post',
            api: 'manage',
            url: '/forests/' + forest + '?state=attach&database=' + db,
            response: 'OK'
        };
        return res;
    }

    function createAs(props) {
        var res = {
            verb: 'post',
            api: 'manage',
            url: '/servers?group-id=Default',
            data: props,
            response: 'OK'
        };
        return res;
    }

    // used also as a marker
    function ignore(resp, body) {
        var res = {
            ignore   : true,
            response : resp
        };
        if ( body ) {
            res.body = body;
        }
        return res;
    }

    // function to assert the current HTTP call (they are in sequence)

    function assertCall(runner, verb, api, url, data) {
        // log progress
        runner.progress(verb, api, url, data);
        // get the current expected call
        var call = runner.nextCall();
        // assert `data`
        var assertData = function(call, data) {
            if ( ! call.data !== ! data ) {
                runner.fail(call, 'One data is undefined: ' + call.data + ' - ' + data);
            }
            let lhs = Object.keys(call.data).sort();
            let rhs = Object.keys(data).sort();
            // number of props
            if ( lhs.length !== rhs.length ) {
                runner.fail(call, 'Not the same number of props: ' + lhs + ' / ' + rhs);
            }
            // prop names
            for ( let i = 0; i < lhs.length; ++i ) {
                if ( lhs[i] !== rhs[i] ) {
                    runner.fail(call, 'Not the same prop keys: ' + lhs + ' / ' + rhs);
                }
            }
            // prop values
            lhs.forEach(p => {
                if ( call.data[p] !== data[p] ) {
                    runner.fail(call, 'Data prop differs: ' + p + ': ' + call.data[p] + ' - ' + data[p]);
                }
            });
        };
        if ( ! call.ignore ) {
            // assert values
            if ( call.verb !== verb ) {
                runner.fail(call, 'Verb is ' + verb + ', expected ' + call.verb);
            }
            if ( call.api !== api ) {
                runner.fail(call, 'API is ' + api + ', expected ' + call.api);
            }
            if ( call.url !== url ) {
                runner.fail(call, 'URL is ' + url + ', expected ' + call.url);
            }
            if ( call.data && call.data !== ignore ) {
                assertData(call, data);
            }
        }
        // continue with expected result
        if ( call.response === 'OK' ) {
            return {
                status  : 200,
                headers : {},
                body    : call.body
            };
        }
        else if ( call.response === 'Not found' ) {
            return {
                status  : 404,
                headers : {}
            };
        }
        else {
            runner.fail(call, 'Unknown return');
            // TODO: Throw an error, even here...?
            return;
        }
    };

    // the main processing
    function test(runner, file, name, cmd, calls) {
        // set the expected calls on the runner object
        runner.calls = calls;
        // the platform instance
        let ctxt = new c.Context(new c.Display(), new c.Platform(process.cwd()));
        // override the http functions
        ctxt.platform.get = function(params, url) {
            // TODO: Don't we want to check other params than only api?
            return assertCall(runner, 'get', params.api, url);
        };
        ctxt.platform.post = function(params, url, data) {
            // TODO: Don't we want to check other params than only api?
            return assertCall(runner, 'post', params.api, url, data);
        };
        ctxt.platform.put = function(params, url, data) {
            // TODO: Don't we want to check other params than only api?
            return assertCall(runner, 'put', params.api, url, data);
        };
        // various functions on the platform object to load the project file
        ctxt.platform.resolve = function(href, base) {
            return path.resolve(base, href);
        };
        ctxt.platform.dirname = function(href) {
            return path.dirname(href);
        }
        ctxt.platform.read = function(path) {
            return fs.readFileSync(path, 'utf8');
        }
        ctxt.platform.bold = function(s) {
            return s;
        };
        ctxt.platform.green = function(s) {
            return s;
        };
        ctxt.platform.yellow = function(s) {
            return s;
        };
        // TODO: Ignore the output for now, but redirect it to a file...
        ctxt.platform.log = function(msg) {
        };
        ctxt.platform.info = function(msg) {
        };
        ctxt.platform.warn = function(msg) {
        };
        ctxt.display.add = function(indent, verb, msg, arg) {
        };
        ctxt.display.check = function(indent, msg, arg) {
        };
        // launch processing
        let env = new e.Environ(ctxt, ctxt.platform.json(file), file);
        env.compile();
        let command = new cmd(name, {}, {}, ctxt, env);
        let actions = command.prepare();
        actions.execute();
    }

    module.exports = {
        ignore       : ignore,
        dbProps      : dbProps,
        asProps      : asProps,
        forests      : forests,
        createDb     : createDb,
        createForest : createForest,
        attachForest : attachForest,
        createAs     : createAs,
        assertCall   : assertCall,
        test         : test
    }
}
)();
