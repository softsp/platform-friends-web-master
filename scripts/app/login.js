/**
 * Login view model
 */

var app = app || {};

app.Login = (function () {
    'use strict';

    var loginViewModel = (function () {

        var $loginUsername;
        var $loginPassword;
        var isHttp = (appSettings.everlive.scheme === 'http');

        var isFacebookLogin = app.isKeySet(appSettings.facebook.appId) && app.isKeySet(appSettings.facebook.redirectUri);
        var isGoogleLogin = app.isKeySet(appSettings.google.clientId) && app.isKeySet(appSettings.google.redirectUri);
        var isLiveIdLogin = app.isKeySet(appSettings.liveId.clientId) && app.isKeySet(appSettings.liveId.redirectUri);
        var isAdfsLogin = app.isKeySet(appSettings.adfs.adfsRealm) && app.isKeySet(appSettings.adfs.adfsEndpoint);
        var isAnalytics = analytics.isAnalytics();

        var init = function () {

            if (!app.isKeySet(appSettings.everlive.apiKey)) {
                app.mobileApp.navigate('views/noApiKey.html', 'fade');
            }

            $loginUsername = $('#loginUsername');
            $loginPassword = $('#loginPassword');

            if (!isFacebookLogin) {
                $('#loginWithFacebook').addClass('disabled');
                console.log('Facebook Client ID and/or Redirect URI not set. You cannot use Facebook login.');
            }
            if (!isGoogleLogin) {
                $('#loginWithGoogle').addClass('disabled');
                console.log('Google Client ID and/or Redirect URI not set. You cannot use Google login.');
            }
            if (!isLiveIdLogin) {
                $('#loginWithLiveID').addClass('disabled');
                console.log('LiveID Client ID and/or Redirect URI not set. You cannot use LiveID login.');
            }
            if (!isAdfsLogin) {
                $('#loginWithADSF').addClass('disabled');
                console.log('ADFS Realm and/or Endpoint not set. You cannot use ADFS login.');
            }
            if (!isAnalytics) {
                console.log('EQATEC product key is not set. You cannot use EQATEC Analytics service.');
            }
        };

        var show = function () {
            $loginUsername.val('');
            $loginPassword.val('');
        };

        var getYear = function () {
            var currentTime = new Date();
            return currentTime.getFullYear();
        };

        // Authenticate to use Backend Services as a particular user
        var login = function () {

            var username = $loginUsername.val();
            var password = $loginPassword.val();

            // Authenticate using the username and password
            app.everlive.Users.login(username, password)
            .then(function () {
                // EQATEC analytics monitor - track login type
                if (isAnalytics) {
                    analytics.Start();
                    analytics.TrackFeature('Login.Regular');
                }

                return app.Users.load();
            })
            .then(function () {

                app.mobileApp.navigate('views/activitiesView.html');
            })
            .then(null,
                  function (err) {
                      app.showError(err.message);
                  }
            );
        };

        // Authenticate using Facebook credentials
        var loginWithFacebook = function() {

            if (!isFacebookLogin) {
                return;
            }

            var facebook = new FacebookIdentityProvider(appSettings.facebook.appId);
            facebook.init();
            app.mobileApp.showLoading();

            facebook.getAccessToken(function(token) {
                if (token) {
                    app.everlive.Users.loginWithFacebook(token)
                    .then(function () {
                        // EQATEC analytics monitor - track login type
                        if (isAnalytics) {
                            analytics.Start();
                            analytics.TrackFeature('Login.Facebook');
                        }
                        return app.Users.load();
                    })
                    .then(function () {
                        app.mobileApp.hideLoading();
                        app.mobileApp.navigate('views/activitiesView.html');
                    })
                    .then(null, function (err) {
                        app.mobileApp.hideLoading();
                        if (err.code == 214) {
                            app.showError('The specified identity provider is not enabled in the backend portal.');
                        } else {
                            app.showError(err.message);
                        }
                    });
                } else {
                    app.mobileApp.hideLoading();
                }
            });
        };

        var loginWithGoogle = function () {

            if (!isGoogleLogin) {
                return;
            }
            var googleConfig = {
                name: 'Google',
                loginMethodName: 'loginWithGoogle',
                endpoint: 'https://accounts.google.com/o/oauth2/auth',
                response_type: 'token',
                client_id: appSettings.google.clientId,
                redirect_uri: appSettings.google.redirectUri,
                scope: 'https://www.googleapis.com/auth/userinfo.profile',
                access_type: 'online',
                display: 'touch'
            };
            var google = new IdentityProvider(googleConfig);
            app.mobileApp.showLoading();

            google.getAccessToken(function(token) {
                app.everlive.Users.loginWithGoogle(token)
                .then(function () {
                    // EQATEC analytics monitor - track login type
                    if (isAnalytics) {
                        analytics.Start();
                        analytics.TrackFeature('Login.Google');
                    }
                    return app.Users.load();
                })
                .then(function () {
                    app.mobileApp.hideLoading();
                    app.mobileApp.navigate('views/activitiesView.html');
                })
                .then(null, function (err) {
                    app.mobileApp.hideLoading();
                    if (err.code == 214) {
                        app.showError('The specified identity provider is not enabled in the backend portal.');
                    } else {
                        app.showError(err.message);
                    }
                });
            });
        };

        var loginWithLiveID = function () {

            if (!isLiveIdLogin) {
                return;
            }
            var liveIdConfig = {
                name: 'LiveID',
                loginMethodName: 'loginWithLiveID',
                endpoint: 'https://login.live.com/oauth20_authorize.srf',
                response_type: 'token',
                client_id: appSettings.liveId.clientId,
                redirect_uri: appSettings.liveId.redirectUri,
                scope: 'wl.basic',
                access_type: 'online',
                display: 'touch'
            };
            var liveId = new IdentityProvider(liveIdConfig);
            app.mobileApp.showLoading();

            liveId.getAccessToken(function(token) {
                app.everlive.Users.loginWithLiveID(token)
                .then(function () {
                    // EQATEC analytics monitor - track login type
                    if (isAnalytics) {
                        analytics.Start();
                        analytics.TrackFeature('Login.LiveID');
                    }
                    return app.Users.load();
                })
                .then(function () {
                    app.mobileApp.hideLoading();
                    app.mobileApp.navigate('views/activitiesView.html');
                })
                .then(null, function (err) {
                    app.mobileApp.hideLoading();
                    if (err.code == 214) {
                        app.showError('The specified identity provider is not enabled in the backend portal.');
                    } else {
                        app.showError(err.message);
                    }
                });
            });
        };

        var loginWithADSF = function () {

            if (!isAdfsLogin) {
                return;
            }
            if (isHttp) {
                alert('ADFS authentication can be done via HTTPS only.');
                return;
            }
            var adfsConfig = {
                name: 'ADFS',
                loginMethodName: 'loginWithADFS',
                endpoint: appSettings.adfs.adfsEndpoint,
                wa: 'wsignin1.0',
                wtrealm: appSettings.adfs.adfsRealm
            };
            var adfs = new IdentityProvider(adfsConfig);
            app.mobileApp.showLoading();

            adfs.getAccessToken(function(token) {
                app.everlive.Users.loginWithADFS(token)
                .then(function () {
                    // EQATEC analytics monitor - track login type
                    if (isAnalytics) {
                        analytics.Start();
                        analytics.TrackFeature('Login.ADFS');
                    }
                    return app.Users.load();
                })
                .then(function () {
                    app.mobileApp.hideLoading();
                    app.mobileApp.navigate('views/activitiesView.html');
                })
                .then(null, function (err) {
                    app.mobileApp.hideLoading();
                    if (err.code == 214) {
                        app.showError('The specified identity provider is not enabled in the backend portal.');
                    } else {
                        app.showError(err.message);
                    }
                });
            });
        };

        return {
            init: init,
            show: show,
            getYear: app.getYear,
            login: login,
            loginWithFacebook: loginWithFacebook,
            loginWithGoogle: loginWithGoogle,
            loginWithLiveID: loginWithLiveID,
            loginWithADSF: loginWithADSF
        };

    }());

    return loginViewModel;

}());

