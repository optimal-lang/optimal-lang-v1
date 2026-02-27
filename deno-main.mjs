#! /usr/bin/env deno-run
//import { run } from "./src/omljs.mjs";

import * as dummy from "./dist/bundle.js";

//const text = await Deno.readTextFile("./public/all.js");
//eval(text);

run(`
(console.log @11+22@)
(console.log "str")
(console.log "ハロー©")
(define xyz 777)
(console.log xyz)
(console.log 123)
(console.log (+ 11 22]

(define x 123)
(begin
  (set! x (+ 1 x))
  (set! x (+ 2 x))
  (console.log x]

#(Deno.exit 0)
[dotimes (i 3) (console.log i]
[dotimes (i 3) (dotimes (j 2) (console.log (list i j]
(define x 11)
(define y 22)
(console.log (+ x y]
[let ((a 33) (b 44)) (console.log (+ a b]
[let* ((a 55) (b (+ 1 a))) (console.log (list a b]
[let* [(a 55) (b (+ 1 a] (console.log (list a b]
(define (fact n)
  (let ((factorial 1.0))
    (if (< n 0)
        -1
      (begin
        [dotimes (i n)
          (set! factorial (* factorial (+ 1 i]
        factorial]
(console.log (fact 4))
(define (fact2 x)
  (do ((n 2 (+ 1 n)) (result 1))
      ((< x n) result)
      (set! result (* result n))))
(console.log (fact2 4))
(console.log (&& (< 2 4) (< 3 4]
(console.log (&& (< 2 4) (> 3 4]
  (try (throw 123)
  (catch ex (console.log ex]
`); // glob.runAll()
