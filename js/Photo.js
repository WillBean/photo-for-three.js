/**
 * Created by Will Bean on 2017/5/2.
 */
THREE.Photo = function (opts ) {
    if( !opts.photoURL ){
        return;
    }

    THREE.Mesh.call(this);

    let options = { width:500 , height:500, depth:50, xGrid:10, yGrid:10, frame: 75}
    Object.assign(options, opts);
    
    this.live = !!options.videoURL; // 是否为live图
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
    this._hadHideStarted = false;

    this._photoMeshes = []
    this._photoTexture = null;
    this._photoMaterials = []

    this._videoTexture = null;
    this._videoMesh = null
    this._videoElem = null
    this._videoMaterial = null;

    this.counter = this._frame;
    this._showAnimStep = 1 / this._frame;

    this._playFrame = 20;
    this._playOpaStep = 1 / this._playFrame
    this._playScaleStep = 0.1 / this._playFrame
    this._playCounter = 0

    this._hadPlayed = false; // play已完成
    this._playing = false; // 正在play,包括fadeOut、fadeIn、videoPlay
    this._hadInEnded = false;
    this._hadPlayEnded = false;
    this._hadOutEnded = false;

    this.init();
    
}
THREE.Photo.prototype = new THREE.Mesh();
THREE.Photo.prototype.constructor = THREE.Photo;

