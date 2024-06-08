(function (window) {

    var Herogi = function (devMode = true) {

        var inited = false;
        var APPID = null;
        var APPSECRET = null;

        var BASE_URL = !devMode ? "https://stream.herogi.com" : "http://localhost:7272";
        var API_HOST = BASE_URL;
        var EVENT_API = BASE_URL + "/v2/event"; //"https://e3d7c67b-72b1-42bc-ac5f-42e0ddbabb92.mock.pstmn.io/eventput"
        var USER_API = "/v1/identify";
        var SDK_VERSION = "herogi-js-sdk-v1.1";
        var TRACKING_DOMAIN = null;
        var authorization = null;

        var vapidPublicKey = 'BDzwp8BJjNyxPcBU-9lQ2ZYBKs86tlEQ5xSGXeYLm1EqxMoVGSiTw3YQp9CQvwOIy2yqu0Sddhac7oZwH2lgZnQ';

        var hgUserRefKey = "_hgid";
        var hgDeviceIdRefKey = "_hgDeviceId";

        var has = Object.prototype.hasOwnProperty;

        var locationKey = "_location";

        var locationEnabled = false;

        var location = {
            latitude: null,
            longitude: null
        };

        var lsSupport = true;

        var devNull = function (json) {
            //DO NOTHING
            console.log("dev null callback in progress" + json);
        };

        //added for logging badge
        var logLevelEnum = {
            ERROR: "[ERROR] ",
            WARNING: "[WARNING] ",
            INFO: "[INFO] ",
            DEBUG: "[DEBUG] ",
            VERBOSE: "[VERBOSE] ",
        }

        //setup subscription events
        var subscribeEnums = {
            CLICKS: "trackClick",
            FORM_SUBMIT: "trackFormSubmit",
            PAGE_LOAD: "trackPageLoad",
            //add another subs
        }

        var subscriptions = [];
        subscriptions = [subscribeEnums.CLICKS, subscribeEnums.FORM_SUBMIT, subscribeEnums.PAGE_LOAD];

        //default pre init for queue and subs
        var eventApiTest = true;
        var queueSize = 10;
        var eventBatchSize = 10;
        var eventflowInterval = 2500;
        var eventQueue = [];
        var requestQueue = [];
        var capturedObj = {};

        var readyToSend = true;
        var failedTimeout = 0;
        var failTimeoutAmount = 5;
        var failTimeoutMaxAmount = 80;

        var getURL = function (path) {
            return API_HOST + path;
        };

        var hgLogger = function (level, message, data) {
            if (devMode) {
                if (typeof data === "object") {
                    data = JSON.stringify(data);
                }
                message = "[" + message + "]";
                var log = level + message;
                if (data === undefined || data === null) {
                    log = level + message;
                } else {
                    log = level + message + data;
                }
                if (level === logLevelEnum.ERROR) {
                    console.error(log);
                } else if (level === logLevelEnum.WARNING) {
                    console.warn(log);
                } else if (level === logLevelEnum.INFO) {
                    console.info(log);
                } else if (level === logLevelEnum.VERBOSE) {
                    console.log(log);
                }
                //if level is not includes in enums setting level as debug
                else {
                    console.debug(log);
                }
            } else {
                if (level === logLevelEnum.ERROR || level === logLevelEnum.WARNING) {

                    if (typeof data === "object") {
                        data = JSON.stringify(data);
                    }
                    message = "[" + message + "]";
                    var log = level + message;
                    if (data === undefined || data === null) {
                        log = level + message;
                    } else {
                        log = level + message + data;
                    }

                    console.error(log);
                }
            }
        }

        var log = function (msg) {
            if (devMode) {
                console.log(msg);
            }
        };

        var check = {

            func: function (v) {
                return (typeof v === 'function')
            },

            ob: function (v) {
                return (typeof v === 'object')
            }

        };

        var userDataKeys = {
            "email": {
                type: "STRING"
            },
            "mobileNo": {
                type: "STRING"
            },
            "firstname": {
                type: "STRING"
            },
            "lastname": {
                type: "STRING"
            },
            "gender": {
                type: "STRING"
            },
            "language": {
                type: "STRING"
            },
            "country": {
                type: "STRING"
            },
            "city": {
                type: "STRING"
            },
            "currentLocation": {
                type: "STRING"
            },
            "timezone": {
                type: "STRING"
            },
            "facebookId": {
                type: "STRING"
            },
            "twitterId": {
                type: "STRING"
            },
            "lineId": {
                type: "STRING"
            },
            "customAttributes": {
                type: "STRING"
            }
        };

        var userOptinKeys = {
            "emailOptin": {
                type: "STRING"
            },
            "smsOptin": {
                type: "STRING"
            },
            "pushOptin": {
                type: "STRING"
            },
            "webPushOptin": {
                type: "STRING"
            },
            "locationOptin": {
                type: "STRING"
            }
        };

        var getRootDomain = function () {

            var parts = window.location.hostname.split(".");
            // Common public suffixes (extend this list as needed)
            var publicSuffixes = [
                ".co.uk",
                ".com",
                ".co",
                ".org",
                ".net",
                ".gov",
                ".edu",
                ".io",
                ".us",
                ".ca",
                ".au",
                ".de",
                ".fr",
                ".jp",
                ".cn",
                ".ru",
                ".br",
                ".mx",
                ".es",
                ".it",
                ".me",
                ".edu.tr",
                ".local",
                ".com.tr",
                // Add more common suffixes here
            ];

            for (var i = parts.length - 1; i >= 0; i--) {
                var potentialDomain = parts.slice(i).join(".");
                if (publicSuffixes.includes("." + potentialDomain)) {
                    return parts.slice(i - 1).join(".");
                }
            }

            return window.location.hostname;
        }

        var cookieDomain = function () {
            if (TRACKING_DOMAIN === null) {
                return "." + getRootDomain();
            } else {
                return "." + TRACKING_DOMAIN;
            }
        }

        var cookieMigration = function () {
            var cookieVersion = cookieUtil.read("_hgVersion");

            if (cookieVersion === "" || cookieVersion === null) {

                hgLogger(logLevelEnum.INFO, "Running initial migration steps");

                cookieUtil.write("_hgVersion", SDK_VERSION, 365 * 10);

                //Migrate hgid
                var hgid = cookieUtil.read(hgUserRefKey);
                if (hgid !== "" && hgid !== null) {
                    cookieUtil.remove(hgUserRefKey);
                    cookieUtil.write(hgUserRefKey, hgid, 365 * 3, cookieDomain(), "/");
                }

                //Migrate hg_device_id
                var hgDeviceId = cookieUtil.read(hgDeviceIdRefKey);
                if (hgDeviceId !== "" && hgDeviceId !== null) {
                    cookieUtil.remove(hgDeviceIdRefKey);
                    cookieUtil.write(hgDeviceIdRefKey, hgDeviceId, 365 * 3, cookieDomain(), "/");
                }

            } else if (cookieVersion === SDK_VERSION) {
                hgLogger(logLevelEnum.INFO, "Skipping migration already migrated");
            }
        }

        var cookieUtil = {
            write: function (name, value, days, domain, path) {

                var date = new Date();
                days = days || 730; // two years
                path = path || '/';
                date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
                var expires = '; expires=' + date.toGMTString();
                var cookieValue = name + '=' + value + expires + '; path=' + path;
                if (domain) {
                    cookieValue += '; domain=' + domain;
                }
                document.cookie = cookieValue;
            },
            read: function (name) {
                var allCookie = '' + document.cookie;
                var index = allCookie.indexOf(name);
                if (name === undefined || name === '' || index === -1) return '';
                var ind1 = allCookie.indexOf(';', index);
                if (ind1 == -1) ind1 = allCookie.length;
                return unescape(allCookie.substring(index + name.length + 1, ind1));
            },
            remove: function (name) {
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=` + cookieDomain();
            }
        };


        var lsUtil = {
            check: function () {
                try {
                    localStorage.setItem("write_test_ls", true);
                    localStorage.removeItem("clean_test_ls");
                } catch (e) {
                    hgLogger(logLevelEnum.ERROR, "ls test failed,disable lsSupport: " + e);
                    lsSupport = false;
                }
            },

            write: function (name, item) {
                //TODO can be other edge cases
                if (lsSupport) {
                    try {
                        localStorage.setItem(name, JSON.stringify(item))
                    } catch (e) {
                        hgLogger(logLevelEnum.ERROR, "write ls failed: " + e);
                    }
                }
            },
            read: function (name, item) {
                //TODO can be other edge cases
                if (lsSupport) {
                    try {
                        var item = localStorage.getItem(name) || null;
                        return JSON.parse(item);
                    } catch (e) {
                        hgLogger(logLevelEnum.ERROR, "write ls failed: " + e);
                    }
                }
            },
            remove: function (name) {
                try {
                    localStorage.removeItem(name);
                } catch (e) {
                    hgLogger(logLevelEnum.ERROR, "remove ls failed: " + e);
                }
            }
        };


        var isEmpty = function (val) {
            if (null == val) return true;
            if ('number' == typeof val) return 0 === val;
            if (undefined !== val.length) return 0 === val.length;
            for (var key in val)
                if (has.call(val, key)) return false;
            return true;
        };


        var postRequest = function (url, body, callback) {

            var finalCallback = null;

            if (isEmpty(callback))
                finalCallback = devNull;
            else
                finalCallback = callback;


            window.fetch(url, {
                method: 'POST',
                mode: 'cors',
                headers: {

                    'Authorization': 'Basic ' + authorization,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            })
                .then(function (response) {

                    var status = response.status;
                    var body = response.json();

                    if (status == 200) {
                        finalCallback(true, body);
                    } else {
                        finalCallback(false, body);
                    }

                    return body;
                })
                .catch(function (ex) {
                    hgLogger(logLevelEnum.ERROR, "parsing failed =>" + ex);

                });
        };

        this.cookie = cookieUtil;
        this.ls = lsUtil;
        this.isEmpty = isEmpty;
        this.check = check;
        this.hgDeviceIdRefKey = hgDeviceIdRefKey;
        this.hgUserRefKey = hgUserRefKey;

        var that = this;


        this.sendToRequestQueue = function (request) {

            requestQueue.push(request);

            if (requestQueue.length > queueSize) {
                requestQueue.shift();
                hgLogger(logLevelEnum.INFO, "rq is shifted!");
            }
            lsUtil.write("hg_rq", requestQueue);
        }

        var _sendToRequestQueue = this.sendToRequestQueue;

        this.eventFlow = function () {

            var eventQueueFromLs = lsUtil.read("hg_eq", eventQueue);
            var requestQueueFromLs = lsUtil.read("hg_rq", requestQueue);

            if ((eventQueueFromLs !== null && eventQueueFromLs.length > 0)) {
                if (eventQueueFromLs.length <= eventBatchSize) {
                    //first write to ls 
                    hgLogger(logLevelEnum.INFO, "sended to requestQuee function");

                    if ((requestQueueFromLs !== null && requestQueueFromLs.length > 0)) {
                        requestQueue = requestQueueFromLs;
                    }

                    _sendToRequestQueue(eventQueueFromLs.shift());
                    eventQueue = eventQueueFromLs;
                } else {
                    hgLogger(logLevelEnum.INFO, "not sended to requestQuee function");
                    //if eventQueue size > maxBatchsize it could be during interval
                    var eventQueueFromLs = eventQueueFromLs.splice(0, eventBatchSize);
                    requestQueue = requestQueueFromLs;
                    _sendToRequestQueue(eventQueueFromLs.shift());
                    eventQueue = eventQueueFromLs;
                }

                lsUtil.write("hg_eq", eventQueue);

            }

            if (requestQueue.length > 0 && readyToSend) {
                readyToSend = false;
                console.log(requestQueue, "requestQueue");
                var events = requestQueue[0];

                hgLogger(logLevelEnum.INFO, "processing event", events);
                lsUtil.write("hg_rq", requestQueue);


                if (events.sessionId == null || events.sessionId == undefined || events.sessionId == "") {
                    let _sid = _cookie.read(hgUserRefKey)
                    events.sessionId = _sid;
                    events.data.hguserid = _sid;
                    hgLogger(logLevelEnum.INFO, "sessionId is null or undefined or empty, overriding with cookie hgid => ", events.sessionId)
                }

                if (eventApiTest) {

                    that.sendEvent(events, function (err, result) {
                        if (err) {
                            requestQueue.shift();
                            lsUtil.write("hg_rq", requestQueue);
                            hgLogger(logLevelEnum.INFO, "request ok", err);
                        } else {

                            //Dropping failed requests for now
                            requestQueue.shift();
                            lsUtil.write("hg_rq", requestQueue);
                            hgLogger(logLevelEnum.ERROR, "request error: ", err);
                        }
                    })
                }
            }
        }

        function validateSettings(settings) {
            if (!settings || typeof settings !== 'object') {
                return false; // Settings must be an object
            }
            if (!('appId' in settings) || !('appSecret' in settings)) {
                return false; // Missing required properties
            }
            return true; // All required properties exist
        };

        this.init = function (settings, options) {

            let locationSubscribe = false;

            if (!validateSettings(settings)) {
                hgLogger(logLevelEnum.ERROR, "Invalid settings object passed to init function. Please provide valid settings object. Such as {appId: 'your-app-id', appSecret: 'your-app-secret'}");
                return;
            }

            if (options != null && options != undefined && options["locationSubscribe"] != null && options["locationSubscribe"] != undefined) {
                locationSubscribe = options["locationSubscribe"];
            }


            if (inited == true) {
                hgLogger(logLevelEnum.INFO, "sdk already initiated!");
            } else {
                APPID = settings["appId"];
                APPSECRET = settings["appSecret"];
                TRACKING_DOMAIN = settings["trackingDomain"] ? settings["trackingDomain"] : TRACKING_DOMAIN;

                if (settings["proxyUrl"] != null && settings["proxyUrl"] != undefined && settings["proxyUrl"] != "") {
                    API_HOST = settings["proxyUrl"];
                }
                //SERVER_URL = serverUrl; //for enterprise plan we can use separate cloud server for them.

                cookieMigration();

                inited = true;
                authorization = btoa(APPID + ":" + APPSECRET);

                locationEnabled = locationSubscribe;
                if (locationSubscribe == true && (navigator.geolocation)) {
                    navigator.geolocation.getCurrentPosition(function (navData) {
                        location["latitude"] = navData.coords.latitude;
                        location["longitude"] = navData.coords.longitude;
                        cookieUtil.write(locationKey, JSON.stringify(location));
                        hgLogger(logLevelEnum.INFO, "Location subscribe succeed");

                    }, function (err) {
                        hgLogger(logLevelEnum.INFO, "Location subscribe failed with =>" + err);

                        locationEnabled = false;
                        cookieUtil.write(locationKey, null, -1);
                    });
                }

                var _eventFlow = this.eventFlow;

                // start event flow
                setInterval(function () {
                    _eventFlow();
                    //TODO get remote config from server
                }, eventflowInterval);
            }
        };

        this.urlBase64ToUint8Array = function (base64String) {
            var padding = '='.repeat((4 - base64String.length % 4) % 4);
            var base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');

            var rawData = window.atob(base64);
            var outputArray = new Uint8Array(rawData.length);

            for (var i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
            }
            return outputArray;
        }

        var urlBase64ToUint8Array = this.urlBase64ToUint8Array;

        this._askPushPermission = function () {
            return new Promise(function (resolve, reject) {
                const permissionResult = Notification.requestPermission(function (result) {
                    // Handling deprecated version with callback.
                    resolve(result);
                });

                if (permissionResult) {
                    permissionResult.then(resolve, reject);
                }
            })
                .then(function (permissionResult) {
                    if (permissionResult !== 'granted') {
                        throw new Error('Permission not granted.');
                    }
                });
        };

        this._subscribeForPush = function (cb) {
            return navigator.serviceWorker.register('/service-worker.js')
                .then(function (reg) {
                    var serviceWorker;
                    if (reg.installing) {
                        serviceWorker = reg.installing;
                    } else if (reg.waiting) {
                        serviceWorker = reg.waiting;
                    } else if (reg.active) {
                        serviceWorker = reg.active;
                    }

                    if (serviceWorker) {
                        console.log("sw current state", serviceWorker.state);
                        console.log("sw already activated - Do watever needed here");

                        var subscribeOptions = {
                            userVisibleOnly: true,
                            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                        };

                        reg.pushManager.subscribe(subscribeOptions).then(cb);
                    }
                }, function (err) {
                    console.error('unsuccessful registration with ', workerFileName, err);
                });
        };


        //TODO move helper functions to another file
        this.browserVersionReg = function (userAgent, regex) {
            return userAgent.match(regex) ? userAgent.match(regex)[2] : null;
        }

        this.getBrowserNameVer = function () {
            const userAgent = navigator.userAgent;
            let browser = "N/A";
            let version = "N/A";
            // Detect browser name
            browser = (/ucbrowser/i).test(userAgent) ? 'UCBrowser' : browser;
            browser = (/edg/i).test(userAgent) ? 'Edge' : browser;
            browser = (/googlebot/i).test(userAgent) ? 'GoogleBot' : browser;
            browser = (/chromium/i).test(userAgent) ? 'Chromium' : browser;
            browser = (/firefox|fxios/i).test(userAgent) && !(/seamonkey/i).test(userAgent) ? 'Firefox' : browser;
            browser = (/; msie|trident/i).test(userAgent) && !(/ucbrowser/i).test(userAgent) ? 'IE' : browser;
            browser = (/chrome|crios/i).test(userAgent) && !(/opr|opera|chromium|edg|ucbrowser|googlebot/i).test(userAgent) ? 'Chrome' : browser;;
            browser = (/safari/i).test(userAgent) && !(/chromium|edg|ucbrowser|chrome|crios|opr|opera|fxios|firefox/i).test(userAgent) ? 'Safari' : browser;
            browser = (/opr|opera/i).test(userAgent) ? 'Opera' : browser;

            // detect browser version
            switch (browser) {
                case 'UCBrowser':
                    version = this.browserVersionReg(userAgent, /(ucbrowser)\/([\d\.]+)/i);
                    break;
                case 'Edge':
                    version = this.browserVersionReg(userAgent, /(edge|edga|edgios|edg)\/([\d\.]+)/i);
                    break;
                case 'GoogleBot':
                    version = this.browserVersionReg(userAgent, /(googlebot)\/([\d\.]+)/i);
                    break;
                case 'Chromium':
                    version = this.browserVersionReg(userAgent, /(chromium)\/([\d\.]+)/i);
                    break;
                case 'Firefox':
                    version = this.browserVersionReg(userAgent, /(firefox|fxios)\/([\d\.]+)/i);
                    break;
                case 'Chrome':
                    version = this.browserVersionReg(userAgent, /(chrome|crios)\/([\d\.]+)/i);
                    break;
                case 'Safari':
                    version = this.browserVersionReg(userAgent, /(safari)\/([\d\.]+)/i);
                    break;
                case 'Opera':
                    version = this.browserVersionReg(userAgent, /(opera|opr)\/([\d\.]+)/i);
                    break;
                case 'IE':
                    const _v = this.browserVersionReg(userAgent, /(trident)\/([\d\.]+)/i);
                    // IE version is mapped using trident version 
                    // IE/8.0 = Trident/4.0, IE/9.0 = Trident/5.0
                    version = _v ? `${parseFloat(_v) + 4.0}` : `7.0`;
                    break;
                default:
                    version = "N/A";
            }

            return {
                "browser": browser,
                "version": version
            };
        }

        this.getOS = function () {
            var name = "Unknown OS";
            if (navigator.userAgent.indexOf("Win") != -1) name =
                "Windows OS";
            if (navigator.userAgent.indexOf("Mac") != -1) name =
                "Macintosh";
            if (navigator.userAgent.indexOf("Linux") != -1) name =
                "Linux OS";
            if (navigator.userAgent.indexOf("Android") != -1) name =
                "Android OS";
            if (navigator.userAgent.indexOf("like Mac") != -1) name =
                "iOS";

            return name;
        }

        this.getDeviceType = function () {
            var hasTouchScreen = false;
            if ("maxTouchPoints" in navigator) {
                hasTouchScreen = navigator.maxTouchPoints > 0;
            } else if ("msMaxTouchPoints" in navigator) {
                hasTouchScreen = navigator.msMaxTouchPoints > 0;
            } else {
                var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
                if (mQ && mQ.media === "(pointer:coarse)") {
                    hasTouchScreen = !!mQ.matches;
                } else if ('orientation' in window) {
                    hasTouchScreen = true;
                } else {

                    var UA = navigator.userAgent;
                    hasTouchScreen = (
                        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
                        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
                    );
                }
            }
            if (hasTouchScreen) {
                return 'mobile';
            } else {
                return 'desktop';
            }

        }
        this.getScreenRes = function () {
            if (screen.width) {
                var width = (screen.width) ? parseInt(screen.width) : 0;
                var height = (screen.height) ? parseInt(screen.height) : 0;
                if (width !== 0 && height !== 0) {
                    //TODO ios needs devicePixelRatio navigator.platform is depreacated update it 
                    var iOS = !!navigator.platform && /iPad|iPhone|iPod/.test(navigator.platform);
                    if (iOS && window.devicePixelRatio) {
                        width = Math.round(width * window.devicePixelRatio);
                        height = Math.round(height * window.devicePixelRatio);
                    } else {
                        if (Math.abs(window.orientation) === 90) {
                            var temp = width;
                            width = height;
                            height = temp;
                        }
                    }
                    return "" + width + "x" + height;
                }
            }
        }

        this.collectMetrics = function () {

            const browser = that.getBrowserNameVer();

            metrics = {

                "user_agent": navigator.userAgent,
                "browser": browser.browser,
                "browser_version": browser.version,
                "language": navigator.language || navigator.userLanguage,
                "platform": navigator.platform || "unknown",
                "os": that.getOS(),
                "device_type": that.getDeviceType(),
                "resolution": that.getScreenRes(),
                "referrer": document.referrer || "unknown",
            }

            hgLogger(logLevelEnum.INFO, 'metrics', metrics);
            return metrics;
        }



        this.getQueryParameter = function (query) {

            query = query.substring(query.indexOf('?') + 1);

            var reg = /([^&=]+)=?([^&]*)/g;
            var decodeReg = /\+/g;

            var decode = function (str) {
                return decodeURIComponent(str.replace(decodeReg, " "));
            };

            var params = {},
                e;
            while (e = reg.exec(query)) {
                var k = decode(e[1]),
                    v = decode(e[2]);
                if (k.substring(k.length - 2) === '[]') {
                    k = k.substring(0, k.length - 2);
                    (params[k] || (params[k] = [])).push(v);
                } else params[k] = v;
            }

            var assign = function (obj, keyPath, value) {
                var lastKeyIndex = keyPath.length - 1;
                for (var i = 0; i < lastKeyIndex; ++i) {
                    var key = keyPath[i];
                    if (!(key in obj))
                        obj[key] = {}
                    obj = obj[key];
                }
                obj[keyPath[lastKeyIndex]] = value;
            }

            for (var prop in params) {
                var structure = prop.split('[');
                if (structure.length > 1) {
                    var levels = [];
                    structure.forEach(function (item, i) {
                        var key = item.replace(/[?[\]\\ ]/g, '');
                        levels.push(key);
                    });
                    assign(params, levels, params[prop]);
                    delete (params[prop]);
                }
            }

            if (Object.keys(params).length === 1) {
                params = "";
            }

            return params;
        };


        /* Uncomment following line to enable adjusted functions and configuration.
        Change argument to pass spesific parameters 
        herogi.setConf(herogiCalls,herogiConfObj);
        */
        this.setConf = function (calls, confObj) {

            if (!isEmpty(confObj) && Object.keys(confObj).length > 0) {
                if (typeof (confObj["url"]) === 'string') { url = confObj["url"]; }
                if (typeof (confObj["queueSize"]) === 'number') { queueSize = confObj["queueSize"]; }
                if (typeof (confObj["eventBatchSize"]) === 'number') { eventBatchSize = confObj["eventBatchSize"]; }
                if (typeof (confObj["failTimeoutAmount"]) === 'number') { eventBatchSize = confObj["failTimeoutAmount"]; }
                if (typeof (confObj["failTimeoutMaxAmount"]) === 'number') { eventBatchSize = confObj["failTimeoutMaxAmount"]; }
                if (typeof (confObj["eventFlowInterval"]) === 'number') { eventFlowInterval = confObj["eventFlowInterval"]; }
            } else {
                hgLogger(logLevelEnum.INFO, "No configurations are set!");
            }

            var call;

            if (Array.isArray(calls) && calls !== undefined && calls.length > 0) {
                for (i = 0; i < calls.length; i++) {
                    call = calls[i];
                    hgLogger(logLevelEnum.INFO, "Calls initiating : " + JSON.stringify(call));

                    //TODO include ie pollyfill
                    if (subscriptions.length > 0 && subscriptions.includes(call[0])) {
                        if (call[0] !== undefined && typeof (call[0]) === "string") {
                            var req = call[0];
                            var param = call[1];
                            var fn = this[req];
                            if (typeof fn === "function") { fn(param); }
                        }

                    }
                }
            } else {
                hgLogger(logLevelEnum.WARNING, "No functions are called!");
            }

        }

        this.fetchEqHelper = function (eventQueue, capturedObj) {

            if (!isEmpty(capturedObj)) {
                //add app_data before fetch 
                var metrics = _collectMetrics();
                metrics["herogi_sdk_version"] = SDK_VERSION;
                capturedObj["data"]["platform_data"] = JSON.stringify(metrics);

                if (lsUtil.read("hg_eq") === null) {
                    eventQueue.push(capturedObj);
                    lsUtil.write("hg_eq", eventQueue);
                } else {
                    eventQueue = lsUtil.read("hg_eq");
                    eventQueue.push(capturedObj);
                    lsUtil.write("hg_eq", eventQueue);
                }
            }
        }

        this.getTimeStampSecond = function () {
            return Math.floor(new Date().getTime() / 1000);
        }

        var _fetchHelper = this.fetchEqHelper;
        var _getTimeStampSecond = this.getTimeStampSecond;
        var _collectMetrics = this.collectMetrics;
        var _cookie = this.cookie;

        this.trackClick = function (funcObj) {

            document.addEventListener('click', function (e) {

                const eventTimeStamp = _getTimeStampSecond();
                const _view = window.location.href;
                const _host = window.location.host;

                const _link_view = _host + e.target.href;
                var n = _link_view.indexOf('#');
                var _query = _link_view.substring(0, n != -1 ? n : _link_view.length);
                var _queryParams = _getQueryParameter(_query);

                capturedObj = {
                    eventName: 'Click',
                    sessionId: _cookie.read(hgUserRefKey),
                    scenarioNames: [],
                    data: {
                        html_id: e.target.id || "",
                        title: e.target.title || "",

                        hguserid: _cookie.read(hgUserRefKey),
                        view: _view || "unknown",
                        timestamp: eventTimeStamp.toString(),
                    }
                }

                //node can be button, span, div we can use type attr or tag manager
                if (e.target && e.target.nodeName === "BUTTON") {

                    capturedObj['data']['text'] = e.target.value || "";
                    capturedObj['data']['content'] = e.target.innerText || "";


                    if (!(e.target.parentNode && e.target.parentNode.nodeName === "FORM")) {
                        capturedObj['data']['source'] = 'button';
                        capturedObj['data']['href'] = e.target.href || "";
                        _fetchHelper(eventQueue, capturedObj);
                    }

                } else if (e.target && e.target.nodeName === "A") {

                    capturedObj['data']['source'] = 'link';
                    capturedObj['data']['href'] = e.target.href || "";
                    capturedObj['data']['target'] = e.target.target || "";
                    capturedObj['data']['querystring_params'] = JSON.stringify(_queryParams) || "";

                    _fetchHelper(eventQueue, capturedObj);

                }

            })
        }

        this.trackFormSubmit = function (funcObj) {

            document.addEventListener('click', function (e) {

                const eventTimeStamp = _getTimeStampSecond();

                const _view = window.location.href; const _link_view = _view + e.target.href;

                if (e.target && (e.target.nodeName === "BUTTON" || e.target.nodeName === "INPUT") && e.target.type === "submit") {

                    if (e.target.parentNode && e.target.parentNode.nodeName === "FORM") {
                        var formData = new FormData(e.target.parentNode);
                        var formProps = Object.fromEntries(formData);

                        console.log("formProps", formProps);

                        capturedObj = {
                            eventName: 'FormSubmit',
                            sessionId: _cookie.read(hgUserRefKey),
                            scenarioNames: [],
                            data: {
                                hguserid: _cookie.read(hgUserRefKey),
                                action: e.target.action || "",
                                method: e.target.method || "",
                                html_id: e.target.id || "",
                                form_name: e.target.name || "",
                                form_params: JSON.stringify(formProps), //TODO make spesific form type as template
                                view: _view || "unknown",
                                timestamp: eventTimeStamp.toString(),
                            }
                        }

                        _fetchHelper(eventQueue, capturedObj);

                    }
                }

            })
        }

        var _getQueryParameter = this.getQueryParameter;


        // Function to track page load events and performance metrics
        this.trackPageLoad = function () {
            const eventTimeStamp = Date.now(); // Get current timestamp

            // Function to extract query parameters from URL
            const getQueryParams = (url) => {
                const params = new URLSearchParams(url.search);
                const queryParams = {};
                for (const [key, value] of params.entries()) {
                    queryParams[key] = value;
                }
                return queryParams;
            };

            const navigationEntries = performance.getEntriesByType("navigation");

            // Check if navigation entries are available
            if (navigationEntries && navigationEntries.length > 0) {
                // Use performance API for tracking page load if available
                const navigationEntry = navigationEntries[0];
                const navigationType = navigationEntry.type;
                const viewUrl = window.location.href.split('#')[0];
                const queryParams = getQueryParams(window.location);

                const capturedObj = {
                    eventName: "PageLoad",
                    sessionId: _cookie.read(hgUserRefKey),
                    scenarioNames: [],
                    data: {
                        hguserid: _cookie.read(hgUserRefKey),
                        url: viewUrl,
                        page_title: document.title,
                        querystring_params: JSON.stringify(queryParams),
                        view: viewUrl || "unknown",
                        timestamp: eventTimeStamp.toString(),
                        eventType: navigationType || "unknown"
                    }
                };

                window.onload = function () {
                    setTimeout(function () {
                       
                        // Check if page load time is available in the navigation entry
                        if (navigationEntry.loadEventEnd && navigationEntry.responseEnd) {
                            const pageLoadTime = navigationEntry.loadEventEnd - navigationEntry.responseEnd;
                            if (pageLoadTime >= 0) {
                                capturedObj.data.pageLoadTime = pageLoadTime.toString();
                            } else {
                                hgLogger(logLevelEnum.WARNING, "Negative page load time detected in navigation entry:", pageLoadTime);
                            }
                        } else {
                            hgLogger(logLevelEnum.WARNING, "Page load time not found in navigation entry. Calculating from performance timing...");
                            // Calculate page load time using performance timing
                            const timing = performance.timing;
                            const pageLoadTime = timing.loadEventEnd - timing.responseEnd;
                            if (!isNaN(pageLoadTime) && pageLoadTime >= 0) {
                                capturedObj.data.pageLoadTime = pageLoadTime.toString();
                            } else {
                                hgLogger(logLevelEnum.ERROR, "Invalid page load time detected in performance timing:", pageLoadTime);
                            }
                        }

                        //eventQueue.push(capturedObj); // Push captured data to the event queue directly
                        _fetchHelper(eventQueue, capturedObj);
                    }, 0);
                }

            } else {
                // Fallback to window.onload event for tracking page load
                window.onload = function () {
                    setTimeout(function () {
                        const timing = performance.timing;
                        const pageLoadTime = timing.loadEventEnd - timing.responseEnd;

                        if (!isNaN(pageLoadTime) && pageLoadTime >= 0) {
                            const viewUrl = window.location.href.split('#')[0];
                            const queryParams = getQueryParams(window.location);
                            const capturedObj = {
                                eventName: "PageLoad",
                                sessionId: _cookie.read(hgUserRefKey),
                                scenarioNames: [],
                                data: {
                                    hguserid: _cookie.read(hgUserRefKey),
                                    url: viewUrl,
                                    page_title: document.title,
                                    querystring_params: JSON.stringify(queryParams),
                                    view: viewUrl || "unknown",
                                    timestamp: eventTimeStamp.toString(),
                                    eventType: "unknown"
                                }
                            };
                            capturedObj.data.pageLoadTime = pageLoadTime.toString();
                            _fetchHelper(eventQueue, capturedObj);
                        } else {
                            hgLogger(logLevelEnum.ERROR, "Invalid page load time detected in window.onload:", pageLoadTime);
                        }
                    }, 0);
                };
            }
        };


        this.trackPageLoad2 = function (funcObj) {

            const eventTimeStamp = _getTimeStampSecond();

            if (performance.getEntriesByType("navigation")) {

                const _view = window.location.href;
                var n = _view.indexOf('#');
                var _query = _view.substring(0, n != -1 ? n : _view.length);
                const _queryParams = _getQueryParameter(_query);


                p = performance.getEntriesByType("navigation")[0];
                pType = performance.getEntriesByType("navigation")[0].type;

                //TODO check later new api comes always zero but showing in object 
                //var pageLoadTime = p.domInteractive;
                //TODO querystring empty params

                capturedObj = {
                    eventName: "PageLoad",
                    sessionId: _cookie.read(hgUserRefKey),
                    scenarioNames: [],
                    data: {
                        hguserid: _cookie.read(hgUserRefKey),
                        url: window.location.href,
                        page_title: document.title,
                        querystring_params: JSON.stringify(_queryParams),

                        view: _view || "unknown",
                        timestamp: eventTimeStamp.toString(),
                    },
                }


                if (pType === 'navigate') {
                    capturedObj["data"]["eventType"] = 'navigate';
                } else if (pType === "reload") {
                    capturedObj["data"]["eventType"] = 'reload';
                } else if (pType === "back_forward") {
                    capturedObj["data"]["eventType"] = 'back_forward';
                }
            }

            window.onload = function () {
                setTimeout(function () {
                    var t = performance.timing;
                    var pageLoadTime = 0;
                    pageLoadTime = t.loadEventEnd - t.responseEnd;

                    capturedObj["data"]["pageLoadTime"] = pageLoadTime.toString(),
                        _fetchHelper(eventQueue, capturedObj);
                }, 0);
            }

        }

        //TODO if browser support not enough change to XMLHttpRequest
        this.sendEvent = function (event, callback) {

            var finalCallback = null;

            if (this.isEmpty(callback))
                finalCallback = devNull;
            else
                finalCallback = callback;

            window.fetch(EVENT_API, {
                method: 'POST',
                mode: 'cors',
                headers: {

                    'Authorization': 'Basic ' + authorization,
                    'Content-Type': 'application/json',
                    'X-Sdk-Version': SDK_VERSION,
                },

                body: JSON.stringify(event)
            })
                .then(function (response) {

                    var status = response.status;
                    var body = response.json();

                    if (status == 200) {
                        readyToSend = true;
                        finalCallback(true, "success");
                    } else {
                        readyToSend = true;
                        finalCallback(false, body);
                    }

                    return body;
                })
                .catch(function (ex) {
                    console.log('parsing failed', ex)
                });
        };

        this._trackCustom = function (payloadObj) {
            _fetchHelper(eventQueue, payloadObj);
        };

        this._identify = function (externalId, userAttributes, customAttributes, userPreferences, subscriptionData, callback) {

            var req = {};

            //prepare request for user attributes
            for (key in userAttributes) {
                var obj = userAttributes[key];
                if (!this.isEmpty(userDataKeys[key]))
                    req[key] = obj;
            }

            //prepare request for user preferences
            for (key in userPreferences) {
                var obj = userPreferences[key];
                if (!this.isEmpty(userOptinKeys[key])) {
                    if (obj == "OPTIN" || obj == "OPTOUT")
                        req[key] = obj;
                    else {
                        log("Invalid data type for " + key + "=" + obj);
                    }
                }
            }

            //Auto collect data
            if (this.isEmpty(req["timezone"])) {
                req["timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;
            }

            if (this.isEmpty(req["currentLocation"]) && locationEnabled &&
                (req["locationOptin"] == "OPTIN") || this.isEmpty(req["locationOptin"])) {
                var loc = this.cookie.read(locationKey);
                if (!this.isEmpty(loc))
                    req["currentLocation"] = loc;
            }

            if (this.isEmpty(req["language"])) {
                var userLang = navigator.language || navigator.userLanguage;
                req["language"] = userLang.substring(0, 2).toUpperCase();
            }


            var hgId = this.cookie.read(hgUserRefKey);
            var deviceId = this.cookie.read(hgDeviceIdRefKey);

            req["hgid"] = hgId;
            req["externalUserId"] = externalId;
            req["customAttributes"] = JSON.stringify(customAttributes);

            var deviceData = this.collectMetrics();
            req["device"] = {
                "deviceId": deviceId.trim() == "" ? null : deviceId.trim(),
                "pushPlatform": "NativeWeb",
                ...deviceData,
                "subscription": JSON.stringify(subscriptionData)
            };

            postRequest(getURL(USER_API), req, function (status, res) {
                res.then(data => {

                    if (status == true) {
                        var user = data;
                        if (API_HOST == BASE_URL) {
                            cookieUtil.write(hgUserRefKey, user.hgid, 365 * 3, cookieDomain());
                            cookieUtil.write(hgDeviceIdRefKey, user.deviceId, 365 * 3, cookieDomain());
                        }
                        callback(true, user.hgid);
                    } else {
                        var err = data;
                        if (err.code == 404 && (API_HOST == BASE_URL)) {
                            cookieUtil.remove(hgUserRefKey);
                            cookieUtil.remove(hgDeviceIdRefKey);
                            console.log("[WARNING] Identify failed with corrupted data, deleting _hg cookies");
                        }
                        callback(false, data);
                    }
                });
            });
        };

        return;
    };

    //TODO implement identify method 
    //TODO session_id checker needs
    Herogi.prototype.identify = function (externalId, userAttributes, customAttributes, userPreferences, callback) {

        //Shuffle variables
        if (this.check.ob(externalId)) {
            callback = userPreferences;
            userPreferences = customAttributes;
            customAttributes = userAttributes;
            userAttributes = externalId;
            externalId = null;
        }

        this._identify(externalId, userAttributes, customAttributes, userPreferences, null, callback);
    };

    Herogi.prototype.requestPushPermissions = function () {

        if (!('serviceWorker' in navigator)) {
            // Service Worker isn't supported on this browser, disable or hide UI. 
            return 1;
        }

        if (!('PushManager' in window)) {
            // Push isn't supported on this browser, disable or hide UI. 
            return 2;
        }

        var t = this;

        this._askPushPermission();
        this._subscribeForPush(function (pushSubscription) {
            console.log('PushSubscription: ', JSON.stringify(pushSubscription));
            //Delay this update a bit so that first identify can result
            //if(t.cookie.read(t.hgDeviceIdRefKey) == '' || t.cookie.read(t.hgUserRefKey) == '') {
            setTimeout(() => {
                t._identify(null, null, null, null, pushSubscription, function (res, d) { });
            }, 3000);
            //} else {
            //    t._identify(null, null, null, null, pushSubscription, function(res, d) {});     
            //}

        });

        return 0;
    };

    Herogi.prototype.isPushPermissionsGranted = function () {
        console.log(Notification.permission);
        var result = "unknown";
        if (Notification.permission === "granted") {
            result = "granted";
        } else if (Notification.permission === "denied") {
            result = "denied";
        } else if (Notification.permission === "default") {
            result = "default";
        }
        return result;
    };

    Herogi.prototype.trackCustom = function (sessionId, eventName, data) {

        var _sessionId = null;
        var _eventName = null;
        var _data = null;


        if (data !== null && this.check.ob(data)) {
            _sessionId = sessionId;
            _eventName = eventName;
            _data = data;

        } else if (this.isEmpty(data) && !this.isEmpty(eventName) && this.check.ob(eventName)) {
            _sessionId = this.cookie.read(this.hgUserRefKey);
            _eventName = sessionId;
            _data = eventName;
        } else if (this.isEmpty(data) && !this.isEmpty(eventName) && !this.check.ob(eventName)) {
            _sessionId = sessionId;
            _eventName = eventName;
        } else {
            _sessionId = this.cookie.read(this.hgUserRefKey);
            _eventName = sessionId;
        }


        var payloadObj = {
            sessionId: _sessionId,
            eventName: _eventName || "unknown",
            scenarioNames: [],
            data: {
                hguserid: this.cookie.read(this.hgUserRefKey),
                ..._data
            }
        }

        this._trackCustom(payloadObj);
    };

    // define your namespace myApp
    window.herogi = new Herogi(false);

})(window, undefined);