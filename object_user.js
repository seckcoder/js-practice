//tutorial about Object

function print (obj) {
    console.log(obj);
}
// Print both enumerable and non-enumerable
function getOwnPropertyNamesUser () {
    console.log('getOwnPropertyNamesUser');
    var arr = ["a", "b", "c"];
    print(Object.getOwnPropertyNames(arr).sort());
    // array-like object
    var obj = {0: "a", 1: "b", 2: "c"};
    print(Object.getOwnPropertyNames(obj).sort());
    // non-enumerable property
    var my_obj = Object.create({}, { getFoo: { value: function() { return this.foo; },
        enumerable: false,}});
    my_obj.foo = 1;
    print(Object.getOwnPropertyNames(my_obj).sort());
    //print(Object.getOwnPropertyDescriptor(my_obj, 'foo'));
}
// Print non-enumerable
function keysUser (/**/) {
    console.log('keysUser');
    var arr = ["a", "b", "c"];
    print(Object.keys(arr));
    // array-like object
    var obj = {0: "a", 1: "b", 2: "c"};
    print(Object.keys(obj));
    // non-enumerable property
    var my_obj = Object.create({}, { getFoo: {value: function() { return this.foo;},
        enumerable: false,}});
    my_obj.foo = 1;
    print(Object.keys(my_obj));
}

function object_user (/**/) {
    getOwnPropertyNamesUser();
    keysUser();
}
