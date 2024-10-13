const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const fs = require('fs');
const gulp = require('gulp');
const fonter = require('gulp-fonter-fix');
const ttf2woff2 = require('gulp-ttf2woff2');

const srcFolder = './src';
const destFolder = './docs';

gulp.task('ttfToFonts', () => {
	// Ищем файлы шрифтов .ttf в подпапках
	return (
		gulp
			.src(`${srcFolder}/assets/fonts/*/*.ttf`, {})
			// Конвертируем в .woff и .eot
			.pipe(
				fonter({
					formats: ['woff', 'eot'],
				})
			)
			// Выгружаем в папку с результатом
			.pipe(gulp.dest(`${destFolder}/assets/fonts/`))
			// Сохраняем оригинальные .ttf файлы
			.pipe(gulp.src(`${srcFolder}/assets/fonts/*/*.ttf`))
			.pipe(gulp.dest(`${destFolder}/assets/fonts/`)) // Копируем в build
			// Конвертируем в .woff2
			.pipe(ttf2woff2())
			// Выгружаем в папку с результатом
			.pipe(gulp.dest(`${destFolder}/assets/fonts/`))
			.pipe(
				plumber(
					notify.onError({
						title: 'FONTS',
						message: 'Error: <%= error.message %>',
					})
				)
			)
	);
});

gulp.task('fontsStyle', () => {
	let fontsFile = `${srcFolder}/scss/base/_fonts.scss`;
	// Проверяем существуют ли файлы шрифтов
	fs.readdir(`${destFolder}/assets/fonts/`, function(err, fontFolders) {
		if (fontFolders) {
			fs.writeFile(fontsFile, '', cb);
			let newFileOnly;
			fontFolders.forEach((folder) => {
				fs.readdir(`${destFolder}/assets/fonts/${folder}`, function(err, fontFiles) {
					if (fontFiles) {
						for (let i = 0; i < fontFiles.length; i++) {
							let fontFileName = fontFiles[i].split('.')[0];
							if (newFileOnly !== fontFileName) {
								let fontName = folder;

								// По умолчанию задаем нормальные значения
								let fontWeight = '400'; // normal
								let fontStyle = 'normal';

								// Определяем вес и стиль на основе имени файла
								if (fontFileName.includes('Thin')) {
									fontWeight = '100';
								} else if (fontFileName.includes('ExtraLight')) {
									fontWeight = '200';
								} else if (fontFileName.includes('Light')) {
									fontWeight = '300';
								} else if (fontFileName.includes('Regular')) {
									fontWeight = '400';
								} else if (fontFileName.includes('Medium')) {
									fontWeight = '500';
								} else if (fontFileName.includes('SemiBold')) {
									fontWeight = '600';
								} else if (fontFileName.includes('Bold')) {
									fontWeight = '700';
								} else if (fontFileName.includes('ExtraBold') || fontFileName.includes('Heavy')) {
									fontWeight = '800';
								} else if (fontFileName.includes('Black')) {
									fontWeight = '900';
								}

								// Определяем стиль
								if (fontFileName.includes('Italic')) {
									fontStyle = 'italic';
								}

								fs.appendFile(
									fontsFile,
									`@font-face {\n\tfont-family: '${fontName}';\n\tfont-display: swap;\n\tsrc: local('${fontName}'), url("../assets/fonts/${folder}/${fontFileName}.woff2") format("woff2"), url("../assets/fonts/${folder}/${fontFileName}.woff") format("woff"), url("../assets/fonts/${folder}/${fontFileName}.ttf") format("truetype"), url("../assets/fonts/${folder}/${fontFileName}.eot") format("embedded-opentype");\n\tfont-weight: ${fontWeight};\n\tfont-style: ${fontStyle};\n}\r\n`,
									cb
								);
								newFileOnly = fontFileName;
							}
						}
					}
				});
			});
		}
	});

	return gulp.src(`${srcFolder}`);
	function cb() {}
});

gulp.task('fontsDocs', gulp.series('ttfToFonts', 'fontsStyle'));
