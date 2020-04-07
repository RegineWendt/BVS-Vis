// Object, that contains all functions for the three.js animations
function ViewAnimation(scaling){
    // if WebGL isn't supported, write error message
    if (WEBGL.isWebGLAvailable() === false) {
        document.body.appendChild(WEBGL.getWebGLErrorMessage());
    }
    // Set up Three.js
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xaaaaaa);
    this.renderer = new THREE.WebGLRenderer({antialias: true});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio( window.devicePixelRatio );
    let body = document.querySelector('#anim');
    body.appendChild(this.renderer.domElement);
    // Positioning of the camera
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 100000 * scaling);
    this.camera.position.set(50 , 0, 180 * scaling);
    this.camera.lookAt(0, 0, 0);
    // add Mouse controls
    this.controls = new THREE.TrackballControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, -38 * scaling, 0);
    this.controls.update();
    // Update on Window Resize
    this.onWindowResize = function () {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    // placeholder function for custom Update Function that has to be called on every update
    this.updateData = function () {
        console.log("Overwrite with custom Update Function here!")
    };
    // Render Function that renders the view
    this.render = function () {
        this.updateData();
        this.renderer.render(this.scene, this.camera);
    };
    // Animation that triggers the renderer
    this.animate = function (viewAnimation) {
        requestAnimationFrame(function () {viewAnimation.animate(viewAnimation)});
        this.controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
        this.render();
    };
    // Getter Function to add something to the view
    this.getScene= function (){
        return this.scene;
    };
}
// Class to process lines
function ViewVasculature(viewAnimation){
    this.line;
    this.scale = 1;
    this.vertices = [];
    this.setScale = function(scale){
        this.scale = scale;
    };
    // Adds a line into the view (used to build a vasculature)
    this.addLine = function(x, y, z, x2, y2, z2) {
        this.vertices.push( x* this.scale,  y* this.scale, z* this.scale);
        this.vertices.push(x2* this.scale,  y2* this.scale, z2* this.scale);

    };
    // Build the vasculature
    this.initVasculature = function () {
        let geometry = new THREE.BufferGeometry();
        geometry.addAttribute( 'position', new THREE.Float32BufferAttribute( this.vertices, 3 ) );
        geometry.computeBoundingSphere();
        let material = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 1});
        this.line = new THREE.LineSegments(geometry, material);
        viewAnimation.getScene().add(this.line);
    };
    // Sets the visibility
    this.setVisibility = function (visibility){
        if (visibility === "0"){
            this.line.material = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0});
        } else if (visibility === "4"){
            this.line.material = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 1});
        } else if (visibility === "3"){
            this.line.material = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.75});
        } else if (visibility === "2"){
            this.line.material = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.5});
        } else if (visibility === "1"){
            this.line.material = new THREE.LineBasicMaterial({color: 0xffffff, transparent: true, opacity: 0.25});
        } else {
            this.line.material = new THREE.LineBasicMaterial({color: 0x0000ff, transparent: true, opacity: 1});
        }
    }
}
// Properties of the data visualisation
function ViewData(){
    this.geometry = new THREE.BufferGeometry();
    // describes material
    this.shader = new THREE.ShaderMaterial({
        vertexShader: document.getElementById('vertexshader').textContent,
        fragmentShader: document.getElementById('fragmentshader').textContent
    });
    this.particles = new THREE.Points(this.geometry, this.shader);
    // check if initial dataset is already processed
    this.isParticlesSet = function(){
        return typeof this.particles.geometry.attributes.position === 'undefined';
    };
    // set refresh flag
    this.setDatarefresh = function(){
        this.particles.geometry.attributes.position.needsUpdate = true;
        this.particles.geometry.attributes.vertColor.needsUpdate = true;
    };
    // insert a new dataset to display
    this.insertNewData = function(positions,colors){
        this.geometry.removeAttribute('position');
        this.geometry.removeAttribute('vertColor');
        this.geometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        this.geometry.addAttribute('vertColor', new THREE.Float32BufferAttribute(colors, 3));
        this.geometry.computeBoundingSphere();
        this.geometry.frustumCulled = false;
    };
    // get a three.js color from percentage
    this.getThreeColor = function(col){
        let hsl = this.heatmapColorForfValue(col);
        let color = new THREE.Color();
        color.setHSL(hsl[0], hsl[1], hsl[2]);
        return color;
    };
    // gets percentage and returns hsl color value
    // return "hsl(" + h + ", 100%, 50%)";
    this.heatmapColorForfValue = function(value){
        return [(value > 1) ? 1 : (1.0 - value) * 240 / 360, 1, 0.5];
    };
}