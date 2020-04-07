$(document).ready(function () {
    // scaling of gui size
    const scaling = 10;
    // Animation Object
    let viewAnimation = new ViewAnimation(scaling);
    let viewVasculature = new ViewVasculature(viewAnimation);
    viewVasculature.setScale(scaling);
    let viewData = new ViewData();
    // CSV Management Object
    let csvLoader = new CsvLoader();
    // Datamodel
    let datamodel = new Datamodel(csvLoader, scaling, viewData);

    // Init function
    function init() {
        // set custom update function in refresh
        viewAnimation.updateData = function(){datamodel.updateData(datamodel);};
        // Load Vasculature
        setUpVasculature();
        // Preload default file
        preloadFileIfAvailable();
        // Set Up GUI Elements
        setUpSlider();
        setUpJqueryClicks(datamodel);
        // Add Points
        viewAnimation.getScene().add(viewData.particles);
        //  Change File
        setUpFileUpload();
        // Resize Window support
        window.addEventListener('resize',function(){viewAnimation.onWindowResize()}, false);
        // Key Listener
        window.addEventListener("keydown", function(event) { keylistener()});
    } // End Init

    // Set change listener on file upload and set logic to start automatically start upload
    function setUpFileUpload(){
        const uploadButton = document.querySelector('#upload');
        const fileInfo = document.querySelector('.file-info');
        const realInput = document.getElementById('datainput');
        uploadButton.addEventListener('click', (e) => {
            realInput.click();
        });
        realInput.addEventListener('change', () => {
            const name = realInput.value.split(/\\|\//).pop();
            fileInfo.innerHTML = name.length > 20 ? name.substr(name.length - 20) : name;
            if(csvLoader.isParserFree()){
                datamodel.clear();
                csvLoader.loadCsvFromFile(document.getElementById('datainput'),function (results){datamodel.loadData(results)}, csvLoader);
            }
        });
    }

    // load vasculature into the visualizer
    function setUpVasculature(){
        //csvLoader.processVasculature(viewAnimation);
        let vasculature = JSON.parse(vasculature_json);
        for (let i = 0; i < vasculature.length; i++) {
            let key = vasculature[i];
            viewVasculature.addLine(key.x, key.y, key.z, key.x2, key.y2, key.z2);
        }
        viewVasculature.initVasculature();
    }

    // Check for a Data File and load it if it is there and not local
    function preloadFileIfAvailable(){
        if (!window.location.href.startsWith("file://")) {
            $.ajax({
                url: "csv/csvNano.csv",
                type: 'HEAD',
                async: true,
                error: function () {
                    console.log('The file does not exist');
                },
                success: function () {
                    csvLoader.isParsingDone = false;
                    csvLoader.loadcsv('csv/csvNano.csv', function (results) {
                        datamodel.loadData(results)
                    }, csvLoader);
                    document.querySelector('.file-info').innerHTML = "<a href=\"csv/csvNano.csv\">csvNano.csv</a>";
                }
            });
        }
    }

    // Set up all slider default values and event listener for sliders
    function setUpSlider(){
        let slider = document.getElementById("speedslider");
        slider.oninput = function() {
            datamodel.setSpeedVal(this.value);
        };
        slider.value = 4;
        // Set Up Heat Slider
        let heatslider = document.getElementById("heatslider");
        heatslider.oninput = function() {
            datamodel.setHeatVal(this.value);
        };
        heatslider.value = 100;
        // Set Up View Slider
        let viewslider = document.getElementById("viewslider");
        viewslider.oninput = function() {
            viewVasculature.setVisibility(this.value);
        };
        viewslider.value = 4;
    }

    // Set up Next, previous, Custom Step and help button
    function setUpJqueryClicks(datamodel){
        // Buttons
        $("#next").click(function () {
            datamodel.nextStep(false);
        });
        $("#back").click(function () {
            datamodel.nextStep(true);
        });
        $("#openhelp").click(function () {
            $("#help").toggle();
        });
        $("#cstep").keyup(function(){
            datamodel.setStep($(this).val() - 1);
        });
    }

    // All Key Listener for Key Control
    function keylistener() {
        // speed up | speed down | next step | step back
        if (event.keyCode === 38) {
            let slider = document.getElementById("speedslider");
            slider.value = datamodel.setSpeedVal(parseInt(slider.value) + 1);
        } else if (event.keyCode === 40) {
            let slider = document.getElementById("speedslider");
            slider.value = datamodel.setSpeedVal(parseInt(slider.value) - 1);
        } else if (event.keyCode === 39) {
            $("#openhelp").focus(); // fix for focus on slider would move with <- & ->
            datamodel.nextStep(false);
        } else if (event.keyCode === 37) {
            $("#openhelp").focus(); // fix for focus on slider would move with <- & ->
            datamodel.nextStep(true);
        }
    }

    // Start of JS
    init();
    viewAnimation.animate(viewAnimation);
})
;