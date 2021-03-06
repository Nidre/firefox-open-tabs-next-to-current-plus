const Cu = Components.utils;

Cu.import("resource://gre/modules/Services.jsm");

const extensionResource = "chrome://opentabsnexttocurrentplus/content/OpenTabsNextToCurrentPlus.jsm";
const defaultPreferencesLoaderLink = 'chrome://opentabsnexttocurrentplus/content/prefLoader.jsm';

var initFunction = function(domWindow) {
    Cu.import(extensionResource);
    domWindow.gOpenTabsNextToCurrentPlus = new OpenTabsNextToCurrentPlus();
    domWindow.gOpenTabsNextToCurrentPlus.initialize(domWindow);
};

var destroyFunction = function(domWindow) {
    domWindow.gOpenTabsNextToCurrentPlus.destroy();
    domWindow.gOpenTabsNextToCurrentPlus = undefined;
    Cu.unload(extensionResource);
};

function simpleToDomWindow(aWindow) {
    return aWindow.QueryInterface(Components.interfaces.nsIDOMWindow);
}

function toDomWindow(aWindow) {
    return aWindow
              .QueryInterface(Components.interfaces.nsIInterfaceRequestor)
              .getInterface(Components.interfaces.nsIDOMWindowInternal ||
                  Components.interfaces.nsIDOMWindow);
}

var windowListener = {
    onOpenWindow: function (aWindow) {
        var domWindow = toDomWindow(aWindow);
        var onLoadFunction = function() {
            domWindow.removeEventListener("load", arguments.callee, false);
            initFunction(domWindow);
        };
        domWindow.addEventListener("load", onLoadFunction, false);
    },
    onCloseWindow: function (aWindow) {},
    onWindowTitleChange: function (aWindow, aTitle) {}
};

var windowMediator =
    Components.classes["@mozilla.org/appshell/window-mediator;1"]
        .getService(Components.interfaces.nsIWindowMediator);

function callOnOpenWindows(someFunction) {
    var openWindows = windowMediator.getEnumerator("navigator:browser");
    while (openWindows.hasMoreElements()) {
        someFunction(simpleToDomWindow(openWindows.getNext()));
    }
}

function install() {}
function uninstall() {}
function startup(data, reason) {
    loadDefaultPreferences(data.installPath);
    callOnOpenWindows(initFunction);
    windowMediator.addListener(windowListener);
}
function shutdown(data, reason) {
  if (reason != APP_SHUTDOWN) unloadDefaultPreferences();

    windowMediator.removeListener(windowListener);
    callOnOpenWindows(destroyFunction);
}

function loadDefaultPreferences(installPath) {
    Cu.import(defaultPreferencesLoaderLink);

    PrefLoader.loadDefaultPrefs(installPath,"prefs.js")
}
function unloadDefaultPreferences() {
    PrefLoader.clearDefaultPrefs("extensions.opentabsnexttocurrentplus.");

    Cu.unload(defaultPreferencesLoaderLink);
}
