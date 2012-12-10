var should = require('should');
var Ajel   = require("../index");

describe("table.jsのテスト", function() {
  it("インスタンス作成", function() {
    var t = new Ajel.Table("table1", ["foo", "bar", "baz"]);
    t.class_name.should.equal("AjelTable");
  });
  it("DESC,ASCの中身を見る", function() {
    var t = new Ajel.Table("table1", ["foo", "bar", "baz"]);
    t.foo.asc.should.equal("table1.foo ASC");
    t.foo.desc.should.equal("table1.foo DESC");
  });
  it("各種ノード生成", function() {
    var t = new Ajel.Table("table1", ["foo", "bar", "baz"]);
    t.foo.eq(3).dump().should.eql(["table1.foo = ?", [3]]);
    t.foo.le(3).dump().should.eql(["table1.foo <= ?", [3]]);
    t.foo.lt(3).dump().should.eql(["table1.foo < ?", [3]]);
    t.foo.ge(3).dump().should.eql(["table1.foo >= ?", [3]]);
    t.foo.gt(3).dump().should.eql(["table1.foo > ?", [3]]);
    t.foo.not(3).dump().should.eql(["table1.foo != ?", [3]]);
    t.foo.eq(null).dump().should.eql(["table1.foo IS NULL", []]);
    t.foo.not(null).dump().should.eql(["table1.foo IS NOT NULL", []]);
    t.foo.matches("%foo").dump().should.eql(["table1.foo LIKE ?", ["%foo"]]);
    t.foo.ins([1,2,3]).dump().should.eql(["table1.foo IN (?,?,?)", [1,2,3]]);
    t.foo.ins([1,2,3], false).dump().should.eql(["table1.foo NOT IN (?,?,?)", [1,2,3]]);
    t.foo.between(1, 3).dump().should.eql(["table1.foo BETWEEN ? AND ?", [1, 3]]);
    t.foo.eq(3).and(t.bar.eq(5)).dump().should.eql(["(table1.foo = ? AND table1.bar = ?)", [3, 5]]);
    t.foo.eq(3).or(t.bar.eq(5)).dump().should.eql(["(table1.foo = ? OR table1.bar = ?)", [3, 5]]);
    t.foo.eq(3).and(t.bar.eq(5)).and(t.baz.not("oo")).dump().should.eql(["(table1.foo = ? AND table1.bar = ? AND table1.baz != ?)", [3, 5, "oo"]]);
    t.foo.eq(3).and(t.bar.eq(5)).or(t.baz.not("oo")).dump().should.eql(["(table1.foo = ? AND table1.bar = ? OR table1.baz != ?)", [3, 5, "oo"]]);
    t.foo.eq(3).and(t.bar.eq(5).or(t.baz.not("oo"))).dump().should.eql(["(table1.foo = ? AND (table1.bar = ? OR table1.baz != ?))", [3, 5, "oo"]]);
    t.foo.eq(3).and(t.bar.eq(5).or(t.baz.not("oo"))).and(t.bar.between(1, 3)).dump().should.eql(["(table1.foo = ? AND (table1.bar = ? OR table1.baz != ?) AND table1.bar BETWEEN ? AND ?)", [3, 5, "oo", 1, 3]]);
  });
  it("SQL生成", function() {
    var t = new Ajel.Table("table1", ["foo", "bar", "baz"]);
    t.where(t.foo.eq(3).and(t.bar.eq(5).or(t.baz.not("oo"))));
    t.to_sql().should.equal("SELECT * FROM table1 WHERE (table1.foo = ? AND (table1.bar = ? OR table1.baz != ?))");
    t.where(t.foo.between(1,3));
    var conn = {
      query : function(sql, binds, callback) {
        binds.should.eql([3, 5, "oo", 1, 3]);
      }
    };
    t.retrieve(conn, function() {});
  });
});
