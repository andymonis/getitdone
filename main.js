// Knockout is included

import V3Store from "/vee3/vee_store.js";

import Model from "./model.js";

export default class Main {
    constructor(config) {
        try {
            this.$api = config.api;
            // Set app instanceId into store
            V3Store.instanceId(config.app.instancedid);
            // Create the model and 
            this.model = new Model();
            // Apply the Knockout bindings
            ko.applyBindings(this.model);
        } catch (ex) {
            console.log(ex.message);
        }
    }

    async init(config) {
        try {
            // init code
            this.model.action_load();
            // Continually check server for changes
            setInterval(this.model.remote_load.bind(this.model), 5000);
        } catch (ex) {
            console.log(ex.message);
        }
    }
}