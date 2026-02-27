const gulp = require("gulp");
const concat = require('gulp-concat');

var onlyProductionJS = [
  'src/**/*.js'
];

gulp.task('default', function(){
  return gulp.src(onlyProductionJS)
    .pipe(concat('all.js'))
    .pipe(gulp.dest('public/'));
});
