import { endpoint, interval } from "../intervals.js";
import { NearbyIndexBase } from "../nearbyindex.js";
import { Layer } from "../layers.js"

/**
 * 
 * This implements a merge operation for layers.
 * List of sources is immutable.
 * 
 */

export function merge (sources, options) {
    
    const layer = new Layer(options);
    layer.index = new MergeIndex(sources);

    // getter for sources
    Object.defineProperty(layer, "sources", {
        get: function () {
            return sources;
        }
    });
 
    // subscrive to change callbacks from sources 
    function handle_src_change(eArg) {
        layer.clearCaches();
        layer.notify_callback();
        layer.eventifyTrigger("change"); 
    }
    for (let src of sources) {
        src.add_callback(handle_src_change);            
    }
    return layer;
}


/**
 * Merging indexes from multiple sources into a single index.
 * 
 * A source is an object with an index.
 * - layer (cursor)
 * 
 * The merged index gives a temporal structure for the
 * collection of sources, computing a list of
 * sources which are defined at a given offset
 * 
 * nearby(offset).center is a list of items
 * [{itv, src}]
 * 
 * Implementaion is stateless.
 */

function cmp_ascending(p1, p2) {
    return endpoint.cmp(p1, p2)
}

function cmp_descending(p1, p2) {
    return endpoint.cmp(p2, p1)
}

export class MergeIndex extends NearbyIndexBase {

    constructor(sources) {
        super();
        this._sources = sources;
        this._caches = new Map(sources.map((src) => {
            return [src, src.getCache()];
        }));
    }

    nearby(offset) {
        // accumulate nearby from all sources
        const prev_list = [], next_list = [];
        const center_list = [];
        const center_high_list = [];
        const center_low_list = []
        for (let src of this._sources) {
            let {prev, center, next, itv} = src.index.nearby(offset);
            if (prev != undefined) prev_list.push(prev);            
            if (next != undefined) next_list.push(next);
            if (center.length > 0) {
                center_list.push(this._caches.get(src));
                let [low, high] = endpoint.from_interval(itv);
                center_high_list.push(high);
                center_low_list.push(low);    
            }
        }
        
        // find closest endpoint to the right (not in center)
        next_list.sort(cmp_ascending);
        const min_next_low = next_list[0] || [Infinity, 0];

        // find closest endpoint to the left (not in center)
        prev_list.sort(cmp_descending);
        const max_prev_high = prev_list[0] || [-Infinity, 0];

        // nearby
        let low, high; 
        const result = {
            center: center_list, 
        }

        if (center_list.length == 0) {

            // empty center
            result.right = min_next_low;       
            result.next = min_next_low;
            result.left = max_prev_high;
            result.prev = max_prev_high;

        } else {
            // non-empty center
            
            // center high
            center_high_list.sort(cmp_ascending);
            let min_center_high = center_high_list[0];
            let max_center_high = center_high_list.slice(-1)[0];
            let multiple_center_high = !endpoint.eq(min_center_high, max_center_high)

            // center low
            center_low_list.sort(cmp_descending);
            let max_center_low = center_low_list[0];
            let min_center_low = center_low_list.slice(-1)[0];
            let multiple_center_low = !endpoint.eq(max_center_low, min_center_low)

            // next/right
            if (endpoint.le(min_next_low, min_center_high)) {
                result.right = min_next_low;
            } else {
                result.right = endpoint.flip(min_center_high, "low")
            }
            result.next = (multiple_center_high) ? result.right : min_next_low;

            // prev/left
            if (endpoint.ge(max_prev_high, max_center_low)) {
                result.left = max_prev_high;
            } else {
                result.left = endpoint.flip(max_center_low, "high");
            }
            result.prev = (multiple_center_low) ? result.left : max_prev_high;

        }

        // interval from left/right
        low = endpoint.flip(result.left, "low");
        high = endpoint.flip(result.right, "high");
        result.itv = interval.from_endpoints(low, high);

        // switch to undefined
        if (result.prev[0] == -Infinity) {
            result.prev = undefined;
        }
        if (result.left[0] == -Infinity) {
            result.left = undefined;
        }
        if (result.next[0] == Infinity) {
            result.next = undefined;
        }
        if (result.right[0] == Infinity) {
            result.right = undefined;
        }
        return result;
    }
};

