var verifierFactory = require('./verifier'),
	logger = require('./logger'),
	expect = require('chai').expect,
	fs = require('fs'),
	path = require('path'),
	chai = require("chai"),
	rewire = require("rewire"),
	verifier = rewire("./verifier.js"),
	chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe("Verifier Spec", function () {
	describe("Verifier", function () {
		context("when not given --pact-urls or --provider-base-url", function () {
			it("should fail with an error", function () {
				expect(function () {
					verifierFactory({});
				}).to.throw(Error);
			});
		});
		context("when given --provider-states-url and not --provider-states-setup-url", function () {
			it("should fail with an error", function () {
				expect(function () {
					verifierFactory({"providerStatesUrl": "http://foo/provider-states"});
				}).to.throw(Error);
			});
		});
		context("when given --provider-states-setup-url and not --provider-states-url", function () {
			it("should fail with an error", function () {
				expect(function () {
					verifierFactory({"providerStatesSetupUrl": "http://foo/provider-states/setup"});
				}).to.throw(Error);
			});
		});
		context("when given local Pact URLs that don't exist", function () {
			it("should fail with an error", function () {
				expect(function () {
					verifierFactory({
						providerBaseUrl: "http://localhost",
						pactUrls: ["test.json"]
					});
				}).to.throw(Error);
			});
		});
		context("when given an invalid timeout", function () {
			it("should fail with an error", function () {
				expect(function () {
					verifierFactory({
						providerBaseUrl: "http://localhost",
						pactUrls: ["http://idontexist"],
						timeout: -10
					});
				}).to.throw(Error);
			});
		});
		context("when given remote Pact URLs that don't exist", function () {
			it("should pass through to the Pact Verifier regardless", function () {
				expect(function () {
					verifierFactory({
						providerBaseUrl: "http://localhost",
						pactUrls: ["http://idontexist"]
					});
				}).to.not.throw(Error);
			});
		});
		context("when given local Pact URLs that do exist", function () {
			it("should not fail", function () {
				expect(function () {
					verifierFactory({
						providerBaseUrl: "http://localhost",
						pactUrls: [path.dirname(process.mainModule.filename)]
					});
				}).to.not.throw(Error);
			});
		});
		context("when given the correct arguments", function () {
			it("should return a Verifier object", function () {
				var verifier = verifierFactory({
					providerBaseUrl: "http://localhost",
					pactUrls: ["http://idontexist"]
				});
				expect(verifier).to.be.a('object');
				expect(verifier).to.respondTo('verify');
			});
		});
	});

	describe("verify", function () {
		context("when given a successful scenario", function () {
			context("with no provider States", function () {
				it("should return a successful promise with exit-code 0", function () {
					var verifier = verifierFactory({
						providerBaseUrl: "http://localhost",
						pactUrls: ["http://idontexist"]
					});
					return expect(verifier.verify()).to.eventually.be.resolved;
				});
			});
		});
	});

	describe.only("filterRubyResponse", function () {
		filterRubyResponse = verifier.__get__('filterRubyResponse'),

		context("given an map of example good and bad values", function () {
			it("should filter the response correctly", function () {
				var tests = {
					"this is a sentence with a hash # so it should be in tact":                                           "this is a sentence with a hash # so it should be in tact",
					"this is a sentence with a hash and newline\n#so it should not be in tact":                           "this is a sentence with a hash and newline\n",
					"this is a sentence with a ruby statement bundle exec rake pact:verify so it should not be in tact":  "",
					"this is a sentence with a ruby statement\nbundle exec rake pact:verify so it should not be in tact": "this is a sentence with a ruby statement\n",
					"this is a sentence with multiple new lines \n\n\n\n\nit should not be in tact":                      "this is a sentence with multiple new lines \nit should not be in tact"
				};

				for (var k in tests) {
					var test = filterRubyResponse(k)
					expect(test).to.eql(tests[k])
				}
			});
		});
	});
});
