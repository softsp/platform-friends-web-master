function getParameterByName(name, url) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regexS = name + '=([^&#]*)';

    var regex = new RegExp(regexS);
    var results = regex.exec(url);

    if (results == null) {
        return false;
    } else {
        return decodeURIComponent(results[1].replace(/\+/g, ' '));
    }
}

var IdentityProvider = function (config) {
    var that = this;

    this.getAccessToken = function(callback) {

        // Begin Authorization
        var authorize_url;

        if (config.name == 'ADFS') {
            authorize_url = config.endpoint
                            + '?wa=' + config.wa
                            + '&wreply=' + config.wtrealm + '/adfs/token'
                            + '&wtrealm=' + config.wtrealm;
        } else {
            authorize_url = config.endpoint
                            + '?response_type=' + config.response_type
                            + '&client_id=' + config.client_id
                            + '&redirect_uri=' + config.redirect_uri
                            + '&display=' + config.display
                            + '&access_type=' + config.access_type
                            + '&scope=' + config.scope;
        }

        //CALL IN APP BROWSER WITH THE LINK
        ref = window.open(authorize_url, '_blank', 'location=no');

        var pollTimer = window.setInterval(function() {
            try {
                if (ref.document.URL.indexOf(config.redirect_uri) != -1 || ref.document.URL.indexOf('access_token') != -1) {
                    that.locationChanged(ref.document.URL, callback);
                    window.clearInterval(pollTimer);
                }
            } catch(e) { }
        }, 500);
    }

    this.locationChanged = function(loc, callback) {
        if (loc.indexOf('access_token=') != -1) {
            ref.close();
            var token = getParameterByName('access_token', loc);
            callback(token);
        }
    }
}
