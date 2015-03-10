var gulp = require('gulp');
var through = require('through2');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var path = require('path');
var concat = require('gulp-concat');
var header = require('gulp-header');
var footer = require('gulp-footer');
var minifyHtml = require('gulp-minify-html');
var ngTemplateCache = require('gulp-angular-templatecache');
var streamqueue = require('streamqueue');

// Consts
const PLUGIN_NAME = 'gulp-angular-module-loader-compiler';

function gulpAngularModuleLoaderCompiler() {
  return through.obj(function(file, enc, cb) {
    var json;

    if (file.isNull()) {
      // return empty file
      cb(null, file);
    }

    json = JSON.parse(file.contents);
    gutil.log(gutil.colors.green('Processing manifest module file:'), gutil.colors.cyan(json.name));

    var allFiles = [];
    json.dependencies.js.forEach(function (dependency) {
      if (dependency.compileIntoSource === true) {
        allFiles.push(dependency.url);
      }
    });

    allFiles.push.apply(allFiles, json.files.js);

    var streamqueueFn = [
      {objectMode: true},
      gulp.src(allFiles, {cwd: path.dirname(file.path)})
    ];

    if (json.files.html !== undefined && json.files.js.length > 0) {
      streamqueueFn.push(gulp.src(json.files.html, {cwd: path.dirname(file.path)})
        .pipe(minifyHtml({
          conditionals: true,
          empty: true
        }))
        .pipe(ngTemplateCache('templates.js', {
          module: json.ngTemplatesModuleName,
          base: function(templateFile) {
            var path = templateFile.relative;
            //console.log('Orginal template path: ' + path);
            path = path.replace(/\\/g, '/');
            //console.log('Modified template path: ' + path);
            return path;
          }
        })));
    }

    return streamqueue.apply(streamqueue, streamqueueFn)
      .pipe(concat(json.name + '.js'))
      .pipe(gulpif(json.compiledFileHeader !== undefined, header(json.compiledFileHeader)))
      .pipe(gulpif(json.compiledFileFooter !== undefined, footer(json.compiledFileFooter)))
      .pipe(gutil.buffer(function(err, files) {
        cb(null, files[0]);
      }));
  });
}

// Exporting the plugin main function
module.exports = gulpAngularModuleLoaderCompiler;