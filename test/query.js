var should = require('should');
var Ajel   = require("../index");

describe("query.jsのテスト", function() {
  it("インスタンス作成", function() {
    var q = new Ajel.Query("table1");
    q.should.have.property('where');
    q.should.have.property('from');
    q.should.have.property("to_sql");
  });
  it("SQL作成1", function() {
    var q = new Ajel.Query("table1");
    var sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1");
  });
  it("whereつける", function() {
    var q = new Ajel.Query("table1");
    q.where("foo = ?", "bar");
    var sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 WHERE foo = ?");
    q.where("hoge IN ?", [1,2]);
    sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 WHERE foo = ? AND hoge IN ?");
    q.where({id: [1,2]});
    sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 WHERE foo = ? AND hoge IN ? AND id IN (?,?)");
  });
  it("joinつける", function() {
    var q = new Ajel.Query("table1");
    q.joins("INNER JOIN table2 ON (table1.t2_id = table2.id)");
    var sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 INNER JOIN table2 ON (table1.t2_id = table2.id)");
  });
  it("group byつける", function() {
    var q = new Ajel.Query("table1");
    q.group("hoge");
    var sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 GROUP BY hoge");
  });
  it("group byつける", function() {
    var q = new Ajel.Query("table1");
    q.group("hoge");
    var sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 GROUP BY hoge");
    q.having("foo > 0");
    sql = q.to_sql();
    sql.should.equal("SELECT * FROM table1 GROUP BY hoge HAVING foo > 0");
    q.having("foo > ?");
    sql = q.to_sql();
    sql.should.equal("SELECT * FROM table1 GROUP BY hoge HAVING foo > ?");
  });
  it("offset, limitつける", function() {
    var q = new Ajel.Query("table1");
    q.offset(3).limit(4);
    var sql  = q.to_sql();
    sql.should.equal("SELECT * FROM table1 LIMIT 4 OFFSET 3");
  });
  it("selectを指定", function() {
    var q = new Ajel.Query("table1");
    q.select("foo", "bar", "baz");
    var sql  = q.to_sql();
    sql.should.equal("SELECT foo, bar, baz FROM table1");
  });
  it("複雑に作ってみる", function() {
    var q = new Ajel.Query("table1");
    q.select("foo", "bar", "baz")
     .where({foo:["bar", "baz"]})
     .where("id > ?", 5)
     .joins("LEFT JOIN table2 ON (table1.t2_id = table2.id)")
     .offset(5).limit(10);
    var sql  = q.to_sql();
    sql.should.equal("SELECT foo, bar, baz FROM table1 LEFT JOIN table2 ON (table1.t2_id = table2.id) WHERE foo IN (?,?) AND id > ? LIMIT 10 OFFSET 5");
  });
  it("bindされてる値が正しいか確認", function() {
    var q = new Ajel.Query("table1");
    q.select("foo", "bar", "baz")
     .where({foo:["bar", "baz"]})
     .where("id > ?", 5)
     .joins("LEFT JOIN table2 ON (table1.t2_id = table2.id)")
     .group("aaaaa")
     .having("hoge > ?", 1000)
     .offset(5).limit(10);
    var conn = {
      query: function conn(sql, binds, callback) {
        binds.should.eql(["bar", "baz", 5, 1000]);
        callback(null, [{id:1},{id:2},{id:3}]);
      }
    };
    q.retrieve(conn, function(err, result) {
      result.length.should.equal(3);
      var id_sum = 0, count = 0;
      result.each(function(c) {
        id_sum += c.id;
        count++;
      });
      id_sum.should.equal(6);
      count.should.equal(3);
      var res1 = result.map(function(c) {
        return c.id;
      });
      res1.should.eql([1,2,3]);
      var res2 = result.reduce(10, function(cb) {
        cb.memo += cb.item.id;
      });
      res2.should.equal(16);
    });
  });
});