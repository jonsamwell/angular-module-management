// jscs:disable disallowMultipleVarDecl
/* jshint ignore:start */
(function(Array) {
  'use strict';

  /**
   * MDN Polyfill - See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
   */
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(searchElement, fromIndex) {
      var k;

      // 1. Let O be the result of calling ToObject passing
      //    the this value as the argument.
      if (this === undefined || this === null) {
        throw new TypeError('"this" is null or not defined');
      }

      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get
      //    internal method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0;

      // 4. If len is 0, return -1.
      if (len === 0) {
        return -1;
      }

      // 5. If argument fromIndex was passed let n be
      //    ToInteger(fromIndex); else let n be 0.
      var n = +fromIndex || 0;

      if (Math.abs(n) === Infinity) {
        n = 0;
      }

      // 6. If n >= len, return -1.
      if (n >= len) {
        return -1;
      }

      // 7. If n >= 0, then Let k be n.
      // 8. Else, n<0, Let k be len - abs(n).
      //    If k is less than 0, then let k be 0.
      k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

      // 9. Repeat, while k < len
      while (k < len) {
        var kValue;
        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the
        //    HasProperty internal method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        //    i.  Let elementK be the result of calling the Get
        //        internal method of O with the argument ToString(k).
        //   ii.  Let same be the result of applying the
        //        Strict Equality Comparison Algorithm to
        //        searchElement and elementK.
        //  iii.  If same is true, return k.
        if (k in O && O[k] === searchElement) {
          return k;
        }
        k++;
      }
      return -1;
    };
  }
}(Array));
/* jshint ignore:end */

