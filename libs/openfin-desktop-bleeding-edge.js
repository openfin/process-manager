/**
 * name:    OpenFin Desktop JavaScript Adapter
 * version: <?OPENFIN:DEPLOY_VERSION?>
 */


var fin = fin || {};

fin.desktop = fin.desktop || {};


(function () {

    console.log("STARTING DESKTOP.JS");

    var mainCallbacks = [];
    var errorCallbacks = [];
    var isConnected = false, failedToConnect = false;
    var socket;
    var websocketPort = undefined;
    var applicationUuid = undefined;
    var applicationToken = undefined;
    var windowId = undefined;

    fin.desktop.main = function (callback, errorCallback) {
        if (callback)
            mainCallbacks.push(callback);

        if (errorCallback)
            errorCallbacks.push(errorCallback);

        if (isConnected && callback) {
            callback.call(window);
        }

        else if (failedToConnect && errorCallback) {
            errorCallback.call(window);
        }
    };

    if ((typeof chrome !== 'undefined') && chrome.desktop && chrome.desktop.getDetails) {
        console.log("Retrieving desktop details");
        chrome.desktop.getDetails(function (token, name, app_uuid, port) {
            app_uuid = app_uuid || name;
            applicationUuid = app_uuid;
            window.name = name;
            windowId = name;
            applicationToken = token;
            websocketPort = port;

            socket = new WebSocket('ws://127.0.0.1:' + (websocketPort ? websocketPort : '9696'));
            setWsHandlers(socket);
        });
    } else {
        // Try fallback for 1.4
        websocketPort = websocketPort || (fin.desktop._websocket_port || '9696');
        applicationUuid = applicationUuid || fin.desktop._app_uuid;
        applicationToken = applicationToken || fin.desktop._application_token;
        socket = new WebSocket('ws://127.0.0.1:' + (websocketPort ? websocketPort : '9696'));
        setWsHandlers(socket);
    }

    function setWsHandlers(socket, reconnectCallback) {

        socket.onopen = function () {

            console.log('WebSocket opened in App with auth token');
            var connectedMessage = JSON.stringify({
                action: 'request-authorization',
                payload: {
                    type: 'application-token',
                    authorizationToken: applicationToken
                }
            });

            console.log("Attempting handshake with WebSocket server.");
            socket.send(connectedMessage);
        };

        socket.onmessage = function (event) {

            var message = JSON.parse(event.data);
            var action = message.action;
            var correlationId = message.correlationId;
            var payload = message.payload;

            console.log("message received: action: " + action + " correlationId: " + correlationId);

            if (action == "authorization-response") {
                var success = payload.success;
                var reason = payload.reason;
                if (success) {
                    isConnected = true;
                    if (reconnectCallback) {
                        reconnectCallback();
                    } else {
                        mainCallbacks.forEach(function (callback) {
                            callback.call(window);
                        });
                    }
                } else  {
                    console.error("Error connecting to WebSocket server: " + reason);
                    failedToConnect = true;
                    errorCallbacks.forEach(function (callback) {
                        callback.call(window);
                    });
                }
            } else if (action == "process-message") {
                dispatchMessageToCallbacks(payload.sourceUuid, payload.topic, payload.message);
            } else if (action == "ack") {
                fireMessageCallback(correlationId, payload);
            } else if (action == "ping") {
                respondToPing(payload.pingId);
            } else if (action == "process-system-message") {
                dispatchSystemMessage(message);
            } else if (action == "subscriber-added") {
                dispatchToSubscribeListeners(payload.uuid, payload.topic);
            } else if (action == "subscriber-removed") {
                dispatchToUnsubscribeListeners(payload.uuid, payload.topic);
            } else if (action == "process-notification-event") {
                processNotificationEvent(payload);
            } else if (action == "process-action-from-notification") {
                var handler = window.processActionFromNotification;
                if (typeof handler == "function") handler.call(window, payload);
            } else if (action == "process-action-from-notifications-center") {
                processActionFromNotificationsCenter(payload);
            } else if (action == "process-desktop-event") {
                dispatchDesktopEvent(payload);
            } else if (action == "process-external-message") {
                processExternalMessage(payload);
            }
        };

        socket.onerror = function () {
            console.error("Error establishing WebSocket connection");
            failedToConnect = true;
            fireErrorCallbacks("connection error");
        };

        socket.onclose = function () {
            console.error("WebSocket connection closed");
            fireErrorCallbacks("connection closed");
            retrySocketConnection();
        };

        function fireErrorCallbacks(reason) {
            errorCallbacks.forEach(function (callback) {
                callback(reason);
            });
        }
    }

    function retrySocketConnection() {
      if (isConnected) {
        console.log("retrySocketConnection onclose");
        failedToConnect = false;
        isConnected = false;
        socket = new WebSocket('ws://127.0.0.1:' + (websocketPort ? websocketPort : '9696'));
        setWsHandlers(socket, function () {
            resubscribeToInterAppBusAfterLostConnection();
            resubscribeToDesktopEventsAfterLostConnection();
        });
      }
    }

    fin.desktop.Test = {
      closeSocket: function () {
        console.error("Test force web socket close");
        socket.close();
      }
    };

    var messageId = 0;

    var messageCallbackMap = {};  // correlationId => {successCallback, errorCallback

    function fireMessageCallback(correlationId, response) {
        // Warn of deprecation
        if(response && response.deprecated) {
            var deprecatedInfo = response.deprecated;
            console.warn("Subscribed to " + deprecatedInfo.eventType + ": " + deprecatedInfo.reason);
        }

        // Notify user that an error occured
        if (!response.success) {
            console.error("An error occured: " + JSON.stringify(response));
        }

        if (correlationId != undefined) {
            var msgInfo = messageCallbackMap[correlationId];
            if (msgInfo) {
                if (!response.success) {
                    if (typeof msgInfo.errorCallback == "function") {
                        msgInfo.errorCallback.call(window, response.reason);
                    }

                    console.error("Error performing action: " + msgInfo.action + " : " + response.reason);
                } else if (typeof msgInfo.successCallback == "function") {
                    msgInfo.successCallback.call(window, response.data);
                }
                delete messageCallbackMap[correlationId];
            }
        }
    }

    function sendMessageToDesktop(action, payload, callback, errorCallback) {
        if (isConnected) {
            var messageObject = {
                action: action,
                payload: payload
            };

            if (typeof callback == "function" || typeof errorCallback == "function") {
                messageCallbackMap[messageId] = {};
                var msgCallbackEntry =  messageCallbackMap[messageId];
                msgCallbackEntry.action = action;
                if (typeof callback == "function") {
                    msgCallbackEntry['successCallback'] = callback;
                }

                if (typeof errorCallback == "function") {
                    msgCallbackEntry['errorCallback'] = errorCallback;
                }

                messageObject.messageId = messageId;
                messageId++;
            }

            var message = JSON.stringify(messageObject);

            socket.send(message);
        }
    }

    var pingedBefore = false;

    function respondToPing(pingId) {
        if (document.readyState == "interactive" || document.readyState == "complete") {
            console.log("Responding to ping");
            sendMessageToDesktop("pong", {
                correlationId: pingId,
                pingedBefore: pingedBefore
            });
            pingedBefore = true;
        }
    }

    var ExternalMessageResultHandlerFactory = function (request) {
        var request_ = request;
        var factory_ = this;
        var sentToDesktop_ = false;
        var nHandlers_ = 0;
        var nProcessed_ = 0;
        var handlers_ = {};
        var allDispatched_ = false;

        // Returns true when the result has been sent to the desktop
        function wasSent() {
            return sentToDesktop_;
        }

        function sendIfAllResultsDispatchedAndComplete() {
            // Dispatch to desktop if all handlers processed
            if(allDispatched_ && nProcessed_ == nHandlers_) {
                var totalResult = true;
                var totalMessage = "";

                if(!nHandlers_) {
                    totalResult = false;
                    totalMessage = "No external message handler has been registered!";
                }

                for(var key in handlers_) {
                    if(handlers_.hasOwnProperty(key)) {
                        var registeredHandler = handlers_[key];
                        totalResult &= registeredHandler.result;
                        totalMessage += registeredHandler.message;
                    }
                }

                // Send totalResult and totalMessage
                sendMessageToDesktop('external-message-result', {
                    uuid: applicationUuid,
                    connectionId: request_.connectionId,
                    result: totalResult,
                    message: totalMessage
                });
                sentToDesktop_ = true;
            }
        }

        this.allDispatched = function() {
            allDispatched_ = true;
            sendIfAllResultsDispatchedAndComplete();
        };
        // Factory method to create and track a result handler
        this.makeResultHandler = function() {
            var requestHandler = new ExternalMessageResultHandler(factory_, request_);
            handlers_[requestHandler.getId()] = {
                processed: false,
                result: true,
                message: "",
                handler: requestHandler
            };

            ++nHandlers_;

            return requestHandler;
        };

        this.handleResult = function(id, result, message) {
            var handler = handlers_[id];
            if(!wasSent() && handler) {
                if(!handler.processed) {
                    handler.processed = true;
                    handler.result = result;
                    handler.message = message;
                    ++nProcessed_;

                    sendIfAllResultsDispatchedAndComplete();
                } else {
                    console.error("Handler already sent result. Can not send success: " + result + " with message: " + message);
                }
            }
        };
    };

    // Handles external request
    var ExternalMessageResultHandler = function(parent, request) {
        var me = this;
        var requestPayload = (request || {});
        var parent_ = parent;
        var id_ = fin.desktop.getUuid();
        var origin_ = requestPayload.origin;

        me.getId = function () { return id_; };
        me.send = function(result, message) {
            parent_.handleResult(me.getId(), result, message);
        };
    };

    var externalMessageHandlers = [];
    fin.desktop.addExternalMessageHandler = function(callback) {
        if(typeof callback == 'function') {
            externalMessageHandlers.push(callback);
        };
    };

    function processExternalMessage(payload) {
        var messageHandlerFactory = new ExternalMessageResultHandlerFactory(payload);

        externalMessageHandlers.forEach(function(handler) {
            handler(messageHandlerFactory.makeResultHandler(), payload);
        });

        messageHandlerFactory.allDispatched();
    }

    function dispatchSystemMessage(message) {
        if (typeof window.onSystemMessage == "function") {
            window.onSystemMessage(message.payload);
        }
    }


    var desktopEventCallbackMap = {
        window: {

        },
        application: {

        },
        system: {

        }
    };

    function addDesktopEventCallback(subscriptionObject, listener, owner, callback, errorCallback) {
        var map;

        var topic = subscriptionObject.topic;
        var type = getFullEventType(topic, subscriptionObject.type);

        var uuid, name;
        var callbacks;

        switch (topic) {
            case "window":
                uuid = subscriptionObject.uuid;
                name = subscriptionObject.name;
                desktopEventCallbackMap[topic][type] = desktopEventCallbackMap[topic][type] || {};
                map = desktopEventCallbackMap[topic][type];
                map[uuid] = map[uuid] || {};
                map = map[uuid];
                map[name] = map[name] || [];
                callbacks = map[name];

                break;
            case "application":
                uuid = subscriptionObject.uuid;
                desktopEventCallbackMap[topic][type] = desktopEventCallbackMap[topic][type] || {};
                map = desktopEventCallbackMap[topic][type];
                map[uuid] = map[uuid] || [];
                callbacks = map[uuid];

                break;
            case "system":
                desktopEventCallbackMap[topic][type] = desktopEventCallbackMap[topic][type] || [];
                callbacks = desktopEventCallbackMap[topic][type];
                break;

        }

        if(callbacks) {
            if (callbacks.length == 0) {
                sendMessageToDesktop("subscribe-to-desktop-event", subscriptionObject, callback, errorCallback);
            }

            listener._owner = owner;
            callbacks.push(listener);
        } else {
            console.error("Could not subscribe to unknown event \'" + type + "\'.");
        }

    }

    function resubscribeToDesktopEventsAfterLostConnection() {
        var map;
        for (var topic in desktopEventCallbackMap) {
            map = desktopEventCallbackMap[topic];
            switch (topic) {
                case "window":
                    (function () {
                        for (var type in map) {
                            for (var uuid in map[type]) {
                                for (var name in map[type][uuid]) {
                                    if (map[type][uuid][name].length > 0) {
                                        sendMessageToDesktop("subscribe-to-desktop-event", {
                                            topic: topic,
                                            type: getPartialEventType(topic, type),
                                            uuid: uuid,
                                            name: name
                                        });
                                    }
                                }
                            }
                        }
                    })();
                    break;
                case "application":
                    (function () {
                        for (var type in map) {
                            for (var uuid in map[type]) {
                                if (map[type][uuid].length > 0) {
                                    sendMessageToDesktop("subscribe-to-desktop-event", {
                                        topic: topic,
                                        type: getPartialEventType(topic, type),
                                        uuid: uuid
                                    });
                                }
                            }
                        }
                    })();
                    break;
                case "system":
                    (function () {
                        for (var type in map) {
                            if (map[type].length > 0) {
                                sendMessageToDesktop("subscribe-to-desktop-event", {
                                    topic: topic,
                                    type: getPartialEventType(topic, type)
                                });
                            }
                        }
                    })();
                    break;
            }
        }
    }


    function removeDesktopEventCallback(subscriptionObject, listener, callback, errorCallback) {
        var map = desktopEventCallbackMap;

        var topic = subscriptionObject.topic;
        var type = getFullEventType(topic, subscriptionObject.type);

        var uuid, name;
        var callbacks;

        switch (topic) {
            case "window":
                uuid = subscriptionObject.uuid;
                name = subscriptionObject.name;

                if (map[topic][type] && map[topic][type][uuid] && map[topic][type][uuid][name])
                    callbacks = map[topic][type][uuid][name];

                break;
            case "application":
                uuid = subscriptionObject.uuid;

                if (map[topic][type] && map[topic][type][uuid])
                    callbacks = map[topic][type][uuid];

                break;
            case "system":
                if (map[topic][type])
                    callbacks = map[topic][type];
                break;
        }

        if (callbacks) {
            var index = callbacks.indexOf(listener);
            if (index != -1) {
                callbacks.splice(index, 1);
                if (callbacks.length == 0) {
                    sendMessageToDesktop("unsubscribe-to-desktop-event", subscriptionObject, callback, errorCallback);
                }
            }
        }
    }

    function dispatchDesktopEvent(subscriptionObject) {

        var map = desktopEventCallbackMap;

        var topic = subscriptionObject.topic;
        var type = getFullEventType(topic, subscriptionObject.type);

        var uuid, name;
        var callbacks;

        switch (topic) {
            case "window":
                uuid = subscriptionObject.uuid;
                name = subscriptionObject.name;

                if (map[topic][type] && map[topic][type][uuid] && map[topic][type][uuid][name])
                    callbacks = map[topic][type][uuid][name];

                break;
            case "application":
                uuid = subscriptionObject.uuid;

                if (map[topic][type] && map[topic][type][uuid])
                    callbacks = map[topic][type][uuid];

                break;
            case "system":
                if (map[topic][type])
                    callbacks = map[topic][type];
                break;
        }

        var eventObject = subscriptionObject;
        if (callbacks) {
            callbacks.forEach(function (callback) {
                callback.call(callback._owner, eventObject);
            });
        }
    }

    function getFullEventType(category, type) {
        var fullType;
        switch (category) {
            case "system":
                fullType = type;
                break;
            case "window":
                fullType = (type.indexOf("window-") == -1) ? ("window-" + type) : type;
                break;
            case "application":
                fullType = (type.indexOf("application-") == -1) ? ("application-" + type) : type;
                break;
        }
        return fullType;
    }

    function getPartialEventType(category, type) {
        var len = category.length + 1;
        return type.slice(len);
    }

    var interAppBusCallbackMap = {};

    function dispatchMessageToCallbacks(senderUuid, topic, message) {
        console.log("Dispatching message to callbacks from " + senderUuid + " on " + topic);

        /**
         * Dispatch the message to callback by application and then topic.
         */

        var appMap;

        if ("*" in interAppBusCallbackMap) {
            appMap = interAppBusCallbackMap["*"];
            var topicMap = appMap[topic];
            if (topicMap) {
                //var msgObj = JSON.parse(message);
                topicMap.forEach(function (cb) {
                    cb.call(window, message, senderUuid);
                });
            }
        }

        appMap = interAppBusCallbackMap[senderUuid];

        if (appMap) {
            topicMap = appMap[topic];
            if (topicMap) {
                //var msgObj = JSON.parse(message);
                topicMap.forEach(function (cb) {
                    cb.call(window, message, senderUuid);
                });
            }
        }
    }

    fin.desktop.System = {
        addEventListener: function (type, listener, callback, errorCallback) {
            var subscriptionObject = { topic: "system" };

            // If type is an object unwrap to get configuration
            if(typeof type == "object" && type.data && type.type) {
                subscriptionObject.type = type;
                subscriptionObject.data = type.data;
                // Else use default behavior
            } else {
                subscriptionObject.type = type;
            }

            addDesktopEventCallback(subscriptionObject, listener, this, callback, errorCallback);
        },
        clearCache: function (options, callback, errorCallback) {
            sendMessageToDesktop('clear-cache', {
                cache: options.cache,
                cookies: options.cookies,
                localStorage: options.localStorage,
                appcache: options.appcache,
                userData: options.userData
            }, callback, errorCallback);
        },
        deleteCacheOnRestart: function (callback, errorCallback) {
            sendMessageToDesktop('delete-cache-request', {}, callback, errorCallback);
        },
        exit: function (callback) {
            sendMessageToDesktop('exit-desktop', {}, callback);
        },
        getAllWindows: function (callback, errorCallback) {
            sendMessageToDesktop('get-all-windows', {}, callback, errorCallback);
        },
        getAllApplications: function (callback, errorCallback) {
            sendMessageToDesktop('get-all-applications', {}, callback, errorCallback);
        },
        getCommandLineArguments: function (callback, errorCallback) {
            sendMessageToDesktop('get-command-line-arguments', {}, callback, errorCallback);
        },
        getConfig: function (callback, errorCallback) {
            sendMessageToDesktop('get-config', {}, callback, errorCallback);
        },
        getDeviceId: function (callback, errorCallback) {
            sendMessageToDesktop('get-device-id', {}, callback, errorCallback);
        },
        getLog: function (options, callback, errorCallback) {
          // backwards compatible, if options is just logName string
          if (typeof(options) === 'string') {
            sendMessageToDesktop('view-log', {
                name: options
            }, callback, errorCallback);
          } else {
            sendMessageToDesktop('view-log', {
                name: options.name,
                endFile: options.endFile, 
                sizeLimit: options.sizeLimit
            }, callback, errorCallback);
          }          
        },
        getLogList: function (callback, errorCallback) {
            if (callback) {
                sendMessageToDesktop('list-logs', {}, function (logArray) {
                    logArray.forEach(function (log) {
                        var dateString = log.date;
                        log.date = new Date(dateString);
                    });

                    callback.call(window, logArray);
                }, errorCallback);
            } else {
                sendMessageToDesktop('list-logs', {}, callback, errorCallback);
            }
        },
        getMonitorInfo: function (callback, errorCallback) {
            sendMessageToDesktop('get-monitor-info', {}, callback, errorCallback);
        },
        getMousePosition: function (callback, errorCallback) {
            sendMessageToDesktop('get-mouse-position', {}, callback, errorCallback);
        },
        getProcessList: function (callback, errorCallback) {
            sendMessageToDesktop('process-snapshot', {}, callback, errorCallback);
        },
        getProxySettings: function (callback, errorCallback) {
            sendMessageToDesktop('get-proxy-settings', {}, callback, errorCallback);
        },
        getRemoteConfig: function (url, callback, errorCallback) {
            sendMessageToDesktop('get-remote-config', {
                url: url
            }, callback, errorCallback);
        },
        getVersion: function (callback, errorCallback) {
            sendMessageToDesktop('get-version', {}, callback, errorCallback);
        },
        hideStartWindow: function (callback, errorCallback) {
            sendMessageToDesktop('hide-start-window', {}, callback, errorCallback);
        },
        installDeskbandIcon: function (options, callback, errorCallback) {
            sendMessageToDesktop('install-deskband-icon', {
                enabledIcon: options.enabledIcon,
                disabledIcon: options.disabledIcon,
                hoverIcon: options.hoverIcon
            }, callback, errorCallback);
        },
        installStartIcon: function (options, callback, errorCallback) {
            sendMessageToDesktop('install-start-icon', {
                enabledIcon: options.enabledIcon,
                disabledIcon: options.disabledIcon,
                hoverIcon: options.hoverIcon
            }, callback, errorCallback);
        },
        launchExternalProcess: function(path, commandLine, callback, errorCallback) {
            sendMessageToDesktop('launch-external-process', {
                path: path,
                commandLine: commandLine
            }, callback, errorCallback);
        },
        log: function (level, message, callback) {
            sendMessageToDesktop('write-to-log', {
                level: level,
                message: message
            }, callback);

            if (level == "info") {
                console.log(message);
            } else if (level == "warning") {
                console.warn(message);
            } else if (level == "error") {
                console.error(message);
            }
        },
        openUrlWithBrowser: function (url, callback, errorCallback) {
            sendMessageToDesktop('open-url-with-browser', {
                url: url
            }, callback, errorCallback);
        },
        releaseExternalProcess: function(processUuid, callback, errorCallback) {
            sendMessageToDesktop('release-external-process', {
                uuid: processUuid
            }, callback, errorCallback);
        },
        removeDeskbandIcon: function (callback, errorCallback) {
            sendMessageToDesktop('remove-deskband-icon', {}, callback, errorCallback);
        },
        removeEventListener: function (type, listener, callback, errorCallback) {
            removeDesktopEventCallback({
                topic: "system",
                type: type
            }, listener, callback, errorCallback);
        },
        removeStartIcon: function (callback, errorCallback) {
            sendMessageToDesktop('remove-start-icon', {}, callback, errorCallback);
        },
        setClipboard: function (text, callback, errorCallback) {
            sendMessageToDesktop('set-clipboard', {
                data: text
            }, callback, errorCallback);
        },
        showDeveloperTools: function (applicationUuid, windowName, callback, errorCallback) {
            sendMessageToDesktop('show-developer-tools', {
                uuid: applicationUuid,
                name: windowName
            }, callback, errorCallback);
        },
        showStartWindow: function (callback, errorCallback) {
            sendMessageToDesktop('show-start-window', {}, callback, errorCallback);
        },
        terminateExternalProcess: function(processUuid, timeout, killTree, callback, errorCallback) {
            sendMessageToDesktop('terminate-external-process', {
                uuid: processUuid,
                timeout: timeout,
                child: (killTree? true : false)
            }, callback, errorCallback);
        },
        updateProxySettings: function (type, proxyAddress, proxyPort, callback, errorCallback) {
            sendMessageToDesktop('update-proxy', {
                type: type,
                proxyAddress: proxyAddress,
                proxyPort: proxyPort
            }, callback, errorCallback);
        }
    };

    fin.desktop.Application = function (options, callback, errorCallback) {
        var opt = deepObjCopy(options);

        this.name = opt.name;
        this.uuid = opt.uuid;
        this.mainWindowOptions = opt.mainWindowOptions;

        if (typeof this.mainWindowOptions == "object") {
            this.mainWindowOptions.defaultHeight = Math.floor(this.mainWindowOptions.defaultHeight);
            this.mainWindowOptions.defaultWidth = Math.floor(this.mainWindowOptions.defaultWidth);
            this.mainWindowOptions.defaultTop = Math.floor(this.mainWindowOptions.defaultTop);
            this.mainWindowOptions.defaultLeft = Math.floor(this.mainWindowOptions.defaultLeft);
        }

        if (!opt._noregister) {
            sendMessageToDesktop('create-application', opt, callback, errorCallback);
        }

        this.window = new fin.desktop.Window({
            _noregister: true,
            _nocontentwindow: true,
            uuid: this.uuid,
            name: this.uuid
        });

        this._private = {};

        if(opt) {
            var icon = opt.icon || opt.applicationIcon;
            var mainWindowOptions = opt.mainWindowOptions || {};
            if(!icon && mainWindowOptions) {
                icon = mainWindowOptions.icon || mainWindowOptions.taskbarIcon;
            }

            this._private["icon"] = icon || "";
        }
    };

    fin.desktop.Application.getCurrent = function () {
        if (!this._instance) {
            this._instance = fin.desktop.Application.wrap(applicationUuid);
        }
        return this._instance;
    };

    fin.desktop.Application.getCurrentApplication = function () {
        console.warn("Function is deprecated");
        if (!this._instance) {
            this._instance = fin.desktop.Application.wrap(applicationUuid);
        }
        return this._instance;
    };

    fin.desktop.Application.wrap = function (uuid) {
        return new fin.desktop.Application({
            uuid: uuid,
            _noregister: true
        });
    };

    fin.desktop.Application.invoke = function (uuid, callback, errorCallback) {
        var opt = {uuid: uuid};
        sendMessageToDesktop('invoke-application', opt, callback, errorCallback);
        return fin.desktop.Application.wrap(uuid);
    };

    fin.desktop.Application.prototype = {
        addEventListener: function (type, listener, callback, errorCallback) {

            var subscriptionObject = {
                topic: "application",
                uuid: this.uuid
            };

            // If type is an object unwrap to get configuration
            if(typeof type == "object" && type.data && type.type) {
                subscriptionObject.type = type;
                subscriptionObject.data = type.data;
                // Else use default behavior
            } else {
                subscriptionObject.type = type;
            }

            addDesktopEventCallback(subscriptionObject, listener, this, callback, errorCallback);
        },
        close: function (force, callback, errorCallback) {
            sendMessageToDesktop('close-application', {
                uuid: this.uuid,
                force: force
            }, callback, errorCallback);
        },
        getChildWindows: function(callback, errorCallback) {
            var uuid = this.uuid;
            sendMessageToDesktop('get-child-windows', {
                uuid: uuid
            }, function(evt) {
                var children = [];
                if(evt && typeof Array.isArray(evt)) {
                    for(var i = 0; i < evt.length; ++i) {
                        children.push(fin.desktop.Window.wrap(uuid, evt[i]));
                    }
                }

                if(typeof callback == 'function') callback(children);
            }, errorCallback);
        },
        getGroups: function (callback, errorCallback) {
            var me = this;
            sendMessageToDesktop('get-application-groups', {
                uuid: this.uuid
            }, function(groupInfo) {
                var allGroups = [];
                var currentGroup;
                var groupedWindows;
                if(groupInfo && typeof Array.isArray(groupInfo)) {
                    for(var mainIndex = 0; mainIndex < groupInfo.length; ++mainIndex) {
                        groupedWindows = groupInfo[mainIndex];
                        if(groupedWindows && typeof Array.isArray(groupedWindows)) {
                            currentGroup = [];
                            allGroups.push(currentGroup);

                            for(var subIndex = 0; subIndex < groupedWindows.length; ++subIndex) {
                                currentGroup.push(fin.desktop.Window.wrap(me.uuid, groupedWindows[subIndex]));
                            }
                        }
                    }
                }

                if(typeof callback == 'function') callback(allGroups);
            }, errorCallback);
        },
        getManifest: function (callback, errorCallback) {
            sendMessageToDesktop('get-application-manifest', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        getWindow: function () {
            return this.window;
        },
        grantAccess: function(action, callback, errorCallback) {
            sendMessageToDesktop('grant-access', {
                grantee: this.uuid,
                grantAction: action
            }, callback, errorCallback);
        },
        grantWindowAccess: function(action, windowName, callback, errorCallback) {
            sendMessageToDesktop('grant-window-access', {
                grantee: this.uuid,
                grantAction: action,
                name: windowName // wild card supported
            }, callback, errorCallback);
        },
        isRunning: function (callback, errorCallback) {
            sendMessageToDesktop('is-application-running', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        pingChildWindow: function (name, callback, errorCallback) {
            sendMessageToDesktop("ping-child-window", {
                uuid: this.uuid,
                name: name
            }, callback, errorCallback);
        },
        remove: function (callback, errorCallback) {
            sendMessageToDesktop('remove-application', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        removeEventListener: function (type, listener, callback, errorCallback) {
            removeDesktopEventCallback({
                topic: "application",
                type: type,
                uuid: this.uuid
            }, listener, callback, errorCallback);
        },
        removeTrayIcon: function(callback, errorCallback) {
            var _private = this._private;
            // Remove a prior listener if present.
            if(_private["tray-icon-clicked"]) {
                this.removeEventListener("tray-icon-clicked", _private["tray-icon-clicked"]);
                delete _private["tray-icon-clicked"];
            }

            sendMessageToDesktop('remove-tray-icon', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        restart: function (callback, errorCallback) {
            sendMessageToDesktop('restart-application', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        revokeAccess: function(action, callback, errorCallback) {
            sendMessageToDesktop('revoke-access', {
                grantee: this.uuid,
                grantAction: action
            }, callback, errorCallback);
        },
        revokeWindowAccess: function(action, windowName, callback, errorCallback) {
            sendMessageToDesktop('revoke-window-access', {
                grantee: this.uuid,
                grantAction: action,
                name: windowName // wild card supported
            }, callback, errorCallback);
        },
        run: function (callback, errorCallback) {
            sendMessageToDesktop('run-application', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        send: function (topic, message) {
            fin.desktop.InterApplicationBus.send(this.uuid, topic, message);
        },
        setTrayIcon: function(iconUrl, listener, callback, errorCallback)  {
            var _private = this._private;
            // Remove a prior listener if present.
            if(_private["tray-icon-clicked"]) {
                this.removeEventListener("tray-icon-clicked", _private["tray-icon-clicked"]);
            }
            // track this listner for future removal
            _private["tray-icon-clicked"] = listener;
            var icon = iconUrl || _private.icon;
            this.addEventListener("tray-icon-clicked", listener, callback, errorCallback);
            sendMessageToDesktop('set-tray-icon', {
                uuid: this.uuid,
                enabledIcon: icon,
                disabledIcon: icon,
                hoverIcon: icon
            });
        },
        terminate: function (callback, errorCallback) {
            sendMessageToDesktop('terminate-application', {
                uuid: this.uuid
            }, callback, errorCallback);
        },
        wait: function (callback, errorCallback) {
            sendMessageToDesktop('wait-for-hung-application', {
                uuid: this.uuid
            }, callback, errorCallback);
        }
    };

    var windowList = {};

    fin.desktop.Window = function (options, callback, errorCallback) {
        var opt = deepObjCopy(options);


        opt.defaultHeight = Math.floor(opt.defaultHeight);
        opt.defaultWidth = Math.floor(opt.defaultWidth);
        opt.defaultTop = Math.floor((typeof opt.defaultTop == 'number'? opt.defaultTop : 100 ));
        opt.defaultLeft = Math.floor((typeof opt.defaultLeft == 'number'? opt.defaultLeft : 100 ));

        this.connected = opt.connected;
        this.name = opt.name;
        this.app_uuid = opt.uuid;
        var me = this;

        if (!opt._noregister) {

            opt.uuid = applicationUuid;
            this.app_uuid = opt.uuid;
            var url = opt.url;

            sendMessageToDesktop('register-child-window-settings', opt, function (evt) {

                // Hotfix for paltform implementation differences of window load callback in Mac and Windows.
                if(navigator.userAgent.indexOf("Windows") != -1) {
                    sendMessageToDesktop("register-child-window-load-callback", {
                        uuid: me.app_uuid,
                        name: me.name
                    }, function() {
                        if (callback) callback.call(me);
                    });

                    me.contentWindow = window.open(url, me.name);
                    windowList[me.name] = me.contentWindow;
                } else {
                    me.contentWindow = window.open(url, me.name);
                    windowList[me.name] = me.contentWindow;

                    if ("addEventListener" in me.contentWindow) {
                        me.contentWindow.addEventListener("load", function () {
                            if (callback) callback.call(me);
                        });
                    } else if (callback) callback.call(me);

                }

                //if (callback) callback.call(me);
            }, errorCallback);

        } else {
            if (!opt._nocontentwindow) this.contentWindow = window;
            if (this.name == window.name) {
                this.contentWindow = window;
            } else {
                this.contentWindow = windowList[this.name];
            }
            if (callback) callback.call(me);
        }
    };

    fin.desktop.Window.getCurrentWindow = function() {
        console.warn("Function is deprecated");
        if (!this._instance) {
            this._instance = fin.desktop.Window.wrap(applicationUuid, window.name);
        }
        return this._instance;
    };

    fin.desktop.Window.getCurrent = function() {
        if (!this._instance) {
            this._instance = fin.desktop.Window.wrap(applicationUuid, window.name);
        }
        return this._instance;
    };

    fin.desktop.Window.wrap = function (appUuid, windowName) {
        return new fin.desktop.Window({
            uuid: appUuid,
            name: windowName,
            _noregister: true
        });
    };

    fin.desktop.Window.prototype = {
        addEventListener: function (type, listener, callback, errorCallback) {
            addDesktopEventCallback({
                topic: "window",
                type: type,
                name: this.name,
                uuid: this.app_uuid
            }, listener, this, callback, errorCallback);
        },
        animate: function (transitions, options, callback, errorCallback) {
            sendMessageToDesktop('animate-window', {
                uuid: this.app_uuid,
                name: this.name,
                transitions: transitions,
                options: options
            }, callback, errorCallback);
        },
        blur: function (callback, errorCallback) {
            sendMessageToDesktop('blur-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        bringToFront: function (callback, errorCallback) {
            sendMessageToDesktop('bring-window-to-front', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        close: function(force, callback, errorCallback) {
            sendMessageToDesktop('close-window', {
                uuid: this.app_uuid,
                name: this.name,
                force: force || false
            }, callback, errorCallback);
        },
        disableFrame: function (callback, errorCallback) {
            sendMessageToDesktop('disable-window-frame', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        enableFrame: function (callback, errorCallback) {
            sendMessageToDesktop('enable-window-frame', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        flash: function(options, callback, errorCallback) {
            sendMessageToDesktop('flash-window', {
                uuid: this.app_uuid,
                name: this.name,
                options: options
            }, callback, errorCallback);
        },
        focus: function (callback, errorCallback) {
            sendMessageToDesktop('focus-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        getBounds: function (callback, errorCallback) {
            sendMessageToDesktop('get-window-bounds', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        getGroup: function (callback, errorCallback) {
            var me = this;
            sendMessageToDesktop('get-window-group', {
                uuid: this.app_uuid,
                name: this.name
            }, function(groupInfo) {
                var currentGroup = [];
                if(groupInfo && typeof Array.isArray(groupInfo)) {
                    for(var i = 0; i < groupInfo.length; ++i) {
                        currentGroup.push(fin.desktop.Window.wrap(me.app_uuid, groupInfo[i]));
                    }
                }

                if(typeof callback == 'function') callback(currentGroup);
            }, errorCallback);
        },
        getNativeWindow: function () {
            return this.contentWindow;
        },
        getOptions: function(callback, errorCallback) {
            sendMessageToDesktop('get-window-options', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        getParentApplication: function() {
            return fin.desktop.Application.wrap(this.app_uuid);
        },
        getParentWindow: function() {
            return this.getParentApplication().getWindow();
        },
        getSnapshot: function (callback, errorCallback) {
            sendMessageToDesktop('get-window-snapshot', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        getState: function (callback, errorCallback) {
            sendMessageToDesktop('get-window-state', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        hide: function (callback, errorCallback) {
            sendMessageToDesktop('hide-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        isShowing: function (callback, errorCallback) {
            sendMessageToDesktop('is-window-showing', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        joinGroup: function (target, callback, errorCallback) {
            sendMessageToDesktop('join-window-group', {
                uuid: this.app_uuid,
                name: this.name,
                groupingWindowName: target.name
            }, callback, errorCallback);
        },
        leaveGroup: function (callback, errorCallback) {
            sendMessageToDesktop('leave-window-group', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        maximize: function (callback, errorCallback) {
            sendMessageToDesktop('maximize-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        mergeGroups: function (target, callback, errorCallback) {
            sendMessageToDesktop('merge-window-groups', {
                uuid: this.app_uuid,
                name: this.name,
                groupingWindowName: target.name
            }, callback, errorCallback);
        },
        minimize: function (callback, errorCallback) {
            sendMessageToDesktop('minimize-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        moveBy: function (deltaLeft, deltaTop, callback, errorCallback) {
            sendMessageToDesktop('move-window-by', {
                uuid: this.app_uuid,
                name: this.name,
                deltaTop: Math.floor(deltaTop),
                deltaLeft: Math.floor(deltaLeft)
            }, callback, errorCallback);
        },
        moveTo: function (left, top, callback, errorCallback) {
            sendMessageToDesktop('move-window', {
                uuid: this.app_uuid,
                name: this.name,
                top: Math.floor(top),
                left: Math.floor(left)
            }, callback, errorCallback);
        },
        redirect: function (url) {
            if (this.contentWindow != undefined) {
                if (this.contentWindow != window)
                    this.contentWindow = window.open(url, this.name);
                else
                    window.location.href = url;
            } else {
                throw new Error("Cannot redirect url of application");
            }
        },
        removeEventListener: function (type, listener, callback, errorCallback) {
            removeDesktopEventCallback({
                topic: "window",
                type: type,
                name: this.name,
                uuid: this.app_uuid
            }, listener, callback, errorCallback);
        },
        resizeBy: function (deltaWidth, deltaHeight, anchor, callback, errorCallback) {
            sendMessageToDesktop('resize-window-by', {
                uuid: this.app_uuid,
                name: this.name,
                deltaWidth: Math.floor(deltaWidth),
                deltaHeight: Math.floor(deltaHeight),
                anchor: anchor
            }, callback, errorCallback);
        },
        resizeTo: function (width, height, anchor, callback, errorCallback) {
            sendMessageToDesktop('resize-window', {
                uuid: this.app_uuid,
                name: this.name,
                width: Math.floor(width),
                height: Math.floor(height),
                anchor: anchor
            }, callback, errorCallback);
        },
        restore: function (callback, errorCallback) {
            sendMessageToDesktop('restore-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        setAsForeground: function(callback, errorCallback) {
            sendMessageToDesktop('set-foreground-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        setBounds: function(left, top, width, height, callback, errorCallback) {
            sendMessageToDesktop('set-window-bounds', {
                uuid: this.app_uuid,
                name: this.name,
                left: left,
                top: top,
                width: width,
                height: height
            }, callback, errorCallback);
        },
        show: function (callback, errorCallback) {
            sendMessageToDesktop('show-window', {
                uuid: this.app_uuid,
                name: this.name
            }, callback, errorCallback);
        },
        showAt: function (left, top, toggle, callback, errorCallback) {
            sendMessageToDesktop('show-at-window', {
                uuid: this.app_uuid,
                name: this.name,
                top: Math.floor(top),
                left: Math.floor(left),
                toggle: toggle
            }, callback, errorCallback);
        },
        updateOptions: function (options, callback, errorCallback) {
            sendMessageToDesktop('update-window-options', {
                uuid: this.app_uuid,
                name: this.name,
                options: options
            }, callback, errorCallback);
        }
    };

    var notificationEventCallbackMap = {};

    function processNotificationEvent(message) {

        var type = message.type;
        var callback;

        var notificationId = message.payload.notificationId;

        if (typeof notificationId != "undefined") {
            var events = notificationEventCallbackMap[notificationId];

            if (events) {
                if (type == "message") {
                    callback = events.onMessage;
                    if (typeof callback == "function") {
                        callback.call(window, message.payload.message);
                    }
                    return;
                } else if (type == "show") {
                    callback = events.onShow;
                } else if (type == "close") {
                    callback = events.onClose;
                    delete notificationEventCallbackMap[notificationId];
                } else if (type == "error") {
                    callback = events.onError;

                    if (typeof callback == "function") {
                        callback.call(window, message.payload.reason);
                    }
                    return;
                } else if (type == "click") {
                    callback = events.onClick;
                } else if (type == "dismiss") {
                    callback = events.onDismiss;
                }

                if (typeof callback == "function") {
                    callback.call(window);
                }

            }
        }

    }


    var currentNotification;
    var notificationToken;



    function processActionFromNotificationsCenter(payload) {
        console.log('message received from openfin');

        var type = payload.type;
        var callback;

        if (type == "message") {
            callback = window.onNotificationMessage;
            if (typeof callback == "function") {
                callback.call(window, payload.payload.message);
            }
        } else if (type == "initialize-notification") {
            notificationToken = payload.payload.token;
            callback = window.onNotificationMessage;

            if (typeof callback == "function") {
                callback.call(window, payload.payload.message);
            }

            window.addEventListener('click', function () {
                if (currentNotification) {
                    sendActionToNotificationsCenter("click-notification", {
                        token: notificationToken
                    });
                }
            });


            window.addEventListener('mouseover', function (evt) {
                if (evt.fromElement == null) {
                    sendActionToNotificationsCenter("update-mouse-position", {
                        token: notificationToken,
                        isMouseOver: true
                    });
                }
            });

            window.addEventListener('mouseout', function (evt) {
                if (evt.toElement == null) {
                    sendActionToNotificationsCenter("update-mouse-position", {
                        token: notificationToken,
                        isMouseOver: false
                    });
                }
            });

        } else if (type == "register-drag-handler") {
            registerDragHandler(window, {
                onDragStart: function (x, y) {
                    sendDragEvent("dragstart", x, y, window.screenX, window.screenY);
                },
                onDrag: function (x, y) {
                    sendDragEvent("drag", x, y, window.screenX, window.screenY);
                },
                onDragEnd: function (x, y) {
                    sendDragEvent("dragend", x, y, window.screenX, window.screenY);
                },
                onClick: function(x, y) {
                    sendDragEvent("clicked", x, y, window.screenX, window.screenY);
                }
            }, payload.payload.options);

            function sendDragEvent(type, x, y, screenX, screenY) {
                sendActionToNotificationsCenter("fire-drag-event", {
                    action: type,
                    token: notificationToken,
                    payload: {
                        x: x,
                        y: y,
                        screenX: screenX,
                        screenY: screenY
                    }
                });
            }
        }
    }

    function sendActionToNotificationsCenter(action, payload, callback) {
        sendMessageToDesktop("send-action-to-notifications-center", {
            action: action,
            payload: payload
        }, callback);
    }


    (function () {

        var notificationId = 0;

        fin.desktop.Notification = function (options, callback, errorCallback) {

            var me = this;
            if (!options._noregister) {

                sendActionToNotificationsCenter("create-notification", {
                    url: qualifyURL(options.url),
                    notificationId: notificationId,
                    message: options.message,
                    timeout: options.timeout
                }, callback, errorCallback);


                notificationEventCallbackMap[notificationId] = {
                    onClose: options.onClose,
                    onClick: options.onClick,
                    onError: options.onError,
                    onShow: options.onShow,
                    onMessage: options.onMessage,
                    onDismiss: options.onDismiss
                };

                me.notificationId = notificationId;
                notificationId++;

            } else {
                // return a blank object
            }

            function qualifyURL(url) {
                var a = document.createElement('a');
                a.href = url;
                return a.href;
            }

        };

        fin.desktop.Notification.prototype = {
            close: function (callback) {
                sendActionToNotificationsCenter("close-notification", {
                    notificationId: this.notificationId,
                    token: notificationToken
                }, callback);
            },
            sendMessage: function (message, callback) {
                sendActionToNotificationsCenter("send-notification-message", {
                    notificationId: this.notificationId,
                    message: message,
                    token: notificationToken
                }, callback);
            },
            sendMessageToApplication: function (message, callback) {
                sendActionToNotificationsCenter("send-application-message", {
                    notificationId: this.notificationId,
                    message: message,
                    token: notificationToken
                }, callback);
            }
        };

        fin.desktop.Notification.getCurrentNotification = function () {
            console.warn("Function is deprecated");
            return currentNotification;
        };

        fin.desktop.Notification.getCurrent = function () {
            return currentNotification;
        };

        currentNotification = new fin.desktop.Notification({
            _noregister: true
        });


    })();


    /**
     * @class InterApplicationBus A messaging bus that allows for pub / sub messaging between different applications.
     *
     * @constructor
     */

    fin.desktop.InterApplicationBus = function () {

    };

    fin.desktop.InterApplicationBus.prototype.constructor = fin.desktop.InterApplicationBus;

    fin.desktop.InterApplicationBus.publish = function (topic, message) {
        sendMessageToDesktop('publish-message', {
            topic: topic,
            message: message
        });
    };

    fin.desktop.InterApplicationBus.send = function (destinationUuid, topic, message) {
        sendMessageToDesktop('send-message', {
            destinationUuid: destinationUuid,
            topic: topic,
            message: message
        });
    };

    function resubscribeToInterAppBusAfterLostConnection() {

        // Resubscribe to interappbus messages
        for (var senderUuid in interAppBusCallbackMap) {
            for (var topic in interAppBusCallbackMap[senderUuid]) {
                if (interAppBusCallbackMap[senderUuid][topic] && interAppBusCallbackMap[senderUuid][topic].length > 0) {
                    sendMessageToDesktop("subscribe", {
                       sourceUuid: senderUuid,
                        topic: topic
                    });
                }
            }
        }
    }

    fin.desktop.InterApplicationBus.subscribe = function (senderUuid, topic, callback) {
        var cbm = interAppBusCallbackMap;
        cbm[senderUuid] = cbm[senderUuid] || {};
        cbm[senderUuid][topic] = cbm[senderUuid][topic] || [];
        cbm[senderUuid][topic].push(callback);

        if (cbm[senderUuid][topic].length == 1) {
            sendMessageToDesktop('subscribe', {
                sourceUuid: senderUuid,
                topic: topic
            });
        }

    };

    fin.desktop.InterApplicationBus.unsubscribe = function (senderUuid, topic, callback) {
        var cbs = interAppBusCallbackMap[senderUuid][topic];
        if (cbs !== undefined) {
            cbs.splice(cbs.lastIndexOf(callback),1);
            if (cbs.length == 0) {
                sendMessageToDesktop('unsubscribe', {
                    sourceUuid: senderUuid,
                    topic: topic
                });
            }
        }
    };

    var subscribeCallbacks = [];

    fin.desktop.InterApplicationBus.addSubscribeListener = function (listener) {
        subscribeCallbacks.push(listener);
    };

    fin.desktop.InterApplicationBus.removeSubscribeListener = function (listener) {
        var index = subscribeCallbacks.indexOf(listener);
        subscribeCallbacks.splice(index,1);
    };

    var unsubscribeCallbacks = [];

    fin.desktop.InterApplicationBus.addUnsubscribeListener = function (listener) {
        unsubscribeCallbacks.push(listener);
    };

    fin.desktop.InterApplicationBus.removeUnsubscribeListener = function (listener) {
        var index = unsubscribeCallbacks.indexOf(listener);
        unsubscribeCallbacks.splice(index,1);
    };

    function dispatchToSubscribeListeners(uuid, topic) {
        subscribeCallbacks.forEach(function (callback) {
            callback(uuid, topic);
        });
    }

    function dispatchToUnsubscribeListeners(uuid, topic) {
        unsubscribeCallbacks.forEach(function (callback) {
            callback(uuid, topic);
        });
    }

    fin.desktop.InterApplicationBus.prototype = {
        /**
         * Publishes a message on the specified topic.
         * @param {string} topic - Required The topic on which the message is published.
         * @param {object} message - Required A JSON object message to be published.
         */
        publish: fin.desktop.InterApplicationBus.publish,
        /**
         * Sends a message to a specific application on a specific topic.
         * @param {string} applicationId - Required The id of an application to which the message is sent.
         * @param {string} topic - Required The topic on which the message is published.
         * @param {object} message - Required A JSON object message to be published.
         */
        send: fin.desktop.InterApplicationBus.send,
        /**
         * Subscribes a callback to messages originating from a specific application and topic.
         * @param {string} applicationId - Required The id of an application to which the client subscribes.
         * @param {string} topic - Required The topic to which the client subscribes.
         * @param {function} callback - Required A callback which is called whenever a message is generated
         *                              from the application on the specified topic. Receives the applicationId,
         *                              topic and message.
         */
        subscribe: fin.desktop.InterApplicationBus.subscribe,
        /**
         * Unsubscribes a callback to messages originating from a specific application and topic.
         * @param {string} applicationId - Required The id of an application from which the client unsubscribes.
         * @param {string} topic - Required The topic from which the client unsubscribes.
         * @param {function} callback - Required The subscribed callback.
         */
        unsubscribe: fin.desktop.InterApplicationBus.unsubscribe
    };

    function deepObjCopy (dupeObj) {
        var retObj;
        if (typeof(dupeObj) == 'object') {
            if (Array.isArray(dupeObj))
                retObj = [];
            else
                retObj = {};
            for (var objInd in dupeObj) {
                if (typeof(dupeObj[objInd]) == 'object') {
                    retObj[objInd] = deepObjCopy(dupeObj[objInd]);
                } else if (typeof(dupeObj[objInd]) == 'string') {
                    retObj[objInd] = dupeObj[objInd];
                } else if (typeof(dupeObj[objInd]) == 'number') {
                    retObj[objInd] = dupeObj[objInd];
                } else if (typeof(dupeObj[objInd]) == 'boolean') {
                    ((dupeObj[objInd]) ? retObj[objInd] = true : retObj[objInd] = false);
                } else if (typeof (dupeObj[objInd]) == 'function') {
                    retObj[objInd] = dupeObj[objInd];
                }
            }
        } else {
            retObj = dupeObj;
        }
        return retObj;
    }


    function registerDragHandler(wnd, handlers, options) {
        var mouseDown = false;
        var mouseMoved = false;

        var onDrag = handlers.onDrag,
            onDragEnd = handlers.onDragEnd,
            onDragStart = handlers.onDragStart,
            onClick = handlers.onClick;

        var x_offset, y_offset;
        var OPTIONS = options || {};
        var THRESH = OPTIONS.thresh || 3;
        var TARGET = OPTIONS.target;

        wnd.addEventListener('mousedown', function (e) {
            if (e.button == 0) {
                mouseDown = true;
                x_offset = e.x;
                y_offset = e.y;
            }
        });


        wnd.addEventListener('mousemove', function (e) {
            if (mouseDown) {

                if (!mouseMoved && Math.sqrt(Math.pow((e.x - x_offset), 2) + Math.pow((e.y - y_offset), 2)) >= THRESH) {
                    mouseMoved = true;
                    fin.desktop.System.getMousePosition(function (evt) {
                        var y = parseInt(evt.top);
                        var x = parseInt(evt.left);

                        if (onDragStart) onDragStart(x-x_offset, y-y_offset);
                    });
                }

                if (mouseMoved)  {
                    fin.desktop.System.getMousePosition(function (evt) {
                        var y = parseInt(evt.top);
                        var x = parseInt(evt.left);

                        if (onDrag) onDrag(x-x_offset, y-y_offset);
                    });
                }
            }
        });


        wnd.addEventListener('mouseup', function (e) {
            var initialMouseMoved = mouseMoved;

            if (e.button == 0) {
                if (mouseMoved) {
                    fin.desktop.System.getMousePosition(function (evt) {
                        var y = parseInt(evt.top);
                        var x = parseInt(evt.left);

                        if (onDragEnd) onDragEnd(x-x_offset,y-y_offset);
                    });
                }

                mouseDown = false;
                mouseMoved = false
            }

            if(!initialMouseMoved) {
                fin.desktop.System.getMousePosition(function (evt) {
                    var y = parseInt(evt.top);
                    var x = parseInt(evt.left);
                    if (onClick) onClick(x-x_offset,y-y_offset);
                });
            }
        });
    }

    fin.desktop._dispatchNotificationEvent = function (destinationUuid, destinationName, type, payload) {
        sendMessageToDesktop("dispatch-notification-event", {
            destinationUuid: destinationUuid,
            destinationName: destinationName,
            payload: {
                type: type,
                payload: payload
            }
        });
    };

    fin.desktop._sendActionToNotification = function (destinationName, type, payload) {
        sendMessageToDesktop("send-action-to-notification", {
            destinationName: destinationName,
            payload: {
                type: type,
                payload: payload
            }
        });
    };
})();