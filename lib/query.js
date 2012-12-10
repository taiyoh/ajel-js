function to_array(args) { return Array.prototype.concat.apply([], args); }

function Query(table) {

    var rules = {}, binds = [], having_binds = [], self = {};

    rules = {
        where: [],
        joins: [],
        order: [],
        select: ['*'],
        group: null,
        having: [],
        offset: 0,
        limit: null,
        from: table
    };

    self = {
        where: where,
        joins: joins,
        order: order,
        select: select,
        having: having,
        group: group,
        offset: offset,
        limit: limit,
        retrieve: retrieve,
        from: from,
        to_sql: to_sql
    };

    function where(cond) {
        if (!cond) return self;

        if (arguments.length == 1) {
            var wh = [];
            for (var name in cond) {
                var val = cond[name];
                // IN (?, ?, ...)
                if (val instanceof Array) {
                    var qs = [], i = 0, e;
                    for (; e = val[i]; i++) {
                        qs.push("?");
                        binds.push(e);
                    }
                    wh.push(name + " IN (" + qs.join(",") + ")");
                }
                // = ?
                else {
                    wh.push(name + " = ?");
                    binds.push(val);
                }
            }
            rules.where.push(wh.join(" AND "));
        }
        else {
            var args = to_array(arguments).slice(1);
            rules.where.push(cond);
            binds = binds.concat(args);
        }
        return self;
    }

    function joins(join) {
        rules.joins.push(join);
        return self;
    }

    function order(o) {
        rules.order.push(o);
        return self;
    }

    function select() {
        rules.select = to_array(arguments);
        return self;
    }

    function having(cond, val) {
        rules.having = [cond, val];
        return self;
    }

    function limit(l) {
        rules.limit = parseInt(l, 10) || null;
        return self;
    }

    function offset(o) {
        rules.offset = parseInt(o, 10) || 0;
        return self;
    }

    function group(g) {
        rules.group = g.toString();
        return self;
    }

    function from(table) {
        rules.from = table.toString();
        return self;
    }

    function to_sql() {
        var sql = "SELECT " + rules.select.join(", ") + " FROM " + rules.from;
        having_binds = [];
        if (rules.joins.length > 0) {
            sql += " " + rules.joins.join(" ");
        }
        if (rules.where.length > 0) {
            sql += " WHERE " + rules.where.join(" AND ");
        }
        if (rules.group) {
            sql += " GROUP BY " + rules.group;
            if (rules.having.length > 0) {
                sql += " HAVING " + rules.having[0];
                if (typeof rules.having[1] != "undefined") {
                    having_binds.push(rules.having[1]);
                }
            }
        }
        if (rules.order.length > 0) {
            sql += " ORDER BY " + rules.order.join(", ");
        }
        if (rules.limit !== null) {
            sql += " LIMIT " + rules.limit;
        }
        if (rules.offset > 0) {
            sql += " OFFSET " + rules.offset;
        }
        return sql;
    }

    function retrieve(conn, callback) {
        var sql = to_sql(), _binds = [];
        _binds = to_array(binds).concat(having_binds);
        conn.query(sql, _binds, function(err, results) {
            if (err) {
                callback(err);
            }
            else {
                callback(null, Results(results));
            }
        });
    }

    return self;
}

function Results(results) {

    function result_each(callback) {
        var i = 0, r;
        for (; r = results[i]; ++i) {
            callback(r);
        }
    }

    function result_map(callback) {
        var i = 0, r, list = [];
        for (; r = results[i]; ++i) {
            list.push(callback(r));
        }
        return list;
    }

    function result_reduce(init, callback) {
        var i = 0, r, result = init, cb;
        for (; r = results[i]; ++i) {
            cb = {memo: result, item: r};
            callback(cb);
            result = cb.memo;
        }
        return result;
    }

    return {
        each: result_each,
        map : result_map,
        reduce: result_reduce,
        collect: result_reduce,
        length: results.length
    };

}

module.exports = Query;