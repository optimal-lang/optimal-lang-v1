function tokenize(str) {
  let re = /[\s,]*([()\[\]{}'`]|"(?:\\.|[^\\"])*"|@(?:@@|[^@])*@|;.*|#.*|[^\s,()\[\]{}'"`;@]*)/g;
  let result = [];
  let token;
  while ((token = re.exec(str)[1]) !== "") {
    if (token[0] === ";") continue;
    if (token[0] === "#") continue;
    if (isFinite(token)) token = parseFloat(token, 10);
    result.push(token);
  }
  return result;
}

function read_token(code, exp) {
  if (code.length === 0) return undefined;
  let token = code.shift();
  exp.push(token);
  return token;
}

function read_list(code, exp, ch) {
  let result = [];
  let ast;
  while ((ast = read_sexp(code, exp, false)) !== undefined) {
    if (ast === "]") {
      if (ch !== "[") code.unshift("]");
      break;
    } else if (ast === ")") {
      break;
    }
    result.push(ast);
  }
  return result;
}

function read_dict(code, exp) {
  let result = [["#", "dict"]];
  let ast1;
  let ast2;
  while ((ast1 = read_sexp(code, exp)) !== undefined) {
    if (ast1 === "]") continue;
    if (ast1 === "}") break;
    ast2 = read_sexp(code, exp);
    result.push(ast1);
    result.push(ast2);
  }
  return result;
}

function read_sexp(code, exp) {
  let token = read_token(code, exp);
  if (token === undefined) return undefined;
  if ((typeof token) === "number") return token;
  switch (token) {
  case "false":
    return false;
  case "true":
    return true;
  case "null":
    return null;
  case "undefined":
    return ["@", "undefined"];
  }
  let ch = token[0];
  switch (ch) {
  case "(":
  case "[":
    let lst = read_list(code, exp, ch);
    return lst;
  case ")":
  case "]":
    return ch;
  case "{":
    return read_dict(code, exp);
  case "}":
    return ch;
  case '"':
    token = JSON.parse(token);
    return token;
  case "@":
    token = token.replace(/(^@|@$)/g, "");
    token = token.replace(/(@@)/g, "@");
    return ["@", token];
  default: {
    if (token[0] === ":") return token;
    if (token[0] === "&") return token;
    let ids = token[0] === "." ? [token] : token.split(".");
    return ["#", ...ids];
  }
  }
}

function join_sexp(exp) {
  if (exp.length === 0) return "";
  let last = exp.shift();
  let result = "" + last;
  while (exp.length > 0) {
    let token = exp.shift();
    if (
      token !== ")" &&
        token !== "]" &&
        (last !== "(") & (last !== "[") &&
        last !== "'"
    )
      result += " ";
    if (token === "[") token = "(";
    if (token === "]") token = ")";
    result += token;
    last = token;
  }
  return result;
}

export function oml2ast(text) {
  let code = tokenize(text);
  let result = [];
  while (true) {
    let exp = [];
    let ast = read_sexp(code, exp);
    if (ast === undefined) break;
    if (ast === ")") continue;
    if (ast === "]") continue;
    result.push([join_sexp(exp), ast]);
  }
  return result;
}

export function ast2oml(ast) {
  if (ast === null) return "null";
  if (ast === undefined) return "undefined";
  if ((typeof ast) === "number") return JSON.stringify(ast);
  if ((typeof ast) === "string") return JSON.stringify(ast);
  if ((typeof ast) === "boolean") return JSON.stringify(ast);
  if (ast instanceof Array) {
    let result = "( ";
    for (let i = 0; i < ast.length; i++) {
      if (i > 0) result += " ";
      result += ast2oml(ast[i]);
    }
    let keys = Object.keys(ast);
    let re = /^[0-9]+/;
    keys = keys.filter(key => !re.test(key));
    keys.sort();
    if (keys.length > 0) {
      if (ast.length > 0) result += " ";
      result += "?";
      for (let i=0; i<keys.length; i++) {
        let key = keys[i];
        result += " (";
        result += JSON.stringify(key);
        result += " ";
        result += ast2oml(ast[key]);
        result += ")";
      }
    }
    result += " )";
    return result;
  } else {
    let result = "{ ";
    let keys = Object.keys(ast);
    keys.sort();
    for (let i = 0; i < keys.length; i++) {
      if (i > 0) result += " ";
      result += JSON.stringify(keys[i]);
      result += " ";
      result += ast2oml(ast[keys[i]]);
    }
    result += " }";
    return result;
  }
}

export function astequal(a, b) {
  // primitive
  if (a === b) {
    return true;
  }
  if (a instanceof Function || b instanceof Function) {
    // Function
    //console.log("function not supported!")
    return false;
  } else if (typeof (a) === 'object' && typeof (b) === 'object') {
    // Object
    const ak = Object.keys(a);
    const bk = Object.keys(b);
    if (ak.length !== bk.length) {
      return false;
    }
    for (let i = 0; i < ak.length; ++i) {
      const key = ak[i];
      const ret = astequal(a[key], b[key]);
      if (ret === false) {
        return false;
      }
    }
    return true;
  }
  return false;
}

export class OMLCommon {
  is_array(x) {
    return (x instanceof Array);
  }

  is_bool(x) {
    return (typeof x) === "boolean";
  }

  is_number(x) {
    return (typeof x) === "number";
  }

  is_string(x) {
    return (typeof x) === "string";
  }

  is_quoted(x) {
    if (!this.is_array(x)) return false;
    if (x.length === 0) return false;
    return x[0] === "`";
  }

  is_id(ast, name = undefined) {
    let ok = ast instanceof Array && ast[0] === "#";
    if (!ok) return false;
    return name ? ast[1]===name : true;
  }

  is_variable(ast) {
    if (!(ast instanceof Array)) false;
    if (ast.length === 0) return false;
    return ast[0] === "#";
  }

  is_script(ast) {
    if (!(ast instanceof Array)) false;
    if (ast.length === 0) return false;
    return ast[0] === "@";
  }

  is_callable(ast) {
    if (!(ast instanceof Array)) false;
    if (ast.length === 0) return false;
    if (ast[0] === "#") return false;
    if (ast[0] === "@") return false;
    return this.is_id(ast[0]) || this.is_script(ast[0]);
  }

  is_fn(ast) {
    if (!(ast instanceof Array)) false;
    if (ast.length === 0) return false;
    return this.is_id(ast[0]) && this.to_id(ast[0])==="fn";
  }

  to_id(ast) {
    if (this.is_id(ast)) {
      let ids = ast.slice(1);
      return ids.join(".");
    } else if (this.is_script(ast)) {
      return "@";
    }
    return ast;
  }

  id(x) {
    return ["#", x];
  }

  to_def(ast) {
    if (!this.is_array(ast)) return null;
    if (ast.length === 0) return null;
    switch (this.to_id(ast[0])) {
    case "def": {
      if (ast.length < 2) throw new Error("sysntax error");
      let ast1 = ast[1];
      let ast2 = ast.length === 2 ? null : ast[2];
      return [this.id("def"), ast1, ast2];
    }
    case "defvar": {
      if (ast.length < 2) throw new Error("sysntax error");
      let ast1 = ast[1];
      let ast2 = ast.length === 2 ? null : ast[2];
      return [this.id("def"), ast1, ast2];
    }
    case "defun": {
      let new_ast = ast.slice(3);
      new_ast.unshift(ast[2]);
      new_ast.unshift(this.id("fn"));
      return [this.id("def"), ast[1], new_ast];
    }
    case "define": {
      let ast1 = this.to_id(ast[1]);
      if (ast1 instanceof Array) {
        if (ast.length < 2) throw new Error("sysntax error");
        let new_ast = ast.slice(2);
        return this.to_def([this.id("defun"), ast[1][0], ast[1].slice(1), ...new_ast]);
      }
      else {
        if (ast.length < 2) throw new Error("sysntax error");
        let ast1 = ast[1];
        let ast2 = ast.length === 2 ? null : ast[2];
        return this.to_def([this.id("defvar"), ast1, ast2]);
      }
    }
    default:
      return null;
    }
  }

}

import { oml2ast, ast2oml, astequal } from "./oml2ast.mjs";
import { OMLCommon } from "./omlcommon.mjs";

let common = new OMLCommon();

function compile_number(ast) {
  return `number_value(${compile_ast(ast)})`;
}

function compile_string(ast) {
  return `String(${compile_ast(ast)})`;
}

function compile_body_helper(body) {
  if (body.length === 0) return null;
  let result = "(";
  for (let i = 0; i < body.length; i++) {
    if (i > 0)
      result += ",";
    let def = common.to_def(body[i]);
    if (def !== null) {
      let let_ast = [common.id("let"), [[def[1], def[2]]], ...body.slice(i + 1)];
      return result + compile_ast(let_ast) + ")";
    }
    result += compile_ast(body[i]);
  }
  return result + ")";
}

function compile_body(ast, start) {
  let body = [];
  for (let i = start; i < ast.length; i++) {
    body.push(ast[i]);
  }
  return compile_body_helper(body);
}

function compile_ast(ast) {
  if (ast === null)
    return "null";
  if (ast === undefined)
    return "undefined";
  /*
    if (!ast) {
    return JSON.stringify(ast);
    }
  */
  if (typeof ast === "string") {
    /*
      if (ast.match(/^:.+$/) || ast.match(/^#.+$/))
      return JSON.stringify(ast);
      return ast;
    */
    return JSON.stringify(ast);
  }
  if (!(ast instanceof Array)) {
    return ast.toString();
  }
  if (ast.length === 0)
    return "[]";
  if (common.is_variable(ast)) {
    return common.to_id(ast);
  }
  if (common.is_script(ast)) {
    return ast[1];
  }
  if (common.is_id(ast[0]) && common.to_id(ast[0])==="?") {
    return compile_ast([common.id("list"), ...ast]);
  }
  if (!common.is_callable(ast)) {
    return compile_ast([common.id("list"), ...ast]);
  }
  switch (common.to_id(ast[0])) {
  case "@": {
    let fcall = ast[0][1] + "(";
    for (let i = 1; i < ast.length; i++) {
      if (i > 1)
        fcall += ",";
      fcall += compile_ast(ast[i]);
    }
    fcall += ")";
    return fcall;
  }
  case "begin":
    return compile_body(ast, 1);
  case "case": {
    let cond_ast = [common.id("cond")];
    for (let i=2; i<ast.length; i++) {
      let e = ast[i];
      if (common.is_id(e[0], "else") || common.is_id(e[0], "otherwise")) {
        cond_ast.push(e);
      } else {
        cond_ast.push([[common.id("equal"), common.id("__case__"), e[0]],...e.slice(1)]);
      }
    }
    //return compile_ast([common.id("let*"), [[common.id("__case__"), ast[1]]], cond_ast]);
    let new_ast = [common.id("let*"), [[common.id("__case__"), ast[1]]], cond_ast];
    //print(new_ast);
    return compile_ast(new_ast);
  }
  case "_cond": {
    function _cond_builder(rest) {
      if (rest.length === 0)
        return null;
      let condition = rest.shift();
      condition = common.to_id(condition);
      let action = rest.shift();
      switch (condition) {
      case true:
      case "else":
      case "otherwise":
        return action;
      }
      return [common.id("if"), condition, action, _cond_builder(rest)];
    }
    ast = _cond_builder(ast.slice(1));
    return compile_ast(ast);
  }
  case "cond": {
    let new_ast = [];
    ast.slice(1).forEach((x) => {
      new_ast.push(x[0]);
      new_ast.push([["#", "begin"]].concat(x.slice(1)));
    });
    new_ast.unshift(["#", "_cond"]);
    return compile_ast(new_ast);
  }
  case "dec!":
  case "inc!":
    let sign = common.to_id(ast[0]) === "dec!" ? "-" : "+";
    let val = ast.length < 3 ? 1 : compile_ast(ast[2]);
    return compile_ast(ast[1]) + sign + "=" + val;
  case "def": {
    ast = common.to_def(ast);
    return "globalThis." + common.to_id(ast[1]) + "=" + compile_ast(ast[2]);
  }
  case "define": case "defun": case "defvar": {
    ast = common.to_def(ast);
    return compile_ast(ast);
  }
  case "do":
  case "do*":
    return compile_do(ast);
  case "fn":
  case "lambda": {
    let args = "(";
    for (let i = 0; i < ast[1].length; i++) {
      if (i > 0)
        args += ",";
      args += common.to_id(ast[1][i]);
    }
    args += ")";
    if (ast.length < 3)
      return "function" + args + "{}";
    return "function" + args + "{return " + compile_body(ast, 2) + "}";
  }
  case "dotimes": {
    let ast1 = ast[1];
    if (!common.is_array(ast1) || common.is_quoted(ast1))
      ast1 = [common.id("$index"), ast1];
    else if (ast1.length < 2)
      throw new Error("syntax error");
    let result_exp = ast1.length < 3 ? common.id("null") : ast1[2];
    let bind = [
      [common.id("__dotimes_cnt__"), ast1[1]],
      [common.id("__dotimes_idx__"), 0, [common.id("+"), common.id("__dotimes_idx__"), 1]],
      [ast1[0], common.id("__dotimes_idx__"), common.id("__dotimes_idx__")],
    ];
    let exit = [[common.id(">="), common.id("__dotimes_idx__"), common.id("__dotimes_cnt__")], result_exp];
    ast = [common.id("do*"), bind, exit].concat(ast.slice(2));
    return compile_ast(ast);
  }
  case "length": {
    if (ast.length != 2) return new Error("syntax error");
    return "(" + compile_ast(ast[1]) + ").length";
  }
  case "prop-get": {
    if (ast.length != 3) return new Error("syntax error");
    return compile_ast(ast[1]) + "[" + compile_ast(ast[2]) + "]";
  }
  case "prop-set!": {
    if (ast.length != 4) return new Error("syntax error");
    return compile_ast(ast[1]) + "[" + compile_ast(ast[2]) + "]=" + compile_ast(ast[3]);
  }
  case "dolist": {
    let ast1 = ast[1];
    if (common.is_variable(ast1) || !common.is_array(ast1) || common.is_quoted(ast1))
      ast1 = [common.id("$item"), ast1];
    else if (ast1.length < 2)
      throw new Error("syntax error");
    let result_exp = ast1.length < 3 ? common.id("null") : ast1[2];
    let bind = [
      [common.id("__dolist_list__"), ast1[1]],
      [common.id("__dolist_cnt__"), [common.id("length"), common.id("__dolist_list__")]],
      [common.id("__dolist_idx__"), 0, [common.id("+"), common.id("__dolist_idx__"), 1]],
      [ast1[0], [common.id("prop-get"), common.id("__dolist_list__"), common.id("__dolist_idx__")], [common.id("prop-get"), common.id("__dolist_list__"), common.id("__dolist_idx__")]],
    ];
    let exit = [[common.id(">="), common.id("__dolist_idx__"), common.id("__dolist_cnt__")], result_exp];
    ast = [common.id("do*"), bind, exit].concat(ast.slice(2));
    return compile_ast(ast);
  }
  case "if":
    return ("(" +
            compile_ast(ast[1]) +
            "?" +
            compile_ast(ast[2]) +
            ":" +
            compile_body(ast, 3) +
            ")");
  case "let":
  case "let*": {
    let ast1 = ast[1];
    let new_ast1 = [];
    for (let x of ast1) {
      if (typeof x === "string") {
        new_ast1.push(x);
        new_ast1.push(undefined);
      }
      else {
        new_ast1.push(x[0]);
        new_ast1.push(x[1]);
      }
    }
    return compile_ast([common.id("_" + common.to_id(ast[0])), new_ast1].concat(ast.slice(2)));
  }
  case "_let":
  case "_let*": {
    let vars = "(";
    let vals = "(";
    let assigns = "";
    for (let i = 1; i < ast[1].length; i += 2) {
      if (i > 1)
        vars += ",";
      vars += common.to_id(ast[1][i - 1]);
      let val = compile_ast(ast[1][i]);
      if (i > 1)
        vals += ",";
      vals += val;
      assigns += common.to_id(ast[1][i - 1]) + "=" + val + ";";
    }
    vars += ")";
    vals += ")";
    if (common.to_id(ast[0]) === "_let")
      return ("((function" +
              vars +
              "{return " +
              compile_body(ast, 2) +
              "})" +
              vals +
              ")");
    else
      return ("((function" +
              vars +
              "{" +
              assigns +
              "return " +
              compile_body(ast, 2) +
              "})())");
  }
  case "list": {
    ast = ast.slice(1);
    let found = -1;
    for (let i = 0; i < ast.length; i++) {
      let e = ast[i];
      if (common.is_id(e) && common.to_id(e) === "?") {
        found = i;
        break;
      }
    }
    let list;
    let dict;
    if (found === -1) {
      list = ast;
      dict = [];
    } else if (found === 0) {
      list = [];
      dict = ast.slice(1);
    } else {
      list = ast.slice(0, found);
      dict = ast.slice(found + 1);
    }
    let body = [];
    for (let i = 0; i < list.length; i++) {
      body.push([common.id("prop-set!"), common.id("__obj__"), i, list[i]]);
    }
    for (let i = 0; i < dict.length; i++) {
      let pair = dict[i];
      if (common.is_string(pair)) pair = [pair, true];
      body.push([common.id("prop-set!"), common.id("__obj__"), pair[0], pair[1]]);
    }
    body.push(common.id("__obj__"));
    ast = [common.id("let*"), [[common.id("__obj__"), ["@", "[]"]]], ...body];
    return compile_ast(ast);
  }
  case "dict": {
    if ((ast.length % 2) !== 1) throw new Error("synatx error");
    let body = [];
    for (let i = 1; i < ast.length; i += 2) {
      body.push([common.id("prop-set!"), common.id("__dict__"), ast[i], ast[i + 1]]);
    }
    body.push(common.id("__dict__"));
    ast = [common.id("let*"), [[common.id("__dict__"), ["@", "{}"]]], ...body];
    return compile_ast(ast);
  }
  case "set!":
    return compile_ast(ast[1]) + "=" + compile_ast(ast[2]);
  case "throw": {
    return "(function(){throw " + compile_ast(ast[1]) + "})()";
  }
  case "try": {
    let result = "(function(){try{return " + compile_ast(ast[1]) + "}catch(";
    if (common.to_id(ast[2][0]) != "catch") throw "try without catch clause";
    result += common.to_id(ast[2][1]) + "){return " + compile_body(ast[2], 2) + "}";
    result += "})()";
    return result;
  }
  case "until":
  case "while": {
    let condition = compile_ast(ast[1]);
    if (common.to_id(ast[0]) === "until")
      condition = "!" + condition;
    return ("((function(){while(" +
            condition +
            "){" +
            compile_body(ast, 2) +
            "}})(),null)");
  }
  case ".": {
    let op = "+";
    let rest = ast.slice(1);
    let result = [];
    for (let i = 0; i < rest.length; i++) {
      if (i > 0) result.push(op);
      result.push(compile_string(rest[i]));
    }
    return result.join("");
  }
  case "=":
    return "(" + compile_ast(ast[1]) + "===" + compile_ast(ast[2]) + ")";
  case "%":
  case "==":
  case "===":
  case "!=":
  case "!==":
  case "<":
  case ">":
  case "<=":
  case ">=":
    return "(" + compile_number(ast[1]) + common.to_id(ast[0]) + compile_number(ast[2]) + ")";
  case "&&":
  case "||":
  case "&":
  case "|":
  case "+":
  case "-":
  case "*":
  case "**":
  case "/": {
    return "(" + insert_op(common.to_id(ast[0]), ast.slice(1)) + ")";
  }
  default: {
    let fcall = common.to_id(ast[0]) + "(";
    for (let i = 1; i < ast.length; i++) {
      if (i > 1)
        fcall += ",";
      fcall += compile_ast(ast[i]);
    }
    fcall += ")";
    return fcall;
  }
  }
}

function insert_op(op, rest) {
  if (rest.length === 1)
    return op + compile_number(rest[0]);
  let result = [];
  for (let i = 0; i < rest.length; i++) {
    if (i > 0) result.push(op);
    result.push(compile_number(rest[i]));
  }
  return result.join("");
}

function compile_do(ast) {
  let ast1 = ast[1];
  let parallel = ast[0] === "do";
  let ast1_len = ast1.length;
  let ast1_vars = [];
  if (parallel) {
    ast1_vars.push("__do__");
    ast1_vars.push("new Array(" + ast1_len + ").fill(null)");
  }
  ast1.forEach((x) => {
    ast1_vars.push(x[0]);
    ast1_vars.push(x[1]);
  });
  let ast2 = ast[2];
  if (ast2.length < 2)
    ast2 = [ast2[0], null];
  let until_ast = [common.id("until"), ast2[0]].concat(ast.slice(3));
  if (parallel) {
    ast1.forEach((x, i) => {
      if (x.length < 3)
        return;
      let next_step = [id("set!"), "__do__[" + i + "]", x[2]];
      until_ast.push(next_step);
    });
    ast1.forEach((x, i) => {
      if (x.length < 3)
        return;
      let next_step = [id("set!"), x[0], "__do__[" + i + "]"];
      until_ast.push(next_step);
    });
  }
  else {
    ast1.forEach((x) => {
      if (x.length < 3)
        return;
      let next_step = [common.id("set!"), x[0], x[2]];
      until_ast.push(next_step);
    });
  }
  let new_ast = [parallel ? common.id("_let") : common.id("_let*"), ast1_vars].concat([until_ast]);
  new_ast.push(ast2[1]);
  return compile_ast(new_ast);
}

export function omljs() {
  let glob = {};
  glob.compile_ast = (ast, debug) => {
    if (debug)
      console.log(" [AST] " + JSON.stringify(ast));
    let code = compile_ast(ast);
    if (debug)
      console.log("[CODE] " + code);
    return code;
  };
  glob.compile = (text, debug) => {
    let steps = oml2ast(text);
    let result = "";
    for (let step of steps) {
      let exp = step[0];
      let ast = step[1];
      if (debug)
        console.log(" [OML] " + exp);
      if (debug)
        console.log(" [AST] " + JSON.stringify(ast));
      let code = compile_ast(ast);
      if (debug)
        console.log("[CODE] " + code);
      result += code + ";\n";
    }
    return result;
  };
  glob.exec_d = (exp) => glob.exec(exp, true);
  glob.exec = (exp, debug) => {
    let src = exp;
    let steps = oml2ast(src);
    let last;
    let text = "";
    for (let step of steps) {
      let exp = step[0];
      let ast = step[1];
      var tm1 = new Date().getTime();
      try {
        if (debug)
          console.log(" [OML] " + exp);
        if (debug)
          console.log(" [AST] " + JSON.stringify(ast));
        text = compile_ast(ast);
        if (debug)
          console.log("[CODE] " + text);
        let val = eval(text);
        last = val;
        let output;
        if (typeof val === "function") {
          output = "function";
        }
        else if (!(val instanceof Array) &&
                 val instanceof Object &&
                 Object.prototype.toString.call(val) !== "[object Object]") {
          try {
            output =
              Object.prototype.toString.call(val) + " " + JSON.stringify(val);
          }
          catch (e) { }
        }
        else {
          try {
            output = JSON.stringify(val);
          }
          catch (e) { }
        }
        var tm2 = new Date().getTime();
        if (debug) {
          if (output === undefined) {
            console.log("==> (" + (tm2 - tm1) + " ms)");
            console.log(val);
          }
          else {
            console.log("==> " + output + " (" + (tm2 - tm1) + " ms)");
          }
        }
      }
      catch (e) {
        if (!debug)
          console.log(" [OML] " + exp);
        if (!debug)
          console.log(" [AST] " + JSON.stringify(ast));
        if (!debug)
          console.log("[CODE] " + text);
        console.log("[EXCEPTION]");
        if (e.stack)
          console.log(e.stack);
        else
          console.log(e);
        throw e;
        break;
      }
    }
    return last;
  };
  glob.run = (exp) => glob.exec(exp, true);
  glob.execAll = (exp, debug) => {
    let text = glob.compile(exp, debug);
    try {
      return eval(text);
    } catch (e) {
      if (e.stack)
        console.log(e.stack);
      else
        console.log(e);
      throw e;
    }
  };
  glob.runAll = (exp) => {
    return glob.execAll(exp, true);
  };
  return glob;
}

export function run(exp) {
  let o = omljs();
  return o.run(exp);
}

export function runAll(exp) {
  let o = omljs();
  return o.runAll(exp);
}

function print(x) {
  console.log(ast2oml(x));
  return x;
};
globalThis.print = print;

function number_value(x) {
  return typeof x !== "number" ? 0 : x;
}
globalThis.number_value = number_value;

function equal(a, b) {
  return astequal(a, b);
}
globalThis.equal = equal;