THREE.Photo.prototype.init = function () {
    if(this.live){
        this._videoElem = document.createElement('video')
        this._videoElem.src = this._videoURL
        this._videoElem.style.display = 'none'

        this._videoTexture = new THREE.VideoTexture(this._videoElem)
        this._videoTexture.minFilter = THREE.LinearFilter;
        this._videoTexture.magFilter = THREE.LinearFilter;
        this._videoTexture.format = THREE.RGBFormat;

        let material ,geometry;
        geometry = new THREE.PlaneGeometry(this._width, this._height);
        this._videoMaterial = material = new THREE.MeshLambertMaterial({color : 0xffffff, map: this._videoTexture, transparent:true, opacity: 0})
        material.side = THREE.DoubleSide;

        this._videoMesh = new THREE.Mesh(geometry, material)

        this._videoMesh.position.z = -this._sDepth / 2 - 1

        this.add(this._videoMesh);
    }

    this._photoTexture = new THREE.TextureLoader().load( this._photoURL );
    this._photoTexture.minFilter = THREE.LinearFilter

    var i , j ,ux = 1 / this._xGrid, uy = 1/this._yGrid ,geometry, material, mesh;

    for(i = 0; i < this._xGrid; i++){
        for(j = 0; j < this._yGrid; j++){
            geometry = new THREE.BoxGeometry( this._sWidth, this._sHeight, this._sDepth );
            change_uvs(geometry, ux, uy, i ,j);
            
            material = new THREE.MeshLambertMaterial({color : 0xffffff, map: this._photoTexture, transparent:true, opacity: 0})
            material.side = THREE.DoubleSide;

            this._photoMaterials.push(material)
            
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

            this._photoMeshes.push(mesh)

            this.add(mesh)
        }
    }
}
THREE.Photo.prototype.show = function () {
    if( this.counter === 0 ){ // show完成，初始化视频播放数据
        if(!this._hadShowEnded){
            this._initPhoto();
            this._initVideo();
            this._hadShowEnded = true;
        }

        return ;
    }
    this.counter--;

    // show开始时，图片不可见
    this._videoMaterial.opacity = 0;
    // 初始化hide开始
    this._hadHideStarted = false;

    let i, len = this._photoMeshes.length;
    
    for( i = 0; i < len; i++ ){
        this._photoMeshes[i].rotation.x -= 10 * this._photoMeshes[i].dx;
        this._photoMeshes[i].rotation.y -= 10 * this._photoMeshes[i].dy;

        this._photoMeshes[i].position.x -= 200 * this._photoMeshes[i].dx;
        this._photoMeshes[i].position.y -= 200 * this._photoMeshes[i].dy;

        this._photoMaterials[i].opacity += this._showAnimStep;
    }
}
THREE.Photo.prototype.hide = function (){
    if( this.counter === this._frame ){
        return ;
    }
    if (!this._hadHideStarted ){
        // 显示图片
        let i, len = this._photoMaterials.length;
        for( i = 0; i < len; i++ ){
            this._photoMaterials[i].opacity = this._showAnimStep * (this._frame - this.counter);
        }
        this._hadHideStarted = true;
    }
    this._hadShowEnded = false;
    this.counter++;

    // hide开始时，视频不可见
    this._videoMaterial.opacity = 0;

    let i, len = this._photoMeshes.length;

    for( i = 0; i < len; i++ ){
        this._photoMeshes[i].rotation.x += 10 * this._photoMeshes[i].dx;
        this._photoMeshes[i].rotation.y += 10 * this._photoMeshes[i].dy;

        this._photoMeshes[i].position.x += 200 * this._photoMeshes[i].dx;
        this._photoMeshes[i].position.y += 200 * this._photoMeshes[i].dy;

        this._photoMaterials[i].opacity -= this._showAnimStep;
        if( this._photoMaterials[i].opacity < 0) this._photoMaterials[i].opacity = 0;
    }
}
THREE.Photo.prototype.play = function () {
    if(this._videoElem.readyState !== 4) {
        console.log(`视频尚在加载~`,this._videoElem.readyState)
        return;
    }
    if(!this._hadOutEnded){
        this._fadeOut();
    }

    if(this._videoElem.paused && !this._hadPlayed){
        this._hadPlayed = true;
        this._videoElem.play();
        this._videoElem.addEventListener('ended', (ev) => {
            this._hadPlayEnded = true;
        })
    }

    if(this._hadPlayEnded){
        this._fadeIn();
    }
}
THREE.Photo.prototype.pause = function () { // 视图中可见，没有选中时调用
    if (this._playing){
        this._videoElem.pause();
        this._videoElem.currentTime = 0;
        this._fadeIn();
    }
}
THREE.Photo.prototype._fadeOut = function () { //视频播放前，前方的图片渐出
    this._videoMaterial.opacity = 1;

    if( this._playCounter === this._playFrame){ // fadeOut完成
        this._hadOutEnded = true;
        return;
    }
    this._playCounter++;

    let i, len = this._photoMaterials.length, scale = 1 - this._playCounter * this._playScaleStep,
        offset = this._playCounter * this._playScaleStep / 2;

    this._photoTexture.repeat.set( scale, scale );
    this._photoTexture.offset.set( offset, 0 );

    for( i = 0; i < len; i++ ){
        this._photoMaterials[i].opacity -= this._playOpaStep;
        if( this._photoMaterials[i].opacity < 0) this._photoMaterials[i].opacity = 0;
    }
}
THREE.Photo.prototype._fadeIn = function () { //视频播放后，前方的图片渐入
    if( this._playCounter === 0){ // fadeOut完成
        this._hadPlayEnded = false;
        this._playing = false;
        if(!this._hadInEnded) {
            this._videoMaterial.opacity = 0;
        }
        this._hadInEnded = true;

        return;
    }
    this._playCounter--;

    let i, len = this._photoMaterials.length, scale = 1 - this._playCounter * this._playScaleStep,
        offset = this._playCounter * this._playScaleStep / 2;

    this._photoTexture.repeat.set( scale, scale );
    this._photoTexture.offset.set( offset, 0 );

    for( i = 0; i < len; i++ ){
        this._photoMaterials[i].opacity += this._playOpaStep;
    }

}
THREE.Photo.prototype._initPhoto = function () {
    this._photoTexture.repeat.set( 1, 1 );
    this._photoTexture.offset.set( 0, 0 );
    this._playCounter = 0;
    this._hadInEnded = false;
    this._hadOutEnded = false;
}
THREE.Photo.prototype._initVideo = function () {
    this._hadPlayed = false;
    this._hadPlayEnded = false;
    this._playing = false;
    if(this._videoElem.readyState === 4){
        this._videoElem.pause();
        this._videoElem.currentTime = 0;
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