let  	 fileswatch   = 'html,htm,txt,json,md,woff2' // List of files extensions for watching & hard reload

import pkg from 'gulp'
const { gulp, src, dest, parallel, series, watch } = pkg

import browserSync   from 'browser-sync'
import htmlmin       from 'gulp-htmlmin'
import webpackStream from 'webpack-stream'
import webpack       from 'webpack'
import TerserPlugin  from 'terser-webpack-plugin'
import gulpSass      from 'gulp-sass'
import dartSass      from 'sass'
import sassglob      from 'gulp-sass-glob'
const  sass          = gulpSass(dartSass)
import postCss       from 'gulp-postcss'
import cssnano       from 'cssnano'
import autoprefixer  from 'autoprefixer'
import imagemin      from 'gulp-imagemin'
import changed       from 'gulp-changed'
import concat        from 'gulp-concat'
import del           from 'del'

export const browsersync = () => {
	browserSync.init({
		server: {
			baseDir: 'dist',
		},
		notify: false,
		online: true,
	})
}

export const scripts = () => {
	return src(['app/js/*.js', '!app/js/*.min.js'])
		.pipe(webpackStream({
			mode: 'production',
			performance: { hints: false },
			plugins: [
				new webpack.ProvidePlugin({ $: 'jquery', jQuery: 'jquery', 'window.jQuery': 'jquery' }), // jQuery (npm i jquery)
			],
			module: {
				rules: [
					{
						test: /\.m?js$/,
						exclude: /(node_modules)/,
						use: {
							loader: 'babel-loader',
							options: {
								presets: ['@babel/preset-env'],
								plugins: ['babel-plugin-root-import']
							}
						}
					}
				]
			},
			optimization: {
				minimize: true,
				minimizer: [
					new TerserPlugin({
						terserOptions: { format: { comments: false } },
						extractComments: false
					})
				]
			},
		}, webpack)).on('error', function handleError() {
			this.emit('end')
		})
		.pipe(concat('app.min.js'))
		.pipe(dest('dist/js'))
		.pipe(browserSync.stream())
}

export const styles = () => {
	return src([`app/scss/*.*`, `!app/scss/_*.*`])
		.pipe(eval(`sassglob`)())
		.pipe(eval(sass)({ 'include css': true }))
		.pipe(postCss([
			autoprefixer({ grid: 'autoplace' }),
			cssnano({ preset: ['default', { discardComments: { removeAll: true } }] })
		]))
		.pipe(concat('app.min.css'))
		.pipe(dest('dist/css'))
		.pipe(browserSync.stream())
}

export const html = () => {
  return src('app/index.html')
    .pipe(htmlmin({ 
			collapseWhitespace: true, 
			removeComments: true, }))
    .pipe(dest('dist'))
		.pipe(browserSync.stream())
}

export const images = () => {
	return src(['app/images/**/*'])
		.pipe(changed('app/images/dist'))
		.pipe(imagemin())
		.pipe(dest('dist/images'))
		.pipe(browserSync.stream())
}

async function cleandist() {
	del('dist/**/*', { force: true })
}

export const buildcopy = () => {
	return src([
		'{app/js, app/css}/*.min.*',
		'app/images/**/*.*',
		'!app/images/**/*',
		'app/fonts/**/*'
	], { base: 'app/' })
	.pipe(dest('dist'))
}

export const fonts = () => {
	return src(['app/fonts/**/*'])
	.pipe(dest('dist/fonts'))
}

export const startwatch = () => {
	watch(`app/scss/**/*`, { usePolling: true }, styles)
	watch(['app/js/**/*.js', '!app/js/**/*.min.js'], { usePolling: true }, scripts)
	watch(`app/**/*.html`, { usePolling: true }, html)
	watch('app/images/**/*', { usePolling: true }, images)
	watch('app/fonts/**/*', { usePolling: true }, fonts)
	watch(`app/**/*.{${fileswatch}}`, { usePolling: true }).on('change', browserSync.reload)
}

// export { scripts, styles, images, html }
export let assets = series(scripts, styles, html, images, fonts)
export let build = series(cleandist, images, scripts, styles, fonts, html, buildcopy)
export default series(scripts, styles, html, images, fonts, parallel(browsersync, startwatch))
