/*
 * @Author: LucasYan
 * @Date: 2020-02-24 17:44:38
 * @LastEditors: LucasYan
 * @LastEditTime: 2020-02-24 18:29:58
 * @Description:
 */

const global_w = window.innerWidth,
  global_h = window.innerHeight;

class LongImage {
  constructor(options) {
    this.callbacks = {
      loadProgress: []
    };

    this.width = options.width || global_w;
    this.height = options.height || global_h;
    this.container = options.container || document.body;
    this.resources = options.resources || [];
    this.autoLoad =
      typeof options.autoLoad === "undefined" ? true : options.autoLoad; // 是否自动加载

    this.app = new PIXI.Application({
      resolution: 1, //resolution让Pixi在不同的分辨率和像素密度的平台上运行变得简单
      transparent: true,
      antialias: true, //antialias使得字体的边界和几何图形更加圆滑
      width: this.width,
      height: this.height,
      backgroundColor: 0xc8cece
    });

    this.container.appendChild(this.app.view);

    if (this.autoLoad) this.load();
  }

  load() {
    const that = this;
    that.app.loader
      .add(this.resources)
      .on("progress", this.loadProgress.bind(this))
      .load(this.loadDone.bind(this))
  }

  loadProgress(loader) {
    this.trigger("loadProgress", loader.progress);
  }

//   加载资源结束之后开始执行方法
  loadDone() {
      const that = this
    //   创建场景
    this.initFirstScene()
  }


//   初始化第一个场景
  initFirstScene() {
    const that = this
    const sceneResource = ['new-1-1', 'new-1-2', 'new-1-3']
    that.firstScene = new PIXI.Container()
    sceneResource.forEach(item => {
        const bg = new PIXI.Sprite(that.app.loader.resources[item].texture)
        bg.x = 0
        that.firstScene.addChild(bg)
    })
    that.app.stage.addChild(this.firstScene);
    that.app.stage.interactive = true;
  }


  // 事件处理
  on(name, callback) {
    this.callbacks[name] = this.callbacks[name] || [];
    this.callbacks[name].push(callback);
  }

  off(name, callback) {
    const callbacks = this.callbacks[name];
    if (callbacks && callbacks instanceof Array) {
      const idx = callbacks.indexOf(callback);
      if (idx !== -1) callbacks.splice(idx, 1);
    }
  }

  // 触发事件
  trigger(name, params) {
    const callbacks = this.callbacks[name];
    if (callbacks && callbacks instanceof Array) {
      callbacks.forEach(cb => {
        cb(params);
      });
    }
  }
}

const longImage = new LongImage({
  container: document.getElementById("app"),
  resources: resources
});

longImage.on('loadProgress', progress => {
    console.log(progress)
})
