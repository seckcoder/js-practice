function test_modernizr (/**/) {
    if (Modernizr.canvas) {
        document.write("support");
    } else {
        document.write("not support");
    }
}
function test_jquery (/**/) {
    // Fetch element and transform to html
    var ht = $("#test").html();
    console.log(ht);
}
function test_mustache (/**/) {
    // basic
    var view = {
        title: "Joe",
        calc: function() {
            return 2 + 4;
        }
    };
    var output = Mustache.render("{{title}} spends {{calc}}", view);
    console.log(output);

    // variable escaping and object reference
    view = {
        name: {
            first: "Michael",
            last: "Jackson"
        },
        company: "<b>Github</b>"
    };
    output = Mustache.render("{{name.first}} {{name.last}} {{company}} {{{company}}} {{&company}}", view);
    console.log(output);
    // Sections
    view = {
        "person": false,
        "yaya": true,
        "list-demo": [
            {name: "Moe" },
            {name: "Larry" },
            {"name" : "Curly"}
        ],
        "list-demo-another-way": [
            "China", "America", "Japan", "German"
        ],
        "anime" : [
            { title: "quanyecha",  actor: "kikyo"},
            { title: "langkejianxin", actor: "xuedaiba"},
            { title: "huanghunshaonv", actor: "youko"}
        ],
        "name" : function() {
            return this.title+ " " + this.actor;
        }
    };
    output = Mustache.render("{{#person}} Never shown! {{/person}} {{#yaya}} Shown! {{/yaya}} {{#list-demo}}<b>{{name}}</b>{{/list-demo}} {{#list-demo-another-way}}* {{.}} {{/list-demo-another-way}} {{#anime}}* {{name}} {{/anime}}", view);
    console.log(output);

    // Functions
    view = {
        name: "luluxiu",
        bold: function() {
            return function(text, render) {
                return "<b>" + render(text) + "</b>";
            }
        }
    };
    output = Mustache.render("{{#bold}}Hi {{name}}.{{/bold}}", view);
    console.log(output);

    // Inverted Sections and comments
    view = {
        repos: false
    };
    output = Mustache.render("{{^repos}}No repos {{!ignored}}{{/repos}}", view);
    console.log(output);
}
function test_javascript (/**/) {
    var obj = {};
}

function test_canvas (/**/) {
    if (!Modernizr.canvas) return;
    var theCavas = document.getElementById('canvasOne');
    var context = theCavas.getContext("2d");
    /*drawScreenPath();
    drawScreenClip();*/
    function drawScreenAlpha (/**/) {
        context.fillStyle = "black";
        context.fillRect(10, 10, 200, 200);

        context.fillStyle = "red";
        context.fillRect(1, 1, 50, 50);

        context.globalAlpha = 0.5;
        context.globalCompositeOperation = "destination-atop";
        context.fillStyle = "green";
        context.fillRect(60, 1, 50, 50);

        context.globalCompositeOperation = "destination-in";
        context.fillStyle = "yellow";
        context.fillRect(1, 60, 50, 50);

        context.globalCompositeOperation = "destination-out";
        context.fillStyle = "blue";
        context.fillRect(60, 60, 50, 50);
    }
    function drawScreenClip (/**/) {
        context.fillStyle = "red";
        context.fillRect(10, 10, 200, 200);
        context.save();
        context.rect(0, 0, 50, 50);
        context.clip();

        context.beginPath();
        context.strokeStyle = "black";
        context.lineWidth = 5;
        //context.arc(100, 100, 100, (Math.PI/180)*0, (Math.PI/180)*360, false);
        context.arc(50, 50, 20, (Math.PI/180)*0, (Math.PI/180)*360, false);
        context.stroke();
        context.closePath();

        context.restore();

        context.beginPath();
        /*context.rect(0, 0, 500, 500);
        context.clip();*/
        context.strokeStyle = "blue";
        context.lineWidth = 5;
        context.arc(100, 100, 50, (Math.PI/180)*0, (Math.PI/180)*360, false);
        context.stroke();
        context.closePath();
    }
    function drawScreenPath (/**/) {
        context.fillStyle = "#ffffaa";
        context.fillRect(0, 0, 500, 300);
        context.fillStyle = "#000000";
        context.font = "20px _sans";
        context.textBaseline = "top";
        context.fillText("Hello World!", 195, 80);
        context.strokeStyle = "black";
        context.lineWidth = 10;
        context.beginPath();
        context.lineCap = 'round';
        context.moveTo(20, 0);
        context.lineTo(100, 0);
        context.lineCap = 'butt';
        context.moveTo(20,20);
        context.lineTo(100, 20);
        context.lineCap = 'square';
        context.moveTo(20,40);
        context.lineTo(100, 40);
        context.stroke();
        context.closePath();
    }
}
function FilterModels() {
    var para = document.getElementById('p_id');
    para.innerHTML = Date()
    var makeslist = document.getElementById('makes');
    var modelslist = document.getElementById('models');
    var make_id = makeslist.options[makeslist.selectedIndex].value;
    var modelstxt = new Array();
    modelstxt[1] = "1\tEscort\n2\tTaurus";
    modelstxt[2] = "1\tAltima\n2\tMaxima";
    var models = modelstxt[make_id].split("\n");
    for (var count = modelslist.options.length-1; count > -1; count--) {
        modelslist.options[count] = null;
    }
    for (i=0; i<models.length; i++) {
        var modelsvals = models[i].split("\t");
        var option = new Option(modelsvals[1], modelsvals[2], false, false);
        modelslist.options[modelslist.length] = option;
    }
}


/*
* 
* 
*
* 
* */
