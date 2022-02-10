/**
 * Model
 */

import V3Store from "/vee3/vee_store.js";

var $O = ko.observable;
var $OA = ko.observableArray;
var $JS = ko.toJS;

class Card {
    constructor(config = {}) {
        // id The id of the card, used to find later on
        this.id = config.id || Date.now();
        // desc The description of the card 
        this.desc = $O(config.desc || "");
        // list_name The name of the current list
        this.list_name = config.list_name || "";
        // subscriber for card changes
        this.on_change = () => {};
        this.desc.subscribe(() => {
            this.on_change()
        });
    }
}

class List {
    constructor(config) {
        // 
        this.name = config.name;
        // 
        this.cards = $OA([]);
        // Call back function when list is updated
        this.on_change = () => {};
        // Set a subscriber to the Cards List
        this.cards.subscribe(() => { this.on_change() });

    }

    parse(list) {
        let cards = list.cards;
        for (let i = 0; i < cards.length; i++) {
            this.add(new Card(cards[i]));
        }
    }

    add(card) {
        // set the list_name in the card
        card.list_name = this.name;
        // Add a card property change listener
        card.on_change = this.on_change;
        // add the card to list
        this.cards.push(card);
    }

    del(card_id) {
        let pos = -1;
        // Loop over cards until found
        for (let i = 0; i < this.cards().length; i++) {
            let card = this.cards()[i];
            if (card.id === card_id) {
                pos = i;
            }
        }
        // Remove the card
        let card = this.cards.splice(pos, 1);
        return card[0];
    }

    clear() {
        this.cards([]);
    }
}

class Model {
    constructor(api) {
        this.promotions = ["todo", "doing", "done"];

        /**
         * Properties
         */
        // Create an empty timestamp
        this.ts = 0;
        // dirty A flag to indicate the model has chanegd
        this.dirty = false;
        // name The name of the APP
        this.name = $O("get it done");
        // todos The list of things To Do
        this.todo = new List({ name: "todo" });
        // doing The list of things in progress
        this.doing = new List({ name: "doing" });
        // done The list of things that are done
        this.done = new List({ name: "done" });

        /**
         * Subscribers
         */
        this.todo.on_change = () => { this.action_save() };
        this.doing.on_change = () => { this.action_save() };
        this.done.on_change = () => { this.action_save() };

        /**
         * Handlers
         */
        this.new_todo = (data, evt) => {
            // Create new Card
            let card = new Card({ desc: "<description>" });
            // Add to todos
            this.todo.add(card);
        }

        this.demote = (data, evt) => {
            let list_name = data.list_name;
            let index = this.promotions.indexOf(list_name);
            let prev = index - 1;
            // delete existing
            let card = this[this.promotions[index]].del(data.id);
            if (prev >= 0) {
                // Add to next list
                this[this.promotions[prev]].add(card);
            }
        }

        this.promote = (data, evt) => {
            let list_name = data.list_name;
            let index = this.promotions.indexOf(list_name);
            let next = index + 1;
            // delete existing
            let card = this[this.promotions[index]].del(data.id);
            if (next < this.promotions.length) {
                // Add to next list
                this[this.promotions[next]].add(card);
            }
        }

        this.save = (data, evt) => { this.remote_save(); }
        this.load = (data, evt) => { this.remote_load(); }

        // expose model for debugging
        window.model = this;
    }

    action_load() {
        let tasks = V3Store.$local_get("tasks");
        if (tasks !== null) {
            // Parse this lists
            this.todo.parse(tasks.todo)
            this.doing.parse(tasks.doing)
            this.done.parse(tasks.done)
        }
    }

    async action_save(_note) {
        // Set the dirty flag to store on server
        this.dirty = true;
        // Update the timestamp
        this.ts = Date.now();
        // Create an export packet
        let packet = {
            todo: $JS(this.todo), // convert observable to js
            doing: $JS(this.doing), // convert observable to js
            done: $JS(this.done) // convert observable to js
        };
        // Store the packet
        V3Store.$local_set("tasks", ko.toJSON(packet));

        console.log("saved")
    }

    /**
     * Save entire model to User space on vee3
     */
    async remote_save() {
        console.log("remote save");
        if (this.dirty === true) {
            console.log("Model is dirty");
            let packet = {
                ts: this.ts, // A timestamp
                todo: $JS(this.todo), // convert observable to js
                doing: $JS(this.doing), // convert observable to js
                done: $JS(this.done) // convert observable to js
            };
            // Reset the data flag
            this.dirty = false;
            // Store the packet to private space
            V3Store.$private_set(ko.toJSON(packet), "tasks");
            console.log("Model saved remotely");
        } else {
            console.log("Nothing to save");
        }
    }

    async remote_load() {
        console.log("remote load");
        // Store the packet to private space
        let data = await V3Store.$private_get("tasks");
        if (data) {
            let json = JSON.parse(data.obj);
            console.log(json.ts - this.ts);
            if (json.ts > this.ts) {
                // remote is newer, orverwrite
                console.log("remote is newer, overwriting");
                // update local
                this.todo.clear();
                this.todo.parse(json.todo);
                this.doing.clear();
                this.doing.parse(json.doing);
                this.done.clear();
                this.done.parse(json.done);
            } else {
                console.log("remote is older, ignoring");
            }
        }
    }
}

export default Model;