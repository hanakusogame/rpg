//ステータス
type Pram = {
	name: string;
	atMin: number;
	atMax: number;
	dfMin: number;
	dfMax: number;
	sp: number;
	price: number;
};

const prams: Pram[] = [
	{ name: "こんぼう", atMin: 2, atMax: 5, dfMin: 1, dfMax: 1, sp: 5, price: 100 },
	{ name: "鉄バット", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0, price: 200 },
	{ name: "どうのつるぎ", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 20, price: 400 },
	{ name: "包丁", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0, price: 500 },
	{ name: "鉄バット", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0, price: 700 },
	{ name: "どうのつるぎ", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 20, price: 1000 },
	{ name: "包丁", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0, price: 2000 },
];

// 武器クラス
export class Weapon extends g.E {
	public init: (num: number) => void;
	public pram: Pram;
	public num: number;

	constructor(scene: g.Scene) {
		super({
			scene: scene,
			width: 30,
			height: 60,
			x: 50,
			y: 0,
		});

		//画像表示用
		const spr = new g.FrameSprite({
			scene: scene,
			src: scene.assets.weapon as g.ImageAsset,
			width: 100,
			height: 100,
			frames: [0, 1, 2, 3, 4, 5, 6],
			y: -80,
		});
		this.append(spr);

		this.init = (num) => {
			this.num = num;
			this.pram = prams[num];
			spr.frameNumber = num;
			spr.modified();
		};
	}
}
