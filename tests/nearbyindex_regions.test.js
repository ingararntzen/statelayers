/* global describe, test, expect */

import { LocalStateProvider } from '../src/stateprovider_simple.js';
import { NearbyIndexSimple } from '../src/nearbyindex_simple.js';
import { BooleanIndex } from '../src/nearbyindex.js';

// Add your test cases here
describe('NearbyIndexList', () => {
    test('test region iterator', () => {

        const intervals = [
            [-Infinity, 0, true, false],
            [0, 1, true, true],
            // gap
            [2, Infinity, false, true],
        ]

        const items = intervals.map(itv => {
            return {itv};
        })

        const src = new LocalStateProvider({items});
        const index = new NearbyIndexSimple(src);

        let result = Array.from(index.regions({includeEmpty:false}));
        expect(result.length).toBe(3);
        result.forEach((items, index) => {
            expect(items.center.length).toBe(1);
            expect(items.itv).toStrictEqual(intervals[index])
        });
    });

    test('test region iterator with ranges', () => {

        const intervals = [
            [-Infinity, 0, true, false],
            [0, 1, true, false],
            // gap
            [2, 4, true, false],
            [4, Infinity, true, true],
        ]

        const items = intervals.map(itv => {
            return {itv};
        })

        const src = new LocalStateProvider({items});
        const index = new NearbyIndexSimple(src);
        const regions = [...index.regions({start:1.5, stop:5})];

        expect(regions.length).toBe(3);
        expect(regions[0].itv).toStrictEqual([1, 2, true, false]);
        expect(regions[1].itv).toStrictEqual([2, 4, true, false]);
        expect(regions[2].itv).toStrictEqual([4, Infinity, true, true]);
    });


    test('test boolean index', () => {

        const intervals = [
            // gap - #0
            [0, 1, true, false], // #1
            // gap - #2
            [2, 3, true, false], // # 3
            [3, 4, true, false], // # 3
            // gap - #4
            [5, 6, true, false], // # 5
            [6, 7, true, false], // # 5
            [7, Infinity, true, true], // # 5
        ]

        const items = intervals.map(itv => {
            return {itv, data: "data"};
        });

        const src = new LocalStateProvider({items});
        const index = new NearbyIndexSimple(src);
        const bool_index = new BooleanIndex(index);

        // check values
        const offsets = [-1, 0.5, 1.5, 3.5, 4.5, 19]
        const bools = offsets.map((offset) => {
            return bool_index.nearby(offset).center[0].query(offset).value;
        });
        expect(bools).toStrictEqual([false, true, false, true, false, true]);
    
        // check regions
        const regions = [...bool_index.regions()];
        expect(regions.length).toBe(6);
                
        // check each region
        expect(regions[0].itv).toStrictEqual([-Infinity, 0, true, false]);
        expect(regions[1].itv).toStrictEqual([0, 1, true, false]);
        expect(regions[2].itv).toStrictEqual([1, 2, true, false]);
        expect(regions[3].itv).toStrictEqual([2, 4, true, false]);
        expect(regions[4].itv).toStrictEqual([4, 5, true, false]);
        expect(regions[5].itv).toStrictEqual([5, Infinity, true, true]);

    });




});