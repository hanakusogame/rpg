import { MainScene } from "./MainScene";
import { Weapon } from "./Weapon";
declare function require(x: string): any;

//パラメーター
class Pram {
	name: string;
	level: number;
	hpMax: number;
	at: number;
	df: number;
	sp: number;
	exp?: number = 0;
	presentExp?: number = 0;
}

const prams: Pram[] = [
	{ name: "プレイヤー", level: 1, hpMax: 100, at: 5, df: 1, sp: 5, exp: 0 },
	{ name: "スライム", level: 1, hpMax: 10, at: 2, df: 0, sp: 0, presentExp: 2 },
	{ name: "ゴブリン", level: 1, hpMax: 30, at: 2, df: 0, sp: 0, presentExp: 2 },
	{ name: "コボルド", level: 1, hpMax: 30, at: 2, df: 0, sp: 0, presentExp: 2 },
	{ name: "オーク", level: 1, hpMax: 30, at: 2, df: 0, sp: 0, presentExp: 2 },
	{ name: "イエローデビル", level: 1, hpMax: 10, at: 2, df: 0, sp: 0, presentExp: 2 },
	{ name: "ミミック", level: 1, hpMax: 30, at: 2, df: 0, sp: 0, presentExp: 2 },
	{ name: "死神", level: 1, hpMax: 30, at: 2, df: 0, sp: 0, presentExp: 2 },
];

// ユニットクラス
export class Unit extends g.E {
	public hp = 0;
	public attackTime = 10;
	public pram: Pram;
	public weapon: Weapon;
	public init: (x: number, s: number) => void;
	public attack: (unit: Unit) => number; //攻撃する
	public defense: (num: number) => number; //攻撃を受ける
	public getSpeed: () => number; //速度取得
	public addExp: (unit: Unit) => boolean; //経験値を増やす
	public die: () => void; //死亡処理
	public addHp: (num: number) => void; //hp回復

	constructor(scene: MainScene, font: g.Font, timeline: any) {
		super({
			scene: scene,
			width: 64,
			height: 64,
			//cssColor: "gray",
			y: 200,
		});

		const hpBase = new g.E({
			scene: scene,
			x: 0,
			y: -30,
		});
		this.append(hpBase);

		// HP表示用
		const label = new g.Label({
			scene: scene,
			font: font,
			fontSize: 15,
			textColor: "white",
			text: "",
			x: 0,
			y: 0,
		});
		hpBase.append(label);

		const barHp = new g.FilledRect({
			scene: scene,
			width: 60,
			height: 10,
			y: 20,
			cssColor: "black",
		});
		hpBase.append(barHp);

		const barHpSub = new g.FilledRect({
			scene: scene,
			width: 60,
			height: 10,
			y: 20,
			cssColor: "white",
		});
		hpBase.append(barHpSub);

		const base = new g.E({
			scene: scene,
			width: 64,
			height: 64,
		});
		this.append(base);

		//キャラ絵表示用
		const spr = new g.FrameSprite({
			scene: scene,
			src: scene.assets.unit as g.ImageAsset,
			width: 64,
			height: 64,
			frames: [0, 1, 2, 3, 4],
		});
		base.append(spr);

		//キャラ絵(大)
		const sprBig = new g.FrameSprite({
			scene: scene,
			src: scene.assets.unit_big as g.ImageAsset,
			width: 128,
			height: 128,
			frames: [0, 1, 2, 3],
		});
		base.append(sprBig);
		sprBig.hide();

		//表示しているスプライト
		let sprNow = spr;

		//武器
		this.weapon = new Weapon(scene);
		base.append(this.weapon);

		let tween: any = null;

		//初期化
		this.init = (num: number, s: number) => {
			this.pram = Object.create(prams[num]);

			timeline.remove(tween);

			this.hp = this.pram.hpMax;
			label.text = "" + this.hp;
			label.invalidate();

			this.weapon.init(scene.random.get(0, 6));

			const bigNum = 4; //キャラ絵の大小の境界
			if (num < bigNum) {
				sprNow = spr;
				this.y = 200;
			} else {
				sprNow = sprBig;
				this.y = 200 - 64;
			}
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

			base.scaleX = s;
			base.modified();
			hpBase.show();

			hpBase.y = -40 + scene.random.get(0, 20);
			hpBase.modified();

			barHpSub.width = barHp.width;
			barHpSub.modified();

			this.weapon.angle = 45;
			this.weapon.x = sprNow.width - 50;
			this.weapon.y = sprNow.height / 2;
			this.weapon.modified();

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
			timeline.create(spr).moveBy(20, 0, 100).moveBy(-20, 0, 100);
			return unit.defense(num);
		};

		const showHp: () => void = () => {
			label.text = "" + this.hp;
			label.invalidate();

			barHpSub.width = (this.hp / this.pram.hpMax) * barHp.width;
			barHpSub.modified();
		};

		// 防御
		this.defense = (num) => {
			const damage = Math.max(1, num - this.pram.df);
			this.hp -= damage;
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
				this.pram.at += scene.random.get(1, this.pram.level);
				this.pram.df += scene.random.get(0, this.pram.level - 1);
				this.pram.sp += scene.random.get(0, 1);
				return true;
			}
			return false;
		};

		//死亡処理
		this.die = () => {
			hpBase.hide();
			this.weapon.angle = 45;
			this.weapon.x = sprNow.width - 64;
			this.weapon.y = sprNow.height - 30;
			this.weapon.modified();
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
		};
	}
}