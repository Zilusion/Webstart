const gulp = require('gulp');
const pug = require('gulp-pug');

// HTML
const htmlclean = require('gulp-htmlclean');
const webpHTML = require('gulp-webp-retina-html');
const typograf = require('gulp-typograf');

// SASS
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const autoprefixer = require('gulp-autoprefixer');
const csso = require('gulp-csso');

const server = require('gulp-server-livereload');
const clean = require('gulp-clean');
const fs = require('fs');
const sourceMaps = require('gulp-sourcemaps');
const groupMedia = require('gulp-group-css-media-queries');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const webpack = require('webpack-stream');
const babel = require('gulp-babel');
const changed = require('gulp-changed');
const filter = require('gulp-filter');

// Images
const imagemin = require('gulp-imagemin');
const imageminWebp = require('imagemin-webp');
const rename = require('gulp-rename');

// SVG
const svgsprite = require('gulp-svg-sprite');

gulp.task('clean:docs', function(done) {
	if (fs.existsSync('./docs/')) {
		return gulp.src('./docs/', { read: false }).pipe(clean({ force: true }));
	}
	done();
});

const plumberNotify = (title) => {
	return {
		errorHandler: notify.onError({
			title: title,
			message: 'Error <%= error.message %>',
			sound: false,
		}),
	};
};

gulp.task('pug:docs', function() {
	return gulp
		.src(['./src/pug/pages/*.pug'])
		.pipe(changed('./docs/', { extension: '.html' }))
		.pipe(plumber(plumberNotify('Pug')))
		.pipe(pug({ pretty: true }))
		.pipe(
			typograf({
				locale: ['ru', 'en-US'],
				htmlEntity: { type: 'digit' },
				safeTags: [
					['<\\?php', '\\?>'],
					['<no-typography>', '</no-typography>'],
				],
			})
		)
		.pipe(
			webpHTML({
				extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
				retina: {
					1: '',
					2: '@2x',
				},
			})
		)
		.pipe(htmlclean())
		.pipe(gulp.dest('./docs/'));
});

gulp.task('sass:docs', function() {
	return gulp
		.src('./src/scss/*.scss')
		.pipe(changed('./docs/css/'))
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sourceMaps.init())
		.pipe(sassGlob())
		.pipe(sass())
		.pipe(autoprefixer())
		.pipe(groupMedia())
		.pipe(csso())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest('./docs/css/'));
});

gulp.task('images:docs', function () {
	const imageFilter = filter(['**/*.{jpg,jpeg,png,gif,svg}'], { restore: true });

	return gulp
		.src(['./src/assets/images/**/*', '!./src/assets/images/svgicons/**/*'])
		.pipe(changed('./docs/assets/images/'))
		.pipe(imageFilter)
		.pipe(
			imagemin([
				imageminWebp({
					quality: 85,
				}),
			])
		)
		.pipe(rename({ extname: '.webp' }))
		.pipe(gulp.dest('./docs/assets/images/'))
		.pipe(gulp.src('./src/assets/images/**/*'))
		.pipe(changed('./docs/assets/images/'))
		.pipe(
			imagemin(
				[
					imagemin.gifsicle({ interlaced: true }),
					imagemin.mozjpeg({ quality: 85, progressive: true }),
					imagemin.optipng({ optimizationLevel: 5 }),
				],
				{ verbose: true }
			)
		)
		.pipe(gulp.dest('./docs/assets/images/'));
});

const svgStack = {
	mode: {
		stack: {
			example: true,
		},
	},
};

const svgSymbol = {
	mode: {
		symbol: {
			sprite: '../sprite.symbol.svg',
		},
	},
	shape: {
		transform: [
			{
				svgo: {
					plugins: [
						{
							name: 'removeAttrs',
							params: {
								attrs: '(fill|stroke)',
							},
						},
					],
				},
			},
		],
	},
};

gulp.task('svgStack:docs', function() {
	return gulp
		.src('./src/assets/images/svgicons/**/*.svg')
		.pipe(plumber(plumberNotify('SVG')))
		.pipe(svgsprite(svgStack))
		.pipe(gulp.dest('./docs/assets/images/svgsprite/'));
});

gulp.task('svgSymbol:docs', function() {
	return gulp
		.src('./src/assets/images/svgicons/**/*.svg')
		.pipe(plumber(plumberNotify('SVG')))
		.pipe(svgsprite(svgSymbol))
		.pipe(gulp.dest('./docs/assets/images/svgsprite/'));
});

gulp.task('files:docs', function() {
	return gulp
		.src('./src/files/**/*')
		.pipe(changed('./docs/files/'))
		.pipe(gulp.dest('./docs/files/'));
});

gulp.task('js:docs', function() {
	return gulp
		.src('./src/js/*.js')
		.pipe(changed('./docs/js/'))
		.pipe(plumber(plumberNotify('JS')))
		.pipe(babel())
		.pipe(webpack(require('./../webpack.config.js')))
		.pipe(gulp.dest('./docs/js/'));
});

const serverOptions = {
	livereload: true,
	open: true,
};

gulp.task('server:docs', function() {
	return gulp.src('./docs/').pipe(server(serverOptions));
});
