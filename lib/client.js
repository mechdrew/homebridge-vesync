let FormData = require('form-data');
let moment = require('moment');
const HyperRequest = require('hyper-request');

module.exports = class EtekCityClient {

    constructor(log) {
        this.client = new HyperRequest({
            baseUrl: 'https://server1.vesync.com:4007',
            disablePipe: true,
            respondWithProperty: false,
            parserFunction: function (data) {
                return JSON.parse(data.replace(/\\/g, '').replace('"[', '[').replace(']"', ']'));
            }
        });
        this.log = log
        this.lastLogin = moment('2000-01-01')
    }

    login(username, password) {
        // If token has been set in last 24 hours, don't log in again
        if (this.lastLogin.isAfter(moment().subtract(24, 'hours'))) {
            return Promise.resolve();
        }

        let formData = new FormData();
        formData.append('Account', username);
        formData.append('Password', password);
        formData.append('AppVersion', '1.70.2');
        formData.append('AppVersionCode', '111');
        formData.append('OS', 'Android');

        return this.client.post('/login', {
            headers: Object.assign({
                password: password,
                account: username,
                'Content-Type': 'application/x-www-form-urlencoded'
            }, formData.getHeaders())
        }).then((response) => {
            this.token = response.tk;
            this.uniqueId = response.id;
            this.lastLogin = moment();
        });
    }

    getDevices() {
        return this.client.post('/loadMain', {
            headers: {
                tk: this.token,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
        }).then((response) => {
            let devices = response.devices.map((device) => {
                return {
                    id: device.id,
                    name: device.deviceName,
                    status: device.relay
                };
            });
            return devices;
        });
    }

    turnOn(deviceId) {
        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('uri', '/relay');
        formData.append('action', 'open');

        return this.client.post('/devRequest', {
            headers: Object.assign({
                tk: this.token,
                id: this.uniqueId,
                uniqueId: this.uniqueId,
                'Content-Type': 'application/x-www-form-urlencoded'
            }, formData.getHeaders()),
            body : {
                cid : deviceId,
                uri : '/relay',
                action : 'open'
            }
        }).then(response => {
            return response;
        });
    }

    turnOff(deviceId) {
        let formData = new FormData();
        formData.append('cid', deviceId);
        formData.append('uri', '/relay');
        formData.append('action', 'break');

        return this.client.post('/devRequest', {
            headers: Object.assign({
                tk: this.token,
                id: this.uniqueId,
                uniqueId: this.uniqueId,
                'Content-Type': 'application/x-www-form-urlencoded'
            }, formData.getHeaders()),
            body : {
                cid : deviceId,
                uri : '/relay',
                action : 'break'
            }
        }).then(response => {
            return response;
        });
    }

};
