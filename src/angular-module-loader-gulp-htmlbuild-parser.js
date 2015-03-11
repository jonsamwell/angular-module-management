var gutil = require('gulp-util');
var fs = require('fs');
var PluginError = gutil.PluginError;

// Consts
const PLUGIN_NAME = 'gulp-angular-module-loader-htmlbuild-parser';

function gulpAngularModuleLoaderHtmlBuildParser(options) {
  var cdnInformation = JSON.parse(fs.readFileSync(options.cdnPath, {encoding: 'UTF8'})),
      revManifest = JSON.parse(fs.readFileSync(options.revManifestPath, {encoding: 'UTF8'}));

  return function (block) {
    var manifestFilePaths = [],
        stylesheets = [],
        scripts = [],
        stylesheetBlockString = '',
        scriptBlockString = '';

    function addStyle(url) {
      if (stylesheets.indexOf(url) === -1) {
        stylesheets.push(url);
      }
    }

    function addScript(url) {
      if (scripts.indexOf(url) === -1) {
        scripts.push(url);
      }
    }

    function discoverDependencies(dependencies, isScript) {
      if (dependencies !== undefined && dependencies.length > 0) {
        dependencies.forEach(function (dependency) {
          // if not cdn it is probably compiled into the module source
          if (dependency.cdn === true) {
            var url = cdnInformation.files[dependency.name].remoteUrl;
            if (isScript) {
              addScript(url);
            } else {
              addStyle(url);
            }
          } else if (isScript === false) {
            var revedFileName = searchForRevedFileName(dependency.name);
            addStyle(options.cssAssetsPath + revedFileName);
          }
        });
      }
    }

    function findRevedFileName(moduleName, extension) {
      var fileName = moduleName + (extension || '.js');
      if (revManifest) {
        fileName = revManifest[fileName];
        if (fileName === undefined) {
          throw new PluginError('gulp-html:angular-module', 'Cannot reved manifest file for module: ' + moduleName);
        }
      }

      return fileName;
    }

    /**
     * The rev filename passed in is searched for by a contains method
     * in the core rev file.
     * @param moduleName
     * @returns {string}
     */
    function searchForRevedFileName(moduleName) {
      var revedFileName;
      if (revManifest) {
        for (var key in revManifest) {
          if (key.indexOf(moduleName) > -1) {
            revedFileName = revManifest[key];
          }
        }
      }

      if (!revedFileName) {
        throw new PluginError('gulp-html:angular-module', 'Search did not find reved manifest file for module: ' + fileName);
      }

      return revedFileName;
    }

    block._lines.forEach(function (line) {
      var srcPath;
      if (line.indexOf('script type="json/angular-module" location=') > -1 && line.indexOf('dev-only') === -1) {
        srcPath = line.match(/location="(.*)"/)[1];
        if (srcPath) {
          srcPath = srcPath.replace(/\..\//g, '');
          manifestFilePaths.push(srcPath);
        } else {
          throw new PluginError('gulp-html:angular-module', 'Cannot finds location for include file: ' + line);
        }
      }
    });

    manifestFilePaths.forEach(function (filePath) {
      try {
        var manifest = JSON.parse(fs.readFileSync(filePath, {encoding: 'UTF8'}));
        if (manifest.isCdnManifest !== true) {
          var revedFileName = findRevedFileName(manifest.name);
          discoverDependencies(manifest.dependencies.css, false);
          discoverDependencies(manifest.dependencies.js, true);
          addScript(options.jsAssetsPath + revedFileName);
        }
      } catch (e) {
        throw new PluginError('gulp-html:angular-module', 'Cannot finds manifest file: ' + filePath + e);
      }
    });

    stylesheets.forEach(function (stylePath) {
      stylesheetBlockString += '<link rel="stylesheet" type="text/css" href="{0}"/>\r\n'.replace('{0}', stylePath);
    });

    scripts.forEach(function (scriptPath) {
      scriptBlockString += '<script src="{0}"></script>\r\n'.replace('{0}', scriptPath);
    });

    stylesheetBlockString = stylesheetBlockString || '';
    scriptBlockString = scriptBlockString || '';
    block.end(stylesheetBlockString + scriptBlockString);
  };
}

// Exporting the plugin main function
module.exports = gulpAngularModuleLoaderHtmlBuildParser;