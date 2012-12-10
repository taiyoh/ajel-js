var Query = require("./query");

function Node(op) {
    var _node = [op], self;

    self = {
        and : and,
        or  : or,
        dump: dump
    };

    function and(node) {
        _node.push("AND");
        _node.push(node);
        return self;
    }

    function or(node) {
        _node.push("OR");
        _node.push(node);
        return self;
    }

    function dump() {
        var i = 0, n, where = [], binds = [], tmp, brace = false;
        for (; n = _node[i]; ++i) {
            if (/^(AND|OR)$/.test(n)) {
                brace = true;
                where.push(n);
            }
            else if (n instanceof Array) {
                where.push(n[0]);
                if (n[1]) {
                    binds = binds.concat(n[1]);
                }
            }
            else {
                tmp = n.dump();
                where.push(tmp[0]);
                binds = binds.concat(tmp[1]);
            }
        }
        return [
            (brace ? "(" + where.join(" ") + ")": where.join(" ")),
            binds
        ];
    }
    return self;
}

function Column(name) {
    var self = {
		asc  : name + " ASC",
		desc : name + " DESC",
		eq   : eq,
		ins  : ins,
		not  : not,
		lt   : lt,
		le   : le,
		gt   : gt,
		ge   : ge,
		matches: matches,
		between: between
	};

    function eq(val) {
        if (val === null) {
            return Node([name + " IS NULL"]);
        }
        else {
            return Node([name + " = ?", val]);
        }
    }

    function ins(vals, n) {
        var qs = [], i = 0, v, in_cond = " IN";
        for (; v = vals[i]; ++i) {
        	qs.push("?");
        }
        if (typeof n != "undefined" && !n) {
        	in_cond = " NOT IN";
        }
        return Node([name + in_cond + " (" + qs.join(",") + ")", vals]);
    }

    function lt(val) {
        return Node([name + " < ?", val]);
    }

    function le(val) {
        return Node([name + " <= ?", val]);
    }

    function gt(val) {
        return Node([name + " > ?", val]);
    }

    function ge(val) {
        return Node([name + " >= ?", val]);
    }

    function not(val) {
        if (val === null) {
            return Node([name + " IS NOT NULL"]);
        }
        else {
            return Node([name + " != ?", val]);
        }
    }

    function matches(val) {
        return Node([name + " LIKE ?", val]);
    }

    function between(val1, val2) {
        return Node([name + " BETWEEN ? AND ?", [val1, val2]]);
    }

	return self;
}

function Table(from, columns) {
    var table = {class_name: "AjelTable"}, i = 0, c, q = new Query(from);

    for (; c = columns[i]; ++i) {
        table[c] = Column(from + "." + c);
    }

    function _join(j) {
        function on(val) {
            if (val instanceof String) {
                q.joins(j + " ON (" + val + ")");
            }
            return table;
        }
        return {on: on};
    }

    function join(table) {
        return _join("INNER JOIN " + table());
    }

    function includes(table) {
        return _join("LEFT OUTER JOIN " + table());
    }

    function where(node) {
        if (node.dump && typeof node.dump == "function") {
            q.where.apply(q, node.dump());
        }
        else {
            q.where.apply(q, arguments);
        }
        return table;
    }

    function order() {
        q.order.apply(q, arguments);
        return table;
    }

    function project() {
        q.select.apply(q, arguments);
        return table;
    }

    function group() {
        q.group.apply(q, arguments);
        return table;
    }

    function having() {
        q.having.apply(q, arguments);
        return table;
    }

    function take() {
        q.limit.apply(q, arguments);
        return table;
    }

    function skip() {
        q.offset.apply(q, arguments);
        return table;
    }

    function to_sql() {
        return q.to_sql.apply(q, arguments);
    }

    function retrieve(conn, callback) {
        q.retrieve(conn, callback);
    }

    table.where    = where;

    table.join     = join;
    table.includes = includes;

    table.order    = order;
    table.project  = project;

    table.group    = group;
    table.having   = having;

    table.take     = take;
    table.skip     = skip;

    table.to_sql   = to_sql;
    table.retrieve = retrieve;

    return table;
}

module.exports = Table;