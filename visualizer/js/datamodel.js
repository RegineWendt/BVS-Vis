// This class contains the data model
function Datamodel(csvLoader, scaling, viewData){
    // if true, do initial setup
    this.init = true;
    // Heatmap mode on
    this.heatmap = true;
    // Contains parsed Data from the CSV
    this.data = [];
    // Number of Nanobots in Simulation
    this.numberOfNanobots = 1;
    // Heatmapscale
    this.heatmapscale = 1;
    // Counter for Update Function calls
    this.round = 0;
    //number of timesteps that are contained in data variable
    this.maxTimesteps = -1;
    // Last used timestamp ID in CSV File. If this changes, a new timestep begins
    this.lastTimestepId = "";
    // remember actual line that is processed while loading csv file
    this.dataloadcounter = 0;
    // Step that is rendered in the gui
    this.actualDisplayedTimestep = -1;
    // If a file is larger than this, begin deleting steps
    this.maxalloweddatasets = 4000000;
    // Counter for deleted steps
    this.deletedTimesteps = 0;
    // How much data is loaded in each loading step
    this.timestepBufferSize = 1;
    // Flag to start or stop animation
    this.animationOn = true;
    // How fast should the animation run
    this.speedfactor = 140;
    // Contains all possible speed steps
    this.speedclass =[0,80,120,140,145,150,151,152,153,154,155,156,157,158,159];
    // clears all variables that contain information about the acutal file
    this.clear= function () {
        this.data = [];
        this.round = 0;
        this.maxTimesteps = -1;
        this.lastTimestepId = "";
        this.dataloadcounter = 0;
        this.actualDisplayedTimestep = -1;
        this.deletedTimesteps = 0;
        this.init = true;
        this.heatmap = true;
        this.timestepBufferSize = 1;
    };
    // Count how many rows are inside of data
    this.countDataSets = function() {
        let countdatasets = 0;
        for (let i = 0; i < this.data.length; i++) {
            countdatasets += this.data[i].length;
        }
        return countdatasets;
    };
    // checks if data has to much data, deletes rows if necessary
    this.reduceDataIfNecessary = function (){
        while (this.countDataSets() >  this.maxalloweddatasets){ // 4000000
            this.data.shift();
            this.deletedTimesteps++;
            this.maxTimesteps--;
            this.actualDisplayedTimestep--;
        }
        if (this.actualDisplayedTimestep < 0){
            this.actualDisplayedTimestep = 0;
        }
    };
    // gets a new Set of Data from the csv loader and processes it
    this.loadData = function(results) {
        // Clean data
        this.reduceDataIfNecessary();
        // Method is called by CSV Processor
        let beforeTimeSteps = this.maxTimesteps;
        for (let i = 0; i < results.length; i++) {
            let elem = results[i];
            // Check if cycle has changed
            if (this.lastTimestepId !== elem[4]) {
                this.lastTimestepId = elem[4];
                this.maxTimesteps++;
                this.dataloadcounter = 0;
                this.data[this.maxTimesteps] = [];
            }
            // Insert new row of data
            if (this.heatmap){
                this.data[this.maxTimesteps][this.dataloadcounter] = {x: elem[1], y: elem[2], z: elem[3], receivedMessage: elem[7], count:elem[0]};
            } else{
                this.data[this.maxTimesteps][this.dataloadcounter] = {x: elem[1], y: elem[2], z: elem[3], receivedMessage: elem[7]};
            }
            this.dataloadcounter++;
        }
		//console.log(this.data);
        this.updateGui();
        // Update MaxStep
        let ctrlElem = document.querySelector('#maxstep');
        ctrlElem.innerHTML = this.deletedTimesteps + this.maxTimesteps + 1;
        // Update Buffersize
        if (this.timestepBufferSize < this.maxTimesteps - beforeTimeSteps){
            this.timestepBufferSize = this.maxTimesteps - beforeTimeSteps;
        }
        // If there is enough Data inside of the buffer, stop CSV loading process
        if (this.actualDisplayedTimestep + (this.timestepBufferSize * 2) < this.maxTimesteps && !csvLoader.isParsingDone) {
            csvLoader.holdParser();
        }
    };
    // Updates GUI
    this.updateGui = function(){
        // initial information setup
        if(this.init) {
            this.init = false;
            let displayedNanobots = this.data[0].length;
            let nanobotCounter = 0;
            for (let i = 0; i < displayedNanobots; i++) {
                nanobotCounter += parseInt(this.data[0][i].count);
            }
            let idcounter = (displayedNanobots*(displayedNanobots+1))/2; // Gaußsche Summenformel
            if (idcounter == nanobotCounter) {
                this.numberOfNanobots = this.data[0].length;
                this.heatmapscale = this.numberOfNanobots;
                document.getElementById("scale").style.display = "none";
                let ctrlElem = document.querySelector('#nanocount');
                ctrlElem.innerHTML =   this.numberOfNanobots;
                this.heatmap = false;
            } else {
                this.numberOfNanobots = nanobotCounter;
                this.setHeatVal(100);
                this.heatmap = true;
                document.getElementById("scale").style.display = "block";
            }
        }
    };
    // refreshes gui
    this.refresh = function(cycle) {
        if (cycle >= 0 && cycle < this.data.length) {
            let localData = this.data[cycle];
			//console.log(localData);
            let positions = [];
            let colors = [];
            // setting Nanobot coordinates
            for (let i = 0; i < localData.length; i++) {
                positions.push(localData[i].x * scaling, localData[i].y * scaling, localData[i].z * scaling); // x, y, z
				if (localData[i].receivedMessage == 0) {
	                let color = viewData.getThreeColor(this.heatmap ? localData[i].count / this.heatmapscale : localData[i].z > 0? 1: 0);
					colors.push(color.r, color.g, color.b);
				} else {
					let color = new THREE.Color("rgb(0, 240, 0)");
					colors.push(color.r, color.g, color.b);
				}
            }
            viewData.insertNewData(positions, colors);
            if (this.actualDisplayedTimestep + (this.timestepBufferSize * 2) > this.maxTimesteps && !csvLoader.isParsingDone) {
                csvLoader.resumeParser();
            }
            // Update Nanocount in Heatmap Mode
            if (this.heatmap){
                let ctrlElem = document.querySelector('#nanocount');
                ctrlElem.innerHTML =  this.numberOfNanobots + " ("+ this.data[cycle].length + ")";
            }
        }
    };
    // Go a step forward (or if true backwards)
    this.nextStep = function(backwards) {
        if (backwards && this.actualDisplayedTimestep > 0) {
            this.setCustomStep(this.actualDisplayedTimestep - 1)
        } else {
            this.setCustomStep(this.actualDisplayedTimestep + 1)
        }
    };
    // set a custom step from the gui (incl deleted steps)
    this.setStep = function (step){
        this.setCustomStep(step - this.deletedTimesteps + 1)
    };
    // Set a new step in the gui
    this.setCustomStep = function (step){
        let newstep = step;
        if (!csvLoader.isParsingDone && newstep > this.data.length){
            newstep = this.actualDisplayedTimestep;
        }
        else if (newstep < 0 || newstep > this.data.length){
            newstep = 0;
        }
        this.actualDisplayedTimestep = newstep;
        this.refresh(this.actualDisplayedTimestep);
        let elem = document.querySelector('#step');
        elem.innerHTML = (this.deletedTimesteps + this.actualDisplayedTimestep);
        viewData.setDatarefresh();
    };
    // Set Animation Speed Value or stop Animation
    this.setSpeedVal = function(val){
        if (val > 0 && val <= this.speedclass.length){
            this.animationOn = true;
            this.speedfactor = this.speedclass[val -1];
        } else if (val === "0"){
            this.animationOn = false;
        } else if (val < 0){
            val = 0;
        } else {
            val = this.speedclass.length;
        }
        return val;
    };
    // scales heatmap slider
    this.setHeatVal = function (val) {
        this.heatmapscale = Math.round(Math.sqrt(this.numberOfNanobots) * val / 100);
        let ctrlElem = document.querySelector('#heatmaptext');
        ctrlElem.innerHTML = Math.round(this.heatmapscale * 0.01) + " "
            + Math.round(this.heatmapscale  * 0.25) + " "
            + Math.round(this.heatmapscale  * 0.5) + " "
            + Math.round(this.heatmapscale  * 0.75) + " "
            + Math.round(this.heatmapscale);
    };
    /*  The animation would be to fast, if we step forward every time, the render animates something. Therefore we only
    animate some steps. This method checks if enough time has passed to render the next step in the simulation */
    this.isTimeForNextStep = function(){
        let res =  this.round % (160 - this.speedfactor) === 0;
        this.round++;
        return res;
    };
    // Animate gui and set next step
    this.updateData = function(datamodel){
        // !! External Method (Don't use this)
        if (viewData.isParticlesSet()) {
            // console.log("nothing to animate - Cycles:" + datamodel.maxTimesteps);
            if (datamodel.maxTimesteps > 1) {
                datamodel.refresh(1);
            }
        } else if (datamodel.animationOn === true) {
            if (datamodel.isTimeForNextStep() && datamodel.maxTimesteps >= 0) {
                datamodel.nextStep(false);
            }
        }
    }
}
// This class processes a CSV File
function CsvLoader(){
    // true if the parser is processing something at the moment
    this.parsingIsRunning = true;
    // true if the parser has finished all his work
    this.isParsingDone = true;
    // Contains parser object from papaparse
    this.parser;
    // Stops parsing for the moment
    this.holdParser = function () {
        this.unlockParser();
        this.parser.pause();
    };
    // removes visual indicator that Parser is running and unlocks resume method
    this.unlockParser = function () {
        this.parsingIsRunning = false;
        let ctrlElem = document.querySelector('#load');
        ctrlElem.innerHTML = "";
    };
    // loads a csv file
    this.loadcsv = function (args, callback, thisObject) {
        Papa.parse(args, {
            download: true,
            delimiter: ",",
            skipEmptyLines: true,
            chunk: function (results, parser) {
                thisObject.parser = parser;
                callback(results.data)
            },
            complete: function()
            {
                thisObject.isParsingDone = true;
                thisObject.unlockParser();
            }
        });
    };
    // check if the parser is busy or ready for work
    this.isParserFree = function () {
        return !this.parsingIsRunning || this.isParsingDone
    };
    // gets file and starts import process
    this.loadCsvFromFile = function (input, callback, csvLoader){
        if (this.isParserFree) {
            this.isParsingDone = false;
            this.loadcsv(input.files[input.files.length - 1], callback, csvLoader)
        }
    };
    // Loads the Vasculature File [Outdated]
    this.processVasculature = function (viewAnimation) {
        Papa.parse('gefaessystem.csv', {
            download: true,
            delimiter: ",",
            header: true,
            skipEmptyLines: true,
            complete: function (results, file) {
                for (let i = 0; i < results.data.length; i++) {
                    let key = results.data[i];
                    viewAnimation.addLine(key.x, key.y, key.z, key.x2, key.y2, key.z2);
                }
            }
        });
    };
    // Resume parsing
    this.resumeParser = function (){
        if (!this.parsingIsRunning && !this.isParsingDone) {
            this.parsingIsRunning = true;
            this.parser.resume();
            let ctrlElem = document.querySelector('#load');
            ctrlElem.innerHTML = "*";
        }
    }
}
