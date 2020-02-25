/*
 * @Author: LucasYan
 * @Date: 2020-02-24 17:44:38
 * @LastEditors: LucasYan
 * @LastEditTime: 2020-02-25 19:05:12
 * @Description:
 */

const global_w = window.innerWidth,
  global_h = window.innerHeight;

const min = global_w < global_h ? global_w : global_h;
const max = global_w > global_h ? global_w : global_h;
const scale = min / 750;

class LongImage {
  constructor(options) {
    this.callbacks = {
      loadProgress: []
    };

    this.width = options.width || global_w;
    this.height = options.height || global_h;
    this.container = options.container || document.body;
    this.resources = options.resources || [];
    this.scale = Math.min(this.width, this.height) / 750;
    this.preVal = 0; //存储滑动的距离
    this.phyTouch = null;
    this.isLocked = false; // 锁住位置变化
    this.autoLoad =
      typeof options.autoLoad === "undefined" ? true : options.autoLoad; // 是否自动加载
    this.touchOptions = options.touchOptions || {};
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
      .load(this.loadDone.bind(this));
  }

  loadProgress(loader) {
    this.trigger("loadProgress", loader.progress);
  }

  //   加载资源结束之后开始执行方法
  loadDone() {
    const that = this;
    //   创建场景
    this.initFirstScene();

    // 设置可滚动的长度
    this.originWidth = this.app.stage.width;
    this.scrollWidth = this.app.stage.width * scale - max;
    // this.scrollWidth = 3000;
    that.app.stage.interactive = true;

    this.app.stage.scale.set(this.scale, this.scale);

    if (this.width < this.height) {
      // 根据横屏竖屏效果旋转舞台
      this.app.stage.rotation = Math.PI / 2;
      this.app.stage.x = this.width;
      this.initTouch(true, "y", 0);
    } else {
      this.initTouch(false, "x", 0);
    }

    // 画布渲染
    this.setup();
  }

  setup() {
    const that = this;
    that.app.ticker.add(delta => {
      that.app.renderer.render(that.app.stage);
    });
  }

  //   初始化第一个场景
  initFirstScene() {
    const that = this;
    
    // 第一个场景container
    that.firstScene = new PIXI.Container();
    
    /****** 加载第一个场景左边的部分 ******/

    const sceneResource_left = ["new-1-1", "new-1-2", "new-1-3"];
    const resourceSize_left = [
      { x: 0, y: 0 }, //天空
      { x: 290, y: 300 }, //房子
      { x: -200, y: 0 } //树
    ];

    that.leftScene = new PIXI.Container();

    // 加载场景背景
    sceneResource_left.forEach((item, index) => {
      if (index === 0) {
        // 加载天空动画
        const skys = that.spritesAnimations("new-1-sky", 11);
        skys.animationSpeed = -0.15;
        // skys.scale.set(0.5, 0.5);
        skys.position.set(0, 0);
        skys.play();
        that.leftScene.addChild(skys);
      } else {
        // 加载树和屋子
        const bg = new PIXI.Sprite(that.app.loader.resources[item].texture);
        bg.x = resourceSize_left[index].x;
        bg.y = resourceSize_left[index].y;
        // bg.scale.set(0.5, 0.5);
        that.leftScene.addChild(bg);
      }
    });

    // 加载乌鸦
    const crows = that.spritesAnimations("new-1-bird", 21);
    crows.animationSpeed = -0.15;
    // crows.scale.set(0.5);
    crows.position.set(130, 200);
    crows.play();
    that.leftScene.addChild(crows);

    /****** 加载第一个场景右边 ******/
    that.rightScene = new PIXI.Container();
    that.rightScene.x = that.leftScene.width - 300
    that.rightScene.width = 1400
    const sceneResource_right = ['new-2-1', 'new-2-2', 'new-2-3']
    const resourceSize_rigth = [
      {x: 0, y: 0},
      {x: 500, y: 500},
      {x: 0, y: 0},
    ]
    sceneResource_right.forEach((item, index) => {
      const bg = new PIXI.Sprite(that.app.loader.resources[item].texture);
        bg.x = resourceSize_rigth[index].x;
        bg.y = resourceSize_rigth[index].y;
        that.rightScene.addChild(bg);
    })
    



    /****** 加载第一个场景中间的树 ******/

    that.middleScene = new PIXI.Container();
    const bg = new PIXI.Sprite(that.app.loader.resources['tree'].texture);

    
    // 加载树

    const tree = new PIXI.Sprite(that.app.loader.resources['tree'].texture);
    tree.position.set(that.leftScene.width - 450, 0)
    that.middleScene.addChild(tree)
    
    that.firstScene.addChild(this.leftScene)
    that.firstScene.addChild(this.rightScene)
    that.firstScene.addChild(this.middleScene)

    that.app.stage.addChild(this.firstScene);
  }

  // 加载精灵图
  spritesAnimations(prefix, count) {
    const that = this,
      textureArray = [];
    for (let i = 1; i <= count; i++) {
      textureArray.unshift(that.app.loader.resources[`${prefix}-${i}`].texture);
    }
    const animatedSprite = new PIXI.AnimatedSprite(textureArray);
    return animatedSprite;
  }

  initTouch(verticalBoolen, ver, value = 0) {
    let vertical = verticalBoolen, //默认是true代表监听竖直方向touch
      storeVal = ver,
      that = this;
    this.phyTouch = new PhyTouch(
      Object.assign({ touch: "body" }, that.touchOptions, {
        // touch: "#app", //反馈触摸的dom
        vertical: verticalBoolen, //默认是true代表监听竖直方向touch
        min: -that.scrollWidth, //不必需,运动属性的最小值
        max: 0, //不必需,滚动属性的最大值
        maxSpeed: 1, //摸反馈的最大速度限制
        value,
        bindSelf: true,
        change(value) {
          if (!value && value !== 0) {
            _this.phyTouch.destroy();
            _this.phyTouch = _this.initTouch(ver, storeVal, _this.preVal);
          } else {
            if (!that.isLocked) {
              // 锁定方向才改变stage位置
              //连接pixi
              let stageScrollX; //stage位置变化
              if (value < -that.scrollWidth / 2) {
                stageScrollX =
                  value < -that.scrollWidth ? -that.scrollWidth : value;
              } else {
                stageScrollX = value > 0 ? 0 : value;
              }
              that.app.stage.position[ver] = stageScrollX;
              console.log("after value: ", stageScrollX);
            }
          }
        }
      })
    );
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
  resources: resources,
  touchOptions: {
    initialValue: 0,
    sensitivity: 0.8,
    maxSpeed: 0.6
  }
});

longImage.on("loadProgress", progress => {
  console.log(progress);
});
