import { StateProviderBase } from "./stateprovider_base.js";
import { interval } from "./intervals.js";
import { random_string } from "./util.js";

function check_item(item) {
    item.itv = interval.from_input(item.itv);
    item.id = item.id || random_string(10);
    return item;
}

/***************************************************************
    LOCAL STATE PROVIDER
***************************************************************/

/**
 * local state provider
 * collection of items
 * 
 * changes = {
 *   items=[],
 *   remove=[],
 *   clear=false 
 * }
 * 
*/

export class LocalStateProvider extends StateProviderBase {

    constructor(options={}) {
        super();
        this._map = new Map();
        this._initialise(options);
    }

    /**
     * Local StateProviders support initialisation with
     * by giving items or a value. 
     */
    _initialise(options={}) {
        // initialization with items or single value 
        let {items, value} = options;
        if (value != undefined) {
            // initialize from value
            items = [{
                itv: [-Infinity, Infinity, true, true], 
                type: "static",
                data: value
            }];
        }
        if (items != undefined) {
            this._update({items});
        }
    }

    /**
     * Local StateProviders decouple update request from
     * update processing, and returns Promise.
     */
    update (changes) {
        return Promise.resolve()
        .then(() => {
            let diffs;
            if (changes != undefined) {
                diffs = this._update(changes);
                this.notify_callbacks(diffs);
            }
            return diffs;
        });
    }

    _update(changes) {
        const diffs = [];
        let {
            items=[],
            remove=[],
            clear=true
        } = changes;
        if (clear) {
            // clear all items
            this._map = new Map();
        } else {
            // remove items by id
            for (const id of remove) {
                let item = this._map.get(id);
                if (item != undefined) {
                    diffs.push({id:item.id, old:item});
                    this._map.delete(id);
                }
            }
        }
        // insert items
        for (let item of items) {
            item = check_item(item);
            let old = this._map.get(item.id);
            if (old != undefined) {
                diffs.push({id:item.id, new:item, old});
            } else {
                diffs.push({id:item.id, new:item});
            }
            this._map.set(item.id, item);
        }
        return diffs;
    }

    get_items() {
        return [...this._map.values()];
    };
}