(function(document, window) {
  'use strict';

  var SCRIPT_TYPE = 'json/angular-module',
      LOAD_REMOTE_SOURCES = 'load-remote-sources',
      LOCATION = 'location',
      GET = 'GET',
      JS = 'js',
      CSS = 'css';

  function Asset(data, type) {
    function loadScript(url, loadedCallback) {
      // see this clever chap http://unixpapa.com/js/dyna.html
      var el = document.createElement('script');
      el.type = 'text/javascript';
      el.onreadystatechange = function() {
        if (this.readyState === 'complete' || this.readyState === 'loaded') {
          loadedCallback();
        }
      };
      el.onload = loadedCallback;

      el.setAttribute('src', url);
      document.body.appendChild(el);
    }

    function loadStyle(url) {
      var el = document.createElement('link');
      el.rel = 'stylesheet';
      el.setAttribute('href', url);
      document.getElementsByTagName('head')[0].appendChild(el);
    }

    function getUrl(useRemoteUrl) {
      var url = data.baseUrl === '' ? data.url : data.baseUrl + '/' + data.url;
      if (data.cdn) {
        url = useRemoteUrl ? data.urls.remoteUrl : data.urls.localUrl;
      }

      return url;
    }

    function loadFn(useRemoteUrl, callback) {
      var url = getUrl(useRemoteUrl);

      if (type === JS) {
        loadScript(url, callback);
      } else {
        loadStyle(url);
      }
    }

    return {
      load: loadFn,
      name: data.name,
      url: data.url
    };
  }

  function CdnInformation(data) {
    function getCdnInformationFn(name) {
      var fileInfo,
          info;

      if (data[name]) {
        fileInfo = data[name];
        info = {
          name: name,
          localUrl: fileInfo.localUrl,
          remoteUrl: fileInfo.remoteUrl
        };
      } else {
        throw Error('Cannot find cdn information for dependency: ' + name);
      }

      return info;
    }

    return {
      get: getCdnInformationFn
    };
  }

  function Manifest(data, cdnInformation) {
    var self = this;

    //if (data === undefined) {
    //  alert(data);
    //}

    self.name = data.name;
    self.isCdnManifest = data.isCdnManifest;
    self.dependencies = {
      js: [],
      css: []
    };
    self.files = {
      js: [],
      css: []
    };

    function getCdnAssetInformation(name) {
      return cdnInformation.get(name);
    }

    function parseDependencies(js, css) {
      var i,
          fileInfo;

      if (js) {
        for (i = 0; i < js.length; i += 1) {
          fileInfo = js[i];
          if (fileInfo.include === undefined || fileInfo.include === true) {
            fileInfo.baseUrl = data.baseUrl;
            if (fileInfo.cdn) {
              fileInfo.urls = getCdnAssetInformation(fileInfo.name);
            }

            self.dependencies.js.push(new Asset(fileInfo, JS));
          }
        }
      }

      if (css) {
        for (i = 0; i < css.length; i += 1) {
          fileInfo = css[i];
          fileInfo.baseUrl = data.baseUrl;
          if (fileInfo.cdn) {
            fileInfo.urls = getCdnAssetInformation(fileInfo.name);
          }

          self.dependencies.css.push(new Asset(fileInfo, CSS));
        }
      }
    }

    function parseFiles(js, css) {
      var i,
          fileInfo;

      if (js) {
        for (i = 0; i < js.length; i += 1) {
          fileInfo = {
            name: js[i],
            url: js[i]
          };
          fileInfo.baseUrl = data.baseUrl;
          self.files.js.push(new Asset(fileInfo, JS));
        }
      }

      if (css) {
        for (i = 0; i < css.length; i += 1) {
          fileInfo = {
            name: css[i],
            url: css[i]
          };
          fileInfo.baseUrl = data.baseUrl;
          self.files.css.push(new Asset(fileInfo, CSS));
        }
      }
    }

    parseDependencies(data.dependencies ? data.dependencies.js : undefined, data.dependencies ? data.dependencies.css : undefined);
    parseFiles(data.files ? data.files.js : undefined, data.files ? data.files.css : undefined);
  }

  function AjaxRequest() {
    function createXHR() {
      var xhr;
      if (window.ActiveXObject) {
        try {
          xhr = new window.ActiveXObject('Microsoft.XMLHTTP');
        }
        catch (e) {
          window.alert(e.message);
          xhr = null;
        }
      }
      else {
        xhr = new window.XMLHttpRequest();
      }

      return xhr;
    }

    function send(options) {
      var xhr = createXHR();
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          options.callback(xhr.responseText);
        }
      };

      xhr.open(options.method, options.url, true);
      xhr.send();
    }

    return {
      send: send
    };
  }

  function getAllModuleManifestFiles(document) {
    var scriptElements = document.querySelectorAll('script'),
        urls = [],
        loadRemoteSources = false,
        scriptElement,
        i;

    for (i = 0; i < scriptElements.length; i += 1) {
      scriptElement = scriptElements[i];
      if (scriptElement.type === SCRIPT_TYPE) {
        if (scriptElement.attributes[LOCATION]) {
          urls.push(scriptElement.attributes[LOCATION].value);
        } else {
          throw Error('json/angular-modules script tags must have a location attribute with the json urls in');
        }
      } else if (scriptElement.attributes[LOAD_REMOTE_SOURCES] !== undefined) {
        loadRemoteSources = scriptElement.attributes[LOAD_REMOTE_SOURCES].value.toLowerCase() === true;
      }
    }

    return {
      urls: urls,
      loadRemoteSources: loadRemoteSources
    };
  }

  function loadModuleFile(url, order, callback) {
    var request = new AjaxRequest();
    request.send({
      method: GET,
      url: url,
      callback: function(data) {
        var manifest;
        try {
          manifest = window.JSON.parse(data);
        } catch (e) {
          throw new Error('Unable to parse module manifest file: ' + url);
        }

        manifest.baseUrl = url.split('/');
        manifest.baseUrl.pop();
        manifest.baseUrl = manifest.baseUrl.join('/');
        callback(manifest, order);
      }
    });
  }

  function loadAllManifestFiles(context, callback) {
    var i,
        url,
        manifests = [],
        loadCompleteFn = function(data, order) {
          manifests[order] = data;
          if (manifests.length >= context.urls.length) {
            callback(manifests, context.loadRemoteSources);
          }
        };

    for (i = 0; i < context.urls.length; i += 1) {
      url = context.urls[i];
      loadModuleFile(url, i, loadCompleteFn);
    }
  }

  function parseManifests(manifestsJson) {
    var manifests = [],
        cdnManifest,
        i;

    for (i = 0; i < manifestsJson.length; i += 1) {
      if (manifestsJson[i].isCdnManifest) {
        cdnManifest = new CdnInformation(manifestsJson[i].files);
        break;
      }
    }

    for (i = 0; i < manifestsJson.length; i += 1) {
      manifests.push(new Manifest(manifestsJson[i], cdnManifest));
      //console.log('***Parsed manifest file: ' + manifestsJson[i].name);
    }

    return manifests;
  }

  function loadDependencies(manifests, loadRemoteSources) {
    var i,
        j,
        manifest,
        style,
        scripts = [],
        loadedStyles = [],
        loadedScripts = [];

    for (i = 0; i < manifests.length; i += 1) {
      manifest = manifests[i];
      if (manifest.dependencies.css.length > 0) {
        for (j = 0; j < manifest.dependencies.css.length; j += 1) {
          style = manifest.dependencies.css[j];
          if (loadedStyles.indexOf(style.name)) {
            loadedStyles.push(style.name);
            style.load(loadRemoteSources);
          }
        }
      }
    }

    for (i = 0; i < manifests.length; i += 1) {
      manifest = manifests[i];
      if (manifest.dependencies.js.length > 0) {
        for (j = 0; j < manifest.dependencies.js.length; j += 1) {
          scripts.push(manifest.dependencies.js[j]);
        }
      }

      if (manifest.files.js.length > 0) {
        for (j = 0; j < manifest.files.js.length; j += 1) {
          scripts.push(manifest.files.js[j]);
        }
      }
    }

    function loadFn(files, index) {
      if (index < files.length) {
        var file = files[index];
        if (loadedScripts.indexOf(file.name)) {
          loadedScripts.push(file.name);
          //console.log('Loading script: ' + file.name);
          file.load(loadRemoteSources, function() {
            loadFn(files, index + 1);
          });
        } else {
          loadFn(files, index + 1);
        }
      }
    }

    loadFn(scripts, 0);
  }

  loadAllManifestFiles(getAllModuleManifestFiles(document), function(data, loadRemoteSources) {
    var manifests = parseManifests(data);
    loadDependencies(manifests, loadRemoteSources);
  });
}(document, window));
