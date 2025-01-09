import {NearbyIndexBase} from "./nearby_index_base.js";
import {interval, endpoint} from "./intervals.js";

/**
 * 
 * Nearby Index Simple
 * 
 * - items are assumed to be non-overlapping on the timeline, 
 * - implying that nearby.center will be a list of at most one ITEM. 
 * - exception will be raised if overlapping ITEMS are found
 * - ITEMS is assumbed to be immutable array - change ITEMS by replacing array
 * 
 * 
 * NEARBY
 * The nearby method returns information about the neighborhood around offset. 
 * 
 * Returns {
 *      left - high interval endpoint of the first ITEM to the left which does not cover offset, else undefined
 *      center - list of ITEMS covering offset, else []
 *      right - low interval endpoint of the first ITEM to the right which does not cover offset, else undefined
 * }
 * 
 */


// get interval low point
function get_low_value(item) {
    return item.interval[0];
}

// get interval low endpoint
function get_low_endpoint(item) {
    return endpoint.from_interval(item.interval)[0]
}

// get interval high endpoint
function get_high_endpoint(item) {
    return endpoint.from_interval(item.interval)[1]
}


export class NearbyIndexSimple extends NearbyIndexBase {

    constructor() {
        super();
        this._items = [];
    }

    set(items) {
        check_input(items);
        this._items = items;
    }

    /*
        nearby by offset
        
        returns {left, center, right}

        binary search based on offset
        1) found, idx
            offset matches value of interval.low of an item
            idx gives the index of this item in the array
        2) not found, idx
            offset is either covered by item at (idx-1),
            or it is not => between entries
            in this case - idx gives the index where an item
            should be inserted - if it had low == offset
    */
    nearby(point) {
        if (typeof point === 'number') {
            point = [point, 0];
        }
        if (!Array.isArray(point)) {
            throw new Error("Endpoint must be an array");
        }
        let offset = point[0];
        let items = this._items;
        let indexes, item;
        const size = items.length;
        if (size == 0) {
            return {
                items: [],
                interval: [-Infinity, Infinity, true, true],
                left: undefined,
                right: undefined,
                prev: undefined,
                next: undefined
            }
        }
        let [found, idx] = find_index(offset, items, get_low_value);
        if (found) {
            // search offset matches item low exactly
            // check that it indeed covered by item interval
            item = items[idx]
            if (interval.covers_endpoint(item.interval, point)) {
                indexes = {left:idx-1, center:idx, right:idx+1};
            }
        }
        if (indexes == undefined) {
            // check prev item
            item = items[idx-1];
            if (item != undefined) {
                // check if search offset is covered by item interval
                if (interval.covers_endpoint(item.interval, point)) {
                    indexes = {left:idx-2, center:idx-1, right:idx};
                } 
            }
        }	
        if (indexes == undefined) {
            // prev item either does not exist or is not relevant
            indexes = {left:idx-1, center:-1, right:idx};
        }
        // result
        const result = {};

        // center
        if (0 <= indexes.center && indexes.center < size) {
            result.center =  [items[indexes.center]];
        }
        // prev/next
        if (0 <= indexes.left && indexes.left < size) {
            result.prev =  get_high_endpoint(items[indexes.left]);
        }
        if (0 <= indexes.right && indexes.right < size) {
            result.next =  get_low_endpoint(items[indexes.right]);
        }        
        // left/right
        result.left = result.prev;
        result.right = result.next;
        if (result.center) {
            let itv = result.center[0].interval;
            let [low, high] = endpoint.from_interval(itv);
            result.left = (low[0] > -Infinity) ? endpoint.flip(low, "high") : undefined;
            result.right = (high[0] < Infinity) ? endpoint.flip(high, "low") : undefined;
        }
        return result;
    }
}


/*********************************************************************
	UTILS
*********************************************************************/


// check input
function check_input(items) {

    if (!Array.isArray(items)) {
        throw new Error("Input must be an array");
    }

    // sort items based on interval low endpoint
    items.sort((a, b) => {
        let a_low = endpoint.from_interval(a.interval)[0];
        let b_low = endpoint.from_interval(b.interval)[0];
        return endpoint.cmp(a_low, b_low);
    });

    // check that item intervals are non-overlapping
    for (let i = 1; i < items.length; i++) {
        let prev_high = endpoint.from_interval(items[i - 1].interval)[1];
        let curr_low = endpoint.from_interval(items[i].interval)[0];
        // verify that prev high is less that curr low
        if (!endpoint.lt(prev_high, curr_low)) {
            throw new Error("Overlapping intervals found");
        }
    }
}


/*
	binary search for finding the correct insertion index into
	the sorted array (ascending) of items
	
	array contains objects, and value func retreaves a value
	from each object.

	return [found, index]
*/

function find_index(target, arr, value_func) {

    function default_value_func(el) {
        return el;
    }
    
    let left = 0;
	let right = arr.length - 1;
	value_func = value_func || default_value_func;
	while (left <= right) {
		const mid = Math.floor((left + right) / 2);
		let mid_value = value_func(arr[mid]);
		if (mid_value === target) {
			return [true, mid]; // Target already exists in the array
		} else if (mid_value < target) {
			  left = mid + 1; // Move search range to the right
		} else {
			  right = mid - 1; // Move search range to the left
		}
	}
  	return [false, left]; // Return the index where target should be inserted
}
