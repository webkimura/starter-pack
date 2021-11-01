import pkg from 'gulp'
const { src, dest, watch, parallel, series } = pkg;

const  sass         = gulpSass(dartSass);
import gulpSass     from 'gulp-sass'
import dartSass     from 'sass'
import concat       from 'gulp-concat';
import sync         from 'browser-sync';
import autoprefixer from 'autoprefixer';
import imagemin     from 'gulp-imagemin';
import postcss      from 'gulp-postcss';
import cssnano      from 'cssnano';
import sassglob     from 'gulp-sass-glob';
import babel        from 'gulp-babel';
import terser       from 'gulp-terser';
import del          from 'del'


export const serve = () => {
  sync.init({
    server: {
      baseDir: 'app/'
    }
  })
}

export const cleandist = () => {
  return del('dist')
}

export const styles = () => {
  return src(['app/scss/**/*.scss', '!app/scss/**/_*.scss'])
  .pipe(eval(sassglob)())
  .pipe(eval(sass)({ 'include css': true }))
  .pipe(postcss([
    autoprefixer({ grid: 'autoplace' }),
    cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
  ]))
  .pipe(concat('app.min.css'))
	.pipe(dest('app/css'))
	.pipe(sync.stream())

}

export const scripts = () => {
  return src([
    // 'app/libs/jquery/dist/jquery.js',
    'app/js/app.js'
  ])
      .pipe(babel({
          presets: ['@babel/preset-env']
      }))
      .pipe(concat('app.min.js'))
      .pipe(terser())
      .pipe(dest('app/js'))
      .pipe(sync.stream());
};

export const images = () => {
	return src(['app/images/**/*'])
		.pipe(imagemin())
		.pipe(dest('dist/images'))
}

export const buildcopy = () => {
	return src([
		'{app/js,app/css}/*.min.*',
		'app/fonts/**/*',
    'app/*.html'
	], { base: 'app/' })
	.pipe(dest('dist'))
}

export const startwatch = () => {
	watch('app/scss/**/*.scss', styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], scripts)
	watch('app/**/*.html').on('change', sync.reload)
}

// export { scripts, styles, images, serve, startwatch };
export let build = series(cleandist, images, scripts, styles, buildcopy);
export default  series(scripts, styles, parallel(serve, startwatch))