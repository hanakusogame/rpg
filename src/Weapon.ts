//ステータス
type Pram = {
	name: string;
	atMin: number;
	atMax: number;
	dfMin: number;
	dfMax: number;
	sp: number;
};

const prams: Pram[] = [
	{ name: "こんぼう", atMin: 2, atMax: 5, dfMin: 1, dfMax: 1, sp: 5 },
	{ name: "鉄バット", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0 },
	{ name: "どうのつるぎ", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 20 },
	{ name: "包丁", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0 },
	{ name: "鉄バット", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0 },
	{ name: "どうのつるぎ", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 20 },
	{ name: "包丁", atMin: 2, atMax: 5, dfMin: 0, dfMax: 1, sp: 0 },
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
			width: 64,
			height: 64,
			frames: [0, 1, 2, 3, 4, 5, 6],
			y: -32,
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
