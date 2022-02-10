/**
 * Card
 */

ko.components.register('page-note', {
    viewModel: function(params) {
        // Map to model 


    },
    template: `
         <div class="card mt-2 p-2">
            <div class="text-right">
                <button data-bind="click:$root.demote" class="h-12 w-12">&lt;</button>
                <button data-bind="click:$root.promote" class="h-12 w-12">&gt;</button>
            </div>
            <textarea data-bind="textInput:$data.desc"></textarea>
        </div>
     `
});

class Card {
    constructor(config = {}) {
        // id The id of the card, used to find later on
        this.id = config.id || Date.now();
        // desc The description of the card 
        this.desc = $O(config.desc || "");
        // list_name The name of the current list
        this.list_name = config.list_name || "";
    }
}

export default Note