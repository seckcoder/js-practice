function make_class (/**/) {
    var Person = function(name, email) {
        this.name = name;
        this.email = email;
        this.say_hello = function() {
            var hello = 'Hello, ' + this.name;
            alert(hello);
        };
    };
    return Person;
}
function define_property() {
    var liwei = Object.create(null);
    Object.defineProperty(liwei,
            'name', {value: 'liwei', writable: true, configurable: true,
                enumerable: true});
    Object.defineProperties(liwei,
            {
                'email' : {value: 'seckcoder@gmail.com', writable: true,
                    configurable: true, enumerable: true},
                'website' : {value: 'http://www.google.com', writable: true,
                    configurable: true, enumerable: true},
            });
    Object.defineProperty(liwei,
            'age', {
                get: function() { return m_age; },
                set: function(value) { m_age = value; },
                enumerable : true,
                configurable : true
            });
    liwei.age = 100;
    Object.defineProperty(liwei,
            'birth_year',
            {
                get: function() {
                    var d = new Date();
                    var y = d.getFullYear();
                    return ( y - this.age);
                },
                set: function() {
                    var d = new Date();
                    var y = d.getFullYear();
                    this.age = y - year;
                },
                enumerable : true,
                configurable : true,
            });
    for(prop in liwei) {
        console.log(prop + ": " + liwei[prop]);
    }
}
function set_property (/**/) {
    var liwei = {
        name: "liwei",
        email: "liwei@jike.com",
        website: "seckcoder.me",
        age: 100,
        get birth_year() {
            var d = new Date();
            var y = d.getFullYear();
            return (y - this.age);
        },
        set birth_year(year) {
            var d = new Date();
            var y = d.getFullYear();
            this.age = y - year;
        }
    };
    for(prop in liwei) {
        console.log(prop + ": " + liwei[prop]);
    }
}
function print (text) {
    console.log(this.value + '-' + text);
}

function test_this (/**/) {
    var a = {value:10, print : print};
    var b = {value:20, print : print};
    print('hello');
    a.print('a');
    b.print('b');
    a['print']('a');
}
function test_call (/**/) {
    var a = {value:10, print:print};
    var b = {value:20, print:print};
    print.call(a, 'a');
    print.call(b, 'b');
}
function test_apply (/**/) {
    var a = {value:10, print:print};
    var b = {value:20, print:print};
    print.apply(a, ['a']);
    print.apply(b, ['b']);
}

function test_inheritance (/**/) {
    var Person = Object.create(null);
    Object.defineProperties(Person,
            {
                'name' : { value: 'liwei'},
                'email' : { value: 'seckcoder@gmail.com'},
                'website' : {value: 'seckcoder.me'},
            });
    Person.sayHello = function() {
        var hello = "Hello I'm " + this.name;
        console.log(hello);
    };
    //Inheritance
    var Student = Object.create(Person);
    Student.no = "12334";
    Student.dept = "Software Engineering";
    console.log(Student.name + " " + Student.email + " " + Student.website);
    //Overload
    Student.sayHello = function() {
        Object.getPrototypeOf(this).sayHello.call(this);
        var hello = "Student no: " + this.no + "\n" + "Student dept: "
            + this.dept;
        console.log(hello);
    };
    Student.sayHello();
}
function Composition (target ,source) {
    var desc = Object.getOwnPropertyDescriptor;
    var prop = Object.getOwnPropertyNames;
    var def_prop = Object.defineProperty;

    prop(source).forEach(
            function(key) {
                def_prop(target, key, desc(source, key));
            });
    return target;
}

function prototypeInheritance (/**/) {
    function Person (name, email, website) {
        this.name = name;
        this.email = email;
        this.website = website;
    };
    Person.prototype.sayHello = function() {
        var hello = "Hello, I'm " + this.name;
        return hello;
    };
    function Student (name, email, website, no, dept) {
        var proto = Object.getPrototypeOf;
        proto(Student.prototype).constructor.call(this, name, email, website);
        this.no = no;
        this.dept = dept;
    };
    Student.prototype = Object.create(Person.prototype);
    Student.prototype.constructor = Student;
    Student.prototype.sayHello = function() {
        var proto = Object.getPrototypeOf;
        var hello = proto(Student.prototype).sayHello.call(this) + "\n";
        hello += "student not is : " + this.no + "\n" + "dept is " + this.dept;
        return hello;
    };
    var me = new Student("liwei", "seckcoder@gmail.com", "seckcoder.me", 
            "12334" , "cs");
    console.log(me.sayHello());
}

function test_composition (/**/) {
    Person = make_class();
    var Artist = Object.create(null);
    Artist.sing = function() {
        return this.name + " sing";
    }
    Artist.paint = function() {
        return this.name + " paint";
    }
    var Sporter = Object.create(null);
    Sporter.run = function() {
        return this.name + ' starts running...';
    }
    Sporter.swim = function() {
        return this.name + ' starts swimming...';
    }
    Composition(Person, Artist);
    console.log(Person.sing());
    console.log(Person.paint());
    Composition(Person, Sporter);
    console.log(Person.run());
    console.log(Person.swim());
    console.log(Object.keys(Person));
}

function setInheritance (/**/) {
    var Person = function(name, email, age) {
        this.nam = name;
        this.email = email;
        this.age = age;
    };
    Object.defineProperties(Person, {
        birth_year: {
                        get: function() {
                            var d = new Date();
                            return d.getFullYear() - this.age;
                        },
                        set: function(y) {
                            var d = new Date();
                            this.age = d.getFullYear() - y;
                        }
                    }
    });

    var liwei = Object.create(Person);
    var seckcoder = new Person('liwei', 'seckcoder@gmail.com', 22);
    console.log(liwei);
    console.log(seckcoder);
    liwei.age = 22;
    console.log(liwei.birth_year);
    var edwin = Object.create(Person);
    console.log(edwin);
}

function extend (target, source) {
    for(prop in source)
        target[prop] = source[prop];
    return target;
}
function defineClass (constructor, methods, statics) {
    if (methods) extend(constructor.prototype, methods);
    if (statics) extend(constructor, statics);
    return constructor;
}
function defineSubClass (superclass, constructor, methods, statics) {
    constructor.prototype = Object.create(superclass.prototype);
    constructor.prototype.constructor = constructor;
    return defineClass(constructor, methods, statics);
}
function oop_user(/**/) {
    //set_property();
    //call, apply, bind and this
    //test_this();
    //test_call();
    //test_apply();
    //test_inheritance();
    //test_composition();
    //setInheritance();
    prototypeInheritance();
}
