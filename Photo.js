/**
 * Created by Will Bean on 2017/5/2.
 */
THREE.Photo = function (opts ) {
    if( !opts.photoURL ){
        return;
    }
    let options = { width:500 , height:500, depth:50, xGrid:10, yGrid:10, frame: 75}
    Object.assign(options, opts);
    
    this._live = options.videoURL ? true : false;
    this._width = options.width;
    this._height = options.height;
    this._frame = options.frame;
    this._sWidth = this._width/options.xGrid
    this._sHeight = this._height/options.yGrid
    this._sDepth = options.depth || this._sWidth;
    this._xGrid = options.xGrid
    this._yGrid = options.yGrid
    this._photoURL = options.photoURL
    this._videoURL = options.videoURL

    this._hadShowEnded = false;

    this.photoMeshed = []
    this.photoTexture = null;
    this._materials = []

    this.videoTexture = null;
    this.videoMesh = null
    this.videoElem = null
    this._videoMaterial = null;

    this.counter = this._frame;
    this._showAnimStep = 1 / this._frame;

    this._playFrame = 20;
    this._playOpaStep = 1 / this._playFrame
    this._playScaleStep = 0.1 / this._playFrame
    this._playCounter = 0

    this.hadPlayed = false;
    this.hadInEnded = false;
    this.hadPlayEnded = false;
    this.hadOutEnded = false;

    this.init();
    
}
THREE.Photo.prototype = new THREE.Mesh();
THREE.Photo.prototype.constructor = THREE.Photo;

THREE.Photo.prototype.init = function () {
    if(this._live){
        this.videoElem = document.createElement('video')
        this.videoElem.src = this._videoURL
        this.videoElem.style.display = 'none'

        this.videoTexture = new THREE.VideoTexture(this.videoElem)
        this.videoTexture.minFilter = THREE.LinearFilter;
        this.videoTexture.magFilter = THREE.LinearFilter;
        this.videoTexture.format = THREE.RGBFormat;

        let material ,geometry;
        geometry = new THREE.PlaneGeometry(this._width, this._height);
        this._videoMaterial = material = new THREE.MeshLambertMaterial({color : 0xffffff, map: this.videoTexture, transparent:true, opacity: 0})
        material.side = THREE.DoubleSide;
        this.videoMesh = new THREE.Mesh(geometry, material)

        this.videoMesh.position.z = this._sDepth /2 - 1

        this.add(this.videoMesh);
    }

    this.photoTexture = new THREE.TextureLoader().load( this._photoURL );
    this.photoTexture.minFilter = THREE.LinearFilter

    var i , j ,ux = 1 / this._xGrid, uy = 1/this._yGrid ,geometry, material, mesh;

    for(i = 0; i < this._xGrid; i++){
        for(j = 0; j < this._yGrid; j++){
            geometry = new THREE.BoxGeometry( this._sWidth, this._sHeight, this._sDepth );
            change_uvs(geometry, ux, uy, i ,j);
            
            material = new THREE.MeshLambertMaterial({color : 0xffffff, map: this.photoTexture, transparent:true, opacity: 0})
            material.side = THREE.DoubleSide;

            this._materials.push(material)
            
            mesh = new THREE.Mesh(geometry, material)

            mesh.x =   ( i - this._xGrid/2 +.5) * this._sWidth; // 加0.5使其居中
            mesh.y =   ( j - this._yGrid/2 +.5) * this._sHeight;

            mesh.dx = 0.01 * ( 0.5 - Math.random() );
            mesh.dy = 0.01 * ( 0.5 - Math.random() );

            mesh.rotation.x += 10 * this._frame * mesh.dx;
            mesh.rotation.y += 10 * this._frame * mesh.dy;

            mesh.position.x += 200 * this._frame * mesh.dx + mesh.x;
            mesh.position.y += 200 * this._frame * mesh.dy + mesh.y;
            mesh.position.z = 0;

            this.photoMeshed.push(mesh)

            this.add(mesh)
        }
    }
}
THREE.Photo.prototype.show = function () {
    if( this.counter === 0 ){
        return ;
    }
    this.counter--;

    let i, len = this.photoMeshed.length;
    
    for( i = 0; i < len; i++ ){
        this.photoMeshed[i].rotation.x -= 10 * this.photoMeshed[i].dx;
        this.photoMeshed[i].rotation.y -= 10 * this.photoMeshed[i].dy;

        this.photoMeshed[i].position.x -= 200 * this.photoMeshed[i].dx;
        this.photoMeshed[i].position.y -= 200 * this.photoMeshed[i].dy;

        this._materials[i].opacity += this._showAnimStep;
    }
}
THREE.Photo.prototype.hide = function (){
    if( this.counter === this._frame ){ return ;}
    this.counter++;

    let i, len = this.photoMeshed.length;

    for( i = 0; i < len; i++ ){
        this.photoMeshed[i].rotation.x += 10 * this.photoMeshed[i].dx;
        this.photoMeshed[i].rotation.y += 10 * this.photoMeshed[i].dy;

        this.photoMeshed[i].position.x += 200 * this.photoMeshed[i].dx;
        this.photoMeshed[i].position.y += 200 * this.photoMeshed[i].dy;

        this._materials[i].opacity -= this._showAnimStep;
    }
}
THREE.Photo.prototype.play = function () {
    if(!this.hadOutEnded){
        this.fadeOut();
    }

    if(this.videoElem.paused && !this.hadPlayed){
        this.hadPlayed = true;
        this.videoElem.play();
        this.videoElem.addEventListener('ended',  (ev) =>{
            this.hadPlayEnded = true;
        })
    }

    if(this.hadPlayEnded){
        this.fadeIn();
    }
}
THREE.Photo.prototype.fadeOut = function () {
    this._videoMaterial.opacity = 1;

    if( this._playCounter === this._playFrame){
        this.hadOutEnded = true;
        return;
    }
    this._playCounter++;

    let i, len = this._materials.length, scale = 1 - this._playCounter * this._playScaleStep,
        offset = this._playCounter * this._playScaleStep / 2;

    this.photoTexture.repeat.set( scale, scale );
    this.photoTexture.offset.set( offset, 0 );

    for( i = 0; i < len; i++ ){
        this._materials[i].opacity -= this._playOpaStep;
    }
}
THREE.Photo.prototype.fadeIn = function () {
    if( this._playCounter === 0){
        this.hadPlayEnded = false;
        if(!this.hadInEnded) this._videoMaterial.opacity = 0;
        this.hadInEnded = true;

        return;
    }
    this._playCounter--;

    let i, len = this._materials.length, scale = 1 - this._playCounter * this._playScaleStep,
        offset = this._playCounter * this._playScaleStep / 2;

    this.photoTexture.repeat.set( scale, scale );
    this.photoTexture.offset.set( offset, 0 );

    for( i = 0; i < len; i++ ){
        this._materials[i].opacity += this._playOpaStep;
    }

}


function change_uvs( geometry, unitx, unity, offsetx, offsety ) {

    var faceVertexUvs = geometry.faceVertexUvs[ 0 ];

    for ( var i = 0; i < faceVertexUvs.length; i ++ ) {

        var uvs = faceVertexUvs[ i ];

        for ( var j = 0; j < uvs.length; j ++ ) {

            var uv = uvs[ j ];

            uv.x = ( uv.x + offsetx ) * unitx;
            uv.y = ( uv.y + offsety ) * unity;

        }

    }

}