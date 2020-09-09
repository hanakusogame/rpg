import tl = require("@akashic-extension/akashic-timeline");
import { MainScene } from "./MainScene";
import { Weapon } from "./Weapon";
declare function require(x: string): any;

//パラメータークラス
class Pram {
	id: number;
	name: string;
	level: number;
	hpMax: number;
	at: number;
	df: number;
	sp: number;
	exp?: number = 0;
	presentExp?: number = 0;
	score?: number = 0;
}

//パラメーターリスト
let prams: Pram[] = null;

// ユニットクラス
export class Unit extends g.E {
	public hp = 0;
	public attackTime = 10;
	public pram: Pram;
	public weapon: Weapon;
	public init: (n: number, wn: number, d: number, y: number) => void;
	public attack: (unit: Unit) => number; //攻撃する
	public defense: (num: number) => number; //攻撃を受ける
	public getSpeed: () => number; //速度取得
	public addExp: (unit: Unit) => boolean; //経験値を増やす
	public die: (isAnim: boolean) => void; //死亡処理
	public addHp: (num: number) => void; //hp回復
	public base: g.E;
	public direction: number = 1; //左右の向き

	constructor(scene: MainScene, font: g.Font, timeline: tl.Timeline) {
		super({
			scene: scene,
			width: 64,
			height: 64,
			//cssColor: "gray",
			y: 200,
		});

		if (!prams) {
			//csvを読み込んでパラメーター配列作成
			prams = [];
			const text = scene.assets.unit_csv as g.TextAsset;

			// 読み込んだCSVデータが文字列として渡される
			//var result: string[][] = []; // 最終的な二次元配列を入れるための配列
			const tmp = text.data.split("\n"); // 改行を区切り文字として行を要素とした配列を生成

			// 各行ごとにカンマで区切った文字列を要素とした二次元配列を生成
			for (var i = 1; i < tmp.length; ++i) {
				const row = tmp[i].split(",");
				prams.push({
					id: Number(row[0]),
					name: row[1],
					level: Number(row[2]),
					hpMax: Number(row[3]),
					at: Number(row[4]),
					df: Number(row[5]),
					sp: Number(row[6]),
					exp: Number(row[7]),
					presentExp: Number(row[8]),
					score: Number(row[9]),
				});
			}
		}

		const hpBase = new g.FilledRect({
			scene: scene,
			x: 0,
			y: -30,
			width: 64,
			height: 14,
			cssColor: "black",
		});
		this.append(hpBase);

		/* 縁取りフォントを定義する */
		const strokeFont = new g.DynamicFont({
			game: scene.game,
			fontFamily: g.FontFamily.Monospace,
			fontColor: "white",
			strokeColor: "black",
			strokeWidth: 5,
			size: 15,
		});

		/* 縁取りフォントを定義する */
		const strokeFont2 = new g.DynamicFont({
			game: scene.game,
			fontFamily: g.FontFamily.Monospace,
			fontColor: "yellow",
			strokeColor: "black",
			strokeWidth: 5,
			size: 20,
		});

		// HP表示用
		const label = new g.Label({
			scene: scene,
			font: strokeFont,
			fontSize: 15,
			text: "",
			x: 0,
			y: -20,
		});
		hpBase.append(label);

		const barHp = new g.FilledRect({
			scene: scene,
			width: 60,
			height: 10,
			x: 2,
			y: 2,
			cssColor: "black",
		});
		hpBase.append(barHp);

		const barHpSub = new g.FilledRect({
			scene: scene,
			width: 60,
			height: 10,
			x: 2,
			y: 2,
			cssColor: "white",
		});
		hpBase.append(barHpSub);

		//キャラクターと武器の親エンティティ
		const base = new g.E({
			scene: scene,
		});
		this.append(base);
		this.base = base;

		//影
		const sprShadow = new g.Sprite({
			scene: scene,
			src: scene.assets.shadow,
			y: 55,
			opacity: 0.3,
		});
		base.append(sprShadow);

		const sprShadowBig = new g.Sprite({
			scene: scene,
			src: scene.assets.shadow_big,
			y: 110,
			opacity: 0.3,
		});
		base.append(sprShadowBig);

		//キャラ絵表示用
		const spr = new g.FrameSprite({
			scene: scene,
			src: scene.assets.unit as g.ImageAsset,
			width: 80,
			height: 80,
			frames: [...Array(30)].map((v, i) => i),
		});
		base.append(spr);

		//キャラ絵(大)
		const sprBig = new g.FrameSprite({
			scene: scene,
			src: scene.assets.unit_big as g.ImageAsset,
			width: 160,
			height: 160,
			frames: [...Array(4)].map((v, i) => i),
		});
		base.append(sprBig);
		sprBig.hide();

		//レベルアップ表示用
		const labelLevelUp = new g.Label({
			scene: scene,
			font: strokeFont2,
			text: "レベルアップ!",
			fontSize: 20,
			y: -60,
		});
		this.append(labelLevelUp);
		labelLevelUp.hide();

		//死亡エフェクト
		const sprEffect = new g.FrameSprite({
			scene: scene,
			src: scene.assets.effect as g.ImageAsset,
			width: 120,
			height: 120,
			frames: [0, 1, 2],
			interval: 100,
			x: -20,
			y: -20,
		});
		sprEffect.start();
		this.append(sprEffect);

		//表示しているスプライト
		let sprNow = spr;

		//武器
		this.weapon = new Weapon(scene);
		base.append(this.weapon);

		let tween: tl.Tween = null;
		let num = 0;

		//初期化
		this.init = (n: number, wn: number, d: number, y: number) => {
			if (n !== -1) {
				num = n;
				this.pram = Object.create(prams[num]);
			}

			timeline.remove(tween);

			this.hp = this.pram.hpMax;
			label.text = "" + this.hp;
			label.invalidate();

			sprShadow.hide();
			sprShadowBig.hide();

			const bigNum = 30; //キャラ絵の大小の境界
			if (num < bigNum) {
				sprNow = spr;
				sprShadow.show();

				sprShadow.y = 55;
				sprShadow.modified();
			} else {
				sprNow = sprBig;
				sprShadowBig.show();
			}
			this.y = y - sprNow.height;
			this.modified();

			base.resizeTo(sprNow.width, sprNow.height);
			this.resizeTo(sprNow.width, sprNow.height);
			sprNow.frameNumber = num % bigNum;
			sprNow.moveTo(0, 0);
			sprNow.angle = 0;
			sprNow.modified();
			spr.hide();
			sprBig.hide();
			sprNow.show();

			this.direction = d;
			base.scaleX = d;
			base.modified();
			hpBase.show();

			hpBase.y = -40 + scene.random.get(0, 40);
			hpBase.modified();

			barHpSub.width = barHp.width;
			barHpSub.cssColor = "white";
			barHpSub.modified();

			this.weapon.init(wn);

			this.weapon.angle = 0;
			this.weapon.x = sprNow.width - 30;
			this.weapon.y = sprNow.height / 2;
			this.weapon.modified();
			base.append(this.weapon);

			sprEffect.hide();

			if (num === 0) {
				this.touchable = true;
			}
		};

		// 攻撃
		this.attack = (unit) => {
			const pram = this.weapon.pram;
			const num = this.pram.at + scene.random.get(pram.atMin, pram.atMax);
			this.weapon.x = sprNow.width - 30;
			this.weapon.y = sprNow.height / 2;
			this.weapon.modified();
			timeline
				.create(this.weapon)
				.rotateTo(90, 100)
				.call(() => {
					this.weapon.angle = 0;
					this.weapon.modified();
				});
			timeline.create(sprNow).moveBy(20, 0, 100).moveBy(-20, 0, 100);
			return unit.defense(num);
		};

		const showHp: () => void = () => {
			label.text = "" + this.hp;
			label.invalidate();

			const hpRate = this.hp / this.pram.hpMax;
			barHpSub.width = hpRate * barHp.width;

			if (hpRate < 0.2) {
				barHpSub.cssColor = "red";
			} else if (hpRate < 0.4) {
				barHpSub.cssColor = "yellow";
			} else {
				barHpSub.cssColor = "white";
			}
			barHpSub.modified();
		};

		// 防御
		this.defense = (num) => {
			const damage = Math.max(1, num - this.pram.df);
			this.hp = Math.max(0, this.hp - damage);
			showHp();

			return damage;
		};

		// hp回復
		this.addHp = (num) => {
			this.hp = Math.min(this.pram.hpMax, this.hp + num);
			showHp();
		};

		//速度取得
		this.getSpeed = () => {
			return this.pram.sp;
		};

		//経験値を増やす(レベルが上がったらtrueを返す)
		this.addExp = (unit: Unit) => {
			this.pram.exp += unit.pram.presentExp;
			if (this.pram.exp >= Math.pow(this.pram.level, 2)) {
				//レベルアップ
				this.pram.level++;
				this.pram.hpMax += this.pram.level;
				this.hp = Math.min(this.pram.hpMax, this.hp + this.pram.level);
				this.pram.at += scene.random.get(0, 3);
				this.pram.df += scene.random.get(0, 1);
				this.pram.sp += scene.random.get(0, 1);

				labelLevelUp.show();
				showHp();

				scene.setTimeout(() => {
					labelLevelUp.hide();
				}, 1000);
				return true;
			}
			return false;
		};

		//死亡処理
		this.die = (isAnim: boolean) => {
			hpBase.hide();
			this.hp = 0;
			this.weapon.angle = 45;
			this.weapon.x = sprNow.width / 2 - 80;
			this.weapon.y = sprNow.height - 30;
			this.weapon.modified();

			sprShadow.show();
			sprShadowBig.hide();

			sprShadow.y = sprNow.width - 20;
			sprShadow.modified();

			if (isAnim) {
				sprEffect.show();
				scene.setTimeout(() => {
					sprEffect.hide();
				}, 400);

				tween = timeline
					.create(sprNow)
					.rotateBy(-300, 300)
					.con()
					.moveBy(-30, -50, 300)
					.rotateBy(-1000, 1000)
					.con()
					.moveBy(-30, 400, 1000)
					.call(() => {
						sprNow.hide();
					});
			} else {
				sprNow.hide();
			}
		};
	}
}
