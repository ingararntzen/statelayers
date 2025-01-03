
/**
 * Returns true if the point is covered by the interval
 * 
 * @param {*} interval 
 * @param {*} point 
 * @returns 
 */

function covers(interval, point) {
    let [low, high, lowClosed, highClosed] = interval;
    if (lowClosed && highClosed) {
        return low <= point && point <= high;
    } else if (lowClosed && !highClosed) {
        return low <= point && point < high;
    } else if (!lowClosed && highClosed) {
        return low < point && point <= high;
    } else {
        return low < point && point < high;
    }
}


/********************************************************************
BASE SEGMENT
*********************************************************************/
/*
	Abstract Base Class for Segments

    constructor(interval, options={})

    - interval: interval of validity of segment
    - dynamic: true if segment is dynamic
    - value(offset): value of segment at offset
    - query(offset): state of segment at offset
*/

export class BaseSegment {

	constructor(interval, options={}) {
		this._itv = interval;
        this._options = options;
	}

    get options() {return this._options;}
	get interval() {return this._itv;}

    /* 
    implemented by subclass
    - returns true or false 
    */
    get dynamic() {
        return false;
    }

    /** 
     * implemented by subclass
     * returns value or undefined
    */
    value(offset) {
    	throw new Error("not implemented");
    }

    /**
     * convenience function returning the state of the segment
     * @param {*} offset 
     * @returns 
     */
    query(offset) {
        let value = undefined, dynamic = false;
        if (covers(this._itv, offset)) {
            value = this.value(offset);
            dynamic = this.dynamic;
        }
        return {value, dynamic, offset};
    }
}


/********************************************************************
    STATIC SEGMENT
*********************************************************************/

export class StaticSegment extends BaseSegment {

	constructor(interval, value) {
        super(interval);
		this._value = value;
	}

	value(offset) {
		return this._value;
	}
}


/********************************************************************
    MOTION SEGMENT
*********************************************************************/
/*
    Implements deterministic projection based on initial conditions 
    - motion vector describes motion under constant acceleration
*/

export class MotionSegment extends BaseSegment {
    
    constructor(interval, vector) {
        super(interval);
        this.vector = vector;
        let [p0, v0, a0, t0] = this.vector;

        // create motion transition
        this._dynamic = (v0 != 0 || a0 != 0);
        this._trans = function (ts) {
            let d = ts - t0;
            return p0 + v0*d + 0.5*a0*d*d;
        };   
    }

    get dynamic() {
        return this._dynamic;
    }

    value(offset) {
        return this._trans(offset);
    }
}


/********************************************************************
    TRANSITION SEGMENT
*********************************************************************/

/*
    Supported easing functions
    "ease-in":
    "ease-out":
    "ease-in-out"
*/

function easein (ts) {
    return Math.pow(ts,2);  
}
function easeout (ts) {
    return 1 - easein(1 - ts);
}
function easeinout (ts) {
    if (ts < .5) {
        return easein(2 * ts) / 2;
    } else {
        return (2 - easein(2 * (1 - ts))) / 2;
    }
}

export class TransitionSegment extends BaseSegment {

	constructor(interval, v0, v1, easing) {
		super(interval);
        this.v0 = v0;
        this.v1 = v1;
        this.easing = easing;
        let [t0, t1, ...rest] = this.interval;

        // create the transition function
        this._dynamic = v1-v0 != 0;
        this._trans = function (ts) {
            // convert ts to [t0,t1]-space
            // - shift from [t0,t1]-space to [0,(t1-t0)]-space
            // - scale from [0,(t1-t0)]-space to [0,1]-space
            ts = ts - t0;
            ts = ts/parseFloat(t1-t0);
            // easing functions stretches or compresses the time scale 
            if (easing == "ease-in") {
                ts = easein(ts);
            } else if (easing == "ease-out") {
                ts = easeout(ts);
            } else if (easing == "ease-in-out") {
                ts = easeinout(ts);
            }
            // linear transition from v0 to v1, for time values [0,1]
            ts = Math.max(ts, 0);
            ts = Math.min(ts, 1);
            return v0 + (v1-v0)*ts;
        }
	}

	get dynamic() {
        return this._dynamic;
    }

	value(offset) {
        return this._trans(offset);
	}
}
