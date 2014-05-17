'use strict';

var sinon = require('sinon'),
    testsApi = require('../lib/tests-api'),
    Suite = require('../lib/suite');

describe('public tests API', function() {
    beforeEach(function() {
        this.suite = Suite.create('');
        this.context = {};
        testsApi(this.context, this.suite);
    });

    describe('.suite method', function() {
        it('should throw an error if first argument is not a string', function() {
            (function () {
                this.context.suite(123, function() {});
            }.must.throw(TypeError));
        });

        it('should throw an error if second argument is not a function', function() {
            (function() {
                this.context.suite('name');
            }.must.throw(TypeError));
        });

        it('should create new suite with corresponding name', function() {
            this.context.suite('name', function() {});

            this.suite.children[0].name.must.equal('name');
        });

        it('should call callback', function() {
            var spy = sinon.spy();
            this.context.suite('name', spy);
            sinon.assert.called(spy);
        });

        it('should created nested suites when called nestedly', function() {
            var _this = this;
            this.context.suite('name', function() {
                _this.context.suite('child', function() {});
            });

            this.suite.children[0].children[0].name.must.be('child');
        });

        it('should create non-nested suite at the root level', function() {
            this.context.suite('first', function() {});
            this.context.suite('second', function() {});

            this.suite.children[1].name.must.be('second');
        });
    });

    describe('suite builder', function() {

        function shouldBeChainable(method, value) {
            it('should be chainable', function(done) {
                this.context.suite('name', function(suite) {
                    suite[method](value).must.be(suite);
                    done();
                });
            });
        } 

        describe('setUrl', function() {
            it('should throw if argument is not a string', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.setUrl({not: 'a string'});
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it('should set url property', function() {
                this.context.suite('name', function(suite) {
                    suite.setUrl('http://example.com');
                });

                this.suite.children[0].url.must.equal('http://example.com');
            });

            shouldBeChainable('setUrl', 'http://example.com');
        });

        describe('setCaptureElements', function() {
            it ('should throw if selector is not a string', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.setCaptureElements({everything: true});
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it ('should throw if selector in array is not a string', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.setCaptureElements([{everything: true}, '.selector']);
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it('should set captureSelectors property', function() {
                this.context.suite('name', function(suite) {
                    suite.setCaptureElements('.selector');
                });

                this.suite.children[0].captureSelectors.must.eql(['.selector']);
            });

            it('should accept multiple arguments', function() {
                this.context.suite('name', function(suite) {
                    suite.setCaptureElements('.selector1', '.selector2');
                });
                this.suite.children[0].captureSelectors.must.eql(['.selector1', '.selector2']);
            });

            it('should accept array', function() {
                this.context.suite('name', function(suite) {
                    suite.setCaptureElements(['.selector1', '.selector2']);
                });

                this.suite.children[0].captureSelectors.must.eql(['.selector1', '.selector2']);
            });
        });

        describe('before', function() {
            it('should set beforeHook property', function() {
                var func = function() {};
                this.context.suite('name', function(suite) {
                    suite.before(func);
                });
                this.suite.children[0].beforeHook.must.be(func);

            });

            it('should throw if hook is not a function', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.before('the dawn');
                    }); 
                }.bind(this)).must.throw(TypeError);
            });
        });

        describe('capture', function() {
            it('should throw if first argument is not passed', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.capture({not: 'a string'});
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it('should throw if second argument is not a function', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.capture('state', 'make me a sandwich');
                    });
                }.bind(this)).must.throw(TypeError);
            }); 

            it('should not throw if second argument is absent', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.capture('state');
                    });
                }.bind(this)).must.not.throw();
            });

            it('should create named state', function() {
                this.context.suite('name', function(suite) {
                    suite.capture('state');
                });

                this.suite.children[0].states[0].name.must.equal('state');
            });

            it('should make new state reference the suite', function() {
                this.context.suite('name', function(suite) {
                    suite.capture('state');
                });

                this.suite.children[0].states[0].suite.must.equal(this.suite.children[0]);
            });

            it('should call passed callback upon activation', function() {
                var spy = sinon.spy(),
                    browser = {
                        createActionSequence: sinon.stub().returns({
                            perform: sinon.stub()
                        })
                    };

                this.context.suite('name', function(suite) {
                    suite.capture('state', spy);
                });

                this.suite.children[0].states[0].activate(browser, {});

                sinon.assert.called(spy);

            });

            shouldBeChainable('capture', 'state');
        });

        describe('skip', function() {
            it('should throw if argument is not a string nor object', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.skip(123);
                    });
                }.bind(this)).must.throw(TypeError);
            });
            
            it('should throw if argument is array with non-string or non-object', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.skip([123]);
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it('should throw if argument is an object and browser name is not specified', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.skip({iHaveNo: 'name'});
                    });
                }.bind(this)).must.throw(Error);
            });

            it('should throw if browser name is not a string', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.skip({name: true});
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it('should throw if browser version is not a string', function() {
                (function() {
                    this.context.suite('name', function(suite) {
                        suite.skip({name: 'browser', version: {major: 42}});
                    });
                }.bind(this)).must.throw(TypeError);
            });

            it('should mark suite as skipped', function() {
                this.context.suite('name', function(suite) {
                    suite.skip();
                });
                this.suite.children[0].skipped.must.be.true();
            });

            it('should accept skipped browser name', function() {
                this.context.suite('name', function(suite) {
                    suite.skip('opera');
                });

                this.suite.children[0].skipped[0].must.be.eql({name: 'opera'});
            });

            it('should accept browser object', function() {
                this.context.suite('name', function(suite) {
                    suite.skip({name: 'opera'});
                });

                this.suite.children[0].skipped[0].must.be.eql({name: 'opera'});
            });

            it('should accept array of objects', function() {
                this.context.suite('name', function(suite) {
                    suite.skip([
                        {name: 'opera'},
                        {name: 'chrome'}
                    ]);
                });

                this.suite.children[0].skipped.must.be.eql([
                    {name: 'opera'},
                    {name: 'chrome'}
                ]);
            });

            it('should accept array of strings', function() {
                this.context.suite('name', function(suite) {
                    suite.skip([
                        'opera',
                        'chrome'
                    ]);
                });

                this.suite.children[0].skipped.must.be.eql([
                    {name: 'opera'},
                    {name: 'chrome'}
                ]);
            });

        });
    });
});
