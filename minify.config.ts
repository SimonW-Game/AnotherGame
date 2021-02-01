import minify = require('minify');
import fs = require('fs');

export function minifyClient() {
	const distDir = __dirname + '/dist/';
	const cssDir = __dirname + '/dist/css/';
	const jsDir = __dirname + '/dist/scripts/';
	const baseViewsDir = __dirname + '/dist/views/';
	const appDir = __dirname + '/dist/app/';
	const viewsDir = __dirname + '/dist/app/views/';
	const imagesDir = __dirname + '/dist/images/';
	const fontsDir = __dirname + '/dist/webfonts/';
	let makeDirs = [distDir, cssDir, jsDir, baseViewsDir, appDir, viewsDir, imagesDir, fontsDir];
	makeDirs.forEach(dir => fs.mkdir(dir, function (err) { if (err) console.log(err); }));
	minifyFiles(cssDir, "css", "all.css", "style/");
	minifyFiles(cssDir, "css", "rules.css", "style/rules/rules.css", "style/fa.css");
	minifyFiles(jsDir, "js", "all.js", '', 'app/', 'app/scripts/');
	copyDir(__dirname + '/client/images/', imagesDir);
	copyDir(__dirname + '/client/app/views/', viewsDir);
	copyDir(__dirname + '/client/views/', baseViewsDir);
	copyDir(__dirname + '/client/webfonts/', fontsDir);
}

function minifyFiles(distDir: string, extension: string, outputFileName: string, ...folders: string[]) {
	try {
		let promises = [];
		folders.forEach(folder => {
			const baseFolder = __dirname + '/client/' + folder;
			let allFiles = folder.endsWith(extension) ? [baseFolder] : fs.readdirSync(baseFolder);
			allFiles.forEach(fileName => {
				if (fileName.endsWith(extension)) {
					let fullPath = baseFolder == fileName ? fileName : baseFolder + fileName;
					promises.push(minify(fullPath, { js: { keep_fnames: true, mangle: false, keep_classnames: true } }));
				}
			});
		});
		Promise.all(promises).then((allData: string[]) => {
			let allCode = "";
			allData.forEach((data: string) => {
				allCode += data;
			});
			fs.writeFile(distDir + outputFileName, allCode, (err) => { if (err) console.log("couldn't minify " + extension, err); });
		}).catch(reason => {
			console.log(reason);
		});
	} catch (e) {
		console.log(e);
	}
}
function copyDir(srcDir: string, destDir: string) {
	fs.readdir(srcDir, (e, files) => {
		files.forEach(fileName => {
			fs.copyFile(srcDir + fileName, destDir + fileName, (err) => { if (err) console.log(err); });
		});
	});
}