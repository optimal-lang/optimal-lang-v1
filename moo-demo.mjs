// https://deno.land/x/moo@0.5.1-deno
import moo from "https://deno.land/x/moo@0.5.1-deno/mod.ts";

let lexer = moo.compile({
  WS:      /[ \t]+/,
  comment: /\/\/.*?$/,
  number:  /0|[1-9][0-9]*/,
  string:  /"(?:\\["\\]|[^\n"\\])*"/,
  lparen:  '(',
  rparen:  ')',
  keyword: ['while', 'if', 'else', 'moo', 'cows'],
  NL:      { match: /\n/, lineBreaks: true },
});

function print(x) {
  console.log(JSON.stringify(x));
}

lexer.reset('while (10) cows\nmoo');
print(lexer.next()); // -> { type: 'keyword', value: 'while' }
print(lexer.next()); // -> { type: 'WS', value: ' ' }
print(lexer.next()); // -> { type: 'lparen', value: '(' }
print(lexer.next()); // -> { type: 'number', value: '10' }
