var WeiboVis = (function() {
    var NS = {};

    // Values and Events
    NS_values = { };
    NS_events = { };
    var value_event_prefix = "__value:";
    NS.addValue = function(key, type, initial) {
        if (initial === undefined || initial === null) {
            if (type == "bool") initial = false;
            if (type == "string") initial = "";
            if (type == "number") initial = 0;
            if (type == "object") initial = { };
        }
        NS_values[key] = {
            type: type,
            value: initial
        };
        NS.addEvent(value_event_prefix + key);
        return NS;
    };
    NS.add = NS.addValue;

    NS.setValue = function(key, value, post_event) {
        NS_values[key].value = value;
        if (post_event === null || post_event === undefined || post_event === true){
            NS.raiseEvent(value_event_prefix + key, value);
        }
        return NS;
    };
    NS.set = NS.setValue;
    NS.getValue = function(key) {
        return NS_value[key].value;
    };
    NS.get = NS.getValue;

    NS.addListener = function(key, listener, priority) {
        priority = priority ? priority : 1;
        var ev = NS_events[key];
        ev.listeners.push({ f: listener, p : priority});
        ev.listeners.sort(function(a, b) {
            return b.p - a.p;
        });
        return NS;
    }

    NS.on = NS.addListener;

    NS.addValueListener = function(key, listener, priority) {
        return NS.addListener(value_event_prefix + key, listener, priority);
    };
    NS.listen = NS.addValueListener;

    NS.addEvent = function(key) {
        NS_events[key] = {
            listeners : [],
            running : false
        };
        return NS;
    };
    NS.raiseEvent = function(key, param) {
        var ev = NS_events[key];
        if(ev.running) return NS;
        ev.running = true;
        for(var i in ev.listeners) {
            var r;
            try {
                r = ev.listeners[i].f(parameters);
            } catch(e) {
            }
            if(r) break;
        }
        ev.running = false;
        return NS;
    };
    NS.raise = NS.raiseEvent;

    NS.incf = function(k, v) {
        var incfv = v ? v : 1;
        if (this[k] === undefined) this[k] = 0;
        this[k] += incfv;
    }
    return NS;
})();
