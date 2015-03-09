# angular-module-management
Always the developer to create module manifest files for angular modules that are automatically loaded into a (dev)
app and can used across different mini apps with a solution.

The process of creating a large angular app has many hard solutions to overcome.  One of the most problematic for me and the
short coming of single page applications is the developers strive to put everything into one HUGE SPA application.  I have
tried many approaches and now favour a more module approach to create web app.  To have isolated single page apps that
contain a small unit of functionality i.e. the core app, the administration etc.

To do this we often need to share code between these apps and with more traditional build tools the developer puts the
files into the main html file which are concatenated and uglified during the build.  Spread this across mini apps (more than
one html file) and you have lots of trouble managing js files!

So I have taken the approach during development of creating a module manifest json file which lists the files contained
in that module and dependencies.  I then reference these manifest files in my main html file and have a loader which loads
these manifest files parses them and load the correct js files.

A sample manifest file is below:

```javascript
{
  "name": "cache",
  "compiledFileHeader": "(function (angular, easilog) {",
  "compiledFileFooter": "}(angular, easilog));",
  "dependencies": {
    "js": [{
      "name": "angular-cache",
      "url": "../../../bower_components/angular-cache/dist/angular-cache.min.js",
      "compileIntoSource": true
    }],
    "css": []
  },
  "files": {
    "js": [
      "cache.module.js",
      "services/cacheService.js"
    ]
  }
}
```

Then in your html file you would have this to load the module.

```html
<script type="json/angular-module" location="../../js/modules/cdn.manifest.json"></script>
<script type="json/angular-module" location="../../js/modules/cache/cache.manifest.json"></script>
<script type="json/angular-module" location="../../js/modules/i18n/i18n.manifest.json"></script>
<script type="json/angular-module" location="../../js/modules/core/core.manifest.json"></script>
<script type="json/angular-module" location="../../js/modules/security/security.manifest.json"></script>
<script type="json/angular-module" location="../../apps/login/apps.login.manifest.json"></script>

<!-- This script loads the manifest and then loads the js files needed -->
<script src="../../js/module-loader/module-loader.js" load-remote-sources="false"></script>
```

There is a special type of manifest file called a CDN file which can list core dependencies that can be loaded outside
of your source i.e the angular source.  Your manifest can then reference just the name of the dependency rather than
having to have the path to the source.  This also has the added bonus of the module loader being able to load the local
or remote sources of libraries by changing the 'load-remote-sources' flag on the script tag to true.

Sample CDN manifest file:

```javascript
{
  "name": "cdn",
  "isCdnManifest": true,
  "files": {
    "angular": {
      "localUrl": "../../bower_components/angular/angular.js",
      "remoteUrl": "//ajax.googleapis.com/ajax/libs/angularjs/1.2.28/angular.min.js"
    },
    "angular-route":  {
      "localUrl": "../../bower_components/angular-route/angular-route.js",
      "remoteUrl": "//ajax.googleapis.com/ajax/libs/angularjs/1.2.28/angular-route.min.js"
    },
    "angular-animate":  {
      "localUrl": "../../bower_components/angular-animate/angular-animate.js",
      "remoteUrl": "//ajax.googleapis.com/ajax/libs/angularjs/1.2.28/angular-animate.min.js"
    },
    "angular-touch":  {
      "localUrl": "../../bower_components/angular-touch/angular-touch.js",
      "remoteUrl": "//ajax.googleapis.com/ajax/libs/angularjs/1.2.28/angular-touch.min.js"
    },
    "font-awesome": {
      "localUrl": "",
      "remoteUrl": "//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css"
    },
    "velocity": {
      "localUrl": "../../bower_components/velocity/velocity.min.js",
      "remoteUrl": "//cdn.jsdelivr.net/velocity/1.2.2/velocity.min.js"
    }
  }
}
```

Sample manifest file that references a CDN manifest resource:

```javascript
{
  "name": "core",
  "compiledFileHeader": "(function (window) {",
  "compiledFileFooter": "}(window));",
  "dependencies": {
    "js": [
      {
        "name": "angular",
        "cdn": true
      },
      {
        "name": "angular-hint",
        "url": "../../../node_modules/angular-hint/dist/hint.js",
        "devOnly": true,
        "include": false
      },
      {
        "name": "angular-route",
        "cdn": true
      },
      {
        "name": "angular-animate",
        "cdn": true
      },
      {
        "name": "angular-touch",
        "cdn": true
      }
    ],
    "css": [
      {
        "name": "font-awesome",
        "cdn": true
      }
    ]
  },
  "files": {
    "js": [
      "core.js",

      "polyfills/String.js",
      "polyfills/Array.js",
      "polyfills/Boolean.js",
      "polyfills/Date.js"
    ]
  }
}
```

I've also added a gulp task which can compile a manifest file into a single js file during your build process.  Usage:

```javascript
var gulp             = require('gulp'),
    easilog          = require('./easilog'),
    rev              = require('gulp-rev'),
    uglify           = require('gulp-uglify'),
    rename           = require('gulp-rename'),
    compile          = require('../node_modules/angular-module-management/src/angular-module-management-compiler-gulp-task');

gulp.task('compile-modules', function() {
  return gulp.src(['js/**/*.manifest.json', 'apps/**/*.manifest.json', '!js/**/cdn.manifest.json'])
    .pipe(compile())
    .pipe(gulp.dest('./dist/assets/js/'))
    .pipe(uglify())
    .pipe(rev())
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(gulp.dest('./dist/assets/js/'))
    .pipe(rev.manifest())
    .pipe(gulp.dest('./dist/assets/js/'));
});
```

##Install the module

bower install --save-dev "git://github.com/jonsamwell/angular-module-management.git#master"

Let me know if you need anymore info!  I doubt anyone is going to use this anyway so this is more for my reference in
6 months!

This is still work in progess