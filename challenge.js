'use strict';
/* globals _, engine */
// stub window for serverside check
if (!window) {
    window = {};
};

//class for the grid
const RoverField = {
    create: function (x, y) {
        let self = Object.create(this);
        self.x = x ? x : 0;
        self.y = y ? y : 0;
        self.aliveRobos = [];
        self.deadRobos = [];
        return self;
    },
    setBounds: function(x, y) {
        this.x = x;
        this.y = y;
    },
    cullRobos: function() {
        this.aliveRobos = [];
        this.deadRobos = [];
    },
    doneRobos: function(x, y, o) {
        this.aliveRobos.push({x: x, y: y, o: o});
    },
    killRobos: function(x, y, o) {
        this.deadRobos.push({x: x, y: y, o: o});
    },
    checkScent: function(x, y) {
        let foundScent = false;
        _.forEach(this.deadRobos, function(deadRobos) {
            if (deadRobos.x === x && deadRobos.y === y) { foundScent = true; return; }
        });
        return foundScent;
    }
};

//class for individual rovers
const Robos = {
    create: function (x, y, o, command) {
        let self = Object.create(this);
        self.x = x;
        self.y = y;
        self.o = o;
        self.command = command;
        return self;
    },
    move: function () {
        this.command[0] === 'f' ? this.forward() : this.turn()
        this.trimCommand();
    },
    turn: function() {
        switch (this.o) {
            case 'N':
                this.command[0] === 'l' ? this.o = 'W' : this.o = 'E';
                break;
            case 'S':
                this.command[0] === 'l' ? this.o = 'E' : this.o = 'W';
                break;
            case 'E':
                this.command[0] === 'l' ? this.o = 'N' : this.o = 'S';
                break;
            case 'W':
                this.command[0] === 'l' ? this.o = 'S' : this.o = 'N';
                break;
        }
    },
    forward: function() {
        switch (this.o) {
            case 'N':
                if (this.skip() === false) this.y -= 1;
                break;
            case 'S':
                if (this.skip() === false) this.y += 1;
                break;
            case 'E':
                if (this.skip() === false) this.x += 1;
                break;
            case 'W':
                if (this.skip() === false) this.x -= 1;
                break;
        }
    },
    skip: function () {
        let goingOff = false;
        let foundScent = planet.checkScent(this.x, this.y);
        switch (this.o) {
            case 'N':
                if (this.y - 1 < 0) goingOff = true;
                break;
            case 'S':
                if (this.y + 1 > planet.y) goingOff = true;
                break;
            case 'E':
                if (this.x + 1 > planet.x) goingOff = true;
                break;
            case 'W':
                if (this.x - 1 < 0) goingOff = true;
                break;
        }
        if (goingOff === true && foundScent === false) planet.killRobos(this.x, this.y, this.o);
        return (goingOff && foundScent);
    },
    trimCommand: function() {
        this.command = this.command.slice(1);
        if (this.command.length === 0) planet.doneRobos(this.x, this.y, this.o);
    }
};

const planet = RoverField.create(); //planet object to be referenced everywhere

window.initGame = function () {
    console.log('initgame');
    // you're really better off leaving this line alone, i promise.
    var command =
        '5 3 \n 1 1 s\n ffffff\n 2 1 w \n flfffffrrfffffff\n 0 3 w\n LLFFFLFLFL';

    // this function parses the input string so that we have useful names/parameters
    // to define the playfield and robots for subsequent steps
    var parseInput = function (input) {

        //
        // task #1 
        //
        // replace the 'parsed' var below to be the string 'command' parsed into an object we can pass to genworld();
        // genworld expects an input object in the form { 'bounds': [3, 8], 'robos': [{x: 2, y: 1, o: 'W', command: 'rlrlff'}]}
        // where bounds represents the top right corner of the plane and each robos object represents the
        // x,y coordinates of a robot and o is a string representing their orientation. a sample object is provided below
        //

        // replace this with a correct object

        let splitInput = input.split('\n ');
        let boundsCoords = splitInput.shift().split(" ");

        planet.setBounds(parseInt(boundsCoords[0]), parseInt(boundsCoords[1])); //sets the size of the planet
        planet.cullRobos(); //destroys any old rovers (only necessary if rerunning continuously with different commands)

        let robos = [];
        let inner = {};

        for (let i = 0; i < splitInput.length; i++) {
            if (i%2 === 0) {
                let robosCoords = splitInput[i].split(' ');
                inner.x = parseInt(robosCoords[0]);
                inner.y = parseInt(robosCoords[1]);
                inner.o = robosCoords[2].toUpperCase();
            }
            else {
                inner.command = splitInput[i].toLowerCase();
                let robo = Robos.create(inner.x, inner.y, inner.o, inner.command);
                robos.push(robo);
                inner = {};
            }
        }

        let parsed = {bounds: [planet.x, planet.y], robos: robos};

        return parsed;
    };

    // this function replaces the robos after they complete one instruction
    // from their commandset
    var tickRobos = function (robos) {

        console.log('tickrobos');

        // 
        // task #2
        //
        // in this function, write business logic to move robots around the playfield
        // the 'robos' input is an array of objects; each object has 4 parameters.
        // This function needs to edit each robot in the array so that its x/y coordinates
        // and orientation parameters match the robot state after 1 command has been completed. 
        // Also, you need to remove the command the robot just completed from the command list.
        // example input:
        //
        // robos[0] = {x: 2, y: 2, o: 'N', command: 'frlrlrl'}
        //
        //                   - becomes -
        // 
        // robos[0] = {x: 2, y: 1, o: 'N', command: 'rlrlrl'} 
        //
        // if a robot leaves the bounds of the playfield, it should be removed from the robos
        // array. It should leave a 'scent' in it's place. If another robot–for the duration
        // of its commandset–encounters this 'scent', it should refuse any commands that would
        // cause it to leave the playfield.

        // write robot logic here

        //loops through and moves each rover
        _.forEach(robos, function(robo) {
            if (robo.command.length !== 0) robo.move();
        });

        let aliveRobos = _.filter(robos, function(robo) { //filters out dead rovers
            return (robo.x >= 0 && robo.x <= planet.x) && (robo.y >= 0 && robo.y <= planet.y);
        });

        if (aliveRobos.length === planet.aliveRobos.length) window.rover.summary(); //original in engine.js commented out

        // return the mutated robos object from the input to match the new state
        return aliveRobos;
    };
    // mission summary function
    var missionSummary = function (robos) {
        //
        // task #3
        //
        // summarize the mission and inject the results into the DOM elements referenced in readme.md
        //

        let ulAlive = document.getElementById("robots");
        let ulDead = document.getElementById("lostRobots");

        _.forEach(planet.aliveRobos, function(robo) {
            let li = document.createElement("li");
            let text = "Position: " + robo.x + ", " + robo.y + " | Orientation: " + robo.o;
            li.appendChild(document.createTextNode(text));
            ulAlive.appendChild(li);
        });

        _.forEach(planet.deadRobos, function(robo) {
            let li = document.createElement("li");
            let text = "I died going " + robo.o + " from coordinates: " + robo.x + ", " + robo.y;
            li.appendChild(document.createTextNode(text));
            ulDead.appendChild(li);
        });

        return;
    };

    // leave this alone please
    window.rover = {
        parse: parseInput,
        tick: tickRobos,
        summary: missionSummary,
        command: command
    };
};
