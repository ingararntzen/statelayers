/* global describe, test, expect */

import { NearbyIndexSimple } from '../src/nearbyindex_simple.js';
import { LocalStateProvider } from '../src/stateprovider_simple.js';

// Add your test cases here
describe('SimpleNearbyIndex', () => {
    test('should create an instance of SimpleNearbyIndex', () => {

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
        expect(index).toBeInstanceOf(NearbyIndexSimple);

        // FIRST ITEM

        // hit within first item
        let nearby = index.nearby(-1);
        expect(nearby.center[0]).toBe(items[0]);

        // last endpoint that hits first item
        nearby = index.nearby([0, -1]);
        expect(nearby.center[0]).toBe(items[0]);

        // interval
        expect(nearby.itv).toStrictEqual(intervals[0]);
        // prev/next
        //expect(nearby.prev).toStrictEqual([-Infinity, 0]);
        //expect(nearby.next).toStrictEqual([0, 0]);
        // left/right
        expect(nearby.left).toStrictEqual([-Infinity, 0]);
        expect(nearby.right).toStrictEqual([0, 0]);

        // SECOND ITEM

        // first endpoint that hits second item
        nearby = index.nearby(0);
        expect(nearby.center[0]).toBe(items[1]);

        // last endpoint that hits second item
        nearby = index.nearby([1, 0]);
        expect(nearby.center[0]).toBe(items[1]);

        // interval
        expect(nearby.itv).toStrictEqual(intervals[1]);
        // prev/next
        //expect(nearby.prev).toStrictEqual([0, -1]);
        //expect(nearby.next).toStrictEqual([2, 1]);
        // left/right
        expect(nearby.left).toStrictEqual([0, -1]);
        expect(nearby.right).toStrictEqual([1, 1]);

        // THIRD ITEM

        // first endpoint that hits third item
        nearby = index.nearby([2,1]);
        expect(nearby.center[0]).toBe(items[2]);

        // endpoint that hits within third item
        nearby = index.nearby(3);
        expect(nearby.center[0]).toBe(items[2]);

        // interval
        expect(nearby.itv).toStrictEqual(intervals[2]);
        // prev/next
        //expect(nearby.prev).toStrictEqual([1, 0]);
        //expect(nearby.next).toStrictEqual([Infinity, 0]);
        // left/right
        expect(nearby.left).toStrictEqual([2, 0]);
        expect(nearby.right).toStrictEqual([Infinity, 0]);

        // GAP
        // endpoint within gap
        nearby = index.nearby(1.5);
        expect(nearby.center).toStrictEqual([]);
        expect(nearby.itv).toStrictEqual([1, 2, false, true]);

        // prev/next
        //expect(nearby.prev).toStrictEqual([1, 0]);
        //expect(nearby.next).toStrictEqual([2, 1]);
        // left/right
        expect(nearby.left).toStrictEqual([1, 0]);
        expect(nearby.right).toStrictEqual([2, 1]);

    });


    test('should handle -Infinity and Infinity correctly', () => {

        const intervals = [
            [-Infinity, 0, true, false],
            [0, 1, true, true],
            // gap
            [2, Infinity, false, true],
        ]

        const items = intervals.map(itv => {
            return {itv};
        });

        const src = new LocalStateProvider({items});
        const index = new NearbyIndexSimple(src);

        // Test -Infinity
        let nearby = index.nearby(-Infinity);
        expect(nearby.center[0]).toBe(items[0]);
        expect(nearby.itv).toStrictEqual(intervals[0]);

        // Test Infinity
        nearby = index.nearby(Infinity);
        expect(nearby.center[0]).toBe(items[2]);
        expect(nearby.itv).toStrictEqual(intervals[2]);
    });


    // Add more test cases as needed
    test('should update the index with one item and check nearby.center', () => {

        const src = new LocalStateProvider();
        const index = new NearbyIndexSimple(src);

        // Check nearby.center before update
        let nearby = index.nearby(1.5);
        expect(nearby.center).toStrictEqual([]);


        // Update the index with a new item
        const new_item = {
            itv: [-Infinity, Infinity, true, true], 
            args: {value:1}
        }
        src.update([new_item]).then(() => {
            // Check nearby.center after update
            nearby = index.nearby(1.5);
            expect(nearby.center[0]).toStrictEqual(new_item);
        });
    });

});