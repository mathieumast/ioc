suite("test", function() {
  var expect = chai.expect;

  test("singleton - 1", function(done) {
    require([ "ioc!singleton" ], function(obj) {
      expect(obj).to.be.a("object");
      expect(obj.string).to.equal("toto");

      expect(obj.num).to.equal(1);

      // change string of d
      obj.string = "tutu";
      expect(obj.string).to.equal("tutu");
      
      done();
    });
  });

  test("singleton - 2", function(done) {
    require([ "ioc!singleton" ], function(obj) {
      expect(obj).to.be.a("object");

      // num = 1 (only one initialization because the object is a singleton)
      expect(obj.num).to.equal(1);

      // string = tutu (the object is a singleton)
      expect(obj.string).to.equal("tutu");

      done();
    }, done);
  });

  test("prototype - 1", function(done) {
    require([ "ioc!prototype" ], function(obj) {
      expect(obj).to.be.a("object");

      expect(obj.string).to.equal("toto");

      expect(obj.num).to.equal(1);

      // change string of d
      obj.string = "tutu";
      expect(obj.string).to.equal("tutu");
      
      done();
    }, done);
  });

  test("prototype - 2", function(done) {
    require([ "ioc!prototype" ], function(obj) {
      expect(obj).to.be.a("object");

      // num = 2 (twice initialization because the object is a prototype)
      expect(obj.num).to.equal(2);

      // string != tutu but = toto (the object is a prototype)
      expect(obj.string).to.not.equal("tutu");
      expect(obj.string).to.equal("toto");

      done();
    }, done);
  });

  test("prototype - 3", function(done) {
    require([ "ioc!prototype" ], function(obj) {
      expect(obj).to.be.a("object");

      // num = 3 (twice initialization because the object is a prototype)
      expect(obj.num).to.equal(3);

      // string != tutu but = toto (the object is a prototype)
      expect(obj.string).to.not.equal("tutu");
      expect(obj.string).to.equal("toto");

      done();
    }, done);
  });

  test("multiple dependencies", function(done) {
    require([ "ioc!a" ], function(a) {
      expect(a).to.be.a("object");
      expect(a.b).to.be.a("object");
      expect(a.c).to.be.a("object");
      expect(a.d).to.be.a("object");
      expect(a.d.e).to.be.a("object");

      done();
    }, done);
  });
});