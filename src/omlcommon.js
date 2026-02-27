class OMLCommon {
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
exports.OMLCommon = OMLCommon;
