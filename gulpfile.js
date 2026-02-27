// gulpプラグインの読み込み
const gulp = require("gulp");

// // style.scssをタスクを作成する
// gulp.task("default", () => {
//   return (
//     gulp
//       .src("src/**/*.mjs")
//       .pipe(gulp.dest("dest"))
//   );
// });

//var gulp = require('gulp');
const concat = require('gulp-concat');

var onlyProductionJS = [
  'src/**/*.js'
];

gulp.task('default', function(){
  return gulp.src(onlyProductionJS)
    .pipe(concat('index.mjs'))
    .pipe(gulp.dest('public/'));
});
