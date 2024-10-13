const gulp = require('gulp');
const pug = require('gulp-pug');
const sass = require('gulp-sass')(require('sass'));
const sassGlob = require('gulp-sass-glob');
const server = require('gulp-server-livereload');
const clean = require('gulp-clean');
const fs = require('fs');
const sourceMaps = require('gulp-sourcemaps');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const webpack = require('webpack-stream');
const imagemin = require('gulp-imagemin');
const changed = require('gulp-changed');
const typograf = require('gulp-typograf');
const svgsprite = require('gulp-svg-sprite');
const webpHTML = require('gulp-webp-retina-html');
const imageminWebp = require('imagemin-webp');
const rename = require('gulp-rename');
const prettier = require('@bdchauvette/gulp-prettier');
const filter = require('gulp-filter');

gulp.task('clean:dev', function(done) {
	if (fs.existsSync('./build/')) {
		return gulp.src('./build/', { read: false }).pipe(clean({ force: true }));
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

gulp.task('pug:dev', function() {
	return gulp
		.src(['./src/pug/pages/*.pug'])
		.pipe(changed('./build/', { hasChanged: changed.compareContents }))
		.pipe(plumber(plumberNotify('Pug')))
		.pipe(
			pug({
				pretty: true,
			})
		)
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
		.pipe(
			prettier({
				tabWidth: 4,
				useTabs: true,
				printWidth: 182,
				trailingComma: 'es5',
				bracketSpacing: false,
			})
		)
		.pipe(gulp.dest('./build/'));
});

gulp.task('sass:dev', function() {
	return gulp
		.src('./src/scss/*.scss')
		.pipe(changed('./build/css/'))
		.pipe(plumber(plumberNotify('SCSS')))
		.pipe(sourceMaps.init())
		.pipe(sassGlob())
		.pipe(sass())
		.pipe(sourceMaps.write())
		.pipe(gulp.dest('./build/css/'));
});

gulp.task('images:dev', function () {
	const imageFilter = filter(['**/*.{jpg,jpeg,png,gif,svg}'], { restore: true });

	return gulp
		.src(['./src/assets/images/**/*', '!./src/assets/images/svgicons/**/*'])
		.pipe(changed('./build/assets/images/'))
		.pipe(imageFilter)
		.pipe(
			imagemin([
				imageminWebp({
					quality: 85,
				}),
			])
		)
		.pipe(rename({ extname: '.webp' }))
		.pipe(gulp.dest('./build/assets/images/'))
		.pipe(gulp.src(['./src/assets/images/**/*', '!./src/assets/images/svgicons/**/*']))
		.pipe(changed('./build/assets/images/'))
		.pipe(gulp.dest('./build/assets/images/'));
});

const svgStack = {
	mode: {
		stack: {
			example: true,
		},
	},
	shape: {
		transform: [
			{
				svgo: {
					js2svg: { indent: 4, pretty: true },
				},
			},
		],
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
					js2svg: { indent: 4, pretty: true },
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

gulp.task('svgStack:dev', function() {
	return gulp
		.src('./src/assets/images/svgicons/**/*.svg')
		.pipe(plumber(plumberNotify('SVG')))
		.pipe(svgsprite(svgStack))
		.pipe(gulp.dest('./build/assets/images/svgsprite/'));
});

gulp.task('svgSymbol:dev', function() {
	return gulp
		.src('./src/assets/images/svgicons/**/*.svg')
		.pipe(plumber(plumberNotify('SVG')))
		.pipe(svgsprite(svgSymbol))
		.pipe(gulp.dest('./build/assets/images/svgsprite/'));
});

gulp.task('files:dev', function() {
	return gulp
		.src('./src/files/**/*')
		.pipe(changed('./build/files/'))
		.pipe(gulp.dest('./build/files/'));
});

gulp.task('js:dev', function() {
	return gulp
		.src('./src/js/*.js')
		.pipe(changed('./build/js/'))
		.pipe(plumber(plumberNotify('JS')))
		.pipe(webpack(require('./../webpack.config.js')))
		.pipe(gulp.dest('./build/js/'));
});

const serverOptions = {
	livereload: true,
	open: true,
};

gulp.task('server:dev', function() {
	return gulp.src('./build/').pipe(server(serverOptions));
});

gulp.task('watch:dev', function() {
	gulp.watch('./src/scss/**/*.scss', gulp.parallel('sass:dev'));
	gulp.watch(['./src/pug/**/*.pug'], gulp.parallel('pug:dev'));
	gulp.watch('./src/assets/images/**/*', gulp.parallel('images:dev'));
	gulp.watch('./src/files/**/*', gulp.parallel('files:dev'));
	gulp.watch('./src/js/**/*.js', gulp.parallel('js:dev'));
	gulp.watch('./src/assets/images/svgicons/*', gulp.series('svgStack:dev', 'svgSymbol:dev'));
});
